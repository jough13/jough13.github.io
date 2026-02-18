 // --- Game Configuration ---

 // STARTING VALUES (Based on Light Freighter + Standard Drive Mk1)
let MAX_FUEL = 220; 
let PLAYER_CARGO_CAPACITY = 50; 
let MAX_SHIELDS = 50; 
let MAX_PLAYER_HULL = 100; 
let playerHull = 100;

 const GAME_VERSION = "v0.9.5";
 const MAP_WIDTH = 40;  
 const MAP_HEIGHT = 22; 
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

let autoSaveInterval = null;
const AUTOSAVE_DELAY = 60000; // 60 seconds

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

 const PLAYER_PORTRAITS = [
    "assets/pfp_01.png", 
    "assets/pfp_02.png",
    "assets/pfp_03.png",
    "assets/pfp_04.png", 
    "assets/pfp_05.png",
    "assets/pfp_06.png"
];
