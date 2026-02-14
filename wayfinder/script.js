 // --- Game Configuration ---

 const GAME_VERSION = "v0.9.5"; // Bumped version
 const MAP_WIDTH = 40;  // WAS 25. Increased to fill horizontal space.
 const MAP_HEIGHT = 22; // WAS 15. Increased to see more vertically.
 const PLAYER_CHAR_VAL = '@';
 const EMPTY_SPACE_CHAR_VAL = '.';
 const STAR_CHAR_VAL = '*';
 const PLANET_CHAR_VAL = 'O';
 const STARBASE_CHAR_VAL = '#';
 const OUTPOST_CHAR_VAL = 'H';
 const ASTEROID_CHAR_VAL = '%';
 const NEBULA_CHAR_VAL = '~';
 const PIRATE_CHAR_VAL = 'X';
 const DERELICT_CHAR_VAL = 'D';
 const ANOMALY_CHAR_VAL = '?';
 const WORMHOLE_CHAR_VAL = 'W';
 const NEXUS_CHAR_VAL = '&';

 const DERELICT_SPAWN_CHANCE = 0.001; // VERY Rare (Was 0.002)

 const STAR_SPAWN_CHANCE = 0.0025; // Stars are distant points of light
 const ASTEROID_SPAWN_CHANCE = 0.00125; // Debris is uncommon
 const NEBULA_SPAWN_CHANCE = 0.05; // Nebulae are sparse
 const ASTEROID_BELT_CHANCE = 0.01; // Belts are rare hazards

 let MAX_FUEL;
 const INITIAL_CREDITS = 1000;
 let PLAYER_CARGO_CAPACITY;
 const BASE_FUEL_PER_MOVE = 0.8;
 let MAX_SHIELDS;
 let MAX_PLAYER_HULL;
 let playerHull;

 const HULL_REPAIR_COST_PER_POINT = 5;

 const BIOLOGICAL_RESOURCES = new Set(['GENETIC_SAMPLES', 'KTHARR_SPICES', 'FOOD_SUPPLIES', 'SENTIENT_MYCELIUM']);

 const PIRATE_ENCOUNTER_CHANCE = 0.0025;
 const RUN_ESCAPE_CHANCE = 0.6;
 const RUN_FUEL_COST = 5;
 const EVASION_FUEL_COST = 3;
 const EVASION_DODGE_BONUS = 0.35;
 const CHARGE_DAMAGE_MULTIPLIER = 1.5;
 const CHARGE_HIT_BONUS = 0.15;
 const HULL_DAMAGE_BONUS_MULTIPLIER = 1.25;

 let PLAYER_ATTACK_DAMAGE;
 let PLAYER_HIT_CHANCE;
 const PIRATE_BASE_SHIELDS_MIN = 15;
 const PIRATE_BASE_SHIELDS_MAX = 35;
 const PIRATE_BASE_HULL_MIN = 40;
 const PIRATE_BASE_HULL_MAX = 70;
 const PIRATE_ATTACK_DAMAGE_MIN = 5;
 const PIRATE_ATTACK_DAMAGE_MAX = 12;
 const PIRATE_HIT_CHANCE = 0.6;
 const PIRATE_CREDIT_REWARD_MIN = 20;
 const PIRATE_CREDIT_REWARD_MAX = 60;
 const XP_PER_PIRATE_MIN = 10;
 const XP_PER_PIRATE_MAX = 25;

 const MIN_SCOOP_YIELD = 10;
 const MAX_SCOOP_YIELD_RICHNESS_MULTIPLIER = 18;
 const SCOOP_RANDOM_BONUS = 4;

 const ANOMALY_SPAWN_CHANCE = 0.000125; // Extremely Rare

 const OUTPOST_SPAWN_CHANCE = 0.0002; // Civilization is hard to find

 const WORMHOLE_SPAWN_CHANCE = 0.0000075; // A true needle in a haystack
 const WORMHOLE_TRAVEL_FUEL_COST = 20;
 const WORMHOLE_JUMP_MIN_DIST = 5;
 const WORMHOLE_JUMP_MAX_DIST = 15;

 const BASE_XP_TO_LEVEL = 75;
 const XP_LEVEL_EXPONENT = 1.6;
 const XP_PER_NEW_SECTOR_DISCOVERY = 25;
 const XP_PER_FIRST_SCAN_TYPE = 5;
 const XP_PER_LOCATION_DISCOVERY = 10;
 const XP_PER_PROFIT_UNIT = 0.1;
 const XP_MYSTERY_REWARD = 200;
 const XP_WORMHOLE_TRAVERSE = 15;
 const XP_PER_MINING_OP = 3;
 const XP_BONUS_RARE_MINERAL = 5;
 const XP_MISSION_COMPLETION_BASE = 50;

 let sensorPulseActive = false;
 let sensorPulseRadius = 0;
 const MAX_PULSE_RADIUS = 150; // Pixels

 // --- PARTICLE SYSTEM GLOBALS ---
let activeParticles = [];
let lastParticleTime = 0;
let particleAnimationId = null;

/**
 * Spawns subtle particles at a specific world coordinate.
 * @param {number} x - World Grid X
 * @param {number} y - World Grid Y
 * @param {string} type - 'thruster', 'mining', 'explosion', 'gain'
 * @param {object} dir - Optional direction vector {x, y} for thrusters
 */
function spawnParticles(x, y, type, dir = { x: 0, y: 0 }) {
    let count = 0;
    let color = '#FFF';
    let speed = 0.1;
    let life = 1.0; // 1.0 = 100% opacity start

    // Center the particle on the tile
    const startX = x + 0.5;
    const startY = y + 0.5;

    switch (type) {
        case 'thruster':
            count = 3; 
            color = '#88CCFF'; // Cyan-ish engine glow
            speed = 0.05;
            break;
        case 'mining':
            count = 5;
            color = '#AAAAAA'; // Grey dust
            speed = 0.1;
            break;
        case 'explosion':
            count = 8;
            color = '#FF5555'; // Red sparks
            speed = 0.2;
            break;
        case 'gain':
            count = 6;
            color = '#FFFF00'; // Gold/Credit glint
            speed = 0.15;
            break;
    }

    for (let i = 0; i < count; i++) {
        // Random spread
        const angle = Math.random() * Math.PI * 2;
        let velX = Math.cos(angle) * speed * Math.random();
        let velY = Math.sin(angle) * speed * Math.random();

        // If thruster, push opposite to movement direction
        if (type === 'thruster') {
            velX = (dir.x * -0.1) + (Math.random() * 0.05 - 0.025);
            velY = (dir.y * -0.1) + (Math.random() * 0.05 - 0.025);
        }

        activeParticles.push({
            x: startX,
            y: startY,
            vx: velX,
            vy: velY,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03, // Fade speed
            color: color,
            size: Math.random() < 0.5 ? 2 : 1 // Minimalist pixels
        });
    }

    // Start the animation loop if it's not running
    if (!particleAnimationId) {
        animateParticles();
    }
}

