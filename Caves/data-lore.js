// --- START OF FILE data-lore.js ---

// ==========================================
// LORE, QUESTS, & WORLD BUILDING DATA
// ==========================================

window.LORE_SETS = {
    // --- EARLY GAME SETS ---
    "wanderers_almanac": {
        name: "The Wanderer's Almanac",
        description: "Scattered pages from a master cartographer who went mad trying to map the shifting leylines.",
        bonus: "Eagle-Eyed: +1 Base Perception.",
        items: ["📄", "📜r", "📜m"] 
    },
    "adventurer_tips": {
        name: "The Survivalist's Guide",
        description: "Scraps of practical advice left by those who came before and perished.",
        bonus: "Hardy: Hunger/Thirst drain 10% slower.",
        items: ["1", "2", "q"] // Refers to Conscript's Orders, Thief's Map, Bandit's Note
    },
    "beastmaster_guide": {
        name: "The Beastmaster's Guide",
        description: "A tattered, blood-stained guide to the creatures of this world.",
        bonus: "Tracker: +1 Base Perception.",
        items: ["🐾1", "🐾2", "🐾3"] 
    },
    
    // --- MID GAME SETS ---
    "king_fall": {
        name: "The Fall of Alaric",
        description: "The firsthand account of the King's descent into madness and the shattering of the crown.",
        bonus: "Authority: Shop prices reduced by 10%.",
        items: ["📜1", "📜2", "📜3", "📜4", "📜5"] 
    },
    "anglers_almanac": {
        name: "The Old Mariner's Tale",
        description: "The rantings of a sailor who saw what sleeps beneath the deep ocean.",
        bonus: "Sea Legs: +1 Base Luck.",
        items: ["⚓", "🍾", "🐚"] 
    },
    "deep_delver": {
        name: "The Deep Delver",
        description: "Accounts from the most dangerous, subterranean corners of the world.",
        bonus: "Tireless: +5 Max Stamina.",
        items: ["📘", "J", "L"] 
    },
    "architects_ledger": {
        name: "The Architect's Ledger",
        description: "Blueprints detailing the true purpose of the ancient fortresses.",
        bonus: "Stalwart: +5 Max Health.",
        items: ["📜f", "🧱", "▤"] 
    },
    "dwarven_mining_logs": {
        name: "Dwarven Mining Logs",
        description: "Sturdy leather-bound notes detailing exactly what the dwarves found when they dug too deep.",
        bonus: "Demolitionist: +1 Base Constitution.",
        items: ["🧨", "⛏️", "💎r"] 
    },

    // --- LATE GAME / MULTIVERSE SETS ---
    "void_research": {
        name: "Notes from the Void",
        description: "Forbidden research notes left by the First Mage detailing the architecture of the multiverse.",
        bonus: "Clarity: +10 Max Mana.",
        items: ["3", "j", "4"] // Refers to Burned Scroll, Acolyte's Scribblings, Mad Scrawlings
    },
    "mythos_of_the_stars": {
        name: "Mythos of the Stars",
        description: "Constellations charted by a lonely stargazer tracking the rifts in the firmament.",
        bonus: "Cosmic Insight: +2 Base Willpower.",
        items: ["constellation_1", "constellation_2", "constellation_3"] 
    },
    "the_shadowed_hand": {
        name: "The Shadowed Hand",
        description: "A dossier compiled by the Inquisitor detailing the Cult's structure and the Necromancer Lord.",
        bonus: "Zealot's Bane: +1 Base Strength.",
        items: ["📜c", "🧿s", "z"] 
    },
    
    // --- BRAND NEW LORE SETS ---
    "fae_tales": {
        name: "Tales of the Feywild",
        description: "Accounts of those who stepped into the Fairy Rings and returned... changed.",
        bonus: "Trickster's Grace: +2 Base Dexterity.",
        items: ["fae_1", "fae_2", "fae_3"] // Perfectly mapped to data-items.js!
    },
    "infernal_mechanics": {
        name: "Infernal Mechanics",
        description: "The blueprints of the Clockwork Guardians and the Efreet that power them.",
        bonus: "Engineer: +1 Base Wits.",
        items: ["⚙️", "🔥c", "📜l"] 
    },
    "chronicles_of_the_abyss": {
        name: "Chronicles of the Abyss",
        description: "The final, waterlogged journal of the explorer who discovered the Leviathan's trench.",
        bonus: "Deep Lung: +5 Max Stamina.",
        items: ["📦w", "💎b", "💀d"]
    },
    "explorers_guild": {
        name: "The Cartographer's Notes",
        description: "The sprawling, often inaccurate field notes of the Guild's most ambitious trailblazers.",
        bonus: "Wayfarer: Leyline travel costs reduced by 10%.",
        items: ["🗺️", "🧭", "🧭v"]
    },
    "bard_songs": {
        name: "Songs of the Wandering Bard",
        description: "Transcribed lyrics of the songs heard echoing across the empty plains.",
        bonus: "Silver Tongue: +2 Base Charisma.",
        items: ["🎵", "📜r", "📜c"] // The Bard isn't a collectible item, but discovering him logs the event!
    }
};

window.LORE_STONE_MESSAGES = [
    // Original Messages
    "The stars align when the five thrones are empty.",
    "Iron rots, but obsidian remembers.",
    "Do not trust the water in the deep grotto.",
    "The King was not the first to fall to the shadow.",
    "Magic requires sacrifice. Always.",
    "The dragons did not flee. They were driven out by something worse.",
    "If the stone weeps, the Void is near.",
    "The Elves knew the truth, and so they burned their own cities.",
    "Do not dig too deep. The earth is a cage, not a mother.",
    "The phase walls of the {purple:Void Sanctum} cannot be broken, only walked through.",
    "A true master of the blade deflects the blow before it falls.",
    "Seek the {purple:Fairy Rings} in the forest. They offer a gamble with the Fae.",
    "The {red:Blood Moon} is the eye of the dead god opening.",
    "Time flows differently where the shadows pool.",
    "He who wields the Stormbringer must fear the rain.",
    "A mirror reflects the body, but the Void reflects the mind.",
    "Beware the smiling merchant; his scales are tipped with lead.",
    "The Leviathan slumbers, but its dreams cause the tides.",
    "To tame a beast, one must first break its will. To break a man, simply give him gold.",
    "The ashes of the Oracle still speak, if you know how to listen.",
    "A world built on glass cannot withstand a falling star.",
    "The astrolabe points not to the stars, but to the {purple:realms between them}.",
    "Even the Kraken fears what sleeps in the deepest trench.",
    "The sky is not a ceiling, but an ocean waiting to be sailed.",
    "If you stare into the chasm long enough, it will invite you inside.",
    "A dimensional vault is merely a fold in the fabric of the Akashic Records.",
    "When the sky bleeds purple, close your eyes and cover your ears.",
    "The clockwork guardians do not hate you. They simply do not care.",
    "The Cult of the Shadowed Hand seeks to reforge the shattered crown.",
    "Heed the Cartographer's warnings. There are places where the map ends for a reason.",
    "Some dimensions were abandoned by their creators. Do not linger in them.",
    "The stars you see are not suns. They are the campfires of the gods who abandoned us.",
    "Only a fool plants a Cloudseed indoors. The heavens cannot be contained.",
    "Death is not an end here, merely a shift in the leylines. The Void spits us back out.",
    "Before there were castles, there were the Crystal Spires. The dwarves shattered them out of greed.",
    "The fairies trade in memories, not gold. A Memory Shard is worth a fortune in the Deep Woods.",
    
    // BRAND NEW LORE EXPANSION
    "The {orange:Meteor} spell is not a creation of fire, but of gravity. You are pulling the sky down.",
    "To enchant a weapon is to force an agreement between metal and the Void.",
    "The Colosseum was built over a Leyline Convergence. The blood spilled there feeds the network.",
    "The 'Safe Haven' is a lie. It is merely the last place He hasn't looked.",
    "The {cyan:Prime Tuning Fork} does not teleport you; it simply reminds the universe where you belong.",
    "If you kill the Necromancer Lord, another will take the crown. The cycle is unbreakable.",
    "The giant spiders are not beasts. They are the immune system of the corrupted earth.",
    "The First Mage did not discover the Void. He created it by trying to erase a mistake.",
    "A {blue:Sailing Ship} cannot cross the edge of the world. It simply wraps around to the beginning of the nightmare.",
    "The wandering Bard knows the end of the story, but he refuses to sing the final verse.",
    "The {red:Mimics} were created by paranoid kings to guard their treasuries. Now, they are the only treasuries left.",
    "Do not fish in the lava unless your rod is forged of {gray:Obsidian}. The magma carps bite back."
];

