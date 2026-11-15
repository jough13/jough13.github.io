// --- START OF FILE rumors.js ---

const RUMORS = [
    // ==========================================
    // --- GALACTIC LORE & MYSTERIES ---
    // ==========================================
    "Captain 'Voidfang' still plagues the Kepler Nebula. They say her ship, the 'Nightreaver', is faster than any Concord patrol, and she's looking for a legendary Precursor map that leads to the 'Silentium Expanse'. She supposedly has a K'tharr first mate, a disgraced warrior seeking redemption, who knows the old K'tharr star-paths. Some say she's already found a Precursor Star Map Fragment, and is seeking more to complete a 'Cosmic Sextant' that might point to the Precursor homeworld itself.",
    "That derelict capital ship in Gamma-7? Some say it's a 'Precursor' vessel, others claim it's a military ghost from the old Terran Wars, its AI still active and hostile. A few brave souls tried to board it... none returned. They say it 'sings' on subspace frequencies, a song of madness that lures ships to their doom. One survivor, driven mad, babbled about 'eyes in the dark' and a 'heart of void crystal' pulsing within the wreck.",
    "Young stars in the Orion Spur sectors often have asteroid belts rich in Iridium. Risky, but profitable. Watch for claim jumpers and the K'tharr mining guilds, who consider those belts sacred ground, burial sites of their ancestors. They guard them fiercely and are known to use phase-cloaked mines. They say some asteroids there are not asteroids at all, but dormant K'tharr bio-weapons or eggs of stellar creatures. One K'tharr elder was heard muttering about 'the waking of the Sky-Serpents' if the belts are disturbed too much.",
    "The K'tharr Hegemony is tightening its borders near the Serpentis Cluster. Fuel prices might spike if their trade routes are disrupted. They don't take kindly to outsiders, especially those carrying 'Forbidden Texts' or Precursor tech, which they deem 'unholy corruptions' that led to the Precursors' downfall. Their 'Void Priests' preach of a coming cleansing, and they're actively hunting for K'tharr Ancestral Blades stolen by 'infidels', believing each blade holds a piece of their collective soul and is needed for a ritual to 're-align the Sky-Gods'.",
    "The research team near the 'Whispering Anomaly' in Sector (-1, 4)? Vanished. Some say they found something they shouldn't have, something that... whispered back, promising power. Their last garbled transmission mentioned 'opening the way' to a 'realm of pure thought' and 'the entities beyond the veil of stars'. One crewman was found catatonic, clutching a Void Crystal, his mind shattered, muttering about 'star-songs' and 'the geometry of fear'.",
    "Starbase Alpha is offering bounties for information on pirate activity in the outer rim sectors. Concord's reach is long, but not infinite. They're particularly interested in any 'Voidfang' sightings and the location of her hidden base, rumored to be inside a hollowed-out asteroid cloaked with Precursor tech, possibly using Phase-Shifted Alloy. They also want any recovered K'tharr Ancestral Blades, no questions asked... well, few questions, and a hefty 'processing fee'. Rumor has it, the Obsidian Directorate wants the blades for more than just museum pieces.",
    "Artifact Shards are fetching high prices on the black market. Collectors are obsessed with 'Precursor' tech, believing it holds the key to FTL without Dilithium. The University of Cygnus Prime pays even more for intact Datacubes, hoping to unlock their secrets before the Concord classifies them as 'restricted knowledge' under the Galactic Security Act. They say one Datacube contains the location of a Precursor library, or a weapon of unimaginable power, perhaps even the schematics for a 'world-killer' or a 'reality-anchor'.",
    "Blue giants offer rich hydrogen, but their solar flares can fry your systems if you're not careful. Lost a good friend that way, chasing a 'perfect scoop'. He swore he saw ships dancing in the corona, made of pure light, beckoning him closer. Some say they are stellar elementals, ancient beings of pure energy, or perhaps Precursor guardians of sacred stars, still active after millennia. One Children of the Void text refers to them as 'Coronal Shepherds'.",
    "Heard a distress call from a mining outpost in Sector (2,5). Something about 'crystal entities' awakening in the deep mines. Sounded like a tall tale, but the outpost went silent shortly after. Concord has quarantined the sector, calling it a 'geological event', but survivors whisper of crystalline horrors that absorb energy and replicate, possibly a form of silicon-based life or a Precursor terraforming experiment gone wrong. They say the crystals 'sing' before they strike.",
    "The 'Silentium Expanse' beyond Sector (10,10) is uncharted. Legends say it's where stars go to die, or where something else entirely sleeps, something ancient and vast. The Precursors called it 'The Great Filter', a test for ascending civilizations. Some say it's a gateway to other universes, or the domain of the Void Dwellers, beings of pure nothingness who hunger for reality. No ship that has entered has ever returned with reliable data, only garbled, terrified last transmissions.",
    "A trader mentioned a hidden Outpost in the 'Graveyard of Ships' sector that deals in Forbidden Texts and Xeno-Antiques. High risk, high reward. They say it's run by a reclusive information broker known only as 'The Archivist', who is rumored to be an AI from before the Concord, possessing knowledge lost to time, including fragments of the K'tharr sacred scrolls and Precursor Star Map Fragments. They say The Archivist demands unique data in trade, not just credits, sometimes asking for 'memories' or 'experiences'.",
    "The 'Precursors' supposedly left 'Wayfinders' scattered across the galaxy. Finding one could lead to unimaginable discoveries... or doom. Each Wayfinder is said to point to another, forming a cosmic breadcrumb trail to their mythical homeworld, or their tomb, or perhaps the source of the 'Silencer' threat. The first signal was detected near a binary star in a volatile region...",
    "There's a faction known as the 'Children of the Void' who worship anomalies. They're said to be... unpredictable, and sometimes hostile to those who 'disturb the sacred'. They seek to understand the 'language of creation' and achieve apotheosis by merging with the void. They collect Void Crystals for their rituals, and some say they can control lesser anomalies or even commune with the Sentient Mycelium to glimpse the future, or what they call 'the True Pattern'.",
    "The K'tharr are a proud, warrior race. Their spices are potent, but their justice is swift for those caught smuggling them into Concord space. Their homeworld is said to be a fortress, built around a black hole, powered by its accretion disk. They view the Precursors as heretics, and any who traffic in their tech as blasphemers. Their Ancestral Blades are said to be forged from fallen stars and can cut through Concord armor like paper, resonating with the wielder's 'Ki' or life-force, some even claim the blades 'speak' to their wielders.",
    "Void Crystals? Nasty stuff. Heard they can warp reality locally. Some cults use them in their rituals, trying to contact entities from 'beyond the veil'. Stay clear if you value your sanity. They say the crystals whisper your deepest fears and desires, and sometimes, grant them, at a terrible price. They are also a key component in some experimental Concord weapons designed to breach other dimensions, a project the Obsidian Directorate keeps under tight wraps.",
    "Some say the derelict ships aren't all accidental. There are whispers of 'ship-breakers', pirates who disable vessels and leave them for scavengers... after taking the best loot and sometimes, the crew for 'other purposes', like selling them to the K'tharr or using them in dark rituals involving Sentient Mycelium. Voidfang is rumored to be a master of this tactic, leaving no witnesses, only cold, silent hulks.",
    "The Galactic Concord is rumored to be developing a new type of FTL drive, one that doesn't rely on Dilithium, possibly based on recovered Precursor schematics. They're desperate for Precursor Datacubes to complete it, and they'll pay anything, or take it by force. The Obsidian Directorate is said to be leading this effort, and they don't play by the rules. They're also trying to weaponize Phase-Shifted Alloys for their new 'Nova' class destroyers, capable of phasing through enemy shields.",
    "There's a legend of a 'Genesis Planet' hidden deep within an uncharted nebula, a world teeming with life and untouched by any known civilization. Many have sought it; none have returned with proof. Some say it's guarded by a sentient nebula that tests the worthiness of visitors, or that it's made entirely of Sentient Mycelium, a single, planet-sized organism that dreams the universe into being, and can reshape reality within its domain. The K'tharr consider this nebula sacred, calling it the 'Cradle of the Sky-Gods'.",
    "Sentient Mycelium networks are said to span entire star systems, hidden within dense nebulae. Touching them can grant visions, or madness. Some traders pay highly for samples, believing it can unlock psychic potential or even allow communication across vast distances instantaneously. The K'tharr consider it a sacred plant, a gift from their void gods, used in their most sacred rituals to commune with Ancestral Echoes. Some say the Mycelium is older than the stars themselves.",
    "Phase-Shifted Alloys are the holy grail for shipwrights. A hull made of it could theoretically pass through solid matter. Finding even a scrap is like finding a king's ransom. The Precursors used it extensively in their most advanced constructs, including their Wayfinders and city-ships. Some say it's not an alloy at all, but a form of stabilized exotic matter from another dimension, and it slowly 'learns' to adapt to its environment, sometimes exhibiting strange, almost sentient behaviors.",
    "Heard some spacers talking about 'Ghost Fleets' in the uncharted territories. Ships that appear on sensors, then vanish. Some say they're K'tharr scouts, others, something far older. Some even whisper they are echoes of ships lost in wormholes, forever caught between dimensions, their crews driven mad by the experience, forever replaying their final moments. One pilot claimed his ship was briefly 'phased' with one, seeing its spectral crew staring back.",
    "The 'Oracle of Cygnus' at Starbase Alpha sometimes gives cryptic prophecies to those who bring her rare Xeno-Antiques. Most think she's just a charlatan, but a few swear by her words. She once predicted the K'tharr invasion of the Draco system, and the appearance of the 'Silentium Expanse' on long-range charts. She also mumbles about 'the return of the Star-Eaters' and the 'Cycle of Silence', an ancient Precursor prophecy that supposedly details the end of all light in the galaxy.",
    "Wormholes are tears in spacetime, unstable and dangerous. But some ancient texts speak of 'Stable Conduits' left by the Precursors. Finding one would revolutionize interstellar travel... or unleash whatever lies at the other end. Some say they lead to other galaxies, or even other times. The Concord heavily restricts research into them, fearing what they might unleash upon an unsuspecting galaxy. There are whispers of a 'Wormhole Nexus' hidden deep in K'tharr space.",
    "The 'Void Kraken' is a legend among deep-space haulers. A colossal, energy-based lifeform said to inhabit dark nebulae, preying on unwary ships. Most dismiss it as space-madness, but some derelicts are found with strange, energy-based scarring... and their crews are always missing. Some say it's a Precursor bio-weapon gone rogue, or a guardian of the void, perhaps even a 'Silencer' itself.",
    "There's a black market for 'Precursor Navigational Cores' on some remote outposts. They say these cores can interface with ancient Precursor hyperlanes, allowing for instantaneous travel across vast distances... if you can survive the trip and the entities that guard those lanes. Plus, if you carry a Precursor Nav-Core near a Black Hole, its gravity well slingshots you forward instead of crushing your hull!",
    "I decoded an ancient data cache from Earth... something called 'The Soccer Journal'. I have no idea what a 'Sporting' is, but it's full of passionate, almost religious arguments about a pre-FTL game played on grass.",
    "Watch your scanners out near the Perseus Arm. They say an Eclipse Cartel dreadnought, the 'Obsidian Tear', has been pulling freighters out of hyperspace. Concord patrols are stretched too thin to do anything about it. If you're hauling Rare Metals, take the long way around.",
    "Ever hear of the 'Wayfinder Core'? Some old spacer was raving about it in here last week, said it's a Precursor compass that points to a dormant geometric god called 'The First Nexus'. Concord wiped his nav-computer the next day and hauled him off. Probably just space-madness, but my ship's compass has been drifting ever since.",
    "The K'tharr are getting restless. A warlord is offering a massive bounty for 'Living Hull Tissue'. They say he's trying to breed a colossal bio-ship instead of building one. It sounds crazy, but I wouldn't go near K'tharr space with a hold full of Genetic Samples right now.",
    "Don't buy the 'Discount Cyberservos' from independent outposts. I know a guy who installed one in his auto-loader droid, and the thing locked the doors and tried to unionize his cargo bay. Just spend the extra credits for the Concord-certified parts.",
    "I picked up a terrifying transmission near a Volcanic World... it sounded like a choir of Xeno-anomalies singing in perfect mathematical harmony. My ship's AI immediately shut itself down to 'protect its cognitive integrity'. I'm never flying through an anomaly without maximum shields again.",

    // ==========================================
    // --- COLONIES, OUTPOSTS & DRONES ---
    // ==========================================
    "Concord is handing out Official Settlement Charters to anyone with 25,000 credits. Setting up a colony is a license to print money—and once your population hits 250, they'll even launch automated Trade Convoys to nearby stations.",
    "Got charged a toll just to fly through a random sector today. Some hotshot captain deployed a Station Core in empty space and upgraded it into a Class-3 Fortress with automated defense turrets. Pirates couldn't even get within five klicks of it.",
    "If you ever find yourself running on fumes in the deep black, broadcast a general distress (Z) on a wide band. The Fuel Rats will find you. Tip them 500c to earn VIP standing, and they'll even weld your hull back to 100% for free when they rescue you.",
    "Don't hire from the Eclipse Mercenary Den unless you like counting your cargo twice a day. Operatives like Voidfang and The Ghost give a huge combat edge, but they've got sticky fingers when you're not looking.",
    "Commander Elias Thorne went rogue and took a heavily shielded Aegis Interceptor with him. Concord SEC-COM is offering 12,000c for his head. Word is he mounted an experimental K'tharr Void-Beam on his hull.",
    "Dread Pirate Voss—they call him 'The Butcher'—was spotted prowling the outer sectors. SEC-COM has a 15,000c bounty on his hull, and rumor says his ship mounts a prototype Singularity Cannon that fires micro-black holes.",
    "Bought one of those Automated Mining Drones. Best investment I ever made. I just sit back, sip Frothy Moon Ale, and let the little guy chew on asteroids. Just don't jump across the sector while it's deployed, or it'll run out of fuel trying to catch you.",
    "They say if you combine Quantum Lenses, Phase-Shifted Alloy, and Tech Parts at your ship's Engineering Workbench (U), you can fabricate a Wormhole Stabilizer. Deploy it in empty space and you've got a permanent Stargate with zero structural jump risk.",
    "If you're governing a frontier colony, keep a close eye on your Warehouse capacity. Once your storage hits 100%, your mines and factories grind to a halt until you build Reinforced Silos or haul the surplus to market.",
    "Thinking of upgrading your colony to a Tier 4 Sector Capital? You'll need 30,000 citizens and an Orbital Space Elevator first, plus a stockpile of AI Cores. Once you hit Capital status, you can build an Interstellar Exchange that automatically liquidates excess goods for pure credits.",

    // ==========================================
    // --- STEALTH, NAVIGATION & SENSORS ---
    // ==========================================
    "Heard about the 'Silent Running' trick? Hit [Q] to cut your main reactor. You can slip right past Concord patrols or Cartel ambushes, but watch your heat gauge. Stay cloaked past 5 heat units, and your own reactor core will start melting your hull.",
    "Your Nav-Computer (N) isn't just for show. If you're lost, ping it. It prioritizes active rescues, bounties, and mission drop-offs, and it'll always point you to the nearest safe harbor if you're in a pinch.",
    "If you've got 5 spare fuel, hit [P] to fire an Active Sensor Ping. It'll light up any Derelicts, Wormholes, or hidden Cartel strongholds within 5 klicks—or 10 klicks if you've installed the Long-Range Sensors perk.",
    "Have you calibrated your Deep Space Astrometric Observatory (O) yet? If you mount a NexStar-4SE Optical Array in your scanner slot, you can double your optical telemetry range and resolve free Planetary Data cartridges from long-exposure sector plates!",
    "Keep your eyes peeled for high-velocity icy comets streaking across the sector map. If you can plot an intercept vector and fly right through their tail, your scoops will harvest pure Hydrogen-3 and even Void Crystals.",
    "Don't let a micro-singularity catch you off guard. If you stray within 3 klicks of a Black Hole without a Precursor Nav-Core or the Void Diver perk, its gravity well will drag your ship toward the event horizon.",
    "Bored on a long supercruise haul? Press [R] to cycle your Subspace Radio receiver—or [Shift + R] to skip tracks. 1620 AM broadcasts live Concord News bulletins, market shortages, and active bounty coordinates.",

    // ==========================================
    // --- COMBAT, BOARDING & WARZONES ---
    // ==========================================
    "Any rookie can shoot a hull. A real pilot uses the Targeting Computer to draw their teeth. Drop their shields first, then target their Weapons to halve their attack power, or knock out their Engines so they can't evade.",
    "If a pirate demands a toll, check your terrain before you try to run. Weaving through an Asteroid Field gives you a +25% escape bonus, and diving into a dense Nebula boosts escape odds by +35%!",
    "Don't confuse a derelict airlock breach with a full-scale military raid. You can clear a ghost ship with your personal blaster, but if you want to board a live enemy ship for 3x salvage—or storm a planetary Cartel Outpost—you'll need Mercenary Platoons in your barracks.",
    "The Cartel builds their planetary strongholds tough. If you're going to raid one, keep at least 25 Fuel in your tanks for an Orbital Bombardment, and bring a Goliath Assault Mech if you want +50% fire support for your Marines.",
    "When Concord and Cartel fleets clash in an Active Sector Warzone, don't just fly past. You can link comms with either commander to coordinate strikes, or drift into the wreckage field to scavenge Void Crystals and Tech Parts while they're busy shooting each other.",
    "Ever notice the Manufacturer tags on your ship components? If you equip at least three modules from the same faction—like Concord, K'tharr, Eclipse, or Frontier—your ship's computer unlocks a powerful Set Synergy bonus.",
    "When you wipe out the garrison at a hidden Cartel Outpost, you don't have to raze it. You can claim the stronghold for yourself and turn it into a personal Shadow Port—though Concord SEC-COM will slap a massive bounty on your head.",

    // ==========================================
    // --- MINING, CRAFTING & PLANETARY EVA ---
    // ==========================================
    "Don't just hold the trigger down when mining an asteroid. Wait until the mining laser aligns with the green structural fault line. Hit the sweet spot and you can pull Platinum Ore or Rare Metals; miss it, and the thermal feedback will scorch your hull.",
    "Before you descend onto an Irradiated Wasteland or scoop fuel from a fiercely hot O-Class or B-Class supergiant, make sure you've got a Lead-Lined Dosimetry Array equipped—or a background as a Certified Health Physicist—unless you enjoy gamma flux cooking your hull.",
    "You don't need a starbase to patch your ship or refine ore. Press [U] anywhere in space to open your Engineering Workbench. You can smelt Minerals into Refined Alloy, synthesize Nano-Repair Kits, or permanently reinforce your hull plating and shield capacitors.",
    "If you ever find a legendary Machine World, don't bother with a standard mining laser. Interface directly with the planetary Core Network—especially if you have the Cyber Slicer perk—to siphon thousands of credits and intact AI Cores.",
    "Watch out for Death Worlds on the outer rim. The apex predators there will chew through a rover hull in seconds, though black-market brokers pay a fortune for the Illegal Organs and Genetic Samples you can harvest from the surface.",
    "Some derelicts have uncracked Crystalline Geodes tucked in their cargo lockers. Activate them from your Cargo Manifest (I) and your mining laser will split them open for Gold, Platinum Ore, or even Void Crystals.",
    "Got spare Tech Parts and Refined Alloy burning a hole in your hold? Take them to the R&D Calibration Bench inside any Engineering Bay. For 2,500c, the machinists will fabricate a custom-tuned prototype module with multi-stat bonuses.",

    // ==========================================
    // --- CRYPTARCH, FORGER & BLACK MARKET ---
    // ==========================================
    "Got an Encrypted Engram or Ancient Archive? Take it to the Cryptarch at a major hub, or crack it for free with the Cyber Slicer perk. Better yet, if you decrypt engrams while docked at Planet Xerxes, the Spire's resonance doubles your XP payout!",
    "Looking to fence 'Hot Cargo'? The moment you accept a smuggling run from the Shadow Broker, Aegis Pursuit Craft will lock onto its beacon. Engage Silent Running (Q) to mask your signature on the way to the drop-off.",
    "If you find yourself holding contraband when a Concord Patrol pulls you over, pray you have the 'Silver Tongue' perk or a Smuggler crewmate to cut the bribe in half—or pop a Sensor Decoy from your hold before you dock.",
    "Picked up too much Concord Notoriety? Find 'The Forger' at an outlaw port. He can slice into SEC-COM relays to wipe your warrants for cheaper than official fines, plant forged diplomatic credentials for +15 Concord Rep, or scramble your transponder to shake pursuers.",
    "Out in deep space, keep an eye out for automated Syndicate Wagering Relays ($), drifting Cryo-Escape Pods (P), and Precursor Monoliths (Ψ). Just watch your step around old Terran War Space Mines (M)—unless you have a Cyber Slicer to defuse them!",
    "If you collect three Precursor Star Map Fragments, don't sell them piecemeal! Activate them inside your Cargo Hold (I) and their holographic matrices will fuse into an intact Wayfinder Core.",
    "Decrypting engrams sometimes reveals coordinates to Sector [39, 17]. Word in the cantinas is that a ring of Precursor pylons called the 'Sanctuary of the Void' floats out there, waiting to synchronize with a ship's nav-computer.",
    "Astronomers at Frothy Moon Outpost [58, -8] brew the best dark synth-ale in the quadrant. Bring them Planetary Data or Nav-Charts from the deep black and they'll pay a 40% to 50% premium on the spot.",
    "If your fuel gauge is perpetually in the red, plot a course due north to Port Nomad [15, 210]. It's the primary dispatch sanctuary of the Fuel Rats Collective—they refine Tritium into Fuel Cells at half the galactic base price."
];