function animateParticles() {
    if (activeParticles.length === 0 && !sensorPulseActive) {
        particleAnimationId = null;
        render(); // Final clean draw
        return;
    }

    // Update Particles
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            activeParticles.splice(i, 1);
        }
    }

    render(); // Redraw the screen
    particleAnimationId = requestAnimationFrame(animateParticles);
}

 // Notoriety Configuration
 const NOTORIETY_TITLES = [{
         score: -Infinity,
         title: "Enemy of the Concord"
     },
     {
         score: -200,
         title: "Wanted Outlaw"
     },
     {
         score: -50,
         title: "Troublemaker"
     },
     {
         score: 0,
         title: "Rookie Spacer"
     },
     {
         score: 50,
         title: "Known Freelancer"
     },
     {
         score: 200,
         title: "Respected Captain"
     },
     {
         score: 500,
         title: "Galactic Hero"
     }
 ];

 const PLANET_BIOMES = {
     BARREN_ROCK: {
         name: "Barren Rock",
         landable: true,
         description: "A lifeless rock, rich in common minerals.",
         resources: ['MINERALS'],
         image: 'assets/barren_rock.png'
     },
     ICE_GIANT: {
         name: "Ice Giant",
         landable: false,
         description: "A colossal ball of frozen gases.",
         resources: ['HYDROGEN_3'],
         image: 'assets/ice_giant.png'
     },
     VOLCANIC: {
         name: "Volcanic World",
         landable: true,
         description: "A molten hellscape, home to rare metals.",
         resources: ['RARE_METALS', 'PLATINUM_ORE'],
         image: 'assets/volcanic_world.png'
     },
     TERRAN: {
         name: "Terran World",
         landable: true,
         description: "An Earth-like world with liquid water.",
         resources: ['FOOD_SUPPLIES', 'GENETIC_SAMPLES'],
         image: 'assets/terran_world.png'
     },
     TOXIC: {
         name: "Toxic Jungle",
         landable: true,
         description: "A world teeming with aggressive, alien flora.",
         resources: ['GENETIC_SAMPLES', 'KTHARR_SPICES'],
         image: 'assets/toxic_jungle.png'
     },
     CRYSTAL: {
         name: "Crystalline Anomaly",
         landable: true,
         description: "A rare world composed of exotic crystals.",
         resources: ['VOID_CRYSTALS', 'PHASE_SHIFTED_ALLOY'],
         image: 'assets/crystal_anomaly.png'
     },
     GAS_GIANT: {
         name: "Gas Giant",
         landable: false,
         description: "A swirling mass of hydrogen and helium.",
         resources: ['HYDROGEN_3'],
         image: 'assets/gas_giant.png'
     }
 };

 // --- Ship Classes Database ---
 const SHIP_CLASSES = {
     LIGHT_FREIGHTER: {
         name: "Light Freighter",
         baseHull: 100,
         cargoCapacity: 50,
         baseCost: 0, // Starter ship
         description: "A reliable, jack-of-all-trades vessel. Not the fastest or the toughest, but she'll get you there.",
         loreKey: "LORE_SHIP_LIGHT_FREIGHTER"
     },
     INTERCEPTOR: {
         name: "Interceptor",
         baseHull: 75,
         cargoCapacity: 20,
         baseCost: 8000,
         description: "Built for speed and maneuverability. Sacrifices durability and cargo space for superior combat agility.",
         loreKey: "LORE_SHIP_INTERCEPTOR"
     },
     EXPLORER: {
         name: "Explorer",
         baseHull: 120,
         cargoCapacity: 40,
         baseCost: 10000,
         description: "A sturdy vessel with expanded fuel tanks and advanced sensor mounts, perfect for long-range voyages into the unknown.",
         loreKey: "LORE_SHIP_EXPLORER"
     },
     HEAVY_HAULER: {
         name: "Heavy Hauler",
         baseHull: 150,
         cargoCapacity: 120,
         baseCost: 15000,
         description: "A veritable fortress with massive cargo holds. What it lacks in grace, it makes up for in sheer capacity and resilience.",
         loreKey: "LORE_SHIP_HEAVY_HAULER"
     }
 };

 // --- Pirate Ship Classes Database ---
 const PIRATE_SHIP_CLASSES = {
     RAIDER: {
         name: "Raider",
         baseHull: 60,
         baseShields: 20,
         weight: 5 // <-- ADD THIS (Most common)
     },
     STRIKER: {
         name: "Striker",
         baseHull: 45,
         baseShields: 35,
         weight: 3 // <-- ADD THIS (Uncommon)
     },
     BRUISER: {
         name: "Bruiser",
         baseHull: 80,
         baseShields: 15,
         weight: 1 // <-- ADD THIS (Rare)
     }
 };

 // --- Ship Components Database ---
 const COMPONENTS_DATABASE = {
     WEAPON_PULSE_LASER_MK1: {
         name: "Pulse Laser Mk1",
         type: "weapon",
         slot: "weapon",
         description: "Standard issue civilian pulse laser. Reliable but low power.",
         cost: 0,
         stats: {
             damage: 8,
             hitChance: 0.70
         },
         loreKey: "LORE_COMP_PULSE_LASER"
     },
     WEAPON_PULSE_LASER_MK2: {
         name: "Pulse Laser Mk2",
         type: "weapon",
         slot: "weapon",
         description: "Upgraded pulse laser with improved focusing coils for higher damage.",
         cost: 2000,
         stats: {
             damage: 12,
             hitChance: 0.75
         },
         loreKey: "LORE_COMP_PULSE_LASER"
     },
     WEAPON_PULSE_LASER_MK3: {
         name: "Pulse Laser Mk3",
         type: "weapon",
         slot: "weapon",
         description: "Military-grade pulse laser. Significant damage output and better targeting.",
         cost: 5500,
         stats: {
             damage: 18,
             hitChance: 0.78
         },
         loreKey: "LORE_COMP_PULSE_LASER"
     },
     WEAPON_KINETIC_IMPULSOR_MK1: {
         name: "Kinetic Impulsor Mk1",
         type: "weapon",
         slot: "weapon",
         description: "Fires solid slugs. Decent against unshielded hulls.",
         cost: 1800,
         stats: {
             damage: 15,
             hitChance: 0.65
         },
         loreKey: "LORE_COMP_KINETIC_WEAPON"
     },
     WEAPON_ION_CANNON_MK1: {
         name: "Ion Cannon Mk1",
         type: "weapon",
         slot: "weapon",
         description: "Disrupts shields effectively, less hull damage.",
         cost: 2200,
         stats: {
             damage: 6,
             hitChance: 0.80,
             vsShieldBonus: 10
         },
         loreKey: "LORE_COMP_ION_WEAPON"
     },
     WEAPON_BEAM_LASER_MK1: {
         name: "Beam Laser Mk1",
         type: "weapon",
         slot: "weapon",
         description: "Sustained energy beam. High accuracy, consistent damage over time.",
         cost: 2800,
         stats: {
             damage: 10,
             hitChance: 0.85
         },
         loreKey: "LORE_COMP_BEAM_LASER"
     },
     WEAPON_MASS_DRIVER_MK1: {
         name: "Mass Driver Mk1",
         type: "weapon",
         slot: "weapon",
         description: "Accelerates a dense projectile to devastating speeds. High hull damage, slow fire rate.",
         cost: 3800,
         stats: {
             damage: 25,
             hitChance: 0.60
         },
         loreKey: "LORE_COMP_MASS_DRIVER"
     },
     WEAPON_MISSILE_LAUNCHER_MK1: {
         name: "Missile Launcher Mk1",
         type: "weapon",
         slot: "weapon",
         description: "Fires self-propelled explosive ordnance. High damage, limited ammo.",
         cost: 4500,
         stats: {
             damage: 30,
             hitChance: 0.60,
             maxAmmo: 5
         },
         loreKey: "LORE_COMP_MISSILE_LAUNCHER"
     },
     SHIELD_BASIC_ARRAY_A: {
         name: "Basic Deflector Array A",
         type: "shield",
         slot: "shield",
         description: "Entry-level shield generator. Offers minimal protection.",
         cost: 0,
         stats: {
             maxShields: 50,
             rechargeRate: 1
         },
         loreKey: "LORE_COMP_SHIELD_GENERATOR"
     },
     SHIELD_GUARDIAN_B: {
         name: "Guardian Shield Emitter B",
         type: "shield",
         slot: "shield",
         description: "Military surplus shield, offering better resilience and faster recharge.",
         cost: 2500,
         stats: {
             maxShields: 80,
             rechargeRate: 2
         },
         loreKey: "LORE_COMP_SHIELD_GENERATOR"
     },
     SHIELD_AEGIS_C: {
         name: "Aegis Shield Projector C",
         type: "shield",
         slot: "shield",
         description: "Top-tier Concord shield tech. Excellent protection and robust recharge.",
         cost: 5000,
         stats: {
             maxShields: 120,
             rechargeRate: 3
         },
         loreKey: "LORE_COMP_SHIELD_GENERATOR"
     },
     SHIELD_RAPID_CYCLE_A: {
         name: "Rapid-Cycle Unit A",
         type: "shield",
         slot: "shield",
         description: "Lower capacity, but regenerates very quickly. Favored by agile fighters.",
         cost: 3000,
         stats: {
             maxShields: 65,
             rechargeRate: 4
         },
         loreKey: "LORE_COMP_SHIELD_GENERATOR"
     },
     SHIELD_FORTRESS_GRID_A: {
         name: "Fortress Grid A",
         type: "shield",
         slot: "shield",
         description: "Extremely high capacity, but slow to regenerate. For ships that can take a beating.",
         cost: 4500,
         stats: {
             maxShields: 150,
             rechargeRate: 1
         },
         loreKey: "LORE_COMP_SHIELD_GENERATOR"
     },
     ENGINE_STD_DRIVE_MK1: {
         name: "Standard Drive Mk1",
         type: "engine",
         slot: "engine",
         description: "Common civilian stardrive. Gets you there, eventually.",
         cost: 0,
         stats: {
             maxFuel: 220,
             fuelEfficiency: 1.0
         },
         loreKey: "LORE_COMP_ENGINE"
     },
     ENGINE_RANGEPLUS_MK1: {
         name: "RangePlus Drive Mk1",
         type: "engine",
         slot: "engine",
         description: "Larger fuel tank for extended travel, slightly improved efficiency.",
         cost: 3000,
         stats: {
             maxFuel: 350,
             fuelEfficiency: 0.95
         },
         loreKey: "LORE_COMP_ENGINE"
     },
     ENGINE_IONFLOW_MK2: {
         name: "IonFlow Drive Mk2",
         type: "engine",
         slot: "engine",
         description: "Advanced ion engine, significantly better fuel efficiency.",
         cost: 4000,
         stats: {
             maxFuel: 275,
             fuelEfficiency: 0.75
         },
         loreKey: "LORE_COMP_ENGINE"
     },
     ENGINE_HIGH_THRUST_MK1: {
         name: "High-Thrust Drive Mk1",
         type: "engine",
         slot: "engine",
         description: "Powerful engine, standard fuel tank but hints at faster sublight travel (future).",
         cost: 3500,
         stats: {
             maxFuel: 210,
             fuelEfficiency: 1.15
         },
         loreKey: "LORE_COMP_ENGINE"
     },
     SCANNER_BASIC_SUITE: {
         name: "Standard Sensor Suite",
         type: "scanner",
         slot: "scanner",
         description: "Basic sensor package. Provides essential data.",
         cost: 0,
         stats: {
             scanBonus: 0
         },
         loreKey: "LORE_COMP_SCANNER"
     },
     SCANNER_DEEP_RANGE_A: {
         name: "Deep-Range Array A",
         type: "scanner",
         slot: "scanner",
         description: "Improved sensor resolution. May reveal more details or rarer finds.",
         cost: 1500,
         stats: {
             scanBonus: 0.05
         },
         loreKey: "LORE_COMP_SCANNER"
     }
 };

 const COMMODITIES = {
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
     }
 };
 const LOCATIONS_DATA = {
     "Starbase Alpha": {
         coords: {
             y: MAP_HEIGHT - 5,
             x: MAP_WIDTH - 7
         },
         type: STARBASE_CHAR_VAL,
         isMajorHub: true,
         faction: "CONCORD",
         sells: [{
             id: "FUEL_CELLS",
             priceMod: 0.9,
             stock: 100
         }, {
             id: "TECH_PARTS",
             priceMod: 1.1,
             stock: 30
         }, {
             id: "MEDICAL_SUPPLIES",
             priceMod: 1.0,
             stock: 25
         }, {
             id: "NAVIGATION_CHARTS",
             priceMod: 1.0,
             stock: 50
         }],
         buys: [{
                 id: "MINERALS",
                 priceMod: 1.2,
                 stock: 50
             }, {
                 id: "FOOD_SUPPLIES",
                 priceMod: 1.1,
                 stock: 50
             },
             {
                 id: "RARE_METALS",
                 priceMod: 1.3,
                 stock: 15
             }, {
                 id: "ARTIFACT_SHARDS",
                 priceMod: 1.5,
                 stock: 5
             },
             {
                 id: "XENO_ANTIQUES",
                 priceMod: 1.8,
                 stock: 2
             }, {
                 id: "PRECURSOR_DATACUBE",
                 priceMod: 2.5,
                 stock: 1
             },
             {
                 id: "VOID_CRYSTALS",
                 priceMod: 1.6,
                 stock: 3
             }, {
                 id: "GENETIC_SAMPLES",
                 priceMod: 1.4,
                 stock: 10
             },
             {
                 id: "FORBIDDEN_TEXTS",
                 priceMod: 0.7,
                 stock: 3
             }, {
                 id: "PHASE_SHIFTED_ALLOY",
                 priceMod: 3.0,
                 stock: 1
             },
             {
                 id: "WAYFINDER_CORE",
                 priceMod: 5.0,
                 stock: 1
             }, {
                 id: "SENTIENT_MYCELIUM",
                 priceMod: 1.2,
                 stock: 4
             },
             {
                 id: "PRECURSOR_STAR_MAP_FRAGMENT",
                 priceMod: 4.0,
                 stock: 1
             }, {
                 id: "KTHARR_ANCESTRAL_BLADE",
                 priceMod: 0.5,
                 stock: 1
             },
             {
                 id: "GOLD",
                 priceMod: 1.1,
                 stock: 30
             }, {
                 id: "PLATINUM_ORE",
                 priceMod: 1.2,
                 stock: 20
             }, {
                 id: "HYDROGEN_3",
                 priceMod: 2.0,
                 stock: 5
             }
         ],
         scanFlavor: "Starbase Alpha: Major Concord trade hub and administrative center for Sol Sector. Its Xeno-Archaeology department in the 'Scholar's Spire' pays top credit for Precursor Algorithm Keys. The Obsidian Directorate is always interested in... unique acquisitions, operating from the heavily shielded 'Black Site Annex'. The Oracle of Cygnus in the Mystic Quarter sometimes trades prophecies for rare xeno-artifacts, if you can find her hidden sanctum."
     },
     "Planet Omega": {
         coords: {
             y: 7,
             x: 7
         },
         type: PLANET_CHAR_VAL,
         faction: "CONCORD",
         sells: [{
             id: "MINERALS",
             priceMod: 0.8,
             stock: 200
         }, {
             id: "FOOD_SUPPLIES",
             priceMod: 0.9,
             stock: 100
         }],
         buys: [{
             id: "TECH_PARTS",
             priceMod: 1.3,
             stock: 10
         }, {
             id: "RARE_METALS",
             priceMod: 1.1,
             stock: 20
         }],
         scanFlavor: "Planet Omega: Rich Dilithium deposits. Significant Precursor ruins dot the landscape, some appearing as immense, silent geometric structures half-buried in the crimson sands; some whisper of a dormant 'World Engine' beneath the surface. Concord research outposts monitor unusual energy fluctuations, wary of what they call 'Silencer Echoes' – faint, high-frequency transmissions that seem to emanate from the deepest ruins."
     },
     "Planet Xerxes": {
         coords: {
             y: 3,
             x: MAP_WIDTH - 5
         },
         type: PLANET_CHAR_VAL,
         faction: "INDEPENDENT",
         sells: [],
         buys: [],
         scanFlavor: "Planet Xerxes: Extreme environment, corrosive atmosphere, and crushing gravity. High Xenon Gas and heavy metal concentrations make it valuable, but deadly. Rumored pirate haven and site of ancient K'tharr battles; some say the 'bad spirits' here are echoes of failed K'tharr rituals or a malfunctioning Precursor 'guardian' system that affects psionic minds, causing vivid hallucinations of metallic spiders."
     }
 };

 const RUMORS = [
     "Captain 'Voidfang' still plagues the Kepler Nebula. They say her ship, the 'Nightreaver', is faster than any Concord patrol, and she's looking for a legendary Precursor map that leads to the 'Silentium Expanse'. She supposedly has a K'tharr first mate, a disgraced warrior seeking redemption, who knows the old K'tharr star-paths. Some say she's already found a Precursor Star Map Fragment, and is seeking more to complete a 'Cosmic Sextant' that might point to the Precursor homeworld itself.",
     "That derelict capital ship in Gamma-7? Some say it's a 'Precursor' vessel, others claim it's a military ghost from the old Terran Wars, its AI still active and hostile. A few brave souls tried to board it... none returned. They say it 'sings' on subspace frequencies, a song of madness that lures ships to their doom. One survivor, driven mad, babbled about 'eyes in the dark' and a 'heart of void crystal' pulsing within the wreck.",
     "Young stars in the Orion Spur sectors often have asteroid belts rich in Iridium. Risky, but profitable. Watch for claim jumpers and the K'tharr mining guilds, who consider those belts sacred ground, burial sites of their ancestors. They guard them fiercely and are known to use phase-cloaked mines. They say some asteroids there are not asteroids at all, but dormant K'tharr bio-weapons or eggs of stellar creatures. One K'tharr elder was heard muttering about 'the waking of the Sky-Serpents' if the belts are disturbed too much.",
     "The K'tharr Hegemony is tightening its borders near the Serpentis Cluster. Fuel prices might spike if their trade routes are disrupted. They don't take kindly to outsiders, especially those carrying 'Forbidden Texts' or Precursor tech, which they deem 'unholy corruptions' that led to the Precursors' downfall. Their 'Void Priests' preach of a coming cleansing, and they're actively hunting for K'tharr Ancestral Blades stolen by 'infidels', believing each blade holds a piece of their collective soul and is needed for a ritual to 're-align the Sky-Gods'.",
     "The research team near the 'Whispering Anomaly' in Sector (-1, 4)? Vanished. Some say they found something they shouldn't have, something that... whispered back, promising power. Their last garbled transmission mentioned 'opening the way' to a 'realm of pure thought' and 'the entities beyond the veil of stars'. One crewman was found catatonic, clutching a Void Crystal, his mind shattered, muttering about 'star-songs' and 'the geometry of fear'.",
     "Starbase Alpha is offering bounties for information on pirate activity in the outer rim sectors. Concord's reach is long, but not infinite. They're particularly interested in any 'Voidfang' sightings and the location of her hidden base, rumored to be inside a hollowed-out asteroid cloaked with Precursor tech, possibly using Phase-Shifted Alloy. They also want any recovered K'tharr Honor Blades, no questions asked... well, few questions, and a hefty 'processing fee'. Rumor has it, the Obsidian Directorate wants the blades for more than just museum pieces.",
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
     "There's a black market for 'Precursor Navigational Cores' on some remote outposts. They say these cores can interface with ancient Precursor hyperlanes, allowing for instantaneous travel across vast distances... if you can survive the trip and the entities that guard those lanes. They are often found within Precursor Star Map Fragments, and are said to sing to those who can listen, a song that charts paths through the impossible."
 ];
 // --- Lore Database (EXPANDED) ---
 const LORE_DATABASE = {
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

 const chunkManager = {
     CHUNK_SIZE: 16,
     loadedChunks: {},
     staticLocations: new Map(),

     // --- Performance Optimization: Cache the last accessed chunk ---
     // This prevents thousands of string key generations/lookups per frame during rendering.
     lastChunkKey: null,
     lastChunkRef: null,

     initializeStaticLocations() {
         this.staticLocations.clear();
         for (const name in LOCATIONS_DATA) {
             const location = LOCATIONS_DATA[name];
             const key = `${location.coords.x},${location.coords.y}`;
             this.staticLocations.set(key, {
                 name,
                 ...location
             });
         }
     },

     generateChunk(chunkX, chunkY) {
         const chunkKey = `${chunkX},${chunkY}`;
         let chunkData = Array.from({
             length: this.CHUNK_SIZE
         }, () => Array(this.CHUNK_SIZE).fill(null));

         const representativeWorldX = chunkX * this.CHUNK_SIZE;
         const representativeWorldY = chunkY * this.CHUNK_SIZE;
         const sectorX = Math.floor(representativeWorldX / SECTOR_SIZE);
         const sectorY = Math.floor(representativeWorldY / SECTOR_SIZE);
         const sectorName = generateSectorName(sectorX, sectorY);

         let starChance = STAR_SPAWN_CHANCE;
         let asteroidChance = ASTEROID_SPAWN_CHANCE;
         let nebulaChance = 0.0; // Start at 0, only add in nebula sectors

         if (sectorName.includes("Belt") || sectorName.includes("Fields") || sectorName.includes("Reach")) {
             asteroidChance = ASTEROID_BELT_CHANCE;
         } else if (sectorName.includes("Nebula") || sectorName.includes("Veil") || sectorName.includes("Shroud")) {
             nebulaChance = NEBULA_SPAWN_CHANCE;
             starChance = STAR_SPAWN_CHANCE / 2;
         } else if (sectorName.includes("Badlands") || sectorName.includes("Peril") || sectorName.includes("Hazard")) {
             asteroidChance = 0.025;
         }

         for (let y = 0; y < this.CHUNK_SIZE; y++) {
             for (let x = 0; x < this.CHUNK_SIZE; x++) {
                 const worldX = chunkX * this.CHUNK_SIZE + x;
                 const worldY = chunkY * this.CHUNK_SIZE + y;
                 const locationKey = `${worldX},${worldY}`;

                 // NEW: SPAWN NEXUS ---
                 if (mystery_first_nexus_location && 
                     worldX === mystery_first_nexus_location.x && 
                     worldY === mystery_first_nexus_location.y) {
                     
                     chunkData[y][x] = {
                         char: NEXUS_CHAR_VAL,
                         type: 'nexus',
                         name: "The First Nexus",
                         activated: mystery_nexus_activated
                     };
                     continue; // Skip standard generation for this tile
                 }

                 if (this.staticLocations.has(locationKey)) {
                     const location = this.staticLocations.get(locationKey);
                     chunkData[y][x] = {
                         char: location.type,
                         type: 'location',
                         ...location
                     };
                 } else {
                     let tile = EMPTY_SPACE_CHAR_VAL;
                     const tileSeed = WORLD_SEED ^ (worldX * 73856093) ^ (worldY * 19349663);

                     if (seededRandom(tileSeed) < starChance) {
                         tile = {
                             char: STAR_CHAR_VAL,
                             type: 'star',
                             richness: seededRandom(tileSeed + 1),
                             scoopedThisVisit: false
                         };
                     } else if (seededRandom(tileSeed + 2) < asteroidChance) {
                         tile = {
                             char: ASTEROID_CHAR_VAL,
                             type: 'asteroid',
                             density: seededRandom(tileSeed + 3),
                             minedThisVisit: false
                         };
                     } else if (seededRandom(tileSeed + 4) < nebulaChance) {
                         tile = {
                             char: NEBULA_CHAR_VAL,
                             type: 'nebula'
                         };
                     } else if (seededRandom(tileSeed + 5) < WORMHOLE_SPAWN_CHANCE) {
                         tile = {
                             char: WORMHOLE_CHAR_VAL,
                             type: 'wormhole'
                         };
                     } else if (seededRandom(tileSeed + 6) < OUTPOST_SPAWN_CHANCE) {
                         const outpostSeed = tileSeed + 7;
                         const outpostName = `Outpost ${String.fromCharCode(65 + Math.floor(seededRandom(outpostSeed) * 26))}-${Math.floor(seededRandom(outpostSeed+1) * 999)}`;
                         tile = {
                             char: OUTPOST_CHAR_VAL,
                             type: 'location',
                             name: outpostName,
                             faction: "INDEPENDENT",
                             isMajorHub: false,
                             sells: [{
                                 id: "FUEL_CELLS",
                                 priceMod: 1.5,
                                 stock: 20 + Math.floor(seededRandom(outpostSeed + 2) * 30)
                             }, {
                                 id: "TECH_PARTS",
                                 priceMod: 1.3,
                                 stock: 5 + Math.floor(seededRandom(outpostSeed + 3) * 10)
                             }],
                             buys: [{
                                 id: "MINERALS",
                                 priceMod: 0.9,
                                 stock: 30 + Math.floor(seededRandom(outpostSeed + 4) * 50)
                             }, {
                                 id: "FOOD_SUPPLIES",
                                 priceMod: 0.8,
                                 stock: 20 + Math.floor(seededRandom(outpostSeed + 5) * 40)
                             }],
                             scanFlavor: "A small, automated independent outpost. It offers basic supplies at a markup and buys local resources."
                         };
                     } else if (seededRandom(tileSeed + 8) < ANOMALY_SPAWN_CHANCE) {
                         tile = {
                             char: ANOMALY_CHAR_VAL,
                             type: 'anomaly',
                             subtype: 'unstable warp pocket',
                             studied: false
                         };
                     } else if (seededRandom(tileSeed + 9) < DERELICT_SPAWN_CHANCE) {
                         tile = {
                             char: DERELICT_CHAR_VAL,
                             type: 'derelict',
                             studied: false
                         };
                     }
                    // Check if we have saved changes for this specific coordinate
                    const deltaKey = `${worldX},${worldY}`;
                    if (worldStateDeltas[deltaKey]) {
                        // Merge the saved flags (e.g., minedThisVisit) into the generated tile
                        Object.assign(tile, worldStateDeltas[deltaKey]);
                    }
                     chunkData[y][x] = tile;
                 }
             }
         }
         this.loadedChunks[chunkKey] = chunkData;
         return chunkData;
     },

     getTile(worldX, worldY) {
         const chunkX = Math.floor(worldX / this.CHUNK_SIZE);
         const chunkY = Math.floor(worldY / this.CHUNK_SIZE);
         const chunkKey = `${chunkX},${chunkY}`;

         // --- OPTIMIZATION START ---
         // 1. Check if the requested chunk is the same as the last one accessed.
         // This is extremely common during the render loop (reading 256 tiles in a row).
         if (this.lastChunkKey === chunkKey && this.lastChunkRef) {
             const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
             const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
             return this.lastChunkRef[localY][localX];
         }
         // --- OPTIMIZATION END ---

         // 2. If not in cache, perform standard lookup or generation
         const chunk = this.loadedChunks[chunkKey] || this.generateChunk(chunkX, chunkY);

         // 3. Update the cache for next time
         this.lastChunkKey = chunkKey;
         this.lastChunkRef = chunk;

         const localX = (worldX % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;
         const localY = (worldY % this.CHUNK_SIZE + this.CHUNK_SIZE) % this.CHUNK_SIZE;

         return chunk[localY][localX];
     }
 };

 // --- Global State Variables - Declare globally, instantiate in initializeGame ---

 let playerName = "Captain"; // Default name
 let playerPfp = "assets/pfp_01.png"; // Default profile picture

 const GAME_STATES = {
     TITLE_SCREEN: 'title_screen',
     GALACTIC_MAP: 'galactic_map',
     SYSTEM_MAP: 'system_map',
     PLANET_VIEW: 'planet_view',
     COMBAT: 'combat' // Add this new state
 };

 let currentGameState;

 let playerX, playerY, playerFuel, playerCredits, playerShields;
 let playerShip;
 let playerNotoriety;
 let playerNotorietyTitle;
 let playerIsChargingAttack;
 let playerIsEvading;

 let worldStateDeltas = {}; 

/**
 * Helper to update both the current loaded tile AND the saveable delta.
 * @param {number} x - World X coordinate
 * @param {number} y - World Y coordinate
 * @param {object} changes - Object containing flags to set (e.g. { minedThisVisit: true })
 */
function updateWorldState(x, y, changes) {
    // 1. Update the in-memory tile so the UI reacts immediately
    const tile = chunkManager.getTile(x, y);
    if (tile) {
        Object.assign(tile, changes);
    }

    // 2. Save to the persistent delta object
    const key = `${x},${y}`;
    if (!worldStateDeltas[key]) {
        worldStateDeltas[key] = {};
    }
    Object.assign(worldStateDeltas[key], changes);
}

 let playerLevel;
 let playerXP;
 let xpToNextLevel;

 let currentShipyardContext = null; // Add this with your other global state variables

 const SECTOR_SIZE = 480; // Let's say a sector is a 160x160 tile area.
 let currentSectorX, currentSectorY;

 let playerCargo = {};
 let currentCargoLoad = 0;

 const TILE_SIZE = 32;

 let gameCanvas, ctx; // For our new canvas

 const MAX_LOG_MESSAGES = 50; // The maximum number of messages to keep in the log
 let messageLog = []; // This array will hold our message history

 let currentTradeItemIndex = -1;
 let currentTradeQty = 1;

 let currentTradeContext = null;
 let currentCombatContext = null;
 let currentOutfitContext = null;
 let currentMissionContext = null;
 let playerActiveMission = null;
 let missionsAvailableAtStation = [];
 let MISSIONS_DATABASE = {};

 let scannedObjectTypes;
 let discoveredLocations;
 let playerCompletedMissions;


 let currentQuantityInput = "";

 let discoveredLoreEntries;
 let currentEncounterContext = null;

 // Mystery State

 let mystery_wayfinder_progress;
 let mystery_wayfinder_finalLocation;
 let mystery_first_nexus_location;
 let mystery_nexus_activated = false;

 const MYSTERY_WAYFINDER_TARGET_SECTOR_VOLATILITY = 5;
 const MYSTERY_WAYFINDER_ANOMALY_HINT_TYPE = 'unstable warp pocket';
 const MYSTERY_WAYFINDER_DERELICT_HINT_TYPE = 'Concord patrol craft';
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_X_MIN = -5;
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_X_MAX = -1;
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_Y_MIN = 1;
 const MYSTERY_WAYFINDER_DERELICT_SECTOR_QUADRANT_Y_MAX = 5;

 // --- Mission Data ---

 const MISSION_TEMPLATES = [{
         id_prefix: "BOUNTY_PIRATE_",
         type: "BOUNTY",
         weight: 4, // <-- ADD THIS
         title_template: "Pirate Cull in {sectorName}",
         briefing_template: "Concord Security is offering a bounty for pirate vessels in the {sectorName} sector.",
         description_template: "Increased pirate activity in the {sectorName} ({sectorCoords}) sector is disrupting trade. Eliminate {count} pirate threats to secure the area and claim your reward.",
         objective_templates: [{
             type: "ELIMINATE",
             targetName: "Pirate",
             count: [2, 4],
             targetSectorKey: "CURRENT"
         }],
         rewards_template: {
             credits: [250, 500],
             xp: [40, 75],
             notoriety: [3, 6]
         },
         prerequisites: {
             minLevel: 1
         }
     },
     {
         id_prefix: "DELIVERY_",
         type: "DELIVERY",
         weight: 4, // <-- ADD THIS
         title_template: "Urgent Delivery to {destinationName}",
         briefing_template: "{destinationName} requires an immediate shipment of {itemName}.",
         description_template: "A priority one request from {destinationName}. They need {count} units of {itemName} for critical operations. Deliver the goods and return here for payment.",
         objective_templates: [{
             type: "DELIVER",
             itemID: "ANY_LEGAL",
             count: [5, 15],
             destinationType: ["PLANET", "OUTPOST"]
         }],
         rewards_template: {
             credits: [150, 400],
             xp: [30, 60],
             notoriety: [1, 3]
         },
         prerequisites: {
             minLevel: 1
         }
     },
     {
         id_prefix: "SURVEY_ANOMALY_",
         type: "SURVEY",
         weight: 2, // <-- ADD THIS
         title_template: "Investigate {subtype} Anomaly",
         briefing_template: "Concord Science Division requires scan data on a nearby anomaly.",
         description_template: "We've detected a faint {subtype} signature. We need a ship on-site to perform a detailed scan. The anomaly could be anywhere, so keep your sensors active. Return here with the data.",
         objective_templates: [{
             type: "SCAN_OBJECT",
             targetType: "anomaly",
             subtype: "ANY_ANOMALY",
             sectorKey: "ANY"
         }],
         rewards_template: {
             credits: [200, 350],
             xp: [50, 80],
             notoriety: [1, 2]
         },
         prerequisites: {
             minLevel: 2
         }
     },
     {
         id_prefix: "ACQUIRE_RESOURCES_",
         type: "ACQUIRE", // New type
         weight: 1, // <-- ADD THIS
         title_template: "Resource Acquisition: {itemName}",
         briefing_template: "We need a contractor to acquire a shipment of {itemName}.",
         description_template: "Our operations require {count} units of {itemName}. We don't care where you get it - mine it, trade for it, or 'find' it. Just bring the specified amount back here for a generous reward.",
         objective_templates: [{
             type: "ACQUIRE",
             itemID: "ANY_RARE",
             count: [3, 8]
         }],
         rewards_template: {
             credits: [500, 1200],
             xp: [70, 150],
             notoriety: [2, 4]
         },
         prerequisites: {
             minLevel: 3
         }
     }
 ];

 // --- DOM Elements ---

 let gameMapElement;
 let messageAreaElement;
 let fuelStatElement;
 let creditsStatElement;
 let cargoStatElement;
 let shieldsStatElement;
 let hullStatElement;
 let sectorNameStatElement;
 let sectorCoordsStatElement;
 let levelXpStatElement;
 let shipClassStatElement;
 let notorietyStatElement;
 let codexOverlayElement;
 let codexCategoriesElement;
 let codexEntriesElement;
 let codexEntryTextElement;

 let saveButtonElement;
 let loadButtonElement;

 let stardateStatElement;

 function getTileChar(tile) {
     if (typeof tile === 'object' && tile !== null && tile.char) return tile.char;
     return tile;
 }

 function getTileType(tile) {
     if (typeof tile === 'object' && tile !== null && tile.type) return tile.type;
     return null;
 }

 function logMessage(newMessage, isImportant = false) {
     if (!newMessage || newMessage.trim() === "") {
         render();
         return;
     }

     // --- Mirror to Console ---
     // Strips HTML tags so the console log is readable
     const cleanText = newMessage.replace(/<[^>]*>?/gm, '');
     console.log(`[SD ${currentGameDate.toFixed(2)}] ${cleanText}`);

     // Format the stardate and prepend it to the message
     const timestamp = `<span class="log-datestamp">[SD ${currentGameDate.toFixed(2)}]</span>`;
     const messageWithTimestamp = `${timestamp}${newMessage}`;

     messageLog.unshift(messageWithTimestamp);

     if (messageLog.length > MAX_LOG_MESSAGES) {
         messageLog.pop();
     }

     render();
 }

 function renderContextualActions(actions) {
     const container = document.getElementById('contextual-actions');
     container.innerHTML = ''; // Clear old buttons
     if (!actions) return;

     actions.forEach(action => {
         const button = document.createElement('button');
         button.textContent = `${action.label} (${action.key.toUpperCase()})`;
         button.className = 'control-button';
         button.onclick = action.onclick;
         container.appendChild(button);
     });
 }

 /**
  * Initiates the state change to land on a selected planet.
  * @param {number} index - The index of the planet to land on.
  */
 function landOnPlanet(index) {
     if (currentGameState !== GAME_STATES.SYSTEM_MAP) return;

     selectedPlanetIndex = index;
     const planet = currentSystemData.planets[selectedPlanetIndex];

     if (!planet.biome.landable) {
         logMessage(`Cannot land on ${planet.biome.name}. Environment too hostile.`);
         return;
     }

     logMessage(`Initiating landing sequence for ${planet.biome.name}...`);
     changeGameState(GAME_STATES.PLANET_VIEW);
 }

 function returnToOrbit() {
     logMessage("Leaving planetary surface. Returning to orbit.");
     changeGameState(GAME_STATES.SYSTEM_MAP);
 }

 function calculateXpToNextLevel(level) {
     // Ensure XP requirement is at least 1 to prevent infinite loops
     const xp = Math.floor(BASE_XP_TO_LEVEL * Math.pow(level, XP_LEVEL_EXPONENT));
     return Math.max(1, xp);
 }


 function applyPlayerShipStats() {
     const shipClassData = SHIP_CLASSES[playerShip.shipClass];
     MAX_PLAYER_HULL = shipClassData.baseHull;
     PLAYER_CARGO_CAPACITY = shipClassData.cargoCapacity;

     const weapon = COMPONENTS_DATABASE[playerShip.components.weapon];
     const shield = COMPONENTS_DATABASE[playerShip.components.shield];
     const engine = COMPONENTS_DATABASE[playerShip.components.engine];

     PLAYER_ATTACK_DAMAGE = weapon.stats.damage;
     PLAYER_HIT_CHANCE = weapon.stats.hitChance;
     MAX_SHIELDS = shield.stats.maxShields;
     MAX_FUEL = engine.stats.maxFuel;

     if (playerHull > MAX_PLAYER_HULL) playerHull = MAX_PLAYER_HULL;
     if (playerShields > MAX_SHIELDS) playerShields = MAX_SHIELDS;
     if (playerFuel > MAX_FUEL) playerFuel = MAX_FUEL;
 }

 /**
  * A helper function to render just the shared UI stats.
  */

 function renderUIStats() {

    // 0. Update the System Menu Stats
    document.getElementById('menuLevel').textContent = playerLevel;
    document.getElementById('menuXP').textContent = Math.floor(playerXP) + " / " + xpToNextLevel;
    document.getElementById('menuShip').textContent = SHIP_CLASSES[playerShip.shipClass].name;
    document.getElementById('menuRep').textContent = playerNotorietyTitle;

     // 1. Calculate Percentages for Bars
     const fuelPct = Math.max(0, (playerFuel / MAX_FUEL) * 100);
     const shieldPct = Math.max(0, (playerShields / MAX_SHIELDS) * 100);
     const hullPct = Math.max(0, (playerHull / MAX_PLAYER_HULL) * 100);

     // 2. Update Bar Widths
     document.getElementById('fuelBar').style.width = `${fuelPct}%`;
     document.getElementById('shieldBar').style.width = `${shieldPct}%`;
     document.getElementById('hullBar').style.width = `${hullPct}%`;

     // 3. Update Text Values (Overlaying the bars)
     document.getElementById('fuelVal').textContent = Math.floor(playerFuel);
     document.getElementById('shieldVal').textContent = `${Math.floor(playerShields)}`;
     document.getElementById('hullVal').textContent = `${Math.floor(playerHull)}`;

     // 4. Update HUD Text Stats
     document.getElementById('creditsStat').textContent = playerCredits;
     document.getElementById('cargoStat').textContent = `${currentCargoLoad}/${PLAYER_CARGO_CAPACITY}`;
     
     // 5. Update Header Info
     const dist = Math.sqrt((playerX * playerX) + (playerY * playerY));
     let threatColor = "#00E0E0"; // Safe Cyan
     if (dist > 800) threatColor = "#FF4444"; 
     else if (dist > 400) threatColor = "#FFAA00";

     const sectorEl = document.getElementById('sectorNameStat');
     sectorEl.innerHTML = currentSectorName;
     sectorEl.style.color = threatColor;
     
     document.getElementById('sectorCoordsStat').textContent = `[${playerX}, ${playerY}]`;

     // 6. Log Handling
     messageAreaElement.innerHTML = messageLog.join('<br>');
     messageAreaElement.scrollTop = 0;
 }

 /**
  * Handles switching between different game views.
  * @param {string} newState - The state to switch to, from GAME_STATES.
  */

function changeGameState(newState) {
     // 1. Hide all main view containers
     document.getElementById('gameCanvas').style.display = 'none';
     document.getElementById('systemView').style.display = 'none';
     document.getElementById('planetView').style.display = 'none';
     document.getElementById('combatView').style.display = 'none';

     // 2. Show the correct container for the new state
     if (newState === GAME_STATES.GALACTIC_MAP) {
         document.getElementById('gameCanvas').style.display = 'block';
     } else if (newState === GAME_STATES.SYSTEM_MAP) {
         document.getElementById('systemView').style.display = 'block';
     } else if (newState === GAME_STATES.PLANET_VIEW) {
         document.getElementById('planetView').style.display = 'block';
     } else if (newState === GAME_STATES.COMBAT) {
         document.getElementById('combatView').style.display = 'flex';
     }

     // The new CSS handles scrolling for panels automatically.

     currentGameState = newState;
     render();
 }

 function renderPlanetView() {
     const planetView = document.getElementById('planetView');
     const planet = currentSystemData.planets[selectedPlanetIndex];

     // Logic checks for buttons
     const bioResources = planet.biome.resources.filter(r => BIOLOGICAL_RESOURCES.has(r));
     const mineralResources = planet.biome.resources.filter(r => !BIOLOGICAL_RESOURCES.has(r));

     const canMine = planet.biome.landable && mineralResources.length > 0;
     const mineButtonState = canMine ? '' : 'disabled';
     const mineLabel = canMine ? 'Mine Minerals' : 'No Minerals Detected';

     const canScan = planet.biome.landable && bioResources.length > 0;
     const scanButtonState = canScan ? '' : 'disabled';
     const scanLabel = canScan ? 'Scan Lifeforms' : 'No Bio-Signs';

     // Clean HTML Structure
     let html = `
        <div class="planet-view-content">
            <div class="planet-header">
                <img src="${planet.biome.image}" alt="${planet.biome.name}" class="planet-large-img">
                <h2 class="planet-title">${planet.biome.name}</h2>
                <p class="planet-desc">${planet.biome.description}</p>
            </div>

            <div style="width: 100%; text-align: left; margin-bottom: 10px; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 1px;">
                Ship Interface // Surface Ops
            </div>

            <div class="planet-actions-grid">
                <button class="action-button" onclick="minePlanet()" ${mineButtonState}>
                    ${mineLabel}
                </button>
                
                <button class="action-button" onclick="scanPlanetForLife()" ${scanButtonState}>
                    ${scanLabel}
                </button>
                
                <button class="action-button" disabled>
                    Establish Colony <br><span style="font-size:10px; opacity:0.7">(Coming Soon)</span>
                </button>
                
                <button class="action-button" disabled>
                    Geo-Survey <br><span style="font-size:10px; opacity:0.7">(Requires Drones)</span>
                </button>

                <button class="action-button full-width-btn" onclick="returnToOrbit()">
                    &lt;&lt; Return to Orbit
                </button>
            </div>
        </div>
    `;

     planetView.innerHTML = html;
     renderUIStats();
 }

 function updatePlayerNotoriety(amount) {
     playerNotoriety += amount;
     updateNotorietyTitle();
 }

 function updateNotorietyTitle() {
     let currentTitle = "Unknown"; // A default fallback
     // Loop backwards from the highest possible score to the lowest
     for (let i = NOTORIETY_TITLES.length - 1; i >= 0; i--) {
         // If the player's score is greater than or equal to the score for this title...
         if (playerNotoriety >= NOTORIETY_TITLES[i].score) {
             // ...we've found the correct title.
             currentTitle = NOTORIETY_TITLES[i].title;
             break; // Exit the loop immediately
         }
     }
     playerNotorietyTitle = currentTitle;
 }

 function unlockLoreEntry(entryKey) {
     if (LORE_DATABASE[entryKey] && !discoveredLoreEntries.has(entryKey)) {
         discoveredLoreEntries.add(entryKey);
         LORE_DATABASE[entryKey].unlocked = true;
         logMessage(`<span style='color:#A2D2FF;'>Codex Updated: ${LORE_DATABASE[entryKey].title}</span>`, true);
     }
 }

 let WORLD_SEED;
 let systemCache = {};
 let currentSystemData;
 let currentGameDate;

 let selectedPlanetIndex = -1;

 function renderCombatView() {
     if (!currentCombatContext) return;

     const combatView = document.getElementById('combatView');
     const weapon = COMPONENTS_DATABASE[playerShip.components.weapon];

     const isCharging = playerIsChargingAttack;
     const canEvade = playerFuel >= EVASION_FUEL_COST;
     const canRun = playerFuel >= RUN_FUEL_COST;

     const playerShieldPercent = (playerShields / MAX_SHIELDS) * 100;
     const playerHullPercent = (playerHull / MAX_PLAYER_HULL) * 100;
     const pirateShieldPercent = (currentCombatContext.pirateShields / currentCombatContext.pirateMaxShields) * 100;
     const pirateHullPercent = (currentCombatContext.pirateHull / currentCombatContext.pirateMaxHull) * 100;

     let html = `
        <div class="combat-header">! HOSTILE ENGAGEMENT !</div>

        <div class="combatants-wrapper">
            <!-- Player Panel -->
            <div class="combatant-panel">
                <h3><img src="${playerPfp}" alt="Player Avatar" class="combatant-icon">${playerName}</h3>
                <div class="ship-class-label">${SHIP_CLASSES[playerShip.shipClass].name}</div>

                <div class="stat-bar-label"><span>Shields</span><span>${playerShields} / ${MAX_SHIELDS}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill shield-bar-fill" style="width: ${playerShieldPercent}%;"></div></div>

                <div class="stat-bar-label"><span>Hull</span><span>${playerHull} / ${MAX_PLAYER_HULL}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill hull-bar-fill" style="width: ${playerHullPercent}%;"></div></div>
            </div>

            <!-- Pirate Panel -->
             <div class="combatant-panel">
                <h3><img src="assets/pirate.png" alt="Pirate Vessel" class="combatant-icon">Hostile Ship</h3>
                <div class="ship-class-label">${currentCombatContext.ship.name}</div>
                <div class="stat-bar-label"><span>Shields</span><span>${currentCombatContext.pirateShields} / ${currentCombatContext.pirateMaxShields}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill shield-bar-fill" style="width: ${pirateShieldPercent}%;"></div></div>
                
                <div class="stat-bar-label"><span>Hull</span><span>${Math.max(0, currentCombatContext.pirateHull)} / ${currentCombatContext.pirateMaxHull}</span></div>
                <div class="stat-bar"><div class="stat-bar-fill pirate-hull-bar-fill" style="width: ${pirateHullPercent}%;"></div></div>
            </div>
        </div>

        <!-- Player Actions -->
        <div class="combat-actions">
            <button class="combat-action-btn" onclick="handleCombatAction('fight')">Attack (${weapon.name})</button>
            <button class="combat-action-btn ${isCharging ? 'charge-active' : ''}" onclick="handleCombatAction('charge')" ${isCharging ? 'disabled' : ''}>Charge Weapon</button>
            <button class="combat-action-btn" onclick="handleCombatAction('evade')" ${!canEvade ? 'disabled' : ''}>Evade (${EVASION_FUEL_COST} Fuel)</button>
            <button class="combat-action-btn" onclick="handleCombatAction('run')" ${!canRun ? 'disabled' : ''}>Run (${RUN_FUEL_COST} Fuel)</button>
        </div>
    `;

     combatView.innerHTML = html;
     renderUIStats();
 }

 /**
  * Procedurally generates a unique and persistent star system based on its coordinates.
  * @param {number} starX - The world X coordinate of the star.
  * @param {number} starY - The world Y coordinate of the star.
  * @returns {object} The generated star system data.
  */
 function generateStarSystem(starX, starY) {
     const systemKey = `${starX},${starY}`;
     if (systemCache[systemKey]) {
         return systemCache[systemKey]; // Return from cache if we've already been here
     }

     const systemSeed = WORLD_SEED ^ (starX * 19349663) ^ (starY * 73856093);
     const biomeKeys = Object.keys(PLANET_BIOMES);

     const numPlanets = 2 + Math.floor(seededRandom(systemSeed) * 6); // 2 to 7 planets
     const planets = [];

     for (let i = 0; i < numPlanets; i++) {
         const planetSeed = systemSeed + i * 101; // Unique seed for each planet
         const biomeKey = biomeKeys[Math.floor(seededRandom(planetSeed) * biomeKeys.length)];

         planets.push({
             name: `Planet ${i + 1}`, // We can make procedural names later
             biome: PLANET_BIOMES[biomeKey],
             id: `${systemKey}-${i}`
         });
     }

     const systemData = {
         name: `${currentSectorName} System`,
         x: starX,
         y: starY,
         planets: planets
     };

     systemCache[systemKey] = systemData; // Save to cache
     return systemData;
 }

 function initializeGame() {
    // 1. Reset Game Logic Systems
    chunkManager.initializeStaticLocations();
    visitedSectors = new Set();
    scannedObjectTypes = new Set();
    discoveredLocations = new Set();
    playerCompletedMissions = new Set();
    sectorCache = {};
    playerCargo = {};
    Object.keys(COMMODITIES).forEach(id => playerCargo[id] = 0);
    discoveredLoreEntries = new Set();
    missionsAvailableAtStation = [];
    gameMapGrid = [];

    // 2. Refresh DOM Elements References
    messageAreaElement = document.getElementById('messageArea');
    fuelStatElement = document.getElementById('fuelStat');
    creditsStatElement = document.getElementById('creditsStat');
    cargoStatElement = document.getElementById('cargoStat');
    shieldsStatElement = document.getElementById('shieldsStat');
    hullStatElement = document.getElementById('hullStat');
    sectorNameStatElement = document.getElementById('sectorNameStat');
    sectorCoordsStatElement = document.getElementById('sectorCoordsStat');
    levelXpStatElement = document.getElementById('levelXpStat');
    shipClassStatElement = document.getElementById('shipClassStat');
    notorietyStatElement = document.getElementById('notorietyStat');
    codexOverlayElement = document.getElementById('codexOverlay');
    codexCategoriesElement = document.getElementById('codexCategories');
    codexEntriesElement = document.getElementById('codexEntries');
    codexEntryTextElement = document.getElementById('codexEntryText');
    stardateStatElement = document.getElementById('stardateStat');

    saveButtonElement = document.getElementById('saveButton');
    loadButtonElement = document.getElementById('loadButton');

    // 3. Reset Event Listeners (Duplicate protection)
    // We clone nodes to strip old listeners if this is a hard reset, 
    // or just re-assign if starting fresh. Simple re-add is fine here 
    // as long as we don't call initializeGame multiple times recursively.
    saveButtonElement.onclick = saveGame;
    loadButtonElement.onclick = loadGame;

    // --- PLAYER STATE RESET ---
    playerX = Math.floor(MAP_WIDTH / 2);
    playerY = Math.floor(MAP_HEIGHT / 2);

    currentSectorX = Math.floor(playerX / SECTOR_SIZE);
    currentSectorY = Math.floor(playerY / SECTOR_SIZE);
    currentSectorName = generateSectorName(currentSectorX, currentSectorY);

    playerShip = {
        shipClass: "LIGHT_FREIGHTER",
        components: {
            weapon: "WEAPON_PULSE_LASER_MK1",
            shield: "SHIELD_BASIC_ARRAY_A",
            engine: "ENGINE_STD_DRIVE_MK1",
            scanner: "SCANNER_BASIC_SUITE"
        },
        ammo: {}
    };

    const startingWeapon = COMPONENTS_DATABASE[playerShip.components.weapon];
    if (startingWeapon.stats.maxAmmo) {
        playerShip.ammo[playerShip.components.weapon] = startingWeapon.stats.maxAmmo;
    }

    applyPlayerShipStats();
    playerFuel = MAX_FUEL;
    playerCredits = INITIAL_CREDITS;
    playerHull = MAX_PLAYER_HULL;
    playerShields = MAX_SHIELDS;
    playerNotoriety = 0;

    updateNotorietyTitle();
    playerActiveMission = null;
    currentMissionContext = null;

    playerLevel = 1;
    playerXP = 0;
    xpToNextLevel = calculateXpToNextLevel(playerLevel);
    visitedSectors.add("0,0");
    currentGameDate = 2458.0;

    // Unlock Default Lore
    unlockLoreEntry("FACTION_CONCORD");
    unlockLoreEntry("XENO_PRECURSORS");
    unlockLoreEntry("MYSTERY_WAYFINDER_QUEST");
    unlockLoreEntry("REGION_SOL_SECTOR");

    Object.keys(COMPONENTS_DATABASE).forEach(key => {
        if (COMPONENTS_DATABASE[key].loreKey) unlockLoreEntry(COMPONENTS_DATABASE[key].loreKey);
    });
    Object.keys(SHIP_CLASSES).forEach(key => {
        if (SHIP_CLASSES[key].loreKey) unlockLoreEntry(SHIP_CLASSES[key].loreKey);
    });

    mystery_wayfinder_progress = 0;
    mystery_wayfinder_finalLocation = null;
    mystery_first_nexus_location = null;

    updateCurrentCargoLoad();

    // Clear all blocking UI contexts
    currentTradeContext = null;
    currentCombatContext = null;
    currentOutfitContext = null;
    currentEncounterContext = null;

    currentGameState = GAME_STATES.TITLE_SCREEN;
}

 /**
  * Processes the seed, logs initial messages, and fades out the title screen.
  * @param {string} seedString - The seed value from the input field.
  */
 
 function startGame(seedString) {

     playerName = document.getElementById('playerNameInput').value || "Captain";

     if (seedString && !isNaN(parseInt(seedString))) {
         WORLD_SEED = parseInt(seedString);
     } else if (seedString) {
         let hash = 0;
         for (let i = 0; i < seedString.length; i++) {
             const char = seedString.charCodeAt(i);
             hash = ((hash << 5) - hash) + char;
             hash |= 0;
         }
         WORLD_SEED = hash;
     } else {
         WORLD_SEED = Math.floor(Math.random() * 99999999);
     }

     // Hide the title screen
     const titleOverlay = document.getElementById('titleOverlay');
     titleOverlay.style.opacity = '0';
     setTimeout(() => {
         titleOverlay.style.display = 'none';
     }, 500); // Wait for fade-out to complete

     currentGameState = GAME_STATES.GALACTIC_MAP;

     // Log initial messages and render the game
     logMessage(`World Seed: ${WORLD_SEED}`);
     logMessage('Welcome, Wayfinder! Use WASD to move.');

     if (localStorage.getItem('wayfinderSaveData')) {
         logMessage("Save game found. Press (F7) or use Load button.");
     }

     // The new layout is visible by default behind the title screen.
 }

/**
 * Gathers all critical game state variables and saves them to localStorage.
 * optimized to use State Deltas instead of raw chunks to prevent storage overflow.
 */

function saveGame() {
    // 1. Construct the state object
    const gameState = {
        version: GAME_VERSION, // Save version to handle potential future updates

        // --- Core Player Stats ---
        playerX,
        playerY,
        playerFuel,
        playerCredits,
        playerShields,
        playerHull,
        playerNotoriety,
        playerLevel,
        playerXP,
        playerName,
        playerPfp,

        // --- Player Inventory & Ship ---
        playerShip,
        playerCargo,

        // --- World & Progress State ---
        WORLD_SEED,
        currentGameDate,
        playerActiveMission,
        
        // --- Story / Mystery Variables ---
        mystery_wayfinder_progress,
        mystery_wayfinder_finalLocation,
        mystery_first_nexus_location,
        mystery_nexus_activated,

        // --- CRITICAL FIX: The Delta State ---
        // We do NOT save chunkManager.loadedChunks (it is too big).
        // Instead, we save this object which contains only specific tile changes
        // (e.g., "Coordinate 50,50 is mined").
        worldStateDeltas: worldStateDeltas || {}, 

        // --- Data Structure Conversions ---
        // JSON cannot stringify JavaScript Sets, so we convert them to Arrays.
        visitedSectors: Array.from(visitedSectors),
        scannedObjectTypes: Array.from(scannedObjectTypes),
        discoveredLocations: Array.from(discoveredLocations),
        playerCompletedMissions: Array.from(playerCompletedMissions),
        discoveredLoreEntries: Array.from(discoveredLoreEntries)
    };

    // 2. Attempt to Write to Storage
    try {
        const saveString = JSON.stringify(gameState);
        localStorage.setItem('wayfinderSaveData', saveString);
        logMessage("Game Saved Successfully.");
        console.log("Game saved. Delta size:", Object.keys(gameState.worldStateDeltas).length, "changes.");
    } catch (error) {
        console.error("Error saving game:", error);
        
        // Specific error handling for Quota limits
        if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            logMessage("<span style='color:red'>Save Failed: Storage Full! Cleaning up old data...</span>");
            // Optional: You could try to perform emergency cleanup here if you had other keys
        } else {
            logMessage("<span style='color:red'>Save Failed: " + error.message + "</span>");
        }
    }
}

/**
 * Loads the game state from localStorage and applies it.
 * Refactored to support World State Deltas and prevent save file bloat.
 */
function loadGame() {
    const savedString = localStorage.getItem('wayfinderSaveData');
    
    // 1. Check if save exists
    if (!savedString) {
        logMessage("No saved game found.");
        return;
    }

    try {
        const savedState = JSON.parse(savedString);

        // --- Version Warning ---
        if (savedState.version !== GAME_VERSION) {
            console.warn(`Save file version (${savedState.version}) does not match game version (${GAME_VERSION}). Bugs may occur.`);
            logMessage(`<span style="color:orange">Warning: Save file is from v${savedState.version || '???'}. Some features may be unstable.</span>`);
        }

        // --- Restore Core Variables ---
        playerName = savedState.playerName || "Captain";
        playerPfp = savedState.playerPfp || "assets/pfp_01.png";
        
        // Coordinates & Stats
        playerX = savedState.playerX;
        playerY = savedState.playerY;
        playerFuel = savedState.playerFuel;
        playerCredits = savedState.playerCredits;
        playerShields = savedState.playerShields;
        playerHull = savedState.playerHull;
        playerNotoriety = savedState.playerNotoriety;
        playerLevel = savedState.playerLevel;
        playerXP = savedState.playerXP;

        // --- Restore World & Progress ---
        WORLD_SEED = savedState.WORLD_SEED;
        playerActiveMission = savedState.playerActiveMission;
        currentGameDate = savedState.currentGameDate;

        // Restore Mystery / Story Progress
        mystery_wayfinder_progress = savedState.mystery_wayfinder_progress;
        mystery_wayfinder_finalLocation = savedState.mystery_wayfinder_finalLocation;
        mystery_first_nexus_location = savedState.mystery_first_nexus_location;
        mystery_nexus_activated = savedState.mystery_nexus_activated;

        // --- Restore Inventory & Ship ---
        playerShip = savedState.playerShip;
        playerCargo = savedState.playerCargo;

        // --- Restore Sets (Converted from Arrays) ---
        visitedSectors = new Set(savedState.visitedSectors);
        scannedObjectTypes = new Set(savedState.scannedObjectTypes);
        discoveredLocations = new Set(savedState.discoveredLocations);
        playerCompletedMissions = new Set(savedState.playerCompletedMissions);
        discoveredLoreEntries = new Set(savedState.discoveredLoreEntries);

        // --- CRITICAL: Restore State Deltas & Reset Chunks ---
        // 1. Load the small list of changes (mined rocks, etc.)
        worldStateDeltas = savedState.worldStateDeltas || {}; 
        
        // 2. WIPE the chunk cache. 
        // This forces the game to re-generate the chunks using the WORLD_SEED 
        // plus the restored worldStateDeltas on the fly.
        chunkManager.loadedChunks = {}; 
        
        // 3. Reset the optimization cache to prevent "ghost" tiles from previous sessions
        chunkManager.lastChunkKey = null;
        chunkManager.lastChunkRef = null;

        // --- Recalculate Derived Stats ---
        currentSectorX = Math.floor(playerX / SECTOR_SIZE);
        currentSectorY = Math.floor(playerY / SECTOR_SIZE);
        currentSectorName = generateSectorName(currentSectorX, currentSectorY);

        applyPlayerShipStats();      // Updates MAX_HULL, CARGO_CAP, etc. based on equipped parts
        updateNotorietyTitle();      // Refreshes title based on score
        updateCurrentCargoLoad();    // Recalculates current weight
        xpToNextLevel = calculateXpToNextLevel(playerLevel);

        // --- UI Updates ---
        logMessage("Game Loaded Successfully.");
        logMessage(`Resuming flight in the ${currentSectorName} sector.`);
        
        // Reset specific contexts that might break if carried over
        currentTradeContext = null;
        currentCombatContext = null;
        currentOutfitContext = null;
        currentMissionContext = null;

        // Ensure we are on the main map
        changeGameState(GAME_STATES.GALACTIC_MAP);
        
        handleInteraction(); // Refresh the text description of your location
        renderMissionTracker(); // Update the sidebar mission text
        render(); // Force a full redraw

    } catch (error) {
        console.error("Error loading game:", error);
        logMessage(`<span style="color:red">Error: Failed to load save data. File may be corrupted. (${error.message})</span>`);
    }
}

 /**
  * A simple seeded random number generator.
  * Ensures that the same input 'seed' always produces the same output number.
  * @param {number} seed - The seed for the generator.
  * @returns {number} A pseudo-random number between 0 and 1.
  */
 function seededRandom(seed) {
     // A simple algorithm to create a predictable pseudo-random number.
     let x = Math.sin(seed++) * 10000;
     return x - Math.floor(x);
 }

 function renderMissionTracker() {
     const textEl = document.getElementById('missionText');
     
     if (!playerActiveMission) {
         textEl.textContent = "No Active Contract";
         textEl.style.color = "#555";
         return;
     }

     let objectiveText = "Objective Unknown";
     const objective = playerActiveMission.objectives[0];
     const progress = playerActiveMission.progress[`${objective.type.toLowerCase()}_0`];

     if (playerActiveMission.isComplete) {
         objectiveText = `Return to ${playerActiveMission.giver}`;
     } else if (objective.type === 'BOUNTY') {
         objectiveText = `Hunt Pirates (${progress.current}/${progress.required})`;
     } else if (objective.type === 'DELIVERY') {
         objectiveText = `Deliver to ${objective.destinationName}`;
     } else if (objective.type === 'SURVEY') {
         objectiveText = `Survey Anomaly`;
     } else if (objective.type === 'ACQUIRE') {
         // Fix for acquire missions display
         const currentAmt = playerCargo[objective.itemID] || 0;
         objectiveText = `Acquire ${COMMODITIES[objective.itemID].name} (${currentAmt}/${objective.count})`;
     }

     textEl.textContent = `${playerActiveMission.title}: ${objectiveText}`;
     textEl.style.color = "#FFD700";
 }

 /**
  * Generates a procedural and deterministic name for a sector based on its coordinates.
  * @param {number} sectorX - The x-coordinate of the sector.
  * @param {number} sectorY - The y-coordinate of the sector.
  * @returns {string} The generated name for the sector.
  */
 function generateSectorName(sectorX, sectorY) {
     if (sectorX === 0 && sectorY === 0) {
         return "Sol Sector"; // The starting sector should always be the same.
     }

     // Create a unique seed for this specific sector coordinate pair.
     const seed = WORLD_SEED + (sectorX * 10000) + sectorY;

     // Calculate the distance from the origin (0,0) to determine name "tier".
     const distance = Math.sqrt(sectorX * sectorX + sectorY * sectorY);

     let prefixPool, rootPool;

     if (distance < 10) { // Tier 1: Closer to home, more familiar names.
         prefixPool = SECTOR_NAME_PARTS.TIER1_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER1_ROOT;
     } else if (distance < 30) { // Tier 2: The frontier, more exotic names.
         prefixPool = SECTOR_NAME_PARTS.TIER2_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER2_ROOT;
     } else { // Tier 3: Deep, uncharted space, ancient and mysterious names.
         prefixPool = SECTOR_NAME_PARTS.TIER3_PREFIX;
         rootPool = SECTOR_NAME_PARTS.TIER3_ROOT;
     }

     // Use the seeded random number to pick a name part from the chosen pools.
     const prefix = prefixPool[Math.floor(seededRandom(seed) * prefixPool.length)];
     const root = rootPool[Math.floor(seededRandom(seed + 1) * rootPool.length)]; // Slightly change seed for variety

     return `${prefix} ${root}`;
 }


 const SECTOR_NAME_PARTS = {

     TIER1_PREFIX: ["Nova", "Kepler", "Orion", "Cygnus", "Lyra", "Terra", "Sol", "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega", "Centauri", "Proxima", "Sirius", "Vega", "Altair", "Regulus", "Spica", "Arcturus", "Capella", "Rigel", "Betelgeuse", "Aldebaran", "Pollux", "Castor", "Deneb", "Fomalhaut", "Antares", "Canopus"],
     TIER1_ROOT: ["Reach", "Spur", "Arm", "Belt", "Cluster", "Expanse", "Frontier", "Verge", "Fields", "Plains", "Depths", "Shallows", "Haven", "Port", "Gate", "Passage", "Crossing", "Junction", "Nexus", "Hub", "Core", "Heart", "Prime", "Minor", "Major", "Central", "Inner", "Outer", "Drift", "Currents", "Flow", "Stream", "Shoals", "Banks", "Flats", "Heights", "Ridge", "Valley", "Canyon", "Basin"],
     TIER2_PREFIX: ["Serpentis", "Draco", "Hydra", "Lupus", "Corvus", "Volans", "Crux", "Carina", "Vela", "Pictor", "Indus", "Pavo", "Tucana", "Grus", "Phoenix", "Horologium", "Reticulum", "Dorado", "Mensa", "Chamaeleon", "Apus", "Musca", "Circinus", "Triangulum", "Norma", "Ara", "Telescopium", "Corona", "Fornax", "Sculptor", "Caelum", "Eridanus", "Cetus", "Aquarius", "Capricornus", "Sagittarius", "Scorpius", "Libra", "Virgo", "Leo", "Cancer", "Gemini", "Taurus", "Aries", "Pisces", "Ophiuchus", "Lyra Minor", "Ursa Major", "Ursa Minor", "Canis Major", "Canis Minor", "Perseus", "Andromeda", "Cassiopeia", "Cepheus", "Lacerta", "Pegasus", "Delphinus", "Equuleus", "Aquila", "Sagitta", "Vulpecula", "Cygnus Minor"],
     TIER2_ROOT: ["Void", "Abyss", "Chasm", "Gulf", "Maelstrom", "Nebula", "Wastes", "Badlands", "Peril", "Hazard", "Brink", "Edge", "Terminus", "Limit", "Maw", "Jaws", "Teeth", "Claws", "Fangs", "Spines", "Thorns", "Barrens", "Wilds", "Expanse", "Deeps", "Shroud", "Veil", "Mist", "Gloom", "Shadow", "Dark", "Grim", "Bleak", "Despair", "Sorrow", "Fear", "Dread", "Terror", "Whispers", "Echoes", "Silence", "Stillness", "Emptiness"],
     TIER3_PREFIX: ["Xylos", "Zylos", "Varkos", "Kryll", "Ghor", "Thrax", "Zargon", "Vorlag", "Nyx", "Erebus", "Tartarus", "Styx", "Acheron", "Phlegethon", "Cocytus", "Lethe", "Hades", "Gehenna", "Sheol", "Abaddon", "Apollyon", "Azrael", "Thanatos", "Moros", "Ker", "Keres", "Yama", "Hel", "Niflheim", "Muspelheim", "Jotunheim", "Svartalfheim", "Yomi", "Kur", "Irkalla", "Duat", "Xibalba", "Mictlan", "Naraka", "Patala", "Annwn", "Tuonela", "Adlivun", "Ukhu Pacha", "Chinvat", "Hamistagan", "Pescha", "Arqa", "Diyu"],
     TIER3_ROOT: ["Oblivion", "Annihilation", "Desolation", "Ruin", "Terror", "Horror", "Madness", "Silence", "Emptiness", "Nothingness", "End", "Omega", "Ultima", "Finality", "Doom", "Blight", "Scourge", "Plague", "Curse", "Hex", "Bane", "Wrath", "Fury", "Storm", "Tempest", "Vortex", "Singularity", "Anomaly", "Paradox", "Enigma", "Labyrinth", "Maze", "Prison", "Tomb", "Crypt", "Sepulcher", "Citadel", "Fortress", "Bastion", "Stronghold", "Domain", "Realm", "Kingdom", "Empire", "Cataclysm", "Apocalypse", "Judgement", "Nadir", "Zero"]
 };

 function leaveSystem() {
    changeGameState(GAME_STATES.GALACTIC_MAP);
    selectedPlanetIndex = -1; // Deselect planets
    handleInteraction(); // Refresh the text log for the sector you are in
}

function renderSystemMap() {
     const systemView = document.getElementById('systemView');
     if (!currentSystemData) return;

     let html = `<h2>${currentSystemData.name}</h2>`;
     html += `<p style="color:#888; margin-bottom:20px;">System Coordinates: [${currentSystemData.x}, ${currentSystemData.y}]</p>`;
     
     // The Planet Grid
     html += '<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; align-items: stretch;">';

     currentSystemData.planets.forEach((planet, index) => {
         const borderStyle = (index === selectedPlanetIndex) ? '2px solid #00E0E0' : '1px solid #303060';
         const bgStyle = (index === selectedPlanetIndex) ? 'rgba(0, 224, 224, 0.1)' : 'rgba(0,0,0,0.5)';
         
         const landButtonHTML = planet.biome.landable ?
             `<button class="action-button" style="margin-top: 10px;" onclick="landOnPlanet(${index})">LAND</button>` :
             `<button class="action-button" disabled style="margin-top: 10px; border-color:#444; color:#666;">UNINHABITABLE</button>`;

         html += `
            <div onclick="selectPlanet(${index})" ondblclick="examinePlanet(${index})" 
                 style="border: ${borderStyle}; background: ${bgStyle}; padding: 15px; border-radius: 8px; text-align: center; flex: 1; min-width: 140px; max-width: 220px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s;">
                
                <div>
                    <div style="font-size: 14px; font-weight:bold; color: #8888AA; margin-bottom: 8px;">PLANET ${index + 1}</div>
                    <img src="${planet.biome.image}" alt="${planet.biome.name}" class="planet-icon-img">
                    <div style="font-weight: bold; color: #00E0E0; margin-top: 5px;">${planet.biome.name}</div>
                </div>
                ${landButtonHTML}
            </div>
        `;
     });
     html += '</div>';

     // --- Navigation Footer ---
     html += `
        <div style="margin-top: 40px; width: 100%; max-width: 400px; margin-left: auto; margin-right: auto;">
             <div style="text-align:center; margin-bottom:10px; font-size:12px; color:#666;">(Double-Click a planet to Scan)</div>
             
             <button class="action-button full-width-btn" onclick="leaveSystem()">
                &lt;&lt; ENGAGE HYPERDRIVE (LEAVE SYSTEM)
            </button>
        </div>
     `;

     systemView.innerHTML = html;
     renderUIStats();
 }

 function render() {
     switch (currentGameState) {
         case GAME_STATES.GALACTIC_MAP:
             renderGalacticMap();
             break;
         case GAME_STATES.SYSTEM_MAP:
             renderSystemMap();
             break;
         case GAME_STATES.PLANET_VIEW:
             renderPlanetView();
             break;
         case GAME_STATES.COMBAT:
             renderCombatView();
             break;
     }
 }

 /* Handles selecting a planet via a mouse click.
  * @param {number} index - The index of the planet that was clicked.
  */
 function selectPlanet(index) {
     if (currentGameState !== GAME_STATES.SYSTEM_MAP) return;
     selectedPlanetIndex = index;
     render(); // Re-render to show the new highlight.
 }

 /**
  * Handles examining a planet via a double-click.
  * @param {number} index - The index of the planet that was double-clicked.
  */

 function examinePlanet(index) {
     if (index < 0 || !currentSystemData || !currentSystemData.planets[index]) {
         logMessage("No target selected.");
         return;
     }
     if (currentGameState !== GAME_STATES.SYSTEM_MAP) return;

     // First, select the planet so the highlight appears correctly
     selectedPlanetIndex = index;

     // Now, perform the examine logic
     const planet = currentSystemData.planets[index];
     let scanReport = `Scan of Planet ${index + 1} (${planet.biome.name}):\n`;
     scanReport += `${planet.biome.description}\n`;
     scanReport += `Potential Resources: ${planet.biome.resources.join(', ')}`;

     // logMessage will call render() for us, which will update the screen.
     logMessage(scanReport);
 }

 function renderGalacticMap() {
    // --- 1. Calculate the camera/viewport position ---
    const viewportCenterX = Math.floor(MAP_WIDTH / 2);
    const viewportCenterY = Math.floor(MAP_HEIGHT / 2);
    const startX = playerX - viewportCenterX;
    const startY = playerY - viewportCenterY;

    // --- 2. Clear the canvas ---
    // Use clearRect to ensure transparency works if needed, then fill background
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Determine background based on sensor pulse (Subtle flash effect)
    if (sensorPulseActive) {
        const pulseIntensity = (1 - (sensorPulseRadius / MAX_PULSE_RADIUS)) * 0.2;
        ctx.fillStyle = `rgba(0, 40, 40, ${0.4 + pulseIntensity})`;
    } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    }
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // --- 3. Draw Tiles ---
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const mapX = startX + x;
            const mapY = startY + y;
            const tileData = chunkManager.getTile(mapX, mapY);
            const tileChar = getTileChar(tileData);

            switch (tileChar) {
                case STAR_CHAR_VAL: ctx.fillStyle = '#FFFF99'; break;
                case PLANET_CHAR_VAL: ctx.fillStyle = '#88CCFF'; break;
                case STARBASE_CHAR_VAL: ctx.fillStyle = '#FF88FF'; break;
                case OUTPOST_CHAR_VAL: ctx.fillStyle = '#AADD99'; break;
                case ASTEROID_CHAR_VAL: ctx.fillStyle = '#FFAA66'; break;
                case NEBULA_CHAR_VAL: ctx.fillStyle = '#DD99FF'; break;
                case DERELICT_CHAR_VAL: ctx.fillStyle = '#88AACC'; break;
                case ANOMALY_CHAR_VAL: ctx.fillStyle = '#FF33FF'; break;
                case WORMHOLE_CHAR_VAL: ctx.fillStyle = '#FFB800'; break;
                case NEXUS_CHAR_VAL: ctx.fillStyle = '#40E0D0'; break;
                case PIRATE_CHAR_VAL: ctx.fillStyle = '#FF5555'; break;
                case EMPTY_SPACE_CHAR_VAL:
                default:
                    ctx.fillStyle = '#909090';
                    break;
            }

            ctx.fillText(
                tileChar,
                x * TILE_SIZE + TILE_SIZE / 2,
                y * TILE_SIZE + TILE_SIZE / 2
            );
        }
    }

    // --- 4. Draw Sensor Pulse (Underlay) ---
    const playerScreenX = viewportCenterX * TILE_SIZE + TILE_SIZE / 2;
    const playerScreenY = viewportCenterY * TILE_SIZE + TILE_SIZE / 2;

    if (sensorPulseActive) {
        ctx.beginPath();
        ctx.arc(playerScreenX, playerScreenY - (TILE_SIZE/4), sensorPulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(0, 224, 224, ${1 - (sensorPulseRadius / MAX_PULSE_RADIUS)})`; 
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // --- 5. NEW: Draw Particles ---
    // We map World Coords -> Screen Coords dynamically
    activeParticles.forEach(p => {
        // Calculate screen position relative to camera
        const screenX = (p.x - startX) * TILE_SIZE;
        const screenY = (p.y - startY) * TILE_SIZE;

        // Only draw if within bounds (simple optimization)
        if (screenX >= -TILE_SIZE && screenX <= gameCanvas.width + TILE_SIZE &&
            screenY >= -TILE_SIZE && screenY <= gameCanvas.height + TILE_SIZE) {
            
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life; // Fade out
            ctx.fillRect(screenX, screenY, p.size, p.size); // Tiny square
            ctx.globalAlpha = 1.0; // Reset alpha
        }
    });

    // --- 6. Draw the Player ---
    if (currentCombatContext) {
        ctx.fillStyle = '#FF5555';
        ctx.fillText(PIRATE_CHAR_VAL, playerScreenX, playerScreenY);
    } else {
        ctx.fillStyle = '#FFFFFF'; 
        ctx.fillText(PLAYER_CHAR_VAL, playerScreenX, playerScreenY);
    }

    // --- 7. Update UI ---
    sectorNameStatElement.innerHTML = currentSectorName; 
    
    // Threat level logic
    const dist = Math.sqrt((playerX * playerX) + (playerY * playerY));
    let threat = "SAFE";
    let color = "#00FF00"; 
    if (dist > 800) { threat = "DEADLY"; color = "#FF0000"; } 
    else if (dist > 400) { threat = "HIGH"; color = "#FF5555"; } 
    else if (dist > 150) { threat = "MODERATE"; color = "#FFFF00"; } 
    
    sectorNameStatElement.innerHTML = `${currentSectorName} <span style="color:${color}; font-size: 0.8em; margin-left: 8px;">[${threat}]</span>`;
    sectorCoordsStatElement.textContent = `(${playerX},${playerY})`;
    document.getElementById('versionInfo').textContent = `Wayfinder: Echoes of the Void - ${GAME_VERSION}`;

    renderUIStats();
}

 let currentSectorName = "Sol Sector"; // Changed to let

 function updateCurrentCargoLoad() {
     /* Same as v0.6.7 */
     currentCargoLoad = 0;
     for (const cID in playerCargo) currentCargoLoad += playerCargo[cID];
 }

 function triggerSensorPulse() {
     if (sensorPulseActive) return; // Prevent spamming
     sensorPulseActive = true;
     sensorPulseRadius = 0;

     function animatePulse() {
         if (!sensorPulseActive) return;

         // Stop animating if we switch views (e.g. to Codex or Combat)
         if (currentGameState !== GAME_STATES.GALACTIC_MAP) {
             sensorPulseActive = false;
             return;
         }

         sensorPulseRadius += 5; // Speed of the pulse

         if (sensorPulseRadius >= MAX_PULSE_RADIUS) {
             sensorPulseActive = false;
             render(); // Final clear
         } else {
             render(); // Redraw frame
             requestAnimationFrame(animatePulse);
         }
     }
     animatePulse();
 }

 /**
  * Selects a random outcome from a list of weighted outcomes.
  * Each outcome object must have a 'weight' property (number).
  * @param {Array<object>} outcomes - The array of weighted outcome objects.
  * @returns {object} The chosen outcome.
  */

 function getWeightedRandomOutcome(outcomes) {
     const totalWeight = outcomes.reduce((sum, o) => sum + (o.weight || 1), 0);
     let random = Math.random() * totalWeight;

     for (const outcome of outcomes) {
         const weight = outcome.weight || 1; // Default to 1 if no weight is given
         if (random < weight) {
             return outcome;
         }
         random -= weight;
     }
     // Fallback in case of rounding errors
     return outcomes[outcomes.length - 1];
 }

 function getCombinedLocationData(y, x) {
     // Get the tile data from the chunk manager at the player's coordinates
     const tileObject = chunkManager.getTile(x, y);

     // Check if the tile is a location type (starbase, planet, etc.)
     if (tileObject && tileObject.type === 'location') {
         return tileObject; // Return the location data object
     }

     // If it's not a location, return null
     return null;
 }

 function traverseWormhole() {
     // 1. Check if player has enough fuel
     if (playerFuel < WORMHOLE_TRAVEL_FUEL_COST) {
         logMessage(`Cannot traverse: Requires ${WORMHOLE_TRAVEL_FUEL_COST} fuel, you have ${playerFuel.toFixed(1)}.`);
         return;
     }

     // 2. Deduct Fuel
     playerFuel -= WORMHOLE_TRAVEL_FUEL_COST;
     playerFuel = parseFloat(playerFuel.toFixed(1));

     // 3. Calculate a massive jump across the universe
     // We multiply by 100 to ensure we jump many sectors away
     let jumpX = (WORMHOLE_JUMP_MIN_DIST + Math.random() * (WORMHOLE_JUMP_MAX_DIST - WORMHOLE_JUMP_MIN_DIST)) * 100;
     let jumpY = (WORMHOLE_JUMP_MIN_DIST + Math.random() * (WORMHOLE_JUMP_MAX_DIST - WORMHOLE_JUMP_MIN_DIST)) * 100;

     // Randomize direction (positive or negative coordinates)
     if (Math.random() < 0.5) jumpX *= -1;
     if (Math.random() < 0.5) jumpY *= -1;

     // 4. Update Player Coordinates
     playerX += Math.floor(jumpX);
     playerY += Math.floor(jumpY);

     // 5. Update Sector State (Critical Fix for Desync)
     // This ensures the UI immediately reflects the new sector name and coordinates
     updateSectorState();

     // 6. Grant XP and Unlock Lore
     playerXP += XP_WORMHOLE_TRAVERSE;
     unlockLoreEntry("PHENOMENON_WORMHOLE");

     // 7. Log the Event
     let warpMessage = `The wormhole violently ejects you into an unknown region of deep space!`;
     warpMessage += `\n<span style='color:#00DD00;'>Wormhole Traversed! +${XP_WORMHOLE_TRAVERSE} XP!</span>`;
     logMessage(warpMessage);

     // 8. Handle Post-Jump State
     checkLevelUp(); // Check if the XP gain caused a level up
     handleInteraction(); // Describe what is at the new location immediately
 }

 function movePlayer(dx, dy) {
     // 1. Check for blocking UI states
     if (currentTradeContext || currentOutfitContext || currentMissionContext || currentEncounterContext || currentShipyardContext) {
         logMessage("Complete current action first.");
         return;
     }

     // 2. Check for Combat
     if (currentCombatContext) {
         logMessage("In combat! (F)ight or (R)un.");
         return;
     }

     // 3. Calculate Fuel Cost
     const currentEngine = COMPONENTS_DATABASE[playerShip.components.engine];
     const actualFuelPerMove = BASE_FUEL_PER_MOVE * (currentEngine.stats.fuelEfficiency || 1.0);

     // 4. Check Fuel Availability
     if (playerFuel < actualFuelPerMove && (dx !== 0 || dy !== 0)) {
         logMessage("<span style='color:red'>CRITICAL: OUT OF FUEL!</span>");
         logMessage("Drifting in void. Press 'Z' to activate Distress Beacon.");
         return;
     }

     // 5. Update Player Coordinates
     playerX += dx;
     playerY += dy;

     // 6. Deduct Fuel and Advance Time
    if (dx !== 0 || dy !== 0) {
        playerFuel -= actualFuelPerMove;
        playerFuel = parseFloat(playerFuel.toFixed(1)); 
        if (playerFuel < 0) playerFuel = 0;
        advanceGameTime(0.01);

        // --- Thruster Particles ---
        // We spawn them at the OLD position (approx) pushing backwards
        spawnParticles(playerX - dx, playerY - dy, 'thruster', { x: dx, y: dy });
    }

     // 7. Update Sector Information
     updateSectorState();

     // 8. Handle Random Events (Pirates OR Goodies OR Normal)
     const encounterRoll = Math.random();

     if (encounterRoll < PIRATE_ENCOUNTER_CHANCE) {
         // Bad Luck: Pirate
         startCombat();
     } else if (encounterRoll < PIRATE_ENCOUNTER_CHANCE + 0.015) {
         // Good Luck: 1.5% Chance for Space Debris
         triggerRandomEvent();
     } else {
         // Normal: Just look at the tile
         handleInteraction();
     }
 }

 function handleInteraction() {
     const tileObject = chunkManager.getTile(playerX, playerY);
     const tileChar = getTileChar(tileObject);
     let bM = ""; // This is our base message for the text log
     let availableActions = []; // This new array will hold our button actions

     if (tileObject && tileObject.type === 'location') {
         const location = tileObject;
         bM = `Arrived at ${location.name}.`;

         if ((location.sells && location.sells.length > 0) || (location.buys && location.buys.length > 0)) {
             availableActions.push({
                 label: 'Buy',
                 key: 'b',
                 onclick: () => displayTradeScreen('buy')
             });
             availableActions.push({
                 label: 'Sell',
                 key: 's',
                 onclick: () => displayTradeScreen('sell')
             });
         }
         if (location.isMajorHub) {
             availableActions.push({
                 label: 'Outfit',
                 key: 'o',
                 onclick: displayOutfittingScreen
             });
             availableActions.push({
                 label: 'Missions',
                 key: 'k',
                 onclick: displayMissionBoard
             });
             availableActions.push({
                 label: 'Shipyard',
                 key: 'y',
                 onclick: displayShipyard
             });
         }

         if (playerHull < MAX_PLAYER_HULL) {
             const hullToRepair = MAX_PLAYER_HULL - playerHull;
             const repairCost = hullToRepair * HULL_REPAIR_COST_PER_POINT;
             availableActions.push({
                 label: `Repair Hull (${repairCost}c)`,
                 key: 'r', // 'r' for repair
                 onclick: repairShip
             });
         }

         if (playerActiveMission && playerActiveMission.type === "DELIVERY" && !playerActiveMission.isComplete && location.name === playerActiveMission.objectives[0].destinationName) {
             availableActions.push({
                 label: 'Complete Delivery',
                 key: 'c',
                 onclick: handleCompleteDelivery
             });
         }
         if (playerActiveMission && playerActiveMission.isComplete && location.name === playerActiveMission.giver) {
             availableActions.push({
                 label: 'Get Reward',
                 key: 'g',
                 onclick: grantMissionRewards
             });
         }

         if (playerActiveMission && playerActiveMission.type === "ACQUIRE" && !playerActiveMission.isComplete && location.name === playerActiveMission.giver) {
             availableActions.push({
                 label: 'Turn in Resources',
                 key: 'g',
                 onclick: handleTurnInAcquire
             });
         }

         if (location.type === STARBASE_CHAR_VAL || location.type === OUTPOST_CHAR_VAL) {
             playerFuel = MAX_FUEL;
             playerShields = MAX_SHIELDS;
             bM += `\nFuel and Shields recharged.`;
             applyPlayerShipStats();
         }
         if (!discoveredLocations.has(location.name)) {
             discoveredLocations.add(location.name);
             playerXP += XP_PER_LOCATION_DISCOVERY;
             bM += `\n<span style='color:#00FF00;'>Location Discovered: ${location.name}! +${XP_PER_LOCATION_DISCOVERY} XP!</span>`;
             unlockLoreEntry(`LOCATION_${location.name.replace(/\s+/g, '_').toUpperCase()}`);
             checkLevelUp();
         }

     } else {
         switch (tileChar) {
             case STAR_CHAR_VAL:
                 bM = `Near star.`;
                 availableActions.push({
                     label: 'Enter System',
                     key: 'e',
                     onclick: () => {
                         currentSystemData = generateStarSystem(playerX, playerY);
                         changeGameState(GAME_STATES.SYSTEM_MAP);
                     }
                 });
                 availableActions.push({
                     label: 'Scoop Fuel',
                     key: 'h',
                     onclick: scoopHydrogen
                 });
                 unlockLoreEntry("PHENOMENON_STAR");
                 break;
            case NEXUS_CHAR_VAL:
                 bM = "You are hovering before a colossus of shifting geometry. The First Nexus.";
                 if (mystery_nexus_activated) {
                     bM += "\nIt pulses with a silent, rhythmic light. It knows you are here.";
                 } else {
                     bM += "\nIt is dormant, but the Wayfinder Core in your hold is vibrating in unison.";
                 }
                 availableActions.push({
                     label: 'Commune',
                     key: 'x', // 'x' for Xeno/Nexus
                     onclick: handleNexusEncounter
                 });
                 unlockLoreEntry("MYSTERY_FIRST_NEXUS");
                 break;
             case ASTEROID_CHAR_VAL:
                 bM = `Asteroid field.`;
                 availableActions.push({
                     label: 'Mine',
                     key: 'm',
                     onclick: mineAsteroid
                 });
                 unlockLoreEntry("PHENOMENON_ASTEROID");
                 break;
             case NEBULA_CHAR_VAL:
                 bM = `Inside a dense gas cloud. Sensors are intermittent.`;
                 availableActions.push({
                     label: 'Scoop Fuel',
                     key: 'h',
                     onclick: scoopHydrogen
                 });
                 unlockLoreEntry("PHENOMENON_NEBULA");
                 break;
             case WORMHOLE_CHAR_VAL:
                 bM = `Near a swirling vortex in spacetime.`;
                 availableActions.push({
                     label: 'Traverse',
                     key: 't',
                     onclick: traverseWormhole
                 });
                 unlockLoreEntry("PHENOMENON_WORMHOLE");
                 break;
             case ANOMALY_CHAR_VAL:
                 bM = `You've entered the unstable anomaly!`;
                 if (tileObject.studied) {
                     bM = "This anomaly has dissipated.";
                 } else {
                     handleAnomalyEncounter(tileObject); // This stays
                 }
                 unlockLoreEntry("XENO_ANOMALIES");
                 break;
             case DERELICT_CHAR_VAL:
                 // --- NEW DERELICT INTERACTION ---
                 bM = "You approach the dark hull of the derelict ship..."; // Base message
                 if (tileObject.studied) {
                     bM = "You drift past the salvaged wreck.";
                 } else {
                     handleDerelictEncounter(tileObject); // Trigger the encounter!
                 }
                 unlockLoreEntry("XENO_DERELICTS"); // Also unlock the codex entry
                 break;
         }
     }

     logMessage(bM);
     renderContextualActions(availableActions);
 }

 function handleNexusEncounter() {
     // Check if we have the key
     if (!playerCargo.WAYFINDER_CORE && !mystery_nexus_activated) {
         logMessage("The Nexus is silent. You feel you lack the 'key' to wake it.");
         return;
     }

     if (mystery_nexus_activated) {
         logMessage("The Nexus whispers to you... 'Wait for the Cycle to turn.' (Content TBD in v1.0)");
         return;
     }

     // ACTIVATE THE NEXUS
     mystery_nexus_activated = true;
     playerXP += 5000; // Massive XP boost
     playerCredits += 50000; // Massive Wealth
     
     // Update the world tile to reflect activation
     updateWorldState(playerX, playerY, { activated: true });

     // FX
     spawnParticles(playerX, playerY, 'explosion'); 
     setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 500);

     let msg = "<span style='color:#40E0D0'>THE NEXUS AWAKENS.</span>\n";
     msg += "A beam of pure information blasts into your mind. You see the birth of stars, the death of galaxies, and the path of the Precursors.\n";
     msg += "Your ship's computer is flooded with ancient data algorithms.\n";
     msg += "\n<span style='color:#FFD700'>REWARD: +5000 XP, +50,000 Credits.</span>";
     msg += "\n(You have reached the current end of the story content.)";

     logMessage(msg);
     checkLevelUp();
 }

 function scanLocation() {
     if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
         logMessage("Cannot scan now.");
         return;
     }

     advanceGameTime(0.05); // Use new time function

     const scanner = COMPONENTS_DATABASE[playerShip.components.scanner];
     const scanBonus = scanner.stats.scanBonus || 0;

     const tileObject = chunkManager.getTile(playerX, playerY);
     let scanMessage = `Scan Report:\nPlayer Shields: ${Math.floor(playerShields)}/${MAX_SHIELDS}. Hull: ${Math.floor(playerHull)}/${MAX_PLAYER_HULL}.\n`;
     let objectTypeForXP = getTileType(tileObject) || getTileChar(tileObject);
     let actionsAvailable = "";

     if (tileObject && tileObject.type === 'location') {
         scanMessage += `\n<span style='color:#FF88FF;'>Location: ${tileObject.name} (${tileObject.faction})</span>\n`;
         scanMessage += `Description: ${tileObject.scanFlavor || 'No detailed scan data available.'}`;
         if ((tileObject.sells && tileObject.sells.length > 0) || (tileObject.buys && tileObject.buys.length > 0)) {
             actionsAvailable += "Trade (B/S). ";
         }
         if (tileObject.isMajorHub) {
             actionsAvailable += "Outfit (O). Missions (K). Shipyard (Y). ";
         }
         if (playerHull < MAX_PLAYER_HULL) {
             actionsAvailable += "Repair (R). ";
         }
         actionsAvailable += "Leave (L)."
         objectTypeForXP = tileObject.name;

     } else {
         const tileChar = getTileChar(tileObject);
         switch (tileChar) {
             case EMPTY_SPACE_CHAR_VAL:
                 scanMessage += "Vast emptiness. Faint cosmic background radiation.";
                 if (scanBonus > 0 && Math.random() < (scanBonus * 2)) {
                     scanMessage += "\n<span style='color:#FFFF99;'>Detailed Scan: Trace signature detected... faint energy echo... probably nothing.</span>";
                 }
                 objectTypeForXP = 'empty_space';
                 break;
             case STAR_CHAR_VAL:
                 scanMessage += `Brilliant star.`;
                 if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Corona richness at ${(tileObject.richness * 100).toFixed(0)}%.</span>`;
                 } else if (tileObject.richness > 0.75) {
                     scanMessage += "\n<span style='color:#FFFF99;'>High hydrogen concentrations detected!</span>";
                 }
                 if (tileObject.scoopedThisVisit) scanMessage += "\n<span style='color:#999999;'>Corona appears depleted.</span>";
                 actionsAvailable += "Scoop Fuel (H). Enter System (E).";
                 break;
             case ASTEROID_CHAR_VAL:
                 scanMessage += `Asteroid field.`;
                 if (scanBonus > 0) {
                     let densityDesc = (tileObject.density > 0.6) ? "High" : (tileObject.density > 0.3) ? "Moderate" : "Low";
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Field density is ${densityDesc}.</span>`;
                 }
                 if (tileObject.minedThisVisit) scanMessage += "\n<span style='color:#999999;'>This field appears recently mined.</span>";
                 actionsAvailable += "Mine Asteroid (M).";
                 break;
             case NEBULA_CHAR_VAL:
                 scanMessage += `Inside a dense gas cloud. Sensors are intermittent.`;
                 if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Cloud composition is 98% hydrogen. Suitable for siphoning.</span>`;
                 }
                 actionsAvailable += "Scoop Fuel (H).";
                 break;
             case ANOMALY_CHAR_VAL:
                 scanMessage += `Unstable energy readings.`;
                 if (tileObject.studied) {
                     scanMessage += "\n<span style='color:#999999;'>The anomaly appears to have dissipated.</span>";
                 } else if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FF33FF;'>Detailed Scan: ${tileObject.subtype}. Highly volatile. Interaction is possible but dangerous.</span>`;
                 }
                 break;
             case DERELICT_CHAR_VAL:
                 // --- NEW DERELICT SCAN ---
                 scanMessage += `A silent, drifting ship hulk. It appears powerless.`;
                 if (tileObject.studied) {
                     scanMessage += "\n<span style='color:#999999;'>You've already salvaged this wreck.</span>";
                 } else if (scanBonus > 0) {
                     scanMessage += `\n<span style='color:#FFFF99;'>Detailed Scan: Hull breaches detected. Life signs... negative. Potential salvage.</span>`;
                 }
                 break;
             default:
                 scanMessage += "Unknown object detected. Sensor readings inconclusive.";
                 break;
         }
     }

     if (actionsAvailable) {
         scanMessage += "\n\nAvailable Actions: " + actionsAvailable;
     }

     if (playerActiveMission && playerActiveMission.type === "SURVEY" && !playerActiveMission.isComplete) {
         playerActiveMission.objectives.forEach((obj, index) => {
             const progressKey = `survey_${index}`;
             const objectiveProgress = playerActiveMission.progress[progressKey];
             if (objectiveProgress && !objectiveProgress.complete && tileObject.type === obj.targetType && (obj.subtype === "ANY_ANOMALY" || tileObject.subtype === obj.subtype)) {
                 objectiveProgress.complete = true;
                 scanMessage += `\n<span style='color:#00FF00;'>Mission Update: ${obj.subtype} surveyed!</span>`;
             }
         });
         checkMissionObjectiveCompletion();
     }

     if (objectTypeForXP && !scannedObjectTypes.has(objectTypeForXP)) {
         scannedObjectTypes.add(objectTypeForXP);
         playerXP += XP_PER_FIRST_SCAN_TYPE;
         scanMessage += `\n<span style='color:#00FF00;'>New Discovery Type Scanned! +${XP_PER_FIRST_SCAN_TYPE} XP!</span>`;
         checkLevelUp();
     }

     logMessage(scanMessage);
 }

 /**
  * Handles the logic for scanning a planet for biological lifeforms and samples.
  */
 function scanPlanetForLife() {
     if (currentGameState !== GAME_STATES.PLANET_VIEW) return;
     const planet = currentSystemData.planets[selectedPlanetIndex];

     // NEW: Filter for *only* biological resources
     const bioResources = planet.biome.resources.filter(r => BIOLOGICAL_RESOURCES.has(r));

     if (bioResources.length === 0) {
         logMessage("No viable biological signatures detected.");
         return;
     }

     // Check for cargo space
     if (currentCargoLoad + 1 > PLAYER_CARGO_CAPACITY) { // Check for at least 1 unit
         logMessage("Scan complete, but no cargo space to store samples.");
         return;
     }

     let scanMessage = "Biological scan yields:\n";
     let foundSomething = false;
     let spaceLeft = true;

     bioResources.forEach(resourceId => {
         if (!spaceLeft) return;
         const yieldAmount = 1 + Math.floor(Math.random() * 5); // 1-5 units (bio scans are more precise)

         if (currentCargoLoad + yieldAmount <= PLAYER_CARGO_CAPACITY) {
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + yieldAmount;
             updateCurrentCargoLoad();
             scanMessage += ` ${yieldAmount} ${COMMODITIES[resourceId].name}\n`;
             foundSomething = true;
         } else {
             scanMessage += ` Not enough cargo space for ${COMMODITIES[resourceId].name}.\n`;
             spaceLeft = false;
         }
     });

     if (foundSomething) {
         const xpGained = XP_PER_MINING_OP; // Use same base XP as mining
         playerXP += xpGained;
         scanMessage += `\n+${xpGained} XP.`;
         advanceGameTime(0.10); // Scanning takes a bit of time
         checkLevelUp();
     } else if (!spaceLeft) {
         // Already logged "no cargo space"
     } else {
         scanMessage = "Scan complete. No viable samples could be collected.";
     }

     logMessage(scanMessage);
     renderUIStats();
 }
 /**
  * Handles the logic for mining mineral resources on a planet's surface.
  */
 function minePlanet() {
     if (currentGameState !== GAME_STATES.PLANET_VIEW) return;

     const planet = currentSystemData.planets[selectedPlanetIndex];

     // MODIFIED: Filter for *only* non-biological resources
     const mineralResources = planet.biome.resources.filter(r => !BIOLOGICAL_RESOURCES.has(r));

     if (mineralResources.length === 0) {
         logMessage("No mineable mineral deposits detected.");
         return;
     }

     // Check for cargo space *before* mining (assume a minimum gain)
     const potentialGain = 5;
     if (currentCargoLoad + potentialGain > PLAYER_CARGO_CAPACITY) {
         logMessage("Mining operation failed: Not enough cargo space for even a small haul.");
         return;
     }

     let minedResourcesMessage = "Planetary mining operation yields:\n";
     let minedSomething = false;
     let spaceLeft = true;

     // MODIFIED: Loop over mineralResources
     mineralResources.forEach(resourceId => {
         if (!spaceLeft) return; // Stop if we ran out of space

         const yieldAmount = 5 + Math.floor(Math.random() * 11); // 5 to 15 units

         if (currentCargoLoad + yieldAmount <= PLAYER_CARGO_CAPACITY) {
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + yieldAmount;
             updateCurrentCargoLoad();
             minedResourcesMessage += ` ${yieldAmount} ${COMMODITIES[resourceId].name}\n`;
             minedSomething = true;
         } else {
             minedResourcesMessage += ` Not enough cargo space for ${COMMODITIES[resourceId].name}.\n`;
             spaceLeft = false; // Flag to stop mining other resources
         }
     });

     if (minedSomething) {
         // Make planet mining a bit more rewarding than asteroids
         const xpGained = XP_PER_MINING_OP * 2;
         playerXP += xpGained;
         minedResourcesMessage += `\n+${xpGained} XP.`;
         advanceGameTime(0.15); // Planet mining takes longer
         checkLevelUp();
     } else if (!spaceLeft) {
         // This case is already handled by the "Not enough cargo space" message
     } else {
         minedResourcesMessage = "Mining yielded nothing of value this attempt.";
     }

     logMessage(minedResourcesMessage);
     // We stay on the planet, so we just re-render the UI stats
     renderUIStats();
 }

 function scoopHydrogen() {
     if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
         logMessage("Cannot scoop fuel now.");
         return;
     }

     const cT = chunkManager.getTile(playerX, playerY);
     const tileType = getTileType(cT);

     if (tileType !== 'star' && tileType !== 'nebula') {
         logMessage("No star or nebula here to scoop from.");
         return;
     }

     if (playerFuel >= MAX_FUEL) {
         logMessage("Fuel tanks full!");
         return;
     }

     let fuelGained = 0;
     let logMsg = "";
     let timePassed = 0.05;

     if (tileType === 'star') {
         if (cT.scoopedThisVisit) {
             logMessage("This star's corona has been depleted for this visit.");
             return;
         }

         const richness = (typeof cT.richness === 'number') ? cT.richness : 0.3;
         fuelGained = MIN_SCOOP_YIELD + Math.floor(richness * MAX_SCOOP_YIELD_RICHNESS_MULTIPLIER);
         fuelGained += Math.floor(Math.random() * SCOOP_RANDOM_BONUS);
         fuelGained = Math.max(1, fuelGained);

         updateWorldState(playerX, playerY, { scoopedThisVisit: true });
         logMsg = "Scooped hydrogen from the star's corona.";

     } else if (tileType === 'nebula') {
         // Nebulas give less fuel but can't be depleted
         fuelGained = Math.floor(MIN_SCOOP_YIELD / 2) + Math.floor(Math.random() * SCOOP_RANDOM_BONUS); // Smaller, flat amount
         fuelGained = Math.max(1, fuelGained);

         // We don't mark nebulas as 'scoopedThisVisit'
         logMsg = "Siphoned trace hydrogen from the gas cloud.";
         timePassed = 0.02; // Faster than scooping a star
     }

     const originalFuel = playerFuel;
     playerFuel = Math.min(MAX_FUEL, playerFuel + fuelGained);
     playerFuel = parseFloat(playerFuel.toFixed(1));
     const actualGained = playerFuel - originalFuel;

     if (actualGained > 0) {
         advanceGameTime(timePassed);
         logMessage(`${logMsg}\nGained ${actualGained.toFixed(1)} fuel.\nFuel: ${playerFuel.toFixed(1)}/${MAX_FUEL.toFixed(1)}`);
     } else {
         logMessage("Scooping yielded no fuel. Tanks are full.");
     }
 }

 function mineAsteroid() {
     if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
         logMessage("Cannot mine now.");
         return;
     }

     const asteroid = chunkManager.getTile(playerX, playerY);

     if (getTileType(asteroid) !== 'asteroid') {
         logMessage("No asteroid field here to mine.");
         return;
     }
     if (asteroid.minedThisVisit) {
         logMessage("This asteroid field has been depleted for this visit.");
         return;
     }

     // --- EXPANSION: Distance Scaling ---
     const distanceFromCenter = Math.sqrt((playerX * playerX) + (playerY * playerY));
     // Mining gets 10% more lucrative every 100 tiles
     const richnessMultiplier = 1 + (distanceFromCenter / 1000);

     let minedResourcesMessage = "Mining operation yields:\n";
     let minedSomething = false;
     let gainedRareXP = false;

     // Apply Scaling to Yield
     const density = asteroid.density || 0.5;
     const baseYield = 5 + Math.floor(Math.random() * 15 * density);
     const yieldAmount = Math.floor(baseYield * richnessMultiplier);

     if (yieldAmount > 0) {
         if (currentCargoLoad + yieldAmount <= PLAYER_CARGO_CAPACITY) {
             playerCargo.MINERALS = (playerCargo.MINERALS || 0) + yieldAmount;
             updateCurrentCargoLoad();
             minedResourcesMessage += ` ${yieldAmount} Minerals`;
             if (richnessMultiplier > 1.2) minedResourcesMessage += " (Rich Vein!)";
             minedResourcesMessage += "\n";
             minedSomething = true;
         } else {
             minedResourcesMessage += ` Not enough cargo space for Minerals.\n`;
         }
     }

     // Increase Rare Chance in Deep Space
     const baseRareChance = 0.05;
     const bonusFromDensity = density * 0.1;
     const deepSpaceBonus = Math.min(0.2, distanceFromCenter / 5000); // Up to +20% chance in very deep space

     if (Math.random() < (baseRareChance + bonusFromDensity + deepSpaceBonus)) {
         const rareYield = 1 + Math.floor(Math.random() * 2);

         if (currentCargoLoad + rareYield <= PLAYER_CARGO_CAPACITY) {
             const resourceId = (Math.random() < 0.7) ? "RARE_METALS" : "PLATINUM_ORE";
             playerCargo[resourceId] = (playerCargo[resourceId] || 0) + rareYield;
             updateCurrentCargoLoad();
             minedResourcesMessage += `<span style='color:#FFFF99;'>+ ${rareYield} ${COMMODITIES[resourceId].name}!</span>\n`;
             playerXP += XP_BONUS_RARE_MINERAL;
             gainedRareXP = true;
             minedSomething = true;
         } else {
             minedResourcesMessage += ` Not enough cargo space for rare materials.\n`;
         }
     }

     if (minedSomething) {
         playerXP += XP_PER_MINING_OP;

         spawnParticles(playerX, playerY, 'mining'); 

         minedResourcesMessage += `\n+${XP_PER_MINING_OP} XP.`;
         if (gainedRareXP) {
             minedResourcesMessage += ` +${XP_BONUS_RARE_MINERAL} XP (Rare Find)!`;
         }
         checkLevelUp();
     } else {
         minedResourcesMessage = "Mining yielded nothing of value this attempt.";
     }

     advanceGameTime(0.1);
     updateWorldState(playerX, playerY, { minedThisVisit: true });
     logMessage(minedResourcesMessage);
 }

 function startEncounter(tileObject) {
     switch (tileObject.type) {
         case 'anomaly':
             handleAnomalyEncounter(tileObject);
             break;
             // You could add a case for 'derelict' here in the future
         default:
             logMessage("Your sensors can't get a clear reading.");;
             break;
     }

 }


 /**
  * Handles the random outcomes of salvaging a derelict ship.
  * @param {object} derelictObject - The tile data for the derelict.
  */

 /**
  * Handles the random outcomes of salvaging a derelict ship using a weighted system.
  * This function now depends on the 'getWeightedRandomOutcome' helper function.
  * @param {object} derelictObject - The tile data for the derelict.
  */
 function handleDerelictEncounter(derelictObject) {
     const outcomes = [{
             weight: 5, // <-- Most common
             text: "The derelict is picked clean. You find nothing of value.",
             effect: () => {
                 /* No effect, just the log message */ }
         },
         {
             weight: 3, // <-- Common
             text: "You find a hidden cargo bay containing 15 Tech Parts!",
             effect: () => {
                 if (currentCargoLoad + 15 <= PLAYER_CARGO_CAPACITY) {
                     playerCargo.TECH_PARTS = (playerCargo.TECH_PARTS || 0) + 15;
                     updateCurrentCargoLoad();
                 } else {
                     logMessage("Found a cache of Tech Parts but cargo hold is full!");
                 }
             }
         },
         {
             weight: 2, // <-- Uncommon
             text: "The ship's log is intact. You download the data, gaining 30 XP.",
             effect: () => {
                 playerXP += 30;
                 checkLevelUp();
             }
         },
         {
             weight: 1, // <-- Rare
             text: "You access the ship's unsecured credit chit. Transferred 750 Credits!",
             effect: () => {
                 playerCredits += 750;
             }
         },
         {
             weight: 1, // <-- Rare
             text: "You trigger a plasma conduit booby trap! Your ship takes 15 hull damage!",
             effect: () => {
                 playerHull -= 15;
                 logMessage("The trap vented superheated plasma onto your ship!");
                 if (playerHull < 1) playerHull = 1; // Don't let it kill the player outside combat
             }
         },
         {
             weight: 1, // <-- Rare
             text: "It's a trap! As you breach the hull, proximity sensors trigger... Pirates warp in!",
             effect: () => {
                 logMessage("The automated distress beacon was a pirate lure!");
                 startCombat();
             }
         }
     ];

     // Select a weighted random outcome
     const chosenOutcome = getWeightedRandomOutcome(outcomes);

     // Apply the effect and log the result
     logMessage(`Salvaging the derelict... ${chosenOutcome.text}`);
     chosenOutcome.effect();

     updateWorldState(playerX, playerY, { studied: true });
 }

 /**
  * Handles the random outcomes of investigating an anomaly using a weighted system.
  * This function depends on the 'getWeightedRandomOutcome' helper function.
  * @param {object} anomalyObject - The tile data for the anomaly.
  */
 function handleAnomalyEncounter(anomalyObject) {
     const outcomes = [{
             weight: 4, // Common
             text: "Your sensors record a massive amount of data before the anomaly dissipates. You gain 50 XP for the discovery!",
             effect: () => {
                 playerXP += 50;
                 checkLevelUp();
             }
         },
         {
             weight: 4, // Common
             text: "A psionic echo from the anomaly reverberates through your mind, revealing a forgotten piece of lore.",
             effect: () => {
                 unlockLoreEntry("XENO_ANOMALIES");
             }
         },
         {
             weight: 2, // Uncommon
             text: "A burst of exotic particles revitalizes your ship! Shields fully restored!",
             effect: () => {
                 playerShields = MAX_SHIELDS;
             }
         },
         {
             weight: 2, // Uncommon
             text: "The anomaly contains a pocket of stabilized exotic matter. You carefully collect 2 units of Void Crystals!",
             effect: () => {
                 if (currentCargoLoad + 2 <= PLAYER_CARGO_CAPACITY) {
                     playerCargo.VOID_CRYSTALS = (playerCargo.VOID_CRYSTALS || 0) + 2;
                     updateCurrentCargoLoad();
                 } else {
                     logMessage("You found Void Crystals but had no cargo space to collect them!", true);
                 }
             }
         },
         {
             weight: 2, // Uncommon
             text: "The anomaly collapses violently! Your ship is battered by gravimetric shear. Hull takes 20 damage!",
             effect: () => {
                 playerHull -= 20;
                 if (playerHull < 1) playerHull = 1;
             }
         },
         {
             weight: 2, // Uncommon
             text: "A strange energy feedback loop drains your fuel reserves! You lose 50 fuel.",
             effect: () => {
                 playerFuel -= 50;
                 if (playerFuel < 0) playerFuel = 0;
             }
         },
         {
             weight: 1, // Rare
             text: "You discover a small, stable wormhole within the anomaly containing a drifting cargo pod. You salvage 1000 Credits!",
             effect: () => {
                 playerCredits += 1000;
             }
         }
     ];

     // Select a weighted random outcome
     const chosenOutcome = getWeightedRandomOutcome(outcomes);

     // Apply the effect and update the message
     chosenOutcome.effect();
     logMessage(`Investigating the ${anomalyObject.subtype || 'anomaly'}...\n${chosenOutcome.text}`);

     // Mark the anomaly as studied so it can't be used again
     updateWorldState(playerX, playerY, { studied: true });
 }

 function calculatePrice(basePrice, priceMod) {
     // 1. Base Calculation
     let price = basePrice * priceMod;

     // 2. Dynamic Market Fluctuation
     // We use a sine wave based on currentGameDate to simulate market trends.
     // Different commodities react differently based on their name length (pseudo-random hash).
     // The cycle is roughly every 20 Stardate units.
     const uniqueOffset = basePrice;
     const fluctuation = Math.sin((currentGameDate + uniqueOffset) / 5);

     // Fluctuate by +/- 15%
     const marketFactor = 1 + (fluctuation * 0.15);

     return Math.max(1, Math.round(price * marketFactor));
 }

 function getTradeQuantityPromptBaseMessage() {
     const lD = currentTradeContext.locationData;
     const itemsList = currentTradeContext.mode === 'buy' ? lD.sells : lD.buys;
     const itemEntry = itemsList[currentTradeContext.itemIndex];
     const commodity = COMMODITIES[itemEntry.id];
     const price = calculatePrice(commodity.basePrice, itemEntry.priceMod);

     let promptMsg = `How many ${commodity.name} to ${currentTradeContext.mode}? (Price: ${price}c)\n`;

     if (currentTradeContext.mode === 'buy') {
         promptMsg += `Max: ${itemEntry.stock}, Afford: ${Math.floor(playerCredits / price)}, Space: ${PLAYER_CARGO_CAPACITY - currentCargoLoad}\n`;
     } else {
         promptMsg += `You have: ${playerCargo[itemEntry.id]||0}, Location demand: ${itemEntry.stock}\n`;
     }
     return promptMsg;
 }

 // --- NEW VISUAL TRADING SYSTEM ---

