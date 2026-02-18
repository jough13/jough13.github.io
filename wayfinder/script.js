// --- ACTIVE ENEMIES ---
let activeEnemies = []; 

// Simple helper to remove an enemy after combat
function removeEnemyAt(x, y) {
    activeEnemies = activeEnemies.filter(e => e.x !== x || e.y !== y);
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

 // --- Global State Variables - Declare globally, instantiate in initializeGame ---

 let playerFactionStanding = {
    "CONCORD": 0,
    "KTHARR": 0,
    "INDEPENDENT": 0,
    "VOID_VULTURES": 0,
    "XYCORP": 0
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

    keys.forEach(key => {
        const delta = worldStateDeltas[key];

        // SAFETY CHECK: Never delete critical story/lore flags
        // If the tile is the Nexus (activated) or a unique anomaly (studied), keep it forever.
        if (delta.activated || delta.studied || delta.isUnique) {
            return; 
        }

        // TIME CHECK: If enough time has passed...
        if (delta.lastInteraction && (currentGameDate - delta.lastInteraction > RESOURCE_RESPAWN_TIME)) {
            
            // Delete the delta. 
            // The next time chunkManager generates this tile, it will use the seed 
            // (which means the asteroid/star comes back full).
            delete worldStateDeltas[key];
            cleanedCount++;
            
            // OPTIONAL: If we really wanted to, we could force the chunk to reload here,
            // but since this happens for "old" tiles, they are likely off-screen anyway.
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

 let currentShipyardContext = null; // Add this with your other global state variables

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

 function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    // Create Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message; // Allow HTML for bold text

    container.appendChild(toast);

    // Trigger Animation (Next Frame)
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for fade-out transition to finish before removing from DOM
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

function logMessage(newMessage, isImportant = false) {
    if (!newMessage || newMessage.trim() === "") { render(); return; }
    
    // SAFETY CHECK: If game hasn't started (Title Screen), use "0.00"
    let dateStr = "0.00";
    if (typeof currentGameDate !== 'undefined' && currentGameDate !== null) {
        dateStr = currentGameDate.toFixed(2);
    }

    const timestamp = `<span class="log-datestamp">[SD ${dateStr}]</span>`;
    messageLog.unshift(`${timestamp}${newMessage}`);
    
    if (messageLog.length > MAX_LOG_MESSAGES) messageLog.pop();
    
    // Only try to render if the function exists (prevents rare startup crashes)
    if (typeof render === 'function') {
        render();
    }
}

 function renderContextualActions(actions) {
     const container = document.getElementById('contextual-actions');
     container.innerHTML = ''; // Clear old buttons
     if (!actions) return;

     actions.forEach(action => {
         const button = document.createElement('button');
         button.textContent = `${action.label} (${action.key.toUpperCase()})`;
         button.className = 'control-button';
         button.onclick = action.onclick;
         container.appendChild(button);
     });
 }

 function spawnPirateNearPlayer() {
    // 1. Determine Spawn Location (randomly 5-10 tiles away)
    const angle = Math.random() * Math.PI * 2;
    const dist = 5 + Math.floor(Math.random() * 5);
    const eX = Math.floor(playerX + Math.cos(angle) * dist);
    const eY = Math.floor(playerY + Math.sin(angle) * dist);

    // 2. Determine Faction & Ship Type
    const faction = getFactionAtSector(currentSectorX, currentSectorY);
    let potentialShips = [];
    let enemyType = 'PIRATE'; // Default display type
    let warningMsg = "";

    // -- FACTION LOGIC --
    if (faction === "KTHARR") {
        // K'tharr are territorial. Only attack if standing is Hostile (< -20)
        if (playerFactionStanding["KTHARR"] < -20) { 
            enemyType = "KTHARR_PATROL";
            // Filter PIRATE_SHIP_CLASSES for keys starting with KTHARR
            potentialShips = Object.keys(PIRATE_SHIP_CLASSES).filter(k => k.startsWith('KTHARR'));
            warningMsg = "ALERT: K'tharr Hegemony Patrol intercepting! (Hostile Standing)";
        } else {
            // If neutral or friendly, they ignore you.
            logMessage(`<span style='color:#FFFF00'>Sensors: K'tharr patrol detects you but holds fire. (Standing: ${playerFactionStanding["KTHARR"]})</span>`);
            return; 
        }
    } else if (faction === "CONCORD") {
        // Concord only attacks if you are a criminal (Standing < -50)
        if (playerFactionStanding["CONCORD"] < -50) {
            enemyType = "CONCORD_SECURITY";
            potentialShips = Object.keys(PIRATE_SHIP_CLASSES).filter(k => k.startsWith('CONCORD'));
            warningMsg = "ALERT: Concord Security attempting arrest!";
        } else {
             // Concord ignores law-abiding citizens
             return;
        }
    }

    // -- FALLBACK / PIRATE LOGIC --
    // If no specific faction spawned (or you are friendly with them), spawn a standard Pirate
    // This runs if faction was VOID_VULTURES, INDEPENDENT, or if the code above didn't trigger
    if (potentialShips.length === 0) {
        // If we fell through to here, it means we are in Pirate space, Independent space,
        // or we just want a random pirate encounter.
        enemyType = "PIRATE";
        // Filter for standard pirates (RAIDER, STRIKER, BRUISER)
        potentialShips = ["RAIDER", "STRIKER", "BRUISER"];
        warningMsg = "WARNING: Pirate vessel detected on sensors!";
    }

    // 3. Select Specific Ship Class
    const shipKey = potentialShips[Math.floor(Math.random() * potentialShips.length)];

    activeEnemies.push({
        x: eX,
        y: eY,
        id: Date.now(),
        type: enemyType,
        shipClassKey: shipKey // <--- New property to tell Combat what to spawn
    });
    
    logMessage(`<span style='color:#FF5555'>${warningMsg}</span>`);
}

function updateEnemies() {
    // Loop backwards so we can remove enemies safely if combat starts
    for (let i = activeEnemies.length - 1; i >= 0; i--) {
        const enemy = activeEnemies[i];

        // 0. RANDOM "HESITATION" MECHANIC (Allows Outrunning)
        // 30% chance the pirate's engines stall or they stop to scan, 
        // effectively making them slower than the player (0.7 speed vs 1.0 speed).
        // This allows you to open the distance if you just keep running.
        if (Math.random() < 0.30) {
            continue; // Skip this enemy's turn
        }

        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;

        // 1. Determine Move Preference (Try the longer distance first)
        const moves = [];
        
        if (Math.abs(dx) >= Math.abs(dy)) {
            // Prefer moving Horizontally first, then Vertically
            if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
            if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
        } else {
            // Prefer moving Vertically first, then Horizontally
            if (dy !== 0) moves.push({ x: 0, y: Math.sign(dy) });
            if (dx !== 0) moves.push({ x: Math.sign(dx), y: 0 });
        }

        // 2. Try the moves in order
        let moved = false;
        for (const move of moves) {
            const targetX = enemy.x + move.x;
            const targetY = enemy.y + move.y;

            const targetTile = chunkManager.getTile(targetX, targetY);
            const tileChar = getTileChar(targetTile);

            // Is this the player?
            const isPlayer = (targetX === playerX && targetY === playerY);
            
            // Is it a valid space to fly through?
            // (Enemies can fly through Empty Space or Nebulas)
            const isNavigable = (tileChar === EMPTY_SPACE_CHAR_VAL || tileChar === NEBULA_CHAR_VAL);

            // 3. EXECUTE MOVE
            if (isPlayer || isNavigable) {
                enemy.x = targetX;
                enemy.y = targetY;
                moved = true;
                break; // We found a valid move, stop checking alternatives
            }
        }

        // 4. CHECK COMBAT TRIGGER
        // If the enemy successfully moved onto the player's tile, trigger combat!
        if (enemy.x === playerX && enemy.y === playerY) {
            // Log a warning for flavor
            logMessage(`<span style='color:#FF5555'>ALERT: Pirate vessel engaging!</span>`);
            
            // Remove the enemy active map instance
            activeEnemies.splice(i, 1);
            
            // Switch to Combat View
            startCombat();
        }
    }
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


function applyPlayerShipStats() {
    const shipClassData = SHIP_CLASSES[playerShip.shipClass];
    
    // 1. Get Base Stats
    let calculatedMaxHull = shipClassData.baseHull;
    let calculatedMaxCargo = shipClassData.cargoCapacity;

    // 2. Check Utility Slot
    const utilityId = playerShip.components.utility || "UTIL_NONE";
    const utility = COMPONENTS_DATABASE[utilityId];

    if (utility && utility.stats) {
        if (utility.stats.hullBonus) calculatedMaxHull += utility.stats.hullBonus;
        if (utility.stats.cargoBonus) calculatedMaxCargo += utility.stats.cargoBonus;
    }

    // 3. Apply to Globals
    MAX_PLAYER_HULL = calculatedMaxHull;
    PLAYER_CARGO_CAPACITY = calculatedMaxCargo;

     const weapon = COMPONENTS_DATABASE[playerShip.components.weapon];
     const shield = COMPONENTS_DATABASE[playerShip.components.shield];
     const engine = COMPONENTS_DATABASE[playerShip.components.engine];

     PLAYER_ATTACK_DAMAGE = weapon.stats.damage;
     PLAYER_HIT_CHANCE = weapon.stats.hitChance;
     MAX_SHIELDS = shield.stats.maxShields;
     MAX_FUEL = engine.stats.maxFuel;

     if (playerHull > MAX_PLAYER_HULL) playerHull = MAX_PLAYER_HULL;
     if (playerShields > MAX_SHIELDS) playerShields = MAX_SHIELDS;
     if (playerFuel > MAX_FUEL) playerFuel = MAX_FUEL;
 }

 /**
  * A helper function to render just the shared UI stats.
  */

 function renderUIStats() {

    // 0. Update the System Menu Stats
    document.getElementById('menuLevel').textContent = playerLevel;
    document.getElementById('menuXP').textContent = Math.floor(playerXP) + " / " + xpToNextLevel;
    document.getElementById('menuShip').textContent = SHIP_CLASSES[playerShip.shipClass].name;
    
    // --- NEW: Display Faction Standing ---
    const concordRep = playerFactionStanding["CONCORD"] || 0;
    const ktharrRep = playerFactionStanding["KTHARR"] || 0;
    const standingText = `Concord: ${concordRep} | K'tharr: ${ktharrRep}`;
    
    const repEl = document.getElementById('menuRep');
    repEl.textContent = standingText;
    repEl.style.fontSize = "10px"; // Slightly smaller to fit two names

     // 1. Calculate Percentages for Bars
     const fuelPct = Math.max(0, (playerFuel / MAX_FUEL) * 100);
     const shieldPct = Math.max(0, (playerShields / MAX_SHIELDS) * 100);
     const hullPct = Math.max(0, (playerHull / MAX_PLAYER_HULL) * 100);

     // 2. Update Bar Widths
     document.getElementById('fuelBar').style.width = `${fuelPct}%`;
     document.getElementById('shieldBar').style.width = `${shieldPct}%`;
     document.getElementById('hullBar').style.width = `${hullPct}%`;

     // 3. Update Text Values (Overlaying the bars)
     document.getElementById('fuelVal').textContent = Math.floor(playerFuel);
     document.getElementById('shieldVal').textContent = `${Math.floor(playerShields)}`;
     document.getElementById('hullVal').textContent = `${Math.floor(playerHull)}`;

     // 4. Update HUD Text Stats
     document.getElementById('creditsStat').textContent = formatNumber(playerCredits);
     document.getElementById('cargoStat').textContent = `${currentCargoLoad}/${PLAYER_CARGO_CAPACITY}`;
     
     // 5. Update Header Info
     const dist = Math.sqrt((playerX * playerX) + (playerY * playerY));
     let threatColor = "#00E0E0"; // Safe Cyan
     if (dist > 800) threatColor = "#FF4444"; 
     else if (dist > 400) threatColor = "#FFAA00";

     const sectorEl = document.getElementById('sectorNameStat');
     sectorEl.innerHTML = currentSectorName;
     sectorEl.style.color = threatColor;
     
     // Display Y as inverted so "Up" (Negative array index) looks like Positive movement
    // We use (-playerY) so moving "North" (decreasing index) shows as increasing number.
    document.getElementById('sectorCoordsStat').textContent = `[${playerX}, ${-playerY}]`;

     // 6. Log Handling
     messageAreaElement.innerHTML = messageLog.join('<br>');
     messageAreaElement.scrollTop = 0;

     // --- 7. Visual Warning System ---
    const overlay = document.getElementById('statusOverlay');
    if (overlay) {
        overlay.className = 'status-overlay'; // Reset class
        
        if (playerHull < (MAX_PLAYER_HULL * 0.25)) {
            overlay.classList.add('critical-hull');
            overlay.style.opacity = '1';
        } else if (playerFuel < (MAX_FUEL * 0.20)) {
            overlay.classList.add('critical-fuel');
            overlay.style.opacity = '1';
        } else {
            overlay.style.opacity = '0';
        }
    }
}

 // --- VISIBILITY MANAGER ---
function updateSideBorderVisibility() {
    const leftBorder = document.querySelector('.side-border.left');
    const rightBorder = document.querySelector('.side-border.right');
    
    // Check if any known overlay is currently open
    const tradeOpen = document.getElementById('tradeOverlay').style.display === 'flex';
    const cargoOpen = document.getElementById('cargoOverlay').style.display === 'flex';
    const codexOpen = document.getElementById('codexOverlay').style.display === 'flex';

    // Logic: Only show borders if we are in Galactic Map AND no modals are open
    const isGalacticMap = (currentGameState === GAME_STATES.GALACTIC_MAP);
    const noModals = !tradeOpen && !cargoOpen && !codexOpen;
    
    const shouldShow = isGalacticMap && noModals;

    if (leftBorder) leftBorder.style.display = shouldShow ? 'block' : 'none';
    if (rightBorder) rightBorder.style.display = shouldShow ? 'block' : 'none';
}

// Helper to format numbers with commas (e.g., 1,000)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function triggerHaptic(pattern) {
    // Only works if device supports it and user has interacted with page
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
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

 function updatePlayerNotoriety(amount) {
     playerNotoriety += amount;
     updateNotorietyTitle();
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

 function unlockLoreEntry(entryKey) {
     if (LORE_DATABASE[entryKey] && !discoveredLoreEntries.has(entryKey)) {
         discoveredLoreEntries.add(entryKey);
         LORE_DATABASE[entryKey].unlocked = true;
         logMessage(`<span style='color:#A2D2FF;'>Codex Updated: ${LORE_DATABASE[entryKey].title}</span>`, true);
     }
 }

 let WORLD_SEED;
 let systemCache = {};
 let currentSystemData;
 let currentGameDate;

 let selectedPlanetIndex = -1;

 function renderCombatView() {
     if (!currentCombatContext) return;

     const combatView = document.getElementById('combatView');
     const weapon = COMPONENTS_DATABASE[playerShip.components.weapon];
     const shipClass = SHIP_CLASSES[playerShip.shipClass];
     const ability = shipClass.ability;

     const isCharging = playerIsChargingAttack;
     const canEvade = playerFuel >= EVASION_FUEL_COST;
     const canRun = playerFuel >= RUN_FUEL_COST;
     
     // Ability State
     const abilityReady = playerAbilityCooldown <= 0;
     const abilityLabel = abilityReady ? `${ability.name}` : `${ability.name} (${playerAbilityCooldown})`;
     const abilityStyle = abilityReady ? "border-color:#FFD700; color:#FFD700;" : "opacity:0.5;";

     const playerShieldPercent = (playerShields / MAX_SHIELDS) * 100;
     const playerHullPercent = (playerHull / MAX_PLAYER_HULL) * 100;
     const pirateShieldPercent = (currentCombatContext.pirateShields / currentCombatContext.pirateMaxShields) * 100;
     const pirateHullPercent = (currentCombatContext.pirateHull / currentCombatContext.pirateMaxHull) * 100;

     let html = `
        <div class="combat-header">! HOSTILE ENGAGEMENT !</div>

        <div class="combatants-wrapper">
            <div class="combatant-panel">
                <h3><img src="${playerPfp}" alt="Player Avatar" class="combatant-icon">${playerName}</h3>
                <div class="ship-class-label">${shipClass.name}</div>

                <div class="stat-bar-label"><span>Shields</span><span>${Math.floor(playerShields)} / ${MAX_SHIELDS}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill shield-bar-fill" style="width: ${playerShieldPercent}%;"></div></div>

                <div class="stat-bar-label"><span>Hull</span><span>${Math.floor(playerHull)} / ${MAX_PLAYER_HULL}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill hull-bar-fill" style="width: ${playerHullPercent}%;"></div></div>
            </div>

            <div class="combatant-panel">
                <h3><img src="assets/pirate.png" alt="Pirate Vessel" class="combatant-icon">Hostile Ship</h3>
                <div class="ship-class-label">${currentCombatContext.ship.name}</div>
                <div class="stat-bar-label"><span>Shields</span><span>${currentCombatContext.pirateShields} / ${currentCombatContext.pirateMaxShields}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill shield-bar-fill" style="width: ${pirateShieldPercent}%;"></div></div>
                
                <div class="stat-bar-label"><span>Hull</span><span>${Math.max(0, currentCombatContext.pirateHull)} / ${currentCombatContext.pirateMaxHull}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill pirate-hull-bar-fill" style="width: ${pirateHullPercent}%;"></div></div>
            </div>
        </div>

        <div class="combat-actions">
            <button class="combat-action-btn" onclick="handleCombatAction('fight')">Attack (${weapon.name})</button>
            
            <button class="combat-action-btn" style="${abilityStyle}" 
                    onclick="handleCombatAction('ability')" ${!abilityReady ? 'disabled' : ''}>
                ★ ${abilityLabel}
            </button>

            <button class="combat-action-btn ${isCharging ? 'charge-active' : ''}" onclick="handleCombatAction('charge')" ${isCharging ? 'disabled' : ''}>Charge Weapon</button>
            <button class="combat-action-btn" onclick="handleCombatAction('evade')" ${!canEvade ? 'disabled' : ''}>Evade (${EVASION_FUEL_COST} Fuel)</button>
            <button class="combat-action-btn" onclick="handleCombatAction('run')" ${!canRun ? 'disabled' : ''}>Run (${RUN_FUEL_COST} Fuel)</button>
            <button class="combat-action-btn" onclick="handleCombatAction('hail')">Hail Frequency</button>
        </div>
        <div style="text-align:center; font-size:11px; color:#666; margin-top:-15px;">${ability.desc}</div>
    `;

     combatView.innerHTML = html;
     renderUIStats();
 }

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

         planets.push({
             name: `Planet ${i + 1}`, // We can make procedural names later
             biome: PLANET_BIOMES[biomeKey],
             id: `${systemKey}-${i}`
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

    // --- NEW: Reset Faction Standing ---
    playerFactionStanding = {
        "CONCORD": 0,
        "KTHARR": 0,
        "INDEPENDENT": 0,
        "VOID_VULTURES": 0,
        "XYCORP": 0
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

    // 4. Unlock Default Lore
    unlockLoreEntry("FACTION_CONCORD");
    unlockLoreEntry("XENO_PRECURSORS");
    unlockLoreEntry("MYSTERY_WAYFINDER_QUEST");
    unlockLoreEntry("REGION_SOL_SECTOR");

    Object.keys(COMPONENTS_DATABASE).forEach(key => {
        if (COMPONENTS_DATABASE[key].loreKey) unlockLoreEntry(COMPONENTS_DATABASE[key].loreKey);
    });
    Object.keys(SHIP_CLASSES).forEach(key => {
        if (SHIP_CLASSES[key].loreKey) unlockLoreEntry(SHIP_CLASSES[key].loreKey);
    });

    // 5. Reset Mystery / Quest State
    mystery_wayfinder_progress = 0;
    mystery_wayfinder_finalLocation = null;
    mystery_first_nexus_location = null;
    mystery_nexus_activated = false;

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
     let x = Math.sin(seed++) * 10000;
     return x - Math.floor(x);
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
         // Fix for acquire missions display
         const currentAmt = playerCargo[objective.itemID] || 0;
         objectiveText = `Acquire ${COMMODITIES[objective.itemID].name} (${currentAmt}/${objective.count})`;
     }

     textEl.textContent = `${playerActiveMission.title}: ${objectiveText}`;
     textEl.style.color = "#FFD700";
 }

 /**
  * Generates a procedural and deterministic name for a sector based on its coordinates.
  * Now includes Faction Territory suffixes.
  */
 function generateSectorName(sectorX, sectorY) {
     if (sectorX === 0 && sectorY === 0) {
         return "Sol Sector (Concord HQ)"; 
     }

     // Create a unique seed for this specific sector coordinate pair.
     const seed = WORLD_SEED + (sectorX * 10000) + sectorY;

     // Calculate the distance from the origin (0,0) to determine name "tier".
     const distance = Math.sqrt(sectorX * sectorX + sectorY * sectorY);

     let prefixPool, rootPool;

     if (distance < 10) { // Tier 1: Core Worlds
         prefixPool = SECTOR_NAME_PARTS.TIER1_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER1_ROOT;
     } else if (distance < 30) { // Tier 2: The Frontier
         prefixPool = SECTOR_NAME_PARTS.TIER2_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER2_ROOT;
     } else { // Tier 3: Deep Space
         prefixPool = SECTOR_NAME_PARTS.TIER3_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER3_ROOT;
     }

     // Pick name parts
     const prefix = prefixPool[Math.floor(seededRandom(seed) * prefixPool.length)];
     const root = rootPool[Math.floor(seededRandom(seed + 1) * rootPool.length)];
     
     let fullName = `${prefix} ${root}`;

     // Append Faction Suffix
     const faction = getFactionAtSector(sectorX, sectorY);
     if (faction === "KTHARR") fullName += " [Hegemony]";
     else if (faction === "CONCORD") fullName += " [Concord]";
     else if (faction === "VOID_VULTURES") fullName += " [Lawless]";

     return fullName;
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

     let html = `<h2>${currentSystemData.name}</h2>`;
     html += `<p style="color:#888; margin-bottom:20px;">System Coordinates: [${currentSystemData.x}, ${currentSystemData.y}]</p>`;
     
     // The Planet Grid
     html += '<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; align-items: stretch;">';

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

     // --- Navigation Footer ---
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

    // --- 3. Clear Canvas & Set Background ---
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Pulse Effect Background
    if (sensorPulseActive) {
        const pulseIntensity = (1 - (sensorPulseRadius / MAX_PULSE_RADIUS)) * 0.2;
        
        // Dynamic Pulse Color based on Theme
        if (isLightMode) {
            // Light Mode: Subtle Teal Pulse on White
            ctx.fillStyle = `rgba(0, 119, 119, ${0.05 + pulseIntensity})`;
        } else {
            // Dark Mode: Dark Green/Cyan Pulse on Black
            ctx.fillStyle = `rgba(0, 40, 40, ${0.4 + pulseIntensity})`;
        }
    } else {
        // STANDARD BACKGROUND FILL
        // Light Mode: Solid Paper White
        // Dark Mode: Transparent Black (0.4 alpha) to let the CSS background show through
        ctx.fillStyle = isLightMode ? '#FFFFFF' : 'rgba(0, 0, 0, 0.4)';
    }
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // --- 4. Draw Tiles ---
    for (let y = 0; y < VIEWPORT_HEIGHT_TILES; y++) {
        for (let x = 0; x < VIEWPORT_WIDTH_TILES; x++) {
            const worldX = Math.floor(camX + x);
            const worldY = Math.floor(camY + y);

            const tileData = chunkManager.getTile(worldX, worldY);
            const tileChar = getTileChar(tileData);

            // [Color Logic]
            switch (tileChar) {
                // Stars: Darker Gold in Light Mode for visibility
                case STAR_CHAR_VAL: ctx.fillStyle = isLightMode ? '#DDBB00' : '#FFFF99'; break;
                case PLANET_CHAR_VAL: ctx.fillStyle = '#88CCFF'; break;
                case STARBASE_CHAR_VAL: 
                    ctx.save();
                    
                    // --- PULSE ANIMATION MATH ---
                    // Creates a smooth wave between 0.0 and 1.0 roughly every second
                    const pulse = (Math.sin(Date.now() / 300) + 1) / 2; 
                    
                    // Glow oscillates between 15px and 30px
                    ctx.shadowBlur = 15 + (pulse * 15); 
                    ctx.shadowColor = '#00FFFF'; // Cyan Neon
                    ctx.fillStyle = '#00FFFF';
                    
                    // Slightly pulse the size too (optional, looks cool)
                    const sizeMod = 1.0 + (pulse * 0.1); 
                    ctx.font = `bold ${TILE_SIZE * 1.3 * sizeMod}px 'Orbitron', monospace`;
                    
                    ctx.fillText(
                        tileChar,
                        x * TILE_SIZE + TILE_SIZE / 2,
                        y * TILE_SIZE + TILE_SIZE / 2
                    );
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
                    // DOTS: Dark Grey in Light Mode, Light Grey in Dark Mode
                    ctx.fillStyle = isLightMode ? '#444455' : '#909090';
                    break;
            }

            // Draw at Screen Coordinate
            ctx.fillText(
                tileChar,
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2
            );
        }
    }

    // --- 5. Draw Objects Relative to Camera ---
    const playerScreenX = (playerX - camX) * TILE_SIZE + TILE_SIZE / 2;
    const playerScreenY = (playerY - camY) * TILE_SIZE + TILE_SIZE / 2;

    // Draw Pulse Ring
    if (sensorPulseActive) {
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY - (TILE_SIZE/4), sensorPulseRadius, 0, 2 * Math.PI);
        
        const accentColor = getThemeColor('--accent-color', '#00E0E0');
        
        ctx.strokeStyle = accentColor;

        ctx.lineWidth = 2;
        ctx.stroke();
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

    // Draw Enemies
    activeEnemies.forEach(enemy => {
        const screenX = (enemy.x - camX) * TILE_SIZE + TILE_SIZE / 2;
        const screenY = (enemy.y - camY) * TILE_SIZE + TILE_SIZE / 2;
        if (screenX >= -TILE_SIZE && screenX <= gameCanvas.width) {
            ctx.fillStyle = '#FF5555'; 
            ctx.font = `bold ${TILE_SIZE}px 'Roboto Mono', monospace`; 
            ctx.fillText(PIRATE_CHAR_VAL, screenX, screenY);
        }
    });

    // Draw Player
    if (currentCombatContext) {
        ctx.fillStyle = '#FF5555';
        ctx.fillText(PIRATE_CHAR_VAL, playerScreenX, playerScreenY);
    } else {
        // PLAYER ICON: Black in Light Mode, White in Dark Mode
        ctx.fillStyle = isLightMode ? '#000000' : '#FFFFFF'; 
        ctx.fillText(PLAYER_CHAR_VAL, playerScreenX, playerScreenY);
    }

    // --- 6. Update UI Stats ---
    const dist = Math.sqrt((playerX * playerX) + (playerY * playerY));
    let threat = "SAFE";
    let color = "#00FF00"; 
    if (dist > 800) { threat = "DEADLY"; color = "#FF0000"; } 
    else if (dist > 400) { threat = "HIGH"; color = "#FF5555"; } 
    else if (dist > 150) { threat = "MODERATE"; color = "#FFFF00"; } 
    
    sectorNameStatElement.innerHTML = `${currentSectorName} <span style="color:${color}; font-size: 0.8em; margin-left: 8px;">[${threat}]</span>`;
    // INVERTED Y FOR DISPLAY ONLY
    sectorCoordsStatElement.textContent = `(${playerX},${-playerY})`;

    document.getElementById('versionInfo').textContent = `Wayfinder: Echoes of the Void - ${GAME_VERSION}`;

    renderUIStats();
}

function processLootTable(tableName) {
    const table = LOOT_TABLES[tableName];
    if (!table) return;

    const outcome = getWeightedRandomOutcome(table);
    logMessage(outcome.text);

    // Handle specific outcome types
    if (outcome.type === "ITEM") {
        const qty = outcome.min + Math.floor(Math.random() * (outcome.max - outcome.min + 1));
        if (currentCargoLoad + qty <= PLAYER_CARGO_CAPACITY) {
            playerCargo[outcome.id] = (playerCargo[outcome.id] || 0) + qty;
            updateCurrentCargoLoad();
            logMessage(`Received: ${qty} x ${COMMODITIES[outcome.id].name}`, true);
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

 function updateCurrentCargoLoad() {

     currentCargoLoad = 0;
     for (const cID in playerCargo) currentCargoLoad += playerCargo[cID];
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

     // 5. Update Sector State (Critical Fix for Desync)
     // This ensures the UI immediately reflects the new sector name and coordinates
     updateSectorState();

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

     // 4. Check Fuel Availability (THE FIX)
     // If you don't have enough fuel to make the jump:
     if (playerFuel < actualFuelPerMove && (dx !== 0 || dy !== 0)) {
         // --- HAPTIC FEEDBACK: OUT OF FUEL ---
         triggerHaptic(200);

         logMessage("<span style='color:red'>CRITICAL: OUT OF FUEL!</span>");
         logMessage("Main engines offline. Life support failing...");
         
         // Trigger the Game Over screen immediately
         triggerGameOver("Stranded: Fuel Depleted");
         return;
     }

     // 5. Update Player Coordinates
     playerX += dx;
     playerY += dy;

     // 6. Deduct Fuel and Advance Time
     if (dx !== 0 || dy !== 0) {
        playerFuel -= actualFuelPerMove;
        playerFuel = parseFloat(playerFuel.toFixed(1)); 
        if (playerFuel < 0) playerFuel = 0;
        
        advanceGameTime(0.01); // Time passes when you move

        // --- Thruster Particles ---
        // Spawn particles behind the ship (opposite to dx, dy)
        spawnParticles(playerX - dx, playerY - dy, 'thruster', { x: dx, y: dy });
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
     const tileObject = chunkManager.getTile(playerX, playerY);
     const tileChar = getTileChar(tileObject);
     let bM = ""; // This is our base message for the text log
     let availableActions = []; // This new array will hold our button actions

     if (tileObject && tileObject.type === 'location') {
         const location = tileObject;
         bM = `Arrived at ${location.name}.`;

        // 1. Keep the Docking Toast
         if (location.isMajorHub || location.type === OUTPOST_CHAR_VAL) {
             if (typeof soundManager !== 'undefined') soundManager.playUIHover();
             showToast(`DOCKED: ${location.name.toUpperCase()}`, "success");
         }

         // 2. Open the Visual Station View immediately for Hubs
         if (location.isMajorHub) {
             openStationView(); // <--- THIS IS THE KEY CHANGE
             return; // Stop processing other automatic interactions
         }

         // ---CUSTOMS SCAN TRIGGER ---
         // Only Major Hubs have customs scanners
         if (location.isMajorHub) {
             const cleared = performCustomsScan();
             if (!cleared) return; // Stop interaction if caught
         }

         if ((location.sells && location.sells.length > 0) || (location.buys && location.buys.length > 0)) {
                availableActions.push({
                    label: 'Buy',
                    key: 'b',
                    onclick: () => openTradeModal('buy') 
                });
                availableActions.push({
                    label: 'Sell',
                    key: 's',
                    onclick: () => openTradeModal('sell')
                });
            }
         if (location.isMajorHub) {
             availableActions.push({
                 label: 'Outfit',
                 key: 'o',
                 onclick: displayOutfittingScreen
             });
             availableActions.push({
                 label: 'Missions',
                 key: 'k',
                 onclick: displayMissionBoard
             });
             availableActions.push({
                 label: 'Shipyard',
                 key: 'y',
                 onclick: displayShipyard
             });
             // Available at both Major Hubs AND Outposts
            availableActions.push({ 
                label: 'Cantina (10c)', 
                key: 'v', 
                onclick: visitCantina 
            });
        }

         if (playerHull < MAX_PLAYER_HULL) {
             const hullToRepair = MAX_PLAYER_HULL - playerHull;
             const repairCost = hullToRepair * HULL_REPAIR_COST_PER_POINT;
             availableActions.push({
                 label: `Repair Hull (${formatNumber(repairCost)}c)`,
                 key: 'r', // 'r' for repair
                 onclick: repairShip
             });
         }

         if (playerActiveMission && playerActiveMission.type === "DELIVERY" && !playerActiveMission.isComplete && location.name === playerActiveMission.objectives[0].destinationName) {
             availableActions.push({
                 label: 'Complete Delivery',
                 key: 'c',
                 onclick: handleCompleteDelivery
             });
         }
         if (playerActiveMission && playerActiveMission.isComplete && location.name === playerActiveMission.giver) {
             availableActions.push({
                 label: 'Get Reward',
                 key: 'g',
                 onclick: grantMissionRewards
             });
         }

         if (playerActiveMission && playerActiveMission.type === "ACQUIRE" && !playerActiveMission.isComplete && location.name === playerActiveMission.giver) {
             availableActions.push({
                 label: 'Turn in Resources',
                 key: 'g',
                 onclick: handleTurnInAcquire
             });
         }

         if (tileChar === STARBASE_CHAR_VAL || tileChar === OUTPOST_CHAR_VAL) {
             playerFuel = MAX_FUEL;
             playerShields = MAX_SHIELDS;
             bM += `\nFuel and Shields recharged.`;
             applyPlayerShipStats();
         }
         if (!discoveredLocations.has(location.name)) {
             discoveredLocations.add(location.name);
             playerXP += XP_PER_LOCATION_DISCOVERY;
             
             bM += `\n<span style='color:var(--success);'>Location Discovered: ${location.name}! +${formatNumber(XP_PER_LOCATION_DISCOVERY)} XP!</span>`;

             unlockLoreEntry(`LOCATION_${location.name.replace(/\s+/g, '_').toUpperCase()}`);
             checkLevelUp();
         }

     } else {
         switch (tileChar) {
             case STAR_CHAR_VAL:
                 bM = `Near star.`;
                 availableActions.push({
                     label: 'Enter System',
                     key: 'e',
                     onclick: () => {
                         currentSystemData = generateStarSystem(playerX, playerY);
                         changeGameState(GAME_STATES.SYSTEM_MAP);
                     }
                 });
                 availableActions.push({
                     label: 'Scoop Fuel',
                     key: 'h',
                     onclick: scoopHydrogen
                 });
                 unlockLoreEntry("PHENOMENON_STAR");
                 break;
            case NEXUS_CHAR_VAL:
                 bM = "You are hovering before a colossus of shifting geometry. The First Nexus.";
                 if (mystery_nexus_activated) {
                     bM += "\nIt pulses with a silent, rhythmic light. It knows you are here.";
                 } else {
                     bM += "\nIt is dormant, but the Wayfinder Core in your hold is vibrating in unison.";
                 }
                 availableActions.push({
                     label: 'Commune',
                     key: 'x', // 'x' for Xeno/Nexus
                     onclick: handleNexusEncounter
                 });
                 unlockLoreEntry("MYSTERY_FIRST_NEXUS");
                 break;
             case ASTEROID_CHAR_VAL:
                 bM = `Asteroid field.`;
                 availableActions.push({
                     label: 'Mine',
                     key: 'm',
                     onclick: mineAsteroid
                 });
                 unlockLoreEntry("PHENOMENON_ASTEROID");
                 break;
             case NEBULA_CHAR_VAL:
                 bM = `Inside a dense gas cloud. Sensors are intermittent.`;
                 availableActions.push({
                     label: 'Scoop Fuel',
                     key: 'h',
                     onclick: scoopHydrogen
                 });
                 unlockLoreEntry("PHENOMENON_NEBULA");
                 break;
             case WORMHOLE_CHAR_VAL:
                 bM = `Near a swirling vortex in spacetime.`;
                 availableActions.push({
                     label: 'Traverse',
                     key: 't',
                     onclick: traverseWormhole
                 });
                 unlockLoreEntry("PHENOMENON_WORMHOLE");
                 break;
             case ANOMALY_CHAR_VAL:
                 bM = `You've entered the unstable anomaly!`;
                 if (tileObject.studied) {
                     bM = "This anomaly has dissipated.";
                 } else {
                     handleAnomalyEncounter(tileObject); // This stays
                 }
                 unlockLoreEntry("XENO_ANOMALIES");
                 break;
             case DERELICT_CHAR_VAL:
                 // --- NEW DERELICT INTERACTION ---
                 bM = "You approach the dark hull of the derelict ship..."; // Base message
                 if (tileObject.studied) {
                     bM = "You drift past the salvaged wreck.";
                 } else {
                     handleDerelictEncounter(tileObject); // Trigger the encounter!
                 }
                 unlockLoreEntry("XENO_DERELICTS"); // Also unlock the codex entry
                 break;
         }
     }

     logMessage(bM);
     renderContextualActions(availableActions);
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

 function scanLocation() {
     if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
         logMessage("Cannot scan now.");
         return;
     }

     advanceGameTime(0.05); // Use new time function

     const scanner = COMPONENTS_DATABASE[playerShip.components.scanner];
     const scanBonus = scanner.stats.scanBonus || 0;

     const tileObject = chunkManager.getTile(playerX, playerY);
     let scanMessage = `Scan Report:\nPlayer Shields: ${Math.floor(playerShields)}/${MAX_SHIELDS}. Hull: ${Math.floor(playerHull)}/${MAX_PLAYER_HULL}.\n`;
     let objectTypeForXP = getTileType(tileObject) || getTileChar(tileObject);
     let actionsAvailable = "";

     if (tileObject && tileObject.type === 'location') {
         scanMessage += `\n<span style='color:#FF88FF;'>Location: ${tileObject.name} (${tileObject.faction})</span>\n`;
         scanMessage += `Description: ${tileObject.scanFlavor || 'No detailed scan data available.'}`;
         if ((tileObject.sells && tileObject.sells.length > 0) || (tileObject.buys && tileObject.buys.length > 0)) {
             actionsAvailable += "Trade (B/S). ";
         }
         if (tileObject.isMajorHub) {
             actionsAvailable += "Outfit (O). Missions (K). Shipyard (Y). ";
         }
         if (playerHull < MAX_PLAYER_HULL) {
             actionsAvailable += "Repair (R). ";
         }
         actionsAvailable += "Leave (L)."
         objectTypeForXP = tileObject.name;

     } else {
         const tileChar = getTileChar(tileObject);
         switch (tileChar) {
             case EMPTY_SPACE_CHAR_VAL:
                const voidFlavor = [
                    "Vast emptiness. Faint cosmic background radiation.",
                    "Sensors detect nothing but distant starlight and dust.",
                    "The void is silent here. A little too silent.",
                    "Stellar density is low. Navigation is clear.",
                    "Long-range scanners show no immediate signatures.",
                    "Drifting through the quiet dark between stars.",
                    "Hull structural integrity holding. The silence is heavy.",
                    "No local gravity wells detected. Smooth sailing."
                ];
                scanMessage += voidFlavor[Math.floor(Math.random() * voidFlavor.length)];
                
                if (scanBonus > 0 && Math.random() < (scanBonus * 2)) {
                    scanMessage += "\n<span style='color:#FFFF99;'>Detailed Scan: Trace energy echo... probably just solar wind.</span>";
                }
                objectTypeForXP = 'empty_space';
                break;
             case STAR_CHAR_VAL:
                 scanMessage += `Brilliant star.`;
                 if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Corona richness at ${(tileObject.richness * 100).toFixed(0)}%.</span>`;
                 } else if (tileObject.richness > 0.75) {
                     scanMessage += "\n<span style='color:#FFFF99;'>High hydrogen concentrations detected!</span>";
                 }
                 if (tileObject.scoopedThisVisit) scanMessage += "\n<span style='color:#999999;'>Corona appears depleted.</span>";
                 actionsAvailable += "Scoop Fuel (H). Enter System (E).";
                 break;
             case ASTEROID_CHAR_VAL:
                 scanMessage += `Asteroid field.`;
                 if (scanBonus > 0) {
                     let densityDesc = (tileObject.density > 0.6) ? "High" : (tileObject.density > 0.3) ? "Moderate" : "Low";
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Field density is ${densityDesc}.</span>`;
                 }
                 if (tileObject.minedThisVisit) scanMessage += "\n<span style='color:#999999;'>This field appears recently mined.</span>";
                 actionsAvailable += "Mine Asteroid (M).";
                 break;
             case NEBULA_CHAR_VAL:
                 scanMessage += `Inside a dense gas cloud. Sensors are intermittent.`;
                 if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Cloud composition is 98% hydrogen. Suitable for siphoning.</span>`;
                 }
                 actionsAvailable += "Scoop Fuel (H).";
                 break;
             case ANOMALY_CHAR_VAL:
                 scanMessage += `Unstable energy readings.`;
                 if (tileObject.studied) {
                     scanMessage += "\n<span style='color:#999999;'>The anomaly appears to have dissipated.</span>";
                 } else if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FF33FF;'>Detailed Scan: ${tileObject.subtype}. Highly volatile. Interaction is possible but dangerous.</span>`;
                 }
                 break;
             case DERELICT_CHAR_VAL:
                 // --- NEW DERELICT SCAN ---
                 scanMessage += `A silent, drifting ship hulk. It appears powerless.`;
                 if (tileObject.studied) {
                     scanMessage += "\n<span style='color:#999999;'>You've already salvaged this wreck.</span>";
                 } else if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Hull breaches detected. Life signs... negative. Potential salvage.</span>`;
                 }
                 break;
             default:
                 scanMessage += "Unknown object detected. Sensor readings inconclusive.";
                 break;
         }
     }

     if (actionsAvailable) {
         scanMessage += "\n\nAvailable Actions: " + actionsAvailable;
     }

     if (playerActiveMission && playerActiveMission.type === "SURVEY" && !playerActiveMission.isComplete) {
         playerActiveMission.objectives.forEach((obj, index) => {
             const progressKey = `survey_${index}`;
             const objectiveProgress = playerActiveMission.progress[progressKey];
             if (objectiveProgress && !objectiveProgress.complete && tileObject.type === obj.targetType && (obj.subtype === "ANY_ANOMALY" || tileObject.subtype === obj.subtype)) {
                 objectiveProgress.complete = true;
                 scanMessage += `\n<span style='color:#00FF00;'>Mission Update: ${obj.subtype} surveyed!</span>`;
             }
         });
         checkMissionObjectiveCompletion();
     }

     if (objectTypeForXP && !scannedObjectTypes.has(objectTypeForXP)) {
         scannedObjectTypes.add(objectTypeForXP);
         playerXP += XP_PER_FIRST_SCAN_TYPE;
         scanMessage += `\n<span style='color:#00FF00;'>New Discovery Type Scanned! +${XP_PER_FIRST_SCAN_TYPE} XP!</span>`;
         checkLevelUp();
     }

     logMessage(scanMessage);
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

         if (currentCargoLoad + yieldAmount <= PLAYER_CARGO_CAPACITY) {
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + yieldAmount;
             updateCurrentCargoLoad();
             scanMessage += ` ${yieldAmount} ${COMMODITIES[resourceId].name}\n`;
             foundSomething = true;
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
     } else if (!spaceLeft) {
         // Already logged "no cargo space"
     } else {
         scanMessage = "Scan complete. No viable samples could be collected.";
     }

     logMessage(scanMessage);
     renderUIStats();
 }
 /**
  * Handles the logic for mining mineral resources on a planet's surface.
  */
 function minePlanet() {
     if (currentGameState !== GAME_STATES.PLANET_VIEW) return;

     const planet = currentSystemData.planets[selectedPlanetIndex];

     if (planet.minedThisVisit) {
        logMessage("Mineral deposits in this landing zone are depleted.");
        return;
    }

     // MODIFIED: Filter for *only* non-biological resources
     const mineralResources = planet.biome.resources.filter(r => !BIOLOGICAL_RESOURCES.has(r));

     if (mineralResources.length === 0) {
         logMessage("No mineable mineral deposits detected.");
         return;
     }

     // Check for cargo space *before* mining (assume a minimum gain)
     const potentialGain = 5;
     if (currentCargoLoad + potentialGain > PLAYER_CARGO_CAPACITY) {
         logMessage("Mining operation failed: Not enough cargo space for even a small haul.");
         return;
     }

     let minedResourcesMessage = "Planetary mining operation yields:\n";
     let minedSomething = false;
     let spaceLeft = true;

     // MODIFIED: Loop over mineralResources
     mineralResources.forEach(resourceId => {
         if (!spaceLeft) return; // Stop if we ran out of space

         const yieldAmount = 5 + Math.floor(Math.random() * 11); // 5 to 15 units

         if (currentCargoLoad + yieldAmount <= PLAYER_CARGO_CAPACITY) {
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + yieldAmount;
             updateCurrentCargoLoad();
             minedResourcesMessage += ` ${formatNumber(yieldAmount)} Minerals`;
            toastHTML += `+${formatNumber(yieldAmount)} Minerals<br>`;
             minedSomething = true;
         } else {
             minedResourcesMessage += ` Not enough cargo space for ${COMMODITIES[resourceId].name}.\n`;
             spaceLeft = false; // Flag to stop mining other resources
         }
     });

     if (minedSomething) {
        soundManager.playMining();
        triggerHaptic(50);
         // Make planet mining a bit more rewarding than asteroids
         const xpGained = XP_PER_MINING_OP * 2;
         playerXP += xpGained;
         minedResourcesMessage += `\n+${xpGained} XP.`;
         advanceGameTime(0.15); // Planet mining takes longer
         checkLevelUp();
         planet.minedThisVisit = true;
     } else if (!spaceLeft) {
         // This case is already handled by the "Not enough cargo space" message
     } else {
         minedResourcesMessage = "Mining yielded nothing of value this attempt.";
     }

     logMessage(minedResourcesMessage);
     // We stay on the planet, so we just re-render the UI stats
     renderUIStats();
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
         showToast("TANKS FULL", "info"); // Feedback for full tanks
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

         const richness = (typeof cT.richness === 'number') ? cT.richness : 0.3;
         fuelGained = MIN_SCOOP_YIELD + Math.floor(richness * MAX_SCOOP_YIELD_RICHNESS_MULTIPLIER);
         fuelGained += Math.floor(Math.random() * SCOOP_RANDOM_BONUS);
         fuelGained = Math.max(1, fuelGained);

         updateWorldState(playerX, playerY, { scoopedThisVisit: true });
         logMsg = "Scooped hydrogen from the star's corona.";

     } else if (tileType === 'nebula') {
         fuelGained = Math.floor(MIN_SCOOP_YIELD / 2) + Math.floor(Math.random() * SCOOP_RANDOM_BONUS);
         fuelGained = Math.max(1, fuelGained);
         logMsg = "Siphoned trace hydrogen from the gas cloud.";
         timePassed = 0.02;
     }

     const originalFuel = playerFuel;
     playerFuel = Math.min(MAX_FUEL, playerFuel + fuelGained);
     playerFuel = parseFloat(playerFuel.toFixed(1));
     const actualGained = playerFuel - originalFuel;

     if (actualGained > 0) {
         advanceGameTime(timePassed);
         logMessage(`${logMsg}\nGained ${actualGained.toFixed(1)} fuel.\nFuel: ${playerFuel.toFixed(1)}/${MAX_FUEL.toFixed(1)}`);
         
         // FIRE THE TOAST!
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

        // --- PERK HOOK ---
        if (playerPerks.has('DEEP_CORE_MINING')) {
            yieldAmount += 3;
            // visual flare logic can go here
        }

     if (yieldAmount > 0) {
         if (currentCargoLoad + yieldAmount <= PLAYER_CARGO_CAPACITY) {
             playerCargo.MINERALS = (playerCargo.MINERALS || 0) + yieldAmount;
             updateCurrentCargoLoad();
             minedResourcesMessage += ` ${formatNumber(yieldAmount)} Minerals`;
             toastHTML += `+${formatNumber(yieldAmount)} Minerals<br>`;
             
             if (richnessMultiplier > 1.2) minedResourcesMessage += " (Rich Vein!)";
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

         if (currentCargoLoad + rareYield <= PLAYER_CARGO_CAPACITY) {
             const resourceId = (Math.random() < 0.7) ? "RARE_METALS" : "PLATINUM_ORE";
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + rareYield;
             updateCurrentCargoLoad();
             
             const rareName = COMMODITIES[resourceId].name;
             minedResourcesMessage += `<span style='color:#FFFF99;'>+ ${rareYield} ${rareName}!</span>\n`;
             toastHTML += `<span style="color:#FFFF00">+${rareYield} ${rareName}</span><br>`; // Add to toast
             
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
     updateWorldState(playerX, playerY, { minedThisVisit: true });
     logMessage(minedResourcesMessage);
 }

 function startEncounter(tileObject) {
     switch (tileObject.type) {
         case 'anomaly':
             handleAnomalyEncounter(tileObject);
             break;
             // You could add a case for 'derelict' here in the future
         default:
             logMessage("Your sensors can't get a clear reading.");;
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
  * Handles the random outcomes of investigating an anomaly using a weighted system.
  * This function depends on the 'getWeightedRandomOutcome' helper function.
  * @param {object} anomalyObject - The tile data for the anomaly.
  */
 function handleAnomalyEncounter(anomalyObject) {
     const outcomes = [{
             weight: 4, // Common
             text: "Your sensors record a massive amount of data before the anomaly dissipates. You gain 50 XP for the discovery!",
             effect: () => {
                 playerXP += 50;
                 checkLevelUp();
             }
         },
         {
             weight: 4, // Common
             text: "A psionic echo from the anomaly reverberates through your mind, revealing a forgotten piece of lore.",
             effect: () => {
                 unlockLoreEntry("XENO_ANOMALIES");
             }
         },
         {
             weight: 2, // Uncommon
             text: "A burst of exotic particles revitalizes your ship! Shields fully restored!",
             effect: () => {
                 playerShields = MAX_SHIELDS;
             }
         },
         {
             weight: 2, // Uncommon
             text: "The anomaly contains a pocket of stabilized exotic matter. You carefully collect 2 units of Void Crystals!",
             effect: () => {
                 if (currentCargoLoad + 2 <= PLAYER_CARGO_CAPACITY) {
                     playerCargo.VOID_CRYSTALS = (playerCargo.VOID_CRYSTALS || 0) + 2;
                     updateCurrentCargoLoad();
                 } else {
                     logMessage("You found Void Crystals but had no cargo space to collect them!", true);
                 }
             }
         },
         {
             weight: 2, // Uncommon
             text: "The anomaly collapses violently! Your ship is battered by gravimetric shear. Hull takes 20 damage!",
             effect: () => {
                 playerHull -= 20;
                 if (playerHull < 1) playerHull = 1;
             }
         },
         {
             weight: 2, // Uncommon
             text: "A strange energy feedback loop drains your fuel reserves! You lose 50 fuel.",
             effect: () => {
                 playerFuel -= 50;
                 if (playerFuel < 0) playerFuel = 0;
             }
         },
         {
             weight: 1, // Rare
             text: "You discover a small, stable wormhole within the anomaly containing a drifting cargo pod. You salvage 1000 Credits!",
             effect: () => {
                 playerCredits += 1000;
             }
         }
     ];

     // Select a weighted random outcome
     const chosenOutcome = getWeightedRandomOutcome(outcomes);

     // Apply the effect and update the message
     chosenOutcome.effect();
     logMessage(`Investigating the ${anomalyObject.subtype || 'anomaly'}...\n${chosenOutcome.text}`);

     // Mark the anomaly as studied so it can't be used again
     updateWorldState(playerX, playerY, { studied: true });
 }

 function calculatePrice(basePrice, priceMod, itemID, locationName, mode) {
     // 1. Base Calculation
     let price = basePrice * priceMod;

     // 2. Illegal Goods Markup (Risk Premium)
     // If selling illegal goods, they are worth 2.5x more on the black market
     const itemData = COMMODITIES[itemID];
     if (itemData && itemData.illegal && mode === 'sell') {
         price *= 2.5; 
     }

     // --- PERK HOOK ---
    if (playerPerks.has('SILVER_TONGUE')) {
        if (mode === 'buy') price *= 0.9; // 10% cheaper
        if (mode === 'sell') price *= 1.1; // 10% more profit
    }

     // 3. Dynamic Market Trends (Hot Commodities)
     // If this station is the target of a rumor, double the price!
     if (activeMarketTrend && 
         activeMarketTrend.station === locationName && 
         activeMarketTrend.item === itemID && 
         currentGameDate < activeMarketTrend.expiry) {
         
         price *= 2.0;
         // Visual flare in the UI would go here (e.g., gold text)
     } else {
         // Standard Fluctuation (Sine Wave)
         const uniqueOffset = basePrice;
         const fluctuation = Math.sin((currentGameDate + uniqueOffset) / 5);
         const marketFactor = 1 + (fluctuation * 0.15);
         price *= marketFactor;
     }

     return Math.max(1, Math.round(price));
 }

 function performCustomsScan() {
    // 1. Check for Contraband
    let contrabandFound = [];
    for (const itemID in playerCargo) {
        if (playerCargo[itemID] > 0 && COMMODITIES[itemID].illegal) {
            contrabandFound.push(itemID);
        }
    }

    if (contrabandFound.length === 0) return true; // Clean scan, proceed

    // 2. Risk Calculation (Base 30% chance + 10% per illegal item type)
    const catchChance = 0.30 + (contrabandFound.length * 0.10);
    
    logMessage("Scanning vessel signature...", true);

    if (Math.random() < catchChance) {
        // --- CAUGHT! ---
        soundManager.playError();
        triggerHaptic([200, 100, 200]);
        
        let fine = 0;
        contrabandFound.forEach(id => {
            const qty = playerCargo[id];
            const val = COMMODITIES[id].basePrice;
            fine += (qty * val * 0.5); // Fine is 50% of base value
            playerCargo[id] = 0; // Confiscated!
        });
        
        fine = Math.floor(fine);
        playerCredits = Math.max(0, playerCredits - fine);
        updateCurrentCargoLoad();
        
        // Huge Notoriety Hit (You are now a criminal)
        updatePlayerNotoriety(5); 

        // Alert Modal
        showConfirmationModal(
            `CUSTOMS ALERT: Contraband detected! Cargo confiscated. Fined ${fine} credits.`,
            () => { /* Just close */ }
        );
        
        logMessage(`<span style="color:#FF4444">CUSTOMS VIOLATION:</span> ${fine}c fine assessed. Contraband seized.`);
        renderUIStats();
        return false; // Docking denied/interrupted
    } else {
        // --- EVADED ---
        logMessage(`<span style="color:#FFFF00">Scan Complete.</span> Sensors failed to detect concealed cargo.`);
        return true;
    }
}

function getTradeQuantityPromptBaseMessage() {
     const lD = currentTradeContext.locationData;
     const itemsList = currentTradeContext.mode === 'buy' ? lD.sells : lD.buys;
     const itemEntry = itemsList[currentTradeContext.itemIndex];
     const commodity = COMMODITIES[itemEntry.id];
     
     // UPDATED CALL
     const price = calculatePrice(commodity.basePrice, itemEntry.priceMod, itemEntry.id, lD.name, currentTradeContext.mode);

     let promptMsg = `How many ${commodity.name} to ${currentTradeContext.mode}? (Price: ${price}c)\n`;

     if (currentTradeContext.mode === 'buy') {
         promptMsg += `Max: ${itemEntry.stock}, Afford: ${Math.floor(playerCredits / price)}, Space: ${PLAYER_CARGO_CAPACITY - currentCargoLoad}\n`;
     } else {
         promptMsg += `You have: ${playerCargo[itemEntry.id]||0}, Location demand: ${itemEntry.stock}\n`;
     }
     return promptMsg;
 }

function closeTradeModal() {
    document.getElementById('tradeOverlay').style.display = 'none';
    currentTradeContext = null;
    handleInteraction();
    
    // UPDATE BORDERS
    updateSideBorderVisibility();
}

function renderTradeList() {
    const listEl = document.getElementById('tradeList');
    listEl.innerHTML = '';

    currentTradeContext.items.forEach((item, index) => {
        const com = COMMODITIES[item.id];
        
        // UPDATED CALL
        const price = calculatePrice(com.basePrice, item.priceMod, item.id, currentTradeContext.locationData.name, currentTradeContext.mode);
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        if (index === currentTradeItemIndex) row.classList.add('selected');
        
        // Special styling for illegal/trending items
        let nameStyle = "";
        if (com.illegal) nameStyle = "color:#FF5555"; // Red for contraband
        
        let stockInfo = "";
        if (currentTradeContext.mode === 'buy') stockInfo = `Stock: ${item.stock}`;
        else stockInfo = `Have: ${playerCargo[item.id] || 0}`;

        row.innerHTML = `
            <span style="${nameStyle}">${com.name}</span>
            <span style="color:#888;">${price}c | ${stockInfo}</span>
        `;
        row.onclick = () => selectTradeItem(index);
        listEl.appendChild(row);
    });
}

function selectTradeItem(index) {
    currentTradeItemIndex = index;
    if (currentTradeContext) currentTradeContext.itemIndex = index;

    currentTradeQty = 1;
    renderTradeList(); 
    
    if (!currentTradeContext || !currentTradeContext.items[index]) return;

    const itemEntry = currentTradeContext.items[index];
    const com = COMMODITIES[itemEntry.id];
    
    unlockLoreEntry(`COMMODITY_${itemEntry.id}`);

    // Update Detail Text
    document.getElementById('tradeItemName').textContent = com.name;
    
    // Add "ILLEGAL" warning to description if needed
    let desc = com.description;
    if (com.illegal) desc = "[CONTRABAND] " + desc;
    document.getElementById('tradeItemDesc').textContent = desc;
    
    document.getElementById('tradeQtyInput').value = 1;

    const confirmBtn = document.getElementById('tradeConfirmBtn');
    if (confirmBtn) confirmBtn.disabled = false;

    updateTradeTotal();
}

function updateTradeTotal() {
    if (currentTradeItemIndex === -1) return;

    const itemEntry = currentTradeContext.items[currentTradeItemIndex];
    const com = COMMODITIES[itemEntry.id];
    
    // UPDATED CALL
    const price = calculatePrice(com.basePrice, itemEntry.priceMod, itemEntry.id, currentTradeContext.locationData.name, currentTradeContext.mode);
    
    let qty = parseInt(document.getElementById('tradeQtyInput').value);
    if (isNaN(qty) || qty < 1) qty = 1;
    currentTradeQty = qty;

    document.getElementById('tradeUnitPrice').textContent = `${price}c`;
    
    if (currentTradeContext.mode === 'buy') {
        document.getElementById('tradeStock').textContent = `${itemEntry.stock} (Cap: ${PLAYER_CARGO_CAPACITY - currentCargoLoad})`;
    } else {
        document.getElementById('tradeStock').textContent = `${playerCargo[itemEntry.id] || 0} (Demand: ${itemEntry.stock})`;
    }

    const total = price * qty;
    const totalEl = document.getElementById('tradeTotalCost');
    totalEl.textContent = total;

    if (currentTradeContext.mode === 'buy' && total > playerCredits) {
        totalEl.style.color = '#FF4444';
        document.getElementById('tradeConfirmBtn').disabled = true;
    } else {
        totalEl.style.color = '#00E0E0';
        document.getElementById('tradeConfirmBtn').disabled = false;
    }
}

function adjustTradeQty(delta) {
    const input = document.getElementById('tradeQtyInput');
    let val = parseInt(input.value) || 0;
    val = Math.max(1, val + delta);
    input.value = val;
    updateTradeTotal();
}

function setTradeMax() {
    if (currentTradeItemIndex === -1) return;
    const itemEntry = currentTradeContext.items[currentTradeItemIndex];
    const com = COMMODITIES[itemEntry.id];
    
    // UPDATED CALL
    const price = calculatePrice(com.basePrice, itemEntry.priceMod, itemEntry.id, currentTradeContext.locationData.name, currentTradeContext.mode);
    
    let max = 0;
    
    if (currentTradeContext.mode === 'buy') {
        const afford = Math.floor(playerCredits / price);
        const space = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        max = Math.min(itemEntry.stock, afford, space);
    } else {
        const have = playerCargo[itemEntry.id] || 0;
        max = Math.min(have, itemEntry.stock); 
    }

    document.getElementById('tradeQtyInput').value = Math.max(1, max);
    updateTradeTotal();
}

 function handleTradeSelection(input) {
     if (!currentTradeContext || currentTradeContext.step !== 'selectItem') return;
     const lD = currentTradeContext.locationData;
     const items = currentTradeContext.mode === 'buy' ? lD.sells : lD.buys;
     const sel = parseInt(input);
     if (isNaN(sel) || sel < 1 || sel > items.length) {
         logMessage("Invalid selection. # or 'L'.");;
         return;
     }
     currentTradeContext.itemIndex = sel - 1;
     currentTradeContext.step = 'selectQuantity';

     let promptMsg = getTradeQuantityPromptBaseMessage();
     // Updated prompt text:
     promptMsg += "Enter quantity, or type 'm' for MAX. ('0' to cancel)";
     currentQuantityInput = "";
     logMessage(promptMsg);
 }

/**
  * Processes the player's quantity input during a trade transaction.
  * Now includes Toast Notifications and improved validation.
  * @param {string} inputString - The numerical string entered by the player.
  */

function handleTradeQuantity(inputString) {
     if (!currentTradeContext || currentTradeContext.step !== 'selectQuantity') return;

     const locationData = currentTradeContext.locationData;
     const tradeMode = currentTradeContext.mode;
     const itemsList = tradeMode === 'buy' ? locationData.sells : locationData.buys;
     const itemEntry = itemsList[currentTradeContext.itemIndex];
     const commodityID = itemEntry.id;
     const commodity = COMMODITIES[commodityID];

     // UPDATED CALL
     const price = calculatePrice(commodity.basePrice, itemEntry.priceMod, commodityID, locationData.name, tradeMode);

     let qty = 0;

     if (inputString.toLowerCase() === 'm' || inputString.toLowerCase() === 'max') {
         if (tradeMode === 'buy') {
             const affordMax = Math.floor(playerCredits / price);
             const spaceMax = PLAYER_CARGO_CAPACITY - currentCargoLoad;
             qty = Math.min(itemEntry.stock, affordMax, spaceMax);
         } else {
             const playerHas = playerCargo[commodityID] || 0;
             qty = Math.min(playerHas, itemEntry.stock);
         }
     } else {
         qty = parseInt(inputString);
     }

     currentQuantityInput = ""; 

     if (isNaN(qty) || qty <= 0) {
         logMessage("Transaction canceled.");
         return;
     }

     let finalMessage = "";

     if (tradeMode === 'buy') {
         const totalCost = price * qty;

         if (qty > itemEntry.stock) {
             finalMessage = "Purchase failed: Not enough stock.";
             if (typeof showToast === "function") showToast("STOCK ERROR: Insufficient Supply", "error");
         } else if (totalCost > playerCredits) {
             finalMessage = "Purchase failed: Insufficient credits.";
             if (typeof showToast === "function") showToast("CREDIT ERROR: Insufficient Funds", "error");
         } else if (currentCargoLoad + qty > PLAYER_CARGO_CAPACITY) {
             finalMessage = "Purchase failed: Cargo hold full.";
             if (typeof showToast === "function") showToast("CARGO ERROR: Hold Capacity Exceeded", "error");
         } else {
             // --- BUY SUCCESS ---
             playerCredits -= totalCost;
             playerCargo[commodityID] = (playerCargo[commodityID] || 0) + qty;
             itemEntry.stock -= qty;
             updateCurrentCargoLoad();
             
             finalMessage = `Purchased ${qty} ${commodity.name} for ${totalCost}c.`;
             
             if (typeof showToast === "function") {
                 showToast(`ACQUIRED: ${qty}x ${commodity.name}<br><span style='font-size:12px'>-${totalCost} Credits</span>`, "success");
             }

             if (commodityID === 'WAYFINDER_CORE' && !mystery_first_nexus_location) {
                 const dist = 500 + Math.floor(seededRandom(WORLD_SEED) * 500);
                 const angle = seededRandom(WORLD_SEED + 1) * Math.PI * 2;
                 const nexusX = Math.floor(Math.cos(angle) * dist);
                 const nexusY = Math.floor(Math.sin(angle) * dist);
                 mystery_first_nexus_location = { x: nexusX, y: nexusY };
                 unlockLoreEntry("MYSTERY_WAYFINDER_QUEST_COMPLETED");
                 finalMessage += "\n\n<span style='color:#40E0D0; font-weight:bold;'>! ARTIFACT ACTIVATED !</span>\nThe Wayfinder Core hums violently! Coordinates projected into navigation computer.";
                 logMessage(finalMessage); 
                 return; 
             }
         }

     } else {
         // --- SELL LOGIC ---
         const playerHas = playerCargo[commodityID] || 0;

         if (qty > playerHas) {
             finalMessage = `Sale failed: You only have ${playerHas}.`;
             if (typeof showToast === "function") showToast("INVENTORY ERROR: Item Not Found", "error");
         } else if (qty > itemEntry.stock) {
             finalMessage = `Sale failed: Station only wants ${itemEntry.stock}.`;
             if (typeof showToast === "function") showToast("DEMAND ERROR: Station Limit Reached", "error");
         } else {
             // --- SELL SUCCESS ---
             const totalGain = price * qty;
             playerCredits += totalGain;
             playerCargo[commodityID] -= qty;
             itemEntry.stock -= qty;
             updateCurrentCargoLoad();
             
             finalMessage = `Sold ${qty} ${commodity.name} for ${totalGain}c.`;
             
             if (typeof showToast === "function") {
                 showToast(`SOLD: ${qty}x ${commodity.name}<br><span style='font-size:12px'>+${totalGain} Credits</span>`, "success");
             }

             const profitPerUnit = price - commodity.basePrice;
             if (profitPerUnit > 0) {
                 const xpGained = Math.floor(profitPerUnit * qty * XP_PER_PROFIT_UNIT);
                 if (xpGained > 0) {
                     playerXP += xpGained;
                     updatePlayerNotoriety(Math.floor(totalGain / 500));
                     finalMessage += `\n<span style='color:#00FF00;'>+${xpGained} XP (Profitable)!</span>`;
                 }
             }
         }
     }

     logMessage(finalMessage);
     checkLevelUp();
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

     // Call all "per-tick" updates here
     regenerateShields(timeAmount);

     // In the future, this could also handle mission timers, etc.
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
    
    // 4. Trigger Perk Selection UI
    soundManager.playTone(600, 'sine', 0.1); 
    setTimeout(() => soundManager.playTone(800, 'sine', 0.2), 100);
    
    changeGameState('level_up'); // We use string literal if you haven't updated const yet
    renderLevelUpScreen();
    
    return true;
}

function renderLevelUpScreen() {
    const overlay = document.getElementById('levelUpOverlay');
    const container = document.getElementById('perkCardsContainer');
    container.innerHTML = '';
    
    // 1. Get 3 Random Perks (that we don't already have)
    const availablePerks = Object.values(PERKS_DATABASE).filter(p => !playerPerks.has(p.id));
    
    // Shuffle
    const shuffled = availablePerks.sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);
    
    // 2. Render Cards (Using CSS Classes now!)
    choices.forEach(perk => {
        const card = document.createElement('div');
        card.className = 'perk-card'; // <--- The magic class
        
        card.innerHTML = `
            <div class="perk-icon">${perk.icon}</div>
            <h3 class="perk-title">${perk.name}</h3>
            <p class="perk-desc">${perk.description}</p>
            <div class="perk-category">${perk.category} Class</div>
        `;
        
        // Remove the inline .onmouseover/.onmouseout overrides so CSS can handle hover states
        
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
}

function getFactionAtSector(sectorX, sectorY) {
    // Use a unique seed for faction generation
    const seed = WORLD_SEED + (sectorX * 31337) + (sectorY * 0xCAFEBABE);
    const value = seededRandom(seed);

    if (value < 0.15) return "KTHARR";
    if (value < 0.30) return "CONCORD";
    if (value > 0.85) return "VOID_VULTURES"; // Pirate space!
    return "INDEPENDENT"; // Most space is unclaimed
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

// Quick tweak for startCombat inside script.js
function startCombat(specificEnemyEntity = null) {
     let pirateShip;
     
     if (specificEnemyEntity && specificEnemyEntity.shipClassKey) {
         pirateShip = PIRATE_SHIP_CLASSES[specificEnemyEntity.shipClassKey];
     } else {
         // Fallback to random
         const pirateShipOutcomes = Object.values(PIRATE_SHIP_CLASSES).filter(s => !s.id.includes('KTHARR') && !s.id.includes('CONCORD'));
         pirateShip = getWeightedRandomOutcome(pirateShipOutcomes);
     }

     playerAbilityCooldown = 0;

     // --- Calculate Distance from Start (0,0) ---
     // We use the Pythagorean theorem: a^2 + b^2 = c^2
     const distanceFromCenter = Math.sqrt((playerX * playerX) + (playerY * playerY));

     // Scaling Factor: Every 50 tiles (approx 1 sector), enemies get slightly stronger
     const difficultyMultiplier = 1 + (distanceFromCenter / 200);

     // --- Apply Scaling to Enemy Stats ---
     const baseHull = pirateShip.baseHull + Math.floor(Math.random() * 10) - 5;
     const baseShields = pirateShip.baseShields + Math.floor(Math.random() * 10) - 5;

     const scaledHull = Math.floor(baseHull * difficultyMultiplier);
     const scaledShields = Math.floor(baseShields * difficultyMultiplier);

     currentCombatContext = {
         ship: pirateShip,
         pirateShields: Math.max(10, scaledShields),
         pirateMaxShields: Math.max(10, scaledShields),
         pirateHull: Math.max(20, scaledHull),
         pirateMaxHull: Math.max(20, scaledHull),
         // Save the multiplier to scale rewards later
         difficultyMultiplier: difficultyMultiplier
     };

     const taunts = ["Your cargo or your life, spacer!", "Heh, fresh meat for the void!", "This sector is ours! Pay the toll!"];
     const pirateTaunt = taunts[Math.floor(Math.random() * taunts.length)];

     changeGameState(GAME_STATES.COMBAT);

     // Dynamic message based on difficulty
     let encounterMsg = `"${pirateTaunt}"\nHostile Pirate encountered!`;
     if (difficultyMultiplier > 1.5) encounterMsg += "\n<span style='color:#FF5555'>Warning: Deep Space Threat Detected!</span>";

     logMessage(encounterMsg);
 }

function handleCombatAction(action) {
    if (!currentCombatContext) return;

    let combatLog = "";
    let enemyAttacks = true; // Default: Enemy gets to attack this turn

    // --- Player's Turn ---
    if (action === 'fight') {
        const weaponStats = COMPONENTS_DATABASE[playerShip.components.weapon].stats;
        let damageDealt = weaponStats.damage;

        // --- PERK HOOK ---
        if (playerPerks.has('WEAPON_OVERCLOCK')) {
            damageDealt = Math.floor(damageDealt * 1.15); // +15%
        }

        let currentHitChance = weaponStats.hitChance;

        // Check for Charge Buff
        if (playerIsChargingAttack) {
            damageDealt = Math.floor(damageDealt * CHARGE_DAMAGE_MULTIPLIER);
            currentHitChance += CHARGE_HIT_BONUS;
            combatLog += "Charged shot unleashed! ";
            playerIsChargingAttack = false; // Consume charge
        }

        if (Math.random() < currentHitChance) {
            soundManager.playLaser();
            let actualDamage = damageDealt;

            // Apply Shield Bonus (if applicable)
            if (currentCombatContext.pirateShields > 0) {
                actualDamage += (weaponStats.vsShieldBonus || 0);
            }

            // Haptic Feedback for Hit
            if (typeof triggerHaptic === "function") triggerHaptic(50);

            // Apply Damage to Enemy
            if (currentCombatContext.pirateShields > 0) {
                const shieldDamage = actualDamage;
                currentCombatContext.pirateShields -= shieldDamage;
                combatLog += `Hit pirate shields for ${Math.floor(shieldDamage)}!`;

                if (currentCombatContext.pirateShields < 0) {
                    const spilloverDamage = Math.abs(currentCombatContext.pirateShields);
                    const hullDamage = Math.floor(spilloverDamage * HULL_DAMAGE_BONUS_MULTIPLIER);

                    currentCombatContext.pirateHull -= hullDamage;
                    currentCombatContext.pirateShields = 0;
                    combatLog += ` Shields down! Hull takes ${hullDamage} spillover damage!`;
                }
            } else {
                actualDamage = Math.floor(actualDamage * HULL_DAMAGE_BONUS_MULTIPLIER);
                currentCombatContext.pirateHull -= actualDamage;
                combatLog += `Hit pirate hull for ${actualDamage}!`;
            }
        } else {
            combatLog += "Your attack missed!";
        }

    } else if (action === 'ability') {
        if (playerAbilityCooldown > 0) {
            logMessage("Ability is on cooldown!");
            return;
        }

        const ability = SHIP_CLASSES[playerShip.shipClass].ability;
        playerAbilityCooldown = ability.cooldown; // Set cooldown
        
        combatLog += `<span style='color:#FFD700'>ABILITY ACTIVATED: ${ability.name}!</span> `;
        
        // Haptic Feedback for Ability
        if (typeof triggerHaptic === "function") triggerHaptic([50, 50, 50]);

        soundManager.playAbilityActivate();

        // Execute Specific Ability Effect
        if (ability.id === 'REPAIR') {
            const heal = 25;
            playerHull = Math.min(MAX_PLAYER_HULL, playerHull + heal);
            combatLog += `Emergency patches applied. Hull +${heal}. `;
        } 
        else if (ability.id === 'DODGE') {
            playerIsEvading = true; 
            combatLog += `Engaging max thrusters! Evasion protocols maximized. `;
        } 
        else if (ability.id === 'STUN') {
            enemyAttacks = false; // CRITICAL: Skips enemy turn below
            combatLog += `Target sensors blinded! They cannot fire this turn. `;
        } 
        else if (ability.id === 'CRIT') {
            const dmg = 40; // Flat burst damage
            currentCombatContext.pirateHull -= dmg;
            combatLog += `Systems overloaded! Dealt ${dmg} direct damage! `;
        } 
        else if (ability.id === 'SHIELD_BOOST') {
            playerShields = MAX_SHIELDS;
            combatLog += `Shield generator overcharged. Shields at 100%. `;
        } 
        else if (ability.id === 'ESCAPE') {
            logMessage("Diplomatic protocols engaged. Hostilities ceased.");
            currentCombatContext = null;
            changeGameState(GAME_STATES.GALACTIC_MAP);
            handleInteraction();
            return; // Exit function immediately
        } 
        else if (ability.id === 'DEFENSE_UP') {
            playerShields = Math.min(MAX_SHIELDS, playerShields + 20);
            playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 20);
            combatLog += `Structural integrity reinforced. (+20 Shield/Hull) `;
        }

    } else if (action === 'hail') {
        // --- DIPLOMATIC HAIL LOGIC ---
        let faction = "PIRATE";
        // We assume the ship ID (e.g. "KTHARR_SCOUT") tells us the faction
        const shipId = currentCombatContext.ship.id || "PIRATE";
        
        if (shipId.includes("KTHARR")) faction = "KTHARR";
        else if (shipId.includes("CONCORD")) faction = "CONCORD";
        
        const standing = playerFactionStanding[faction] || 0;
        
        combatLog += "Open channel: ";

        if (faction === "PIRATE") {
            combatLog += "\"Save your breath, spacer. Only credits talk here!\" (Diplomacy Failed)";
        } 
        else if (standing > 20) {
            // SUCCESS
            combatLog += "\"Visual ID confirmed. Apologies, Commander. We did not recognize you.\" ";
            combatLog += "<span style='color:#00FF00'>Hostiles disengaging.</span>";
            
            // End Combat Peacefully
            currentCombatContext = null;
            changeGameState(GAME_STATES.GALACTIC_MAP);
            handleInteraction();
            return; // Exit immediately
        } 
        else if (standing > -10) {
            // NEUTRAL
            combatLog += "\"You have no authority here. Prepare to be boarded.\" (Standing too low)";
        } 
        else {
            // HATED
            combatLog += "\"You! The High Command has a price on your head! DIE!\" ";
            // Buff the enemy for making them mad
            currentCombatContext.difficultyMultiplier += 0.2;
            combatLog += "(Enemy Enraged: Damage +20%)";
        }
        
        // Hailing takes a turn, so the enemy still attacks!
        enemyAttacks = true; 

    } else if (action === 'charge') {
        playerIsChargingAttack = true;
        combatLog += "Charging weapon systems...";
        enemyAttacks = true; 
    } else if (action === 'evade') {
        playerFuel -= EVASION_FUEL_COST;
        playerFuel = parseFloat(playerFuel.toFixed(1));
        playerIsEvading = true;
        combatLog += `Attempting evasive maneuvers...`;
    } else if (action === 'run') {
        playerFuel -= RUN_FUEL_COST;
        playerFuel = parseFloat(playerFuel.toFixed(1));
        
        if (Math.random() < RUN_ESCAPE_CHANCE) {
            logMessage(`Escaped! Used ${RUN_FUEL_COST} fuel.`);
            updatePlayerNotoriety(-1);

            // FIX: Remove the enemy entity from the map so we don't immediately collide again
            removeEnemyAt(playerX, playerY);

            currentCombatContext = null;
            playerIsChargingAttack = false;
            playerIsEvading = false;
            
            changeGameState(GAME_STATES.GALACTIC_MAP);
            handleInteraction();
            return;
        } else {
            combatLog += `Failed to escape!`;
        }
    }

    logMessage(combatLog);

    // --- Check for Player Victory ---
    if (currentCombatContext.pirateHull <= 0) {
        const mult = currentCombatContext.difficultyMultiplier || 1.0;

        const baseCredits = PIRATE_CREDIT_REWARD_MIN + Math.floor(Math.random() * (PIRATE_CREDIT_REWARD_MAX - PIRATE_CREDIT_REWARD_MIN + 1));
        const baseXP = XP_PER_PIRATE_MIN + Math.floor(Math.random() * (XP_PER_PIRATE_MAX - XP_PER_PIRATE_MIN + 1));

        const cW = Math.floor(baseCredits * mult);
        const xG = Math.floor(baseXP * mult);

        playerCredits += cW;
        playerXP += xG;
        updatePlayerNotoriety(5);

        spawnParticles(playerX, playerY, 'explosion');

        soundManager.playExplosion();

        setTimeout(() => spawnParticles(playerX, playerY, 'explosion'), 200);
        setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 400);

        let victoryLog = `Pirate defeated! Salvaged ${cW}c. Gained ${xG} XP.`;
        if (mult > 1.2) victoryLog += " (Deep Space Bonus!)";
        
        let toastHTML = `<strong>TARGET DESTROYED</strong><br>`;
        toastHTML += `<span style="color:#FFD700">+${cW} Credits</span><br>`;
        toastHTML += `<span style="font-size:12px">+${xG} XP</span>`;
        if (typeof showToast === "function") showToast(toastHTML, "success");

        if (playerActiveMission && playerActiveMission.type === "BOUNTY" && !playerActiveMission.isComplete) {
            let objectiveUpdated = false;
            playerActiveMission.objectives.forEach((obj, index) => {
                if (obj.type === "ELIMINATE") {
                    const progressKey = `eliminate_${index}`;
                    const objectiveProgress = playerActiveMission.progress[progressKey];

                    if (objectiveProgress && !objectiveProgress.complete) {
                        objectiveProgress.current++;
                        victoryLog += `\n<span style='color:#00FF00;'>Bounty Updated: (${objectiveProgress.current}/${objectiveProgress.required})</span>`;
                        if (typeof showToast === "function") showToast(`BOUNTY UPDATE: ${objectiveProgress.current}/${objectiveProgress.required}`, "info");
                        
                        if (objectiveProgress.current >= objectiveProgress.required) {
                            objectiveProgress.complete = true;
                        }
                        objectiveUpdated = true;
                    }
                }
            });

            if (objectiveUpdated) {
                checkMissionObjectiveCompletion();
            }
        }

        currentCombatContext = null;
        playerIsChargingAttack = false;
        playerIsEvading = false;
        // Reset Cooldown on Victory
        playerAbilityCooldown = 0; 
        
        logMessage(victoryLog);
        checkLevelUp();
        changeGameState(GAME_STATES.GALACTIC_MAP);
        handleInteraction();
        renderMissionTracker();
        return;
    }

    // --- Enemy's Turn ---
    let enemyLog = "";
    if (enemyAttacks) {
        let pirateEffectiveHitChance = PIRATE_HIT_CHANCE;
        
        // If player is evading (either via 'Evade' action or 'Afterburner' ability)
        if (playerIsEvading) {
            pirateEffectiveHitChance -= EVASION_DODGE_BONUS;
        }
        
        if (Math.random() < pirateEffectiveHitChance) {
            const mult = currentCombatContext.difficultyMultiplier || 1.0;
            const baseDamage = PIRATE_ATTACK_DAMAGE_MIN + Math.floor(Math.random() * (PIRATE_ATTACK_DAMAGE_MAX - PIRATE_ATTACK_DAMAGE_MIN + 1));
            let pD = Math.floor(baseDamage * mult); 
            
            // Heavy Haptic for taking damage
            if (typeof triggerHaptic === "function") triggerHaptic([100, 50, 100]);

            soundManager.playExplosion();

            if (playerIsEvading) enemyLog += "Pirate hits through your maneuvers! ";
            else enemyLog += "Pirate attack hits! ";

            if (playerShields > 0) {
                playerShields -= pD;
                enemyLog += `Shields take ${pD} damage.`;
                if (playerShields < 0) {
                    const spillOver = Math.abs(playerShields);
                    playerHull -= spillOver;
                    playerShields = 0;
                    enemyLog += ` Shields down! Hull takes ${spillOver} damage!`;
                    
                    // Visual Juice
                    if (typeof triggerDamageEffect === "function") triggerDamageEffect();
                }
            } else {
                playerHull -= pD;
                enemyLog += `Hull takes ${pD} damage!`;
                
                // Visual Juice
                if (typeof triggerDamageEffect === "function") triggerDamageEffect();
            }
        } else {
            enemyLog += "Pirate attack missed!";
        }
        logMessage(enemyLog);
    }
    
    // Reset Evasion for next turn
    playerIsEvading = false;

    // --- Cooldown Tick ---
    if (playerAbilityCooldown > 0) {
        playerAbilityCooldown--;
    }

    // --- Check for Player Defeat ---
    if (playerHull <= 0) {
        playerHull = 0;
        renderUIStats(); 
        
        logMessage(`Critical Hit! Hull failing... signal lost.`, "color: #FF4444");
        triggerGameOver("Destruction by Hostile Fire");
        return; 
    }

    render();
}

 // --- Shipyard Functions ---

// --- Shipyard Functions (With Comma Support) ---

function displayShipyard() {
    const location = chunkManager.getTile(playerX, playerY);
    if (!location.isMajorHub) { logMessage("Shipyard unavailable."); return; }

    openGenericModal(`${location.name} SHIPYARD`);
    
    const listEl = document.getElementById('genericModalList');
    
    // Populate List
    Object.keys(SHIP_CLASSES).forEach(shipId => {
        if(shipId === playerShip.shipClass) return; // Skip current
        
        const ship = SHIP_CLASSES[shipId];
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        // ADDED: formatNumber for the base cost
        row.innerHTML = `<span>${ship.name}</span> <span>${formatNumber(ship.baseCost)}c</span>`;
        row.onclick = () => showShipDetails(shipId);
        listEl.appendChild(row);
    });
}

function showShipDetails(shipId) {
    const ship = SHIP_CLASSES[shipId];
    const oldShip = SHIP_CLASSES[playerShip.shipClass];
    const tradeIn = Math.floor(oldShip.baseCost * 0.5);
    const cost = ship.baseCost - tradeIn;
    
    // ADDED: formatNumber for all numeric labels
    let html = `
        <h3 style="color:var(--accent-color)">${ship.name}</h3>
        <p>${ship.description}</p>
        <div class="trade-math-area">
            <div class="trade-stat-row"><span>Hull:</span> <span>${formatNumber(ship.baseHull)}</span></div>
            <div class="trade-stat-row"><span>Cargo:</span> <span>${formatNumber(ship.cargoCapacity)}</span></div>
            <div class="trade-stat-row"><span>Base Cost:</span> <span>${formatNumber(ship.baseCost)}c</span></div>
            <div class="trade-stat-row" style="color:#888"><span>Trade-In:</span> <span>-${formatNumber(tradeIn)}c</span></div>
            <div class="total-cost-display">NET COST: ${formatNumber(cost)}c</div>
        </div>
    `;
    
    document.getElementById('genericDetailContent').innerHTML = html;
    
    const btnHtml = `
        <button class="action-button" ${playerCredits >= cost ? '' : 'disabled'} 
            onclick="confirmBuyShip('${shipId}', ${cost})">
            ${playerCredits >= cost ? 'PURCHASE VESSEL' : 'INSUFFICIENT FUNDS'}
        </button>
    `;
    document.getElementById('genericModalActions').innerHTML = btnHtml;
}

function confirmBuyShip(shipId, cost) {
    if(playerCredits < cost) return;
    
    playerCredits -= cost;
    playerShip.shipClass = shipId;
    
    // Reset components to defaults
     playerShip.components = {
         weapon: "WEAPON_PULSE_LASER_MK1",
         shield: "SHIELD_BASIC_ARRAY_A",
         engine: "ENGINE_STD_DRIVE_MK1",
         scanner: "SCANNER_BASIC_SUITE",
         utility: "UTIL_NONE"
     };

    applyPlayerShipStats();
    playerHull = MAX_PLAYER_HULL; //
    playerShields = MAX_SHIELDS; //
    playerFuel = MAX_FUEL; //
    
    soundManager.playUIClick();
    showToast("VESSEL PURCHASED", "success");
    closeGenericModal();
    renderUIStats();
    openStationView(); // Refresh station hub
}

 function triggerDamageEffect() {
    // 1. Shake the screen
    const app = document.getElementById('app-container');
    app.classList.remove('shake-effect'); // Reset
    void app.offsetWidth; // Force reflow (magic trick to restart animation)
    app.classList.add('shake-effect');

    // 2. Red Flash
    const flash = document.getElementById('damageFlash');
    if(flash) {
        flash.style.opacity = '1';
        setTimeout(() => { flash.style.opacity = '0'; }, 100);
    }
}

 function displayShipPurchaseConfirmation(shipId) {
     const ship = SHIP_CLASSES[shipId];
     const oldShip = SHIP_CLASSES[playerShip.shipClass];
     const tradeInValue = Math.floor(oldShip.baseCost * 0.5); // Trade-in is 50% of old ship's base cost
     const finalCost = ship.baseCost - tradeInValue;

     currentShipyardContext.step = 'confirmPurchase';
     currentShipyardContext.selectedShipId = shipId;

     let confirmMsg = `--- Purchase Confirmation ---\n\n`;
     confirmMsg += `Ship: ${ship.name}\n`;
     confirmMsg += `Cost: ${ship.baseCost}c\n`;
     confirmMsg += `Trade-in (${oldShip.name}): -${tradeInValue}c\n`;
     confirmMsg += `---------------------------\n`;
     confirmMsg += `Final Cost: ${finalCost}c\n\n`;

     if (playerCredits < finalCost) {
         confirmMsg += `<span style='color:#FF5555;'>You cannot afford this ship.</span>\n`;
     } else {
         confirmMsg += `Purchase this ship? Your current ship and all components will be traded in. (Y/N)`;
     }

     confirmMsg += "\n\n(L) to return to the shipyard list.";
     logMessage(confirmMsg);;
 }

function visitCantina() {
    const cost = 10;
    if (playerCredits < cost) {
        logMessage("Bartender: \"No credits, no service.\"");
        return;
    }
    playerCredits -= cost;

    // Small Heal/Refuel
    if (playerHull < MAX_PLAYER_HULL) playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 5);
    if (playerFuel < MAX_FUEL) playerFuel = Math.min(MAX_FUEL, playerFuel + 10);

    // --- NEW: GENERATE MARKET RUMOR ---
    // 50% chance to get a valuable trade tip
    if (Math.random() < 0.5) {
        // Find a random location that isn't here
        const locationKeys = Object.keys(LOCATIONS_DATA).filter(k => k !== chunkManager.getTile(playerX, playerY).name);
        const targetStation = locationKeys[Math.floor(Math.random() * locationKeys.length)];
        
        // Pick a random legal commodity
        const commodityKeys = Object.keys(COMMODITIES).filter(k => !COMMODITIES[k].illegal);
        const targetItem = commodityKeys[Math.floor(Math.random() * commodityKeys.length)];
        
        // Set the Global Trend
        activeMarketTrend = {
            station: targetStation,
            item: targetItem,
            expiry: currentGameDate + 50 // Valid for 50 ticks
        };

        logMessage(`<span class="cantina-header">Cantina Visit (-${cost}c)</span>`);
        logMessage(`Bartender whispers: "Big demand at <strong>${targetStation}</strong>. They're paying double for <strong>${COMMODITIES[targetItem].name}</strong> right now."`);
        showToast("TRADE INTEL ACQUIRED", "success");
    } else {
        // Standard Flavor Text
        const randomRumor = RUMORS[Math.floor(Math.random() * RUMORS.length)];
        logMessage(`<span class="cantina-header">Cantina Visit (-${cost}c)</span>`);
        logMessage(`<span class="rumor-text">"${randomRumor}"</span>`);
    }

    renderUIStats();
}

 /**
  * Handles the logic for repairing the player's ship hull at a station.
  */

function repairShip() {
     if (playerHull >= MAX_PLAYER_HULL) {
         logMessage("Hull is already at maximum integrity.");
         showToast("SYSTEMS NOMINAL", "info");
         return;
     }

     const hullToRepair = MAX_PLAYER_HULL - playerHull;
     const totalCost = Math.ceil(hullToRepair * HULL_REPAIR_COST_PER_POINT);

     if (playerCredits < totalCost) {
         logMessage(`Cannot afford full repairs. Cost: ${totalCost}c, You have: ${playerCredits}c.`);
         showToast("INSUFFICIENT FUNDS", "error");
         return;
     }

     playerCredits -= totalCost;
     playerHull = MAX_PLAYER_HULL;

     logMessage(`Ship hull repaired for ${totalCost} credits.`);
     showToast(`HULL REPAIRED<br>-${totalCost} Credits`, "success");

     handleInteraction();
     renderUIStats();
 }

 function buyShip() {
     if (!currentShipyardContext || currentShipyardContext.step !== 'confirmPurchase') return;

     const shipId = currentShipyardContext.selectedShipId;
     const ship = SHIP_CLASSES[shipId];
     const oldShip = SHIP_CLASSES[playerShip.shipClass];

     // 1. Calculate Ship Hull Trade-in
     let tradeInValue = Math.floor(oldShip.baseCost * 0.5);

     // 2. Calculate Components Trade-in (NEW)
     // We refund 50% of the value of all installed components
     let componentsRefund = 0;
     for (const slot in playerShip.components) {
         const compId = playerShip.components[slot];
         const compData = COMPONENTS_DATABASE[compId];
         if (compData && compData.cost > 0) {
             componentsRefund += Math.floor(compData.cost * 0.5);
         }
     }
     tradeInValue += componentsRefund;

     const finalCost = ship.baseCost - tradeInValue;

     if (playerCredits < finalCost) {
         logMessage(`Purchase failed: Insufficient credits. (Need ${finalCost}c)`);
         displayShipyard();
         return;
     }

     playerCredits -= finalCost;
     playerShip.shipClass = shipId;

     // Reset components to defaults
     playerShip.components = {
         weapon: "WEAPON_PULSE_LASER_MK1",
         shield: "SHIELD_BASIC_ARRAY_A",
         engine: "ENGINE_STD_DRIVE_MK1",
         scanner: "SCANNER_BASIC_SUITE"
     };

     applyPlayerShipStats();
     playerHull = MAX_PLAYER_HULL;
     playerShields = MAX_SHIELDS;
     playerFuel = MAX_FUEL;

     let successMsg = `Transaction complete! Welcome to your new ${ship.name}!`;
     if (componentsRefund > 0) {
         successMsg += `\n(Includes ${componentsRefund}c refund for old components)`;
     }

     logMessage(successMsg);
     currentShipyardContext = null;
     handleInteraction();
 }

 // --- Outfitting Functions ---

 // --- OVERRIDE: OUTFITTING ---
function displayOutfittingScreen() {
    openGenericModal("OUTFITTING SERVICES");
    const listEl = document.getElementById('genericModalList');
    
    const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
    
    slots.forEach(slot => {
        const currentId = playerShip.components[slot];
        const currentName = COMPONENTS_DATABASE[currentId].name;
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.fontWeight = 'bold';
        row.innerHTML = `<span style="color:var(--accent-color)">${slot.toUpperCase()} SLOT</span> <span style="font-size:10px">${currentName}</span>`;
        row.onclick = () => showOutfittingOptions(slot);
        listEl.appendChild(row);
    });
}

function showOutfittingOptions(slot) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    
    // Use standard border color so it shows in both modes
    detailEl.innerHTML = `<h4 style="border-bottom:1px solid var(--border-color); padding-bottom:5px;">Available ${slot} Upgrades</h4>`;
    actionsEl.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.maxHeight = '300px';
    container.style.overflowY = 'auto';
    
    for (const compId in COMPONENTS_DATABASE) {
        const comp = COMPONENTS_DATABASE[compId];
        if (comp.slot === slot && playerShip.components[slot] !== compId) {
            
            const itemDiv = document.createElement('div');
            itemDiv.style.padding = '10px';
            itemDiv.style.borderBottom = '1px solid var(--border-color)';
            itemDiv.style.cursor = 'pointer';
            
            // --- FIX: Use CSS Variables instead of hardcoded #FFF and #FFD700 ---
            itemDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between">
                    <span style="color:var(--item-name-color); font-weight:bold;">${comp.name}</span>
                    <span style="color:var(--gold-text)">${formatNumber(comp.cost)}c</span>
                </div>
                <div style="font-size:11px; color:var(--item-desc-color)">${comp.description}</div>
            `;
            
            itemDiv.onclick = () => {
                // Update Action Button
                actionsEl.innerHTML = `
                    <button class="action-button" ${playerCredits >= comp.cost ? '' : 'disabled'} 
                        onclick="confirmBuyComponent('${compId}')">
                        INSTALL ${comp.name.toUpperCase()} (${formatNumber(comp.cost)}c)
                    </button>
                `;
                
                // Optional: Highlight selected item logic could go here
            };
            container.appendChild(itemDiv);
        }
    }
    
    if(container.children.length === 0) {
        container.innerHTML = "<p style='color:var(--item-desc-color)'>No upgrades available for this slot.</p>";
    }
    
    detailEl.appendChild(container);
}

function confirmBuyComponent(compId) {
    const comp = COMPONENTS_DATABASE[compId];
    if(playerCredits < comp.cost) return;
    
    playerCredits -= comp.cost;
    playerShip.components[comp.slot] = compId;
    applyPlayerShipStats();
    
    showToast("COMPONENT INSTALLED", "success");
    displayOutfittingScreen(); // Refresh list
    renderUIStats();
}

 function displayComponentsForSlot(slotType) {
     currentOutfitContext.step = 'selectComponent';
     currentOutfitContext.selectedSlot = slotType;
     let componentMsg = `--- Upgrading ${slotType.toUpperCase()} ---\nAvailable components (Cr: ${playerCredits}):\n`;
     let componentIndex = 1;
     currentOutfitContext.availableComponents = [];
     for (const compId in COMPONENTS_DATABASE) {
         const comp = COMPONENTS_DATABASE[compId];
         if (comp.slot === slotType && playerShip.components[slotType] !== compId) {
             componentMsg += `${componentIndex}. ${comp.name} (${comp.cost}c) - ${comp.description}\n`;
             componentMsg += `   Stats: `;
             let statsStr = [];
             for (const stat in comp.stats) {
                 statsStr.push(`${stat}: ${comp.stats[stat]}`);
             }
             componentMsg += statsStr.join(', ') + "\n";
             currentOutfitContext.availableComponents.push({
                 id: compId,
                 ...comp
             }); // Store ID with component
             componentIndex++;
         }
     }
     if (currentOutfitContext.availableComponents.length === 0) {
         componentMsg += "No other upgrades currently available for this slot.\n";
     }
     componentMsg += "Enter # to purchase, or 'L' to go back.";
     logMessage(componentMsg);;
 }

 function buyComponent(selectedComponentId) {
     const component = COMPONENTS_DATABASE[selectedComponentId];
     if (!component) {
         logMessage("Invalid component selection.");
         displayComponentsForSlot(currentOutfitContext.selectedSlot);
         return;
     }
     if (playerCredits < component.cost) {
         logMessage("Not enough credits to purchase " + component.name + ".", true);
         displayComponentsForSlot(currentOutfitContext.selectedSlot);
         return;
     }
     const oldComponent = COMPONENTS_DATABASE[playerShip.components[component.slot]];
     playerCredits -= component.cost;
     playerShip.components[component.slot] = selectedComponentId;
     applyPlayerShipStats();
     unlockLoreEntry(component.loreKey);
     logMessage(`Installed ${component.name}. Old ${oldComponent.name} unequipped.\nCredits: ${playerCredits}`);
     currentOutfitContext = null;
     handleInteraction();;
 }

 // --- Codex Functions ---

 let currentCodexCategory = null;

function toggleCodex(show) {
     if (show) {
         codexOverlayElement.style.display = 'flex';
         renderCodexCategories();
         renderCodexEntries(null);
         codexEntryTextElement.innerHTML = "Select a category, then an entry.";
     } else {
         codexOverlayElement.style.display = 'none';
         currentCodexCategory = null;
     }
     
     // UPDATE BORDERS
     updateSideBorderVisibility();
 }

 function renderCodexCategories() {
     /* Same as v0.6.11 */
     codexCategoriesElement.innerHTML = '';
     const cats = new Set();
     Object.values(LORE_DATABASE).forEach(e => {
         if (discoveredLoreEntries.has(Object.keys(LORE_DATABASE).find(k => LORE_DATABASE[k] === e))) cats.add(e.category);
     });
     Array.from(cats).sort().forEach(cat => {
         const cD = document.createElement('div');
         cD.textContent = cat;
         cD.className = 'codex-list-item';
         if (cat === currentCodexCategory) cD.classList.add('active');
         cD.onclick = () => {
             currentCodexCategory = cat;
             renderCodexCategories();
             renderCodexEntries(cat);
             codexEntryTextElement.innerHTML = "Select an entry.";
         };
         codexCategoriesElement.appendChild(cD);
     });
 }

 function renderCodexEntries(category) {
     /* Same as v0.6.11 */
     codexEntriesElement.innerHTML = '';
     if (!category) return;
     Object.entries(LORE_DATABASE).forEach(([k, e]) => {
         if (e.category === category && discoveredLoreEntries.has(k)) {
             const eD = document.createElement('div');
             eD.textContent = e.title;
             eD.className = 'codex-list-item';
             eD.onclick = () => {
                 codexEntryTextElement.innerHTML = `<strong>${e.title}</strong><hr style="margin:5px 0;border-color:#4a4a6a;"><p>${e.text.replace(/\n/g,'<br>')}</p>`;
                 document.querySelectorAll('#codexEntries .codex-list-item').forEach(el => el.classList.remove('active'));
                 eD.classList.add('active');
             };
             codexEntriesElement.appendChild(eD);
         }
     });
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
     return commodity.id;
 }

 function activateDistressBeacon() {
     if (playerFuel > 0) {
         logMessage("Fuel systems operational. Distress beacon disabled.");
         return;
     }

     if (currentCombatContext) {
         logMessage("Cannot activate beacon during combat!");
         return;
     }

     // The Penalty: 20% of Credits (min 100) and some XP
     const creditPenalty = Math.max(100, Math.floor(playerCredits * 0.20));

     logMessage("Distress Signal broadcasting...");

     setTimeout(() => {
         playerCredits = Math.max(0, playerCredits - creditPenalty);
         playerFuel = Math.floor(MAX_FUEL * 0.5); // Refuel to 50%
         playerXP = Math.max(0, playerXP - 50); // XP Penalty

         logMessage(`<span style="color:#00E0E0">Towing Vessel Arrived.</span>`);
         logMessage(`You were towed to a safe distance and refueled.`);
         logMessage(`Payment deducted: ${creditPenalty} credits.`);

         renderUIStats();
     }, 1500); // Small delay for dramatic effect
 }

 function generateMissionsForStation(stationName) {
    const generatedMissions = [];
    // Filter templates based on player level
    const availableTemplates = MISSION_TEMPLATES.filter(t => playerLevel >= (t.prerequisites.minLevel || 1));
    
    // Determine how many missions we want to generate (2 to 3)
    const numMissionsToGenerate = 2 + Math.floor(Math.random() * 2);

    // FIX: Safety counter to prevent infinite loops if valid missions cannot be generated
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

            // Generate a unique ID
            newMission.id = `${newMission.id_prefix}${attempts}_${Date.now()}`;
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
    const location = chunkManager.getTile(playerX, playerY);
    const stationName = location.name;
    
    if (!MISSIONS_DATABASE[stationName]) {
         MISSIONS_DATABASE[stationName] = generateMissionsForStation(stationName);
    }
    
    openGenericModal("MISSION CONTRACTS");
    
    const listEl = document.getElementById('genericModalList');
    const missions = MISSIONS_DATABASE[stationName];
    
    missions.forEach((mission, index) => {
        if(playerCompletedMissions.has(mission.id)) return;
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        // FormatNumber for the mission credits
        row.innerHTML = `<span>${mission.title}</span> <span style="color:#FFD700">${formatNumber(mission.rewards.credits)}c</span>`;
        row.onclick = () => showMissionDetails(stationName, index);
        listEl.appendChild(row);
    });
    
    if(listEl.children.length === 0) {
        listEl.innerHTML = "<div style='padding:10px'>No contracts available.</div>";
    }
}

function showMissionDetails(stationName, index) {
    const mission = MISSIONS_DATABASE[stationName][index];
    
    let html = `
        <h3 style="color:var(--accent-color)">${mission.title}</h3>
        <p style="font-size:12px; color:#888">Client: ${mission.giver}</p>
        <p>${mission.description}</p>
        <div class="trade-math-area">
            <div class="trade-stat-row"><span>Credits:</span> <span style="color:#FFD700">${formatNumber(mission.rewards.credits)}</span></div>
            <div class="trade-stat-row"><span>XP:</span> <span style="color:#00FF00">${formatNumber(mission.rewards.xp)}</span></div>
        </div>
    `;
    
    document.getElementById('genericDetailContent').innerHTML = html;
    
    const isActive = playerActiveMission !== null;
    const btnHtml = `
        <button class="action-button" ${isActive ? 'disabled' : ''} 
            onclick="confirmAcceptMission('${stationName}', ${index})">
            ${isActive ? 'FINISH CURRENT JOB FIRST' : 'ACCEPT CONTRACT'}
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
         // NEW: Improved, more generic text
         if (obj.type === "ELIMINATE") {
             let locationText = (obj.targetSectorKey === "CURRENT") ? "in this system" : "in any system";
             detailMsg += ` - Eliminate ${obj.count} ${obj.targetName}(s) ${locationText}.\n`;
         } else if (obj.type === "DELIVERY") {
             detailMsg += ` - Deliver ${obj.count} ${COMMODITIES[obj.itemID].name} to ${obj.destinationName}.\n`;
         } else if (obj.type === "SCAN_OBJECT") {
             detailMsg += ` - Scan a ${obj.subtype} ${obj.targetType} in any system.\n`;
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
     const currentLocation = getCombinedLocationData(playerY, playerX);
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
         // No need to call  here, updateMessage will trigger it via handleInteraction or next player input
     }
     return allObjectivesNowComplete;
 }

function grantMissionRewards() {
     if (!playerActiveMission || !playerActiveMission.isComplete) return;
     
     const currentLocation = getCombinedLocationData(playerY, playerX);
     
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
     checkLevelUp();
     handleInteraction();
     renderMissionTracker(); 
     renderUIStats(); 
}

 function triggerRandomEvent() {
     const events = [{
             text: "You spot a drifting fuel canister.",
             effect: () => {
                 const amount = 10 + Math.floor(Math.random() * 20);
                 playerFuel = Math.min(MAX_FUEL, playerFuel + amount);
                 logMessage(`<span style="color:#00E0E0">Lucky Find:</span> Refueled ${amount} units from salvage.`);
             }
         },
         {
             text: "You intercept a fragmented credit transfer.",
             effect: () => {
                 const amount = 25 + Math.floor(Math.random() * 75);
                 playerCredits += amount;
                 logMessage(`<span style="color:var(--gold-text)">Lucky Find:</span> Decrypted ${formatNumber(amount)} credits.`);
             }
         },
         {
             text: "You scan an ancient navigation buoy.",
             effect: () => {
                 const amount = 15;
                 playerXP += amount;
                 logMessage(`<span style="color:#00FF00">Lucky Find:</span> Downloaded nav data. +${amount} XP.`);
                 checkLevelUp();
             }
         }
     ];

     const event = events[Math.floor(Math.random() * events.length)];
     event.effect();

     // We still call handleInteraction so you see where you are (e.g. "Empty Space")
     handleInteraction();
 }

 function handleCodexInput(key) {
     if (key === 'escape' || key === 'j') {
         toggleCodex(false);
     }
     // We always "handle" input when the codex is open
     return true;
 }

// --- VISUAL CARGO SYSTEM ---

let selectedCargoIndex = -1;

function openCargoModal() {
    if (currentTradeContext || currentCombatContext || currentMissionContext) return;

    document.getElementById('cargoOverlay').style.display = 'flex';
    selectedCargoIndex = -1;
    renderCargoList();
    
    document.getElementById('cargoItemName').textContent = "SELECT CARGO";
    document.getElementById('cargoItemDesc').textContent = "Select an item to inspect or jettison.";
    document.getElementById('cargoItemQty').textContent = "-";
    document.getElementById('cargoItemVal').textContent = "-";
    document.getElementById('jettisonBtn').disabled = true;
    
    currentOutfitContext = { step: 'viewingCargo' };

    // UPDATE BORDERS
    updateSideBorderVisibility();
}

function closeCargoModal() {
    document.getElementById('cargoOverlay').style.display = 'none';
    currentOutfitContext = null;
    handleInteraction();

    // UPDATE BORDERS
    updateSideBorderVisibility();
}

function renderCargoList() {
    const listEl = document.getElementById('cargoList');
    listEl.innerHTML = '';
    
    // Convert cargo object to array of keys for easier indexing
    const cargoKeys = Object.keys(playerCargo).filter(key => playerCargo[key] > 0);
    
    if (cargoKeys.length === 0) {
        listEl.innerHTML = '<div style="padding:20px; color:#666;">Cargo Hold Empty</div>';
        return;
    }

    cargoKeys.forEach((key, index) => {
        const item = COMMODITIES[key];
        const qty = playerCargo[key];
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        if (index === selectedCargoIndex) row.classList.add('selected');
        
        row.innerHTML = `<span>${item.name}</span> <span style="color:#888;">x${qty}</span>`;
        
        row.onclick = () => selectCargoItem(index, key);
        listEl.appendChild(row);
    });
}

function selectCargoItem(index, key) {
    selectedCargoIndex = index;
    renderCargoList(); // Update highlight
    
    const item = COMMODITIES[key];
    const qty = playerCargo[key];
    
    document.getElementById('cargoItemName').textContent = item.name;
    document.getElementById('cargoItemDesc').textContent = item.description;
    document.getElementById('cargoItemQty').textContent = qty;
    document.getElementById('cargoItemVal').textContent = `${item.basePrice}c`;
    
    const jetBtn = document.getElementById('jettisonBtn');
    jetBtn.disabled = false;
    jetBtn.onclick = () => jettisonItem(key);
}

function jettisonItem(key) {
    if (playerCargo[key] > 0) {
        playerCargo[key]--;
        updateCurrentCargoLoad();
        
        // Visual updates
        renderCargoList();
        renderUIStats();
        
        // Update detail view or deselect if empty
        if (playerCargo[key] > 0) {
            selectCargoItem(selectedCargoIndex, key);
        } else {
            // Item gone
            selectedCargoIndex = -1;
            document.getElementById('cargoItemName').textContent = "ITEM EJECTED";
            document.getElementById('jettisonBtn').disabled = true;
        }
        
        // Optional: Spawn a particle effect in the background?
        spawnParticles(playerX, playerY, 'mining'); // Reusing mining dust as "trash"
    }
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

 function handleShipyardInput(key) {
     if (currentShipyardContext.step === 'selectShip') {
         const selection = parseInt(key);
         if (!isNaN(selection) && selection > 0 && selection <= currentShipyardContext.availableShips.length) {
             displayShipPurchaseConfirmation(currentShipyardContext.availableShips[selection - 1].id);
         } else if (key === 'l' || key === 'escape') {
             currentShipyardContext = null;
             handleInteraction();
         }
     } else if (currentShipyardContext.step === 'confirmPurchase') {
         if (key === 'y') {
             buyShip();
         } else if (key === 'n' || key === 'l') {
             displayShipyard();
         }
     }
     // We always "handle" input when the shipyard is open
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
                openTradeModal('buy'); // Changed from displayTradeScreen
                return true;
            case 's':
                openTradeModal('sell'); // Changed from displayTradeScreen
                return true;
             case 'o':
                 if (currentLocation.isMajorHub) {
                     displayOutfittingScreen();
                     return true;
                 }
                 break; // Not a major hub, might be a movement key
             case 'k':
                 if (currentLocation.isMajorHub) {
                     displayMissionBoard();
                     return true;
                 }
                 break; // Not a major hub
             case 'y':
                 if (currentLocation.isMajorHub) {
                     displayShipyard();
                     return true;
                 }
                 break; // Not a major hub
            // NEW: Generic Interact Key
             case 'e': 
             case 'enter':
             case 'space':
                // Default to opening Trade, or Shipyard if available
                if (currentLocation.isMajorHub) {
                    displayMissionBoard(); // Opens Mission Board as the "Lobby"
                } else {
                    openTradeModal('buy'); // Outposts just open Trade
                }
                return true;
             case 'c':
                 if (playerActiveMission && playerActiveMission.type === "DELIVERY") {
                     handleCompleteDelivery();
                     return true;
                 }
                 break; // No delivery
             case 'g':
                 if (playerActiveMission && playerActiveMission.isComplete && currentLocation.name === playerActiveMission.giver) {
                     grantMissionRewards();
                     return true;
                 }

                 if (playerActiveMission && playerActiveMission.type === "ACQUIRE" && !playerActiveMission.isComplete && currentLocation.name === playerActiveMission.giver) {
                     handleTurnInAcquire();
                     return true;
                 }
                 break; // No reward or turn-in

             case 'r':
                 if (playerHull < MAX_PLAYER_HULL) {
                     repairShip();
                     return true;
                 }
                 break; // Not damaged, or 'r' might be used for something else in space

            case 'v':
                 visitCantina();
                 return true;

             case 'l':
                 handleInteraction();
                 return true;
         }
         // If we are here, we are docked but didn't press a valid docked key.
         // We still check for movement/global keys below.
     }

     // --- 2. IN-SPACE & GLOBAL ACTIONS ---
     let dx = 0,
         dy = 0;
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
         case 'e':
             const currentTile = chunkManager.getTile(playerX, playerY);
             const tileChar = getTileChar(currentTile);

             triggerSensorPulse();

             if (tileChar === STAR_CHAR_VAL) {
                 currentSystemData = generateStarSystem(playerX, playerY);
                 selectedPlanetIndex = -1;

                 // Use the centralized function to ensure scrollbars update
                 changeGameState(GAME_STATES.SYSTEM_MAP);

                 logMessage(`Entering ${currentSystemData.name}...`);
             } else {
                 setTimeout(() => {
                     scanLocation();
                 }, 300);
             }
             return true;
         case 'h':
             scoopHydrogen();
             return true;
         case 'm':
             mineAsteroid();
             return true;
         case 'j':
             toggleCodex(true);
             return true;
         case 'i':
             openCargoModal();
             return true;
         case 't':
             const tileForWormhole = chunkManager.getTile(playerX, playerY);
             if (getTileType(tileForWormhole) === 'wormhole') traverseWormhole();
             else logMessage("No wormhole here.");
             return true;
         case '.': // The Period key
             logMessage("Holding position. Systems recharging...");
             advanceGameTime(0.15); // Pass time to allow shield regen
             render(); // Update the screen
             return true;
         case 'f6':
             saveGame();
             return true;
         case 'f7':
             loadGame();
             return true;
         default:
             // Not a recognized global key
             if (dx === 0 && dy === 0) return false; // Not handled
     }

     if (dx !== 0 || dy !== 0) {
         movePlayer(dx, dy);
     }
     return true; // Handled movement
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
     const key = event.key.toLowerCase();

     // 1. TIMING CHECK (The Smoother)
     // We only throttle movement keys. Menu keys (Escape, I, etc.) should be instant.
     const isMovementKey = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);
     const now = Date.now();

     if (isMovementKey && (now - lastInputTime < INPUT_DELAY)) {
         return; // Ignore input if too fast
     }

     if (currentGameState === GAME_STATES.TITLE_SCREEN) return;

     let inputHandled = false;

     // --- 2. Top-level "Blocking" Contexts (Menus, Overlays, etc.) ---
     if (codexOverlayElement.style.display === 'flex') {
         inputHandled = handleCodexInput(key);
     } else if (currentOutfitContext && currentOutfitContext.step === 'viewingCargo') {
         if (key === 'escape' || key === 'i') closeCargoModal();
         inputHandled = true;
     } else if (currentMissionContext) {
         inputHandled = handleMissionInput(key);
     } else if (currentOutfitContext) {
         inputHandled = handleOutfitInput(key);
     } else if (currentTradeContext) {
         inputHandled = handleTradeInput(key);
     } else if (currentShipyardContext) {
         inputHandled = handleShipyardInput(key);
     }

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

     // --- FORCE RENDER IMMEDIATELY ---
     // This ensures the canvas redraws with the new colors right now,
     // without waiting for the player to move.
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
            VIEWPORT_WIDTH_TILES = 13; 
            VIEWPORT_HEIGHT_TILES = 17;
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

    // --- Mobile D-Pad Listeners ---
    const btnUp = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');

    if (btnUp) {
        const bindMove = (btn, key) => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); 
                if (currentGameState === GAME_STATES.GALACTIC_MAP) handleGalacticMapInput(key);
            });
            btn.addEventListener('click', (e) => {
                if (currentGameState === GAME_STATES.GALACTIC_MAP) handleGalacticMapInput(key);
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
    performGarbageCollection();
    const gameState = {
        version: GAME_VERSION,
        realTimestamp: Date.now(), // Store real time for the UI
        
        // Stats
        playerX, playerY, playerFuel, playerCredits, playerShields, playerHull,
        playerNotoriety, playerLevel, playerXP, playerName, playerPfp,

        playerPerks: Array.from(playerPerks), // Convert Set to Array
        
        // Inventory & World
        playerShip, playerCargo,
        WORLD_SEED, currentGameDate, playerActiveMission,
        
        // Mystery & Deltas
        mystery_wayfinder_progress, mystery_wayfinder_finalLocation,
        mystery_first_nexus_location, mystery_nexus_activated,
        worldStateDeltas: worldStateDeltas || {},
        currentSectorName, // Save sector name for the UI card

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

    // 4. Clear Enemies near spawn
    removeEnemyAt(playerX, playerY);

    // 5. Reset UI and State
    document.getElementById('gameOverOverlay').style.display = 'none';
    
    // Ensure we switch back to the map state
    changeGameState(GAME_STATES.GALACTIC_MAP);
    
    logMessage(`<span style="color:#00FF00">CLONE ACTIVATED. Welcome back, Commander.</span>`);
    
    // Force immediate render and interaction check
    handleInteraction(); 
    render();
    
    saveGame(); // Auto-save on respawn
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

        playerPerks = new Set(savedState.playerPerks || []); // Convert Array back to Set
        
        WORLD_SEED = savedState.WORLD_SEED;
        playerActiveMission = savedState.playerActiveMission;
        currentGameDate = savedState.currentGameDate;
        
        mystery_wayfinder_progress = savedState.mystery_wayfinder_progress;
        mystery_wayfinder_finalLocation = savedState.mystery_wayfinder_finalLocation;
        mystery_first_nexus_location = savedState.mystery_first_nexus_location;
        mystery_nexus_activated = savedState.mystery_nexus_activated;
        
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
            // No Saves -> Show New Game
            if (newGameCont) newGameCont.style.display = 'block';
            if (saveSelectCont) saveSelectCont.style.display = 'none';
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

['tradeOverlay', 'cargoOverlay', 'codexOverlay', 'levelUpOverlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                // Only close if clicking the dark overlay itself, not the window inside it
                if (e.target === el) {
                    if (id === 'tradeOverlay') closeTradeModal();
                    else if (id === 'cargoOverlay') closeCargoModal();
                    else if (id === 'codexOverlay') toggleCodex(false);
                    // levelUpOverlay cannot be dismissed, you must pick a perk!
                }
            });
        }
    });

    // --- NEW VISUAL STATION SYSTEM ---

function drawProceduralStation(canvasId, seed) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Generate Randoms
    const rng = (s) => {
        let x = Math.sin(s++) * 10000;
        return x - Math.floor(x);
    };
    
    let currentSeed = seed;
    const rand = () => rng(currentSeed++);
    
    // Config
    const coreColor = rand() > 0.5 ? '#88CCFF' : '#AAAAAA';
    
    ctx.save();
    ctx.translate(w/2, h/2);
    
    // 1. Draw Solar Panels / Wings
    const wings = Math.floor(rand() * 4) + 2; // 2 to 5 wings
    const wingLen = 40 + rand() * 40;
    
    ctx.fillStyle = '#224466'; // Solar Blue
    for(let i=0; i<wings; i++) {
        ctx.rotate((Math.PI * 2) / wings);
        ctx.fillRect(20, -10, wingLen, 20);
        
        // Panel Detail
        ctx.fillStyle = '#4488AA';
        ctx.fillRect(25, -5, wingLen-10, 10);
        ctx.fillStyle = '#224466';
    }
    
    // 2. Draw Central Module
    const shapes = ['circle', 'rect', 'diamond'];
    const shape = shapes[Math.floor(rand() * shapes.length)];
    
    ctx.fillStyle = coreColor;
    
    if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
    } else if (shape === 'rect') {
        ctx.fillRect(-25, -40, 50, 80);
        ctx.strokeRect(-25, -40, 50, 80);
    } else {
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(40, 0);
        ctx.lineTo(0, 40);
        ctx.lineTo(-40, 0);
        ctx.fill();
        ctx.stroke();
    }
    
    // 3. Draw Lights/Windows
    ctx.fillStyle = '#FFD700'; // Lights
    for(let i=0; i<5; i++) {
        const lx = (rand() * 40) - 20;
        const ly = (rand() * 40) - 20;
        ctx.fillRect(lx, ly, 3, 3);
    }
    
    ctx.restore();
}

function openStationView() {
    const location = chunkManager.getTile(playerX, playerY);
    if (!location || !location.isMajorHub) return;

    // 1. Setup UI
    document.getElementById('stationOverlay').style.display = 'flex';
    document.getElementById('stationNameTitle').textContent = location.name.toUpperCase();
    document.getElementById('stationFactionBadge').textContent = location.faction || "INDEPENDENT";
    document.getElementById('stationDescText').textContent = location.scanFlavor;
    
    // 2. Generate Art based on Location Name (so it's consistent)
    let seed = 0;
    for(let i=0; i<location.name.length; i++) seed += location.name.charCodeAt(i);
    drawProceduralStation('stationCanvas', seed);
    
    // 3. Update Repair Cost Text
    const cost = Math.ceil((MAX_PLAYER_HULL - playerHull) * HULL_REPAIR_COST_PER_POINT);
    document.getElementById('repairCostLabel').textContent = cost > 0 ? `${cost} Credits` : "Hull Integrity 100%";
    
    // 4. Borders
    updateSideBorderVisibility();
}

function closeStationView() {
    document.getElementById('stationOverlay').style.display = 'none';

    updateSideBorderVisibility();
}

// --- GENERIC MODAL HANDLER ---

function openGenericModal(title) {
    const modal = document.getElementById('genericModalOverlay');
    document.getElementById('genericModalTitle').textContent = title;
    document.getElementById('genericModalList').innerHTML = '';
    document.getElementById('genericDetailContent').innerHTML = '<p style="color:#666">Select an item...</p>';
    document.getElementById('genericModalActions').innerHTML = '';
    modal.style.display = 'flex';
}

function closeGenericModal() {
    document.getElementById('genericModalOverlay').style.display = 'none';
    updateSideBorderVisibility();
}

// --- CANTINA & RUMOR SYSTEM ---

function visitCantina() {
    openGenericModal("STATION CANTINA");

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Flavor Text
    const flavors = [
        "The air is thick with smoke and the hum of a failing ventilation unit.",
        "A K'tharr mercenary eyes you suspiciously from the corner.",
        "Techno-jazz blares from speakers that have seen better days.",
        "The bartender polishes a glass with a rag that looks grease-stained."
    ];
    const randomFlavor = flavors[Math.floor(Math.random() * flavors.length)];

    listEl.innerHTML = `
        <div style="padding:20px; text-align:center;">
            <div style="font-size:40px; margin-bottom:20px;">🍸</div>
            <p style="color:#CCC; font-style:italic;">"${randomFlavor}"</p>
            <hr style="border-color:#333; margin:20px 0;">
            <p style="font-size:12px; color:#888;">
                Travelers from across the sector gather here. 
                It's a good place to rest, or pick up information if you have the credits.
            </p>
        </div>
    `;

    // 2. Menu Options
    detailEl.innerHTML = `
        <h3 style="color:var(--accent-color)">Cantina Menu</h3>
        <div class="trade-item-row" onclick="cantinaAction('DRINK')">
            <span>Synth-Ale (15c)</span>
            <span>Restores 10 HP</span>
        </div>
        <div class="trade-item-row" onclick="cantinaAction('RUMOR')">
            <span>Bribe Bartender (50c)</span>
            <span>Get Market Tip</span>
        </div>
        <div class="trade-item-row" onclick="cantinaAction('GAMBLE')">
            <span>Pazaak Table</span>
            <span>Wager 100c</span>
        </div>
    `;

    actionsEl.innerHTML = ''; // No bottom buttons needed, rows are clickable
}

function cantinaAction(action) {
    if (action === 'DRINK') {
        if (playerCredits < 15) { showToast("Not enough credits!", "error"); return; }
        if (playerHull >= MAX_PLAYER_HULL) { showToast("Hull integrity already maxed.", "info"); return; }
        
        playerCredits -= 15;
        playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 10);
        soundManager.playUIHover();
        showToast("Refreshing! Hull repaired +10.", "success");
        renderUIStats();
    }
    else if (action === 'RUMOR') {
        if (playerCredits < 50) { showToast("Bartender ignores you. (Need 50c)", "error"); return; }
        
        playerCredits -= 50;
        
        // Generate a rumor
        const stations = Object.keys(LOCATIONS_DATA); // Known static stations
        const targetStation = stations[Math.floor(Math.random() * stations.length)];
        const targetItem = "MEDICAL_SUPPLIES"; // Simplified for now, or pick random high value
        
        // Store the rumor globally
        activeMarketTrend = {
            station: targetStation,
            item: targetItem,
            expiry: Date.now() + 600000 // 10 minutes
        };
        
        showToast(`RUMOR ACQUIRED: Prices for ${targetItem} are high at ${targetStation}!`, "info");
        logMessage(`Rumor: High demand for ${targetItem} reported at ${targetStation}.`);
        renderUIStats();
        closeGenericModal();
    }
    else if (action === 'GAMBLE') {
        if (playerCredits < 100) { showToast("House limit is 100c.", "error"); return; }
        
        playerCredits -= 100;
        if (Math.random() > 0.55) { // House advantage
            const win = 200;
            playerCredits += win;
            soundManager.playAbilityActivate(); // Win sound
            showToast(`YOU WON! (+${win}c)`, "success");
        } else {
            soundManager.playError();
            showToast("You lost.", "error");
        }
        renderUIStats();
    }
}

// --- CONSOLIDATED TRADE SYSTEM (Fixed & Sorted) ---

function openTradeModal(mode) {
    const location = chunkManager.getTile(playerX, playerY);
    
    // 1. Validation: Ensure we are at a station or outpost
    if (!location || location.type !== 'location') {
        logMessage("Trading terminal offline.");
        return;
    }

    const isBuy = mode === 'buy';
    
    // 2. OPEN MODAL FIRST
    // This ensures DOM elements like 'genericModalList' exist before we try to fill them
    openGenericModal(isBuy ? "STATION MARKETPLACE" : "CARGO MANIFEST");

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    
    // Clear previous state
    listEl.innerHTML = '';
    detailEl.innerHTML = '<p style="color:#666; margin-top:20px; text-align:center;">Select a commodity to view market analytics.</p>';
    
    if (isBuy) {
        // --- BUY MODE ---
        const items = location.sells || [];
        if (items.length === 0) {
            listEl.innerHTML = `<div style="padding:15px; color:#888;">No commodities for sale here.</div>`;
            return;
        }

        items.forEach(itemEntry => {
            renderTradeRow(itemEntry.id, itemEntry.stock, true, location, listEl);
        });
    } else {
        // --- SELL MODE (Sorted: Inventory first, then Station Demands) ---
        const playerHas = Object.keys(playerCargo).filter(id => playerCargo[id] > 0);
        const stationBuys = location.buys || [];
        
        // A. Items currently in your cargo hold
        if (playerHas.length > 0) {
            const header = document.createElement('div');
            header.className = 'trade-list-header';
            header.textContent = "YOUR CARGO";
            listEl.appendChild(header);

            playerHas.forEach(itemId => {
                const qty = playerCargo[itemId];
                renderTradeRow(itemId, qty, false, location, listEl);
            });
        }

        // B. Items the station wants that you ARE NOT carrying
        const otherDemands = stationBuys.filter(b => !playerHas.includes(b.id));
        if (otherDemands.length > 0) {
            const header = document.createElement('div');
            header.className = 'trade-list-header';
            header.style.marginTop = playerHas.length > 0 ? "20px" : "0";
            header.textContent = "STATION DEMAND";
            listEl.appendChild(header);

            otherDemands.forEach(demand => {
                renderTradeRow(demand.id, 0, false, location, listEl);
            });
        }

        if (playerHas.length === 0 && otherDemands.length === 0) {
            listEl.innerHTML = `<div style="padding:15px; color:#888;">Station is not currently buying resources.</div>`;
        }
    }
}

// Helper to render individual rows consistently
function renderTradeRow(itemId, qty, isBuy, location, container) {
    const com = COMMODITIES[itemId];
    const itemEntry = isBuy ? location.sells.find(s => s.id === itemId) : location.buys.find(b => b.id === itemId);
    
    // Price calculation logic
    const priceMod = itemEntry ? itemEntry.priceMod : 0.5; // Low price if station doesn't specifically buy it
    const finalPrice = calculatePrice(com.basePrice, priceMod, itemId, location.name, isBuy ? 'buy' : 'sell');
    
    const row = document.createElement('div');
    row.className = 'trade-item-row';
    
    const label = isBuy ? `Stock: ${qty}` : `Hold: ${qty}`;
    
    // FIX: Using CSS Variables instead of Hex Codes for Light Mode support
    row.innerHTML = `
        <span style="${com.illegal ? 'color:var(--danger)' : ''}">${com.name}</span> 
        <span style="color:#888;">${formatNumber(finalPrice)}c | ${label}</span>
    `;
    
    row.onclick = () => showTradeDetails(itemId, finalPrice, qty, isBuy, location);
    container.appendChild(row);
}

function showTradeDetails(itemId, price, stock, isBuy, location) {
    const comm = COMMODITIES[itemId];
    let marketStatus = "Standard Market Rate";
    
    if (isBuy) {
        if (price < comm.basePrice * 0.8) marketStatus = "<span style='color:var(--success)'>BELOW MARKET VALUE (Cheap!)</span>";
        else if (price > comm.basePrice * 1.2) marketStatus = "<span style='color:var(--danger)'>INFLATED PRICE (Expensive)</span>";
    } else {
        const demand = location.buys.find(b => b.id === itemId);
        if (demand) marketStatus = "<span style='color:var(--success)'>HIGH DEMAND ITEM</span>";
        else marketStatus = "<span style='color:#888'>No Local Demand (Dumping)</span>";
    }

    const html = `
        <h3 style="color:var(--accent-color)">${comm.name}</h3>
        <p style="font-size:12px; color:var(--text-color); opacity:0.8;">${comm.description}</p>
        
        <div class="trade-math-area">
            <div class="trade-stat-row"><span>Unit Price:</span> <span>${formatNumber(price)}c</span></div>
            <div class="trade-stat-row"><span>Available: ${isBuy ? 'Stock' : 'In Hold'}</span> <span>${formatNumber(stock)} units</span></div>
            <div class="trade-stat-row" style="margin-top:10px; border-top:1px solid #333; padding-top:5px;">
                <span>Market Status:</span> <span style="font-size:10px">${marketStatus}</span>
            </div>
        </div>
        
        ${comm.illegal ? '<div style="background:#300; color:var(--danger); padding:5px; margin-top:10px; font-size:10px; text-align:center;">⚠ CONTRABAND: POSSESSION IS ILLEGAL ⚠</div>' : ''}
    `;
    
    document.getElementById('genericDetailContent').innerHTML = html;

    const actionsEl = document.getElementById('genericModalActions');
    
    if (isBuy) {
        const maxAfford = Math.floor(playerCredits / price);
        const spaceLeft = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        const canBuy = Math.min(stock, maxAfford, spaceLeft);
        
        actionsEl.innerHTML = `
            <div style="text-align:center; margin-bottom:10px; color:#888;">Space: ${formatNumber(spaceLeft)} | Afford: ${formatNumber(maxAfford)}</div>
            <button class="action-button" ${canBuy > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 1, true)">BUY 1 (${formatNumber(price)}c)</button>
            <button class="action-button" ${canBuy >= 5 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 5, true)">BUY 5 (${formatNumber(price * 5)}c)</button>
            <button class="action-button" ${canBuy > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, ${canBuy}, true)">BUY MAX (${formatNumber(canBuy)})</button>
        `;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" ${stock > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 1, false)">SELL 1 (${formatNumber(price)}c)</button>
            <button class="action-button" ${stock >= 5 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, 5, false)">SELL 5 (${formatNumber(price * 5)}c)</button>
            <button class="action-button" ${stock > 0 ? '' : 'disabled'} onclick="executeTrade('${itemId}', ${price}, ${stock}, false)">SELL ALL (${formatNumber(price * stock)}c)</button>
        `;
    }
}

function executeTrade(itemId, price, qty, isBuy) {
    if (qty <= 0) return;

    if (isBuy) {
        playerCredits -= (price * qty);
        if (!playerCargo[itemId]) playerCargo[itemId] = 0;
        playerCargo[itemId] += qty;
        
        // Decrease station stock (simulation)
        const location = chunkManager.getTile(playerX, playerY);
        const item = location.sells.find(i => i.id === itemId);
        if (item) item.stock -= qty;

        showToast(`BOUGHT ${qty}x ${COMMODITIES[itemId].name} for ${formatNumber(price * qty)}c`, "success");
    } else {
        playerCredits += (price * qty);
        playerCargo[itemId] -= qty;
        if (playerCargo[itemId] <= 0) delete playerCargo[itemId];
        
        showToast(`SOLD ${qty}x ${COMMODITIES[itemId].name} for ${formatNumber(price * qty)}c`, "success");
    }

    updateCurrentCargoLoad();
    renderUIStats();
    
    // Refresh the modal to show updated inventory/credits
    openTradeModal(isBuy ? 'buy' : 'sell');
    
    // Re-show details for the item just traded
    const location = chunkManager.getTile(playerX, playerY);
    const newStock = isBuy 
        ? (location.sells.find(i => i.id === itemId)?.stock || 0)
        : (playerCargo[itemId] || 0);
        
    showTradeDetails(itemId, price, newStock, isBuy, location);
}
