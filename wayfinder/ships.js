// --- Ship Classes Database ---
 const SHIP_CLASSES = {
     LIGHT_FREIGHTER: {
         name: "Light Freighter",
         image: "assets/light_freighter.png",
         baseHull: 100,
         cargoCapacity: 50,
         baseCost: 0, 
         description: "A reliable, jack-of-all-trades vessel.",
         loreKey: "LORE_SHIP_LIGHT_FREIGHTER",
         ability: {
             name: "Emergency Patch",
             desc: "Restores 25 Hull instantly.",
             id: "REPAIR",
             cooldown: 6
         }
     },
     COURIER: {
        name: "Courier",
        baseHull: 115,
        cargoCapacity: 65,
        baseCost: 6500,
        description: "A professional vessel balancing speed and durability.",
        loreKey: "LORE_SHIP_COURIER",
        ability: {
            name: "Precision Burn",
            desc: "Increases evasion and guarantees the next hit.",
            id: "ACCURACY_BOOST",
            cooldown: 5
        }
    },
     INTERCEPTOR: {
         name: "Interceptor",
         image: "assets/interceptor.png",
         baseHull: 75,
         cargoCapacity: 20,
         baseCost: 8000,
         description: "Built for speed and combat agility.",
         loreKey: "LORE_SHIP_INTERCEPTOR",
         ability: {
             name: "Afterburner",
             desc: "Guarantees evasion for 1 turn.",
             id: "DODGE",
             cooldown: 4
         }
     },
     EXPLORER: {
         name: "Explorer",
         image: "assets/explorer.png",
         baseHull: 120,
         cargoCapacity: 40,
         baseCost: 10000,
         description: "Long-range vessel with advanced sensors.",
         loreKey: "LORE_SHIP_EXPLORER",
         ability: {
             name: "Sensor Blind",
             desc: "Stuns enemy for 1 turn (No attack).",
             id: "STUN",
             cooldown: 5
         }
     },
     VOID_SKIFF: {
        name: "Void-Skiff",
        baseHull: 50,
        cargoCapacity: 15,
        baseCost: 2500,
        description: "Fast, fragile, and cheap.",
        loreKey: "LORE_SHIP_VOID_SKIFF",
        ability: {
             name: "Overload",
             desc: "Next attack deals double damage.",
             id: "CRIT",
             cooldown: 5
         }
    },
    ROCK_HOPPER: {
        name: "Rock-Hopper",
        baseHull: 180,
        cargoCapacity: 150,
        baseCost: 22000,
        description: "Industrial mining barge. Tough but slow.",
        loreKey: "LORE_SHIP_ROCK_HOPPER",
        ability: {
             name: "Shield Hardening",
             desc: "Fully restores Shields.",
             id: "SHIELD_BOOST",
             cooldown: 8
         }
    },
    STAR_GALLEON: {
        name: "Star-Galleon",
        baseHull: 200,
        cargoCapacity: 80,
        baseCost: 50000,
        description: "The pinnacle of luxury and defense.",
        loreKey: "LORE_SHIP_STAR_GALLEON",
        ability: {
             name: "Diplomatic Immunity",
             desc: "Instantly ends combat (Escape).",
             id: "ESCAPE",
             cooldown: 10
         }
    },
     HEAVY_HAULER: {
         name: "Heavy Hauler",
         baseHull: 150,
         cargoCapacity: 120,
         baseCost: 15000,
         description: "A veritable fortress with massive cargo holds.",
         loreKey: "LORE_SHIP_HEAVY_HAULER",
         ability: {
             name: "Reinforce Structure",
             desc: "Reduces incoming damage by 50% for 3 turns.",
             id: "DEFENSE_UP",
             cooldown: 6
         }
     }
 };

   // --- Enemy Ship Classes Database ---
 const PIRATE_SHIP_CLASSES = {
     // --- STANDARD PIRATES ---
     RAIDER: {
         id: "RAIDER",
         name: "Pirate Raider",
         baseHull: 60,
         baseShields: 20,
         weight: 5
     },
     STRIKER: {
         id: "STRIKER",
         name: "Pirate Striker",
         baseHull: 45,
         baseShields: 35,
         weight: 3 
     },
     BRUISER: {
         id: "BRUISER",
         name: "Pirate Bruiser",
         baseHull: 80,
         baseShields: 15,
         weight: 1 
     },

     // --- K'THARR HEGEMONY ---
     // High Hull (Armor), Low Shields, High Damage
     KTHARR_SCOUT: {
         id: "KTHARR_SCOUT",
         name: "K'tharr Vanguard",
         baseHull: 90,
         baseShields: 10,
         weight: 3
     },
     KTHARR_DESTROYER: {
         id: "KTHARR_DESTROYER",
         name: "K'tharr War-Hulk",
         baseHull: 150,
         baseShields: 20,
         weight: 1
     },

     // --- CONCORD SECURITY ---
     // High Shields, Average Hull, Balanced
     CONCORD_PATROL: {
         id: "CONCORD_PATROL",
         name: "Concord Patrol",
         baseHull: 60,
         baseShields: 60,
         weight: 3
     },
     CONCORD_ENFORCER: {
         id: "CONCORD_ENFORCER",
         name: "Concord Enforcer",
         baseHull: 80,
         baseShields: 100,
         weight: 1
     }
 };

  // --- Ship Components Database ---
 const COMPONENTS_DATABASE = {
    // --- UTILITY MODULES (New Slot) ---
    UTIL_NONE: {
        name: "Empty Slot",
        type: "utility",
        slot: "utility",
        manufacturer: "FRONTIER",
        description: "No utility module installed.",
        cost: 0,
        stats: {}
    },
    UTIL_ORBITAL_EXTRACTOR: {
        name: "Orbital Extractor",
        type: "utility",
        slot: "utility",
        manufacturer: "FRONTIER",
        description: "Fires localized tectonic charges to strip-mine planetary surfaces from orbit. Unlocks planetary mining.",
        cost: 8500,
        stats: { unlocksMining: true },
        loreKey: "LORE_COMP_SCANNER"
    },
    UTIL_REINFORCED_PLATING: {
        name: "Reinforced Plating",
        type: "utility",
        slot: "utility",
        manufacturer: "CONCORD",
        description: "Adds thick ablative armor plates. (+40 Max Hull)",
        cost: 1500,
        stats: { hullBonus: 40 },
        loreKey: "LORE_COMP_SHIELD_GENERATOR" // Reusing a generic key for now
    },
    UTIL_CARGO_POD: {
        name: "Ext. Cargo Pod",
        type: "utility",
        slot: "utility",
        manufacturer: "FRONTIER",
        description: "Bolted-on storage racks. (+20 Cargo Capacity)",
        cost: 2000,
        stats: { cargoBonus: 20 },
        loreKey: "LORE_SHIP_LIGHT_FREIGHTER" // Reusing a generic key for now
    },
     WEAPON_PULSE_LASER_MK1: {
         name: "Pulse Laser Mk1",
         type: "weapon",
         slot: "weapon",
         manufacturer: "FRONTIER",
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
         manufacturer: "FRONTIER",
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
         manufacturer: "CONCORD",
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
         manufacturer: "KTHARR",
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
         manufacturer: "ECLIPSE",
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
         manufacturer: "CONCORD",
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
         manufacturer: "KTHARR",
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
         manufacturer: "CONCORD",
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
         manufacturer: "FRONTIER",
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
         manufacturer: "FRONTIER",
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
         manufacturer: "CONCORD",
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
         manufacturer: "ECLIPSE",
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
         manufacturer: "KTHARR",
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
         manufacturer: "FRONTIER",
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
         manufacturer: "FRONTIER",
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
         manufacturer: "CONCORD",
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
         manufacturer: "ECLIPSE",
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
         manufacturer: "FRONTIER",
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
         manufacturer: "CONCORD",
         description: "Improved sensor resolution. May reveal more details or rarer finds.",
         cost: 1500,
         stats: {
             scanBonus: 0.05
         },
         loreKey: "LORE_COMP_SCANNER"
     },
// --- ECLIPSE CARTEL EXCLUSIVES ---
    SMUGGLERS_HOLD: {
        name: "Eclipse Cargo Bay",
        type: "utility",
        slot: "utility",
        manufacturer: "ECLIPSE",
        description: "Shielded cargo bays. +10 Cargo. Immune to standard scans.",
        cost: 4000,
        stats: {
            cargoBonus: 10,
            isSmuggler: true
        },
        reqFaction: "ECLIPSE",
        minRep: 20,
        loreKey: "LORE_COMP_SCANNER" // Placeholder lore
    },

    // --- CONCORD EXCLUSIVES ---
    MILITARY_SHIELD_MOD: {
        name: "Concord Shield Mod",
        type: "utility",       // REQUIRED
        slot: "utility",       // REQUIRED
        manufacturer: "CONCORD",
        description: "Military-grade capacitors. Increases Max Shields by 30.",
        cost: 5000,            // Changed basePrice -> cost
        stats: {
            shieldBonus: 30    // Functional Stat
        },
        reqFaction: "CONCORD",
        minRep: 30,
        loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },

    // --- K'THARR EXCLUSIVES ---
    BIO_REPAIR_NODES: {
        name: "Living Hull Tissue",
        type: "utility",       // REQUIRED
        slot: "utility",       // REQUIRED
        manufacturer: "KTHARR",
        description: "K'tharr biotech that reinforces hull structure (+40 Hull).",
        cost: 8000,            // Changed basePrice -> cost
        stats: {
            hullBonus: 40,     // Functional Stat
            passiveRegen: true // Flag for future logic (we can add a tick later)
        },
        reqFaction: "KTHARR",
        minRep: 50,
        loreKey: "LORE_COMP_ENGINE"
    }
};
