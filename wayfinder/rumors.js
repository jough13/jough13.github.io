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

    // ==========================================
    // --- STEALTH, NAVIGATION & SENSORS ---
    // ==========================================
    "Heard about the 'Silent Running' trick? Hit [Q] to cut your main reactor. You can slip right past Concord patrols or Cartel ambushes, but watch your heat gauge. Stay cloaked past 5 heat units, and your own reactor core will start melting your hull.",
    "Your Nav-Computer (N) isn't just for show. If you're lost, ping it. It prioritizes active rescues, bounties, and mission drop-offs, and it'll always point you to the nearest safe harbor if you're in a pinch.",
    "If you've got 5 spare fuel, hit [P] to fire an Active Sensor Ping. It'll light up any Derelicts, Wormholes, or hidden Cartel strongholds within 5 klicks—or 10 klicks if you've installed the Long-Range Sensors perk.",
    "Have you calibrated your Deep Space Astrometric Observatory (O) yet? If you mount a NexStar-4SE Optical Array in your scanner slot, you can double your optical telemetry range and resolve free Planetary Data cartridges from long-exposure sector plates!",
    "Keep your eyes peeled for high-velocity icy comets streaking across the sector map. If you can plot an intercept vector and fly right through their tail, your scoops will harvest pure Hydrogen-3 and even Void Crystals.",

    // ==========================================
    // --- COMBAT, BOARDING & WARZONES ---
    // ==========================================
    "Any rookie can shoot a hull. A real pilot uses the Targeting Computer to draw their teeth. Drop their shields first, then target their Weapons to halve their attack power, or knock out their Engines so they can't evade.",
    "If a pirate demands a toll, check your terrain before you try to run. Weaving through an Asteroid Field gives you a +25% escape bonus, and diving into a dense Nebula boosts escape odds by +35%!",
    "Don't confuse a derelict airlock breach with a full-scale military raid. You can clear a ghost ship with your personal blaster, but if you want to board a live enemy ship for 3x salvage—or storm a planetary Cartel Outpost—you'll need Mercenary Platoons in your barracks.",
    "The Cartel builds their planetary strongholds tough. If you're going to raid one, keep at least 25 Fuel in your tanks for an Orbital Bombardment, and bring a Goliath Assault Mech if you want +50% fire support for your Marines.",
    "When Concord and Cartel fleets clash in an Active Sector Warzone, don't just fly past. You can link comms with either commander to coordinate strikes, or drift into the wreckage field to scavenge Void Crystals and Tech Parts while they're busy shooting each other.",
    "Ever notice the Manufacturer tags on your ship components? If you equip at least three modules from the same faction—like Concord, K'tharr, Eclipse, or Frontier—your ship's computer unlocks a powerful Set Synergy bonus.",

    // ==========================================
    // --- MINING, CRAFTING & PLANETARY EVA ---
    // ==========================================
    "Don't just hold the trigger down when mining an asteroid. Wait until the mining laser aligns with the green structural fault line. Hit the sweet spot and you can pull Platinum Ore or Rare Metals; miss it, and the thermal feedback will scorch your hull.",
    "Before you descend onto an Irradiated Wasteland or scoop fuel from a fiercely hot O-Class or B-Class supergiant, make sure you've got a Lead-Lined Dosimetry Array equipped—or a background as a Certified Health Physicist—unless you enjoy gamma flux cooking your hull.",
    "You don't need a starbase to patch your ship or refine ore. Press [U] anywhere in space to open your Engineering Workbench. You can smelt Minerals into Refined Alloy, synthesize Nano-Repair Kits, or permanently reinforce your hull plating and shield capacitors.",
    "If you ever find a legendary Machine World, don't bother with a standard mining laser. Interface directly with the planetary Core Network—especially if you have the Cyber Slicer perk—to siphon thousands of credits and intact AI Cores.",
    "Watch out for Death Worlds on the outer rim. The apex predators there will chew through a rover hull in seconds, though black-market brokers pay a fortune for the Illegal Organs and Genetic Samples you can harvest from the surface.",

    // ==========================================
    // --- CRYPTARCH, FORGER & BLACK MARKET ---
    // ==========================================
    "Got an Encrypted Engram or Ancient Archive? Take it to the Cryptarch at a major hub, or crack it for free with the Cyber Slicer perk. Better yet, if you decrypt engrams while docked at Planet Xerxes, the Spire's resonance doubles your XP payout!",
    "Looking to fence 'Hot Cargo'? The moment you accept a smuggling run from the Shadow Broker, Aegis Pursuit Craft will lock onto its beacon. Engage Silent Running (Q) to mask your signature on the way to the drop-off.",
    "If you find yourself holding contraband when a Concord Patrol pulls you over, pray you have the 'Silver Tongue' perk or a Smuggler crewmate to cut the bribe in half—or pop a Sensor Decoy from your hold before you dock.",
    "Picked up too much Concord Notoriety? Find 'The Forger' at an outlaw port. He can slice into SEC-COM relays to wipe your warrants for cheaper than official fines, plant forged diplomatic credentials for +15 Concord Rep, or scramble your transponder to shake pursuers.",
    "Out in deep space, keep an eye out for automated Syndicate Wagering Relays ($), drifting Cryo-Escape Pods (P), and Precursor Monoliths (Ψ). Just watch your step around old Terran War Space Mines (M)—unless you have a Cyber Slicer to defuse them!"
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
// --- SMART RUMOR DECK & LIVE INTEL ENGINE ---
// ==========================================

