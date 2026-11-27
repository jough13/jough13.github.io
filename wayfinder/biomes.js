// --- START OF FILE biomes.js ---

// ==========================================
// --- PLANET BIOMES DATABASE (23 BIOMES) ---
// ==========================================

const PLANET_BIOMES = {
    BARREN_ROCK: {
        id: "BARREN_ROCK",
        name: "Barren Rock",
        landable: true,
        weight: 90,
        hazard: "NONE",
        colonyBonusDesc: "Standard baseline output",
        description: "A lifeless, crater-scarred rock rich in common silicate and iron ores.",
        resources: ['MINERALS'],
        image: 'assets/barren_rock.png',
        telemetry: {
            atmosphere: "0.00 atm (Vacuum / Trace Argon)",
            gravity: "0.42g",
            tempRange: "-170°C to +95°C",
            habitability: "Marginal",
            rarityTier: "Common"
        },
        fieldNote: "No magnetosphere and zero wind erosion mean ancient impact craters stay razor-sharp for billions of years—prime real estate for cheap strip-mining.",
        expeditionFlavor: "Your rover traverses miles of silent, dust-choked craters and exposed basalt ridges.",
        expeditionData: { baseXp: 80 }
    },
    KARST_CAVERN: {
        id: "KARST_CAVERN",
        name: "Subterranean Karst World",
        landable: true,
        weight: 35,
        hazard: "TECTONIC TREMORS",
        colonyBonusDesc: "+25% Mineral & Water extraction",
        description: "An arid crust honeycombed with massive subterranean limestone caverns, geothermal aquifers, and crystal geodes.",
        resources: ['MINERALS', 'WATER', 'MINERAL_GEODE'],
        image: 'assets/karst_cavern.png',
        telemetry: {
            atmosphere: "0.68 atm (N₂ / CO₂)",
            gravity: "0.88g",
            tempRange: "-15°C to +42°C",
            habitability: "Habitable (Sub-Surface)",
            rarityTier: "Common"
        },
        fieldNote: "Ancient oceans vanished underground eons ago, carving cathedral-scale sinkholes lined with mineral geodes and warm geothermal aquifers.",
        expeditionFlavor: "Rappelling into a cathedral-sized sinkhole, your survey team maps a labyrinth of geode-lined caverns.",
        expeditionData: {
            baseXp: 95,
            guaranteedLoot: [{ id: 'MINERAL_GEODE', min: 1, max: 3 }, { id: 'MINERALS', min: 4, max: 8 }],
            hazard: { chance: 0.15, type: "TECTONIC", damage: 7, msg: "⚠️ TECTONIC TREMOR: Falling cavern stalactites dented your shuttle canopy." }
        }
    },
    GAS_GIANT: {
        id: "GAS_GIANT",
        name: "Gas Giant",
        landable: false,
        weight: 60,
        hazard: "CRUSHING GRAVITY",
        colonyBonusDesc: "Uninhabitable (Orbital Skimming Only)",
        description: "A swirling colossus of metallic hydrogen, helium bands, and hyper-velocity cyclonic storms.",
        resources: ['HYDROGEN_3'],
        image: 'assets/gas_giant.png',
        telemetry: {
            atmosphere: "89% H₂, 10% He, Trace NH₃",
            gravity: "2.54g (Cloud Deck)",
            tempRange: "-145°C (Upper Deck)",
            habitability: "Uninhabitable",
            rarityTier: "Common"
        },
        fieldNote: "No solid surface exists beneath the ammonia cloud bands, but upper-stratosphere skimming yields rich deuterium and Tritium (Hydrogen-3) reserves.",
        expeditionFlavor: "Skimming the upper stratosphere for heavy hydrogen isotopes.",
        expeditionData: { baseXp: 85 }
    },
    ICE_GIANT: {
        id: "ICE_GIANT",
        name: "Ice Giant",
        landable: false,
        weight: 50,
        hazard: "CRYO-STORMS",
        colonyBonusDesc: "Uninhabitable (Orbital Skimming Only)",
        description: "A colossal world of supercritical water, ammonia, and frozen methane clouds.",
        resources: ['HYDROGEN_3', 'WATER', 'QUANTUM_FLUID'],
        image: 'assets/ice_giant.png',
        telemetry: {
            atmosphere: "H₂ / He / CH₄ Ice Hazes",
            gravity: "1.18g (Cloud Deck)",
            tempRange: "-215°C (Upper Deck)",
            habitability: "Uninhabitable",
            rarityTier: "Common"
        },
        fieldNote: "Cryogenic upper cloud decks naturally condense trace Quantum Fluid aerosols alongside pure water ice and heavy hydrogen.",
        expeditionFlavor: "Dropping cryogenic collection scoops into the upper methane cloud deck.",
        expeditionData: { baseXp: 90 }
    },
    DESERT: {
        id: "DESERT",
        name: "Arid Dune World",
        landable: true,
        weight: 30,
        hazard: "SILICA STORMS",
        colonyBonusDesc: "-50% Water output, rich spice veins",
        description: "Endless seas of wind-carved quartz dunes hiding ancient dry seabeds and spice-rich fissures.",
        resources: ['MINERALS', 'GOLD', 'KTHARR_SPICES'],
        image: 'assets/desert_world.png',
        telemetry: {
            atmosphere: "0.84 atm (Dry N₂ / O₂)",
            gravity: "0.94g",
            tempRange: "-10°C to +68°C",
            habitability: "Marginal",
            rarityTier: "Uncommon"
        },
        fieldNote: "Evaporite basins left behind by dead seas concentrate native gold dust and pungent thermophilic spice-lichen sought by K'tharr merchants.",
        expeditionFlavor: "Fighting through a howling electrostatic sandstorm, your team locates a sheltered canyon vein.",
        expeditionData: {
            baseXp: 90,
            hazard: { chance: 0.18, type: "WIND", damage: 7, msg: "⚠️ SILICA SQUALL: Charged quartz grit abraded your outer sensor baffles." }
        }
    },
    GLACIAL: {
        id: "GLACIAL",
        name: "Cryo-Glacial World",
        landable: true,
        weight: 25,
        hazard: "EXTREME COLD",
        colonyBonusDesc: "+50% Water condenser output",
        description: "A frozen world locked in a permanent ice age. Sub-glacial pockets hold ultra-pure water and super-cooled fluids.",
        resources: ['WATER', 'MINERALS', 'QUANTUM_FLUID'],
        image: 'assets/glacial_world.png',
        telemetry: {
            atmosphere: "0.52 atm (Thin N₂ / CO₂)",
            gravity: "0.81g",
            tempRange: "-120°C to -38°C",
            habitability: "Marginal",
            rarityTier: "Uncommon"
        },
        fieldNote: "Tidal flexing warms deep sub-glacial lakes miles beneath the blue ice crust, creating natural deuterium pockets prized by long-range explorers.",
        expeditionFlavor: "Descending into a glowing blue glacial crevasse, you tap into a pressurized sub-surface thermal vent.",
        expeditionData: { baseXp: 95 }
    },
    TIDAL_LOCKED: {
        id: "TIDAL_LOCKED",
        name: "Terminator Twilight World",
        landable: true,
        weight: 18,
        hazard: "KATABATIC GALES",
        colonyBonusDesc: "+25% Solar & Water efficiency",
        description: "Tidally locked to its parent star. One hemisphere is baked in perpetual noon, the other frozen in eternal night, separated by a narrow habitable twilight ring.",
        resources: ['WATER', 'FOOD_SUPPLIES', 'RARE_METALS'],
        image: 'assets/tidal_locked.png',
        telemetry: {
            atmosphere: "1.12 atm (N₂ / O₂ / H₂O)",
            gravity: "1.08g",
            tempRange: "-90°C (Night) / +18°C (Ring) / +130°C (Day)",
            habitability: "Habitable (Terminator)",
            rarityTier: "Uncommon"
        },
        fieldNote: "Perpetual dusk along the terminator belt allows continuous solar harvesting alongside glacier-fed river valleys, though katabatic winds howl without pause.",
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
        weight: 20,
        hazard: "EXTREME HEAT",
        colonyBonusDesc: "+50% Alloy smelting output",
        description: "A molten hellscape of tectonic rivers and ash clouds, rich in heavy platinum-group metals.",
        resources: ['RARE_METALS', 'PLATINUM_ORE', 'MINERALS'],
        image: 'assets/volcanic_world.png',
        telemetry: {
            atmosphere: "2.40 atm (SO₂ / CO₂ / Ash)",
            gravity: "1.14g",
            tempRange: "+180°C to +840°C",
            habitability: "Hostile",
            rarityTier: "Uncommon"
        },
        fieldNote: "Relentless mantle convection drags dense platinum-group metals directly to the surface; K'tharr forge-masters prize worlds like this for alloy smelting.",
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
        weight: 15,
        hazard: "CORROSIVE SPORES",
        colonyBonusDesc: "High bio-yields, corrosive atmosphere",
        description: "A sweltering greenhouse world teeming with aggressive, hyper-evolved alien flora.",
        resources: ['GENETIC_SAMPLES', 'KTHARR_SPICES', 'SENTIENT_MYCELIUM'],
        image: 'assets/toxic_jungle.png',
        telemetry: {
            atmosphere: "1.85 atm (Dense CO₂ / CH₄ / Spores)",
            gravity: "1.06g",
            tempRange: "+36°C to +62°C",
            habitability: "Hostile",
            rarityTier: "Uncommon"
        },
        fieldNote: "Hyper-competitive canopy flora evolved alkaloid sap and airborne spores that eat straight through unsealed rubber gaskets—goldmines for xenobiologists.",
        expeditionFlavor: "Hacking through bioluminescent vines and acid-spitting flora, you catalog a pristine xeno-botanical grove.",
        expeditionData: {
            baseXp: 110,
            loreKey: 'LEGEND_SENTIENT_MYCELIUM_NETWORK',
            hazard: { chance: 0.20, type: "ACID", damage: 8, msg: "⚠️ CORROSIVE SPORES: Acidic canopy pollen etched your airlock seals." }
        }
    },
    SULFURIC_MIRE: {
        id: "SULFURIC_MIRE",
        name: "Sulfuric Acid Mire",
        landable: true,
        weight: 12,
        hazard: "ACIDIC VAPORS",
        colonyBonusDesc: "Rich chemical & medical synthesis",
        description: "A steaming cauldron of yellow sulfur lakes, geysers, and extremophile bacterial mats.",
        resources: ['QUANTUM_FLUID', 'MEDICAL_SUPPLIES', 'GENETIC_SAMPLES'],
        image: 'assets/sulfuric_mire.png',
        telemetry: {
            atmosphere: "3.10 atm (H₂SO₄ Mist / CO₂)",
            gravity: "0.96g",
            tempRange: "+75°C to +140°C",
            habitability: "Hostile",
            rarityTier: "Rare"
        },
        fieldNote: "Acidophilic microbes thriving in pH-0.5 fumaroles synthesize heat-shock proteins that Concord pharma-labs refine into broad-spectrum trauma gels.",
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
        weight: 10,
        hazard: "TIDAL SURGES",
        colonyBonusDesc: "+50% Water & Hydroponics output",
        description: "A pelagic world covered in deep, turbulent oceans dotted with volcanic archipelagos and kelp forests.",
        resources: ['WATER', 'FOOD_SUPPLIES', 'GENETIC_SAMPLES', 'HYDROGEN_3'],
        image: 'assets/ocean_world.png',
        telemetry: {
            atmosphere: "1.24 atm (Humid N₂ / O₂)",
            gravity: "1.03g",
            tempRange: "+4°C to +32°C",
            habitability: "Ideal (Archipelagos)",
            rarityTier: "Rare"
        },
        fieldNote: "Global oceans exceeding 40 kilometers in depth harbor hydrothermal trench ecosystems rich in biopolymers and natural deuterium gradients.",
        expeditionFlavor: "Touching down on a narrow basalt atoll, you deploy submersible drones into a thriving abyssal trench.",
        expeditionData: { baseXp: 115 }
    },
    SHATTERED_CORE: {
        id: "SHATTERED_CORE",
        name: "Tectonic Core World",
        landable: true,
        weight: 8,
        hazard: "GRAVIMETRIC SHEAR",
        colonyBonusDesc: "Rich heavy metal & alloy veins",
        description: "A planet partially ripped open by an ancient orbital impact, exposing its dense metallic planetary core.",
        resources: ['PLATINUM_ORE', 'RARE_METALS', 'REFINED_ALLOY'],
        image: 'assets/shattered_core.png',
        telemetry: {
            atmosphere: "0.02 atm (Silicate Vapor)",
            gravity: "1.35g (Irregular)",
            tempRange: "-80°C to +310°C",
            habitability: "Hostile",
            rarityTier: "Rare"
        },
        fieldNote: "A planetary-scale glancing collision peeled away the silicate mantle, leaving billions of tons of solidified nickel-iron and osmium exposed to open vacuum.",
        expeditionFlavor: "Navigating zero-G debris ribbons hovering above the exposed planetary mantle, you cut free slabs of pure core alloy.",
        expeditionData: {
            baseXp: 130,
            hazard: { chance: 0.22, type: "TECTONIC", damage: 10, msg: "⚠️ GRAVIMETRIC SHEAR: Unstable orbital debris clipped your starboard nacelle." }
        }
    },
    FERRIC_MOON: {
        id: "FERRIC_MOON",
        name: "Captured Ferric Core-Moon",
        landable: true,
        weight: 9,
        hazard: "MAGNETIC EDDIES",
        colonyBonusDesc: "High-density Platinum & Gold veins",
        description: "The stripped metallic core of a proto-planet captured in a tight stellar orbit. Its magnetic field hums with raw ore.",
        resources: ['GOLD', 'PLATINUM_ORE', 'RARE_METALS', 'MINERAL_GEODE'],
        image: 'assets/ferric_moon.png',
        telemetry: {
            atmosphere: "0.00 atm (Hard Vacuum)",
            gravity: "0.74g (High Density)",
            tempRange: "-110°C to +145°C",
            habitability: "Marginal",
            rarityTier: "Rare"
        },
        fieldNote: "Spectroscopy classifies this body as an exposed M-type planetary core—essentially a solid sphere of iron, gold, and platinum spinning inside an intense dynamo field.",
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
        weight: 6,
        hazard: "PSYCHOTROPIC FOG",
        colonyBonusDesc: "Natural Mycelium & Medical synthesis",
        description: "A twilight world carpeted in towering fungal spires linked by a planet-spanning neural root network.",
        resources: ['SENTIENT_MYCELIUM', 'GENETIC_SAMPLES', 'MEDICAL_SUPPLIES'],
        image: 'assets/mycelial_world.png',
        telemetry: {
            atmosphere: "1.30 atm (N₂ / O₂ / Bio-Aerosols)",
            gravity: "0.91g",
            tempRange: "+12°C to +26°C",
            habitability: "Habitable (Filtered)",
            rarityTier: "Very Rare"
        },
        fieldNote: "Bio-electric signals propagate across the global fungal mat at near-synaptic velocities. K'tharr mystics and Children of the Void both claim the planet dreams.",
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
        weight: 5,
        hazard: "NONE",
        colonyBonusDesc: "Ideal habitability, high morale & growth",
        description: "A garden world with liquid oceans, nitrogen-oxygen atmosphere, and thriving continental ecosystems.",
        resources: ['FOOD_SUPPLIES', 'WATER', 'MINERALS', 'GENETIC_SAMPLES'],
        image: 'assets/terran_world.png',
        telemetry: {
            atmosphere: "1.01 atm (78% N₂, 21% O₂)",
            gravity: "1.00g",
            tempRange: "+14°C Avg (Temperate)",
            habitability: "Ideal",
            rarityTier: "Very Rare"
        },
        fieldNote: "A true Goldilocks biosphere with protective dipole magnetosphere and stable carbon-silicate cycles. Concord Pioneer Charters fetch fortunes over worlds like this.",
        expeditionFlavor: "Cruising over temperate river valleys and lush forests, your team maps an ideal site for human habitation.",
        expeditionData: { baseXp: 160 }
    },
    BIOLUMINESCENT: {
        id: "BIOLUMINESCENT",
        name: "Bioluminescent Eden",
        landable: true,
        weight: 4,
        hazard: "NONE",
        colonyBonusDesc: "Paradise biome, high morale & bio-yields",
        description: "A serene twilight garden world where every forest, reef, and meadow glows with cold, bioluminescent symphony.",
        resources: ['FOOD_SUPPLIES', 'MEDICAL_SUPPLIES', 'GENETIC_SAMPLES', 'WATER'],
        image: 'assets/bioluminescent_world.png',
        telemetry: {
            atmosphere: "1.08 atm (O₂-Rich N₂)",
            gravity: "0.89g",
            tempRange: "+16°C to +24°C",
            habitability: "Ideal (Paradise)",
            rarityTier: "Very Rare"
        },
        fieldNote: "Low-luminosity starlight drove native flora to evolve symbiotically glowing luciferin canopies—one of the rarest, calmest havens in the known galaxy.",
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
        weight: 4,
        hazard: "SEVERE RADIATION",
        colonyBonusDesc: "Extreme actinide & crystal yields",
        description: "A dangerously radioactive rock. Surface gamma spectrometry readings are off the charts, indicating high concentrations of unstable Uranium isotopes.",
        resources: ['RARE_METALS', 'VOID_CRYSTALS', 'PLATINUM_ORE'],
        image: 'assets/wasteland.png',
        telemetry: {
            atmosphere: "0.28 atm (Ionized Dust / Radon)",
            gravity: "0.95g",
            tempRange: "-30°C to +75°C",
            habitability: "Extreme",
            rarityTier: "Very Rare"
        },
        fieldNote: "Surface dosimetry peaks above 450 mSv/h with sharp Cs-137 and U-235 photopeaks. Lead-lined Dosimetry Arrays or Health Physicist calibration recommended.",
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
        weight: 3,
        hazard: "UNEXPLODED ORDNANCE",
        colonyBonusDesc: "Rich military salvage & alloy slag",
        description: "A world vitrified into black trinitite glass during an ancient fleet war. Shattered dreadnought ribs still jut from the plains.",
        resources: ['TECH_PARTS', 'REFINED_ALLOY', 'OBSIDIAN_TEAR_PLATING'],
        image: 'assets/glass_wasteland.png',
        telemetry: {
            atmosphere: "0.41 atm (Ash / Ionized N₂)",
            gravity: "0.97g",
            tempRange: "-20°C to +55°C",
            habitability: "Extreme",
            rarityTier: "Ultra Rare"
        },
        fieldNote: "Kilometer-wide fusion scorch marks match pre-Concord orbital lance signatures. Vitrified trenches still entomb intact dreadnought armor plates.",
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
        weight: 3,
        hazard: "AUTOMATED SENTINELS",
        colonyBonusDesc: "Ancient Precursor relic excavations",
        description: "A dead world covered in the weathered obsidian geometry of a vanished Precursor civilization.",
        resources: ['ARTIFACT_SHARDS', 'TECH_PARTS', 'ANCIENT_RELICS'],
        image: 'assets/tomb_world.png',
        telemetry: {
            atmosphere: "0.18 atm (Thin N₂ / Inert Xe)",
            gravity: "1.00g (Artificially Stabilized)",
            tempRange: "-45°C to +5°C",
            habitability: "Hostile",
            rarityTier: "Ultra Rare"
        },
        fieldNote: "Subsurface ground-penetrating radar shows kilometer-deep hexagonal vaults resting beneath every pyramid—some still humming on zero-point trickle charge.",
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
        weight: 1,
        hazard: "QUANTUM WARDS",
        colonyBonusDesc: "Peak Precursor data & research output",
        description: "A hollow, artificial planetoid constructed by the Architects to store holographic star-charts and engrammatic histories.",
        resources: ['PRECURSOR_DATACUBE', 'ENCRYPTED_ENGRAM', 'ARTIFACT_SHARDS', 'PRECURSOR_STAR_MAP_FRAGMENT'],
        image: 'assets/archive_world.png',
        telemetry: {
            atmosphere: "0.95 atm (Preserved Inert N₂/O₂)",
            gravity: "0.98g (Gravitic Lattice)",
            tempRange: "+11°C Constant (Regulated)",
            habitability: "Restricted (Precursor)",
            rarityTier: "Legendary"
        },
        fieldNote: "Mass-to-volume ratios confirm the interior is 64% hollow—an entire planetary library built by the Architects of the First Chord to outlast the stars.",
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
        weight: 2,
        hazard: "RESONANCE HARMONICS",
        colonyBonusDesc: "High Void Crystal & Quantum Lens output",
        description: "A rare world composed entirely of exotic, resonant silicon-void crystal lattices.",
        resources: ['VOID_CRYSTALS', 'PHASE_SHIFTED_ALLOY', 'QUANTUM_LENS'],
        image: 'assets/crystal_anomaly.png',
        telemetry: {
            atmosphere: "0.09 atm (Ionized Neon / Trace O₃)",
            gravity: "0.78g",
            tempRange: "-65°C to +20°C",
            habitability: "Hostile",
            rarityTier: "Ultra Rare"
        },
        fieldNote: "Piezo-electric crystal spires amplify subspace carrier waves into harmonic overtones capable of supercharging deflector capacitors past factory limits.",
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
        weight: 1,
        hazard: "ROGUE ICE-WALLS",
        colonyBonusDesc: "+50% Tech Parts manufacturing",
        description: "A planet entirely encased in metallic structures, humming data-conduits, and sprawling orbital rings. No biological life detected.",
        resources: ['TECH_PARTS', 'CYBERNETIC_IMPLANTS', 'AI_CORE'],
        image: 'assets/machine_world.png',
        telemetry: {
            atmosphere: "0.60 atm (Coolant Nitrogen / Ozone)",
            gravity: "1.10g",
            tempRange: "+28°C (Waste Heat Equilibrium)",
            habitability: "Hostile (Synthetic)",
            rarityTier: "Legendary"
        },
        fieldNote: "Infrared imaging reveals waste-heat radiators spanning entire continents. Active defensive black-ICE patrols the buried server trenches.",
        expeditionFlavor: "Descending into a canyon-sized server trench, you tap directly into an ancient planetary data-conduit.",
        expeditionData: { baseXp: 200, loreKey: 'XENO_MACHINE_WORLD' }
    },
    DEATH_WORLD: {
        id: "DEATH_WORLD",
        name: "Death World",
        landable: true,
        weight: 2,
        hazard: "APEX PREDATORS",
        colonyBonusDesc: "High-value xeno-biological harvest",
        description: "A hyper-lethal paradise. The flora is venomous, the fauna is armored, and the weather is apocalyptic.",
        resources: ['GENETIC_SAMPLES', 'ILLEGAL_ORGANS', 'MEDICAL_SUPPLIES'],
        image: 'assets/death_world.png',
        telemetry: {
            atmosphere: "1.45 atm (High-O₂ N₂)",
            gravity: "1.38g",
            tempRange: "+22°C to +48°C",
            habitability: "Extreme",
            rarityTier: "Ultra Rare"
        },
        fieldNote: "Oxygen-rich air and high gravity produced hyper-dense megafauna with chitinous armor plating. Bring Marines before stepping off the ramp.",
        expeditionFlavor: "Your away team barely survives an ambush by cloaked, scythe-limbed apex predators.",
        expeditionData: {
            baseXp: 220,
            guaranteedLoot: [{ id: 'ILLEGAL_ORGANS', min: 1, max: 2 }, { id: 'GENETIC_SAMPLES', min: 3, max: 6 }],
            hazard: { chance: 0.60, type: 'COMBAT', damage: 20, msg: '⚠️ PREDATOR AMBUSH: The local fauna breached your rover hull!' }
        }
    }
};

