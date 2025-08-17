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
const COMPANION_FIND_CHANCE = 0.1; // Base chance for a companion to find something.
const SPONTANEOUS_VICTORY_CHANCE = 0.01; // Small chance to instantly win a combat encounter.
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

// --- Miscellaneous ---
const MIN_STEP_SOUND_INTERVAL = 0.2; // Minimum seconds between step sounds to prevent spam.
const STARTUP_MESSAGES = [
    "The ancient echoes stir...", "A new path unfolds in the ruins...", "Whispers of forgotten ages call to you...",
    "The scent of adventure hangs heavy in the air...", "Destiny awaits, or perhaps, only dust...",
    "Another soul wanders these blighted lands...", "The Runes pulse with a faint, expectant energy..."
];
let devSpeedMultiplier = 1; // For developer speed controls.

// =============================================================================
// │ SEEDED RANDOM NUMBER GENERATOR (Mulberry32)                               │
// =============================================================================
let currentSeed;

/** Initializes the seeded RNG with a specific seed. */
function initializeSeed(seed) {
    currentSeed = seed;
}

/** Generates a predictable float between 0 and 1 based on the current seed. */
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

/** Generates a predictable integer within a given range based on the current seed. */
function seededRandomInt(min, max) {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
}

// =============================================================================
// │ SOUND SYSTEM (Tone.js)                                                      │
// =============================================================================
let soundSynth, noiseSynth, metalSynth;

/** Initializes the Tone.js synthesizers for sound effects. */
function initializeSounds() {
    if (typeof Tone === 'undefined') {
        console.warn("Tone.js not loaded. Sounds will be disabled.");
        return;
    }
    if (Tone.context.state !== 'running') {
        Tone.start().catch(e => console.warn("Tone.start() requires user interaction.", e));
    }
    try {
        soundSynth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
            volume: -20
        }).toDestination();

        noiseSynth = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.1 },
            volume: -25
        }).toDestination();

        metalSynth = new Tone.MetalSynth({
            frequency: 50,
            envelope: { attack: 0.001, decay: 0.1, release: 0.1 },
            harmonicity: 3.1,
            modulationIndex: 16,
            resonance: 2000,
            octaves: 0.5,
            volume: -22
        }).toDestination();
    } catch (e) {
        console.error("Error initializing Tone.js synthesizers:", e);
        Tone = undefined; // Disable sound functions if initialization fails.
    }
}

/** Plays a specific sound effect if sounds are enabled. */
function playSound(type, note = 'C4', duration = '16n') {
    if (gameState.isMuted || typeof Tone === 'undefined' || !soundSynth) return;
    if (Tone.context.state !== 'running') {
        Tone.start().catch(e => { /* Fails silently if user hasn't interacted */ });
        if (Tone.context.state !== 'running') return;
    }

    const baseTime = Tone.now() + 0.005;

    try {
        switch (type) {
            case 'step':
                if (baseTime - gameState.lastStepSoundTime >= MIN_STEP_SOUND_INTERVAL) {
                    noiseSynth.triggerAttackRelease(duration, baseTime, 0.3);
                    gameState.lastStepSoundTime = baseTime;
                }
                break;
            case 'dust':
                soundSynth.triggerAttackRelease('C6', '32n', baseTime);
                break;
            case 'scrap':
                metalSynth.triggerAttackRelease('8n', baseTime, 0.2);
                break;
            case 'rune':
                soundSynth.triggerAttackRelease('G5', '8n', baseTime);
                soundSynth.triggerAttackRelease('C6', '8n', baseTime + 0.1);
                break;
            case 'artifact':
                soundSynth.triggerAttackRelease('A5', '16n', baseTime);
                soundSynth.triggerAttackRelease('E6', '16n', baseTime + 0.05);
                break;
            case 'tome':
                noiseSynth.triggerAttackRelease("4n", baseTime, 0.1);
                break;
            case 'levelUp':
                soundSynth.triggerAttackRelease('C4', '8n', baseTime);
                soundSynth.triggerAttackRelease('E4', '8n', baseTime + 0.1);
                soundSynth.triggerAttackRelease('G4', '8n', baseTime + 0.2);
                soundSynth.triggerAttackRelease('C5', '4n', baseTime + 0.3);
                break;
            case 'companionFind':
                soundSynth.triggerAttackRelease('B5', '16n', baseTime);
                soundSynth.triggerAttackRelease('D6', '16n', baseTime + 0.07);
                soundSynth.triggerAttackRelease('F#6', '16n', baseTime + 0.14);
                break;
            case 'combatHit':
                metalSynth.triggerAttackRelease('16n', baseTime, 0.5);
                break;
            case 'combatMiss':
                noiseSynth.triggerAttackRelease("16n", baseTime, 0.4);
                break;
            case 'combatVictory':
                soundSynth.triggerAttackRelease('G4', '8n', baseTime);
                soundSynth.triggerAttackRelease('C5', '4n', baseTime + 0.1);
                break;
            case 'combatDefeat':
                soundSynth.triggerAttackRelease('C3', '1n', baseTime);
                break;
            default:
                soundSynth.triggerAttackRelease(note, duration, baseTime);
        }
    } catch (e) {
        // console.error(`Error playing sound (${type}):`, e);
    }
}

// =============================================================================
// │ PRIMARY GAME STATE OBJECT                                                   │
// =============================================================================
let gameState = {
    // Player Info
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

    // Player Position & Speed
    playerZoneX: 0,
    playerLane: PLAYER_INITIAL_LANE,
    currentZoneIndex: 0,
    lastExploredZoneIndex: 0,
    explorationSpeedMultiplier: 1,

    // Inventory & Collections
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

    // Game Control & State Flags
    isPaused: false,
    inCombat: false,
    activeDecision: null,
    narrativeFlags: {},
    encounteredNPCs: {},

    // System & Meta
    initialGameSeed: 0,
    isMuted: false,
    gameTickMs: INITIAL_GAME_TICK_MS,
    lastStepSoundTime: 0,
    logMessages: [],
};
// =============================================================================
// │ LORE & CONTENT DEFINITIONS                                                │
// =============================================================================

/**
 * Defines the types of enemies players can encounter.
 * Loot function returns the amount of Glimmering Dust dropped.
 * Some enemies can also award special resources like Void Essence or Ancient Scraps.
 */

const PLAYER_CLASSES = {
    STALWART: {
        key: "STALWART",
        name: "Stalwart",
        description: "A resilient warrior. Starts with a permanent +5 bonus to Max HP."
    },
    ERUDITE: {
        key: "ERUDITE",
        name: "Erudite",
        description: "A keen-minded scholar. Gains 5% more XP from all sources."
    },
    WANDERER: {
        key: "WANDERER",
        name: "Wanderer",
        description: "A balanced traveler who walks their own path, defined by the journey itself."
    }
};

/**
 * Defines the properties and effects of each discoverable Rune.
 */
const RUNE_DEFINITIONS = {
    'Φ': {
        name: "Rune of Perception",
        description: "Your eyes see more than others. Increases Glimmering Dust found from piles by 1."
    },
    'Δ': {
        name: "Rune of Resilience",
        description: "Your form hardens against attack. Reduces all incoming combat damage by 1."
    },
    'Ω': {
        name: "Obsidian Rune",
        description: "A fragment of the Void's power. Adds 2 bonus Void damage to your attacks."
    }
};

const ENEMY_TYPES = {
    ASH_GNAWER: {
        name: "Ash Gnawer",
        description: "A small, four-legged creature made of cinders and spite.",
        hp: 8,
        attack: 3,
        defense: 1,
        xp: 10,
        loot: () => seededRandomInt(2, 5)
    },
    VOID_TENDRIL: {
        name: "Void Tendril",
        description: "A lashing ribbon of pure darkness, dripping with anti-reality.",
        hp: 12,
        attack: 5,
        defense: 2,
        xp: 20,
        loot: () => {
            if (seededRandom() < 0.2) gameState.resources.voidEssence++;
            return seededRandomInt(5, 10);
        }
    },
    RUSTED_CONSTRUCT: {
        name: "Rusted Construct",
        description: "A Lumina guardian, its directives corrupted by centuries of decay.",
        hp: 20,
        attack: 4,
        defense: 4,
        xp: 25,
        loot: () => {
            if (seededRandom() < 0.5) gameState.resources.ancientScraps++;
            return seededRandomInt(8, 15);
        }
    },
    CRYSTAL_LURKER: {
        name: "Crystal Lurker",
        description: "A creature of living crystal that moves with a predatory grace, refracting light in dangerous ways.",
        hp: 25,
        attack: 6,
        defense: 3,
        xp: 30,
        loot: () => {
            if (seededRandom() < 0.1) gameState.resources.ancientScraps++; // 10% chance for a scrap
            return seededRandomInt(10, 20); // Drops a lot of dust
        }
    },
    RUSTED_SENTINEL: {
        name: "Rusted Sentinel",
        description: "A Lumina security automaton, its chassis pitted with rust but its directives to protect the city remain grimly intact.",
        hp: 30,
        attack: 7,
        defense: 5,
        xp: 40,
        loot: () => {
            if (seededRandom() < 0.8) gameState.resources.ancientScraps++; // High chance for scraps
            return seededRandomInt(15, 25);
        }
    }
};

/**
 * Lore text for entering a zone or interacting with a shrine for the first time.
 */
const ZONE_LORE = {
    "ASHEN_WOODS_INTRO": "The Ashen Woods. Charred skeletons of trees claw at a sky perpetually choked with soot. The taste of ancient grief lingers in the air.",
    "ASHEN_SHRINE_1": "This soot-stained shrine feels strangely warm. Carvings depict a colossal, blazing tree – 'The First Spark' – its branches birthing stars, its roots anchoring reality. Then, a scene of it consumed by an even greater fire – 'The Great Ember.'",
    "CRIMSON_DEPTHS_INTRO": "The Crimson Depths. Bioluminescent crystals pulse with a slow, rhythmic light, casting eerie, dancing shadows. The silence is profound, broken only by the drip of mineral-rich water.",
    "CRIMSON_SHRINE_1": "Runes on this damp shrine flow like water. They speak of 'Earth-Songs,' the planet's resonant heartbeat, and 'Crystal Hearts,' vast geode networks that amplified these songs into a symphony of life.",
    "VOLCANIC_WASTES_INTRO": "The Volcanic Wastes. A hellscape of cracked obsidian plains and rivers of molten rock. The air shimmers with unbearable heat, and the ground trembles with the planet's fury.",
    "VOLCANIC_SHRINE_1": "Forged in volcanic glass, this shrine radiates intense heat. It tells of 'Sky-Fire,' a celestial forge, and 'Mountain Hearts' of adamant, shattered when the 'Void Star' screamed across the heavens and struck the world.",
    "STARFALL_CRATER_INTRO": "The Starfall Crater. An unnatural stillness hangs over this vast, glass-lined wound in the earth. Strange, impossible geometries jut from the crater floor, pulsing with a faint, sickly light.",
    "STARFALL_SHRINE_1": "This shrine is not of this world. Its material is cold, absorbing light. It speaks not of creation, but of un-creation, of the 'Silent Maw' that is the Void, and the 'Star-That-Devours' which was its herald.",
    "SUNKEN_ARCHIVES_INTRO": "The Sunken Archives. Waterlogged ruins of a Lumina repository sigh with the weight of lost knowledge. Ghostly lights flicker within submerged data-conduits.",
    "SUNKEN_ARCHIVES_SHRINE_1": "This coral-encrusted shrine depicts Lumina scholars cataloging stars and weaving light into complex data-matrices. It mourns the 'Great Unlearning' when their knowledge was drowned or shattered.",
    "SKY_TEMPLE_AERIE_INTRO": "The Sky-Temple Aerie. Wind howls through broken archways of a once-majestic Lumina temple, clinging to a mountain summit. Clouds drift like ghosts through its crumbling halls.",
    "SKY_TEMPLE_AERIE_SHRINE_1": "This shrine, carved from cloud-like alabaster, depicts Lumina with feathered wings, communing with celestial energies. It speaks of the 'Upper Weave' and the 'Breath of Stars' that powered their Sky-Citadels.",
    "GLIMMERING_DEPTHS_INTRO": "The Glimmering Depths. A cavern of impossible beauty, where light is not just seen, but felt. Crystals of pure turquoise and diamond line every surface, refracting a silent symphony. The air hums with powerful, resonant energy.",
    "GLIMMERING_SHRINE_1": "This shrine is carved from a single, flawless crystal that pulses with internal light. Runes describe the 'Crystal Lattices,' conduits for the First Song, which focused the world's lifeblood into tangible energy. A warning is etched below: 'The Song's echo can heal, but its crescendo can shatter.'",
    "DROWNED_CITY_LYRA_INTRO": "The Drowned City of Lyra. Once a jewel of Lumina engineering, now a silent, waterlogged tomb. Grand causeways are choked with coral, and data-conduits pulse with a ghostly, failing light. The pressure of the deep is palpable.",
    "LYRA_SHRINE_1": "This shrine, made of a strange, water-resistant alloy, shows Lumina manipulating vast currents of energy and information. It speaks of the 'Central Datastream' that powered the city, a consciousness now fragmented into whispering echoes."
};

/**
 * Special lore revealed at shrines when the player has collected specific Runes (Φ and Δ).
 */
const SHRINE_SYNERGY_LORE = {
    "ASHEN_SHRINE_1_SYNERGY": "The combined aura of your Runes (Φ+Δ) resonates deeply. The shrine's warmth intensifies, revealing a hidden compartment. Inside, ancient, untouched dust glimmers, and you feel a surge of protective energy.",
    "CRIMSON_SHRINE_1_SYNERGY": "With Perception and Resilience, you decipher a deeper layer of runes on the damp shrine. They speak of Crystal Guardians that sleep beneath the earth, awaiting a call only the pure-hearted can make.",
    "VOLCANIC_SHRINE_1_SYNERGY": "Your attuned Runes (Φ+Δ) allow you to withstand the shrine's heat longer. You glimpse a vision of the Runesmiths forging not just symbols, but anchors against the Void, their efforts ultimately overwhelmed but not entirely in vain.",
    "STARFALL_SHRINE_1_SYNERGY": "The alien shrine reacts to your Runes (Φ+Δ), a low hum emanating from its core. It shows you a fleeting image: the Void Star was not just a destroyer, but a seed. What it planted here remains a chilling mystery.",
    "SUNKEN_ARCHIVES_SHRINE_1_SYNERGY": "Your Runes (Φ+Δ) illuminate faded glyphs upon the coral. They tell of Lumina attempts to create 'Echo Chambers' - repositories of consciousness to survive The Fall. Perhaps some still function, lost in the deepest trenches.",
    "SKY_TEMPLE_AERIE_SHRINE_1_SYNERGY": "The Runes of Perception and Resilience (Φ+Δ) harmonize with the Aerie's winds. You hear a clear, ancient voice on the breeze: 'The First Song is fractured, but its notes linger. Seek those who remember its cadence.'"
};

/**
 * Special lore revealed when using one specific artifact at a specific location.
 */
const ARTIFACT_SYNERGY_LORE = {
    "ORACLE_DAIS_LUMINA_LENS_SYNERGY": "Holding the Cracked Lumina Lens to the Oracle's Dais, the fractured images coalesce. You see a vision: Lumina Seers, their eyes wide with terror, witnessing the Void Star's approach. They speak of a 'Final Sanctuary,' hidden beyond the known realms, a place where a fragment of the First Song might yet be preserved..."
};

