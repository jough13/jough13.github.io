// --- START OF FILE data-entities.js ---

window.PLAYER_RACES = {
    'human': {
        name: 'Human',
        description: "Versatile, ambitious, and stubborn. The short-lived conquerors of the Second Age.",
        stats: { charisma: 1, luck: 1, endurance: 1 }, 
        icon: '👨'
    },
    'elf': {
        name: 'Elf',
        description: "Ancient and keen-eyed. The fading magic of the First Age still flows through their veins.",
        stats: { wits: 2, perception: 1 }, 
        icon: '🧝'
    },
    'dwarf': {
        name: 'Dwarf',
        description: "Stout and unyielding. Born of stone, steel, and subterranean darkness.",
        stats: { constitution: 2, strength: 1 }, 
        icon: '🧔'
    },
    'orc': {
        name: 'Orc',
        description: "Fierce and mighty. For an Orc, glory is earned strictly in blood, battle, and honor.",
        stats: { strength: 2, endurance: 1 }, 
        icon: '👹'
    },
    'halfling': {
        name: 'Halfling',
        description: "Small, exceptionally quiet, and supernaturally lucky. They prefer to go unnoticed.",
        stats: { dexterity: 2, luck: 1 }, 
        icon: '🦶'
    }
};

window.QUEST_DATA = {
    // --- EARLY GAME ---
    "healerSupply": {
        title: "Herbal Remedies",
        description: "\"The swamp fever is spreading quickly. I desperately need 5 Medicinal Herbs ('🌿') to brew a cure.\"",
        type: 'collect', itemNeeded: 'Medicinal Herb', needed: 5,
        reward: { xp: 200, coins: 50, item: 'Healing Potion', itemQty: 3 }
    },
    "goblinHeirloom": {
        title: "The Lost Heirloom",
        description: "\"Please, a goblin ('g') stole my grandmother's ring! It's all I have left of my family!\"",
        type: 'fetch', enemy: 'g', itemNeeded: 'Heirloom', itemTile: '♦',
        reward: { xp: 150, coins: 100 }
    },
    "goblinTrophies": {
        title: "Goblin Trophies",
        description: "\"Those green runts keep stealing my mining gear! Bring me 10 Goblin Totems to prove you're thinning them out!\"",
        type: 'collect', itemNeeded: 'Goblin Totem', needed: 10,
        reward: { xp: 200, coins: 150 }
    },
    "wolfHunt": {
        title: "Bounty: Wolf Hunt",
        description: "\"The winter has made the packs bold. They took two sheep last night. Slay 10 Wolves ('w').\"",
        type: 'kill', enemy: 'w', needed: 10,
        reward: { xp: 100, coins: 50 }
    },
    "goblinHunt": {
        title: "Bounty: Goblin Hunt",
        description: "\"Goblins ('g') are multiplying in the nearby caves. Clear out 15 of them before they organize.\"",
        type: 'kill', enemy: 'g', needed: 15, 
        reward: { xp: 75, coins: 30 }
    },
    "skeletonScourge": {
        title: "Bounty: Skeleton Scourge",
        description: "\"The Old King's guard are walking the earth again. Put 10 Skeletons ('s') back to rest.\"",
        type: 'kill', enemy: 's', needed: 10,
        reward: { xp: 100, coins: 50 }
    },
    "spiderHunt": {
        title: "Bounty: Spider Nest",
        description: "\"The eastern caves are crawling with giant arachnids ('@'). Burn out their nests.\"",
        type: 'kill', enemy: '@', needed: 12,
        reward: { xp: 120, coins: 80 }
    },
    
    // --- MID GAME ---
    "banditCleanup": {
        title: "Bounty: Bandit Cleanup",
        description: "\"Highwaymen ('b') are waylaying travelers on the plains. Bring 12 of them to justice.\"",
        type: 'kill', enemy: 'b', needed: 12,
        reward: { xp: 120, coins: 75 }
    },
    "banditChief": {
        title: "Wanted: The Chief",
        description: "\"The Bandit Chief ('C') has occupied the ruined fortresses. Put a permanent end to his reign.\"",
        type: 'kill', enemy: 'C', needed: 1,
        reward: { xp: 500, coins: 300, item: 'Steel Sword', itemQty: 1 }
    },
    "orcHunt": {
        title: "Bounty: Orc Hunt",
        description: "\"The Orc Brutes ('o') are testing our defenses. Show them we are not easy prey.\"",
        type: 'kill', enemy: 'o', needed: 8,
        reward: { xp: 150, coins: 100 }
    },
    "mageMenace": {
        title: "Bounty: Mage Menace",
        description: "\"Rogue scholars ('m') are experimenting with Void magic in the wild. Stop them before reality tears.\"",
        type: 'kill', enemy: 'm', needed: 5,
        reward: { xp: 180, coins: 120 }
    },
    "draugrProblems": {
        title: "Bounty: Draugr Problems",
        description: "\"The frozen dead ('Z') are marching south. Send 5 of the Draugr back to their icy graves.\"",
        type: 'kill', enemy: 'Z', needed: 5,
        reward: { xp: 200, coins: 150 }
    },
    "trollHunt": {
        title: "Bounty: Ogre Sighting",
        description: "\"A massive Ogre ('Ø') has been terrorizing the mountain pass, crushing carts into splintered wood.\"",
        type: 'kill', enemy: 'Ø', needed: 1,
        reward: { xp: 250, coins: 150, item: 'Stamina Crystal', itemQty: 2 }
    },
    "cultistCleanup": {
        title: "Bounty: Dark Rituals",
        description: "\"The Shadowed Hand gathers in the ruins. Silence 8 of their Initiates ('c').\"",
        type: 'kill', enemy: 'c', needed: 8,
        reward: { xp: 180, coins: 120 }
    },
    "golemBreaker": {
        title: "Bounty: Stone Golems",
        description: "\"The earth itself is rejecting us. Slay 3 Stone Golems ('🧌') to secure the quarries.\"",
        type: 'kill', enemy: '🧌', needed: 3,
        reward: { xp: 300, coins: 200 }
    },
    "alphaHide": {
        title: "The Alpha's Hide",
        description: "\"A monstrous Dire Wolf has been stalking the southern tree line. Bring me its pelt to prove you are a true hunter.\"",
        type: 'collect', itemNeeded: 'Alpha Pelt', needed: 1,
        reward: { xp: 350, coins: 250, item: 'Potion of Speed', itemQty: 1 }
    },
    
    // --- LATE GAME & INQUISITOR ---
    "starMetalCrafter": {
        title: "Fallen Stars",
        description: "\"Master Thorne requires raw Star-Metal ('☄️'). You must search the highest peaks at midnight.\"",
        type: 'collect', itemNeeded: 'Star-Metal Ore', needed: 1,
        reward: { xp: 500, coins: 300 }
    },
    "cultistGenerals": {
        title: "The Hand's Fingers",
        description: "\"The Cult is led by bloodthirsty Fanatics ('z'). We cannot allow them to complete the ritual. Decapitate their leadership.\"",
        type: 'kill', enemy: 'z', needed: 15,
        reward: { xp: 800, coins: 500, item: 'Potion of Speed', itemQty: 3 }
    },
    "voidDemons": {
        title: "Banish the Demons",
        description: "\"Rifts have opened in the Deadlands. Void Demons ('😈d') are pouring through. Close the breach at all costs!\"",
        type: 'kill', enemy: '😈d', needed: 5,
        reward: { xp: 1200, coins: 800, item: 'Elixir of Life', itemQty: 1 }
    },
    "krakenHunt": {
        title: "The Deep Terror",
        description: "\"A Kraken ('🦑') is sinking our supply galleons. Sail into the deep ocean and slay the beast.\"",
        type: 'kill', enemy: '🦑', needed: 1,
        reward: { xp: 2000, coins: 1500, item: 'Kraken Ink Sac', itemQty: 2 }
    },
    "leviathanHunt": {
        title: "Bounty: The Apex",
        description: "\"The Abyssal Leviathan ('🦕') has awoken. Plunge into the ocean's abyss and hunt the apex predator.\"",
        type: 'kill', enemy: '🦕', needed: 1,
        reward: { xp: 3000, coins: 2500, item: 'Black Pearl', itemQty: 3 }
    },
    "eldritchTerror": {
        title: "Bounty: The Unnamable",
        description: "\"A horror from beyond the stars ('👾') has taken root in the wilds. Do not look directly at it.\"",
        type: 'kill', enemy: '👾', needed: 1,
        reward: { xp: 4000, coins: 3000, item: 'Elixir of Power', itemQty: 1 }
    },
    "astralFishing": {
        title: "The Astral Catch",
        description: "\"They say fish swim in the void between dimensions. I must study them! Bring me 3 Astral Jellies.\"",
        type: 'collect', itemNeeded: 'Astral Jelly', needed: 3,
        reward: { xp: 1500, coins: 1000, item: 'Mana Orb', itemQty: 5 }
    }
};

