// --- START OF FILE config.js ---

// ==========================================
// --- EVENT BUS SYSTEM (Decoupling) ---
// ==========================================

const GameBus = {
    events: {},
    on(event, listener) {
        if (typeof listener !== 'function') return () => {};
        if (!this.events[event]) this.events[event] = [];
        if (!this.events[event].includes(listener)) {
            this.events[event].push(listener);
        }
        return () => this.off(event, listener);
    },
    once(event, listener) {
        if (typeof listener !== 'function') return () => {};
        const wrapper = (data) => {
            this.off(event, wrapper);
            listener(data);
        };
        wrapper._originalListener = listener;
        return this.on(event, wrapper);
    },
    off(event, listener) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(l => l !== listener && l._originalListener !== listener);
    },
    clear(event) {
        if (event) delete this.events[event];
        else this.events = {};
    },
    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    },
    hasListeners(event) {
        return this.listenerCount(event) > 0;
    },
    emit(event, data) {
        if (!this.events[event] || this.events[event].length === 0) return;
        const listeners = this.events[event].slice();
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

const GAME_VERSION = "v0.9.7";
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
const RESEARCH_SAT_CHAR_VAL = '¤';
const FUEL_TANKER_CHAR_VAL = 'F';
const TIME_CAPSULE_CHAR_VAL = 'T';
const REPAIR_BUOY_CHAR_VAL = '+';
const SMUGGLER_DROP_CHAR_VAL = '!';
const ECHO_RELAY_CHAR_VAL = 'E';

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
Object.freeze(BIOLOGICAL_RESOURCES);

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

window.autoSaveInterval = null;
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
        color: "#00AAFF",
        bg: "rgba(0, 100, 255, 0.08)",
        homeRadius: 8, // 400 Tiles
        description: "The central government. Values law, order, and taxes."
    },
    ECLIPSE: {
        name: "Eclipse Cartel",
        color: "#FF4444",
        bg: "rgba(255, 50, 50, 0.08)",
        zone: "WEST",
        description: "A shadow organization controlling the black markets of the outer rim."
    },
    KTHARR: {
        name: "K'tharr Ascendancy",
        color: "#4CAF50",
        bg: "rgba(0, 255, 50, 0.08)",
        zone: "EAST",
        description: "A xenophobic warrior caste. Highly territorial."
    },
    FUEL_RATS: {
        name: "The Fuel Rats Collective",
        color: "#FFAA00",
        bg: "transparent",
        zone: "NOMAD",
        description: "An independent galaxy-wide collective of emergency rescue pilots."
    },
    INDEPENDENT: {
        name: "Free Systems",
        color: "#FFFF00",
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
// --- INTERNAL CONFIG HELPERS ---
// ==========================================

function _configEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _configHasPerk(perkId) {
    if (typeof hasPlayerPerk === 'function') return hasPlayerPerk(perkId);
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

function _configSafeAddCargo(itemId, qty) {
    if (!itemId || qty <= 0 || typeof playerCargo === 'undefined') return 0;
    const maxCap = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
    const curLoad = typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0;
    const itemDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[itemId]) ? COMMODITIES[itemId] : null;
    const weight = (itemDef && itemDef.weight !== undefined) ? itemDef.weight : 1;

    const maxFit = weight > 0 ? Math.floor((maxCap - curLoad) / weight) : qty;
    const actualAdd = Math.max(0, Math.min(qty, maxFit));

    if (actualAdd > 0) {
        playerCargo[itemId] = (playerCargo[itemId] || 0) + actualAdd;
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    }
    return actualAdd;
}

function _getCompassBearing(dx, dy) {
    if (dx === 0 && dy === 0) return "HERE";
    const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const idx = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    return dirs[(idx + 8) % 8];
}

function _getContrastSafeStarColor(starData) {
    const isLight = document.body && document.body.classList.contains('light-mode');
    let color = (starData && starData.color) ? starData.color : '#FFFFFF';
    if (isLight && starData) {
        if (starData.class === "A") color = "#444444";
        else if (starData.class === "F") color = "#887700";
        else if (starData.class === "B") color = "#3355BB";
        else if (starData.class === "O") color = "#0033AA";
        else if (starData.class === "G") color = "#AA7700";
    }
    return color;
}

function _clearCustomTileAtPlayer() {
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
    if (typeof currentGameState === 'undefined' || currentGameState === 'galactic_map') {
        if (typeof render === 'function') render();
        if (typeof handleInteraction === 'function') handleInteraction();
    }
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

// Rotating Precursor visions for Monoliths (Ψ) & Echo Beacons (E)
const _MONOLITH_VISIONS = [
    "You glimpse a spiral galaxy before Sol ignited—thousands of luminous conduits humming in unison across the dark.",
    "Geometric chords echo across your cockpit speakers: 'WHEN THE SILENCE ARRIVES, THE COMPASS POINTS HOME.'",
    "Starlight bends into an impossible lattice; your sensor array records harmonic calibration constants centuries ahead of Concord physics.",
    "A fleeting vision of a sunless obsidian spire beneath frozen storms flashes across your nav-display before fading to static.",
    "For half a heartbeat you hear a vast crystalline choir vibrating between the spiral arms—and feel something ancient listening back.",
    "A holographic sextant unfolds across your canopy glass: three shattered shards rotating around an empty, luminous center.",
    "Lines of golden geometry trace forgotten hyperlanes stretching out past Sector 25 into a starless sea.",
    "Your hull hums at the resonant frequency of the First Chord; hairline fractures along the outer ribs seem to sigh in relief."
];

// Historical Archive Logs for Pre-Warp Time Capsules (T) — persisted via discoveredLocations
const _TIME_CAPSULE_LOGS = [
    {
        era: "TERRAN DIASPORA // 2144 CE",
        loreKey: "TECH_FTL_DRIVES",
        text: "Colony Ark 'Hesperia' Log 04: First test of the folded-spacetime motivator held for 14 seconds. We are no longer bound to one star."
    },
    {
        era: "TERRAN RESOURCE WARS // 2219 CE",
        loreKey: "FACTION_CONCORD",
        text: "Orbital Defense Directive 9: Automated proximity mines deployed across outer-rim shipping lanes. May whoever finds this after the ceasefire forgive us."
    },
    {
        era: "EARLY CONCORD SURVEY // 2298 CE",
        loreKey: "XENO_PRECURSORS",
        text: "Dr. Elena Vance, Cygnus Survey Team: The obsidian monoliths aren't monuments—they are tuning forks calibrated to the background metric of space itself."
    },
    {
        era: "FUEL RATS FOUNDING CHARTER // 2341 CE",
        loreKey: "FACTION_FUEL_RATS",
        text: "Tug Captain 'Rusty' Callaghan: No spacer dies cold in the black while another ship still has hydrogen to spare. Broadcast on channel Z."
    },
    {
        era: "CYGNUS OBSERVATORY CHARTER // 2362 CE",
        loreKey: "LOCATION_CYGNUS_PRIME",
        text: "Dean H. Aris, University of Cygnus Prime: Our funding depends on one promise—keep deep-space spectroscopy open to independent captains before the Directorate seals the vaults."
    },
    {
        era: "K'THARR BORDER TREATY // 2384 CE",
        loreKey: "FACTION_KTHARR",
        text: "Translated from High K'tharr: 'We do not sign peace on paper. Bring an iron hull to the eastern rim, and we shall weigh your worth in fire.'"
    },
    {
        era: "VALKYRIE BELT CLAIM // 2395 CE",
        loreKey: "LOCATION_VALKYRIE_DRIFT",
        text: "Prospector Log 118: Welded the barge to an iron asteroid rich enough to buy a moon. If Concord tax cutters come knocking, we'll hide in the dust."
    },
    {
        era: "SHADOW NETWORK GENESIS // 2402 CE",
        loreKey: "FACTION_SHADOW_NETWORK",
        text: "Encrypted Dead-Drop 01: Concord customs scans only see what they expect. Coat the bulkhead in obsidian slag and whisper through Xerxes."
    },
    {
        era: "PORT EREBUS MEMORANDUM // 2414 CE",
        loreKey: "LOCATION_PORT_EREBUS",
        text: "Cartel Ledger Fragment: Dust-cloud opacity holds at 94%. Relocated our primary identity forgers from Umbra to Erebus for faster Core turnarounds."
    },
    {
        era: "OBSERVATORY ARCHIVE // 2427 CE",
        loreKey: "PHENOMENON_BLACK_HOLE",
        text: "Chief Astronomer Lin: By matching angular momentum at the ergosphere boundary, an explorer equipped with Precursor nav-optics can slingshot without burning a drop of fuel."
    },
    {
        era: "CETI ALPHA INCIDENT REPORT // 2436 CE",
        loreKey: "LOCATION_CETI_ALPHA_SHIPYARDS",
        text: "Aegis Emergency Docket: Dread Pirate Voss hit Slipway 2 with an unidentified gravimetric cannon. Rebuilding the drydocks with double reactive plating."
    },
    {
        era: "FROTHY MOON DEDICATION // 2441 CE",
        loreKey: "LOCATION_FROTHY_MOON_OUTPOST",
        text: "Ridge Observatory Guestbook: First dark batch brewed under clear vacuum skies. Mounted the antique NexStar-4SE on the north pier for visiting captains."
    },
    {
        era: "SILENTIUM EXPEDITION // 2449 CE",
        loreKey: "REGION_SILENTIUM_EXPANSE",
        text: "Final Burst, SSV Wayfarer-Zero: Beyond Sector 25 the starlight thins out. Something immense is listening between the galaxies..."
    },
    {
        era: "PRECURSOR TRANSLATION FRAGMENT // UNDATED",
        loreKey: "PRECURSOR_ORIGINS",
        text: "Cygnus Linguist Note: Every Archive Sphere repeats the same farewell—'We tuned the First Chord to outlast the Silence. Find the Compass, and awaken the Nexus.'"
    }
];

function _pickNextTimeCapsuleLog() {
    if (typeof discoveredLocations !== 'undefined' && discoveredLocations.has && discoveredLocations.add) {
        for (let i = 0; i < _TIME_CAPSULE_LOGS.length; i++) {
            const key = `CAPSULE_LOG_${i}`;
            if (!discoveredLocations.has(key)) {
                discoveredLocations.add(key);
                return { index: i, entry: _TIME_CAPSULE_LOGS[i], isNew: true };
            }
        }
    }
    const idx = Math.floor(Math.random() * _TIME_CAPSULE_LOGS.length);
    return { index: idx, entry: _TIME_CAPSULE_LOGS[idx], isNew: false };
}

// ==========================================
// --- DATA-DRIVEN DEEP SPACE POI TABLE ---
// ==========================================

const DEEP_SPACE_POI_TABLE = [
    {
        id: 'BLACK_HOLE',
        chance: BLACK_HOLE_SPAWN_CHANCE,
        createTile: () => ({ char: BLACK_HOLE_CHAR_VAL, type: 'black_hole', name: 'Micro-Singularity' })
    },
    {
        id: 'ESCAPE_POD',
        chance: 0.00025,
        createTile: () => ({ char: ESCAPE_POD_CHAR_VAL, displayChar: ESCAPE_POD_CHAR_VAL, customColor: '#00FFAA', type: 'custom_pod' })
    },
    {
        id: 'RELAY_CASINO',
        chance: 0.00015,
        createTile: () => ({ char: RELAY_CASINO_CHAR_VAL, displayChar: RELAY_CASINO_CHAR_VAL, customColor: '#FFD700', type: 'custom_relay' })
    },
    {
        id: 'MONOLITH',
        chance: 0.00010,
        createTile: () => ({ char: MONOLITH_CHAR_VAL, displayChar: MONOLITH_CHAR_VAL, customColor: '#9933FF', type: 'custom_monolith' })
    },
    {
        id: 'CARGO_CACHE',
        chance: 0.00020,
        createTile: () => ({ char: CARGO_CACHE_CHAR_VAL, displayChar: CARGO_CACHE_CHAR_VAL, customColor: '#AAAAAA', type: 'custom_cargo' })
    },
    {
        id: 'SPACE_MINE',
        chance: 0.00015,
        createTile: () => ({ char: SPACE_MINE_CHAR_VAL, displayChar: SPACE_MINE_CHAR_VAL, customColor: '#FF5555', type: 'custom_mine' })
    },
    {
        id: 'NAV_BUOY',
        chance: 0.00015,
        createTile: () => ({ char: NAV_BUOY_CHAR_VAL, displayChar: NAV_BUOY_CHAR_VAL, customColor: '#00AAFF', type: 'custom_nav' })
    },
    {
        id: 'RESEARCH_SAT',
        chance: 0.00015,
        createTile: () => ({ char: RESEARCH_SAT_CHAR_VAL, displayChar: RESEARCH_SAT_CHAR_VAL, customColor: '#00FFFF', type: 'custom_satellite' })
    },
    {
        id: 'FUEL_TANKER',
        chance: 0.00018,
        createTile: () => ({ char: FUEL_TANKER_CHAR_VAL, displayChar: FUEL_TANKER_CHAR_VAL, customColor: '#FFAA00', type: 'custom_tanker' })
    },
    {
        id: 'TIME_CAPSULE',
        chance: 0.00012,
        createTile: () => ({ char: TIME_CAPSULE_CHAR_VAL, displayChar: TIME_CAPSULE_CHAR_VAL, customColor: '#DDA0DD', type: 'custom_capsule' })
    },
    {
        id: 'REPAIR_BUOY',
        chance: 0.00014,
        createTile: () => ({ char: REPAIR_BUOY_CHAR_VAL, displayChar: REPAIR_BUOY_CHAR_VAL, customColor: '#00FF88', type: 'custom_repair' })
    },
    {
        id: 'SMUGGLER_DROP',
        chance: 0.00014,
        createTile: () => ({ char: SMUGGLER_DROP_CHAR_VAL, displayChar: SMUGGLER_DROP_CHAR_VAL, customColor: '#FF66AA', type: 'custom_drop' })
    },
    {
        id: 'ECHO_RELAY',
        chance: 0.00010,
        createTile: () => ({ char: ECHO_RELAY_CHAR_VAL, displayChar: ECHO_RELAY_CHAR_VAL, customColor: '#40E0D0', type: 'custom_echo' })
    }
];

// ==========================================
// --- CUSTOM TILE INTERACTIONS ---
// ==========================================

const TILE_INTERACTIONS = {
    // 1. Cryo-Escape Pod
    [ESCAPE_POD_CHAR_VAL]: {
        log: "<span style='color:#00FFAA'>[ SENSORS ]</span> A frosted cryo-escape pod drifts silently in the void. Life-support telemetry is flickering.",
        actions: () => [
            {
                label: 'Rescue Occupant',
                key: 'e',
                onclick: () => {
                    const roll = Math.random();
                    let gainedXP = false;
                    if (roll < 0.65) {
                        const reward = 400 + Math.floor(Math.random() * 400);
                        playerCredits += reward;
                        playerXP += 35;
                        gainedXP = true;
                        if (typeof playerFactionStanding !== 'undefined') {
                            playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 3;
                        }
                        logMessage(`<span style='color:var(--success)'>[ RESCUE ]</span> You thaw a stranded merchant pilot. They wire you <b>${formatNumber(reward)}c</b> for passage (+35 XP, +3 Concord Rep).`);
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                    } else {
                        const medQty = 2 + Math.floor(Math.random() * 3);
                        const added = _configSafeAddCargo('MEDICAL_SUPPLIES', medQty);
                        if (added > 0) {
                            logMessage(`<span style='color:var(--accent-color)'>[ SALVAGE ]</span> The pod's occupant is long gone, but you recover <b>${added}x Medical Supplies</b>.`);
                        } else {
                            playerCredits += 250;
                            logMessage(`<span style='color:var(--gold-text)'>[ SALVAGE ]</span> Cargo hold full! You strip the pod's emergency credit chip (+250c).`);
                        }
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                    }
                    _clearCustomTileAtPlayer();
                    if (gainedXP && typeof checkLevelUp === 'function') checkLevelUp();
                }
            },
            {
                label: 'Strip Electronics',
                key: 'x',
                onclick: () => {
                    const techQty = 2 + Math.floor(Math.random() * 3);
                    const added = _configSafeAddCargo('TECH_PARTS', techQty);
                    if (added > 0) {
                        logMessage(`<span style='color:var(--warning)'>[ SCRAPPED ]</span> Dismantled the pod's beacon for <b>${added}x Tech Parts</b>.`);
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
        actions: () => [
            {
                label: 'Wager 200c (Slots)',
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
                label: 'High-Roller (1,000c)',
                key: 'h',
                onclick: () => {
                    if (playerCredits < 1000) {
                        if (typeof showToast === 'function') showToast("Need 1,000c for High-Roller Table!", "error");
                        if (typeof soundManager !== 'undefined') soundManager.playError();
                        return;
                    }
                    playerCredits -= 1000;
                    const roll = Math.random();
                    if (roll < 0.10) {
                        playerCredits += 5000;
                        logMessage("<span style='color:var(--gold-text); font-weight:bold;'>[ GRAND JACKPOT! ]</span> Triple Precursor Rings! The buoy flashes violet and wires <b>5,000c</b>!");
                        if (typeof showToast === 'function') showToast("GRAND JACKPOT! +4,000c NET", "success");
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                    } else if (roll < 0.44) {
                        playerCredits += 2000;
                        logMessage("<span style='color:var(--success)'>[ HIGH-ROLLER WIN ]</span> Pulsar alignment! Payout: <b>2,000c</b>.");
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                    } else {
                        logMessage("<span style='color:var(--danger)'>[ BUST ]</span> The syndicate algorithm sweeps the pot. (-1,000c)");
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
                    playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + 50) * 10) / 10);
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
                    if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
                        playerShields = MAX_SHIELDS;
                    }
                    const drop = Math.random() < 0.4 ? 'PRECURSOR_CIPHER' : 'ARTIFACT_SHARDS';
                    const added = _configSafeAddCargo(drop, 1);
                    const dropName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[drop]) ? COMMODITIES[drop].name : drop;
                    const bonusText = added > 0 ? ` Materialized <b>1x ${dropName}</b> in cargo bay!` : '';
                    const vision = _MONOLITH_VISIONS[Math.floor(Math.random() * _MONOLITH_VISIONS.length)];

                    logMessage(`<span style='color:#DDA0DD'>[ MONOLITH ATTUNED ]</span> <i>"${vision}"</i> (+${xp} XP, Shields Maxed).${bonusText}`);
                    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                    _clearCustomTileAtPlayer();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            }
        ]
    },

    // Static "Alien Obelisk" from locations.js (pure action builder)
    'I': {
        log: "<span style='color:#9933FF'>[ OBSIDIAN OBELISK ]</span> An ancient geometric spire hangs in silent orbit, pulsing with a low violet resonance.",
        actions: (tileObj) => {
            if (tileObj && tileObj.studied) {
                return [
                    {
                        label: 'Inspect Runes',
                        key: 'e',
                        onclick: () => logMessage("<span style='color:var(--item-desc-color)'>Cold geometric trenches run deep into the stone. Whatever intelligence dwelled within has departed.</span>")
                    }
                ];
            }

            return [
                {
                    label: 'Commune with Obelisk',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        logMessage("<span style='color:#9933FF'>[ OBELISK ] The obelisk hums in harmonic sympathy. Your hull knits together (+50 Hull) and star-charts flood your mind (+100 XP).</span>");
                        if (typeof unlockLoreEntry === 'function') {
                            unlockLoreEntry("XENO_PRECURSORS");
                            unlockLoreEntry("LOCATION_OBSIDIAN_OBELISK");
                        }
                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        } else if (tileObj) {
                            tileObj.studied = true;
                        }
                        if (typeof GameBus !== 'undefined') {
                            GameBus.emit('HULL_REPAIRED', 50);
                            GameBus.emit('XP_GAINED', 100);
                        }
                        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                        if (typeof renderContextualActions === 'function') renderContextualActions(TILE_INTERACTIONS['I'].actions(tileObj));
                        if (typeof autoSaveGame === 'function') autoSaveGame();
                    }
                },
                {
                    label: 'Touch Singularity Core (Fatal?)',
                    key: 'x',
                    onclick: () => {
                        if (_configHasPerk('VOID_DIVER')) {
                            const added = _configSafeAddCargo('VOID_CRYSTALS', 2);
                            if (typeof updateWorldState === 'function') {
                                updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                            }
                            playerXP += 250;
                            logMessage(`<span style='color:#DDA0DD; font-weight:bold;'>[ VOID DIVER ]</span> Your mind resists the stone's gravity! You pull back intact with +250 XP${added > 0 ? ` and <b>${added}x Void Crystals</b>` : ''}!`);
                            if (typeof soundManager !== 'undefined') soundManager.playGain();
                            if (typeof checkLevelUp === 'function') checkLevelUp();
                            if (typeof renderContextualActions === 'function') renderContextualActions(TILE_INTERACTIONS['I'].actions(tileObj));
                            if (typeof autoSaveGame === 'function') autoSaveGame();
                        } else if (typeof triggerGameOver === 'function') {
                            triggerGameOver("Your mind was absorbed into the stone.");
                        }
                    }
                },
                {
                    label: 'Back Away Slowly',
                    key: 'l',
                    onclick: () => {
                        logMessage("You sever sensor lock with the monolith.");
                        if (typeof renderContextualActions === 'function') renderContextualActions([]);
                    }
                }
            ];
        }
    },

    // 4. Cargo Cache
    [CARGO_CACHE_CHAR_VAL]: {
        log: "<span style='color:#AAAAAA'>[ SENSORS ]</span> A cluster of reinforced cargo containers is drifting amidst wreckage debris.",
        actions: () => [
            {
                label: 'Tractor Cargo In',
                key: 'e',
                onclick: () => {
                    const lootTables = ['TECH_PARTS', 'FOOD_SUPPLIES', 'MINERALS', 'WATER', 'REFINED_ALLOY'];
                    const picked = lootTables[Math.floor(Math.random() * lootTables.length)];
                    const wantQty = picked === 'REFINED_ALLOY' ? (1 + Math.floor(Math.random() * 2)) : (3 + Math.floor(Math.random() * 5));
                    const added = _configSafeAddCargo(picked, wantQty);

                    if (added <= 0) {
                        if (typeof showToast === 'function') showToast("CARGO HOLD FULL", "error");
                        logMessage("<span style='color:var(--danger)'>[ SALVAGE FAILED ] Cannot tractor containers, cargo hold is full!</span>");
                        return;
                    }

                    const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[picked]) ? COMMODITIES[picked].name : picked;
                    logMessage(`<span style='color:var(--success)'>[ SALVAGE ]</span> Recovered <b>${added}x ${itemName}</b> from the drifting cache.`);
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
        actions: () => [
            {
                label: 'Defuse Mine (Cyber Slicer)',
                key: 'e',
                onclick: () => {
                    if (_configHasPerk('CYBER_SLICER')) {
                        playerXP += 75;
                        const salvaged = _configSafeAddCargo('WEAPONS', 1) || _configSafeAddCargo('TECH_PARTS', 2);
                        const salvageMsg = salvaged > 0 ? " Salvaged intact ordnance from the warhead." : "";
                        logMessage(`<span style='color:var(--success)'>[ DEFUSED ]</span> Cyber Slicer rapidly disabled the archaic detonator sequence (+75 XP).${salvageMsg}`);
                        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                        _clearCustomTileAtPlayer();
                        if (typeof checkLevelUp === 'function') checkLevelUp();
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
                    logMessage(`<span style='color:var(--warning)'>[ DETONATION ]</span> You blast the mine from close range. The shockwave strikes your hull for ${damage} damage.`);
                    if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: damage, reason: "Space Mine Shockwave" });
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Evasive Retreat (Risk)',
                key: 'l',
                onclick: () => {
                    const evadeOdds = Math.min(0.90, 0.50 + (typeof PLAYER_EVASION !== 'undefined' ? PLAYER_EVASION : 0));
                    if (Math.random() < evadeOdds) {
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
        actions: (tileObj) => {
            if (tileObj && tileObj.studied) {
                return [
                    {
                        label: 'Ping Nearest Port',
                        key: 'e',
                        onclick: () => {
                            if (typeof findNearestStation === 'function') {
                                const st = findNearestStation(playerX, playerY);
                                if (st) {
                                    const dx = st.x - playerX;
                                    const dy = st.y - playerY;
                                    const dist = Math.floor(Math.sqrt(dx * dx + dy * dy));
                                    logMessage(`<span style='color:#00AAFF'>[ NAV-BUOY ]</span> Nearest port: <b>${_configEscapeHtml(st.name)}</b> at [${st.x}, ${-st.y}] (${dist}u ${_getCompassBearing(dx, dy)}).`);
                                    if (typeof soundManager !== 'undefined') soundManager.playScan();
                                }
                            }
                        }
                    }
                ];
            }
            return [
                {
                    label: 'Download Telemetry',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        const xp = 50;
                        playerXP += xp;

                        let extraLoot = "";
                        if (Math.random() < 0.30) {
                            const added = _configSafeAddCargo('NAVIGATION_CHARTS', 1);
                            if (added > 0) extraLoot = " Copied <b>1x Nav-Charts</b> to data drive.";
                        }

                        let nearestNote = "";
                        if (typeof findNearestStation === 'function') {
                            const st = findNearestStation(playerX, playerY);
                            if (st) {
                                const dx = st.x - playerX;
                                const dy = st.y - playerY;
                                const dist = Math.floor(Math.sqrt(dx * dx + dy * dy));
                                nearestNote = ` Nearest port: <b>${_configEscapeHtml(st.name)}</b> (${dist}u ${_getCompassBearing(dx, dy)}).`;
                            }
                        }

                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        } else if (tileObj) {
                            tileObj.studied = true;
                        }

                        logMessage(`<span style='color:#00AAFF'>[ DATA SECURED ]</span> Sector topography updated (+${xp} XP).${extraLoot}${nearestNote}`);
                        if (typeof soundManager !== 'undefined') soundManager.playScan();
                        if (typeof renderUIStats === 'function') renderUIStats();
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                        if (typeof handleInteraction === 'function') handleInteraction();
                        if (typeof autoSaveGame === 'function') autoSaveGame();
                    }
                }
            ];
        }
    },

    // 7. Deep-Space Astrometric Research Satellite (¤)
    [RESEARCH_SAT_CHAR_VAL]: {
        log: "<span style='color:#00FFFF'>[ RESEARCH SATELLITE ]</span> A solar-finned University of Cygnus astrometric probe drifts off-axis, broadcasting narrowband spectral telemetry.",
        actions: (tileObj) => {
            const acts = [];
            if (!tileObj || !tileObj.studied) {
                acts.push({
                    label: 'Download Spectral Data',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        const isNexStar = typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.scanner === 'SCANNER_NEXSTAR_4SE';
                        const hasSensors = isNexStar || _configHasPerk('LONG_RANGE_SENSORS');
                        const xp = hasSensors ? 95 : 65;
                        playerXP += xp;

                        let dropNote = "";
                        const roll = Math.random();
                        if (hasSensors && roll < 0.25) {
                            if (_configSafeAddCargo('DATA_PULSAR', 1) > 0) dropNote = " Extracted <b>1x Pulsar Timing Data</b>!";
                        } else if (roll < 0.55) {
                            if (_configSafeAddCargo('PLANETARY_DATA', 1) > 0) dropNote = " Extracted <b>1x Planetary Data</b> cartridge!";
                        }

                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        } else if (tileObj) {
                            tileObj.studied = true;
                        }

                        logMessage(`<span style='color:#00FFFF'>[ ASTROMETRIC RELAY ]</span> Downloaded deep-sky interferometry logs (+${xp} XP).${dropNote}`);
                        if (typeof soundManager !== 'undefined') soundManager.playScan();
                        if (typeof renderUIStats === 'function') renderUIStats();
                        if (typeof checkLevelUp === 'function') checkLevelUp();
                        if (typeof handleInteraction === 'function') handleInteraction();
                        if (typeof autoSaveGame === 'function') autoSaveGame();
                    }
                });
            }
            acts.push({
                label: 'Salvage Optics',
                key: 'x',
                onclick: () => {
                    const added = _configSafeAddCargo('TECH_PARTS', 2 + Math.floor(Math.random() * 3));
                    if (added > 0) {
                        logMessage(`<span style='color:var(--warning)'>[ SALVAGED ]</span> Stripped the derelict probe's gyros and mirrors for <b>${added}x Tech Parts</b>.`);
                    } else {
                        playerCredits += 300;
                        logMessage("<span style='color:var(--gold-text)'>[ SALVAGED ]</span> Cargo full! Broadcast the satellite's recovery transponder for a <b>300c</b> finder's fee.");
                    }
                    if (typeof soundManager !== 'undefined') soundManager.playMining();
                    _clearCustomTileAtPlayer();
                }
            });
            return acts;
        }
    },

    // 8. Abandoned Promethium Fuel Tanker (F)
    [FUEL_TANKER_CHAR_VAL]: {
        log: "<span style='color:var(--warning)'>[ FUEL BARGE ]</span> A scarred, derelict promethium tanker floats silently. Reserve cryogenic tanks still register positive pressure.",
        actions: () => [
            {
                label: 'Siphon Reserve Tanks (Safe)',
                key: 'e',
                onclick: () => {
                    const fuelGain = 45 + Math.floor(Math.random() * 35);
                    const prevFuel = typeof playerFuel !== 'undefined' ? playerFuel : 0;
                    playerFuel = Math.min(MAX_FUEL, Math.round((prevFuel + fuelGain) * 10) / 10);
                    const actual = Math.max(0, Math.round((playerFuel - prevFuel) * 10) / 10);

                    let extra = "";
                    if (actual < 15) {
                        const addedCells = _configSafeAddCargo('FUEL_CELLS', 3);
                        if (addedCells > 0) extra = ` Tanks nearly full—pumped <b>${addedCells}x Fuel Cells</b> into cargo!`;
                    }

                    logMessage(`<span style='color:var(--success)'>[ FUEL SIPHON ]</span> Transferred <b>+${actual.toFixed(1)} Fuel</b> from the drifting barge.${extra}`);
                    if (typeof soundManager !== 'undefined') soundManager.playBuy();
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Tap Pressurized Core (Risk)',
                key: 'x',
                onclick: () => {
                    const isProtected = _configHasPerk('HEALTH_PHYSICIST') ||
                        (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY');

                    if (!isProtected && Math.random() < 0.30) {
                        logMessage("<span style='color:var(--danger)'>[ VALVE RUPTURE ]</span> Super-cooled plasma vented across your hull (-15 Hull), though you still captured emergency fuel!");
                        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 15, reason: "Fuel Barge Valve Rupture" });
                        if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
                    }

                    playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + 110) * 10) / 10);
                    const addedH3 = _configSafeAddCargo('HYDROGEN_3', 1 + Math.floor(Math.random() * 2));
                    logMessage(`<span style='color:#00FFFF'>[ CORE TAPPED ]</span> Extracted +110 Fuel${addedH3 > 0 ? ` and <b>${addedH3}x Hydrogen-3</b>` : ''}!`);
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Leave Tanker',
                key: 'l',
                onclick: () => logMessage("You steer clear of the unstable fuel barge.")
            }
        ]
    },

    // 9. Pre-Warp Time Capsule / Archive Buoy (T)
    [TIME_CAPSULE_CHAR_VAL]: {
        log: "<span style='color:#DDA0DD'>[ ARCHIVE CAPSULE ]</span> A weathered titanium time capsule tumbles through the dark, pinging an archaic optical distress code.",
        actions: () => [
            {
                label: 'Decode Historical Log',
                key: 'e',
                onclick: () => {
                    const { entry, isNew } = _pickNextTimeCapsuleLog();

                    const xp = isNew ? 95 : 65;
                    const bounty = 220 + Math.floor(Math.random() * 250);
                    playerXP += xp;
                    playerCredits += bounty;

                    if (entry.loreKey && typeof unlockLoreEntry === 'function') {
                        unlockLoreEntry(entry.loreKey);
                    }

                    logMessage(`<span style='color:#DDA0DD; font-weight:bold;'>[ ARCHIVE: ${entry.era} ]</span> <i>"${entry.text}"</i> (+${xp} XP, +${formatNumber(bounty)}c Academic Grant)`);
                    if (typeof showToast === 'function') showToast(`ARCHIVE DECODED (+${xp} XP)`, "success");
                    if (typeof soundManager !== 'undefined') soundManager.playGain();

                    _clearCustomTileAtPlayer();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            }
        ]
    },

    // 10. NEW POI: Automated Hull-Repair Buoy (+)
    [REPAIR_BUOY_CHAR_VAL]: {
        log: "<span style='color:#00FF88'>[ REPAIR BUOY ]</span> An automated Fuel Rats & Concord field-maintenance drone platform hovers silently, welder arms blinking amber.",
        actions: () => [
            {
                label: 'Field Patch (+40 Hull, 120c)',
                key: 'e',
                onclick: () => {
                    const needsHull = typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined' && playerHull < MAX_PLAYER_HULL;
                    const needsShields = typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined' && playerShields < MAX_SHIELDS;
                    if (!needsHull && !needsShields) {
                        if (typeof showToast === 'function') showToast("HULL & SHIELDS ALREADY AT 100%", "info");
                        return;
                    }
                    if (playerCredits < 120) {
                        if (typeof showToast === 'function') showToast("INSUFFICIENT CREDITS (120c)", "error");
                        if (typeof soundManager !== 'undefined') soundManager.playError();
                        return;
                    }
                    playerCredits -= 120;
                    if (typeof GameBus !== 'undefined') GameBus.emit('HULL_REPAIRED', 40);
                    else if (typeof MAX_PLAYER_HULL !== 'undefined') playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 40);
                    if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;

                    logMessage("<span style='color:var(--success)'>[ REPAIR BUOY ]</span> Automated welding arms sealed outer breaches (+40 Hull, 100% Shields) for 120c.");
                    if (typeof showToast === 'function') showToast("FIELD REPAIR COMPLETE", "success");
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Salvage Repair Drone',
                key: 'x',
                onclick: () => {
                    const addedKit = _configSafeAddCargo('NANO_REPAIR_KIT', 1);
                    if (addedKit > 0) {
                        logMessage("<span style='color:var(--accent-color)'>[ SALVAGED ]</span> Extracted <b>1x Nano-Repair Kit</b> from the maintenance buoy's dispenser.");
                    } else {
                        const addedTech = _configSafeAddCargo('TECH_PARTS', 2);
                        if (addedTech > 0) logMessage(`<span style='color:var(--warning)'>[ SALVAGED ]</span> Stripped <b>${addedTech}x Tech Parts</b> from the buoy.`);
                        else {
                            playerCredits += 180;
                            logMessage("<span style='color:var(--gold-text)'>[ SALVAGED ]</span> Cargo full! Sold the buoy's maintenance beacon codes (+180c).");
                        }
                    }
                    if (typeof soundManager !== 'undefined') soundManager.playMining();
                    _clearCustomTileAtPlayer();
                }
            },
            {
                label: 'Leave Buoy',
                key: 'l',
                onclick: () => logMessage("You leave the automated repair platform operational for the next passing hull.")
            }
        ]
    },

    // 11. NEW POI: Syndicate Dead-Drop Pod (!)
    [SMUGGLER_DROP_CHAR_VAL]: {
        log: "<span style='color:#FF66AA'>[ DEAD-DROP POD ]</span> A matte-black Eclipse Cartel dead-drop canister pulses faintly on an encrypted low-band frequency.",
        actions: () => [
            {
                label: 'Crack Magnetic Clamps',
                key: 'e',
                onclick: () => {
                    const hasSlicer = _configHasPerk('CYBER_SLICER');
                    const tripped = !hasSlicer && Math.random() < 0.30;

                    if (tripped) {
                        logMessage("<span style='color:var(--danger)'>[ DEAD-DROP TRAP ]</span> Anti-tamper micro-charge detonated (-12 Hull) and pinged a local patrol (+2 Notoriety)!");
                        if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(2);
                        if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 12, reason: "Syndicate Dead-Drop Trap" });
                        _clearCustomTileAtPlayer();
                        return;
                    }

                    const pool = ['PROHIBITED_STIMS', 'STARDUST_EXOTICA', 'ARTIFACT_SHARDS', 'SENSOR_DECOY', 'SYNDICATE_LEDGER'];
                    const picked = pool[Math.floor(Math.random() * pool.length)];
                    const qty = picked === 'PROHIBITED_STIMS' || picked === 'ARTIFACT_SHARDS' ? 2 : 1;
                    const added = _configSafeAddCargo(picked, qty);
                    const credBonus = 250 + Math.floor(Math.random() * 350);
                    const xpGain = hasSlicer ? 90 : 55;

                    playerCredits += credBonus;
                    playerXP += xpGain;
                    if (typeof unlockLoreEntry === 'function') unlockLoreEntry('FACTION_ECLIPSE_SMUGGLING');

                    const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[picked]) ? COMMODITIES[picked].name : picked;
                    const cargoText = added > 0 ? ` and <b>${added}x ${itemName}</b>` : ' (hold full — contraband left behind)';
                    logMessage(`<span style='color:#FF66AA; font-weight:bold;'>[ DEAD-DROP CRACKED ]</span> ${hasSlicer ? 'Cyber Slicer bypassed the trap cleanly! ' : ''}Recovered <b>${formatNumber(credBonus)}c</b>${cargoText} (+${xpGain} XP).`);
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    if (typeof showToast === 'function') showToast("DEAD-DROP LOOTED", "success");

                    _clearCustomTileAtPlayer();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            },
            {
                label: 'Report Drop to SEC-COM',
                key: 'x',
                onclick: () => {
                    playerCredits += 350;
                    playerXP += 40;
                    if (typeof playerFactionStanding !== 'undefined') {
                        playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 3;
                    }
                    logMessage("<span style='color:var(--accent-color)'>[ SEC-COM BOUNTY ]</span> Transmitted dead-drop coordinates to Concord Intelligence. Wired <b>350c</b> (+40 XP, +3 Concord Rep).");
                    if (typeof soundManager !== 'undefined') soundManager.playBuy();
                    if (typeof showToast === 'function') showToast("+350c & +3 CONCORD REP", "success");
                    _clearCustomTileAtPlayer();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            }
        ]
    },

    // 12. NEW POI: Precursor Echo Beacon (E)
    [ECHO_RELAY_CHAR_VAL]: {
        log: "<span style='color:#40E0D0'>[ ECHO BEACON ]</span> A slender, crystalline Precursor acoustic relay turns in empty space, broadcasting a haunting three-note harmonic.",
        actions: () => [
            {
                label: 'Record Harmonic Echo',
                key: 'e',
                onclick: () => {
                    const xp = 100;
                    playerXP += xp;
                    if (typeof stealthHeat !== 'undefined') stealthHeat = 0;
                    if (typeof unlockLoreEntry === 'function') {
                        unlockLoreEntry('PRECURSOR_ORIGINS');
                        unlockLoreEntry('LEGEND_THE_SILENCERS');
                    }

                    let dropNote = "";
                    if (Math.random() < 0.35) {
                        const dropId = Math.random() < 0.55 ? 'ENCRYPTED_ENGRAM' : 'DATA_PULSAR';
                        const added = _configSafeAddCargo(dropId, 1);
                        if (added > 0) {
                            const name = (typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId]) ? COMMODITIES[dropId].name : dropId;
                            dropNote = ` Resonance crystallized <b>1x ${name}</b>!`;
                        }
                    }

                    const vision = _MONOLITH_VISIONS[Math.floor(Math.random() * _MONOLITH_VISIONS.length)];
                    logMessage(`<span style='color:#40E0D0'>[ ECHO RECORDED ]</span> <i>"${vision}"</i> (+${xp} XP, Stealth Heat flushed).${dropNote}`);
                    if (typeof soundManager !== 'undefined') soundManager.playScan();
                    if (typeof showToast === 'function') showToast("PRECURSOR ECHO LOGGED", "success");

                    _clearCustomTileAtPlayer();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            }
        ]
    }
};

// ==========================================
// --- DISPLAY PALETTE MANAGER (CRT MODES) ---
// ==========================================

const _DISPLAY_PALETTES = [
    { id: 'dark',     label: 'Deep Void',      className: null,            themeColor: '#050510' },
    { id: 'phosphor', label: 'Phosphor Green', className: 'phosphor-mode', themeColor: '#020a04' },
    { id: 'amber',    label: 'Amber CRT',      className: 'amber-mode',    themeColor: '#0a0602' }
];

function getDisplayPalette() {
    if (document.body) {
        if (document.body.classList.contains('light-mode')) return 'light';
        if (document.body.classList.contains('phosphor-mode')) return 'phosphor';
        if (document.body.classList.contains('amber-mode')) return 'amber';
    }
    return 'dark';
}

function setDisplayPalette(paletteId, persist = true) {
    if (!document.body) return;
    const def = _DISPLAY_PALETTES.find(p => p.id === paletteId) || _DISPLAY_PALETTES[0];

    document.body.classList.remove('phosphor-mode', 'amber-mode', 'light-mode');
    if (def.className) document.body.classList.add(def.className);

    document.documentElement.style.backgroundColor = def.themeColor;
    const metaTheme = document.getElementById('metaThemeColor');
    if (metaTheme) metaTheme.setAttribute('content', def.themeColor);

    const themeBtn = document.getElementById('themeButton');
    if (themeBtn) themeBtn.textContent = "Light Mode";

    const palBtn = document.getElementById('paletteToggleButton');
    if (palBtn) palBtn.textContent = `Palette: ${def.label}`;

    if (persist) {
        try {
            localStorage.setItem('wayfinder_crt_palette', def.id);
            localStorage.setItem('wayfinderTheme', 'dark');
        } catch (e) {}
    }

    if (typeof getThemeColor === 'function' && typeof cachedAccentColor !== 'undefined') {
        cachedAccentColor = getThemeColor('--accent-color', '#00E0E0');
    }
    if (typeof render === 'function' && typeof currentGameState !== 'undefined' && currentGameState !== 'title_screen') {
        render();
    }
}

function cycleDisplayPalette() {
    const current = getDisplayPalette();
    const curIdx = _DISPLAY_PALETTES.findIndex(p => p.id === current);
    const nextDef = _DISPLAY_PALETTES[(curIdx + 1) % _DISPLAY_PALETTES.length];
    setDisplayPalette(nextDef.id, true);
    if (typeof soundManager !== 'undefined' && typeof soundManager.playUIClick === 'function') {
        soundManager.playUIClick();
    }
    if (typeof showToast === 'function') {
        showToast(`TERMINAL PALETTE: ${nextDef.label.toUpperCase()}`, "info");
    }
}

window.setDisplayPalette = setDisplayPalette;
window.cycleDisplayPalette = cycleDisplayPalette;

// ==========================================
// --- PUBLIC EXPANDABILITY REGISTRY ---
// ==========================================

window.ConfigRegistry = {
    registerTileInteraction(charKey, def) {
        if (!charKey || !def) return false;
        TILE_INTERACTIONS[charKey] = def;
        return true;
    },
    registerDeepSpacePOI(poiDef) {
        if (!poiDef || !poiDef.id || typeof poiDef.chance !== 'number' || typeof poiDef.createTile !== 'function') return false;
        const idx = DEEP_SPACE_POI_TABLE.findIndex(p => p.id === poiDef.id);
        if (idx !== -1) DEEP_SPACE_POI_TABLE[idx] = poiDef;
        else DEEP_SPACE_POI_TABLE.push(poiDef);
        return true;
    },
    registerTimeCapsuleLog(logObj) {
        if (!logObj || !logObj.era || !logObj.text) return false;
        _TIME_CAPSULE_LOGS.push(logObj);
        return true;
    },
    getDeepSpacePOIs: () => DEEP_SPACE_POI_TABLE.slice(),
    getDifficultyAt: (x, y) => {
        const dist = Math.sqrt((x * x) + (y * y));
        return parseFloat((1 + (dist / 400)).toFixed(2));
    },
    setDisplayPalette,
    cycleDisplayPalette,
    getDisplayPalette
};

// ==========================================
// --- ASTROMETRIC OBSERVATORY (HOTKEY O) ---
// ==========================================

let _lastObservatoryScan = null;

function _renderObservatorySummaryDetail(scan) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl || !scan) return;

    const sectorPhotoKey = `ASTRO_PHOTO_${typeof currentSectorX !== 'undefined' ? currentSectorX : 0}_${typeof currentSectorY !== 'undefined' ? currentSectorY : 0}`;
    const alreadyImaged = typeof discoveredLocations !== 'undefined' && discoveredLocations.has && discoveredLocations.has(sectorPhotoKey);

    let totalPlates = 0;
    if (typeof discoveredLocations !== 'undefined' && discoveredLocations.forEach) {
        discoveredLocations.forEach(k => {
            if (typeof k === 'string' && k.startsWith('ASTRO_PHOTO_')) totalPlates++;
        });
    }

    const exposureSeed = Math.abs(((typeof currentSectorX !== 'undefined' ? currentSectorX : 0) * 31) ^ ((typeof currentSectorY !== 'undefined' ? currentSectorY : 0) * 17));
    const filterBands = ["H-Alpha (656.3 nm)", "O-III (500.7 nm)", "S-II (672.4 nm)", "Broadband Luminance"];
    const bandLabel = filterBands[exposureSeed % filterBands.length];

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 14px;">
            <div style="font-size:44px; margin-bottom:8px; filter: drop-shadow(0 0 15px var(--accent-color));">🔭</div>
            <h3 style="color:var(--accent-color); margin:0 0 4px 0; letter-spacing:1px;">${_configEscapeHtml(scan.scannerName.toUpperCase())}</h3>
            <div style="font-size:10px; color:var(--item-desc-color); letter-spacing:2px; margin-bottom:14px;">
                SECTOR: ${_configEscapeHtml(typeof currentSectorName !== 'undefined' ? currentSectorName.toUpperCase() : 'DEEP SPACE')}
            </div>

            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Local Stars Mapped:</span> <span style="color:var(--accent-color); font-weight:bold;">${scan.stars.length}</span></div>
                <div class="trade-stat-row"><span>Anomalies &amp; Hazards:</span> <span style="color:#FF33FF; font-weight:bold;">${scan.anomalies.length}</span></div>
                <div class="trade-stat-row"><span>Wrecks / Pods / Barges:</span> <span style="color:var(--warning); font-weight:bold;">${scan.derelicts.length}</span></div>
                <div class="trade-stat-row"><span>Ports &amp; Relays:</span> <span style="color:var(--success); font-weight:bold;">${scan.stations.length}</span></div>
                <div class="trade-stat-row" style="margin-top:6px; border-top:1px dashed #333; padding-top:6px;">
                    <span>Optical Resolution:</span>
                    <span style="color:var(--success); font-weight:bold;">${scan.resolutionLabel}</span>
                </div>
                <div class="trade-stat-row"><span>Narrowband Filter:</span> <span style="color:var(--gold-text);">${bandLabel}</span></div>
                <div class="trade-stat-row"><span>Archived Sector Plates:</span> <span style="color:var(--text-color); font-weight:bold;">${totalPlates}</span></div>
            </div>

            <p style="font-size:12px; color:var(--text-color); line-height:1.5; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--accent-color); text-align:left; margin-top:12px;">
                ${alreadyImaged
                    ? "Long-exposure astrophotography plates for this sector have been archived in your ship's databanks. Click any contact on the left to inspect its telemetry."
                    : "Align your optical array and capture a long-exposure deep-sky plate of this sector's nebular and stellar alignments. Click any contact on the left for live telemetry."}
            </p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" ${alreadyImaged ? 'disabled' : ''} style="${alreadyImaged ? '' : 'border-color:var(--success); color:var(--success);'}" onclick="captureDeepSkyImage()">
            ${alreadyImaged ? '✓ SECTOR PLATE ARCHIVED' : '📸 CAPTURE DEEP-SKY PLATE'}
        </button>
        <button class="action-button" onclick="closeGenericModal()">CLOSE OBSERVATORY</button>
    `;
}

function previewObservatoryStar(starIndex) {
    if (!_lastObservatoryScan || !_lastObservatoryScan.stars[starIndex]) return;
    const s = _lastObservatoryScan.stars[starIndex];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    const safeColor = _getContrastSafeStarColor(s.data);
    if (typeof soundManager !== 'undefined') soundManager.playUIClick();

    detailEl.innerHTML = `
        <div style="text-align:center; padding:14px; animation: fadeIn 0.25s ease-out;">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:4px;">OPTICAL SPECTROSCOPY PREVIEW</div>
            <h3 style="color:${safeColor}; margin:0 0 6px 0;">★ ${_configEscapeHtml(s.data.designation)}</h3>
            <div style="font-size:11px; color:var(--item-desc-color); margin-bottom:14px;">
                ${_configEscapeHtml(s.data.class)}-Class ${_configEscapeHtml(s.data.name)} &nbsp;|&nbsp; Bearing: <b>${s.dist}u ${s.bearing}</b>
            </div>

            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Coordinates:</span> <span style="color:var(--accent-color); font-weight:bold;">[${s.x}, ${-s.y}]</span></div>
                <div class="trade-stat-row"><span>Photosphere Temp:</span> <span style="color:var(--text-color); font-weight:bold;">${_configEscapeHtml(s.data.temp)}</span></div>
                <div class="trade-stat-row"><span>Corona Hazard:</span> <span style="color:${s.data.hazard === 'NONE' ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${_configEscapeHtml(s.data.hazard)}</span></div>
                <div class="trade-stat-row"><span>Est. Scoop Yield:</span> <span style="color:var(--gold-text); font-weight:bold;">${s.data.scoopYield} Fuel Units</span></div>
                <div class="trade-stat-row"><span>Galactic Incidence:</span> <span style="color:var(--text-color);">${(s.data.rarity * 100).toFixed(1)}%</span></div>
            </div>

            <p style="font-size:12px; color:var(--item-desc-color); font-style:italic; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${safeColor}; text-align:left; margin-top:12px; line-height:1.5;">
                "${_configEscapeHtml(s.data.desc)}"
            </p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="_renderObservatorySummaryDetail(_lastObservatoryScan)">◀ BACK TO OBSERVATORY PLATE</button>
        <button class="action-button" onclick="closeGenericModal()">CLOSE OBSERVATORY</button>
    `;
}

function previewObservatoryContact(groupKey, idx) {
    if (!_lastObservatoryScan || !_lastObservatoryScan[groupKey] || !_lastObservatoryScan[groupKey][idx]) return;
    const item = _lastObservatoryScan[groupKey][idx];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    if (typeof soundManager !== 'undefined') soundManager.playUIClick();

    detailEl.innerHTML = `
        <div style="text-align:center; padding:14px; animation: fadeIn 0.25s ease-out;">
            <div style="font-size:40px; margin-bottom:8px;">${item.icon || '📡'}</div>
            <div style="font-size:10px; color:${item.color || 'var(--accent-color)'}; letter-spacing:2px; margin-bottom:4px;">${_configEscapeHtml(item.subLabel || 'LONG-RANGE CONTACT')}</div>
            <h3 style="color:var(--item-name-color); margin:0 0 12px 0;">${_configEscapeHtml(item.label || item.name || 'Unidentified Signature')}</h3>

            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Coordinates:</span> <span style="color:var(--accent-color); font-weight:bold;">[${item.x}, ${-item.y}]</span></div>
                <div class="trade-stat-row"><span>Distance / Bearing:</span> <span style="color:var(--gold-text); font-weight:bold;">${item.dist}u ${item.bearing}</span></div>
                <div class="trade-stat-row"><span>Classification:</span> <span style="color:${item.color || 'var(--text-color)'}; font-weight:bold;">${_configEscapeHtml(item.subLabel || 'Contact')}</span></div>
            </div>

            <p style="font-size:12px; color:var(--item-desc-color); background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid ${item.color || 'var(--accent-color)'}; text-align:left; margin-top:12px; line-height:1.5;">
                ${_configEscapeHtml(item.summary || "Plot a manual course toward these coordinates to investigate up close.")}
            </p>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--accent-color); color:var(--accent-color);" onclick="_renderObservatorySummaryDetail(_lastObservatoryScan)">◀ BACK TO OBSERVATORY PLATE</button>
        <button class="action-button" onclick="closeGenericModal()">CLOSE OBSERVATORY</button>
    `;
}

function openObservatory() {
    if (typeof openGenericModal !== 'function') return;

    openGenericModal("DEEP SPACE ASTROMETRIC OBSERVATORY");
    const listEl = document.getElementById('genericModalList');
    if (!listEl) return;

    const scannerId = (typeof playerShip !== 'undefined' && playerShip.components) ? playerShip.components.scanner : 'SCANNER_BASIC_SUITE';
    const scannerObj = (typeof COMPONENTS_DATABASE !== 'undefined' && COMPONENTS_DATABASE[scannerId]) ? COMPONENTS_DATABASE[scannerId] : { name: "Standard Sensor Suite", stats: {} };
    const isNexStar = scannerId === 'SCANNER_NEXSTAR_4SE';
    const isHighSpecScanner = scannerId === 'SCANNER_CYGNUS_SPECTROMETER' || scannerId === 'SCANNER_CONCORD_MILITARY';
    const hasTelemetryPerk = _configHasPerk('LONG_RANGE_SENSORS');

    let scanRange = 8;
    let resolutionLabel = "Standard";
    if (isNexStar) {
        scanRange = 16;
        resolutionLabel = "NexStar-4SE Prime Focus (+100%)";
    } else if (isHighSpecScanner) {
        scanRange = 14;
        resolutionLabel = "High-Gain Interferometry (+75%)";
    } else if (hasTelemetryPerk) {
        scanRange = 12;
        resolutionLabel = "Telemetry Array (+50%)";
    }

    const maxDistSq = scanRange * scanRange;

    const stars = [];
    const anomalies = [];
    const derelicts = [];
    const stations = [];

    if (typeof chunkManager !== 'undefined') {
        for (let dy = -scanRange; dy <= scanRange; dy++) {
            const dySq = dy * dy;
            for (let dx = -scanRange; dx <= scanRange; dx++) {
                if (dx === 0 && dy === 0) continue;
                const distSq = dx * dx + dySq;
                if (distSq > maxDistSq) continue;

                const wx = playerX + dx;
                const wy = playerY + dy;
                const t = chunkManager.getTile(wx, wy);
                const ch = typeof getTileChar === 'function' ? getTileChar(t) : t;
                if (ch === EMPTY_SPACE_CHAR_VAL || ch === ASTEROID_CHAR_VAL || ch === NEBULA_CHAR_VAL) continue;

                const dist = Math.floor(Math.sqrt(distSq));
                const bearing = _getCompassBearing(dx, dy);

                if (ch === STAR_CHAR_VAL && typeof generateStarData === 'function') {
                    stars.push({ x: wx, y: wy, dist, bearing, data: generateStarData(wx, wy) });
                } else if (
                    ch === ANOMALY_CHAR_VAL || ch === WORMHOLE_CHAR_VAL || ch === BLACK_HOLE_CHAR_VAL ||
                    ch === MONOLITH_CHAR_VAL || ch === SPACE_MINE_CHAR_VAL || ch === NEXUS_CHAR_VAL || ch === ECHO_RELAY_CHAR_VAL
                ) {
                    let label = 'Spatial Anomaly', color = '#FF33FF', icon = '🌀', summary = 'Unstable subspace phenomenon. Investigate for astrometric data or containment rewards.';
                    if (ch === WORMHOLE_CHAR_VAL) { label = 'Subspace Wormhole'; color = '#FFB800'; summary = 'Natural spacetime fracture usable for long-range fast travel.'; }
                    else if (ch === BLACK_HOLE_CHAR_VAL) { label = 'Micro-Singularity'; color = '#9933FF'; icon = '⚫'; summary = 'Lethal gravity well. Stay clear unless carrying a Precursor Nav-Core or Void Diver.'; }
                    else if (ch === MONOLITH_CHAR_VAL) { label = 'Precursor Monolith'; color = '#9933FF'; icon = 'Ψ'; summary = 'Ancient harmonic obelisk radiating Precursor calibration signals.'; }
                    else if (ch === SPACE_MINE_CHAR_VAL) { label = 'Live Ordnance (Mine)'; color = 'var(--danger)'; icon = '💣'; summary = 'Terran Wars proximity mine. Defusable with Cyber Slicer.'; }
                    else if (ch === NEXUS_CHAR_VAL) { label = 'The First Nexus'; color = '#40E0D0'; icon = '💠'; summary = 'Colossal Precursor geometric construct pulsing across subspace.'; }
                    else if (ch === ECHO_RELAY_CHAR_VAL) { label = 'Precursor Echo Beacon'; color = '#40E0D0'; icon = '🎵'; summary = 'Harmonic Precursor relay repeating signals from the First Chord.'; }
                    anomalies.push({ x: wx, y: wy, dist, bearing, char: ch, label, color, icon, subLabel: 'Exotic / Hazard Signature', summary });
                } else if (
                    ch === DERELICT_CHAR_VAL || ch === ESCAPE_POD_CHAR_VAL || ch === CARGO_CACHE_CHAR_VAL ||
                    ch === FUEL_TANKER_CHAR_VAL || ch === TIME_CAPSULE_CHAR_VAL || ch === RESEARCH_SAT_CHAR_VAL ||
                    ch === REPAIR_BUOY_CHAR_VAL || ch === SMUGGLER_DROP_CHAR_VAL
                ) {
                    let label = 'Derelict Hull', color = 'var(--warning)', icon = '🛰️', summary = 'Silent wreck adrift in deep space. Scan, salvage, or breach airlock.';
                    if (ch === ESCAPE_POD_CHAR_VAL) { label = 'Cryo-Escape Pod'; color = '#00FFAA'; summary = 'Drifting life-pod emitting weak life-support telemetry.'; }
                    else if (ch === CARGO_CACHE_CHAR_VAL) { label = 'Drifting Cargo Cache'; summary = 'Reinforced freight containers floating free in the debris.'; }
                    else if (ch === FUEL_TANKER_CHAR_VAL) { label = 'Abandoned Fuel Barge'; icon = '⛽'; summary = 'Pressurized promethium tanks still hold siphonable deuterium.'; }
                    else if (ch === TIME_CAPSULE_CHAR_VAL) { label = 'Pre-Warp Time Capsule'; color = '#DDA0DD'; icon = '🕰️'; summary = 'Historical archive capsule carrying pre-Concord logs.'; }
                    else if (ch === RESEARCH_SAT_CHAR_VAL) { label = 'Research Satellite'; color = '#00FFFF'; summary = 'Cygnus astrometric probe broadcasting spectral data.'; }
                    else if (ch === REPAIR_BUOY_CHAR_VAL) { label = 'Automated Repair Buoy'; color = '#00FF88'; icon = '🔧'; summary = 'Field maintenance platform offering 120c hull patches or salvage.'; }
                    else if (ch === SMUGGLER_DROP_CHAR_VAL) { label = 'Syndicate Dead-Drop'; color = '#FF66AA'; icon = '📦'; summary = 'Encrypted Cartel cache—crack with Cyber Slicer or report to SEC-COM.'; }
                    derelicts.push({ x: wx, y: wy, dist, bearing, char: ch, label, color, icon, subLabel: 'Salvage / Telemetry Contact', summary });
                } else if (t && t.type === 'location') {
                    const isLm = Boolean(t.isLandmark);
                    stations.push({
                        x: wx, y: wy, dist, bearing,
                        label: t.name || 'Outpost',
                        color: isLm ? (t.customColor || '#DDA0DD') : 'var(--success)',
                        icon: isLm ? 'Ψ' : '⚓',
                        subLabel: isLm ? 'Deep-Space Landmark' : 'Port / Outpost',
                        summary: typeof t.scanFlavor === 'string' ? t.scanFlavor : 'Active orbital station or charted landmark.'
                    });
                } else if (ch === NAV_BUOY_CHAR_VAL || ch === RELAY_CASINO_CHAR_VAL) {
                    const isNav = ch === NAV_BUOY_CHAR_VAL;
                    stations.push({
                        x: wx, y: wy, dist, bearing,
                        label: isNav ? 'Concord Nav-Buoy' : 'Syndicate Relay Buoy',
                        color: isNav ? '#00AAFF' : 'var(--gold-text)',
                        icon: isNav ? '📡' : '🎰',
                        subLabel: 'Deep-Space Beacon',
                        summary: isNav ? 'Automated sector mapping buoy transmitting local charts.' : 'Unmarked syndicate wagering & emergency fuel relay.'
                    });
                }
            }
        }
    }

    stars.sort((a, b) => a.dist - b.dist);
    anomalies.sort((a, b) => a.dist - b.dist);
    derelicts.sort((a, b) => a.dist - b.dist);
    stations.sort((a, b) => a.dist - b.dist);

    _lastObservatoryScan = {
        scannerName: scannerObj.name || "Standard Sensor Suite",
        isNexStar,
        resolutionLabel,
        scanRange,
        stars,
        anomalies,
        derelicts,
        stations
    };

    let listHtml = `
        <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; border-bottom:1px solid #333;">
            OPTICAL TELEMETRY (RANGE: ${scanRange}u)
        </div>
    `;

    if (stars.length === 0 && anomalies.length === 0 && derelicts.length === 0 && stations.length === 0) {
        listHtml += `<div style="padding:15px; color:#888; font-size:12px;">No major stellar bodies, stations, or phenomena within ${scanRange} units.</div>`;
    } else {
        stars.slice(0, 6).forEach((s, idx) => {
            const safeColor = _getContrastSafeStarColor(s.data);
            listHtml += `
                <div class="trade-item-row" onclick="previewObservatoryStar(${idx})" style="padding:10px 12px; cursor:pointer;" title="Click to inspect spectral telemetry">
                    <div>
                        <div style="color:${safeColor}; font-weight:bold; font-size:12px;">★ ${_configEscapeHtml(s.data.designation)}</div>
                        <div style="color:var(--item-desc-color); font-size:10px;">${_configEscapeHtml(s.data.class)}-Class ${_configEscapeHtml(s.data.name)}</div>
                    </div>
                    <div style="color:var(--text-color); font-size:11px; text-align:right;">
                        <div>[${s.x}, ${-s.y}]</div>
                        <div style="font-size:10px; color:var(--accent-color);">${s.dist}u ${s.bearing}</div>
                    </div>
                </div>
            `;
        });
        stations.slice(0, 4).forEach((st, idx) => {
            listHtml += `
                <div class="trade-item-row" onclick="previewObservatoryContact('stations', ${idx})" style="padding:10px 12px; cursor:pointer;">
                    <div>
                        <div style="color:${st.color}; font-weight:bold; font-size:12px;">${st.icon} ${_configEscapeHtml(st.label)}</div>
                        <div style="color:var(--item-desc-color); font-size:10px;">${_configEscapeHtml(st.subLabel)}</div>
                    </div>
                    <div style="color:var(--text-color); font-size:11px; text-align:right;">
                        <div>[${st.x}, ${-st.y}]</div>
                        <div style="font-size:10px; color:${st.color};">${st.dist}u ${st.bearing}</div>
                    </div>
                </div>
            `;
        });
        anomalies.slice(0, 4).forEach((a, idx) => {
            listHtml += `
                <div class="trade-item-row" onclick="previewObservatoryContact('anomalies', ${idx})" style="padding:10px 12px; cursor:pointer;">
                    <div>
                        <div style="color:${a.color}; font-weight:bold; font-size:12px;">${a.icon} ${_configEscapeHtml(a.label)}</div>
                        <div style="color:var(--item-desc-color); font-size:10px;">${_configEscapeHtml(a.subLabel)}</div>
                    </div>
                    <div style="color:var(--text-color); font-size:11px; text-align:right;">
                        <div>[${a.x}, ${-a.y}]</div>
                        <div style="font-size:10px; color:${a.color};">${a.dist}u ${a.bearing}</div>
                    </div>
                </div>
            `;
        });
        derelicts.slice(0, 4).forEach((d, idx) => {
            listHtml += `
                <div class="trade-item-row" onclick="previewObservatoryContact('derelicts', ${idx})" style="padding:10px 12px; cursor:pointer;">
                    <div>
                        <div style="color:${d.color}; font-weight:bold; font-size:12px;">${d.icon} ${_configEscapeHtml(d.label)}</div>
                        <div style="color:var(--item-desc-color); font-size:10px;">${_configEscapeHtml(d.subLabel)}</div>
                    </div>
                    <div style="color:var(--text-color); font-size:11px; text-align:right;">
                        <div>[${d.x}, ${-d.y}]</div>
                        <div style="font-size:10px; color:${d.color};">${d.dist}u ${d.bearing}</div>
                    </div>
                </div>
            `;
        });
    }

    listEl.innerHTML = listHtml;
    _renderObservatorySummaryDetail(_lastObservatoryScan);
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

    let rewardMsg = `<span style="color:var(--accent-color)">[ ASTROPHOTOGRAPHY ]</span> Captured long-exposure plate of ${_configEscapeHtml(typeof currentSectorName !== 'undefined' ? currentSectorName : 'this sector')} (+${xpGain} XP).`;

    if (isNexStar) {
        const added = _configSafeAddCargo('PLANETARY_DATA', 1);
        if (added > 0) {
            rewardMsg += ` <span style="color:var(--gold-text)">NexStar-4SE resolved 1x Planetary Data cartridge!</span>`;
        }
    }

    if (typeof soundManager !== 'undefined') soundManager.playScan();
    if (typeof showToast === 'function') showToast(`DEEP-SKY PLATE SAVED (+${xpGain} XP)`, "success");
    if (typeof logMessage === 'function') logMessage(rewardMsg);

    if (_lastObservatoryScan) _renderObservatorySummaryDetail(_lastObservatoryScan);
    else openObservatory();

    if (typeof renderUIStats === 'function') renderUIStats();
    if (typeof checkLevelUp === 'function') checkLevelUp();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

window.openObservatory = openObservatory;
window.captureDeepSkyImage = captureDeepSkyImage;
window.previewObservatoryStar = previewObservatoryStar;
window.previewObservatoryContact = previewObservatoryContact;

// ==========================================
// --- SELF-CONTAINED ENGINE BRIDGES ---
// ==========================================

function attachConfigHooks() {
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

    // 3. Inject Retro CRT Palette Switcher into System Menu (activates phosphor-mode / amber-mode in style.css)
    const crtBtn = document.getElementById('crtToggleButton');
    if (crtBtn && crtBtn.parentNode && !document.getElementById('paletteToggleButton')) {
        let savedPalette = 'dark';
        let savedTheme = null;
        try {
            savedPalette = localStorage.getItem('wayfinder_crt_palette') || 'dark';
            savedTheme = localStorage.getItem('wayfinderTheme');
        } catch (e) {}

        if (savedTheme !== 'light' && (savedPalette === 'phosphor' || savedPalette === 'amber')) {
            setDisplayPalette(savedPalette, false);
        }

        const palBtn = document.createElement('button');
        palBtn.id = 'paletteToggleButton';
        palBtn.className = 'sys-btn';
        const activeDef = _DISPLAY_PALETTES.find(p => p.id === getDisplayPalette());
        palBtn.textContent = activeDef ? `Palette: ${activeDef.label}` : 'Palette: Light';
        palBtn.title = "Cycle CRT Terminal Palettes (Deep Void, Phosphor Green, Amber CRT)";
        palBtn.onclick = () => cycleDisplayPalette();
        crtBtn.parentNode.insertBefore(palBtn, crtBtn.nextSibling);

        const themeBtn = document.getElementById('themeButton');
        if (themeBtn && !window._configPaletteThemeSynced) {
            themeBtn.addEventListener('click', () => {
                setTimeout(() => {
                    if (document.body.classList.contains('light-mode')) {
                        document.body.classList.remove('phosphor-mode', 'amber-mode');
                        palBtn.textContent = 'Palette: Light';
                    } else {
                        const def = _DISPLAY_PALETTES.find(p => p.id === getDisplayPalette()) || _DISPLAY_PALETTES[0];
                        palBtn.textContent = `Palette: ${def.label}`;
                    }
                }, 0);
            });
            window._configPaletteThemeSynced = true;
        }
    }

    // 4. Hook chunkManager.generateChunk to spawn Black Holes & Data-Driven Deep Space POIs
    if (typeof chunkManager !== 'undefined' && typeof chunkManager.generateChunk === 'function' && !window._configChunkPatched) {
        const origGenerateChunk = chunkManager.generateChunk.bind(chunkManager);

        chunkManager.generateChunk = function(chunkX, chunkY) {
            const chunkData = origGenerateChunk(chunkX, chunkY);

            const mapW = typeof MAP_WIDTH !== 'undefined' ? MAP_WIDTH : 40;
            const mapH = typeof MAP_HEIGHT !== 'undefined' ? MAP_HEIGHT : 22;
            const spawnX = mapW - 7;
            const spawnY = mapH - 5;

            for (let y = 0; y < this.CHUNK_SIZE; y++) {
                for (let x = 0; x < this.CHUNK_SIZE; x++) {
                    const currentTile = chunkData[y][x];

                    // Only roll on unmodified empty space tiles
                    if (currentTile !== EMPTY_SPACE_CHAR_VAL && (!currentTile || currentTile.char !== EMPTY_SPACE_CHAR_VAL)) continue;

                    const worldX = chunkX * this.CHUNK_SIZE + x;
                    const worldY = chunkY * this.CHUNK_SIZE + y;

                    // Keep a 30-tile safe radius around Starbase Alpha free of deep-space hazards/POIs
                    if (Math.abs(worldX - spawnX) + Math.abs(worldY - spawnY) < 30) continue;

                    const deltaKey = `${worldX},${worldY}`;
                    if (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[deltaKey] && worldStateDeltas[deltaKey].char) continue;

                    const tileSeed = (typeof WORLD_SEED !== 'undefined' ? WORLD_SEED : 1337) ^ (worldX * 73856093) ^ (worldY * 19349663);
                    const roll = typeof seededRandom === 'function' ? seededRandom(tileSeed + 17) : Math.random();

                    let cumulative = 0;
                    for (let p = 0; p < DEEP_SPACE_POI_TABLE.length; p++) {
                        cumulative += DEEP_SPACE_POI_TABLE[p].chance;
                        if (roll < cumulative) {
                            chunkData[y][x] = DEEP_SPACE_POI_TABLE[p].createTile(worldX, worldY);
                            break;
                        }
                    }

                    // Merge any existing interaction deltas onto the newly spawned custom tile
                    if (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[deltaKey] && typeof chunkData[y][x] === 'object') {
                        Object.assign(chunkData[y][x], worldStateDeltas[deltaKey]);
                    }
                }
            }
            return chunkData;
        };
        chunkManager.loadedChunks = {};
        chunkManager.lastChunkKey = null;
        chunkManager.lastChunkRef = null;
        window._configChunkPatched = true;
    }

    // 5. Route keyboard hotkeys for custom TILE_INTERACTIONS when standing on them
    if (typeof window.handleGalacticMapInput === 'function' && !window._configInputPatched) {
        const origMapInput = window.handleGalacticMapInput;
        window.handleGalacticMapInput = function(key) {
            if (typeof key === 'string' && typeof chunkManager !== 'undefined' && typeof TILE_INTERACTIONS !== 'undefined') {
                const tileObj = chunkManager.getTile(playerX, playerY);
                const tileChar = typeof getTileChar === 'function' ? getTileChar(tileObj) : tileObj;
                if (TILE_INTERACTIONS[tileChar]) {
                    const customDef = TILE_INTERACTIONS[tileChar];
                    const acts = typeof customDef.actions === 'function' ? customDef.actions(tileObj) : (customDef.actions || []);
                    const matched = acts.find(a => a && a.key && a.key.toLowerCase() === key.toLowerCase());
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachConfigHooks);
} else {
    attachConfigHooks();
}

// --- END OF FILE config.js ---