// Fast O(1) name index & frozen individual records (outer dictionary stays extensible via BiomeUtils.registerBiome)
const _biomeByName = new Map();
const _HABITABLE_BIOME_IDS = new Set(['TERRAN', 'BIOLUMINESCENT', 'OCEANIC', 'TOXIC', 'MYCELIAL', 'TIDAL_LOCKED']);
const _GIANT_BIOME_IDS = new Set(['GAS_GIANT', 'ICE_GIANT']);
const _customSpecialBiomeActions = new Map();

for (const bKey in PLANET_BIOMES) {
    const b = PLANET_BIOMES[bKey];
    if (!b) continue;
    if (!b.id) b.id = bKey;
    if (Array.isArray(b.resources)) Object.freeze(b.resources);
    if (b.telemetry) Object.freeze(b.telemetry);
    if (b.expeditionData) Object.freeze(b.expeditionData);
    Object.freeze(b);
    if (b.name) _biomeByName.set(b.name, b);
}

window.PLANET_BIOMES = PLANET_BIOMES;

if (typeof GameRegistry !== 'undefined') {
    GameRegistry.biomes = PLANET_BIOMES;
}

// ==========================================
// --- INTERNAL BIOME HELPERS ---
// ==========================================

function _biomeEscapeHtml(str) {
    if (typeof UI !== 'undefined' && typeof UI.escapeHtml === 'function') return UI.escapeHtml(str);
    return String(str === undefined || str === null ? "" : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _biomeEscapeJsArg(str) {
    return String(str === undefined || str === null ? "" : str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function _biomeHasPerk(perkId) {
    if (typeof hasPlayerPerk === 'function') return hasPlayerPerk(perkId);
    if (typeof playerPerks === 'undefined' || !playerPerks) return false;
    if (typeof playerPerks.has === 'function') return playerPerks.has(perkId);
    if (Array.isArray(playerPerks)) return playerPerks.includes(perkId);
    return false;
}

function _biomeSafeAddCargo(itemId, qty) {
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

function _getPlanetDelta(x, y, idx) {
    if (typeof worldStateDeltas === 'undefined') return {};
    const sysKey = `${x},${y}_p${idx}`;
    return worldStateDeltas[sysKey] || {};
}

function _savePlanetDelta(x, y, idx, patch) {
    if (typeof worldStateDeltas === 'undefined') return;
    const sysKey = `${x},${y}_p${idx}`;
    if (!worldStateDeltas[sysKey]) worldStateDeltas[sysKey] = {};
    Object.assign(worldStateDeltas[sysKey], patch, {
        lastInteraction: typeof currentGameDate !== 'undefined' ? currentGameDate : 0
    });
}

function _computePlanetSurveyProgress(planet, starX, starY, idx) {
    if (!planet || !planet.biome) return { done: 0, total: 1, complete: false };
    const saved = _getPlanetDelta(starX, starY, idx);
    const bId = planet.biome.id || 'BARREN_ROCK';

    if (!planet.biome.landable && _GIANT_BIOME_IDS.has(bId)) {
        const skimmed = Boolean(planet.skimmedThisVisit || saved.skimmed);
        return { done: skimmed ? 1 : 0, total: 1, complete: skimmed };
    }
    if (!planet.biome.landable) return { done: 0, total: 0, complete: false };

    const bioRes = (planet.biome.resources || []).filter(r => typeof BIOLOGICAL_RESOURCES !== 'undefined' && BIOLOGICAL_RESOURCES.has(r));
    const minRes = (planet.biome.resources || []).filter(r => typeof BIOLOGICAL_RESOURCES === 'undefined' || !BIOLOGICAL_RESOURCES.has(r));

    let total = 0;
    let done = 0;

    if (minRes.length > 0) {
        total++;
        if (planet.minedThisVisit || saved.mined) done++;
    }
    if (bioRes.length > 0) {
        total++;
        if (planet.scannedThisVisit || saved.scanned) done++;
    }
    // Expedition
    total++;
    if (planet.exploredThisVisit || saved.explored) done++;

    // Special Biome Operation or Machine World Hack
    if (bId === 'MACHINE_WORLD') {
        total++;
        if (planet.hackedThisVisit || saved.hacked) done++;
    } else if (_getSpecialBiomeActionMeta(bId)) {
        total++;
        if (planet.specialUsedThisVisit || saved.specialUsed) done++;
    }

    return { done, total, complete: total > 0 && done >= total };
}

function _checkFullPlanetarySurveyBonus(planet, starX, starY, idx) {
    if (!planet) return;
    const saved = _getPlanetDelta(starX, starY, idx);
    if (saved.fullSurveyAwarded) return;

    const prog = _computePlanetSurveyProgress(planet, starX, starY, idx);
    if (prog.complete) {
        _savePlanetDelta(starX, starY, idx, { fullSurveyAwarded: true });
        const bonusXP = 120;
        if (typeof playerXP !== 'undefined') playerXP += bonusXP;
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:var(--gold-text); font-weight:bold;">★ FULL PLANETARY SURVEY COMPLETE ★</span> Every surface operation on <b>${_biomeEscapeHtml(planet.name || 'this world')}</b> (${_biomeEscapeHtml(planet.biome.name)}) is logged! Awarded <b>+${bonusXP} Bonus XP</b>.`);
        }
        if (typeof showToast === 'function') showToast(`100% PLANET SURVEY (+${bonusXP} XP)`, "success");
        if (typeof soundManager !== 'undefined') soundManager.playGain();
    }
}

// ==========================================
// --- BIOME UTILITY API ---
// ==========================================

const BiomeUtils = {
    getBiome(idOrName) {
        if (!idOrName) return PLANET_BIOMES.BARREN_ROCK;
        if (PLANET_BIOMES[idOrName]) return PLANET_BIOMES[idOrName];
        const byName = _biomeByName.get(idOrName);
        return byName || PLANET_BIOMES.BARREN_ROCK;
    },
    isHabitableBiome(id) {
        return _HABITABLE_BIOME_IDS.has(id);
    },
    isGiantBiome(id) {
        return _GIANT_BIOME_IDS.has(id);
    },
    getBiomesByResource(itemId) {
        return Object.values(PLANET_BIOMES).filter(b => Array.isArray(b.resources) && b.resources.includes(itemId));
    },
    getBiomesByRarity(tier) {
        const target = String(tier || "").toLowerCase();
        return Object.values(PLANET_BIOMES).filter(b => b.telemetry && b.telemetry.rarityTier.toLowerCase() === target);
    },
    getHabitabilityColor(habitability) {
        const h = String(habitability || "").toLowerCase();
        if (h.includes('ideal') || h.includes('habitable')) return 'var(--success)';
        if (h.includes('marginal')) return 'var(--warning)';
        if (h.includes('restricted')) return '#DDA0DD';
        return 'var(--danger)';
    },
    getPlanetProgressSummary(starX, starY, planetIndex) {
        const d = _getPlanetDelta(starX, starY, planetIndex);
        return {
            mined: Boolean(d.mined),
            scanned: Boolean(d.scanned),
            explored: Boolean(d.explored),
            hacked: Boolean(d.hacked),
            specialUsed: Boolean(d.specialUsed),
            skimmed: Boolean(d.skimmed),
            fullSurveyAwarded: Boolean(d.fullSurveyAwarded)
        };
    },
    getBiomeDistribution() {
        const list = Object.values(PLANET_BIOMES);
        const totalWeight = list.reduce((sum, b) => sum + (b.weight || 10), 0);
        return list.map(b => ({
            id: b.id,
            name: b.name,
            weight: b.weight || 10,
            chancePct: parseFloat((((b.weight || 10) / Math.max(1, totalWeight)) * 100).toFixed(2))
        }));
    },
    registerBiome(id, def) {
        if (!id || !def || !def.name) return false;
        const normalized = {
            id,
            landable: true,
            weight: 10,
            hazard: "NONE",
            colonyBonusDesc: "Standard baseline output",
            description: "",
            resources: ['MINERALS'],
            image: 'assets/barren_rock.png',
            ...def
        };
        if (Array.isArray(normalized.resources)) Object.freeze(normalized.resources);
        if (normalized.telemetry) Object.freeze(normalized.telemetry);
        if (normalized.expeditionData) Object.freeze(normalized.expeditionData);
        Object.freeze(normalized);
        PLANET_BIOMES[id] = normalized;
        _biomeByName.set(normalized.name, normalized);
        if (def.isHabitable) _HABITABLE_BIOME_IDS.add(id);
        if (def.isGiant) _GIANT_BIOME_IDS.add(id);
        return true;
    },
    registerSpecialAction(biomeId, meta, handlerFn) {
        if (!biomeId || !meta || !meta.label || typeof handlerFn !== 'function') return false;
        _customSpecialBiomeActions.set(biomeId, { meta, handler: handlerFn });
        return true;
    }
};
window.BiomeUtils = BiomeUtils;

// ==========================================
// --- SPECIAL PLANETARY OPERATIONS ---
// ==========================================

// 1. Gas / Ice Giant Orbital Atmospheric Skimming (Triggered from System Map)
function skimGasGiantAtmosphere(planetIndex) {
    if (!currentSystemData || !currentSystemData.planets || !currentSystemData.planets[planetIndex]) return;
    const planet = currentSystemData.planets[planetIndex];
    const savedState = _getPlanetDelta(currentSystemData.x, currentSystemData.y, planetIndex);

    if (planet.skimmedThisVisit || savedState.skimmed) {
        if (typeof showToast === 'function') showToast("UPPER ATMOSPHERE ALREADY SKIMMED", "info");
        if (typeof logMessage === 'function') logMessage("Upper atmospheric isotope bands are turbulent and depleted for this visit.");
        return;
    }

    planet.skimmedThisVisit = true;
    planet.scannedThisVisit = true;
    _savePlanetDelta(currentSystemData.x, currentSystemData.y, planetIndex, { skimmed: true, scanned: true });

    let skimTime = 0.15;
    if (_biomeHasPerk('LONG_RANGE_SENSORS')) skimTime *= 0.2;
    if (typeof advanceGameTime === 'function') advanceGameTime(skimTime);

    // Calculate fuel gain with SCOOP_BONUS crew & QUANTUM_NAVIGATOR perk support
    let fuelGain = 45 + Math.floor(Math.random() * 35);
    if (typeof hasCrewPerk === 'function' && hasCrewPerk('SCOOP_BONUS')) {
        fuelGain = Math.floor(fuelGain * 1.20);
    }
    if (_biomeHasPerk('QUANTUM_NAVIGATOR')) {
        fuelGain = Math.floor(fuelGain * 1.25);
        if (typeof stealthHeat !== 'undefined' && stealthHeat > 0) {
            stealthHeat = Math.max(0, stealthHeat - 2);
        }
    }

    if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
        playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + fuelGain) * 10) / 10);
    }

    const lootNotes = [`+${fuelGain} Fuel`];
    const addedH3 = _biomeSafeAddCargo('HYDROGEN_3', 2 + Math.floor(Math.random() * 4));
    if (addedH3 > 0) lootNotes.push(`+${addedH3}x Hydrogen-3`);

    if (planet.biome && planet.biome.id === 'ICE_GIANT') {
        if (Math.random() < 0.45) {
            const addedQF = _biomeSafeAddCargo('QUANTUM_FLUID', 1);
            if (addedQF > 0) lootNotes.push(`+1x Quantum Fluid`);
        }
        const addedWater = _biomeSafeAddCargo('WATER', 2);
        if (addedWater > 0) lootNotes.push(`+${addedWater}x Purified Water`);
    }

    const xpGain = 55;
    if (typeof playerXP !== 'undefined') playerXP += xpGain;

    if (typeof soundManager !== 'undefined') soundManager.playGain();
    if (typeof showToast === 'function') showToast(`ATMO-SKIM: ${lootNotes.join(', ')}`, "success");
    if (typeof logMessage === 'function') {
        logMessage(`<span style="color:var(--accent-color); font-weight:bold;">[ ATMOSPHERIC SKIM ]</span> Dived into ${_biomeEscapeHtml(planet.name)}'s upper cloud bands! Recovered ${lootNotes.join(', ')} (+${xpGain} XP).`);
    }

    if (typeof renderSystemMap === 'function' && currentGameState === GAME_STATES.SYSTEM_MAP) {
        renderSystemMap();
    }
    if (typeof checkLevelUp === 'function') checkLevelUp();
    if (typeof autoSaveGame === 'function') autoSaveGame();
}
window.skimGasGiantAtmosphere = skimGasGiantAtmosphere;