// LORE & MECHANIC WIN: Deeply flavorful elite affixes that wildly alter combat
window.ENEMY_PREFIXES = {
    "Savage": {
        description: "Fights with terrifying ferocity. Deals extra damage.",
        statModifiers: { attack: 2 },
        xpMult: 1.2,
        color: '#ef4444' 
    },
    "Armored": {
        description: "Covered in thick plates. Highly resistant to physical damage.",
        statModifiers: { defense: 2 },
        xpMult: 1.2,
        color: '#9ca3af' 
    },
    "Swift": {
        description: "Moves with blinding speed. Hard to hit.",
        statModifiers: { defense: 1 }, 
        xpMult: 1.1,
        color: '#facc15' 
    },
    "Massive": {
        description: "A mutated giant among its kind.",
        statModifiers: { maxHealth: 10, attack: 1 },
        xpMult: 1.5,
        color: '#ea580c' 
    },
    "Plagued": {
        description: "Oozes with sickness. Its attacks poison the blood.",
        statModifiers: { maxHealth: 5 },
        special: 'poison',
        xpMult: 1.3,
        color: '#22c55e' 
    },
    "Spectral": {
        description: "Phases between realms. Hard to hurt with physical weapons.",
        statModifiers: { defense: 3, maxHealth: -5 }, 
        xpMult: 1.4,
        color: '#a855f7' 
    },
    "Vampiric": {
        description: "Drains the life from its victims to heal itself.",
        statModifiers: { maxHealth: 5 },
        special: 'poison', // Proxy for life drain mechanics
        xpMult: 1.5,
        color: '#be123c' 
    },
    "Frenzied": {
        description: "Attacks wildly and without warning, abandoning defense.",
        statModifiers: { attack: 3, defense: -1 },
        xpMult: 1.3,
        color: '#f97316' 
    },
    "Crystalline": {
        description: "Covered in jagged, hardened crystal that deflects blows.",
        statModifiers: { defense: 4, maxHealth: 5 },
        xpMult: 1.6,
        color: '#22d3ee' 
    },
    "Infernal": {
        description: "Wreathed in unholy flames. Searing to the touch.",
        statModifiers: { attack: 2 },
        special: 'burn',
        xpMult: 1.4,
        color: '#f97316' 
    },
    "Void-Corrupted": {
        description: "Touched by the outside. It teleports erratically and shatters minds.",
        statModifiers: { maxHealth: 10, attack: 1 },
        special: 'madness',
        xpMult: 2.0,
        color: '#581c87' 
    }
};

