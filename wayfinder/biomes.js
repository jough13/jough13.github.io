// --- START OF FILE biomes.js ---

// ==========================================
// --- PLANET BIOMES DATABASE ---
// ==========================================

const PLANET_BIOMES = {
    BARREN_ROCK: {
        id: "BARREN_ROCK",
        name: "Barren Rock",
        landable: true,
        weight: 90, // Very Common
        hazard: "NONE",
        colonyBonusDesc: "Standard baseline output",
        description: "A lifeless, crater-scarred rock rich in common silicate and iron ores.",
        resources: ['MINERALS'],
        image: 'assets/barren_rock.png',
        expeditionFlavor: "Your rover traverses miles of silent, dust-choked craters and exposed basalt ridges.",
        expeditionData: { baseXp: 80 }
    },
    KARST_CAVERN: {
        id: "KARST_CAVERN",
        name: "Subterranean Karst World",
        landable: true,
        weight: 35, // Common
        hazard: "TECTONIC TREMORS",
        colonyBonusDesc: "+25% Mineral & Water extraction",
        description: "An arid crust honeycombed with massive subterranean limestone caverns, geothermal aquifers, and crystal geodes.",
        resources: ['MINERALS', 'WATER', 'MINERAL_GEODE'],
        image: 'assets/barren_rock.png',
        expeditionFlavor: "Rappelling into a cathedral-sized sinkhole, your survey team maps a labyrinth of geode-lined caverns.",
        expeditionData: {
            baseXp: 95,
            guaranteedLoot: [{ id: 'MINERAL_GEODE', min: 1, max: 3 }, { id: 'MINERALS', min: 4, max: 8 }]
        }
    },
    GAS_GIANT: {
        id: "GAS_GIANT",
        name: "Gas Giant",
        landable: false,
        weight: 60, // Common
        hazard: "CRUSHING GRAVITY",
        colonyBonusDesc: "Uninhabitable (Orbital Skimming Only)",
        description: "A swirling colossus of metallic hydrogen, helium bands, and hyper-velocity cyclonic storms.",
        resources: ['HYDROGEN_3'],
        image: 'assets/gas_giant.png',
        expeditionFlavor: "Skimming the upper stratosphere for heavy hydrogen isotopes.",
        expeditionData: { baseXp: 85 }
    },
    ICE_GIANT: {
        id: "ICE_GIANT",
        name: "Ice Giant",
        landable: false,
        weight: 50, // Common
        hazard: "CRYO-STORMS",
        colonyBonusDesc: "Uninhabitable (Orbital Skimming Only)",
        description: "A colossal world of supercritical water, ammonia, and frozen methane clouds.",
        resources: ['HYDROGEN_3', 'WATER', 'QUANTUM_FLUID'],
        image: 'assets/ice_giant.png',
        expeditionFlavor: "Dropping cryogenic collection scoops into the upper methane cloud deck.",
        expeditionData: { baseXp: 90 }
    },
    DESERT: {
        id: "DESERT",
        name: "Arid Dune World",
        landable: true,
        weight: 30, // Common-Uncommon
        hazard: "SILICA STORMS",
        colonyBonusDesc: "-50% Water output, rich spice veins",
        description: "Endless seas of wind-carved quartz dunes hiding ancient dry seabeds and spice-rich fissures.",
        resources: ['MINERALS', 'GOLD', 'KTHARR_SPICES'],
        image: 'assets/desert_world.png',
        expeditionFlavor: "Fighting through a howling electrostatic sandstorm, your team locates a sheltered canyon vein.",
        expeditionData: { baseXp: 90 }
    },
    GLACIAL: {
        id: "GLACIAL",
        name: "Cryo-Glacial World",
        landable: true,
        weight: 25, // Uncommon
        hazard: "EXTREME COLD",
        colonyBonusDesc: "+50% Water condenser output",
        description: "A frozen world locked in a permanent ice age. Sub-glacial pockets hold ultra-pure water and super-cooled fluids.",
        resources: ['WATER', 'MINERALS', 'QUANTUM_FLUID'],
        image: 'assets/glacial_world.png',
        expeditionFlavor: "Descending into a glowing blue glacial crevasse, you tap into a pressurized sub-surface thermal vent.",
        expeditionData: { baseXp: 95 }
    },
    TIDAL_LOCKED: {
        id: "TIDAL_LOCKED",
        name: "Terminator Twilight World",
        landable: true,
        weight: 18, // Uncommon
        hazard: "KATABATIC GALES",
        colonyBonusDesc: "+25% Solar & Water efficiency",
        description: "Tidally locked to its parent star. One hemisphere is baked in perpetual noon, the other frozen in eternal night, separated by a narrow habitable twilight ring.",
        resources: ['WATER', 'FOOD_SUPPLIES', 'RARE_METALS'],
        image: 'assets/glacial_world.png',
        expeditionFlavor: "Driving along the permanent sunset ridge where warm dayside winds collide with nightside glaciers, you harvest rare condensates.",
        expeditionData: {
            baseXp: 110,
            hazard: { chance: 0.20, type: "WIND", damage: 8, msg: "⚠️ KATABATIC GALE: Hurricane-force terminator winds battered your landing struts." }
        }
    },
    VOLCANIC: {
        id: "VOLCANIC",
        name: "Volcanic World",
        landable: true,
        weight: 20, // Uncommon
        hazard: "EXTREME HEAT",
        colonyBonusDesc: "+50% Alloy smelting output",
        description: "A molten hellscape of tectonic rivers and ash clouds, rich in heavy platinum-group metals.",
        resources: ['RARE_METALS', 'PLATINUM_ORE', 'MINERALS'],
        image: 'assets/volcanic_world.png',
        expeditionFlavor: "Heat shields straining against the magma plumes, your survey team extracts samples from a cooling lava tube.",
        expeditionData: { 
            baseXp: 100,
            hazard: { chance: 0.30, type: "HEAT", damage: 12, msg: "⚠️ THERMAL SPIKE: Magma proximity scorched the hull." }
        }
    },
    TOXIC: {
        id: "TOXIC",
        name: "Toxic Jungle",
        landable: true,
        weight: 15, // Uncommon
        hazard: "CORROSIVE SPORES",
        colonyBonusDesc: "High bio-yields, corrosive atmosphere",
        description: "A sweltering greenhouse world teeming with aggressive, hyper-evolved alien flora.",
        resources: ['GENETIC_SAMPLES', 'KTHARR_SPICES', 'SENTIENT_MYCELIUM'],
        image: 'assets/toxic_jungle.png',
        expeditionFlavor: "Hacking through bioluminescent vines and acid-spitting flora, you catalog a pristine xeno-botanical grove.",
        expeditionData: { baseXp: 110, loreKey: 'LEGEND_SENTIENT_MYCELIUM_NETWORK' }
    },
    SULFURIC_MIRE: {
        id: "SULFURIC_MIRE",
        name: "Sulfuric Acid Mire",
        landable: true,
        weight: 12, // Uncommon-Rare
        hazard: "ACIDIC VAPORS",
        colonyBonusDesc: "Rich chemical & medical synthesis",
        description: "A steaming cauldron of yellow sulfur lakes, geysers, and extremophile bacterial mats.",
        resources: ['QUANTUM_FLUID', 'MEDICAL_SUPPLIES', 'GENETIC_SAMPLES'],
        image: 'assets/toxic_jungle.png',
        expeditionFlavor: "Hover-skiffs skimming across boiling sulfuric lagoons, your team syphons high-purity catalytic gels.",
        expeditionData: {
            baseXp: 120,
            hazard: { chance: 0.25, type: "ACID", damage: 10, msg: "⚠️ CORROSIVE FOG: Acidic condensation pitted your outer hull." }
        }
    },
    OCEANIC: {
        id: "OCEANIC",
        name: "Oceanic World",
        landable: true,
        weight: 10, // Rare
        hazard: "TIDAL SURGES",
        colonyBonusDesc: "+50% Water & Hydroponics output",
        description: "A pelagic world covered in deep, turbulent oceans dotted with volcanic archipelagos and kelp forests.",
        resources: ['WATER', 'FOOD_SUPPLIES', 'GENETIC_SAMPLES', 'HYDROGEN_3'],
        image: 'assets/ocean_world.png',
        expeditionFlavor: "Touching down on a narrow basalt atoll, you deploy submersible drones into a thriving abyssal trench.",
        expeditionData: { baseXp: 115 }
    },
    SHATTERED_CORE: {
        id: "SHATTERED_CORE",
        name: "Tectonic Core World",
        landable: true,
        weight: 8, // Rare
        hazard: "GRAVIMETRIC SHEAR",
        colonyBonusDesc: "Rich heavy metal & alloy veins",
        description: "A planet partially ripped open by an ancient orbital impact, exposing its dense metallic planetary core.",
        resources: ['PLATINUM_ORE', 'RARE_METALS', 'REFINED_ALLOY'],
        image: 'assets/shattered_core.png',
        expeditionFlavor: "Navigating zero-G debris ribbons hovering above the exposed planetary mantle, you cut free slabs of pure core alloy.",
        expeditionData: { baseXp: 130 }
    },
    FERRIC_MOON: {
        id: "FERRIC_MOON",
        name: "Captured Ferric Core-Moon",
        landable: true,
        weight: 9, // Rare
        hazard: "MAGNETIC EDDIES",
        colonyBonusDesc: "High-density Platinum & Gold veins",
        description: "The stripped metallic core of a proto-planet captured in a tight stellar orbit. Its magnetic field hums with raw ore.",
        resources: ['GOLD', 'PLATINUM_ORE', 'RARE_METALS', 'MINERAL_GEODE'],
        image: 'assets/shattered_core.png',
        expeditionFlavor: "Magnetic grapplers anchored to pure nickel-iron cliffs, your team extracts veins of native gold and platinum.",
        expeditionData: {
            baseXp: 125,
            guaranteedLoot: [{ id: 'PLATINUM_ORE', min: 2, max: 4 }, { id: 'GOLD', min: 1, max: 3 }]
        }
    },
    MYCELIAL: {
        id: "MYCELIAL",
        name: "Mycelial Spore World",
        landable: true,
        weight: 6, // Very Rare
        hazard: "PSYCHOTROPIC FOG",
        colonyBonusDesc: "Natural Mycelium & Medical synthesis",
        description: "A twilight world carpeted in towering fungal spires linked by a planet-spanning neural root network.",
        resources: ['SENTIENT_MYCELIUM', 'GENETIC_SAMPLES', 'MEDICAL_SUPPLIES'],
        image: 'assets/mycelial_world.png',
        expeditionFlavor: "The fungal canopy pulses in mathematical rhythm with your ship's engine as you harvest psychoactive spore clusters.",
        expeditionData: { 
            baseXp: 150, 
            loreKey: 'LEGEND_SENTIENT_MYCELIUM_NETWORK',
            guaranteedLoot: [{ id: 'SENTIENT_MYCELIUM', min: 2, max: 5 }]
        }
    },
    TERRAN: {
        id: "TERRAN",
        name: "Terran World",
        landable: true,
        weight: 5, // Very Rare (Earth-like)
        hazard: "NONE",
        colonyBonusDesc: "Ideal habitability, high morale & growth",
        description: "A garden world with liquid oceans, nitrogen-oxygen atmosphere, and thriving continental ecosystems.",
        resources: ['FOOD_SUPPLIES', 'WATER', 'MINERALS', 'GENETIC_SAMPLES'],
        image: 'assets/terran_world.png',
        expeditionFlavor: "Cruising over temperate river valleys and lush forests, your team maps an ideal site for human habitation.",
        expeditionData: { baseXp: 160 }
    },
    BIOLUMINESCENT: {
        id: "BIOLUMINESCENT",
        name: "Bioluminescent Eden",
        landable: true,
        weight: 4, // Very Rare
        hazard: "NONE",
        colonyBonusDesc: "Paradise biome, high morale & bio-yields",
        description: "A serene twilight garden world where every forest, reef, and meadow glows with cold, bioluminescent symphony.",
        resources: ['FOOD_SUPPLIES', 'MEDICAL_SUPPLIES', 'GENETIC_SAMPLES', 'WATER'],
        image: 'assets/terran_world.png',
        expeditionFlavor: "Wandering beneath glowing cyan canopy trees, your away team collects rare regenerative flora and pure spring water.",
        expeditionData: {
            baseXp: 175,
            guaranteedLoot: [{ id: 'MEDICAL_SUPPLIES', min: 2, max: 5 }, { id: 'GENETIC_SAMPLES', min: 2, max: 4 }]
        }
    },
    IRRADIATED: {
        id: "IRRADIATED",
        name: "Irradiated Wasteland",
        landable: true,
        weight: 4, // Very Rare
        hazard: "SEVERE RADIATION",
        colonyBonusDesc: "Extreme actinide & crystal yields",
        description: "A dangerously radioactive rock. Surface gamma spectrometry readings are off the charts, indicating high concentrations of unstable Uranium isotopes.",
        resources: ['RARE_METALS', 'VOID_CRYSTALS', 'PLATINUM_ORE'],
        image: 'assets/wasteland.png',
        expeditionFlavor: "Dosimeters clicking frantically, you brave the glassed craters of an ancient nuclear bombardment.",
        expeditionData: { 
            baseXp: 180, 
            loreKey: 'PHENOMENON_IRRADIATED',
            guaranteedLoot: [{ id: 'VOID_CRYSTALS', min: 1, max: 3 }],
            hazard: { chance: 0.45, type: 'RADIATION', damage: 15, msg: '⚠️ RADIATION HAZARD: Surface gamma flux penetrated shielding.' }
        }
    },
    GLASS_WASTELAND: {
        id: "GLASS_WASTELAND",
        name: "Orbital-Slagged Battlefield",
        landable: true,
        weight: 3, // Ultra Rare
        hazard: "UNEXPLODED ORDNANCE",
        colonyBonusDesc: "Rich military salvage & alloy slag",
        description: "A world vitrified into black trinitite glass during an ancient fleet war. Shattered dreadnought ribs still jut from the plains.",
        resources: ['TECH_PARTS', 'REFINED_ALLOY', 'OBSIDIAN_TEAR_PLATING'],
        image: 'assets/wasteland.png',
        expeditionFlavor: "Cutting into the half-buried spine of a pre-Concord warship, your team salvages intact armor plating and military electronics.",
        expeditionData: {
            baseXp: 195,
            loreKey: 'XENO_DERELICTS',
            guaranteedLoot: [{ id: 'OBSIDIAN_TEAR_PLATING', min: 1, max: 2 }, { id: 'TECH_PARTS', min: 3, max: 6 }],
            hazard: { chance: 0.35, type: 'RADIATION', damage: 14, msg: '⚠️ RESIDUAL FALLOUT: Disturbed slag pockets released a burst of hard gamma radiation.' }
        }
    },
    TOMB_WORLD: {
        id: "TOMB_WORLD",
        name: "Precursor Tomb World",
        landable: true,
        weight: 3, // Ultra Rare
        hazard: "AUTOMATED SENTINELS",
        colonyBonusDesc: "Ancient Precursor relic excavations",
        description: "A dead world covered in the weathered obsidian geometry of a vanished Precursor civilization.",
        resources: ['ARTIFACT_SHARDS', 'TECH_PARTS', 'ANCIENT_RELICS'],
        image: 'assets/tomb_world.png',
        expeditionFlavor: "Beneath a collapsed monolith, your scanners pinpoint a sealed Precursor subterranean archive.",
        expeditionData: { 
            baseXp: 250, 
            loreKey: 'XENO_PRECURSORS',
            guaranteedLoot: [{ id: 'ANCIENT_RELICS', min: 1, max: 1 }, { id: 'ARTIFACT_SHARDS', min: 2, max: 5 }]
        }
    },
    ARCHIVE_WORLD: {
        id: "ARCHIVE_WORLD",
        name: "Precursor Archive Sphere",
        landable: true,
        weight: 1, // Legendary
        hazard: "QUANTUM WARDS",
        colonyBonusDesc: "Peak Precursor data & research output",
        description: "A hollow, artificial planetoid constructed by the Architects to store holographic star-charts and engrammatic histories.",
        resources: ['PRECURSOR_DATACUBE', 'ENCRYPTED_ENGRAM', 'ARTIFACT_SHARDS', 'PRECURSOR_STAR_MAP_FRAGMENT'],
        image: 'assets/tomb_world.png',
        expeditionFlavor: "Stepping onto a continent of glowing crystalline memory banks, your crew downloads terabytes of Precursor telemetry.",
        expeditionData: {
            baseXp: 280,
            loreKey: 'PRECURSOR_ORIGINS',
            guaranteedLoot: [{ id: 'ENCRYPTED_ENGRAM', min: 1, max: 2 }, { id: 'PRECURSOR_STAR_MAP_FRAGMENT', min: 1, max: 1 }]
        }
    },
    CRYSTAL: {
        id: "CRYSTAL",
        name: "Crystalline Anomaly",
        landable: true,
        weight: 2, // Ultra Rare
        hazard: "RESONANCE HARMONICS",
        colonyBonusDesc: "High Void Crystal & Quantum Lens output",
        description: "A rare world composed entirely of exotic, resonant silicon-void crystal lattices.",
        resources: ['VOID_CRYSTALS', 'PHASE_SHIFTED_ALLOY', 'QUANTUM_LENS'],
        image: 'assets/crystal_anomaly.png',
        expeditionFlavor: "Laser cutters hum in harmonic sympathy with towering violet crystal spires that refract starlight into impossible angles.",
        expeditionData: { 
            baseXp: 200, 
            loreKey: 'PHENOMENON_VOID_CRYSTALS',
            guaranteedLoot: [{ id: 'VOID_CRYSTALS', min: 2, max: 4 }, { id: 'QUANTUM_LENS', min: 0, max: 1 }]
        }
    },
    MACHINE_WORLD: {
        id: "MACHINE_WORLD",
        name: "Machine World",
        landable: true,
        weight: 1, // Legendary
        hazard: "ROGUE ICE-WALLS",
        colonyBonusDesc: "+50% Tech Parts manufacturing",
        description: "A planet entirely encased in metallic structures, humming data-conduits, and sprawling orbital rings. No biological life detected.",
        resources: ['TECH_PARTS', 'CYBERNETIC_IMPLANTS', 'AI_CORE'],
        image: 'assets/machine_world.png',
        expeditionFlavor: "Descending into a canyon-sized server trench, you tap directly into an ancient planetary data-conduit.",
        expeditionData: { baseXp: 200, loreKey: 'XENO_MACHINE_WORLD' }
    },
    DEATH_WORLD: {
        id: "DEATH_WORLD",
        name: "Death World",
        landable: true,
        weight: 2, // Ultra Rare
        hazard: "APEX PREDATORS",
        colonyBonusDesc: "High-value xeno-biological harvest",
        description: "A hyper-lethal paradise. The flora is venomous, the fauna is armored, and the weather is apocalyptic.",
        resources: ['GENETIC_SAMPLES', 'ILLEGAL_ORGANS', 'MEDICAL_SUPPLIES'],
        image: 'assets/death_world.png',
        expeditionFlavor: "Your away team barely survives an ambush by cloaked, scythe-limbed apex predators.",
        expeditionData: { 
            baseXp: 220, 
            guaranteedLoot: [{ id: 'ILLEGAL_ORGANS', min: 1, max: 2 }, { id: 'GENETIC_SAMPLES', min: 3, max: 6 }],
            hazard: { chance: 0.60, type: 'COMBAT', damage: 20, msg: '⚠️ PREDATOR AMBUSH: The local fauna breached your rover hull!' }
        }
    }
};

