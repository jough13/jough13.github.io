// --- START OF FILE locations.js ---

// ==========================================
// --- INTERNAL LOCATION HELPERS ---
// ==========================================

function _locSafeAddCargo(itemId, qty) {
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

function _locRecordDiscovery(name, extraLoreKeys = []) {
    if (!name) return false;
    let newlyDiscovered = false;

    if (typeof discoveredLocations !== 'undefined' && discoveredLocations.has && !discoveredLocations.has(name)) {
        discoveredLocations.add(name);
        newlyDiscovered = true;
        const discXP = typeof XP_PER_LOCATION_DISCOVERY !== 'undefined' ? XP_PER_LOCATION_DISCOVERY : 10;
        if (typeof playerXP !== 'undefined') playerXP += discXP;
        if (typeof showToast === 'function') showToast(`DISCOVERED: ${name.toUpperCase()} (+${discXP} XP)`, "success");
    }

    if (typeof unlockLoreEntry === 'function') {
        const normKey = `LOCATION_${name.replace(/[\s-]+/g, '_').toUpperCase()}`;
        unlockLoreEntry(normKey);
        extraLoreKeys.forEach(k => unlockLoreEntry(k));
    }

    return newlyDiscovered;
}

// ==========================================
// --- LOCATIONS DATABASE ---
// ==========================================

const LOCATIONS_DATA = {
    "Starbase Alpha": {
        name: "Starbase Alpha",
        coords: {
            y: MAP_HEIGHT - 5,
            x: MAP_WIDTH - 7
        },
        type: STARBASE_CHAR_VAL,
        char: STARBASE_CHAR_VAL,
        isMajorHub: true,
        faction: "CONCORD",
        sells: [
            { id: "FUEL_CELLS", priceMod: 0.9, stock: 100 },
            { id: "NANO_REPAIR_KIT", priceMod: 1.0, stock: 15 },
            { id: "MINING_DRONE", priceMod: 1.0, stock: 10 },
            { id: "MINING_DRONE_MK2", priceMod: 1.0, stock: 5 },
            { id: "TECH_PARTS", priceMod: 1.1, stock: 30 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.0, stock: 25 },
            { id: "NAVIGATION_CHARTS", priceMod: 1.0, stock: 50 },
            { id: "CYBERNETIC_IMPLANTS", priceMod: 1.2, stock: 15 },
            { id: "DROID_SERVOS", priceMod: 1.0, stock: 40 },
            { id: "WATER", priceMod: 1.0, stock: 80 },
            // --- COLONY & STATION BUILDER SUPPLIES ---
            { id: "COLONY_CHARTER", priceMod: 1.0, stock: 3 },
            { id: "STATION_CORE", priceMod: 1.0, stock: 1 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.2, stock: 15 },
            { id: "MINERALS", priceMod: 1.2, stock: 80 },
            { id: "FOOD_SUPPLIES", priceMod: 1.1, stock: 60 },
            { id: "RARE_METALS", priceMod: 1.3, stock: 25 },
            { id: "REFINED_ALLOY", priceMod: 1.2, stock: 30 },
            { id: "ARTIFACT_SHARDS", priceMod: 1.5, stock: 10 },
            { id: "XENO_ANTIQUES", priceMod: 1.8, stock: 5 },
            { id: "PRECURSOR_DATACUBE", priceMod: 2.5, stock: 3 },
            { id: "VOID_CRYSTALS", priceMod: 1.6, stock: 8 },
            { id: "GENETIC_SAMPLES", priceMod: 1.4, stock: 15 },
            { id: "FORBIDDEN_TEXTS", priceMod: 0.7, stock: 5 },
            { id: "PHASE_SHIFTED_ALLOY", priceMod: 3.0, stock: 3 },
            { id: "WAYFINDER_CORE", priceMod: 5.0, stock: 1 },
            { id: "SENTIENT_MYCELIUM", priceMod: 1.2, stock: 8 },
            { id: "PRECURSOR_STAR_MAP_FRAGMENT", priceMod: 4.0, stock: 3 },
            { id: "KTHARR_ANCESTRAL_BLADE", priceMod: 0.5, stock: 3 },
            { id: "GOLD", priceMod: 1.1, stock: 30 },
            { id: "PLATINUM_ORE", priceMod: 1.2, stock: 25 },
            { id: "HYDROGEN_3", priceMod: 2.0, stock: 15 },
            { id: "ANCIENT_WINE", priceMod: 1.5, stock: 10 }
        ],
        factory: {
            consumes: "MINERALS",
            produces: "TECH_PARTS",
            consumeQty: 5,
            produceQty: 2
        },
        scanFlavor: "Starbase Alpha: Major Concord trade hub. Bustling with merchant traffic and heavily patrolled by Concord security drones."
    },

    "The Rusty Anchor": {
        name: "The Rusty Anchor",
        coords: {
            y: MAP_HEIGHT - 3,
            x: MAP_WIDTH - 15
        },
        type: STARBASE_CHAR_VAL,
        char: STARBASE_CHAR_VAL,
        displayChar: "§",
        customColor: "#9C27B0",
        isMajorHub: true,
        faction: "INDEPENDENT",
        isBlackMarket: true,
        sells: [
            { id: "DISCOUNT_CYBERSERVOS", priceMod: 0.7, stock: 25 },
            { id: "PROHIBITED_STIMS", priceMod: 0.9, stock: 12 },
            { id: "SENSOR_DECOY", priceMod: 0.95, stock: 8 },
            { id: "FROTHY_MOON_ALE", priceMod: 1.0, stock: 30 },
            { id: "UNSHACKLED_AI", priceMod: 1.5, stock: 1 }
        ],
        buys: [
            { id: "MEDICAL_SUPPLIES", priceMod: 2.0, stock: 50 },
            { id: "TECH_PARTS", priceMod: 1.5, stock: 30 },
            { id: "STOLEN_CONCORD_MEDALS", priceMod: 2.2, stock: 20 },
            { id: "ILLEGAL_ORGANS", priceMod: 1.8, stock: 10 },
            { id: "STARDUST_EXOTICA", priceMod: 1.4, stock: 15 }
        ],
        factory: {
            consumes: "MEDICAL_SUPPLIES",
            produces: "PROHIBITED_STIMS",
            consumeQty: 3,
            produceQty: 2
        },
        scanFlavor: "A dubious cantina built into a hollowed-out asteroid. Scanners show high concentrations of illegal substances. A garbled transmission repeats on loop: 'We don't take kindly to Concord lapdogs here.'"
    },

    "Aegis Dyson Sphere": {
        name: "Aegis Dyson Sphere",
        coords: { y: 7, x: 7 },
        type: PLANET_CHAR_VAL,
        char: PLANET_CHAR_VAL,
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "MINERALS", priceMod: 0.8, stock: 500 },
            { id: "FOOD_SUPPLIES", priceMod: 0.8, stock: 300 },
            { id: "WATER", priceMod: 0.8, stock: 300 },
            { id: "TECH_PARTS", priceMod: 0.9, stock: 150 },
            { id: "REFINED_ALLOY", priceMod: 0.9, stock: 80 },
            { id: "ATMOSPHERIC_PROCESSORS", priceMod: 0.9, stock: 40 },
            { id: "COMBAT_DRONE_MK1", priceMod: 1.0, stock: 8 },
            { id: "LUXURY_GOODS", priceMod: 1.0, stock: 50 },
            { id: "MERCENARY_PLATOON", priceMod: 1.1, stock: 5 }
        ],
        buys: [
            { id: "RARE_METALS", priceMod: 1.3, stock: 50 },
            { id: "VOID_CRYSTALS", priceMod: 1.5, stock: 15 },
            { id: "HYDROGEN_3", priceMod: 1.2, stock: 30 },
            { id: "QUANTUM_FLUID", priceMod: 1.4, stock: 25 },
            { id: "AI_CORE", priceMod: 1.3, stock: 10 },
            { id: "QUANTUM_LENS", priceMod: 1.4, stock: 15 }
        ],
        factory: {
            consumes: "RARE_METALS",
            produces: "REFINED_ALLOY",
            consumeQty: 4,
            produceQty: 3
        },
        scanFlavor: "Aegis Dyson Sphere: The glittering crown jewel of the Concord. A breathtaking megastructure encasing a captured G-type star."
    },

    "Alien Obelisk": {
        name: "Obsidian Obelisk",
        coords: { x: -20, y: 35 },
        type: 'location',
        char: 'I',
        displayChar: 'Ψ',
        customColor: "#9933FF",
        scanFlavor: "An ancient, monolithic spire floating in deep space. Its geometric trenches pulse with residual Precursor energy.",
        onInteract: function(tileObj) {
            _locRecordDiscovery("Obsidian Obelisk", ["XENO_PRECURSORS", "LOCATION_OBSIDIAN_OBELISK"]);
            if (typeof TILE_INTERACTIONS !== 'undefined' && TILE_INTERACTIONS['I']) {
                const def = TILE_INTERACTIONS['I'];
                if (def.log) logMessage(def.log);
                const acts = typeof def.actions === 'function' ? def.actions(tileObj) : (def.actions || []);
                if (typeof renderContextualActions === 'function') renderContextualActions(acts);
                return;
            }
            logMessage("<span style='color:#9933FF'>The Obsidian Obelisk hums with dormant Precursor energy.</span>");
        }
    },

    "Sanctuary of the Void": {
        name: "Sanctuary of the Void",
        coords: { x: 39, y: -17 }, // Matches Encrypted Engram hint: Sector [39, 17]
        type: 'location',
        char: 'S', // BUG FIX: Distinct char avoids colliding with generic TILE_INTERACTIONS['Ψ']
        displayChar: 'Ψ',
        customColor: "#00E0E0",
        scanFlavor: "Sanctuary of the Void: A ring of crystalline Precursor pylons at coordinates [39, 17], resonating with subspace telemetry from the ancient hyperlane network.",
        getLandmarkActions: function(tileObj) {
            if (tileObj && tileObj.studied) {
                return [
                    {
                        label: 'Meditate in Harmonics (+Shields)',
                        key: 'e',
                        onclick: () => {
                            if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;
                            logMessage("<span style='color:var(--accent-color)'>[ SANCTUARY ] Your deflector grid harmonizes with the Precursor pylons. Shields restored to 100%.</span>");
                            if (typeof soundManager !== 'undefined') soundManager.playScan();
                            if (typeof renderUIStats === 'function') renderUIStats();
                        }
                    }
                ];
            }
            return [
                {
                    label: 'Synchronize Nav-Computer',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        const xp = 350;
                        playerXP += xp;
                        if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;

                        const gotFrag = _locSafeAddCargo('PRECURSOR_STAR_MAP_FRAGMENT', 1);
                        const gotCore = _locSafeAddCargo('PRECURSOR_NAV_CORE', 1);
                        const drops = [];
                        if (gotFrag > 0) drops.push("<b>1x Star Map Fragment</b>");
                        if (gotCore > 0) drops.push("<b>1x Precursor Nav-Core</b>");
                        const lootText = drops.length > 0
                            ? ` Materialized ${drops.join(' & ')}!`
                            : " <span style='color:var(--warning)'>(Cargo hold full — physical relics dissipated!)</span>";

                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        }
                        if (tileObj) tileObj.studied = true;

                        logMessage(`<span style='color:var(--success)'>[ CONDUIT SYNCHRONIZED ]</span> Downloaded ancient hyperlane telemetry (+${xp} XP).${lootText}`);
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                        if (typeof showToast === 'function') showToast("PRECURSOR CACHE UNLOCKED", "success");

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["Sanctuary of the Void"].getLandmarkActions(tileObj));
                        }
                    }
                }
            ];
        },
        onInteract: function(tileObj) {
            _locRecordDiscovery("Sanctuary of the Void", ["XENO_PRECURSORS", "LOCATION_SANCTUARY_OF_THE_VOID"]);
            if (tileObj && tileObj.studied) {
                logMessage("<span style='color:var(--accent-color)'>[ SANCTUARY OF THE VOID ]</span> The Precursor pylons hum quietly, recharging your shields. Their star-charts have already been downloaded.");
                if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;
            } else {
                logMessage("<span style='color:#00E0E0; font-weight:bold;'>[ PRECURSOR CONDUIT LOCATED ]</span> You followed the Encrypted Engram coordinates to [39, 17]! Holographic star-paths flood your cockpit.");
            }
            if (typeof renderContextualActions === 'function') {
                renderContextualActions(this.getLandmarkActions(tileObj));
            }
        }
    },

    "Choir Spire Alpha": {
        name: "Choir Spire Alpha",
        coords: { x: -115, y: 145 },
        type: 'location',
        char: 'C',
        displayChar: 'Ψ',
        customColor: "#DDA0DD",
        scanFlavor: "Choir Spire Alpha: A silent, crystal-encrusted pilgrimage reliquary tended by the Children of the Void. Subspace hymns resonate across every open comms frequency.",
        getLandmarkActions: function(tileObj) {
            const acts = [];
            if (!tileObj || !tileObj.studied) {
                acts.push({
                    label: 'Commune with the Choir',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        playerXP += 160;
                        if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;
                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        }
                        if (tileObj) tileObj.studied = true;
                        logMessage("<span style='color:#DDA0DD'>[ CHOIR SPIRE ]</span> Harmonic chants wash over your hull. Shields maximized (+160 XP). The High Cantor whispers of a silent relay far to the northeast...");
                        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                        if (typeof showToast === 'function') showToast("VOID COMMUNION (+160 XP)", "success");
                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["Choir Spire Alpha"].getLandmarkActions(tileObj));
                        }
                    }
                });
            }
            acts.push({
                label: 'Offer 1x Void Crystal',
                key: 'x',
                onclick: () => {
                    if (typeof playerCargo === 'undefined' || (playerCargo['VOID_CRYSTALS'] || 0) < 1) {
                        if (typeof showToast === 'function') showToast("REQUIRES 1x VOID CRYSTAL", "warning");
                        if (typeof soundManager !== 'undefined') soundManager.playError();
                        return;
                    }
                    playerCargo['VOID_CRYSTALS'] -= 1;
                    if (playerCargo['VOID_CRYSTALS'] <= 0) delete playerCargo['VOID_CRYSTALS'];
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

                    playerXP += 200;
                    if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;
                    if (typeof MAX_PLAYER_HULL !== 'undefined') playerHull = MAX_PLAYER_HULL;

                    const giftId = Math.random() < 0.55 ? 'ENCRYPTED_ENGRAM' : 'PRECURSOR_CIPHER';
                    const added = _locSafeAddCargo(giftId, 1);
                    const giftName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[giftId]) ? COMMODITIES[giftId].name : giftId;

                    logMessage(`<span style='color:#DDA0DD; font-weight:bold;'>[ OFFERING ACCEPTED ]</span> The Spire flares violet! Hull & Shields fully restored (+200 XP)${added > 0 ? ` and bestowed <b>1x ${giftName}</b>` : ''}.`);
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    if (typeof showToast === 'function') showToast("CHOIR BLESSING GRANTED", "success");
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            });
            acts.push({
                label: 'Listen to Star-Hymns',
                key: 'v',
                onclick: () => {
                    const clues = [
                        "\"The Archivist watches from the hull graveyard at [-240, -260].\"",
                        "\"A crystalline Precursor conduit still sings at [39, 17].\"",
                        "\"At the edge of the Silentium Expanse [280, 240], Relay Zero remembers the First Chord.\""
                    ];
                    const msg = clues[Math.floor(Math.random() * clues.length)];
                    logMessage(`<span style='color:#DDA0DD'>[ CHOIR WHISPER ]</span> <i>${msg}</i>`);
                    if (typeof soundManager !== 'undefined') soundManager.playScan();
                }
            });
            return acts;
        },
        onInteract: function(tileObj) {
            _locRecordDiscovery("Choir Spire Alpha", ["FACTION_CHILDREN_OF_THE_VOID", "PHENOMENON_VOID_CRYSTALS"]);
            logMessage("<span style='color:#DDA0DD'>[ CHOIR SPIRE ALPHA ]</span> A crystalline cathedral of the Children of the Void drifts before you, singing softly across subspace.");
            if (typeof renderContextualActions === 'function') {
                renderContextualActions(this.getLandmarkActions(tileObj));
            }
        }
    },

    "Silentium Relay Zero": {
        name: "Silentium Relay Zero",
        coords: { x: 280, y: -240 },
        type: 'location',
        char: 'R',
        displayChar: 'Ψ',
        customColor: "#40E0D0",
        scanFlavor: "Silentium Relay Zero: The outermost automated Precursor warning buoy bordering the Silentium Expanse. Its harmonic core pulses with coordinates from before human history.",
        getLandmarkActions: function(tileObj) {
            const acts = [];
            if (!tileObj || !tileObj.studied) {
                acts.push({
                    label: 'Download Precursor Archive',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        const xp = 400;
                        playerXP += xp;
                        const gotArchive = _locSafeAddCargo('ANCIENT_ARCHIVE', 1);
                        const gotFrag = _locSafeAddCargo('PRECURSOR_STAR_MAP_FRAGMENT', 1);
                        const lootParts = [];
                        if (gotArchive > 0) lootParts.push("<b>1x Ancient Archive</b>");
                        if (gotFrag > 0) lootParts.push("<b>1x Star Map Fragment</b>");

                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        }
                        if (tileObj) tileObj.studied = true;

                        logMessage(`<span style='color:#40E0D0; font-weight:bold;'>[ RELAY ZERO DECODED ]</span> Final Precursor telemetry before the Great Silence downloaded (+${xp} XP)${lootParts.length > 0 ? `. Recovered ${lootParts.join(' & ')}` : ''}!`);
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                        if (typeof showToast === 'function') showToast("SILENTIUM ARCHIVE SECURED", "success");

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["Silentium Relay Zero"].getLandmarkActions(tileObj));
                        }
                    }
                });
            }
            acts.push({
                label: 'Ping Wayfinder Core',
                key: 'v',
                onclick: () => {
                    if (typeof playerCargo !== 'undefined' && (playerCargo['WAYFINDER_CORE'] || 0) > 0) {
                        if (typeof mystery_first_nexus_location !== 'undefined' && !mystery_first_nexus_location) {
                            const seed = typeof WORLD_SEED !== 'undefined' ? WORLD_SEED : 1337;
                            const dist = 500 + Math.floor((typeof seededRandom === 'function' ? seededRandom(seed) : Math.random()) * 500);
                            const angle = (typeof seededRandom === 'function' ? seededRandom(seed + 1) : Math.random()) * Math.PI * 2;
                            mystery_first_nexus_location = {
                                x: Math.floor(Math.cos(angle) * dist),
                                y: Math.floor(Math.sin(angle) * dist)
                            };
                        }
                        if (typeof mystery_first_nexus_location !== 'undefined' && mystery_first_nexus_location) {
                            logMessage(`<span style='color:#40E0D0; font-weight:bold;'>[ NEXUS VECTOR CONFIRMED ]</span> Relay Zero locks onto your Wayfinder Core: <b>The First Nexus</b> lies at [${mystery_first_nexus_location.x}, ${-mystery_first_nexus_location.y}].`);
                        }
                    } else {
                        logMessage("<span style='color:var(--item-desc-color)'>[ RELAY ZERO ]</span> The relay waits for a Wayfinder Core to complete its triangulation chord.");
                    }
                    if (typeof soundManager !== 'undefined') soundManager.playScan();
                }
            });
            return acts;
        },
        onInteract: function(tileObj) {
            _locRecordDiscovery("Silentium Relay Zero", ["REGION_SILENTIUM_EXPANSE", "PRECURSOR_ORIGINS", "XENO_PRECURSORS"]);
            logMessage("<span style='color:#40E0D0; font-weight:bold;'>[ SILENTIUM RELAY ZERO ]</span> An ancient cyan Precursor beacon hangs at the brink of the Silentium Expanse, repeating a lone harmonic distress chord.");
            if (typeof renderContextualActions === 'function') {
                renderContextualActions(this.getLandmarkActions(tileObj));
            }
        }
    },

    "Planet Xerxes": {
        name: "Planet Xerxes",
        coords: {
            y: 3,
            x: MAP_WIDTH - 5
        },
        type: PLANET_CHAR_VAL,
        char: PLANET_CHAR_VAL,
        faction: "INDEPENDENT",
        isBlackMarket: true,
        sells: [
            { id: "DISCOUNT_CYBERSERVOS", priceMod: 0.8, stock: 15 },
            { id: "OBSIDIAN_TEAR_PLATING", priceMod: 1.1, stock: 5 },
            { id: "LIVING_HULL_TISSUE", priceMod: 0.9, stock: 3 },
            { id: "STARDUST_EXOTICA", priceMod: 1.0, stock: 8 },
            { id: "PRECURSOR_CIPHER", priceMod: 1.2, stock: 5 },
            { id: "SENSOR_DECOY", priceMod: 0.9, stock: 10 },
            { id: "WAYFINDER_CORE", priceMod: 1.0, stock: 1 }
        ],
        buys: [
            { id: "PRECURSOR_NAV_CORE", priceMod: 2.5, stock: 5 },
            { id: "SENTIENT_MYCELIUM", priceMod: 1.8, stock: 15 },
            { id: "VOID_CRYSTALS", priceMod: 1.7, stock: 20 },
            { id: "ANCIENT_RELICS", priceMod: 2.0, stock: 10 },
            { id: "PRECURSOR_ARTIFACT", priceMod: 1.8, stock: 5 }
        ],
        scanFlavor: "Planet Xerxes: Extreme environment, corrosive atmosphere, and crushing gravity. High Xenon Gas and heavy metal concentrations make it valuable, but deadly. Rumored pirate haven and site of ancient K'tharr ruins."
    },

    // ==========================================
    // --- DEEP SPACE FACTION & LORE HUBS ---
    // ==========================================

    "Karak-Tor": {
        name: "Karak-Tor",
        coords: {
            y: 485,
            x: 420
        },
        type: PLANET_CHAR_VAL,
        char: PLANET_CHAR_VAL,
        faction: "KTHARR",
        isMajorHub: true,
        sells: [
            { id: "KTHARR_ANCESTRAL_BLADE", priceMod: 0.8, stock: 5 },
            { id: "KTHARR_SPICES", priceMod: 0.7, stock: 40 },
            { id: "MINERALS", priceMod: 0.9, stock: 150 },
            { id: "WEAPONS", priceMod: 0.8, stock: 60 },
            { id: "LIVING_HULL_TISSUE", priceMod: 1.1, stock: 10 },
            { id: "MERCENARY_PLATOON", priceMod: 0.9, stock: 12 },
            { id: "ASSAULT_MECH", priceMod: 1.0, stock: 4 }
        ],
        buys: [
            { id: "FOOD_SUPPLIES", priceMod: 1.8, stock: 200 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.5, stock: 50 },
            { id: "CYBERNETIC_IMPLANTS", priceMod: 1.3, stock: 20 },
            { id: "GENETIC_SAMPLES", priceMod: 1.6, stock: 30 },
            { id: "REFINED_ALLOY", priceMod: 1.4, stock: 50 }
        ],
        factory: {
            consumes: "REFINED_ALLOY",
            produces: "WEAPONS",
            consumeQty: 4,
            produceQty: 3
        },
        scanFlavor: "Karak-Tor: A brutal, volcanic world claimed by the K'tharr Hegemony. Massive atmospheric forges burn day and night. Scanners detect intense localized energy spikes—likely the infamous Proving Grounds."
    },

    "Fortress Drakon": {
        name: "Fortress Drakon",
        coords: {
            y: -75,
            x: 195
        },
        type: STARBASE_CHAR_VAL,
        char: STARBASE_CHAR_VAL,
        displayChar: "#",
        customColor: "#4CAF50",
        faction: "KTHARR",
        isMajorHub: true,
        sells: [
            { id: "WEAPONS", priceMod: 0.85, stock: 80 },
            { id: "KTHARR_SPICES", priceMod: 0.8, stock: 35 },
            { id: "MERCENARY_PLATOON", priceMod: 1.0, stock: 8 },
            { id: "ASSAULT_MECH", priceMod: 1.1, stock: 2 },
            { id: "NANO_REPAIR_KIT", priceMod: 1.0, stock: 20 },
            { id: "FUEL_CELLS", priceMod: 1.0, stock: 120 }
        ],
        buys: [
            { id: "REFINED_ALLOY", priceMod: 1.5, stock: 60 },
            { id: "FOOD_SUPPLIES", priceMod: 1.6, stock: 100 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.5, stock: 50 },
            { id: "KTHARR_ANCESTRAL_BLADE", priceMod: 2.2, stock: 10 },
            { id: "RARE_METALS", priceMod: 1.4, stock: 40 }
        ],
        factory: {
            consumes: "RARE_METALS",
            produces: "WEAPONS",
            consumeQty: 3,
            produceQty: 2
        },
        scanFlavor: "Fortress Drakon: The primary K'tharr Ascendancy border bastion guarding the eastern approaches. Warlords gather here to outfit assault fleets and reward outlanders bold enough to return lost Ancestral Blades."
    },

    "Station Umbra": {
        name: "Station Umbra",
        coords: {
            y: -150,
            x: -450
        },
        type: STARBASE_CHAR_VAL,
        char: STARBASE_CHAR_VAL,
        faction: "ECLIPSE",
        isMajorHub: true,
        isBlackMarket: true,
        sells: [
            { id: "FORBIDDEN_TEXTS", priceMod: 1.2, stock: 5 },
            { id: "PHASE_SHIFTED_ALLOY", priceMod: 1.5, stock: 2 },
            { id: "UNSHACKLED_AI", priceMod: 1.2, stock: 3 },
            { id: "PROHIBITED_STIMS", priceMod: 0.8, stock: 20 },
            { id: "STARDUST_EXOTICA", priceMod: 0.9, stock: 10 },
            { id: "OBSIDIAN_TEAR_PLATING", priceMod: 1.0, stock: 6 },
            { id: "SENSOR_DECOY", priceMod: 0.85, stock: 12 },
            { id: "MERCENARY_PLATOON", priceMod: 1.0, stock: 10 },
            { id: "ASSAULT_MECH", priceMod: 1.2, stock: 2 }
        ],
        buys: [
            { id: "FUEL_CELLS", priceMod: 1.6, stock: 100 },
            { id: "TECH_PARTS", priceMod: 1.3, stock: 50 },
            { id: "GOLD", priceMod: 1.2, stock: 40 },
            { id: "WEAPONS", priceMod: 1.5, stock: 40 },
            { id: "AI_CORE", priceMod: 1.6, stock: 10 }
        ],
        factory: {
            consumes: "TECH_PARTS",
            produces: "OBSIDIAN_TEAR_PLATING",
            consumeQty: 6,
            produceQty: 1
        },
        scanFlavor: "Station Umbra: A heavily cloaked Eclipse Cartel listening post on the galactic rim. You are receiving encrypted hails offering high payouts for stolen goods and access to shadow brokers. Keep your shields up."
    },

    "Port Erebus": {
        name: "Port Erebus",
        coords: {
            y: 80,
            x: -175
        },
        type: STARBASE_CHAR_VAL,
        char: STARBASE_CHAR_VAL,
        displayChar: "§",
        customColor: "#9933FF",
        faction: "ECLIPSE",
        isMajorHub: true,
        isBlackMarket: true,
        sells: [
            { id: "PROHIBITED_STIMS", priceMod: 0.85, stock: 18 },
            { id: "SENSOR_DECOY", priceMod: 0.9, stock: 10 },
            { id: "STARDUST_EXOTICA", priceMod: 0.95, stock: 8 },
            { id: "SENTIENT_MYCELIUM", priceMod: 0.9, stock: 12 },
            { id: "MERCENARY_PLATOON", priceMod: 1.0, stock: 6 },
            { id: "FUEL_CELLS", priceMod: 1.1, stock: 80 }
        ],
        buys: [
            { id: "LUXURY_GOODS", priceMod: 1.6, stock: 40 },
            { id: "GOLD", priceMod: 1.5, stock: 50 },
            { id: "STOLEN_CONCORD_MEDALS", priceMod: 2.5, stock: 30 },
            { id: "ILLEGAL_ORGANS", priceMod: 2.0, stock: 15 },
            { id: "ANCIENT_WINE", priceMod: 1.7, stock: 20 }
        ],
        factory: {
            consumes: "SENTIENT_MYCELIUM",
            produces: "PROHIBITED_STIMS",
            consumeQty: 2,
            produceQty: 2
        },
        scanFlavor: "Port Erebus: A neon-drenched Eclipse Cartel smuggling port tucked inside a sensor-baffled dust cloud. Outlaws, identity forgers, and blockade runners dock here to fence contraband out of SEC-COM's sight."
    },

    "Cygnus Prime": {
        name: "Cygnus Prime",
        coords: {
            y: -65,
            x: 85
        },
        type: STARBASE_CHAR_VAL,
        char: STARBASE_CHAR_VAL,
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "TELEMETRY_PROBE", priceMod: 0.85, stock: 15 },
            { id: "MINING_DRONE", priceMod: 0.85, stock: 25 },
            { id: "QUANTUM_FLUID", priceMod: 0.9, stock: 30 },
            { id: "QUANTUM_LENS", priceMod: 0.95, stock: 8 },
            { id: "PRECURSOR_CIPHER", priceMod: 1.0, stock: 5 },
            { id: "NAVIGATION_CHARTS", priceMod: 0.8, stock: 60 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.6, stock: 40 },
            { id: "PRECURSOR_DATACUBE", priceMod: 3.0, stock: 10 },
            { id: "ARTIFACT_SHARDS", priceMod: 1.8, stock: 25 },
            { id: "GENETIC_SAMPLES", priceMod: 1.7, stock: 30 },
            { id: "VOID_CRYSTALS", priceMod: 1.8, stock: 15 },
            { id: "DATA_PULSAR", priceMod: 1.6, stock: 15 },
            { id: "DATA_MAGNETAR", priceMod: 1.7, stock: 12 },
            { id: "DATA_SINGULARITY", priceMod: 1.8, stock: 8 },
            { id: "DATA_QUASAR", priceMod: 2.0, stock: 5 },
            { id: "DATA_SUPERNOVA", priceMod: 1.7, stock: 10 }
        ],
        factory: {
            consumes: "VOID_CRYSTALS",
            produces: "QUANTUM_LENS",
            consumeQty: 2,
            produceQty: 1
        },
        scanFlavor: "University of Cygnus Prime: The premier astrophysical and xeno-archaeological research complex in Concord space. Academic grants fund top-credit bounties for planetary telemetry, pulsar/quasar spectroscopy, and intact Precursor Datacubes."
    },

    "Kepler Listening Post": {
        name: "Kepler Listening Post",
        coords: {
            y: -42,
            x: -68
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#00AAFF",
        faction: "CONCORD",
        isMajorHub: false,
        sells: [
            { id: "SUBSPACE_BEACON", priceMod: 0.85, stock: 20 },
            { id: "TELEMETRY_PROBE", priceMod: 0.9, stock: 12 },
            { id: "OVERCLOCK_CELL", priceMod: 0.9, stock: 15 },
            { id: "NAVIGATION_CHARTS", priceMod: 0.85, stock: 50 },
            { id: "FUEL_CELLS", priceMod: 0.95, stock: 90 }
        ],
        buys: [
            { id: "ENCRYPTED_DATA", priceMod: 1.6, stock: 25 },
            { id: "SYNDICATE_LEDGER", priceMod: 2.0, stock: 10 },
            { id: "DATA_PULSAR", priceMod: 1.5, stock: 10 },
            { id: "TECH_PARTS", priceMod: 1.3, stock: 40 },
            { id: "FOOD_SUPPLIES", priceMod: 1.3, stock: 60 }
        ],
        factory: {
            consumes: "TECH_PARTS",
            produces: "SUBSPACE_BEACON",
            consumeQty: 3,
            produceQty: 2
        },
        scanFlavor: "Kepler Listening Post: A frontier Concord signal-intelligence relay overlooking the Kepler Nebula approaches. SEC-COM analysts trade recon gear and pay steep bounties for intercepted Cartel ledgers and encrypted telemetry."
    },

    "Ceti Alpha Shipyards": {
        name: "Ceti Alpha Shipyards",
        coords: {
            y: -130,
            x: -90
        },
        type: STARBASE_CHAR_VAL,
        char: STARBASE_CHAR_VAL,
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "TECH_PARTS", priceMod: 0.8, stock: 120 },
            { id: "REFINED_ALLOY", priceMod: 0.85, stock: 90 },
            { id: "DROID_SERVOS", priceMod: 0.8, stock: 80 },
            { id: "NANO_REPAIR_KIT", priceMod: 0.85, stock: 30 },
            { id: "COMBAT_DRONE_MK1", priceMod: 0.9, stock: 12 },
            { id: "MINING_DRONE_MK2", priceMod: 0.9, stock: 10 },
            { id: "STATION_CORE", priceMod: 0.95, stock: 2 }
        ],
        buys: [
            { id: "PLATINUM_ORE", priceMod: 1.5, stock: 80 },
            { id: "RARE_METALS", priceMod: 1.5, stock: 80 },
            { id: "MINERALS", priceMod: 1.3, stock: 200 },
            { id: "HYDROGEN_3", priceMod: 1.6, stock: 50 },
            { id: "AI_CORE", priceMod: 1.5, stock: 15 }
        ],
        factory: {
            consumes: "PLATINUM_ORE",
            produces: "TECH_PARTS",
            consumeQty: 3,
            produceQty: 4
        },
        scanFlavor: "Ceti Alpha Shipyards: Rebuilt after Dread Pirate Voss's infamous raid, these heavily fortified orbital drydocks assemble Aegis patrol cruisers and pay top credit for raw platinum and rare metals."
    },

    "Helios Refinery": {
        name: "Helios Refinery",
        coords: {
            y: 110,
            x: -55
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        faction: "CONCORD",
        isMajorHub: true,
        sells: [
            { id: "REFINED_ALLOY", priceMod: 0.75, stock: 120 },
            { id: "MINERALS", priceMod: 0.7, stock: 300 },
            { id: "PLATINUM_ORE", priceMod: 0.85, stock: 60 },
            { id: "ATMOSPHERIC_PROCESSORS", priceMod: 0.85, stock: 50 },
            { id: "MINING_DRONE_MK2", priceMod: 0.9, stock: 10 },
            { id: "PREFAB_COLONY_CORE", priceMod: 0.95, stock: 2 }
        ],
        buys: [
            { id: "FOOD_SUPPLIES", priceMod: 1.4, stock: 120 },
            { id: "WATER", priceMod: 1.5, stock: 120 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.4, stock: 60 },
            { id: "HYDROGEN_3", priceMod: 1.5, stock: 40 }
        ],
        factory: {
            consumes: "MINERALS",
            produces: "REFINED_ALLOY",
            consumeQty: 8,
            produceQty: 2
        },
        scanFlavor: "Helios Corporate Refinery: A sprawling Xy-Corp orbital smelting facility. Tagline broadcast on all frequencies: 'Progress Through Profit.' Ideal supply depot for colony builders and industrial haulers."
    },

    "Valkyrie Drift": {
        name: "Valkyrie Drift",
        coords: {
            y: 120,
            x: 135
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#FFAA66",
        faction: "INDEPENDENT",
        isMajorHub: false,
        sells: [
            { id: "MINERAL_GEODE", priceMod: 0.8, stock: 20 },
            { id: "MINERALS", priceMod: 0.65, stock: 250 },
            { id: "PLATINUM_ORE", priceMod: 0.8, stock: 50 },
            { id: "RARE_METALS", priceMod: 0.85, stock: 40 },
            { id: "MINING_DRONE", priceMod: 0.9, stock: 20 },
            { id: "NANO_REPAIR_KIT", priceMod: 0.95, stock: 15 }
        ],
        buys: [
            { id: "FOOD_SUPPLIES", priceMod: 1.6, stock: 120 },
            { id: "WATER", priceMod: 1.6, stock: 120 },
            { id: "FROTHY_MOON_ALE", priceMod: 1.8, stock: 50 },
            { id: "DROID_SERVOS", priceMod: 1.5, stock: 60 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.5, stock: 40 }
        ],
        factory: {
            consumes: "PLATINUM_ORE",
            produces: "REFINED_ALLOY",
            consumeQty: 4,
            produceQty: 2
        },
        scanFlavor: "Valkyrie Drift: A sprawling independent rock-hopper barge lashed to a fractured ferric asteroid. Roughneck miners sell uncracked geodes and raw platinum while paying handsome premiums for fresh ale, rations, and droid servos."
    },

    "Frothy Moon Outpost": {
        name: "Frothy Moon Outpost",
        coords: {
            y: MAP_HEIGHT - 14,
            x: MAP_WIDTH + 18
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#FFAA00",
        faction: "INDEPENDENT",
        isMajorHub: false,
        sells: [
            { id: "FROTHY_MOON_ALE", priceMod: 0.6, stock: 100 },
            { id: "FOOD_SUPPLIES", priceMod: 0.85, stock: 80 },
            { id: "WATER", priceMod: 0.85, stock: 80 },
            { id: "FUEL_CELLS", priceMod: 0.95, stock: 60 },
            { id: "ANCIENT_WINE", priceMod: 0.9, stock: 10 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.5, stock: 20 },
            { id: "NAVIGATION_CHARTS", priceMod: 1.4, stock: 40 },
            { id: "KTHARR_SPICES", priceMod: 1.5, stock: 25 },
            { id: "LUXURY_GOODS", priceMod: 1.4, stock: 30 }
        ],
        factory: {
            consumes: "WATER",
            produces: "FROTHY_MOON_ALE",
            consumeQty: 4,
            produceQty: 4
        },
        scanFlavor: "Frothy Moon Outpost: A cozy, independent observatory and brewhouse perched on a cratered lunar ridge. Amateur and professional stargazers gather on the observation deck to trade deep-sky charts over dark synth-ale."
    },

    "Port Nomad": {
        name: "Port Nomad",
        coords: {
            y: -210,
            x: 15
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#FFAA00",
        faction: "INDEPENDENT",
        isMajorHub: true,
        sells: [
            { id: "FUEL_CELLS", priceMod: 0.5, stock: 500 },
            { id: "HYDROGEN_3", priceMod: 0.75, stock: 80 },
            { id: "NANO_REPAIR_KIT", priceMod: 0.8, stock: 40 },
            { id: "TECH_PARTS", priceMod: 0.9, stock: 60 },
            { id: "WORMHOLE_STABILIZER", priceMod: 0.95, stock: 1 }
        ],
        buys: [
            { id: "REFINED_ALLOY", priceMod: 1.4, stock: 80 },
            { id: "FOOD_SUPPLIES", priceMod: 1.3, stock: 100 },
            { id: "MEDICAL_SUPPLIES", priceMod: 1.3, stock: 60 },
            { id: "QUANTUM_FLUID", priceMod: 1.4, stock: 30 }
        ],
        factory: {
            consumes: "HYDROGEN_3",
            produces: "FUEL_CELLS",
            consumeQty: 2,
            produceQty: 15
        },
        scanFlavor: "Port Nomad: Primary refueling depot and dispatch sanctuary of The Fuel Rats Collective. Massive glowing promethium tanks orbit the station. All captains are welcome regardless of faction standing."
    },

    "The Archivist's Vault": {
        name: "The Archivist's Vault",
        coords: {
            y: 260,
            x: -240
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#00E0E0",
        faction: "INDEPENDENT",
        isMajorHub: true,
        isBlackMarket: true,
        sells: [
            { id: "FORBIDDEN_TEXTS", priceMod: 0.85, stock: 15 },
            { id: "XENO_ANTIQUES", priceMod: 0.9, stock: 10 },
            { id: "ENCRYPTED_ENGRAM", priceMod: 1.0, stock: 8 },
            { id: "PRECURSOR_CIPHER", priceMod: 0.9, stock: 6 },
            { id: "ANCIENT_ARCHIVE", priceMod: 1.1, stock: 3 },
            { id: "WAYFINDER_CORE", priceMod: 1.0, stock: 1 }
        ],
        buys: [
            { id: "PLANETARY_DATA", priceMod: 1.8, stock: 50 },
            { id: "PRECURSOR_DATACUBE", priceMod: 2.8, stock: 10 },
            { id: "PRECURSOR_STAR_MAP_FRAGMENT", priceMod: 3.5, stock: 10 },
            { id: "AI_CORE", priceMod: 1.7, stock: 15 },
            { id: "PRECURSOR_ARTIFACT", priceMod: 2.2, stock: 5 },
            { id: "DATA_SINGULARITY", priceMod: 2.0, stock: 10 },
            { id: "DATA_QUASAR", priceMod: 2.2, stock: 8 }
        ],
        scanFlavor: "The Archivist's Vault: Hidden deep within a graveyard of shattered pre-Concord hulls. Run by an ancient, reclusive AI broker that trades in forbidden histories, encrypted engrams, and Precursor relics."
    }
};

window.LOCATIONS_DATA = LOCATIONS_DATA;
if (typeof GameRegistry !== 'undefined') {
    GameRegistry.locations = LOCATIONS_DATA;
}

// ==========================================
// --- PUBLIC LOCATION UTILITY & REGISTRY API ---
// ==========================================

const _staticChunkIndex = new Map();

function _rebuildStaticChunkIndex() {
    _staticChunkIndex.clear();
    const chunkSize = (typeof chunkManager !== 'undefined' && chunkManager.CHUNK_SIZE) ? chunkManager.CHUNK_SIZE : 16;

    for (const key in LOCATIONS_DATA) {
        const loc = LOCATIONS_DATA[key];
        if (!loc || !loc.coords || loc.isProcedural) continue;
        const wx = loc.coords.x;
        const wy = loc.coords.y;
        const cx = Math.floor(wx / chunkSize);
        const cy = Math.floor(wy / chunkSize);
        const chunkKey = `${cx},${cy}`;
        const localX = ((wx % chunkSize) + chunkSize) % chunkSize;
        const localY = ((wy % chunkSize) + chunkSize) % chunkSize;

        if (!_staticChunkIndex.has(chunkKey)) _staticChunkIndex.set(chunkKey, []);
        _staticChunkIndex.get(chunkKey).push({ localX, localY, deltaKey: `${wx},${wy}` });
    }
}

const LocationUtils = {
    getLocation(name) {
        return LOCATIONS_DATA[name] || null;
    },
    getByFaction(faction) {
        return Object.values(LOCATIONS_DATA).filter(loc => loc && loc.faction === faction);
    },
    getNearest(x, y, filterFn = null) {
        let best = null;
        let bestDistSq = Infinity;
        for (const key in LOCATIONS_DATA) {
            const loc = LOCATIONS_DATA[key];
            if (!loc || !loc.coords) continue;
            if (filterFn && !filterFn(loc, key)) continue;
            const dx = loc.coords.x - x;
            const dy = loc.coords.y - y;
            const dSq = dx * dx + dy * dy;
            if (dSq < bestDistSq) {
                bestDistSq = dSq;
                best = { key, location: loc, distance: Math.floor(Math.sqrt(dSq)) };
            }
        }
        return best;
    },
    findBestBuyer(itemId) {
        let best = null;
        for (const key in LOCATIONS_DATA) {
            const loc = LOCATIONS_DATA[key];
            if (!loc || !Array.isArray(loc.buys)) continue;
            const entry = loc.buys.find(b => (b.id === itemId) || (b === itemId));
            if (entry) {
                const mod = entry.priceMod || 1.0;
                if (!best || mod > best.priceMod) {
                    best = { name: loc.name || key, coords: loc.coords, priceMod: mod };
                }
            }
        }
        return best;
    },
    findBestSeller(itemId) {
        let best = null;
        for (const key in LOCATIONS_DATA) {
            const loc = LOCATIONS_DATA[key];
            if (!loc || !Array.isArray(loc.sells)) continue;
            const entry = loc.sells.find(s => (s.id === itemId) || (s === itemId));
            if (entry) {
                const mod = entry.priceMod || 1.0;
                if (!best || mod < best.priceMod) {
                    best = { name: loc.name || key, coords: loc.coords, priceMod: mod };
                }
            }
        }
        return best;
    },
    registerLocation(key, def) {
        if (!key || !def || !def.coords) return false;
        if (!def.name) def.name = key;
        LOCATIONS_DATA[key] = def;
        _rebuildStaticChunkIndex();
        if (typeof chunkManager !== 'undefined' && typeof chunkManager.initializeStaticLocations === 'function') {
            chunkManager.initializeStaticLocations();
            chunkManager.loadedChunks = {};
            chunkManager.lastChunkKey = null;
            chunkManager.lastChunkRef = null;
        }
        if (typeof LORE_DATABASE !== 'undefined' && def.scanFlavor) {
            const normKey = `LOCATION_${def.name.replace(/[\s-]+/g, '_').toUpperCase()}`;
            if (!LORE_DATABASE[normKey]) {
                LORE_DATABASE[normKey] = {
                    title: def.name,
                    category: "Locations",
                    text: def.scanFlavor,
                    unlocked: false
                };
                if (typeof window.cachedTotalLore !== 'undefined') window.cachedTotalLore = null;
            }
        }
        return true;
    }
};

window.LocationUtils = LocationUtils;

// ==========================================
// --- SELF-CONTAINED LOCATION PATCHES ---
// ==========================================

(function initLocationFixes() {
    // 1. Ensure missing commodities referenced by colonies, locations, or dev tools exist with clean V8 shapes
    function ensureLocationCommodities() {
        if (typeof COMMODITIES === 'undefined') return;

        const fallbacks = {
            LUXURY_GOODS: {
                id: "LUXURY_GOODS", name: "Luxury Goods", basePrice: 350, icon: "💎", weight: 1, illegal: false, category: "LUXURY",
                description: "High-end textiles, holovids, and artisanal crafts produced by advanced colonies."
            },
            HAB_MODULE: {
                id: "HAB_MODULE", name: "Habitation Module", basePrice: 400, icon: "🏗️", weight: 1, illegal: false, category: "COLONY",
                description: "Modular pressurized living quarters used for rapid frontier colony expansion."
            },
            ATMOS_PROCESSOR: {
                id: "ATMOS_PROCESSOR", name: "Atmos-Processor Core", basePrice: 650, icon: "🌪️", weight: 1, illegal: false, category: "COLONY",
                description: "Compact atmospheric scrubber unit designed for frontier terraforming."
            },
            SETTLER_MANIFEST: {
                id: "SETTLER_MANIFEST", name: "Cryo-Settler Pod", basePrice: 300, icon: "🛌", weight: 1, illegal: false, category: "COLONY",
                description: "Pioneers and engineers in cryo-stasis awaiting transport to a new world."
            }
        };

        for (const id in fallbacks) {
            if (!COMMODITIES[id]) COMMODITIES[id] = fallbacks[id];
        }
    }

    ensureLocationCommodities();

    // 2. Register Codex Lore Entries for All Static Locations (Zero duplicate aliases!)
    function syncLocationLoreEntries() {
        if (typeof LORE_DATABASE === 'undefined') return;

        for (const locKey in LOCATIONS_DATA) {
            const loc = LOCATIONS_DATA[locKey];
            if (!loc || !loc.name || !loc.scanFlavor || loc.isProcedural) continue;

            const normalizedKey = `LOCATION_${loc.name.replace(/[\s-]+/g, '_').toUpperCase()}`;
            if (!LORE_DATABASE[normalizedKey]) {
                LORE_DATABASE[normalizedKey] = {
                    title: loc.name,
                    category: "Locations",
                    text: typeof loc.scanFlavor === 'string' ? loc.scanFlavor : "A notable deep-space landmark.",
                    unlocked: false
                };
            }
        }
    }

    function attachLocationPatches() {
        ensureLocationCommodities();
        syncLocationLoreEntries();
        _rebuildStaticChunkIndex();

        if (typeof GameRegistry !== 'undefined') {
            GameRegistry.locations = LOCATIONS_DATA;
        }
        if (typeof window.cachedTotalLore !== 'undefined') {
            window.cachedTotalLore = null;
        }

        // 3. O(1) Chunk-Indexed Persistence of worldStateDeltas on Static Locations
        if (typeof chunkManager !== 'undefined' && typeof chunkManager.generateChunk === 'function' && !window._locDeltaPatched) {
            const origGenChunk = chunkManager.generateChunk.bind(chunkManager);
            chunkManager.generateChunk = function(chunkX, chunkY) {
                const chunkData = origGenChunk(chunkX, chunkY);
                if (typeof worldStateDeltas === 'undefined') return chunkData;

                const entries = _staticChunkIndex.get(`${chunkX},${chunkY}`);
                if (!entries || entries.length === 0) return chunkData;

                for (let i = 0; i < entries.length; i++) {
                    const { localX, localY, deltaKey } = entries[i];
                    const delta = worldStateDeltas[deltaKey];
                    if (delta && typeof chunkData[localY][localX] === 'object' && chunkData[localY][localX] !== null) {
                        Object.assign(chunkData[localY][localX], delta);
                    }
                }
                return chunkData;
            };
            chunkManager.initializeStaticLocations();
            chunkManager.loadedChunks = {};
            chunkManager.lastChunkKey = null;
            chunkManager.lastChunkRef = null;
            window._locDeltaPatched = true;
        }

        // 4. Route keyboard hotkeys for Static Interactive Landmarks BEFORE TILE_INTERACTIONS / generic map keys
        if (typeof window.handleGalacticMapInput === 'function' && !window._locLandmarkInputPatched) {
            const origMapInput = window.handleGalacticMapInput;
            window.handleGalacticMapInput = function(key) {
                if (typeof key === 'string' && typeof chunkManager !== 'undefined') {
                    const tileObj = chunkManager.getTile(playerX, playerY);
                    if (tileObj && typeof tileObj.getLandmarkActions === 'function') {
                        const acts = tileObj.getLandmarkActions(tileObj) || [];
                        const matched = acts.find(a => a && a.key && a.key.toLowerCase() === key.toLowerCase());
                        if (matched && typeof matched.onclick === 'function') {
                            matched.onclick();
                            return true;
                        }
                    }
                }
                return origMapInput.apply(this, arguments);
            };
            window._locLandmarkInputPatched = true;
        }

        // 5. Prevent Concord Customs Scans at Non-Concord Hubs, Black Markets & Player Outposts/Colonies
        if (typeof window.performCustomsScan === 'function' && !window._locCustomsPatched) {
            const origCustoms = window.performCustomsScan;
            window.performCustomsScan = function() {
                if (typeof chunkManager !== 'undefined') {
                    const tile = chunkManager.getTile(playerX, playerY);
                    if (tile && tile.type === 'location') {
                        if (tile.isBlackMarket || tile.isPlayerOwned || tile.isColony || (tile.faction && tile.faction !== 'CONCORD')) {
                            return true;
                        }
                    }
                }
                return origCustoms.apply(this, arguments);
            };
            window._locCustomsPatched = true;
        }

        // 6. Prevent Planet Xerxes Enter-Key Bypass & Inject Mission Turn-In Buttons at Stations
        if (typeof window.openStationView === 'function' && !window._locStationPatched) {
            const origOpenStation = window.openStationView;
            window.openStationView = function() {
                const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;

                if (location && location.name && location.name.includes("Xerxes")) {
                    if (typeof openXerxesView === 'function') {
                        openXerxesView();
                        return;
                    }
                }

                origOpenStation.apply(this, arguments);

                if (!location || typeof playerActiveMission === 'undefined' || !playerActiveMission) return;

                const menuGrid = document.getElementById('dynamicStationMenu');
                if (!menuGrid) return;

                menuGrid.querySelectorAll('[data-mission-btn="true"]').forEach(el => el.remove());

                const obj = playerActiveMission.objectives && playerActiveMission.objectives[0] ? playerActiveMission.objectives[0] : null;

                // A. Delivery Objective at Destination Station
                if (!playerActiveMission.isComplete && playerActiveMission.type === "DELIVERY" && obj && location.name === obj.destinationName) {
                    const haveQty = (typeof playerCargo !== 'undefined' && playerCargo[obj.itemID]) ? playerCargo[obj.itemID] : 0;
                    const isReady = haveQty >= obj.count;
                    const borderCol = isReady ? 'var(--success)' : 'var(--gold-text)';
                    const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[obj.itemID]) ? COMMODITIES[obj.itemID].name : obj.itemID;

                    const delivBtn = document.createElement('button');
                    delivBtn.className = 'station-action-btn';
                    delivBtn.setAttribute('data-mission-btn', 'true');
                    delivBtn.style.cssText = `border: 1px solid ${borderCol}; border-left: 4px solid ${borderCol}; background: rgba(255, 215, 0, 0.08); grid-column: span 2;`;
                    delivBtn.innerHTML = `
                        <div class="btn-icon">📦</div>
                        <div>
                            <div class="btn-label" style="color:${borderCol};">Complete Contract Delivery</div>
                            <span class="btn-sub" style="color:var(--text-color);">Deliver ${obj.count}x ${itemName} (Hold: ${haveQty}/${obj.count})</span>
                        </div>
                    `;
                    delivBtn.onclick = () => {
                        if (typeof handleCompleteDelivery === 'function') handleCompleteDelivery();
                        if (typeof currentGameState !== 'undefined' && currentGameState !== 'level_up') {
                            window.openStationView();
                        }
                    };
                    menuGrid.prepend(delivBtn);
                }

                // B. Acquire Objective at Giver Station
                if (!playerActiveMission.isComplete && playerActiveMission.type === "ACQUIRE" && obj && location.name === playerActiveMission.giver) {
                    const haveQty = (typeof playerCargo !== 'undefined' && playerCargo[obj.itemID]) ? playerCargo[obj.itemID] : 0;
                    const isReady = haveQty >= obj.count;
                    const borderCol = isReady ? 'var(--success)' : 'var(--gold-text)';
                    const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[obj.itemID]) ? COMMODITIES[obj.itemID].name : obj.itemID;

                    const acqBtn = document.createElement('button');
                    acqBtn.className = 'station-action-btn';
                    acqBtn.setAttribute('data-mission-btn', 'true');
                    acqBtn.style.cssText = `border: 1px solid ${borderCol}; border-left: 4px solid ${borderCol}; background: rgba(255, 215, 0, 0.08); grid-column: span 2;`;
                    acqBtn.innerHTML = `
                        <div class="btn-icon">💎</div>
                        <div>
                            <div class="btn-label" style="color:${borderCol};">Turn In Contract Resources</div>
                            <span class="btn-sub" style="color:var(--text-color);">Deliver ${obj.count}x ${itemName} (Hold: ${haveQty}/${obj.count})</span>
                        </div>
                    `;
                    acqBtn.onclick = () => {
                        if (typeof handleTurnInAcquire === 'function') handleTurnInAcquire();
                        if (typeof currentGameState !== 'undefined' && currentGameState !== 'level_up') {
                            window.openStationView();
                        }
                    };
                    menuGrid.prepend(acqBtn);
                }

                // C. Completed Contract Reward Claim at Giver Station (or Shadow Broker at Black Markets)
                const isGiverHere = (location.name === playerActiveMission.giver) ||
                                    (playerActiveMission.giver === "Shadow Broker" && location.isBlackMarket);

                if (playerActiveMission && playerActiveMission.isComplete && isGiverHere) {
                    const rewardBtn = document.createElement('button');
                    rewardBtn.className = 'station-action-btn';
                    rewardBtn.setAttribute('data-mission-btn', 'true');
                    rewardBtn.style.cssText = 'border: 1px solid var(--success); border-left: 4px solid var(--success); background: rgba(0, 255, 0, 0.08); grid-column: span 2;';
                    rewardBtn.innerHTML = `
                        <div class="btn-icon">🏆</div>
                        <div>
                            <div class="btn-label" style="color:var(--success);">Claim Contract Reward (${formatNumber(playerActiveMission.rewards.credits)}c)</div>
                            <span class="btn-sub" style="color:var(--text-color);">${playerActiveMission.title}</span>
                        </div>
                    `;
                    rewardBtn.onclick = () => {
                        if (playerActiveMission.giver === "Shadow Broker" && location.isBlackMarket) {
                            playerActiveMission.giver = location.name;
                        }
                        if (typeof grantMissionRewards === 'function') grantMissionRewards();
                        if (typeof currentGameState !== 'undefined' && currentGameState !== 'level_up') {
                            window.openStationView();
                        }
                    };
                    menuGrid.prepend(rewardBtn);
                }
            };
            window._locStationPatched = true;
        }

        // 7. Keep Delivery Destinations Reasonable for Early-Game Players (Squared-Distance Optimized)
        if (typeof window.selectRandomDestination === 'function' && !window._locDestPatched) {
            window.selectRandomDestination = function(currentStationName) {
                const allKeys = Object.keys(LOCATIONS_DATA);
                const maxDist = (typeof playerLevel !== 'undefined' && playerLevel < 3) ? 300 : Infinity;
                const maxDistSq = maxDist === Infinity ? Infinity : maxDist * maxDist;

                let candidates = allKeys.filter(key => {
                    if (key === currentStationName || key === "Planet Xerxes") return false;
                    const loc = LOCATIONS_DATA[key];
                    if (!loc || !loc.coords || !loc.buys || loc.buys.length === 0) return false;
                    const dx = loc.coords.x - playerX;
                    const dy = loc.coords.y - playerY;
                    return (dx * dx + dy * dy) <= maxDistSq;
                });

                if (candidates.length === 0) {
                    candidates = allKeys.filter(key => {
                        const loc = LOCATIONS_DATA[key];
                        return key !== currentStationName && key !== "Planet Xerxes" && loc && loc.coords && loc.buys && loc.buys.length > 0;
                    });
                }
                if (candidates.length === 0) return null;

                const destKey = candidates[Math.floor(Math.random() * candidates.length)];
                const destData = LOCATIONS_DATA[destKey];
                const secX = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destData.coords.x / SECTOR_SIZE) : 0;
                const secY = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destData.coords.y / SECTOR_SIZE) : 0;

                return {
                    name: destKey,
                    key: `${secX},${secY}`,
                    coords: destData.coords
                };
            };
            window._locDestPatched = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachLocationPatches);
    } else {
        attachLocationPatches();
    }
})();

// --- END OF FILE locations.js ---