// Helper describing each landable biome's unique surface operation button (100% coverage of all 21 landable biomes)
function _getSpecialBiomeActionMeta(bId) {
    if (_customSpecialBiomeActions.has(bId)) {
        return _customSpecialBiomeActions.get(bId).meta;
    }
    switch (bId) {
        case 'BARREN_ROCK':
            return { label: '☄️ DEEP-CRATER IMPACT ASSAY', done: '✓ IMPACT RIM ASSAYED', color: 'var(--accent-color)', glow: 'rgba(0,224,224,0.25)' };
        case 'TIDAL_LOCKED':
            return { label: '🌅 HARVEST TERMINATOR SOLAR-CONDENSATE', done: '✓ TWILIGHT BELT TAPPED', color: '#FFCC66', glow: 'rgba(255,204,102,0.28)' };
        case 'TOXIC':
            return { label: '🌿 EXTRACT CANOPY ALKALOID RESIN', done: '✓ CANOPY GROVE HARVESTED', color: '#44DD66', glow: 'rgba(68,221,102,0.28)' };
        case 'SULFURIC_MIRE':
            return { label: '🧪 SIPHON FUMAROLE CATALYTIC GEL', done: '✓ FUMAROLE VENT DRAINED', color: '#DDCC33', glow: 'rgba(221,204,51,0.28)' };
        case 'TOMB_WORLD':
        case 'ARCHIVE_WORLD':
            return { label: '🏛️ EXCAVATE PRECURSOR SANCTUM', done: '✓ SANCTUM EXCAVATED', color: '#DDA0DD', glow: 'rgba(153,51,255,0.3)' };
        case 'CRYSTAL':
            return { label: '🔮 ATTUNE HARMONIC LATTICE (+150% SHIELDS)', done: '✓ HARMONICS DEPLETED', color: '#FF33FF', glow: 'rgba(255,51,255,0.3)' };
        case 'MYCELIAL':
            return { label: '🍄 COMMUNE WITH SPORE NETWORK', done: '✓ SPORE LINK DORMANT', color: '#00FFAA', glow: 'rgba(0,255,170,0.3)' };
        case 'VOLCANIC':
            return { label: '🌋 TAP GEOTHERMAL MAGMA VENT', done: '✓ MAGMA VENT SEALED', color: '#FF7733', glow: 'rgba(255,119,51,0.3)' };
        case 'GLACIAL':
            return { label: '🧊 MELT SUB-GLACIAL DEUTERIUM POCKET', done: '✓ GLACIAL POCKET TAPPED', color: '#66DDFF', glow: 'rgba(102,221,255,0.3)' };
        case 'OCEANIC':
            return { label: '🌊 DEPLOY ABYSSAL BATHYSCAPHE', done: '✓ TRENCH SURVEYED', color: '#00AAFF', glow: 'rgba(0,170,255,0.3)' };
        case 'SHATTERED_CORE':
        case 'FERRIC_MOON':
            return { label: '🧲 CUT EXPOSED CORE-MANTLE SLAB', done: '✓ CORE VEIN STRIPPED', color: 'var(--gold-text)', glow: 'rgba(255,215,0,0.25)' };
        case 'IRRADIATED':
        case 'GLASS_WASTELAND':
            return { label: '☢️ GAMMA-SPEC SALVAGE SWEEP', done: '✓ FALLOUT SECTOR SWEPT', color: 'var(--warning)', glow: 'rgba(255,170,0,0.3)' };
        case 'TERRAN':
        case 'BIOLUMINESCENT':
            return { label: '🏕️ ESTABLISH FIELD BIO-CAMP (+HULL & CREW)', done: '✓ CAMP PACKED UP', color: 'var(--success)', glow: 'rgba(0,255,120,0.25)' };
        case 'DESERT':
        case 'KARST_CAVERN':
            return { label: '🏜️ CRACK SUB-SURFACE FISSURE', done: '✓ FISSURE CLEARED', color: '#FFAA66', glow: 'rgba(255,170,102,0.25)' };
        case 'DEATH_WORLD':
            return { label: '🦴 TRACK APEX PREDATOR TROPHY', done: '✓ HUNT CONCLUDED', color: 'var(--danger)', glow: 'rgba(255,68,68,0.3)' };
        default:
            return null;
    }
}