// Normalize and freeze the database to optimize V8 memory lookups
for (const bKey in PLANET_BIOMES) {
    const b = PLANET_BIOMES[bKey];
    if (b && !b.id) b.id = bKey;
    if (b && Array.isArray(b.resources)) Object.freeze(b.resources);
    Object.freeze(b);
}
Object.freeze(PLANET_BIOMES);
window.PLANET_BIOMES = PLANET_BIOMES;

if (typeof GameRegistry !== 'undefined') {
    GameRegistry.biomes = PLANET_BIOMES;
}

// ==========================================
// --- BIOME UTILITY API ---
// ==========================================

const BiomeUtils = {
    getBiome(idOrName) {
        if (!idOrName) return PLANET_BIOMES.BARREN_ROCK;
        if (PLANET_BIOMES[idOrName]) return PLANET_BIOMES[idOrName];
        const foundKey = Object.keys(PLANET_BIOMES).find(k => PLANET_BIOMES[k].name === idOrName);
        return foundKey ? PLANET_BIOMES[foundKey] : PLANET_BIOMES.BARREN_ROCK;
    },
    isHabitableBiome(id) {
        return ['TERRAN', 'BIOLUMINESCENT', 'OCEANIC', 'TOXIC', 'MYCELIAL', 'TIDAL_LOCKED'].includes(id);
    },
    isGiantBiome(id) {
        return ['GAS_GIANT', 'ICE_GIANT'].includes(id);
    }
};
window.BiomeUtils = BiomeUtils;

