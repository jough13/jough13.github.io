// --- START OF FILE locations.js ---

// ==========================================
// --- INTERNAL LOCATION HELPERS ---
// ==========================================

function _locEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

function _locHasPerk(perkId) {
    if (typeof hasPlayerPerk === 'function') return hasPlayerPerk(perkId);
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

function _locBearing(dx, dy) {
    if (dx === 0 && dy === 0) return "HERE";
    const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    const idx = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    return dirs[(idx + 8) % 8];
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

    if (newlyDiscovered) {
        if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
        if (typeof renderUIStats === 'function') renderUIStats();
        setTimeout(() => {
            if (typeof checkLevelUp === 'function') checkLevelUp();
        }, 50);
    }

    return newlyDiscovered;
}

// ==========================================
// --- LOCATIONS DATABASE ---
// ==========================================

const LOCATIONS_DATA = {
    "Starbase Alpha": {
        name: "Starbase Alpha",
        region: "Sol Core",
        securityLevel: "HIGH",
        portSpecialty: "Trade Exchange, Pioneer Charters & Fleet Logistics",
        welcomeHail: "Starbase Alpha Traffic Control: Docking clamps locked. Welcome back to Sol Sector, Commander.",
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
        region: "Sol Fringe",
        securityLevel: "LAWLESS",
        portSpecialty: "Illicit Stims, Discount Cybernetics & Shadow Cantina",
        welcomeHail: "Anchor Dock-Master: Cut your transponder and pay your bay fee in cash. No Concord badges past airlock three.",
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
        region: "Sol Core",
        securityLevel: "MAXIMUM",
        portSpecialty: "Megastructure Industrial Bulk & Naval Logistics",
        welcomeHail: "Aegis Orbital Control: Solar collector aperture cleared. Maintain strict approach corridor, Captain.",
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

    // ==========================================
    // --- UNIQUE INTERACTIVE DEEP-SPACE LANDMARKS ---
    // ==========================================

    "Alien Obelisk": {
        name: "Obsidian Obelisk",
        region: "Inner Rim (South-West)",
        securityLevel: "NONE",
        portSpecialty: "Precursor Harmonic Monolith",
        isLandmark: true,
        coords: { x: -20, y: 35 },
        type: 'location',
        char: 'I',
        displayChar: 'Ψ',
        customColor: "#9933FF",
        scanFlavor: "An ancient, monolithic spire floating in deep space at [-20, -35]. Its geometric trenches pulse with residual Precursor energy.",
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
        region: "Core Rim (North-East)",
        securityLevel: "NONE",
        portSpecialty: "Precursor Conduit & Nav-Core Cache",
        isLandmark: true,
        coords: { x: 39, y: -17 }, // Matches Encrypted Engram hint: Sector [39, 17]
        type: 'location',
        char: 'S',
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
                        if (typeof renderUIStats === 'function') renderUIStats();

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["Sanctuary of the Void"].getLandmarkActions(tileObj));
                        }
                        if (typeof autoSaveGame === 'function') autoSaveGame();
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
        region: "Western Frontier",
        securityLevel: "NONE",
        portSpecialty: "Children of the Void Pilgrimage Reliquary",
        isLandmark: true,
        coords: { x: -115, y: 145 },
        type: 'location',
        char: 'A', // BUG FIX: Distinct unused char avoids colliding with CARGO_CACHE_CHAR_VAL ('C') in config.js
        displayChar: 'Ψ',
        customColor: "#DDA0DD",
        scanFlavor: "Choir Spire Alpha: A silent, crystal-encrusted pilgrimage reliquary at [-115, -145] tended by the Children of the Void. Subspace hymns resonate across every open comms frequency.",
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
                        if (typeof renderUIStats === 'function') renderUIStats();
                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["Choir Spire Alpha"].getLandmarkActions(tileObj));
                        }
                        if (typeof autoSaveGame === 'function') autoSaveGame();
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
                    const giftNote = added > 0
                        ? ` and bestowed <b>1x ${giftName}</b>`
                        : ` <span style="color:var(--warning)">(cargo bay over capacity — return gift could not be stowed)</span>`;

                    logMessage(`<span style='color:#DDA0DD; font-weight:bold;'>[ OFFERING ACCEPTED ]</span> The Spire flares violet! Hull & Shields fully restored (+200 XP)${giftNote}.`);
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    if (typeof showToast === 'function') showToast("CHOIR BLESSING GRANTED", "success");
                    if (typeof renderUIStats === 'function') renderUIStats();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    if (typeof autoSaveGame === 'function') autoSaveGame();
                }
            });
            acts.push({
                label: 'Listen to Star-Hymns',
                key: 'v',
                onclick: () => {
                    const clues = [
                        "\"The Archivist watches from the hull graveyard at [-240, -260].\"",
                        "\"A crystalline Precursor conduit still sings at [39, 17].\"",
                        "\"At the edge of the Silentium Expanse [280, 240], Relay Zero remembers the First Chord.\"",
                        "\"South of here at [-85, -220], the Whispering Prism bends starlight into harmonic glass.\""
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
        region: "Silentium Approach (North-East)",
        securityLevel: "NONE",
        portSpecialty: "Precursor Deep-Rim Warning Buoy",
        isLandmark: true,
        coords: { x: 280, y: -240 },
        type: 'location',
        char: 'R',
        displayChar: 'Ψ',
        customColor: "#40E0D0",
        scanFlavor: "Silentium Relay Zero: The outermost automated Precursor warning buoy bordering the Silentium Expanse at [280, 240]. Its harmonic core pulses with coordinates from before human history.",
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
                        if (typeof renderUIStats === 'function') renderUIStats();

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["Silentium Relay Zero"].getLandmarkActions(tileObj));
                        }
                        if (typeof autoSaveGame === 'function') autoSaveGame();
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

    "The Sleeping Ark": {
        name: "The Sleeping Ark (CSS Hesperia)",
        region: "North-West Outer Rim",
        securityLevel: "NONE",
        portSpecialty: "2144 CE Terran Diaspora Generation Ark",
        isLandmark: true,
        coords: { x: -145, y: -185 }, // HUD [-145, 185]
        type: 'location',
        char: 'K',
        displayChar: '❖',
        customColor: "#AADDFF",
        scanFlavor: "The Sleeping Ark (CSS Hesperia): A colossal, pre-Concord 2144 CE colony sleeper ship drifting silently at [-145, 185]. Its original folded-spacetime motivator sits cold, while archival beacons ping in archaic binary.",
        getLandmarkActions: function(tileObj) {
            const acts = [];
            if (!tileObj || !tileObj.studied) {
                acts.push({
                    label: 'Download 2144 CE Diaspora Logs',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        const xp = 250;
                        playerXP += xp;
                        const gotWine = _locSafeAddCargo('ANCIENT_WINE', 1);
                        const gotPod = _locSafeAddCargo('CRYO_STASIS_POD', 1);
                        const gotCharts = gotPod === 0 ? _locSafeAddCargo('NAVIGATION_CHARTS', 1) : 0;
                        const finds = [];
                        if (gotWine > 0) finds.push("<b>1x Ancient Wine</b>");
                        if (gotPod > 0) finds.push("<b>1x Recovered Cryo-Pod</b>");
                        if (gotCharts > 0) finds.push("<b>1x Nav-Charts</b>");

                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        }
                        if (tileObj) tileObj.studied = true;

                        logMessage(`<span style='color:#AADDFF; font-weight:bold;'>[ CSS HESPERIA ARCHIVES ]</span> Recovered 2144 CE diaspora flight telemetry (+${xp} XP)${finds.length > 0 ? ` and salvaged ${finds.join(' & ')} from Vault Bay 1` : ''}!`);
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                        if (typeof showToast === 'function') showToast("DIASPORA ARCHIVES RECOVERED", "success");
                        if (typeof renderUIStats === 'function') renderUIStats();

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["The Sleeping Ark"].getLandmarkActions(tileObj));
                        }
                        if (typeof autoSaveGame === 'function') autoSaveGame();
                    }
                });
            }
            if (!tileObj || !tileObj.beaconRepaired) {
                acts.push({
                    label: 'Repair Distress Beacon (2x Tech Parts)',
                    key: 'x',
                    onclick: () => {
                        if (tileObj && tileObj.beaconRepaired) return;
                        if (typeof playerCargo === 'undefined' || (playerCargo['TECH_PARTS'] || 0) < 2) {
                            if (typeof showToast === 'function') showToast("REQUIRES 2x TECH PARTS", "warning");
                            if (typeof soundManager !== 'undefined') soundManager.playError();
                            return;
                        }
                        playerCargo['TECH_PARTS'] -= 2;
                        if (playerCargo['TECH_PARTS'] <= 0) delete playerCargo['TECH_PARTS'];
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

                        playerCredits += 1200;
                        playerXP += 150;
                        if (typeof playerFactionStanding !== 'undefined') {
                            playerFactionStanding['CONCORD'] = (playerFactionStanding['CONCORD'] || 0) + 10;
                        }
                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { beaconRepaired: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        }
                        if (tileObj) tileObj.beaconRepaired = true;

                        logMessage("<span style='color:var(--success); font-weight:bold;'>[ HISTORICAL PRESERVATION ]</span> Repaired CSS Hesperia's relay! Concord Historical Survey wired <b>1,200c</b> (+150 XP, +10 Concord Rep).");
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                        if (typeof showToast === 'function') showToast("+1,200c & +10 CONCORD REP", "success");
                        if (typeof renderUIStats === 'function') renderUIStats();

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["The Sleeping Ark"].getLandmarkActions(tileObj));
                        }
                        if (typeof autoSaveGame === 'function') autoSaveGame();
                    }
                });
            }
            return acts;
        },
        onInteract: function(tileObj) {
            _locRecordDiscovery("The Sleeping Ark (CSS Hesperia)", ["TECH_FTL_DRIVES", "XENO_DERELICTS"]);
            logMessage("<span style='color:#AADDFF; font-weight:bold;'>[ THE SLEEPING ARK ]</span> The weathered kilometer-long hull of the 2144 CE colony ark 'CSS Hesperia' drifts silently in the dark.");
            if (typeof renderContextualActions === 'function') {
                renderContextualActions(this.getLandmarkActions(tileObj));
            }
        }
    },

    "K'tharr Blood-Cairn": {
        name: "K'tharr Blood-Cairn",
        region: "Eastern Frontier",
        securityLevel: "LOW",
        portSpecialty: "K'tharr Warrior Memorial Shrine",
        isLandmark: true,
        coords: { x: 310, y: 210 }, // HUD [310, -210]
        type: 'location',
        char: 'G',
        displayChar: '◈',
        customColor: "#4CAF50",
        scanFlavor: "K'tharr Blood-Cairn: A ring of scorched warship prows welded into an orbital warrior monument at [310, -210]. Border clans leave ceremonial blades here to honor the fallen.",
        getLandmarkActions: function(tileObj) {
            const acts = [];
            if (!tileObj || !tileObj.studied) {
                acts.push({
                    label: 'Transmit Honor Salute (+K\'tharr Rep)',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        playerXP += 175;
                        if (typeof playerFactionStanding !== 'undefined') {
                            playerFactionStanding['KTHARR'] = (playerFactionStanding['KTHARR'] || 0) + 8;
                        }
                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        }
                        if (tileObj) tileObj.studied = true;

                        logMessage("<span style='color:#4CAF50; font-weight:bold;'>[ BLOOD-CAIRN ]</span> You dip your running lights and transmit the ancient K'tharr warrior cadence. Passing Hegemony relays acknowledge your respect (+8 K'tharr Rep, +175 XP).");
                        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                        if (typeof showToast === 'function') showToast("+8 K'THARR STANDING", "success");
                        if (typeof renderUIStats === 'function') renderUIStats();

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["K'tharr Blood-Cairn"].getLandmarkActions(tileObj));
                        }
                        if (typeof autoSaveGame === 'function') autoSaveGame();
                    }
                });
            }
            acts.push({
                label: 'Return 1x Ancestral Blade',
                key: 'x',
                onclick: () => {
                    if (typeof playerCargo === 'undefined' || (playerCargo['KTHARR_ANCESTRAL_BLADE'] || 0) < 1) {
                        if (typeof showToast === 'function') showToast("REQUIRES 1x K'THARR ANCESTRAL BLADE", "warning");
                        if (typeof soundManager !== 'undefined') soundManager.playError();
                        return;
                    }
                    playerCargo['KTHARR_ANCESTRAL_BLADE'] -= 1;
                    if (playerCargo['KTHARR_ANCESTRAL_BLADE'] <= 0) delete playerCargo['KTHARR_ANCESTRAL_BLADE'];
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();

                    playerCredits += 1500;
                    playerXP += 300;
                    if (typeof playerFactionStanding !== 'undefined') {
                        playerFactionStanding['KTHARR'] = (playerFactionStanding['KTHARR'] || 0) + 25;
                    }
                    if (typeof MAX_PLAYER_HULL !== 'undefined') playerHull = MAX_PLAYER_HULL;
                    if (typeof MAX_SHIELDS !== 'undefined') playerShields = MAX_SHIELDS;

                    logMessage("<span style='color:#4CAF50; font-weight:bold;'>[ SACRED RELIC RESTORED ]</span> You anchor the Ancestral Blade into the cairn! K'tharr Void-Priests transmit a blood-tithe of <b>1,500c</b>, <b>+25 K'tharr Standing</b>, and +300 XP (Hull & Shields restored)!");
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    if (typeof showToast === 'function') showToast("+25 K'THARR REP & +1,500c", "success");
                    if (typeof renderUIStats === 'function') renderUIStats();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    if (typeof autoSaveGame === 'function') autoSaveGame();
                }
            });
            return acts;
        },
        onInteract: function(tileObj) {
            _locRecordDiscovery("K'tharr Blood-Cairn", ["FACTION_KTHARR", "COMMODITY_KTHARR_ANCESTRAL_BLADE"]);
            logMessage("<span style='color:#4CAF50; font-weight:bold;'>[ K'THARR BLOOD-CAIRN ]</span> Scorched hull prows orbit a quiet emerald beacon—a sacred K'tharr memorial shrine.");
            if (typeof renderContextualActions === 'function') {
                renderContextualActions(this.getLandmarkActions(tileObj));
            }
        }
    },

    "Whispering Prism": {
        name: "Whispering Prism",
        region: "Southern Rim",
        securityLevel: "NONE",
        portSpecialty: "Precursor Optical Lattice",
        isLandmark: true,
        coords: { x: -85, y: 220 }, // HUD [-85, -220]
        type: 'location',
        char: 'J',
        displayChar: '✧',
        customColor: "#FF66FF",
        scanFlavor: "Whispering Prism: A kilometer-wide octahedral crystal suspended at [-85, -220], splitting starlight into coherent subspace harmonics. Astrometrists swear it amplifies optical arrays.",
        getLandmarkActions: function(tileObj) {
            const acts = [];
            if (!tileObj || !tileObj.studied) {
                acts.push({
                    label: 'Align Spectral Optics',
                    key: 'e',
                    onclick: () => {
                        if (tileObj && tileObj.studied) return;
                        const hasOptics = _locHasPerk('ASTROMETRIC_SAVANT') ||
                            (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.scanner === 'SCANNER_NEXSTAR_4SE');
                        const xp = hasOptics ? 350 : 220;
                        playerXP += xp;

                        const gotLens = _locSafeAddCargo('QUANTUM_LENS', 1);
                        const gotPulsar = _locSafeAddCargo('DATA_PULSAR', 1);
                        const loot = [];
                        if (gotLens > 0) loot.push("<b>1x Quantum Lens</b>");
                        if (gotPulsar > 0) loot.push("<b>1x Pulsar Timing Data</b>");

                        if (typeof updateWorldState === 'function') {
                            updateWorldState(playerX, playerY, { studied: true, isUnique: true, lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0 });
                        }
                        if (tileObj) tileObj.studied = true;

                        logMessage(`<span style='color:#FF66FF; font-weight:bold;'>[ PRISM REFRACTION LOGGED ]</span> ${hasOptics ? 'Precision optics resolved deep Precursor overtones! ' : ''}Gained +${xp} XP${loot.length > 0 ? ` and recovered ${loot.join(' & ')}` : ''}!`);
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                        if (typeof showToast === 'function') showToast(`OPTICAL TELEMETRY (+${xp} XP)`, "success");
                        if (typeof renderUIStats === 'function') renderUIStats();

                        const leveledUp = typeof checkLevelUp === 'function' ? checkLevelUp() : false;
                        if (!leveledUp && typeof renderContextualActions === 'function') {
                            renderContextualActions(LOCATIONS_DATA["Whispering Prism"].getLandmarkActions(tileObj));
                        }
                        if (typeof autoSaveGame === 'function') autoSaveGame();
                    }
                });
            }
            acts.push({
                label: 'Harmonize Deflectors (+125% Shields)',
                key: 'v',
                onclick: () => {
                    if (typeof MAX_SHIELDS !== 'undefined') {
                        playerShields = Math.max(playerShields, Math.floor(MAX_SHIELDS * 1.25));
                    }
                    if (typeof stealthHeat !== 'undefined') stealthHeat = 0;
                    logMessage("<span style='color:#FF66FF'>[ WHISPERING PRISM ]</span> Coherent light washes over your hull—Shields overcharged to 125% and thermal sinks flushed.");
                    if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
                    if (typeof renderUIStats === 'function') renderUIStats();
                }
            });
            return acts;
        },
        onInteract: function(tileObj) {
            _locRecordDiscovery("Whispering Prism", ["PHENOMENON_VOID_CRYSTALS", "XENO_ANOMALIES"]);
            logMessage("<span style='color:#FF66FF; font-weight:bold;'>[ WHISPERING PRISM ]</span> A towering violet crystal octahedron turns lazily before you, refracting starlight across your sensors.");
            if (typeof renderContextualActions === 'function') {
                renderContextualActions(this.getLandmarkActions(tileObj));
            }
        }
    },

    "Planet Xerxes": {
        name: "Planet Xerxes",
        region: "Sol Fringe",
        securityLevel: "LAWLESS",
        portSpecialty: "The Precursor Spire & Shadow Network Vault",
        welcomeHail: "Xerxes Spire Automated Relay: Toxic atmosphere confirmed. Decrypt Layer 1 to access inner market vaults.",
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
        region: "K'tharr Heartworld (South-East)",
        securityLevel: "HIGH (K'THARR)",
        portSpecialty: "Magma Forges, Blood-Barges & Proving Grounds",
        welcomeHail: "Karak-Tor Forge Control: Outlander hull recognized. Keep weapons cold in the docking pit—save blood for the arena.",
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
        region: "K'tharr Border (East)",
        securityLevel: "HIGH (K'THARR)",
        portSpecialty: "Eastern War-Bastion & Relic Redemption",
        welcomeHail: "Fortress Drakon Garrison: State your clan or your cargo, outlander. Alloys and lost Ancestral Blades earn respect here.",
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
        region: "Eclipse Deep Rim (West)",
        securityLevel: "LAWLESS",
        portSpecialty: "Cartel Flagship Hub, Shadow Brokers & Night-Runners",
        welcomeHail: "Station Umbra Encrypted Relay: Cloaking veil parted for docking bay 9. Welcome to the Shadow Network.",
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
        region: "Eclipse Border (South-West)",
        securityLevel: "LAWLESS",
        portSpecialty: "Smuggler Staging Port, Identity Forger & Contraband Fence",
        welcomeHail: "Port Erebus Shadow-Tower: Dust cloud masks our approach. Watch your credits in the lower alleys.",
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
        region: "Core Academic Belt (North-East)",
        securityLevel: "HIGH",
        portSpecialty: "Astrophysics Grants, Spectroscopy & Xeno-Archaeology",
        welcomeHail: "University of Cygnus Prime: Welcome, scholar. Submit fresh pulsar, quasar, or Precursor telemetry at the science desk.",
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
        region: "Kepler Approaches (North-West)",
        securityLevel: "MODERATE",
        portSpecialty: "SEC-COM Recon Gear & Intelligence Bounties",
        welcomeHail: "Kepler Signal Relay: Transponder verified. Report any Eclipse Cartel movements along the nebula fringe.",
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
        region: "Northern Concord Rim",
        securityLevel: "HIGH",
        portSpecialty: "Heavy Drydocks, Drones & Alloy Fabrication",
        welcomeHail: "Ceti Alpha Yardmaster: Slipway 4 open. Watch the welding arcs—our cranes run round the clock.",
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
        region: "Southern Concord Rim",
        securityLevel: "MODERATE",
        portSpecialty: "Xy-Corp Smelting, Refined Alloy & Colony Prefabs",
        welcomeHail: "Helios Corporate Automated Greeting: Xy-Corp welcomes you—Progress Through Profit. Please clear ore bays promptly.",
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

    "Solitude Research Platform": {
        name: "Solitude Research Platform",
        region: "South-East Frontier",
        securityLevel: "MODERATE",
        portSpecialty: "Outer-Rim Xeno-Biology & Cryo-Medicine",
        welcomeHail: "Solitude Bio-Dome Control: Decontamination mist active in bay 2. Welcome to the outer-rim frontier, Commander.",
        coords: {
            y: 175,
            x: 165
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        displayChar: "H",
        customColor: "#00FFFF",
        faction: "CONCORD",
        isMajorHub: false,
        sells: [
            { id: "MEDICAL_SUPPLIES", priceMod: 0.75, stock: 60 },
            { id: "GENETIC_SAMPLES", priceMod: 0.85, stock: 30 },
            { id: "MINING_DRONE", priceMod: 0.9, stock: 15 },
            { id: "OVERCLOCK_CELL", priceMod: 0.95, stock: 12 },
            { id: "FUEL_CELLS", priceMod: 1.0, stock: 80 }
        ],
        buys: [
            { id: "SENTIENT_MYCELIUM", priceMod: 1.6, stock: 20 },
            { id: "KTHARR_SPICES", priceMod: 1.5, stock: 30 },
            { id: "DATA_SUPERNOVA", priceMod: 1.7, stock: 8 },
            { id: "DATA_MAGNETAR", priceMod: 1.6, stock: 10 },
            { id: "WATER", priceMod: 1.4, stock: 80 },
            { id: "FOOD_SUPPLIES", priceMod: 1.4, stock: 80 }
        ],
        factory: {
            consumes: "GENETIC_SAMPLES",
            produces: "MEDICAL_SUPPLIES",
            consumeQty: 2,
            produceQty: 3
        },
        scanFlavor: "Solitude Research Platform: A quiet Concord xeno-biology outpost perched between independent asteroid belts and K'tharr border lanes. Synthesizes trauma kits from alien flora and pays generous grants for mycelium and magnetar telemetry."
    },

    "Valkyrie Drift": {
        name: "Valkyrie Drift",
        region: "Eastern Asteroid Belt",
        securityLevel: "LOW",
        portSpecialty: "Raw Ores, Crystalline Geodes & Prospector Trade",
        welcomeHail: "Valkyrie Drift Ore-Boss: Clamp onto pylon 6 and watch the conveyor belts. Got fresh ale or droid servos aboard?",
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

    "The Sunken Compass": {
        name: "The Sunken Compass",
        region: "Western Rim Corridor",
        securityLevel: "LAWLESS",
        portSpecialty: "Scrap Bazaar, Repair Kits & Deep-Rim Salvage",
        welcomeHail: "Sunken Compass Salvage-Chief: Tie down to the stern ribs, spacer. We trade parts, geodes, and quiet favors—no questions asked.",
        coords: {
            y: -95,
            x: -290
        },
        type: OUTPOST_CHAR_VAL,
        char: OUTPOST_CHAR_VAL,
        displayChar: "§",
        customColor: "#FFAA66",
        faction: "INDEPENDENT",
        isMajorHub: false,
        isBlackMarket: true,
        sells: [
            { id: "MINERAL_GEODE", priceMod: 0.85, stock: 15 },
            { id: "TECH_PARTS", priceMod: 0.85, stock: 70 },
            { id: "NANO_REPAIR_KIT", priceMod: 0.8, stock: 25 },
            { id: "SENSOR_DECOY", priceMod: 0.9, stock: 10 },
            { id: "OBSIDIAN_TEAR_PLATING", priceMod: 1.05, stock: 4 },
            { id: "FUEL_CELLS", priceMod: 0.95, stock: 100 }
        ],
        buys: [
            { id: "PRECURSOR_ARTIFACT", priceMod: 1.9, stock: 4 },
            { id: "XENO_ANTIQUES", priceMod: 1.7, stock: 15 },
            { id: "ARTIFACT_SHARDS", priceMod: 1.6, stock: 30 },
            { id: "REFINED_ALLOY", priceMod: 1.4, stock: 60 },
            { id: "WATER", priceMod: 1.5, stock: 80 },
            { id: "FROTHY_MOON_ALE", priceMod: 1.7, stock: 35 }
        ],
        factory: {
            consumes: "MINERALS",
            produces: "NANO_REPAIR_KIT",
            consumeQty: 6,
            produceQty: 2
        },
        scanFlavor: "The Sunken Compass: A ramshackle salvage bazaar welded inside the cracked spine of an ancient colony freighter at [-290, 95]. Serves as the last neutral refueling and black-market stop before Station Umbra."
    },

    "Frothy Moon Outpost": {
        name: "Frothy Moon Outpost",
        region: "Sol Outer Ridge (East)",
        securityLevel: "LOW",
        portSpecialty: "Lunar Observatory, Craft Synth-Ale & Star Charts",
        welcomeHail: "Frothy Moon Taproom & Observatory: Clear skies tonight, Commander! Fresh dark synth-ale is on tap up on the dome deck.",
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
        region: "Northern Frontier",
        securityLevel: "NEUTRAL SANCTUARY",
        portSpecialty: "Fuel Rats Collective HQ, Discount Fuel & Stargates",
        welcomeHail: "Port Nomad Dispatch: Fuel Rats Sanctuary welcomes all hulls. Top off your tanks, grab a hot coffee, and fly safe.",
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
        region: "South-West Hull Graveyard",
        securityLevel: "LAWLESS",
        portSpecialty: "Forbidden Histories, Engrams & Precursor Relics",
        welcomeHail: "The Archivist: Ah, a curious mind enters the graveyard of iron. What forgotten light have you brought to trade?",
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

function _isXerxesLocked() {
    return typeof xerxesPuzzleLevel === 'undefined' || xerxesPuzzleLevel < 1;
}

const LocationUtils = {
    getLocation(nameOrKey) {
        if (!nameOrKey) return null;
        if (LOCATIONS_DATA[nameOrKey]) return LOCATIONS_DATA[nameOrKey];
        for (const k in LOCATIONS_DATA) {
            if (LOCATIONS_DATA[k] && LOCATIONS_DATA[k].name === nameOrKey) return LOCATIONS_DATA[k];
        }
        return null;
    },
    getByFaction(faction) {
        return Object.values(LOCATIONS_DATA).filter(loc => loc && !loc.isProcedural && loc.faction === faction);
    },
    getLandmarks() {
        return Object.values(LOCATIONS_DATA).filter(loc => loc && !loc.isProcedural && loc.isLandmark);
    },
    getTradePorts() {
        return Object.values(LOCATIONS_DATA).filter(loc => loc && !loc.isProcedural && !loc.isLandmark && (Array.isArray(loc.sells) || Array.isArray(loc.buys)));
    },
    getDistanceAndBearing(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        return {
            distance: Math.floor(Math.sqrt(dx * dx + dy * dy)),
            bearing: _locBearing(dx, dy)
        };
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
                best = { key, location: loc, distance: Math.floor(Math.sqrt(dSq)), bearing: _locBearing(dx, dy) };
            }
        }
        return best;
    },
    findBestBuyer(itemId, options = {}) {
        const includeLockedXerxes = Boolean(options.includeLockedXerxes);
        let best = null;
        for (const key in LOCATIONS_DATA) {
            if (!includeLockedXerxes && key === "Planet Xerxes" && _isXerxesLocked()) continue;
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
    findBestSeller(itemId, options = {}) {
        const includeLockedXerxes = Boolean(options.includeLockedXerxes);
        let best = null;
        for (const key in LOCATIONS_DATA) {
            if (!includeLockedXerxes && key === "Planet Xerxes" && _isXerxesLocked()) continue;
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
    findBestTradeRoutes(options = {}) {
        if (typeof COMMODITIES === 'undefined') return [];
        const limit = options.limit || 6;
        const onlyDiscovered = Boolean(options.onlyDiscovered);
        const includeIllegal = options.includeIllegal !== false;

        const ports = [];
        for (const key in LOCATIONS_DATA) {
            const loc = LOCATIONS_DATA[key];
            if (!loc || loc.isProcedural || loc.isLandmark || !loc.coords) continue;
            if (key === "Planet Xerxes" && _isXerxesLocked()) continue;
            if (onlyDiscovered && typeof discoveredLocations !== 'undefined' && discoveredLocations.has) {
                if (key !== "Starbase Alpha" && !discoveredLocations.has(loc.name || key) && !discoveredLocations.has(key)) {
                    continue;
                }
            }
            ports.push(loc);
        }

        const routes = [];
        for (let i = 0; i < ports.length; i++) {
            const seller = ports[i];
            if (!Array.isArray(seller.sells)) continue;

            for (let s = 0; s < seller.sells.length; s++) {
                const sellEntry = seller.sells[s];
                const itemId = sellEntry.id || sellEntry;
                const itemDef = COMMODITIES[itemId];
                if (!itemDef || itemDef.isTroop || itemDef.isComponent || !itemDef.basePrice) continue;
                if (!includeIllegal && itemDef.illegal) continue;
                if (['COLONY_CHARTER', 'STATION_CORE', 'WORMHOLE_STABILIZER', 'WAYFINDER_CORE', 'PREFAB_COLONY_CORE'].includes(itemId)) continue;

                const buyCost = Math.max(1, Math.floor(itemDef.basePrice * (sellEntry.priceMod || 1.0)));

                for (let j = 0; j < ports.length; j++) {
                    if (i === j) continue;
                    const buyer = ports[j];
                    if (!Array.isArray(buyer.buys)) continue;
                    const buyEntry = buyer.buys.find(b => (b.id === itemId) || (b === itemId));
                    if (!buyEntry) continue;

                    const buyerAlsoSells = Array.isArray(buyer.sells) && buyer.sells.some(e => (e.id === itemId) || (e === itemId));
                    const illegalMult = (itemDef.illegal && !buyerAlsoSells) ? 2.5 : 1.0;
                    const sellRevenue = Math.max(1, Math.floor(itemDef.basePrice * 0.5 * (buyEntry.priceMod || 1.0) * illegalMult));
                    const profitPerUnit = sellRevenue - buyCost;

                    if (profitPerUnit > 0) {
                        const dx = buyer.coords.x - seller.coords.x;
                        const dy = buyer.coords.y - seller.coords.y;
                        const dist = Math.floor(Math.sqrt(dx * dx + dy * dy));
                        routes.push({
                            itemId,
                            itemName: itemDef.name,
                            illegal: Boolean(itemDef.illegal),
                            from: seller.name,
                            fromCoords: seller.coords,
                            to: buyer.name,
                            toCoords: buyer.coords,
                            buyCost,
                            sellRevenue,
                            profitPerUnit,
                            distance: dist
                        });
                    }
                }
            }
        }

        routes.sort((a, b) => b.profitPerUnit - a.profitPerUnit);
        return routes.slice(0, limit);
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
// --- COMMANDER DATAPAD: STAR ATLAS TAB ---
// ==========================================

window._atlasFilterMode = window._atlasFilterMode || 'ALL';

window.setStarAtlasFilter = function(mode) {
    window._atlasFilterMode = mode || 'ALL';
    if (typeof soundManager !== 'undefined' && typeof soundManager.playUIHover === 'function') {
        soundManager.playUIHover();
    }
    if (typeof window.displayCommanderProfile === 'function') {
        window.displayCommanderProfile('ATLAS');
    }
};

function _renderStarAtlasTabHtml() {
    const activeFilter = window._atlasFilterMode || 'ALL';
    const px = typeof playerX !== 'undefined' ? playerX : 0;
    const py = typeof playerY !== 'undefined' ? playerY : 0;

    const staticEntries = Object.keys(LOCATIONS_DATA)
        .filter(k => LOCATIONS_DATA[k] && !LOCATIONS_DATA[k].isProcedural && LOCATIONS_DATA[k].coords)
        .map(k => ({ key: k, loc: LOCATIONS_DATA[k] }));

    const isKnown = (entry) => {
        if (entry.key === "Starbase Alpha") return true;
        if (typeof discoveredLocations === 'undefined' || !discoveredLocations.has) return false;
        return discoveredLocations.has(entry.loc.name) || discoveredLocations.has(entry.key);
    };

    const totalCount = staticEntries.length;
    const discoveredCount = staticEntries.filter(isKnown).length;

    const filters = ['ALL', 'CONCORD', 'ECLIPSE', 'KTHARR', 'INDEPENDENT', 'LANDMARKS', 'ROUTES'];
    const filterBarHtml = `
        <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px;">
            ${filters.map(f => {
                const selected = activeFilter === f;
                return `<button type="button" onclick="setStarAtlasFilter('${f}')" style="padding:4px 7px; font-size:9px; font-family:var(--title-font); cursor:pointer; border-radius:3px; font-weight:bold; background:${selected ? 'rgba(0,224,224,0.16)' : 'rgba(0,0,0,0.35)'}; border:1px solid ${selected ? 'var(--accent-color)' : '#444'}; color:${selected ? 'var(--accent-color)' : 'var(--item-desc-color)'};">${f}</button>`;
            }).join('')}
        </div>
    `;

    let bodyHtml = '';

    if (activeFilter === 'ROUTES') {
        const routes = LocationUtils.findBestTradeRoutes({ limit: 8, onlyDiscovered: true, includeIllegal: true });
        if (routes.length === 0) {
            bodyHtml = `<div style="padding:20px; text-align:center; color:var(--item-desc-color); font-size:12px; font-style:italic;">Discover more trade ports across the galaxy to triangulate profitable trade lanes.</div>`;
        } else {
            bodyHtml = `
                <div style="font-size:10px; color:var(--item-desc-color); margin-bottom:8px;">
                    Estimated margins across charted ports (before perks, crew bonuses, or active sector booms):
                </div>
                ${routes.map(r => `
                    <div style="background:rgba(0,0,0,0.35); border-left:3px solid ${r.illegal ? 'var(--danger)' : 'var(--gold-text)'}; padding:8px 10px; margin-bottom:8px; border-radius:0 4px 4px 0; font-size:11px;">
                        <div style="display:flex; justify-content:space-between; font-weight:bold;">
                            <span style="color:var(--item-name-color);">${_locEscapeHtml(r.itemName)} ${r.illegal ? '<span style="color:var(--danger); font-size:9px;">[ILLEGAL]</span>' : ''}</span>
                            <span style="color:var(--success);">+${typeof formatNumber === 'function' ? formatNumber(r.profitPerUnit) : r.profitPerUnit}c / u</span>
                        </div>
                        <div style="color:var(--text-color); margin-top:4px;">
                            Buy: <b>${_locEscapeHtml(r.from)}</b> [${r.fromCoords.x}, ${-r.fromCoords.y}] (${r.buyCost}c) → Sell: <b>${_locEscapeHtml(r.to)}</b> [${r.toCoords.x}, ${-r.toCoords.y}] (${r.sellRevenue}c)
                        </div>
                        <div style="color:var(--item-desc-color); font-size:10px; margin-top:2px;">Lane Distance: ${r.distance}u</div>
                    </div>
                `).join('')}
            `;
        }
    } else {
        let filtered = staticEntries.filter(entry => {
            if (activeFilter === 'LANDMARKS') return Boolean(entry.loc.isLandmark);
            if (activeFilter === 'CONCORD' || activeFilter === 'ECLIPSE' || activeFilter === 'KTHARR' || activeFilter === 'INDEPENDENT') {
                return !entry.loc.isLandmark && entry.loc.faction === activeFilter;
            }
            return true;
        });

        // Sort discovered first, then nearest distance
        filtered.sort((a, b) => {
            const ka = isKnown(a) ? 1 : 0;
            const kb = isKnown(b) ? 1 : 0;
            if (ka !== kb) return kb - ka;
            const da = Math.pow(a.loc.coords.x - px, 2) + Math.pow(a.loc.coords.y - py, 2);
            const db = Math.pow(b.loc.coords.x - px, 2) + Math.pow(b.loc.coords.y - py, 2);
            return da - db;
        });

        bodyHtml = filtered.map(entry => {
            const loc = entry.loc;
            const known = isKnown(entry);
            const nav = LocationUtils.getDistanceAndBearing(px, py, loc.coords.x, loc.coords.y);

            let facColor = 'var(--accent-color)';
            if (loc.isLandmark) facColor = loc.customColor || '#DDA0DD';
            else if (loc.faction === 'CONCORD') facColor = '#00AAFF';
            else if (loc.faction === 'ECLIPSE' || loc.isBlackMarket) facColor = '#9933FF';
            else if (loc.faction === 'KTHARR') facColor = '#4CAF50';
            else facColor = 'var(--warning)';

            if (!known) {
                return `
                    <div style="background:rgba(0,0,0,0.22); border-left:3px solid #444; padding:8px 10px; margin-bottom:7px; border-radius:0 4px 4px 0; opacity:0.65; font-size:11px;">
                        <div style="display:flex; justify-content:space-between; color:var(--item-desc-color); font-weight:bold;">
                            <span>🔒 UNCHARTED ${loc.isLandmark ? 'DEEP-SPACE LANDMARK' : 'PORT'}</span>
                            <span>${_locEscapeHtml(loc.region || 'Frontier')}</span>
                        </div>
                        <div style="font-size:10px; color:#666; margin-top:3px;">
                            Bearing: ~${nav.bearing} · Explore or eavesdrop on Cantina rumors to chart coordinates.
                        </div>
                    </div>
                `;
            }

            let refineryLine = '';
            if (loc.factory && typeof COMMODITIES !== 'undefined') {
                const inName = COMMODITIES[loc.factory.consumes] ? COMMODITIES[loc.factory.consumes].name : loc.factory.consumes;
                const outName = COMMODITIES[loc.factory.produces] ? COMMODITIES[loc.factory.produces].name : loc.factory.produces;
                refineryLine = `<div style="font-size:10px; color:var(--success); margin-top:3px;">⚙️ Refinery: ${inName} → ${outName}</div>`;
            }

            return `
                <div style="background:rgba(0,0,0,0.35); border-left:3px solid ${facColor}; padding:8px 10px; margin-bottom:7px; border-radius:0 4px 4px 0; font-size:11px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                        <span style="color:${facColor}; font-weight:bold; font-size:12px;">${_locEscapeHtml(loc.name)}</span>
                        <span style="color:var(--accent-color); font-weight:bold;">[${loc.coords.x}, ${-loc.coords.y}] · ${nav.distance}u ${nav.bearing}</span>
                    </div>
                    <div style="color:var(--item-desc-color); font-size:10px; margin-top:3px;">
                        ${_locEscapeHtml(loc.region || 'Deep Space')} · Security: <b>${_locEscapeHtml(loc.securityLevel || 'UNKNOWN')}</b>${loc.isBlackMarket ? ' · <span style="color:#DDA0DD;">SHADOW NODE</span>' : ''}
                    </div>
                    ${loc.portSpecialty ? `<div style="color:var(--text-color); font-size:10px; margin-top:3px;">${_locEscapeHtml(loc.portSpecialty)}</div>` : ''}
                    ${refineryLine}
                </div>
            `;
        }).join('');
    }

    return `
        <div style="padding:4px 0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:12px;">
                <h3 style="color:var(--accent-color); margin:0;">GALACTIC STAR ATLAS</h3>
                <span style="font-size:10px; color:var(--gold-text); letter-spacing:1px;">${discoveredCount} / ${totalCount} CHARTED</span>
            </div>
            ${filterBarHtml}
            <div style="max-height:330px; overflow-y:auto; padding-right:4px;">
                ${bodyHtml}
            </div>
        </div>
    `;
}

// ==========================================
// --- SELF-CONTAINED LOCATION PATCHES ---
// ==========================================

(function initLocationFixes() {
    let _lastWelcomePortKey = "";

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

    // 2. Register Codex Lore Entries for All Static Locations (Zero duplicate aliases)
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

        // Register Star Atlas tab cleanly into Commander Datapad via ui.js API
        if (typeof window.UI !== 'undefined' && typeof window.UI.registerProfileTab === 'function' && !window._locAtlasTabRegistered) {
            window.UI.registerProfileTab({
                id: 'ATLAS',
                name: 'Star Atlas',
                icon: '🗺️',
                render: _renderStarAtlasTabHtml
            });
            window._locAtlasTabRegistered = true;
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

        // 6. Prevent Planet Xerxes Enter-Key Bypass, Enrich Port Telemetry & Inject Mission Turn-In Buttons
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

                if (!location) return;

                // Append structured Port Security & Refinery Telemetry cleanly into #stationDescText
                const staticDef = LocationUtils.getLocation(location.name);
                const descEl = document.getElementById('stationDescText');
                if (descEl && staticDef) {
                    const metaLines = [];
                    if (staticDef.region || staticDef.securityLevel) {
                        metaLines.push(`[${staticDef.region || 'Frontier'} · SEC: ${staticDef.securityLevel || 'UNKNOWN'}]`);
                    }
                    if (staticDef.portSpecialty) {
                        metaLines.push(`Specialty: ${staticDef.portSpecialty}`);
                    }
                    if (staticDef.factory && typeof COMMODITIES !== 'undefined') {
                        const inN = COMMODITIES[staticDef.factory.consumes] ? COMMODITIES[staticDef.factory.consumes].name : staticDef.factory.consumes;
                        const outN = COMMODITIES[staticDef.factory.produces] ? COMMODITIES[staticDef.factory.produces].name : staticDef.factory.produces;
                        metaLines.push(`Refinery: ${inN} → ${outN}`);
                    }
                    if (metaLines.length > 0) {
                        descEl.textContent = `${descEl.textContent}\n\n${metaLines.join('\n')}`;
                    }
                }

                // Log station welcome hail once per docking visit
                if (staticDef && staticDef.welcomeHail && typeof logMessage === 'function') {
                    const visitKey = `${staticDef.name}_${Math.floor(typeof currentGameDate !== 'undefined' ? currentGameDate : 0)}`;
                    if (_lastWelcomePortKey !== visitKey) {
                        _lastWelcomePortKey = visitKey;
                        logMessage(`<span style="color:var(--accent-color)">[ PORT COMMS ]</span> <i>"${_locEscapeHtml(staticDef.welcomeHail)}"</i>`);
                    }
                }

                if (typeof playerActiveMission === 'undefined' || !playerActiveMission) return;

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
                            <span class="btn-sub" style="color:var(--text-color);">Deliver ${obj.count}x ${_locEscapeHtml(itemName)} (Hold: ${haveQty}/${obj.count})</span>
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
                            <span class="btn-sub" style="color:var(--text-color);">Deliver ${obj.count}x ${_locEscapeHtml(itemName)} (Hold: ${haveQty}/${obj.count})</span>
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
                            <span class="btn-sub" style="color:var(--text-color);">${_locEscapeHtml(playerActiveMission.title)}</span>
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

                const isValidDest = (key) => {
                    const loc = LOCATIONS_DATA[key];
                    if (!loc || !loc.coords || loc.isLandmark) return false;
                    if (key === currentStationName || loc.name === currentStationName || key === "Planet Xerxes") return false;
                    return Array.isArray(loc.buys) && loc.buys.length > 0;
                };

                let candidates = allKeys.filter(key => {
                    if (!isValidDest(key)) return false;
                    const loc = LOCATIONS_DATA[key];
                    const dx = loc.coords.x - playerX;
                    const dy = loc.coords.y - playerY;
                    return (dx * dx + dy * dy) <= maxDistSq;
                });

                if (candidates.length === 0) {
                    candidates = allKeys.filter(isValidDest);
                }
                if (candidates.length === 0) return null;

                const destKey = candidates[Math.floor(Math.random() * candidates.length)];
                const destData = LOCATIONS_DATA[destKey];
                const secX = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destData.coords.x / SECTOR_SIZE) : 0;
                const secY = typeof SECTOR_SIZE !== 'undefined' ? Math.floor(destData.coords.y / SECTOR_SIZE) : 0;

                return {
                    name: destData.name || destKey,
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