function openTradeModal(mode) {
    const location = chunkManager.getTile(playerX, playerY);

    // Validation
    if (!location || location.type !== 'location' || !((mode === 'buy' && location.sells?.length) || (mode === 'sell' && location.buys?.length))) {
        logMessage(`No items to ${mode} here.`);
        return;
    }

    // Set Context
    currentTradeContext = {
        locationData: location,
        mode: mode,
        items: mode === 'buy' ? location.sells : location.buys
    };
    currentTradeItemIndex = -1;
    currentTradeQty = 1;

    // Show UI
    document.getElementById('tradeOverlay').style.display = 'flex';
    document.getElementById('tradeTitle').textContent = `${mode.toUpperCase()} AT ${location.name.toUpperCase()}`;
    
    // Render List
    renderTradeList();
    resetTradeDetails();
}

function closeTradeModal() {
    document.getElementById('tradeOverlay').style.display = 'none';
    currentTradeContext = null;
    // Return focus to map
    handleInteraction();
}

function renderTradeList() {
    const listEl = document.getElementById('tradeList');
    listEl.innerHTML = '';

    currentTradeContext.items.forEach((item, index) => {
        const com = COMMODITIES[item.id];
        const price = calculatePrice(com.basePrice, item.priceMod);
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        if (index === currentTradeItemIndex) row.classList.add('selected');
        
        // Show Stock (if buying) or Player Inventory (if selling)
        let stockInfo = "";
        if (currentTradeContext.mode === 'buy') stockInfo = `Stock: ${item.stock}`;
        else stockInfo = `Have: ${playerCargo[item.id] || 0}`;

        row.innerHTML = `
            <span>${com.name}</span>
            <span style="color:#888;">${price}c | ${stockInfo}</span>
        `;
        row.onclick = () => selectTradeItem(index);
        listEl.appendChild(row);
    });
}

