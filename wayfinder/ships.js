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
     VOID_SKIFF: {
        name: "Void-Skiff",
        baseHull: 50,
        cargoCapacity: 15,
        baseCost: 2500, // Very cheap
        description: "Little more than a pressurized cockpit strapped to an engine. Fast, terrifyingly fragile, and favored by adrenaline junkies.",
        loreKey: "LORE_SHIP_VOID_SKIFF"
    },
    ROCK_HOPPER: {
        name: "Rock-Hopper",
        baseHull: 180,
        cargoCapacity: 150,
        baseCost: 22000,
        description: "An industrial mining barge. Slow and ugly, but built like a tank and holds a mountain of ore.",
        loreKey: "LORE_SHIP_ROCK_HOPPER"
    },
    STAR_GALLEON: {
        name: "Star-Galleon",
        baseHull: 200,
        cargoCapacity: 80,
        baseCost: 50000, // Endgame goal
        description: "The pinnacle of luxury and defense. Used by diplomats and warlords who prefer to travel in absolute safety.",
        loreKey: "LORE_SHIP_STAR_GALLEON"
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
         weight: 5
     },
     STRIKER: {
         name: "Striker",
         baseHull: 45,
         baseShields: 35,
         weight: 3 
     },
     BRUISER: {
         name: "Bruiser",
         baseHull: 80,
         baseShields: 15,
         weight: 1 
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