/**
 * Outcome text for stat-based challenges found in the world.
 */
const STAT_CHALLENGE_LORE = {
    "BLOCKED_PATH_SUCCESS": "With a surge of might, you clear the debris, revealing a small cache of resources!",
    "BLOCKED_PATH_FAIL": "The blockage is too formidable for your current strength.",
    "RUNIC_ETCHINGS_SUCCESS": "Your keen intellect deciphers the ancient etchings! They speak of [a short, unique seeded lore snippet about the zone's deeper history or a nearby secret - TBD].",
    "RUNIC_ETCHINGS_FAIL": "The runic markings are complex and weathered, their meaning lost to you.",
    "WHISPERING_TOTEM_SUCCESS": "Your spirit attunes to the totem's whispers. You feel a fleeting surge of insight and hear: 'The echoes remember...'",
    "WHISPERING_TOTEM_FAIL": "A faint murmur emanates from the totem, but its words are indistinct, like wind through dead leaves.",
    "SWORD_STONE_SUCCESS": "With a great heave, you wrench the ancient blade from the stone! It hums with a thirsty power.",
    "SWORD_STONE_FAIL": "You pull with all your might, but the blade remains locked in the stone. You feel drained from the effort.",
    "DYING_CREATURE_SUCCESS": "You offer a small bit of glimmering dust. The creature licks your hand gratefully before its light fades, leaving behind a warm, smooth stone.",
    "DYING_CREATURE_FAIL": "You lack the resources or the will to help. You move on as the creature's breathing grows shallow."
};

/**
 * Random, short atmospheric messages to add flavor to the log.
 */
const NARRATIVE_SNIPPETS = [
    "A cold draft chills you to the bone, carrying the scent of ozone and despair.",
    "For a moment, you hear the faint sound of distant, mournful singing.",
    "The very stones beneath your feet seem to hum with a forgotten sorrow.",
    "A fleeting image flashes in your mind: a city of light, then darkness.",
    "The air grows heavy, thick with unspoken memories.",
    "You feel a prickling sensation, as if unseen eyes are watching you from the shadows.",
    "A whisper on the wind: '...lost... all lost...'",
    "The ground shudders almost imperceptibly, a deep sigh from the wounded earth.",
    "A single, perfect drop of water falls from an unseen height, its echo unnaturally loud.",
    "The silence here is older than the mountains, deeper than the void.",
    "Dust motes dance in a stray beam of light, like tiny, forgotten stars.",
    "You catch a whiff of something ancient and metallic, like a long-abandoned forge.",
    "The rustle of unseen things in the undergrowth... or is it just the wind?",
    "A strange sense of déjà vu washes over you, as if you've walked this path before, in another life.",
    "The air tastes of ash and regret here.",
    "A flicker of movement in the corner of your eye, but when you turn, nothing is there."
];

/**
 * Lore fragments discovered from 'L' points of interest.
 */
const WORLD_LORE_FRAGMENTS = [{
    key: "WL_GOLDEN_AGE_1",
    text: "A shard of iridescent shell whispers of a time when the 'Singers of Light' wove reality from pure sound, their voices the breath of creation."
}, {
    key: "WL_GOLDEN_AGE_2",
    text: "On a metallic plate: '...the Sky-Citadels floated on currents of pure will, their inhabitants, the Lumina, drawing sustenance from starlight and dreams...'"
}, {
    key: "WL_GOLDEN_AGE_3",
    text: "A perfectly preserved flower, encased in amber, still hums with a faint, joyful energy. It speaks of a world where life and magic were one."
}, {
    key: "WL_GOLDEN_AGE_LUMINA_SOCIETY",
    text: "The Lumina, it's whispered, lived in harmonious 'Constellations' – city-states bound by shared purpose, each a unique note in the world's First Song."
}, {
    key: "WL_GOLDEN_AGE_SKY_TEMPLES",
    text: "Sky-Temples, like the Aerie, were said to be anchors for the Sky-Citadels, drawing energy from both the earth and the celestial sphere to maintain their impossible altitudes."
}, {
    key: "WL_GOLDEN_AGE_FIRST_SONG_POWER",
    text: "The First Song wasn't just heard, it was *felt*. It shaped the land, healed the sick, and allowed the Lumina to commune directly with the essence of reality."
}, {
    key: "WL_LUMINA_CULTURE_1",
    text: "Lumina society valued artistry and understanding above all. Their cities were living sculptures, their technology indistinguishable from magic."
}, {
    key: "WL_LUMINA_CULTURE_2",
    text: "Debate and philosophical inquiry were central to Lumina life. Great halls of learning, now lost, once echoed with profound discussions on the nature of existence."
}, {
    key: "WL_LUMINA_CULTURE_3",
    text: "Lumina children were taught to 'listen' to the world, to discern the subtle notes of the First Song in all things, from the rustle of leaves to the hum of a distant star."
}, {
    key: "WL_LUMINA_CULTURE_4",
    text: "Time, for the Lumina, was not a linear progression but a flowing tapestry. They could perceive echoes of the past and faint glimmers of potential futures."
}, {
    key: "WL_THE_FALL_1",
    text: "A scorched datapad flickers with a final, desperate message: 'The Song is broken! The Void Star… it DRINKS the light! The Lumina… they are screaming…'"
}, {
    key: "WL_THE_FALL_2",
    text: "Etched into a Runesmith's hammer: 'The Great Weave frays. The Anchors of Reality groan under the strain. The Old Night returns, and They come with it.'"
}, {
    key: "WL_THE_FALL_3",
    text: "A child's music box, warped and silent. When touched, a phantom melody of pure terror echoes in your mind."
}, {
    key: "WL_THE_FALL_4",
    text: "Fragment of a prophecy: '...and when the Star-That-Devours tastes the world, silence will claim the Song, and rust will claim the Runes...'"
}, {
    key: "WL_THE_FALL_5",
    text: "A Lumina's signet ring, cracked and cold. It feels heavy with the weight of a civilization's despair."
}, {
    key: "WL_THE_FALL_VOID_NATURE",
    text: "The Void is not mere emptiness, but an active, hungry anti-existence. The Star was its tooth, tearing a hole in the fabric of what is."
}, {
    key: "WL_THE_FALL_SKY_CITADELS_FALL",
    text: "When the Void Star struck, the Sky-Citadels, once beacons of light, rained down as fire and ruin. Few remnants survived, clinging to the highest peaks."
}, {
    key: "WL_THE_FALL_RUNESMITHS_FATE",
    text: "Many Runesmiths perished trying to reinforce the Weave against the Void Star's corruption. Their greatest creations became their tombs."
}, {
    key: "WL_THE_FALL_WEAVERS_LAMENT",
    text: "The Weavers, who spun the threads of reality, could only watch as their tapestries were rent by the Void. Their lament is still felt in places where the Weave is thin."
}, {
    key: "WL_THE_FALL_SILENCE",
    text: "The most terrifying aspect of The Fall was not the destruction, but the encroaching Silence – the absence of the First Song, a void where once there was cosmic harmony."
}, {
    key: "WL_SECRETS_1",
    text: "A geode, when cracked, reveals not crystals, but a miniature, swirling galaxy. It hums in tune with the Rune of Perception, hinting at unseen layers of reality."
}, {
    key: "WL_SECRETS_2",
    text: "A star-chart, etched on dragon scale, depicts constellations that no longer exist, all spiraling towards a central, black abyss – the Void Star's trajectory."
}, {
    key: "WL_SECRETS_RUNESMITHS",
    text: "The Runesmiths, it is said, didn't just craft the Runes. They sang them into existence, binding fragments of the First Song into tangible forms. Their greatest works are keys, not just tools."
}, {
    key: "WL_SECRETS_SLEEPERS",
    text: "Legends tell of 'Sleepers' – powerful beings or constructs from the Golden Age, hidden away, awaiting the 'True Note' of a mended Song to reawaken. Are they myth, or a forgotten promise?"
}, {
    key: "WL_SECRETS_WEAVERS",
    text: "Before the Runesmiths, there were the Weavers, who spun the raw energies of creation. The Runes are but echoes of their intricate tapestries."
}, {
    key: "WL_SECRETS_ARCHIVES_PURPOSE",
    text: "The Sunken Archives... they were meant to be a bulwark against forgetting, a final repository of the Lumina's understanding of the cosmos, should the First Song ever fade."
}, {
    key: "WL_SECRETS_FIRST_SONG_NATURE",
    text: "The First Song was not mere music, but the fundamental vibration of existence, the law that bound atoms and stars. Its fracturing led to The Fall."
}, {
    key: "WL_SECRETS_VOID_WHISPERS_TRUTH",
    text: "The whispers from the Void often speak in half-truths, preying on despair. Discernment is crucial, lest you become another lost echo."
}, {
    key: "WL_SECRETS_GUARDIAN_PROTOCOL",
    text: "The Echo-Guardians were programmed with a final directive: protect the 'Heart-Note' of their designated sacred site, even if all else turns to dust."
}, {
    key: "WL_SECRETS_RUNE_SYNERGY",
    text: "Some Runes, when brought together, resonate in unexpected ways, unlocking deeper truths or latent powers. The Runesmiths knew these combinations, but much of that knowledge is lost."
}, {
    key: "WL_SECRETS_HEART_FORGE",
    text: "Scrawled on a cooled piece of slag: 'The greatest Runesmiths did not build their forges over fire, but within the very heart of the mountain, drawing power from the world's core.'"
}, {
    key: "WL_SECRETS_QUENCHING",
    text: "A smith's log, barely legible: '...we tried quenching the blade in Void Essence. The metal screamed. It is now... hungry. Unstable. We have sealed it away.'"
}, {
    key: "WL_SECRETS_RESONATORS",
    text: "An engraving on a broken tool reads: 'The Resonators were not for crafting, but for awakening. They could coax the latent memories from ancient things.'"
}, {
    key: "WL_HOPE_SAPLING",
    text: "In the deepest char of the Ashen Woods, a single, silver-barked sapling thrives, its leaves shimmering with an inner light. It is a defiant spark against the overwhelming dark."
}, {
    key: "WL_HOPE_RUNES_ECHO",
    text: "The Runes are more than power. They are memories, fragments of the world's soul. Gathered, they might form a new Song, a new beginning... or a final, terrible crescendo."
}, {
    key: "WL_HOPE_WHISPERS",
    text: "Faint whispers, carried on the solar winds, speak of other 'Shards' – worlds touched by the Void Star, some resisting, some fallen, some... waiting."
}, {
    key: "WL_HOPE_COMPANION",
    text: "The bond with a loyal companion... perhaps this, too, is a fragment of the First Song, a note of harmony in a discordant world."
}, {
    key: "WL_HOPE_MEMORY",
    text: "Even in ruin, memory endures. Each fragment of lore, each Rune, is a seed of what was, and what could be again."
}, {
    key: "WL_HOPE_SKY_TEMPLES_LEGACY",
    text: "The Sky-Temples, even in ruin, hold echoes of Lumina wisdom. Perhaps a way to mend the Weave, or at least understand its breaking, lies hidden within their aeries."
}, {
    key: "WL_HOPE_FINAL_SANCTuary",
    text: "The 'Final Sanctuary' spoken of in visions... if it exists, it would require more than just Runes to find. It would need a heart attuned to the remnants of the First Song."
}, {
    key: "WL_HOPE_REBIRTH_CYCLE",
    text: "Some ancient texts hint that The Fall was not an end, but a violent transformation, part of a cosmic cycle of creation and unmaking. Could this rust and ruin be the prelude to a new dawn?"
}, {
    key: "WL_VOID_ECHOES",
    text: "The silence of the Starfall Crater is a lie. Listen closely, and you hear it: the faint, chilling laughter of something ancient and utterly alien, from beyond the veil of stars."
}, {
    key: "WL_GUARDIANS_LEGEND",
    text: "The Lumina, before their fall, were said to have created 'Echo-Guardians,' sentient constructs bound to protect the sacred sites and the deepest secrets of the First Song."
}];

/**
 * A list of all possible companions that can be found.
 */
const COMPANIONS = [
    { type: "Fox", name: "Sparky", call: "yip" },
    { type: "Raven", name: "Corvus", call: "caw" },
    { type: "Salamander", name: "Iggy", call: "hiss" },
    { type: "Hound", name: "Loyal", call: "woof" },
    { type: "Sprite", name: "Glimmer", call: "chime" },
    { type: "Stone Whelp", name: "Roki", call: "rumble" },
    { type: "Owl", name: "Hoot", call: "hoo" },
    { type: "Shadow Pup", name: "Umbra", call: "whimper" }
];

/**
 * Companion-specific dialogue that triggers upon entering a new zone.
 */
const COMPANION_ZONE_ENTRY_DIALOGUE = {
    "Fox": {
        "The Ashen Woods": "Sparky sniffs the air, a low whine escaping its throat. The scent of old fires makes it uneasy.",
        "The Crimson Depths": "Sparky's ears perk up, its eyes wide in the dim light, fascinated by the glowing crystals.",
        "The Volcanic Wastes": "Sparky pants heavily, seeking shade near your legs from the oppressive heat.",
        "The Starfall Crater": "Sparky flattens its ears, growling softly at the unnatural stillness of the crater.",
        "The Sunken Archives": "Sparky shakes its fur, clearly displeased by the dampness of the Archives.",
        "The Sky-Temple Aerie": "Sparky looks up with wide, curious eyes, as if trying to catch the whispers on the wind."
    },
    "Raven": {
        "The Ashen Woods": "Corvus ruffles its feathers, cawing softly as it surveys the desolation.",
        "The Crimson Depths": "Corvus tilts its head, its beady eyes reflecting the crystal light with keen interest.",
        "The Volcanic Wastes": "Corvus circles above briefly, then lands on your shoulder, wary of the molten rivers.",
        "The Starfall Crater": "Corvus lets out a single, sharp caw, its feathers bristling slightly at the alien atmosphere.",
        "The Sunken Archives": "Corvus preens its feathers meticulously, as if trying to ward off the damp and decay.",
        "The Sky-Temple Aerie": "Corvus soars in a tight circle above you, then lands, its gaze fixed on the distant, cloud-wreathed peaks."
    },
    "Salamander": {
        "The Ashen Woods": "Iggy seems to bask in the residual warmth of the ashen ground.",
        "The Crimson Depths": "Iggy flicks its tongue, tasting the mineral-laden air of the caves.",
        "The Volcanic Wastes": "Iggy looks quite at home amidst the heat and sulfurous fumes, its scales almost glowing.",
        "The Starfall Crater": "Iggy presses itself flat against a rock, wary of the strange energies.",
        "The Sunken Archives": "Iggy seems to enjoy the humidity, though it avoids the deeper pools.",
        "The Sky-Temple Aerie": "Iggy shivers slightly in the cool, high-altitude winds, seeking the warmth of your pack."
    },
    "Hound": {
        "The Ashen Woods": "Loyal tracks unseen scents through the ash, occasionally letting out a soft bark.",
        "The Crimson Depths": "Loyal's tail wags tentatively as it explores the echoing caverns.",
        "The Starfall Crater": "Loyal stays close, a low growl rumbling in its chest, its hackles slightly raised.",
        "The Sunken Archives": "Loyal whines softly, its ears drooping at the sight of so much decay.",
        "The Sky-Temple Aerie": "Loyal barks joyfully at the open sky, chasing after drifting cloud-wisps."
    },
    "Sprite": {
        "The Ashen Woods": "Glimmer flits nervously, its light dimming amidst the oppressive soot.",
        "The Crimson Depths": "Glimmer darts between crystals, its own light adding to the subterranean glow.",
        "The Volcanic Wastes": "Glimmer zips high above the heated ground, a tiny spark against the fiery backdrop.",
        "The Starfall Crater": "Glimmer's light flickers erratically, disturbed by the crater's alien aura.",
        "The Sunken Archives": "Glimmer hovers over ancient texts, as if trying to read them with its faint light.",
        "The Sky-Temple Aerie": "Glimmer dances on the wind currents, a joyful speck of light among the clouds."
    }
};