function selectTradeItem(index) {
    currentTradeItemIndex = index;
    currentTradeQty = 1;
    renderTradeList(); // Update highlight
    
    const itemEntry = currentTradeContext.items[index];
    const com = COMMODITIES[itemEntry.id];
    
    // Unlock Lore
    unlockLoreEntry(`COMMODITY_${itemEntry.id}`);

    // Update Detail Text
    document.getElementById('tradeItemName').textContent = com.name;
    document.getElementById('tradeItemDesc').textContent = com.description;
    document.getElementById('tradeQtyInput').value = 1;

    // Enable button
    document.getElementById('tradeConfirmBtn').disabled = false;

    updateTradeTotal();
}

function updateTradeTotal() {
    if (currentTradeItemIndex === -1) return;

    const itemEntry = currentTradeContext.items[currentTradeItemIndex];
    const com = COMMODITIES[itemEntry.id];
    const price = calculatePrice(com.basePrice, itemEntry.priceMod);
    
    // Get Qty from input
    let qty = parseInt(document.getElementById('tradeQtyInput').value);
    if (isNaN(qty) || qty < 1) qty = 1;
    currentTradeQty = qty;

    // Update UI Stats
    document.getElementById('tradeUnitPrice').textContent = `${price}c`;
    
    if (currentTradeContext.mode === 'buy') {
        document.getElementById('tradeStock').textContent = `${itemEntry.stock} (Cap: ${PLAYER_CARGO_CAPACITY - currentCargoLoad})`;
    } else {
        document.getElementById('tradeStock').textContent = `${playerCargo[itemEntry.id] || 0} (Demand: ${itemEntry.stock})`;
    }

    const total = price * qty;
    const totalEl = document.getElementById('tradeTotalCost');
    totalEl.textContent = total;

    // Validate Colors
    if (currentTradeContext.mode === 'buy' && total > playerCredits) {
        totalEl.style.color = '#FF4444'; // Red if can't afford
        document.getElementById('tradeConfirmBtn').disabled = true;
    } else {
        totalEl.style.color = '#00E0E0';
        document.getElementById('tradeConfirmBtn').disabled = false;
    }
}

