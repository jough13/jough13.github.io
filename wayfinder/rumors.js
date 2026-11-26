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
    "Pilgrims of the Children of the Void tend a crystalline cathedral called Choir Spire Alpha out at [-115, -145]. Offer them a single Void Crystal and they'll weld your hull, charge your shields, and hand you an Encrypted Engram or Cipher in return.",
    "Way out northeast at [280, 240], an automated Precursor buoy called Silentium Relay Zero still broadcasts the Architects' final distress chord before the Great Silence. Bring a Wayfinder Core near it and it'll lock straight onto The First Nexus.",
    "Surveyors found an Obsidian Obelisk floating in empty space at [-20, -35]. Harmonizing with its trenches knits hull armor back together—just don't touch its singularity core unless you're a seasoned Void Diver.",
    "Decrypted Precursor Archives call the Ancients the 'Architects of the First Chord.' They didn't vanish by accident—they built monoliths across the galaxy to hold back an entropic phenomenon called The Silence.",

    // ==========================================
    // --- COLONIES, OUTPOSTS, CREW & DRONES ---
    // ==========================================
    "Concord is handing out Official Settlement Charters to anyone with 25,000 credits. Setting up a colony is a license to print money—and once your population hits 250, they'll even launch automated Trade Convoys to nearby stations.",
    "Got charged a toll just to fly through a random sector today. Some hotshot captain deployed a Station Core in empty space and upgraded it into a Class-3 Fortress with automated defense turrets. Pirates couldn't even get within five klicks of it.",
    "If you ever find yourself running on fumes in the deep black, broadcast a general distress (Z) on a wide band. The Fuel Rats will find you. Tip them 500c to earn VIP standing, and they'll even weld your hull back to 100% for free when they rescue you.",
    "Don't hire from the Eclipse Mercenary Den unless you like counting your cargo twice a day. Operatives like Voidfang and The Ghost give a huge combat edge, but they've got sticky fingers—unless you buy their loyalty past 75% to cut the skimming in half.",
    "A happy crew is worth twice their salary. Toss your officers a Shore Leave bonus or share a bottle of Frothy Moon Ale or Ancient Wine from your hold—once a specialist hits Devoted status (80%+ Loyalty), they start pulling off-shift miracles for free.",
    "Commander Elias Thorne went rogue and took a heavily shielded Aegis Interceptor with him. Concord SEC-COM is offering 12,000c for his head. Word is he mounted an experimental K'tharr Void-Beam on his hull.",
    "Dread Pirate Voss—they call him 'The Butcher'—was spotted prowling the outer sectors. SEC-COM has a 15,000c bounty on his hull, and rumor says his ship mounts a prototype Singularity Cannon that fires micro-black holes.",
    "Bought one of those Automated Mining Drones. Best investment I ever made. I just sit back, sip Frothy Moon Ale, and let the little guy chew on asteroids. Just don't jump across the sector while it's deployed, or it'll run out of fuel trying to catch you.",
    "They say if you combine Quantum Lenses, Phase-Shifted Alloy, and Tech Parts at your ship's Engineering Workbench (U), you can fabricate a Wormhole Stabilizer. Deploy it in empty space and you've got a permanent Stargate with zero structural jump risk.",
    "If you're governing a frontier colony, keep a close eye on your Warehouse capacity. Once your storage hits 100%, your mines and factories grind to a halt until you build Reinforced Silos or haul the surplus to market.",
    "Thinking of upgrading your colony to a Tier 4 Sector Capital? You'll need 30,000 citizens and an Orbital Space Elevator first, plus a stockpile of AI Cores. Once you hit Capital status, you can build an Interstellar Exchange that automatically liquidates excess goods for pure credits.",
    "Keep an eye on your captain augmentations when you level up. Picking three perks in the same discipline—like Combat, Science, Exploration, or Survival—unlocks a permanent Discipline Mastery Doctrine on top of the perks themselves.",

    // ==========================================
    // --- STEALTH, NAVIGATION & SENSORS ---
    // ==========================================
    "Heard about the 'Silent Running' trick? Hit [Q] to cut your main reactor. You can slip right past Concord patrols or Cartel ambushes, but watch your heat gauge. Stay cloaked past 5 heat units, and your own reactor core will start melting your hull.",
    "Your Nav-Computer (N) isn't just for show. If you're lost, ping it. It prioritizes active rescues, bounties, and mission drop-offs, and it'll always point you to the nearest safe harbor if you're in a pinch.",
    "If you've got 5 spare fuel, hit [P] to fire an Active Sensor Ping. It'll light up any Derelicts, Wormholes, or hidden Cartel strongholds within 5 klicks—or 10 klicks if you've installed the Long-Range Sensors perk.",
    "Kepler Listening Post [-68, 42] sells disposable Subspace Recon Beacons and Capacitor Overcharge Cells. Pop a beacon in deep space for a zero-fuel 12-tile sweep, or fire an Overcharge Cell to flush Stealth Heat and surge shields instantly.",
    "Have you calibrated your Deep Space Astrometric Observatory (O) yet? If you mount a NexStar-4SE Optical Array in your scanner slot, you can double your optical telemetry range and resolve free Planetary Data cartridges from long-exposure sector plates!",
    "Keep your eyes peeled for high-velocity icy comets streaking across the sector map. If you can plot an intercept vector and fly right through their tail, your scoops will harvest pure Hydrogen-3 and even Void Crystals.",
    "Don't let a micro-singularity catch you off guard. If you stray within 3 klicks of a Black Hole without a Precursor Nav-Core or the Void Diver perk, its gravity well will drag your ship toward the event horizon.",
    "Bored on a long supercruise haul? Press [R] to cycle your Subspace Radio receiver, [Shift + R] to skip tracks, or [Alt + R] to open the full tuner. 1620 AM runs live Concord News, 91.2 FM spins procedural void synthwave, and 74.4 AM... well, nobody knows who runs that Precursor numbers station.",

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
    "Reputation unlocks hardware credits alone can't buy. Earn 30+ Standing with Concord for an Aegis Gunship, 30+ with Eclipse for a stealth Night-Runner, or 30+ with the K'tharr for a 350-hull Blood-Barge.",

    // ==========================================
    // --- MINING, CRAFTING & PLANETARY EVA ---
    // ==========================================
    "Don't just hold the trigger down when mining an asteroid. Wait until the mining laser aligns with the green structural fault line. Hit the sweet spot and you can pull Platinum Ore or Rare Metals; miss it, and the thermal feedback will scorch your hull.",
    "Don't ignore Gas Giants and Ice Giants when you enter a star system! You can't land on them, sure, but you can run an Atmospheric Skim right from orbit to top off your fuel tanks and scoop pure Hydrogen-3.",
    "Before you descend onto an Irradiated Wasteland or scoop fuel from a fiercely hot O-Class or B-Class supergiant, make sure you've got a Lead-Lined Dosimetry Array equipped—or a background as a Certified Health Physicist—unless you enjoy gamma flux cooking your hull.",
    "You don't need a starbase to patch your ship or refine ore. Press [U] anywhere in space to open your Engineering Workbench. You can smelt Minerals into Refined Alloy, synthesize Nano-Repair Kits, or permanently reinforce your hull plating and shield capacitors.",
    "If you ever find a legendary Machine World, don't bother with a standard mining laser. Interface directly with the planetary Core Network—especially if you have the Cyber Slicer perk—to siphon thousands of credits and intact AI Cores.",
    "Precursor Tomb Worlds and Archive Spheres are rare as hens' teeth, but excavating their subterranean sanctums can unseal intact Precursor Vaults or turn up Star Map Fragments and Datacubes.",
    "Watch out for Death Worlds on the outer rim. The apex predators there will chew through a rover hull in seconds, though black-market brokers pay a fortune for the Illegal Organs and Genetic Samples you can harvest from the surface.",
    "Some derelicts—and the roughneck miners over at Valkyrie Drift [135, -120]—stock uncracked Crystalline Geodes. Activate them from your Cargo Manifest (I) and your mining laser will split them open for Gold, Platinum Ore, or even Void Crystals.",
    "Got spare Tech Parts and Refined Alloy burning a hole in your hold? Take them to the R&D Calibration Bench inside any Engineering Bay. For 2,500c, the machinists will fabricate a custom-tuned prototype module with multi-stat bonuses.",

    // ==========================================
    // --- CRYPTARCH, FORGER & BLACK MARKET ---
    // ==========================================
    "Got an Encrypted Engram or Ancient Archive? Take it to the Cryptarch at a major hub, or crack it for free with the Cyber Slicer perk. Better yet, if you decrypt engrams while docked at Planet Xerxes, the Spire's resonance doubles your XP payout!",
    "Looking to fence 'Hot Cargo'? The moment you accept a smuggling run from the Shadow Broker, Aegis Pursuit Craft will lock onto its beacon. Engage Silent Running (Q) to mask your signature on the way to the drop-off.",
    "If you find yourself holding contraband when a Concord Patrol pulls you over, pray you have the 'Silver Tongue' perk or a Smuggler crewmate to cut the bribe in half—or pop a Sensor Decoy from your hold before you dock.",
    "Picked up too much Concord Notoriety? Find 'The Forger' at an outlaw port like Station Umbra or Port Erebus [-175, -80]. He can slice into SEC-COM relays to wipe your warrants for cheaper than official fines, plant forged diplomatic credentials for +15 Concord Rep, or scramble your transponder to shake pursuers.",
    "Out in deep space, keep an eye out for automated Syndicate Wagering Relays ($), drifting Cryo-Escape Pods (P), Abandoned Fuel Barges (F), Research Satellites (¤), Time Capsules (T), and Precursor Monoliths (Ψ). Just watch your step around old Terran War Space Mines (M)—unless you have a Cyber Slicer to defuse them!",
    "If you collect three Precursor Star Map Fragments, don't sell them piecemeal! Activate them inside your Cargo Hold (I) and their holographic matrices will fuse into an intact Wayfinder Core.",
    "Decrypting engrams sometimes reveals coordinates to Sector [39, 17]. Word in the cantinas is that a ring of Precursor pylons called the 'Sanctuary of the Void' floats out there, waiting to synchronize with a ship's nav-computer.",
    "Astronomers at Frothy Moon Outpost [58, -8] brew the best dark synth-ale in the quadrant. Bring them Planetary Data or Nav-Charts from the deep black and they'll pay a 40% to 50% premium on the spot.",
    "If your fuel gauge is perpetually in the red, plot a course due north to Port Nomad [15, 210]. It's the primary dispatch sanctuary of the Fuel Rats Collective—they refine Tritium into Fuel Cells at half the galactic base price."
];

