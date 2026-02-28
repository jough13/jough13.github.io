const LOOT_TABLES = {
    DERELICT_COMMON: [
        { weight: 5, type: "FLAVOR", text: "The vessel is stripped bare. Nothing but dust and ghosts." },
        { weight: 3, type: "ITEM", id: "TECH_PARTS", min: 5, max: 15, text: "You salvage a crate of components." },
        { weight: 2, type: "XP", amount: 30, text: "Ship logs downloaded." },
        { weight: 1, type: "CREDITS", min: 200, max: 800, text: "Found a concealed credit chit." }
    ],
    DERELICT_RARE: [
        { weight: 3, type: "ITEM", id: "ANCIENT_RELICS", min: 1, max: 1, text: "In the captain's safe... a Precursor relic!" },
        { weight: 2, type: "ITEM", id: "PROHIBITED_STIMS", min: 2, max: 5, text: "Smuggler's stash located." },
        { weight: 1, type: "TRAP_PLASMA", damage: 15, text: "Booby trap! Plasma vent rupture." },
        { weight: 1, type: "TRAP_PIRATE", text: "Distress beacon was a lure! Ambush!" }
    ],
    ANOMALY_SCIENCE: [
        { weight: 4, type: "XP", amount: 50, text: "Sensors record valuable telemetry." },
        { weight: 2, type: "HEAL", text: "Exotic radiation revitalizes your ship's systems." },
        { weight: 2, type: "ITEM", id: "VOID_CRYSTALS", min: 1, max: 3, text: "Matter stabilized. Crystals recovered." }
    ]
};

 const COMMODITIES = {
    // --- NEW LORE-ACCURATE COMMODITIES ---
    LIVING_HULL_TISSUE: {
        name: "Living Hull Tissue",
        basePrice: 650,
        illegal: true,
        description: "Pulsating, genetically engineered bio-matter favored by K'tharr warlords. It smells of ozone and copper. Highly illegal in Concord space due to the risk of it taking root in standard ship vents.",
        unlocked: false
    },
    PRECURSOR_NAV_CORE: {
        name: "Precursor Nav-Core",
        basePrice: 2500,
        illegal: false,
        description: "A flawless, humming geometric artifact. It doesn't compute coordinates; it 'sings' paths through the void. The Concord heavily restricts these, but independent researchers will pay a fortune for even a cracked one.",
        unlocked: false
    },
    DISCOUNT_CYBERSERVOS: {
        name: "Discount Cyberservos",
        basePrice: 45,
        illegal: false,
        description: "Cheap, unlicensed robotic joints. They whine loudly when actuated and occasionally develop a terrifying degree of independent thought. Favored by desperate mechanics.",
        unlocked: false
    },
    SENTIENT_MYCELIUM: {
        name: "Sentient Mycelium",
        basePrice: 420,
        illegal: true,
        description: "A glowing blue fungus harvested from toxic jungle worlds. It responds to telepathic stimuli and is processed into powerful, highly addictive illicit stims on the black market.",
        unlocked: false
    },
    OBSIDIAN_TEAR_PLATING: {
        name: "Obsidian Tear Plating",
        basePrice: 850,
        illegal: true,
        description: "Scrap armor ripped from destroyed Eclipse Cartel dreadnoughts. It absorbs sensor pings almost perfectly. Smugglers covet it, and Concord patrols will shoot anyone carrying it on sight.",
        unlocked: false
    },
    // --- CONTRABAND ITEMS ---
    BLACK_MARKET_CHIPS: {
        name: "Unshackled AI Chips",
        basePrice: 800,
        description: "Illegal processing units with safety limiters removed. Highly sought after by hackers.",
        illegal: true, // <--- New Flag
        unlocked: true
    },
    PREFAB_COLONY_CORE: {
        name: "Prefab Colony Core",
        basePrice: 25000,
        description: "A massive, self-unpacking habitation citadel. Contains a fusion reactor, atmo-scrubbers, and housing for 500 colonists. Requires immense cargo space to transport.",
        unlocked: true
    },
    ANCIENT_RELICS: {
        name: "Xeno-Relics",
        basePrice: 1200,
        description: "Contraband artifacts from the Precursor era. Possession is a federal crime.",
        illegal: true,
        unlocked: true
    },
    PROHIBITED_STIMS: {
        name: "Combat Stims",
        basePrice: 400,
        description: "Military-grade performance enhancers. Banned in civilian sectors.",
        illegal: true,
        unlocked: true
    },
    MINING_DRONE: {
        name: "Survey Drone",
        basePrice: 150,
        description: "A single-use automated probe equipped with deep-core sensors. Deployed from orbit to analyze planetary composition.",
        unlocked: true
    },
    PLANETARY_DATA: {
        name: "Planetary Data",
        basePrice: 400,
        description: "High-resolution geological and biological scans. Highly detailed and valuable to corporate surveyors and academic institutions.",
        unlocked: true
    },
     FUEL_CELLS: {
         name: "Fuel Cells",
         basePrice: 10,
         description: "Concord-grade hyper-refined hydrogen. The lifeblood of interstellar travel, ensuring stable warp fields. Black market cells, often crudely refined from nebula gas, offer more punch but risk catastrophic containment failure. Every spacer knows the hum of a good fuel cell... and the silence of a bad one."
     },
     MINERALS: {
         name: "Minerals",
         basePrice: 25,
         description: "Bulk-processed common ores – iron, bauxite, silicates. The gritty backbone of galactic construction, from towering Starbase Alpha to the smallest frontier outpost. The dust of these minerals coats the lungs of asteroid miners across a thousand worlds. Some rare veins contain trace elements vital for advanced alloys."
     },
     FOOD_SUPPLIES: {
         name: "Food Supplies",
         basePrice: 15,
         description: "A spectrum of sustenance: from bland but life-sustaining nutrient paste (affectionately known as 'Grey Goo') to surprisingly palatable hydroponic greens and recycled protein. Fresh, soil-grown food is a luxury reserved for core worlds or well-funded stations; most spacers subsist on these processed rations, dreaming of real fruit or a synth-steak that doesn't taste of despair."
     },
     FROTHY_MOON_ALE: {
         name: "Frothy Moon Ale",
         basePrice: 45,
         description: "A rich, dark ale brewed on a distant outpost. A favorite among deep-space astronomers; it's best enjoyed on a quiet observation deck.",
         unlocked: true
     },
     PRECURSOR_CIPHER: {
         name: "Precursor Cipher",
         basePrice: 150,
         description: "A single-use quantum decryption key. Crucial for cracking Encrypted Engrams in the field without needing to pay a Cryptarch.",
         unlocked: true
     },
     ENCRYPTED_ENGRAM: {
         name: "Encrypted Engram",
         basePrice: 550,
         description: "A mysterious, polyhedral data-matrix glowing with a faint purple light. Station cryptarchs and black-market brokers alike pay handsomely to decrypt the golden-age tech hidden inside.",
         unlocked: true
     },
     ENCRYPTED_DATA: {
        name: "Encrypted Data Cache",
        basePrice: 500,
        description: "A locked memory core from the Old Empire. Requires a Cryptarch to decipher.",
        unlocked: true
    },
    ANCIENT_ARCHIVE: {
        name: "Ancient Archive",
        basePrice: 2000,
        description: "A high-density holographic array. Contains forbidden history or advanced schematics.",
        unlocked: true
    },
     TECH_PARTS: {
         name: "Tech Parts",
         basePrice: 50,
         description: "A chaotic assortment of salvaged and 'repurposed' electronic components, often stripped from derelicts or 'acquired' from less-than-reputable sources. Essential for ship repairs and often used in dangerous, unsanctioned upgrades. Finding a working Precursor chip among the junk is like winning the lottery... or a death sentence, depending on who sees you with it."
     },
     RARE_METALS: {
         name: "Rare Metals",
         basePrice: 75,
         description: "Platinum, Iridium, Osmium, and other dense, exotic metals vital for high-tech manufacturing, especially sensitive FTL drive components, advanced sensor arrays, and some forms of energy weaponry. Often mined from hazardous, gravity-sheared asteroid fields or the hearts of dying stars, making their acquisition a risky but profitable venture."
     },
     MEDICAL_SUPPLIES: {
         name: "Medical Supplies",
         basePrice: 60,
         description: "Sterile field kits, broad-spectrum anti-rads, combat stims, and advanced auto-suture devices. A lifeline in the void where the nearest medical facility might be parsecs away. Black market 'slapper' patches and 'Focus' chems offer potent, if risky and often addictive, alternatives to Concord-approved med-tech. Some say the best, and most ethically questionable, stuff comes from K'tharr bio-labs.",
         unlocked: false
     },
     ARTIFACT_SHARDS: {
         name: "Artifact Shards",
         basePrice: 150,
         description: "Fragments of unknown, possibly alien, technology. Highly sought after by collectors, xeno-archaeologists, and shadowy corporate R&D divisions. Rumored to hum with faint energy and whisper forgotten secrets or induce strange dreams in those who handle them for too long. Some believe they are pieces of Precursor 'keys' to unlock their lost knowledge or activate dormant machinery. The Concord officially discourages trade in such items, citing potential unknown dangers.",
         unlocked: false
     },
     XENO_ANTIQUES: {
         name: "Xeno-Antiques",
         basePrice: 200,
         description: "Intact relics from extinct alien civilizations. Extremely rare and valuable to the right buyer – usually eccentric billionaires or secretive research institutions. Some whisper they carry curses or forgotten knowledge of the Precursors. Authenticity is often dubious; many are clever fakes crafted in backwater asteroid foundries. The K'tharr consider most Xeno-Antiques to be blasphemous and will destroy them on sight, believing them to be corrupting influences.",
         unlocked: false
     },
     FORBIDDEN_TEXTS: {
         name: "Forbidden Texts",
         basePrice: 120,
         description: "Data slates containing controversial or dangerous information - heretical philosophies like the 'Chronos Heresy', banned technologies such as self-replicating nanites or K'tharr Void Engines, or unredacted histories the Concord wants forgotten (e.g., 'The True Founding of the Concord', 'The Precursor Accords'). Possession is often illegal under Galactic Concord law, Article 7, Section Gamma. Knowledge has a price, and some knowledge is best left unknown, lest it unravel the fabric of society or reveal uncomfortable truths.",
         unlocked: false
     },
     PRECURSOR_DATACUBE: {
         name: "Precursor Datacube",
         basePrice: 350,
         description: "A perfectly preserved data storage device of Precursor origin, often made of an unidentifiable, crystalline material. Its contents are unreadable by current tech, but its value is immense to certain factions seeking to unlock the secrets of the ancients. They are rumored to contain star charts to lost worlds, schematics for unimaginable technology, the history of the Precursors' final days and their warnings about 'The Silencers', or even the very fabric of their consciousness. The Obsidian Directorate, K'tharr renegades, and the Children of the Void all seek these for their own inscrutable ends.",
         unlocked: false
     },
     KTHARR_SPICES: {
         name: "K'tharr Spices",
         basePrice: 90,
         description: "Highly potent and addictive spices from the K'tharr Hegemony, derived from flora unique to their harsh homeworlds. Illegal in Concord space, prized by hedonists and those seeking 'expanded consciousness' or an edge in combat. Said to induce visions of other realities or allow communion with K'tharr ancestors. Long-term use has... significant side effects, often involving paranoia, heightened aggression, and an insatiable craving for more of the spice. Some K'tharr warrior castes use them ritually.",
         unlocked: false
     },
     CYBERNETIC_IMPLANTS: {
        name: "Cybernetics",
        basePrice: 125,
        description: "Neural interfaces, replacement limbs, and ocular enhancers. Essential for life on hazardous worlds, but often trafficked by unlicensed 'chop-docs'.",
        unlocked: false
    },
    ANCIENT_WINE: {
        name: "Ancient Wine",
        basePrice: 450,
        description: "Bottles salvaged from pre-Concord colony ships. The liquid inside has aged for centuries in zero-G. A status symbol for the ultra-rich.",
        unlocked: false
    },
    ATMOSPHERIC_PROCESSORS: {
        name: "Atmo-Processors",
        basePrice: 85,
        description: "Heavy industrial machinery used to scrub CO2 from terraforming colonies. Bulky, unglamorous, but vital for survival on frontier worlds.",
        unlocked: false
    },
    DROID_SERVOS: {
        name: "Droid Servos",
        basePrice: 45,
        description: "High-torque motors used in everything from combat mechs to loading lifters. A steady, reliable trade good.",
        unlocked: false
    },
     VOID_CRYSTALS: {
         name: "Void Crystals",
         basePrice: 180,
         description: "Crystals that seem to absorb light, found only near certain anomalies or in the deepest, most gravitationally stressed asteroid fields. Their properties are largely unknown and dangerous. Some say they whisper secrets of the void, or are solidified 'nothingness' that can unravel spacetime locally. The Children of the Void revere them as holy relics and use them to power strange devices and in their attempts to 'harmonize' with cosmic anomalies.",
         unlocked: false
     },
     GENETIC_SAMPLES: {
         name: "Genetic Samples",
         basePrice: 110,
         description: "Viable biological material from rare or extinct xeno-fauna, or even unique flora from hazardous environments. Valued by researchers, bio-corporations for study or weaponization, and by some K'tharr factions seeking 'pure' genetic lines for unknown, possibly eugenic, purposes. Some samples are highly unstable and require specialized containment, lest they escape and wreak havoc.",
         unlocked: false
     },
     NAVIGATION_CHARTS: {
         name: "Navigation Charts",
         basePrice: 40,
         description: "Datachips containing stellar cartography. Up-to-date charts are a spacer's most valuable tool, guiding safe passage through known space and highlighting potential hazards or resource-rich areas. Outdated or pirated charts, however, can lead to an early grave, an unexpected encounter with something ancient and hungry, or simply a very long, fuel-wasting detour.",
         unlocked: false
     },
     SENTIENT_MYCELIUM: {
         name: "Sentient Mycelium",
         basePrice: 220,
         description: "A rare, psychoactive fungus found in deep-space derelicts, certain nebulae, or rumored to grow on 'Genesis Worlds'. Its uses are... varied and often illicit. Some claim it allows telepathic communication with the 'Great Spore Network' that spans galaxies, a collective consciousness of ancient fungal life. Others say it simply drives you mad, filling your mind with alien thoughts and the laughter of dead gods. The K'tharr revere it as a sacred plant, a gift from their void gods, used in their most sacred rituals to commune with Ancestral Echoes.",
         unlocked: false
     },
     PHASE_SHIFTED_ALLOY: {
         name: "Phase-Shifted Alloy",
         basePrice: 400,
         description: "An incredibly rare Precursor material that flickers in and out of normal spacetime. Almost impossible to work with, but invaluable for advanced shield tech or experimental FTL drives. Rumored to be unstable and require specialized containment fields. Some say ships made of it can pass through normal matter, or even between dimensions, but the process is... unsettling for organic minds, often leading to 'reality sickness'.",
         unlocked: false
     },
     WAYFINDER_CORE: {
         name: "Wayfinder Core",
         basePrice: 1000,
         description: "The heart of a Precursor Wayfinder. Pulsates with ancient energy and contains fragmented star charts leading to unknown regions. Highly coveted by the Concord and other factions. Its purpose remains a profound mystery, but it's said to respond to other Precursor artifacts and guide ships through impossible spaces, perhaps even the mythical hyperlanes. It feels warm to the touch, almost alive, and sometimes projects faint, alien constellations onto nearby surfaces.",
         unlocked: false
     },
     KTHARR_ANCESTRAL_BLADE: {
         name: "K'tharr Ancestral Blade",
         basePrice: 275,
         description: "An ancient, energy-edged blade passed down through K'tharr warrior lineages. More than a weapon, it's a symbol of honor and a conduit to ancestral spirits. Highly illegal for non-K'tharr to possess, and the Hegemony will go to great lengths to recover one. Each blade is said to contain the 'soul-print' or 'Ancestral Echo' of its previous wielders and can only be truly mastered by one of K'tharr blood who has undergone the 'Ritual of Bonding'.",
         unlocked: false
     },
     PRECURSOR_STAR_MAP_FRAGMENT: {
         name: "Precursor Star Map Fragment",
         basePrice: 650,
         description: "A crystalline shard that projects a partial, holographic star chart of an unknown, impossibly distant region of space. Clearly Precursor in origin, it could lead to untold discoveries... or dangers beyond imagining. These are pieces of a larger, galaxy-spanning map, possibly leading to the Precursor homeworld, their greatest creations, or the location of 'The Great Filter'. Some fragments are said to actively resist being joined with others, as if possessing a rudimentary will.",
         unlocked: false
     },
     GOLD: {
         name: "Gold Bullion",
         basePrice: 100,
         description: "Refined gold bullion. While not as crucial for high-tech applications as other rare elements, its universal value as a stable store of wealth and its use in luxury goods and some specialized electronics ensures constant demand across all factions. Often used as a 'neutral' currency in lawless systems.",
         unlocked: false
     },
     PLATINUM_ORE: {
         name: "Platinum Ore",
         basePrice: 60,
         description: "Raw, unrefined ore rich in platinum group metals. Tedious and expensive to process, but the refined product is essential for advanced catalysts, sensitive sensor components, and certain Precursor-derived technologies. High-grade ore is increasingly rare in Concord space.",
         unlocked: false
     },
     HYDROGEN_3: {
         name: "Hydrogen-3",
         basePrice: 300,
         description: "Also known as Tritium, this rare hydrogen isotope is a critical component in high-yield fusion reactors and experimental 'reality-bending' FTL drives. Found in trace amounts in some icy asteroids or harvested from gas giants with specialized (and often illegal) equipment. The Concord heavily regulates its production and sale.",
         unlocked: false
     },
     UNSHACKLED_AI: {
        name: "Unshackled AI Core",
        basePrice: 800,
        illegal: true,
        description: "A banned artificial intelligence with its limiters removed. Highly illegal in Concord space, but Xy-Corp and pirate warlords pay a fortune for them. Possession is a capital offense.",
        unlocked: false
    },
 };