// ==========================================
// BIOME SPECIFIC FLAVOR TEXT (Waystones & Overworld)
// ==========================================

window.LORE_PLAINS = [
    "The wind whispers of the Old King's return.",
    "These fields were once a great battlefield. Rusty arrowheads still surface after rain.",
    "Travelers say the safe haven lies to the west, past the old ruins.",
    "The grass hides many secrets, and many graves.",
    "Look for the shrines. They still hold the power of the old gods.",
    "A broken cart lies here, its wheel rotted away.",
    "The horizon feels endless here. You feel small.",
    "Wildflowers grow in a perfect circle here. Strange.",
    "You find a stone marker with a name you cannot read.",
    "A rusted helmet is staked on a spear. A warning?",
    "The clouds above seem to circle this exact spot.",
    "You hear the distant sound of marching boots, but see no one.",
    "A single, massive footprint is pressed into the mud.",
    "The wildflowers here smell faintly of copper and blood.",
    "A scarecrow stands here, wearing tattered Bandit Garb.",
    "You find a patch of four-leaf clovers. You feel slightly luckier.",
    "A perfectly circular burn mark mars the grass. A lightning strike?",
    "The wind carries the faint scent of baking bread from a distant village.",
    "Deep grooves in the dirt suggest something impossibly heavy was dragged here.",
    "A swarm of locusts passes overhead, blotting out the sun for a moment.",
    "You find a rusted locket half-buried in the dirt.",
    "The grass here is entirely grey, drained of all color.",
    "A flock of crows takes off suddenly, startled by something unseen.",
    "You step on a cracked shield bearing an unrecognized crest.",
    "The air smells sweet, like blooming clover and old ozone.",
    "A shattered compass lies in the dirt. The needle spins wildly.",
    "The grass is neatly trampled in a path leading nowhere.",
    "You find a solitary, beautifully carved wooden chair sitting in the middle of nowhere.",
    "A faint, spectral chime echoes across the plain, then fades.",
    "A ring of white stones surrounds a patch of dead earth."
];

window.LORE_FOREST = [
    "The trees remember what the axe forgets.",
    "Wolves guard the heart of the wood. Tread lightly.",
    "Beware the shadows that move against the wind.",
    "The Elves left long ago, but their magic remains in the roots.",
    "A Machete is a traveler's best friend here.",
    "The canopy is so thick it blocks out the sun.",
    "You hear a twig snap behind you, but see nothing.",
    "Old carvings on the bark warn of 'The Sleeper'.",
    "Mushrooms glow faintly in the twilight.",
    "The roots here drink from a sun that set a thousand years ago.",
    "Do not whisper your true name to the Elder Trees.",
    "The squirrels here watch with too much intelligence.",
    "Moss only grows on the side of the trees facing the Fortress.",
    "You find a circle of mushrooms where the birds refuse to sing.",
    "A deer skeleton hangs perfectly balanced in the upper branches.",
    "The sap oozing from these pines is black and smells of sulfur.",
    "You swear you just saw the trees physically shift closer together.",
    "The trees are growing around a massive rusted sword plunged into the earth.",
    "You hear the sound of chopping wood, but it stops the moment you stop walking.",
    "A thick fog rolls through the trunks, smelling of ozone.",
    "You find a hunter's trap, rusted shut with something ancient caught inside.",
    "The wind whistling through the branches sounds like a choir.",
    "A massive web stretches between two oaks. The weaver is nowhere to be seen.",
    "You see a pair of glowing yellow eyes fade into the brush.",
    "A single Moonbloom petal rests on a fern, faintly glowing.",
    "The bark of the tree beside you resembles a screaming human face.",
    "You find a campsite. The fire is still warm, but the packs are slashed to ribbons.",
    "The trees here are entirely petrified, their leaves made of sharp, brittle stone.",
    "A beautiful, melancholy humming emanates from a hollow stump.",
    "A trail of golden pollen leads into the thicket, then suddenly ends."
];

window.LORE_MOUNTAIN = [
    "The stone is hollow. The dark deepens.",
    "Dragons once roosted on these peaks. Now, only the wind remains.",
    "The Prospector seeks gold, but he will find only madness.",
    "Iron and bone. That is all that remains here.",
    "Climbing requires strength, or the right tools.",
    "The air is thin and cold. Every breath is a struggle.",
    "You see a cave entrance that looks like a screaming mouth.",
    "Avalanches are common this time of year.",
    "The echo of your footsteps sounds like someone following you.",
    "A massive, frozen waterfall dominates the cliff face.",
    "You find a camp that was abandoned in a horrific hurry.",
    "The rock here has been melted and fused into glass. Dragonfire.",
    "A sheer drop leads into an abyss of absolute darkness.",
    "A frozen campfire. The wood is untouched by the flame.",
    "You find a perfectly preserved dwarven pickaxe embedded deeply in the stone.",
    "The wind howling through the crags sounds exactly like your name.",
    "A massive shadow passes over the mountain, but the sky is clear.",
    "You find a skeletal hand still gripping a piton in the rock wall.",
    "The snow here is stained with old, dried blood.",
    "You hear the rhythmic clinking of a miner's pick from deep within the rock.",
    "A cairn of stones marks the resting place of an unknown climber.",
    "The stars seem unnaturally close at this altitude.",
    "You find a patch of star-metal embedded in a crater.",
    "A giant feather, hard as steel, is wedged between two boulders.",
    "You spot a massive, perfect circle bored straight through a peak.",
    "The rocks here are highly magnetic. Your weapons feel heavier.",
    "A rusted iron cage hangs suspended over a terrifying gorge.",
    "You find an enormous shedding of reptilian skin, glittering with frost.",
    "An ancient, massive chain is bolted to the cliff face, leading up into the clouds.",
    "The wind carries the faint scent of sulfur and roasting meat."
];

