window.LORE_SETS = {
    "king_fall": {
        name: "The Fall of Alaric",
        description: "The firsthand account of the King's descent into madness.",
        bonus: "Authority: Shop prices reduced by 10%.",
        // These IDs must match items in ITEM_DATA
        items: ["📜1", "📜2", "📜3", "📜4", "📜5"] 
    },
    "beastmaster_guide": {
        name: "The Beastmaster's Guide",
        description: "A tattered guide to the creatures of this world.",
        bonus: "Tracker: +1 Base Perception.",
        items:["🐾1", "🐾2", "🐾3"] 
    },
    "void_research": {
        name: "Notes from the Void",
        description: "Research notes left by the First Mage.",
        bonus: "Clarity: +10 Max Mana.",
        items: ["3", "j", "4"] // '3' = Burned Scroll, 'j' = Acolyte, '4' = Mad Scrawlings
    },
    "adventurer_tips": {
        name: "The Survivalist's Guide",
        description: "Scraps left by those who came before.",
        bonus: "Hardy: Hunger/Thirst drain 10% slower.",
        items: ["1", "2", "q"] // Conscript Orders, Thief Map, Bandit Note
    },
    // EASY WIN: New Lore Set utilizing the previously un-grouped journals!
    "deep_delver": {
        name: "The Deep Delver",
        description: "Accounts from the most dangerous corners of the world.",
        bonus: "Tireless: +5 Max Stamina.",
        items: ["📘", "J", "L"] // Frozen Journal, Orc War-Chant, King's Lament
    }
};

window.LORE_STONE_MESSAGES = [
    "The stars align when the five thrones are empty.",
    "Iron rots, but obsidian remembers.",
    "Do not trust the water in the deep grotto.",
    "The King was not the first to fall to the shadow.",
    "Magic requires sacrifice. Always.",
    "The dragons did not flee. They were driven out by something worse.",
    "If the stone weeps, the Void is near.",
    "The Elves knew the truth, and so they burned their own cities.",
    "Do not dig too deep. The earth is a cage, not a mother."
];

// --- BIOME SPECIFIC FLAVOR TEXT (Triggered by '#' Waystones) ---

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
    "The wildflowers here smell faintly of copper and blood."
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
    "You swear you just saw the trees physically shift closer together."
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
    "A sheer drop leads into an abyss of absolute darkness."
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
    "A stone gargoyle is sinking slowly into the mud, its hands raised in despair."
];

// EASY WIN: Applied color tags to important gameplay hints so the player learns mechanics organically!
window.VILLAGER_RUMORS = [
    "I heard spiders hate {red:fire}. Burn 'em, I say!",
    "If you find a pickaxe, try the mountains. Good {gray:Iron Ore} there.",
    "The castle guards are tough, but they protect good loot.",
    "Don't eat the yellow snow. Or the blue mushrooms. Actually, just stick to bread.",
    "I saw a stone glowing in the woods last night. Didn't go near it.",
    "My cousin went into the crypts. He came back... wrong. Kept staring at the wall.",
    "{green:Endurance} helps you resist the swamp sickness. Eat your greens.",
    "{blue:Wits} will help you find hidden doors in the caves. Knock on every wall!",
    "They say the Old King isn't dead, just... waiting.",
    "The shopkeeper cheats at cards. Don't play him.",
    "If you see a rift in the world, jump in! What's the worst that could happen?",
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
    "I watched a Ranger take down a Drake before it even got close. A good bow relies entirely on your {green:Dexterity}.", // Ranged combat hint
    "If a wild beast is badly wounded, try talking to it. You might just make a friend. Takes a lot of {gold:Charisma}, though." // Taming hint
];

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
    "The skeletons are stupid, but they never tire. A spear is useless against them; you need something heavy to {gold:crush} the bones.",
    "I found an intricate golden pocket watch inside a mimic's stomach. Why was it still ticking?",
    "Do not trust the Rainbow Shells. The merchants pay well for them, but they whisper when you sleep.",
    "My magic shield shattered in a single hit! The brute hit me for 15 damage, but the shield only absorbed 5. Note to self: {blue:Arcane Shield} has a limit." // Mechanic hint
];

// Read when interacting with '|' (Obelisk)
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
    "A VISION: A giant shadow, larger than a mountain, leans down and blows out the sun like a candle."
];

window.RIDDLE_DATA = [
    {
        id: "fire",
        question: "I have no mouth, but I always consume. I have no life, but I must be fed. What am I?",
        answers: ["fire", "flame", "campfire"],
        reward: "strength", // Grants +1 Strength
        message: "The statue's eyes glow red. You feel a surge of physical power."
    },
    {
        id: "shadow",
        question: "The more of me there is, the less you see. What am I?",
        answers: ["darkness", "dark", "shadow", "night"],
        reward: "wits", // Grants +1 Wits
        message: "The statue seems to vanish for a moment. Your mind sharpens."
    },
    {
        id: "echo",
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        answers: ["echo"],
        reward: "psyche", // Grants +1 Psyche
        message: "A whisper surrounds you. Your will is strengthened."
    },
    {
        id: "silence",
        question: "I am so fragile that if you say my name, you break me. What am I?",
        answers: ["silence"],
        reward: "dexterity", // Grants +1 Dex (Stealth theme)
        message: "The world goes quiet. You feel lighter and faster."
    },
    {
        id: "coin",
        question: "I have a head and a tail, but no body. What am I?",
        answers: ["coin", "a coin", "gold coin"],
        reward: "charisma", // Grants +1 Charisma
        message: "The statue nods slowly. You feel more persuasive."
    },
    {
        id: "mountain",
        question: "What has roots as nobody sees, Is taller than trees, Up, up it goes, And yet never grows?",
        answers: ["mountain", "a mountain", "mountains"],
        reward: "constitution", // Grants +1 Constitution
        message: "The stone beneath your feet trembles. You feel unyielding."
    },
    {
        id: "river",
        question: "I can run but never walk, have a mouth but never talk, have a head but never weep, have a bed but never sleep. What am I?",
        answers: ["river", "a river", "water", "stream"],
        reward: "endurance", // Grants +1 Endurance
        message: "A rush of cool air washes over you. Your breath comes easier."
    },
    // --- NEW RIDDLES ---
    {
        id: "map",
        question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
        answers: ["map", "a map"],
        reward: "perception", // Grants +1 Perception
        message: "The statue's blank eyes seem to focus. Your vision pierces the veil."
    },
    {
        id: "hole",
        question: "I am weightless, but you can see me. Put me in a bucket, and I'll make it lighter. What am I?",
        answers: ["hole", "a hole"],
        reward: "luck", // Grants +1 Luck
        message: "A faint, echoing chuckle comes from the stone. You feel oddly fortunate."
    },
    {
        id: "footsteps",
        question: "The more you take, the more you leave behind. What am I?",
        answers: ["footsteps", "steps", "foot step", "step"],
        reward: "intuition", // Grants +1 Intuition
        message: "The dust settles around the statue's base. Your instincts sharpen."
    }
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
    "I found an obsidian arrowhead lodged in the doorframe. The elves are watching us."
];
