// --- START OF FILE config.js ---

// ==========================================
// --- EVENT BUS SYSTEM (Decoupling) ---
// ==========================================

const GameBus = {
    events: {},
    on(event, listener) {
        if (typeof listener !== 'function') return;
        if (!this.events[event]) this.events[event] = [];
        if (!this.events[event].includes(listener)) {
            this.events[event].push(listener);
        }
    },
    once(event, listener) {
        if (typeof listener !== 'function') return;
        const wrapper = (data) => {
            this.off(event, wrapper);
            listener(data);
        };
        // Store the original listener on the wrapper so we can properly remove it if needed before it fires
        wrapper._originalListener = listener; 
        this.on(event, wrapper);
    },
    off(event, listener) {
        if (!this.events[event]) return;
        // Also check against wrapped single-fire listeners
        this.events[event] = this.events[event].filter(l => l !== listener && l._originalListener !== listener);
    },
    emit(event, data) {
        if (!this.events[event]) return;
        // Copy array so listeners that unsubscribe during emit don't skip indices
        const listeners = [...this.events[event]];
        for (let i = 0; i < listeners.length; i++) {
            try {
                listeners[i](data);
            } catch (err) {
                console.warn(`[GameBus] Error in listener for '${event}':`, err);
            }
        }
    }
};

window.GameBus = GameBus;

// ==========================================
// --- GAME CONFIGURATION & CONSTANTS ---
// ==========================================

// STARTING VALUES (Based on Light Freighter + Standard Drive Mk1)
let MAX_FUEL = 220; 
let PLAYER_CARGO_CAPACITY = 50; 
let MAX_SHIELDS = 50; 
let MAX_PLAYER_HULL = 100;

const GAME_VERSION = "v0.9.7"; // Updated Version
const MAP_WIDTH = 40;  
const MAP_HEIGHT = 22; 
const PLAYER_CHAR_VAL = '@';
const EMPTY_SPACE_CHAR_VAL = '.';
const STAR_CHAR_VAL = '*';
const BLACK_HOLE_CHAR_VAL = 'B';
const BLACK_HOLE_SPAWN_CHANCE = 0.00035;
const PLANET_CHAR_VAL = 'O';
const STARBASE_CHAR_VAL = '#';
const OUTPOST_CHAR_VAL = 'H';
const ASTEROID_CHAR_VAL = '%';
const NEBULA_CHAR_VAL = '~';
const PIRATE_CHAR_VAL = 'X';
const DERELICT_CHAR_VAL = 'D';
const ANOMALY_CHAR_VAL = '?';
const WORMHOLE_CHAR_VAL = 'W';
const NEXUS_CHAR_VAL = '&';
const PIRATE_BASE_CHAR_VAL = '^';

// Custom Tile Symbols (Deep Space POIs)
const ESCAPE_POD_CHAR_VAL = 'P';
const RELAY_CASINO_CHAR_VAL = '$';
const MONOLITH_CHAR_VAL = 'Ψ';
const CARGO_CACHE_CHAR_VAL = 'C';
const SPACE_MINE_CHAR_VAL = 'M';
const NAV_BUOY_CHAR_VAL = 'N';

const DERELICT_SPAWN_CHANCE = 0.00025; 
const STAR_SPAWN_CHANCE = 0.0025; 
const ASTEROID_SPAWN_CHANCE = 0.00125; 
const NEBULA_SPAWN_CHANCE = 0.05; 
const ASTEROID_BELT_CHANCE = 0.01; 

const INITIAL_CREDITS = 1000;
const BASE_FUEL_PER_MOVE = 0.8;
const HULL_REPAIR_COST_PER_POINT = 5;

const BIOLOGICAL_RESOURCES = new Set([
    'GENETIC_SAMPLES',
    'KTHARR_SPICES',
    'FOOD_SUPPLIES',
    'SENTIENT_MYCELIUM',
    'MEDICAL_SUPPLIES'
]);
Object.freeze(BIOLOGICAL_RESOURCES); // Optimize Set lookups

const PIRATE_ENCOUNTER_CHANCE = 0.0025;
const RUN_ESCAPE_CHANCE = 0.6;
const RUN_FUEL_COST = 5;
const EVASION_FUEL_COST = 3;
const EVASION_DODGE_BONUS = 0.35;
const CHARGE_DAMAGE_MULTIPLIER = 1.5;
const CHARGE_HIT_BONUS = 0.15;
const HULL_DAMAGE_BONUS_MULTIPLIER = 1.25;

// Safe baseline defaults prior to applyPlayerShipStats()
let PLAYER_ATTACK_DAMAGE = 8;
let PLAYER_HIT_CHANCE = 0.70;
let PLAYER_EVASION = 0;
let PLAYER_SIGNATURE = 1.0;

