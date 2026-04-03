// =============================================================================
// │ GAME CONFIGURATION & CONSTANTS                                            │
// =============================================================================

// --- Screen & Display ---
const SCREEN_WIDTH = 70; // The width of the main game screen in characters.
const PLAYER_VISUAL_POSITION = Math.floor(SCREEN_WIDTH / 3); // Player's static column on the screen.
const MAX_LOG_MESSAGES = 35; // Maximum number of messages to keep in the log.
const MAX_NAME_LENGTH = 20; // Maximum character length for the player's name.

// --- Core Gameplay Mechanics ---
const INITIAL_GAME_TICK_MS = 1000; // Base time in ms for one game tick (1 step).
const NUM_LANES = 5; // Number of vertical lanes the player can move between.
const PLAYER_INITIAL_LANE = Math.floor(NUM_LANES / 2); // The lane the player starts in (center).
const VERTICAL_MOVE_CHANCE = 0.15; // The probability (0.0 to 1.0) of changing lanes each tick.
const COMBAT_ESCAPE_DUST_LOSS = 10; // Amount of dust lost when disengaging from combat.

// --- Player Stats & Progression ---
const BASE_STAT_VALUE = 3; // The starting value for Might, Wits, and Spirit.
const BASE_HP = 20; // The base health points for a level 1 character.
const XP_FOR_LEVEL_2 = 100; // Experience points required to reach level 2.
const XP_LEVEL_SCALING_BASE = 50; // A factor used in the level-up XP calculation.
const TRANSCEND_LEVEL_THRESHOLD = 3; // Minimum level required to unlock the 'Transcend' option.

// --- Event & Encounter Thresholds ---
const NAME_CHOICE_EVENT_X_POS = 25; // X-coordinate in Zone 0 to trigger the name choice event.
const CLASS_CHOICE_EVENT_X_POS = 75; // X-coordinate in Zone 0 to trigger the class choice event.
const MGT_BLOCKED_PATH_THRESHOLD = 5; // Might required to clear a 'B' obstacle.
const WIT_ETCHINGS_THRESHOLD = 5; // Wits required to decipher '?' etchings.
const SPR_TOTEM_THRESHOLD = 5; // Spirit required to attune to '!' totems.
const SWORD_PULL_MIGHT_REQ = 7; // Might required to pull the '¥' blade from the stone.
const SWORD_PULL_HP_COST = 5; // HP lost when failing to pull the blade.
const CREATURE_DUST_COST = 1; // Dust cost to help the 'd' dying creature.

// --- Stat-based Bonuses ---
const MIGHT_BONUS_DUST_CHANCE_PER_POINT = 0.05; // Extra chance to find dust per point of Might.
const WIT_INSIGHT_THRESHOLD = 4; // Wits required for extra insight on lore/artifacts.
const SPIRIT_COMPANION_THRESHOLD = 4; // Spirit required for a bonus companion message.
const SPIRIT_SHRINE_THRESHOLD = 4; // Spirit required for a bonus shrine message.

// --- Local Storage Keys ---
const FUTURE_SELF_MESSAGE_KEY = 'realmsOfRuneAndRust_FutureSelfMessage';
const LEGACY_MIGHT_KEY = 'rrnr_legacy_might';
const LEGACY_WITS_KEY = 'rrnr_legacy_wits';
const LEGACY_SPIRIT_KEY = 'rrnr_legacy_spirit';

let devSpeedMultiplier = 1; // For developer speed controls.

// =============================================================================
// │ SEEDED RANDOM NUMBER GENERATOR (Mulberry32)                               │
// =============================================================================
let currentSeed;

function initializeSeed(seed) {
    currentSeed = seed;
}