// PERFORMANCE WIN: Unified object shapes. Explicitly declaring `defense: 0` stabilizes the V8 hidden class.
window.ENEMY_DATA = {
    // --- LEVEL 1 (Vermin & Weaklings) ---
    'r': {
        name: 'Giant Rat',
        tags: ['beast', 'vermin'],
        maxHealth: 3, attack: 1, defense: 0, xp: 4,
        loot: '🐀', 
        color: '#a8a29e', 
        flavor: "It has survived ages in the dark by eating what others leave behind. Its yellow teeth are filed sharp from gnawing on bones."
    },
    '🦇': {
        name: 'Giant Bat',
        tags: ['beast', 'vermin'],
        maxHealth: 2, attack: 1, defense: 0, xp: 5,
        loot: '🦇', 
        color: '#52525b', 
        flavor: "It swoops down from the darkness, hunting by the sound of your heartbeat."
    },
    '🐍': {
        name: 'Viper',
        tags: ['beast', 'reptile', 'poison'],
        maxHealth: 4, attack: 2, defense: 0, xp: 8,
        loot: '🦷', 
        color: '#22c55e', 
        inflicts: 'poison', inflictChance: 0.2,
        flavor: "Its emerald scales blend perfectly with the undergrowth. You usually feel the fangs before you see the snake."
    },
    'R': {
        name: 'Bandit Recruit',
        tags: ['humanoid'],
        maxHealth: 5, attack: 2, defense: 0, xp: 10,
        loot: '🧣', 
        color: '#fca5a5', 
        excludeFromLoot: true, 
        flavor: "He looks nervous, holding a rusted dagger with shaking hands. Hunger drove him to this."
    },
    '🍄s': {
        name: 'Sporeling',
        tags: ['fungus', 'poison'],
        maxHealth: 4, attack: 1, defense: 1, xp: 6,
        loot: '🍄',
        color: '#d946ef',
        inflicts: 'poison', inflictChance: 0.15,
        flavor: "A tiny, aggressive walking mushroom. It releases a cloud of choking dust when threatened."
    },
    '⚙️s': {
        name: 'Clockwork Spider',
        tags: ['construct', 'metal'],
        maxHealth: 3, attack: 2, defense: 3, xp: 8,
        loot: '⚙️',
        color: '#b45309',
        flavor: "Ticking brass and rusted gears. It bleeds black oil instead of blood, yet fights with unnatural ferocity."
    },

    // --- DESERT WILDLIFE ---
    '🦂s': { 
        name: 'Sand Scorpion',
        tags: ['bug', 'poison'],
        maxHealth: 5, attack: 2, defense: 1, xp: 8,
        loot: '🦷',
        color: '#d97706', 
        inflicts: 'poison', inflictChance: 0.3,
        flavor: "It burrows perfectly into the dunes, leaving only its venomous stinger exposed to the sun."
    },
    '🐍c': { 
        name: 'King Cobra',
        tags: ['beast', 'reptile', 'poison'],
        maxHealth: 15, attack: 5, defense: 0, xp: 30,
        loot: '🦷',
        color: '#eab308', 
        inflicts: 'poison', inflictChance: 0.5,
        flavor: "It rears up, hood flared, hissing loudly. A single bite can drop a warhorse in minutes."
    },

    // --- SWAMP WILDLIFE ---
    '🐸': {
        name: 'Giant Toad',
        tags: ['beast'],
        maxHealth: 20, attack: 3, defense: 0, xp: 25,
        loot: '🍖', 
        color: '#15803d', 
        flavor: "It sits perfectly still in the muck, waiting to swallow careless travelers whole."
    },
    '🦟': {
        name: 'Blood Mosquito',
        tags: ['bug'],
        maxHealth: 2, attack: 1, defense: 5, xp: 10,
        loot: 'vd',
        color: '#be123c', 
        flavor: "An annoying, high-pitched whine follows it. It is swollen and red with stolen blood."
    },

    // --- AQUATIC WILDLIFE ---
    '🦈': {
        name: 'Great Shark',
        tags: ['beast', 'aquatic'],
        maxHealth: 25, attack: 6, defense: 1, xp: 35,
        loot: '🐟', 
        color: '#94a3b8', 
        flavor: "A massive, scarred dorsal fin slices through the water. It has smelled you."
    },
    '🦀': {
        name: 'Giant Crab',
        tags: ['beast', 'aquatic', 'stone'],
        maxHealth: 18, attack: 4, defense: 5, xp: 25,
        loot: '🍖',
        color: '#ea580c', 
        flavor: "Its heavily armored shell is nearly impenetrable, and its claws can snap a ship's oar in half."
    },
    '🦑': {
        name: 'Kraken',
        tags: ['beast', 'aquatic', 'monster'],
        maxHealth: 200, attack: 12, defense: 4, xp: 800,
        loot: '🐙', 
        color: '#7c3aed', 
        isBoss: true,
        inflicts: 'root', inflictChance: 0.5,
        caster: true, castRange: 4, spellDamage: 8,
        flavor: "Massive, writhing tentacles burst from the deep ocean! It pulls entire galleons into the abyss."
    },
    '🧜‍♀️': {
        name: 'Siren',
        tags: ['humanoid', 'aquatic', 'magic'],
        maxHealth: 30, attack: 5, defense: 1, xp: 80,
        loot: '🐚', 
        color: '#38bdf8', 
        caster: true, castRange: 4, spellDamage: 6,
        inflicts: 'madness', inflictChance: 0.3,
        flavor: "Her song is beautiful and tragic, but beneath the water, her eyes are pitch black and hungry."
    },
    '🦕': {
        name: 'Abyssal Leviathan',
        tags: ['beast', 'aquatic', 'monster'],
        maxHealth: 300, attack: 15, defense: 5, xp: 1500,
        loot: '💎b', 
        color: '#0284c7', 
        isBoss: true,
        flavor: "A prehistoric terror of the deep. It is a natural disaster with teeth. Run."
    },
    // --- FOREST WILDLIFE ---
    '🐻': {
        name: 'Cave Bear',
        tags: ['beast', 'mountable'],
        mountable: true,
        maxHealth: 14, attack: 3, defense: 1, xp: 25, 
        loot: '❄️f', 
        color: '#78350f', 
        flavor: "A towering wall of muscle and fur. It fiercely defends its territory."
    },
    '🦌': {
        name: 'Stag',
        tags: ['beast'],
        maxHealth: 15, attack: 2, defense: 0, xp: 10,
        loot: '🍖',
        color: '#b45309', 
        flavor: "It watches you warily, heavy antlers lowered in a defensive stance."
    },

    // --- LEVEL 2-3 (Standard Threats) ---
    'g': {
        name: 'Goblin',
        tags: ['humanoid', 'goblin'],
        maxHealth: 6, attack: 2, defense: 0, xp: 12,
        loot: 't',
        color: '#16a34a', 
        flavor: "Scavengers who worship the scrap metal left behind by the Great Fall. Cowards alone, deadly in packs."
    },
    'w': {
        name: 'Wolf',
        tags: ['beast', 'mountable'],
        mountable: true,
        maxHealth: 8, attack: 3, defense: 0, xp: 15,
        loot: 'p',
        color: '#78716c', 
        flavor: "A lean, hungry predator of the wilds. It circles you, waiting for an opening."
    },
    's': {
        name: 'Skeleton',
        tags: ['undead', 'bone'],
        maxHealth: 10, attack: 3, defense: 1, xp: 18,
        loot: '(',
        color: '#e5e7eb', 
        flavor: "Once the King's elite guard. Even in death, their bones are bound by an oath to protect the ruins."
    },
    'b': {
        name: 'Bandit',
        tags: ['humanoid'],
        maxHealth: 10, attack: 2, defense: 1, xp: 20,
        loot: 'i',
        color: '#ef4444', 
        flavor: "Desperate men driven to crime by a dying world. They fight dirty."
    },
    '👺': {
        name: 'Goblin Archer',
        tags: ['humanoid', 'goblin'],
        maxHealth: 5, attack: 3, defense: 0, xp: 15,
        loot: '➹', 
        color: '#16a34a',
        isRanged: true, range: 5,
        flavor: "It draws back a crudely strung shortbow, giggling as it aims for your knees."
    },
    '👺m': {
        name: 'Goblin Shaman',
        tags: ['humanoid', 'goblin', 'magic'],
        maxHealth: 8, attack: 1, defense: 0, xp: 25,
        loot: '🔮', 
        color: '#4ade80', 
        caster: true, castRange: 4, spellDamage: 4,
        inflicts: 'root', inflictChance: 0.3,
        flavor: "It wears a skull mask and chants in a guttural tongue, commanding the roots of the earth."
    },
    '💀a': {
        name: 'Skeleton Archer',
        tags: ['undead', 'bone'],
        maxHealth: 8, attack: 4, defense: 1, xp: 20,
        loot: '➹', 
        color: '#e5e7eb',
        isRanged: true, range: 6,
        flavor: "Its aim is supernaturally steady, completely unaffected by breath, heartbeat, or fear."
    },
    'k': {
        name: 'Kobold',
        tags: ['humanoid', 'reptile'],
        maxHealth: 6, attack: 2, defense: 0, xp: 10,
        loot: '$',
        color: '#ea580c', 
        flavor: "Yip yip! A reptilian hoarder of shiny things. They steal anything not nailed down."
    },
    '🐗': {
        name: 'Wild Boar',
        tags: ['beast', 'mountable'],
        mountable: true,
        maxHealth: 12, attack: 3, defense: 0, xp: 20,
        loot: '🍖',
        color: '#57534e', 
        flavor: "It scrapes its razor-sharp tusks against the ground, preparing to charge in a blind rage."
    },
    'a': {
        name: 'Shadow Acolyte',
        tags: ['humanoid', 'void', 'magic'],
        maxHealth: 8, attack: 1, defense: 0, xp: 15,
        loot: 'r',
        color: '#7c3aed', 
        caster: true, castRange: 4, spellDamage: 3,
        flavor: "They whisper ancient texts that physically hurt your ears to hear. Zealots of the Void."
    },
    '👻i': {
        name: 'Ice Wraith',
        tags: ['undead', 'ethereal', 'frost'],
        maxHealth: 10, attack: 3, defense: 2, xp: 20,
        loot: 'E',
        color: '#7dd3fc',
        caster: true, castRange: 4, spellDamage: 4, inflicts: 'frostbite', inflictChance: 0.3,
        flavor: "A screaming soul trapped forever in the biting cold. To touch it is to feel the grave."
    },

    // --- LEVEL 4-5 (Advanced Threats) ---
    '@': {
        name: 'Giant Spider',
        tags: ['bug', 'poison', 'mountable'],
        mountable: true,
        maxHealth: 10, attack: 4, defense: 0, xp: 25,
        loot: '"',
        color: '#1f2937', 
        inflicts: 'poison',
        flavor: "It moves with terrifying, silent speed, its eight eyes reflecting the moonlight."
    },
    '🦂': {
        name: 'Giant Scorpion',
        tags: ['bug', 'poison'],
        maxHealth: 12, attack: 4, defense: 2, xp: 30,
        loot: 'i',
        color: '#b45309', 
        inflicts: 'poison',
        flavor: "Its carapace deflects blades, and its stinger drips with neurotoxin."
    },
    'l': {
        name: 'Giant Leech',
        tags: ['bug', 'aquatic'],
        maxHealth: 15, attack: 2, defense: 0, xp: 20,
        loot: 'p',
        color: '#111827', 
        inflicts: 'poison',
        flavor: "A writhing mass of blind hunger from the deep swamps. It seeks warmth and blood."
    },
    'o': {
        name: 'Orc Brute',
        tags: ['humanoid', 'orc'],
        maxHealth: 20, attack: 5, defense: 1, xp: 40,
        loot: 'U',
        color: '#14532d', 
        flavor: "A towering wall of muscle and rage. They respect nothing but overwhelming violence."
    },
    'Z': {
        name: 'Draugr',
        tags: ['undead', 'frost'],
        maxHealth: 18, attack: 4, defense: 2, xp: 35,
        loot: 'E',
        color: '#38bdf8', 
        inflicts: 'frostbite',
        flavor: "Ancient northmen, preserved perfectly by the biting frost. Their eyes glow with pale blue light."
    },
    '👷': {
        name: 'Undead Miner',
        tags: ['undead'],
        maxHealth: 25, attack: 5, defense: 2, xp: 35,
        loot: '🧨', // Drops TNT!
        color: '#fcd34d', 
        flavor: "He still swings his rusted pickaxe, long after his final shift ended centuries ago."
    },
    '👁️': {
        name: 'Void Watcher',
        tags: ['void', 'monster', 'ethereal'],
        maxHealth: 15, attack: 1, defense: 0, xp: 45,
        loot: 'vd',
        color: '#c084fc',
        caster: true, castRange: 6, spellDamage: 5, inflicts: 'madness', inflictChance: 0.5,
        flavor: "A floating, unblinking eye born from the cosmic tear. It sees your darkest regrets."
    },

    // --- LEVEL 6+ (Elites) ---
    '🐺': {
        name: 'Dire Wolf',
        tags: ['beast', 'mountable'],
        mountable: true,
        maxHealth: 25, attack: 6, defense: 1, xp: 60,
        loot: '🐺',
        color: '#44403c', 
        flavor: "An enormous beast with eyes like burning coals. The unquestioned alpha of the woods."
    },
    'Ø': { 
        name: 'Ogre',
        tags: ['humanoid', 'giant', 'mountable'],
        mountable: true,
        maxHealth: 35, attack: 7, defense: 1, xp: 80,
        loot: '$',
        color: '#84cc16', 
        flavor: "Dull-witted but incredibly destructive. It uses entire tree trunks as clubs."
    },
    'Y': {
        name: 'Yeti',
        tags: ['beast', 'frost', 'giant'],
        maxHealth: 40, attack: 6, defense: 2, xp: 90,
        loot: '❄️f',
        color: '#f8fafc', 
        inflicts: 'frostbite',
        flavor: "The undisputed apex predator of the frozen peaks. It blends perfectly into the blizzards."
    },
    'm': {
        name: 'Arcane Mage',
        tags: ['humanoid', 'magic', 'void'],
        maxHealth: 15, attack: 2, defense: 0, xp: 50,
        loot: '&',
        color: '#c084fc', 
        caster: true, castRange: 6, spellDamage: 6,
        flavor: "A scholar who stared too long into the Void. Their body is now just a crumbling vessel for forbidden math."
    },
    'C': {
        name: 'Bandit Chief',
        tags: ['humanoid'],
        maxHealth: 25, attack: 5, defense: 2, xp: 50,
        loot: 'i',
        color: '#991b1b', 
        flavor: "A ruthless leader clad in stolen armor, demanding heavy tolls in blood and gold."
    },
    'f': {
        name: 'Fire Elemental',
        tags: ['elemental', 'fire', 'ethereal'],
        maxHealth: 20, attack: 5, defense: 3, xp: 60,
        loot: '🔥c',
        color: '#fb923c', 
        caster: true, castRange: 4, spellDamage: 5,
        inflicts: 'burn',
        flavor: "A walking inferno of pure elemental rage. The ground turns to glass where it walks."
    },
    '👻': {
        name: 'Lost Soul',
        tags: ['undead', 'ethereal'],
        type: 'spirit', 
        maxHealth: 15, attack: 3, defense: 0, xp: 20,
        loot: 'ectoplasm',
        color: '#8b5cf6', 
        flavor: "It wails silently, trapped between realms. A tragic echo of the Fall."
    },
    '😈d': {
        name: 'Void Demon',
        tags: ['demon', 'void', 'ethereal'],
        maxHealth: 50, attack: 8, defense: 4, xp: 200,
        loot: '😈',
        color: '#581c87', 
        teleporter: true, inflicts: 'madness',
        flavor: "A fragment of the nothingness that existed before the First Age. It hates all life."
    },
    'v': {
        name: 'Void Stalker',
        tags: ['void', 'monster'],
        maxHealth: 15, attack: 6, defense: 1, xp: 55,
        loot: 'vd',
        color: '#7c3aed', 
        teleporter: true,
        flavor: "It phases in and out of reality, tracking your scent through higher dimensions."
    },
    'M': {
        name: 'Mimic',
        tags: ['monster', 'construct'],
        maxHealth: 20, attack: 6, defense: 2, xp: 50,
        loot: '💍',
        color: '#854d0e', 
        inflicts: 'root',
        flavor: "A monstrous shape-shifter hoping for a greedy victim. Its tongue is sticky with acid."
    },
    '🧟': {
        name: 'Spore Zombie',
        tags: ['undead', 'fungus', 'poison'],
        maxHealth: 18, attack: 4, defense: 0, xp: 25,
        loot: '🍄', 
        color: '#86efac', 
        inflicts: 'poison', inflictChance: 0.4,
        flavor: "It was once an adventurer. Now, glowing fungal networks control its nervous system."
    },
    '🪨c': {
        name: 'Crystal Behemoth',
        tags: ['elemental', 'stone'],
        maxHealth: 35, attack: 5, defense: 4, xp: 60,
        loot: '💎', 
        color: '#22d3ee', 
        flavor: "Its crystalline hide reflects the ambient light... and deflects your attacks with ease."
    },
    '🤖': {
        name: 'Clockwork Guardian',
        tags: ['construct', 'metal'],
        maxHealth: 50, attack: 8, defense: 6, xp: 120,
        loot: '⚙️', 
        color: '#f59e0b', 
        flavor: "A relic of the Second Age. It still ruthlessly executes its final programmed order: ELIMINATE."
    },
    '🐛': {
        name: 'Dune Thresher',
        tags: ['beast', 'monster', 'bug'],
        maxHealth: 120, attack: 12, defense: 2, xp: 400,
        loot: '🦷', 
        color: '#d97706', 
        isBoss: true,
        flavor: "The ground shakes before it erupts from the sand, a massive maw of a thousand spinning teeth."
    },
    '🧙': {
        name: 'Necromancer Lord',
        tags: ['humanoid', 'magic', 'undead', 'boss'],
        maxHealth: 80, attack: 7, defense: 3, xp: 1000,
        loot: '👑',
        color: '#000000', 
        caster: true, castRange: 7, spellDamage: 8,
        isBoss: true,
        flavor: "He wears a crown of bone and commands the armies of the dead. Do not let him complete his incantation or all is lost."
    },
    'c': {
        name: 'Cultist Initiate',
        tags: ['humanoid', 'void', 'magic'],
        maxHealth: 12, attack: 3, defense: 0, xp: 25,
        loot: '📜', 
        color: '#be185d', 
        flavor: "He mutters fanatical prayers to a sleeping god in the dark."
    },
    'z': {
        name: 'Cultist Fanatic',
        tags: ['humanoid', 'void', 'magic'],
        maxHealth: 15, attack: 6, defense: 0, xp: 35,
        loot: '🗡️', 
        color: '#9f1239', 
        flavor: "He fights with reckless, terrifying abandon, eager to martyr himself for the Void."
    },

    // --- NEW BEASTS (Tanky & Dangerous) ---
    '🧌': { 
        name: 'Stone Golem',
        tags: ['construct', 'stone', 'elemental', 'mountable'],
        mountable: true,
        maxHealth: 40, attack: 4, defense: 3, xp: 60,
        loot: '🪨', 
        color: '#a8a29e', 
        flavor: "A walking boulder, animated by ancient earth magic. Blades skitter harmlessly off its hide."
    },
    '🐲': {
        name: 'Young Drake',
        tags: ['beast', 'reptile', 'dragon', 'fire', 'mountable'],
        mountable: true,
        maxHealth: 50, attack: 7, defense: 2, xp: 100,
        loot: '🐉', 
        color: '#dc2626', 
        inflicts: 'burn', inflictChance: 0.3,
        flavor: "Smoke curls from its nostrils as it eyes you hungrily. It is small for a dragon, but still lethal."
    },
    // --- TIER 4 (The Deep Wilds - 2500+ Distance) ---
    '🦖': {
        name: 'Ancient Rex',
        tags: ['beast', 'reptile', 'giant', 'mountable'],
        mountable: true,
        maxHealth: 150, attack: 12, defense: 5, xp: 500,
        loot: '🦖', 
        color: '#14532d', 
        flavor: "The earth physically shakes with every heavy step. It is the king of the deep jungles."
    },
    '🧛': {
        name: 'Vampire Lord',
        tags: ['undead', 'humanoid', 'magic'],
        maxHealth: 80, attack: 10, defense: 3, xp: 600,
        loot: '🩸', 
        color: '#e11d48', 
        caster: true, castRange: 5, spellDamage: 8,
        inflicts: 'siphon', 
        flavor: "He moves faster than your eyes can follow, elegant, aristocratic, and completely merciless."
    },
    '👾': {
        name: 'Eldritch Horror',
        tags: ['void', 'demon', 'ethereal', 'monster'],
        maxHealth: 200, attack: 15, defense: 0, xp: 800,
        loot: 'vd',
        color: '#8b5cf6', 
        inflicts: 'madness', inflictChance: 0.5,
        flavor: "Its geometry makes no sense. To look directly at it is to invite your own mind to shatter."
    },
    '🐉h': {
        name: 'Swamp Hydra',
        tags: ['beast', 'reptile', 'dragon', 'poison'],
        maxHealth: 60, attack: 6, defense: 2, xp: 150,
        loot: '🐉',
        color: '#15803d', 
        inflicts: 'poison',
        flavor: "Multiple venomous heads snap at you from the toxic muck."
    },
    '🔥e': {
        name: 'Efreet',
        tags: ['elemental', 'fire', 'demon', 'ethereal'],
        maxHealth: 60, attack: 8, defense: 1, xp: 150,
        loot: '🔥c',
        color: '#f97316', 
        caster: true, castRange: 5, spellDamage: 6,
        inflicts: 'burn',
        flavor: "A malicious spirit of smoke and flame, bound to this plane by ancient chains."
    },
    // ==========================================
    // --- THE FINAL BOSS ---
    // ==========================================
    '☠️': {
        name: 'Alaric, The Fallen King',
        tags: ['undead', 'void', 'boss'],
        maxHealth: 1000, attack: 20, defense: 8, xp: 5000,
        loot: '🧿e', color: '#000000', isBoss: true,
        caster: true, castRange: 6, spellDamage: 12, inflicts: 'madness',
        flavor: "He is no longer a man. The golden crown is fused directly into his skull. He moves with a terrible, silent grace, serving as a conduit for the Void itself. The air around him screams."
    },
    '🩸c': {
        name: 'Arena Champion',
        tags: ['undead', 'bone', 'boss'],
        maxHealth: 350, attack: 18, defense: 5, xp: 2500,
        loot: '🏆', // Drops the Token!
        color: '#dc2626', 
        isBoss: true,
        flavor: "A towering gladiator constructed of fossilized bone and volcanic ash. It has stood undefeated across a thousand lifetimes. It points its weapon directly at you."
    }
};

