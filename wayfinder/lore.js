
 // --- Lore Database ---
 const LORE_DATABASE = {
    // --- SHIP ENTRIES ---
    LORE_SHIP_LIGHT_FREIGHTER: {
        title: "Light Freighter Class",
        category: "Starships",
        text: "The backbone of galactic logistics, the Light Freighter is the most common vessel in Concord space. Versatile, modular, and easy to repair, it is favored by independent captains and small courier firms. While it lacks the firepower of military craft or the massive holds of corporate haulers, its reliability is legendary. Many captains claim a well-tuned freighter can hold together on duct tape and prayers alone.",
        unlocked: false
    },
    LORE_SHIP_COURIER: {
        title: "Courier Class",
        category: "Starships",
        text: "A significant step up from the ubiquitous Light Freighter, the Courier-class vessel is built for professionals who value time over raw tonnage. With upgraded engines and a reinforced chassis, it strikes a perfect balance between speed, durability, and cargo capacity. It is the preferred ship for independent contractors moving high-value, time-sensitive goods through dangerous sectors where a slow freighter would be an easy target.",
        unlocked: false
    },
    LORE_SHIP_INTERCEPTOR: {
        title: "Interceptor Class",
        category: "Starships",
        text: "A stripped-down chassis built around an oversized engine and reactor core. Interceptors are designed for one thing: speed. Favored by bounty hunters and pirates for their ability to run down prey (or escape Concord patrols), they sacrifice armor and cargo space for agility. Pilots of these vessels often have short lifespans, as a single hull breach is usually fatal.",
        unlocked: false
    },
    LORE_SHIP_EXPLORER: {
        title: "Explorer Class",
        category: "Starships",
        text: "Designed for long-duration voyages into the unknown, Explorer-class vessels feature advanced life-support recycling, extended fuel tanks, and high-gain sensor arrays. They are often used by survey teams mapping the Silentium Expanse or xeno-archaeologists searching for Precursor ruins. They are not built for combat, relying instead on seeing the enemy first and running away.",
        unlocked: false
    },
    LORE_SHIP_VOID_SKIFF: {
        title: "Void-Skiff",
        category: "Starships",
        text: "Less a ship and more a cockpit strapped to a thruster bank, Void-Skiffs are the cheapest FTL-capable craft available. Often cobbled together from salvage, they are notoriously unsafe, lacking redundant shielding or ejection systems. They are popular among the desperate, the reckless, and 'zoom-racers' who fly dangerous courses through asteroid belts for sport.",
        unlocked: false
    },
    LORE_SHIP_ROCK_HOPPER: {
        title: "Rock-Hopper",
        category: "Starships",
        text: "An industrial mining barge, the Rock-Hopper is built like a flying brick. Heavily armored to withstand asteroid impacts and equipped with high-yield mining lasers, it is slow and ungraceful. However, its hull is thick enough to shrug off light pirate fire, and its cargo hold is cavernous for a ship of its size. K'tharr mining castes use a variant of this frame plated in ceremonial armor.",
        unlocked: false
    },
    LORE_SHIP_STAR_GALLEON: {
        title: "Star-Galleon",
        category: "Starships",
        text: "The ultimate status symbol, Star-Galleons are massive, opulent vessels used by corporate executives, high-ranking diplomats, and successful warlords. They boast military-grade shielding and point-defense systems, allowing their passengers to travel in safety and luxury. The interiors are often finished with real wood and synthetic marble, costing more than the hull itself.",
        unlocked: false
    },
    LORE_SHIP_HEAVY_HAULER: {
        title: "Heavy Hauler",
        category: "Starships",
        text: "The 'Big Rigs' of the void. Heavy Haulers are massive, sluggish vessels designed to move immense quantities of raw materials between stellar hubs. They require a large crew to operate and are sitting ducks without escort fighters. Pirate clans love to ambush them, as a single captured Heavy Hauler can sustain a pirate base for months.",
        unlocked: false
    },

    // --- NEW COMPONENT ENTRIES ---
    LORE_COMP_PULSE_LASER: {
        title: "Pulse Laser Technology",
        category: "Ship Components",
        text: "The standard armament for civilian and paramilitary vessels. Pulse lasers fire discrete packets of coherent light plasma. While they lack the shield-stripping power of ion weapons or the hull-shredding impact of mass drivers, they are energy-efficient, reliable, and effective against a balanced mix of targets.",
        unlocked: false
    },
    LORE_COMP_KINETIC_WEAPON: {
        title: "Kinetic Weaponry",
        category: "Ship Components",
        text: "Simple, brutal, and effective. Kinetic weapons accelerate solid slugs using chemical propellants or magnetic rails. They ignore the energy resistance of shields to deliver pure impact trauma. However, they require ammunition storage and are less accurate at extreme ranges due to projectile travel time.",
        unlocked: false
    },
    LORE_COMP_ION_WEAPON: {
        title: "Ion Weaponry",
        category: "Ship Components",
        text: "Ion cannons fire streams of highly charged particles designed to overload electromagnetic shields and fuse ship circuitry. They cause minimal physical damage to armor, making them the weapon of choice for pirates looking to disable a ship without destroying the valuable cargo inside.",
        unlocked: false
    },
    LORE_COMP_BEAM_LASER: {
        title: "Beam Laser Technology",
        category: "Ship Components",
        text: "Unlike pulse lasers, beam weapons project a continuous stream of thermal energy. They are incredibly accurate, hitting instantly at the speed of light, making them perfect for targeting fast-moving interceptors. The downside is the immense heat buildup, requiring heavy heatsinks that limit sustained fire.",
        unlocked: false
    },
    LORE_COMP_MASS_DRIVER: {
        title: "Mass Driver Tech",
        category: "Ship Components",
        text: "A scaled-up magnetic accelerator that fires heavy ferric slugs. Mass Drivers deliver devastating kinetic energy, capable of cracking heavy armor and shattering internal bulkheads. Their slow fire rate and high power draw make them risky to use, but a single solid hit can end a dogfight.",
        unlocked: false
    },
    LORE_COMP_MISSILE_LAUNCHER: {
        title: "Guided Missile Tech",
        category: "Ship Components",
        text: "Self-propelled ordnance with tracking sensors. Missiles deliver the highest damage payload of any ship-mounted weapon, but are limited by ammunition capacity and the target's point-defense systems. Countermeasures like flares and chaff are standard issue to combat these threats.",
        unlocked: false
    },
    LORE_COMP_SHIELD_GENERATOR: {
        title: "Deflector Shields",
        category: "Ship Components",
        text: "Shield generators project a localized gravimetric field around a vessel, absorbing or deflecting incoming energy and debris. The technology is a scaled-down version of the planetary defense grids used during the Terran Wars. Better generators offer faster recharge rates or higher absorption thresholds.",
        unlocked: false
    },
    LORE_COMP_ENGINE: {
        title: "Sublight Drives",
        category: "Ship Components",
        text: "While FTL drives fold space, sublight engines move the ship through it. Most modern drives use ion-fusion hybrids to generate thrust. Efficiency is key; a fuel-hungry engine can leave a captain stranded in deep space. Precursor drives theoretically utilized gravitic propulsion, eliminating the need for reaction mass entirely.",
        unlocked: false
    },
    LORE_COMP_SCANNER: {
        title: "Sensor Arrays",
        category: "Ship Components",
        text: "A ship's eyes in the dark. Sensor suites combine LIDAR, gravimetric, and subspace passive listening devices. High-grade scanners can detect the mineral composition of a planet from orbit, spot the heat signature of a cloaked ship, or analyze the esoteric radiation of a cosmic anomaly.",
        unlocked: false
    },
     FACTION_CONCORD: {
         title: "Galactic Concord",
         category: "Factions",
         text: "The dominant interstellar government, the Galactic Concord projects an image of peace, prosperity, and order. Formed from the ashes of the Terran Wars, it oversees trade, diplomacy, and law across thousands of systems. However, beneath the polished veneer lies a sprawling bureaucracy and the shadowy operations of the Obsidian Directorate, its clandestine intelligence and black-ops division. The Directorate answers only to the highest echelons of the High Council and is tasked with neutralizing threats to Concord stability by any means necessary—often operating outside the very laws the Concord purports to uphold. They are particularly interested in controlling the flow of Precursor technology, suppressing 'dangerous' knowledge, and eliminating existential threats before the public is even aware of them.",
         unlocked: false
     },
     FACTION_KTHARR: {
         title: "K'tharr Hegemony",
         category: "Factions",
         text: "A proud, martial saurian species governed by a strict honor-based caste system. The K'tharr are deeply spiritual, viewing the cosmos as a pantheon of 'Sky-Gods' and the void between them as a sacred, living entity. They consider Precursor technology to be the ultimate heresy, a corrupting influence that led to the downfall of the ancients, and a threat to cosmic balance. K'tharr warriors, bound by the rigid codes of their clan, seek glory in battle and live to serve the Hegemony. Their 'Void Priests' guide their civilization, interpreting cosmic signs and guarding against blasphemous tech. To possess a K'tharr Ancestral Blade is the highest honor, as it is believed to hold the spirits of all its previous wielders.",
         unlocked: false
     },
     FACTION_PIRATES_VOID_VULTURES: {
         title: "Void Vultures",
         category: "Factions",
         text: "A catch-all term for the myriad lawless clans, freebooters, and renegades who haunt the fringes of civilized space. The Void Vultures are one of the most infamous confederations, known for their audacious raids and distinctive ship markings. They are not a unified government but a loose alliance of captains, each with their own ambitions. Their bases are hidden in uncharted nebulae and dense asteroid fields, from which they launch hit-and-run attacks on vulnerable shipping lanes. While most are driven by profit, some, like the notorious Captain Voidfang, seem to have grander, more mysterious goals.",
         unlocked: false
     },
     FACTION_CHILDREN_OF_THE_VOID: {
         title: "Children of the Void",
         category: "Factions",
         text: "A cryptic cult that sees divinity in cosmic anomalies, black holes, and the endless vacuum of space itself. They believe these phenomena are not just physical occurrences, but the thoughts of a sleeping cosmic consciousness. Members of the cult seek to 'harmonize' with the void, often through dangerous rituals involving Void Crystals and exposure to anomalies. Their ultimate goal is apotheosis—to shed their physical forms and merge with the cosmic mind. They can be unpredictable allies or terrifying foes, often protecting anomalies they deem 'sacred' from interference by corporations or the Concord.",
         unlocked: false
     },
     FACTION_XYCORP: {
         title: "Xy-Corp",
         category: "Factions",
         text: "A hyper-capitalist corporate entity with its own private military. Xy-Corp's official motto is 'Progress Through Profit,' but their unofficial creed is 'Acquire and Control.' They are a major player in resource extraction, technology development, and shipping. Xy-Corp is notoriously aggressive in its pursuit of new resources and technologies, often clashing with the K'tharr over mineral rights and with the Concord over their ethically dubious research into Precursor artifacts. Their R&D division is rumored to be light-years ahead of the competition, and they will stop at nothing to maintain their technological edge.",
         unlocked: false
     },
     LOCATION_STARBASE_ALPHA: {
         title: "Starbase Alpha",
         category: "Locations",
         text: LOCATIONS_DATA["Starbase Alpha"].scanFlavor,
         unlocked: false
     },
     LOCATION_PLANET_OMEGA: {
         title: "Planet Omega",
         category: "Locations",
         text: LOCATIONS_DATA["Planet Omega"].scanFlavor,
         unlocked: false
     },
     LOCATION_PLANET_XERXES: {
         title: "Planet Xerxes",
         category: "Locations",
         text: LOCATIONS_DATA["Planet Xerxes"].scanFlavor,
         unlocked: false
     },
     LOCATION_OUTPOST: {
         title: "Outposts",
         category: "Locations",
         text: "Scattered throughout the void, outposts are small, often independent stations that serve as vital resupply points, trading posts, or havens for those on the fringes of society. Their markets are limited, but they often have unique local rumors and a character all their own. Some are havens for smugglers and pirates, others are lonely research stations or struggling colonies.",
         unlocked: false
     },
     PHENOMENON_STAR: {
         title: "Stars",
         category: "Phenomena",
         text: "Suns are the hearts of stellar systems, providing light, heat, and the raw hydrogen fuel essential for FTL travel. They come in many types, from stable G-type stars like Sol to volatile blue giants and dying red dwarfs. Some, like pulsars or neutron stars, are extreme cosmic objects with unique properties and dangers. Ancient civilizations often worshipped their stars, and some Precursor structures seem designed to harness stellar energy directly.",
         unlocked: false
     },
     PHENOMENON_ASTEROID: {
         title: "Asteroid Fields",
         category: "Phenomena",
         text: "Belts of rock, ice, and metal, often remnants of planetary formation or shattered celestial bodies. They can be rich in minerals but are also hazardous to navigate and popular hiding spots for pirates. Some fields contain unique crystalline structures or are known to be ancient battlefields, littered with the debris of forgotten wars.",
         unlocked: false
     },
     PHENOMENON_NEBULA: {
         title: "Nebulae",
         category: "Phenomena",
         text: "Vast clouds of interstellar gas and dust. Emission nebulae glow brightly from ionized gas, reflection nebulae shine with light from nearby stars, and dark nebulae obscure what lies within. They can interfere with sensors and hide many secrets, from stellar nurseries to pirate bases, and even pockets of unique lifeforms or strange, psychoactive gases like those that form Sentient Mycelium.",
         unlocked: false
     },
     PHENOMENON_WORMHOLE: {
         title: "Wormholes",
         category: "Phenomena",
         text: "Unstable tears in spacetime that can connect distant points in the galaxy, or perhaps even other realities. Traversing them is dangerous and consumes significant fuel, with unpredictable exit points. Precursor texts hint at a network of stable 'Conduits' they used for rapid transit across their empire, but none have ever been found by modern civilizations. The Concord officially denies their existence, classifying any verified sightings as 'localized gravimetric shear events'.",
         unlocked: false
     },
     PHENOMENON_VOID_CRYSTALS: {
         title: "Void Crystals",
         category: "Technology & Phenomena",
         text: COMMODITIES.VOID_CRYSTALS.description + " These strange formations are often found near intense gravitational anomalies or within the hearts of particularly dense dark nebulae. They defy easy analysis, absorbing most sensor scans. Some theorize they are a form of exotic matter, or even biological in origin, perhaps the dormant state of some void-dwelling lifeform. Their value lies in their rarity and the esoteric research being conducted by fringe science groups and cults like the Children of the Void.",
         unlocked: false
     },
     XENO_PRECURSORS: {
         title: "The Precursors",
         category: "Xeno-Archaeology",
         text: "An ancient, highly advanced civilization that vanished eons ago, leaving behind enigmatic ruins, powerful artifacts, and unanswered questions across the galaxy. Their technology far surpassed current understanding, and factions like the Concord and various collectors desperately seek their relics. Why they disappeared is one of the greatest mysteries; theories range from self-ascension to a higher plane of existence, a catastrophic war against an unknown enemy (often dubbed 'The Silencers'), a self-inflicted technological cataclysm, or even a voluntary departure from this dimension to escape a greater threat. Some Precursor data fragments hint that the 'Silencers' are not a species, but a cosmic principle—a recurring, galaxy-wide extinction event, a 'Great Filter' that they ultimately failed to overcome.",
         unlocked: false
     },
     XENO_DERELICTS: {
         title: "Derelict Ships",
         category: "Xeno-Archaeology",
         text: "The galaxy is littered with the silent hulks of lost ships. Some are recent casualties of pirates or accidents, their emergency beacons long dead. Others are ancient mysteries from forgotten eras or unknown civilizations, their hulls scarred by weapons beyond current comprehension or simply worn down by eons adrift. Exploring them can be profitable, yielding salvage or lost cargo, but also dangerous, as some may still have active (and often hostile) automated defenses, dormant alien lifeforms, or be booby-trapped by their former owners or later scavengers.",
         unlocked: false
     },
     XENO_ANOMALIES: {
         title: "Cosmic Anomalies",
         category: "Xeno-Archaeology",
         text: "Regions of space where the laws of physics seem to break down or behave erratically. These can range from gravimetric distortions that crush hulls, temporal loops that replay moments in time, subspace echoes that whisper maddening secrets, to exotic particle clouds that interfere with ship systems or even induce mutations in organic matter. They are often dangerous but can sometimes yield unique data or rare materials like Void Crystals. Some are believed to be Precursor experiments gone awry, natural phenomena beyond current comprehension, or even the battle scars left by cosmic entities.",
         unlocked: false
     },

     TECH_FTL_DRIVES: {
         title: "FTL Drives",
         category: "Technology & Phenomena",
         text: "Faster-Than-Light travel is the backbone of interstellar civilization. Most common drives, like the standard Alcubierre-Ishikawa Warp Drive, utilize controlled warp field manipulation to contract spacetime ahead of the vessel and expand it behind, requiring Dilithium crystals as a focusing agent and energy conduit. Older, less stable 'jump drive' technology exists but is highly unpredictable and prone to misjumps into uncharted (and often hostile) territory. Rumors persist of Precursor 'hyperlane' networks that allow near-instantaneous travel between fixed points, and K'tharr ships are known for their unique FTL signatures that defy easy Concord tracking, possibly utilizing localized wormhole generation or a form of non-linear spacetime navigation.",
         unlocked: false
     },
     TECH_PHASE_SHIFT_ALLOY: {
         title: "Phase-Shifted Alloy",
         category: "Technology & Phenomena",
         text: COMMODITIES.PHASE_SHIFTED_ALLOY.description + " Its atomic structure seems to exist in multiple quantum states simultaneously, allowing it to briefly 'ignore' normal matter under specific energy conditions, effectively passing through it. Concord scientists have tried for decades to replicate it with limited success, often resulting in catastrophic instability or the alloy simply vanishing from this dimension. Precursor applications included advanced cloaking, interdimensional gateways, and potentially even weapons capable of bypassing conventional defenses.",
         unlocked: false
     },

     LEGEND_VOID_KRAKEN: {
         title: "The Void Kraken",
         category: "Myths & Legends",
         text: "A chilling legend among deep-space haulers and explorers. Said to be a colossal, energy-based or etheric lifeform inhabiting the darkest nebulae or the void between galaxies. Descriptions vary wildly: some claim it's a creature of pure shadow with glowing, malevolent eyes, others a being of shifting, impossible geometries that defy perception. Most dismiss it as space-madness, sensor ghosts, or misidentified stellar phenomena. However, some derelicts are found with strange, energy-based scarring that no known weapon could inflict, their logs wiped, and their crews invariably missing without a trace, fueling the terrifying myth of the Kraken's hunger.",
         unlocked: false
     },
     LEGEND_SENTIENT_MYCELIUM_NETWORK: {
         title: "Sentient Mycelium Network",
         category: "Myths & Legends",
         text: COMMODITIES.SENTIENT_MYCELIUM.description + " Some fringe theories suggest the network is not just a collection of fungi, but a single, galaxy-spanning superorganism, a 'Great Spore Mind' that dreams the universe, or at least observes it with an alien intellect. Contact is said to be transformative, offering glimpses of other realities or profound cosmic truths, but often at the cost of sanity or one's individual consciousness being subsumed into the network. The K'tharr revere it as a sacred entity, while the Concord views it as a dangerous biological hazard.",
         unlocked: false
     },

     REGION_SOL_SECTOR: {
         title: "Sol Sector (0,0)",
         category: "Notable Star Systems/Regions",
         text: "The birthplace of humanity's interstellar expansion and the heart of the Galactic Concord. Home to Starbase Alpha, the primary administrative and commercial hub of this region of space. While heavily patrolled by the CDF, its high traffic makes it a target for opportunistic pirates and smugglers. Contains several well-charted planets, including Planet Omega, a key research and resource center.",
         unlocked: true
     },
     REGION_KEPLER_NEBULA: {
         title: "Kepler Nebula",
         category: "Notable Star Systems/Regions",
         text: "A dense, turbulent nebula known for its rich mineral deposits and treacherous navigation. Its sensor-baffling properties make it a favored hiding spot for pirate clans, particularly the infamous Void Vultures. Concord patrols are infrequent and often meet with heavy resistance. Many a fortune has been made and lost in its swirling, irradiated clouds.",
         unlocked: false
     },
     REGION_SILENTIUM_EXPANSE: {
         title: "The Silentium Expanse",
         category: "Notable Star Systems/Regions",
         text: "A vast, largely uncharted region of space beyond the Concord's established borders. Long-range scans show an unusual dearth of stellar activity, and ships that venture too far often fail to return. Legends speak of it as the Precursors' 'Great Filter' or a domain of entities that predate the current universe. What secrets or horrors it holds remains one of the galaxy's greatest and most terrifying mysteries.",
         unlocked: false
     },

     COMMODITY_WAYFINDER_CORE: {
         title: "Wayfinder Core",
         category: "Commodities",
         text: COMMODITIES.WAYFINDER_CORE.description,
         unlocked: false
     },
     COMMODITY_KTHARR_ANCESTRAL_BLADE: {
         title: "K'tharr Ancestral Blade",
         category: "Commodities",
         text: COMMODITIES.KTHARR_ANCESTRAL_BLADE.description,
         unlocked: false
     },
     COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT: {
         title: "Precursor Star Map Fragment",
         category: "Commodities",
         text: COMMODITIES.PRECURSOR_STAR_MAP_FRAGMENT.description,
         unlocked: false
     },
     MYSTERY_WAYFINDER_QUEST: {
         title: "The Precursor Wayfinder",
         category: "Mysteries",
         text: "Ancient legends speak of Precursor 'Wayfinders', devices capable of charting paths through the deepest voids and perhaps even between galaxies. The Galactic Concord has long sought these mythical artifacts. Rumors suggest a signal from one was recently detected...",
         unlocked: false
     },
     MYSTERY_WAYFINDER_QUEST_COMPLETED: {
         title: "Wayfinder Activated",
         category: "Mysteries",
         text: "You successfully located and activated a Precursor Wayfinder. Its core contains fragmented charts hinting at paths into the Silentium Expanse and a location known as the 'First Nexus'. This discovery could change the course of galactic exploration, but also attract unwanted attention. The journey has just begun.",
         unlocked: false
     },
     MYSTERY_FIRST_NEXUS: {
         title: "The First Nexus",
         category: "Mysteries",
         text: "The location revealed by the Wayfinder Core. A place of immense Precursor power and significance. Its purpose is unknown, but it radiates an energy unlike anything known to modern science. It is likely to be of extreme interest to all major factions.",
         unlocked: false
     }
 };
 // --- XERXES SPIRE PUZZLE DATABASE ---