function adjustTradeQty(delta) {
    const input = document.getElementById('tradeQtyInput');
    let val = parseInt(input.value) || 0;
    val = Math.max(1, val + delta);
    input.value = val;
    updateTradeTotal();
}

function setTradeMax() {
    if (currentTradeItemIndex === -1) return;
    const itemEntry = currentTradeContext.items[currentTradeItemIndex];
    const com = COMMODITIES[itemEntry.id];
    const price = calculatePrice(com.basePrice, itemEntry.priceMod);
    
    let max = 0;
    
    if (currentTradeContext.mode === 'buy') {
        const afford = Math.floor(playerCredits / price);
        const space = PLAYER_CARGO_CAPACITY - currentCargoLoad;
        max = Math.min(itemEntry.stock, afford, space);
    } else {
        const have = playerCargo[itemEntry.id] || 0;
        max = Math.min(have, itemEntry.stock); // Can only sell what station wants
    }

    document.getElementById('tradeQtyInput').value = Math.max(1, max);
    updateTradeTotal();
}

function executeTrade() {
    if (currentTradeItemIndex === -1) return;
    
    // Reuse your existing logic function!
    // We just pass the string value of the quantity
    handleTradeQuantity(currentTradeQty.toString());
    
    // Refresh the UI to reflect new stock/credits
    renderTradeList();
    selectTradeItem(currentTradeItemIndex);
    renderUIStats();
}

 function handleTradeSelection(input) {
     if (!currentTradeContext || currentTradeContext.step !== 'selectItem') return;
     const lD = currentTradeContext.locationData;
     const items = currentTradeContext.mode === 'buy' ? lD.sells : lD.buys;
     const sel = parseInt(input);
     if (isNaN(sel) || sel < 1 || sel > items.length) {
         logMessage("Invalid selection. # or 'L'.");;
         return;
     }
     currentTradeContext.itemIndex = sel - 1;
     currentTradeContext.step = 'selectQuantity';

     let promptMsg = getTradeQuantityPromptBaseMessage();
     // Updated prompt text:
     promptMsg += "Enter quantity, or type 'm' for MAX. ('0' to cancel)";
     currentQuantityInput = "";
     logMessage(promptMsg);
 }

 /**
  * Processes the player's quantity input during a trade transaction.
  * This function handles the logic for both buying and selling commodities.
  * @param {string} inputString - The numerical string entered by the player.
  */

 function handleTradeQuantity(inputString) {
     // 1. --- PRE-FLIGHT CHECKS ---
     if (!currentTradeContext || currentTradeContext.step !== 'selectQuantity') return;

     // --- NEW: Handle "Max" Logic ---
     const locationData = currentTradeContext.locationData;
     const tradeMode = currentTradeContext.mode;
     const itemsList = tradeMode === 'buy' ? locationData.sells : locationData.buys;
     const itemEntry = itemsList[currentTradeContext.itemIndex];
     const commodityID = itemEntry.id;
     const commodity = COMMODITIES[commodityID];

     // Calculate Price (using the new Dynamic Price function if you add it later, otherwise standard)
     // We use the existing helper function, but we'll upgrade that function in the next step.
     const price = calculatePrice(commodity.basePrice, itemEntry.priceMod);

     let qty = 0;

     // Check for "m", "max", or empty input (default to max)
     if (inputString.toLowerCase() === 'm' || inputString.toLowerCase() === 'max') {
         if (tradeMode === 'buy') {
             // Max buyable based on Credits, Stock, and Cargo Space
             const affordMax = Math.floor(playerCredits / price);
             const spaceMax = PLAYER_CARGO_CAPACITY - currentCargoLoad;
             qty = Math.min(itemEntry.stock, affordMax, spaceMax);
         } else {
             // Max sellable based on Player Inventory and Station Demand
             const playerHas = playerCargo[commodityID] || 0;
             qty = Math.min(playerHas, itemEntry.stock);
         }
     } else {
         qty = parseInt(inputString);
     }

     currentQuantityInput = ""; // Clear buffer

     if (isNaN(qty) || qty <= 0) {
         logMessage("Transaction canceled.");
         displayTradeScreen(currentTradeContext.mode);
         return;
     }

     let finalMessage = "";

     // 3. --- EXECUTE TRANSACTION LOGIC ---
     if (tradeMode === 'buy') {
         const totalCost = price * qty;

         if (qty > itemEntry.stock) {
             finalMessage = "Purchase failed: Not enough stock.";
         } else if (totalCost > playerCredits) {
             finalMessage = "Purchase failed: Insufficient credits.";
         } else if (currentCargoLoad + qty > PLAYER_CARGO_CAPACITY) {
             finalMessage = "Purchase failed: Cargo hold full.";
         } else {
             playerCredits -= totalCost;
             playerCargo[commodityID] = (playerCargo[commodityID] || 0) + qty;
             itemEntry.stock -= qty;
             updateCurrentCargoLoad();
             finalMessage = `Purchased ${qty} ${commodity.name} for ${totalCost}c.`;
         }

         // --- WAYFINDER QUEST TRIGGER ---
     if (commodityID === 'WAYFINDER_CORE' && !mystery_first_nexus_location) {
         // 1. Calculate a distant location for the Nexus
         // It should be far away (e.g., 500-1000 tiles out)
         const dist = 500 + Math.floor(seededRandom(WORLD_SEED) * 500);
         const angle = seededRandom(WORLD_SEED + 1) * Math.PI * 2;
         
         const nexusX = Math.floor(Math.cos(angle) * dist);
         const nexusY = Math.floor(Math.sin(angle) * dist);

         mystery_first_nexus_location = { x: nexusX, y: nexusY };
         
         unlockLoreEntry("MYSTERY_WAYFINDER_QUEST_COMPLETED");
         
         finalMessage += "\n\n<span style='color:#40E0D0; font-weight:bold;'>! ARTIFACT ACTIVATED !</span>\nThe Wayfinder Core hums violently! Coordinates projected into navigation computer: \n" + 
                         `SECTOR (${Math.floor(nexusX/SECTOR_SIZE)}, ${Math.floor(nexusY/SECTOR_SIZE)}) \n` +
                         `COORDS: ${nexusX}, ${nexusY}`;
         
         logMessage(finalMessage); // Log immediately so they see the coords
         return; // Return early to avoid overwriting the message
     }

     } else {
         const playerHas = playerCargo[commodityID] || 0;

         if (qty > playerHas) {
             finalMessage = `Sale failed: You only have ${playerHas}.`;
         } else if (qty > itemEntry.stock) {
             finalMessage = `Sale failed: Station only wants ${itemEntry.stock}.`;
         } else {
             const totalGain = price * qty;
             playerCredits += totalGain;
             playerCargo[commodityID] -= qty;
             itemEntry.stock -= qty;
             updateCurrentCargoLoad();
             finalMessage = `Sold ${qty} ${commodity.name} for ${totalGain}c.`;

             const profitPerUnit = price - commodity.basePrice;
             if (profitPerUnit > 0) {
                 const xpGained = Math.floor(profitPerUnit * qty * XP_PER_PROFIT_UNIT);
                 if (xpGained > 0) {
                     playerXP += xpGained;
                     updatePlayerNotoriety(Math.floor(totalGain / 500));
                     finalMessage += `\n<span style='color:#00FF00;'>+${xpGained} XP (Profitable)!</span>`;
                 }
             }
         }
     }

     logMessage(finalMessage);
    checkLevelUp();

 }

 /**
  * Regenerates the player's shields based on time passed and equipped shield.
  * Does not run in combat or when shields are full.
  * @param {number} timePassed - The amount of stardate that has passed.
  */
 function regenerateShields(timePassed) {
     // No regen in combat or when already full
     if (currentGameState === GAME_STATES.COMBAT || playerShields >= MAX_SHIELDS) {
         return;
     }

     // Get the equipped shield's stats
     const shield = COMPONENTS_DATABASE[playerShip.components.shield];
     const rechargeRate = shield.stats.rechargeRate || 1; // e.g., "1" point per 0.1 stardate

     // Calculate regen. A rate of 1 means 1 point per 0.1 stardate.
     // (rechargeRate / 0.1) gives us rate-per-stardate.
     const regenAmount = ((rechargeRate / 0.1) * timePassed) * 6;

     playerShields += regenAmount;

     // Don't let it overshoot
     if (playerShields > MAX_SHIELDS) {
         playerShields = MAX_SHIELDS;
     }
 }

 /**
  * Advances the game clock and triggers time-based events like shield regen.
  * This is our new "master" function for passing time.
  * @param {number} timeAmount - The amount of stardate to pass (e.g., 0.01 for one move).
  */
 function advanceGameTime(timeAmount) {
     currentGameDate += timeAmount;

     // Call all "per-tick" updates here
     regenerateShields(timeAmount);

     // In the future, this could also handle mission timers, etc.
 }


 function checkLevelUp() {
     let leveledUp = false;
     // Changed 'if' to 'while' to handle massive XP gains (e.g. from missions)
     while (playerXP >= xpToNextLevel) {
         playerLevel++;
         playerXP -= xpToNextLevel;
         xpToNextLevel = calculateXpToNextLevel(playerLevel);
         leveledUp = true;
     }

     if (leveledUp) {
         logMessage(`LEVEL UP! You are now Level ${playerLevel}!\nShields and Fuel fully restored!`);
         playerShields = MAX_SHIELDS;
         playerFuel = MAX_FUEL;
         renderUIStats(); // Force an immediate UI update
         return true;
     }
     return false;
 }

 function updateSectorState() {
     const newSectorX = Math.floor(playerX / SECTOR_SIZE);
     const newSectorY = Math.floor(playerY / SECTOR_SIZE);

     if (newSectorX !== currentSectorX || newSectorY !== currentSectorY) {
         currentSectorX = newSectorX;
         currentSectorY = newSectorY;
         currentSectorName = generateSectorName(currentSectorX, currentSectorY);

         logMessage(`Now entering the ${currentSectorName} sector.`);

         const sectorKey = `${currentSectorX},${currentSectorY}`;
         if (!visitedSectors.has(sectorKey)) {
             visitedSectors.add(sectorKey);
             playerXP += XP_PER_NEW_SECTOR_DISCOVERY;
             logMessage(`<span style='color:#00DD00;'>New Sector Discovered! +${XP_PER_NEW_SECTOR_DISCOVERY} XP!</span>`);
             checkLevelUp();
         }
     }
 }

 function startCombat() {
     const pirateShipOutcomes = Object.values(PIRATE_SHIP_CLASSES);
     const pirateShip = getWeightedRandomOutcome(pirateShipOutcomes);

     // --- Calculate Distance from Start (0,0) ---
     // We use the Pythagorean theorem: a^2 + b^2 = c^2
     const distanceFromCenter = Math.sqrt((playerX * playerX) + (playerY * playerY));

     // Scaling Factor: Every 50 tiles (approx 1 sector), enemies get slightly stronger
     const difficultyMultiplier = 1 + (distanceFromCenter / 200);

     // --- Apply Scaling to Enemy Stats ---
     const baseHull = pirateShip.baseHull + Math.floor(Math.random() * 10) - 5;
     const baseShields = pirateShip.baseShields + Math.floor(Math.random() * 10) - 5;

     const scaledHull = Math.floor(baseHull * difficultyMultiplier);
     const scaledShields = Math.floor(baseShields * difficultyMultiplier);

     currentCombatContext = {
         ship: pirateShip,
         pirateShields: Math.max(10, scaledShields),
         pirateMaxShields: Math.max(10, scaledShields),
         pirateHull: Math.max(20, scaledHull),
         pirateMaxHull: Math.max(20, scaledHull),
         // Save the multiplier to scale rewards later
         difficultyMultiplier: difficultyMultiplier
     };

     const taunts = ["Your cargo or your life, spacer!", "Heh, fresh meat for the void!", "This sector is ours! Pay the toll!"];
     const pirateTaunt = taunts[Math.floor(Math.random() * taunts.length)];

     changeGameState(GAME_STATES.COMBAT);

     // Dynamic message based on difficulty
     let encounterMsg = `"${pirateTaunt}"\nHostile Pirate encountered!`;
     if (difficultyMultiplier > 1.5) encounterMsg += "\n<span style='color:#FF5555'>Warning: Deep Space Threat Detected!</span>";

     logMessage(encounterMsg);
 }

 function handleCombatAction(action) {
     if (!currentCombatContext) return;

     let combatLog = "";
     let enemyAttacks = true;

     // --- Player's Turn ---
     if (action === 'fight') {
         const weaponStats = COMPONENTS_DATABASE[playerShip.components.weapon].stats;
         let damageDealt = weaponStats.damage;
         let currentHitChance = weaponStats.hitChance;

         if (playerIsChargingAttack) {
             damageDealt = Math.floor(damageDealt * CHARGE_DAMAGE_MULTIPLIER);
             currentHitChance += CHARGE_HIT_BONUS;
             combatLog += "Charged shot unleashed! ";
             playerIsChargingAttack = false;
         }

         if (Math.random() < currentHitChance) {
             let actualDamage = damageDealt;

             if (weaponStats.vsShieldBonus && currentCombatContext.pirateShields > 0) {
                 actualDamage += weaponStats.vsShieldBonus;
             }

             if (currentCombatContext.pirateShields > 0) {
                 const shieldDamage = actualDamage;
                 currentCombatContext.pirateShields -= shieldDamage;
                 combatLog += `Hit pirate shields for ${Math.floor(shieldDamage)}!`;

                 if (currentCombatContext.pirateShields < 0) {
                     // Capture the spillover damage
                     const spilloverDamage = Math.abs(currentCombatContext.pirateShields);
                     const hullDamage = Math.floor(spilloverDamage * HULL_DAMAGE_BONUS_MULTIPLIER);

                     currentCombatContext.pirateHull -= hullDamage;
                     currentCombatContext.pirateShields = 0;
                     combatLog += ` Shields down! Hull takes ${hullDamage} spillover damage!`;
                 }
             } else {
                 actualDamage = Math.floor(actualDamage * HULL_DAMAGE_BONUS_MULTIPLIER);
                 currentCombatContext.pirateHull -= actualDamage;
                 combatLog += `Hit pirate hull for ${actualDamage}!`;
             }
         } else {
             combatLog += "Your attack missed!";
         }
     } else if (action === 'charge') {
         playerIsChargingAttack = true;
         combatLog += "Charging weapon systems...";
         enemyAttacks = true;
     } else if (action === 'evade') {
         playerFuel -= EVASION_FUEL_COST;
         playerFuel = parseFloat(playerFuel.toFixed(1));
         playerIsEvading = true;
         combatLog += `Attempting evasive maneuvers...`;
     } else if (action === 'run') {
         playerFuel -= RUN_FUEL_COST;
         playerFuel = parseFloat(playerFuel.toFixed(1));
         if (Math.random() < RUN_ESCAPE_CHANCE) {
             logMessage(`Escaped! Used ${RUN_FUEL_COST} fuel.`);
             updatePlayerNotoriety(-1);
             currentCombatContext = null;
             playerIsChargingAttack = false;
             playerIsEvading = false;
             changeGameState(GAME_STATES.GALACTIC_MAP);
             handleInteraction();
             return;
         } else {
             combatLog += `Failed to escape!`;
         }
     }

     logMessage(combatLog);

     // --- Check for Player Victory ---
     if (currentCombatContext.pirateHull <= 0) {
         // Retrieve the multiplier we saved in startCombat
         const mult = currentCombatContext.difficultyMultiplier || 1.0;

         // Scale Credits and XP
         const baseCredits = PIRATE_CREDIT_REWARD_MIN + Math.floor(Math.random() * (PIRATE_CREDIT_REWARD_MAX - PIRATE_CREDIT_REWARD_MIN + 1));
         const baseXP = XP_PER_PIRATE_MIN + Math.floor(Math.random() * (XP_PER_PIRATE_MAX - XP_PER_PIRATE_MIN + 1));

         const cW = Math.floor(baseCredits * mult);
         const xG = Math.floor(baseXP * mult);

         playerCredits += cW;
         playerXP += xG;
         updatePlayerNotoriety(5);

         // Spawn 3 bursts for effect
        spawnParticles(playerX, playerY, 'explosion');
        setTimeout(() => spawnParticles(playerX, playerY, 'explosion'), 200);
        setTimeout(() => spawnParticles(playerX, playerY, 'gain'), 400); // Loot glint

         let victoryLog = `Pirate defeated! Salvaged ${cW}c. Gained ${xG} XP.`;
         if (mult > 1.2) victoryLog += " (Deep Space Bonus!)";

         if (playerActiveMission && playerActiveMission.type === "BOUNTY" && !playerActiveMission.isComplete) {
             let objectiveUpdated = false;
             playerActiveMission.objectives.forEach((obj, index) => {
                 if (obj.type === "ELIMINATE") {
                     const progressKey = `eliminate_${index}`;
                     const objectiveProgress = playerActiveMission.progress[progressKey];

                     if (objectiveProgress && !objectiveProgress.complete) {
                         objectiveProgress.current++;
                         victoryLog += `\n<span style='color:#00FF00;'>Bounty Updated: (${objectiveProgress.current}/${objectiveProgress.required})</span>`;
                         if (objectiveProgress.current >= objectiveProgress.required) {
                             objectiveProgress.complete = true;
                         }
                         objectiveUpdated = true;
                     }
                 }
             });

             if (objectiveUpdated) {
                 checkMissionObjectiveCompletion();
             }
         }

         currentCombatContext = null;
         playerIsChargingAttack = false;
         playerIsEvading = false;
         logMessage(victoryLog);
         checkLevelUp();
         changeGameState(GAME_STATES.GALACTIC_MAP);
         handleInteraction();
         renderMissionTracker();
         return;
     }

     // --- Enemy's Turn ---
     let enemyLog = "";
     if (enemyAttacks) {
         let pirateEffectiveHitChance = PIRATE_HIT_CHANCE;
         if (playerIsEvading) {
             pirateEffectiveHitChance -= EVASION_DODGE_BONUS;
         }
         if (Math.random() < pirateEffectiveHitChance) {
             const pD = PIRATE_ATTACK_DAMAGE_MIN + Math.floor(Math.random() * (PIRATE_ATTACK_DAMAGE_MAX - PIRATE_ATTACK_DAMAGE_MIN + 1));
             if (playerIsEvading) enemyLog += "Pirate hits through your maneuvers! ";
             else enemyLog += "Pirate attack hits! ";

             if (playerShields > 0) {
                 playerShields -= pD;
                 enemyLog += `Shields take ${pD} damage.`;
                 if (playerShields < 0) {
                     playerHull += playerShields;
                     playerShields = 0;
                     enemyLog += ` Shields down!`;
                 }
             } else {
                 playerHull -= pD;
                 enemyLog += `Hull takes ${pD} damage!`;
             }
         } else {
             enemyLog += "Pirate attack missed!";
         }
         logMessage(enemyLog);
     }
     playerIsEvading = false;

     // --- Check for Player Defeat ---
     if (playerHull <= 0) {
         playerHull = 0;
         let defeatLog = `Ship critically damaged! Emergency warp to Starbase Alpha...`;
         let cLs = Math.floor(playerCredits * 0.1);
         playerCredits = Math.max(0, playerCredits - cLs);
         defeatLog += `\nLost ${cLs}c.`;
         updatePlayerNotoriety(-10);
         playerShields = 1;
         playerHull = 1;

         const starbaseCoords = LOCATIONS_DATA["Starbase Alpha"].coords;
         playerX = starbaseCoords.x;
         playerY = starbaseCoords.y;

         // This line ensures the UI knows we moved sectors ---
         updateSectorState();

         currentCombatContext = null;
         playerIsChargingAttack = false;
         playerIsEvading = false;
         logMessage(defeatLog);
         changeGameState(GAME_STATES.GALACTIC_MAP);
         handleInteraction();
         return;
     }

     render();
 }

 // --- Shipyard Functions ---

 function displayShipyard() {
     // Get location data from the chunkManager
     const location = chunkManager.getTile(playerX, playerY);

     if (!location || location.type !== 'location' || !location.isMajorHub) {
         logMessage("Shipyard services not available here.");
         return;
     }

     currentShipyardContext = {
         step: 'selectShip',
         availableShips: []
     };
     let shipyardMsg = `--- ${location.name} Shipyard ---\n`;
     shipyardMsg += `Your Credits: ${playerCredits}\n\nAvailable Hulls:\n`;

     let shipIndex = 1;
     for (const shipId in SHIP_CLASSES) {
         if (playerShip.shipClass === shipId) continue; // Don't list the player's current ship

         const ship = SHIP_CLASSES[shipId];
         shipyardMsg += `${shipIndex}. ${ship.name} (${ship.baseCost}c)\n`;
         shipyardMsg += `   Hull: ${ship.baseHull}, Cargo: ${ship.cargoCapacity} - ${ship.description}\n`;
         currentShipyardContext.availableShips.push({
             id: shipId,
             ...ship
         });
         shipIndex++;
     }

     shipyardMsg += "Enter # to inspect a ship, or (L) to leave.";
     logMessage(shipyardMsg);
 }

 function displayShipPurchaseConfirmation(shipId) {
     const ship = SHIP_CLASSES[shipId];
     const oldShip = SHIP_CLASSES[playerShip.shipClass];
     const tradeInValue = Math.floor(oldShip.baseCost * 0.5); // Trade-in is 50% of old ship's base cost
     const finalCost = ship.baseCost - tradeInValue;

     currentShipyardContext.step = 'confirmPurchase';
     currentShipyardContext.selectedShipId = shipId;

     let confirmMsg = `--- Purchase Confirmation ---\n\n`;
     confirmMsg += `Ship: ${ship.name}\n`;
     confirmMsg += `Cost: ${ship.baseCost}c\n`;
     confirmMsg += `Trade-in (${oldShip.name}): -${tradeInValue}c\n`;
     confirmMsg += `---------------------------\n`;
     confirmMsg += `Final Cost: ${finalCost}c\n\n`;

     if (playerCredits < finalCost) {
         confirmMsg += `<span style='color:#FF5555;'>You cannot afford this ship.</span>\n`;
     } else {
         confirmMsg += `Purchase this ship? Your current ship and all components will be traded in. (Y/N)`;
     }

     confirmMsg += "\n\n(L) to return to the shipyard list.";
     logMessage(confirmMsg);;
 }

 /**
  * Handles the logic for repairing the player's ship hull at a station.
  */

 function repairShip() {
     if (playerHull >= MAX_PLAYER_HULL) {
         logMessage("Hull is already at maximum integrity.");
         return;
     }

     const hullToRepair = MAX_PLAYER_HULL - playerHull;

     // Ceil the cost so we don't charge fractional credits
     const totalCost = Math.ceil(hullToRepair * HULL_REPAIR_COST_PER_POINT);

     if (playerCredits < totalCost) {
         logMessage(`Cannot afford full repairs. Cost: ${totalCost}c, You have: ${playerCredits}c.`);
         return;
     }

     playerCredits -= totalCost;
     playerHull = MAX_PLAYER_HULL;

     logMessage(`Ship hull repaired for ${totalCost} credits.`);

     handleInteraction();
     renderUIStats();
 }

 function buyShip() {
     if (!currentShipyardContext || currentShipyardContext.step !== 'confirmPurchase') return;

     const shipId = currentShipyardContext.selectedShipId;
     const ship = SHIP_CLASSES[shipId];
     const oldShip = SHIP_CLASSES[playerShip.shipClass];

     // 1. Calculate Ship Hull Trade-in
     let tradeInValue = Math.floor(oldShip.baseCost * 0.5);

     // 2. Calculate Components Trade-in (NEW)
     // We refund 50% of the value of all installed components
     let componentsRefund = 0;
     for (const slot in playerShip.components) {
         const compId = playerShip.components[slot];
         const compData = COMPONENTS_DATABASE[compId];
         if (compData && compData.cost > 0) {
             componentsRefund += Math.floor(compData.cost * 0.5);
         }
     }
     tradeInValue += componentsRefund;

     const finalCost = ship.baseCost - tradeInValue;

     if (playerCredits < finalCost) {
         logMessage(`Purchase failed: Insufficient credits. (Need ${finalCost}c)`);
         displayShipyard();
         return;
     }

     playerCredits -= finalCost;
     playerShip.shipClass = shipId;

     // Reset components to defaults
     playerShip.components = {
         weapon: "WEAPON_PULSE_LASER_MK1",
         shield: "SHIELD_BASIC_ARRAY_A",
         engine: "ENGINE_STD_DRIVE_MK1",
         scanner: "SCANNER_BASIC_SUITE"
     };

     applyPlayerShipStats();
     playerHull = MAX_PLAYER_HULL;
     playerShields = MAX_SHIELDS;
     playerFuel = MAX_FUEL;

     let successMsg = `Transaction complete! Welcome to your new ${ship.name}!`;
     if (componentsRefund > 0) {
         successMsg += `\n(Includes ${componentsRefund}c refund for old components)`;
     }

     logMessage(successMsg);
     currentShipyardContext = null;
     handleInteraction();
 }

 // --- Outfitting Functions ---

 function displayOutfittingScreen() {
     // Get location data from the chunkManager
     const location = chunkManager.getTile(playerX, playerY);

     if (!location || location.type !== 'location' || !location.isMajorHub) {
         logMessage("Outfitting services not available here.");
         return;
     }

     currentOutfitContext = {
         step: 'selectSlot'
     };

     let outfitMsg = "--- Ship Outfitting ---\n";
     outfitMsg += "Current Loadout:\n";
     outfitMsg += ` 1. Weapon: ${COMPONENTS_DATABASE[playerShip.components.weapon].name}\n`;
     outfitMsg += ` 2. Shield: ${COMPONENTS_DATABASE[playerShip.components.shield].name}\n`;
     outfitMsg += ` 3. Engine: ${COMPONENTS_DATABASE[playerShip.components.engine].name}\n`;
     outfitMsg += ` 4. Scanner: ${COMPONENTS_DATABASE[playerShip.components.scanner].name}\n\n`;
     outfitMsg += "Select slot # to upgrade, or (L) to Leave.";

     logMessage(outfitMsg);
 }

 function displayComponentsForSlot(slotType) {
     currentOutfitContext.step = 'selectComponent';
     currentOutfitContext.selectedSlot = slotType;
     let componentMsg = `--- Upgrading ${slotType.toUpperCase()} ---\nAvailable components (Cr: ${playerCredits}):\n`;
     let componentIndex = 1;
     currentOutfitContext.availableComponents = [];
     for (const compId in COMPONENTS_DATABASE) {
         const comp = COMPONENTS_DATABASE[compId];
         if (comp.slot === slotType && playerShip.components[slotType] !== compId) {
             componentMsg += `${componentIndex}. ${comp.name} (${comp.cost}c) - ${comp.description}\n`;
             componentMsg += `   Stats: `;
             let statsStr = [];
             for (const stat in comp.stats) {
                 statsStr.push(`${stat}: ${comp.stats[stat]}`);
             }
             componentMsg += statsStr.join(', ') + "\n";
             currentOutfitContext.availableComponents.push({
                 id: compId,
                 ...comp
             }); // Store ID with component
             componentIndex++;
         }
     }
     if (currentOutfitContext.availableComponents.length === 0) {
         componentMsg += "No other upgrades currently available for this slot.\n";
     }
     componentMsg += "Enter # to purchase, or 'L' to go back.";
     logMessage(componentMsg);;
 }

 function buyComponent(selectedComponentId) {
     const component = COMPONENTS_DATABASE[selectedComponentId];
     if (!component) {
         logMessage("Invalid component selection.");
         displayComponentsForSlot(currentOutfitContext.selectedSlot);
         return;
     }
     if (playerCredits < component.cost) {
         logMessage("Not enough credits to purchase " + component.name + ".", true);
         displayComponentsForSlot(currentOutfitContext.selectedSlot);
         return;
     }
     const oldComponent = COMPONENTS_DATABASE[playerShip.components[component.slot]];
     playerCredits -= component.cost;
     playerShip.components[component.slot] = selectedComponentId;
     applyPlayerShipStats();
     unlockLoreEntry(component.loreKey);
     logMessage(`Installed ${component.name}. Old ${oldComponent.name} unequipped.\nCredits: ${playerCredits}`);
     currentOutfitContext = null;
     handleInteraction();;
 }

 function displayCargoHold() {
     if (currentTradeContext || currentCombatContext || currentOutfitContext || currentMissionContext || currentEncounterContext) {
         logMessage("Cannot view cargo hold now.");;
         return;
     }
     let cargoMsg = "--- Cargo Hold ---\n";
     cargoMsg += `Capacity: ${currentCargoLoad}/${PLAYER_CARGO_CAPACITY}\n`;
     let hasCargo = false;
     for (const commID in playerCargo) {
         if (playerCargo[commID] > 0) {
             cargoMsg += ` ${COMMODITIES[commID].name}: ${playerCargo[commID]}\n`;
             hasCargo = true;
         }
     }
     if (!hasCargo) {
         cargoMsg += "Hold is empty.\n";
     }
     cargoMsg += "\nPress any key to close cargo view.";
     logMessage(cargoMsg);
     currentOutfitContext = {
         step: 'viewingCargo'
     };;
 }

 // --- Codex Functions ---

 let currentCodexCategory = null;

 function toggleCodex(show) {
     /* Same as v0.6.11 */
     if (show) {
         codexOverlayElement.style.display = 'flex';
         renderCodexCategories();
         renderCodexEntries(null);
         codexEntryTextElement.innerHTML = "Select a category, then an entry.";
     } else {
         codexOverlayElement.style.display = 'none';
         currentCodexCategory = null;
     }
 }

 function renderCodexCategories() {
     /* Same as v0.6.11 */
     codexCategoriesElement.innerHTML = '';
     const cats = new Set();
     Object.values(LORE_DATABASE).forEach(e => {
         if (discoveredLoreEntries.has(Object.keys(LORE_DATABASE).find(k => LORE_DATABASE[k] === e))) cats.add(e.category);
     });
     Array.from(cats).sort().forEach(cat => {
         const cD = document.createElement('div');
         cD.textContent = cat;
         cD.className = 'codex-list-item';
         if (cat === currentCodexCategory) cD.classList.add('active');
         cD.onclick = () => {
             currentCodexCategory = cat;
             renderCodexCategories();
             renderCodexEntries(cat);
             codexEntryTextElement.innerHTML = "Select an entry.";
         };
         codexCategoriesElement.appendChild(cD);
     });
 }

 function renderCodexEntries(category) {
     /* Same as v0.6.11 */
     codexEntriesElement.innerHTML = '';
     if (!category) return;
     Object.entries(LORE_DATABASE).forEach(([k, e]) => {
         if (e.category === category && discoveredLoreEntries.has(k)) {
             const eD = document.createElement('div');
             eD.textContent = e.title;
             eD.className = 'codex-list-item';
             eD.onclick = () => {
                 codexEntryTextElement.innerHTML = `<strong>${e.title}</strong><hr style="margin:5px 0;border-color:#4a4a6a;"><p>${e.text.replace(/\n/g,'<br>')}</p>`;
                 document.querySelectorAll('#codexEntries .codex-list-item').forEach(el => el.classList.remove('active'));
                 eD.classList.add('active');
             };
             codexEntriesElement.appendChild(eD);
         }
     });
 }

 /**
  * Selects a random, valid mission destination from the LOCATIONS_DATA.
  * Ensures the destination is not the same as the starting station.
  * @param {string} currentStationName - The name of the station generating the mission.
  * @returns {object|null} A location object {name, key, coords} or null if no valid destination is found.
  */
 function selectRandomDestination(currentStationName) {
     const allLocationKeys = Object.keys(LOCATIONS_DATA);
     const possibleDestinations = allLocationKeys.filter(key => key !== currentStationName);

     if (possibleDestinations.length === 0) return null;

     const destinationKey = possibleDestinations[Math.floor(Math.random() * possibleDestinations.length)];
     const destinationData = LOCATIONS_DATA[destinationKey];

     // Note: This assumes all locations are in sector 0,0 for now. 
     // This can be expanded later if locations are added to other sectors.
     return {
         name: destinationKey,
         key: "0,0",
         coords: destinationData.coords
     };
 }

 /**
  * Selects a random commodity that a specific location buys.
  * @param {string} locationName - The name of the location.
  * @returns {string|null} The ID of a commodity or null.
  */
 function selectRandomCommodity(locationName) {
     const location = LOCATIONS_DATA[locationName];
     if (!location || !location.buys || location.buys.length === 0) return null;

     const commodity = location.buys[Math.floor(Math.random() * location.buys.length)];
     return commodity.id;
 }

 function activateDistressBeacon() {
     if (playerFuel > 0) {
         logMessage("Fuel systems operational. Distress beacon disabled.");
         return;
     }

     if (currentCombatContext) {
         logMessage("Cannot activate beacon during combat!");
         return;
     }

     // The Penalty: 20% of Credits (min 100) and some XP
     const creditPenalty = Math.max(100, Math.floor(playerCredits * 0.20));

     logMessage("Distress Signal broadcasting...");

     setTimeout(() => {
         playerCredits = Math.max(0, playerCredits - creditPenalty);
         playerFuel = Math.floor(MAX_FUEL * 0.5); // Refuel to 50%
         playerXP = Math.max(0, playerXP - 50); // XP Penalty

         logMessage(`<span style="color:#00E0E0">Towing Vessel Arrived.</span>`);
         logMessage(`You were towed to a safe distance and refueled.`);
         logMessage(`Payment deducted: ${creditPenalty} credits.`);

         renderUIStats();
     }, 1500); // Small delay for dramatic effect
 }

 function generateMissionsForStation(stationName) {
     const generatedMissions = [];
     const availableTemplates = MISSION_TEMPLATES.filter(t => playerLevel >= (t.prerequisites.minLevel || 1));
     const numMissionsToGenerate = 2 + Math.floor(Math.random() * 2);

     for (let i = 0; i < numMissionsToGenerate && availableTemplates.length > 0; i++) {

         try {
             // Select a weighted random template from the available ones
             const chosenTemplate = getWeightedRandomOutcome(availableTemplates);

             // Crucial fix: Make a deep copy of the template to avoid side-effects
             let newMission = JSON.parse(JSON.stringify(chosenTemplate));

             newMission.id = `${newMission.id_prefix}${i}_${Date.now()}`;
             newMission.giver = stationName;

             // Get the first objective template and ensure it's a fresh copy
             const objective = newMission.objective_templates[0];

             let success = true;

             // Configure the mission details and build strings from templates
             switch (newMission.type) {
                 case "BOUNTY":
                     const pirateCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));
                     objective.count = pirateCount;
                     newMission.title = newMission.title_template.replace('{sectorName}', currentSectorName);
                     newMission.description = newMission.description_template
                         .replace('{sectorName}', currentSectorName)
                         .replace('{sectorCoords}', `(${currentSectorX},${currentSectorY})`)
                         .replace('{count}', objective.count);
                     break;
                 case "DELIVERY": {
                     const destination = selectRandomDestination(stationName);
                     if (!destination) {
                         success = false;
                         break;
                     }

                     const deliveryItem = selectRandomCommodity(destination.name);
                     if (!deliveryItem) {
                         success = false;
                         break;
                     }

                     const itemCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));

                     objective.destinationName = destination.name;
                     objective.destinationSectorKey = destination.key;
                     objective.itemID = deliveryItem;
                     objective.count = itemCount;

                     newMission.title = newMission.title_template.replace('{destinationName}', objective.destinationName);
                     newMission.description = newMission.description_template
                         .replace('{destinationName}', objective.destinationName)
                         .replace('{count}', objective.count)
                         .replace('{itemName}', COMMODITIES[deliveryItem].name);
                     break;
                 }
                 case "ACQUIRE": {
                     const acquireItem = selectRandomCommodity(stationName);
                     if (!acquireItem) {
                         success = false;
                         break;
                     }

                     const itemCount = objective.count[0] + Math.floor(Math.random() * (objective.count[1] - objective.count[0] + 1));

                     objective.itemID = acquireItem;
                     objective.count = itemCount;

                     newMission.title = newMission.title_template.replace('{itemName}', COMMODITIES[acquireItem].name);
                     newMission.description = newMission.description_template
                         .replace('{count}', objective.count)
                         .replace('{itemName}', COMMODITIES[acquireItem].name);
                     break;
                 }
                 case "SURVEY":
                     objective.targetType = 'anomaly';
                     objective.subtype = 'unstable warp pocket';
                     objective.sectorKey = "ANY";
                     newMission.title = newMission.title_template.replace('{subtype}', objective.subtype);
                     newMission.description = newMission.description_template.replace('{subtype}', objective.subtype);
                     break;
                 default:
                     success = false;
             }

             // Set the final objectives on the new mission object
             newMission.objectives = [objective];

             // Randomize rewards and assign them
             newMission.rewards.credits = newMission.rewards_template.credits[0] + Math.floor(Math.random() * (newMission.rewards_template.credits[1] - newMission.rewards_template.credits[0] + 1));
             newMission.rewards.xp = newMission.rewards_template.xp[0] + Math.floor(Math.random() * (newMission.rewards_template.xp[1] - newMission.rewards_template.xp[0] + 1));
             newMission.rewards.notoriety = newMission.rewards_template.notoriety[0] + Math.floor(Math.random() * (newMission.rewards_template.notoriety[1] - newMission.rewards_template.notoriety[0] + 1));

             if (success) {
                 generatedMissions.push(newMission);
             }
         } catch (error) {
             console.error("Failed to generate a mission:", error);
         }
     }
     return generatedMissions;
 }

 function displayMissionBoard() {
     // Get location data from the chunkManager
     const location = chunkManager.getTile(playerX, playerY);

     if (!location || location.type !== 'location' || !location.isMajorHub) {
         logMessage("Mission board not accessible here.");
         return;
     }

     const stationName = location.name;
     let stationMissions = MISSIONS_DATABASE[stationName];

     if (!stationMissions) {
         // We'll need to update mission generation later, but this will work for now
         stationMissions = generateMissionsForStation(stationName);
         MISSIONS_DATABASE[stationName] = stationMissions;
     }

     missionsAvailableAtStation = [];

     (stationMissions || []).forEach(mission => {
         if (!playerCompletedMissions.has(mission.id) && (!playerActiveMission || playerActiveMission.id !== mission.id)) {
             let meetsPrereqs = true;
             if (mission.prerequisites) {
                 if (mission.prerequisites.minLevel && playerLevel < mission.prerequisites.minLevel) {
                     meetsPrereqs = false;
                 }
             }
             if (meetsPrereqs) {
                 missionsAvailableAtStation.push(mission);
             }
         }
     });

     let missionMsg = `--- ${stationName} Mission Board ---\n`;
     if (playerActiveMission) {
         missionMsg += `Current Active Mission: ${playerActiveMission.title}\n(Complete or abandon current mission to accept a new one.)\n\n`;
     }

     if (missionsAvailableAtStation.length === 0) {
         missionMsg += "No new missions currently available.\n";
     } else {
         missionMsg += "Available Contracts:\n";
         missionsAvailableAtStation.forEach((mission, index) => {
             missionMsg += `${index + 1}. ${mission.title} - Reward: ${mission.rewards.credits}c, ${mission.rewards.xp}XP\n`;
         });
     }

     missionMsg += "Enter # to view details, or (L) to leave.";

     currentMissionContext = {
         step: 'selectMission',
         availableMissions: missionsAvailableAtStation,
         stationName: stationName
     };
     logMessage(missionMsg);
 }

 function displayMissionDetails(selectedIndex) {
     if (!currentMissionContext || currentMissionContext.step !== 'selectMission' || !currentMissionContext.availableMissions) {

         displayMissionBoard();
         return;
     }

     const mission = currentMissionContext.availableMissions[selectedIndex];
     if (!mission) {
         logMessage("Invalid mission selection.");
         displayMissionBoard();
         return;
     }

     let detailMsg = `--- Mission Briefing: ${mission.title} ---\n`;
     detailMsg += `From: ${mission.giver}\n\n`;
     detailMsg += `Description:\n${mission.description}\n\n`;
     detailMsg += `Objectives:\n`;

     mission.objectives.forEach(obj => {
         // NEW: Improved, more generic text
         if (obj.type === "ELIMINATE") {
             let locationText = (obj.targetSectorKey === "CURRENT") ? "in this system" : "in any system";
             detailMsg += ` - Eliminate ${obj.count} ${obj.targetName}(s) ${locationText}.\n`;
         } else if (obj.type === "DELIVERY") {
             detailMsg += ` - Deliver ${obj.count} ${COMMODITIES[obj.itemID].name} to ${obj.destinationName}.\n`;
         } else if (obj.type === "SCAN_OBJECT") {
             detailMsg += ` - Scan a ${obj.subtype} ${obj.targetType} in any system.\n`;
         }
     });

     detailMsg += `\nRewards: ${mission.rewards.credits} Credits, ${mission.rewards.xp} XP, ${mission.rewards.notoriety} Notoriety.\n\n`;

     if (playerActiveMission) {
         detailMsg += "\n<span style='color:yellow;'>Note: You must complete or abandon your current mission before accepting this one.</span>\n";
         detailMsg += "\n(L) to go back to mission board.";
         currentMissionContext.step = 'viewOnlyDetails';
     } else {
         detailMsg += "Accept this mission? (Y/N) or (L) to go back.";
         currentMissionContext.step = 'confirmMission';
     }

     currentMissionContext.selectedMission = mission;
     logMessage(detailMsg);
 }

 function acceptMission() {
     if (!currentMissionContext || currentMissionContext.step !== 'confirmMission' || !currentMissionContext.selectedMission) {
         displayMissionBoard();
         return;
     }

     if (playerActiveMission) {
         logMessage("You already have an active mission. Complete or abandon it first.");
         displayMissionBoard();
         return;
     }

     playerActiveMission = JSON.parse(JSON.stringify(currentMissionContext.selectedMission));
     playerActiveMission.isComplete = false;
     playerActiveMission.progress = {};
     playerActiveMission.objectives.forEach((obj, index) => {

         const progressKeyBase = obj.type.toLowerCase();

         if (obj.type === "ELIMINATE") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 current: 0,
                 required: obj.count,
                 targetName: obj.targetName,
                 targetSectorKey: obj.targetSectorKey,
                 complete: false
             };
         } else if (obj.type === "SURVEY") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 scanned: false,
                 targetType: obj.targetType,
                 subtype: obj.subtype,
                 sectorKey: obj.sectorKey,
                 complete: false
             };
         } else if (obj.type === "DELIVERY") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 delivered: 0,
                 required: obj.count,
                 itemID: obj.itemID,
                 destinationName: obj.destinationName,
                 destinationSectorKey: obj.destinationSectorKey,
                 complete: false
             };
         } else if (obj.type === "ACQUIRE") {
             playerActiveMission.progress[`${progressKeyBase}_${index}`] = {
                 acquired: 0,
                 required: obj.count,
                 itemID: obj.itemID,
                 complete: false
             };
         }
     });
     logMessage(`Mission Accepted: ${playerActiveMission.title}`);
     currentMissionContext = null;
     handleInteraction();
     renderMissionTracker(); // Mission tracker updated here
 }

 /**
  * Handles turning in resources for an ACQUIRE mission at the giver's station.
  */
 function handleTurnInAcquire() {
     if (!playerActiveMission || playerActiveMission.type !== "ACQUIRE" || playerActiveMission.isComplete) {
         logMessage("No active acquisition mission to turn in here.");
         return;
     }

     const objective = playerActiveMission.objectives[0]; // Assuming one acquire objective
     const progressKey = `acquire_0`;
     const objectiveProgress = playerActiveMission.progress[progressKey];

     if (playerCargo[objective.itemID] >= objective.count) {
         // We have enough!
         playerCargo[objective.itemID] -= objective.count;
         updateCurrentCargoLoad();
         objectiveProgress.complete = true;
         logMessage(`Turned in ${objective.count} ${COMMODITIES[objective.itemID].name} to ${playerActiveMission.giver}.`);
         checkMissionObjectiveCompletion(); // This will set the mission to isComplete = true
     } else {
         // Not enough items
         logMessage(`You don't have enough ${COMMODITIES[objective.itemID].name}. Required: ${objective.count}, You have: ${playerCargo[objective.itemID] || 0}.`);
     }

     handleInteraction(); // Refresh docked message
     renderMissionTracker(); // Update the mission tracker UI
 }

 function handleCompleteDelivery() {
     if (!playerActiveMission || playerActiveMission.type !== "DELIVERY" || playerActiveMission.isComplete) {
         logMessage("No active delivery to complete here.");
         return;
     }
     const currentLocation = getCombinedLocationData(playerY, playerX);
     if (!currentLocation) {
         logMessage("Error: Not currently at a recognized location.");
         return;
     }
     let deliveryMade = false;
     playerActiveMission.objectives.forEach((obj, index) => {
         if (obj.type === "DELIVERY") {
             const progressKey = `delivery_${index}`;
             const objectiveProgress = playerActiveMission.progress[progressKey];
             if (objectiveProgress && !objectiveProgress.complete &&
                 currentLocation.name === obj.destinationName) {

                 if (playerCargo[obj.itemID] >= obj.count) {
                     playerCargo[obj.itemID] -= obj.count;
                     updateCurrentCargoLoad();
                     objectiveProgress.delivered = obj.count; // Mark this objective's delivery as done
                     objectiveProgress.complete = true;
                     logMessage(`Delivered ${obj.count} ${COMMODITIES[obj.itemID].name} to ${obj.destinationName}.`, true);
                     deliveryMade = true;
                 } else {
                     logMessage(`You don't have enough ${COMMODITIES[obj.itemID].name}. Required: ${obj.count}, You have: ${playerCargo[obj.itemID] || 0}.`, true);
                 }
             }
         }
     });
     if (deliveryMade) {
         checkMissionObjectiveCompletion();
     }
     handleInteraction(); // Refresh docked message
     renderMissionTracker(); // Mission tracker updated here
 }

 function checkMissionObjectiveCompletion() {
     if (!playerActiveMission || playerActiveMission.isComplete) return false;
     let allObjectivesNowComplete = true;
     for (let i = 0; i < playerActiveMission.objectives.length; i++) {
         const objective = playerActiveMission.objectives[i];
         const progressKey = `${objective.type.toLowerCase()}_${i}`;
         const objectiveProgress = playerActiveMission.progress[progressKey];
         if (!objectiveProgress || !objectiveProgress.complete) {
             allObjectivesNowComplete = false;
             break;
         }
     }
     if (allObjectivesNowComplete && !playerActiveMission.isComplete) {
         playerActiveMission.isComplete = true;
         logMessage(`All objectives for '${playerActiveMission.title}' complete!\nReturn to ${playerActiveMission.giver} to claim your reward.`, true);
         // No need to call  here, updateMessage will trigger it via handleInteraction or next player input
     }
     return allObjectivesNowComplete;
 }

 function grantMissionRewards() {
     if (!playerActiveMission || !playerActiveMission.isComplete) return;
     const currentLocation = getCombinedLocationData(playerY, playerX);
     if (!currentLocation || currentLocation.name !== playerActiveMission.giver) {
         logMessage("You must be at " + playerActiveMission.giver + " to claim this reward.");
         return;
     }
     const mission = playerActiveMission;
     playerCredits += mission.rewards.credits;
     playerXP += mission.rewards.xp;
     updatePlayerNotoriety(mission.rewards.notoriety);
     playerCompletedMissions.add(mission.id);
     let rewardMsg = `Mission '${mission.title}' Complete!\nRewards:\n  +${mission.rewards.credits} Credits\n  +${mission.rewards.xp} XP`;

     if (mission.rewards.notoriety !== 0) {
         rewardMsg += `\n  Notoriety ${mission.rewards.notoriety > 0 ? '+' : ''}${mission.rewards.notoriety}`;
     }

     playerActiveMission = null;
     currentMissionContext = null;
     logMessage(rewardMsg);
     checkLevelUp();
     handleInteraction();
     renderMissionTracker(); // Mission tracker updated here
 }

 function triggerRandomEvent() {
     const events = [{
             text: "You spot a drifting fuel canister.",
             effect: () => {
                 const amount = 10 + Math.floor(Math.random() * 20);
                 playerFuel = Math.min(MAX_FUEL, playerFuel + amount);
                 logMessage(`<span style="color:#00E0E0">Lucky Find:</span> Refueled ${amount} units from salvage.`);
             }
         },
         {
             text: "You intercept a fragmented credit transfer.",
             effect: () => {
                 const amount = 25 + Math.floor(Math.random() * 75);
                 playerCredits += amount;
                 logMessage(`<span style="color:#FFD700">Lucky Find:</span> Decrypted ${amount} credits.`);
             }
         },
         {
             text: "You scan an ancient navigation buoy.",
             effect: () => {
                 const amount = 15;
                 playerXP += amount;
                 logMessage(`<span style="color:#00FF00">Lucky Find:</span> Downloaded nav data. +${amount} XP.`);
                 checkLevelUp();
             }
         }
     ];

     const event = events[Math.floor(Math.random() * events.length)];
     event.effect();

     // We still call handleInteraction so you see where you are (e.g. "Empty Space")
     handleInteraction();
 }

 function handleCodexInput(key) {
     if (key === 'escape' || key === 'j') {
         toggleCodex(false);
     }
     // We always "handle" input when the codex is open
     return true;
 }

 function handleCargoViewInput(key) {
     // Any key closes the cargo view
     currentOutfitContext = null;
     handleInteraction();
     return true;
 }

 function handleMissionInput(key) {
     if (currentMissionContext.step === 'selectMission') {
         const selection = parseInt(key);
         if (!isNaN(selection) && selection > 0 && selection <= currentMissionContext.availableMissions.length) {
             displayMissionDetails(selection - 1);
         } else if (key === 'l') {
             currentMissionContext = null;
             handleInteraction();
         }
     } else if (currentMissionContext.step === 'confirmMission') {
         if (key === 'y') {
             if (!playerActiveMission) {
                 acceptMission();
             } else {
                 logMessage("Cannot accept: Another mission is already active.");
                 displayMissionBoard();
             }
         } else if (key === 'n' || key === 'l') {
             displayMissionBoard();
         }
     } else if (currentMissionContext.step === 'viewOnlyDetails' || currentMissionContext.step === 'noMissions') {
         if (key === 'l') {
             currentMissionContext = null;
             handleInteraction();
         }
     }
     // We always "handle" input when the mission board is open
     return true;
 }

 function handleOutfitInput(key) {
     if (currentOutfitContext.step === 'selectSlot') {
         if (key === '1') displayComponentsForSlot('weapon');
         else if (key === '2') displayComponentsForSlot('shield');
         else if (key === '3') displayComponentsForSlot('engine');
         else if (key === '4') displayComponentsForSlot('scanner');
         else if (key === 'l') {
             currentOutfitContext = null;
             handleInteraction();
         }
     } else if (currentOutfitContext.step === 'selectComponent') {
         const selection = parseInt(key);
         if (!isNaN(selection) && selection > 0 && selection <= currentOutfitContext.availableComponents.length) {
             buyComponent(currentOutfitContext.availableComponents[selection - 1].id);
         } else if (key === 'l') {
             displayOutfittingScreen();
         }
     }
     // We always "handle" input when the outfitter is open
     return true;
 }