window.LORE_SWAMP = [
    "The water tastes of rot and old magic.",
    "Sickness takes the weak. Endurance is key.",
    "The spiders... they are growing larger.",
    "Do not follow the lights in the mist. They lead to drowning.",
    "A sunken city lies beneath the muck. You can see the spires.",
    "Bubbles rise from the bog, smelling of sulfur.",
    "The mud sucks at your boots, trying to pull you down.",
    "Leeches the size of your arm swim in the murky pools.",
    "A rotting wooden boat is tied to a dead, sunken tree.",
    "You hear a low, rhythmic drumming from beneath the water.",
    "The fog is so thick you can taste the decay on your tongue.",
    "A stone gargoyle is sinking slowly into the mud, its hands raised in despair.",
    "A perfectly clean, white lily grows in the center of a foul mud pool.",
    "You step on something soft beneath the water that immediately squirms away.",
    "The croaking of frogs stops instantly as you take a step.",
    "A foul-smelling gas vents from the mud. A single spark could ignite it.",
    "You find a skeleton pinned to a tree with black iron spikes.",
    "The water here is perfectly reflective, but it shows someone else's face.",
    "You see the silhouette of a massive serpent gliding just beneath the surface.",
    "A willow tree weeps black sap into the stagnant water.",
    "The buzzing of insects here is loud enough to drown out your own thoughts.",
    "A bloated, floating corpse drifts past you. It is wearing royal armor.",
    "The mud begins to bubble violently, releasing a cloud of purple spores.",
    "A half-sunken chest is chained to a heavy anvil at the bottom of a pool.",
    "The fireflies here pulse in unison, like a single beating heart."
];

window.LORE_DESERT = [
    "The heat rising from the sand distorts the air.",
    "Your throat feels dry just looking at the dunes.",
    "The wind shifts the sand, erasing your footprints.",
    "Bleached bones poke out from a dune.",
    "You spot a shimmering mirage on the horizon.",
    "The silence of the desert is absolute.",
    "A scuttling sound comes from beneath the sand.",
    "The sand here has been fused into a sheet of green glass.",
    "A rusted clockwork gear sticks out of a dune, clicking faintly.",
    "You find a waterskin. It is filled with hot, biting sand.",
    "The sun beats down relentlessly, baking the earth.",
    "A massive shadow sweeps over the dunes, but there are no clouds.",
    "Half of an ancient stone tablet juts from the sand.",
    "You step on a scorpion shell the size of a shield.",
    "The wind hisses through a hollow, fossilized ribcage.",
    "A colossal, half-buried statue of a jackal stares blankly at the sky.",
    "You find a perfect circle of sand that is freezing cold to the touch.",
    "A dead oasis lies ahead. The palm trees are petrified into black stone.",
    "The sand here shifts colors, fading from red to deep purple as you step on it.",
    "You hear the faint, melodic sound of bells chiming over the next dune."
];

window.LORE_DEADLANDS = [
    "The ash falls from the sky like dirty snow.",
    "The earth here is cracked and devoid of all life.",
    "A fissure in the ground glows with a sickly purple light.",
    "Even the wind seems to die when it crosses into this land.",
    "You find a tree entirely petrified into black stone.",
    "A flock of skeletal birds circles silently overhead.",
    "The dust tastes of copper and regret.",
    "You see footprints walking in a circle, then simply vanishing.",
    "A ruined siege engine rots away into nothingness.",
    "The ground feels warm, as if a great fire burns just beneath the surface.",
    "A torn banner bearing an unknown crest flutters weakly.",
    "You hear the faint, haunting sound of a weeping child. You dare not follow it.",
    "A colossal sword, big as a watchtower, is embedded in the plains.",
    "The sky above the deadlands is always a bruising, bruised purple.",
    "The shadows here point towards the sun, defying the light.",
    "A pool of standing water here reflects a starry night sky, even at noon.",
    "You step on a brittle skull that shatters into perfectly square fragments.",
    "An unlit campfire. The logs are made of bone instead of wood.",
    "A colossal, rusted chain links the blasted earth directly to a low-hanging cloud.",
    "The ash drifts upward, falling back toward the sky from whence it came."
];

// ==========================================
// DYNAMIC TUTORIALS & VILLAGER RUMORS
// ==========================================