const RumorManager = {
    _deck: [],
    _lastRumor: null,

    // Mapping keywords in rumors to Codex Lore IDs so hearing a rumor can unlock background lore
    _loreHooks: [
        { match: "Voidfang", loreKey: "FACTION_ECLIPSE" },
        { match: "K'tharr", loreKey: "FACTION_KTHARR" },
        { match: "Void Crystals", loreKey: "PHENOMENON_VOID_CRYSTALS" },
        { match: "Sentient Mycelium", loreKey: "LEGEND_SENTIENT_MYCELIUM_NETWORK" },
        { match: "Phase-Shifted Alloy", loreKey: "TECH_PHASE_SHIFT_ALLOY" },
        { match: "Wormholes", loreKey: "PHENOMENON_WORMHOLE" },
        { match: "Stargate", loreKey: "PHENOMENON_WORMHOLE" },
        { match: "Fuel Rats", loreKey: "FACTION_FUEL_RATS" },
        { match: "Encrypted Engram", loreKey: "COMMODITY_ENCRYPTED_ENGRAM" },
        { match: "Settlement Charters", loreKey: "TECH_COLONY_CHARTER" },
        { match: "Machine World", loreKey: "XENO_MACHINE_WORLD" },
        { match: "Irradiated Wasteland", loreKey: "PHENOMENON_IRRADIATED" }
    ],

    // Generates a live, context-aware rumor from active game state (Economy, Bounties, War Fronts)
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

        if (dynamicPool.length === 0) return null;
        return dynamicPool[Math.floor(Math.random() * dynamicPool.length)];
    },

    // Draws a non-repeating rumor (25% chance for live galactic intel if available)
    getNextRumor: function(unlockLore = true) {
        if (Math.random() < 0.25) {
            const liveRumor = this.getLiveStateRumor();
            if (liveRumor && liveRumor !== this._lastRumor) {
                this._lastRumor = liveRumor;
                return liveRumor;
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

        const nextIdx = this._deck.pop();
        const chosen = RUMORS[nextIdx] || RUMORS[0];
        this._lastRumor = chosen;

        // Optionally unlock related Codex Lore silently or with notification if the rumor mentions it
        if (unlockLore && typeof unlockLoreEntry === 'function') {
            for (let i = 0; i < this._loreHooks.length; i++) {
                const hook = this._loreHooks[i];
                if (chosen.includes(hook.match)) {
                    unlockLoreEntry(hook.loreKey);
                    break;
                }
            }
        }

        return chosen;
    }
};

window.RumorManager = RumorManager;
window.getSmartRumor = () => RumorManager.getNextRumor(true);

// --- END OF FILE rumors.js ---