// --- PERFORMANCE & SAFETY OPTIMIZATION ---
// Freezing the array prevents it from being modified at runtime, 
// allowing the V8 JS engine to optimize it as a true constant in memory!
Object.freeze(RUMORS);
window.RUMORS = RUMORS;

// Keep GameRegistry in sync if script.js already initialized it
if (typeof GameRegistry !== 'undefined') {
    GameRegistry.rumors = RUMORS;
}

// ==========================================
// --- STATION-SPECIFIC LOCAL CHATTER ---
// ==========================================

const STATION_RUMORS = {
    "Starbase Alpha": [
        "Starbase Alpha's customs grid is running at peak sensitivity today. If you're carrying Prohibited Stims or Artifact Shards without an Eclipse shielded bay, don't press your luck.",
        "Quartermasters on Deck 4 are buying up Refined Alloy and Minerals for the border fleet expansion. Good steady credits if you're working the local asteroid belts."
    ],
    "The Rusty Anchor": [
        "Keep your hand on your sidearm in here. Half the captains at the bar have active SEC-COM warrants, and the other half are Shadow Network brokers looking for a courier.",
        "The Anchor's illicit chem-stills are churning out Prohibited Stims around the clock, provided someone keeps smuggling Medical Supplies past the Concord patrols."
    ],
    "Aegis Dyson Sphere": [
        "Look out the observation dome when you undock—the Dyson Sphere's solar collectors harvest enough output from that captured G-type star to power ten thousand worlds.",
        "The Aegis megastructure is practically giving away bulk Food, Water, and Minerals, and their science directorate pays top credit for Quantum Fluid and AI Cores."
    ],
    "Planet Xerxes": [
        "The Spire beneath this city isn't Cartel architecture—it's Precursor. Crack the first encryption layer at the terminal, and the Shadow Network brokers will open their vaults to you.",
        "Every Cryptarch on Xerxes swears by the Spire's subspace resonance. Decrypt an Engram or Ancient Archive while docked here and the neural feedback doubles your experience yield."
    ],
    "Karak-Tor": [
        "Hear that low rumble through the deck plates? Those are the atmospheric magma forges of Karak-Tor. Bring the smiths Refined Alloy or Food Supplies and they'll pay in blood-iron and gold.",
        "If you reach 30 Standing with the K'tharr Ascendancy, the shipyard masters here will let you commission a Blood-Barge—350 base hull and a forward ramming spike."
    ],
    "Fortress Drakon": [
        "Fortress Drakon guards the eastern approaches into K'tharr space. Return a lost K'tharr Ancestral Blade to the warlords here and they'll pay over double its base value.",
        "The arena bookies in the Proving Grounds are taking wagers up to 500c per match. Just watch the odds on the Captured Xenomorph."
    ],
    "Station Umbra": [
        "Station Umbra drifts so far out in the western rim that Concord long-range telemetry can't even resolve its hull. If you have 30 Eclipse Rep, ask the shipyard about the Night-Runner stealth hull.",
        "The engineers in Umbra's lower bays compress salvaged Tech Parts into sensor-absorbent Obsidian Tear Plating. Essential material if you're outfitting a smuggling rig."
    ],
    "Port Erebus": [
        "Port Erebus is tucked inside a sensor-baffled dust cloud. The Forger in the back alley can scrub your Concord warrants or plant counterfeit diplomatic credentials if the heat gets too high.",
        "Syndicate bio-techs here ferment Sentient Mycelium into combat stims. They're always buying Luxury Goods, Gold, and Stolen Concord Medals."
    ],
    "Cygnus Prime": [
        "The University of Cygnus Prime has open research grants for Pulsar Timing Data, Magnetar Harmonics, Singularity Telemetry, and Quasar Spectrography—paying up to 200% of galactic base value!",
        "Need a Precursor Cipher or a Telemetry Probe? The university quartermaster stocks both at an academic discount."
    ],
    "Ceti Alpha Shipyards": [
        "Dread Pirate Voss nearly burned Ceti Alpha Shipyards to slag during the last Cartel raid. Now the drydocks are heavily fortified and paying 150% for raw Platinum Ore and Rare Metals.",
        "Ceti Alpha's assembly lines turn raw Platinum Ore into Tech Parts and Nano-Repair Kits cheaper than almost anywhere else in Concord space."
    ],
    "Helios Refinery": [
        "Xy-Corp runs Helios Refinery on a strict 'Progress Through Profit' quota. It's the best place in the sector to pick up cheap Minerals, Refined Alloy, and Atmo-Processors for a new colony.",
        "Because Helios is an industrial smelting platform, they have zero agricultural domes—bring them Water and Food Supplies for an easy 40% to 50% markup."
    ],
    "Frothy Moon Outpost": [
        "Welcome to Frothy Moon Outpost! Grab a pint of dark synth-ale and check out the 8-inch and NexStar optical telescopes on the lunar observation ridge.",
        "The stargazers here pool their credits to buy Planetary Data and Nav-Charts at a hefty premium, and a mug of Frothy Moon Ale only runs you a fraction of core-world prices."
    ],
    "Port Nomad": [
        "Port Nomad's promethium cracking towers refine Hydrogen-3 into Fuel Cells at 50% of standard market price. Every long-range explorer tops off their tanks here.",
        "If you build up 10 Reputation with the Fuel Rats Collective by tipping their rescue tugs, their shipwrights will let you commission a high-visibility Salvage & Refuel Tug."
    ],
    "The Archivist's Vault": [
        "Keep your voice down—the Archivist's AI mainframe monitors every comm channel in this hull graveyard. It trades in Encrypted Engrams, Ancient Archives, and even intact Wayfinder Cores.",
        "If you've pulled Quasar or Singularity telemetry from deep space—or salvaged Star Map Fragments—the Archivist pays higher bounties than almost any broker in the galaxy."
    ]
};
Object.freeze(STATION_RUMORS);