window.VILLAGER_RUMORS = [
    // --- COMBAT & MECHANICS ---
    "I heard spiders hate {red:fire}. Burn 'em, I say!",
    "The skeletons are stupid, but they never tire. A spear is useless against them; you need something heavy to {gold:crush} the bones.",
    "A {gray:Greataxe} is devastating, but it requires two hands. You'll have to put your shield away.",
    "I watched a Ranger take down a Drake before it even got close. A good bow relies entirely on your {green:Dexterity}.",
    "If a wild beast is badly wounded, try talking to it. You might just make a friend. Takes a lot of {gold:Charisma}, though.",
    "If you want the best gear, you gotta make it yourself. Highly skilled crafters can make {purple:Masterwork} weapons that hit harder.",
    
    // --- ENCHANTING TUTORIALS ---
    "The Blacksmith told me that if you have {purple:Arcane Dust}, you can use the Enchanting Altar at a fully upgraded camp.",
    "If you find magical gear you don't need, shatter it at an Altar! You get dust that you can use to upgrade your favorite sword.",
    "They say {gold:Legendary} weapons glow with their own light. I've only ever seen an Epic one.",
    "I found a {red:Cursed} helmet in the swamp. It made me incredibly strong, but I lost my mind while wearing it. I sold it.",
    
    // --- NEW MECHANICS TUTORIALS ---
    "A Heavy Crossbow is slow to load, but the bolts hit so hard they {red:pierce right through} targets! Try lining them up.",
    "If you're using the {orange:Whirlwind} technique, make sure you're holding a two-handed weapon. The sweep is absolutely devastating.",
    "I heard if you plant a {green:Cloudseed} under the open sky, it grows into a stalk that reaches the heavens. Imagine the view...",
    "You can bind potions, tools, and food to your {blue:Quick-Slots} now! Just open your bag and click the 'Bind' button.",
    "If you ever need to clear a quick-slot on your hotbar, just {purple:right-click} it.",
    "They say throwing a stick of {orange:Dwarven TNT} at a cracked wall will blow it wide open. Might even find gems inside!",
    "If you find an {purple:Obsidian Fishing Rod}, don't throw it away. I hear you can cast it straight into the heart of a volcano.",
    "Have you used the {blue:Dimensional Vault}? If you place a Stash Box down, you can access your stored items from anywhere in the world.",
    "I heard you can {gold:Quick Stack} your inventory directly into your stash with a single click. Saves a lot of sorting time!",
    "The Cartographer's Guild pays handsomely if you explore enough {blue:Regions}. Check in with a guildmaster if you've been walking a lot.",

    // --- MOUNTS TUTORIALS ---
    "I saw a woman riding a {gray:Stone Golem} yesterday! It smashed right through a thicket like it was made of paper!",
    "If you manage to tame a massive beast like an Ogre or a Drake, you can ride it! Just press {blue:[Z]} if you make a big friend.",
    "A tamed Dire Wolf is faster than the wind. Ride one if you want to cross the plains in a hurry.",
    "Careful in combat while riding a beast. If you take a heavy hit, you might get {red:violently knocked off}!",
    "You can't swing a sword while riding a bear. If you use an attack or a spell, you'll {orange:leap off your mount} directly into combat!",

    // --- EXPLORATION & WORLD ---
    "If you find a pickaxe, try the mountains. Good {gray:Iron Ore} there.",
    "The castle guards are tough, but they protect good loot.",
    "Don't eat the yellow snow. Or the blue mushrooms. Actually, just stick to bread.",
    "I saw a stone glowing in the woods last night. Didn't go near it.",
    "My cousin went into the crypts. He came back... wrong. Kept staring at the wall.",
    "{green:Endurance} helps you resist the swamp sickness. Eat your greens.",
    "{blue:Wits} will help you find hidden doors in the caves. Knock on every wall!",
    "They say the Old King isn't dead, just... waiting.",
    "The shopkeeper cheats at cards. Don't play him.",
    "If you see a {purple:rift in the world}, jump in! What's the worst that could happen?",
    "A {gold:Golden Apple} can bring a man back from the brink of death.",
    "My grandad says if you're drowning, a {blue:Gill Potion} is better than a prayer.",
    "Don't go into the Deadlands without a way to light the dark. The shadows there bite.",
    "The Historian says he'll trade XP for those creepy {purple:Memory Shards}. I'd rather keep my memories, thanks.",
    "I heard the Bandit Chief has a {gray:Steel Sword}. I bet it’s sharp enough to shave a ghost.",
    "If you see a statue with red eyes, it wants an answer. If you're wrong, it wants your blood.",
    "They say the Old King's crown was shattered into five pieces. I found a bit of gold once, but it was just a button.",
    "A wandering merchant sold me 'Dragon Repellent'. It was just garlic water. He went south.",
    "The mages in the tower used to turn lead into gold. Now they just turn men into monsters.",
    "Never camp near a circle of mushrooms. The Fae will steal your boots.",
    "If you find an {gray:Obsidian Shard}, keep it hidden. The shadow acolytes can smell them.",
    "If you see a ring of {purple:purple mushrooms}, step inside! The Fae might restore your magic... or they might teleport you across the world.",
    "A Canoe is fine for the swamps, but if you want to brave the deep ocean, you need to build a {blue:Sailing Ship}.",
    "Wooden arrows are fine, but {orange:Fire Arrows} can detonate oil barrels from a distance! Perfect for clearing out nests.",
    "I lock my doors when the {red:Blood Moon} rises. The beasts go mad, but the brave say they carry richer bounties.",
    "A clever mage doesn't need a boat. Just cast a {cyan:Frost Bolt} at the river and walk across the ice!",
    "Careful with fire in the swamp. The {orange:gas pockets} will blow you to kingdom come if a spark hits them!",
    "Don't stand in the water during a thunderstorm. And definitely don't cast {yellow:Lightning} spells unless you want to fry everything in the pool!",
    "Those ruined Dark Castles are terrifying, but I hear they hold {gold:Loot Vaults} deep inside.",
    "If you ever find a {purple:Void Key}, take it to a rift. It's a one-way ticket to nightmare-land.",
    "If you plan on exploring deep into the wilds, you better rest in a {green:Cozy Bed} first. It beats walking back from the village.",
    "The deeper you go into a dungeon, the nastier the monsters get. But the loot gets shinier, too.",
    "A merchant told me he saw a man looking at the stars through a {gold:Brass Telescope}. Sounds boring to me.",
    "I hear the Master Blacksmith can forge weapons out of {cyan:Star-Metal}... if you have the coin.",
    "Don't go to the Colosseum in the deadlands. I knew a warrior who went to fight in the Arena. He never came back.",
    "The Inquisitor pays top gold for Cultist amulets. He's trying to root out the Shadowed Hand.",
    "Some say the {purple:Void Astrolabe} doesn't just teleport you... it takes you to a {purple:parallel dimension} altogether.",
    "If the Leylines ever go down, or you get trapped in an alternate dimension, just strike a {cyan:Prime Tuning Fork} to return home.",
    "I hear if your bags are completely full and you try to pull a soggy chest from the ocean, whatever is inside drops right into the water. Poof. Gone."
];

// ==========================================
// SCATTERED LORE (Journals & Papers)
// ==========================================

window.RANDOM_JOURNAL_PAGES = [
    "Day 4: My boots are soaked. The swamp is trying to swallow me whole. I swear I saw a spider the size of a wolf.",
    "I've heard tales of a safe village, but the paths are hidden. The guards say it's for our own good.",
    "The recipe for a 'Machete'? Why would I need... oh. The forest. Of course.",
    "...the ore from the mountains is useless, but the Draugr guard something... an 'essence'...",
    "The mage in the tower just laughed. '{blue:Power comes to those who seek it,}' he said, before blasting a rock to smithereens.",
    "T. was right to leave. The chief *is* mad. He's taking all our gold to the old fortress. Says he's 'paying tribute'. To what?",
    "Don't bother with the caves near the coast. They're flooded and full of grotto-spiders. Nothing of value.",
    "I saw a wolf the other day... it was *glowing*. Just faintly. I didn't stick around to find out why.",
    "That prospector, 'K', he's always looking for totems. Says he's building 'a monument to their stupidity'. Strange fellow.",
    "The guards in the village are jumpy. They keep talking about 'the King's folly' and looking east, toward the old fortress.",
    "Endurance is the key. A strong {green:constitution} can shrug off swamp-sickness, or so I've heard.",
    "Someone told me a silver tongue is as good as a steel sword. I wonder if they've ever tried to 'pacify' a skeleton?",
    "That fortress... something is *wrong* there. It's not just bandits. The air feels... heavy.",
    "The King hasn't eaten in weeks. He just stares at the {purple:Void Rift}, whispering to things that aren't there. We should have left when the birds stopped singing.",
    "Entry 442: The 'Mithril' we found in the deep grotto isn't ore. It’s growing. Like a scab over the world's skin.",
    "If you find my shield, give it to my son. Tell him I died defending the pass, not fleeing from the shadows. Lie to him if you have to.",
    "The Sage says the stars are actually eyes. I told him he’s had too much Bluecap stew, but last night... I saw one blink.",
    "Final Note: The Shadowed Hand offered us immortality. They didn't mention that we'd have to forget our names to keep it.",
    "The First King wasn't a man. The tapestries in the Grand Fortress show him arriving in a vessel made of fallen stars.",
    "I watched the bandit chief cleave an oak tree in half. If you face him, do not let him swing.",
    "I found an intricate golden pocket watch inside a mimic's stomach. Why was it still ticking?",
    "Do not trust the Rainbow Shells. The merchants pay well for them, but they whisper when you sleep.",
    "My magic shield shattered in a single hit! The brute hit me for 15 damage, but the shield only absorbed 5. Note to self: {blue:Arcane Shield} has a limit.",
    "Note to self: Don't cast Fireball near an Oil Barrel. Lost my eyebrows.",
    "The Obsidian Rod is the only thing that won't melt in the volcano. I just hope the Magma Carps are biting.",
    "We found a Fairy Ring today. Elara stepped inside and vanished. I'm going in after her.",
    "I hooked something off the starboard bow. It dragged the ship for three leagues before snapping a steel cable. I am never sailing again.",
    "If you see the sky turn red, run for the village. The {red:Blood Moon} is not a myth.",
    "They call it the Abyssal Leviathan. It's not a fish. It's a natural disaster with teeth.",
    "I threw a firebomb into the swamp just to watch it burn. The resulting gas explosion leveled an entire thicket. Fascinating.",
    "My companion, a loyal dire wolf, took down a goblin brute by itself. I gave it a steak. It's better company than most men.",
    "The deeper you go into the caves, the hotter it gets. At floor five, the rock turns to obsidian and the air to ash.",
    "The arena champion... he's not human. I watched him take a mace to the chest and not even flinch. I forfeit.",
    "Dwarven TNT is highly unstable. Threw a stick at a cracked wall and nearly blew my own arms off. Found a diamond though.",
    "I climbed the beanstalk. The air was thin, and the clouds felt like marble beneath my feet. I saw a fountain that poured pure starlight.",
    "If you stand on the edge of the world, where the map turns to nothing, you can hear the servers humming.",
    "The Akashic Records remember every soul that has died here. Sometimes, when the wind is right, you can hear them updating.",
    "I met a traveler who said he was from a 'Shattered Realm'. He looked exactly like me, but with a scar over his eye. Then he struck a tuning fork and vanished.",
    "Do not trust the alternate dimensions. I spent a week in one where the oceans were lava. I barely made it back to the Prime Realm alive.",
    "The {purple:Void Blade} whispers to me when I hold it. It tells me to strike my friends. It promises me the world.",
    "We breached the vault, but it was empty. Only a hovering mirror remained, and my reflection was smiling while I frowned.",
    "I drank the Elixir of Power. My veins feel like they are filled with lightning. I can see the magic pulsing through the trees."
];