// 2. Special Biome Surface Action Dispatcher (All 21 Landable Biomes + Custom Registry)
function executeBiomeSpecialAction() {
    if (!currentSystemData || !currentSystemData.planets) return;
    const planet = currentSystemData.planets[selectedPlanetIndex];
    if (!planet) return;

    const saved = _getPlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
    if (planet.specialUsedThisVisit || saved.specialUsed) return;

    const bId = planet.biome.id || 'BARREN_ROCK';
    planet.specialUsedThisVisit = true;
    _savePlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex, { specialUsed: true });

    if (typeof advanceGameTime === 'function') advanceGameTime(0.20);

    // Custom registered action handler hook
    if (_customSpecialBiomeActions.has(bId)) {
        try {
            _customSpecialBiomeActions.get(bId).handler(planet, currentSystemData, selectedPlanetIndex);
        } catch (e) {
            console.warn("Custom biome special action error:", e);
        }
        _checkFullPlanetarySurveyBonus(planet, currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
        if (typeof renderPlanetView === 'function') renderPlanetView();
        if (typeof checkLevelUp === 'function') checkLevelUp();
        if (typeof autoSaveGame === 'function') autoSaveGame();
        return;
    }

    const hasHealthPhysicist = _biomeHasPerk('HEALTH_PHYSICIST') ||
        (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY');
    const hasThermalShield = _biomeHasPerk('QUANTUM_NAVIGATOR') ||
        (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_THERMAL_BAFFLES');
    const hasHeavyArmor = _biomeHasPerk('EMERGENCY_BULKHEADS') || _biomeHasPerk('NANO_HULL_WEAVE');
    const hasCryoAdapt = _biomeHasPerk('CRYO_ADAPTATION');

    // 0. BARREN_ROCK: Deep-Crater Impact Assay
    if (bId === 'BARREN_ROCK') {
        const dropId = Math.random() < 0.35 ? 'PLATINUM_ORE' : 'MINERALS';
        const wantQty = dropId === 'PLATINUM_ORE' ? 2 : (4 + Math.floor(Math.random() * 4));
        const added = _biomeSafeAddCargo(dropId, wantQty);
        const dropName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId]) ? COMMODITIES[dropId].name : dropId;
        const credFind = 120 + Math.floor(Math.random() * 140);
        if (typeof playerCredits !== 'undefined') playerCredits += credFind;
        if (typeof playerXP !== 'undefined') playerXP += 75;
        if (typeof soundManager !== 'undefined') soundManager.playMining();
        if (typeof showToast === 'function') showToast("IMPACT RIM ASSAYED", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:var(--accent-color); font-weight:bold;">[ CRATER ASSAY ]</span> Core-drilled primordial impact ejecta for${added > 0 ? ` <b>+${added}x ${dropName}</b> and` : ''} <b>+${formatNumber(credFind)}c</b> (+75 XP).`);
        }
    }
    // 0.25 TIDAL_LOCKED: Harvest Terminator Solar-Condensate
    else if (bId === 'TIDAL_LOCKED') {
        let galeNote = "";
        if (!hasHeavyArmor && Math.random() < 0.20) {
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 7, reason: "Terminator Katabatic Gale" });
            if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
            galeNote = ` <span style="color:var(--danger)">(-7 Hull wind shear)</span>`;
        }
        const fuelGain = 25;
        if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
            playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + fuelGain) * 10) / 10);
        }
        if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
            playerShields = MAX_SHIELDS;
        }
        const addedWater = _biomeSafeAddCargo('WATER', 3);
        const addedMetal = Math.random() < 0.45 ? _biomeSafeAddCargo('RARE_METALS', 1) : 0;
        if (typeof playerXP !== 'undefined') playerXP += 110;
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        if (typeof showToast === 'function') showToast("TERMINATOR HARVEST COMPLETE", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#FFCC66; font-weight:bold;">[ TERMINATOR CONDENSATE ]</span> Harvested perpetual twilight runoff (+${fuelGain} Fuel, 100% Shields${addedWater > 0 ? `, +${addedWater}x Purified Water` : ''}${addedMetal > 0 ? `, +${addedMetal}x Rare Metals` : ''}, +110 XP).${galeNote}`);
        }
    }
    // 0.5 TOXIC: Extract Canopy Alkaloid Resin
    else if (bId === 'TOXIC') {
        let acidNote = "";
        if (!hasHeavyArmor && Math.random() < 0.22) {
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 8, reason: "Toxic Canopy Sap" });
            if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
            acidNote = ` <span style="color:var(--danger)">(-8 Hull caustic sap)</span>`;
        }
        const addedSpice = _biomeSafeAddCargo('KTHARR_SPICES', 2 + Math.floor(Math.random() * 2));
        const addedBio = _biomeSafeAddCargo('GENETIC_SAMPLES', 2);
        if (typeof playerXP !== 'undefined') playerXP += 115;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        if (typeof showToast === 'function') showToast("ALKALOID RESIN EXTRACTED", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#44DD66; font-weight:bold;">[ CANOPY EXTRACTION ]</span> Tapped high-alkaloid jungle vines${(addedSpice + addedBio) > 0 ? ` for <b>+${addedSpice}x K'tharr Spices & +${addedBio}x Genetic Samples</b>` : ' (hold full)'} (+115 XP).${acidNote}`);
        }
    }
    // 0.75 SULFURIC_MIRE: Siphon Fumarole Catalytic Gel
    else if (bId === 'SULFURIC_MIRE') {
        let mireNote = "";
        if (!hasHeavyArmor && Math.random() < 0.25) {
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 9, reason: "Sulfuric Fumarole Plume" });
            if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
            mireNote = ` <span style="color:var(--danger)">(-9 Hull sulfuric mist)</span>`;
        }
        const addedQF = _biomeSafeAddCargo('QUANTUM_FLUID', 1 + Math.floor(Math.random() * 2));
        const addedMed = _biomeSafeAddCargo('MEDICAL_SUPPLIES', 2);
        if (typeof playerXP !== 'undefined') playerXP += 125;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        if (typeof showToast === 'function') showToast("FUMAROLE GEL SIPHONED", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#DDCC33; font-weight:bold;">[ FUMAROLE SIPHON ]</span> Collected extremophile vent gels${(addedQF + addedMed) > 0 ? ` (<b>+${addedQF}x Quantum Fluid, +${addedMed}x Medical Supplies</b>)` : ' (hold full)'} (+125 XP).${mireNote}`);
        }
    }
    // A. TOMB_WORLD or ARCHIVE_WORLD: Subterranean Precursor Excavation
    else if (bId === 'TOMB_WORLD' || bId === 'ARCHIVE_WORLD') {
        if (typeof unlockLoreEntry === 'function') {
            unlockLoreEntry('XENO_TOMB_WORLDS');
            unlockLoreEntry('XENO_PRECURSORS');
            if (bId === 'ARCHIVE_WORLD') unlockLoreEntry('PRECURSOR_ORIGINS');
        }
        if (typeof enterPrecursorVault === 'function' && Math.random() < 0.45) {
            if (typeof logMessage === 'function') {
                logMessage("<span style='color:#9933FF; font-weight:bold;'>[ TOMB UNSEALED ]</span> Your excavation charges breached a subterranean Precursor Vault!");
            }
            _checkFullPlanetarySurveyBonus(planet, currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
            if (typeof renderPlanetView === 'function') renderPlanetView();
            if (typeof autoSaveGame === 'function') autoSaveGame();
            enterPrecursorVault();
            return;
        }

        const dropPool = bId === 'ARCHIVE_WORLD'
            ? ['ANCIENT_ARCHIVE', 'PRECURSOR_STAR_MAP_FRAGMENT', 'PRECURSOR_DATACUBE', 'ENCRYPTED_ENGRAM']
            : ['PRECURSOR_DATACUBE', 'ENCRYPTED_ENGRAM', 'PRECURSOR_STAR_MAP_FRAGMENT', 'ANCIENT_RELICS'];
        const picked = dropPool[Math.floor(Math.random() * dropPool.length)];
        const xp = bId === 'ARCHIVE_WORLD' ? 280 : 220;
        if (typeof playerXP !== 'undefined') playerXP += xp;

        const added = _biomeSafeAddCargo(picked, 1);
        const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[picked]) ? COMMODITIES[picked].name : picked;
        const lootText = added > 0
            ? ` Unearthed <b>1x ${itemName}</b>!`
            : ` <span style="color:var(--warning)">(Cargo hold full — physical relic left in stasis!)</span>`;

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
        const drop = Math.random() < 0.5 ? 'QUANTUM_LENS' : 'VOID_CRYSTALS';
        const added = _biomeSafeAddCargo(drop, 1);
        const dropName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[drop]) ? COMMODITIES[drop].name : drop;
        const lensMsg = added > 0 ? ` Focused laser harmonics cleaved <b>1x ${dropName}</b>!` : '';

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
        const added = _biomeSafeAddCargo('SENTIENT_MYCELIUM', 2);
        const dropNote = added > 0
            ? `, +${added}x Sentient Mycelium`
            : ` <span style="color:var(--warning)">(Cargo hold full — spores left behind)</span>`;

        if (typeof soundManager !== 'undefined') soundManager.playScan();
        if (typeof showToast === 'function') showToast("SPORE VISION RECEIVED (+200 XP)", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#00FFAA; font-weight:bold;">[ SPORE COMMUNION ]</span> The planet-spanning fungal intelligence shared visions of distant star-paths (+${xp} XP${dropNote})!`);
        }
    }
    // D. VOLCANIC: Tap Geothermal Magma Vent
    else if (bId === 'VOLCANIC') {
        let thermalNote = "";
        if (!hasThermalShield && Math.random() < 0.30) {
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 10, reason: "Magma Vent Surge" });
            if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
            thermalNote = ` <span style="color:var(--danger)">(-10 Hull thermal scorch)</span>`;
        }
        if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
            playerShields = Math.max(playerShields, Math.floor(MAX_SHIELDS * 1.25));
        }
        const addedAlloy = _biomeSafeAddCargo('REFINED_ALLOY', 1 + Math.floor(Math.random() * 2));
        if (typeof playerXP !== 'undefined') playerXP += 110;
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        if (typeof showToast === 'function') showToast("MAGMA VENT TAPPED", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#FF7733; font-weight:bold;">[ GEOTHERMAL TAP ]</span> Thermal converters overcharged shields to 125%${addedAlloy > 0 ? ` and smelted <b>+${addedAlloy}x Refined Alloy</b>` : ''} (+110 XP).${thermalNote}`);
        }
    }
    // E. GLACIAL: Melt Sub-Glacial Deuterium Pocket
    else if (bId === 'GLACIAL') {
        const fuelGain = 40 + Math.floor(Math.random() * 26) + (hasCryoAdapt ? 10 : 0);
        if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
            playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + fuelGain) * 10) / 10);
        }
        const addedWater = _biomeSafeAddCargo('WATER', 2 + Math.floor(Math.random() * 3));
        if (typeof playerXP !== 'undefined') playerXP += 90;
        if (typeof soundManager !== 'undefined') soundManager.playBuy();
        if (typeof showToast === 'function') showToast(`GLACIAL SIPHON: +${fuelGain} FUEL`, "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#66DDFF; font-weight:bold;">[ SUB-GLACIAL TAP ]</span> Melted pressurized cryo-veins for <b>+${fuelGain} Fuel</b>${addedWater > 0 ? ` and <b>+${addedWater}x Purified Water</b>` : ''} (+90 XP).`);
        }
    }
    // F. OCEANIC: Deploy Abyssal Bathyscaphe
    else if (bId === 'OCEANIC') {
        const addedH3 = _biomeSafeAddCargo('HYDROGEN_3', 1 + Math.floor(Math.random() * 2));
        const addedData = Math.random() < 0.55 ? _biomeSafeAddCargo('PLANETARY_DATA', 1) : 0;
        const addedBio = _biomeSafeAddCargo('GENETIC_SAMPLES', 2);
        const finds = [];
        if (addedH3 > 0) finds.push(`+${addedH3}x Hydrogen-3`);
        if (addedBio > 0) finds.push(`+${addedBio}x Genetic Samples`);
        if (addedData > 0) finds.push(`+1x Planetary Data`);
        if (typeof playerXP !== 'undefined') playerXP += 110;
        if (typeof soundManager !== 'undefined') soundManager.playScan();
        if (typeof showToast === 'function') showToast("ABYSSAL DIVE COMPLETE", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#00AAFF; font-weight:bold;">[ ABYSSAL BATHYSCAPHE ]</span> Deep-trench submersible surfaced${finds.length > 0 ? ` with <b>${finds.join(', ')}</b>` : ''} (+110 XP).`);
        }
    }
    // G. SHATTERED_CORE / FERRIC_MOON: Cut Core-Mantle Slab
    else if (bId === 'SHATTERED_CORE' || bId === 'FERRIC_MOON') {
        const addedAlloy = _biomeSafeAddCargo('REFINED_ALLOY', 1 + Math.floor(Math.random() * 2));
        const addedPlat = _biomeSafeAddCargo('PLATINUM_ORE', 2 + Math.floor(Math.random() * 2));
        const addedGeo = bId === 'FERRIC_MOON' ? _biomeSafeAddCargo('MINERAL_GEODE', 1) : 0;
        const parts = [];
        if (addedAlloy > 0) parts.push(`+${addedAlloy}x Refined Alloy`);
        if (addedPlat > 0) parts.push(`+${addedPlat}x Platinum Ore`);
        if (addedGeo > 0) parts.push(`+1x Crystalline Geode`);
        if (typeof playerXP !== 'undefined') playerXP += 125;
        if (typeof soundManager !== 'undefined') soundManager.playMining();
        if (typeof showToast === 'function') showToast("CORE SLAB EXTRACTED", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:var(--gold-text); font-weight:bold;">[ CORE EXTRACTION ]</span> Sheared high-density core seams${parts.length > 0 ? `: <b>${parts.join(', ')}</b>` : ' (hold full)'} (+125 XP).`);
        }
    }
    // H. IRRADIATED / GLASS_WASTELAND: Gamma-Spec Salvage Sweep
    else if (bId === 'IRRADIATED' || bId === 'GLASS_WASTELAND') {
        let radNote = "";
        if (!hasHealthPhysicist) {
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 12, reason: "Hot-Zone Gamma Flux" });
            if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
            radNote = ` <span style="color:var(--danger)">(-12 Hull gamma exposure)</span>`;
        } else {
            radNote = ` <span style="color:var(--success)">(0 rad damage — Dosimetry active)</span>`;
        }
        const dropId = bId === 'IRRADIATED'
            ? (Math.random() < 0.65 ? 'VOID_CRYSTALS' : 'PRECURSOR_CIPHER')
            : (Math.random() < 0.65 ? 'OBSIDIAN_TEAR_PLATING' : 'AI_CORE');
        const added = _biomeSafeAddCargo(dropId, 1);
        const dropName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId]) ? COMMODITIES[dropId].name : dropId;
        if (typeof playerXP !== 'undefined') playerXP += 145;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        if (typeof showToast === 'function') showToast("GAMMA-SPEC SWEEP COMPLETE", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:var(--warning); font-weight:bold;">[ RADIOLOGICAL SWEEP ]</span> Pinpointed hot-zone signature${added > 0 ? ` and recovered <b>1x ${dropName}</b>` : ''} (+145 XP).${radNote}`);
        }
    }
    // I. TERRAN / BIOLUMINESCENT: Field Bio-Camp (Restores Ship & Crew Loyalty)
    else if (bId === 'TERRAN' || bId === 'BIOLUMINESCENT') {
        if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined') {
            playerHull = Math.min(MAX_PLAYER_HULL, playerHull + 20);
        }
        if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
            playerShields = MAX_SHIELDS;
        }
        let crewBoostMsg = "";
        if (typeof playerCrew !== 'undefined' && Array.isArray(playerCrew) && playerCrew.length > 0) {
            playerCrew.forEach(c => {
                if (c) c.loyalty = Math.min(100, (typeof c.loyalty === 'number' ? c.loyalty : 50) + 5);
            });
            crewBoostMsg = " Crew shore-camp boosted everyone's Loyalty by +5%!";
        }
        if (typeof playerXP !== 'undefined') playerXP += 100;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        if (typeof showToast === 'function') showToast("FIELD BIO-CAMP COMPLETE", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:var(--success); font-weight:bold;">[ FIELD BIO-CAMP ]</span> Open air and gravity gave your team time to overhaul the hull (+20 Hull, 100% Shields, +100 XP).${crewBoostMsg}`);
        }
    }
    // J. DESERT / KARST_CAVERN: Crack Sub-Surface Fissure
    else if (bId === 'DESERT' || bId === 'KARST_CAVERN') {
        const dropId = bId === 'DESERT' ? 'KTHARR_SPICES' : 'MINERAL_GEODE';
        const added = _biomeSafeAddCargo(dropId, 2 + Math.floor(Math.random() * 2));
        const dropName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId]) ? COMMODITIES[dropId].name : dropId;
        const credFind = 200 + Math.floor(Math.random() * 250);
        if (typeof playerCredits !== 'undefined') playerCredits += credFind;
        if (typeof playerXP !== 'undefined') playerXP += 105;
        if (typeof soundManager !== 'undefined') soundManager.playMining();
        if (typeof showToast === 'function') showToast("FISSURE CRACKED", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:#FFAA66; font-weight:bold;">[ FISSURE EXTRACTION ]</span> Breached a sheltered seam for${added > 0 ? ` <b>+${added}x ${dropName}</b> and` : ''} <b>+${formatNumber(credFind)}c</b> in raw nuggets (+105 XP).`);
        }
    }
    // K. DEATH_WORLD: Track Apex Predator Trophy
    else if (bId === 'DEATH_WORLD') {
        const marines = (typeof playerShip !== 'undefined' && playerShip.forces) ? (playerShip.forces.marines || 0) : 0;
        const dmg = marines >= 5 ? 6 : 16;
        if (Math.random() < (marines >= 5 ? 0.35 : 0.65)) {
            if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: dmg, reason: "Death World Apex Predator" });
            if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
        }
        const addedTrophy = _biomeSafeAddCargo('KTHARR_WAR_TROPHY', 1);
        const addedBio = _biomeSafeAddCargo('GENETIC_SAMPLES', 3);
        if (typeof playerXP !== 'undefined') playerXP += 200;
        if (typeof soundManager !== 'undefined') soundManager.playGain();
        if (typeof showToast === 'function') showToast("APEX HUNT COMPLETE", "success");
        if (typeof logMessage === 'function') {
            logMessage(`<span style="color:var(--danger); font-weight:bold;">[ APEX SAFARI ]</span> ${marines >= 5 ? 'Marine escort suppressed the ambush! ' : ''}Secured${addedTrophy > 0 ? ' <b>1x K\'tharr War Trophy</b> &' : ''}${addedBio > 0 ? ` <b>+${addedBio}x Genetic Samples</b>` : ''} (+200 XP)!`);
        }
    }

    _checkFullPlanetarySurveyBonus(planet, currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
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
                        const saved = _getPlanetDelta(starX, starY, idx);
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

        // 0.5 ENHANCE SYSTEM MAP CARDS (ATMO-SKIM, COLONY BADGES, 100% SURVEY BADGE & RARITY TAGS)
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
                    const saved = _getPlanetDelta(currentSystemData.x, currentSystemData.y, idx);
                    const isSkimmed = Boolean(planet.skimmedThisVisit || saved.skimmed);
                    const surveyProg = _computePlanetSurveyProgress(planet, currentSystemData.x, currentSystemData.y, idx);

                    // Add Colony indicator badge if player has a settlement on this world
                    const colId = `${currentSystemData.x}_${currentSystemData.y}_p${idx}`;
                    const colonyHere = typeof playerColonies !== 'undefined' ? playerColonies[colId] : null;
                    if (colonyHere && colonyHere.established) {
                        const colBadge = document.createElement('div');
                        colBadge.style.cssText = 'position:absolute; top:-10px; left:-10px; background:var(--gold-text); color:#000; font-size:9px; font-weight:bold; padding:2px 6px; border-radius:10px; box-shadow:0 0 8px var(--gold-text);';
                        colBadge.textContent = '🏛️ COLONY';
                        card.appendChild(colBadge);
                    }

                    // Upgrade the top-right status badge to 100% SURVEYED when all operations are complete
                    if (surveyProg.complete) {
                        const existingBadges = card.querySelectorAll('div');
                        existingBadges.forEach(div => {
                            if (div.textContent && div.textContent.trim() === 'SCANNED') {
                                div.textContent = '★ 100%';
                                div.style.background = 'var(--gold-text)';
                                div.style.boxShadow = '0 0 10px var(--gold-text)';
                            }
                        });
                    }

                    // Show Subtle Telemetry Rarity / Gravity line inside card
                    if (planet.biome.telemetry) {
                        const infoLine = document.createElement('div');
                        infoLine.style.cssText = 'font-size:10px; color:var(--item-desc-color); margin-top:4px;';
                        infoLine.textContent = `${planet.biome.telemetry.gravity} · ${planet.biome.telemetry.rarityTier}`;
                        const btn = card.querySelector('button.action-button');
                        if (btn && btn.parentNode) btn.parentNode.insertBefore(infoLine, btn);
                    }

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

        // 0.75 UPGRADE examinePlanet() DOUBLE-CLICK SCAN MODAL WITH ASTROPHYSICAL TELEMETRY
        if (typeof window.examinePlanet === 'function' && !window._biomeExaminePatched) {
            const origExaminePlanet = window.examinePlanet;
            window.examinePlanet = function(index) {
                origExaminePlanet.apply(this, arguments);
                if (!currentSystemData || !currentSystemData.planets || !currentSystemData.planets[index]) return;
                const planet = currentSystemData.planets[index];
                const biome = planet.biome;
                const detailEl = document.getElementById('genericDetailContent');
                if (!biome || !detailEl) return;

                const t = biome.telemetry;
                const habColor = t ? BiomeUtils.getHabitabilityColor(t.habitability) : 'var(--accent-color)';
                const hazColor = biome.hazard && biome.hazard !== 'NONE' ? 'var(--danger)' : 'var(--success)';

                const telemetryCard = document.createElement('div');
                telemetryCard.style.cssText = 'padding: 0 20px 20px 20px; text-align:left;';
                telemetryCard.innerHTML = `
                    ${t ? `
                        <div class="trade-math-area" style="margin-bottom:12px;">
                            <div style="font-size:10px; color:var(--accent-color); letter-spacing:1.5px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">ORBITAL SPECTROSCOPY</div>
                            <div class="trade-stat-row"><span>Atmosphere:</span> <span style="color:var(--text-color); font-weight:bold;">${_biomeEscapeHtml(t.atmosphere)}</span></div>
                            <div class="trade-stat-row"><span>Surface Gravity:</span> <span style="color:var(--text-color); font-weight:bold;">${_biomeEscapeHtml(t.gravity)}</span></div>
                            <div class="trade-stat-row"><span>Temperature:</span> <span style="color:var(--text-color); font-weight:bold;">${_biomeEscapeHtml(t.tempRange)}</span></div>
                            <div class="trade-stat-row"><span>Habitability:</span> <span style="color:${habColor}; font-weight:bold;">${_biomeEscapeHtml(t.habitability)}</span></div>
                            <div class="trade-stat-row"><span>Surface Hazard:</span> <span style="color:${hazColor}; font-weight:bold;">${_biomeEscapeHtml(biome.hazard || 'NONE')}</span></div>
                            <div class="trade-stat-row"><span>Colony Trait:</span> <span style="color:var(--gold-text); font-weight:bold;">${_biomeEscapeHtml(biome.colonyBonusDesc || 'Standard')}</span></div>
                        </div>
                    ` : ''}
                    ${biome.fieldNote ? `
                        <div style="background:rgba(0,224,224,0.06); border-left:3px solid var(--accent-color); padding:10px 12px; border-radius:0 4px 4px 0; font-size:12px; color:var(--item-desc-color); font-style:italic; line-height:1.5;">
                            <strong style="color:var(--accent-color); font-style:normal; font-size:10px; letter-spacing:1px; display:block; margin-bottom:4px;">CYGNUS SURVEY FIELD NOTE</strong>
                            "${_biomeEscapeHtml(biome.fieldNote)}"
                        </div>
                    ` : ''}
                `;
                detailEl.appendChild(telemetryCard);
            };
            window._biomeExaminePatched = true;
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
                const t = biomeObj.telemetry;
                const oreStatus = location.miningDepleted
                    ? "<span style='color:var(--danger); font-weight:bold;'>Depleted (Orbital veins stripped)</span>"
                    : "<span style='color:var(--success); font-weight:bold;'>Rich lithosphere veins detected</span>";

                const scanBox = document.getElementById('surfaceScanResultBox');
                if (scanBox) {
                    scanBox.innerHTML = `
                        <div style="margin-top: 12px; padding: 12px; border-left: 3px solid var(--accent-color); background: rgba(0, 224, 224, 0.08); font-size: 12px; color: var(--text-color); animation: fadeIn 0.35s;">
                            <div style="color: var(--accent-color); font-weight: bold; margin-bottom: 6px; letter-spacing:1px;">SPECTROMETRY TELEMETRY:</div>
                            <div style="line-height:1.6;">
                                • <b>Classification:</b> ${_biomeEscapeHtml(biomeObj.name)}${t ? ` (${_biomeEscapeHtml(t.rarityTier)})` : ''}<br>
                                ${t ? `• <b>Atmosphere / Gravity:</b> ${_biomeEscapeHtml(t.atmosphere)} · ${_biomeEscapeHtml(t.gravity)}<br>` : ''}
                                ${t ? `• <b>Surface Temp:</b> ${_biomeEscapeHtml(t.tempRange)}<br>` : ''}
                                • <b>Surface Hazard:</b> <span style="color:${hazColor}; font-weight:bold;">${_biomeEscapeHtml(biomeObj.hazard || 'NONE')}</span><br>
                                • <b>Detected Signatures:</b> <span style="color:var(--gold-text);">${_biomeEscapeHtml(resNames || 'Silicates')}</span><br>
                                • <b>Colony Suitability:</b> ${_biomeEscapeHtml(biomeObj.colonyBonusDesc || 'Standard')}<br>
                                • <b>Orbital Survey:</b> ${oreStatus}
                            </div>
                            ${biomeObj.fieldNote ? `<div style="margin-top:8px; padding-top:6px; border-top:1px dashed var(--border-color); font-size:11px; color:var(--item-desc-color); font-style:italic;">"${_biomeEscapeHtml(biomeObj.fieldNote)}"</div>` : ''}
                        </div>
                    `;
                }
            };
            window._biomeSurfaceScanPatched = true;
        }

        // 2. PREVENT INFINITE BIO-SCAN EXPLOIT, PERSIST DELTAS & CHECK 100% SURVEY
        if (typeof window.scanPlanetForLife === 'function' && !window._biomeBioScanPatched) {
            const origScanLife = window.scanPlanetForLife;
            window.scanPlanetForLife = function() {
                if (typeof currentGameState !== 'undefined' && currentGameState !== GAME_STATES.PLANET_VIEW) return;
                if (!currentSystemData || !currentSystemData.planets) return;

                const planet = currentSystemData.planets[selectedPlanetIndex];
                if (!planet) return;

                const saved = _getPlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
                if (saved.scanned) planet.scannedThisVisit = true;

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
                    _savePlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex, { scanned: true });
                    _checkFullPlanetarySurveyBonus(planet, currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
                    if (typeof renderPlanetView === 'function') renderPlanetView();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
            };
            window._biomeBioScanPatched = true;
        }

        // 3. REFRESH PLANET VIEW & CHECK 100% SURVEY AFTER SURFACE MINING
        if (typeof window.minePlanet === 'function' && !window._biomeMinePlanetPatched) {
            const origMinePlanet = window.minePlanet;
            window.minePlanet = function() {
                origMinePlanet.apply(this, arguments);
                if (currentSystemData && currentSystemData.planets && currentSystemData.planets[selectedPlanetIndex]) {
                    _checkFullPlanetarySurveyBonus(currentSystemData.planets[selectedPlanetIndex], currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                }
                if (typeof currentGameState !== 'undefined' && currentGameState === GAME_STATES.PLANET_VIEW && typeof renderPlanetView === 'function') {
                    renderPlanetView();
                }
            };
            window._biomeMinePlanetPatched = true;
        }

        // 4. DATA-DRIVEN SURFACE EXPEDITION ENGINE (WITH HAZARDS, MITIGATION & 6 FIELD DISCOVERIES)
        window.startSurfaceExpedition = function() {
            if (!currentSystemData || !currentSystemData.planets) return;
            const planet = currentSystemData.planets[selectedPlanetIndex];
            if (!planet) return;

            const saved = _getPlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
            if (planet.exploredThisVisit || saved.explored) {
                planet.exploredThisVisit = true;
                if (typeof renderPlanetView === 'function') renderPlanetView();
                return;
            }

            planet.exploredThisVisit = true;
            _savePlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex, { explored: true });

            if (typeof advanceGameTime === 'function') advanceGameTime(0.25);
            if (typeof soundManager !== 'undefined') soundManager.playScan();

            const biome = planet.biome || PLANET_BIOMES.BARREN_ROCK;
            const expData = biome.expeditionData || { baseXp: 80 };
            const flavor = biome.expeditionFlavor || "Your away team conducts a thorough overland traverse of the landing zone.";

            const hasScavenger = _biomeHasPerk('SCAVENGER_PROTOCOL') || (typeof hasCrewPerk === 'function' && hasCrewPerk('SCAVENGER_PROTOCOL'));
            const hasBio = _biomeHasPerk('XENO_BIOLOGIST');
            const hasHealthPhysicist = _biomeHasPerk('HEALTH_PHYSICIST') ||
                (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_DOSIMETRY_ARRAY');
            const hasThermalShield = _biomeHasPerk('QUANTUM_NAVIGATOR') ||
                (typeof playerShip !== 'undefined' && playerShip.components && playerShip.components.utility === 'UTIL_THERMAL_BAFFLES');
            const hasHeavyArmor = _biomeHasPerk('EMERGENCY_BULKHEADS') || _biomeHasPerk('NANO_HULL_WEAVE');
            const marinesCount = (typeof playerShip !== 'undefined' && playerShip.forces) ? (playerShip.forces.marines || 0) : 0;

            let xpGain = (expData.baseXp || 80) + Math.floor(Math.random() * 40);
            if (hasBio && (BiomeUtils.isHabitableBiome(biome.id) || biome.id === 'DEATH_WORLD' || biome.id === 'SULFURIC_MIRE')) {
                xpGain *= 2;
            }

            let creditFind = 0;
            const lootItems = [];
            let hazardMsg = "";
            let discoveryMsg = "";

            // 1. Lore Unlocks
            if (expData.loreKey && typeof unlockLoreEntry === 'function') {
                unlockLoreEntry(expData.loreKey);
            }

            // 2. Dynamic Hazard Resolution (With Equipment, Perk & Marine Mitigation)
            if (expData.hazard && Math.random() < expData.hazard.chance) {
                const haz = expData.hazard;

                if (haz.type === 'RADIATION' && hasHealthPhysicist) {
                    hazardMsg = `<br><span style="color:var(--success)">☢️ DOSIMETRY SHIELDING: Zero radiation damage taken during surface EVA.</span>`;
                } else if (haz.type === 'HEAT' && hasThermalShield) {
                    hazardMsg = `<br><span style="color:var(--success)">❄️ THERMAL BAFFLES: Active cooling vanes deflected the magma surge with zero damage.</span>`;
                } else if (haz.type === 'COMBAT' && marinesCount >= 5) {
                    const reduced = Math.max(4, Math.floor(haz.damage * 0.4));
                    hazardMsg = `<br><span style="color:var(--warning)">🪖 MARINE ESCORT: Your troopers suppressed the ambush! Reduced damage to -${reduced} Hull.</span>`;
                    if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: reduced, reason: `Planetary Hazard (${biome.name})` });
                    if (typeof playerHull !== 'undefined' && playerHull <= 0) return;
                } else {
                    const finalDmg = (hasHeavyArmor && ['WIND', 'ACID', 'TECTONIC'].includes(haz.type))
                        ? Math.max(3, Math.floor(haz.damage * 0.5))
                        : haz.damage;
                    hazardMsg = `<br><span style="color:var(--danger)">${haz.msg} (-${finalDmg} Hull).</span>`;
                    if (typeof GameBus !== 'undefined') {
                        GameBus.emit('HULL_DAMAGED', { amount: finalDmg, reason: `Planetary Hazard (${biome.name})` });
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

            // 4. Bonus Surface Field Discovery (40% chance across 6 evocative micro-finds)
            if (Math.random() < 0.40) {
                const dRoll = Math.floor(Math.random() * 6);
                if (dRoll === 0) {
                    const bonusC = (200 + Math.floor(Math.random() * 300)) * (hasScavenger ? 2 : 1);
                    creditFind += bonusC;
                    lootItems.push({ id: 'NAVIGATION_CHARTS', qty: 1 });
                    discoveryMsg = `<br><span style="color:var(--accent-color)">🧭 FIELD FIND:</span> Located an abandoned Concord survey marker with intact star-charts!`;
                } else if (dRoll === 1) {
                    lootItems.push({ id: 'NANO_REPAIR_KIT', qty: 1 });
                    discoveryMsg = `<br><span style="color:var(--success)">🧰 FIELD FIND:</span> Uncovered a weather-sealed emergency supply drop containing a Nano-Repair Kit!`;
                } else if (dRoll === 2) {
                    lootItems.push({ id: 'MINERAL_GEODE', qty: 1 });
                    discoveryMsg = `<br><span style="color:var(--gold-text)">💎 FIELD FIND:</span> Exposed an uncracked Crystalline Geode tucked inside a fault line!`;
                } else if (dRoll === 3) {
                    const extraXp = hasBio ? 120 : 60;
                    xpGain += extraXp;
                    lootItems.push({ id: 'ARTIFACT_SHARDS', qty: 1 });
                    discoveryMsg = `<br><span style="color:#DDA0DD">🗿 FIELD FIND:</span> Photographed weathered Precursor bas-relief glyphs buried in the sediment (+${extraXp} bonus XP)!`;
                } else if (dRoll === 4) {
                    const bonusC = (250 + Math.floor(Math.random() * 300)) * (hasScavenger ? 2 : 1);
                    creditFind += bonusC;
                    lootItems.push({ id: 'PROHIBITED_STIMS', qty: 1 });
                    discoveryMsg = `<br><span style="color:#FF66AA">🛸 FIELD FIND:</span> Discovered a half-buried Eclipse smuggler skiff with an intact credit chit and stim canister!`;
                } else {
                    lootItems.push({ id: 'EMERGENCY_COOLANT_CELL', qty: 1 });
                    discoveryMsg = `<br><span style="color:#66DDFF">🧊 FIELD FIND:</span> Pulled an intact Cryo-Coolant Cartridge from a wrecked survey lander's reactor bay!`;
                }
            }

            // 5. Award Inventory & Credits
            const rewardSummary = [];
            if (creditFind > 0 && typeof playerCredits !== 'undefined') {
                playerCredits += creditFind;
                rewardSummary.push(`<span style="color:var(--gold-text)">+${formatNumber(creditFind)}c Salvage Cache</span>`);
            }

            lootItems.forEach(item => {
                if (typeof COMMODITIES !== 'undefined' && COMMODITIES[item.id]) {
                    const actualQty = _biomeSafeAddCargo(item.id, item.qty);
                    if (actualQty > 0) {
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
                logMessage(`<span style="color:#DDA0DD">[ SURFACE EXPEDITION ]</span> ${flavor} Recovered: ${rewardSummary.join(', ')}.${discoveryMsg}${hazardMsg}`);
            }
            if (typeof showToast === 'function') showToast("EXPEDITION COMPLETE", "success");

            _checkFullPlanetarySurveyBonus(planet, currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
            if (typeof renderPlanetView === 'function') renderPlanetView();
            if (typeof checkLevelUp === 'function') checkLevelUp();
            if (typeof autoSaveGame === 'function') autoSaveGame();
        };

        // 5. MACHINE WORLD CORE INTERFACE
        window.hackMachineWorld = function() {
            if (!currentSystemData || !currentSystemData.planets) return;
            const planet = currentSystemData.planets[selectedPlanetIndex];
            if (!planet) return;

            const saved = _getPlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
            if (planet.hackedThisVisit || saved.hacked) {
                planet.hackedThisVisit = true;
                if (typeof renderPlanetView === 'function') renderPlanetView();
                return;
            }

            planet.hackedThisVisit = true;
            _savePlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex, { hacked: true });

            if (typeof unlockLoreEntry === 'function') unlockLoreEntry('XENO_MACHINE_WORLD');
            if (typeof advanceGameTime === 'function') advanceGameTime(0.20);

            const hasSlicer = _biomeHasPerk('CYBER_SLICER') || (typeof hasCrewPerk === 'function' && hasCrewPerk('ASTROMETRICS'));
            const successChance = hasSlicer ? 0.90 : 0.60;

            if (Math.random() < successChance) {
                const credits = 1500 + Math.floor(Math.random() * 1500);
                const xp = 250;
                if (typeof playerCredits !== 'undefined') playerCredits += credits;
                if (typeof playerXP !== 'undefined') playerXP += xp;

                const dropId = Math.random() < 0.5 ? 'AI_CORE' : 'ENCRYPTED_DATA';
                const added = _biomeSafeAddCargo(dropId, 1);
                const lootMsg = (added > 0 && typeof COMMODITIES !== 'undefined' && COMMODITIES[dropId])
                    ? ` Extracted <span style="color:var(--gold-text)">1x ${COMMODITIES[dropId].name}</span>!`
                    : "";

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

            _checkFullPlanetarySurveyBonus(planet, currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
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

            const savedState = _getPlanetDelta(currentSystemData.x, currentSystemData.y, selectedPlanetIndex);

            if (savedState.mined) planet.minedThisVisit = true;
            if (savedState.scanned) planet.scannedThisVisit = true;
            if (savedState.explored) planet.exploredThisVisit = true;
            if (savedState.hacked) planet.hackedThisVisit = true;
            if (savedState.specialUsed) planet.specialUsedThisVisit = true;

            const bId = planet.biome.id || (_biomeByName.get(planet.biome.name) ? _biomeByName.get(planet.biome.name).id : 'BARREN_ROCK');

            // Unlock biome-specific lore on landing
            if (typeof unlockLoreEntry === 'function') {
                if (bId === 'MACHINE_WORLD') unlockLoreEntry('XENO_MACHINE_WORLD');
                else if (bId === 'IRRADIATED') unlockLoreEntry('PHENOMENON_IRRADIATED');
                else if (bId === 'TOMB_WORLD' || bId === 'ARCHIVE_WORLD') unlockLoreEntry('XENO_TOMB_WORLDS');
                else if (bId === 'MYCELIAL' || bId === 'TOXIC') unlockLoreEntry('LEGEND_SENTIENT_MYCELIUM_NETWORK');
                else if (bId === 'CRYSTAL') unlockLoreEntry('PHENOMENON_VOID_CRYSTALS');
            }

            const bioResources = (planet.biome.resources || []).filter(r => typeof BIOLOGICAL_RESOURCES !== 'undefined' && BIOLOGICAL_RESOURCES.has(r));
            const mineralResources = (planet.biome.resources || []).filter(r => typeof BIOLOGICAL_RESOURCES === 'undefined' || !BIOLOGICAL_RESOURCES.has(r));

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

            // --- DYNAMIC COLONY BUTTON LOGIC ---
            let colonyButtonHtml = '';
            const colId = `${currentSystemData.x}_${currentSystemData.y}_p${selectedPlanetIndex}`;
            const colonyHere = typeof playerColonies !== 'undefined' ? playerColonies[colId] : null;
            const isColonyHere = Boolean(colonyHere && colonyHere.established);
            const hasCharterInCargo = typeof playerCargo !== 'undefined' && (playerCargo['COLONY_CHARTER'] || 0) > 0;

            if (isColonyHere) {
                colonyButtonHtml = `
                    <button class="action-button" onclick="openColonyManagement('${_biomeEscapeJsArg(colId)}')" style="border-color: var(--success); color: var(--success); box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);">
                        🏢 MANAGE COLONY (${_biomeEscapeHtml(colonyHere.name.toUpperCase())})
                    </button>`;
            } else if (hasCharterInCargo) {
                if (planet.biome.landable) {
                    const safePlanetArg = _biomeEscapeJsArg(planet.name || 'Planet');
                    colonyButtonHtml = `
                        <button class="action-button" onclick="surveyForColony('${safePlanetArg}', '${_biomeEscapeJsArg(bId)}', ${currentSystemData.x}, ${currentSystemData.y})" style="border-color: var(--gold-text); color: var(--gold-text); box-shadow: 0 0 10px rgba(255,215,0,0.2);">
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

            // --- SPECIAL WORLD INTERACTIONS (ALL 21 LANDABLE BIOMES) ---
            let specialActionHtml = '';
            if (bId === 'MACHINE_WORLD') {
                const canHack = !planet.hackedThisVisit;
                specialActionHtml = `
                    <button class="action-button full-width-btn" onclick="hackMachineWorld()" style="border-color: #00E0E0; color: #00E0E0; box-shadow: 0 0 15px rgba(0,224,224,0.3);" ${!canHack ? 'disabled' : ''}>
                        ${canHack ? '💻 INTERFACE WITH CORE NETWORK' : '✓ CORE LOCKED OUT'}
                    </button>
                `;
            } else {
                const specMeta = _getSpecialBiomeActionMeta(bId);
                if (specMeta) {
                    const canSpecial = !planet.specialUsedThisVisit;
                    specialActionHtml = `
                        <button class="action-button full-width-btn" onclick="executeBiomeSpecialAction()" style="border-color: ${specMeta.color}; color: ${specMeta.color}; box-shadow: 0 0 15px ${specMeta.glow};" ${!canSpecial ? 'disabled' : ''}>
                            ${canSpecial ? specMeta.label : specMeta.done}
                        </button>
                    `;
                }
            }

            const hazardText = planet.biome.hazard && planet.biome.hazard !== 'NONE'
                ? `<span style="color:var(--danger); font-weight:bold;">⚠️ HAZARD: ${_biomeEscapeHtml(planet.biome.hazard)}</span>`
                : `<span style="color:var(--success);">ENVIRONMENT: STABLE</span>`;

            // Planetary Survey Progress Bar
            const surveyProg = _computePlanetSurveyProgress(planet, currentSystemData.x, currentSystemData.y, selectedPlanetIndex);
            const surveyPct = surveyProg.total > 0 ? Math.round((surveyProg.done / surveyProg.total) * 100) : 0;
            const surveyStripHtml = surveyProg.total > 0 ? `
                <div style="max-width:340px; margin:8px auto 10px auto;">
                    <div style="display:flex; justify-content:space-between; font-size:9px; letter-spacing:1.5px; color:${surveyProg.complete ? 'var(--gold-text)' : 'var(--item-desc-color)'}; margin-bottom:4px; font-weight:bold;">
                        <span>${surveyProg.complete ? '★ FULL PLANETARY SURVEY COMPLETE' : 'SURFACE SURVEY PROGRESS'}</span>
                        <span>${surveyProg.done} / ${surveyProg.total} (${surveyPct}%)</span>
                    </div>
                    <div style="height:4px; background:var(--surface-2); border-radius:2px; overflow:hidden;">
                        <div style="height:100%; width:${surveyPct}%; background:${surveyProg.complete ? 'var(--gold-text)' : 'var(--accent-color)'}; transition:width 0.3s;"></div>
                    </div>
                </div>
            ` : '';

            // Planetary Telemetry Strip
            const t = planet.biome.telemetry;
            const telemetryStripHtml = t ? `
                <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:10px 0 12px 0; font-size:10px;">
                    <span style="background:var(--surface-1); border:1px solid var(--border-color); padding:3px 8px; border-radius:3px; color:var(--text-color);">⚖️ ${_biomeEscapeHtml(t.gravity)}</span>
                    <span style="background:var(--surface-1); border:1px solid var(--border-color); padding:3px 8px; border-radius:3px; color:var(--text-color);">🌡️ ${_biomeEscapeHtml(t.tempRange)}</span>
                    <span style="background:var(--surface-1); border:1px solid var(--border-color); padding:3px 8px; border-radius:3px; color:var(--text-color);">💨 ${_biomeEscapeHtml(t.atmosphere)}</span>
                    <span style="background:var(--surface-1); border:1px solid ${BiomeUtils.getHabitabilityColor(t.habitability)}; padding:3px 8px; border-radius:3px; color:${BiomeUtils.getHabitabilityColor(t.habitability)}; font-weight:bold;">${_biomeEscapeHtml(t.habitability)}</span>
                </div>
            ` : '';

            // Resource Badges & Colony Trait Readout
            const resourcePillsHtml = (planet.biome.resources || []).map(rId => {
                const cDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[rId]) ? COMMODITIES[rId] : { name: rId, icon: '📦' };
                const isBio = typeof BIOLOGICAL_RESOURCES !== 'undefined' && BIOLOGICAL_RESOURCES.has(rId);
                const pillColor = isBio ? 'var(--success)' : 'var(--gold-text)';
                return `<span style="display:inline-block; font-size:10px; color:${pillColor}; border:1px solid ${pillColor}; background:var(--surface-1); padding:2px 8px; border-radius:12px; margin:2px 4px;">${cDef.icon || ''} ${_biomeEscapeHtml(cDef.name)}</span>`;
            }).join('');

            const colonyTraitHtml = planet.biome.colonyBonusDesc
                ? `<div style="font-size:11px; color:var(--item-desc-color); margin-top:8px;">Colony Trait: <span style="color:var(--text-color); font-weight:bold;">${_biomeEscapeHtml(planet.biome.colonyBonusDesc)}</span></div>`
                : '';

            const fieldNoteHtml = planet.biome.fieldNote
                ? `<div style="font-size:11px; color:var(--item-desc-color); font-style:italic; margin-top:8px; padding-top:8px; border-top:1px dashed var(--border-color); max-width:520px; margin-left:auto; margin-right:auto; line-height:1.45;">"${_biomeEscapeHtml(planet.biome.fieldNote)}"</div>`
                : '';

            let html = `
                <div class="planet-view-content">
                    
                    <div class="planet-header">
                        <img src="${planet.biome.image}" alt="${_biomeEscapeHtml(planet.biome.name)}" class="planet-large-img" onerror="this.onerror=null; this.src='assets/barren_rock.png';">
                        <h2 class="planet-title">${_biomeEscapeHtml(currentSystemData.name.toUpperCase())} : ${_biomeEscapeHtml(planet.name.toUpperCase())}</h2>
                        <div style="font-size:11px; letter-spacing:2px; margin-bottom:6px; color:var(--accent-color);">
                            CLASS: ${_biomeEscapeHtml(planet.biome.name.toUpperCase())} &nbsp;|&nbsp; ${hazardText}
                        </div>
                        ${surveyStripHtml}
                        ${telemetryStripHtml}
                        <p class="planet-desc">"${_biomeEscapeHtml(planet.biome.description)}"</p>
                        <div style="margin-top:12px;">
                            ${resourcePillsHtml}
                        </div>
                        ${colonyTraitHtml}
                        ${fieldNoteHtml}
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
