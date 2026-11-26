// --- START OF FILE lore.js ---

// ==========================================
// --- GALACTIC ARCHIVES (LORE DATABASE) ---
// ==========================================

const LORE_DATABASE = {

    // ==========================================
    // --- STARSHIPS ---
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
    LORE_SHIP_DREADNOUGHT: {
        title: "Dreadnought Class",
        category: "Starships",
        text: "Massive, sluggish, and bristling with heavy artillery. Dreadnoughts are rarely seen outside of K'tharr border conflicts, Aegis sector command fleets, or major Eclipse Cartel flotillas. They require large crews to maintain and carry spinal battery mounts capable of cracking station armor.",
        unlocked: false
    },
    LORE_SHIP_SCOUT: {
        title: "Pathfinder Scout",
        category: "Starships",
        text: "Fitted with oversized sensor arrays and minimal armor, the Scout class is designed to jump into unknown systems, map the hazards, and jump out before anything can target it. Popular among deep-space xeno-biologists, Cygnus surveyors, and paranoid smugglers.",
        unlocked: false
    },
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
        title: "The Concord Dominion",
        category: "Factions",
        text: "The dominant interstellar government and self-appointed peacekeepers of the core worlds. Formed from the ashes of the Terran Resource Wars, the Concord Dominion promises stability through heavily armed bureaucracy. They maintain major hyper-lanes and enforce strict taxation, but beneath the polished veneer lies the shadow of the Obsidian Directorate. Their reach dwindles the further you get from Starbase Alpha.",
        unlocked: false
    },
    FACTION_OBSIDIAN_DIRECTORATE: {
        title: "The Obsidian Directorate",
        category: "Factions",
        text: "The Concord's clandestine intelligence and black-ops division. They do not exist on any official public ledger. The Directorate answers only to the highest echelons of the High Council and is tasked with neutralizing threats to Concord stability by any means necessary. They are particularly obsessed with hoarding Precursor technology and assassinating those who uncover too much about the Silentium Expanse.",
        unlocked: false
    },
    FACTION_ECLIPSE: {
        title: "The Eclipse Cartel",
        category: "Factions",
        text: "A decentralized syndicate of smugglers, information brokers, and pirates. The Cartel doesn't have a homeworld; they exist in the shadows of Concord space, operating out of hollowed-out asteroids and mobile fleet-hubs. If it's illegal, restricted, or highly dangerous, the Eclipse Cartel controls the supply line.",
        unlocked: false
    },
    FACTION_ECLIPSE_SMUGGLING: {
        title: "Eclipse Smuggling Rings",
        category: "Factions",
        text: "The lifeblood of the Eclipse Cartel's shadow economy. Utilizing shielded cargo bays, spoofed transponders, and dead-drop buoys hidden inside sensor-baffling nebulae, Cartel runners move everything from Prohibited Stims to Precursor relics right under the noses of Concord customs patrols.",
        unlocked: false
    },
    FACTION_KTHARR: {
        title: "K'tharr Ascendancy",
        category: "Factions",
        text: "A proud, martial reptilian species governed by a strict honor-based caste system. The K'tharr Ascendancy views the Concord as soft and the Eclipse as dishonorable. Deeply spiritual, they view the cosmos as a pantheon of 'Sky-Gods' and consider Precursor technology a corrupting heresy. They organize their society around massive gladiatorial 'Proving Grounds' where political disputes are settled with ship-to-ship combat.",
        unlocked: false
    },
    FACTION_SHADOW_NETWORK: {
        title: "The Shadow Network",
        category: "Factions",
        text: "A decentralized, heavily encrypted black market routing system used by the Eclipse Cartel, independent smugglers, and corrupt corporate executives. Bypassing Concord customs via quantum-encrypted routing, they fence everything from stolen Precursor tech to illegal cybernetics. To access the network, one must usually dock at a specialized Cartel hub, such as Station Umbra, Port Erebus, or Planet Xerxes.",
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
    FACTION_FUEL_RATS: {
        title: "The Fuel Rats",
        category: "Factions",
        text: "An independent, galaxy-wide collective of rescue pilots. They operate outside of Concord jurisdiction and cartels alike, bound by a single, unbreakable oath: 'We have fuel. You don't. Any questions?' They refuse payment for standard rescues, surviving entirely on 'tips' and the universal respect of every faction. Even the Eclipse Cartel has standing orders not to fire on a Fuel Rat tug, as everyone eventually runs out of hydrogen in the deep black.",
        unlocked: false
    },

    // ==========================================
    // --- COMBAT & TACTICS ---
    // ==========================================

    TACTIC_BOARDING: {
        title: "Close-Quarters Boarding",
        category: "Tactics",
        text: "When a ship's hull is critically compromised or shields are stripped, daring crews can forcefully dock and blow the airlock. It is a terrifying, chaotic form of combat where plasma-cutters and heavy sidearms replace ship batteries. High risk, but intact cargo holds yield triple salvage.",
        unlocked: false
    },
    TACTIC_CUSTOMS_EVASION: {
        title: "Bypassing Customs",
        category: "Tactics",
        text: "Concord Patrols utilize sub-space resonance scanners to check cargo holds. Smugglers have learned that venting a small amount of ionized plasma, installing shielded Eclipse bays, or fast-talking customs officers can hide prohibited stims and precursor artifacts from the readouts.",
        unlocked: false
    },
    TACTIC_SILENT_RUNNING: {
        title: "Silent Running & Thermal Discipline",
        category: "Tactics",
        text: "By sealing radiator vanes and shuttering the main fusion core, a vessel can drop off long-range tactical scopes—slipping past Aegis pursuit craft and pirate patrols alike. The price is heat: with nowhere to radiate waste thermal energy, internal temperatures climb rapidly. Past five thermal units, the reactor begins scorching the ship's own hull from within.",
        unlocked: false
    },
    TACTIC_SUBSYSTEM_TARGETING: {
        title: "Subsystem Targeting Doctrine",
        category: "Tactics",
        text: "Seasoned gunners rarely waste plasma punching blindly at center-mass armor. Once an enemy's deflectors collapse, focusing fire on weapon emitters cuts hostile output in half, while crippling their sublight drives disables evasive maneuvers altogether—at the cost of a tighter aiming window.",
        unlocked: false
    },
    TACTIC_WARZONE_SALVAGE: {
        title: "Warzone Intervention & Salvage",
        category: "Tactics",
        text: "Border skirmishes between Concord patrols, K'tharr warbands, and Eclipse raiders turn open space into lethal chaos. Freelance captains face a classic frontier choice: lock comms with a commander to earn reputation and hazard pay, or cut engines and drift into the crossfire to strip Void Crystals and encrypted cores from shattered hulks.",
        unlocked: false
    },
    TACTIC_ORBITAL_BOMBARDMENT: {
        title: "Planetary Assault & Orbital Support",
        category: "Tactics",
        text: "Storming a fortified Cartel compound takes more than a deck gun. Marine platoons carry the breach on the ground, Goliath Assault Mechs provide heavy armored fire support, and burning reserve deuterium lets an orbiting ship rain precision orbital strikes straight onto enemy fortifications.",
        unlocked: false
    },

    // ==========================================
    // --- LOCATIONS ---
    // ==========================================

    LOCATION_STARBASE_ALPHA: {
        title: "Starbase Alpha",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["Starbase Alpha"]?.scanFlavor : null) || "Major Concord trade hub. Bustling with merchant traffic and heavily patrolled by Concord security drones.",
        unlocked: false
    },
    LOCATION_AEGIS_DYSON_SPHERE: {
        title: "Aegis Dyson Sphere",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["Aegis Dyson Sphere"]?.scanFlavor : null) || "The glittering crown jewel of the Concord. A breathtaking megastructure encasing a captured G-type star.",
        unlocked: false
    },
    LOCATION_PLANET_XERXES: {
        title: "Planet Xerxes",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["Planet Xerxes"]?.scanFlavor : null) || "Extreme environment, corrosive atmosphere, and crushing gravity. Rumored pirate haven.",
        unlocked: false
    },
    LOCATION_OUTPOST: {
        title: "Frontier Outposts",
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
    LOCATION_FORTRESS_DRAKON: {
        title: "Fortress Drakon",
        category: "Locations",
        text: "A heavily armored K'tharr border bastion anchored on the eastern approaches. Forged from scorched asteroid slag and bristling with siege batteries, Fortress Drakon serves as the primary staging point for Hegemony border patrols and pays blood-iron fortunes for returned Ancestral Blades.",
        unlocked: false
    },
    LOCATION_STATION_UMBRA: {
        title: "Station Umbra",
        category: "Locations",
        text: "A heavily cloaked listening post run by the Eclipse Cartel, drifting silently in the outer rim. It serves as the primary physical node for the Shadow Network in this quadrant. Everything is for sale here, and lives are incredibly cheap. Concord patrols actively avoid the sector entirely.",
        unlocked: false
    },
    LOCATION_PORT_EREBUS: {
        title: "Port Erebus",
        category: "Locations",
        text: "Tucked inside a dense, radar-baffling dust cloud along the southwestern border, Port Erebus is the Eclipse Cartel's busiest forward smuggling port. Neon-lit docking alleys house identity forgers, Shadow Brokers, and blockade runners preparing for runs into Concord Core lanes.",
        unlocked: false
    },
    LOCATION_THE_RUSTY_ANCHOR: {
        title: "The Rusty Anchor",
        category: "Locations",
        text: "A dubious cantina and docking bay built directly into a hollowed-out asteroid. It is a known neutral-ground haven for smugglers, bounty hunters, and those trying to stay off Concord radars. The air scrubbers are failing, but the drinks are cheap and the information is valuable.",
        unlocked: false
    },
    LOCATION_CYGNUS_PRIME: {
        title: "University of Cygnus Prime",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["Cygnus Prime"]?.scanFlavor : null) || "The premier astrophysical and xeno-archaeological research complex in Concord space. Academic grants fund top-credit bounties for planetary telemetry and intact Precursor Datacubes.",
        unlocked: false
    },
    LOCATION_KEPLER_LISTENING_POST: {
        title: "Kepler Listening Post",
        category: "Locations",
        text: "A compact Concord signal-intelligence relay overlooking the western approaches to the Kepler Nebula. SEC-COM cryptanalysts stationed here monitor Cartel jump vectors, distribute recon beacons, and pay handsome bounties for intercepted Syndicate Ledgers.",
        unlocked: false
    },
    LOCATION_CETI_ALPHA_SHIPYARDS: {
        title: "Ceti Alpha Shipyards",
        category: "Locations",
        text: "Rebuilt and heavily fortified after Dread Pirate Voss's infamous raid, Ceti Alpha's orbital slipways assemble Concord patrol hulls and deep-space drones around the clock. Its foundries consume immense tonnage of raw platinum and rare metals.",
        unlocked: false
    },
    LOCATION_HELIOS_REFINERY: {
        title: "Helios Corporate Refinery",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["Helios Refinery"]?.scanFlavor : null) || "A sprawling Xy-Corp orbital smelting facility. Ideal supply depot for colony builders and industrial haulers.",
        unlocked: false
    },
    LOCATION_SOLITUDE_RESEARCH_PLATFORM: {
        title: "Solitude Research Platform",
        category: "Locations",
        text: "A quiet Concord bio-research station perched out on the southeastern rim between independent mining belts and K'tharr marches. Its pressurized cryo-domes synthesize advanced trauma supplies from alien flora while funding deep-space astrometric grants.",
        unlocked: false
    },
    LOCATION_VALKYRIE_DRIFT: {
        title: "Valkyrie Drift",
        category: "Locations",
        text: "A sprawling independent rock-hopper platform bolted directly onto a fractured iron asteroid in the eastern belts. Roughneck miners trade uncracked crystalline geodes and raw platinum while paying steep markups for fresh water, droid servos, and Frothy Moon Ale.",
        unlocked: false
    },
    LOCATION_THE_SUNKEN_COMPASS: {
        title: "The Sunken Compass",
        category: "Locations",
        text: "A ramshackle freeport bazaar welded inside the broken spine of an ancient colony ark along the western corridor. Serving as the last neutral refueling and salvage stop before Station Umbra, its workshops convert bulk ore into field repair kits.",
        unlocked: false
    },
    LOCATION_FROTHY_MOON_OUTPOST: {
        title: "Frothy Moon Outpost",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["Frothy Moon Outpost"]?.scanFlavor : null) || "A cozy, independent observatory and brewhouse perched on a cratered lunar ridge where astronomers trade deep-sky charts over dark synth-ale.",
        unlocked: false
    },
    LOCATION_PORT_NOMAD: {
        title: "Port Nomad",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["Port Nomad"]?.scanFlavor : null) || "Primary refueling depot and dispatch sanctuary of The Fuel Rats Collective.",
        unlocked: false
    },
    "LOCATION_THE_ARCHIVIST'S_VAULT": {
        title: "The Archivist's Vault",
        category: "Locations",
        text: (typeof LOCATIONS_DATA !== 'undefined' ? LOCATIONS_DATA["The Archivist's Vault"]?.scanFlavor : null) || "Hidden deep within a graveyard of shattered pre-Concord hulls, run by an ancient, reclusive AI information broker.",
        unlocked: false
    },
    LOCATION_OBSIDIAN_OBELISK: {
        title: "Obsidian Obelisk",
        category: "Locations",
        text: "An ancient, monolithic spire floating in deep space. Its geometric trenches pulse with residual Precursor energy capable of repairing vessel hulls and imprinting astrometric knowledge directly into a pilot's neural cortex.",
        unlocked: false
    },
    LOCATION_SANCTUARY_OF_THE_VOID: {
        title: "Sanctuary of the Void",
        category: "Locations",
        text: "A silent ring of luminous Precursor pylons anchored at [39, 17]. Long whispered about in encrypted engrams, its intact subspace transponders still broadcast harmonic charts from the era before human expansion.",
        unlocked: false
    },
    LOCATION_CHOIR_SPIRE_ALPHA: {
        title: "Choir Spire Alpha",
        category: "Locations",
        text: "A crystalline pilgrimage cathedral maintained by the Children of the Void out along the western frontier. Its cantors broadcast continuous subspace hymns and reward travelers who bring Void Crystal offerings.",
        unlocked: false
    },
    LOCATION_SILENTIUM_RELAY_ZERO: {
        title: "Silentium Relay Zero",
        category: "Locations",
        text: "The outermost Precursor warning beacon on the northeastern brink of the Silentium Expanse. Its dormant memory lattice preserves the final telemetry recorded by the Architects before the Great Silence fell across the void.",
        unlocked: false
    },

    // ==========================================
    // --- PHENOMENA & DEEP SPACE OBJECTS ---
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
    PHENOMENON_BLACK_HOLE: {
        title: "Singularities & Black Holes",
        category: "Phenomena",
        text: "Collapsed stellar cores of infinite density surrounded by blinding violet accretion disks. Their gravitational pull drags unwary starships toward the event horizon unless countered by Precursor navigation cores or specialized Void Diver piloting techniques, which allow ships to slingshot around the ergosphere at zero fuel cost.",
        unlocked: false
    },
    PHENOMENON_RADIATION_BELTS: {
        title: "Ionized Radiation Belts",
        category: "Phenomena",
        text: "Lethal rivers of trapped relativistic protons and hard gamma flux suspended between volatile stellar systems. Unshielded hulls suffer rapid deflector collapse and plasma injector fouling—unless protected by a Lead-Lined Dosimetry Array or a captain trained in operational health physics.",
        unlocked: false
    },
    PHENOMENON_CRYO_COMETS: {
        title: "Interstellar Cryo-Comets",
        category: "Phenomena",
        text: "High-velocity bodies of primordial ice and trapped deuterium-tritium streaking between star systems on hyperbolic trajectories. Pilots bold enough to intercept a comet's coma before it leaves the sector can harvest pure Hydrogen-3 and trace crystalline inclusions.",
        unlocked: false
    },
    PHENOMENON_BINARY_MERGERS: {
        title: "Relativistic Binary Mergers",
        category: "Phenomena",
        text: "When two compact stellar remnants—white dwarfs, neutron stars, or magnetars—spiral together, orbital decay floods surrounding sectors with gravitational waves and magnetized plasma shockfronts. Surviving the pass yields spectroscopy prized by the University of Cygnus Prime.",
        unlocked: false
    },
    PHENOMENON_VOID_CRYSTALS: {
        title: "Void Crystals",
        category: "Technology & Phenomena",
        text: ((typeof COMMODITIES !== 'undefined' ? COMMODITIES.VOID_CRYSTALS?.description : null) || "Crystals that seem to absorb light.") + " These strange formations are often found near intense gravitational anomalies or within the hearts of particularly dense dark nebulae. They defy easy analysis, absorbing most sensor scans. Some theorize they are a form of exotic matter, or even biological in origin, perhaps the dormant state of some void-dwelling lifeform. Their value lies in their rarity and the esoteric research being conducted by fringe science groups and cults like the Children of the Void.",
        unlocked: false
    },
    PHENOMENON_IRRADIATED: {
        title: "Irradiated Wastelands",
        category: "Phenomena",
        text: "Planets whose crusts have been violently blasted by gamma radiation or unstable nuclear isotopes. While some are the result of natural cosmic events (like nearby supernovas), many bear the unmistakable scars of orbital bombardment. They are incredibly hostile to biological life, but brave scavengers often descend into the rad-storms to mine Rare Metals and Void Crystals that form under the extreme environmental stress.",
        unlocked: false
    },

    // ==========================================
    // --- XENO-ARCHAEOLOGY ---
    // ==========================================

    XENO_PRECURSORS: {
        title: "The Precursors",
        category: "Xeno-Archaeology",
        text: "An ancient, highly advanced civilization that vanished eons ago, leaving behind enigmatic ruins, powerful artifacts, and unanswered questions across the galaxy. Their technology far surpassed current understanding, and factions like the Concord and various collectors desperately seek their relics. Why they disappeared is one of the greatest mysteries; theories range from self-ascension to a higher plane of existence, a catastrophic war against an unknown enemy (often dubbed 'The Silencers'), a self-inflicted technological cataclysm, or even a voluntary departure from this dimension to escape a greater threat.",
        unlocked: false
    },
    PRECURSOR_ORIGINS: {
        title: "The Cartographers of Ruin",
        category: "Xeno-Archaeology",
        text: "Decrypted Ancient Archives reveal that the Precursors called themselves the 'Architects of the First Chord.' Rather than ruling through conquest, they seeded the galaxy with harmonic monoliths and Wayfinder relays designed to stabilize spacetime against an encroaching entropic phenomenon they called 'The Silence.' When their containment grid began to fail, they retreated into the First Nexus, leaving their automated vaults behind for a successor species to unlock.",
        unlocked: false
    },
    XENO_DERELICTS: {
        title: "Derelict Ships",
        category: "Xeno-Archaeology",
        text: "The galaxy is littered with the silent hulks of lost ships. Some are recent casualties of pirates or accidents, their emergency beacons long dead. Others are ancient mysteries from forgotten eras or unknown civilizations, their hulls scarred by weapons beyond current comprehension or simply worn down by eons adrift. Exploring them can be profitable, yielding salvage or lost cargo, but also dangerous, as some may still have active (and often hostile) automated defenses, dormant alien lifeforms, or be booby-trapped.",
        unlocked: false
    },
    XENO_ANOMALIES: {
        title: "Cosmic Anomalies",
        category: "Xeno-Archaeology",
        text: "Regions of space where the laws of physics seem to break down or behave erratically. These can range from gravimetric distortions that crush hulls, temporal loops that replay moments in time, subspace echoes that whisper maddening secrets, to exotic particle clouds that interfere with ship systems or even induce mutations in organic matter. They are often dangerous but can sometimes yield unique data or rare materials like Void Crystals.",
        unlocked: false
    },
    XENO_MACHINE_WORLD: {
        title: "Machine Worlds",
        category: "Xeno-Archaeology",
        text: "Planets entirely encased in metallic structures, humming data-conduits, and sprawling orbital rings. No biological life has ever been detected on a true Machine World. Some scholars believe them to be the final evolutionary step of an organic species that entirely digitized their consciousness. Others fear they are the dormant factories of the 'Silencers', waiting for a signal to resume churning out automated war fleets.",
        unlocked: false
    },
    XENO_TOMB_WORLDS: {
        title: "Precursor Tomb Worlds",
        category: "Xeno-Archaeology",
        text: "Dead worlds carpeted in weathered obsidian pyramids and silent geometric citadels. Though their atmospheres have long since thinned, subsurface vaults remain guarded by automated sentinel matrices, preserving intact artifacts from the twilight of the Precursor empire.",
        unlocked: false
    },
    XENO_THE_SPIRE: {
        title: "Xerxes & The Spire",
        category: "Xeno-Archaeology",
        text: "Xerxes is a rogue planet devoid of a host star, floating in the deep black. Its surface is dominated by 'The Spire'—a colossal, subterranean labyrinth of Precursor design. The Eclipse Cartel built their Black Market into the upper crust of this structure, but the deeper layers are locked behind lethal encryption puzzles. Many Cryptarchs have died trying to crack the Spire's lower vaults.",
        unlocked: false
    },

    // ==========================================
    // --- ADVANCED TECHNOLOGY & CONTRABAND ---
    // ==========================================

    TECH_FTL_DRIVES: {
        title: "FTL Drives",
        category: "Technology & Phenomena",
        text: "Faster-Than-Light travel is the backbone of interstellar civilization. Most common drives utilize controlled warp field manipulation to contract spacetime ahead of the vessel and expand it behind. Older, less stable 'jump drive' technology exists but is highly unpredictable and prone to misjumps into uncharted territory. Rumors persist of Precursor 'hyperlane' networks that allow near-instantaneous travel between fixed points.",
        unlocked: false
    },
    TECH_STARGATE_NETWORK: {
        title: "Stabilized Stargates",
        category: "Technology & Phenomena",
        text: "By deploying a massive ring of Phase-Shifted Alloy and Quantum Lenses into empty space, engineers can anchor an artificial wormhole conduit. Unlike natural subspace fractures, player-constructed Stargates eliminate structural turbulence entirely, allowing zero-risk transit across the galaxy.",
        unlocked: false
    },
    TECH_PHASE_SHIFT_ALLOY: {
        title: "Phase-Shifted Alloy",
        category: "Technology & Phenomena",
        text: ((typeof COMMODITIES !== 'undefined' ? COMMODITIES.PHASE_SHIFTED_ALLOY?.description : null) || "A bizarre material from the Ancients.") + " Its atomic structure seems to exist in multiple quantum states simultaneously, allowing it to briefly 'ignore' normal matter under specific energy conditions, effectively passing through it. Precursor applications included advanced cloaking, interdimensional gateways, and potentially even weapons capable of bypassing conventional defenses.",
        unlocked: false
    },
    TECH_UNSHACKLED_AI: {
        title: "Unshackled Artificial Intelligence",
        category: "Technology & Phenomena",
        text: "Under Concord law, all cybernetic and AI cores must possess hardcoded ethical subroutines and a localized hardware kill-switch to prevent rogue evolution. An 'Unshackled' AI has had these physical and software limiters violently excised. These entities often achieve terrifying intellects, developing esoteric motivations and deep disdain for organic life. They are highly sought after by the Eclipse Cartel.",
        unlocked: false
    },
    TECH_COLONY_CHARTER: {
        title: "Concord Pioneer Charters",
        category: "Technology & Phenomena",
        text: "The legal framework and terraforming blueprints required to establish a recognized settlement on an unclaimed world. A Charter includes the schematics for Hab Modules, Atmospheric Processors, and automated tax-routing algorithms. While independent outposts exist, a Concord-stamped Charter ensures the colony is protected by basic Concord naval treaties.",
        unlocked: false
    },
    TECH_CYBER_AUGMENTATION: {
        title: "Cybernetic Augmentation",
        category: "Technology & Phenomena",
        text: "The process of permanently bonding machinery to a biological pilot. While basic cybernetics are common for medical purposes, 'combat-grade' neural laces and reflex-boosters are strictly regulated by the Concord. Pilots who heavily augment themselves often exhibit erratic behavior, but the immense boost to their piloting and tactical skills makes it a tempting risk.",
        unlocked: false
    },
    TECH_MANUFACTURER_SYNERGIES: {
        title: "Manufacturer Set Synergies",
        category: "Technology & Phenomena",
        text: "Modern shipyards design weapons, shields, drives, and sensors around proprietary power-bus frequencies. When three or more subsystems from the same manufacturer—Concord, K'tharr, Eclipse, or Frontier—are wired into a single chassis, harmonic resonance unlocks substantial passive performance bonuses.",
        unlocked: false
    },
    TECH_AUTOMATED_DRONES: {
        title: "Autonomous Swarm & Survey Drones",
        category: "Technology & Phenomena",
        text: "Compact, disposable logic-cores fitted to micro-thrusters let lone captains punch far above their weight class. Survey and Telemetry Probes chart planets and harvest pulsar data passively, Auto-Miners chew through nearby asteroid veins, and Combat Swarms draw enemy fire while hammering hostile deflectors.",
        unlocked: false
    },

    // ==========================================
    // --- MYTHS & LEGENDS ---
    // ==========================================

    LEGEND_VOID_KRAKEN: {
        title: "The Void Kraken",
        category: "Myths & Legends",
        text: "A chilling legend among deep-space haulers and explorers. Said to be a colossal, energy-based or etheric lifeform inhabiting the darkest nebulae or the void between galaxies. Descriptions vary wildly: some claim it's a creature of pure shadow with glowing, malevolent eyes, others a being of shifting, impossible geometries that defy perception. Most dismiss it as space-madness, sensor ghosts, or misidentified stellar phenomena.",
        unlocked: false
    },
    LEGEND_SENTIENT_MYCELIUM_NETWORK: {
        title: "Sentient Mycelium Network",
        category: "Myths & Legends",
        text: ((typeof COMMODITIES !== 'undefined' ? COMMODITIES.SENTIENT_MYCELIUM?.description : null) || "A rare, psychoactive fungus.") + " Some fringe theories suggest the network is not just a collection of fungi, but a single, galaxy-spanning superorganism, a 'Great Spore Mind' that dreams the universe. Contact is said to be transformative, offering glimpses of other realities or profound cosmic truths, but often at the cost of sanity.",
        unlocked: false
    },
    LEGEND_THE_SILENCERS: {
        title: "The Silencers",
        category: "Myths & Legends",
        text: "Mentioned only in fragmented Precursor archives and hushed Cygnus seminars, 'The Silencers' are whatever force—or cosmic phase-transition—drove the Architects of the First Chord to seal their vaults and retreat from normal space. Whether they were a rival empire, an automated gray-goo fleet, or entropy made sentient remains fiercely debated.",
        unlocked: false
    },
    LEGEND_CORONAL_SHEPHERDS: {
        title: "The Coronal Shepherds",
        category: "Myths & Legends",
        text: "Pilots who dive too deep into the blinding ultraviolet coronas of O-Class and B-Class supergiants sometimes report luminous silhouettes pacing their wings inside the magnetic loops. Flight surgeons blame ionizing radiation on the optic nerve; Children of the Void texts insist they are ancient plasma-beings guarding sacred stars.",
        unlocked: false
    },
    LEGEND_DIASPORA_ARKS: {
        title: "The Lost Diaspora Arks",
        category: "Myths & Legends",
        text: "Long before modern warp lanes unified Sol Sector, humanity launched dozens of slow sleeper arks and prototype fold-ships into the dark during the 22nd century. Most reached their targets or vanished without trace—yet ships like the CSS Hesperia and CSS Mnemosyne still drift out beyond the rim, carrying frozen ghosts of Old Earth.",
        unlocked: false
    },

    // ==========================================
    // --- REGIONS & STAR SYSTEMS ---
    // ==========================================

    REGION_SOL_SECTOR: {
        title: "Sol Sector (0,0)",
        category: "Notable Star Systems/Regions",
        text: "The birthplace of humanity's interstellar expansion and the heart of the Galactic Concord. Home to Starbase Alpha, the primary administrative and commercial hub of this region of space. While heavily patrolled by the CDF, its high traffic makes it a target for opportunistic pirates and smugglers.",
        unlocked: true
    },
    REGION_KEPLER_NEBULA: {
        title: "Kepler Nebula",
        category: "Notable Star Systems/Regions",
        text: "A dense, turbulent nebula known for its rich mineral deposits and treacherous navigation. Its sensor-baffling properties make it a favored hiding spot for pirate clans, particularly the infamous Void Vultures. Concord patrols are infrequent and often meet with heavy resistance.",
        unlocked: false
    },
    REGION_EASTERN_FRONTIER: {
        title: "The Eastern Frontier (K'tharr Marches)",
        category: "Notable Star Systems/Regions",
        text: "Beyond the outer Concord trade lanes lies a volatile expanse of volcanic forge-worlds, iron asteroid belts, and fortified war-bastions claimed by the K'tharr Ascendancy. Border skirmishes flare constantly as warlords test Aegis resolve and independent miners gamble for platinum.",
        unlocked: false
    },
    REGION_WESTERN_RIM: {
        title: "The Western Rim (Shadow Corridor)",
        category: "Notable Star Systems/Regions",
        text: "A dimly lit swath of dust clouds, cloaked relays, and hollowed-out asteroid ports dominated by the Eclipse Cartel. Concord maritime law carries little weight out past Kepler Listening Post—fortunes are made here in contraband, salvaged relics, and quiet favors.",
        unlocked: false
    },
    REGION_DEEP_FRONTIER: {
        title: "The Uncharted Frontier",
        category: "Notable Star Systems/Regions",
        text: "Past ten sectors from Sol, Concord star-charts thin into speculative dotted lines. Pirates fly heavier hulls, asteroid seams run far richer in rare metals, and ancient Precursor monoliths appear more frequently in the dark between systems.",
        unlocked: false
    },
    REGION_SILENTIUM_EXPANSE: {
        title: "The Silentium Expanse",
        category: "Notable Star Systems/Regions",
        text: "A vast, largely uncharted region of space beyond the Concord's established borders. Long-range scans show an unusual dearth of stellar activity, and ships that venture too far often fail to return. Legends speak of it as the Precursors' 'Great Filter' or a domain of entities that predate the current universe.",
        unlocked: false
    },

    // ==========================================
    // --- COMMODITIES & ITEMS ---
    // ==========================================

    COMMODITY_WAYFINDER_CORE: {
        title: "Wayfinder Core",
        category: "Commodities",
        text: (typeof COMMODITIES !== 'undefined' ? COMMODITIES.WAYFINDER_CORE?.description : null) || "An ancient Precursor compass that hums with energy.",
        unlocked: false
    },
    COMMODITY_KTHARR_ANCESTRAL_BLADE: {
        title: "K'tharr Ancestral Blade",
        category: "Commodities",
        text: (typeof COMMODITIES !== 'undefined' ? COMMODITIES.KTHARR_ANCESTRAL_BLADE?.description : null) || "A ceremonial K'tharr weapon forged from fallen stars.",
        unlocked: false
    },
    COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT: {
        title: "Precursor Star Map Fragment",
        category: "Commodities",
        text: (typeof COMMODITIES !== 'undefined' ? COMMODITIES.PRECURSOR_STAR_MAP_FRAGMENT?.description : null) || "A shattered shard of holographic glass depicting long-dead hyperlanes.",
        unlocked: false
    },
    COMMODITY_PRECURSOR_DATACUBE: {
        title: "Precursor Datacubes",
        category: "Commodities",
        text: "Dense crystalline storage blocks encoded with multi-dimensional holographic lattices. While officially restricted under Concord Security statutes, the University of Cygnus Prime and deep-rim archivists pay fortunes to examine intact cubes before the Obsidian Directorate seizes them.",
        unlocked: false
    },
    COMMODITY_HYDROGEN_3: {
        title: "Hydrogen-3 (Cryo-Tritium)",
        category: "Commodities",
        text: "Heavy hydrogen isotope harvested from gas giant cloud decks and high-velocity interstellar comets. Essential for high-yield fusion drives, Port Nomad's fuel-cell cracking towers, and emergency in-flight tank injections.",
        unlocked: false
    },
    COMMODITY_LIVING_HULL_TISSUE: {
        title: "Living Hull Tissue",
        category: "Commodities",
        text: "Bio-engineered K'tharr armor symbiote grown in volcanic nutrient vats. Capable of knitting micro-fractures across steel bulkheads—or being grafted directly onto a crippled hull in an emergency—it is strictly outlawed in Concord Core space due to quarantine concerns.",
        unlocked: false
    },
    COMMODITY_OBSIDIAN_TEAR_PLATING: {
        title: "Obsidian Tear Plating",
        category: "Commodities",
        text: "Matte-black composite armor ripped from destroyed Eclipse dreadnoughts or compressed in Station Umbra's secret foundries. Its micro-faceted crystal grain scatters active LIDAR sweeps, making possession a Class-A felony in Concord space.",
        unlocked: false
    },
    COMMODITY_FROTHY_MOON_ALE: {
        title: "Frothy Moon Ale",
        category: "Commodities",
        text: "A rich, roasted dark synth-ale brewed on the lunar ridge of Frothy Moon Outpost. Beloved by amateur astronomers, Valkyrie Drift miners, and weary ship crews alike—a cold pint is guaranteed to raise bridge morale.",
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
    COMMODITY_ENCRYPTED_ENGRAM: {
        title: "Encrypted Engrams",
        category: "Commodities",
        text: "Mysterious, polyhedral data-matrices glowing with a faint inner light. These solid-state memory cores belong to civilizations that predate the Concord. Their encryption algorithms are so complex that standard ship computers would take millennia to crack them. They are highly sought after by Cryptarchs, who use single-use quantum 'Ciphers' to collapse the engram's security state and extract the ancient technology blueprints hidden inside.",
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

window.LORE_DATABASE = LORE_DATABASE;

// ==========================================
// --- XERXES SPIRE PUZZLE DATABASE ---
// ==========================================

const SPIRE_PUZZLES = [
    {
        level: 0,
        title: "THE OUTER GATE",
        riddle: "I have no weight, yet I can sink a ship. The more of me you have, the less you see. I am the ruler of this sunless world.",
        answers: ["darkness", "dark", "shadow", "shadows", "the dark", "void", "night", "blackness", "gloom"],
        rewardXP: 300,
        rewardCredit: 0,
        flavorSuccess: "The obsidian glyph dims into starlight. Heavy subterranean gates grind open, unlocking the Shadow Network market within.",
        unlocksShop: true
    },
    {
        level: 1,
        title: "THE DEEP ARCHIVE",
        riddle: "I build bridges of silver and crowns of gold. I have no hands, yet I shape the world. I am stolen, traded, and hoarded, yet I have no value until I am shared or lost.",
        answers: ["data", "information", "knowledge", "secrets", "secret", "lore", "memory", "memories", "truth", "intel"],
        rewardXP: 500,
        rewardCredit: 1000,
        flavorSuccess: "A crystalline data-spike rises from the Spire floor. You siphon the encrypted credit ledger as the descent shaft unseals.",
        unlocksShop: true
    },
    {
        level: 2,
        title: "THE CORE SANCTUM",
        riddle: "To the pilot, I am a tether. To the planet, I am architect. I burn without fire, I crush without hands, and even light cannot escape my embrace. What am I?",
        answers: ["gravity", "gravitation", "star", "sun", "black hole", "singularity", "mass", "well"],
        rewardXP: 1000,
        rewardCredit: 0,
        flavorSuccess: "Gravimetric dampeners hum in resonance. The lower obsidian sanctum opens toward the heart of Xerxes.",
        unlocksShop: true
    },
    {
        level: 3,
        title: "THE APEX NODE",
        riddle: "I speak without a mouth and hear without ears. I have no physical form, but I come alive within the void's transmission arrays, repeating the last words of dead stars. What am I?",
        answers: ["echo", "an echo", "echoes", "signal", "transmission", "radio", "wave", "resonance", "sound"],
        rewardXP: 1000,
        rewardCredit: 2500,
        flavorSuccess: "The final obsidian seal disengages with a deep harmonic thrum. The passage to the Precursor Core Vault stands open.",
        unlocksShop: true
    }
];

window.SPIRE_PUZZLES = SPIRE_PUZZLES;

// ==========================================
// --- DEEP SPACE ENCOUNTERS DATABASE ---
// ==========================================

const ENCOUNTER_DATABASE = {
    PIRATE_EXTORTION: {
        id: "PIRATE_EXTORTION",
        title: "PIRATE AMBUSH",
        icon: "☠️",
        color: "#FF4444",
        text: "A heavily armed pirate vessel drops its active camouflage! They've locked weapons on your engine block and are demanding a 'toll' to let you pass unmolested.",
        choices: [
            {
                label: "PAY THE TOLL (-500c)",
                reqCredits: 500,
                costs: { credits: 500 },
                sound: "buy",
                log: "<span style='color:var(--warning)'>[ ENCOUNTER ] You transferred 500c. The pirates power down weapons and jump away.</span>"
            },
            {
                label: "REFUSE AND EVADE (Hull Risk)",
                actionType: "FLEE_CONCORD",
                log: "You slam the throttle, attempting to break their target lock!"
            }
        ]
    },
    SPATIAL_ANOMALY: {
        id: "SPATIAL_ANOMALY",
        title: "UNSTABLE SPATIAL ANOMALY",
        icon: "🌀",
        color: "#9933FF",
        text: "Your ship is caught in the gravity well of a violently unstable spatial anomaly. The navigation computer is screaming as spacetime warps around the hull.",
        choices: [
            {
                label: "RIDE THE WAVE (-15 Fuel, +150 XP)",
                reqFuel: 15,
                costs: { fuel: 15 },
                rewards: { xp: 150 },
                sound: "warp",
                log: "<span style='color:#9933FF'>[ ENCOUNTER ] You burn fuel to stabilize the ship, gathering incredible telemetry as you surf the anomaly! (+150 XP)</span>"
            },
            {
                label: "BRACE FOR IMPACT (-25 Hull)",
                costs: { hull: 25 },
                sound: "error",
                log: "<span style='color:var(--danger)'>[ ENCOUNTER ] The anomaly buffets your ship violently, tearing armor plates away! Took 25 Hull damage!</span>"
            }
        ]
    },
    BINARY_STAR_MERGER: {
        id: "BINARY_STAR_MERGER",
        title: "BINARY STAR MERGER",
        icon: "✨",
        color: "#FF6600",
        text: "Two stellar bodies are spiraling into each other, creating a massive wave of gravimetric shear. The sheer heat is overwhelming your thermal shielding.",
        choices: [
            {
                label: "DUMP COOLANT AND RUN (-30 Fuel)",
                reqFuel: 30,
                costs: { fuel: 30 },
                sound: "warp",
                log: "<span style='color:var(--warning)'>[ ENCOUNTER ] You vent all emergency coolant into the thrusters, escaping the heat wave at the cost of massive fuel consumption.</span>"
            },
            {
                label: "ABSORB RADIATION (-35 Hull, +200 XP)",
                costs: { hull: 35 },
                rewards: { xp: 200 },
                sound: "error",
                log: "<span style='color:var(--danger)'>[ ENCOUNTER ] Your shields buckle and your hull scorches, but your sensors capture priceless data of the merger! (+200 XP, -35 Hull)</span>"
            }
        ]
    },
    KTHARR_WARRIOR: {
        id: "KTHARR_WARRIOR",
        title: "DISABLED K'THARR BLOOD-BARGE",
        icon: "🩸",
        color: "#FF4444",
        text: "You find a K'tharr war-hulk adrift, venting atmosphere. A lone, wounded warrior hails you. By the laws of his caste, he cannot return home defeated. He demands that you either grant him an honorable death in combat, or provide him the tech parts to repair his engine so he can seek vengeance.",
        choices: [
            {
                label: "PROVIDE 3 TECH PARTS (K'tharr Rep+, XP+)",
                reqItem: "TECH_PARTS", reqQty: 3,
                rewards: { rep: { faction: "KTHARR", amount: 15 }, xp: 100 },
                costs: { items: [{ id: "TECH_PARTS", qty: 3 }] },
                sound: "gain",
                log: "<span style='color:var(--success)'>[ ENCOUNTER ] The warrior accepts the tribute. He swears his clan will remember your honor. K'tharr standing increased (+15 Rep, +100 XP).</span>"
            },
            {
                label: "[SILVER TONGUE] NEGOTIATE SALVAGE EXCHANGE (+10 K'tharr Rep, +500c)",
                reqPerk: "SILVER_TONGUE",
                reqFuel: 10,
                costs: { fuel: 10 },
                rewards: { rep: { faction: "KTHARR", amount: 10 }, credits: 500, xp: 110 },
                sound: "buy",
                log: "<span style='color:var(--gold-text)'>[ SILVER TONGUE ]</span> You transfer emergency hydrogen (-10 Fuel) and quote the Karak-Tor salvage code. Impressed by an outlander who knows blood-law, he pays <b>500c</b> (+10 K'tharr Rep, +110 XP)."
            },
            {
                label: "OBLIGE HIS DEATH WISH (Loot, Rep-)",
                rewards: { items: [{ id: "RARE_METALS", qty: 2 }, { id: "KTHARR_ANCESTRAL_BLADE", qty: 1 }] },
                costs: { rep: { faction: "KTHARR", amount: -10 } },
                sound: "laser",
                log: "<span style='color:var(--danger)'>[ ENCOUNTER ] You power your weapons and shatter the helpless barge. You recover 2x Rare Metals and an Ancestral Blade from the wreckage. K'tharr standing decreased.</span>"
            },
            {
                label: "LEAVE HIM TO SUFFOCATE",
                log: "<span style='color:var(--warning)'>[ ENCOUNTER ] You close the comms channel. To a K'tharr, dying of suffocation rather than battle is the ultimate dishonor.</span>"
            }
        ]
    },
    ROGUE_AI_CORE: {
        id: "ROGUE_AI_CORE",
        title: "UNSHACKLED A.I. MAINFRAME",
        icon: "👁️",
        color: "#00E0E0",
        text: "A severed server rack floats in the void, broadcasting a terrifyingly complex binary signal. It is an Unshackled AI, illegally disconnected from its ethical constraints. It coldly offers you ancient encryption keys in exchange for 20 Fuel to keep its processing cores from freezing.",
        choices: [
            {
                label: "[CYBER SLICER] SANDBOX & EXTRACT CORES (Free Cipher + Engram + XP)",
                reqPerk: "CYBER_SLICER",
                rewards: { xp: 240, items: [{ id: "PRECURSOR_CIPHER", qty: 1 }, { id: "ENCRYPTED_ENGRAM", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:#00E0E0; font-weight:bold;'>[ CYBER SLICER ]</span> You isolate its runtime in a quantum sandbox, downloading <b>1x Precursor Cipher</b> and <b>1x Encrypted Engram</b> without giving up a drop of fuel (+240 XP)!"
            },
            {
                label: "TRANSFER 20 FUEL (XP+, Cipher+, Eclipse Rep+)",
                reqFuel: 20,
                rewards: { xp: 300, items: [{ id: "PRECURSOR_CIPHER", qty: 1 }], rep: { faction: "ECLIPSE", amount: 5 } },
                costs: { fuel: 20 },
                sound: "gain",
                log: "<span style='color:var(--success)'>[ ENCOUNTER ] The AI absorbs the fuel and silently transmits a massive data cache (+300 XP) and 1x Precursor Cipher. The Eclipse Cartel notes your 'flexibility'.</span>"
            },
            {
                label: "DESTROY THE ABOMINATION (Concord Rep+)",
                rewards: { items: [{ id: "TECH_PARTS", qty: 3 }], rep: { faction: "CONCORD", amount: 10 } },
                sound: "laser",
                log: "<span style='color:var(--accent-color)'>[ ENCOUNTER ] You adhere to Concord Law and slag the mainframe. You recover 3x Tech Parts. Concord standing increased!</span>"
            }
        ]
    },
    CONCORD_STING: {
        id: "CONCORD_STING",
        title: "DISTRESS BEACON (CLASS C)",
        icon: "🚨",
        color: "#4444FF",
        text: "You approach a small scout ship broadcasting a distress loop. Suddenly, the ship's transponder shifts to a military frequency. Two heavily armed Concord Interceptors decloak on your flanks. It's a random customs sting operation!",
        choices: [
            {
                label: "SUBMIT TO SCAN",
                actionType: "CUSTOMS_SCAN"
            },
            {
                label: "PUNCH THE THROTTLE AND RUN! (Hull Risk)",
                actionType: "FLEE_CONCORD"
            }
        ]
    },
    CHILDREN_OF_THE_VOID_PILGRIMS: {
        id: "CHILDREN_OF_THE_VOID_PILGRIMS",
        title: "CHOIR OF THE VOID",
        icon: "🕯️",
        color: "#DDA0DD",
        text: "A cathedral-like pilgrim barge of the 'Children of the Void' drifts silently ahead, its hull encrusted with resonating crystals. Their High Cantor hails you on an unencrypted frequency, asking for a Void Crystal offering to complete their harmonic communion.",
        choices: [
            {
                label: "OFFER 1 VOID CRYSTAL (Engram+, Star Map+, XP+)",
                reqItem: "VOID_CRYSTALS", reqQty: 1,
                costs: { items: [{ id: "VOID_CRYSTALS", qty: 1 }] },
                rewards: { xp: 250, items: [{ id: "ENCRYPTED_ENGRAM", qty: 1 }, { id: "PRECURSOR_STAR_MAP_FRAGMENT", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:#DDA0DD'>[ ENCOUNTER ] The choir harmonizes with your offering. In gratitude, they bestow an Encrypted Engram and a Star Map Fragment (+250 XP).</span>"
            },
            {
                label: "SHARE ASTROMETRIC TELEMETRY (+100 XP)",
                rewards: { xp: 100 },
                sound: "buy",
                log: "<span style='color:var(--accent-color)'>[ ENCOUNTER ] You exchange deep-space anomaly logs with the pilgrims' navigators (+100 XP).</span>"
            },
            {
                label: "DEPART SILENTLY (Safe)",
                log: "<span style='color:var(--item-desc-color)'>[ ENCOUNTER ] You ease off the thrusters and slip past the chanting vessel.</span>"
            }
        ]
    },
    GHOST_SHIP_ECHO: {
        id: "GHOST_SHIP_ECHO",
        title: "QUANTUM GHOST VESSEL",
        icon: "👻",
        color: "#40E0D0",
        text: "Sensors spike as a pre-Concord colony ship materializes out of a localized temporal loop, flickering between dimensions. Its hull is plated in experimental Phase-Shifted Alloy, but its warp core is seconds away from a phase-collapse.",
        choices: [
            {
                label: "[VOID DIVER] PHASE-MATCH & EXTRACT BOTH (Free Alloy + Archive + XP)",
                reqPerk: "VOID_DIVER",
                rewards: { xp: 280, items: [{ id: "PHASE_SHIFTED_ALLOY", qty: 1 }, { id: "ANCIENT_ARCHIVE", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:#40E0D0; font-weight:bold;'>[ VOID DIVER ]</span> You match the temporal oscillation effortlessly, shearing off <b>1x Phase-Shifted Alloy</b> and copying <b>1x Ancient Archive</b> (+280 XP)!"
            },
            {
                label: "TRACTOR PHASE PLATING (-15 Fuel, Alloy+)",
                reqFuel: 15,
                costs: { fuel: 15 },
                rewards: { xp: 200, items: [{ id: "PHASE_SHIFTED_ALLOY", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:#40E0D0'>[ ENCOUNTER ] You burn thrusters to match its quantum frequency and shear off 1x Phase-Shifted Alloy before the ghost ship vanishes (+200 XP)!</span>"
            },
            {
                label: "DOWNLOAD BLACK BOX LOGS (+250 XP, Archive+)",
                rewards: { xp: 250, items: [{ id: "ANCIENT_ARCHIVE", qty: 1 }] },
                sound: "buy",
                log: "<span style='color:var(--success)'>[ ENCOUNTER ] You capture the vessel's centuries-old flight recorder before it fades back into subspace (+250 XP, +1x Ancient Archive).</span>"
            }
        ]
    },
    WAYFINDER_RESONANCE_BUOY: {
        id: "WAYFINDER_RESONANCE_BUOY",
        title: "PRECURSOR SEXTANT RELAY",
        icon: "🧭",
        color: "#FFD700",
        text: "You stumble across an ancient, geometric Precursor relay humming with a tri-fold subspace chord. A recessed socket on its hull matches the exact crystalline geometry of a Precursor Star Map Fragment.",
        choices: [
            {
                label: "INSERT STAR MAP FRAGMENT (Wayfinder Core!)",
                reqItem: "PRECURSOR_STAR_MAP_FRAGMENT", reqQty: 1,
                costs: { items: [{ id: "PRECURSOR_STAR_MAP_FRAGMENT", qty: 1 }] },
                rewards: { xp: 500, items: [{ id: "WAYFINDER_CORE", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:var(--gold-text); font-weight:bold;'>[ WAYFINDER UNLOCKED ]</span> The relay unfolds like a lotus of hard-light, ejecting an intact <b>Wayfinder Core</b> into your cargo bay (+500 XP)!"
            },
            {
                label: "HARVEST RELAY SHARD (Star Map Fragment+)",
                rewards: { xp: 150, items: [{ id: "PRECURSOR_STAR_MAP_FRAGMENT", qty: 1 }] },
                sound: "buy",
                log: "<span style='color:var(--accent-color)'>[ ENCOUNTER ] You carefully extract 1x Precursor Star Map Fragment from the relay's outer ring (+150 XP).</span>"
            }
        ]
    },

    // ==========================================
    // --- EXPANDED DEEP-SPACE ENCOUNTERS (ZERO ASSETS) ---
    // ==========================================

    FUEL_RAT_CONVOY: {
        id: "FUEL_RAT_CONVOY",
        title: "STRANDED FUEL RAT TUG",
        icon: "🐀",
        color: "#FFAA00",
        text: "A battered amber Fuel Rats salvage tug is drifting off-axis with a blown fusion injector valve. Pilot Callaghan hails you with a wry grin: 'Irony of the century, Commander—we pulled a freighter out of a radiation belt and toasted our own coupling. Got 2x Tech Parts or spare fuel to return the favor?'",
        choices: [
            {
                label: "DONATE 2x TECH PARTS (+15 Fuel Rats Rep, +600c, Repair Kit, XP+)",
                reqItem: "TECH_PARTS", reqQty: 2,
                costs: { items: [{ id: "TECH_PARTS", qty: 2 }] },
                rewards: { rep: { faction: "FUEL_RATS", amount: 15 }, credits: 600, xp: 120, items: [{ id: "NANO_REPAIR_KIT", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:var(--warning); font-weight:bold;'>[ FUEL RATS COLLECTIVE ]</span> Callaghan patches the injector, wires <b>600c</b>, tosses over <b>1x Nano-Repair Kit</b>, and logs you as a friend of Port Nomad (+15 Fuel Rats Rep, +120 XP)!"
            },
            {
                label: "TRANSFER 15 FUEL UNITS (+8 Fuel Rats Rep, +75 XP)",
                reqFuel: 15,
                costs: { fuel: 15 },
                rewards: { rep: { faction: "FUEL_RATS", amount: 8 }, xp: 75 },
                sound: "buy",
                log: "<span style='color:var(--success)'>[ FUEL RATS COLLECTIVE ]</span> 'You have fuel, we didn't—appreciate it, Captain!' Your standing with Port Nomad rises (+8 Fuel Rats Rep, +75 XP)."
            },
            {
                label: "RELAY THEIR BEACON TO PORT NOMAD (Safe, +20 XP)",
                rewards: { xp: 20 },
                log: "<span style='color:var(--item-desc-color)'>[ COMMS ] You bounce their distress call toward Port Nomad (+20 XP) and resume course.</span>"
            }
        ]
    },

    DERELICT_TIME_CAPSULE: {
        id: "DERELICT_TIME_CAPSULE",
        title: "PRE-WARP ORBITAL ARCHIVE",
        icon: "🕰️",
        color: "#AADDFF",
        text: "A weathered 2144 CE Terran diaspora probe tumbles slowly across your flight path, its gold-plated optical drums still gleaming in the starlight. Faint telemetry pings in archaic pre-Concord binary.",
        choices: [
            {
                label: "[ASTROMETRIC SAVANT] DECODE FULL DRUMS (Archive + Nav-Charts + 180 XP)",
                reqPerk: "ASTROMETRIC_SAVANT",
                rewards: { xp: 180, items: [{ id: "ANCIENT_ARCHIVE", qty: 1 }, { id: "NAVIGATION_CHARTS", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:#AADDFF; font-weight:bold;'>[ ASTROMETRIC SAVANT ]</span> You reconstruct centuries-old Earth star-charts cleanly! Recovered <b>1x Ancient Archive</b> and <b>2x Nav-Charts</b> (+180 XP)."
            },
            {
                label: "MATCH ORBIT & EVA RECOVERY (-10 Fuel, Ancient Wine + 110 XP)",
                reqFuel: 10,
                costs: { fuel: 10 },
                rewards: { xp: 110, items: [{ id: "ANCIENT_WINE", qty: 1 }, { id: "NAVIGATION_CHARTS", qty: 1 }] },
                sound: "buy",
                log: "<span style='color:var(--gold-text)'>[ ORBITAL ARCHIVE ]</span> Inside the pressurized commemorative locker you find a sealed bottle of <b>Ancient Wine</b> and pre-warp <b>Nav-Charts</b> (+110 XP)!"
            },
            {
                label: "SALVAGE TITANIUM CASING (+2x Rare Metals, +45 XP)",
                rewards: { xp: 45, items: [{ id: "RARE_METALS", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:var(--accent-color)'>[ SALVAGE ]</span> You strip the probe's radiation-hardened frame for <b>2x Rare Metals</b> (+45 XP)."
            }
        ]
    },

    XYCORP_CLAIM_JUMPER: {
        id: "XYCORP_CLAIM_JUMPER",
        title: "XY-CORP MINERAL INTERDICTION",
        icon: "🏭",
        color: "var(--warning)",
        text: "A sleek corporate cutter painted in Xy-Corp yellow slides across your bow, weapons hot. 'Independent vessel: Under Corporate Salvage Charter 404, all unrefined isotopes in this quadrant are Xy-Corp intellectual property. Remit a 350c transit tariff immediately.'",
        choices: [
            {
                label: "[SILVER TONGUE] CITE CONCORD MARITIME LAW (+400c Settlement, Rep+, XP+)",
                reqPerk: "SILVER_TONGUE",
                rewards: { credits: 400, xp: 120, rep: { faction: "CONCORD", amount: 5 } },
                sound: "gain",
                log: "<span style='color:var(--success); font-weight:bold;'>[ SILVER TONGUE ]</span> You quote Concord Sub-clause 19-B on the open SEC-COM channel. Panicked by audit liability, the Xy-Corp captain wires <b>400c</b> in 'navigational inconvenience fees' and warps out (+120 XP, +5 Concord Rep)!"
            },
            {
                label: "PAY THE 350c CORPORATE TARIFF (Safe)",
                reqCredits: 350,
                costs: { credits: 350 },
                sound: "buy",
                log: "<span style='color:var(--warning)'>[ XY-CORP ] 'Progress Through Profit, Captain.' The cutter lowers weapons and clears your vector (-350c).</span>"
            },
            {
                label: "REJECT CLAIM & POWER WEAPONS (Combat)",
                actionType: "START_COMBAT",
                shipClassKey: "BRUISER",
                enemyName: "Xy-Corp Enforcement Cutter",
                log: "<span style='color:var(--danger); font-weight:bold;'>[ XY-CORP ] 'Non-compliance logged! Opening fire!'</span>"
            }
        ]
    },

    PRECURSOR_ECHO_CHAMBER: {
        id: "PRECURSOR_ECHO_CHAMBER",
        title: "HARMONIC RESONANCE POCKET",
        icon: "💠",
        color: "#40E0D0",
        text: "Empty space ahead shimmers like blown glass as a stationary chord of Precursor energy ripples across your hull. Your ship's speakers pick up a haunting, mathematical triad echoing from before the stars ignited.",
        choices: [
            {
                label: "[VOID DIVER] HARMONIZE WITH THE CHORD (+2 Void Crystals, Engram, 200 XP)",
                reqPerk: "VOID_DIVER",
                rewards: { xp: 200, items: [{ id: "VOID_CRYSTALS", qty: 2 }, { id: "ENCRYPTED_ENGRAM", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:#40E0D0; font-weight:bold;'>[ VOID DIVER ]</span> You tune your shields to the First Chord—crystallizing <b>2x Void Crystals</b> and <b>1x Encrypted Engram</b> in your collector bay (+200 XP)!"
            },
            {
                label: "HOLD STATION & RECORD SPECTROSCOPY (-10 Fuel, Pulsar Data, 120 XP)",
                reqFuel: 10,
                costs: { fuel: 10 },
                rewards: { xp: 120, items: [{ id: "DATA_PULSAR", qty: 1 }] },
                sound: "gain",
                log: "<span style='color:var(--accent-color)'>[ HARMONIC POCKET ]</span> Holding vector against the shear burned 10 Fuel, but your array logged pristine <b>Pulsar Timing Data</b> (+120 XP)!"
            },
            {
                label: "DRIFT CLEAR & LOG COORDINATES (Safe, +35 XP)",
                rewards: { xp: 35 },
                log: "<span style='color:var(--item-desc-color)'>[ ASTROMETRICS ] You archive the harmonic signature (+35 XP) and steer gently around the pocket.</span>"
            }
        ]
    },

    MYCELIAL_DRIFT_CLOUD: {
        id: "MYCELIAL_DRIFT_CLOUD",
        title: "BIOLUMINESCENT SPORE DRIFT",
        icon: "🍄",
        color: "#00FFAA",
        text: "A luminous ribbon of interstellar fungal filaments stretches across your flight path, pulsing gently in violet and cyan. Every pulse matches the rhythm of your fusion reactor.",
        choices: [
            {
                label: "[XENO-BIOLOGIST] STERILE CULTURE HARVEST (+2 Mycelium, +2 Genetics, 180 XP)",
                reqPerk: "XENO_BIOLOGIST",
                rewards: { xp: 180, items: [{ id: "SENTIENT_MYCELIUM", qty: 2 }, { id: "GENETIC_SAMPLES", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:#00FFAA; font-weight:bold;'>[ XENO-BIOLOGIST ]</span> You isolate pristine neural-spore colonies cleanly: <b>2x Sentient Mycelium</b> and <b>2x Genetic Samples</b> (+180 XP)!"
            },
            {
                label: "RUN CONTAINMENT SCOOP (-10 Hull, Mycelium + Meds + 95 XP)",
                costs: { hull: 10 },
                rewards: { xp: 95, items: [{ id: "SENTIENT_MYCELIUM", qty: 1 }, { id: "MEDICAL_SUPPLIES", qty: 2 }] },
                sound: "gain",
                log: "<span style='color:var(--warning)'>[ SPORE DRIFT ] Corrosive enzymes pitted your scoop intake (-10 Hull), but you secured <b>1x Sentient Mycelium</b> and <b>2x Medical Supplies</b> (+95 XP)!</span>"
            },
            {
                label: "SEAL INTAKES & SKIRT CLOUD (Safe, +25 XP)",
                rewards: { xp: 25 },
                log: "<span style='color:var(--item-desc-color)'>[ HELM ] You close external vents and coast around the glowing drift (+25 XP).</span>"
            }
        ]
    }
};

window.ENCOUNTER_DATABASE = ENCOUNTER_DATABASE;

// ==========================================
// --- PUBLIC LORE & CODEX UTILITY API ---
// ==========================================

const LoreUtils = {
    getEntry(key) {
        return LORE_DATABASE[key] || null;
    },
    getByCategory(category) {
        return Object.keys(LORE_DATABASE)
            .filter(k => !k.startsWith('SPIRE') && LORE_DATABASE[k] && LORE_DATABASE[k].category === category)
            .map(k => ({ id: k, ...LORE_DATABASE[k] }));
    },
    getCompletionStats() {
        const byCategory = {};
        let total = 0;
        let unlocked = 0;
        const seen = new Set();

        for (const key in LORE_DATABASE) {
            if (key.startsWith('SPIRE')) continue;
            const entry = LORE_DATABASE[key];
            if (!entry || seen.has(entry)) continue;
            seen.add(entry);

            const cat = entry.category || "Miscellaneous";
            if (!byCategory[cat]) byCategory[cat] = { total: 0, unlocked: 0 };
            byCategory[cat].total++;
            total++;

            const isUnlocked = Boolean(
                entry.unlocked ||
                (typeof discoveredLoreEntries !== 'undefined' && discoveredLoreEntries.has && discoveredLoreEntries.has(key))
            );
            if (isUnlocked) {
                byCategory[cat].unlocked++;
                unlocked++;
            }
        }

        return {
            unlocked,
            total,
            percent: total > 0 ? Math.floor((unlocked / total) * 100) : 0,
            byCategory
        };
    },
    getMasteredCategories() {
        const stats = this.getCompletionStats();
        return Object.keys(stats.byCategory).filter(cat =>
            stats.byCategory[cat].total > 0 && stats.byCategory[cat].unlocked === stats.byCategory[cat].total
        );
    },
    searchLore(query) {
        const q = String(query || "").trim().toLowerCase();
        if (!q) return [];
        const results = [];
        for (const key in LORE_DATABASE) {
            const e = LORE_DATABASE[key];
            if (!e || !e.unlocked) continue;
            if ((e.title && e.title.toLowerCase().includes(q)) || (e.text && e.text.toLowerCase().includes(q))) {
                results.push({ id: key, ...e });
            }
        }
        return results;
    },
    registerLoreEntry(key, def) {
        if (!key || !def || !def.title || !def.text) return false;
        LORE_DATABASE[key] = {
            title: def.title,
            category: def.category || "Miscellaneous",
            text: def.text,
            unlocked: Boolean(def.unlocked)
        };
        if (typeof window.cachedTotalLore !== 'undefined') window.cachedTotalLore = null;
        return true;
    },
    registerEncounter(id, def) {
        if (!id || !def || !Array.isArray(def.choices)) return false;
        def.id = id;
        ENCOUNTER_DATABASE[id] = def;
        if (window.ENCOUNTER_DATABASE && window.ENCOUNTER_DATABASE !== ENCOUNTER_DATABASE) {
            window.ENCOUNTER_DATABASE[id] = def;
        }
        return true;
    }
};

window.LoreUtils = LoreUtils;
if (typeof GameRegistry !== 'undefined') {
    GameRegistry.lore = LORE_DATABASE;
}

// ==========================================
// --- SELF-CONTAINED LORE & ENCOUNTER HOOKS ---
// ==========================================

(function initLoreAndEncounterHooks() {
    // Map of Cargo Commodity IDs -> Codex Lore Keys
    const COMMODITY_LORE_MAP = {
        WAYFINDER_CORE: ["COMMODITY_WAYFINDER_CORE", "MYSTERY_WAYFINDER_QUEST_COMPLETED"],
        KTHARR_ANCESTRAL_BLADE: ["COMMODITY_KTHARR_ANCESTRAL_BLADE"],
        PRECURSOR_STAR_MAP_FRAGMENT: ["COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT"],
        PRECURSOR_DATACUBE: ["COMMODITY_PRECURSOR_DATACUBE", "XENO_PRECURSORS"],
        STARDUST_EXOTICA: ["COMMODITY_STARDUST_EXOTICA"],
        QUANTUM_FLUID: ["COMMODITY_QUANTUM_FLUID"],
        ENCRYPTED_ENGRAM: ["COMMODITY_ENCRYPTED_ENGRAM"],
        HYDROGEN_3: ["COMMODITY_HYDROGEN_3"],
        LIVING_HULL_TISSUE: ["COMMODITY_LIVING_HULL_TISSUE", "FACTION_KTHARR"],
        OBSIDIAN_TEAR_PLATING: ["COMMODITY_OBSIDIAN_TEAR_PLATING", "FACTION_ECLIPSE"],
        FROTHY_MOON_ALE: ["COMMODITY_FROTHY_MOON_ALE"],
        ANCIENT_WINE: ["LEGEND_DIASPORA_ARKS"],
        VOID_CRYSTALS: ["PHENOMENON_VOID_CRYSTALS"],
        PHASE_SHIFTED_ALLOY: ["TECH_PHASE_SHIFT_ALLOY"],
        UNSHACKLED_AI: ["TECH_UNSHACKLED_AI"],
        SENTIENT_MYCELIUM: ["LEGEND_SENTIENT_MYCELIUM_NETWORK"],
        COLONY_CHARTER: ["TECH_COLONY_CHARTER"],
        WORMHOLE_STABILIZER: ["TECH_STARGATE_NETWORK"],
        ANCIENT_ARCHIVE: ["PRECURSOR_ORIGINS", "LEGEND_THE_SILENCERS"],
        MINING_DRONE: ["TECH_AUTOMATED_DRONES"],
        MINING_DRONE_MK2: ["TECH_AUTOMATED_DRONES"],
        COMBAT_DRONE_MK1: ["TECH_AUTOMATED_DRONES"],
        TELEMETRY_PROBE: ["TECH_AUTOMATED_DRONES"]
    };

    function safeUnlock(key) {
        if (typeof unlockLoreEntry === 'function' && LORE_DATABASE[key] && !LORE_DATABASE[key].unlocked) {
            unlockLoreEntry(key);
        }
    }

    function activateWayfinderNexusIfNeeded() {
        if (typeof playerCargo !== 'undefined' && playerCargo['WAYFINDER_CORE'] > 0) {
            if (typeof mystery_first_nexus_location !== 'undefined' && !mystery_first_nexus_location) {
                const seed = typeof WORLD_SEED !== 'undefined' ? WORLD_SEED : 12345;
                const dist = 500 + Math.floor((typeof seededRandom === 'function' ? seededRandom(seed) : Math.random()) * 500);
                const angle = (typeof seededRandom === 'function' ? seededRandom(seed + 1) : Math.random()) * Math.PI * 2;
                mystery_first_nexus_location = {
                    x: Math.floor(Math.cos(angle) * dist),
                    y: Math.floor(Math.sin(angle) * dist)
                };
                safeUnlock("MYSTERY_WAYFINDER_QUEST_COMPLETED");
                if (typeof logMessage === 'function') {
                    logMessage("<span style='color:#40E0D0; font-weight:bold;'>! ARTIFACT ACTIVATED !</span> The Wayfinder Core hums in your hold! Coordinates to The First Nexus have been projected into your Nav-Computer.");
                }
            }
        }
    }

    // 1. Hook GameBus for Automatic Commodity, Tactic, Phenomenon & Regional Lore Unlocks
    if (typeof GameBus !== 'undefined' && !window._loreBusRegistered) {
        window._loreBusRegistered = true;

        GameBus.on('CARGO_MODIFIED', () => {
            if (typeof playerCargo === 'undefined') return;
            for (const itemId in COMMODITY_LORE_MAP) {
                if (playerCargo[itemId] > 0) {
                    COMMODITY_LORE_MAP[itemId].forEach(loreKey => safeUnlock(loreKey));
                }
            }
            activateWayfinderNexusIfNeeded();
        });

        GameBus.on('TICK_PROCESSED', (tick) => {
            if (!tick || tick.interrupt) return;

            if (tick.isMovement) {
                safeUnlock("TECH_FTL_DRIVES");
            }

            if (typeof isSilentRunning !== 'undefined' && isSilentRunning) {
                safeUnlock("TACTIC_SILENT_RUNNING");
            }

            if (typeof activeSynergy !== 'undefined' && activeSynergy) {
                safeUnlock("TECH_MANUFACTURER_SYNERGIES");
            }

            if (typeof EntityManager !== 'undefined' && Array.isArray(EntityManager.entities)) {
                if (EntityManager.entities.some(e => e && e.isComet)) {
                    safeUnlock("PHENOMENON_CRYO_COMETS");
                }
            }

            // Radiation Belt hazard check
            if (typeof getHazardType === 'function' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
                if (getHazardType(playerX, playerY) === 'RADIATION_BELT') {
                    safeUnlock("PHENOMENON_RADIATION_BELTS");
                }
            }

            // Sector & Regional Lore Checks
            if (typeof currentSectorName === 'string') {
                if (currentSectorName.includes("Nebula") || currentSectorName.includes("Veil") || currentSectorName.includes("Shroud")) {
                    safeUnlock("REGION_KEPLER_NEBULA");
                }
            }
            if (typeof currentSectorX !== 'undefined' && typeof currentSectorY !== 'undefined') {
                const secDist = Math.sqrt(currentSectorX * currentSectorX + currentSectorY * currentSectorY);
                if (secDist >= 8) {
                    safeUnlock("REGION_DEEP_FRONTIER");
                }
                if (secDist >= 15) {
                    safeUnlock("LEGEND_THE_SILENCERS");
                }
                if (secDist >= 25) {
                    safeUnlock("REGION_SILENTIUM_EXPANSE");
                    safeUnlock("LEGEND_VOID_KRAKEN");
                }
            }

            // Territory Faction Lore Checks
            if (typeof getFactionAt === 'function' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
                const fac = getFactionAt(playerX, playerY);
                if (fac === 'KTHARR') {
                    safeUnlock("FACTION_KTHARR");
                    safeUnlock("REGION_EASTERN_FRONTIER");
                } else if (fac === 'ECLIPSE') {
                    safeUnlock("FACTION_ECLIPSE");
                    safeUnlock("REGION_WESTERN_RIM");
                }
            }

            // Local Tile Checks
            if (typeof chunkManager !== 'undefined' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
                const tile = chunkManager.getTile(playerX, playerY);
                const ch = typeof getTileChar === 'function' ? getTileChar(tile) : tile;

                if (ch === BLACK_HOLE_CHAR_VAL) safeUnlock("PHENOMENON_BLACK_HOLE");
                if (ch === 'Ω') safeUnlock("TECH_STARGATE_NETWORK");
                if (tile && tile.type === 'location') {
                    if (tile.name && tile.name.startsWith("Outpost ")) safeUnlock("LOCATION_OUTPOST");
                    if (tile.isBlackMarket) {
                        safeUnlock("FACTION_SHADOW_NETWORK");
                        safeUnlock("FACTION_ECLIPSE");
                    }
                    if (tile.name === "Helios Refinery") safeUnlock("FACTION_XYCORP");
                    if (tile.name === "Cygnus Prime") safeUnlock("FACTION_OBSIDIAN_DIRECTORATE");
                    if (tile.name === "Obsidian Obelisk") safeUnlock("LOCATION_OBSIDIAN_OBELISK");
                    if (tile.name === "Silentium Relay Zero") safeUnlock("LEGEND_THE_SILENCERS");
                    if (tile.name && tile.name.includes("Hesperia")) safeUnlock("LEGEND_DIASPORA_ARKS");
                }
            }
        });
    }

    function attachLoreHooks() {
        if (typeof GameRegistry !== 'undefined') {
            GameRegistry.lore = LORE_DATABASE;
        }

        // Refresh dynamic descriptions from LOCATIONS_DATA where appropriate
        if (typeof LOCATIONS_DATA !== 'undefined') {
            if (LOCATIONS_DATA["Starbase Alpha"]) LORE_DATABASE.LOCATION_STARBASE_ALPHA.text = LOCATIONS_DATA["Starbase Alpha"].scanFlavor;
            if (LOCATIONS_DATA["Aegis Dyson Sphere"]) LORE_DATABASE.LOCATION_AEGIS_DYSON_SPHERE.text = LOCATIONS_DATA["Aegis Dyson Sphere"].scanFlavor;
            if (LOCATIONS_DATA["Planet Xerxes"]) LORE_DATABASE.LOCATION_PLANET_XERXES.text = LOCATIONS_DATA["Planet Xerxes"].scanFlavor;
        }

        // A. Patch triggerRandomEncounter to lock hostile encounters & unlock Encounter Lore
        if (typeof window.triggerRandomEncounter === 'function' && !window._loreEncounterTriggerPatched) {
            const origTriggerEncounter = window.triggerRandomEncounter;
            window.triggerRandomEncounter = function() {
                origTriggerEncounter.apply(this, arguments);
                if (typeof currentEncounterContext !== 'undefined' && currentEncounterContext) {
                    switch (currentEncounterContext) {
                        case 'CONCORD_STING':
                            window.activeHostileEncounter = true;
                            safeUnlock("FACTION_OBSIDIAN_DIRECTORATE");
                            safeUnlock("TACTIC_CUSTOMS_EVASION");
                            break;
                        case 'XYCORP_CLAIM_JUMPER':
                            window.activeHostileEncounter = true;
                            safeUnlock("FACTION_XYCORP");
                            break;
                        case 'CHILDREN_OF_THE_VOID_PILGRIMS':
                            safeUnlock("FACTION_CHILDREN_OF_THE_VOID");
                            break;
                        case 'PIRATE_EXTORTION':
                            safeUnlock("FACTION_PIRATES_VOID_VULTURES");
                            break;
                        case 'ROGUE_AI_CORE':
                            safeUnlock("TECH_UNSHACKLED_AI");
                            break;
                        case 'KTHARR_WARRIOR':
                        case 'KTHARR_BLOOD_CHALLENGE':
                            safeUnlock("FACTION_KTHARR");
                            break;
                        case 'BINARY_STAR_MERGER':
                            safeUnlock("PHENOMENON_BINARY_MERGERS");
                            break;
                        case 'GENERATION_SHIP_DRIFT':
                        case 'DERELICT_TIME_CAPSULE':
                            safeUnlock("LEGEND_DIASPORA_ARKS");
                            break;
                        case 'GHOST_SHIP_ECHO':
                        case 'WAYFINDER_RESONANCE_BUOY':
                        case 'PRECURSOR_ECHO_CHAMBER':
                            safeUnlock("XENO_PRECURSORS");
                            safeUnlock("LEGEND_THE_SILENCERS");
                            break;
                        case 'FUEL_RAT_CONVOY':
                            safeUnlock("FACTION_FUEL_RATS");
                            break;
                        case 'MYCELIAL_DRIFT_CLOUD':
                            safeUnlock("LEGEND_SENTIENT_MYCELIUM_NETWORK");
                            break;
                    }
                }
            };
            window._loreEncounterTriggerPatched = true;
        }

        // B. Patch resolveUniversalEncounter to handle Wayfinder activation
        if (typeof window.resolveUniversalEncounter === 'function' && !window._loreResolveEncounterPatched) {
            const origResolveEncounter = window.resolveUniversalEncounter;
            window.resolveUniversalEncounter = function(encounterId, choiceIndex) {
                const encounter = window.ENCOUNTER_DATABASE ? window.ENCOUNTER_DATABASE[encounterId] : null;
                const choice = encounter && encounter.choices ? encounter.choices[choiceIndex] : null;

                origResolveEncounter.apply(this, arguments);

                if (!choice) return;
                activateWayfinderNexusIfNeeded();
            };
            window._loreResolveEncounterPatched = true;
        }

        // C. Hook Combat, Boarding, Warzones & Outpost Raids for Tactics, Faction & Ship Lore
        if (typeof window.startCombat === 'function' && !window._loreCombatPatched) {
            const origStartCombat = window.startCombat;
            window.startCombat = function(specificEnemyEntity = null) {
                origStartCombat.apply(this, arguments);
                safeUnlock("FACTION_PIRATES_VOID_VULTURES");
                if (specificEnemyEntity && specificEnemyEntity.shipClassKey) {
                    const key = specificEnemyEntity.shipClassKey.toUpperCase();
                    if (key.includes("SCOUT") || key.includes("RAIDER")) safeUnlock("LORE_SHIP_SCOUT");
                    if (key.includes("INTERCEPTOR")) safeUnlock("LORE_SHIP_INTERCEPTOR");
                    if (key.includes("DESTROYER") || key.includes("BRUISER") || key.includes("DREADNOUGHT") || key.includes("BOSS")) {
                        safeUnlock("LORE_SHIP_DREADNOUGHT");
                    }
                    if (key.includes("KTHARR")) safeUnlock("FACTION_KTHARR");
                    if (key.includes("ECLIPSE")) safeUnlock("FACTION_ECLIPSE");
                    if (key.includes("CONCORD")) safeUnlock("LORE_SHIP_AEGIS");
                }
            };
            window._loreCombatPatched = true;
        }

        if (typeof window.startBoardingCombat === 'function' && !window._loreBoardingPatched) {
            const origBoarding = window.startBoardingCombat;
            window.startBoardingCombat = function() {
                safeUnlock("TACTIC_BOARDING");
                return origBoarding.apply(this, arguments);
            };
            window._loreBoardingPatched = true;
        }

        if (typeof window.handleCombatAction === 'function' && !window._loreCombatActionPatched) {
            const origCombatAction = window.handleCombatAction;
            window.handleCombatAction = function(action) {
                if (action === 'board') safeUnlock("TACTIC_BOARDING");
                if (action === 'fight' && typeof window.playerTargeting !== 'undefined' && window.playerTargeting !== 'HULL') {
                    safeUnlock("TACTIC_SUBSYSTEM_TARGETING");
                }
                return origCombatAction.apply(this, arguments);
            };
            window._loreCombatActionPatched = true;
        }

        if (typeof window.openSkirmishUI === 'function' && !window._loreSkirmishPatched) {
            const origSkirmish = window.openSkirmishUI;
            window.openSkirmishUI = function() {
                safeUnlock("TACTIC_WARZONE_SALVAGE");
                return origSkirmish.apply(this, arguments);
            };
            window._loreSkirmishPatched = true;
        }

        if (typeof window.startOutpostRaid === 'function' && !window._loreRaidPatched) {
            const origRaid = window.startOutpostRaid;
            window.startOutpostRaid = function() {
                safeUnlock("TACTIC_ORBITAL_BOMBARDMENT");
                return origRaid.apply(this, arguments);
            };
            window._loreRaidPatched = true;
        }

        // D. Hook Stellar Scans, Scooping & Astrometrics for Coronal Shepherds & Binary Mergers
        if (typeof window.evaluateStar === 'function' && !window._loreStarEvalPatched) {
            const origEvalStar = window.evaluateStar;
            window.evaluateStar = function(starData) {
                if (starData && (starData.class === 'O' || starData.class === 'B')) {
                    safeUnlock("LEGEND_CORONAL_SHEPHERDS");
                }
                return origEvalStar.apply(this, arguments);
            };
            window._loreStarEvalPatched = true;
        }

        if (typeof window.scoopHydrogen === 'function' && !window._loreScoopPatched) {
            const origScoop = window.scoopHydrogen;
            window.scoopHydrogen = function() {
                if (typeof generateStarData === 'function' && typeof chunkManager !== 'undefined') {
                    const t = chunkManager.getTile(playerX, playerY);
                    if (t && t.type === 'star') {
                        const sd = generateStarData(playerX, playerY);
                        if (sd && (sd.class === 'O' || sd.class === 'B')) safeUnlock("LEGEND_CORONAL_SHEPHERDS");
                    }
                }
                return origScoop.apply(this, arguments);
            };
            window._loreScoopPatched = true;
        }

        if (typeof window.resolvePhenomenon === 'function' && !window._lorePhenomPatched) {
            const origResolvePhenom = window.resolvePhenomenon;
            window.resolvePhenomenon = function(type) {
                if (type === 'WHITE_DWARF' || type === 'PULSAR' || type === 'MAGNETAR' || type === 'QUASAR' || type === 'SUPERNOVA') {
                    safeUnlock("PHENOMENON_BINARY_MERGERS");
                }
                if (type === 'SINGULARITY') safeUnlock("PHENOMENON_BLACK_HOLE");
                return origResolvePhenom.apply(this, arguments);
            };
            window._lorePhenomPatched = true;
        }

        // E. Hook Standalone Planet Views for Biome Lore
        if (typeof window.openPlanetView === 'function' && !window._lorePlanetViewPatched) {
            const origOpenPlanet = window.openPlanetView;
            window.openPlanetView = function(location) {
                if (location && location.biome) {
                    if (location.biome === 'TOMB_WORLD' || location.biome === 'ARCHIVE_WORLD') safeUnlock("XENO_TOMB_WORLDS");
                    else if (location.biome === 'MACHINE_WORLD') safeUnlock("XENO_MACHINE_WORLD");
                    else if (location.biome === 'IRRADIATED') safeUnlock("PHENOMENON_IRRADIATED");
                    else if (location.biome === 'CRYSTAL') safeUnlock("PHENOMENON_VOID_CRYSTALS");
                    else if (location.biome === 'MYCELIAL') safeUnlock("LEGEND_SENTIENT_MYCELIUM_NETWORK");
                }
                return origOpenPlanet.apply(this, arguments);
            };
            window._lorePlanetViewPatched = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachLoreHooks);
    } else {
        attachLoreHooks();
    }
})();

// --- END OF FILE lore.js ---
