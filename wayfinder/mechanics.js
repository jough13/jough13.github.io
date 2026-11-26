// --- START OF FILE mechanics.js ---

// ==========================================
// --- WAYFINDER BACKGROUND SIMULATIONS ---
// ==========================================

let lastPayday = 0;
const PAYDAY_INTERVAL = 30.0; // Pay crew every 30 Stardates
const COST_PER_CREW = 250;    // 250c per crew member

function _mechEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Helper to check if a Perks Set or Array contains a given perk ID
function _hasPlayerPerk(perkId) {
    if (typeof hasPlayerPerk === 'function') return hasPlayerPerk(perkId);
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

// Helper to safely add cargo without exceeding capacity
function _safeAddCargo(itemId, qty) {
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

// Helper to check if a blocking modal or combat screen is currently open
function isPlayerBusyInModalOrCombat() {
    if (typeof playerHull !== 'undefined' && playerHull <= 0) return true;
    if (typeof currentGameState !== 'undefined' && currentGameState !== 'galactic_map') return true;
    if (typeof currentCombatContext !== 'undefined' && currentCombatContext) return true;
    if (typeof currentTradeContext !== 'undefined' && currentTradeContext) return true;
    if (typeof currentOutfitContext !== 'undefined' && currentOutfitContext) return true;
    if (typeof currentMissionContext !== 'undefined' && currentMissionContext) return true;
    if (typeof currentEncounterContext !== 'undefined' && currentEncounterContext) return true;

    if (typeof window.UI !== 'undefined' && typeof window.UI.isAnyModalOpen === 'function') {
        if (window.UI.isAnyModalOpen()) return true;
    }

    const modalIds = [
        'genericModalOverlay',
        'stationOverlay',
        'xerxesOverlay',
        'codexOverlay',
        'levelUpOverlay',
        'gameOverOverlay',
        'confirmationOverlay'
    ];

    for (let i = 0; i < modalIds.length; i++) {
        const el = document.getElementById(modalIds[i]);
        if (el && el.style.display && el.style.display !== 'none') return true;
    }

    return false;
}

// ==========================================
// --- DEEP SPACE ENCOUNTER DATABASE ---
// ==========================================

const DEFAULT_ENCOUNTER_DATABASE = {
    PIRATE_EXTORTION: {
        id: "PIRATE_EXTORTION",
        title: "VOID VULTURE INTERCEPT",
        icon: "☠️",
        color: "var(--danger)",
        isHostile: true,
        image: "assets/pirate_ship.png",
        text: "A pair of scarred Void Vulture interceptors drop out of warp across your bow, locking weapons on your bridge. 'Cut your drives, spacer! Drop 300 credits into our sub-space account, or we crack your hull open and take everything!'",
        choices: [
            {
                label: "WIRE 300c TRIBUTE (Safe)",
                reqCredits: 300,
                costs: { credits: 300 },
                sound: "buy",
                log: "<span style='color:var(--warning)'>[ ENCOUNTER ] You wired 300c to the pirate wing. Satisfied, they disengage target locks and jump away.</span>"
            },
            {
                label: "OVERBURN THRUSTERS (-15 Fuel, Evade)",
                reqFuel: 15,
                costs: { fuel: 15 },
                rewards: { xp: 35 },
                sound: "warp",
                log: "<span style='color:var(--accent-color)'>[ ENCOUNTER ] You flood the injectors with emergency hydrogen and outrun their missile envelope! (+35 XP)</span>"
            },
            {
                label: "POWER WEAPONS & ENGAGE (Combat)",
                actionType: "START_COMBAT",
                shipClassKey: "STRIKER",
                enemyName: "Void Vulture Interceptor",
                log: "<span style='color:var(--danger); font-weight:bold;'>[ ENCOUNTER ] You reject their demands and bring your weapons online!</span>"
            }
        ]
    },

    SPATIAL_ANOMALY: {
        id: "SPATIAL_ANOMALY",
        title: "SPATIAL SUBSPACE SHEAR",
        icon: "🌀",
        color: "#9933FF",
        isHostile: true,
        image: "assets/anomaly.png",
        text: "Space folds violently ahead of your vessel as a localized subspace shear ripples across the sector. Exotic matter is crystallizing along the fault line, but gravimetric eddies threaten to tear your hull plating apart.",
        choices: [
            {
                label: "[VOID DIVER] HARMONIZE DRIVE (Free Void Crystals + XP)",
                reqPerk: "VOID_DIVER",
                rewards: { xp: 120, items: [{ id: "VOID_CRYSTALS", qty: 3 }] },
                sound: "gain",
                log: "<span style='color:#DDA0DD; font-weight:bold;'>[ VOID DIVER ]</span> You phase-align your ship with the shear, effortlessly harvesting <b>3x Void Crystals</b> (+120 XP)!"
            },
            {
                label: "TRACTOR EXOTIC MATTER (-15 Hull, +2 Void Crystals, +75 XP)",
                costs: { hull: 15 },
                rewards: { xp: 75, items: [{ id: "VOID_CRYSTALS", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:#9933FF'>[ ANOMALY ] Gravitational shear buckled your outer plating (-15 Hull), but you secured 2x Void Crystals (+75 XP)!</span>"
            },
            {
                label: "FULL REVERSE THRUST (-10 Fuel, Safe)",
                reqFuel: 10,
                costs: { fuel: 10 },
                sound: "warp",
                log: "<span style='color:var(--item-desc-color)'>[ ANOMALY ] You burn 10 fuel to pull clear of the collapsing subspace pocket.</span>"
            },
            {
                label: "BRACE FOR IMPACT (-20 Hull)",
                costs: { hull: 20 },
                sound: "error",
                log: "<span style='color:var(--danger)'>[ ANOMALY ] The spatial wave slams into your vessel (-20 Hull) before dissipating into the void.</span>"
            }
        ]
    },

    BINARY_STAR_MERGER: {
        id: "BINARY_STAR_MERGER",
        title: "BINARY STAR MERGER WAVE",
        icon: "💥",
        color: "#FF6600",
        isHostile: true,
        image: "assets/binary_merger.png",
        text: "Long-range sensors blare at maximum volume! A decaying binary pair in a neighboring system has just merged, sending a relativistic shockwave of magnetized plasma and hard gamma radiation hurtling directly through your flight path!",
        choices: [
            {
                label: "[HEALTH PHYSICIST] CALIBRATE RADIATION HARMONICS (XP+ & Data)",
                reqPerk: "HEALTH_PHYSICIST",
                rewards: { xp: 150, items: [{ id: "DATA_SUPERNOVA", qty: 1 }, { id: "HYDROGEN_3", qty: 3 }] },
                sound: "gain",
                log: "<span style='color:var(--success); font-weight:bold;'>[ HEALTH PHYSICIST ]</span> Dosimetry arrays absorbed the gamma surge with zero hull degradation! Recorded <b>1x Supernova Isotope Data</b> and scooped <b>3x Hydrogen-3</b> (+150 XP)."
            },
            {
                label: "RIDE THE SHOCKWAVE & RECORD TELEMETRY (-20 Hull, +Data, +100 XP)",
                costs: { hull: 20 },
                rewards: { xp: 100, items: [{ id: "DATA_SUPERNOVA", qty: 1 }] },
                sound: "laser",
                log: "<span style='color:var(--warning)'>[ BINARY MERGER ] Thermal stress scorched your hull (-20 Hull), but your sensors captured priceless Supernova Isotope Data (+100 XP)!</span>"
            },
            {
                label: "EMERGENCY WARP JUMP (-20 Fuel, Safe)",
                reqFuel: 20,
                costs: { fuel: 20 },
                sound: "warp",
                log: "<span style='color:var(--accent-color)'>[ BINARY MERGER ] You dump 20 fuel into the FTL coils, outrunning the radiation front by mere seconds.</span>"
            }
        ]
    },

    CONCORD_STING: {
        id: "CONCORD_STING",
        title: "CONCORD CUSTOMS INTERDICTION",
        icon: "🚔",
        color: "#00AAFF",
        isHostile: true,
        text: "A Concord Aegis Frigate decloaks alongside two interceptor wings, projecting a subspace interdiction net around your ship. 'Attention vessel: This is a mandatory SEC-COM contraband sweep. Cut your engines and prepare to be scanned.'",
        choices: [
            {
                label: "SUBMIT TO CUSTOMS SCAN",
                actionType: "CUSTOMS_SCAN"
            },
            {
                label: "[CYBER SLICER] SPOOF TRANSPONDER MANIFEST (Safe, +50 XP)",
                reqPerk: "CYBER_SLICER",
                rewards: { xp: 50 },
                sound: "gain",
                log: "<span style='color:var(--accent-color); font-weight:bold;'>[ CYBER SLICER ]</span> You feed a looped diplomatic manifest into the frigate's scanner array. 'Registry clean, Commander. Carry on.' (+50 XP)"
            },
            {
                label: "DEPLOY SENSOR DECOY & SLIP AWAY (Requires 1x Sensor Decoy)",
                reqItem: "SENSOR_DECOY",
                reqQty: 1,
                costs: { items: [{ id: "SENSOR_DECOY", qty: 1 }] },
                rewards: { xp: 40 },
                sound: "warp",
                log: "<span style='color:var(--success)'>[ CUSTOMS STING ] Your Sensor Decoy lures the Aegis patrol off-vector while you slip away into deep space (+40 XP).</span>"
            },
            {
                label: "PUNCH THROUGH THE BLOCKADE (Risk Hull & Notoriety)",
                actionType: "FLEE_CONCORD"
            }
        ]
    },

    GENERATION_SHIP_DRIFT: {
        id: "GENERATION_SHIP_DRIFT",
        title: "SUB-LIGHT GENERATION ARK",
        icon: "🛸",
        color: "var(--accent-color)",
        text: "You encounter the 'CSS Mnemosyne', a massive pre-hyperdrive sleeper ark launched centuries ago. Their automated caretaker AI hails you on an archaic frequency: 'Cryo-bay fusion reserves at 4%. Twelve thousand colonists at risk. Requesting immediate fuel or technical assistance.'",
        choices: [
            {
                label: "TRANSFER 25 FUEL & TECH PARTS (Rep+, XP+, Ancient Vintage)",
                reqFuel: 25,
                reqItem: "TECH_PARTS",
                reqQty: 2,
                costs: { fuel: 25, items: [{ id: "TECH_PARTS", qty: 2 }] },
                rewards: { xp: 120, credits: 600, rep: { faction: "CONCORD", amount: 8 }, items: [{ id: "ANCIENT_WINE", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:var(--success)'>[ GENERATION ARK ] The caretaker AI stabilizes the cryo-bays and gifts you 2x pre-warp Ancient Wine and 600c from the ship's vault (+120 XP, +8 Concord Rep)!</span>"
            },
            {
                label: "DONATE 20 FUEL UNITS (Rep+, +75 XP)",
                reqFuel: 20,
                costs: { fuel: 20 },
                rewards: { xp: 75, rep: { faction: "CONCORD", amount: 5 } },
                sound: "buy",
                log: "<span style='color:var(--success)'>[ GENERATION ARK ] You transfer 20 units of hydrogen fuel to keep their life-support running (+75 XP, +5 Concord Rep).</span>"
            },
            {
                label: "DOWNLOAD STELLAR LOGS & MOVE ON (+35 XP, Safe)",
                rewards: { xp: 35 },
                sound: "gain",
                log: "<span style='color:var(--item-desc-color)'>[ GENERATION ARK ] You copy their centuries-old deep-space telemetry logs (+35 XP) and continue on your course.</span>"
            }
        ]
    },

    KTHARR_BLOOD_CHALLENGE: {
        id: "KTHARR_BLOOD_CHALLENGE",
        title: "K'THARR RITE OF IRON",
        icon: "⚔️",
        color: "#4CAF50",
        isHostile: true,
        image: "assets/pirate_ship.png",
        text: "A scarred K'tharr War-Barge drops out of warp, weapons hot but holding fire. Warlord Kra'vos appears on your screen: 'Outlander! My gunners hunger for a test of armor. Trade a single unshielded broadside with us to prove your spine, or fight us to the death!'",
        choices: [
            {
                label: "ENDURE THE BROADSIDE (-18 Hull, +10 K'tharr Rep, +Spices)",
                costs: { hull: 18 },
                rewards: { xp: 90, rep: { faction: "KTHARR", amount: 10 }, items: [{ id: "KTHARR_SPICES", qty: 3 }] },
                sound: "laser",
                log: "<span style='color:var(--success); font-weight:bold;'>[ RITE OF IRON ]</span> Your hull groans under the ceremonial broadside (-18 Hull), and your return volley scorches their prow! Kra'vos roars with approval, jetting <b>3x K'tharr Spices</b> to your hold (+10 K'tharr Rep, +90 XP)."
            },
            {
                label: "ANSWER WITH FULL WEAPONS (Combat)",
                actionType: "START_COMBAT",
                shipClassKey: "KTHARR_SCOUT",
                enemyName: "K'tharr Honor Vanguard",
                log: "<span style='color:var(--danger); font-weight:bold;'>[ RITE OF IRON ] 'So be it! To the death!' Weapons locked!</span>"
            },
            {
                label: "DECLINE & WARP AWAY (-10 Fuel, Rep-)",
                reqFuel: 10,
                costs: { fuel: 10, rep: { faction: "KTHARR", amount: -3 } },
                sound: "warp",
                log: "<span style='color:var(--warning)'>[ RITE OF IRON ] You burn away as K'tharr insults echo over subspace (-3 K'tharr Rep).</span>"
            }
        ]
    },

    GHOST_BUOY_AUCTION: {
        id: "GHOST_BUOY_AUCTION",
        title: "SYNDICATE DEAD-DROP BEACON",
        icon: "🛰️",
        color: "#9933FF",
        text: "Your comms array intercepts a tight-beam signal from a cloaked Eclipse Cartel dead-drop buoy. An automated auctioneer voice states: 'Blind cache #884 available. Pay 450c to unlock magnetic clamps, or clear the sector before self-scrub routines engage.'",
        choices: [
            {
                label: "[CYBER SLICER] BYPASS MAGNETIC CLAMPS (Free Loot + XP)",
                reqPerk: "CYBER_SLICER",
                rewards: { xp: 85, items: [{ id: "ENCRYPTED_ENGRAM", qty: 1 }, { id: "PROHIBITED_STIMS", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:#DDA0DD; font-weight:bold;'>[ CYBER SLICER ]</span> You spoof the syndicate payment token and pop the pod open! Recovered <b>1x Encrypted Engram</b> and <b>2x Combat Stims</b> (+85 XP)."
            },
            {
                label: "PAY 450c FOR BLIND CACHE (Contraband & Relics)",
                reqCredits: 450,
                costs: { credits: 450 },
                rewards: { xp: 50, items: [{ id: "ENCRYPTED_ENGRAM", qty: 1 }, { id: "ARTIFACT_SHARDS", qty: 2 }] },
                sound: "buy",
                log: "<span style='color:var(--gold-text)'>[ DEAD-DROP ] The clamps release! Inside the smuggling pod you find 1x Encrypted Engram and 2x Artifact Shards (+50 XP).</span>"
            },
            {
                label: "STRIP THE BUOY FOR TECH PARTS (+2 Tech Parts, Safe)",
                rewards: { xp: 25, items: [{ id: "TECH_PARTS", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:var(--accent-color)'>[ DEAD-DROP ] You ignore the locked vault and dismantle the external transmitter for 2x Tech Parts (+25 XP).</span>"
            }
        ]
    },

    STRANDED_SCIENCE_TEAM: {
        id: "STRANDED_SCIENCE_TEAM",
        title: "CRIPPLED ASTROMETRIC SHUTTLE",
        icon: "🔭",
        color: "var(--success)",
        text: "A Concord Science Division research vessel is adrift with a blown FTL motivator. Chief Astronomer Lin hails you: 'Commander! Our motivator fused while mapping a nearby pulsar. Can you spare 2x Tech Parts to help us patch our drive?'",
        choices: [
            {
                label: "GIVE 2x TECH PARTS (Rewards: 650c, Planetary Data, +60 XP)",
                reqItem: "TECH_PARTS",
                reqQty: 2,
                costs: { items: [{ id: "TECH_PARTS", qty: 2 }] },
                rewards: { credits: 650, xp: 60, rep: { faction: "CONCORD", amount: 5 }, items: [{ id: "PLANETARY_DATA", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:var(--success)'>[ RESCUE ] The science team repairs their drive and transfers 650c, 1x Planetary Data, and a glowing commendation (+60 XP, +5 Concord Rep)!</span>"
            },
            {
                label: "TOW SHUTTLE TO RELAY (-12 Fuel, +400c, +45 XP)",
                reqFuel: 12,
                costs: { fuel: 12 },
                rewards: { credits: 400, xp: 45, rep: { faction: "CONCORD", amount: 3 } },
                sound: "buy",
                log: "<span style='color:var(--accent-color)'>[ RESCUE ] You tow the research vessel to the nearest beacon (-12 Fuel) and receive 400c in reimbursement (+45 XP).</span>"
            },
            {
                label: "MARK COORDINATES & DEPART (Safe)",
                rewards: { xp: 15 },
                log: "<span style='color:var(--item-desc-color)'>[ SENSORS ] You log their distress beacon for the next patrol ship (+15 XP) and maintain your course.</span>"
            }
        ]
    },

    // ==========================================
    // --- EXPANDED DEEP-SPACE ENCOUNTERS (ZERO ASSETS) ---
    // ==========================================

    DEEP_SPACE_TAVERN_BARGE: {
        id: "DEEP_SPACE_TAVERN_BARGE",
        title: "WANDERING BREW-BARGE 'MOONSHINE'",
        icon: "🍺",
        color: "var(--gold-text)",
        text: "A brightly lit, converted freighter painted with crescent moons hails you on the open hailing band: 'Thirsty out here in the black, Captain? Fresh kegs straight off the Frothy Moon ridge, hot weld patches, and fresh sector gossip!'",
        choices: [
            {
                label: "BUY 3x FROTHY MOON ALE (90c — Discounted)",
                reqCredits: 90,
                costs: { credits: 90 },
                rewards: { items: [{ id: "FROTHY_MOON_ALE", qty: 3 }], xp: 20 },
                sound: "buy",
                log: "<span style='color:var(--gold-text)'>[ BREW-BARGE ] Docked via transfer tube and picked up <b>3x Frothy Moon Ale</b> at rim discount (+20 XP)!</span>"
            },
            {
                label: "QUICK WELDER PATCH & ALE (80c, +25 Hull)",
                reqCredits: 80,
                costs: { credits: 80 },
                rewards: { hull: 25, xp: 15 },
                sound: "gain",
                log: "<span style='color:var(--success)'>[ BREW-BARGE ] Their mechanic welded your hull plates while you shared a mug on the airlock deck (+25 Hull, +15 XP).</span>"
            },
            {
                label: "TRADE DEEP-SPACE STORIES (Safe, +45 XP)",
                rewards: { xp: 45 },
                sound: "hail",
                log: "<span style='color:var(--accent-color)'>[ BREW-BARGE ] You swap star-charts and rim gossip over subspace before waving them off (+45 XP).</span>"
            }
        ]
    },

    DRIFTING_MINING_DRONE: {
        id: "DRIFTING_MINING_DRONE",
        title: "ROGUE PROSPECTOR DRONE",
        icon: "🛸",
        color: "var(--accent-color)",
        text: "A scarred autonomous mining drone is spinning lazily in empty space, its owner's recovery tether long severed. Its ore hopper is packed with heavy metals and its logic core is still blinking green.",
        choices: [
            {
                label: "[DRONE COMMANDER] SYNC RECOVERY TETHER (Intact Auto-Miner + 90 XP)",
                reqPerk: "DRONE_COMMANDER",
                rewards: { xp: 90, items: [{ id: "MINING_DRONE_MK2", qty: 1 }, { id: "PLATINUM_ORE", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:var(--accent-color); font-weight:bold;'>[ DRONE TELEMETRY LINK ]</span> You pair the orphan drone to your bay! Recovered <b>1x Automated Mining Drone</b> and <b>2x Platinum Ore</b> (+90 XP)!"
            },
            {
                label: "[CYBER SLICER] REPROGRAM LOGIC CORE (Survey Drone + Platinum + 80 XP)",
                reqPerk: "CYBER_SLICER",
                rewards: { xp: 80, items: [{ id: "MINING_DRONE", qty: 1 }, { id: "PLATINUM_ORE", qty: 3 }] },
                sound: "gain",
                log: "<span style='color:var(--success); font-weight:bold;'>[ CYBER SLICER ]</span> Overrode the corporate lock! Stowed <b>1x Survey Drone</b> and <b>3x Platinum Ore</b> (+80 XP)."
            },
            {
                label: "SIPHON ORE HOPPER (+3 Platinum Ore, +3 Minerals, +40 XP)",
                rewards: { xp: 40, items: [{ id: "PLATINUM_ORE", qty: 3 }, { id: "MINERALS", qty: 3 }] },
                sound: "buy",
                log: "<span style='color:var(--gold-text)'>[ SALVAGE ]</span> You emptied the drone's ore bay for <b>3x Platinum Ore</b> and <b>3x Minerals</b> (+40 XP)."
            },
            {
                label: "STRIP FOR ELECTRONICS (+3 Tech Parts, +30 XP)",
                rewards: { xp: 30, items: [{ id: "TECH_PARTS", qty: 3 }] },
                sound: "gain",
                log: "<span style='color:var(--accent-color)'>[ SALVAGE ]</span> Dismantled the derelict drone for <b>3x Tech Parts</b> (+30 XP)."
            }
        ]
    },

    CONCORD_MEDICAL_FRIGATE: {
        id: "CONCORD_MEDICAL_FRIGATE",
        title: "CONCORD QUARANTINE FRIGATE",
        icon: "⚕️",
        color: "#00AAFF",
        text: "A white-hulled Concord Medical Corps frigate hails you on priority medical frequencies: 'Captain, we're transporting frontier colonists back to Sol after a toxic-spore outbreak. Can you spare 2x Medical Supplies to stabilize our cryo-wards?'",
        choices: [
            {
                label: "DONATE 2x MEDICAL SUPPLIES (+700c, +10 Concord Rep, +90 XP)",
                reqItem: "MEDICAL_SUPPLIES",
                reqQty: 2,
                costs: { items: [{ id: "MEDICAL_SUPPLIES", qty: 2 }] },
                rewards: { credits: 700, xp: 90, rep: { faction: "CONCORD", amount: 10 }, notoriety: -2 },
                sound: "gain",
                log: "<span style='color:var(--success)'>[ MEDICAL CORPS ] The chief surgeon transfers <b>700c</b> and files an official commendation (+10 Concord Rep, -2 Notoriety, +90 XP)!</span>"
            },
            {
                label: "[XENO-BIOLOGIST] SYNTHESIZE ANTITOXIN (+450c, +8 Rep, +130 XP)",
                reqPerk: "XENO_BIOLOGIST",
                rewards: { credits: 450, xp: 130, rep: { faction: "CONCORD", amount: 8 }, hull: 20 },
                sound: "gain",
                log: "<span style='color:var(--accent-color); font-weight:bold;'>[ XENO-BIOLOGIST ]</span> You upload a tailored spore-counteragent sequence to their lab! Awarded <b>450c</b>, +8 Concord Rep, +20 Hull patch, and +130 XP."
            },
            {
                label: "REQUEST ROUTINE HULL PATCH & SCAN (Safe, +15 Hull, +20 XP)",
                rewards: { hull: 15, xp: 20 },
                sound: "buy",
                log: "<span style='color:var(--item-desc-color)'>[ MEDICAL CORPS ] Their support tender patches minor hull pitting (+15 Hull, +20 XP) before continuing toward Starbase Alpha.</span>"
            }
        ]
    },

    STELLAR_CARTOGRAPHER_BEACON: {
        id: "STELLAR_CARTOGRAPHER_BEACON",
        title: "CYGNUS ASTROMETRIC BUOY",
        icon: "🌟",
        color: "#00E0E0",
        text: "A gold-foiled University of Cygnus Prime interferometry buoy drifts silently in empty space, logging deep-sky parallax across three distant pulsars. Its open-access telemetry port invites passing vessels to exchange calibration plates.",
        choices: [
            {
                label: "[ASTROMETRIC SAVANT] CROSS-CALIBRATE ARRAYS (+Planetary Data, +160 XP)",
                reqPerk: "ASTROMETRIC_SAVANT",
                rewards: { xp: 160, items: [{ id: "PLANETARY_DATA", qty: 1 }, { id: "NAVIGATION_CHARTS", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:var(--accent-color); font-weight:bold;'>[ ASTROMETRIC SAVANT ]</span> Interferometric lock achieved! Compiled <b>1x Planetary Data</b> and <b>1x Nav-Charts</b> (+160 XP)!"
            },
            {
                label: "UPLOAD SECTOR TELEMETRY (+300c Grant, +75 XP)",
                rewards: { credits: 300, xp: 75 },
                sound: "buy",
                log: "<span style='color:var(--success)'>[ CYGNUS PRIME ]</span> Automated university relay verified your flight logs and wired a <b>300c</b> mapping stipend (+75 XP)."
            },
            {
                label: "HARMONIZE DEFLECTOR SENSORS (Safe, +Full Shields, +40 XP)",
                rewards: { shields: 999, xp: 40 },
                sound: "ability",
                log: "<span style='color:var(--accent-color)'>[ ASTROMETRICS ]</span> Calibrated your deflector grid against the buoy's baseline—Shields restored to 100% (+40 XP)."
            }
        ]
    }
};

// BUG FIX: Mutate lore.js's lexical ENCOUNTER_DATABASE in place (if present) AND sync window.ENCOUNTER_DATABASE
// so both bare `ENCOUNTER_DATABASE` and `window.ENCOUNTER_DATABASE` always see ALL merged encounters!
if (typeof ENCOUNTER_DATABASE !== 'undefined' && ENCOUNTER_DATABASE) {
    Object.assign(ENCOUNTER_DATABASE, DEFAULT_ENCOUNTER_DATABASE);
    window.ENCOUNTER_DATABASE = ENCOUNTER_DATABASE;
} else {
    window.ENCOUNTER_DATABASE = Object.assign({}, window.ENCOUNTER_DATABASE || {}, DEFAULT_ENCOUNTER_DATABASE);
}

// ==========================================
// --- UNIFIED ENTITY MANAGER ---
// ==========================================

const EntityManager = {
    entities: [],

    add: function(entity) {
        if (!entity) return null;

        // Fix ID collisions when NPC_SHIP_TYPES spreads static template IDs like "CIVILIAN_HAULER"
        const isStaticTemplateId = (
            entity.id === "CIVILIAN_HAULER" ||
            entity.id === "INDEPENDENT_MINER" ||
            entity.id === "CONCORD_PATROL" ||
            this.entities.some(e => e && e.id === entity.id)
        );
        if (!entity.id || isStaticTemplateId) {
            entity.templateId = entity.id || null;
            entity.id = (entity.id || "ENT") + "_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
        }

        // Normalize NPC properties so interactWithNPC() in script.js displays accurate faction & comms
        if (entity.isNPC && !entity.isFuelRat && !entity.isColonyHauler) {
            if (!entity.faction) {
                const rawId = String(entity.templateId || entity.id || "");
                if (rawId.includes("CONCORD") || (entity.name && entity.name.includes("Concord"))) {
                    entity.faction = "CONCORD";
                    entity.shipClass = entity.shipClass || "Aegis Patrol Cutter";
                } else if (typeof getFactionAt === 'function' && entity.x !== undefined && entity.y !== undefined) {
                    const localFac = getFactionAt(entity.x, entity.y);
                    if (localFac === "KTHARR" && Math.random() < 0.65) {
                        entity.faction = "KTHARR";
                        entity.name = "K'tharr Blood-Patrol";
                        entity.char = "K";
                        entity.shipClass = "K'tharr Vanguard";
                        entity.combatProfile = "KTHARR_SCOUT";
                        entity.color = "#4CAF50";
                        entity.image = "assets/pirate_ship.png";
                        entity.desc = "An armored Hegemony patrol cruiser prowling the border for weak prey.";
                        entity.hails = [
                            "State your blood-price, outlander, or clear our vector!",
                            "The Ascendancy watches these stars. Tread lightly.",
                            "Weak hulls have no place in K'tharr space."
                        ];
                    } else if (localFac === "ECLIPSE" && Math.random() < 0.65) {
                        entity.faction = "ECLIPSE";
                        entity.name = "Cartel Shadow-Runner";
                        entity.char = "s";
                        entity.shipClass = "Eclipse Night-Runner";
                        entity.combatProfile = "STRIKER";
                        entity.color = "#9933FF";
                        entity.image = "assets/pirate_ship.png";
                        entity.desc = "A sensor-baffled smuggling vessel running dark through Cartel territory.";
                        entity.hails = [
                            "You didn't see us, we didn't see you. Keep flying.",
                            "Got contraband? Station Umbra is paying triple today.",
                            "Keep your sensors off our cargo hold if you value your hull."
                        ];
                    } else if (Math.random() < 0.20) {
                        entity.faction = "FUEL_RATS";
                        entity.name = "Fuel Rats Patrol Tug";
                        entity.char = "R";
                        entity.shipClass = "Salvage & Refuel Tug";
                        entity.combatProfile = "RAIDER";
                        entity.color = "#FFAA00";
                        entity.desc = "A bright amber rescue tug scanning deep space for stranded spacers.";
                        entity.hails = [
                            "Keep an eye on your hydrogen gauge, Commander! The void is unforgiving.",
                            "Fuel Rats Collective on patrol. Broadcast on channel Z if you ever run dry!",
                            "All tanks green! Safe travels out there, Wayfinder."
                        ];
                    } else {
                        entity.faction = "INDEPENDENT";
                    }
                } else {
                    entity.faction = "INDEPENDENT";
                }
            }

            if ((!entity.dialogue || entity.dialogue.length === 0) && entity.hails && entity.hails.length > 0) {
                entity.dialogue = [entity.hails[Math.floor(Math.random() * entity.hails.length)]];
            }
        }

        // Ensure glowColor is populated when hasSensorCone is true so renderGalacticMap() draws the aura
        if (entity.hasSensorCone && !entity.glowColor) {
            entity.glowColor = entity.color || "#00E0E0";
        }

        // Prevent unbounded entity array growth
        if (this.entities.length >= 25) {
            const removableIdx = this.entities.findIndex(e => e && !e.isFuelRat && !e.isColonyHauler);
            if (removableIdx !== -1) this.entities.splice(removableIdx, 1);
        }

        this.entities.push(entity);
        return entity;
    },

    remove: function(id) {
        this.entities = this.entities.filter(e => e && e.id !== id);
    },

    getById: function(id) {
        return this.entities.find(e => e && e.id === id) || null;
    },

    getAt: function(x, y) {
        return this.entities.filter(e => e && e.x === x && e.y === y);
    },

    countByType: function() {
        const counts = { total: this.entities.length, npcs: 0, comets: 0, uss: 0, fuelRats: 0, haulers: 0 };
        this.entities.forEach(e => {
            if (!e) return;
            if (e.isUSS) counts.uss++;
            else if (e.isComet) counts.comets++;
            else if (e.isFuelRat) counts.fuelRats++;
            else if (e.isColonyHauler) counts.haulers++;
            else if (e.isNPC) counts.npcs++;
        });
        return counts;
    },

    findNearest: function(x, y, predicateFn = null) {
        let best = null;
        let bestDistSq = Infinity;
        for (let i = 0; i < this.entities.length; i++) {
            const e = this.entities[i];
            if (!e || e.x === undefined || e.y === undefined) continue;
            if (predicateFn && !predicateFn(e)) continue;
            const dx = e.x - x;
            const dy = e.y - y;
            const dSq = dx * dx + dy * dy;
            if (dSq < bestDistSq) {
                bestDistSq = dSq;
                best = { entity: e, distance: Math.floor(Math.sqrt(dSq)) };
            }
        }
        return best;
    },

    clear: function() {
        this.entities = [];
    },

    // Internal helper to resolve Comet harvesting when player and comet occupy the same tile
    _resolveCometHarvest: function(index) {
        const ice = 5 + Math.floor(Math.random() * 10);
        const rare = Math.floor(Math.random() * 3);

        const maxCap = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
        const curLoad = typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0;
        const spaceLeft = maxCap - curLoad;

        if (typeof unlockLoreEntry === 'function') unlockLoreEntry("PHENOMENON_CRYO_COMETS");

        if (spaceLeft > 0) {
            const addedRare = rare > 0 ? _safeAddCargo('VOID_CRYSTALS', rare) : 0;
            const addedIce = _safeAddCargo('HYDROGEN_3', ice);

            let lootMsg = `<span style='color:var(--accent-color); font-weight:bold;'>[ COMET INTERCEPTED ]</span> Harvested ${addedIce}x Hydrogen-3`;
            if (addedRare > 0) lootMsg += ` and ${addedRare}x Void Crystals!`;
            if (addedIce + addedRare < ice + rare) lootMsg += " (Cargo Full, remainder lost)";

            logMessage(lootMsg);
            if (typeof showToast === 'function') showToast("COMET HARVESTED", "success");
            if (typeof soundManager !== 'undefined') soundManager.playGain();
            if (typeof spawnFloatingText === 'function') {
                spawnFloatingText(playerX, playerY, `+${addedIce} H-3`, "#00FFFF");
            }
        } else {
            logMessage("<span style='color:var(--danger); font-weight:bold;'>[ COMET INTERCEPTED ]</span> Impact absorbed, but cargo hold is full! No materials extracted.");
            if (typeof showToast === 'function') showToast("CARGO FULL", "error");
        }

        this.entities.splice(index, 1);
    },

    // --- THE NATIVE ECS TICK ENGINE ---
    tick: function(isMovement, tickData = null) {
        const shouldAdvanceWorld = Boolean(isMovement) || (typeof currentGameState !== 'undefined' && currentGameState === 'galactic_map');

        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (!entity) continue;

            // SYSTEM 1: Unidentified Signal Sources (USS)
            if (entity.isUSS) {
                if (isMovement) entity.lifespan--;
                if (entity.x === playerX && entity.y === playerY && !isPlayerBusyInModalOrCombat()) {
                    this.entities.splice(i, 1);
                    if (tickData) tickData.interrupt = true;
                    if (typeof resolveUSSEncounter === 'function') resolveUSSEncounter();
                    continue;
                } else if (entity.lifespan <= 0) {
                    this.entities.splice(i, 1);
                    continue;
                }
            }

            // SYSTEM 2: Comets
            if (entity.isComet && shouldAdvanceWorld) {
                if (entity.x === playerX && entity.y === playerY) {
                    this._resolveCometHarvest(i);
                    continue;
                }

                const prevCometX = entity.x;
                const prevCometY = entity.y;
                entity.x += entity.vx;
                entity.y += entity.vy;
                if (typeof spawnParticles === 'function') {
                    spawnParticles(prevCometX, prevCometY, 'thruster', { x: -entity.vx, y: -entity.vy });
                }

                if (entity.x === playerX && entity.y === playerY) {
                    this._resolveCometHarvest(i);
                    continue;
                } else {
                    const cDist = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
                    if (typeof VIEWPORT_WIDTH_TILES !== 'undefined' && cDist > VIEWPORT_WIDTH_TILES * 1.5) {
                        this.entities.splice(i, 1);
                        continue;
                    }
                }
            }

            // SYSTEM 3: Ambient NPCs, Fuel Rats & Colony Haulers
            if ((entity.isNPC || entity.isFuelRat || entity.isColonyHauler) && shouldAdvanceWorld) {
                if (!entity.state) {
                    entity.state = 'CRUISING';
                    entity.vx = 0;
                    entity.vy = 0;
                    entity.stepsRemaining = 0;
                }

                if (entity.interactCooldown && entity.interactCooldown > 0) {
                    entity.interactCooldown--;
                }

                // Pre-move collision check
                if (entity.x === playerX && entity.y === playerY) {
                    if (entity.isFuelRat) {
                        this.entities.splice(i, 1);
                        if (tickData) tickData.interrupt = true;
                        if (typeof executeRescueSequence === 'function') executeRescueSequence();
                        continue;
                    } else if (entity.isColonyHauler) {
                        if (!entity.interactCooldown || entity.interactCooldown <= 0) {
                            entity.interactCooldown = 5;
                            logMessage(`<span style="color:var(--gold-text)">[CONVOY COMMS] ${_mechEscapeHtml(entity.name)}:</span> "Governor! Hull green and bound for ${_mechEscapeHtml(entity.destName || 'port')}!"`);
                        }
                    } else if ((!entity.interactCooldown || entity.interactCooldown <= 0) && !isPlayerBusyInModalOrCombat() && (typeof isSilentRunning === 'undefined' || !isSilentRunning)) {
                        entity.interactCooldown = 3;
                        if (tickData) tickData.interrupt = true;
                        if (typeof interactWithNPC === 'function') interactWithNPC(entity);
                        continue;
                    }
                }

                let movedThisTurn = false;
                const prevX = entity.x;
                const prevY = entity.y;

                // A. DOCKED STATE
                if (entity.state === 'DOCKED') {
                    entity.dockTimer--;
                    if (entity.dockTimer <= 0) {
                        entity.state = 'CRUISING';
                        entity.stepsRemaining = Math.floor(Math.random() * 15) + 10;
                        do {
                            entity.vx = Math.floor(Math.random() * 3) - 1;
                            entity.vy = Math.floor(Math.random() * 3) - 1;
                        } while (entity.vx === 0 && entity.vy === 0);
                    }
                }
                // B. DOCKING STATE
                else if (entity.state === 'DOCKING') {
                    if (entity.x < entity.targetX) entity.x++; else if (entity.x > entity.targetX) entity.x--;
                    if (entity.y < entity.targetY) entity.y++; else if (entity.y > entity.targetY) entity.y--;
                    movedThisTurn = true;

                    if (entity.x === entity.targetX && entity.y === entity.targetY) {
                        entity.state = 'DOCKED';
                        entity.dockTimer = 20;
                    }
                }
                // B.5 RESCUE STATE (Fuel Rat intercepting stranded player - works on wait turns!)
                else if (entity.state === 'RESCUE') {
                    const steps = isMovement ? 2 : 3;
                    for (let step = 0; step < steps; step++) {
                        if (entity.x < playerX) entity.x++; else if (entity.x > playerX) entity.x--;
                        if (entity.y < playerY) entity.y++; else if (entity.y > playerY) entity.y--;
                        movedThisTurn = true;
                        if (entity.x === playerX && entity.y === playerY) break;
                    }
                }
                // B.75 HAULER STATE (Colony Trade Route)
                else if (entity.state === 'TRADE_ROUTE') {
                    entity.routeTurns = (entity.routeTurns || 0) + 1;
                    const distToDest = Math.abs(entity.targetX - entity.x) + Math.abs(entity.targetY - entity.y);
                    const stepCount = distToDest > 40 ? 2 : 1;

                    for (let s = 0; s < stepCount; s++) {
                        if (entity.x < entity.targetX) entity.x++; else if (entity.x > entity.targetX) entity.x--;
                        if (entity.y < entity.targetY) entity.y++; else if (entity.y > entity.targetY) entity.y--;
                    }
                    movedThisTurn = true;

                    if ((entity.x === entity.targetX && entity.y === entity.targetY) || entity.routeTurns > 180) {
                        const payout = 3500 + Math.floor(Math.random() * 3500);
                        playerCredits += payout;

                        // Reward source colony morale and destination faction standing slightly
                        if (entity.sourceColonyId && typeof playerColonies !== 'undefined' && playerColonies[entity.sourceColonyId]) {
                            const srcCol = playerColonies[entity.sourceColonyId];
                            srcCol.morale = Math.min(100, (srcCol.morale || 50) + 2);
                        }
                        let repNote = "";
                        if (entity.destFaction && entity.destFaction !== 'INDEPENDENT' && typeof playerFactionStanding !== 'undefined') {
                            playerFactionStanding[entity.destFaction] = (playerFactionStanding[entity.destFaction] || 0) + 1;
                            repNote = ` (+1 ${entity.destFaction} Rep)`;
                        }

                        const goods = ["Luxury Goods", "Refined Alloy", "Medical Supplies", "Atmospheric Processors"];
                        const deliveredGood = goods[Math.floor(Math.random() * goods.length)];

                        logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ TRADE ROUTE ]</span> ${_mechEscapeHtml(entity.name)} safely delivered ${deliveredGood} to ${_mechEscapeHtml(entity.destName || 'port')}! Earned <b>${formatNumber(payout)}c</b> tariff${repNote}.`);
                        if (typeof showToast === 'function') showToast(`CONVOY ARRIVED: +${formatNumber(payout)}c`, "success");
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                        if (typeof renderUIStats === 'function') renderUIStats();
                        this.entities.splice(i, 1);
                        continue;
                    }

                    const pirate = (typeof activeEnemies !== 'undefined' && activeEnemies.find(e => !e.isProbe && Math.abs(e.x - entity.x) <= 1 && Math.abs(e.y - entity.y) <= 1)) ||
                                   this.entities.find(e => e && e.isHostile && e.x === entity.x && e.y === entity.y);
                    if (pirate) {
                        if (typeof spawnParticles === 'function') spawnParticles(entity.x, entity.y, 'explosion');
                        logMessage(`<span style='color:var(--danger); font-weight:bold;'>[ TRADE ROUTE LOST ]</span> ${_mechEscapeHtml(entity.name)} was ambushed and destroyed by hostiles at [${entity.x}, ${-entity.y}]!`);
                        if (typeof showToast === 'function') showToast("COLONY CONVOY DESTROYED", "error");
                        if (typeof soundManager !== 'undefined') soundManager.playExplosion();
                        this.entities.splice(i, 1);
                        continue;
                    }
                }
                // C. CRUISING STATE
                else if (entity.state === 'CRUISING') {
                    if (Math.random() >= 0.30) {
                        let foundStation = false;
                        if (Math.random() < 0.10 && typeof chunkManager !== 'undefined') {
                            for (let dy = -3; dy <= 3; dy++) {
                                for (let dx = -3; dx <= 3; dx++) {
                                    const tile = chunkManager.getTile(entity.x + dx, entity.y + dy);
                                    const char = typeof getTileChar === 'function' ? getTileChar(tile) : '.';

                                    if (char === STARBASE_CHAR_VAL || char === OUTPOST_CHAR_VAL) {
                                        entity.state = 'DOCKING';
                                        entity.targetX = entity.x + dx;
                                        entity.targetY = entity.y + dy;
                                        foundStation = true;
                                        break;
                                    }
                                }
                                if (foundStation) break;
                            }
                        }

                        if (!foundStation) {
                            if (entity.stepsRemaining <= 0) {
                                entity.stepsRemaining = Math.floor(Math.random() * 15) + 5;
                                do {
                                    entity.vx = Math.floor(Math.random() * 3) - 1;
                                    entity.vy = Math.floor(Math.random() * 3) - 1;
                                } while (entity.vx === 0 && entity.vy === 0);
                            }
                            entity.x += entity.vx;
                            entity.y += entity.vy;
                            entity.stepsRemaining--;
                            movedThisTurn = true;
                        }
                    }
                }

                // VISUAL POLISH: Draw engine trails at previous tile for moving ships
                if (movedThisTurn && typeof spawnParticles === 'function') {
                    const tdx = Math.sign(entity.x - prevX);
                    const tdy = Math.sign(entity.y - prevY);
                    spawnParticles(prevX, prevY, 'thruster', { x: tdx, y: tdy });
                }

                // DESPAWN, HAILING, & POST-MOVE COLLISIONS
                const dist = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
                const maxViewDist = typeof VIEWPORT_WIDTH_TILES !== 'undefined' ? VIEWPORT_WIDTH_TILES : 40;

                if (dist > maxViewDist && !entity.isColonyHauler && !entity.isFuelRat) {
                    this.entities.splice(i, 1);
                    continue;
                }

                if (dist > 0 && dist <= 3 && Math.random() < 0.15 && (typeof isSilentRunning === 'undefined' || !isSilentRunning)) {
                    if (entity.hails && entity.hails.length > 0) {
                        const randomHail = entity.hails[Math.floor(Math.random() * entity.hails.length)];
                        logMessage(`<span style="color:${entity.color || '#fff'}">[COMMS] ${_mechEscapeHtml(entity.name)}: "${_mechEscapeHtml(randomHail)}"</span>`);
                    }
                }

                if (entity.x === playerX && entity.y === playerY) {
                    if (entity.isFuelRat) {
                        this.entities.splice(i, 1);
                        if (tickData) tickData.interrupt = true;
                        if (typeof executeRescueSequence === 'function') executeRescueSequence();
                        continue;
                    } else if (!entity.isColonyHauler && (!entity.interactCooldown || entity.interactCooldown <= 0) && !isPlayerBusyInModalOrCombat() && (typeof isSilentRunning === 'undefined' || !isSilentRunning)) {
                        entity.interactCooldown = 3;
                        if (tickData) tickData.interrupt = true;
                        if (typeof interactWithNPC === 'function') interactWithNPC(entity);
                    }
                }
            }
        }
    }
};

window.EntityManager = EntityManager;

// ==========================================
// --- 1. NEBULA & ENCOUNTER EVENT FUNCTIONS ---
// ==========================================

function triggerNebulaEvent() {
    const events = [
        {
            type: "ION_STORM",
            msg: "<span style='color:var(--warning)'>[ ION STORM ]</span> Electrostatic lightning arcs across the nebula!",
            fx: () => {
                if (_hasPlayerPerk('SHIELD_HARMONICS')) {
                    logMessage("<span style='color:var(--success)'>[ SHIELD HARMONICS ] Frequency modulation absorbed the ionic discharge! Shields intact.</span>");
                } else {
                    playerShields = 0;
                    logMessage("<span style='color:var(--danger)'>Emitter matrix overloaded! Shields drained to 0.</span>");
                    if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "SHIELDS DRAINED", getThemeColor('--warning', '#FFAA00'));
                }
                if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
            }
        },
        {
            type: "NURSERY",
            msg: "<span style='color:var(--success)'>[ STELLAR NURSERY ]</span> Your sensors capture a protostar igniting inside a dense Bok globule. (+100 XP)",
            fx: () => {
                playerXP += 100;
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "+100 XP", "var(--success)");
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }
        },
        {
            type: "PLASMA_EDDY",
            msg: "<span style='color:var(--accent-color)'>[ PLASMA EDDY ]</span> You fly through a pocket of hyper-ionized hydrogen. Fuel tanks overcharged!",
            fx: () => {
                playerFuel = Math.max(playerFuel, Math.floor(MAX_FUEL * 1.5));
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "FUEL OVERCHARGED!", "var(--accent-color)");
            }
        },
        {
            type: "SENSOR_GHOSTS",
            msg: "<span style='color:#9933FF'>[ SENSOR GHOSTS ]</span> Ionized nebula gas refracts your radar pings into phantom echoes. Pursuing hostiles have lost your trail!",
            fx: () => {
                if (typeof activeEnemies !== 'undefined' && activeEnemies.length > 0) {
                    activeEnemies.forEach(e => {
                        if (!e.isProbe && !e.isBountyTarget && !e.isLegendary) {
                            e.x += (Math.random() < 0.5 ? -3 : 3);
                            e.y += (Math.random() < 0.5 ? -3 : 3);
                        }
                    });
                }
            }
        },
        {
            type: "SPORE_CLOUD",
            msg: "<span style='color:#FF33FF'>[ BIO-SIGNATURE ]</span> You fly through a cloud of bioluminescent dust. Fungal spores cling to your hull.",
            fx: () => {
                const added = _safeAddCargo('SENTIENT_MYCELIUM', 1);
                if (added > 0) {
                    logMessage("<span style='color:var(--success)'>Gathered 1x Sentient Mycelium.</span>");
                    if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "+1 MYCELIUM", "#FF33FF");
                } else {
                    logMessage("<span style='color:var(--danger)'>Cargo hold full. Spores drifted away.</span>");
                }
            }
        },
        {
            type: "TRITIUM_CONDENSATION",
            msg: "<span style='color:#00E0E0'>[ ISOTOPE POCKET ]</span> Cryogenic nebula currents condense heavy hydrogen isotopes along your intake manifolds.",
            fx: () => {
                const qty = 1 + Math.floor(Math.random() * 2);
                const added = _safeAddCargo('HYDROGEN_3', qty);
                if (added > 0) {
                    logMessage(`<span style='color:var(--success)'>Collected ${added}x Hydrogen-3 from the intake condensers.</span>`);
                    if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, `+${added} H-3`, "#00E0E0");
                } else {
                    logMessage("<span style='color:var(--warning)'>Cargo hold full. Vented excess Hydrogen-3.</span>");
                }
            }
        },
        {
            type: "PRECURSOR_ECHO",
            msg: "<span style='color:#DDA0DD'>[ SUBSPACE HARMONIC ]</span> The nebula gas resonates with an ancient Precursor carrier wave.",
            fx: () => {
                playerXP += 65;
                if (typeof unlockLoreEntry === 'function') unlockLoreEntry("PHENOMENON_NEBULA");
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "+65 XP", "#DDA0DD");
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }
        },
        {
            type: "CRYO_DUST_VEIL",
            msg: "<span style='color:#66DDFF'>[ CRYO-DUST VEIL ]</span> Ultra-cold molecular clouds sweep across your radiator vanes, instantly flushing reactor heat.",
            fx: () => {
                if (typeof stealthHeat !== 'undefined') stealthHeat = 0;
                playerXP += 35;
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "HEAT FLUSHED", "#66DDFF");
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }
        },
        {
            type: "ELECTROMAGNETIC_AURORA",
            msg: "<span style='color:var(--success)'>[ MAGNETIC AURORA ]</span> Shimmering plasma curtains dance across your bow, inductively charging your deflector emitters!",
            fx: () => {
                if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;
                const xp = _hasPlayerPerk('SPECTRAL_ANALYST') ? 100 : 50;
                playerXP += xp;
                if (typeof soundManager !== 'undefined' && typeof soundManager.playShieldRecharge === 'function') {
                    soundManager.playShieldRecharge();
                }
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, `SHIELDS 100% (+${xp} XP)`, "var(--success)");
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }
        },
        {
            type: "ANCIENT_WRECKAGE_PING",
            msg: "<span style='color:var(--gold-text)'>[ NEBULA SALVAGE ]</span> Your tractor beam snags floating hull debris concealed inside the ionized mist.",
            fx: () => {
                const mult = (_hasPlayerPerk('SCAVENGER_PROTOCOL') || (typeof hasCrewPerk === 'function' && hasCrewPerk('SCAVENGER_PROTOCOL'))) ? 2 : 1;
                const dropId = Math.random() < 0.35 ? 'ARTIFACT_SHARDS' : 'TECH_PARTS';
                const qty = (dropId === 'ARTIFACT_SHARDS' ? 1 : 2) * mult;
                const added = _safeAddCargo(dropId, qty);
                const name = (typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId]) ? COMMODITIES[dropId].name : dropId;
                if (added > 0) {
                    logMessage(`<span style='color:var(--success)'>Tractored ${added}x ${name} out of the nebula cloud.</span>`);
                    if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, `+${added} SALVAGE`, "#FFD700");
                } else {
                    logMessage("<span style='color:var(--warning)'>Cargo hold full—left the salvage drifting in the fog.</span>");
                }
            }
        },
        {
            type: "GRAVIMETRIC_SLIPSTREAM",
            msg: "<span style='color:#40E0D0'>[ GRAVIMETRIC EDDY ]</span> A gentle stellar-wind current accelerates your vessel cleanly through the gas cloud.",
            fx: () => {
                const fuelGain = _hasPlayerPerk('VOID_DIVER') ? 25 : 12;
                playerFuel = Math.min(typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220, Math.round((playerFuel + fuelGain) * 10) / 10);
                logMessage(`<span style='color:#40E0D0'>Rode the slipstream current (+${fuelGain} Fuel saved).</span>`);
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, `+${fuelGain} FUEL`, "#40E0D0");
            }
        }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    logMessage(ev.msg);
    ev.fx();
    if (typeof renderUIStats === 'function') renderUIStats();
}

function triggerRandomEncounter(forcedEncounterId = null) {
    const db = window.ENCOUNTER_DATABASE;
    if (!db) return;
    const keys = Object.keys(db);
    if (keys.length === 0) return;

    const chosenKey = (forcedEncounterId && db[forcedEncounterId])
        ? forcedEncounterId
        : keys[Math.floor(Math.random() * keys.length)];
    const encounter = db[chosenKey];
    if (!encounter) return;

    currentEncounterContext = encounter.id;

    // Lock the modal on hostile or inescapable hazard events so the player cannot X out for free
    window.activeHostileEncounter = Boolean(
        encounter.isHostile ||
        encounter.id.includes('PIRATE') ||
        encounter.id === 'SPATIAL_ANOMALY' ||
        encounter.id === 'BINARY_STAR_MERGER' ||
        encounter.id === 'CONCORD_STING' ||
        encounter.id === 'KTHARR_BLOOD_CHALLENGE' ||
        encounter.id === 'XYCORP_CLAIM_JUMPER'
    );

    openGenericModal("DEEP SPACE SENSOR CONTACT");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // --- 📡 CUSTOM SENSOR FLAVOR TEXT FOR LEFT PANEL ---
    if (listEl) {
        const pseudoRandom = Math.abs((playerX * 7) ^ (playerY * 13) ^ (encounter.title.length * 5));
        let customListHtml = '';

        if (encounter.title && encounter.title.toUpperCase().includes('BINARY STAR MERGER')) {
            const gravShear = (pseudoRandom % 900) + 100;
            const thermalFlux = ((pseudoRandom % 8) + 1) + "e28 W/m²";

            customListHtml = `
                <div style="padding:15px; border-bottom:1px solid var(--border-color);">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">LONG RANGE TELEMETRY</div>
                    <h4 style="color:#FF6600; margin:0; text-transform:uppercase; font-size:14px;">${_mechEscapeHtml(encounter.title)}</h4>
                    <div style="font-size:12px; color:var(--text-color); margin-top:10px; line-height: 1.8;">
                        • Gravimetric Shear: <span style="color:var(--danger)">${gravShear} m/s²</span><br>
                        • Stellar Class: <span style="color:#4488FF">Type-M Binary</span><br>
                        • Thermal Flux: ${thermalFlux}
                    </div>
                </div>
                <div style="padding:15px;">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">THREAT ANALYSIS</div>
                    <div style="font-size:12px; color:var(--text-color); margin-top:5px; line-height: 1.8;">
                        <span style="color:var(--danger)">[ STATUS ]</span> Collapsing<br>
                        <span style="color:var(--danger)">[ HAZARD ]</span> Catastrophic<br>
                        <span style="color:var(--warning)">[ TARGET ]</span> Evacuate
                    </div>
                </div>
            `;
        } else {
            const distance = (pseudoRandom % 40) + 10;
            const radLevel = (pseudoRandom % 300) + 15;
            const sigStrength = (pseudoRandom % 90) + 10;

            customListHtml = `
                <div style="padding:15px; border-bottom:1px solid var(--border-color);">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">LONG RANGE TELEMETRY</div>
                    <h4 style="color:${encounter.color || 'var(--accent-color)'}; margin:0; text-transform:uppercase; font-size:14px;">${_mechEscapeHtml(encounter.title)}</h4>
                    <div style="font-size:12px; color:var(--text-color); margin-top:10px; line-height: 1.8;">
                        • Distance: <span style="color:var(--accent-color)">${distance} Mm</span><br>
                        • Signature: <span style="color:var(--warning)">${sigStrength}% Match</span><br>
                        • Emissions: ${radLevel} mSv/h
                    </div>
                </div>
                <div style="padding:15px;">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">THREAT ANALYSIS</div>
                    <div style="font-size:12px; color:var(--text-color); margin-top:5px; line-height: 1.8;">
                        <span style="color:${encounter.color || 'var(--success)'}">[ STATUS ]</span> Active Contact<br>
                        <span style="color:var(--warning)">[ HAZARD ]</span> ${window.activeHostileEncounter ? 'Elevated' : 'Low'}<br>
                        <span style="color:var(--accent-color)">[ TARGET ]</span> Locked
                    </div>
                </div>
            `;
        }

        listEl.innerHTML = customListHtml + `
            <div style="padding:15px; text-align:center;">
                <div style="width:100%; height:2px; background:var(--border-color); position:relative; overflow:hidden;">
                    <div style="position:absolute; top:0; left:0; width:30%; height:100%; background:${encounter.color || 'var(--accent-color)'}; box-shadow: 0 0 10px ${encounter.color || 'var(--accent-color)'}; animation: radarSweep 2s infinite linear;"></div>
                </div>
                <div style="font-size:10px; color:${encounter.color || 'var(--accent-color)'}; margin-top:8px; letter-spacing:2px;">GATHERING DATA...</div>
            </div>
            <style>
                @keyframes radarSweep { 0% { left: -30%; } 100% { left: 100%; } }
            </style>
        `;
    }

    // --- DYNAMIC VISUALS FOR THE RIGHT PANEL (Never reuses assets on encounters without explicit .image) ---
    let visualHtml = '';
    if (encounter.image) {
        const accentCol = encounter.color || 'var(--accent-color)';
        visualHtml = `
            <img src="${encounter.image}" onerror="this.style.display='none'" alt="${_mechEscapeHtml(encounter.title)}" style="
                width: 100%; max-width: 420px; height: auto; border: 2px solid ${accentCol};
                box-shadow: 0 0 25px rgba(0, 0, 0, 0.45); margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;
            ">
        `;
    } else {
        visualHtml = `<div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 20px ${encounter.color || 'var(--accent-color)'});">${encounter.icon || '📡'}</div>`;
    }

    if (detailEl) {
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 30px 20px;">
                ${visualHtml}
                <h3 style="color:${encounter.color || '#FF6600'}; margin-bottom:15px; letter-spacing: 2px;">${_mechEscapeHtml(encounter.title)}</h3>
                
                <div style="text-align:left; background:rgba(0,0,0,0.5); padding:20px; border-left:3px solid ${encounter.color || '#FF6600'}; margin-bottom:15px; border-radius:4px;">
                    <p style="color:var(--text-color); font-size:14px; line-height:1.6; margin:0; font-style:italic;">
                        "${_mechEscapeHtml(encounter.text)}"
                    </p>
                </div>
            </div>
        `;
    }

    if (!actionsEl) return;
    actionsEl.innerHTML = '';

    encounter.choices.forEach((choice, index) => {
        let canAfford = true;
        const neededFuel = choice.reqFuel || (choice.costs && choice.costs.fuel) || 0;
        const neededCredits = choice.reqCredits || (choice.costs && choice.costs.credits) || 0;

        if (neededFuel > 0 && playerFuel < neededFuel) canAfford = false;
        if (neededCredits > 0 && playerCredits < neededCredits) canAfford = false;
        if (choice.reqItem && (playerCargo[choice.reqItem] || 0) < (choice.reqQty || 1)) canAfford = false;
        if (choice.reqPerk && !_hasPlayerPerk(choice.reqPerk)) {
            const hasDosimetryMod = choice.reqPerk === 'HEALTH_PHYSICIST' &&
                typeof playerShip !== 'undefined' &&
                playerShip.components &&
                playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY';
            if (!hasDosimetryMod) canAfford = false;
        }
        if (choice.reqRep && typeof playerFactionStanding !== 'undefined') {
            if ((playerFactionStanding[choice.reqRep.faction] || 0) < choice.reqRep.min) canAfford = false;
        }

        const btn = document.createElement('button');
        btn.className = 'action-button';
        btn.style.width = '100%';
        btn.style.marginBottom = '10px';
        btn.innerHTML = choice.label;

        if (choice.label.includes("DESTROY") || choice.label.includes("DEATH") || choice.label.includes("Rep-") || choice.label.includes("Risk") || choice.label.includes("Hull-") || choice.label.includes("Combat") || choice.label.includes("-10 Hull") || choice.label.includes("-15 Hull") || choice.label.includes("-18 Hull") || choice.label.includes("-20 Hull")) {
            btn.style.borderColor = "var(--danger)";
            btn.style.color = "var(--danger)";
        } else if (choice.label.includes("Rep+") || choice.label.includes("XP+") || choice.label.includes("Safe") || choice.reqPerk) {
            btn.style.borderColor = "var(--success)";
            btn.style.color = "var(--success)";
        }

        if (!canAfford) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.innerHTML += " (Requirements Not Met)";
        } else {
            btn.onclick = () => resolveUniversalEncounter(encounter.id, index);
        }

        actionsEl.appendChild(btn);
    });
}

function resolveUniversalEncounter(encounterId, choiceIndex) {
    window.activeHostileEncounter = false;
    const db = window.ENCOUNTER_DATABASE;
    const encounter = db ? db[encounterId] : null;
    if (!encounter || !encounter.choices[choiceIndex]) {
        currentEncounterContext = null;
        closeGenericModal();
        return;
    }

    const choice = encounter.choices[choiceIndex];
    let leveledUp = false;

    if (choice.actionType) {
        if (choice.actionType === "CUSTOMS_SCAN") {
            closeGenericModal();
            currentEncounterContext = null;
            const passed = typeof performCustomsScan === 'function' ? performCustomsScan() : true;
            if (passed) {
                logMessage("<span style='color:var(--success)'>[ CUSTOMS STING ]</span> Concord Interceptors complete their deep-scan of your hold. Finding no exposed contraband, they disarm weapons and jump away.");
                if (typeof showToast === 'function') showToast("INSPECTION PASSED", "success");
            }
            return;
        } else if (choice.actionType === "FLEE_CONCORD") {
            closeGenericModal();
            currentEncounterContext = null;
            const evadeBonus = typeof PLAYER_EVASION !== 'undefined' ? PLAYER_EVASION : 0;
            if (Math.random() < (0.45 + evadeBonus)) {
                logMessage("<span style='color:var(--success)'>[ ENCOUNTER ] EVASION SUCCESSFUL! You dump a chaff burst and jump to warp before they can lock weapons!</span>");
                if (typeof soundManager !== 'undefined') soundManager.playWarp();
            } else {
                if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(10);
                logMessage("<span style='color:var(--danger)'>[ ENCOUNTER ] EVASION FAILED! Hostile interceptors rake your hull for 30 damage before you escape!</span>");
                if (typeof GameBus !== 'undefined') {
                    GameBus.emit('HULL_DAMAGED', { amount: 30, reason: encounter.title || "Interceptor Fire" });
                } else {
                    playerHull -= 30;
                }
            }
            return;
        } else if (choice.actionType === "START_COMBAT") {
            closeGenericModal();
            currentEncounterContext = null;
            if (choice.log) logMessage(choice.log);
            if (typeof startCombat === 'function') {
                startCombat({
                    shipClassKey: choice.shipClassKey || "STRIKER",
                    name: choice.enemyName || "Hostile Vessel"
                });
            }
            return;
        }
    }

    if (choice.log) logMessage(choice.log);

    if (choice.costs) {
        if (choice.costs.fuel) playerFuel = Math.max(0, playerFuel - choice.costs.fuel);
        if (choice.costs.credits) playerCredits = Math.max(0, playerCredits - choice.costs.credits);
        if (choice.costs.notoriety && typeof updatePlayerNotoriety === 'function') {
            updatePlayerNotoriety(choice.costs.notoriety);
        }
        if (choice.costs.rep && typeof playerFactionStanding !== 'undefined') {
            playerFactionStanding[choice.costs.rep.faction] = (playerFactionStanding[choice.costs.rep.faction] || 0) + choice.costs.rep.amount;
        }
        if (choice.costs.items) {
            choice.costs.items.forEach(item => {
                playerCargo[item.id] = Math.max(0, (playerCargo[item.id] || 0) - item.qty);
                if (playerCargo[item.id] <= 0) delete playerCargo[item.id];
            });
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
        if (choice.costs.hull) {
            if (typeof GameBus !== 'undefined') {
                GameBus.emit('HULL_DAMAGED', { amount: choice.costs.hull, reason: encounter.title || "Deep Space Hazard" });
            } else {
                playerHull -= choice.costs.hull;
            }
        }
    }

    // If the hull cost killed the player, exit immediately so we don't overwrite the Game Over screen
    if (typeof playerHull !== 'undefined' && playerHull <= 0) {
        currentEncounterContext = null;
        closeGenericModal();
        return;
    }

    // Apply ALL non-XP rewards first before checking for level-up
    if (choice.rewards) {
        if (choice.rewards.credits) playerCredits += choice.rewards.credits;
        if (choice.rewards.fuel) {
            playerFuel = Math.min(typeof MAX_FUEL !== 'undefined' ? MAX_FUEL : 220, playerFuel + choice.rewards.fuel);
        }
        if (choice.rewards.hull) {
            playerHull = Math.min(typeof MAX_PLAYER_HULL !== 'undefined' ? MAX_PLAYER_HULL : 100, playerHull + choice.rewards.hull);
        }
        if (choice.rewards.shields) {
            const maxS = typeof MAX_SHIELDS !== 'undefined' ? MAX_SHIELDS : 50;
            playerShields = Math.min(maxS, playerShields + choice.rewards.shields);
        }
        if (choice.rewards.notoriety && typeof updatePlayerNotoriety === 'function') {
            updatePlayerNotoriety(choice.rewards.notoriety);
        }
        if (choice.rewards.rep && typeof playerFactionStanding !== 'undefined') {
            playerFactionStanding[choice.rewards.rep.faction] = (playerFactionStanding[choice.rewards.rep.faction] || 0) + choice.rewards.rep.amount;
        }
        if (choice.rewards.items) {
            choice.rewards.items.forEach(item => {
                const added = _safeAddCargo(item.id, item.qty);
                if (added < item.qty) {
                    const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[item.id]) ? COMMODITIES[item.id].name : item.id;
                    if (added > 0) {
                        logMessage(`<span style='color:var(--warning)'>Stowed ${added}x ${itemName} (Cargo hold full, remainder left behind).</span>`);
                    } else {
                        logMessage(`<span style='color:var(--danger)'>Could not recover ${item.qty}x ${itemName}. Cargo hold full!</span>`);
                    }
                }
            });
        }
    }

    if (choice.sound && typeof soundManager !== 'undefined') {
        if (choice.sound === 'buy' && typeof soundManager.playBuy === 'function') soundManager.playBuy();
        else if (choice.sound === 'error' && typeof soundManager.playError === 'function') soundManager.playError();
        else if (choice.sound === 'laser' && typeof soundManager.playLaser === 'function') soundManager.playLaser();
        else if (choice.sound === 'warp' && typeof soundManager.playWarp === 'function') soundManager.playWarp();
        else if (choice.sound === 'gain' && typeof soundManager.playGain === 'function') soundManager.playGain();
        else if (choice.sound === 'hail' && typeof soundManager.playHail === 'function') soundManager.playHail();
        else if (choice.sound === 'ability' && typeof soundManager.playAbilityActivate === 'function') soundManager.playAbilityActivate();
        else if (choice.sound === 'scan' && typeof soundManager.playScan === 'function') soundManager.playScan();
    }

    currentEncounterContext = null;
    closeGenericModal();

    if (choice.rewards && choice.rewards.xp) {
        playerXP += choice.rewards.xp;
        if (typeof checkLevelUp === 'function') leveledUp = checkLevelUp();
    }

    if (typeof renderUIStats === 'function') renderUIStats();

    if (!leveledUp) {
        if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
        if (typeof render === 'function') render();
    }
    if (typeof autoSaveGame === 'function') autoSaveGame();
}

// ==========================================
// --- COLONY CONVOY DISPATCH HELPER ---
// ==========================================

let lastColonyHaulerDispatch = 0;
const HAULER_DISPATCH_INTERVAL = 25.0; // Dispatch a trade convoy every 25 Stardates

function checkColonyHaulerDispatch() {
    if (typeof playerColonies === 'undefined' || typeof currentGameDate === 'undefined') return;

    if (typeof GameState !== 'undefined' && GameState.player) {
        if (!GameState.player.lastColonyHaulerDispatch || currentGameDate < GameState.player.lastColonyHaulerDispatch) {
            GameState.player.lastColonyHaulerDispatch = currentGameDate;
        }
        lastColonyHaulerDispatch = GameState.player.lastColonyHaulerDispatch;
    } else if (lastColonyHaulerDispatch === 0 || currentGameDate < lastColonyHaulerDispatch) {
        lastColonyHaulerDispatch = currentGameDate;
    }

    if (currentGameDate - lastColonyHaulerDispatch < HAULER_DISPATCH_INTERVAL) return;

    // Cap active colony haulers at 1 at a time
    const existingHauler = EntityManager.entities.some(e => e && e.isColonyHauler);
    if (existingHauler) return;

    const eligibleColonies = Object.values(playerColonies).filter(c => c && c.established && c.population >= 250);
    if (eligibleColonies.length === 0) return;

    lastColonyHaulerDispatch = currentGameDate;
    if (typeof GameState !== 'undefined' && GameState.player) {
        GameState.player.lastColonyHaulerDispatch = currentGameDate;
    }

    const sourceColony = eligibleColonies[Math.floor(Math.random() * eligibleColonies.length)];
    const fallbackX = (typeof MAP_WIDTH !== 'undefined' ? MAP_WIDTH : 40) - 7;
    const fallbackY = (typeof MAP_HEIGHT !== 'undefined' ? MAP_HEIGHT : 22) - 5;
    const destStation = typeof findNearestStation === 'function'
        ? findNearestStation(sourceColony.x, sourceColony.y)
        : { name: "Starbase Alpha", x: fallbackX, y: fallbackY };

    const destLocData = (typeof LOCATIONS_DATA !== 'undefined' && destStation && LOCATIONS_DATA[destStation.name])
        ? LOCATIONS_DATA[destStation.name]
        : null;

    EntityManager.add({
        x: sourceColony.x,
        y: sourceColony.y,
        targetX: destStation.x,
        targetY: destStation.y,
        destName: destStation.name,
        destFaction: destLocData ? (destLocData.faction || 'INDEPENDENT') : 'CONCORD',
        sourceColonyId: sourceColony.id || null,
        name: `${sourceColony.name} Trade Convoy`,
        char: "=",
        color: "#FFD700",
        glowColor: "#FFD700",
        state: "TRADE_ROUTE",
        isNPC: true,
        isColonyHauler: true,
        hasSensorCone: true,
        desc: `An armored colonial freighter hauling surplus goods from ${sourceColony.name} to ${destStation.name}.`,
        hails: [
            `Colonial convoy en route to ${destStation.name}. Keep the lane clear of pirates, Governor!`,
            `Hauling tariff cargo from ${sourceColony.name}. Shields at maximum.`
        ]
    });

    logMessage(`<span style='color:var(--gold-text)'>[ COLONY LOGISTICS ]</span> <b>${_mechEscapeHtml(sourceColony.name)}</b> launched a Trade Convoy toward <b>${_mechEscapeHtml(destStation.name)}</b>.`);
}

// ==========================================
// --- PUBLIC MECHANICS UTILITY API ---
// ==========================================

const MechanicsUtils = {
    getWarFrontStatus() {
        const offsets = (typeof GameState !== 'undefined' && GameState.world && GameState.world.factionOffsets)
            ? GameState.world.factionOffsets
            : { ECLIPSE: -22, KTHARR: 22 };
        return {
            eclipseFront: offsets.ECLIPSE,
            ktharrFront: offsets.KTHARR,
            eclipseAdvancing: offsets.ECLIPSE > -22,
            ktharrAdvancing: offsets.KTHARR < 22
        };
    },
    getNextPaydayCountdown() {
        if (typeof currentGameDate === 'undefined') return PAYDAY_INTERVAL;
        const ref = (typeof GameState !== 'undefined' && GameState.player && typeof GameState.player.lastPayday === 'number')
            ? GameState.player.lastPayday
            : lastPayday;
        return Math.max(0, parseFloat((PAYDAY_INTERVAL - (currentGameDate - ref)).toFixed(1)));
    },
    getActiveTrafficSummary() {
        return EntityManager.countByType();
    },
    registerEncounter(id, def) {
        if (!id || !def || !Array.isArray(def.choices)) return false;
        def.id = id;
        if (window.ENCOUNTER_DATABASE) window.ENCOUNTER_DATABASE[id] = def;
        if (typeof ENCOUNTER_DATABASE !== 'undefined' && ENCOUNTER_DATABASE && ENCOUNTER_DATABASE !== window.ENCOUNTER_DATABASE) {
            ENCOUNTER_DATABASE[id] = def;
        }
        return true;
    },
    triggerRandomEncounter,
    triggerNebulaEvent
};
window.MechanicsUtils = MechanicsUtils;

// ==========================================
// --- 2. MASTER TICK LISTENER ---
// ==========================================

if (typeof GameBus !== 'undefined' && !window._mechanicsTickRegistered) {
    window._mechanicsTickRegistered = true;

    GameBus.on('TICK_PROCESSED', (data) => {
        if (!data || data.interrupt) return;

        const { isMovement } = data;

        // --- A. GATHER LOCAL DATA ONCE ---
        const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        const tileChar = loc ? getTileChar(loc) : null;

        // --- B. CREW PAYDAY (Timer based, synced to GameState & Loyalty) ---
        if (typeof GameState !== 'undefined' && GameState.player) {
            if (!GameState.player.lastPayday || currentGameDate < GameState.player.lastPayday) {
                GameState.player.lastPayday = currentGameDate;
            }
            lastPayday = GameState.player.lastPayday;
        } else if (lastPayday === 0 || currentGameDate < lastPayday) {
            lastPayday = currentGameDate;
        }

        if (typeof playerCrew !== 'undefined' && playerCrew.length > 0) {
            if (currentGameDate - lastPayday >= PAYDAY_INTERVAL) {
                lastPayday = currentGameDate;
                if (typeof GameState !== 'undefined' && GameState.player) {
                    GameState.player.lastPayday = currentGameDate;
                }
                const totalCost = playerCrew.length * COST_PER_CREW;

                if (playerCredits >= totalCost) {
                    playerCredits -= totalCost;
                    // On-time pay builds crew morale (+3% Loyalty)
                    playerCrew.forEach(c => {
                        if (c && typeof c.loyalty === 'number') {
                            c.loyalty = Math.min(100, c.loyalty + 3);
                        }
                    });
                    logMessage(`<span style="color:var(--item-desc-color)">[ ACCOUNTING ] Crew salaries automatically deducted: -${formatNumber(totalCost)}c. (Morale steady)</span>`);
                    GameBus.emit('UI_REFRESH_REQUESTED');
                } else {
                    logMessage(`<span style="color:var(--danger); font-weight:bold;">[ MUTINY RISK ]</span> You missed Payday! The crew is furious.`);
                    if (typeof showToast === 'function') showToast("MISSED CREW PAYDAY", "error");

                    // Missed pay hurts crew loyalty (-15%)
                    playerCrew.forEach(c => {
                        if (c) {
                            const cur = typeof c.loyalty === 'number' ? c.loyalty : 50;
                            c.loyalty = Math.max(0, cur - 15);
                        }
                    });

                    if (Math.random() < 0.30) {
                        // Least-loyal crew member walks out first
                        let quitterIndex = 0;
                        let lowestLoyalty = Infinity;
                        playerCrew.forEach((c, idx) => {
                            const loy = (c && typeof c.loyalty === 'number') ? c.loyalty : 50;
                            if (loy < lowestLoyalty) {
                                lowestLoyalty = loy;
                                quitterIndex = idx;
                            }
                        });
                        const quitter = playerCrew[quitterIndex];
                        logMessage(`<span style="color:var(--danger)">${_mechEscapeHtml(quitter.name)} packed their bags and took the escape pod. You lost your ${_mechEscapeHtml(quitter.role)}!</span>`);
                        playerCrew.splice(quitterIndex, 1);

                        // BUG FIX: Recalculate Eclipse mercenary flag if the quitter was a mercenary
                        window.hasEclipseMerc = playerCrew.some(c => c && c.isMercenary);
                        if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
                    }
                }
                if (typeof autoSaveGame === 'function') autoSaveGame();
            }
        }

        // --- C. MODULAR WAR ENGINE (0.5% chance on movement) ---
        if (isMovement && Math.random() < 0.005 && typeof GameState !== 'undefined' && GameState.world) {
            if (!GameState.world.factionOffsets) {
                GameState.world.factionOffsets = { ECLIPSE: -22, KTHARR: 22 };
            }
            const isKtharrFront = Math.random() > 0.5;
            const aggressorWins = Math.random() > 0.5;
            const offsets = GameState.world.factionOffsets;

            if (isKtharrFront) {
                if (aggressorWins && offsets.KTHARR > 10) {
                    offsets.KTHARR -= 1;
                    logMessage(`<span style='color:var(--danger); font-weight:bold'>[ WAR ALERT ]</span> The K'tharr Hegemony has seized a Concord border sector (Eastern Front now at Macro-Sector ${offsets.KTHARR})!`);
                } else if (!aggressorWins && offsets.KTHARR < 35) {
                    offsets.KTHARR += 1;
                    logMessage(`<span style='color:var(--accent-color); font-weight:bold'>[ WAR ALERT ]</span> Concord Aegis fleets have pushed the K'tharr back to Macro-Sector ${offsets.KTHARR}.`);
                }
            } else {
                if (aggressorWins && offsets.ECLIPSE < -10) {
                    offsets.ECLIPSE += 1;
                    logMessage(`<span style='color:#9933FF; font-weight:bold'>[ WAR ALERT ]</span> The Eclipse Cartel has corrupted a Concord border world (Shadow Front now at Macro-Sector ${offsets.ECLIPSE}).`);
                } else if (!aggressorWins && offsets.ECLIPSE > -35) {
                    offsets.ECLIPSE -= 1;
                    logMessage(`<span style='color:var(--accent-color); font-weight:bold'>[ WAR ALERT ]</span> Concord Marines have raided an Eclipse shadow-port, pushing Cartel influence back to Macro-Sector ${offsets.ECLIPSE}.`);
                }
            }
            if (typeof render === 'function') render();
        }

        // --- D. COLONY TRADE ROUTE DISPATCH ---
        checkColonyHaulerDispatch();

        // --- E. NATIVE ECS ENGINE UPDATE ---
        EntityManager.tick(isMovement, data);
        if (data.interrupt) return;

        // --- F. NEBULA EVENTS (5% chance if moving in Nebula) ---
        if (isMovement && tileChar === '~' && Math.random() < 0.05 && !isPlayerBusyInModalOrCombat()) {
            triggerNebulaEvent();
            if (typeof playerHull !== 'undefined' && playerHull <= 0) {
                data.interrupt = true;
                return;
            }
        }

        // --- G. DEEP SPACE ENCOUNTERS (0.15% chance if moving in Empty Space; reduced if stealthed) ---
        const encounterChance = (typeof isSilentRunning !== 'undefined' && isSilentRunning) ? 0.0004 : 0.0015;
        if (isMovement && tileChar === '.' && Math.random() < encounterChance && !isPlayerBusyInModalOrCombat()) {
            if (typeof triggerRandomEncounter === 'function') {
                triggerRandomEncounter();
                data.interrupt = true;
                return;
            }
        }

        // --- H. SPAWN UNIDENTIFIED SIGNAL SOURCES (USS) ---
        const activeUSSCount = EntityManager.entities.filter(e => e && e.isUSS).length;
        if (isMovement && activeUSSCount < 3 && Math.random() < 0.02) {
            const dist = 8 + Math.floor(Math.random() * 12);
            const angle = Math.random() * Math.PI * 2;
            const ux = Math.floor(playerX + Math.cos(angle) * dist);
            const uy = Math.floor(playerY + Math.sin(angle) * dist);

            const targetTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(ux, uy) : '.';
            const targetChar = typeof getTileChar === 'function' ? getTileChar(targetTile) : targetTile;

            if (targetChar === '.') {
                EntityManager.add({
                    x: ux,
                    y: uy,
                    char: '✧', color: '#FFFFFF', glowColor: '#FFFFFF', pulseSpeed: 600,
                    isUSS: true, lifespan: 50
                });

                if ((typeof hasCrewPerk === 'function' && hasCrewPerk('ASTROMETRICS')) || _hasPlayerPerk('LONG_RANGE_SENSORS')) {
                    logMessage("<span style='color:var(--accent-color)'>[ SENSORS ] Unidentified Signal Source (USS) detected at [" + ux + ", " + (-uy) + "].</span>");
                }
            }
        }
    });
}

// --- END OF FILE mechanics.js ---