function seededRandom() {
    if (currentSeed === undefined) {
        currentSeed = Date.now() % 2147483647;
    }
    let t = currentSeed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    currentSeed = t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function seededRandomInt(min, max) {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function getWeightedElement(pool, roll) {
    let currentWeight = 0;
    for (let item of pool) {
        currentWeight += item.weight;
        if (roll < currentWeight) {
            return item;
        }
    }
    return pool[0]; 
}

// =============================================================================
// │ PRIMARY GAME STATE OBJECT                                                   │
// =============================================================================

let gameState = {
    playerName: "Wanderer",
    playerClass: null,
    level: 1,
    xp: 0,
    xpToNextLevel: XP_FOR_LEVEL_2,
    stats: {
        might: BASE_STAT_VALUE,
        wits: BASE_STAT_VALUE,
        spirit: BASE_STAT_VALUE
    },
    maxHp: 0,
    currentHp: 0,

    auto: {
        combat: false,
        events: false,
        progress: false
    },

    playerZoneX: 0,
    playerLane: PLAYER_INITIAL_LANE,
    currentZoneIndex: 0,
    lastExploredZoneIndex: 0,
    explorationSpeedMultiplier: 1,

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
    
    playerStatusEffects: {},
    inventory: {},  

    currentZoneElements: {}, 

    isPaused: false,
    inCombat: false,
    activeDecision: null,
    narrativeFlags: {},
    encounteredNPCs: {},

    initialGameSeed: 0,
    isMuted: false,
    gameTickMs: INITIAL_GAME_TICK_MS,
    lastStepSoundTime: 0,
    logMessages: [],
};

const ZONES = [{ 
    // Zone 0
    name: "The Ashen Woods",
    width: 300,
    backgroundChar: ".",
    midgroundChar: "t",
    color: "#ff8c00",
    bgColor: "#5c1f00",
    entryLoreKey: "ASHEN_WOODS_INTRO",
    shrineLoreKey: "ASHEN_SHRINE_1",
    fixedElements: {
        40: [{ lane: 2, char: '§' }],
        70: [{ lane: 2, char: 'E', enemyKey: "ASH_GNAWER" }, { lane: 0, char: 'F' }],
        110: [{ lane: 2, char: 'H' }],
        140: [{ lane: 2, char: 'N', npcType: "LOST_SOUL" }],
        195: [{ lane: 2, char: '¥' }],
        220: [{ lane: 1, char: 'N', npcType: "LOST_SOUL" }]
    },
    spawnDensity: 0.15,
    spawnPool: [
        { char: '.', weight: 40 }, { char: 'T', weight: 15 }, { char: 't', weight: 15 },
        { char: 'M', weight: 10 }, { char: '~', weight: 10 }, { char: 'E', enemyKey: 'ASH_GNAWER', weight: 15 },
        { char: 'L', weight: 5 }, { char: 'A', weight: 2 }, { char: '+', weight: 3 },
        { char: 'P', weight: 2 }, { char: 'd', weight: 2 }, { char: 'B', weight: 4 },
        { char: '?', weight: 3 }, { char: '!', weight: 2 }, { char: '¶', weight: 1 }
    ]
}, { 
    // Zone 1
    name: "The Crimson Depths",
    width: 290,
    backgroundChar: ":",
    midgroundChar: "*",
    color: "#ff007f",
    bgColor: "#3b003b",
    entryLoreKey: "CRIMSON_DEPTHS_INTRO",
    shrineLoreKey: "CRIMSON_SHRINE_1",
    fixedElements: {
        80: [{ lane: 4, char: 'N', npcType: "HERMIT_RUNESMITH" }],
        90: [{ lane: 2, char: 'Φ' }],
        130: [{ lane: 0, char: '✧' }],
        220: [{ lane: 2, char: 'Δ' }],
        230: [{ lane: 3, char: 'H' }]
    },
    spawnDensity: 0.18,
    spawnPool: [
        { char: '.', weight: 30 }, { char: '♦', weight: 15 }, { char: '◊', weight: 15 },
        { char: 'M', weight: 12 }, { char: 'E', enemyKey: 'RUSTED_CONSTRUCT', weight: 10 },
        { char: 'E', enemyKey: 'ASH_GNAWER', weight: 8 }, { char: 'L', weight: 5 },
        { char: '#', weight: 10 }, { char: 'A', weight: 2 }, { char: 'P', weight: 2 },
        { char: 'B', weight: 3 }, { char: '+', weight: 2 }, { char: '?', weight: 2 }
    ]
}, { 
    // Zone 2
    name: "The Volcanic Wastes",
    width: 400,
    backgroundChar: "`",
    midgroundChar: "^",
    color: "#ff4500",
    bgColor: "#2b0f0f",
    entryLoreKey: "VOLCANIC_WASTES_INTRO",
    shrineLoreKey: "VOLCANIC_SHRINE_1",
    fixedElements: {
        100: [{ lane: 2, char: 'N', npcType: "HERMIT_RUNESMITH" }],
        120: [{ lane: 3, char: '§' }],
        170: [{ lane: 2, char: 'H' }],
        250: [{ lane: 2, char: 'Φ' }],
        270: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }],
        360: [{ lane: 2, char: '¤' }]
    },
    spawnDensity: 0.20,
    spawnPool: [
        { char: '.', weight: 25 }, { char: 's', weight: 15 }, { char: '[', weight: 10 },
        { char: ']', weight: 10 }, { char: 'M', weight: 15 }, { char: 'E', enemyKey: 'RUSTED_CONSTRUCT', weight: 12 },
        { char: 'E', enemyKey: 'ASH_GNAWER', weight: 5 }, { char: '#', weight: 10 },
        { char: 'A', weight: 2 }, { char: 'P', weight: 2 }, { char: 'L', weight: 5 },
        { char: '+', weight: 2 }, { char: '¦', weight: 2 }, { char: '¶', weight: 1 }
    ]
}, { 
    // Zone 3
    name: "The Starfall Crater",
    width: 370,
    backgroundChar: "'",
    midgroundChar: "%",
    color: "#9370db",
    bgColor: "#100020",
    entryLoreKey: "STARFALL_CRATER_INTRO",
    shrineLoreKey: "STARFALL_SHRINE_1",
    fixedElements: {
        100: [{ lane: 3, char: 'N', npcType: "ECHO_LUMINA" }],
        170: [{ lane: 2, char: 'H' }],
        250: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }]
    },
    spawnDensity: 0.22,
    spawnPool: [
        { char: '.', weight: 20 }, { char: 'V', weight: 15 }, { char: 'X', weight: 15 },
        { char: 'M', weight: 10 }, { char: 'E', enemyKey: 'VOID_TENDRIL', weight: 20 },
        { char: '#', weight: 10 }, { char: 'A', weight: 3 }, { char: 'L', weight: 5 },
        { char: '+', weight: 3 }, { char: 'P', weight: 1 }, { char: '?', weight: 2 }
    ]
}, { 
    // Zone 4
    name: "The Sunken Archives",
    width: 400,
    backgroundChar: "~",
    midgroundChar: "c",
    color: "#20b2aa",
    bgColor: "#003333",
    entryLoreKey: "SUNKEN_ARCHIVES_INTRO",
    shrineLoreKey: "SUNKEN_ARCHIVES_SHRINE_1",
    fixedElements: {
        70: [{ lane: 0, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        180: [{ lane: 4, char: 'N', npcType: "ECHO_LUMINA" }],
        210: [{ lane: 2, char: 'H' }],
        310: [{ lane: 2, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        365: [{ lane: 2, char: 'E', enemyKey: "VOID_SCARRED_SENTINEL" }]
    },
    spawnDensity: 0.25,
    spawnPool: [
        { char: '~', weight: 20 }, { char: '.', weight: 20 }, { char: 'S', weight: 15 },
        { char: 'b', weight: 10 }, { char: 'D', weight: 10 }, { char: 'E', enemyKey: 'VOID_TENDRIL', weight: 10 },
        { char: '#', weight: 10 }, { char: 'L', weight: 8 }, { char: 'A', weight: 3 },
        { char: '+', weight: 2 }, { char: '¶', weight: 1 }, { char: '®', weight: 1 } // Introduced Runestones!
    ]
}, { 
    // Zone 5
    name: "The Sky-Temple Aerie",
    width: 420,
    backgroundChar: " ",
    midgroundChar: "C",
    color: "#add8e6",
    bgColor: "#4682b420",
    entryLoreKey: "SKY_TEMPLE_AERIE_INTRO",
    shrineLoreKey: "SKY_TEMPLE_AERIE_SHRINE_1",
    fixedElements: {
        70: [{ lane: 0, char: 'N', npcType: "SKY_SEER_ECHO" }],
        180: [{ lane: 4, char: 'N', npcType: "ECHO_LUMINA" }],
        210: [{ lane: 2, char: 'H' }],
        310: [{ lane: 2, char: 'N', npcType: "SKY_SEER_ECHO" }],
        415: [{ lane: 2, char: 'O' }]
    },
    spawnDensity: 0.20,
    spawnPool: [
        { char: '.', weight: 25 }, { char: '^', weight: 20 }, { char: 'R', weight: 15 },
        { char: 'w', weight: 15 }, { char: 'G', weight: 10 }, { char: 'E', enemyKey: 'CRYSTAL_LURKER', weight: 5 },
        { char: 'L', weight: 6 }, { char: 'A', weight: 3 }, { char: '+', weight: 2 },
        { char: '#', weight: 5 }, { char: '!', weight: 2 }, { char: '®', weight: 1 }
    ]
}, { 
    // Zone 6
    name: "The Glimmering Depths",
    width: 300,
    backgroundChar: "'",
    midgroundChar: "✧",
    color: "#40e0d0",
    bgColor: "#003333",
    entryLoreKey: "GLIMMERING_DEPTHS_INTRO",
    shrineLoreKey: "GLIMMERING_SHRINE_1",
    fixedElements: {
        70: [{ lane: 0, char: 'N', npcType: "ECHO_LUMINA" }],
        210: [{ lane: 2, char: 'H' }]
    },
    spawnDensity: 0.22,
    spawnPool: [
        { char: '.', weight: 25 }, { char: '♦', weight: 20 }, { char: '◊', weight: 20 },
        { char: 'M', weight: 10 }, { char: 'E', enemyKey: 'CRYSTAL_LURKER', weight: 20 },
        { char: '#', weight: 8 }, { char: 'L', weight: 5 }, { char: 'A', weight: 3 },
        { char: 'P', weight: 2 }, { char: '?', weight: 2 }, { char: '®', weight: 1 }
    ]
}, { 
    // Zone 7
    name: "The Drowned City of Lyra",
    width: 450,
    backgroundChar: "≈",
    midgroundChar: "s",
    color: "#1d7874",
    bgColor: "#0b3937",
    entryLoreKey: "DROWNED_CITY_LYRA_INTRO",
    shrineLoreKey: "LYRA_SHRINE_1",
    fixedElements: {
        100: [{ lane: 3, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        150: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }],
        260: [{ lane: 2, char: 'H' }],
        380: [{ lane: 0, char: 'N', npcType: "ECHO_LUMINA" }]
    },
    spawnDensity: 0.25,
    spawnPool: [
        { char: '~', weight: 20 }, { char: '.', weight: 20 }, { char: 'S', weight: 15 },
        { char: 'R', weight: 15 }, { char: 'D', weight: 10 }, { char: 'E', enemyKey: 'RUSTED_SENTINEL', weight: 15 },
        { char: '#', weight: 10 }, { char: 'L', weight: 5 }, { char: 'A', weight: 3 },
        { char: '+', weight: 2 }, { char: '?', weight: 2 }, { char: '!', weight: 2 }, { char: '¶', weight: 1 },
        { char: '®', weight: 1 }
    ]
}, { 
    // Zone 8 (PHASE 4: The Endless Abyss)
    name: "The Endless Abyss",
    width: 10000, // Practically infinite
    backgroundChar: " ",
    midgroundChar: "·",
    color: "#888888",
    bgColor: "#05000a",
    entryLoreKey: "ABYSS_INTRO",
    shrineLoreKey: null,
    fixedElements: {},
    spawnDensity: 0.30,
    spawnPool: [
        { char: '.', weight: 20 }, { char: 'V', weight: 10 }, { char: 'X', weight: 10 },
        { char: '~', weight: 5 }, { char: 'M', weight: 5 }, { char: ']', weight: 5 },
        { char: 'E', enemyKey: 'VOID_TENDRIL', weight: 10 }, 
        { char: 'E', enemyKey: 'RUSTED_SENTINEL', weight: 10 },
        { char: 'E', enemyKey: 'CRYSTAL_LURKER', weight: 10 },
        { char: 'E', enemyKey: 'VOID_SCARRED_SENTINEL', weight: 5 },
        { char: '#', weight: 5 }, { char: 'A', weight: 2 }, { char: 'L', weight: 2 },
        { char: '+', weight: 2 }, { char: '?', weight: 1 }, { char: '!', weight: 1 }, 
        { char: '¶', weight: 1 }, { char: '®', weight: 1 }
    ]
}];

// =============================================================================
// │ DOM ELEMENT REFERENCES & VIRTUAL DOM SETUP                                │
// =============================================================================

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

function updateAutoButtonVisuals() {
    if (!btnAutoCombat || !btnAutoEvents || !btnAutoProgress) return;

    btnAutoCombat.textContent = `Auto-Combat: ${gameState.auto.combat ? 'ON' : 'OFF'}`;
    btnAutoEvents.textContent = `Auto-Events: ${gameState.auto.events ? 'ON' : 'OFF'}`;
    btnAutoProgress.textContent = `Auto-Progress: ${gameState.auto.progress ? 'ON' : 'OFF'}`;

    if (gameState.auto.combat) btnAutoCombat.classList.add('auto-btn-on'); else btnAutoCombat.classList.remove('auto-btn-on');
    if (gameState.auto.events) btnAutoEvents.classList.add('auto-btn-on'); else btnAutoEvents.classList.remove('auto-btn-on');
    if (gameState.auto.progress) btnAutoProgress.classList.add('auto-btn-on'); else btnAutoProgress.classList.remove('auto-btn-on');
}

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
// │ GAME LOGIC & MECHANICS                                                      │
// =============================================================================

function getCurrentZone() {
    return ZONES[gameState.currentZoneIndex];
}

function generateZoneElements(zoneIndex) {
    const zone = ZONES[zoneIndex];
    if (!zone) return {};

    let generatedElements = {};

    if (zone.fixedElements) {
        for (let x in zone.fixedElements) {
            generatedElements[x] = JSON.parse(JSON.stringify(zone.fixedElements[x]));
        }
    }

    // Generate up to current x + render window to prevent massive load times for Endless zone
    const targetWidth = zone.width === 10000 ? Math.min(10000, gameState.playerZoneX + SCREEN_WIDTH * 2) : zone.width;

    for (let x = 10; x < targetWidth; x++) {
        if (generatedElements[x]) continue;

        if (seededRandom() < zone.spawnDensity) {
            let roll = seededRandom() * 100; 
            let picked = getWeightedElement(zone.spawnPool, roll);
            let lane = seededRandomInt(0, NUM_LANES - 1);
            
            let newElement = { lane: lane, char: picked.char };
            if (picked.enemyKey) newElement.enemyKey = picked.enemyKey;
            if (picked.npcType) newElement.npcType = picked.npcType;

            generatedElements[x] = [newElement];
        }
    }
    
    return generatedElements;
}

// Phase 4: Generate next chunk of Endless Abyss dynamically
function expandZoneElements(zoneIndex) {
    const zone = ZONES[zoneIndex];
    const targetWidth = Math.min(zone.width, gameState.playerZoneX + SCREEN_WIDTH * 2);
    
    for (let x = gameState.playerZoneX + SCREEN_WIDTH; x < targetWidth; x++) {
        if (gameState.currentZoneElements[x]) continue;

        if (seededRandom() < zone.spawnDensity) {
            let roll = seededRandom() * 100; 
            let picked = getWeightedElement(zone.spawnPool, roll);
            let lane = seededRandomInt(0, NUM_LANES - 1);
            
            let newElement = { lane: lane, char: picked.char };
            if (picked.enemyKey) newElement.enemyKey = picked.enemyKey;
            if (picked.npcType) newElement.npcType = picked.npcType;

            gameState.currentZoneElements[x] = [newElement];
        }
    }
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
}

function hideArtifactViewer() {
    artifactModalBackdrop.style.display = 'none';
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

function autoSave() {
    // Don't auto-save if in combat, in a decision menu, or if the journey has ended
    if (gameState.inCombat || gameState.activeDecision || gameState.currentZoneIndex === -1) return;
    
    try {
        const saveState = JSON.stringify(gameState);
        localStorage.setItem('realmsOfRuneAndRust_savegame', saveState);
        // Notice: We intentionally do NOT call addLogMessage here, keeping it a secret background process!
    } catch (e) {
        console.error("Auto-save failed:", e);
    }
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

let gameInterval;
let autoSaveInterval;

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

function getEffectiveStats() {
    const effectiveStats = { ...gameState.stats
    };
    if (gameState.collectedArtifacts.includes("ART_ANCIENT_BLADE")) {
        effectiveStats.might += 2;
    }
    return effectiveStats;
}

function calculateMaxHp() {
    let hp = BASE_HP + (gameState.level * 5) + (gameState.stats.might * 2);
    if (gameState.playerClass === PLAYER_CLASSES.STALWART.name) hp += 5;
    if (gameState.collectedArtifacts.includes("ART_ANCIENT_BLADE")) {
        hp -= 5;
    }
    return Math.max(1, hp); 
}

function awardXP(amount) {
    if (gameState.currentZoneIndex === -1) return;
    let finalAmount = amount;
    if (gameState.playerClass === "Erudite") {
        finalAmount = Math.ceil(amount * 1.05); 
    }
    gameState.xp += finalAmount;
    addLogMessage(`Gained ${finalAmount} XP.`, "xp");
    checkForLevelUp();
}

function calculateXPForNextLevel(level) {
    if (level === 1) return XP_FOR_LEVEL_2;
    return XP_FOR_LEVEL_2 + ((level - 1) * (level - 1) * XP_LEVEL_SCALING_BASE);
}

function checkForLevelUp() {
    while (gameState.xp >= gameState.xpToNextLevel) {
        gameState.level++;
        const overflowXp = gameState.xp - gameState.xpToNextLevel;
        gameState.xp = overflowXp;
        gameState.xpToNextLevel = calculateXPForNextLevel(gameState.level);

        const stats = ["might", "wits", "spirit"];
        const randomStatIndex = seededRandomInt(0, stats.length - 1);
        const statToIncrease = stats[randomStatIndex];
        gameState.stats[statToIncrease]++;

        gameState.maxHp = calculateMaxHp();
        gameState.currentHp = gameState.maxHp;

        playSound('levelUp');
        addLogMessage(`LEVEL UP! You are now Level ${gameState.level}! Your ${statToIncrease.charAt(0).toUpperCase() + statToIncrease.slice(1)} increased by 1! HP restored.`, "level-up-message");
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


function handleEncounter() {
    const zone = getCurrentZone();
    if (!zone) return;

    const elementsAtCurrentX = gameState.currentZoneElements[gameState.playerZoneX] || [];
    const encounterKeyBase = `${gameState.currentZoneIndex}_${gameState.playerZoneX}`;
    const effectiveStats = getEffectiveStats();

    elementsAtCurrentX.forEach(element => {
        const currentElementChar = element.char;
        const specificEncounterKey = `${encounterKeyBase}_${element.lane}_${currentElementChar}`;

        if (element.lane !== gameState.playerLane) {
            return; 
        }

        if (currentElementChar === '~' || currentElementChar === 'M') {
            return;
        }

        switch (currentElementChar) {
            case '¶': 
            if (!gameState.narrativeFlags[specificEncounterKey]) {
                const tomeKeys = ["ART_TOME_MIGHT", "ART_TOME_WITS", "ART_TOME_RESOLVE"];
                const undiscoveredTomes = tomeKeys.filter(key => !gameState.collectedArtifacts.includes(key));

            if (undiscoveredTomes.length > 0) {
                const tomeKeyToAward = undiscoveredTomes[seededRandomInt(0, undiscoveredTomes.length - 1)];
                const foundTome = ARTIFACTS.find(art => art.key === tomeKeyToAward);

            if (foundTome) {
                gameState.collectedArtifacts.push(foundTome.key);
                gameState.narrativeFlags[specificEncounterKey] = true;
                
                let statName = "might";
                if (foundTome.key === "ART_TOME_MIGHT") gameState.stats.might++;
                if (foundTome.key === "ART_TOME_WITS") {
                    gameState.stats.wits++;
                    statName = "wits";
                }
                if (foundTome.key === "ART_TOME_RESOLVE") {
                    gameState.stats.spirit++;
                    statName = "spirit";
                }

                    addLogMessage(`You found the <strong>${foundTome.name}</strong>! Your ${statName} has permanently increased!`, "artifact");
                    playSound('tome');
                    awardXP(40);
                    renderAll(); 
                    }
                    }
                }
                break;
            case 'E':
                if (!gameState.inCombat && element.enemyKey) {
                    resolveCombat(element.enemyKey);
                }
                break;
            case 'B':
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    presentStatChallengeDecision(
                        specificEncounterKey,
                        "A jumble of heavy boulders blocks the path. Attempt to clear it with Might?",
                        "You decide to leave the boulders undisturbed.",
                        () => { 
                            if (effectiveStats.might >= MGT_BLOCKED_PATH_THRESHOLD) {
                                addLogMessage(STAT_CHALLENGE_LORE.BLOCKED_PATH_SUCCESS, "puzzle-success");
                                const bonusDust = seededRandomInt(5, 10);
                                gameState.resources.glimmeringDust += bonusDust;
                                addLogMessage(`You find ${bonusDust} Glimmering Dust!`, "lore");
                                awardXP(10);
                                return true;
                            }
                            return false;
                        },
                        () => { 
                            addLogMessage(STAT_CHALLENGE_LORE.BLOCKED_PATH_FAIL, "puzzle-fail");
                        }
                    );
                }
                break;
            case '?':
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    presentStatChallengeDecision(
                        specificEncounterKey,
                        "Faded etchings cover this ancient stone. Try to decipher them with Wits?",
                        "You leave the etchings to their mystery.",
                        () => { 
                            if (effectiveStats.wits >= WIT_ETCHINGS_THRESHOLD) {
                                const zoneSpecificHints = {
                                    "The Ashen Woods": "a forgotten ember still glowing faintly.",
                                    "The Crimson Depths": "a hidden vein of purest crystal.",
                                    "The Volcanic Wastes": "a path through the lava flows unseen by most.",
                                    "The Starfall Crater": "the true trajectory of a falling star.",
                                    "The Sunken Archives": "a lost page detailing a forgotten Lumina ritual.",
                                    "The Sky-Temple Aerie": "a celestial alignment of great import."
                                };
                                const hint = zoneSpecificHints[zone.name] || "a forgotten secret of this place.";
                                addLogMessage(STAT_CHALLENGE_LORE.RUNIC_ETCHINGS_SUCCESS.replace("[a short, unique seeded lore snippet about the zone's deeper history or a nearby secret - TBD]", hint), "puzzle-success");
                                awardXP(15);
                                return true;
                            }
                            return false;
                        },
                        () => { 
                            addLogMessage(STAT_CHALLENGE_LORE.RUNIC_ETCHINGS_FAIL, "puzzle-fail");
                        }
                    );
                }
                break;
            case '!':
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    presentStatChallengeDecision(
                        specificEncounterKey,
                        "A strange totem hums with faint whispers. Attempt to attune to it with Spirit?",
                        "You step away from the unsettling totem.",
                        () => { 
                            if (effectiveStats.spirit >= SPR_TOTEM_THRESHOLD) {
                                addLogMessage(STAT_CHALLENGE_LORE.WHISPERING_TOTEM_SUCCESS, "puzzle-success");
                                awardXP(10);
                                const bonusScraps = seededRandomInt(1, 3);
                                gameState.resources.ancientScraps += bonusScraps;
                                addLogMessage(`The totem grants you ${bonusScraps} Ancient Scraps for your attentiveness.`, "lore");
                                return true;
                            }
                            return false;
                        },
                        () => { 
                            addLogMessage(STAT_CHALLENGE_LORE.WHISPERING_TOTEM_FAIL, "puzzle-fail");
                        }
                    );
                }
                break;
            case '¥': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    presentStatChallengeDecision(
                        specificEncounterKey,
                        "An ancient blade is embedded in a stone, humming faintly. Try to pull it free with Might?",
                        "You leave the blade to its slumber.",
                        () => { 
                            if (effectiveStats.might >= SWORD_PULL_MIGHT_REQ) {
                                addLogMessage(STAT_CHALLENGE_LORE.SWORD_STONE_SUCCESS, "puzzle-success");
                                const blade = ARTIFACTS.find(a => a.key === "ART_ANCIENT_BLADE");
                                if (blade && !gameState.collectedArtifacts.includes(blade.key)) {
                                    gameState.collectedArtifacts.push(blade.key);
                                    addLogMessage(`<strong>${blade.name}</strong>: ${blade.description}`, "artifact");
                                    gameState.maxHp = calculateMaxHp(); 
                                    gameState.currentHp = Math.min(gameState.currentHp, gameState.maxHp);
                                }
                                awardXP(30);
                                return true;
                            }
                            return false;
                        },
                        () => { 
                            addLogMessage(STAT_CHALLENGE_LORE.SWORD_STONE_FAIL, "puzzle-fail");
                            gameState.currentHp = Math.max(1, gameState.currentHp - SWORD_PULL_HP_COST);
                            triggerPlayerDamageAnimation(); 
                            if (gameState.currentHp <= 0) handleGameEnd("Your final effort was too much...");
                        }
                    );
                }
                break;
            case 'd': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    presentStatChallengeDecision(
                        specificEncounterKey,
                        `A small, glowing creature lies dying. It looks at you with pleading eyes. Soothe it? (Cost: ${CREATURE_DUST_COST} Dust)`,
                        "You harden your heart and walk away.",
                        () => { 
                            if (gameState.resources.glimmeringDust >= CREATURE_DUST_COST) {
                                gameState.resources.glimmeringDust -= CREATURE_DUST_COST;
                                addLogMessage(STAT_CHALLENGE_LORE.DYING_CREATURE_SUCCESS, "puzzle-success");
                                const heartstone = ARTIFACTS.find(a => a.key === "ART_HEARTSTONE");
                                if (heartstone && !gameState.collectedArtifacts.includes(heartstone.key)) {
                                    gameState.collectedArtifacts.push(heartstone.key);
                                    gameState.stats.spirit++;
                                    addLogMessage(`<strong>${heartstone.name}</strong>: ${heartstone.description}`, "artifact");
                                    addLogMessage("Your Spirit increases by 1!", "synergy");
                                }
                                awardXP(20);
                                return true;
                            }
                            return false;
                        },
                        () => { 
                            addLogMessage(STAT_CHALLENGE_LORE.DYING_CREATURE_FAIL, "puzzle-fail");
                        }
                    );
                }
                break;
            case 'O': 
                const daisKey = `DAIS_${gameState.currentZoneIndex}_${gameState.playerZoneX}_${element.lane}`;
                if (!gameState.narrativeFlags[daisKey]) {
                    if (gameState.collectedArtifacts.includes("ART_LUMINA_LENS")) {
                        addLogMessage(ARTIFACT_SYNERGY_LORE["ORACLE_DAIS_LUMINA_LENS_SYNERGY"], "artifact_synergy");
                        awardXP(25);
                        gameState.narrativeFlags[daisKey] = true;
                        const bonusScraps = seededRandomInt(3, 7);
                        gameState.resources.ancientScraps += bonusScraps;
                        addLogMessage(`The focused vision grants you ${bonusScraps} Ancient Scraps!`, "artifact_synergy");
                    } else {
                        addLogMessage("You stand before an Oracle's Dais. Its surface is clouded, its visions obscured. Perhaps something could clear the view...", "lore");
                    }
                } else {
                    addLogMessage("This Oracle's Dais has already revealed its secrets to you.", "lore");
                }
                break;
            case 'H': 
                const shrineNarrativeKey = `SHRINE_${zone.shrineLoreKey}_${gameState.playerZoneX}_${element.lane}`;
                if (zone.shrineLoreKey && ZONE_LORE[zone.shrineLoreKey] && !gameState.narrativeFlags[shrineNarrativeKey]) {
                    addLogMessage(ZONE_LORE[zone.shrineLoreKey], "lore");
                    awardXP(5);
                    gameState.narrativeFlags[shrineNarrativeKey] = true;
                    if (effectiveStats.spirit >= SPIRIT_SHRINE_THRESHOLD) {
                        addLogMessage("Your spirit resonates with the shrine, granting a deeper understanding of its purpose.", "synergy");
                    }
                    if (seededRandom() < 0.2 + (effectiveStats.spirit - BASE_STAT_VALUE) * 0.05) {
                        const healAmount = Math.floor(gameState.maxHp * (seededRandomInt(15, 30) / 100));
                        gameState.currentHp = Math.min(gameState.maxHp, gameState.currentHp + healAmount);
                        addLogMessage(`The shrine's aura mends some of your weariness. (+${healAmount} HP)`, "synergy");
                        playSound('levelUp', 'A4', '8n');
                    }
                } else if (zone.shrineLoreKey && gameState.narrativeFlags[shrineNarrativeKey]) {
                    addLogMessage("This shrine's power feels familiar, its story already known to you.", "lore");
                }
                if (gameState.runes.includes('Φ') && gameState.runes.includes('Δ')) {
                    const synergyKey = zone.shrineLoreKey + "_SYNERGY_" + gameState.playerZoneX + "_" + element.lane;
                    if (SHRINE_SYNERGY_LORE[zone.shrineLoreKey + "_SYNERGY"] && !gameState.narrativeFlags[synergyKey]) {
                        addLogMessage(SHRINE_SYNERGY_LORE[zone.shrineLoreKey + "_SYNERGY"], "synergy");
                        awardXP(15);
                        gameState.narrativeFlags[synergyKey] = true;
                        const bonusDust = seededRandomInt(5, 15);
                        gameState.resources.glimmeringDust += bonusDust;
                        addLogMessage(`The shrine's deepened resonance blesses you with ${bonusDust} Glimmering Dust!`, "synergy");
                    }
                }
                break;
            case 'A': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    const specialArtifactKeys = [
                        "ART_ANCIENT_BLADE", "ART_HEARTSTONE", "ART_TOME_MIGHT",
                        "ART_TOME_WITS", "ART_TOME_RESOLVE"
                    ];
                    const undiscoveredArtifacts = ARTIFACTS.filter(art => 
                        !gameState.collectedArtifacts.includes(art.key) && 
                        !specialArtifactKeys.includes(art.key)
                    );
                    if (undiscoveredArtifacts.length > 0) {
                        const foundArtifact = undiscoveredArtifacts[seededRandomInt(0, undiscoveredArtifacts.length - 1)];
                        gameState.collectedArtifacts.push(foundArtifact.key);
                        gameState.narrativeFlags[specificEncounterKey] = true;
                        gameState.narrativeFlags[foundArtifact.key] = true; 
                        addLogMessage(`In a hidden alcove, you discover the <strong>${foundArtifact.name}</strong>!`, "artifact");
                        addLogMessage(foundArtifact.description, "artifact");
                        playSound('artifact');
                        awardXP(25);
                    } else {
                        addLogMessage("You find signs of a hidden cache, but it's empty.", "lore");
                    }
                }
                break;

            case 'L': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    const unreadFragments = WORLD_LORE_FRAGMENTS.filter(frag => !gameState.narrativeFlags[frag.key]);
                    if (unreadFragments.length > 0) {
                        const fragment = unreadFragments[seededRandomInt(0, unreadFragments.length - 1)];
                        addLogMessage(fragment.text, "world_lore");
                        gameState.narrativeFlags[specificEncounterKey] = true;
                        gameState.narrativeFlags[fragment.key] = true;
                        playSound('tome');
                        awardXP(10);
                    }
                }
                break;

            case '.': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    let dustAmount = seededRandomInt(1, 5); 
                    if (gameState.activeRunes.includes('Φ')) {
                        dustAmount++;
                    }
                    gameState.resources.glimmeringDust += dustAmount;
                    addLogMessage(`You scoop up a small pile of shimmering dust (+${dustAmount}).`, "lore");
                    gameState.narrativeFlags[specificEncounterKey] = true;
                    playSound('dust');
                    awardXP(1);
                }
                break;   

            // PHASE 4: Runestone
            case '®':
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    const runeKeys = ['Φ', 'Δ', 'Ω', 'V', 'Σ', 'Γ'];
                    const undiscoveredRunes = runeKeys.filter(r => !gameState.runes.includes(r));
                    if (undiscoveredRunes.length > 0) {
                        const foundRune = undiscoveredRunes[seededRandomInt(0, undiscoveredRunes.length - 1)];
                        gameState.runes.push(foundRune);
                        gameState.narrativeFlags[specificEncounterKey] = true;
                        addLogMessage(`You draw power from a Runestone! You have learned the <strong>${RUNE_DEFINITIONS[foundRune].name}</strong> (${foundRune})!`, "artifact");
                        playSound('rune');
                        awardXP(50);
                    } else {
                        addLogMessage("You touch the runestone, but its knowledge is already within you.", "lore");
                    }
                }
                break;

            case 'N': 
                if (element.npcType && NPCS[element.npcType]) {
                    if (element.npcType === "HERMIT_RUNESMITH") {
                        const questActive = gameState.narrativeFlags['quest_chisel_active'];
                        const chiselFound = gameState.collectedArtifacts.includes("ART_RUNESMITHS_CHISEL");
                        const questComplete = gameState.narrativeFlags['quest_chisel_complete'];

                        let hermitDialogue = "";

                        if (questComplete) {
                            hermitDialogue = `The Hermit grunts, "The forge feels warmer, thanks to you."`;
                        } else if (questActive && chiselFound) {
                            hermitDialogue = `The Hermit's eyes widen. "You found it! My chisel! Here, take this for your trouble."`;
                            addLogMessage(hermitDialogue, "npc");
                            
                            gameState.narrativeFlags['quest_chisel_complete'] = true;
                            gameState.resources.ancientScraps += 15;
                            awardXP(100);
                            addLogMessage("You received 15 Ancient Scraps!", "quest");
                        } else if (questActive && !chiselFound) {
                            hermitDialogue = `The Hermit scoffs, "Still wandering around? Find my chisel!"`;
                        } else {
                            hermitDialogue = `The Hermit mutters, "Can't work... lost my finest chisel tip somewhere in these cursed ruins. Find it, and I'll make it worth your while."`;
                            gameState.narrativeFlags['quest_chisel_active'] = true;
                        }
                        
                        if (!questComplete && !(questActive && chiselFound)) {
                            addLogMessage(hermitDialogue, "npc");
                        }

                    } else {
                        if (!gameState.encounteredNPCs[specificEncounterKey]) {
                            const npc = NPCS[element.npcType];
                            const dialogue = npc.dialogue[seededRandomInt(0, npc.dialogue.length - 1)];
                            addLogMessage(`A ${npc.name} murmurs: "${dialogue}"`, "npc");
                            gameState.encounteredNPCs[specificEncounterKey] = true;
                            awardXP(5);
                        }
                    }

                    if (gameState.companion && COMPANION_NPC_REACTION_DIALOGUE[gameState.companion.type] && COMPANION_NPC_REACTION_DIALOGUE[gameState.companion.type][element.npcType]) {
                        const companionReactFlag = `companion_reacted_${element.npcType}_${specificEncounterKey}`;
                        if (!gameState.narrativeFlags[companionReactFlag]) {
                            addLogMessage(COMPANION_NPC_REACTION_DIALOGUE[gameState.companion.type][element.npcType], "companion");
                            gameState.narrativeFlags[companionReactFlag] = true;
                        }
                    }
                }
                break;

            case '+': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    const epitaph = EPITAPHS[seededRandomInt(0, EPITAPHS.length - 1)];
                    addLogMessage(`A weathered marker reads: "${epitaph}"`, "grave");
                    gameState.narrativeFlags[specificEncounterKey] = true;
                    awardXP(2);
                }
                break;

            case 'P': 
                if (!gameState.companion && !gameState.narrativeFlags.companionFound) {
                    const companionData = COMPANIONS[seededRandomInt(0, COMPANIONS.length - 1)];
                    
                    presentCompanionNaming(companionData);
                    
                    gameState.narrativeFlags.companionFound = true;
                }
                break;
            
            case '§': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    gameState.narrativeFlags[specificEncounterKey] = true; 
                    let message = "You find a strange, soot-covered idol. It seems to hum, and a faint whisper enters your mind, speaking of a long-lost songbird.";

                    if (gameState.collectedArtifacts.includes("ART_PETRIFIED_SONGBIRD")) {
                        message += " You hold out the Petrified Songbird. The idol's hum intensifies, and a wave of warmth washes over you as the bird's stone form crumbles to dust, releasing a single, pure note of the First Song! Your spirit feels permanently fortified by the echo.";
                        addLogMessage(message, "artifact_synergy");
                        
                        gameState.stats.spirit++; 
                        awardXP(50);

                        gameState.collectedArtifacts = gameState.collectedArtifacts.filter(key => key !== "ART_PETRIFIED_SONGBIRD");

                    } else {
                        message += " The meaning is unclear, but you feel a sense of longing from the object.";
                        addLogMessage(message, "lore");
                        awardXP(5);
                    }
                    renderAll(); 
                }
                break;

            case '¤': 
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    pauseGameForDecision(true);
                    gameState.narrativeFlags[specificEncounterKey] = true; 

                    let prompt = "You find a colossal, dormant forge built into the mountainside. Its surface is cold, but ancient runes glow with latent heat. It seems to be waiting for something.";
                    let options = [{ text: "Leave it be", outcome: "LEAVE" }];

                    if (gameState.collectedArtifacts.includes("ART_RUNESMITHS_RESONATOR")) {
                        prompt += " Your Runesmith's Resonator hums, eager to awaken the forge.";
                        options.unshift({ text: "Use the Resonator (Spirit 5)", outcome: "RESONATE" });
                    }

                    decisionPromptText.textContent = prompt;
                    decisionButtonsContainer.innerHTML = '';
                    options.forEach(option => {
                        const button = document.createElement('button');
                        button.textContent = option.text;
                        button.onclick = () => {
                            decisionArea.style.display = 'none';
                            if (option.outcome === "RESONATE") {
                                if (getEffectiveStats().spirit >= 5) {
                                    addLogMessage("You attune the Resonator to the forge. With a surge of spiritual energy, the runes blaze to life! The forge awakens with a low hum, ready for an offering.", "puzzle-success");
                                    awardXP(40);
                                    presentForgeOfferingChoice();
                                } else {
                                    addLogMessage("You try to use the Resonator, but lack the spiritual fortitude (Spirit 5 required). The forge remains dormant.", "puzzle-fail");
                                    pauseGameForDecision(false);
                                }
                            } else {
                                addLogMessage("You step away from the ancient forge.", "decision");
                                pauseGameForDecision(false);
                            }
                        };
                        decisionButtonsContainer.appendChild(button);
                    });
                    decisionArea.style.display = 'block';
                }
                break;
        }
    });
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