// Internal helper to check player perks safely across Set or Array formats
function _biomeHasPerk(perkId) {
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

// ==========================================
// --- SPECIAL PLANETARY OPERATIONS ---
// ==========================================

// 1. Gas / Ice Giant Orbital Atmospheric Skimming (Triggered from System Map)
function skimGasGiantAtmosphere(planetIndex) {
    if (!currentSystemData || !currentSystemData.planets || !currentSystemData.planets[planetIndex]) return;
    const planet = currentSystemData.planets[planetIndex];
    const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${planetIndex}`;
    const savedState = (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[sysKey]) ? worldStateDeltas[sysKey] : {};

    if (planet.skimmedThisVisit || savedState.skimmed) {
        if (typeof showToast === 'function') showToast("UPPER ATMOSPHERE ALREADY SKIMMED", "info");
        if (typeof logMessage === 'function') logMessage("Upper atmospheric isotope bands are turbulent and depleted for this visit.");
        return;
    }

    planet.skimmedThisVisit = true;
    planet.scannedThisVisit = true;
    if (typeof worldStateDeltas !== 'undefined') {
        if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
        worldStateDeltas[sysKey].skimmed = true;
        worldStateDeltas[sysKey].scanned = true;
        worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
    }

    if (typeof advanceGameTime === 'function') advanceGameTime(0.15);

    // Top off ship fuel + harvest Hydrogen-3 / Water / Quantum Fluid
    const fuelGain = 45 + Math.floor(Math.random() * 35);
    if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
        playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + fuelGain) * 10) / 10);
    }

    const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
    const h3Qty = Math.min(spaceLeft, 2 + Math.floor(Math.random() * 4));
    let lootNotes = [`+${fuelGain} Fuel`];

    if (h3Qty > 0 && typeof playerCargo !== 'undefined') {
        playerCargo['HYDROGEN_3'] = (playerCargo['HYDROGEN_3'] || 0) + h3Qty;
        lootNotes.push(`+${h3Qty}x Hydrogen-3`);
        if (planet.biome.id === 'ICE_GIANT' && (spaceLeft - h3Qty) >= 2) {
            playerCargo['WATER'] = (playerCargo['WATER'] || 0) + 2;
            lootNotes.push(`+2x Purified Water`);
        }
        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    }

    const xpGain = 55;
    if (typeof playerXP !== 'undefined') playerXP += xpGain;

    if (typeof soundManager !== 'undefined') soundManager.playGain();
    if (typeof showToast === 'function') showToast(`ATMO-SKIM: ${lootNotes.join(', ')}`, "success");
    if (typeof logMessage === 'function') {
        logMessage(`<span style="color:var(--accent-color); font-weight:bold;">[ ATMOSPHERIC SKIM ]</span> Dived into ${planet.name}'s upper cloud bands! Recovered ${lootNotes.join(', ')} (+${xpGain} XP).`);
    }

    if (typeof checkLevelUp === 'function') checkLevelUp();
    if (typeof renderSystemMap === 'function' && currentGameState === GAME_STATES.SYSTEM_MAP) {
        renderSystemMap();
    }
}
window.skimGasGiantAtmosphere = skimGasGiantAtmosphere;