const SPIRE_PUZZLES = [
    {
        level: 0,
        title: "THE OUTER GATE",
        riddle: "I have no weight, yet I can sink a ship. The more of me you have, the less you see. I am the ruler of this sunless world.",
        answers: ["darkness", "dark", "shadow", "the dark", "void"],
        rewardXP: 300,
        rewardCredit: 0,
        flavorSuccess: "The glyph fades. The heavy obsidian gates grind open, revealing the market within.",
        unlocksShop: true // Solving Level 0 unlocks the shop
    },
    {
        level: 1,
        title: "THE DEEP ARCHIVE",
        riddle: "I build bridges of silver and crowns of gold. I have no hands, yet I shape the world. I am stolen, traded, and hoarded, yet I have no value until I am lost.",
        answers: ["data", "information", "knowledge", "secrets", "lore"],
        rewardXP: 500,
        rewardCredit: 1000, // Cash reward for this layer
        flavorSuccess: "A data-spike emerges from the wall. You download the cache. The path deeper opens.",
        unlocksShop: true
    },
    {
        level: 2,
        title: "THE CORE SANCTUM",
        riddle: "To the pilot, I am death. To the planet, I am life. I burn without fire, I crush without hands. What am I?",
        answers: ["gravity", "star", "sun", "black hole"],
        rewardXP: 1000,
        rewardCredit: 0,
        flavorSuccess: "The core chamber hums. You have reached the bottom... for now.",
        unlocksShop: true
    }
];