// Freeze static array for V8 optimization, while keeping an extensible custom pool in RumorManager
Object.freeze(RUMORS);
window.RUMORS = RUMORS;

if (typeof GameRegistry !== 'undefined') {
    GameRegistry.rumors = RUMORS;
}

// ==========================================
// --- STATION-SPECIFIC LOCAL CHATTER ---
// --- (100% Coverage of All Static Ports) ---
// ==========================================

const STATION_RUMORS = {
    "Starbase Alpha": [
        "Starbase Alpha's customs grid is running at peak sensitivity today. If you're carrying Prohibited Stims or Artifact Shards without an Eclipse shielded bay, don't press your luck.",
        "Quartermasters on Deck 4 are buying up Refined Alloy and Minerals for the border fleet expansion. Good steady credits if you're working the local asteroid belts.",
        "Need a fresh start on the frontier? Starbase Alpha's administrative concourse is one of the few hubs licensed to issue Official Settlement Charters and Station Cores."
    ],
    "The Rusty Anchor": [
        "Keep your hand on your sidearm in here. Half the captains at the bar have active SEC-COM warrants, and the other half are Shadow Network brokers looking for a courier.",
        "The Anchor's illicit chem-stills are churning out Prohibited Stims around the clock, provided someone keeps smuggling Medical Supplies past the Concord patrols.",
        "Word at the bar is they've got a dormant Unshackled AI core tucked in the back locker—if you've got the credits and the nerve to haul it past Concord scanners."
    ],
    "Aegis Dyson Sphere": [
        "Look out the observation dome when you undock—the Dyson Sphere's solar collectors harvest enough output from that captured G-type star to power ten thousand worlds.",
        "The Aegis megastructure is practically giving away bulk Food, Water, and Minerals, and their science directorate pays top credit for Quantum Fluid and AI Cores.",
        "If you're assembling a marine strike force, Aegis Dyson Sphere stocks both Combat Drones and Mercenary Platoons right off the concourse."
    ],
    "Planet Xerxes": [
        "The Spire beneath this city isn't Cartel architecture—it's Precursor. Crack the first encryption layer at the terminal, and the Shadow Network brokers will open their vaults to you.",
        "Every Cryptarch on Xerxes swears by the Spire's subspace resonance. Decrypt an Engram or Ancient Archive while docked here and the neural feedback doubles your experience yield.",
        "Some captains descend past all four Spire encryption layers and come back carrying Precursor Artifacts and Void Engine Cores—the ones who survive the lethal countermeasures, anyway."
    ],
    "Karak-Tor": [
        "Hear that low rumble through the deck plates? Those are the atmospheric magma forges of Karak-Tor. Bring the smiths Refined Alloy or Food Supplies and they'll pay in blood-iron and gold.",
        "If you reach 30 Standing with the K'tharr Ascendancy, the shipyard masters here will let you commission a Blood-Barge—350 base hull and a forward ramming spike.",
        "Only challenge the Warlord in the Rite of Combat if your shields and hull are fully upgraded. Once you undock for the Rite, their tractor beams lock the arena—no hailing, no retreat."
    ],
    "Fortress Drakon": [
        "Fortress Drakon guards the eastern approaches into K'tharr space. Return a lost K'tharr Ancestral Blade to the warlords here and they'll pay over double its base value.",
        "The arena bookies in the Proving Grounds are taking wagers up to 500c per match. Just watch the odds on the Captured Xenomorph.",
        "Fortress Drakon's armories smelt Rare Metals straight into heavy shipboard ordnance. If you've been mining the eastern rim, stop by the docks."
    ],
    "Station Umbra": [
        "Station Umbra drifts so far out in the western rim that Concord long-range telemetry can't even resolve its hull. If you have 30 Eclipse Rep, ask the shipyard about the Night-Runner stealth hull.",
        "The engineers in Umbra's lower bays compress salvaged Tech Parts into sensor-absorbent Obsidian Tear Plating. Essential material if you're outfitting a smuggling rig.",
        "Shadow Brokers on Umbra pay triple street value for foreign contraband—just don't try flipping goods bought from Umbra's own shelves back to them."
    ],
    "Port Erebus": [
        "Port Erebus is tucked inside a sensor-baffled dust cloud. The Forger in the back alley can scrub your Concord warrants or plant counterfeit diplomatic credentials if the heat gets too high.",
        "Syndicate bio-techs here ferment Sentient Mycelium into combat stims. They're always buying Luxury Goods, Gold, and Stolen Concord Medals.",
        "Compared to Station Umbra, Port Erebus sits much closer to the Concord border—making it a prime staging point for fast Hot Cargo runs."
    ],
    "Cygnus Prime": [
        "The University of Cygnus Prime has open research grants for Pulsar Timing Data, Magnetar Harmonics, Singularity Telemetry, and Quasar Spectrography—paying up to 200% of galactic base value!",
        "Need a Precursor Cipher or a Telemetry Probe? The university quartermaster stocks both at an academic discount.",
        "Cygnus Prime's xeno-archaeology department will pay 300% of base value for an intact Precursor Datacube before the Obsidian Directorate can classify it."
    ],
    "Kepler Listening Post": [
        "Keep your comms encrypted on approach—Kepler Listening Post is a SEC-COM signal-intelligence relay watching every jump signature near the Kepler Nebula.",
        "The intel analysts here pay double for unredacted Syndicate Ledgers and top credit for Encrypted Data Caches pulled out of deep-space derelicts.",
        "Smart explorers stop at Kepler to stock up on Subspace Recon Beacons and Capacitor Overcharge Cells before diving into the western frontier."
    ],
    "Ceti Alpha Shipyards": [
        "Dread Pirate Voss nearly burned Ceti Alpha Shipyards to slag during the last Cartel raid. Now the drydocks are heavily fortified and paying 150% for raw Platinum Ore and Rare Metals.",
        "Ceti Alpha's assembly lines turn raw Platinum Ore into Tech Parts and Nano-Repair Kits cheaper than almost anywhere else in Concord space.",
        "Planning to build your own deep-space waystation? Ceti Alpha's heavy drydocks sell Station Cores at a 5% discount below Starbase Alpha."
    ],
    "Helios Refinery": [
        "Xy-Corp runs Helios Refinery on a strict 'Progress Through Profit' quota. It's the best place in the sector to pick up cheap Minerals, Refined Alloy, and Atmo-Processors for a new colony.",
        "Because Helios is an industrial smelting platform, they have zero agricultural domes—bring them Water and Food Supplies for an easy 40% to 50% markup.",
        "Helios even fabricates Prefab Colony Cores on-site. Unpack one at an established settlement and you get an instant Hab Block, Condenser, alloys, and 100 colonists."
    ],
    "Valkyrie Drift": [
        "Valkyrie Drift is welded straight onto a hollowed iron asteroid. The roughnecks here sell raw Minerals at 65% of market price and uncracked Crystalline Geodes right off the conveyor belts.",
        "Out here in the drift, fresh water, Frothy Moon Ale, and Droid Servos are worth their weight in gold. Haul a load of ale from Frothy Moon Outpost and watch the miners line up.",
        "If you're running an Automated Mining Drone or refining Platinum Ore into Refined Alloy, Valkyrie's smelting bays are the heart of the eastern independent belt."
    ],
    "Frothy Moon Outpost": [
        "Welcome to Frothy Moon Outpost! Grab a pint of dark synth-ale and check out the 8-inch and NexStar optical telescopes on the lunar observation ridge.",
        "The stargazers here pool their credits to buy Planetary Data and Nav-Charts at a hefty premium, and a mug of Frothy Moon Ale only runs you a fraction of core-world prices.",
        "Bring a crate of Frothy Moon Ale out to Valkyrie Drift [135, -120] and the miners will pay triple what you spent—or keep a bottle in your hold to share with your crew."
    ],
    "Port Nomad": [
        "Port Nomad's promethium cracking towers refine Hydrogen-3 into Fuel Cells at 50% of standard market price. Every long-range explorer tops off their tanks here.",
        "If you build up 10 Reputation with the Fuel Rats Collective by tipping their rescue tugs, their shipwrights will let you commission a high-visibility Salvage & Refuel Tug.",
        "Port Nomad even keeps a rare Wormhole Stabilizer in stock for deep-rim explorers looking to anchor a permanent Stargate out past the frontier."
    ],
    "The Archivist's Vault": [
        "Keep your voice down—the Archivist's AI mainframe monitors every comm channel in this hull graveyard. It trades in Encrypted Engrams, Ancient Archives, and even intact Wayfinder Cores.",
        "If you've pulled Quasar or Singularity telemetry from deep space—or salvaged Star Map Fragments—the Archivist pays higher bounties than almost any broker in the galaxy.",
        "Legends say the Archivist remembers the galaxy before the Concord existed—and buys Precursor Artifacts at more than double galactic base value."
    ]
};