const PIRATE_BASE_SHIELDS_MIN = 15;
const PIRATE_BASE_SHIELDS_MAX = 35;
const PIRATE_BASE_HULL_MIN = 40;
const PIRATE_BASE_HULL_MAX = 70;
const PIRATE_ATTACK_DAMAGE_MIN = 5;
const PIRATE_ATTACK_DAMAGE_MAX = 12;
const PIRATE_HIT_CHANCE = 0.6;
const PIRATE_CREDIT_REWARD_MIN = 20;
const PIRATE_CREDIT_REWARD_MAX = 60;
const XP_PER_PIRATE_MIN = 10;
const XP_PER_PIRATE_MAX = 25;

const MIN_SCOOP_YIELD = 10;
const MAX_SCOOP_YIELD_RICHNESS_MULTIPLIER = 18;
const SCOOP_RANDOM_BONUS = 4;

const ANOMALY_SPAWN_CHANCE = 0.000125; 
const OUTPOST_SPAWN_CHANCE = 0.0002; 

const WORMHOLE_SPAWN_CHANCE = 0.0000075; 
const WORMHOLE_TRAVEL_FUEL_COST = 20;
const WORMHOLE_JUMP_MIN_DIST = 5;
const WORMHOLE_JUMP_MAX_DIST = 15;

const BASE_XP_TO_LEVEL = 75;
const XP_LEVEL_EXPONENT = 1.6;
const XP_PER_NEW_SECTOR_DISCOVERY = 25;
const XP_PER_FIRST_SCAN_TYPE = 5;
const XP_PER_LOCATION_DISCOVERY = 10;
const XP_PER_PROFIT_UNIT = 0.1;
const XP_MYSTERY_REWARD = 200;
const XP_WORMHOLE_TRAVERSE = 15;
const XP_PER_MINING_OP = 3;
const XP_BONUS_RARE_MINERAL = 5;
const XP_MISSION_COMPLETION_BASE = 50;

let sensorPulseActive = false;
let sensorPulseRadius = 0;
const MAX_PULSE_RADIUS = 150; 

let autoSaveInterval = null;
const AUTOSAVE_DELAY = 60000; 

// --- NOTORIETY CONFIGURATION ---
const NOTORIETY_TITLES = [
    { score: 0,   title: "Clean Record" },
    { score: 5,   title: "Petty Smuggler" },
    { score: 15,  title: "Wanted Troublemaker" },
    { score: 30,  title: "Known Outlaw" },
    { score: 60,  title: "Cartel Enforcer" },
    { score: 100, title: "Sector Menace" },
    { score: 200, title: "Enemy of the Concord" }
];
Object.freeze(NOTORIETY_TITLES);

const PLAYER_PORTRAITS = [
    "assets/pfp_01.png", 
    "assets/pfp_02.png",
    "assets/pfp_03.png",
    "assets/pfp_04.png", 
    "assets/pfp_05.png",
    "assets/pfp_06.png"
];
Object.freeze(PLAYER_PORTRAITS);

// --- FACTION CONFIGURATION ---
const FACTIONS = {
    CONCORD: {
        name: "Concord Dominion",
        color: "#00AAFF", // Blue
        bg: "rgba(0, 100, 255, 0.08)", 
        homeRadius: 8, // 400 Tiles
        description: "The central government. Values law, order, and taxes."
    },
    ECLIPSE: { 
        name: "Eclipse Cartel",
        color: "#FF4444", // Red
        bg: "rgba(255, 50, 50, 0.08)",
        zone: "WEST", // X < -20
        description: "A shadow organization controlling the black markets of the outer rim."
    },
    KTHARR: {
        name: "K'tharr Ascendancy",
        color: "#4CAF50", // Green
        bg: "rgba(0, 255, 50, 0.08)",
        zone: "EAST", // X > 20
        description: "A xenophobic warrior caste. Highly territorial."
    },
    FUEL_RATS: {
        name: "The Fuel Rats Collective",
        color: "#FFAA00", // Amber
        bg: "transparent",
        zone: "NOMAD",
        description: "An independent galaxy-wide collective of emergency rescue pilots."
    },
    INDEPENDENT: {
        name: "Free Systems",
        color: "#FFFF00", // Yellow
        bg: "transparent",
        description: "Lawless fringe worlds."
    }
};
Object.freeze(FACTIONS);

function getStartingFactionStanding() {
    return {
        CONCORD: 0,
        ECLIPSE: -10,  
        KTHARR: -50,   
        FUEL_RATS: 0   
    };
}

let playerFactionStanding = getStartingFactionStanding();

// ==========================================
// --- CUSTOM TILE INTERACTIONS ---
// ==========================================

function _clearCustomTileAtPlayer() {
    // 👇 BUG FIX: Do not attempt to clear tiles or re-render if the player was killed by the interaction!
    if (typeof playerHull !== 'undefined' && playerHull <= 0) return;

    if (typeof updateWorldState === 'function') {
        updateWorldState(playerX, playerY, {
            char: EMPTY_SPACE_CHAR_VAL,
            type: null,
            customColor: null,
            displayChar: null,
            studied: true,
            lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0
        });
    }
    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
    if (typeof render === 'function') render();
    if (typeof handleInteraction === 'function') handleInteraction();
}