window.PLAYER_BACKGROUNDS = {
    'warrior': {
        name: 'Warrior',
        description: 'A master of martial combat, built to survive the frontline.',
        stats: { strength: 2, constitution: 1 },
        items: [
            { templateId: '!', name: 'Rusty Sword', type: 'weapon', quantity: 1, tile: '!', damage: 2, slot: 'weapon', tags: ['blade'] },
            { templateId: '%', name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor', tags: ['clothing'] },
            { templateId: '1', name: 'Conscript\'s Orders', type: 'journal', quantity: 1, tile: '1', title: 'Crumpled Orders' }
        ]
    },
    'rogue': {
        name: 'Rogue',
        description: 'Nimble and lethal, favoring speed, evasion, and critical strikes.',
        stats: { dexterity: 2, luck: 1 },
        items: [
            { templateId: '†', name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon', tags: ['dagger', 'blade', 'bone'] },
            { templateId: '%', name: 'Leather Tunic', type: 'armor', quantity: 1, tile: '%', defense: 1, slot: 'armor', tags: ['clothing'] },
            { templateId: '2', name: 'Thief\'s Map', type: 'journal', quantity: 1, tile: '2', title: 'Scribbled Map' }
        ]
    },
    'mage': {
        name: 'Mage',
        description: 'A scholar of the arcane, wielding destructive spells and shields.',
        stats: { wits: 2, willpower: 1 },
        items: [
            { templateId: '📚', name: 'Spellbook: Magic Bolt', type: 'spellbook', quantity: 1, tile: '📚', spellId: 'magicBolt' },
            { templateId: '3', name: 'Burned Scroll', type: 'journal', quantity: 1, tile: '3', title: 'Singed Parchment' }
        ]
    },
    'necromancer': {
        name: 'Necromancer',
        description: 'Commands the forces of life and death, raising minions from the grave.',
        stats: { wits: 1, willpower: 2 },
        items: [
            { templateId: '†', name: 'Bone Dagger', type: 'weapon', quantity: 1, tile: '†', damage: 2, slot: 'weapon', tags: ['dagger', 'blade', 'bone'] },
            { templateId: '💀', name: 'Tome: Raise Dead', type: 'spellbook', quantity: 1, tile: '💀', spellId: 'raiseDead' },
            { templateId: '4', name: 'Mad Scrawlings', type: 'journal', quantity: 1, tile: '4', title: 'Dirty Scrap' }
        ]
    },
    'wretch': {
        name: 'The Wretch',
        description: 'Naked, afraid, and penniless. A true challenge for veterans.',
        stats: { luck: 2, endurance: 2 }, 
        items: [
            { templateId: 'x', name: 'Tattered Rags', type: 'armor', quantity: 1, tile: 'x', defense: 0, slot: 'armor', tags: ['clothing'] },
            { templateId: 'idol', name: 'Strange Idol', type: 'trade', quantity: 1, tile: '🗿' }
        ]
    }
};

window.EVOLUTION_DATA = {
    'warrior': [
        {
            id: 'berserker',
            name: 'Berserker',
            icon: '👹', 
            description: "A terrifying force of nature.",
            stats: { strength: 4, constitution: 2 },
            talent: 'blood_rage'
        },
        {
            id: 'paladin',
            name: 'Paladin',
            icon: '🛡️',
            description: "A holy defender shrouded in light.",
            stats: { constitution: 3, willpower: 2, charisma: 2 },
            talent: 'holy_aura'
        }
    ],
    'rogue': [
        {
            id: 'assassin',
            name: 'Assassin',
            icon: '🥷',
            description: "A master of the shadows.",
            stats: { dexterity: 4, wits: 2 },
            talent: 'shadow_strike'
        },
        {
            id: 'ranger',
            name: 'Ranger',
            icon: '🏹',
            description: "A lethal and precise marksman.", 
            stats: { dexterity: 3, perception: 3 },
            talent: 'eagle_eye'
        }
    ],
    'mage': [
        {
            id: 'archmage',
            name: 'Archmage',
            icon: '🧙‍♂️',
            description: "A pure conduit for the leylines.",
            stats: { wits: 5, maxMana: 20 },
            talent: 'mana_flow'
        },
        {
            id: 'battlemage',
            name: 'Battlemage',
            icon: '🗡️',
            description: "A heavily armored spellcaster.",
            stats: { strength: 3, wits: 3 },
            talent: 'arcane_steel'
        }
    ],
    'necromancer': [
        {
            id: 'lich',
            name: 'Lich',
            icon: '💀',
            description: "You have conquered death itself.",
            stats: { wits: 4, willpower: 4 },
            talent: 'undeath'
        }
    ],
    'wretch': [
        {
            id: 'hero',
            name: 'True Hero',
            icon: '👑',
            description: "You survived the darkness against all odds.",
            stats: { strength: 5, dexterity: 5, wits: 5, constitution: 5 },
            talent: 'legend'
        },
        {
            id: 'void_touched',
            name: 'Void-Touched',
            icon: '👁️',
            description: "You stared into the abyss, and it stared back.",
            stats: { willpower: 10, wits: 10, constitution: -2 },
            talent: 'void_walker'
        }
    ]
};

window.SPELL_DATA = {
    "candlelight": {
        name: "Candlelight",
        description: "Summons a floating light. Huge vision radius (+6) for a long time.",
        flavor: "A simple cantrip taught to every apprentice. It smells faintly of ozone and old wax.",
        cost: 15, costType: "mana", requiredLevel: 1, target: "self", type: "buff", duration: 100,
        cooldown: 5 
    },
    "chainLightning": {
        name: "Chain Lightning",
        description: "Strikes a target, then jumps to a nearby enemy. Scales with {blue:Wits}.",
        flavor: "Arcane energy leaps violently between grounded targets.",
        scalingStat: "wits",
        cost: 18, costType: "mana", requiredLevel: 6, target: "aimed", baseDamage: 6,
        cooldown: 4
    },
    "stoneSkin": {
        name: "Stone Skin",
        description: "Greatly increases Defense but lowers Dexterity. Scales with {green:Constitution}.",
        flavor: "Your flesh hardens into granite, turning blades and absorbing impacts.",
        scalingStat: "constitution",
        cost: 20, costType: "mana", requiredLevel: 3, target: "self", type: "buff", duration: 15,
        cooldown: 5
    },
    "lesserHeal": {
        name: "Lesser Heal",
        description: "Heals for a small amount. Scales with {blue:Wits}.",
        flavor: "A warm, golden light knits flesh and mends bone.",
        scalingStat: "wits",
        cost: 5, costType: "mana", requiredLevel: 1, target: "self", baseHeal: 5,
        cooldown: 3
    },
    "clarity": {
        name: "Clarity",
        description: "Focus your mind to reveal adjacent {purple:secret walls}.",
        flavor: "Your eyes pierce the physical world, viewing the underlying structure of reality.",
        cost: 8, costType: "psyche", requiredLevel: 1, target: "self", type: "utility",
        cooldown: 2
    },
    "raiseDead": {
        name: "Raise Dead",
        description: "Summons a Skeleton from a corpse (or bone pile) to fight for you. Scales with {purple:Willpower}.",
        flavor: "A forbidden incantation that forces a fractured soul back into a physical vessel.",
        scalingStat: "willpower",
        cost: 15, costType: "mana", requiredLevel: 1, target: "aimed", range: 3,
        cooldown: 5
    },
    "arcaneShield": {
        name: "Arcane Shield",
        description: "Creates a temporary shield that absorb damage. Scales with {blue:Wits}.",
        flavor: "A shimmering barrier of pure energy that shatters upon taking too much force.",
        scalingStat: "wits",
        cost: 10, costType: "mana", requiredLevel: 3, target: "self", type: "buff", baseShield: 5, duration: 5,
        cooldown: 4
    },
    "fireball": {
        name: "Fireball",
        description: "An explosive orb damages enemies in a 3x3 area. Scales with {blue:Wits}.",
        flavor: "A volatile sphere of pyromantic fury. Do not cast indoors.",
        scalingStat: "wits",
        cost: 15, costType: "mana", requiredLevel: 5, target: "aimed", baseDamage: 8, radius: 1,
        cooldown: 3
    },
    "siphonLife": {
        name: "Siphon Life",
        description: "Drains life from a target, healing you. Scales with {purple:Willpower}.",
        flavor: "The darkest art. To drink the life force of another is to damn your own soul.",
        scalingStat: "willpower",
        cost: 12, costType: "psyche", requiredLevel: 4, target: "aimed", baseDamage: 4, healPercent: 0.5,
        cooldown: 2
    },
    "thunderbolt": {
        name: "Thunderbolt",
        description: "Strikes a target with massive lightning damage. Scales with {blue:Wits}.",
        flavor: "A single, devastating strike from the heavens. Deafening and absolute.",
        scalingStat: "wits",
        cost: 20, costType: "mana", requiredLevel: 6, target: "aimed", baseDamage: 12,
        cooldown: 3
    },
    "meteor": {
        name: "Meteor",
        description: "Summons a meteor from the heavens. Large AoE (5x5). Scales with {blue:Wits}.",
        flavor: "Pull a falling star from its orbit and hurl it at your enemies.",
        scalingStat: "wits",
        cost: 30, costType: "mana", requiredLevel: 8, target: "aimed", baseDamage: 10, radius: 2,
        cooldown: 6
    },
    "divineLight": {
        name: "Divine Light",
        description: "Fully restores Health and {gold:cures all status effects}.",
        flavor: "A blinding flash of holy energy that scours away all corruption and pain.",
        cost: 25, costType: "psyche", requiredLevel: 5, target: "self", type: "utility",
        cooldown: 8
    },
    "magicBolt": {
        name: "Magic Bolt",
        description: "Hurls a bolt of arcane energy. Scales with {blue:Wits}.",
        flavor: "A simple but reliable projectile of raw magical force.",
        scalingStat: "wits",
        cost: 8, costType: "mana", requiredLevel: 1, target: "aimed", baseDamage: 5,
        cooldown: 1 
    },
    "psychicBlast": {
        name: "Psychic Blast",
        description: "Assaults a target's mind. Scales with {purple:Willpower}.",
        flavor: "A direct telepathic strike. It bypasses physical armor entirely.",
        scalingStat: "willpower",
        cost: 10, costType: "psyche", requiredLevel: 2, target: "aimed", baseDamage: 6,
        cooldown: 2
    },
    "frostBolt": {
        name: "Frost Bolt",
        description: "Hurls a shard of ice. Has a chance to inflict {cyan:Frostbite}. Scales with {purple:Willpower}.",
        flavor: "A jagged icicle that bites into the flesh and slows the blood.",
        scalingStat: "willpower",
        cost: 10, costType: "mana", requiredLevel: 1, target: "aimed", baseDamage: 5, inflicts: "frostbite", inflictChance: 0.25,
        cooldown: 2
    },
    "poisonBolt": {
        name: "Poison Bolt",
        description: "Launches a bolt of acid. Has a chance to inflict {green:Poison}. Scales with {purple:Willpower}.",
        flavor: "A sickening glob of corrosive magic that melts through armor and flesh alike.",
        scalingStat: "willpower",
        cost: 10, costType: "psyche", requiredLevel: 2, target: "aimed", baseDamage: 4, inflicts: "poison", inflictChance: 0.50,
        cooldown: 2
    },
    "darkPact": {
        name: "Dark Pact",
        description: "Sacrifice 5 Health to restore 10 Mana. Scales with {purple:Willpower}.",
        flavor: "You offer a piece of your own vitality to the Void in exchange for raw power.",
        scalingStat: "willpower",
        cost: 5, costType: "health", requiredLevel: 4, target: "self", baseRestore: 10,
        cooldown: 2
    },
    "entangle": {
        name: "Entangle",
        description: "Roots an enemy in place, preventing movement and attacks. Scales with {yellow:Intuition}.",
        flavor: "Vines and roots burst from the soil, answering your call to bind your foes.",
        scalingStat: "intuition",
        cost: 12, costType: "mana", requiredLevel: 3, target: "aimed", baseDamage: 2, inflicts: "root", inflictChance: 1.0,
        cooldown: 4
    },
    "thornSkin": {
        name: "Thorn Skin",
        description: "Reflects damage back to attackers. Scales with {yellow:Intuition}.",
        flavor: "Your skin becomes a briar patch of razor-sharp thorns.",
        scalingStat: "intuition",
        cost: 15, costType: "mana", requiredLevel: 4, target: "self", type: "buff", baseReflect: 2, duration: 5,
        cooldown: 5
    }
};

window.TALENT_DATA = {
    // --- BASE TALENTS ---
    "bloodlust": {
        name: "Bloodlust",
        description: "Heal {green:2 HP} whenever you kill an enemy.",
        flavor: "The sight of blood invigorates you.",
        class: "warrior",
        icon: "🩸"
    },
    "iron_skin": {
        name: "Iron Skin",
        description: "Permanent {blue:+1 Bonus} to Base Defense.",
        flavor: "Your flesh is tough and unyielding.",
        class: "warrior",
        icon: "🛡️"
    },
    "backstab": {
        name: "Backstab",
        description: "Critical hits deal {red:3x damage} instead of 1.5x.",
        flavor: "You know exactly where to slip the blade.",
        class: "rogue",
        icon: "🗡️"
    },
    "evasion": {
        name: "Evasion",
        description: "{gold:+10% chance} to dodge enemy attacks.",
        flavor: "You move like smoke on the wind.",
        class: "rogue",
        icon: "💨"
    },
    "arcane_potency": {
        name: "Arcane Potency",
        description: "All spells deal {blue:+2 Bonus Damage}.",
        flavor: "Your magic strikes with devastating force.",
        class: "mage",
        icon: "✨"
    },
    "scholar": {
        name: "Scholar",
        description: "Gain {yellow:+20% more XP} from all sources.",
        flavor: "You learn quickly from every encounter.",
        class: "mage",
        icon: "📖"
    },
    "soul_siphon": {
        name: "Soul Siphon",
        description: "Restore {purple:2 Mana} whenever you kill an enemy.",
        flavor: "You draw power from the fading life of your foes.",
        class: "necromancer",
        icon: "💀"
    },
    "survivalist": {
        name: "Survivalist",
        description: "Foraging (Wildberries/Herbs) restores {green:double HP/Mana}.",
        flavor: "You know how to live off the land.",
        class: "general",
        icon: "🌿"
    },
    "pathfinder": {
        name: "Pathfinder",
        description: "Move through forests and brush {gold:without losing stamina}.",
        flavor: "The woods are your true home.",
        class: "ranger",
        icon: "🌲"
    },
    "eagle_eye": {
        name: "Eagle Eye",
        description: "Ranged attacks deal {red:+50% Damage}.",
        flavor: "Your aim is true and your arrows strike deep.",
        class: "ranger",
        icon: "👁️"
    },
    // --- EVOLUTION TALENTS ---
    "blood_rage": {
        name: "Blood Rage",
        description: "Deal {red:double damage} when below 50% Health.",
        flavor: "Pain only fuels your fury.",
        class: "berserker",
        icon: "💢"
    },
    "holy_aura": {
        name: "Holy Aura",
        description: "Passively {green:heals you and your companion} when low on health.",
        flavor: "A divine light surrounds and protects you.",
        class: "paladin",
        icon: "👼"
    },
    "shadow_strike": {
        name: "Shadow Strike",
        description: "Attacks from stealth deal {purple:4x massive damage}.",
        flavor: "You strike from the darkness with lethal precision.",
        class: "assassin",
        icon: "🥷"
    },
    "mana_flow": {
        name: "Mana Flow",
        description: "Reduces spell Mana costs and Leyline travel costs by {blue:20%}.",
        flavor: "You are a living conduit for the world's magic.",
        class: "archmage",
        icon: "🌌"
    },
    "arcane_steel": {
        name: "Arcane Steel",
        description: "{gray:Negates the Dexterity and movement penalties} of Heavy Armor.",
        flavor: "Your magic lifts the weight of your armor.",
        class: "battlemage",
        icon: "🛡️"
    },
    "undeath": {
        name: "Undeath",
        description: "You {gray:no longer require food or water} to survive.",
        flavor: "You have shed the frailties of mortal life.",
        class: "lich",
        icon: "🧟"
    },
    "legend": {
        name: "Living Legend",
        description: "Your mere presence inspires awe. You have survived the impossible.",
        flavor: "Your name will be sung in songs for centuries.",
        class: "hero",
        icon: "👑"
    },
    "void_walker": { 
        name: "Void Walker",
        description: "Step through {purple:Phase Walls} without taking damage.",
        flavor: "You walk between the worlds.",
        class: "void_touched",
        icon: "👁️"
    }
};

window.SKILL_DATA = {
    // --- BASIC TECHNIQUES ---
    "kick": {
        name: "Kick",
        description: "Stun an enemy for 2 turns. Deals low damage.",
        flavor: "A swift, disruptive blow to throw the enemy off balance.",
        cost: 8, costType: "stamina", requiredLevel: 1, target: "aimed", baseDamageMultiplier: 0.2, cooldown: 8,
    },
    "vanish": {
        name: "Vanish",
        description: "Instantly drop all enemy aggro and enter {gray:Stealth}.",
        flavor: "A puff of smoke, a sudden distraction, and you are gone.",
        cost: 15, costType: "stamina", requiredLevel: 4, target: "self", cooldown: 30, type: "utility"
    },
    "brace": {
        name: "Brace",
        description: "Gain temporary Defense. Scales with {green:Constitution}.",
        flavor: "You ready yourself for the incoming blow, hardening your muscles.",
        scalingStat: "constitution",
        cost: 6, costType: "stamina", requiredLevel: 2, target: "self", type: "buff", baseDefense: 1, duration: 3, cooldown: 5 
    },
    "tame": {
        name: "Tame Beast",
        description: "Attempt to bond with a weakened animal (HP < 30%). Scales with {gold:Charisma}.",
        flavor: "You project an aura of calm dominance, seeking to make the beast your ally.",
        scalingStat: "charisma",
        cost: 15, costType: "psyche", requiredLevel: 3, target: "aimed", cooldown: 20
    },
    "lunge": {
        name: "Lunge",
        description: "Attack an enemy 2-3 tiles away. Scales with {red:Strength}.",
        flavor: "A sudden, explosive forward thrust.",
        scalingStat: "strength",
        cost: 5, costType: "stamina", requiredLevel: 2, target: "aimed", baseDamageMultiplier: 1.0, cooldown: 3 
    },
    "shieldBash": {
        name: "Shield Bash",
        description: "Strike an enemy with your shield, {yellow:stunning them}. Scales with {green:Constitution}.",
        flavor: "A brutal, staggering blow with the flat of your shield.",
        scalingStat: "constitution",
        cost: 10, costType: "stamina", requiredLevel: 3, target: "aimed", baseDamageMultiplier: 0.5, cooldown: 5
    },
    "cleave": {
        name: "Cleave",
        description: "Strike the target and {red:enemies adjacent to it}. Scales with {red:Strength}.",
        flavor: "A wide, sweeping arc that cuts through multiple foes.",
        scalingStat: "strength",
        cost: 12, costType: "stamina", requiredLevel: 5, target: "aimed", baseDamageMultiplier: 0.8, cooldown: 4
    },
    "adrenaline": {
        name: "Adrenaline",
        description: "Instantly restore {yellow:10 Stamina}.",
        flavor: "You tap into your body's deepest reserves to keep fighting.",
        cost: 5, costType: "health", requiredLevel: 2, target: "self", cooldown: 10
    },
    "pacify": {
        name: "Pacify",
        description: "Attempt to calm a hostile target. Scales with {gold:Charisma}.",
        flavor: "A soothing word and a gentle gesture to end the hostility.",
        scalingStat: "charisma",
        cost: 10, costType: "psyche", requiredLevel: 3, target: "aimed", cooldown: 5 
    },
    "inflictMadness": {
        name: "Inflict Madness",
        description: "Assault a target's mind. Scales with {gold:Charisma}.",
        flavor: "You project terrifying visions into the mind of your enemy.",
        scalingStat: "charisma",
        cost: 12, costType: "psyche", requiredLevel: 5, target: "aimed", cooldown: 8 
    },
    "whirlwind": {
        name: "Whirlwind",
        description: "Strike {red:all adjacent enemies}. Scales with {red:Strength} and {green:Dexterity}.",
        flavor: "You become a deadly spinning vortex of steel.",
        scalingStat: "strength", 
        cost: 15, costType: "stamina", requiredLevel: 4, target: "self", cooldown: 6
    },
    "stealth": {
        name: "Stealth",
        description: "Become {gray:invisible} to enemies for 5 turns or until you attack.",
        flavor: "You blend seamlessly into the shadows.",
        cost: 10, costType: "stamina", requiredLevel: 3, target: "self", duration: 5, cooldown: 10
    },
    // --- WEAPON TECHNIQUES ---
    "crush": {
        name: "Crush",
        description: "A heavy blow that {yellow:stuns} the target. Scales with {red:Strength}. (Hammer/Club only)",
        flavor: "An overhead smash designed to break bones and shatter armor.",
        scalingStat: "strength",
        cost: 8, costType: "stamina", requiredLevel: 1, target: "aimed", baseDamageMultiplier: 1.2, cooldown: 6
    },
    "quickstep": {
        name: "Quickstep",
        description: "Dash {cyan:2 tiles} instantly. (Dagger only)",
        flavor: "A burst of speed so fast you seem to blur.",
        cost: 5, costType: "stamina", requiredLevel: 1, target: "aimed", cooldown: 4, type: "movement"
    },
    "deflect": {
        name: "Deflect",
        description: "Enter a defensive stance, {blue:reflecting the next attack}. (Sword only)",
        flavor: "A practiced parry that uses the enemy's momentum against them.",
        cost: 6, costType: "stamina", requiredLevel: 1, target: "self", duration: 2, cooldown: 5
    },
    "channel": {
        name: "Channel",
        description: "Focus your energy to restore {blue:Mana}. (Staff only)",
        flavor: "You draw raw magic from the leylines through your staff.",
        cost: 0, costType: "stamina", requiredLevel: 1, target: "self", cooldown: 10
    },
    "ranged_attack": {
        name: "Shoot",
        description: "Fire an arrow at a distant target. Scales with {green:Dexterity}.",
        flavor: "A steady breath, a drawn string, and a sudden release.",
        scalingStat: "dexterity",
        cost: 4, costType: "stamina", requiredLevel: 1, target: "aimed", baseDamageMultiplier: 1.0, cooldown: 0 
    }
};

// PERFORMANCE WIN: O(1) Data Compilation Loop
window.ENEMY_NAME_TO_ID = {};
for (const key in window.ENEMY_DATA) {
    if (window.ENEMY_DATA.hasOwnProperty(key)) {
        window.ENEMY_NAME_TO_ID[window.ENEMY_DATA[key].name] = key;
    }
}

// --- END OF FILE data-entities.js ---