/**
 * Companion-specific reactions to encountering different types of NPCs.
 */
const COMPANION_NPC_REACTION_DIALOGUE = {
    "Fox": {
        "LOST_SOUL": "Sparky whimpers and presses close to your leg, sensing the Lost Soul's sorrow.",
        "ECHO_LUMINA": "Sparky tilts its head, its gaze fixed on the shimmering Echo of a Lumina.",
        "HERMIT_RUNESMITH": "Sparky lets out a soft growl, wary of the Hermit's gruffness.",
        "ARCHIVIST_CONSTRUCT": "Sparky sniffs curiously at the construct, then sneezes at a puff of dust.",
        "SKY_SEER_ECHO": "Sparky looks upwards, as if trying to see what the Sky-Seer perceives in the winds."
    },
    "Raven": {
        "LOST_SOUL": "Corvus watches the Lost Soul with an unblinking, ancient gaze.",
        "ECHO_LUMINA": "Corvus caws softly, as if trying to communicate with the ethereal Lumina.",
        "HERMIT_RUNESMITH": "Corvus lets out a sharp caw, as if challenging the Hermit's demeanor.",
        "ARCHIVIST_CONSTRUCT": "Corvus pecks curiously at a loose wire on the Archivist Construct.",
        "SKY_SEER_ECHO": "Corvus seems to listen intently to the Sky-Seer, its head cocked."
    },
    "Salamander": {
        "HERMIT_RUNESMITH": "Iggy basks for a moment near the Hermit's surprisingly warm forge-stone.",
        "VOLCANIC_SHRINE_1": "Iggy seems to draw energy from the volcanic shrine, its colors brightening.",
        "SKY_SEER_ECHO": "Iggy curls up, seemingly unimpressed by the Sky-Seer's pronouncements."
    },
    "Hound": {
        "LOST_SOUL": "Loyal nudges the Lost Soul gently with its nose, offering silent comfort.",
        "ECHO_LUMINA": "Loyal sits patiently, observing the Lumina echo with a calm demeanor.",
        "ARCHIVIST_CONSTRUCT": "Loyal circles the construct warily, unsure what to make of it."
    },
    "Sprite": {
        "LOST_SOUL": "Glimmer's light dims in the presence of the Lost Soul's sadness.",
        "ECHO_LUMINA": "Glimmer circles the Lumina's form, its light pulsing in time with the echo's faint glow.",
        "ARCHIVIST_CONSTRUCT": "Glimmer darts around the Archivist Construct, leaving trails of faint light.",
        "SKY_SEER_ECHO": "Glimmer hovers near the Sky-Seer, as if drawn to the ancient, airy magic."
    }
};

/**
 * Random epitaphs for the grave markers ('+') found in the world.
 */
const EPITAPHS = [
    "Here lies a seeker of forgotten paths.", "They faced the shadows with courage.", "A silent watcher, now at rest.",
    "Their song unfinished, their journey done.", "Remembered only by the wind and dust.", "Dreamer of a brighter dawn.",
    "Fell chasing a whisper of hope.", "Guardian of a lost memory.", "Their name is lost, but their spirit lingers.",
    "Sought the First Song, found only silence.", "A traveler between worlds, now home."
];

/**
 * Definitions for Non-Player Characters, including their pool of dialogue lines.
 */
const NPCS = {
    "LOST_SOUL": {
        name: "Lost Soul",
        dialogue: [
            "So cold... so long since the Light...", "Did you see them? The shadows... they took everything...",
            "The Song... I almost remember the Song...", "Why did it fall? Why did we fall?",
            "Is this... another dream? Or the long nightmare's end?",
            "The rust... it claims everything, even memory."
        ]
    },
    "ECHO_LUMINA": {
        name: "Echo of a Lumina",
        dialogue: [
            "...the constellations weep...", "...the Weave is torn, the Anchors lost...",
            "Seek the resonance... the fragments of What Was...", "The Star-That-Devours... its hunger is eternal...",
            "Our citadels... now dust on the wind. Only memory remains.",
            "Did the Weavers foresee this? Or did their threads snap too soon?"
        ]
    },
    "HERMIT_RUNESMITH": {
        name: "Hermit Runesmith",
        dialogue: [
            "Hmph. Another wanderer. These Runes... they are not toys.", "Each symbol holds a world. Handle them with care... or not. What do I care?",
            "The Sky-Forges are cold, but their echoes remain in the deep places.", "The First Song... a fool's dream to remake it. Or perhaps... the only dream left.",
            "Don't bother me unless you've something truly ancient. Or shiny.",
            "Some say the Runes are but scars left by the First Song's breaking. Others, that they are its seeds."
        ]
    },
    "ARCHIVIST_CONSTRUCT": {
        name: "Archivist Construct",
        dialogue: [
            "Query? Data retrieval... compromised. Sector 7... flooded.", "The Great Unlearning... catastrophic data loss...",
            "Knowledge is the light that holds back the Void. We... failed to shield it.", "Fragments remain. Seek them. Understand.",
            "Error... memory banks corrupted... searching for... Prime Directive...",
            "The Archives were meant to last eons. Eons... are shorter than we calculated."
        ]
    },
    "SKY_SEER_ECHO": {
        name: "Sky-Seer's Echo",
        dialogue: [
            "The winds carry whispers from above... and below.", "Once, we danced among the stars. Now, only their dust remains.",
            "The Aerie remembers the First Song... listen closely to the silence between the gales.", "Beware the whispers from the Void... they promise power, but deliver only desolation.",
            "The highest peaks touch the memory of what was. And what might be again.",
            "Even the stars can die. We learned this... too late."
        ]
    }
};

/**
 * Definitions for all discoverable artifacts. Tomes and the Ancient Blade have special effects.
 */
const ARTIFACTS = [{
    key: "ART_LUMINA_LENS",
    name: "Cracked Lumina Lens",
    description: "Once used by Lumina Seers to gaze into the Weave of Fate. Its surface still shimmers with faint, unsettling patterns, hinting at futures best left unseen."
}, {
    key: "ART_RUNESMITHS_CHISEL",
    name: "Runesmith's Chisel Tip",
    description: "A fragment of a master Runesmith's tool. It hums with residual power, resonating faintly with any Runes you carry. It feels like it could shape more than just stone."
}, {
    key: "ART_PETRIFIED_SONGBIRD",
    name: "Petrified Songbird",
    description: "This tiny bird, frozen in a moment of song, is impossibly ancient. It's said such creatures carried notes of the First Song across the world."
}, {
    key: "ART_VOID_TAINTED_SEED",
    name: "Void-Tainted Seed",
    description: "A seed from the Starfall Crater, unnaturally cold to the touch. It pulses with a dark, alien vitality. What horrors might it grow into?"
}, {
    key: "ART_ARCHIVISTS_KEY",
    name: "Archivist's Data-Key",
    description: "A crystalline key from the Sunken Archives, its facets etched with complex Lumina script. It likely unlocked vast stores of knowledge, now lost to the depths."
}, {
    key: "ART_SILVER_LEAF_ASHEN",
    name: "Silver Leaf of Ashenwood",
    description: "A single, perfectly preserved silver leaf from the mythical sapling in the Ashen Woods. It radiates a gentle warmth, a tiny beacon of resilience."
}, {
    key: "ART_FROZEN_TEAR",
    name: "Frozen Tear of a Lumina",
    description: "This teardrop, solidified into a shimmering crystal, is said to have been shed by a Lumina watching their Sky-Citadel fall. It holds an echo of immense sorrow."
}, {
    key: "ART_LUMINA_SKY_SHARD",
    name: "Lumina Sky-Shard",
    description: "A fragment of a fallen Sky-Citadel, impossibly light and resonating with a faint celestial hum. It yearns for the open sky."
}, {
    key: "ART_RESONANT_WIND_CHIME",
    name: "Resonant Wind Chime",
    description: "Crafted from unknown alloys, this chime produces no audible sound, yet you feel its vibrations deep within your bones, like a forgotten melody."
}, {
    key: "ART_CELESTIAL_NAV_CHART",
    name: "Celestial Navigation Chart",
    description: "A tattered, metallic scroll depicting star patterns and energy currents unknown to modern understanding. It seems to map paths between worlds, or perhaps, between states of being."
}, {
    key: "ART_WEAVERS_THREAD",
    name: "Weaver's Thread",
    description: "An iridescent thread, stronger than any known material. It seems to shimmer with the raw potential of creation itself, a relic of the Weavers who predated even the Runesmiths."
}, {
    key: "ART_GUARDIAN_CORE_FRAGMENT",
    name: "Guardian Core Fragment",
    description: "The inert, crystalline core of a Lumina Guardian. It still pulses with a faint, rhythmic light, a ghost of its former power and purpose."
}, {
    key: "ART_SEAL_OF_A_CONSTELLATION",
    name: "Seal of a Lost Constellation",
    description: "A heavy, ornate seal bearing the emblem of a Lumina city-state whose name is lost to time. It speaks of forgotten allegiances and a structured, star-bound society."
}, {
    key: "ART_TOME_MIGHT",
    name: "Tome of Might",
    description: "This heavy, leather-bound book details forgotten martial disciplines. Reading it instills a surge of physical power. (Might +1)"
}, {
    key: "ART_TOME_WITS",
    name: "Tome of Cunning",
    description: "A slim volume filled with intricate diagrams and logical puzzles. Its study sharpens the mind. (Wits +1)"
}, {
    key: "ART_TOME_RESOLVE",
    name: "Tome of Resolve",
    description: "Bound in silver, this tome contains meditations and accounts of unwavering willpower. It fortifies the spirit. (Spirit +1)"
}, {
    key: "ART_RUNESMITHS_RESONATOR",
    name: "Runesmith's Resonator",
    description: "A curious device crafted by a Runesmith from a pristine crystal. It hums faintly, seeming to amplify the power of nearby Runes."
}, {
    key: "ART_ECHOING_CONCH",
    name: "Echoing Conch Shell",
    description: "Hold it to your ear, and you can almost hear the roar of oceans that dried up millennia ago, or perhaps, the faint strains of the First Song."
}, {
    key: "ART_STAR_METAL_INGOT",
    name: "Star-Metal Ingot",
    description: "Impossibly dense and cool to the touch, this ingot seems to have fallen from the heavens. It resonates with a strange, silent power."
}, {
    key: "ART_LUMINA_MOURNING_VEIL",
    name: "Lumina Mourning Veil",
    description: "A delicate, almost translucent fabric, embroidered with patterns of weeping stars. It carries an almost unbearable weight of sorrow."
}, {
    key: "ART_SEED_OF_THE_FIRST_TREE",
    name: "Seed of the First Tree",
    description: "A perfectly smooth, obsidian-black seed, warm to the touch. It feels ancient, potent, and full of a quiet, resilient life."
}, {
    key: "ART_VOID_SHACKLE_FRAGMENT",
    name: "Void-Shackle Fragment",
    description: "A piece of blackened, twisted metal that feels unnaturally cold. It emanates a sense of profound wrongness, a remnant of something designed to bind or corrupt."
}, {
    key: "ART_ANCIENT_BLADE",
    name: "Ancient Blade",
    description: "A weapon humming with a thirsty energy. It promises power, at a cost to your vitality. (+2 MGT, -5 Max HP)"
}, {
    key: "ART_HEARTSTONE",
    name: "Heartstone",
    description: "A smooth, warm stone left behind by a grateful creature. It feels... peaceful. (Spirit +1)"
}];

/**
 * Decision points that occur at the end of a zone, allowing path selection.
 */
const DECISIONS = {
    "END_OF_ASHEN_WOODS": {
        prompt: "The Ashen Woods give way to two paths. One descends into shimmering, crystalline caves. The other climbs towards a smoking peak. Where will your journey lead?",
        options: [{
            text: "Descend into the Caves",
            outcomeKey: "PATH_TO_CRIMSON_DEPTHS",
            nextZoneIndex: 1
        }, {
            text: "Ascend the Smoking Peak",
            outcomeKey: "PATH_TO_VOLCANIC_WASTES",
            nextZoneIndex: 2
        }],
        triggeredByZoneEnd: 0
    },
    "END_OF_CRIMSON_DEPTHS": {
        prompt: "The Crimson Depths open into a vast cavern. One path leads up towards a volcanic peak. Another descends into a chasm that glitters with an intense, pure light.",
        options: [{
            text: "Ascend to the Volcanic Wastes",
            outcomeKey: "PATH_TO_VOLCANIC_FROM_CRIMSON",
            nextZoneIndex: 2
        }, {
            text: "Descend into the Glimmering Depths",
            outcomeKey: "PATH_TO_GLIMMERING_DEPTHS",
            nextZoneIndex: 6
        }, {
            text: "End the journey here",
            outcomeKey: "JOURNEY_PAUSE_CRIMSON",
            nextZoneIndex: -1,
            leaveMessage: true
        }],
        triggeredByZoneEnd: 1
    },
    "END_OF_VOLCANIC_WASTES": {
        prompt: "The Volcanic Wastes end at a precipice. Below, a vast, unnatural crater glows with eerie light. Do you dare venture into the Starfall Crater, or is it time to reflect on your journey thus far?",
        options: [{
            text: "Enter the Starfall Crater",
            outcomeKey: "PATH_TO_STARFALL_CRATER",
            nextZoneIndex: 3
        }, {
            text: "The Journey Pauses Here",
            outcomeKey: "JOURNEY_PAUSE_VOLCANIC",
            nextZoneIndex: -1,
            leaveMessage: true
        }],
        triggeredByZoneEnd: 2
    },
    "END_OF_STARFALL_CRATER": {
        prompt: "Beyond the Starfall Crater, you sense a submerged path leading to ancient, waterlogged ruins. Alternatively, the biting winds call towards jagged mountain peaks where remnants of Sky-Temples are rumored to cling.",
        options: [{
            text: "Explore the Sunken Archives",
            outcomeKey: "PATH_TO_SUNKEN_ARCHIVES",
            nextZoneIndex: 4
        }, {
            text: "Ascend to the Sky-Temple Aerie",
            outcomeKey: "PATH_TO_SKY_TEMPLE",
            nextZoneIndex: 5
        }, ],
        triggeredByZoneEnd: 3
    },
    "END_OF_SUNKEN_ARCHIVES": {
        prompt: "From the Sunken Archives, two paths diverge. One leads upwards towards the howling winds of the Aerie. The other delves deeper, towards the crushing pressure and ghostly lights of a submerged metropolis.",
        options: [{
            text: "Ascend to the Sky-Temple Aerie",
            outcomeKey: "PATH_TO_SKY_TEMPLE_FROM_ARCHIVES",
            nextZoneIndex: 5
        }, {
            text: "Delve towards the Drowned City",
            outcomeKey: "PATH_TO_LYRA",
            nextZoneIndex: 7
        }, {
            text: "The Archives' Depths Suffice",
            outcomeKey: "JOURNEY_PAUSE_ARCHIVES",
            nextZoneIndex: -1,
            leaveMessage: true
        }],
        triggeredByZoneEnd: 4
    },
};