// ==========================================
// --- SMART RUMOR DECK & LIVE INTEL ENGINE ---
// ==========================================

const RumorManager = {
    _deck: [],
    _lastRumor: null,
    _recentHistory: [],
    _maxHistory: 8,
    _stationIntelAwarded: new Set(),

    // Comprehensive keyword -> Codex Lore ID mapping (covers 36 entries in lore.js)
    _loreHooks: [
        { match: "Voidfang", loreKey: "FACTION_ECLIPSE" },
        { match: "Shadow Network", loreKey: "FACTION_SHADOW_NETWORK" },
        { match: "smuggling", loreKey: "FACTION_ECLIPSE_SMUGGLING" },
        { match: "Obsidian Directorate", loreKey: "FACTION_OBSIDIAN_DIRECTORATE" },
        { match: "Children of the Void", loreKey: "FACTION_CHILDREN_OF_THE_VOID" },
        { match: "Void Vultures", loreKey: "FACTION_PIRATES_VOID_VULTURES" },
        { match: "Xy-Corp", loreKey: "FACTION_XYCORP" },
        { match: "Fuel Rats", loreKey: "FACTION_FUEL_RATS" },
        { match: "K'tharr", loreKey: "FACTION_KTHARR" },
        { match: "Void Crystals", loreKey: "PHENOMENON_VOID_CRYSTALS" },
        { match: "Sentient Mycelium", loreKey: "LEGEND_SENTIENT_MYCELIUM_NETWORK" },
        { match: "Void Kraken", loreKey: "LEGEND_VOID_KRAKEN" },
        { match: "Phase-Shifted Alloy", loreKey: "TECH_PHASE_SHIFT_ALLOY" },
        { match: "Wormhole Stabilizer", loreKey: "TECH_STARGATE_NETWORK" },
        { match: "Stargate", loreKey: "TECH_STARGATE_NETWORK" },
        { match: "Wormholes", loreKey: "PHENOMENON_WORMHOLE" },
        { match: "Black Hole", loreKey: "PHENOMENON_BLACK_HOLE" },
        { match: "singularity", loreKey: "PHENOMENON_BLACK_HOLE" },
        { match: "Irradiated Wasteland", loreKey: "PHENOMENON_IRRADIATED" },
        { match: "Encrypted Engram", loreKey: "COMMODITY_ENCRYPTED_ENGRAM" },
        { match: "Settlement Charters", loreKey: "TECH_COLONY_CHARTER" },
        { match: "Machine World", loreKey: "XENO_MACHINE_WORLD" },
        { match: "Tomb World", loreKey: "XENO_TOMB_WORLDS" },
        { match: "The Spire", loreKey: "XENO_THE_SPIRE" },
        { match: "Planet Xerxes", loreKey: "LOCATION_PLANET_XERXES" },
        { match: "Wayfinder Core", loreKey: "COMMODITY_WAYFINDER_CORE" },
        { match: "First Nexus", loreKey: "MYSTERY_FIRST_NEXUS" },
        { match: "Star Map Fragment", loreKey: "COMMODITY_PRECURSOR_STAR_MAP_FRAGMENT" },
        { match: "Ancestral Blade", loreKey: "COMMODITY_KTHARR_ANCESTRAL_BLADE" },
        { match: "Stardust Exotica", loreKey: "COMMODITY_STARDUST_EXOTICA" },
        { match: "Quantum Fluid", loreKey: "COMMODITY_QUANTUM_FLUID" },
        { match: "Unshackled AI", loreKey: "TECH_UNSHACKLED_AI" },
        { match: "Kepler Nebula", loreKey: "REGION_KEPLER_NEBULA" },
        { match: "Silentium Expanse", loreKey: "REGION_SILENTIUM_EXPANSE" },
        { match: "Cygnus Prime", loreKey: "LOCATION_CYGNUS_PRIME" },
        { match: "Frothy Moon", loreKey: "LOCATION_FROTHY_MOON_OUTPOST" },
        { match: "Port Nomad", loreKey: "LOCATION_PORT_NOMAD" },
        { match: "The Archivist", loreKey: "LOCATION_THE_ARCHIVIST'S_VAULT" },
        { match: "Karak-Tor", loreKey: "LOCATION_KARAK_TOR" },
        { match: "Station Umbra", loreKey: "LOCATION_STATION_UMBRA" },
        { match: "Rusty Anchor", loreKey: "LOCATION_THE_RUSTY_ANCHOR" },
        { match: "Helios Refinery", loreKey: "LOCATION_HELIOS_REFINERY" },
        { match: "Dyson Sphere", loreKey: "LOCATION_AEGIS_DYSON_SPHERE" }
    ],

    _recordHistory: function(text) {
        this._lastRumor = text;
        this._recentHistory.push(text);
        if (this._recentHistory.length > this._maxHistory) {
            this._recentHistory.shift();
        }
    },

    // Classifies any rumor string into a thematic UI badge, icon, and color
    getRumorMeta: function(text) {
        const lower = String(text || "").toLowerCase();
        if (lower.includes("shortage") || lower.includes("surplus") || lower.includes("market") || lower.includes("price") || lower.includes("paying")) {
            return { category: "MARKET INTEL", icon: "📈", color: "var(--gold-text)" };
        }
        if (lower.includes("bounty") || lower.includes("hunting") || lower.includes("sec-com") || lower.includes("voss") || lower.includes("thorne")) {
            return { category: "BOUNTY TRACKER", icon: "🎯", color: "var(--danger)" };
        }
        if (lower.includes("colony") || lower.includes("charter") || lower.includes("silos") || lower.includes("famine") || lower.includes("tax vault")) {
            return { category: "COLONY DISPATCH", icon: "🏛️", color: "var(--success)" };
        }
        if (lower.includes("precursor") || lower.includes("wayfinder") || lower.includes("engram") || lower.includes("nexus") || lower.includes("monolith") || lower.includes("sanctuary")) {
            return { category: "XENO-ARCHIVE", icon: "💠", color: "#DDA0DD" };
        }
        if (lower.includes("hit [") || lower.includes("press [") || lower.includes("targeting computer") || lower.includes("workbench") || lower.includes("synergy")) {
            return { category: "PILOT TACTICS", icon: "🧭", color: "var(--accent-color)" };
        }
        return { category: "SECTOR CHATTER", icon: "🗣️", color: "var(--warning)" };
    },

    // Generates a live, context-aware rumor from active game state (Economy, Bounties, Colonies, Probes, Landmarks)
    getLiveStateRumor: function() {
        const dynamicPool = [];

        // 1. Active Market Boom / Bust Tip
        if (typeof activeMarketTrend !== 'undefined' && activeMarketTrend && typeof currentGameDate !== 'undefined' && currentGameDate < activeMarketTrend.expiry) {
            const itemObj = (typeof COMMODITIES !== 'undefined' && COMMODITIES[activeMarketTrend.item])
                ? COMMODITIES[activeMarketTrend.item]
                : { name: activeMarketTrend.item };
            if (activeMarketTrend.isBoom) {
                dynamicPool.push(`"Want a hot trade tip? ${activeMarketTrend.station} is suffering a critical shortage of ${itemObj.name} right now. They're paying 250% of standard market value if you can get a shipment there before Stardate ${activeMarketTrend.expiry.toFixed(1)}!"`);
            } else {
                dynamicPool.push(`"Looking for cheap cargo? ${activeMarketTrend.station} has a massive surplus of ${itemObj.name}. They're practically giving it away at 40% of base price until Stardate ${activeMarketTrend.expiry.toFixed(1)}."`);
            }
        }

        // 2. Active Bounty Target Sighting
        if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty && playerActiveBounty.targetName) {
            dynamicPool.push(`"You're hunting ${playerActiveBounty.targetName}, right? Long-range freighter telemetry just pinged their drive signature near coordinates [${playerActiveBounty.x}, ${-playerActiveBounty.y}]. Check your Nav-Computer (N) before they jump!"`);
        }

        // 3. Active Smuggling / Delivery Contract Hint
        if (typeof playerActiveMission !== 'undefined' && playerActiveMission && !playerActiveMission.isComplete && playerActiveMission.objectives && playerActiveMission.objectives[0]) {
            const obj = playerActiveMission.objectives[0];
            if (obj.destinationName && typeof LOCATIONS_DATA !== 'undefined' && LOCATIONS_DATA[obj.destinationName]) {
                const coords = LOCATIONS_DATA[obj.destinationName].coords;
                dynamicPool.push(`"Hauling a contract for ${obj.destinationName}? Set your helm for [${coords.x}, ${-coords.y}]. Keep your shields up on approach."`);
            }
        }

        // 4. Dynamic Faction War Front Update
        if (typeof GameState !== 'undefined' && GameState.world && GameState.world.factionOffsets) {
            const kFront = GameState.world.factionOffsets.KTHARR;
            const eFront = GameState.world.factionOffsets.ECLIPSE;
            if (kFront < 18) {
                dynamicPool.push(`"The K'tharr Ascendancy has pushed deep into eastern space—their border front is all the way in at Macro-Sector ${kFront}. Concord patrols are scrambling to hold the line."`);
            }
            if (eFront > -18) {
                dynamicPool.push(`"The Eclipse Cartel is expanding fast in the western rim. Shadow-ports have crept inward to Macro-Sector ${eFront}. Watch your cargo hold out there."`);
            }
        }

        // 5. Player Colony Status & Crisis Alerts
        if (typeof playerColonies !== 'undefined') {
            const cols = Object.values(playerColonies).filter(c => c && c.established);
            cols.forEach(col => {
                if ((col.storage['FOOD_SUPPLIES'] || 0) <= 0) {
                    dynamicPool.push(`"Heard a distress relay from your settlement at ${col.name} [${col.x}, ${-col.y}]—their Food Supplies are completely depleted! Get a relief shipment or Hydroponics Farm online before famine sets in."`);
                } else if (col.treasury >= 2500) {
                    dynamicPool.push(`"Merchant captains say the tax vault at your ${col.name} settlement [${col.x}, ${-col.y}] is sitting on ${col.treasury}c in collected tariffs. Might be worth a trip to withdraw your funds."`);
                } else if ((col.defense || 0) < 20 && col.population >= 150) {
                    dynamicPool.push(`"Word is Cartel raiders are eyeing your colony at ${col.name} [${col.x}, ${-col.y}]. With a Defense Rating of only ${col.defense || 0}, you should build Automated Turrets or a Defense Battery soon."`);
                }
            });
        }

        // 6. Player Waystation Toll Alerts
        if (typeof worldStateDeltas !== 'undefined') {
            for (const key in worldStateDeltas) {
                const d = worldStateDeltas[key];
                if (d && d.isPlayerOwned && d.isTinyOutpost && (d.treasury || 0) >= 500) {
                    const [wx, wy] = key.split('_')[0].split(',').map(Number);
                    if (!isNaN(wx) && !isNaN(wy)) {
                        dynamicPool.push(`"Independent haulers passing through [${wx}, ${-wy}] say your waystation, ${d.name || 'Outpost'}, has accumulated ${d.treasury}c in transit tolls ready for pickup."`);
                        break;
                    }
                }
            }
        }

        // 7. Deployed Telemetry Probe Harvest Alerts
        if (typeof window.activeProbes !== 'undefined' && Array.isArray(window.activeProbes) && typeof currentGameDate !== 'undefined') {
            const readyProbe = window.activeProbes.find(p => p && Math.floor((currentGameDate - p.deployedAt) / 10) >= 2);
            if (readyProbe) {
                const count = Math.floor((currentGameDate - readyProbe.deployedAt) / 10);
                dynamicPool.push(`"Your autonomous Telemetry Probe at [${readyProbe.x}, ${-readyProbe.y}] is pinging a full memory buffer—it's recorded ${count} astrometric data drives so far."`);
            }
        }

        // 8. Local Station Specific Chatter
        if (typeof chunkManager !== 'undefined' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
            const localTile = chunkManager.getTile(playerX, playerY);
            if (localTile && localTile.name && STATION_RUMORS[localTile.name]) {
                STATION_RUMORS[localTile.name].forEach(r => dynamicPool.push(`"${r}"`));
            }
        }

        // 9. Undiscovered Landmark Breadcrumb
        if (typeof LOCATIONS_DATA !== 'undefined' && typeof discoveredLocations !== 'undefined' && discoveredLocations.has) {
            const undiscovered = Object.keys(LOCATIONS_DATA).filter(name => {
                const loc = LOCATIONS_DATA[name];
                return loc && loc.coords && !discoveredLocations.has(name);
            });
            if (undiscovered.length > 0) {
                const pick = undiscovered[Math.floor(Math.random() * undiscovered.length)];
                const c = LOCATIONS_DATA[pick].coords;
                dynamicPool.push(`"Looking for uncharted ports? Long-range couriers talk about '${pick}' out at coordinates [${c.x}, ${-c.y}]. Might be worth plotting a course."`);
            }
        }

        const freshPool = dynamicPool.filter(r => !this._recentHistory.includes(r));
        const poolToUse = freshPool.length > 0 ? freshPool : dynamicPool;
        if (poolToUse.length === 0) return null;
        return poolToUse[Math.floor(Math.random() * poolToUse.length)];
    },

    // Unlocked lore helper: scans a rumor for all matching hooks and unlocks the first locked entry found
    _unlockMatchingLore: function(text) {
        if (typeof unlockLoreEntry !== 'function') return null;
        const lowerText = String(text || "").toLowerCase();

        for (let i = 0; i < this._loreHooks.length; i++) {
            const hook = this._loreHooks[i];
            if (lowerText.includes(hook.match.toLowerCase())) {
                const loreObj = (typeof LORE_DATABASE !== 'undefined') ? LORE_DATABASE[hook.loreKey] : null;
                // Only stop at this hook if it actually unlocks a previously locked entry!
                if (loreObj && !loreObj.unlocked) {
                    unlockLoreEntry(hook.loreKey);
                    return loreObj.title;
                } else if (!loreObj) {
                    unlockLoreEntry(hook.loreKey);
                }
            }
        }
        return null;
    },

    // Draws a non-repeating rumor (35% chance for live galactic/station intel if available)
    getNextRumor: function(unlockLore = true) {
        if (Math.random() < 0.35) {
            const liveRumor = this.getLiveStateRumor();
            if (liveRumor && liveRumor !== this._lastRumor) {
                this._recordHistory(liveRumor);
                if (unlockLore) this._unlockMatchingLore(liveRumor);
                return liveRumor.replace(/^"|"$/g, '');
            }
        }

        // Refill and Fisher-Yates shuffle the deck when empty
        if (this._deck.length === 0) {
            this._deck = RUMORS.map((_, idx) => idx);
            for (let i = this._deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = this._deck[i];
                this._deck[i] = this._deck[j];
                this._deck[j] = temp;
            }
        }

        let nextIdx = this._deck.pop();
        let chosen = RUMORS[nextIdx] || RUMORS[0];

        // Avoid immediate back-to-back repeat on deck reshuffle
        if (chosen === this._lastRumor && this._deck.length > 0) {
            const altIdx = this._deck.pop();
            this._deck.unshift(nextIdx);
            chosen = RUMORS[altIdx] || chosen;
        }

        this._recordHistory(chosen);

        if (unlockLore) {
            this._unlockMatchingLore(chosen);
        }

        return chosen;
    }
};