const TILE_INTERACTIONS = {
    // 1. Cryo-Escape Pod
    [ESCAPE_POD_CHAR_VAL]: {
        log: "<span style='color:#00FFAA'>[ SENSORS ]</span> A frosted cryo-escape pod drifts silently in the void. Life-support telemetry is flickering.",
        actions: (tileObj) => [
            { 
                label: 'Rescue Occupant', 
                key: 'e', 
                onclick: () => {
                    const roll = Math.random();
                    if (roll < 0.65) {
                        const reward = 400 + Math.floor(Math.random() * 400);
                        playerCredits += reward;
                        playerXP += 35;
                        if (typeof playerFactionStanding !== 'undefined') {
                            playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 3;
                        }
                        logMessage(`<span style='color:var(--success)'>[ RESCUE ]</span> You thaw a stranded merchant pilot. They wire you <b>${formatNumber(reward)}c</b> for passage (+35 XP, +3 Concord Rep).`);
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                    } else {
                        const medQty = 2 + Math.floor(Math.random() * 3);
                        if ((typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + medQty <= PLAYER_CARGO_CAPACITY) {
                            playerCargo['MEDICAL_SUPPLIES'] = (playerCargo['MEDICAL_SUPPLIES'] || 0) + medQty;
                            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                            logMessage(`<span style='color:var(--accent-color)'>[ SALVAGE ]</span> The pod's occupant is long gone, but you recover <b>${medQty}x Medical Supplies</b>.`);
                        } else {
                            playerCredits += 250;
                            logMessage(`<span style='color:var(--gold-text)'>[ SALVAGE ]</span> Cargo hold full! You strip the pod's emergency credit chip (+250c).`);
                        }
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                    }
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Strip Electronics',
                key: 'x',
                onclick: () => {
                    const techQty = 2 + Math.floor(Math.random() * 3);
                    if ((typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + techQty <= PLAYER_CARGO_CAPACITY) {
                        playerCargo['TECH_PARTS'] = (playerCargo['TECH_PARTS'] || 0) + techQty;
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        logMessage(`<span style='color:var(--warning)'>[ SCRAPPED ]</span> Dismantled the pod's beacon for <b>${techQty}x Tech Parts</b>.`);
                    } else {
                        playerCredits += 200;
                        logMessage(`<span style='color:var(--warning)'>[ SCRAPPED ]</span> Sold the pod's transponder frequencies over subspace (+200c).`);
                    }
                    if (typeof soundManager !== 'undefined') soundManager.playMining();
                    _clearCustomTileAtPlayer();
                }
            },
            { 
                label: 'Leave Pod', 
                key: 'l', 
                onclick: () => logMessage("You leave the escape pod drifting on its trajectory.") 
            }
        ]
    },

    // 2. Automated Subspace Wagering & Supply Relay
    [RELAY_CASINO_CHAR_VAL]: {
        log: "<span style='color:var(--gold-text)'>[ RELAY BEACON ]</span> An automated neon-lit syndicate trade & wagering buoy hums in the dark.",
        actions: (tileObj) => [
            {
                label: 'Wager 200c (Subspace Slots)',
                key: 'e',
                onclick: () => {
                    if (playerCredits < 200) {
                        if (typeof showToast === 'function') showToast("Need 200c to Wager!", "error");
                        if (typeof soundManager !== 'undefined') soundManager.playError();
                        return;
                    }
                    playerCredits -= 200;
                    const roll = Math.random();
                    if (roll < 0.12) {
                        playerCredits += 1000;
                        logMessage("<span style='color:var(--gold-text); font-weight:bold;'>[ JACKPOT! ]</span> Triple Supernovas! The relay dispenses <b>1,000c</b>!");
                        if (typeof showToast === 'function') showToast("JACKPOT! +800c NET", "success");
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                    } else if (roll < 0.48) {
                        playerCredits += 400;
                        logMessage("<span style='color:var(--success)'>[ WINNER ]</span> Binary alignment! You double your wager (+400c).");
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                    } else {
                        logMessage("<span style='color:var(--danger)'>[ BUST ]</span> The holographic reels land on a Black Hole. (-200c)");
                        if (typeof soundManager !== 'undefined') soundManager.playError();
                    }
                    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                }
            },
            {
                label: 'Emergency Fuel (100c)',
                key: 'f',
                onclick: () => {
                    if (playerFuel >= MAX_FUEL) {
                        if (typeof showToast === 'function') showToast("Tanks Already Full", "info");
                        return;
                    }
                    if (playerCredits < 100) {
                        if (typeof showToast === 'function') showToast("Insufficient Credits (100c)", "error");
                        return;
                    }
                    playerCredits -= 100;
                    playerFuel = Math.min(MAX_FUEL, playerFuel + 50);
                    logMessage("<span style='color:var(--accent-color)'>[ RELAY ]</span> Purchased 50 units of hyper-refined hydrogen for 100c.");
                    if (typeof soundManager !== 'undefined') soundManager.playBuy();
                    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                }
            }
        ]
    },

    // 3. Precursor Monolith
    [MONOLITH_CHAR_VAL]: {
        log: "<span style='color:#9933FF'>[ PRECURSOR MONOLITH ]</span> A towering crystalline obelisk hangs motionless in space, radiating harmonic subspace pulses.",
        actions: (tileObj) => [
            {
                label: 'Harmonize Sensors',
                key: 'e',
                onclick: () => {
                    if (tileObj && tileObj.studied) {
                        logMessage("The monolith is dormant. Its harmonic matrix has already been downloaded.");
                        return;
                    }
                    if (typeof unlockLoreEntry === 'function') unlockLoreEntry('XENO_PRECURSORS');
                    const xp = 120;
                    playerXP += xp;
                    let bonusText = "";
                    if ((typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + 1 <= PLAYER_CARGO_CAPACITY) {
                        const drop = Math.random() < 0.4 ? 'PRECURSOR_CIPHER' : 'ARTIFACT_SHARDS';
                        playerCargo[drop] = (playerCargo[drop] || 0) + 1;
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        const dropName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[drop]) ? COMMODITIES[drop].name : drop;
                        bonusText = ` Materialized <b>1x ${dropName}</b> in cargo bay!`;
                    }
                    logMessage(`<span style='color:#DDA0DD'>[ MONOLITH ATTUNED ]</span> Ancient star-charts flood your nav-computer (+${xp} XP).${bonusText}`);
                    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                    _clearCustomTileAtPlayer();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            }
        ]
    },

    // 4. Cargo Cache
    [CARGO_CACHE_CHAR_VAL]: {
        log: "<span style='color:#AAAAAA'>[ SENSORS ]</span> A cluster of reinforced cargo containers is drifting amidst wreckage debris.",
        actions: (tileObj) => [
            {
                label: 'Tractor Cargo In',
                key: 'e',
                onclick: () => {
                    const spaceLeft = PLAYER_CARGO_CAPACITY - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
                    if (spaceLeft <= 0) {
                        if (typeof showToast === 'function') showToast("CARGO HOLD FULL", "error");
                        logMessage("<span style='color:var(--danger)'>[ SALVAGE FAILED ] Cannot tractor containers, cargo hold is full!</span>");
                        return;
                    }
                    
                    const lootTables = ['TECH_PARTS', 'FOOD_SUPPLIES', 'MINERALS', 'WATER'];
                    const picked = lootTables[Math.floor(Math.random() * lootTables.length)];
                    const qty = Math.min(spaceLeft, 3 + Math.floor(Math.random() * 5));
                    
                    playerCargo[picked] = (playerCargo[picked] || 0) + qty;
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                    
                    const itemName = typeof COMMODITIES !== 'undefined' && COMMODITIES[picked] ? COMMODITIES[picked].name : picked;
                    logMessage(`<span style='color:var(--success)'>[ SALVAGE ]</span> Recovered <b>${qty}x ${itemName}</b> from the drifting cache.`);
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Leave Debris',
                key: 'l',
                onclick: () => logMessage("You maneuver around the debris field.")
            }
        ]
    },

    // 5. Space Mine
    [SPACE_MINE_CHAR_VAL]: {
        log: "<span style='color:var(--danger); font-weight:bold; animation: blink 1s infinite;'>[ WARNING ]</span> Proximity sensors triggered! A live sub-space mine from the Terran Wars is arming!",
        actions: (tileObj) => [
            {
                label: 'Defuse Mine (Requires Cyber Slicer)',
                key: 'e',
                onclick: () => {
                    const hasSlicer = typeof playerPerks !== 'undefined' && playerPerks.has && playerPerks.has('CYBER_SLICER');
                    if (hasSlicer) {
                        playerXP += 75;
                        logMessage("<span style='color:var(--success)'>[ DEFUSED ]</span> Cyber Slicer rapidly disabled the archaic detonator sequence. (+75 XP)");
                        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                        _clearCustomTileAtPlayer();
                    } else {
                        if (typeof showToast === 'function') showToast("DEFUSAL FAILED", "error");
                        logMessage("<span style='color:var(--danger)'>[ DETONATION ]</span> Lacking proper slicing tools, you trigger the anti-tamper switch!");
                        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 25, reason: "Space Mine Detonation" });
                        _clearCustomTileAtPlayer();
                    }
                }
            },
            {
                label: 'Shoot Mine',
                key: 'x',
                onclick: () => {
                    const damage = 15;
                    logMessage(`<span style='color:var(--warning)'>[ DETONATION ]</span> You blast the mine from close range. The shockwave strikes your shields/hull for ${damage} damage.`);
                    if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: damage, reason: "Space Mine Shockwave" });
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Evasive Retreat (Risk)',
                key: 'l',
                onclick: () => {
                    if (Math.random() < (typeof PLAYER_EVASION !== 'undefined' ? 0.5 + PLAYER_EVASION : 0.5)) {
                        logMessage("<span style='color:var(--success)'>[ EVADED ]</span> You backed away slowly before the proximity fuse tripped.");
                    } else {
                        logMessage("<span style='color:var(--danger)'>[ DETONATION ]</span> Thruster wash triggered the mine as you turned!");
                        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 20, reason: "Space Mine Shrapnel" });
                        _clearCustomTileAtPlayer();
                    }
                }
            }
        ]
    },

    // 6. Navigation Buoy
    [NAV_BUOY_CHAR_VAL]: {
        log: "<span style='color:#00AAFF'>[ NAV-BUOY ]</span> An automated Concord mapping buoy. It is transmitting encrypted sector telemetry.",
        actions: (tileObj) => [
            {
                label: 'Download Telemetry',
                key: 'e',
                onclick: () => {
                    if (tileObj && tileObj.studied) {
                        logMessage("Telemetry has already been downloaded from this buoy.");
                        return;
                    }
                    const xp = 50;
                    playerXP += xp;
                    
                    // 25% chance to extract Navigation Charts for trading
                    let extraLoot = "";
                    if (Math.random() < 0.25 && (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) < PLAYER_CARGO_CAPACITY) {
                        playerCargo['NAVIGATION_CHARTS'] = (playerCargo['NAVIGATION_CHARTS'] || 0) + 1;
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        extraLoot = " Copied <b>1x Nav-Charts</b> to data drive.";
                    }
                    
                    logMessage(`<span style='color:#00AAFF'>[ DATA SECURED ]</span> Sector topography updated (+${xp} XP).${extraLoot}`);
                    if (typeof soundManager !== 'undefined') soundManager.playScan();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    
                    if (typeof updateWorldState === 'function') {
                        updateWorldState(playerX, playerY, { studied: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                    }
                    if (typeof handleInteraction === 'function') handleInteraction();
                }
            }
        ]
    }
};

// ==========================================
// --- ASTROMETRIC OBSERVATORY (HOTKEY O) ---
// ==========================================

function openObservatory() {
    if (typeof openGenericModal !== 'function') return;

    openGenericModal("DEEP SPACE ASTROMETRIC OBSERVATORY");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    const scannerId = (typeof playerShip !== 'undefined' && playerShip.components) ? playerShip.components.scanner : 'SCANNER_BASIC_SUITE';
    const scannerObj = (typeof COMPONENTS_DATABASE !== 'undefined' && COMPONENTS_DATABASE[scannerId]) ? COMPONENTS_DATABASE[scannerId] : { name: "Standard Sensor Suite", stats: {} };
    const isNexStar = scannerId === 'SCANNER_NEXSTAR_4SE';
    
    // Fix: Safely check perks
    const hasTelemetryPerk = typeof playerPerks !== 'undefined' && 
                             ((playerPerks.has && playerPerks.has('LONG_RANGE_SENSORS')) || 
                              (playerPerks.includes && playerPerks.includes('LONG_RANGE_SENSORS')));

    const scanRange = isNexStar ? 16 : (hasTelemetryPerk ? 12 : 8);

    // Scan local surroundings within scanRange
    let stars = [];
    let anomalies = [];
    let derelicts = [];
    let stations = [];

    if (typeof chunkManager !== 'undefined') {
        for (let dy = -scanRange; dy <= scanRange; dy++) {
            for (let dx = -scanRange; dx <= scanRange; dx++) {
                if (dx === 0 && dy === 0) continue;
                const wx = playerX + dx;
                const wy = playerY + dy;
                const t = chunkManager.getTile(wx, wy);
                const ch = typeof getTileChar === 'function' ? getTileChar(t) : t;
                const dist = Math.floor(Math.sqrt(dx * dx + dy * dy));
                if (dist > scanRange) continue;

                if (ch === STAR_CHAR_VAL && typeof generateStarData === 'function') {
                    const sData = generateStarData(wx, wy);
                    stars.push({ x: wx, y: wy, dist, data: sData });
                } else if (ch === ANOMALY_CHAR_VAL || ch === WORMHOLE_CHAR_VAL || ch === BLACK_HOLE_CHAR_VAL || ch === MONOLITH_CHAR_VAL || ch === SPACE_MINE_CHAR_VAL) {
                    anomalies.push({ x: wx, y: wy, dist, char: ch });
                } else if (ch === DERELICT_CHAR_VAL || ch === ESCAPE_POD_CHAR_VAL || ch === CARGO_CACHE_CHAR_VAL) {
                    derelicts.push({ x: wx, y: wy, dist, char: ch });
                } else if (t && t.type === 'location') {
                    stations.push({ x: wx, y: wy, dist, name: t.name || 'Outpost' });
                } else if (ch === NAV_BUOY_CHAR_VAL) {
                    stations.push({ x: wx, y: wy, dist, name: 'Nav-Buoy' });
                }
            }
        }
    }

    stars.sort((a, b) => a.dist - b.dist);
    anomalies.sort((a, b) => a.dist - b.dist);

    let listHtml = `
        <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; border-bottom:1px solid #333;">
            OPTICAL TELEMETRY (RANGE: ${scanRange}u)
        </div>
    `;

    if (stars.length === 0 && anomalies.length === 0 && derelicts.length === 0 && stations.length === 0) {
        listHtml += `<div style="padding:15px; color:#888; font-size:12px;">No major stellar bodies or phenomena within ${scanRange} units.</div>`;
    } else {
        stars.slice(0, 6).forEach(s => {
            listHtml += `
                <div class="trade-item-row" style="padding:10px 12px; cursor:default;">
                    <div>
                        <div style="color:${s.data.color}; font-weight:bold; font-size:12px;">★ ${s.data.designation}</div>
                        <div style="color:var(--item-desc-color); font-size:10px;">${s.data.class}-Class ${s.data.name}</div>
                    </div>
                    <div style="color:var(--text-color); font-size:11px;">[${s.x}, ${-s.y}] (${s.dist}u)</div>
                </div>
            `;
        });
        anomalies.slice(0, 4).forEach(a => {
            let label = 'Spatial Anomaly';
            let color = '#FF33FF';
            if (a.char === WORMHOLE_CHAR_VAL) { label = 'Subspace Wormhole'; color = '#FFB800'; }
            else if (a.char === BLACK_HOLE_CHAR_VAL) { label = 'Singularity'; color = '#9933FF'; }
            else if (a.char === MONOLITH_CHAR_VAL) { label = 'Precursor Monolith'; color = '#9933FF'; }
            else if (a.char === SPACE_MINE_CHAR_VAL) { label = 'Live Ordnance (Mine)'; color = 'var(--danger)'; }
            
            listHtml += `
                <div class="trade-item-row" style="padding:10px 12px; cursor:default;">
                    <div>
                        <div style="color:${color}; font-weight:bold; font-size:12px;">🌀 ${label}</div>
                        <div style="color:var(--item-desc-color); font-size:10px;">Exotic Signature</div>
                    </div>
                    <div style="color:var(--text-color); font-size:11px;">[${a.x}, ${-a.y}] (${a.dist}u)</div>
                </div>
            `;
        });
        derelicts.slice(0, 3).forEach(d => {
            let label = 'Derelict Hull';
            if (d.char === ESCAPE_POD_CHAR_VAL) label = 'Cryo-Escape Pod';
            else if (d.char === CARGO_CACHE_CHAR_VAL) label = 'Drifting Cargo Cache';
            
            listHtml += `
                <div class="trade-item-row" style="padding:10px 12px; cursor:default;">
                    <div>
                        <div style="color:var(--warning); font-weight:bold; font-size:12px;">🛰️ ${label}</div>
                        <div style="color:var(--item-desc-color); font-size:10px;">Salvage Opportunity</div>
                    </div>
                    <div style="color:var(--text-color); font-size:11px;">[${d.x}, ${-d.y}] (${d.dist}u)</div>
                </div>
            `;
        });
    }

    listEl.innerHTML = listHtml;

    const sectorPhotoKey = `ASTRO_PHOTO_${typeof currentSectorX !== 'undefined' ? currentSectorX : 0}_${typeof currentSectorY !== 'undefined' ? currentSectorY : 0}`;
    const alreadyImaged = typeof discoveredLocations !== 'undefined' && discoveredLocations.has && discoveredLocations.has(sectorPhotoKey);

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:48px; margin-bottom:10px; filter: drop-shadow(0 0 15px var(--accent-color));">🔭</div>
            <h3 style="color:var(--accent-color); margin:0 0 5px 0; letter-spacing:1px;">${scannerObj.name.toUpperCase()}</h3>
            <div style="font-size:10px; color:var(--item-desc-color); letter-spacing:2px; margin-bottom:15px;">
                SECTOR: ${typeof currentSectorName !== 'undefined' ? currentSectorName.toUpperCase() : 'DEEP SPACE'}
            </div>

            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Local Stars Mapped:</span> <span style="color:var(--accent-color); font-weight:bold;">${stars.length}</span></div>
                <div class="trade-stat-row"><span>Anomalies in Range:</span> <span style="color:#FF33FF; font-weight:bold;">${anomalies.length}</span></div>
                <div class="trade-stat-row"><span>Wrecks / Pods Detected:</span> <span style="color:var(--warning); font-weight:bold;">${derelicts.length}</span></div>
                <div class="trade-stat-row"><span>Optical Resolution:</span> <span style="color:var(--success); font-weight:bold;">${isNexStar ? 'NexStar-4SE Prime Focus (+100%)' : 'Standard'}</span></div>
            </div>

            <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:12px; border-left:2px solid var(--accent-color); text-align:left; margin-top:15px;">
                ${alreadyImaged
                    ? "Long-exposure astrophotography plates for this sector have been archived in your ship's databanks."
                    : "Align your T-ring adapter and capture a long-exposure deep-sky plate of this sector's nebular and stellar alignments."}
            </p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" ${alreadyImaged ? 'disabled' : ''} style="${alreadyImaged ? '' : 'border-color:var(--success); color:var(--success);'}" onclick="captureDeepSkyImage()">
            ${alreadyImaged ? 'SECTOR PLATE ARCHIVED' : '📸 CAPTURE DEEP-SKY PLATE'}
        </button>
        <button class="action-button" onclick="closeGenericModal()">CLOSE OBSERVATORY</button>
    `;
}

function captureDeepSkyImage() {
    const sectorPhotoKey = `ASTRO_PHOTO_${typeof currentSectorX !== 'undefined' ? currentSectorX : 0}_${typeof currentSectorY !== 'undefined' ? currentSectorY : 0}`;
    if (typeof discoveredLocations !== 'undefined') {
        if (discoveredLocations.has && discoveredLocations.has(sectorPhotoKey)) return;
        if (discoveredLocations.add) discoveredLocations.add(sectorPhotoKey);
    }

    const isNexStar = typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.scanner === 'SCANNER_NEXSTAR_4SE';
    const xpGain = isNexStar ? 120 : 50;
    
    if (typeof playerXP !== 'undefined') playerXP += xpGain;

    let rewardMsg = `<span style="color:var(--accent-color)">[ ASTROPHOTOGRAPHY ]</span> Captured long-exposure plate of ${typeof currentSectorName !== 'undefined' ? currentSectorName : 'this sector'} (+${xpGain} XP).`;

    if (isNexStar && (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + 1 <= PLAYER_CARGO_CAPACITY) {
        playerCargo['PLANETARY_DATA'] = (playerCargo['PLANETARY_DATA'] || 0) + 1;
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        rewardMsg += ` <span style="color:var(--gold-text)">NexStar-4SE resolved 1x Planetary Data cartridge!</span>`;
    }

    if (typeof soundManager !== 'undefined') soundManager.playScan();
    if (typeof showToast === 'function') showToast(`DEEP-SKY PLATE SAVED (+${xpGain} XP)`, "success");
    if (typeof logMessage === 'function') logMessage(rewardMsg);

    openObservatory();
    if (typeof checkLevelUp === 'function') checkLevelUp();
}

window.openObservatory = openObservatory;
window.captureDeepSkyImage = captureDeepSkyImage;

// ==========================================
// --- SELF-CONTAINED ENGINE BRIDGES ---
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    // 1. Expose const databases to window and refresh lore.js fallback strings
    if (typeof COMMODITIES !== 'undefined') window.COMMODITIES = COMMODITIES;
    if (typeof LOCATIONS_DATA !== 'undefined') window.LOCATIONS_DATA = LOCATIONS_DATA;
    if (typeof SHIP_CLASSES !== 'undefined') window.SHIP_CLASSES = SHIP_CLASSES;
    if (typeof COMPONENTS_DATABASE !== 'undefined') window.COMPONENTS_DATABASE = COMPONENTS_DATABASE;

    if (typeof LORE_DATABASE !== 'undefined') {
        window.LORE_DATABASE = LORE_DATABASE;
        if (typeof LOCATIONS_DATA !== 'undefined') {
            if (LORE_DATABASE.LOCATION_STARBASE_ALPHA && LOCATIONS_DATA["Starbase Alpha"]) {
                LORE_DATABASE.LOCATION_STARBASE_ALPHA.text = LOCATIONS_DATA["Starbase Alpha"].scanFlavor;
            }
            if (LORE_DATABASE.LOCATION_AEGIS_DYSON_SPHERE && LOCATIONS_DATA["Aegis Dyson Sphere"]) {
                LORE_DATABASE.LOCATION_AEGIS_DYSON_SPHERE.text = LOCATIONS_DATA["Aegis Dyson Sphere"].scanFlavor;
            }
            if (LORE_DATABASE.LOCATION_PLANET_XERXES && LOCATIONS_DATA["Planet Xerxes"]) {
                LORE_DATABASE.LOCATION_PLANET_XERXES.text = LOCATIONS_DATA["Planet Xerxes"].scanFlavor;
            }
        }
    }

    // 2. Alias Legacy Hotkey Functions called by script.js
    if (typeof window.displayOutfittingScreen === 'undefined' && typeof window.openOutfittingUI === 'function') {
        window.displayOutfittingScreen = window.openOutfittingUI;
    }
    if (typeof window.traverseRandomWormhole === 'undefined' && typeof window.traverseWormhole === 'function') {
        window.traverseRandomWormhole = window.traverseWormhole;
    }

    // 3. Hook chunkManager.generateChunk to spawn Black Holes & Custom TILE_INTERACTIONS
    if (typeof chunkManager !== 'undefined' && typeof chunkManager.generateChunk === 'function' && !window._configChunkPatched) {
        const origGenerateChunk = chunkManager.generateChunk.bind(chunkManager);
        
        chunkManager.generateChunk = function(chunkX, chunkY) {
            const chunkData = origGenerateChunk(chunkX, chunkY);
            
            // Defend against missing globals during hot reloads
            const mapW = typeof MAP_WIDTH !== 'undefined' ? MAP_WIDTH : 40;
            const mapH = typeof MAP_HEIGHT !== 'undefined' ? MAP_HEIGHT : 22;
            const spawnX = mapW - 7;
            const spawnY = mapH - 5;

            for (let y = 0; y < this.CHUNK_SIZE; y++) {
                for (let x = 0; x < this.CHUNK_SIZE; x++) {
                    const currentTile = chunkData[y][x];
                    
                    // Only roll on unmodified empty space tiles
                    // Support both primitive strings and object formats natively
                    if (currentTile !== EMPTY_SPACE_CHAR_VAL && (!currentTile || currentTile.char !== EMPTY_SPACE_CHAR_VAL)) continue;

                    const worldX = chunkX * this.CHUNK_SIZE + x;
                    const worldY = chunkY * this.CHUNK_SIZE + y;

                    // Keep a 30-tile safe radius around Starbase Alpha free of hazards
                    const distFromSpawn = Math.abs(worldX - spawnX) + Math.abs(worldY - spawnY);
                    if (distFromSpawn < 30) continue;

                    const deltaKey = `${worldX},${worldY}`;
                    // Important fix: Deep merge prevents overriding existing structures!
                    if (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[deltaKey] && worldStateDeltas[deltaKey].char) continue;

                    const tileSeed = (typeof WORLD_SEED !== 'undefined' ? WORLD_SEED : 1337) ^ (worldX * 73856093) ^ (worldY * 19349663);
                    const roll = typeof seededRandom === 'function' ? seededRandom(tileSeed + 17) : Math.random();

                    // Progressive Probability Ladder
                    let currentThreshold = typeof BLACK_HOLE_SPAWN_CHANCE !== 'undefined' ? BLACK_HOLE_SPAWN_CHANCE : 0.00035;

                    if (roll < currentThreshold) {
                        chunkData[y][x] = { char: BLACK_HOLE_CHAR_VAL, type: 'black_hole', name: 'Micro-Singularity' };
                    } 
                    
                    currentThreshold += 0.00025;
                    if (roll >= currentThreshold - 0.00025 && roll < currentThreshold) {
                        chunkData[y][x] = { char: ESCAPE_POD_CHAR_VAL, displayChar: ESCAPE_POD_CHAR_VAL, customColor: '#00FFAA', type: 'custom_pod' };
                    } 
                    
                    currentThreshold += 0.00015;
                    if (roll >= currentThreshold - 0.00015 && roll < currentThreshold) {
                        chunkData[y][x] = { char: RELAY_CASINO_CHAR_VAL, displayChar: RELAY_CASINO_CHAR_VAL, customColor: '#FFD700', type: 'custom_relay' };
                    } 
                    
                    currentThreshold += 0.00010;
                    if (roll >= currentThreshold - 0.00010 && roll < currentThreshold) {
                        chunkData[y][x] = { char: MONOLITH_CHAR_VAL, displayChar: MONOLITH_CHAR_VAL, customColor: '#9933FF', type: 'custom_monolith' };
                    }

                    // --- 🚨 NEW CUSTOM TILES INJECTED HERE ---
                    currentThreshold += 0.00020;
                    if (roll >= currentThreshold - 0.00020 && roll < currentThreshold) {
                        chunkData[y][x] = { char: CARGO_CACHE_CHAR_VAL, displayChar: CARGO_CACHE_CHAR_VAL, customColor: '#AAAAAA', type: 'custom_cargo' };
                    }

                    currentThreshold += 0.00015;
                    if (roll >= currentThreshold - 0.00015 && roll < currentThreshold) {
                        chunkData[y][x] = { char: SPACE_MINE_CHAR_VAL, displayChar: SPACE_MINE_CHAR_VAL, customColor: '#FF5555', type: 'custom_mine' };
                    }

                    currentThreshold += 0.00015;
                    if (roll >= currentThreshold - 0.00015 && roll < currentThreshold) {
                        chunkData[y][x] = { char: NAV_BUOY_CHAR_VAL, displayChar: NAV_BUOY_CHAR_VAL, customColor: '#00AAFF', type: 'custom_nav' };
                    }
                }
            }
            return chunkData;
        };
        // Clear any pre-generated initial chunks so the new spawns take effect on New/Loaded games
        chunkManager.loadedChunks = {};
        chunkManager.lastChunkKey = null;
        chunkManager.lastChunkRef = null;
        window._configChunkPatched = true;
    }

    // 4. Route keyboard hotkeys for custom TILE_INTERACTIONS when standing on them
    if (typeof window.handleGalacticMapInput === 'function' && !window._configInputPatched) {
        const origMapInput = window.handleGalacticMapInput;
        window.handleGalacticMapInput = function(key) {
            if (typeof chunkManager !== 'undefined' && typeof TILE_INTERACTIONS !== 'undefined') {
                const tileObj = chunkManager.getTile(playerX, playerY);
                const tileChar = typeof getTileChar === 'function' ? getTileChar(tileObj) : tileObj;
                if (TILE_INTERACTIONS[tileChar]) {
                    const customDef = TILE_INTERACTIONS[tileChar];
                    const acts = typeof customDef.actions === 'function' ? customDef.actions(tileObj) : (customDef.actions || []);
                    const matched = acts.find(a => a.key && a.key.toLowerCase() === key.toLowerCase());
                    if (matched && typeof matched.onclick === 'function') {
                        matched.onclick();
                        return true;
                    }
                }
            }
            return origMapInput.apply(this, arguments);
        };
        window._configInputPatched = true;
    }
});

// --- END OF FILE config.js ---