/**
 * The main array defining each zone's properties and layout of foreground elements.
 */
const ZONES = [{ // Zone 0
    name: "The Ashen Woods",
    width: 300, // Changed from 240
    backgroundChar: ".",
    midgroundChar: "t",
foregroundElements: {
    10: [{ lane: 2, char: 'T' }],
    15: [{ lane: 0, char: '~' }, { lane: 1, char: '~' }],
    20: [{ lane: 1, char: '+' }, { lane: 0, char: '~' }],
    25: [{ lane: 3, char: 'c' }],
    30: [{ lane: 2, char: 'B' }, { lane: 4, char: 'M' }],
    35: [{ lane: 0, char: 'L' }, { lane: 4, char: 'M' }],
    40: [{ lane: 2, char: '§' }], // Whispering Idol
    45: [{ lane: 4, char: 'T' }],
    50: [{ lane: 1, char: 'A' }],
    55: [{ lane: 2, char: 'F' }],
    60: [{ lane: 3, char: 'P' }],
    65: [{ lane: 4, char: '!' }],
    70: [{ lane: 2, char: 'E', enemyKey: "ASH_GNAWER" }, { lane: 4, char: '~' }, { lane: 0, char: 'F' }],
    75: [{ lane: 4, char: 'L' }],
    80: [{ lane: 0, char: 'T' }],
    85: [{ lane: 0, char: '~' }, { lane: 1, char: '=' }, { lane: 2, char: '~' }],
    90: [{ lane: 2, char: '#' }],
    95: [{ lane: 3, char: '+' }],
    100: [{ lane: 1, char: 'd' }, { lane: 4, char: 'F' }],
    105: [{ lane: 0, char: '0' }],
    110: [{ lane: 2, char: 'H' }],
    120: [{ lane: 0, char: 'L' }, { lane: 4, char: 'M' }],
    125: [{ lane: 4, char: 'M' }],
    130: [{ lane: 4, char: 'A' }],
    140: [{ lane: 2, char: 'N', npcType: "LOST_SOUL" }],
    145: [{ lane: 3, char: 'T' }],
    150: [{ lane: 1, char: '.' }, { lane: 0, char: 'F' }],
    160: [{ lane: 0, char: 'L' }, { lane: 4, char: '?' }],
    170: [{ lane: 2, char: 'E', enemyKey: "ASH_GNAWER" }],
    175: [{ lane: 1, char: '+' }],
    180: [{ lane: 3, char: 'T' }],
    190: [{ lane: 4, char: 'P' }],
    195: [{ lane: 2, char: '¥' }],
    200: [{ lane: 0, char: 'A' }],
    205: [{ lane: 1, char: '0' }],
    210: [{ lane: 3, char: 'c' }],
    220: [{ lane: 1, char: 'N', npcType: "LOST_SOUL" }],
    230: [{ lane: 4, char: 'L' }],
    // --- NEW CONTENT START ---
    240: [{ lane: 2, char: 'B' }],
    250: [{ lane: 0, char: 'L' }],
    260: [{ lane: 3, char: '.' }],
    270: [{ lane: 1, char: 'E', enemyKey: "ASH_GNAWER" }],
    280: [{ lane: 4, char: '+' }],
    290: [{ lane: 2, char: 'A' }]
    // --- NEW CONTENT END ---
},
    color: "#ff8c00",
    bgColor: "#5c1f00",
    entryLoreKey: "ASHEN_WOODS_INTRO",
    shrineLoreKey: "ASHEN_SHRINE_1"
}, { // Zone 1
    name: "The Crimson Depths",
    width: 290,
    backgroundChar: ":",
    midgroundChar: "*",
    foregroundElements: {
        15: [{ lane: 2, char: '♦' }],
        25: [{ lane: 0, char: '+' }],
        30: [{ lane: 4, char: '◊' }],
        35: [{ lane: 0, char: 'M' }, { lane: 1, char: 'M' }],
        40: [{ lane: 1, char: 'L' }, { lane: 0, char: 'M' }],
        50: [{ lane: 3, char: 'A' }],
        60: [{ lane: 2, char: '#' }],
        70: [{ lane: 0, char: 'E', enemyKey: "ASH_GNAWER" }],
        80: [{ lane: 4, char: 'N', npcType: "HERMIT_RUNESMITH" }],
        90: [{ lane: 2, char: 'Φ' }],
        100: [{ lane: 3, char: 'L' }],
        110: [{ lane: 1, char: '+' }],
        115: [{ lane: 4, char: '0' }],
        120: [{ lane: 2, char: '.' }],
        130: [{ lane: 0, char: '✧' }],
        140: [{ lane: 4, char: 'A' }],
        150: [{ lane: 2, char: 'P' }],
        160: [{ lane: 1, char: 'L' }],
        170: [{ lane: 3, char: '#' }],
        180: [{ lane: 0, char: '◊' }],
        190: [{ lane: 2, char: 'N', npcType: "LOST_SOUL" }],
        200: [{ lane: 4, char: '✧' }],
        210: [{ lane: 1, char: 'E', enemyKey: "RUSTED_CONSTRUCT" }],
        220: [{ lane: 2, char: 'Δ' }],
        230: [{ lane: 3, char: 'H' }],
        240: [{ lane: 0, char: 'A' }],
        250: [{ lane: 4, char: 'L' }],
        260: [{ lane: 2, char: 'B' }],
        270: [{ lane: 1, char: 'L' }],
        280: [{ lane: 3, char: 'P' }]
    },
    color: "#ff007f",
    bgColor: "#3b003b",
    entryLoreKey: "CRIMSON_DEPTHS_INTRO",
    shrineLoreKey: "CRIMSON_SHRINE_1"
}, { // Zone 2
    name: "The Volcanic Wastes",
    width: 400, // Changed from 340
    backgroundChar: "`",
    midgroundChar: "^",
foregroundElements: {
    20: [{ lane: 2, char: ']' }],
    30: [{ lane: 0, char: 's' }],
    40: [{ lane: 4, char: 'A' }],
    45: [{ lane: 0, char: 'M' }, { lane: 1, char: 'M' }],
    50: [{ lane: 1, char: 'L' }, { lane: 0, char: 'M' }],
    55: [{ lane: 3, char: '0' }],
    60: [{ lane: 3, char: '[' }],
    70: [{ lane: 2, char: '#' }],
    80: [{ lane: 0, char: '+' }],
    90: [{ lane: 4, char: '.' }],
    100: [{ lane: 2, char: 'N', npcType: "HERMIT_RUNESMITH" }],
    110: [{ lane: 1, char: 's' }],
    120: [{ lane: 3, char: '§' }],
    130: [{ lane: 0, char: 'A' }],
    140: [{ lane: 2, char: 'P' }],
    150: [{ lane: 4, char: ']' }],
    160: [{ lane: 1, char: 'L' }],
    170: [{ lane: 2, char: 'H' }],
    180: [{ lane: 0, char: '#' }],
    190: [{ lane: 3, char: 's' }],
    200: [{ lane: 4, char: '[' }],
    210: [{ lane: 1, char: '+' }],
    220: [{ lane: 2, char: 'A' }],
    230: [{ lane: 0, char: '¦' }],
    240: [{ lane: 3, char: 'L' }],
    250: [{ lane: 2, char: 'Φ' }],
    260: [{ lane: 4, char: 'L' }],
    270: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }],
    280: [{ lane: 0, char: 's' }],
    290: [{ lane: 2, char: 'L' }],
    300: [{ lane: 3, char: '+' }],
    310: [{ lane: 4, char: 'A' }],
    320: [{ lane: 1, char: 'P' }],
    330: [{ lane: 2, char: 'L' }],
    // --- NEW CONTENT START ---
    340: [{ lane: 1, char: 'E', enemyKey: "RUSTED_CONSTRUCT" }],
    350: [{ lane: 3, char: 'L' }],
    360: [{ lane: 2, char: '¤' }], // The Dormant Forge
    370: [{ lane: 0, char: 'L' }],
    380: [{ lane: 4, char: 'E', enemyKey: "ASH_GNAWER" }],
    390: [{ lane: 2, char: 'N', npcType: "HERMIT_RUNESMITH" }]
    // --- NEW CONTENT END ---
},
    color: "#ff4500",
    bgColor: "#2b0f0f",
    entryLoreKey: "VOLCANIC_WASTES_INTRO",
    shrineLoreKey: "VOLCANIC_SHRINE_1"
}, { // Zone 3
    name: "The Starfall Crater",
    width: 370,
    backgroundChar: "'",
    midgroundChar: "%",
    foregroundElements: {
        10: [{ lane: 2, char: 'X' }],
        15: [{ lane: 0, char: 'M' }, { lane: 4, char: 'M' }],
        20: [{ lane: 0, char: 'E', enemyKey: "VOID_TENDRIL" }, { lane: 4, char: 'M' }],
        25: [{ lane: 2, char: '0' }],
        30: [{ lane: 4, char: 'V' }],
        40: [{ lane: 1, char: 'A' }],
        50: [{ lane: 3, char: '+' }],
        60: [{ lane: 2, char: '.' }],
        70: [{ lane: 0, char: 'E', enemyKey: "VOID_TENDRIL" }],
        80: [{ lane: 4, char: '#' }],
        90: [{ lane: 1, char: 'V' }],
        100: [{ lane: 3, char: 'N', npcType: "ECHO_LUMINA" }],
        110: [{ lane: 2, char: 'X' }],
        120: [{ lane: 0, char: 'P' }],
        130: [{ lane: 4, char: 'E', enemyKey: "VOID_TENDRIL" }],
        140: [{ lane: 1, char: 'A' }],
        150: [{ lane: 2, char: 'L' }],
        160: [{ lane: 3, char: 'X' }],
        170: [{ lane: 2, char: 'H' }],
        180: [{ lane: 0, char: '+' }],
        190: [{ lane: 4, char: 'E', enemyKey: "VOID_TENDRIL" }],
        200: [{ lane: 1, char: 'V' }],
        210: [{ lane: 3, char: 'L' }],
        220: [{ lane: 2, char: 'A' }],
        230: [{ lane: 0, char: '#' }],
        240: [{ lane: 4, char: 'E', enemyKey: "VOID_TENDRIL" }],
        250: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }],
        260: [{ lane: 2, char: 'L' }],
        270: [{ lane: 3, char: 'X' }],
        280: [{ lane: 0, char: '+' }],
        290: [{ lane: 4, char: 'A' }],
        300: [{ lane: 1, char: 'V' }],
        310: [{ lane: 2, char: 'L' }],
        320: [{ lane: 3, char: 'X' }],
        330: [{ lane: 0, char: 'E', enemyKey: "VOID_TENDRIL" }],
        340: [{ lane: 4, char: 'V' }],
        350: [{ lane: 1, char: 'P' }],
        360: [{ lane: 2, char: 'L' }]
    },
    color: "#9370db",
    bgColor: "#100020",
    entryLoreKey: "STARFALL_CRATER_INTRO",
    shrineLoreKey: "STARFALL_SHRINE_1"
}, { // Zone 4
    name: "The Sunken Archives",
    width: 400,
    backgroundChar: "~",
    midgroundChar: "c",
    foregroundElements: {
        5: [{ lane: 0, char: '~' }, { lane: 1, char: '~' }, { lane: 3, char: '~' }, { lane: 4, char: '~' }],
        10: [{ lane: 2, char: 'S' }, { lane: 0, char: '~' }, { lane: 1, char: '~' }, { lane: 3, char: '~' }, { lane: 4, char: '~' }],
        15: [{ lane: 2, char: '=' }],
        20: [{ lane: 0, char: 'b' }],
        25: [{ lane: 1, char: '0' }],
        30: [{ lane: 4, char: '+' }],
        40: [{ lane: 1, char: 'A' }],
        50: [{ lane: 3, char: 'D' }],
        60: [{ lane: 2, char: '#' }],
        70: [{ lane: 0, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        80: [{ lane: 4, char: 'S' }],
        90: [{ lane: 1, char: 'b' }],
        100: [{ lane: 3, char: 'L' }],
        110: [{ lane: 2, char: 'P' }],
        120: [{ lane: 0, char: 'D' }],
        130: [{ lane: 4, char: 'A' }],
        140: [{ lane: 1, char: 'S' }],
        150: [{ lane: 3, char: 'b' }],
        160: [{ lane: 2, char: 'L' }],
        170: [{ lane: 0, char: '#' }],
        180: [{ lane: 4, char: 'N', npcType: "ECHO_LUMINA" }],
        190: [{ lane: 1, char: 'D' }],
        200: [{ lane: 3, char: 'S' }],
        210: [{ lane: 2, char: 'H' }],
        220: [{ lane: 0, char: 'A' }],
        230: [{ lane: 4, char: '+' }],
        240: [{ lane: 1, char: 'L' }],
        250: [{ lane: 3, char: 'D' }],
        260: [{ lane: 2, char: '#' }],
        270: [{ lane: 0, char: 'P' }],
        280: [{ lane: 4, char: 'S' }],
        290: [{ lane: 1, char: 'b' }],
        300: [{ lane: 3, char: 'A' }],
        310: [{ lane: 2, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        320: [{ lane: 0, char: 'D' }],
        330: [{ lane: 4, char: '+' }],
        340: [{ lane: 1, char: 'S' }],
        350: [{ lane: 3, char: 'b' }],
        360: [{ lane: 2, char: 'L' }],
        370: [{ lane: 0, char: 'L' }],
        380: [{ lane: 4, char: 'A' }],
        390: [{ lane: 2, char: 'N', npcType: "ECHO_LUMINA" }]
    },
    color: "#20b2aa",
    bgColor: "#003333",
    entryLoreKey: "SUNKEN_ARCHIVES_INTRO",
    shrineLoreKey: "SUNKEN_ARCHIVES_SHRINE_1"
}, { // Zone 5
    name: "The Sky-Temple Aerie",
    width: 420,
    backgroundChar: " ",
    midgroundChar: "C",
    foregroundElements: {
        10: [{ lane: 2, char: 'R' }],
        20: [{ lane: 0, char: '^' }],
        30: [{ lane: 4, char: '^' }],
        40: [{ lane: 1, char: 'A' }],
        50: [{ lane: 3, char: 'w' }],
        60: [{ lane: 2, char: '#' }],
        70: [{ lane: 0, char: 'N', npcType: "SKY_SEER_ECHO" }],
        80: [{ lane: 4, char: 'R' }],
        90: [{ lane: 1, char: 'G' }],
        100: [{ lane: 3, char: 'L' }],
        110: [{ lane: 2, char: 'P' }],
        120: [{ lane: 0, char: 'w' }],
        130: [{ lane: 4, char: 'A' }],
        140: [{ lane: 1, char: 'R' }],
        150: [{ lane: 3, char: 'G' }],
        160: [{ lane: 2, char: 'L' }],
        170: [{ lane: 0, char: '#' }],
        180: [{ lane: 4, char: 'N', npcType: "ECHO_LUMINA" }],
        190: [{ lane: 1, char: 'w' }],
        200: [{ lane: 3, char: 'R' }],
        210: [{ lane: 2, char: 'H' }],
        220: [{ lane: 0, char: 'A' }],
        230: [{ lane: 4, char: '+' }],
        240: [{ lane: 1, char: 'L' }],
        250: [{ lane: 3, char: 'G' }],
        260: [{ lane: 2, char: '#' }],
        270: [{ lane: 0, char: 'P' }],
        280: [{ lane: 4, char: 'R' }],
        290: [{ lane: 1, char: 'w' }],
        300: [{ lane: 3, char: 'A' }],
        310: [{ lane: 2, char: 'N', npcType: "SKY_SEER_ECHO" }],
        320: [{ lane: 0, char: 'G' }],
        330: [{ lane: 4, char: '+' }],
        340: [{ lane: 1, char: 'R' }],
        350: [{ lane: 3, char: 'w' }],
        360: [{ lane: 2, char: 'L' }],
        370: [{ lane: 0, char: 'L' }],
        380: [{ lane: 4, char: 'A' }],
        390: [{ lane: 2, char: 'N', npcType: "ECHO_LUMINA" }],
        400: [{ lane: 1, char: 'G' }],
        410: [{ lane: 3, char: 'w' }],
        415: [{ lane: 2, char: 'O' }]
    },
    color: "#add8e6",
    bgColor: "#4682b420",
    entryLoreKey: "SKY_TEMPLE_AERIE_INTRO",
    shrineLoreKey: "SKY_TEMPLE_AERIE_SHRINE_1"
}, { // Zone 6
    name: "The Glimmering Depths",
    width: 300,
    backgroundChar: "'",
    midgroundChar: "✧",
    foregroundElements: {
        10: [{ lane: 2, char: '♦' }],
        20: [{ lane: 0, char: '◊' }],
        30: [{ lane: 4, char: '♦' }],
        40: [{ lane: 1, char: 'A' }],
        50: [{ lane: 3, char: '#' }],
        60: [{ lane: 2, char: 'E', enemyKey: "CRYSTAL_LURKER" }],
        70: [{ lane: 0, char: 'N', npcType: "ECHO_LUMINA" }],
        80: [{ lane: 4, char: '♦' }],
        90: [{ lane: 1, char: 'L' }],
        100: [{ lane: 3, char: 'P' }],
        110: [{ lane: 2, char: '◊' }],
        120: [{ lane: 0, char: 'E', enemyKey: "CRYSTAL_LURKER" }],
        130: [{ lane: 4, char: 'A' }],
        140: [{ lane: 1, char: '♦' }],
        150: [{ lane: 3, char: 'L' }],
        160: [{ lane: 2, char: '#' }],
        170: [{ lane: 0, char: '◊' }],
        180: [{ lane: 4, char: 'E', enemyKey: "CRYSTAL_LURKER" }],
        190: [{ lane: 1, char: 'P' }],
        200: [{ lane: 3, char: '♦' }],
        210: [{ lane: 2, char: 'H' }],
        220: [{ lane: 0, char: 'A' }],
        230: [{ lane: 4, char: '◊' }],
        240: [{ lane: 1, char: 'L' }],
        250: [{ lane: 3, char: 'E', enemyKey: "CRYSTAL_LURKER" }],
        260: [{ lane: 2, char: '#' }],
        270: [{ lane: 0, char: 'P' }],
        280: [{ lane: 4, char: '♦' }],
        290: [{ lane: 1, char: 'L' }]
    },
    color: "#40e0d0",
    bgColor: "#003333",
    entryLoreKey: "GLIMMERING_DEPTHS_INTRO",
    shrineLoreKey: "GLIMMERING_SHRINE_1"
}, { // Zone 7
    name: "The Drowned City of Lyra",
    width: 450,
    backgroundChar: "≈",
    midgroundChar: "s",
    foregroundElements: {
        10: [{ lane: 0, char: '~' }, { lane: 1, char: '~' }, { lane: 3, char: '~' }, { lane: 4, char: '~' }],
        20: [{ lane: 2, char: 'S' }],
        30: [{ lane: 1, char: 'D' }, { lane: 4, char: '+' }],
        40: [{ lane: 3, char: '#' }],
        50: [{ lane: 4, char: 'E', enemyKey: "RUSTED_SENTINEL" }],
        60: [{ lane: 0, char: 'L' }],
        70: [{ lane: 2, char: 'R' }],
        80: [{ lane: 1, char: 'A' }],
        90: [{ lane: 3, char: '?' }], // ADDED
        100: [{ lane: 3, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        110: [{ lane: 0, char: 'L' }], // ADDED
        120: [{ lane: 0, char: 'E', enemyKey: "RUSTED_SENTINEL" }],
        130: [{ lane: 2, char: '!' }], // ADDED
        140: [{ lane: 4, char: 'D' }],
        150: [{ lane: 1, char: 'N', npcType: "ECHO_LUMINA" }], // ADDED
        160: [{ lane: 2, char: 'S' }],
        180: [{ lane: 1, char: 'L' }, { lane: 4, char: 'A' }], // ADDED Artifact
        200: [{ lane: 3, char: '#' }],
        210: [{ lane: 0, char: '+' }], // ADDED
        220: [{ lane: 0, char: 'R' }],
        240: [{ lane: 4, char: 'E', enemyKey: "RUSTED_SENTINEL" }],
        260: [{ lane: 2, char: 'H' }],
        280: [{ lane: 1, char: 'A' }],
        300: [{ lane: 3, char: 'S' }, { lane: 0, char: 'B' }], // ADDED
        320: [{ lane: 0, char: 'L' }],
        340: [{ lane: 4, char: 'D' }],
        350: [{ lane: 1, char: 'L' }], // ADDED
        360: [{ lane: 2, char: 'E', enemyKey: "RUSTED_SENTINEL" }],
        380: [{ lane: 0, char: 'N', npcType: "ECHO_LUMINA" }],
        400: [{ lane: 1, char: 'A' }],
        420: [{ lane: 3, char: 'R' }],
        440: [{ lane: 2, char: 'P' }]
},
    color: "#1d7874",
    bgColor: "#0b3937",
    entryLoreKey: "DROWNED_CITY_LYRA_INTRO",
    shrineLoreKey: "LYRA_SHRINE_1"
}];
// =============================================================================
// │ DOM ELEMENT REFERENCES                                                    │
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

// =============================================================================
// │ GAME LOGIC & MECHANICS                                                      │
// =============================================================================

/** Returns the zone object for the player's current location. */
function getCurrentZone() {
    return ZONES[gameState.currentZoneIndex];
}

/** Placeholder for upgrading exploration speed. */
function attemptUpgradeSpeed() {
    const upgradeCost = 50 * gameState.explorationSpeedMultiplier;
    if (gameState.resources.glimmeringDust >= upgradeCost) {
        gameState.resources.glimmeringDust -= upgradeCost;
        gameState.explorationSpeedMultiplier += 0.1;
        updateGameTickSpeed();
        addLogMessage(`Exploration speed upgraded to ${gameState.explorationSpeedMultiplier.toFixed(1)}x!`, "synergy");
        renderStats(); // Update the button cost display
    } else {
        addLogMessage("Not enough Glimmering Dust to upgrade speed.", "puzzle-fail");
    }
}

/** Pauses the game and displays a custom UI for the player to enter their name. */
function presentNameChoice() {
    pauseGameForDecision(true); // Pause the game loop

    decisionPromptText.textContent = "An echo on the wind seems to ask for your name...";
    decisionButtonsContainer.innerHTML = ''; // Clear out any old buttons

    // Create the text input field
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'playerNameInput'; // Give it an ID so we can easily find it
    nameInput.placeholder = 'Wanderer';
    nameInput.maxLength = MAX_NAME_LENGTH;

    // Create the confirm button
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.classList.add('name-confirm-button');

    // When the button is clicked, resolve the choice
    confirmButton.onclick = () => {
        const chosenName = nameInput.value;
        resolveNameChoice(chosenName);
    };

    // Also allow the player to press 'Enter' to confirm
    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const chosenName = nameInput.value;
            resolveNameChoice(chosenName);
        }
    });

    // Add the new elements to the screen and display them
    decisionButtonsContainer.appendChild(nameInput);
    decisionButtonsContainer.appendChild(confirmButton);
    decisionArea.style.display = 'block';
    updateUIAccentColors();
    nameInput.focus(); // Automatically focus the input field for the player
}

/**
 * Processes the name entered by the player, updates the game state, and resumes the game.
 * @param {string} chosenName - The name retrieved from the input field.
 */
function resolveNameChoice(chosenName) {
    // Sanitize the input by removing any extra whitespace from the ends
    const finalName = chosenName.trim();

    // Only update the name if the player actually entered something
    if (finalName && finalName.length > 0) {
        gameState.playerName = finalName;
        addLogMessage(`The echoes whisper back your name: ${gameState.playerName}.`, "name-choice");
    } else {
        addLogMessage(`You remain the silent Wanderer.`, "name-choice");
    }

    // Hide the UI and resume the game
    decisionArea.style.display = 'none';
    gameState.activeDecision = null;
    pauseGameForDecision(false);

    renderAll(); // Redraw the UI to show the new name in the stats panel
}

/** Pauses the game and presents the player with the choice of a class. */
function presentClassChoice() {
    pauseGameForDecision(true); // Pause the main game loop

    decisionPromptText.textContent = "A moment of clarity offers a choice of path...";
    decisionButtonsContainer.innerHTML = ''; // Clear any previous buttons

    // Loop through our defined classes and create a button for each one
    Object.values(PLAYER_CLASSES).forEach(playerClass => {
        const button = document.createElement('button');
        
        // Use innerHTML to create a nice title and description on the button
        button.innerHTML = `<strong>${playerClass.name}</strong><br><small>${playerClass.description}</small>`;
        button.title = playerClass.description; // Add a hover tooltip

        // When a class button is clicked, call our new helper function
        button.onclick = () => resolveClassChoice(playerClass.key);

        decisionButtonsContainer.appendChild(button);
    });

    decisionArea.style.display = 'block'; // Show the decision UI
    updateUIAccentColors(); // Make sure the new buttons match the zone's theme
}

/**
 * Applies the chosen class, provides feedback to the player, and resumes the game.
 * @param {string} classKey - The key of the class chosen (e.g., "STALWART").
 */
function resolveClassChoice(classKey) {
    const chosenClass = PLAYER_CLASSES[classKey];
    if (!chosenClass) {
        console.error("Invalid class key chosen:", classKey);
        pauseGameForDecision(false); // Resume game even if there's an error
        return;
    }

    // 1. Update the Game State
    gameState.playerClass = chosenClass.name;
    addLogMessage(`You have chosen the path of the ${chosenClass.name}.`, "class-choice");

    // 2. Apply the specific class bonus
    switch (classKey) {
        case 'STALWART':
            addLogMessage("Your body feels more resilient, ready for the hardships ahead.", "synergy");
            // The +5 HP is already handled in your calculateMaxHp() function.
            // We just need to recalculate it and heal the player as a reward.
            gameState.maxHp = calculateMaxHp();
            gameState.currentHp = gameState.maxHp;
            break;

        case 'ERUDITE':
            addLogMessage("Your mind feels sharper, ready to glean secrets from this broken world.", "synergy");
            // The +5% XP bonus is already handled in your awardXP() function.
            // No immediate stat change is needed here.
            break;

        case 'WANDERER':
            addLogMessage("You feel a quiet confidence, ready to face whatever comes.", "synergy");
            // The Wanderer receives no special mechanical bonus.
            break;
    }

    // 3. Hide the UI and resume the game
    decisionArea.style.display = 'none';
    gameState.activeDecision = null;
    pauseGameForDecision(false); // Unpause and restart the game loop

    renderAll(); // Redraw the UI to reflect changes (like the Stalwart's new HP)
}

/**
 * Displays a pop-up for the player to name their newly found companion.
 * @param {object} companionData - The data object for the found companion.
 */
function presentCompanionNaming(companionData) {
    pauseGameForDecision(true);

    decisionPromptText.textContent = `A shimmering presence coalesces into a friendly ${companionData.type}! It seems to want to follow you. What will you name it?`;
    decisionButtonsContainer.innerHTML = '';

    // Create the text input field
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'companionNameInput'; // Use a unique ID
    nameInput.placeholder = companionData.name; // Show the default name as a placeholder
    nameInput.maxLength = MAX_NAME_LENGTH;

    // Create the confirm button
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.classList.add('name-confirm-button');

    // Helper function to resolve the choice
    const submitCompanionName = () => {
        const chosenName = nameInput.value;
        resolveCompanionName(companionData, chosenName);
    };

/**
 * Opens the stat upgrade menu, calculating and displaying the costs.
 */
function presentUpgradeMenu() {
    pauseGameForDecision(true);
    const effectiveStats = getEffectiveStats();

    decisionPromptText.textContent = "You focus your mind, contemplating the path forward. Ancient Scraps can unlock your potential.";
    decisionButtonsContainer.innerHTML = '';

    // An array to hold our stat choices
    const statsToUpgrade = ['might', 'wits', 'spirit'];

    statsToUpgrade.forEach(stat => {
        // --- COST CALCULATION ---
        // The cost increases for each point you've already bought.
        const baseCost = 5;
        const currentStatPoints = gameState.stats[stat] - BASE_STAT_VALUE;
        const cost = baseCost * (currentStatPoints + 1);

        const button = document.createElement('button');
        button.innerHTML = `Improve ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${gameState.stats[stat]}) <br><small>Cost: ${cost} Scraps</small>`;

        // Disable the button if the player can't afford it
        if (gameState.resources.ancientScraps < cost) {
            button.disabled = true;
            button.title = "Not enough Ancient Scraps.";
        }

        button.onclick = () => resolveStatUpgrade(stat, cost);
        decisionButtonsContainer.appendChild(button);
    });
    
    // Add a button to close the menu
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

/**
 * Handles the logic of purchasing a stat upgrade.
 * @param {string} statToUpgrade - 'might', 'wits', or 'spirit'.
 * @param {number} cost - The pre-calculated cost of the upgrade.
 */
function resolveStatUpgrade(statToUpgrade, cost) {
    if (gameState.resources.ancientScraps >= cost) {
        // Deduct cost and increase the stat
        gameState.resources.ancientScraps -= cost;
        gameState.stats[statToUpgrade]++;

        // If we upgraded Might, we need to recalculate our HP
        if (statToUpgrade === 'might') {
            const oldMaxHp = gameState.maxHp;
            gameState.maxHp = calculateMaxHp();
            const hpGain = gameState.maxHp - oldMaxHp;
            gameState.currentHp += hpGain; // Also grant the new HP
        }
        
        addLogMessage(`Your ${statToUpgrade} has increased!`, "synergy");

        // Refresh the menu to show new costs and updated stat values
        presentUpgradeMenu(); 
        renderAll(); // Update the main stats panel in the background

    } else {
        addLogMessage("You lack the resources for this.", "puzzle-fail");
    }
}

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

/**
 * Opens the rune attunement menu, showing collected runes and their active status.
 */
function presentRuneMenu() {
    pauseGameForDecision(true);

    const promptText = `Attune up to ${gameState.maxActiveRunes} Runes. Attuned runes are marked with [*].`;
    decisionPromptText.textContent = promptText;
    decisionButtonsContainer.innerHTML = '';

    if (gameState.runes.length === 0) {
        decisionButtonsContainer.innerHTML = '<p>You have not yet found any runes.</p>';
    } else {
        // Create a button for each rune the player has collected
        gameState.runes.forEach(runeSymbol => {
            const runeDetails = RUNE_DEFINITIONS[runeSymbol];
            if (!runeDetails) return;

            const button = document.createElement('button');
            const isActive = gameState.activeRunes.includes(runeSymbol);
            
            // Add a star marker if the rune is currently active
            const activeMarker = isActive ? "[*] " : "";

            button.innerHTML = `${activeMarker}<strong>${runeDetails.name} (${runeSymbol})</strong><br><small>${runeDetails.description}</small>`;
            button.onclick = () => resolveRuneSelection(runeSymbol);
            decisionButtonsContainer.appendChild(button);
        });
    }

    // Add a button to close the menu
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

/**
 * Handles the logic for activating or deactivating a rune.
 * @param {string} runeSymbol - The symbol of the rune being toggled, e.g., 'Φ'.
 */
function resolveRuneSelection(runeSymbol) {
    const activeIndex = gameState.activeRunes.indexOf(runeSymbol);

    if (activeIndex > -1) {
        // If the rune is already active, deactivate it (remove it from the array)
        gameState.activeRunes.splice(activeIndex, 1);
        addLogMessage(`${RUNE_DEFINITIONS[runeSymbol].name} fades to silence.`, "decision");
    } else {
        // If the rune is not active, try to activate it
        if (gameState.activeRunes.length < gameState.maxActiveRunes) {
            gameState.activeRunes.push(runeSymbol);
            addLogMessage(`You feel the power of the ${RUNE_DEFINITIONS[runeSymbol].name}!`, "synergy");
        } else {
            addLogMessage(`You can only attune ${gameState.maxActiveRunes} runes at a time.`, "puzzle-fail");
        }
    }

    // After making a change, refresh the menu to show the updated status
    presentRuneMenu();
    renderAll();
}

/**
 * Finalizes the companion acquisition after the player has chosen a name.
 * @param {object} companionData - The original data for the companion.
 * @param {string} chosenName - The name entered by the player.
 */
function resolveCompanionName(companionData, chosenName) {
    const finalName = chosenName.trim();

    // Use the player's name, or the default if they left it blank
    const name = (finalName && finalName.length > 0) ? finalName : companionData.name;

    // Now, officially create the companion object and add it to the game state
    gameState.companion = {
        ...companionData, // Copy all original data (type, call, etc.)
        name: name        // Set the final name
    };

    addLogMessage(`You have a new companion: ${gameState.companion.name} the ${gameState.companion.type}!`, "companion");
    playSound('companionFind');
    awardXP(30);

    // Hide the UI and resume the game
    decisionArea.style.display = 'none';
    gameState.activeDecision = null;
    pauseGameForDecision(false);
    renderAll(); // Update the UI to show the new companion
}

/** Populates and displays the artifact viewer modal. */
function showArtifactViewer() {
    // Clear any previous list items
    artifactList.innerHTML = '';

    if (gameState.collectedArtifacts.length === 0) {
        artifactList.innerHTML = '<p>No artifacts collected yet.</p>';
    } else {
        // Loop through the keys of collected artifacts
        gameState.collectedArtifacts.forEach(key => {
            // Find the full artifact object from our ARTIFACTS constant
            const artifact = ARTIFACTS.find(art => art.key === key);
            if (artifact) {
                // Create the HTML elements for this entry
                const entryDiv = document.createElement('div');
                entryDiv.className = 'artifact-entry';

                const nameElement = document.createElement('strong');
                nameElement.textContent = artifact.name;

                const descElement = document.createElement('p');
                descElement.textContent = artifact.description;

                // Add the name and description to the entry, then add the entry to the list
                entryDiv.appendChild(nameElement);
                entryDiv.appendChild(descElement);
                artifactList.appendChild(entryDiv);
            }
        });
    }

    // Pause the game and show the modal
    pauseGameForDecision(true);
    artifactModalBackdrop.style.display = 'flex';
}

/** Hides the artifact viewer modal. */
function hideArtifactViewer() {
    artifactModalBackdrop.style.display = 'none';
    pauseGameForDecision(false); // Unpause the game
}

/**
 * Opens the stat upgrade menu, calculating and displaying the costs.
 */
function presentUpgradeMenu() {
    pauseGameForDecision(true);
    const effectiveStats = getEffectiveStats();

    decisionPromptText.textContent = "You focus your mind, contemplating the path forward. Ancient Scraps can unlock your potential.";
    decisionButtonsContainer.innerHTML = '';

    // An array to hold our stat choices
    const statsToUpgrade = ['might', 'wits', 'spirit'];

    statsToUpgrade.forEach(stat => {
        // --- COST CALCULATION ---
        // The cost increases for each point you've already bought.
        const baseCost = 5;
        const currentStatPoints = gameState.stats[stat] - BASE_STAT_VALUE;
        const cost = baseCost * (currentStatPoints + 1);

        const button = document.createElement('button');
        button.innerHTML = `Improve ${stat.charAt(0).toUpperCase() + stat.slice(1)} (${gameState.stats[stat]}) <br><small>Cost: ${cost} Scraps</small>`;

        // Disable the button if the player can't afford it
        if (gameState.resources.ancientScraps < cost) {
            button.disabled = true;
            button.title = "Not enough Ancient Scraps.";
        }

        button.onclick = () => resolveStatUpgrade(stat, cost);
        decisionButtonsContainer.appendChild(button);
    });
    
    // Add a button to close the menu
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

/**
 * Handles the logic of purchasing a stat upgrade.
 * @param {string} statToUpgrade - 'might', 'wits', or 'spirit'.
 * @param {number} cost - The pre-calculated cost of the upgrade.
 */
function resolveStatUpgrade(statToUpgrade, cost) {
    if (gameState.resources.ancientScraps >= cost) {
        // Deduct cost and increase the stat
        gameState.resources.ancientScraps -= cost;
        gameState.stats[statToUpgrade]++;

        // If we upgraded Might, we need to recalculate our HP
        if (statToUpgrade === 'might') {
            const oldMaxHp = gameState.maxHp;
            gameState.maxHp = calculateMaxHp();
            const hpGain = gameState.maxHp - oldMaxHp;
            gameState.currentHp += hpGain; // Also grant the new HP
        }
        
        addLogMessage(`Your ${statToUpgrade} has increased!`, "synergy");

        // Refresh the menu to show new costs and updated stat values
        presentUpgradeMenu(); 
        renderAll(); // Update the main stats panel in the background

    } else {
        addLogMessage("You lack the resources for this.", "puzzle-fail");
    }
}

/** After awakening the forge, this presents the player with an offering choice. */
function presentForgeOfferingChoice() {
    let prompt = "The awakened forge craves a catalyst. What will you offer to its ancient heart?";
    let options = [{ text: "Offer nothing more", outcome: "NOTHING" }];

    // Check if the player has Void Essence
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

/**
 * Saves the entire gameState object to the browser's localStorage.
 */
function saveGame() {
    if (gameState.inCombat) {
        addLogMessage("Cannot save during combat.", "puzzle-fail");
        return;
    }
    try {
        // Convert the gameState object into a JSON string
        const saveState = JSON.stringify(gameState);
        // Save the string to localStorage under a specific key
        localStorage.setItem('realmsOfRuneAndRust_savegame', saveState);
        addLogMessage("Game Saved.", "synergy");
    } catch (e) {
        console.error("Error saving game:", e);
        addLogMessage("Could not save the game. The echoes are weak.", "puzzle-fail");
    }
}

/**
 * Loads the gameState from localStorage if a save file exists.
 * @returns {boolean} - True if a game was loaded, false otherwise.
 */
function loadGame() {
    try {
        const savedState = localStorage.getItem('realmsOfRuneAndRust_savegame');

        if (savedState) {
            // If a save exists, parse the JSON string back into an object
            const loadedState = JSON.parse(savedState);
            // Overwrite the current gameState with the loaded one
            gameState = loadedState;
            addLogMessage("Saved journey restored.", "synergy");
            return true;
        }
    } catch (e) {
        console.error("Error loading game:", e);
        addLogMessage("The saved journey is corrupted and could not be restored.", "puzzle-fail");
        localStorage.removeItem('realmsOfRuneAndRust_savegame'); // Clear the bad save
    }
    return false; // No save file found or an error occurred
}

/** Placeholder for starting a new game. */
function resetGame(isTranscending = false) {
    if (confirm("Start a new journey? Your current progress will be lost.")) {
        if (!isTranscending) {
            // Clear legacy stats if it's a normal reset
             try {
                localStorage.removeItem(LEGACY_MIGHT_KEY);
                localStorage.removeItem(LEGACY_WITS_KEY);
                localStorage.removeItem(LEGACY_SPIRIT_KEY);
            } catch(e) { console.error("Could not clear legacy stats from localStorage:", e); }
        }
        location.reload();
    }
}

/** Placeholder for the transcendence (New Game+) mechanic. */
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

// You also need to define gameInterval globally
let gameInterval;

/** Toggles the game's paused state. */
function togglePause() {
    // Prevent pausing/resuming if the journey has ended.
    if (gameState.currentZoneIndex === -1) return;

    gameState.isPaused = !gameState.isPaused; // Invert the paused state

    if (gameState.isPaused) {
        clearInterval(gameInterval); // Stop the game loop
        gameInterval = null;
        pauseResumeButton.textContent = "Resume";
        addLogMessage("Game paused.", "system");
    } else {
        // Restart the game loop if it's not already running
        if (!gameInterval) {
            gameInterval = setInterval(gameLoop, gameState.gameTickMs);
        }
        pauseResumeButton.textContent = "Pause";
        addLogMessage("Game resumed.", "system");
    }
}

/** Calculates stats including temporary buffs/debuffs from artifacts. */
function getEffectiveStats() {
    const effectiveStats = { ...gameState.stats
    };
    if (gameState.collectedArtifacts.includes("ART_ANCIENT_BLADE")) {
        effectiveStats.might += 2;
    }
    return effectiveStats;
}

/** Calculates the player's maximum HP based on level, Might, and class. */
function calculateMaxHp() {
    let hp = BASE_HP + (gameState.level * 5) + (gameState.stats.might * 2);
    if (gameState.playerClass === PLAYER_CLASSES.STALWART.name) hp += 5;
    // Apply penalty for Ancient Blade if equipped
    if (gameState.collectedArtifacts.includes("ART_ANCIENT_BLADE")) {
        hp -= 5;
    }
    return Math.max(1, hp); // Ensure HP never drops below 1.
}

/** Awards XP to the player and checks for a level-up. */
function awardXP(amount) {
    if (gameState.currentZoneIndex === -1) return;
    let finalAmount = amount;
    if (gameState.playerClass === "Erudite") {
        finalAmount = Math.ceil(amount * 1.05); // Erudite class gets a 5% XP bonus.
    }
    gameState.xp += finalAmount;
    addLogMessage(`Gained ${finalAmount} XP.`, "xp");
    checkForLevelUp();
}

/** Calculates the XP required for the next level based on a scaling formula. */
function calculateXPForNextLevel(level) {
    if (level === 1) return XP_FOR_LEVEL_2;
    return XP_FOR_LEVEL_2 + ((level - 1) * (level - 1) * XP_LEVEL_SCALING_BASE);
}

/** Handles the level-up process when XP thresholds are met. */
function checkForLevelUp() {
    while (gameState.xp >= gameState.xpToNextLevel) {
        gameState.level++;
        const overflowXp = gameState.xp - gameState.xpToNextLevel;
        gameState.xp = overflowXp;
        gameState.xpToNextLevel = calculateXPForNextLevel(gameState.level);

        // Award a random stat point.
        const stats = ["might", "wits", "spirit"];
        const randomStatIndex = seededRandomInt(0, stats.length - 1);
        const statToIncrease = stats[randomStatIndex];
        gameState.stats[statToIncrease]++;

        // Recalculate and restore HP.
        gameState.maxHp = calculateMaxHp();
        gameState.currentHp = gameState.maxHp;

        playSound('levelUp');
        addLogMessage(`LEVEL UP! You are now Level ${gameState.level}! Your ${statToIncrease.charAt(0).toUpperCase() + statToIncrease.slice(1)} increased by 1! HP restored.`, "level-up-message");
    }
}


/** Adds a new message to the top of the log area. */
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

/** Simulates a combat encounter with a given enemy type. */
function resolveCombat(enemyKey) {
    const enemyData = ENEMY_TYPES[enemyKey];
    if (!enemyData) {
        addLogMessage("An unknown foe fades into the shadows...", "combat-message");
        return;
    }
    let enemy = { ...enemyData
    }; // Create a mutable copy for the encounter.

    addLogMessage(`You encounter a ${enemy.name}! ${enemy.description}`, "combat-message");
    gameState.inCombat = true;
    pauseGameForDecision(true);

    // Handle spontaneous victory chance.
    if (seededRandom() < SPONTANEOUS_VICTORY_CHANCE) {
        addLogMessage("A surge of unforeseen power courses through you! The " + enemy.name + " is instantly obliterated!", "combat-victory");
        playSound('combatVictory');
        awardXP(enemy.xp * 2);
        const lootAmount = enemy.loot();
        if (lootAmount > 0) {
            gameState.resources.glimmeringDust += lootAmount * 2;
            addLogMessage(`It drops ${lootAmount * 2} Glimmering Dust!`, "combat-message");
        }
        if (seededRandom() < 0.2) {
            const undiscoveredArtifacts = ARTIFACTS.filter(art => !gameState.collectedArtifacts.includes(art.key) && !art.key.startsWith("ART_TOME"));
            if (undiscoveredArtifacts.length > 0) {
                const foundArtifact = undiscoveredArtifacts[seededRandomInt(0, undiscoveredArtifacts.length - 1)];
                gameState.collectedArtifacts.push(foundArtifact.key);
                gameState.narrativeFlags[foundArtifact.key] = true;
                addLogMessage(`Amidst the fading essence of your foe, you find the <strong>${foundArtifact.name}</strong>!`, "artifact");
                awardXP(25);
            }
        } else {
            const undiscoveredTomes = ARTIFACTS.filter(art => !gameState.collectedArtifacts.includes(art.key) && art.key.startsWith("ART_TOME"));
            if (undiscoveredTomes.length > 0 && seededRandom() < 0.3) {
                const foundTome = undiscoveredTomes[seededRandomInt(0, undiscoveredTomes.length - 1)];
                gameState.collectedArtifacts.push(foundTome.key);
                gameState.narrativeFlags[foundTome.key] = true;
                addLogMessage(`A forgotten <strong>${foundTome.name}</strong> materializes from the dissipating foe!`, "artifact");
                if (foundTome.key === "ART_TOME_MIGHT") {
                    gameState.stats.might++;
                    gameState.maxHp = calculateMaxHp();
                    gameState.currentHp = gameState.maxHp;
                } else if (foundTome.key === "ART_TOME_WITS") {
                    gameState.stats.wits++;
                } else if (foundTome.key === "ART_TOME_RESOLVE") {
                    gameState.stats.spirit++;
                    gameState.maxHp = calculateMaxHp();
                    gameState.currentHp = gameState.maxHp;
                }
                addLogMessage(`Your ${foundTome.name.split(' ')[2]} increases by 1!`, "synergy");
                awardXP(20);
            }
        }
        gameState.inCombat = false;
        pauseGameForDecision(false);
        renderAll();
        return;
    }

    let combatLogMessages = [];
    let combatRound = 0;
    const maxCombatRounds = 5;

// Inside the resolveCombat function...

    function processCombatRound() {
        if (combatRound >= maxCombatRounds || enemy.hp <= 0 || gameState.currentHp <= 0 || !gameState.inCombat) {
            resolveCombatOutcome();
            return;
        }

        combatRound++;
        combatLogMessages.push(`--- Round ${combatRound} ---`);

        // Player's turn
        const effectiveStats = getEffectiveStats();
        let playerAttackPower = effectiveStats.might + seededRandomInt(0, Math.floor(gameState.level / 2));
        let attackType = "melee";

        if (effectiveStats.spirit > effectiveStats.might + 2) {
            playerAttackPower = effectiveStats.spirit + seededRandomInt(0, Math.floor(gameState.level / 2));
            attackType = "spiritual energy";
        }
        
        // --- ADD THIS CHECK for the Obsidian Rune (Ω) ---
        let bonusDamage = 0;
        let bonusDamageText = "";
        if (gameState.activeRunes.includes('Ω')) {
            bonusDamage = 2; // Adds 2 bonus void damage
            bonusDamageText = " The Obsidian Rune adds a pulse of void energy!";
        }

        const enemyDefenseSoak = Math.floor(enemy.defense / 2);
        const damageToEnemy = Math.max(1, playerAttackPower - enemyDefenseSoak) + bonusDamage;
        enemy.hp -= damageToEnemy;
        combatLogMessages.push(`You strike with ${attackType} for ${damageToEnemy} damage.${bonusDamageText} ${enemy.name} HP: ${Math.max(0, enemy.hp)}`);
        playSound('combatHit');

        if (enemy.hp <= 0) {
            resolveCombatOutcome();
            return;
        }

        // Enemy's turn
        
        // --- ADD THIS CHECK for the Resilience Rune (Δ) ---
        let damageReduction = 0;
        if (gameState.activeRunes.includes('Δ')) {
            damageReduction = 1; // Reduces incoming damage by 1
        }
        
        const enemyAttackPower = enemy.attack + seededRandomInt(-1, 1);
        const playerDefenseSoak = Math.floor(effectiveStats.might / 3) + Math.floor(effectiveStats.spirit / 4);
        const damageToPlayer = Math.max(0, enemyAttackPower - playerDefenseSoak - damageReduction);
        gameState.currentHp -= damageToPlayer;
        
        let reductionText = damageReduction > 0 ? " Your Resilience Rune absorbs some of the blow!" : "";
        combatLogMessages.push(`${enemy.name} attacks for ${damageToPlayer} damage.${reductionText} Your HP: ${Math.max(0, gameState.currentHp)}`);

        if (damageToPlayer > 0) {
            // Player takes damage sound could go here
        } else {
            playSound('combatMiss');
        }

        if (gameState.currentHp <= 0) {
            resolveCombatOutcome();
            return;
        }

        combatLogMessages.forEach(msg => addLogMessage(msg, "combat-message"));
        combatLogMessages = [];
        setTimeout(processCombatRound, 600);
    }

    function resolveCombatOutcome() {
        combatLogMessages.forEach(msg => addLogMessage(msg, "combat-message"));

        if (enemy.hp <= 0) {
            addLogMessage(`You have vanquished the ${enemy.name}!`, "combat-victory");
            playSound('combatVictory');
            awardXP(enemy.xp);
            const lootAmount = enemy.loot();
            if (lootAmount > 0) {
                gameState.resources.glimmeringDust += lootAmount;
                addLogMessage(`It drops ${lootAmount} Glimmering Dust.`, "combat-message");
            }
        } else if (gameState.currentHp <= 0) {
            addLogMessage(`You have been defeated by the ${enemy.name}... Darkness takes you.`, "combat-defeat");
            playSound('combatDefeat');
            handleGameEnd("Your journey has ended in defeat...");
        } else {
            addLogMessage(`The ${enemy.name} proves resilient! You disengage, losing ${COMBAT_ESCAPE_DUST_LOSS} Glimmering Dust.`, "combat-message");
            playSound('combatMiss');
            gameState.resources.glimmeringDust = Math.max(0, gameState.resources.glimmeringDust - COMBAT_ESCAPE_DUST_LOSS);
        }
        gameState.inCombat = false;
        pauseGameForDecision(false);
        renderAll();
    }

    processCombatRound();
}

/** Creates a decision modal for a stat challenge. */
function presentStatChallengeDecision(flagKey, promptText, ignoreText, successCondition, failureCallback) {
    pauseGameForDecision(true);
    gameState.narrativeFlags[flagKey] = true; // Mark as encountered so it doesn't trigger again

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
                if (!successCondition()) { // successCondition returns true/false now
                    failureCallback();
                }
            } else { // Ignored
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


/** Processes encounters with foreground elements at the player's current location. */
function handleEncounter() {
    const zone = getCurrentZone();
    if (!zone) return;

    const elementsAtCurrentX = zone.foregroundElements[gameState.playerZoneX] || [];
    const encounterKeyBase = `${gameState.currentZoneIndex}_${gameState.playerZoneX}`;
    const effectiveStats = getEffectiveStats();

    elementsAtCurrentX.forEach(element => {
        const currentElementChar = element.char;
        const specificEncounterKey = `${encounterKeyBase}_${element.lane}_${currentElementChar}`;

        if (element.lane !== gameState.playerLane) {
            return; // Skip encounters not in the player's lane.
        }

        // Blocking terrain is handled by movement logic, but we can return early here too.
        if (currentElementChar === '~' || currentElementChar === 'M') {
            return;
        }

        switch (currentElementChar) {
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
                        () => { // Success condition
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
                        () => { // Failure message
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
                        () => { // Success condition
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
                        () => { // Failure message
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
                        () => { // Success condition
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
                        () => { // Failure message
                            addLogMessage(STAT_CHALLENGE_LORE.WHISPERING_TOTEM_FAIL, "puzzle-fail");
                        }
                    );
                }
                break;
            case '¥': // Sword in the Stone
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    presentStatChallengeDecision(
                        specificEncounterKey,
                        "An ancient blade is embedded in a stone, humming faintly. Try to pull it free with Might?",
                        "You leave the blade to its slumber.",
                        () => { // Success
                            if (effectiveStats.might >= SWORD_PULL_MIGHT_REQ) {
                                addLogMessage(STAT_CHALLENGE_LORE.SWORD_STONE_SUCCESS, "puzzle-success");
                                const blade = ARTIFACTS.find(a => a.key === "ART_ANCIENT_BLADE");
                                if (blade && !gameState.collectedArtifacts.includes(blade.key)) {
                                    gameState.collectedArtifacts.push(blade.key);
                                    addLogMessage(`<strong>${blade.name}</strong>: ${blade.description}`, "artifact");
                                    gameState.maxHp = calculateMaxHp(); // Recalculate HP due to artifact effect
                                    gameState.currentHp = Math.min(gameState.currentHp, gameState.maxHp);
                                }
                                awardXP(30);
                                return true;
                            }
                            return false;
                        },
                        () => { // Failure
                            addLogMessage(STAT_CHALLENGE_LORE.SWORD_STONE_FAIL, "puzzle-fail");
                            gameState.currentHp = Math.max(1, gameState.currentHp - SWORD_PULL_HP_COST);
                            if (gameState.currentHp <= 0) handleGameEnd("Your final effort was too much...");
                        }
                    );
                }
                break;
            case 'd': // Dying Creature
                if (!gameState.narrativeFlags[specificEncounterKey]) {
                    presentStatChallengeDecision(
                        specificEncounterKey,
                        `A small, glowing creature lies dying. It looks at you with pleading eyes. Soothe it? (Cost: ${CREATURE_DUST_COST} Dust)`,
                        "You harden your heart and walk away.",
                        () => { // Success
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
                        () => { // Failure
                            addLogMessage(STAT_CHALLENGE_LORE.DYING_CREATURE_FAIL, "puzzle-fail");
                        }
                    );
                }
                break;
            case 'O': // Oracle's Dais
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
            case 'H': // Shrine
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
                case 'A': // Artifact
            if (!gameState.narrativeFlags[specificEncounterKey]) {
                const undiscoveredArtifacts = ARTIFACTS.filter(art => !gameState.collectedArtifacts.includes(art.key));
                if (undiscoveredArtifacts.length > 0) {
                    const foundArtifact = undiscoveredArtifacts[seededRandomInt(0, undiscoveredArtifacts.length - 1)];
                    gameState.collectedArtifacts.push(foundArtifact.key);
                    gameState.narrativeFlags[specificEncounterKey] = true;
                    gameState.narrativeFlags[foundArtifact.key] = true; // Also flag the artifact itself as found
                    addLogMessage(`In a hidden alcove, you discover the <strong>${foundArtifact.name}</strong>!`, "artifact");
                    addLogMessage(foundArtifact.description, "artifact");
                    playSound('artifact');
                    awardXP(25);
                } else {
                    addLogMessage("You find signs of a hidden cache, but it's empty.", "lore");
                }
            }
            break;

        case 'L': // Lore Fragment
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

        case '.': // Pile of dust
            if (!gameState.narrativeFlags[specificEncounterKey]) {
                // CHANGED from const to let so we can modify it
                let dustAmount = seededRandomInt(1, 5); 

                // --- ADD THIS CHECK ---
                // If the Perception Rune is active, add 1 bonus dust.
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

        case 'N': // NPC
            if (element.npcType && NPCS[element.npcType] && !gameState.encounteredNPCs[specificEncounterKey]) {
                const npc = NPCS[element.npcType];
                const dialogue = npc.dialogue[seededRandomInt(0, npc.dialogue.length - 1)];
                addLogMessage(`A ${npc.name} murmurs: "${dialogue}"`, "npc");
                gameState.encounteredNPCs[specificEncounterKey] = true; // Encounter this specific instance once
                awardXP(5);

                // Companion reaction
                if (gameState.companion && COMPANION_NPC_REACTION_DIALOGUE[gameState.companion.type] && COMPANION_NPC_REACTION_DIALOGUE[gameState.companion.type][element.npcType]) {
                    addLogMessage(COMPANION_NPC_REACTION_DIALOGUE[gameState.companion.type][element.npcType], "companion");
                }
            }
            break;

        case '+': // Grave Marker
            if (!gameState.narrativeFlags[specificEncounterKey]) {
                const epitaph = EPITAPHS[seededRandomInt(0, EPITAPHS.length - 1)];
                addLogMessage(`A weathered marker reads: "${epitaph}"`, "grave");
                gameState.narrativeFlags[specificEncounterKey] = true;
                awardXP(2);
            }
            break;

        case 'P': // Shimmering Presence (Companion)
            if (!gameState.companion && !gameState.narrativeFlags.companionFound) {
                // Find a random companion, but DON'T add it to the game state yet.
                const companionData = COMPANIONS[seededRandomInt(0, COMPANIONS.length - 1)];
                
                // Instead, call our new function to start the naming process.
                presentCompanionNaming(companionData);
                
                // Mark that the companion event has been triggered so it doesn't happen again.
                gameState.narrativeFlags.companionFound = true;
            }
            break;
        
        case '§': // Whispering Idol
            if (!gameState.narrativeFlags[specificEncounterKey]) {
                gameState.narrativeFlags[specificEncounterKey] = true; // Mark as encountered
                let message = "You find a strange, soot-covered idol. It seems to hum, and a faint whisper enters your mind, speaking of a long-lost songbird.";

                // Check if the player has the Petrified Songbird artifact
                if (gameState.collectedArtifacts.includes("ART_PETRIFIED_SONGBIRD")) {
                    message += " You hold out the Petrified Songbird. The idol's hum intensifies, and a wave of warmth washes over you as the bird's stone form crumbles to dust, releasing a single, pure note of the First Song! Your spirit feels permanently fortified by the echo.";
                    addLogMessage(message, "artifact_synergy");
                    
                    // Grant a permanent Spirit point
                    gameState.stats.spirit++; 
                    awardXP(50);

                    // Remove the songbird artifact as it has been consumed
                    gameState.collectedArtifacts = gameState.collectedArtifacts.filter(key => key !== "ART_PETRIFIED_SONGBIRD");

                } else {
                    message += " The meaning is unclear, but you feel a sense of longing from the object.";
                    addLogMessage(message, "lore");
                    awardXP(5);
                }
                renderAll(); // Update the UI with the new stat
            }
            break;

        case '¤': // Dormant Forge
            if (!gameState.narrativeFlags[specificEncounterKey]) {
                pauseGameForDecision(true);
                gameState.narrativeFlags[specificEncounterKey] = true; // Mark as encountered

                let prompt = "You find a colossal, dormant forge built into the mountainside. Its surface is cold, but ancient runes glow with latent heat. It seems to be waiting for something.";
                let options = [{ text: "Leave it be", outcome: "LEAVE" }];

                // Check if the player has the Resonator artifact
                if (gameState.collectedArtifacts.includes("ART_RUNESMITHS_RESONATOR")) {
                    prompt += " Your Runesmith's Resonator hums, eager to awaken the forge.";
                    options.unshift({ text: "Use the Resonator (Spirit 5)", outcome: "RESONATE" });
                }

                // Create a generic decision pop-up
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
                                // Present a second choice for what to offer
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

/** Returns a string description for a given map character. */
function getElementDescription(elementChar) {
    const descriptions = {
        'T': 'charred greatwood', 't': 'burnt sapling', 'Y': 'scorched tree',
        'w': 'swaying wind chime / smoldering bush', 'm': 'patch of ash', 'o': 'heated rock',
        '♦': 'crimson shard', '◊': 'violet crystal', '✧': 'glowing ember', '*': 'sparkling geode',
        '[': 'obsidian wall', ']': 'broken column', '¦': 'volcanic archway', '^': 'jagged peak',
        '.': 'pile of dust', '`': 'cloud of ash', ':': 'crystal speckle', "'": 'glassy shard', '%': 'twisted remnant',
        '~': 'pool of water', 'S': 'submerged shelf', 'b': 'waterlogged book/slate',
        'c': 'flickering conduit / charred idol',
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
/** Renders the current log messages to the DOM. */
function renderLog() {
    logArea.innerHTML = gameState.logMessages.join('');
    const firstLogEntry = logArea.querySelector('p:first-child');

    // Apply a special color to the newest "normal" message to match the zone.
    // This uses a long chain of checks to ensure it's not a special, pre-styled message type.
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

/** Updates all the stat displays in the UI and their tooltips. */
function renderStats() {
    const zone = getCurrentZone();
    const effectiveStats = getEffectiveStats();

    if (gameState.currentZoneIndex === -1) {
        statsZoneName.textContent = "Journey Ended";
        statsExploredPercentage.textContent = "---";
    } else if (zone) {
        statsZoneName.textContent = zone.name;
        const exploredPercentage = Math.min(100, Math.floor((gameState.playerZoneX / zone.width) * 100));
        statsExploredPercentage.textContent = exploredPercentage;
    }

    // Update all player and resource text content and tooltips
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

    // Visually indicate stat boosts from artifacts for Might
    statMightWrapper.title = "Might (MGT): Increases max HP, physical power, and success in strength-based challenges.";
    if (effectiveStats.might !== gameState.stats.might) {
        statMightDisplay.textContent = `${effectiveStats.might} (${gameState.stats.might}+${effectiveStats.might - gameState.stats.might})`;
        statMightDisplay.style.color = '#90ee90';
    } else {
        statMightDisplay.textContent = effectiveStats.might;
        statMightDisplay.style.color = '';
    }

    // Update and disable the speed upgrade button if needed
    const upgradeCost = 50 * gameState.explorationSpeedMultiplier;
    upgradeSpeedButton.textContent = `Upgrade Speed (Cost: ${Math.round(upgradeCost)} .)`;
    upgradeSpeedButton.disabled = gameState.resources.glimmeringDust < upgradeCost || gameState.currentZoneIndex === -1;
}

/** Updates the border and background colors of UI elements to match the current zone. */
function updateUIAccentColors() {
    const zone = getCurrentZone();
    let primaryColor = "#777777"; // Default/Endgame color
    let bgColor = "#222222"; // Default/Endgame background

    if (zone && gameState.currentZoneIndex !== -1) {
        primaryColor = zone.color;
        bgColor = zone.bgColor;
    }

    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.style.borderColor = primaryColor;
        gameContainer.style.boxShadow = `0 0 15px ${primaryColor}, inset 0 0 10px ${primaryColor}33`;
    }

    document.querySelectorAll('.stats-bar, .log-area, .controls-area, .decision-area, .message-input-area, .summary-area').forEach(el => {
        el.style.borderColor = lightenDarkenColor(primaryColor, -50);
        el.style.backgroundColor = lightenDarkenColor(bgColor, 10);
    });

    document.querySelectorAll('.controls-area button, .decision-area button, .message-input-area button, .summary-area button').forEach(button => {
        button.style.backgroundColor = lightenDarkenColor(primaryColor, -20);
        button.style.color = lightenDarkenColor(primaryColor, 80);
        button.style.borderColor = primaryColor;
    });

    const gameScreenEl = document.getElementById('game-screen');
    if (gameScreenEl) {
        if (gameState.currentZoneIndex === -1) {
            gameScreenEl.style.color = "#aaa";
            gameScreenEl.style.backgroundColor = "#111";
            gameScreenEl.style.borderColor = lightenDarkenColor(primaryColor, -30);
        } else if (zone) {
            gameScreenEl.style.color = zone.color;
            gameScreenEl.style.backgroundColor = zone.bgColor;
            gameScreenEl.style.borderColor = lightenDarkenColor(zone.color, -30);
        }
    }
}

/** Renders the ASCII game world to the screen. */
function renderGameScreen() {
    const zone = getCurrentZone();

    if (!zone && gameState.currentZoneIndex === -1) {
        gameScreenContent.innerHTML = Array(NUM_LANES).fill('').map((_, i) => {
            if (i === gameState.playerLane) return ' '.repeat(PLAYER_VISUAL_POSITION - 5) + 'Path Fades...';
            return ' '.repeat(SCREEN_WIDTH);
        }).join('\n');
        return;
    }
    if (!zone) return;

    let screenLines = Array(NUM_LANES).fill(null).map(() => Array(SCREEN_WIDTH).fill(' '));

    // Draw background and midground parallax layers
    for (let lane = 0; lane < NUM_LANES; lane++) {
        for (let i = 0; i < SCREEN_WIDTH; i++) {
            if ((gameState.playerZoneX + i + lane) % 11 === 0) {
                screenLines[lane][i] = zone.backgroundChar;
            }
            if ((gameState.playerZoneX + i + lane * 2) % (zone.midgroundChar === '%' ? 5 : (zone.midgroundChar === 'c' ? 6 : (zone.midgroundChar === 'C' ? 8 : 9))) === 0) {
                if (screenLines[lane][i] === ' ') screenLines[lane][i] = zone.midgroundChar;
            }
        }
    }

    // Draw foreground elements with special styling
    for (let screenX = 0; screenX < SCREEN_WIDTH; screenX++) {
        const worldX = gameState.playerZoneX - PLAYER_VISUAL_POSITION + screenX;
        if (zone.foregroundElements[worldX]) {
            zone.foregroundElements[worldX].forEach(element => {
                if (element.lane >= 0 && element.lane < NUM_LANES) {
                    if (!(element.lane === gameState.playerLane && screenX === PLAYER_VISUAL_POSITION)) {
                        let displayChar = element.char;
                        if (element.char === '~') displayChar = `<span class="water-tile">~</span>`;
                        else if (element.char === '=') displayChar = `<span class="bridge-tile">=</span>`;
                        else if (element.char === 'M') displayChar = `<span class="mountain-tile">M</span>`;
                        else if (element.char === 'F') displayChar = `<span class="forest-tile">F</span>`;
                        else if (element.char === '0') displayChar = `<span class="dark-feature-tile">0</span>`;
                        else if (element.char === 'C') displayChar = `<span class="cloud-tile">C</span>`;
                        else if (element.char === 'R') displayChar = `<span class="ruin-tile">R</span>`;
                        else if (element.char === 'w' && zone.name === "The Sky-Temple Aerie") displayChar = `<span class="windchime-tile">w</span>`;
                        else if (element.char === 'G') displayChar = `<span class="guardian-tile">G</span>`;
                        else if (element.char === 'O') displayChar = `<span class="oracle-dais-tile">O</span>`;
                        else if (element.enemyKey) displayChar = `<span class="enemy-tile">${element.char}</span>`;
                        else if (element.char === 'B') displayChar = `<span class="blocked-path-tile">B</span>`;
                        else if (element.char === '?') displayChar = `<span class="runic-etching-tile">?</span>`;
                        else if (element.char === '!') displayChar = `<span class="whispering-totem-tile">!</span>`;
                        else if (element.char === '¥') displayChar = `<span class="sword-stone-tile">¥</span>`;
                        else if (element.char === 'd') displayChar = `<span class="dying-creature-tile">d</span>`;
                        screenLines[element.lane][screenX] = displayChar;
                    }
                }
            });
        }
    }

    screenLines[gameState.playerLane][PLAYER_VISUAL_POSITION] = `<span class="player-char">@</span>`;
    gameScreenContent.innerHTML = screenLines.map(line => line.join('')).join('\n');
}

/** Utility function to lighten or darken a hex color. */
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

/** Updates the game's interval timer based on current speed multipliers. */
function updateGameTickSpeed() {
    gameState.gameTickMs = INITIAL_GAME_TICK_MS / (gameState.explorationSpeedMultiplier * devSpeedMultiplier);
    if (gameInterval) {
        clearInterval(gameInterval);
        if (!gameState.isPaused && !gameState.activeDecision && gameState.currentZoneIndex !== -1) {
            gameInterval = setInterval(gameLoop, gameState.gameTickMs);
        }
    }
}

/** Displays a major decision modal (like choosing a path). */
function presentDecision(decisionKey) {
    const decisionData = DECISIONS[decisionKey];
    if (!decisionData) return;
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

/** Handles the outcome of a major decision. */
function resolveDecision(chosenOption) {
    addLogMessage(`You chose: "${chosenOption.text}"`, "decision");
    gameState.narrativeFlags[chosenOption.outcomeKey] = true;

    decisionArea.style.display = 'none';

    if (chosenOption.leaveMessage) {
        messageInputArea.style.display = 'block';
        updateUIAccentColors();
        return;
    }

    gameState.activeDecision = null;

    if (chosenOption.nextZoneIndex === -1) {
        handleGameEnd("The journey pauses here. The path ahead is shrouded, for now...");
        return;
    }

    gameState.currentZoneIndex = chosenOption.nextZoneIndex !== undefined ? chosenOption.nextZoneIndex : gameState.currentZoneIndex + 1;
    gameState.playerZoneX = 0;
    gameState.playerLane = PLAYER_INITIAL_LANE;
    gameState.encounteredNPCs = {};

    if (gameState.currentZoneIndex >= ZONES.length) {
        handleGameEnd("You have explored all currently known realms! The journey ends... for now.");
    } else {
        const newZone = getCurrentZone();
        if (newZone) {
            const newZoneFlag = `ENTERED_ZONE_${newZone.name.replace(/\s+/g, '_')}`;
            if (newZone.entryLoreKey && ZONE_LORE[newZone.entryLoreKey] && !gameState.narrativeFlags[newZone.entryLoreKey]) {
                addLogMessage(ZONE_LORE[newZone.entryLoreKey], "lore");
                gameState.narrativeFlags[newZone.entryLoreKey] = true;
            }
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
        } else {
            handleGameEnd("An unknown path was chosen. The journey ends abruptly.");
        }
    }
}

/** Saves the "message to future self" or skips it. */
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

/** Helper to start/stop the main game interval when a decision is presented. */
function pauseGameForDecision(isPausing) {
    if (isPausing) {
        clearInterval(gameInterval);
    } else {
        if (!gameState.isPaused && gameState.currentZoneIndex !== -1 && !gameState.inCombat) {
            gameInterval = setInterval(gameLoop, gameState.gameTickMs);
        }
    }
}

/** Generates a text summary of the completed journey. */
function generateCharacterSummary() {
    let summary = `=== Journey's Echo ===\n`;
    summary += `Name: ${gameState.playerName}\n`;
    summary += `World Seed: ${gameState.initialGameSeed}\n`;
    summary += `Level: ${gameState.level} (${gameState.xp}/${gameState.xpToNextLevel} XP)\n`;
    const lastZone = ZONES[gameState.lastExploredZoneIndex !== undefined ? gameState.lastExploredZoneIndex : gameState.currentZoneIndex] || { name: "An Unknown Place" };
    summary += `Final Zone Reached: ${lastZone.name}${gameState.currentZoneIndex === -1 ? " (Journey Paused/Ended)" : ""}\n`;
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

/** Handles the end-of-game sequence. */
function handleGameEnd(message = "You have explored all realms. The echoes of this journey will linger.") {
    addLogMessage(message, "decision");
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = null;
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

    // Check for one-time events at specific coordinates.
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

    gameState.playerZoneX++;
    playSound('step');

    // Handle random vertical movement.
    if (seededRandom() < VERTICAL_MOVE_CHANCE) {
        const direction = seededRandom() < 0.5 ? -1 : 1;
        const newLane = gameState.playerLane + direction;
        if (newLane >= 0 && newLane < NUM_LANES) {
            const zone = getCurrentZone();
            const elementsAhead = (zone.foregroundElements && zone.foregroundElements[gameState.playerZoneX]) || [];
            const isTargetLaneBlocked = elementsAhead.some(el => el.lane === newLane && (el.char === '~' || el.char === 'M'));
            if (!isTargetLaneBlocked) {
                gameState.playerLane = newLane;
            }
        }
    }

    const zone = getCurrentZone();
    if (!zone) {
        if (gameInterval) clearInterval(gameInterval);
        return;
    }

    handleEncounter();

    // Check if the end of the zone is reached to trigger a decision.
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

/** A helper function to call all rendering functions at once. */
function renderAll() {
    renderStats();
    renderGameScreen();
    renderLog();
}

// =============================================================================
// │ INITIALIZATION & EVENT LISTENERS                                            │
// =============================================================================

document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    if (startButton) {
        startButton.addEventListener("click", startGame);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initializeSounds();

    document.fonts.ready.then(() => {
        // Initialize Dev Controls
        const devControls = document.getElementById('dev-controls');
        const devSpeedSlider = document.getElementById('dev-speed-slider');
        const devSpeedDisplay = document.getElementById('dev-speed-display');
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                devControls.style.display = devControls.style.display === 'none' ? 'block' : 'none';
            }
        });
        devSpeedSlider.addEventListener('input', (e) => {
            devSpeedMultiplier = parseInt(e.target.value, 10);
            devSpeedDisplay.textContent = devSpeedMultiplier;
            updateGameTickSpeed();
        });

        // Initialize Game State
 const gameWasLoaded = loadGame();
        let initialZone; // DECLARE the variable here, outside the IF block

        if (!gameWasLoaded) { 
            // If no game was loaded, start a fresh one
            gameState.initialGameSeed = Date.now() % 2147483647;
            initializeSeed(gameState.initialGameSeed);

            // Load legacy stats
            let initialLegacyMight = parseInt(localStorage.getItem(LEGACY_MIGHT_KEY) || '0');
            let initialLegacyWits = parseInt(localStorage.getItem(LEGACY_WITS_KEY) || '0');
            let initialLegacySpirit = parseInt(localStorage.getItem(LEGACY_SPIRIT_KEY) || '0');
            gameState.stats.might = BASE_STAT_VALUE + initialLegacyMight;
            gameState.stats.wits = BASE_STAT_VALUE + initialLegacyWits;
            gameState.stats.spirit = BASE_STAT_VALUE + initialLegacySpirit;
            gameState.maxHp = calculateMaxHp();
            gameState.currentHp = gameState.maxHp;

            // Display initial log messages
            addLogMessage(`World Seed: ${gameState.initialGameSeed}`, "seed");
            if (initialLegacyMight > 0 || initialLegacyWits > 0 || initialLegacySpirit > 0) {
                addLogMessage(`Legacy Echoes whisper: MGT+${initialLegacyMight}, WIT+${initialLegacyWits}, SPR+${initialLegacySpirit}`, "legacy-message");
            }
            try {
                const savedMessage = localStorage.getItem(FUTURE_SELF_MESSAGE_KEY);
                if (savedMessage) {
                    addLogMessage("A message from a past journey echoes: \"" + savedMessage + "\"", "future_self");
                    localStorage.removeItem(FUTURE_SELF_MESSAGE_KEY);
                }
            } catch (e) {
                console.warn("Could not access localStorage for future self message:", e);
            }

            initialZone = getCurrentZone(); // ASSIGN a value to it here
            if (initialZone && initialZone.entryLoreKey) {
                addLogMessage(ZONE_LORE[initialZone.entryLoreKey], "lore");
                gameState.narrativeFlags[initialZone.entryLoreKey] = true;
                awardXP(50);
            }
        }

        // Final UI setup and fade-in
        updateUIAccentColors();
        renderAll();
        document.body.classList.remove('loading');

        // Add helpful tooltips to the end-game buttons
        newJourneyButton.title = 'Start a completely fresh journey. All progress and legacy stats will be erased.';
        transcendButton.title = 'Start a New Game+. A fraction of your final stats will carry over to give you a head start.';

        artifactsCollectedWrapper.addEventListener('click', showArtifactViewer);
        artifactModalClose.addEventListener('click', hideArtifactViewer);
        artifactModalBackdrop.addEventListener('click', (event) => {
            // Only close if the click is on the backdrop itself, not the content box
            if (event.target === artifactModalBackdrop) {
                hideArtifactViewer();
            }
        });

        // Attach main event listeners
        pauseResumeButton.addEventListener('click', togglePause);

        // Attach main event listeners
        pauseResumeButton.addEventListener('click', togglePause);
        upgradeSpeedButton.addEventListener('click', attemptUpgradeSpeed);
        meditateButton.addEventListener('click', presentUpgradeMenu);
        attuneRunesButton.addEventListener('click', presentRuneMenu);
        console.log({
            pauseResumeButton,
            upgradeSpeedButton,
            meditateButton,
            attuneRunesButton
            });
        saveGameButton.addEventListener('click', saveGame);
        saveMessageButton.addEventListener('click', () => handleFutureSelfMessageSave('save'));
        skipMessageButton.addEventListener('click', () => handleFutureSelfMessageSave('skip'));
        newJourneyButton.addEventListener('click', () => resetGame(false));
        transcendButton.addEventListener('click', handleTranscendence);
        copyLogButton.addEventListener('click', () => {
            navigator.clipboard.writeText(logArea.innerText).then(() => {
                const originalText = copyLogButton.textContent;
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
        muteButton.addEventListener('click', () => {
            gameState.isMuted = !gameState.isMuted;
            muteButton.textContent = gameState.isMuted ? "Unmute Sounds" : "Mute Sounds";
            if (Tone && Tone.Destination) {
                Tone.Destination.mute = gameState.isMuted;
            }
            if (!gameState.isMuted && Tone && Tone.context.state !== 'running') {
                Tone.start().catch(e => console.warn("Tone.start() failed on mute toggle.", e));
            }
        });

        // Start the game!
        if (!gameState.isPaused) {
            gameInterval = setInterval(gameLoop, gameState.gameTickMs);
        }
    });
});

window.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    if (startButton) {
        startButton.addEventListener("click", () => startGame());
    }
});
