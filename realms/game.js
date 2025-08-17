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
    width: 240,
    backgroundChar: ".",
    midgroundChar: "t",
    foregroundElements: {
        10: [{ lane: 2, char: 'T' }],
        15: [{ lane: 0, char: '~' }, { lane: 1, char: '~' }],
        20: [{ lane: 1, char: '+' }, { lane: 0, char: '~' }],
        25: [{ lane: 3, char: 'c' }],
        30: [{ lane: 2, char: 'B' }, { lane: 4, char: 'M' }],
        35: [{ lane: 0, char: 'L' }, { lane: 4, char: 'M' }],
        40: [{ lane: 2, char: '§' }, { lane: 4, char: 'M' }],
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
        230: [{ lane: 4, char: 'L' }]
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
    width: 340,
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
        330: [{ lane: 2, char: 'L' }]
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
        30: [{ lane: 1, char: 'D' }],
        40: [{ lane: 3, char: '#' }],
        50: [{ lane: 4, char: 'E', enemyKey: "RUSTED_SENTINEL" }],
        60: [{ lane: 0, char: 'L' }],
        70: [{ lane: 2, char: 'R' }],
        80: [{ lane: 1, char: 'A' }],
        100: [{ lane: 3, char: 'N', npcType: "ARCHIVIST_CONSTRUCT" }],
        120: [{ lane: 0, char: 'E', enemyKey: "RUSTED_SENTINEL" }],
        140: [{ lane: 4, char: 'D' }],
        160: [{ lane: 2, char: 'S' }],
        180: [{ lane: 1, char: 'L' }],
        200: [{ lane: 3, char: '#' }],
        220: [{ lane: 0, char: 'R' }],
        240: [{ lane: 4, char: 'E', enemyKey: "RUSTED_SENTINEL" }],
        260: [{ lane: 2, char: 'H' }],
        280: [{ lane: 1, char: 'A' }],
        300: [{ lane: 3, char: 'S' }],
        320: [{ lane: 0, char: 'L' }],
        340: [{ lane: 4, char: 'D' }],
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