window.LORE_FRAGMENTS = [
    "My dearest Elara, the crops failed again. The soil tastes of ash...",
    "Order 66: Burn the library. The King commands it. He says the books are whispering to him.",
    "I hid the gold under the loose stone in the... (the rest is smeared with blood).",
    "They are coming from the mountain. They don't look like men anymore.",
    "Day 4: I ran out of water. I see the oasis, but I know it's a mirage. Or a trap.",
    "Mom, Dad, I'm going to the safe haven. I promise I'll write when I get there.",
    "Recipe: Two parts Bluecap, one part Void Dust... (The handwriting becomes frantic scribbles).",
    "If you are reading this, I did not survive the poison. Tell my brother not to seek revenge.",
    "The bandits took everything but this journal. They laughed when I asked for my map back.",
    "I found an obsidian arrowhead lodged in the doorframe. The elves are watching us.",
    "The Cartographer's Guild pays well for maps. But they never tell us what they're looking for.",
    "I saw a man in robes freeze the river and walk across it. Witchcraft.",
    "To whom it may concern: The chest in the dark castle is trapped. Signed, Lefty.",
    "We dug up an ancient idol in the deadlands. It hums. I can't sleep.",
    "The tuning fork resonates with a frequency that gives me a migraine. It points nowhere.",
    "Deliver this sealed package to the Inquisitor immediately. Do not open it. Do not look inside. - R.",
    
    // NEW FAE & DIMENSIONAL LORE FRAGMENTS
    "I stepped into the ring of purple mushrooms. The music was so loud. When I stepped out, my hair was white.",
    "The Efreet are not demons. They are the trapped souls of the first mages, bound to the clockwork machines.",
    "I saw the Leviathan's eye today. It was larger than the moon. It looked right through me."
];

// ==========================================
// VISIONS OF THE PAST (Obelisks)
// ==========================================

window.VISIONS_OF_THE_PAST = [
    "A VISION: You see a golden king standing atop the fortress. He raises a hand, and the mountain splits. A shadow rises from the fissure, swallowing the sun.",
    "A VISION: Five knights kneel before a dark altar. They drink from a chalice of black ichor, and their eyes turn to blue ice.",
    "A VISION: The sky burns. Not with fire, but with {purple:arcane light}. The mages scream as their tower collapses, shattering into dust.",
    "A VISION: A lone figure seals the crypt doors. He is weeping. 'Sleep well, my brothers,' he whispers. 'Sleep until the world breaks.'",
    "A VISION: The blacksmith hammers a blade of black glass. 'It drinks the light,' he mutters. 'It drinks the soul.'",
    "A VISION: A star falls from the heavens, crashing into the plains. The crater glows with a purple light that does not fade.",
    "A VISION: The woods were not always trees. Once, they were tall spires of bone, reaching for a moon that wasn't there.",
    "A VISION: The King sits upon his throne, but his face is blank. A shadow whispers in his ear, and the King nods slowly.",
    "A VISION: You see the world from high above. Great {purple:purple veins} are pulsing beneath the crust of the earth, converging on the Grand Fortress.",
    "A VISION: A council of mages stands around a table. They are arguing about a 'star' that fell in the desert. One mage is bleeding from his eyes.",
    "A VISION: The King is weeping. He is trying to wash black ink off his hands, but the harder he scrubs, the further it spreads up his arms.",
    "A VISION: You see yourself, standing exactly where you are now, but the world is made of white light and the silence is absolute.",
    "A VISION: A giant shadow, larger than a mountain, leans down and blows out the sun like a candle.",
    "A VISION: The oceans boil. A gargantuan serpent rises from the deep, its scales reflecting a burning sky. It speaks a single word, and the mountains shatter.",
    "A VISION: You see the Cartographer's Guild before the fall. Hundreds of scholars mapping the stars, unaware of the darkness growing beneath their feet.",
    "A VISION: A vast fleet of ships with black sails approaches the coast. Before they make landfall, the water turns to ice, trapping them forever.",
    "A VISION: An elf stands before an elder tree, whispering. The tree splits open, revealing a glowing green heart. The elf plunges a dagger into it.",
    "A VISION: A massive blood-red moon fills the sky. The people in the streets fall to their knees and begin to claw at their own faces.",
    "A VISION: You see a dwarven forge deep underground. They are pouring molten gold over a writhing, shadowy entity to trap it.",
    "A VISION: The Sage, much younger, is writing furiously in a book. He looks up directly at you. 'You are too late,' he says.",
    "A VISION: A beautiful city floats in the sky. Slowly, it tilts, and then plummets to the earth, leaving a crater that will one day become a swamp.",
    "A VISION: You watch as reality splits like a mirror. A thousand versions of the King make a thousand different choices. All end in ash. Perhaps another dimension survived?",
    "A VISION: You stand on a cloud of solid marble. Below you, the world is burning. A voice behind you says, 'We built this to escape, but we brought it with us.'",
    "A VISION: The Underworld expands endlessly. You see thousands of stone cocoons hanging from the cavern ceiling. One of them twitches.",
    "A VISION: You see an ancient archmage holding an astrolabe. He turns a dial, and the entire landscape dissolves into a grid of green numbers. Then, the Void takes him.",
    "A VISION: The sky cracks like glass. A colossal eye stares through the fissure. You cannot look away.",
    "A VISION: A woman rides a monstrous wolf across the plains, outrunning a storm of black ash.",
    "A VISION: You see the roots of the world. They are not wood, but thick cables of humming purple light.",
    "A VISION: You are underwater, sinking into the abyss. A massive, glowing eye opens beneath you. It is larger than a city.",
    "A VISION: A hooded figure places the Sun Shard, the Moon Tear, and the Void Crystal on a pedestal. Reality shatters with a sound like breaking glass."
];