window.RumorManager = RumorManager;
window.getSmartRumor = () => RumorManager.getNextRumor(true);

// ==========================================
// --- SELF-CONTAINED CANTINA & NPC HOOKS ---
// ==========================================

(function initRumorsModuleHooks() {
    function attachRumorHooks() {
        // 1. Upgrade listenToRumors() in stations.js so Cantina eavesdropping uses RumorManager
        window.listenToRumors = function() {
            const detailEl = document.getElementById('genericDetailContent');
            if (typeof soundManager !== 'undefined' && typeof soundManager.playUIHover === 'function') {
                soundManager.playUIHover();
            }

            const rumorText = RumorManager.getNextRumor(true);
            const meta = RumorManager.getRumorMeta(rumorText);

            // Grant a small +10 XP intelligence bonus once per station visit
            let xpBadgeHtml = "";
            const loc = (typeof chunkManager !== 'undefined' && typeof playerX !== 'undefined') ? chunkManager.getTile(playerX, playerY) : null;
            const visitKey = `${loc && loc.name ? loc.name : 'PORT'}_${Math.floor(typeof currentGameDate !== 'undefined' ? currentGameDate : 0)}`;
            if (!RumorManager._stationIntelAwarded.has(visitKey) && typeof playerXP !== 'undefined') {
                RumorManager._stationIntelAwarded.add(visitKey);
                playerXP += 10;
                xpBadgeHtml = `<div style="margin-top:10px; font-size:11px; color:var(--success); font-weight:bold;">+10 XP (Sector Intelligence Gathered)</div>`;
                if (typeof renderUIStats === 'function') renderUIStats();
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }

            if (detailEl) {
                detailEl.innerHTML = `
                    <div style="text-align:center; padding: 15px 10px; animation: fadeIn 0.25s ease-out;">
                        <div style="font-size:44px; margin-bottom:8px; filter: drop-shadow(0 0 12px ${meta.color});">${meta.icon}</div>
                        <div style="display:inline-block; font-size:10px; color:${meta.color}; border:1px solid ${meta.color}; padding:2px 8px; border-radius:3px; letter-spacing:2px; margin-bottom:10px; font-weight:bold;">
                            ${meta.category}
                        </div>
                        <h3 style="color:var(--accent-color); margin: 0 0 12px 0; font-size:18px;">OVERHEARD IN THE BOOTH</h3>
                        
                        <div style="text-align:left; background: var(--bg-color); border: 1px dashed var(--border-color); border-left: 3px solid ${meta.color}; padding: 16px; border-radius: 4px;">
                            <p style="font-size:12px; color:var(--item-desc-color); margin:0 0 10px 0;">
                                You tune your audio implants to isolate a conversation across the cantina floor:
                            </p>
                            <p style="font-size:13px; color:var(--text-color); font-style:italic; margin:0; line-height:1.6;">
                                "...${rumorText}"
                            </p>
                        </div>
                        ${xpBadgeHtml}
                        <button class="action-button" style="margin-top:15px; padding:8px 12px; font-size:11px; border-color:${meta.color}; color:${meta.color};" onclick="listenToRumors()">
                            👂 EAVESDROP ON ANOTHER TABLE
                        </button>
                    </div>
                `;
            }
        };

        // 2. Enrich ambient NPC ship hails in script.js so space traffic shares varied lore chatter
        if (typeof NPC_SHIP_TYPES !== 'undefined' && Array.isArray(NPC_SHIP_TYPES) && !window._rumorsNpcHailsExpanded) {
            const extraCivHails = [
                "Heard Frothy Moon Outpost [58, -8] just tapped a new batch of dark synth-ale.",
                "Stay clear of the western rim unless you enjoy paying tolls to the Eclipse Cartel.",
                "Port Nomad [15, 210] is selling Fuel Cells at half price if your tanks are running low."
            ];
            const extraMinerHails = [
                "Wait for the mining laser to hit the green fault line, or the rock will blow back in your face!",
                "Pulled a Crystalline Geode out of an asteroid today—cracked it open in my hold for pure Platinum Ore.",
                "Helios Refinery [-55, -110] is buying up raw ore and selling cheap Refined Alloy."
            ];
            const extraConcordHails = [
                "SEC-COM reminder: Dread Pirate Voss and Renegade Commander Thorne are wanted dead or alive.",
                "All vessels: report any sightings of Precursor anomalies to the University of Cygnus Prime [85, 65].",
                "Keep your transponder unspoofed and your hold clean of contraband, Captain."
            ];

            NPC_SHIP_TYPES.forEach(t => {
                if (!t || !Array.isArray(t.hails)) return;
                if (t.id === "CIVILIAN_HAULER") t.hails.push(...extraCivHails);
                else if (t.id === "INDEPENDENT_MINER") t.hails.push(...extraMinerHails);
                else if (t.id === "CONCORD_PATROL") t.hails.push(...extraConcordHails);
            });
            window._rumorsNpcHailsExpanded = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachRumorHooks);
    } else {
        attachRumorHooks();
    }
})();

// --- END OF FILE rumors.js ---