function handleTradeInput(key) {
    // 1. Check for Exit Keys
    // We allow 'Escape' or 'l' (Leave) to close the modal instantly
    if (key === 'escape' || key === 'l') {
        closeTradeModal();
        return true;
    }

    // 2. Block Other Inputs
    // Since the actual trading (typing numbers, clicking buy) happens via 
    // HTML clicks and inputs, we don't need to handle keys here.
    // We simply return true to tell the game: 
    // "We are in a menu, do NOT move the ship with WASD."
    return true;
}

 function handleShipyardInput(key) {
     if (currentShipyardContext.step === 'selectShip') {
         const selection = parseInt(key);
         if (!isNaN(selection) && selection > 0 && selection <= currentShipyardContext.availableShips.length) {
             displayShipPurchaseConfirmation(currentShipyardContext.availableShips[selection - 1].id);
         } else if (key === 'l') {
             currentShipyardContext = null;
             handleInteraction();
         }
     } else if (currentShipyardContext.step === 'confirmPurchase') {
         if (key === 'y') {
             buyShip();
         } else if (key === 'n' || key === 'l') {
             displayShipyard();
         }
     }
     // We always "handle" input when the shipyard is open
     return true;
 }

 function handleCombatInput(key) {
     if (!currentCombatContext) return false;

     // Map keys to actions
     switch (key) {
         case 'z':
             activateDistressBeacon();
             return true;
         case 'f': // Fight
             handleCombatAction('fight');
             return true;
         case 'c': // Charge
             // Only allow if not already charging
             if (!playerIsChargingAttack) handleCombatAction('charge');
             else logMessage("Weapon already charged!");
             return true;
         case 'e': // Evade
             // Check fuel locally to give feedback, or just let handleCombatAction do it
             if (playerFuel >= EVASION_FUEL_COST) handleCombatAction('evade');
             else logMessage("Not enough fuel to evade!");
             return true;
         case 'r': // Run
             if (playerFuel >= RUN_FUEL_COST) handleCombatAction('run');
             else logMessage("Not enough fuel to run!");
             return true;
     }
     return false;
 }

 function handleGalacticMapInput(key) {
     // --- 1. DOCKED ACTIONS ---
     const currentLocation = getCombinedLocationData(playerY, playerX);
     if (currentLocation) {
         switch (key) {
             case 'b':
                openTradeModal('buy'); // Changed from displayTradeScreen
                return true;
            case 's':
                openTradeModal('sell'); // Changed from displayTradeScreen
                return true;
             case 'o':
                 if (currentLocation.isMajorHub) {
                     displayOutfittingScreen();
                     return true;
                 }
                 break; // Not a major hub, might be a movement key
             case 'k':
                 if (currentLocation.isMajorHub) {
                     displayMissionBoard();
                     return true;
                 }
                 break; // Not a major hub
             case 'y':
                 if (currentLocation.isMajorHub) {
                     displayShipyard();
                     return true;
                 }
                 break; // Not a major hub
             case 'c':
                 if (playerActiveMission && playerActiveMission.type === "DELIVERY") {
                     handleCompleteDelivery();
                     return true;
                 }
                 break; // No delivery
             case 'g':
                 if (playerActiveMission && playerActiveMission.isComplete && currentLocation.name === playerActiveMission.giver) {
                     grantMissionRewards();
                     return true;
                 }
                 // --- ADD THIS BLOCK ---
                 if (playerActiveMission && playerActiveMission.type === "ACQUIRE" && !playerActiveMission.isComplete && currentLocation.name === playerActiveMission.giver) {
                     handleTurnInAcquire();
                     return true;
                 }
                 // --- END BLOCK ---
                 break; // No reward or turn-in

             case 'r':
                 if (playerHull < MAX_PLAYER_HULL) {
                     repairShip();
                     return true;
                 }
                 break; // Not damaged, or 'r' might be used for something else in space

             case 'l':
                 handleInteraction();
                 return true;
         }
         // If we are here, we are docked but didn't press a valid docked key.
         // We still check for movement/global keys below.
     }

     // --- 2. IN-SPACE & GLOBAL ACTIONS ---
     let dx = 0,
         dy = 0;
     switch (key) {
         case 'w':
         case 'arrowup':
             dy = -1;
             break;
         case 's':
         case 'arrowdown':
             dy = 1;
             break;
         case 'a':
         case 'arrowleft':
             dx = -1;
             break;
         case 'd':
         case 'arrowright':
             dx = 1;
             break;
         case 'e':
             const currentTile = chunkManager.getTile(playerX, playerY);
             const tileChar = getTileChar(currentTile);

             triggerSensorPulse();

             if (tileChar === STAR_CHAR_VAL) {
                 currentSystemData = generateStarSystem(playerX, playerY);
                 selectedPlanetIndex = -1;

                 // Use the centralized function to ensure scrollbars update
                 changeGameState(GAME_STATES.SYSTEM_MAP);

                 logMessage(`Entering ${currentSystemData.name}...`);
             } else {
                 setTimeout(() => {
                     scanLocation();
                 }, 300);
             }
             return true;
         case 'h':
             scoopHydrogen();
             return true;
         case 'm':
             mineAsteroid();
             return true;
         case 'j':
             toggleCodex(true);
             return true;
         case 'i':
             displayCargoHold();
             return true;
         case 't':
             const tileForWormhole = chunkManager.getTile(playerX, playerY);
             if (getTileType(tileForWormhole) === 'wormhole') traverseWormhole();
             else logMessage("No wormhole here.");
             return true;
         case '.': // The Period key
             logMessage("Holding position. Systems recharging...");
             advanceGameTime(0.15); // Pass time to allow shield regen
             render(); // Update the screen
             return true;
         case 'f6':
             saveGame();
             return true;
         case 'f7':
             loadGame();
             return true;
         default:
             // Not a recognized global key
             if (dx === 0 && dy === 0) return false; // Not handled
     }

     if (dx !== 0 || dy !== 0) {
         movePlayer(dx, dy);
     }
     return true; // Handled movement
 }

 function handleSystemMapInput(key) {
     if (key === 'e') {
         if (selectedPlanetIndex !== -1) {
             examinePlanet(selectedPlanetIndex);
         } else {
             logMessage("No planet selected. Click one to select it.");
         }
     } else if (key === 'l') {
         // Use the centralized function
         changeGameState(GAME_STATES.GALACTIC_MAP);

         selectedPlanetIndex = -1;
         handleInteraction();
     }
     return true;
 }

 function handlePlanetViewInput(key) {
     if (key === 'l') {
         returnToOrbit();
     }
     // We always "handle" input in the planet view
     return true;
 }

 document.addEventListener('keydown', function(event) {
     const key = event.key.toLowerCase();

     if (currentGameState === GAME_STATES.TITLE_SCREEN) return;

     let inputHandled = false;

     // --- 1. Top-level "Blocking" Contexts (Menus, Overlays, etc.) ---
     // These take priority over game states.
     if (codexOverlayElement.style.display === 'flex') {
         inputHandled = handleCodexInput(key);
     } else if (currentOutfitContext && currentOutfitContext.step === 'viewingCargo') {
         inputHandled = handleCargoViewInput(key);
     } else if (currentMissionContext) {
         inputHandled = handleMissionInput(key);
     } else if (currentOutfitContext) {
         inputHandled = handleOutfitInput(key);
     } else if (currentTradeContext) {
         inputHandled = handleTradeInput(key);
     } else if (currentShipyardContext) {
         inputHandled = handleShipyardInput(key);
     }

     // --- 2. Game State Contexts ---
     // If no menu was open, check the core game state.
     else if (currentGameState === GAME_STATES.COMBAT) {
         inputHandled = handleCombatInput(key);
     } else if (currentGameState === GAME_STATES.GALACTIC_MAP) {
         inputHandled = handleGalacticMapInput(key);
     } else if (currentGameState === GAME_STATES.SYSTEM_MAP) {
         inputHandled = handleSystemMapInput(key);
     } else if (currentGameState === GAME_STATES.PLANET_VIEW) {
         inputHandled = handlePlanetViewInput(key);
     }

     // --- 3. Prevent Default ---
     // If we determined the input was for the game, prevent
     // the browser from doing anything with it (like scrolling).
     if (inputHandled) {
         event.preventDefault();
     }
 });

 // --- Theme Toggle Function ---
 function toggleTheme() {
     const body = document.body;
     const isLight = body.classList.toggle('light-mode');
     const themeBtn = document.getElementById('themeButton');

     // Update button text
     themeBtn.textContent = isLight ? "Dark Mode" : "Light Mode";

     // Save preference
     localStorage.setItem('wayfinderTheme', isLight ? 'light' : 'dark');
 }

 // --- Initialization & Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Managers
    chunkManager.initializeStaticLocations();

    // 2. Setup DOM Elements
    messageAreaElement = document.getElementById('messageArea');
    fuelStatElement = document.getElementById('fuelStat');
    creditsStatElement = document.getElementById('creditsStat');
    cargoStatElement = document.getElementById('cargoStat');
    shieldsStatElement = document.getElementById('shieldsStat');
    hullStatElement = document.getElementById('hullStat');
    sectorNameStatElement = document.getElementById('sectorNameStat');
    sectorCoordsStatElement = document.getElementById('sectorCoordsStat');
    levelXpStatElement = document.getElementById('levelXpStat');
    shipClassStatElement = document.getElementById('shipClassStat');
    notorietyStatElement = document.getElementById('notorietyStat');
    codexOverlayElement = document.getElementById('codexOverlay');
    codexCategoriesElement = document.getElementById('codexCategories');
    codexEntriesElement = document.getElementById('codexEntries');
    codexEntryTextElement = document.getElementById('codexEntryText');
    stardateStatElement = document.getElementById('stardateStat');
    saveButtonElement = document.getElementById('saveButton');
    loadButtonElement = document.getElementById('loadButton');
    const themeButtonElement = document.getElementById('themeButton');
    

    // 3. Setup Canvas with High DPI Support
    gameCanvas = document.getElementById('gameCanvas');
    ctx = gameCanvas.getContext('2d');

    // Get the device pixel ratio (1 on standard, 2+ on retina/phones)
    const dpr = window.devicePixelRatio || 1;

    // Set internal resolution to match screen density
    gameCanvas.width = MAP_WIDTH * TILE_SIZE * dpr;
    gameCanvas.height = MAP_HEIGHT * TILE_SIZE * dpr;

    // Setup System Menu Toggle
    const menuBtn = document.getElementById('menuToggle');
    const sysMenu = document.getElementById('systemMenu');
    
    menuBtn.addEventListener('click', () => {
        sysMenu.classList.toggle('hidden');
    });

    // Close menu if clicking outside
    document.addEventListener('click', (e) => {
        if (!sysMenu.contains(e.target) && e.target !== menuBtn) {
            sysMenu.classList.add('hidden');
        }
    });

    // Scale drawing operations so logic still uses 1.0 coordinates
    ctx.scale(dpr, dpr);

    // Reset styles to let CSS control layout
    gameCanvas.style.width = '';
    gameCanvas.style.height = '';
    gameCanvas.style.imageRendering = "pixelated"; // Crisp retro look

    // --- FONT & ALIGNMENT CONFIGURATION (The Centering Fix) ---
    // textBaseline 'middle' ensures the @ and stars render in the vertical center of the tile
    ctx.font = `bold ${TILE_SIZE}px 'Roboto Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; 

    // 4. Setup Button Listeners
    saveButtonElement.addEventListener('click', saveGame);
    loadButtonElement.addEventListener('click', loadGame);
    themeButtonElement.addEventListener('click', toggleTheme);
    document.getElementById("codexCloseButton").addEventListener("click", () => toggleCodex(false));
    document.getElementById('closeTradeBtn').addEventListener('click', closeTradeModal);

    // Title Screen Buttons
    const startButton = document.getElementById('startButton');
    
    const seedInput = document.getElementById('seedInput');

    startButton.addEventListener('click', () => startGame(seedInput.value));
    seedInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') startGame(seedInput.value);
    });

    // PFP Customization
    const pfpImage = document.getElementById('pfpImage');
    const prevPfpBtn = document.getElementById('prevPfpBtn');
    const nextPfpBtn = document.getElementById('nextPfpBtn');
    const pfpOptions = [
        'assets/pfp_01.png', 'assets/pfp_02.png', 'assets/pfp_03.png',
        'assets/pfp_04.png', 'assets/pfp_05.png', 'assets/pfp_06.png'
    ];
    let currentPfpIndex = 0;

    function updatePfp() {
        playerPfp = pfpOptions[currentPfpIndex];
        pfpImage.src = playerPfp;
    }
    prevPfpBtn.addEventListener('click', () => {
        currentPfpIndex = (currentPfpIndex - 1 + pfpOptions.length) % pfpOptions.length;
        updatePfp();
    });
    nextPfpBtn.addEventListener('click', () => {
        currentPfpIndex = (currentPfpIndex + 1) % pfpOptions.length;
        updatePfp();
    });

    // 5. Apply Saved Theme Preference
    const savedTheme = localStorage.getItem('wayfinderTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeButtonElement.textContent = "Dark Mode";
    }

    window.addEventListener('resize', () => {
        // Recalculate dimensions
        const newDpr = window.devicePixelRatio || 1;
        gameCanvas.width = MAP_WIDTH * TILE_SIZE * newDpr;
        gameCanvas.height = MAP_HEIGHT * TILE_SIZE * newDpr;
        
        // Reset Context settings because resizing wipes them
        ctx.scale(newDpr, newDpr);
        ctx.imageRendering = "pixelated";
        ctx.font = `bold ${TILE_SIZE}px 'Roboto Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; 
        
        // Force a redraw
        render();
    });

    // 6. Initialize Game Logic (Now safely uses the Canvas setup above)
    initializeGame();
});