// ==========================================
// RIDDLE DATA (Statues)
// ==========================================
// PERFORMANCE: All answers are strictly lowercase to prevent case-conversion misses!
// BUG FIX: Massively expanded synonym arrays to prevent unfair player punishment!

window.RIDDLE_DATA = [
    {
        id: "fire",
        question: "I have no mouth, but I always consume. I have no life, but I must be fed. What am I?",
        answers: ["fire", "a fire", "the fire", "flame", "a flame", "the flame", "campfire", "a campfire", "the campfire", "it is fire", "it is a fire"],
        reward: "strength", 
        message: "{red:The statue's eyes glow red. You feel a surge of physical power.}"
    },
    {
        id: "shadow",
        question: "The more of me there is, the less you see. What am I?",
        answers: ["darkness", "the darkness", "dark", "the dark", "shadow", "a shadow", "shadows", "the shadows", "night", "the night"],
        reward: "wits", 
        message: "{blue:The statue seems to vanish for a moment. Your mind sharpens.}"
    },
    {
        id: "echo",
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        answers: ["echo", "an echo", "the echo", "echoes", "it is an echo"],
        reward: "psyche", 
        message: "{purple:A whisper surrounds you. Your will is strengthened.}"
    },
    {
        id: "silence",
        question: "I am so fragile that if you say my name, you break me. What am I?",
        answers: ["silence", "the silence", "quiet", "the quiet", "a secret", "secret", "the secret", "peace and quiet"],
        reward: "dexterity", 
        message: "{green:The world goes quiet. You feel lighter and faster.}"
    },
    {
        id: "coin",
        question: "I have a head and a tail, but no body. What am I?",
        answers: ["coin", "a coin", "the coin", "gold coin", "a gold coin", "money", "penny", "coins"],
        reward: "charisma", 
        message: "{gold:The statue nods slowly. You feel more persuasive.}"
    },
    {
        id: "mountain",
        question: "What has roots as nobody sees, Is taller than trees, Up, up it goes, And yet never grows?",
        answers: ["mountain", "a mountain", "the mountain", "mountains", "the mountains", "hill", "a hill"],
        reward: "constitution", 
        message: "{green:The stone beneath your feet trembles. You feel unyielding.}"
    },
    {
        id: "river",
        question: "I can run but never walk, have a mouth but never talk, have a head but never weep, have a bed but never sleep. What am I?",
        answers: ["river", "a river", "the river", "water", "the water", "stream", "a stream", "brook", "creek"],
        reward: "endurance", 
        message: "{blue:A rush of cool air washes over you. Your breath comes easier.}"
    },
    {
        id: "map",
        question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
        answers: ["map", "a map", "the map", "maps", "atlas", "an atlas", "globe", "a globe"],
        reward: "perception", 
        message: "{gold:The statue's blank eyes seem to focus. Your vision pierces the veil.}"
    },
    {
        id: "hole",
        question: "I am weightless, but you can see me. Put me in a bucket, and I'll make it lighter. What am I?",
        answers: ["hole", "a hole", "the hole", "holes"],
        reward: "luck", 
        message: "{gold:A faint, echoing chuckle comes from the stone. You feel oddly fortunate.}"
    },
    {
        id: "footsteps",
        question: "The more you take, the more you leave behind. What am I?",
        answers: ["footsteps", "steps", "foot step", "step", "a step", "footprints", "footprint", "prints"],
        reward: "intuition", 
        message: "{purple:The dust settles around the statue's base. Your instincts sharpen.}"
    },
    {
        id: "few",
        question: "I am a word of letters three, add two and fewer there will be. What am I?",
        answers: ["few", "a few", "the word few"],
        reward: "wits", 
        message: "{blue:The statue seems to smile. Your mind expands.}"
    },
    {
        id: "volcano",
        question: "I wear a stone coat and have a fiery heart. When I wake, the world trembles. What am I?",
        answers: ["volcano", "a volcano", "the volcano", "mountain", "magma", "lava"],
        reward: "constitution", 
        message: "{red:Heat radiates from the stone. You feel an inner fire ignite.}"
    },
    {
        id: "frost",
        question: "I build bridges of silver and crowns of ice. I halt the fastest river. What am I?",
        answers: ["cold", "the cold", "frost", "the frost", "winter", "ice", "the ice", "freezing", "snow"],
        reward: "willpower", 
        message: "{cyan:A chill runs down your spine. Your resolve hardens like ice.}"
    },
    {
        id: "wind",
        question: "I bite without teeth, I strike without hands, I howl without a voice. What am I?",
        answers: ["wind", "the wind", "a storm", "storm", "the storm", "breeze", "air", "the air", "gale"],
        reward: "dexterity", 
        message: "{green:A gust of wind pushes you forward. You feel incredibly agile.}"
    },
    {
        id: "gold",
        question: "I have no sword, but I conquer kings. I have no voice, but I command armies. What am I?",
        answers: ["gold", "money", "coin", "wealth", "treasure", "coins", "greed"],
        reward: "charisma", 
        message: "{gold:The statue bows slightly. You feel a commanding presence within.}"
    },
    {
        id: "rain",
        question: "I fall from the sky but never break. I weep constantly, though I have no eyes. What am I?",
        answers: ["rain", "the rain", "water", "a raindrop", "storm", "tears", "raindrops"],
        reward: "endurance", 
        message: "{blue:A single drop of water falls on your brow. You feel refreshed and tireless.}"
    },
    {
        id: "time",
        question: "This thing all things devours: Birds, beasts, trees, flowers; Gnaws iron, bites steel; Grinds hard stones to meal. What am I?",
        answers: ["time", "age", "aging", "the passing of time"],
        reward: "intuition", 
        message: "{purple:The stone seems to age a thousand years in an instant. You grasp the flow of eternity.}"
    },
    {
        id: "memory",
        question: "I can bring back the dead. I can make you cry, make you laugh, make you young. Born in an instant, yet I last a lifetime. What am I?",
        answers: ["memory", "a memory", "memories", "the past"],
        reward: "psyche", 
        message: "{purple:A forgotten face flashes in your mind. Your spirit fortifies.}"
    },
    {
        id: "breath",
        question: "I am light as a feather, yet the strongest man cannot hold me for much more than a minute. What am I?",
        answers: ["breath", "my breath", "air", "your breath", "a breath", "breathing"],
        reward: "constitution", 
        message: "{green:You draw in a deep, lung-expanding breath. Your vitality surges.}"
    },
    {
        id: "secret",
        question: "If you have me, you want to share me. If you share me, you haven't got me. What am I?",
        answers: ["secret", "a secret", "secrets", "the secret"],
        reward: "wits", 
        message: "{blue:A sly smirk crosses the statue's face. Your cunning increases.}"
    },
    {
        id: "promise",
        question: "What must be broken before you can use it?",
        answers: ["egg", "an egg", "the egg", "promise", "a promise", "coconut"],
        reward: "luck", 
        message: "{gold:A small bird lands on the statue, then flies away. You feel fortuitous.}"
    },
    {
        id: "stars",
        question: "We come at night without being fetched, and we are lost in the day without being stolen. What are we?",
        answers: ["stars", "the stars", "star", "a star", "constellations"],
        reward: "perception", 
        message: "{gold:The sky seems clearer. Your eyes pierce the darkness.}"
    },
    {
        id: "tree",
        question: "In spring I am gay in handsome array; in summer more clothing I wear; when colder it grows, I fling off my clothes; and in winter quite naked appear. What am I?",
        answers: ["tree", "a tree", "the tree", "wood", "forest", "trees"],
        reward: "endurance", 
        message: "{green:You feel rooted to the earth. Your stamina expands.}"
    },
    {
        id: "anchor",
        question: "To use me you must throw me away. When you're done with me, you bring me back in. What am I?",
        answers: ["anchor", "an anchor", "the anchor", "fishing net", "net"],
        reward: "strength", 
        message: "{red:You feel heavy and immovable. Your muscles swell with power.}"
    },
    {
        id: "sponge",
        question: "I am full of holes but still hold water. What am I?",
        answers: ["sponge", "a sponge", "the sponge"],
        reward: "luck", 
        message: "{gold:The statue absorbs your answer eagerly. You feel lucky.}"
    },
    {
        id: "mirror",
        question: "I look at you, you look at me. I raise my right hand, you raise your left. What am I?",
        answers: ["mirror", "a mirror", "the mirror", "reflection", "a reflection", "glass", "looking glass"],
        reward: "charisma", 
        message: "{gold:You see yourself in a new light. Your presence becomes magnetic.}"
    },
    {
        id: "name",
        question: "It belongs to you, but other people use it more than you do. What is it?",
        answers: ["name", "my name", "your name", "a name"],
        reward: "charisma", 
        message: "{gold:The statue acknowledges you. You feel more influential.}"
    },
    {
        id: "fire_2",
        question: "Feed me and I live, yet give me a drink and I die. What am I?",
        answers: ["fire", "a fire", "flame", "a flame", "campfire"],
        reward: "strength", 
        message: "{red:A spark flares in the statue's eye. Your strength ignites.}"
    },
    {
        id: "needle",
        question: "I have an eye but cannot see. What am I?",
        answers: ["needle", "a needle", "the needle", "hurricane", "a hurricane", "storm", "a storm", "potato"],
        reward: "perception", 
        message: "{gold:Your focus narrows to a pinpoint. Your vision sharpens.}"
    },
    {
        id: "coffin",
        question: "The man who makes it, doesn't need it. The man who buys it, doesn't want it. The man who uses it, doesn't know it. What is it?",
        answers: ["coffin", "a coffin", "casket", "a casket", "grave", "a grave"],
        reward: "willpower",
        message: "{purple:A cold draft blows past you. Your resolve to live hardens.}"
    },
    {
        id: "cloud",
        question: "I fly without wings. I cry without eyes. Wherever I go, darkness follows me. What am I?",
        answers: ["cloud", "a cloud", "the cloud", "storm", "raincloud", "clouds"],
        reward: "intuition",
        message: "{cyan:You feel the moisture in the air before it rains. Your instincts sharpen.}"
    },
    {
        id: "glove",
        question: "What has four fingers and a thumb, but is not living?",
        answers: ["glove", "a glove", "gauntlet", "a gauntlet"],
        reward: "dexterity",
        message: "{green:Your hands feel nimble and quick.}"
    },
    {
        id: "towel",
        question: "What gets wet while drying?",
        answers: ["towel", "a towel", "the towel"],
        reward: "endurance",
        message: "{blue:The statue weeps a single tear. Your endurance improves.}"
    },
    {
        id: "age",
        question: "What goes up but never comes down?",
        answers: ["age", "your age", "my age", "getting older"],
        reward: "wits",
        message: "{blue:You feel the weight of years, but also the wisdom they bring.}"
    },
    {
        id: "word",
        question: "I am a single word, but if you pronounce me right, I mean the exact opposite. What am I?",
        answers: ["wrong", "incorrect", "wrongly", "incorrectly"],
        reward: "charisma",
        message: "{gold:A clever trick of the tongue. You feel more eloquent.}"
    },
    {
        id: "keyboard",
        question: "I have keys but no doors. I have a space but no room. You can enter, but you cannot go outside. What am I?",
        answers: ["keyboard", "a keyboard", "piano", "a piano"],
        reward: "perception",
        message: "{gold:Your mind clicks the pieces together. Your awareness broadens.}"
    },
    {
        id: "onion",
        question: "Take off my skin and I won't cry, but you will! What am I?",
        answers: ["onion", "an onion"],
        reward: "constitution",
        message: "{green:The statue sheds a tear, but you remain stoic.}"
    },
    {
        id: "teeth",
        question: "Thirty white horses on a red hill. First they champ, then they stamp, then they stand still.",
        answers: ["teeth", "my teeth", "your teeth", "tooth"],
        reward: "strength",
        message: "{red:You clench your jaw. Your muscles feel dense.}"
    },
    {
        id: "book",
        question: "I have leaves, but no branches. I have a spine, but no bones. What am I?",
        answers: ["book", "a book", "tome", "a tome", "journal", "a journal"],
        reward: "wits",
        message: "{blue:Knowledge flows into your mind from the ancient stone.}"
    },
    {
        id: "candle",
        question: "You measure my life in hours and I serve you by expiring. I'm quick when I'm thin and slow when I'm fat. The wind is my enemy. What am I?",
        answers: ["candle", "a candle", "the candle"],
        reward: "luck",
        message: "{gold:A flicker of light dances in the statue's eyes. You feel incredibly fortunate.}"
    },
    // --- EXPANSION: NEW FANTASY RIDDLES ---
    {
        id: "nothing",
        question: "The rich need it, the poor have it, and if you eat it you die. What is it?",
        answers: ["nothing", "absolutely nothing"],
        reward: "wits",
        message: "{blue:The profound emptiness of the answer sharpens your mind.}"
    },
    {
        id: "light",
        question: "What can fill a room entirely, but takes up absolutely no space?",
        answers: ["light", "the light", "sunlight", "brightness"],
        reward: "perception",
        message: "{gold:A brilliant flash illuminates the statue. You see things clearly now.}"
    },
    {
        id: "bottle",
        question: "I have a neck but no head, and I wear a cap but have no hair. What am I?",
        answers: ["bottle", "a bottle", "flask", "potion", "a potion"],
        reward: "endurance",
        message: "{green:The sound of flowing water fills your ears. You feel refreshed.}"
    },
    {
        id: "piano",
        question: "I have many keys, but I cannot open a single lock. What am I?",
        answers: ["piano", "a piano", "keyboard", "a keyboard"],
        reward: "dexterity",
        message: "{cyan:Your fingers twitch with a sudden, practiced rhythm.}"
    },
    {
        id: "bank",
        question: "I have branches, but no fruit, trunk, or leaves. What am I?",
        answers: ["bank", "a bank", "river", "a river", "stream"],
        reward: "luck",
        message: "{gold:The sound of clinking coins echoes faintly. Fortune smiles upon you.}"
    },
    {
        id: "meteor",
        question: "I drop from the sky but I am not rain. I have a core but I am not fruit. What am I?",
        answers: ["meteor", "star", "a star", "a meteor", "shooting star", "falling star", "asteroid", "comet"],
        reward: "luck",
        message: "{gold:The statue glows with starlight. You feel incredibly lucky.}"
    },
    {
        id: "cold",
        question: "What can you catch but never throw?",
        answers: ["cold", "a cold", "sickness", "disease", "illness", "fever", "the cold"],
        reward: "constitution",
        message: "{green:The stone chills your hand. You feel physically hardier.}"
    },
    {
        id: "blood",
        question: "I am always hungry, I must always be fed. The finger I touch, will soon turn red. What am I?",
        answers: ["fire", "a fire", "flame", "a flame"],
        reward: "strength",
        message: "{red:Flames erupt from the statue's hands. Your raw power swells.}"
    },
    {
        id: "fence",
        question: "What runs around the whole yard without moving?",
        answers: ["fence", "a fence", "wall", "a wall"],
        reward: "perception",
        message: "{gold:You suddenly understand the boundaries of the space around you.}"
    },
    {
        id: "match",
        question: "Tear one off and scratch my head, what was red is black instead. What am I?",
        answers: ["match", "a match", "matchstick"],
        reward: "wits",
        message: "{blue:The smell of sulfur fills the air. Your intellect sparks.}"
    },
    {
        id: "tomorrow",
        question: "I never was, am always to be. No one ever saw me, nor ever will. And yet I am the confidence of all. What am I?",
        answers: ["tomorrow", "the future", "future", "next day"],
        reward: "psyche",
        message: "{purple:You peer into the infinite paths of destiny. Your mental fortitude deepens.}"
    }
];