// 2. Special Biome Surface Action Dispatcher (Tomb Worlds, Crystal Anomalies, Mycelial Worlds)
function executeBiomeSpecialAction() {
    if (!currentSystemData || !currentSystemData.planets) return;
    const planet = currentSystemData.planets[selectedPlanetIndex];
    if (!planet || planet.specialUsedThisVisit) return;

    const bId = planet.biome.id || 'BARREN_ROCK';
    const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;

    planet.specialUsedThisVisit = true;
    if (typeof worldStateDeltas !== 'undefined') {
        if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
        worldStateDeltas[sysKey].specialUsed = true;
        worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
    }

    if (typeof advanceGameTime === 'function') advanceGameTime(0.20);

    // A. TOMB_WORLD or ARCHIVE_WORLD: Subterranean Precursor Excavation
    if (bId === 'TOMB_WORLD' || bId === 'ARCHIVE_WORLD') {
        if (typeof unlockLoreEntry === 'function') {
            unlockLoreEntry('XENO_TOMB_WORLDS');
            unlockLoreEntry('XENO_PRECURSORS');
        }
        // If enterPrecursorVault is available and player chooses, 40% chance to unseal a full Precursor Puzzle Vault!
        if (typeof enterPrecursorVault === 'function' && Math.random() < 0.45) {
            if (typeof logMessage === 'function') {
                logMessage("<span style='color:#9933FF; font-weight:bold;'>[ TOMB UNSEALED ]</span> Your excavation charges breached a subterranean Precursor Vault!");
            }
            enterPrecursorVault();
            return;
        }

        const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
        const dropPool = ['PRECURSOR_DATACUBE', 'ENCRYPTED_ENGRAM', 'PRECURSOR_STAR_MAP_FRAGMENT', 'ANCIENT_RELICS'];
        const picked = dropPool[Math.floor(Math.random() * dropPool.length)];
        const xp = 220;
        if (typeof playerXP !== 'undefined') playerXP += xp;

        let lootText = "";
        if (spaceLeft >= 1 && typeof COMMODITIES !== 'undefined' && COMMODITIES[picked]) {
            playerCargo[picked] = (playerCargo[picked] || 0) + 1;
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
            lootText = ` Unearthed <b>1x ${COMMODITIES[picked].name}</b>!`;
        }
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        if (typeof showToast === 'function') showToast("SANCTUM EXCAVATED", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#DDA0DD; font-weight:bold;">[ TOMB EXCAVATION ]</span> Breached a sealed stasis crypt (+${xp} XP).${lootText}`);
        }
    }
    // B. CRYSTAL: Harmonic Lattice Attunement
    else if (bId === 'CRYSTAL') {
        if (typeof unlockLoreEntry === 'function') unlockLoreEntry('PHENOMENON_VOID_CRYSTALS');
        if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
            playerShields = Math.floor(MAX_SHIELDS * 1.5);
        }
        if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined') {
            playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 25);
        }
        const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
        let lensMsg = "";
        if (spaceLeft >= 1 && typeof COMMODITIES !== 'undefined') {
            const drop = Math.random() < 0.5 ? 'QUANTUM_LENS' : 'VOID_CRYSTALS';
            playerCargo[drop] = (playerCargo[drop] || 0) + 1;
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
            lensMsg = ` Focused laser harmonics cleaved <b>1x ${COMMODITIES[drop].name}</b>!`;
        }
        if (typeof playerXP !== 'undefined') playerXP += 180;
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        if (typeof showToast === 'function') showToast("SHIELDS OVERCHARGED (150%)", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#FF33FF; font-weight:bold;">[ HARMONIC ATTUNEMENT ]</span> Planetary crystal spires supercharged your shields to 150%, patched +25 Hull, and granted +180 XP!${lensMsg}`);
        }
    }
    // C. MYCELIAL: Spore Neural Communion
    else if (bId === 'MYCELIAL') {
        if (typeof unlockLoreEntry === 'function') unlockLoreEntry('LEGEND_SENTIENT_MYCELIUM_NETWORK');
        const xp = 200;
        if (typeof playerXP !== 'undefined') playerXP += xp;
        const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
        if (spaceLeft >= 1) {
            const addQty = Math.min(spaceLeft, 2);
            playerCargo['SENTIENT_MYCELIUM'] = (playerCargo['SENTIENT_MYCELIUM'] || 0) + addQty;
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
        if (typeof soundManager !== 'undefined') soundManager.playScan();
        if (typeof showToast === 'function') showToast("SPORE VISION RECEIVED (+200 XP)", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#00FFAA; font-weight:bold;">[ SPORE COMMUNION ]</span> The planet-spanning fungal intelligence shared visions of distant star-paths (+${xp} XP, +Sentient Mycelium)!`);
        }
    }

    if (typeof renderPlanetView === 'function') renderPlanetView();
    if (typeof checkLevelUp === 'function') checkLevelUp();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}