function transitionToZone(newZoneIndex) {
    if (newZoneIndex >= ZONES.length) {
        handleGameEnd("You have explored all currently known realms! The journey ends... for now.");
        return;
    }

    gameState.currentZoneIndex = newZoneIndex;
    gameState.playerZoneX = 0;
    gameState.playerLane = PLAYER_INITIAL_LANE;
    gameState.encounteredNPCs = {}; 
    
    gameState.currentZoneElements = generateZoneElements(newZoneIndex);

    const newZone = getCurrentZone();
    if (!newZone) {
        handleGameEnd("An unknown path was chosen. The journey ends abruptly.");
        return;
    }

    if (newZone.entryLoreKey && ZONE_LORE[newZone.entryLoreKey] && !gameState.narrativeFlags[newZone.entryLoreKey]) {
        addLogMessage(ZONE_LORE[newZone.entryLoreKey], "lore");
        gameState.narrativeFlags[newZone.entryLoreKey] = true;
    }

    const newZoneFlag = `ENTERED_ZONE_${newZone.name.replace(/\s+/g, '_')}`;
    if (!gameState.narrativeFlags[newZoneFlag]) {
        awardXP(50);
        gameState.narrativeFlags[newZoneFlag] = true;
    }

    if (gameState.companion && COMPANION_ZONE_ENTRY_DIALOGUE[gameState.companion.type] && COMPANION_ZONE_ENTRY_DIALOGUE[gameState.companion.type][newZone.name]) {
        addLogMessage(COMPANION_ZONE_ENTRY_DIALOGUE[gameState.companion.type][newZone.name], "companion");
    }

    addLogMessage(`Venturing into ${newZone.name}...`);
    updateUIAccentColors(); 
    renderAll(); 
    pauseGameForDecision(false); 
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

// --- PHASE 4: Rendering Companions & Map Tooltips ---
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

function presentDecision(decisionKey) {
    // 1. We must load the decision data FIRST!
    const decisionData = DECISIONS[decisionKey]; 
    if (!decisionData) return;

    // 2. Auto-Progress Logic
    if (gameState.auto.progress) {
        // Find all options that move the player forward (ignore the "End Journey" options)
        const forwardOptions = decisionData.options.filter(opt => opt.nextZoneIndex !== -1);
        
        if (forwardOptions.length > 0) { 
            // Randomly select one of the valid forward paths!
            const randomOption = forwardOptions[seededRandomInt(0, forwardOptions.length - 1)];
            resolveDecision(randomOption); 
            return; 
        }
    }

    // 3. Manual Player Input Logic (if Auto-Progress is OFF)
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

function generateCharacterSummary() {
    let summary = `=== Journey's Echo ===\n`;
    summary += `Name: ${gameState.playerName}\n`;
    summary += `World Seed: ${gameState.initialGameSeed}\n`;
    summary += `Level: ${gameState.level} (${gameState.xp}/${gameState.xpToNextLevel} XP)\n`;
    const lastZone = ZONES[gameState.lastExploredZoneIndex !== undefined ? gameState.lastExploredZoneIndex : gameState.currentZoneIndex] || { name: "An Unknown Place" };
    summary += `Final Zone Reached: ${lastZone.name}${gameState.currentZoneIndex === -1 ? " (Journey Paused/Ended)" : ""}\n`;
    
    // Check Abyss Depth
    if (gameState.currentZoneIndex === 8 || gameState.lastExploredZoneIndex === 8) {
        summary += `Abyssal Depth: ${gameState.playerZoneX} steps\n`;
    }

    summary += `HP: ${Math.max(0, gameState.currentHp)}/${gameState.maxHp}\n`;
    summary += `Class: ${gameState.playerClass || "None"}\n`;
    summary += `\n-- Stats --\n`;
    summary += `Might (MGT): ${gameState.stats.might}\n`;
    summary += `Wits (WIT): ${gameState.stats.wits}\n`;
    summary += `Spirit (SPR): ${gameState.stats.spirit}\n`;
    summary += `\n-- Resources --\n`;
    summary += `Glimmering Dust: ${gameState.resources.glimmeringDust}\n`;
    summary += `Ancient Scraps: ${gameState.resources.ancientScraps}\n`;
    if (gameState.resources.voidEssence > 0) {
        summary += `Void Essence: ${gameState.resources.voidEssence}\n`;
    }
    summary += `\n-- Discoveries --\n`;
    summary += `Companion: ${gameState.companion ? `${gameState.companion.name} the ${gameState.companion.type}` : 'None'}\n`;
    summary += `Runes: ${gameState.runes.length > 0 ? gameState.runes.join(', ') : 'None'}\n`;
    summary += `Artifacts (${gameState.collectedArtifacts.length}/${ARTIFACTS.length}):\n`;
    if (gameState.collectedArtifacts.length > 0) {
        gameState.collectedArtifacts.forEach(key => {
            const artifact = ARTIFACTS.find(art => art.key === key);
            if (artifact) summary += `  - ${artifact.name}\n`;
        });
    } else {
        summary += `  None Found\n`;
    }
    summary += `\nMay your next path be illuminated.`;
    return summary;
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

/** Main game loop, executed every tick. */
function gameLoop() {
    if (gameState.isPaused || gameState.activeDecision || gameState.currentZoneIndex === -1 || gameState.inCombat) return;

    if (gameState.currentZoneIndex === 0 && gameState.playerZoneX === NAME_CHOICE_EVENT_X_POS && !gameState.narrativeFlags.nameChoiceOffered) {
        presentNameChoice();
        gameState.narrativeFlags.nameChoiceOffered = true;
        return;
    }
    if (gameState.currentZoneIndex === 0 && gameState.playerZoneX === CLASS_CHOICE_EVENT_X_POS && !gameState.playerClass && !gameState.narrativeFlags.classChoiceOffered) {
        presentClassChoice();
        gameState.narrativeFlags.classChoiceOffered = true;
        return;
    }

    const zone = getCurrentZone();
    if (!zone) {
        if (gameInterval) clearInterval(gameInterval);
        return;
    }

    // Expand Endless Abyss array as you walk so we don't freeze on load
    if (gameState.currentZoneIndex === 8) {
        expandZoneElements(8);
    }

    const nextX = gameState.playerZoneX + 1;
    const elementsAhead = gameState.currentZoneElements[nextX] || [];
    const blockingObstacle = elementsAhead.find(el => el.lane === gameState.playerLane && (el.char === '~' || el.char === 'M'));
    let isBlocked = false;

    if (blockingObstacle) {
        const possibleLanes = [];
        if (gameState.playerLane > 0) possibleLanes.push(gameState.playerLane - 1);
        if (gameState.playerLane < NUM_LANES - 1) possibleLanes.push(gameState.playerLane + 1);

        const safeLanes = possibleLanes.filter(lane => {
            const nextBlocked = elementsAhead.some(el => el.lane === lane && (el.char === '~' || el.char === 'M'));
            const elementsCurrent = gameState.currentZoneElements[gameState.playerZoneX] || [];
            const currentBlocked = elementsCurrent.some(el => el.lane === lane && (el.char === '~' || el.char === 'M'));
            return !nextBlocked && !currentBlocked;
        });

        if (safeLanes.length > 0) {
            gameState.playerLane = safeLanes[seededRandomInt(0, safeLanes.length - 1)];
        } else {
            isBlocked = true; 
        }
    }

    if (!isBlocked) {
        gameState.playerZoneX++;
        playSound('step');
        
        // PHASE 4: Companion Passive Find Logic
        if (gameState.companion && seededRandom() < 0.02) { // 2% chance per step
            if (seededRandom() < 0.8) {
                let dust = seededRandomInt(2, 6);
                gameState.resources.glimmeringDust += dust;
                addLogMessage(`${gameState.companion.name} dug up ${dust} Glimmering Dust!`, "companion");
            } else {
                gameState.inventory['healing_dust'] = (gameState.inventory['healing_dust'] || 0) + 1;
                addLogMessage(`${gameState.companion.name} found a Pouch of Healing Dust!`, "companion");
            }
            playSound('companionFind');
        }
    }

    if (seededRandom() < VERTICAL_MOVE_CHANCE) {
        const direction = seededRandom() < 0.5 ? -1 : 1;
        const newLane = gameState.playerLane + direction;
        if (newLane >= 0 && newLane < NUM_LANES) {
            const elementsHere = gameState.currentZoneElements[gameState.playerZoneX] || [];
            const isTargetLaneBlocked = elementsHere.some(el => el.lane === newLane && (el.char === '~' || el.char === 'M'));
            if (!isTargetLaneBlocked) {
                gameState.playerLane = newLane;
            }
        }
    }

    handleEncounter();

    let decisionTriggered = false;
    for (const key in DECISIONS) {
        const decision = DECISIONS[key];
        const alreadyMade = decision.options.some(opt => gameState.narrativeFlags[opt.outcomeKey]);
        if (decision.triggeredByZoneEnd === gameState.currentZoneIndex && gameState.playerZoneX >= zone.width && !alreadyMade) {
            presentDecision(key);
            decisionTriggered = true;
            break;
        }
    }

    if (!decisionTriggered) {
        renderAll();
    }
}

function renderAll() {
    renderStats();
    renderGameScreen();
    renderLog();
}

// =============================================================================
// │ INITIALIZATION & EVENT LISTENERS                                            │
// =============================================================================

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

if (btnAutoCombat) btnAutoCombat.addEventListener('click', () => { gameState.auto.combat = !gameState.auto.combat; updateAutoButtonVisuals(); });
if (btnAutoEvents) btnAutoEvents.addEventListener('click', () => { gameState.auto.events = !gameState.auto.events; updateAutoButtonVisuals(); });
if (btnAutoProgress) btnAutoProgress.addEventListener('click', () => { gameState.auto.progress = !gameState.auto.progress; updateAutoButtonVisuals(); });
    
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

// =============================================================================
// │ START GAME FUNCTION                                                       │
// =============================================================================

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