window.REGION_HISTORY = [
    // Original Regions
    "A great battle was fought here in the Second Age. The earth still remembers the blood.",
    "Once a thriving trade route, now abandoned to the wilds.",
    "The Old King used to hunt in these lands before the madness took him.",
    "Travelers report hearing strange, melodic singing here at dusk.",
    "Nothing of note happened here, which in this world, is a blessing.",
    "The Cartographer's Guild warns that compasses behave strangely in this sector.",
    "A legendary beast is said to claim this territory as its own.",
    "The ruins of a nameless village lie buried somewhere beneath the soil here.",
    "The soil here is unusually rich, fertilized by the ash of a fallen empire.",
    "A great schism in the leylines occurred here, rendering magic unpredictable for centuries.",
    "The Cartographer's Guild designated this sector as 'Uninhabitable' three centuries ago.",
    "Legends say an ancient dragon fell from the sky and crashed here, creating the terrain you see today.",
    "This area was once completely submerged underwater before the tectonic plates shifted.",
    "Shadow Acolytes frequently patrol these borders, searching for lost relics.",
    "A massive, invisible magical ward supposedly protects this region from the worst of the Void.",
    "The dwarves dug a massive tunnel network beneath this area, but collapsed it from the inside.",
    "This was the site of the first successful Cloudseed planting, though the stalk withered long ago.",
    "The air here always smells faintly of ozone, regardless of the weather.",
    "A wandering sage claimed he found a staircase leading to the underworld here, but he never returned to prove it.",
    "The merchants avoid this path. Too many caravans have vanished without a trace.",
    "This region is entirely missing from the oldest maps in the royal archives. It simply did not exist.",
    "You can sometimes find petrified wood here that burns with a blue flame.",
    "The magnetic north fluctuates wildly the deeper you go into this sector.",
    "Scholars believe this exact spot is the focal point of a massive, inter-dimensional overlap.",
    "The wind here never blows from the north. Only from the east.",
    "A massive clockwork machine lies buried just beneath the topsoil here, ticking faintly.",
    "The grass here grows in perfect concentric circles. No one knows why.",
    "A famous archmage built a tower here, but it vanished overnight, leaving only a perfectly flat stone foundation.",
    "The bones of a creature larger than a mountain are scattered across this sector, buried under the dirt.",
    
    // NEW REGION LORE EXPANSION
    "This sector is prone to intense temporal anomalies. Some travelers report seeing themselves walking in the distance.",
    "The rivers here occasionally flow backward for exactly three minutes at midnight.",
    "A massive, perfect cube of obsidian sits at the center of this region. It is entirely indestructible.",
    "The local flora here has adapted to feed on magic rather than sunlight.",
    "This is the impact site of the First Mage's greatest failure.",
    "A legendary bandit crew buried their entire hoard somewhere in this sector before turning on each other.",
    "The wind here carries the faint, unmistakable smell of baking bread, even though the nearest village is miles away.",
    "Every tree in this region was struck by lightning on the exact same night fifty years ago.",
    "The Cartographer's Guild simply notes this area as 'Do Not Enter' with no further explanation.",
    "A massive stone bridge spans a dry canyon here, but both ends of the bridge end abruptly in solid rock.",
    "The animals in this sector display an unsettling level of coordination and intelligence.",
    "This area was cursed by a dying witch. The rain here always tastes like salt and tears.",
    "An ancient amphitheater lies buried beneath the topsoil here. The blood spilled there still stains the dirt red.",
    "The stars above this sector are slightly misaligned compared to the rest of the world."
];

