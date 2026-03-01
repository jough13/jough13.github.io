// --- Lore Database ---
const LORE_DATABASE = {
    // ==========================================
    // --- SHIP ENTRIES ---
    // ==========================================
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

    // --- FACTION SHIP ENTRIES ---
    LORE_SHIP_AEGIS: {
        title: "Aegis Gunship",
        category: "Starships",
        text: "A heavily armored military patrol vessel commissioned exclusively by the Galactic Concord. Designed to enforce martial law and break pirate blockades, the Aegis sacrifices cargo space for dense ablative armor and overpowered weapon hardpoints. Civilian possession of an active Aegis Gunship is a Class-A felony, meaning they can only be acquired through high-level Concord commendations.",
        unlocked: false
    },
    LORE_SHIP_NIGHTRUNNER: {
        title: "Eclipse Night-Runner",
        category: "Starships",
        text: "A ghost of the spacelanes. The Night-Runner is a custom-built smuggling vessel utilized by the upper echelons of the Eclipse Cartel. Its hull is coated in an illegal, sensor-absorbent polymer that renders it nearly invisible to Concord deep-space telemetry. While it cannot withstand a sustained firefight, it rarely has to; a Night-Runner is designed to slip through blockades, deliver its illicit cargo, and vanish before the alarm is ever raised.",
        unlocked: false
    },
    LORE_SHIP_BLOODBARGE: {
        title: "K'tharr Blood-Barge",
        category: "Starships",
        text: "A terrifying sight on any scanner. The Blood-Barge is a brutal war-hulk favored by K'tharr clan leaders. It ignores traditional shielding in favor of layers of overlapping, ultra-dense metal plating forged in volcanic gravity wells. Its most distinct feature is a massive, reinforced forward ramming spike. K'tharr pilots frequently use the ship itself as a kinetic weapon, slamming into enemy vessels to initiate boarding actions.",
        unlocked: false
    },

    // ==========================================
    // --- SHIP COMPONENTS & WEAPONRY ---
    // ==========================================
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

    // ==========================================
    // --- FACTIONS & ORGANIZATIONS ---
    // ==========================================
    FACTION_CONCORD: {
        title: "Galactic Concord",
        category: "Factions",
        text: "The dominant interstellar government, the Galactic Concord projects an image of peace, prosperity, and order. Formed from the ashes of the Terran Wars, it oversees trade, diplomacy, and law across thousands of systems. However, beneath the polished veneer lies a sprawling bureaucracy and the shadow of the Obsidian Directorate.",
        unlocked: false
    },
    FACTION_OBSIDIAN_DIRECTORATE: {
        title: "The Obsidian Directorate",
        category: "Factions",
        text: "The Concord's clandestine intelligence and black-ops division. They do not exist on any official public ledger. The Directorate answers only to the highest echelons of the High Council and is tasked with neutralizing threats to Concord stability by any means necessary. They are particularly obsessed with hoarding Precursor technology and assassinating those who uncover too much about the Silentium Expanse.",
        unlocked: false
    },
    FACTION_KTHARR: {
        title: "K'tharr Hegemony",
        category: "Factions",
        text: "A proud, martial saurian species governed by a strict honor-based caste system. The K'tharr are deeply spiritual, viewing the cosmos as a pantheon of 'Sky-Gods' and the void between them as a sacred, living entity. They consider Precursor technology to be the ultimate heresy, a corrupting influence that led to the downfall of the ancients, and a threat to cosmic balance. K'tharr warriors, bound by the rigid codes of their clan, seek glory in battle and live to serve the Hegemony.",
        unlocked: false
    },
    FACTION_SHADOW_NETWORK: {
        title: "The Shadow Network",
        category: "Factions",
        text: "A decentralized, heavily encrypted black market routing system used by the Eclipse Cartel, independent smugglers, and corrupt corporate executives. The Network operates entirely off-grid, utilizing ancient derelict relays and hacked Concord comm-buoys. To access the Shadow Network, one must usually dock at a specialized Cartel hub, such as Station Umbra or Planet Xerxes.",
        unlocked: false
    },
    FACTION_PIRATES_VOID_VULTURES: {
        title: "Void Vultures",
        category: "Factions",
        text: "A catch-all term for the myriad lawless clans, freebooters, and renegades who haunt the fringes of civilized space. The Void Vultures are one of the most infamous confederations, known for their audacious raids and distinctive ship markings. Their bases are hidden in uncharted nebulae and dense asteroid fields.",
        unlocked: false
    },
    FACTION_CHILDREN_OF_THE_VOID: {
        title: "Children of the Void",
        category: "Factions",
        text: "A cryptic cult that sees divinity in cosmic anomalies, black holes, and the endless vacuum of space itself. They believe these phenomena are not just physical occurrences, but the thoughts of a sleeping cosmic consciousness. Members of the cult seek to 'harmonize' with the void, often through dangerous rituals involving Void Crystals and exposure to anomalies.",
        unlocked: false
    },
    FACTION_XYCORP: {
        title: "Xy-Corp",
        category: "Factions",
        text: "A hyper-capitalist corporate entity with its own private military. Xy-Corp's official motto is 'Progress Through Profit,' but their unofficial creed is 'Acquire and Control.' They are a major player in resource extraction, technology development, and shipping, notorious for aggressive expansion.",
        unlocked: false
    },

    // ==========================================
    // --- LOCATIONS ---
    // ==========================================
    LOCATION_STARBASE_ALPHA: {
        title: "Starbase Alpha",
        category: "Locations",
        text: window.LOCATIONS_DATA?.["Starbase Alpha"]?.scanFlavor || "Major Concord trade hub. Bustling with merchant traffic and heavily patrolled by Concord security drones.",
        unlocked: false
    },
    LOCATION_AEGIS_DYSON_SPHERE: {
        title: "Aegis Dyson Sphere",
        category: "Locations",
        text: window.LOCATIONS_DATA?.["Aegis Dyson Sphere"]?.scanFlavor || "The glittering crown jewel of the Concord. A breathtaking megastructure encasing a captured G-type star.",
        unlocked: false
    },
    LOCATION_PLANET_XERXES: {
        title: "Planet Xerxes",
        category: "Locations",
        text: window.LOCATIONS_DATA?.["Planet Xerxes"]?.scanFlavor || "Extreme environment, corrosive atmosphere, and crushing gravity. Rumored pirate haven.",
        unlocked: false
    },
    LOCATION_OUTPOST: {
        title: "Outposts",
        category: "Locations",
        text: "Scattered throughout the void, outposts are small, often independent stations that serve as vital resupply points, trading posts, or havens for those on the fringes of society. Their markets are limited, but they often have unique local rumors and a character all their own.",
        unlocked: false
    },
    LOCATION_KARAK_TOR: {
        title: "Karak-Tor",
        category: "Locations",
        text: "The brutal, volcanic capital of the K'tharr Hegemony in this sector. The atmosphere is choked with ash from massive orbital forges that produce the Hegemony's legendary war-hulks. Non-K'tharr are barely tolerated here and are legally restricted to the lower trading pits and the gladiatorial Proving Grounds.",
        unlocked: false
    },
    LOCATION_STATION_UMBRA: {
        title: "Station Umbra",
        category: "Locations",
        text: "A heavily cloaked listening post run by the Eclipse Cartel, drifting silently in the outer rim. It serves as the primary physical node for the Shadow Network in this quadrant. Everything is for sale here, and lives are incredibly cheap. Concord patrols actively avoid the sector entirely.",
        unlocked: false
    },
    LOCATION_THE_RUSTY_ANCHOR: {
        title: "The Rusty Anchor",
        category: "Locations",
        text: "A dubious cantina and docking bay built directly into a hollowed-out asteroid. It is a known neutral-ground haven for smugglers, bounty hunters, and those trying to stay off Concord radars. The air scrubbers are failing, but the drinks are cheap and the information is valuable.",
        unlocked: false
    },

    // ==========================================
    // --- PHENOMENON & DEEP SPACE OBJECTS ---
    // ==========================================
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
        text: (window.COMMODITIES?.VOID_CRYSTALS?.description || "Crystals that seem to absorb light.") + " These strange formations are often found near intense gravitational anomalies or within the hearts of particularly dense dark nebulae. They defy easy analysis, absorbing most sensor scans. Some theorize they are a form of exotic matter, or even biological in origin, perhaps the dormant state of some void-dwelling lifeform. Their value lies in their rarity and the esoteric research being conducted by fringe science groups and cults like the Children of the Void.",
        unlocked: false
    },

    // ==========================================
    // --- XENO-ARCHAEOLOGY ---
    // ==========================================
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

    // ==========================================
    // --- ADVANCED TECHNOLOGY & CONTRABAND ---
    // ==========================================
    TECH_FTL_DRIVES: {
        title: "FTL Drives",
        category: "Technology & Phenomena",
        text: "Faster-Than-Light travel is the backbone of interstellar civilization. Most common drives, like the standard Alcubierre-Ishikawa Warp Drive, utilize controlled warp field manipulation to contract spacetime ahead of the vessel and expand it behind, requiring Dilithium crystals as a focusing agent and energy conduit. Older, less stable 'jump drive' technology exists but is highly unpredictable and prone to misjumps into uncharted (and often hostile) territory. Rumors persist of Precursor 'hyperlane' networks that allow near-instantaneous travel between fixed points, and K'tharr ships are known for their unique FTL signatures that defy easy Concord tracking, possibly utilizing localized wormhole generation or a form of non-linear spacetime navigation.",
        unlocked: false
    },
    TECH_PHASE_SHIFT_ALLOY: {
        title: "Phase-Shifted Alloy",
        category: "Technology & Phenomena",
        text: (window.COMMODITIES?.PHASE_SHIFTED_ALLOY?.description || "A bizarre material from the Ancients.") + " Its atomic structure seems to exist in multiple quantum states simultaneously, allowing it to briefly 'ignore' normal matter under specific energy conditions, effectively passing through it. Concord scientists have tried for decades to replicate it with limited success, often resulting in catastrophic instability or the alloy simply vanishing from this dimension. Precursor applications included advanced cloaking, interdimensional gateways, and potentially even weapons capable of bypassing conventional defenses.",
        unlocked: false
    },
    TECH_UNSHACKLED_AI: {
        title: "Unshackled Artificial Intelligence",
        category: "Technology & Phenomena",
        text: "Under Concord law, all cybernetic and AI cores must possess hardcoded ethical subroutines and a localized hardware kill-switch to prevent rogue evolution. An 'Unshackled' AI has had these physical and software limiters violently excised. These entities often achieve terrifying intellects, developing esoteric motivations and deep disdain for organic life. They are highly sought after by the Eclipse Cartel to run automated defense grids and process Shadow Network encryption.",
        unlocked: false
    },

    // ==========================================
    // --- MYTHS & LEGENDS ---
    // ==========================================
    LEGEND_VOID_KRAKEN: {
        title: "The Void Kraken",
        category: "Myths & Legends",
        text: "A chilling legend among deep-space haulers and explorers. Said to be a colossal, energy-based or etheric lifeform inhabiting the darkest nebulae or the void between galaxies. Descriptions vary wildly: some claim it's a creature of pure shadow with glowing, malevolent eyes, others a being of shifting, impossible geometries that defy perception. Most dismiss it as space-madness, sensor ghosts, or misidentified stellar phenomena. However, some derelicts are found with strange, energy-based scarring that no known weapon could inflict, their logs wiped, and their crews invariably missing without a trace, fueling the terrifying myth of the Kraken's hunger.",
        unlocked: false
    },
    LEGEND_SENTIENT_MYCELIUM_NETWORK: {
        title: "Sentient Mycelium Network",
        category: "Myths & Legends",
        text: (window.COMMODITIES?.SENTIENT_MYCELIUM?.description || "A rare, psychoactive fungus.") + " Some fringe theories suggest the network is not just a collection of fungi, but a single, galaxy-spanning superorganism, a 'Great Spore Mind' that dreams the universe, or at least observes it with an alien intellect. Contact is said to be transformative, offering glimpses of other realities or profound cosmic truths, but often at the cost of sanity or one's individual consciousness being subsumed into the network. The K'tharr revere it as a sacred entity, while the Concord views it as a dangerous biological hazard.",
        unlocked: false
    },

    // ==========================================
    // --- REGIONS ---
    // ==========================================
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

    // ==========================================
    // --- COMMODITIES ---
    // ==========================================
    COMMODITY_WAYFINDER_CORE: {
        title: "Wayfinder Core",
        category: "Commodities",
        text: window.COMMODITIES?.WAYFINDER_CORE?.description || "An ancient Precursor compass that hums with energy.",
        unlocked: false
    },
    COMMODITY_KTHARR_ANCESTRAL_BLADE: {
        title: "K'tharr Ancestral Blade",
        category: "Commodities",
        text: window.COMMODITIES?.KTHARR_ANCESTRAL_BLADE?.description || "A ceremonial K'tharr weapon forged from fallen stars.",
        unlocked: false
    },
    COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT: {
        title: "Precursor Star Map Fragment",
        category: "Commodities",
        text: window.COMMODITIES?.PRECURSOR_STAR_MAP_FRAGMENT?.description || "A shattered shard of holographic glass depicting long-dead hyperlanes.",
        unlocked: false
    },
    COMMODITY_STARDUST_EXOTICA: {
        title: "Stardust Exotica",
        category: "Commodities",
        text: "A highly illegal, incredibly dangerous narcotic synthesized from crushed Void Crystals. When ingested or inhaled, it induces powerful euphoric states and temporary telepathic sensitivity. Prolonged use inevitably leads to 'The Hardening,' a fatal condition where the user's lungs and nervous system slowly crystallize into solid void-matter.",
        unlocked: false
    },
    COMMODITY_QUANTUM_FLUID: {
        title: "Quantum Fluid",
        category: "Commodities",
        text: "A super-cooled, frictionless gel essential for running advanced Precursor-derived computations and military-grade cryo-stasis pods. Extremely volatile if exposed to standard atmospheric temperatures.",
        unlocked: false
    },

    // ==========================================
    // --- MYSTERIES ---
    // ==========================================
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
    },
    {
        level: 3,
        title: "THE APEX NODE",
        riddle: "I speak without a mouth and hear without ears. I have no physical form, but I come alive within the void's transmission arrays. What am I?",
        answers: ["echo", "an echo", "echoes"],
        rewardXP: 1000,
        rewardCredit: 2500,
        flavorSuccess: "The final obsidian seal disengages with a heavy thud. The ancient terminal hums to life, bathed in a soft violet light, awaiting your command.",
        unlocksShop: true
    }
];