window.executeBiomeSpecialAction = executeBiomeSpecialAction;

// ==========================================
// --- SELF-CONTAINED PLANETARY PATCHES ---
// ==========================================

(function initBiomeMechanics() {
    function attachBiomeHooks() {

        // 0. HYDRATE ALL SAVED FLAGS & BIOME KEYS ON STAR SYSTEM GENERATION
        if (typeof window.generateStarSystem === 'function' && !window._biomeGenSystemPatched) {
            const origGenSystem = window.generateStarSystem;
            window.generateStarSystem = function(starX, starY) {
                const sysData = origGenSystem.apply(this, arguments);
                if (sysData && Array.isArray(sysData.planets)) {
                    sysData.planets.forEach((p, idx) => {
                        if (!p) return;
                        if (p.biome && p.biome.id && !p.biomeKey) {
                            p.biomeKey = p.biome.id;
                        }
                        const sysKey = `${starX},${starY}_p${idx}`;
                        const saved = (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[sysKey]) ? worldStateDeltas[sysKey] : {};
                        if (saved.mined) p.minedThisVisit = true;
                        if (saved.scanned) p.scannedThisVisit = true;
                        if (saved.explored) p.exploredThisVisit = true;
                        if (saved.hacked) p.hackedThisVisit = true;
                        if (saved.specialUsed) p.specialUsedThisVisit = true;
                        if (saved.skimmed) {
                            p.skimmedThisVisit = true;
                            p.scannedThisVisit = true;
                        }
                    });
                }
                return sysData;
            };
            window._biomeGenSystemPatched = true;
        }

        // 0.5 ENABLE GAS GIANT / ICE GIANT ORBITAL SKIMMING ON THE SYSTEM MAP
        if (typeof window.renderSystemMap === 'function' && !window._biomeSysMapPatched) {
            const origRenderSystemMap = window.renderSystemMap;
            window.renderSystemMap = function() {
                origRenderSystemMap.apply(this, arguments);
                if (!currentSystemData || !Array.isArray(currentSystemData.planets)) return;
                const systemView = document.getElementById('systemView');
                if (!systemView) return;

                const planetCards = systemView.querySelectorAll('.system-planet-grid > div');
                planetCards.forEach((card, idx) => {
                    const planet = currentSystemData.planets[idx];
                    if (!planet || !planet.biome) return;
                    const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${idx}`;
                    const saved = (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[sysKey]) ? worldStateDeltas[sysKey] : {};
                    const isSkimmed = Boolean(planet.skimmedThisVisit || saved.skimmed);

                    if (!planet.biome.landable && BiomeUtils.isGiantBiome(planet.biome.id)) {
                        const btn = card.querySelector('button.action-button');
                        if (btn) {
                            if (isSkimmed) {
                                btn.disabled = true;
                                btn.textContent = 'ATMO DEPLETED';
                                btn.style.cssText = 'margin-top: 10px; border-color:#444; color:#666;';
                            } else {
                                btn.disabled = false;
                                btn.textContent = 'ATMO-SKIM (H-3)';
                                btn.style.cssText = 'margin-top: 10px; border-color:var(--accent-color); color:var(--accent-color);';
                                btn.setAttribute('onclick', `event.stopPropagation(); skimGasGiantAtmosphere(${idx});`);
                            }
                        }
                    }
                });
            };
            window._biomeSysMapPatched = true;
        }

        // 1. PERSIST ORBITAL MINING DEPLETION & UPGRADE ORBITAL SURFACE SCAN
        if (typeof window.startOrbitalMining === 'function' && !window._biomeOrbitalPatched) {
            const origOrbitalMining = window.startOrbitalMining;
            window.startOrbitalMining = function() {
                origOrbitalMining.apply(this, arguments);
                const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
                if (location && location.miningDepleted && typeof updateWorldState === 'function') {
                    updateWorldState(playerX, playerY, {
                        miningDepleted: true,
                        lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0
                    });
                }
            };
            window._biomeOrbitalPatched = true;
        }

        if (typeof window.conductSurfaceScan === 'function' && !window._biomeSurfaceScanPatched) {
            window.conductSurfaceScan = function() {
                const location = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
                if (!location) return;
                if (typeof soundManager !== 'undefined') soundManager.playScan();

                const biomeObj = BiomeUtils.getBiome(location.biome || 'BARREN_ROCK');
                const resNames = (biomeObj.resources || []).map(r => (typeof COMMODITIES !== 'undefined' && COMMODITIES[r]) ? COMMODITIES[r].name : r).join(', ');
                const hazColor = biomeObj.hazard && biomeObj.hazard !== 'NONE' ? 'var(--danger)' : 'var(--success)';
                const oreStatus = location.miningDepleted
                    ? "<span style='color:var(--danger); font-weight:bold;'>Depleted (Orbital veins stripped)</span>"
                    : "<span style='color:var(--success); font-weight:bold;'>Rich lithosphere veins detected</span>";

                const scanBox = document.getElementById('surfaceScanResultBox');
                if (scanBox) {
                    scanBox.innerHTML = `
                        <div style="margin-top: 12px; padding: 12px; border-left: 3px solid var(--accent-color); background: rgba(0, 224, 224, 0.08); font-size: 12px; color: var(--text-color); animation: fadeIn 0.35s;">
                            <div style="color: var(--accent-color); font-weight: bold; margin-bottom: 6px; letter-spacing:1px;">SPECTROMETRY TELEMETRY:</div>
                            <div style="line-height:1.6;">
                                • <b>Classification:</b> ${biomeObj.name}<br>
                                • <b>Surface Hazard:</b> <span style="color:${hazColor}; font-weight:bold;">${biomeObj.hazard || 'NONE'}</span><br>
                                • <b>Detected Signatures:</b> <span style="color:var(--gold-text);">${resNames || 'Silicates'}</span><br>
                                • <b>Colony Suitability:</b> ${biomeObj.colonyBonusDesc || 'Standard'}<br>
                                • <b>Orbital Survey:</b> ${oreStatus}
                            </div>
                        </div>
                    `;
                }
            };
            window._biomeSurfaceScanPatched = true;
        }

        // 2. PREVENT INFINITE BIO-SCAN EXPLOIT & PERSIST DELTAS
        if (typeof window.scanPlanetForLife === 'function' && !window._biomeBioScanPatched) {
            const origScanLife = window.scanPlanetForLife;
            window.scanPlanetForLife = function() {
                if (typeof currentGameState !== 'undefined' && currentGameState !== GAME_STATES.PLANET_VIEW) return;
                if (!currentSystemData || !currentSystemData.planets) return;

                const planet = currentSystemData.planets[selectedPlanetIndex];
                if (!planet) return;

                const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
                if (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[sysKey] && worldStateDeltas[sysKey].scanned) {
                    planet.scannedThisVisit = true;
                }

                if (planet.scannedThisVisit) {
                    if (typeof logMessage === 'function') logMessage("Biological signatures in this landing zone have already been sampled.");
                    if (typeof showToast === 'function') showToast("BIO-SCAN ALREADY COMPLETE", "info");
                    if (typeof renderPlanetView === 'function') renderPlanetView();
                    return;
                }

                origScanLife.apply(this, arguments);

                if (planet.scannedThisVisit) {
                    if (typeof soundManager !== 'undefined') soundManager.playScan();
                    if (typeof showToast === 'function') showToast("BIO-SAMPLES COLLECTED", "success");
                    if (typeof worldStateDeltas !== 'undefined') {
                        if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
                        worldStateDeltas[sysKey].scanned = true;
                        worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
                    }
                    if (typeof renderPlanetView === 'function') renderPlanetView();
                }
            };
            window._biomeBioScanPatched = true;
        }

        // 3. REFRESH PLANET VIEW AFTER SURFACE MINING
        if (typeof window.minePlanet === 'function' && !window._biomeMinePlanetPatched) {
            const origMinePlanet = window.minePlanet;
            window.minePlanet = function() {
                origMinePlanet.apply(this, arguments);
                if (typeof currentGameState !== 'undefined' && currentGameState === GAME_STATES.PLANET_VIEW && typeof renderPlanetView === 'function') {
                    renderPlanetView();
                }
            };
            window._biomeMinePlanetPatched = true;
        }

        // 4. DATA-DRIVEN SURFACE EXPEDITION ENGINE
        window.startSurfaceExpedition = function() {
            if (!currentSystemData || !currentSystemData.planets) return;
            const planet = currentSystemData.planets[selectedPlanetIndex];
            if (!planet || planet.exploredThisVisit) return;

            const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
            planet.exploredThisVisit = true;
            if (typeof worldStateDeltas !== 'undefined') {
                if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
                worldStateDeltas[sysKey].explored = true;
                worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
            }

            if (typeof advanceGameTime === 'function') advanceGameTime(0.25);
            if (typeof soundManager !== 'undefined') soundManager.playScan();

            const biome = planet.biome || PLANET_BIOMES.BARREN_ROCK;
            const expData = biome.expeditionData || { baseXp: 80 };
            const flavor = biome.expeditionFlavor || "Your away team conducts a thorough overland traverse of the landing zone.";

            const hasScavenger = _biomeHasPerk('SCAVENGER_PROTOCOL') || (typeof hasCrewPerk === 'function' && hasCrewPerk('SCAVENGER_PROTOCOL'));
            const hasBio = _biomeHasPerk('XENO_BIOLOGIST');
            const hasHealthPhysicist = _biomeHasPerk('HEALTH_PHYSICIST') ||
                                       (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY');

            let xpGain = (expData.baseXp || 80) + Math.floor(Math.random() * 40);
            if (hasBio && (BiomeUtils.isHabitableBiome(biome.id) || biome.id === 'DEATH_WORLD' || biome.id === 'SULFURIC_MIRE')) {
                xpGain *= 2;
            }

            let creditFind = 0;
            let lootItems = [];
            let hazardMsg = "";

            // 1. Lore Unlocks
            if (expData.loreKey && typeof unlockLoreEntry === 'function') {
                unlockLoreEntry(expData.loreKey);
            }

            // 2. Dynamic Hazard Resolution
            if (expData.hazard && Math.random() < expData.hazard.chance) {
                const haz = expData.hazard;
                
                if (haz.type === 'RADIATION' && hasHealthPhysicist) {
                    hazardMsg = `<br><br><span style="color:var(--success)">☢️ DOSIMETRY SHIELDING: Zero radiation damage taken during surface EVA.</span>`;
                } else {
                    hazardMsg = `<br><br><span style="color:var(--danger)">${haz.msg} (-${haz.damage} Hull).</span>`;
                    if (typeof GameBus !== 'undefined') {
                        GameBus.emit('HULL_DAMAGED', { amount: haz.damage, reason: `Planetary Hazard (${biome.name})` });
                    }
                    if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
                }
            }

            // 3. Dynamic Loot Resolution
            if (expData.guaranteedLoot) {
                expData.guaranteedLoot.forEach(loot => {
                    const qty = loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1));
                    if (qty > 0) lootItems.push({ id: loot.id, qty: qty * (hasScavenger ? 2 : 1) });
                });
            } else {
                const pool = biome.resources && biome.resources.length > 0 ? biome.resources : ['MINERALS'];
                const pickedId = pool[Math.floor(Math.random() * pool.length)];
                const baseQty = 4 + Math.floor(Math.random() * 6);
                lootItems.push({ id: pickedId, qty: baseQty * (hasScavenger ? 2 : 1) });
                creditFind = (150 + Math.floor(Math.random() * 250)) * (hasScavenger ? 2 : 1);
            }

            // 4. Award Inventory & Credits
            let rewardSummary = [];
            if (creditFind > 0 && typeof playerCredits !== 'undefined') {
                playerCredits += creditFind;
                rewardSummary.push(`<span style="color:var(--gold-text)">+${formatNumber(creditFind)}c Salvage Cache</span>`);
            }

            lootItems.forEach(item => {
                if (typeof COMMODITIES !== 'undefined' && COMMODITIES[item.id]) {
                    const weight = COMMODITIES[item.id].weight !== undefined ? COMMODITIES[item.id].weight : 1;
                    const spaceLeft = weight > 0
                        ? Math.floor((PLAYER_CARGO_CAPACITY - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0)) / weight)
                        : item.qty;
                    const actualQty = Math.min(item.qty, Math.max(0, spaceLeft));
                    
                    if (actualQty > 0) {
                        playerCargo[item.id] = (playerCargo[item.id] || 0) + actualQty;
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        rewardSummary.push(`<span style="color:var(--accent-color)">+${actualQty}x ${COMMODITIES[item.id].name}</span>`);
                    } else if (item.qty > 0) {
                        rewardSummary.push(`<span style="color:var(--danger)">${COMMODITIES[item.id].name} (Hold Full)</span>`);
                    }
                }
            });

            if (typeof playerXP !== 'undefined') {
                playerXP += xpGain;
                rewardSummary.push(`<span style="color:var(--success)">+${formatNumber(xpGain)} XP</span>`);
            }

            if (typeof logMessage === 'function') {
                logMessage(`<span style="color:#DDA0DD">[ SURFACE EXPEDITION ]</span> ${flavor} Recovered: ${rewardSummary.join(', ')}.${hazardMsg}`);
            }
            if (typeof showToast === 'function') showToast("EXPEDITION COMPLETE", "success");

            if (typeof renderPlanetView === 'function') renderPlanetView();
            if (typeof checkLevelUp === 'function') checkLevelUp();
            if (typeof autoSaveGame === 'function') autoSaveGame();
        };

        // 5. MACHINE WORLD CORE INTERFACE
        window.hackMachineWorld = function() {
            if (!currentSystemData || !currentSystemData.planets) return;
            const planet = currentSystemData.planets[selectedPlanetIndex];
            if (!planet || planet.hackedThisVisit) return;

            const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
            planet.hackedThisVisit = true;
            if (typeof worldStateDeltas !== 'undefined') {
                if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
                worldStateDeltas[sysKey].hacked = true;
                worldStateDeltas[sysKey].lastInteraction = typeof currentGameDate !== 'undefined' ? currentGameDate : 0;
            }

            if (typeof unlockLoreEntry === 'function') unlockLoreEntry('XENO_MACHINE_WORLD');
            if (typeof advanceGameTime === 'function') advanceGameTime(0.20);

            const hasSlicer = _biomeHasPerk('CYBER_SLICER') || (typeof hasCrewPerk === 'function' && hasCrewPerk('ASTROMETRICS'));
            const successChance = hasSlicer ? 0.90 : 0.60;

            if (Math.random() < successChance) {
                const credits = 1500 + Math.floor(Math.random() * 1500);
                const xp = 250;
                if (typeof playerCredits !== 'undefined') playerCredits += credits;
                if (typeof playerXP !== 'undefined') playerXP += xp;

                let lootMsg = "";
                if ((typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0) + 1 <= PLAYER_CARGO_CAPACITY) {
                    const dropId = Math.random() < 0.5 ? 'AI_CORE' : 'ENCRYPTED_DATA';
                    playerCargo[dropId] = (playerCargo[dropId] || 0) + 1;
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                    if (typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId]) {
                        lootMsg = ` Extracted <span style="color:var(--gold-text)">1x ${COMMODITIES[dropId].name}</span>!`;
                    }
                }

                if (typeof soundManager !== 'undefined') soundManager.playGain();
                if (typeof showToast === 'function') showToast("CORE BREACH SUCCESSFUL", "success");
                if (typeof logMessage === 'function') {
                    logMessage(`<span style="color:#00E0E0; font-weight:bold;">[ CORE NETWORK BREACHED ]</span> Siphoned ${formatNumber(credits)}c and +${xp} XP from the planetary nexus.${lootMsg}`);
                }
            } else {
                const dmg = 25;
                if (typeof logMessage === 'function') {
                    logMessage(`<span style="color:var(--danger); font-weight:bold;">[ BLACK-ICE COUNTERMEASURE ]</span> Planetary firewall feedback surged through your umbilical! Hull took ${dmg} damage.`);
                }
                if (typeof showToast === 'function') showToast("FIREWALL FEEDBACK", "error");
                if (typeof GameBus !== 'undefined') {
                    GameBus.emit('HULL_DAMAGED', { amount: dmg, reason: "Machine World Black-ICE Feedback" });
                }
                if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
            }

            if (typeof renderPlanetView === 'function') renderPlanetView();
            if (typeof checkLevelUp === 'function') checkLevelUp();
            if (typeof autoSaveGame === 'function') autoSaveGame();
        };
        
        // 6. UNIFIED NATIVE PLANET VIEW RENDERER
        window.renderPlanetView = function() {
            const planetView = document.getElementById('planetView');
            if (!planetView || !currentSystemData || !currentSystemData.planets) return;
            
            const planet = currentSystemData.planets[selectedPlanetIndex];
            if (!planet) return;
            
            const sysKey = `${currentSystemData.x},${currentSystemData.y}_p${selectedPlanetIndex}`;
            const savedState = (typeof worldStateDeltas !== 'undefined' && worldStateDeltas[sysKey]) ? worldStateDeltas[sysKey] : {};

            if (savedState.mined) planet.minedThisVisit = true;
            if (savedState.scanned) planet.scannedThisVisit = true;
            if (savedState.explored) planet.exploredThisVisit = true;
            if (savedState.hacked) planet.hackedThisVisit = true;
            if (savedState.specialUsed) planet.specialUsedThisVisit = true;

            const bId = planet.biome.id || Object.keys(PLANET_BIOMES).find(key => PLANET_BIOMES[key].name === planet.biome.name) || 'BARREN_ROCK';

            // Unlock biome-specific lore on landing
            if (typeof unlockLoreEntry === 'function') {
                if (bId === 'MACHINE_WORLD') unlockLoreEntry('XENO_MACHINE_WORLD');
                else if (bId === 'IRRADIATED') unlockLoreEntry('PHENOMENON_IRRADIATED');
                else if (bId === 'TOMB_WORLD' || bId === 'ARCHIVE_WORLD') unlockLoreEntry('XENO_TOMB_WORLDS');
                else if (bId === 'MYCELIAL') unlockLoreEntry('LEGEND_SENTIENT_MYCELIUM_NETWORK');
                else if (bId === 'CRYSTAL') unlockLoreEntry('PHENOMENON_VOID_CRYSTALS');
            }

            const bioResources = (planet.biome.resources || []).filter(r => typeof BIOLOGICAL_RESOURCES !== 'undefined' && BIOLOGICAL_RESOURCES.has(r));
            const mineralResources = (planet.biome.resources || []).filter(r => typeof BIOLOGICAL_RESOURCES !== 'undefined' && !BIOLOGICAL_RESOURCES.has(r));

            const canMine = planet.biome.landable && mineralResources.length > 0 && !planet.minedThisVisit;
            const mineButtonState = canMine ? '' : 'disabled';
            const mineLabel = planet.minedThisVisit ? '✓ Minerals Depleted' : (canMine ? '⛏️ Mine Minerals' : 'No Minerals Detected');

            const canScan = planet.biome.landable && bioResources.length > 0 && !planet.scannedThisVisit;
            const scanButtonState = canScan ? '' : 'disabled';
            const scanLabel = planet.scannedThisVisit ? '✓ Bio-Scan Complete' : (canScan ? '🧬 Scan Lifeforms' : 'No Bio-Signs');

            const droneCount = (typeof playerCargo !== 'undefined' && playerCargo.MINING_DRONE) ? playerCargo.MINING_DRONE : 0;
            const hasDrone = droneCount > 0;
            const surveyButtonState = hasDrone ? '' : 'disabled';
            const surveyLabel = hasDrone ? `🛰️ Launch Geo-Survey (${droneCount})` : 'Geo-Survey <br><span style="font-size:10px; opacity:0.7">(Requires Survey Drone)</span>';
             
            const canExplore = planet.biome.landable && !planet.exploredThisVisit;
            const exploreButtonState = canExplore ? '' : 'disabled';
            const exploreLabel = canExplore ? '🏔️ Surface Expedition' : '✓ Region Explored';

            // --- DYNAMIC COLONY BUTTON LOGIC (Fixes playerHasColonyCharter desync) ---
            let colonyButtonHtml = '';
            const colId = `${currentSystemData.x}_${currentSystemData.y}_p${selectedPlanetIndex}`; 
            const colonyHere = typeof playerColonies !== 'undefined' ? playerColonies[colId] : null;
            const isColonyHere = Boolean(colonyHere && colonyHere.established);
            const hasCharterInCargo = typeof playerCargo !== 'undefined' && (playerCargo['COLONY_CHARTER'] || 0) > 0;

            if (isColonyHere) {
                colonyButtonHtml = `
                    <button class="action-button" onclick="openColonyManagement('${colId}')" style="border-color: var(--success); color: var(--success); box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);">
                        🏢 MANAGE COLONY (${colonyHere.name.toUpperCase()})
                    </button>`;
            } else if (hasCharterInCargo) {
                if (planet.biome.landable) {
                    colonyButtonHtml = `
                        <button class="action-button" onclick="surveyForColony('${planet.name}', '${bId}', ${currentSystemData.x}, ${currentSystemData.y})" style="border-color: var(--gold-text); color: var(--gold-text); box-shadow: 0 0 10px rgba(255,215,0,0.2);">
                            🚩 ESTABLISH COLONY
                        </button>`;
                } else {
                    colonyButtonHtml = `
                        <button class="action-button" disabled>
                            Hostile Environment<br><span style="font-size:10px; opacity:0.7">Cannot Settle Here</span>
                        </button>`;
                }
            } else {
                colonyButtonHtml = `
                    <button class="action-button" disabled>
                        Establish Colony<br><span style="font-size:10px; opacity:0.7">Requires Pioneer Charter</span>
                    </button>`;
            }

            // --- SPECIAL WORLD INTERACTIONS ---
            let specialActionHtml = '';
            if (bId === 'MACHINE_WORLD') {
                const canHack = !planet.hackedThisVisit;
                specialActionHtml = `
                    <button class="action-button full-width-btn" onclick="hackMachineWorld()" style="border-color: #00E0E0; color: #00E0E0; box-shadow: 0 0 15px rgba(0,224,224,0.3);" ${!canHack ? 'disabled' : ''}>
                        ${canHack ? '💻 INTERFACE WITH CORE NETWORK' : '✓ CORE LOCKED OUT'}
                    </button>
                `;
            } else if (bId === 'TOMB_WORLD' || bId === 'ARCHIVE_WORLD') {
                const canExcavate = !planet.specialUsedThisVisit;
                specialActionHtml = `
                    <button class="action-button full-width-btn" onclick="executeBiomeSpecialAction()" style="border-color: #DDA0DD; color: #DDA0DD; box-shadow: 0 0 15px rgba(153,51,255,0.3);" ${!canExcavate ? 'disabled' : ''}>
                        ${canExcavate ? '🏛️ EXCAVATE PRECURSOR SANCTUM' : '✓ SANCTUM EXCAVATED'}
                    </button>
                `;
            } else if (bId === 'CRYSTAL') {
                const canAttune = !planet.specialUsedThisVisit;
                specialActionHtml = `
                    <button class="action-button full-width-btn" onclick="executeBiomeSpecialAction()" style="border-color: #FF33FF; color: #FF33FF; box-shadow: 0 0 15px rgba(255,51,255,0.3);" ${!canAttune ? 'disabled' : ''}>
                        ${canAttune ? '🔮 ATTUNE HARMONIC LATTICE (+150% SHIELDS)' : '✓ HARMONICS DEPLETED'}
                    </button>
                `;
            } else if (bId === 'MYCELIAL') {
                const canCommune = !planet.specialUsedThisVisit;
                specialActionHtml = `
                    <button class="action-button full-width-btn" onclick="executeBiomeSpecialAction()" style="border-color: #00FFAA; color: #00FFAA; box-shadow: 0 0 15px rgba(0,255,170,0.3);" ${!canCommune ? 'disabled' : ''}>
                        ${canCommune ? '🍄 COMMUNE WITH SPORE NETWORK' : '✓ SPORE LINK DORMANT'}
                    </button>
                `;
            }
            
            const hazardText = planet.biome.hazard && planet.biome.hazard !== 'NONE'
                ? `<span style="color:var(--danger); font-weight:bold;">⚠️ HAZARD: ${planet.biome.hazard}</span>`
                : `<span style="color:var(--success);">ENVIRONMENT: STABLE</span>`;

            // Resource Badges & Colony Trait Readout
            const resourcePillsHtml = (planet.biome.resources || []).map(rId => {
                const cDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[rId]) ? COMMODITIES[rId] : { name: rId, icon: '📦' };
                const isBio = typeof BIOLOGICAL_RESOURCES !== 'undefined' && BIOLOGICAL_RESOURCES.has(rId);
                const pillColor = isBio ? 'var(--success)' : 'var(--gold-text)';
                return `<span style="display:inline-block; font-size:10px; color:${pillColor}; border:1px solid ${pillColor}; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:12px; margin:2px 4px;">${cDef.icon || ''} ${cDef.name}</span>`;
            }).join('');

            const colonyTraitHtml = planet.biome.colonyBonusDesc
                ? `<div style="font-size:11px; color:var(--item-desc-color); margin-top:8px;">Colony Trait: <span style="color:var(--text-color); font-weight:bold;">${planet.biome.colonyBonusDesc}</span></div>`
                : '';

            let html = `
                <div class="planet-view-content">
                    
                    <div class="planet-header">
                        <img src="${planet.biome.image}" alt="${planet.biome.name}" class="planet-large-img" onerror="this.onerror=null; this.src='assets/barren_rock.png';">
                        <h2 class="planet-title">${currentSystemData.name.toUpperCase()} : ${planet.name.toUpperCase()}</h2>
                        <div style="font-size:11px; letter-spacing:2px; margin-bottom:10px; color:var(--accent-color);">
                            CLASS: ${planet.biome.name.toUpperCase()} &nbsp;|&nbsp; ${hazardText}
                        </div>
                        <p class="planet-desc">"${planet.biome.description}"</p>
                        <div style="margin-top:12px;">
                            ${resourcePillsHtml}
                        </div>
                        ${colonyTraitHtml}
                    </div>
                    
                    <div class="planet-actions-grid">
                        <button class="action-button" onclick="minePlanet()" ${mineButtonState}>${mineLabel}</button>
                        <button class="action-button" onclick="scanPlanetForLife()" ${scanButtonState}>${scanLabel}</button>
                        <button class="action-button" onclick="performGeoSurvey()" ${surveyButtonState}>${surveyLabel}</button>
                        <button class="action-button" onclick="startSurfaceExpedition()" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 10px rgba(153,51,255,0.2);" ${exploreButtonState}>${exploreLabel}</button>
                        ${colonyButtonHtml}
                        ${specialActionHtml}
                        <button class="action-button full-width-btn" onclick="returnToOrbit()">&lt;&lt; Return to Orbit</button>
                    </div>
                </div>
            `;

            planetView.innerHTML = html;
            if (typeof renderUIStats === 'function') renderUIStats();
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachBiomeHooks);
    } else {
        attachBiomeHooks();
    }
})();

// --- END OF FILE biomes.js ---