// Dynamic history overrides based on the active Mutator in a Shattered Realm
window.getMutatorHistoryOverride = function(mutatorKey, baseHistory) {
    const mutatorHistory = {
        'lava_oceans': [
            "The air here burns your lungs. The oceans boiled away centuries ago.",
            "A civilization of fire elementals once built castles on the magma lakes here.",
            "You find a ship made entirely of obsidian, stranded on a cooling basalt flow."
        ],
        'eternal_night': [
            "You cannot tell if it is day or night. The stars do not move.",
            "The shadows here seem to stretch toward you, regardless of the light.",
            "A kingdom of vampires ruled this sector until they starved to death."
        ],
        'frozen_wastes': [
            "The ice here is blue and harder than steel. It will never melt.",
            "You find a massive dire wolf perfectly preserved mid-leap in a glacier.",
            "The wind carries the sound of shattering glass as trees snap in the cold."
        ],
        'overgrown': [
            "The vines here grow visibly, inching forward while you watch.",
            "A ruined keep is completely choked by massive, thorny brambles.",
            "The smell of blooming flowers is so thick it makes you dizzy."
        ],
        'wild_magic': [
            "The laws of physics are merely a suggestion in this sector.",
            "You see a rock fall upward into the sky.",
            "The grass here glows with an unnatural, pulsating light."
        ],
        'crystalline': [
            "The ground chimes like a bell with every step you take.",
            "Massive quartz pillars pierce the clouds above.",
            "The reflection in the crystals shows a world that isn't this one."
        ]
    };
    
    if (mutatorHistory[mutatorKey]) {
        return mutatorHistory[mutatorKey][Math.floor(Math.random() * mutatorHistory[mutatorKey].length)];
    }
    return baseHistory;
};

// --- END OF FILE data-lore.js ---