// Flavor attribution tags for Cantina atmosphere (zero assets)
const _RUMOR_SPEAKERS = {
    "MARKET INTEL": ["Off-Duty Hauler", "Freighter Quartermaster", "Bulk-Carrier Broker", "Dockyard Steward"],
    "BOUNTY TRACKER": ["Bounty Hunter", "Off-Duty Aegis Pilot", "SEC-COM Stringer", "Scarred Mercenary"],
    "COLONY DISPATCH": ["Colonial Courier", "Frontier Terraformer", "Charter Surveyor", "Supply Tug Pilot"],
    "XENO-ARCHIVE": ["Cygnus Grad Student", "Wild-Eyed Prospector", "Retired Cryptarch", "Void Pilgrim"],
    "PILOT TACTICS": ["Veteran Interceptor Pilot", "Drydock Chief", "Fuel Rats Dispatcher", "Old Blockade Runner"],
    "SECTOR CHATTER": ["Grizzled Spacer", "Cantina Regular", "Independent Miner", "Rim Drifter"]
};

// ==========================================
// --- INTERNAL HELPERS ---
// ==========================================

function _rumorEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _rumorFormatCredits(num) {
    if (typeof formatNumber === 'function') return formatNumber(num);
    return String(Math.trunc(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ==========================================
// --- SMART RUMOR DECK & LIVE INTEL ENGINE ---
// ==========================================

const RumorManager = {
    _customRumors: [],
    _deck: [],
    _lastRumor: null,
    _recentHistory: [],
    _maxHistory: 12,
    _stationIntelAwarded: new Set(),

    // Comprehensive keyword -> Codex Lore ID mapping (50+ hooks covering lore.js & locations.js)
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
        { match: "First Chord", loreKey: "PRECURSOR_ORIGINS" },
        { match: "Architects", loreKey: "PRECURSOR_ORIGINS" },
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
        { match: "Dyson Sphere", loreKey: "LOCATION_AEGIS_DYSON_SPHERE" },
        { match: "Fortress Drakon", loreKey: "LOCATION_FORTRESS_DRAKON" },
        { match: "Port Erebus", loreKey: "LOCATION_PORT_EREBUS" },
        { match: "Ceti Alpha Shipyards", loreKey: "LOCATION_CETI_ALPHA_SHIPYARDS" },
        { match: "Kepler Listening Post", loreKey: "LOCATION_KEPLER_LISTENING_POST" },
        { match: "Valkyrie Drift", loreKey: "LOCATION_VALKYRIE_DRIFT" },
        { match: "Sanctuary of the Void", loreKey: "LOCATION_SANCTUARY_OF_THE_VOID" },
        { match: "Obsidian Obelisk", loreKey: "LOCATION_OBSIDIAN_OBELISK" },
        { match: "Choir Spire Alpha", loreKey: "LOCATION_CHOIR_SPIRE_ALPHA" },
        { match: "Silentium Relay Zero", loreKey: "LOCATION_SILENTIUM_RELAY_ZERO" },
        { match: "board a live enemy", loreKey: "TACTIC_BOARDING" },
        { match: "Concord Patrol pulls you over", loreKey: "TACTIC_CUSTOMS_EVASION" },
        { match: "Blood-Barge", loreKey: "LORE_SHIP_BLOODBARGE" },
        { match: "Night-Runner", loreKey: "LORE_SHIP_NIGHTRUNNER" },
        { match: "Aegis Gunship", loreKey: "LORE_SHIP_AEGIS" }
    ],

    _getAllStaticRumors: function() {
        return this._customRumors.length > 0 ? RUMORS.concat(this._customRumors) : RUMORS;
    },

    registerRumor: function(text) {
        if (!text || typeof text !== 'string') return false;
        this._customRumors.push(text.trim());
        return true;
    },

    registerStationRumor: function(stationName, text) {
        if (!stationName || !text || typeof text !== 'string') return false;
        if (!STATION_RUMORS[stationName]) STATION_RUMORS[stationName] = [];
        STATION_RUMORS[stationName].push(text.trim());
        return true;
    },

    getRecentHistory: function() {
        return this._recentHistory.slice();
    },

    _recordHistory: function(text) {
        const clean = String(text || "").replace(/^"|"$/g, '');
        this._lastRumor = clean;
        const meta = this.getRumorMeta(clean);
        this._recentHistory.unshift({
            text: clean,
            category: meta.category,
            icon: meta.icon,
            color: meta.color,
            stardate: (typeof currentGameDate !== 'undefined' && !isNaN(currentGameDate)) ? Number(currentGameDate).toFixed(1) : "0.0"
        });
        if (this._recentHistory.length > this._maxHistory) {
            this._recentHistory.pop();
        }
    },

    // Classifies any rumor string into a thematic UI badge, icon, color, and speaker
    getRumorMeta: function(text) {
        const lower = String(text || "").toLowerCase();
        let meta;
        if (lower.includes("shortage") || lower.includes("surplus") || lower.includes("market") || lower.includes("price") || lower.includes("paying") || lower.includes("markup")) {
            meta = { category: "MARKET INTEL", icon: "📈", color: "var(--gold-text)" };
        } else if (lower.includes("bounty") || lower.includes("hunting") || lower.includes("sec-com") || lower.includes("voss") || lower.includes("thorne") || lower.includes("warzone") || lower.includes("warrant")) {
            meta = { category: "BOUNTY TRACKER", icon: "🎯", color: "var(--danger)" };
        } else if (lower.includes("colony") || lower.includes("charter") || lower.includes("silos") || lower.includes("famine") || lower.includes("tax vault") || lower.includes("waystation")) {
            meta = { category: "COLONY DISPATCH", icon: "🏛️", color: "var(--success)" };
        } else if (lower.includes("precursor") || lower.includes("wayfinder") || lower.includes("engram") || lower.includes("nexus") || lower.includes("monolith") || lower.includes("sanctuary") || lower.includes("choir spire") || lower.includes("obelisk")) {
            meta = { category: "XENO-ARCHIVE", icon: "💠", color: "#DDA0DD" };
        } else if (lower.includes("hit [") || lower.includes("press [") || lower.includes("targeting computer") || lower.includes("workbench") || lower.includes("synergy") || lower.includes("loyalty") || lower.includes("discipline mastery")) {
            meta = { category: "PILOT TACTICS", icon: "🧭", color: "var(--accent-color)" };
        } else {
            meta = { category: "SECTOR CHATTER", icon: "🗣️", color: "var(--warning)" };
        }

        const speakers = _RUMOR_SPEAKERS[meta.category] || _RUMOR_SPEAKERS["SECTOR CHATTER"];
        const hash = lower.length + (lower.charCodeAt(0) || 0) + (lower.charCodeAt(Math.floor(lower.length / 2)) || 0);
        meta.speaker = speakers[hash % speakers.length];
        return meta;
    },

    getByCategory: function(categoryName) {
        const target = String(categoryName || "").toUpperCase();
        return this._getAllStaticRumors().filter(r => this.getRumorMeta(r).category === target);
    },

    // Generates a live, context-aware rumor from active game state
    getLiveStateRumor: function() {
        const dynamicPool = [];

        // 1. Active Market Boom / Bust Tip
        if (typeof activeMarketTrend !== 'undefined' && activeMarketTrend && typeof currentGameDate !== 'undefined' && currentGameDate < activeMarketTrend.expiry) {
            const itemObj = (typeof COMMODITIES !== 'undefined' && COMMODITIES[activeMarketTrend.item])
                ? COMMODITIES[activeMarketTrend.item]
                : { name: activeMarketTrend.item };
            if (activeMarketTrend.isBoom) {
                dynamicPool.push(`Want a hot trade tip? ${activeMarketTrend.station} is suffering a critical shortage of ${itemObj.name} right now. They're paying 250% of standard market value if you can get a shipment there before Stardate ${activeMarketTrend.expiry.toFixed(1)}!`);
            } else {
                dynamicPool.push(`Looking for cheap cargo? ${activeMarketTrend.station} has a massive surplus of ${itemObj.name}. They're practically giving it away at 40% of base price until Stardate ${activeMarketTrend.expiry.toFixed(1)}.`);
            }
        }

        // 2. Active Bounty Target Sighting
        if (typeof playerActiveBounty !== 'undefined' && playerActiveBounty && playerActiveBounty.targetName) {
            dynamicPool.push(`You're hunting ${playerActiveBounty.targetName}, right? Long-range freighter telemetry just pinged their drive signature near coordinates [${playerActiveBounty.x}, ${-playerActiveBounty.y}]. Check your Nav-Computer (N) before they jump!`);
        }

        // 3. Active Smuggling / Delivery Contract Hint
        if (typeof playerActiveMission !== 'undefined' && playerActiveMission && !playerActiveMission.isComplete && playerActiveMission.objectives && playerActiveMission.objectives[0]) {
            const obj = playerActiveMission.objectives[0];
            if (obj.destinationName && typeof LOCATIONS_DATA !== 'undefined' && LOCATIONS_DATA[obj.destinationName] && LOCATIONS_DATA[obj.destinationName].coords) {
                const coords = LOCATIONS_DATA[obj.destinationName].coords;
                dynamicPool.push(`Hauling a contract for ${obj.destinationName}? Set your helm for [${coords.x}, ${-coords.y}]. Keep your shields up on approach.`);
            }
        }

        // 4. Active Sector Warzone Alert
        if (typeof activeSkirmishes !== 'undefined' && Array.isArray(activeSkirmishes) && activeSkirmishes.length > 0) {
            const sk = activeSkirmishes[0];
            if (sk && sk.x !== undefined && sk.y !== undefined) {
                dynamicPool.push(`Emergency fleet chatter just came over the wire—Concord and ${sk.factionB || 'hostile'} gunships are locked in an active warzone at [${sk.x}, ${-sk.y}]! Plenty of salvage if you can dodge the crossfire.`);
            }
        }

        // 5. Dynamic Faction War Front Update
        if (typeof GameState !== 'undefined' && GameState.world && GameState.world.factionOffsets) {
            const kFront = GameState.world.factionOffsets.KTHARR;
            const eFront = GameState.world.factionOffsets.ECLIPSE;
            if (kFront < 18) {
                dynamicPool.push(`The K'tharr Ascendancy has pushed deep into eastern space—their border front is all the way in at Macro-Sector ${kFront}. Concord patrols are scrambling to hold the line.`);
            }
            if (eFront > -18) {
                dynamicPool.push(`The Eclipse Cartel is expanding fast in the western rim. Shadow-ports have crept inward to Macro-Sector ${eFront}. Watch your cargo hold out there.`);
            }
        }

        // 6. Player Colony Status & Crisis Alerts (with safe storage guard & formatted credits)
        if (typeof playerColonies !== 'undefined' && playerColonies) {
            const cols = Object.values(playerColonies).filter(c => c && c.established);
            cols.forEach(col => {
                const foodAmt = (col.storage && col.storage['FOOD_SUPPLIES']) ? col.storage['FOOD_SUPPLIES'] : 0;
                const safeColName = col.name || "Frontier Colony";
                if (foodAmt <= 0) {
                    dynamicPool.push(`Heard a distress relay from your settlement at ${safeColName} [${col.x}, ${-col.y}]—their Food Supplies are completely depleted! Get a relief shipment or Hydroponics Farm online before famine sets in.`);
                } else if ((col.treasury || 0) >= 2500) {
                    dynamicPool.push(`Merchant captains say the tax vault at your ${safeColName} settlement [${col.x}, ${-col.y}] is sitting on ${_rumorFormatCredits(col.treasury)}c in collected tariffs. Might be worth a trip to withdraw your funds.`);
                } else if ((col.defense || 0) < 20 && (col.population || 0) >= 150) {
                    dynamicPool.push(`Word is Cartel raiders are eyeing your colony at ${safeColName} [${col.x}, ${-col.y}]. With a Defense Rating of only ${col.defense || 0}, you should build Automated Turrets or a Defense Battery soon.`);
                }
            });
        }

        // 7. Player Waystation Toll Alerts
        if (typeof worldStateDeltas !== 'undefined' && worldStateDeltas) {
            for (const key in worldStateDeltas) {
                const d = worldStateDeltas[key];
                if (d && d.isPlayerOwned && d.isTinyOutpost && (d.treasury || 0) >= 500) {
                    const [wx, wy] = key.split('_')[0].split(',').map(Number);
                    if (!isNaN(wx) && !isNaN(wy)) {
                        dynamicPool.push(`Independent haulers passing through [${wx}, ${-wy}] say your waystation, ${d.name || 'Outpost'}, has accumulated ${_rumorFormatCredits(d.treasury)}c in transit tolls ready for pickup.`);
                        break;
                    }
                }
            }
        }

        // 8. Deployed Telemetry Probe Harvest Alerts
        if (typeof window.activeProbes !== 'undefined' && Array.isArray(window.activeProbes) && typeof currentGameDate !== 'undefined') {
            const readyProbe = window.activeProbes.find(p => p && Math.floor((currentGameDate - p.deployedAt) / 10) >= 2);
            if (readyProbe) {
                const count = Math.floor((currentGameDate - readyProbe.deployedAt) / 10);
                dynamicPool.push(`Your autonomous Telemetry Probe at [${readyProbe.x}, ${-readyProbe.y}] is pinging a full memory buffer—it's recorded ${count} astrometric data drives so far.`);
            }
        }

        // 9. Wayfinder Core / Star Map Fragment Quest Hints
        if (typeof playerCargo !== 'undefined') {
            if ((playerCargo['WAYFINDER_CORE'] || 0) > 0 && typeof mystery_first_nexus_location !== 'undefined' && mystery_first_nexus_location) {
                dynamicPool.push(`My nav-sensors went haywire the moment you docked... are you carrying a Wayfinder Core? Whatever signal it's locked onto is coming straight from [${mystery_first_nexus_location.x}, ${-mystery_first_nexus_location.y}].`);
            } else {
                const frags = playerCargo['PRECURSOR_STAR_MAP_FRAGMENT'] || 0;
                if (frags > 0 && frags < 3) {
                    dynamicPool.push(`Saw a Precursor Star Map Fragment logged in your hold. Find ${3 - frags} more shard(s) and activate them in Cargo (I)—they fuse into a full Wayfinder Core.`);
                }
            }
        }

        // 10. High Notoriety / Crew Loyalty Situational Whispers
        if (typeof playerNotoriety !== 'undefined' && playerNotoriety >= 15) {
            const capName = typeof playerName !== 'undefined' ? playerName : "Captain";
            dynamicPool.push(`Keep your collar up, ${capName}—your Concord warrant count is at ${playerNotoriety}. Pay off the Security Office or visit The Forger at Port Erebus [-175, -80] before an Aegis wing corners you.`);
        }
        if (typeof playerCrew !== 'undefined' && Array.isArray(playerCrew) && playerCrew.length > 0) {
            const restless = playerCrew.find(c => c && typeof c.loyalty === 'number' && c.loyalty < 45);
            if (restless) {
                dynamicPool.push(`Overheard ${restless.name} grumbling at the bar about long shifts. A Shore Leave bonus or a bottle of Frothy Moon Ale in the Crew Roster might keep morale steady.`);
            }
        }

        // 11. Local Station Specific Chatter
        if (typeof chunkManager !== 'undefined' && typeof playerX !== 'undefined' && typeof playerY !== 'undefined') {
            const localTile = chunkManager.getTile(playerX, playerY);
            if (localTile && localTile.name && STATION_RUMORS[localTile.name]) {
                STATION_RUMORS[localTile.name].forEach(r => dynamicPool.push(r));
            }
        }

        // 12. Undiscovered Static Landmark Breadcrumb (uses display name & skips procedural outposts)
        if (typeof LOCATIONS_DATA !== 'undefined' && typeof discoveredLocations !== 'undefined' && discoveredLocations.has) {
            const undiscovered = Object.keys(LOCATIONS_DATA).filter(key => {
                const loc = LOCATIONS_DATA[key];
                if (!loc || !loc.coords || loc.isProcedural) return false;
                const displayName = loc.name || key;
                return !discoveredLocations.has(displayName) && !discoveredLocations.has(key);
            });
            if (undiscovered.length > 0) {
                const pickKey = undiscovered[Math.floor(Math.random() * undiscovered.length)];
                const loc = LOCATIONS_DATA[pickKey];
                const displayName = loc.name || pickKey;
                const c = loc.coords;
                dynamicPool.push(`Looking for uncharted ports? Long-range couriers talk about '${displayName}' out at coordinates [${c.x}, ${-c.y}]. Might be worth plotting a course.`);
            }
        }

        const recentTexts = new Set(this._recentHistory.map(h => h.text));
        const freshPool = dynamicPool.filter(r => !recentTexts.has(r));
        const poolToUse = freshPool.length > 0 ? freshPool : dynamicPool;
        if (poolToUse.length === 0) return null;
        return poolToUse[Math.floor(Math.random() * poolToUse.length)];
    },

    // Scans a rumor for matching lore hooks and unlocks the first still-locked entry
    _unlockMatchingLore: function(text) {
        if (typeof unlockLoreEntry !== 'function') return null;
        const lowerText = String(text || "").toLowerCase();

        for (let i = 0; i < this._loreHooks.length; i++) {
            const hook = this._loreHooks[i];
            if (lowerText.includes(hook.match.toLowerCase())) {
                const loreObj = (typeof LORE_DATABASE !== 'undefined') ? LORE_DATABASE[hook.loreKey] : null;
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

    // Draws a non-repeating rumor (options: { unlockLore, preferLive })
    getNextRumorDetailed: function(options = {}) {
        const unlockLore = options.unlockLore !== false;
        const preferLive = Boolean(options.preferLive);
        let chosen = null;
        let isLive = false;

        if (preferLive || Math.random() < 0.38) {
            const liveRumor = this.getLiveStateRumor();
            if (liveRumor && (preferLive || liveRumor !== this._lastRumor)) {
                chosen = liveRumor;
                isLive = true;
            }
        }

        if (!chosen) {
            const allRumors = this._getAllStaticRumors();
            if (this._deck.length === 0) {
                this._deck = allRumors.map((_, idx) => idx);
                for (let i = this._deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const temp = this._deck[i];
                    this._deck[i] = this._deck[j];
                    this._deck[j] = temp;
                }
            }

            let nextIdx = this._deck.pop();
            chosen = allRumors[nextIdx] || allRumors[0];

            if (chosen === this._lastRumor && this._deck.length > 0) {
                const altIdx = this._deck.pop();
                this._deck.unshift(nextIdx);
                chosen = allRumors[altIdx] || chosen;
            }
        }

        this._recordHistory(chosen);
        const unlockedTitle = unlockLore ? this._unlockMatchingLore(chosen) : null;
        const meta = this.getRumorMeta(chosen);

        return {
            text: chosen,
            meta: meta,
            isLive: isLive,
            unlockedTitle: unlockedTitle
        };
    },

    // Backward-compatible string getter
    getNextRumor: function(unlockLore = true) {
        return this.getNextRumorDetailed({ unlockLore }).text;
    }
};

window.RumorManager = RumorManager;
window.getSmartRumor = () => RumorManager.getNextRumor(true);

// ==========================================
// --- SELF-CONTAINED CANTINA & NPC HOOKS ---
// ==========================================

(function initRumorsModuleHooks() {
    function attachRumorHooks() {
        // Detect if perks.js already wrapped stations.js's listenToRumors before rumors.js ran
        const replacedPerksCantinaWrapper = Boolean(window._perksRumorsHooked);

        function renderOverheardLogPane() {
            const detailEl = document.getElementById('genericDetailContent');
            if (!detailEl) return;

            const history = RumorManager.getRecentHistory();
            const entriesHtml = history.length > 0
                ? history.map(entry => `
                    <div style="background:rgba(0,0,0,0.3); border-left:3px solid ${entry.color}; padding:10px; border-radius:0 4px 4px 0; margin-bottom:8px; text-align:left;">
                        <div style="display:flex; justify-content:space-between; font-size:9px; letter-spacing:1px; margin-bottom:4px;">
                            <span style="color:${entry.color}; font-weight:bold;">${entry.icon} ${entry.category}</span>
                            <span style="color:var(--item-desc-color);">SD ${entry.stardate}</span>
                        </div>
                        <div style="font-size:12px; color:var(--text-color); font-style:italic; line-height:1.5;">
                            "${_rumorEscapeHtml(entry.text)}"
                        </div>
                    </div>
                `).join('')
                : `<div style="padding:20px; color:var(--item-desc-color); font-size:12px; font-style:italic;">No rumors logged during this session yet.</div>`;

            detailEl.innerHTML = `
                <div style="text-align:center; padding: 12px 8px; animation: fadeIn 0.25s ease-out;">
                    <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:6px; font-weight:bold;">RECENT CANTINA INTERCEPTS (${history.length})</div>
                    <div style="max-height:250px; overflow-y:auto; padding-right:4px;">
                        ${entriesHtml}
                    </div>
                    <button class="action-button" style="margin-top:12px; padding:8px 12px; font-size:11px; border-color:var(--accent-color); color:var(--accent-color);" onclick="listenToRumors()">
                        ◀ BACK TO EAVESDROPPING
                    </button>
                </div>
            `;
        }

        window.viewRumorHistory = renderOverheardLogPane;

        // 1. Upgrade listenToRumors() in stations.js with Smart Deck, Live Intel mode & History
        window.listenToRumors = function(preferLive = false) {
            const detailEl = document.getElementById('genericDetailContent');
            if (typeof soundManager !== 'undefined' && typeof soundManager.playUIHover === 'function') {
                soundManager.playUIHover();
            }

            const result = RumorManager.getNextRumorDetailed({ unlockLore: true, preferLive: Boolean(preferLive) });
            const rumorText = result.text;
            const meta = result.meta;

            // Grant +10 XP intelligence bonus once per station visit/stardate (scoped to current campaign)
            let xpBadgeHtml = "";
            let gainedXP = false;
            const loc = (typeof chunkManager !== 'undefined' && typeof playerX !== 'undefined') ? chunkManager.getTile(playerX, playerY) : null;
            const campId = (typeof currentCampaignId !== 'undefined' && currentCampaignId) ? currentCampaignId : 'SESSION';
            const visitKey = `${campId}_${loc && loc.name ? loc.name : 'PORT'}_${Math.floor(typeof currentGameDate !== 'undefined' ? currentGameDate : 0)}`;

            if (!RumorManager._stationIntelAwarded.has(visitKey) && typeof playerXP !== 'undefined') {
                if (RumorManager._stationIntelAwarded.size > 200) {
                    RumorManager._stationIntelAwarded.clear();
                }
                RumorManager._stationIntelAwarded.add(visitKey);

                let totalIntelXP = 10;
                let cantinaFixerActive = false;

                // Preserve CANTINA_FIXER (+15 bonus XP) if perks.js's wrapper was overwritten by load order
                if (replacedPerksCantinaWrapper && typeof hasPlayerPerk === 'function' && hasPlayerPerk('CANTINA_FIXER')) {
                    totalIntelXP += 15;
                    cantinaFixerActive = true;
                }

                playerXP += totalIntelXP;
                gainedXP = true;

                xpBadgeHtml = `<div style="margin-top:10px; font-size:11px; color:var(--success); font-weight:bold;">+${totalIntelXP} XP (${cantinaFixerActive ? 'Cantina Regular Backroom Intel' : 'Sector Intelligence Gathered'})</div>`;
                if (cantinaFixerActive && typeof logMessage === 'function') {
                    logMessage("<span style='color:var(--gold-text)'>[ CANTINA REGULAR ] Locals shared deeper backroom intel (+15 bonus XP).</span>");
                }
            }

            const loreUnlockBadgeHtml = result.unlockedTitle
                ? `<div style="margin-top:8px; padding:6px 10px; background:rgba(0,224,224,0.1); border:1px solid var(--accent-color); border-radius:4px; font-size:11px; color:var(--accent-color); font-weight:bold;">📘 CODEX DECRYPTED: ${_rumorEscapeHtml(result.unlockedTitle)}</div>`
                : '';

            const liveTag = result.isLive
                ? `<span style="margin-left:6px; font-size:9px; background:rgba(0,255,100,0.15); color:var(--success); border:1px solid var(--success); padding:2px 6px; border-radius:3px; letter-spacing:1px;">LIVE WIRE</span>`
                : '';

            if (detailEl) {
                detailEl.innerHTML = `
                    <div style="text-align:center; padding: 12px 8px; animation: fadeIn 0.25s ease-out;">
                        <div style="font-size:40px; margin-bottom:6px; filter: drop-shadow(0 0 12px ${meta.color});">${meta.icon}</div>
                        <div style="margin-bottom:8px;">
                            <span style="display:inline-block; font-size:10px; color:${meta.color}; border:1px solid ${meta.color}; padding:2px 8px; border-radius:3px; letter-spacing:2px; font-weight:bold;">
                                ${meta.category}
                            </span>
                            ${liveTag}
                        </div>
                        <h3 style="color:var(--accent-color); margin: 0 0 10px 0; font-size:17px;">OVERHEARD IN THE BOOTH</h3>
                        
                        <div style="text-align:left; background: var(--bg-color); border: 1px dashed var(--border-color); border-left: 3px solid ${meta.color}; padding: 14px; border-radius: 4px;">
                            <p style="font-size:11px; color:var(--item-desc-color); margin:0 0 8px 0;">
                                Source: <b style="color:var(--text-color);">${_rumorEscapeHtml(meta.speaker)}</b>
                            </p>
                            <p style="font-size:13px; color:var(--text-color); font-style:italic; margin:0; line-height:1.6;">
                                "...${_rumorEscapeHtml(rumorText)}"
                            </p>
                        </div>
                        ${loreUnlockBadgeHtml}
                        ${xpBadgeHtml}
                        <div style="display:flex; gap:6px; margin-top:12px;">
                            <button class="action-button" style="flex:1; margin:0; padding:8px 6px; font-size:10px; border-color:${meta.color}; color:${meta.color};" onclick="listenToRumors(false)">
                                👂 ANOTHER TABLE
                            </button>
                            <button class="action-button" style="flex:1; margin:0; padding:8px 6px; font-size:10px; border-color:var(--success); color:var(--success);" onclick="listenToRumors(true)">
                                📡 LIVE INTEL
                            </button>
                        </div>
                        <button class="action-button" style="margin-top:6px; padding:6px 10px; font-size:10px; border-color:#666; color:var(--item-desc-color);" onclick="viewRumorHistory()">
                            📜 OVERHEARD LOG (${RumorManager.getRecentHistory().length})
                        </button>
                    </div>
                `;
            }

            if (gainedXP) {
                if (typeof renderUIStats === 'function') renderUIStats();
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }
        };

        // 2. Enrich ambient NPC ship hails in script.js so space traffic shares varied lore & accurate HUD coords
        if (typeof NPC_SHIP_TYPES !== 'undefined' && Array.isArray(NPC_SHIP_TYPES) && !window._rumorsNpcHailsExpanded) {
            const extraCivHails = [
                "Heard Frothy Moon Outpost [58, -8] just tapped a new batch of dark synth-ale.",
                "Stay clear of the western rim unless you enjoy paying tolls to the Eclipse Cartel.",
                "Port Nomad [15, 210] is selling Fuel Cells at half price if your tanks are running low.",
                "Ceti Alpha Shipyards [-90, 130] is paying top credit for raw Platinum Ore right now."
            ];
            const extraMinerHails = [
                "Wait for the mining laser to hit the green fault line, or the rock will blow back in your face!",
                "Pulled a Crystalline Geode out of an asteroid today—cracked it open in my hold for pure Platinum Ore.",
                "Helios Refinery [-55, -110] is buying up raw ore and selling cheap Refined Alloy.",
                "Heading back to Valkyrie Drift [135, -120] before my ore hopper bursts."
            ];
            const extraConcordHails = [
                "SEC-COM reminder: Dread Pirate Voss and Renegade Commander Thorne are wanted dead or alive.",
                "All vessels: report any sightings of Precursor anomalies to the University of Cygnus Prime [85, 65].",
                "Kepler Listening Post [-68, 42] is offering bounties for recovered Cartel ledgers.",
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
