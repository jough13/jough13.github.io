// --- START OF FILE ships.js ---

// ==========================================
// --- SHIP CLASSES DATABASE (Shipyard) ---
// ==========================================

const SHIP_CLASSES = {
    LIGHT_FREIGHTER: {
        name: "Light Freighter",
        image: "assets/light_freighter.png",
        baseHull: 100,
        cargoCapacity: 50,
        baseTroops: 20,
        baseCost: 0, 
        baseSignature: 1.0, // Standard radar profile
        baseEvasion: 0.05,  // 5% Dodge Chance
        description: "A reliable, jack-of-all-trades vessel.",
        loreKey: "LORE_SHIP_LIGHT_FREIGHTER",
        ability: {
            name: "Emergency Patch",
            desc: "Restores 25 Hull instantly.",
            id: "REPAIR",
            cooldown: 6,
            execute: (combatCtx, playerStats) => {
                const heal = 25;
                playerStats.hull = Math.min(playerStats.maxHull, playerStats.hull + heal);
                return `Nano-drones deployed! Hull repaired +${heal}.`;
            }
        }
    },
    VOID_SKIFF: {
        name: "Void-Skiff",
        image: "assets/void_skiff.png",
        baseHull: 50,
        cargoCapacity: 15,
        baseTroops: 10,
        baseCost: 2500,
        baseSignature: 0.4, 
        baseEvasion: 0.25, // Extremely hard to hit
        description: "Fast, fragile, and cheap.",
        loreKey: "LORE_SHIP_VOID_SKIFF",
        ability: {
            name: "Overload",
            desc: "Deals heavy direct damage to enemy hull.",
            id: "CRIT",
            cooldown: 5,
            execute: (combatCtx, playerStats) => {
                const dmg = 40; 
                combatCtx.pirateHull -= dmg;
                return `Reactor overloaded and channeled into weapons! Dealt ${dmg} direct damage!`;
            }
        }
    },
    COURIER: {
        name: "Courier",
        image: "assets/courier.png",
        baseHull: 115,
        cargoCapacity: 65,
        baseTroops: 20,
        baseCost: 6500,
        baseSignature: 0.8, 
        baseEvasion: 0.10, // 10% Dodge Chance
        description: "A professional vessel balancing speed and durability.",
        loreKey: "LORE_SHIP_COURIER",
        ability: {
            name: "Precision Burn",
            desc: "Increases evasion and boosts targeting systems.",
            id: "ACCURACY_BOOST",
            cooldown: 5,
            execute: (combatCtx, playerStats) => {
                playerStats.isEvading = true;
                playerStats.guaranteedHit = true; 
                return `Precision Burn engaged! Evasive maneuvers maximized, targeting locked.`;
            }
        }
    },
    INTERCEPTOR: {
        name: "Interceptor",
        image: "assets/interceptor.png",
        baseHull: 75,
        cargoCapacity: 20,
        baseTroops: 15,
        baseCost: 8000,
        baseSignature: 0.5, 
        baseEvasion: 0.20, // 20% Dodge Chance (Very Agile)
        description: "Built for speed and combat agility.",
        loreKey: "LORE_SHIP_INTERCEPTOR",
        ability: {
            name: "Afterburner",
            desc: "Guarantees evasion for 1 turn.",
            id: "DODGE",
            cooldown: 4,
            execute: (combatCtx, playerStats) => {
                playerStats.isEvading = true; 
                return `Evasion protocols maximized. Thrusters burning hot!`;
            }
        }
    },
    EXPLORER: {
        name: "Explorer",
        image: "assets/explorer.png",
        baseHull: 120,
        cargoCapacity: 40,
        baseTroops: 20,
        baseCost: 10000,
        baseSignature: 1.2, 
        baseEvasion: 0.08, 
        description: "Long-range vessel with advanced sensors.",
        loreKey: "LORE_SHIP_EXPLORER",
        ability: {
            name: "Sensor Blind",
            desc: "Stuns enemy for 1 turn (No attack).",
            id: "STUN",
            cooldown: 5,
            execute: (combatCtx, playerStats) => {
                combatCtx.nextMove = { type: 'STUNNED', label: 'Sensors Blinded', icon: '💤' };
                return `EMP burst released! Target sensors blinded, intent disrupted.`;
            }
        }
    },
    SCIENCE_SURVEYOR: {
        name: "Deep-Space Surveyor",
        image: "assets/explorer.png", // Safe fallback; auto-upgrades to assets/ship_surveyor.png if present
        customAsset: "assets/ship_surveyor.png",
        baseHull: 135,
        cargoCapacity: 75,
        baseTroops: 20,
        baseCost: 14000,
        baseSignature: 0.9,
        baseEvasion: 0.12,
        description: "Specialized astrometric research vessel fitted with gravimetric lenses and shielded sample bays.",
        loreKey: "LORE_SHIP_SCOUT",
        ability: {
            name: "Harmonic Lock",
            desc: "Restores 25 Shields and guarantees a direct hit on your next shot.",
            id: "HARMONIC_LOCK",
            cooldown: 5,
            execute: (combatCtx, playerStats) => {
                playerStats.shields = Math.min(playerStats.maxShields, playerStats.shields + 25);
                playerStats.guaranteedHit = true;
                return `Gravimetric lenses focused! Shields boosted +25 and target lock synchronized.`;
            }
        }
    },
    HEAVY_HAULER: {
        name: "Heavy Hauler",
        image: "assets/heavy_hauler.png",
        baseHull: 150,
        cargoCapacity: 120,
        baseTroops: 30,
        baseCost: 15000,
        baseSignature: 1.8, 
        baseEvasion: 0.0, 
        description: "A veritable fortress with massive cargo holds.",
        loreKey: "LORE_SHIP_HEAVY_HAULER",
        ability: {
            name: "Reinforce Structure",
            desc: "Instantly repairs 20 Hull and 20 Shields.",
            id: "DEFENSE_UP",
            cooldown: 6,
            execute: (combatCtx, playerStats) => {
                playerStats.shields = Math.min(playerStats.maxShields, playerStats.shields + 20);
                playerStats.hull = Math.min(playerStats.maxHull, playerStats.hull + 20);
                return `Bulkheads locked down. Integrity reinforced (+20 Hull/Shields).`;
            }
        }
    },
    ROCK_HOPPER: {
        name: "Rock-Hopper",
        image: "assets/rock_hopper.png",
        baseHull: 180,
        cargoCapacity: 150,
        baseTroops: 30,
        baseCost: 22000,
        baseSignature: 1.5, 
        baseEvasion: 0.0, // A flying brick
        description: "Industrial mining barge. Tough but slow.",
        loreKey: "LORE_SHIP_ROCK_HOPPER",
        ability: {
            name: "Shield Hardening",
            desc: "Fully restores Shields.",
            id: "SHIELD_BOOST",
            cooldown: 8,
            execute: (combatCtx, playerStats) => {
                playerStats.shields = playerStats.maxShields;
                return `Mining deflectors overcharged. Shields fully restored.`;
            }
        }
    },
    STAR_GALLEON: {
        name: "Star-Galleon",
        image: "assets/star_galleon.png",
        baseHull: 200,
        cargoCapacity: 80,
        baseTroops: 35,
        baseCost: 50000,
        baseSignature: 2.0, 
        baseEvasion: 0.02, 
        description: "The pinnacle of luxury and defense.",
        loreKey: "LORE_SHIP_STAR_GALLEON",
        ability: {
            name: "Diplomatic Immunity",
            desc: "Instantly ends combat (Escape).",
            id: "ESCAPE",
            cooldown: 10,
            execute: (combatCtx, playerStats) => {
                playerStats.triggerEscape = true; 
                return `Transmitting Concord VIP clearance codes... Hostiles disengaging!`;
            }
        }
    },

    // ==========================================
    // --- FACTION EXCLUSIVE SHIPS ---
    // ==========================================

    FUEL_RAT_RESCUER: {
        name: "Fuel Rats Salvage Tug",
        image: "assets/courier.png", // Safe fallback; auto-upgrades to assets/ship_fuelrat.png if present
        customAsset: "assets/ship_fuelrat.png",
        baseHull: 165,
        cargoCapacity: 95,
        baseTroops: 25,
        baseCost: 28000,
        baseSignature: 0.9,
        baseEvasion: 0.12,
        description: "A heavily modified deep-space rescue tug painted in high-visibility amber. Features oversized transfer coils and reinforced grapplers.",
        loreKey: "FACTION_FUEL_RATS",
        manufacturer: "FRONTIER",
        reqFaction: "FUEL_RATS",
        minRep: 10,
        ability: {
            name: "Emergency Siphon",
            desc: "Drains 25 enemy Shields into your own and condenses +15 Fuel.",
            id: "SIPHON",
            cooldown: 5,
            execute: (combatCtx, playerStats) => {
                const drained = Math.min(25, combatCtx.pirateShields || 0);
                combatCtx.pirateShields = Math.max(0, (combatCtx.pirateShields || 0) - 25);
                playerStats.shields = Math.min(playerStats.maxShields, playerStats.shields + Math.max(15, drained));
                if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
                    playerFuel = Math.min(MAX_FUEL, playerFuel + 15);
                }
                return `Refueling umbilicus fired! Siphoned enemy power grid (+Shields & +15 Fuel).`;
            }
        }
    },
    ECLIPSE_CORSAIR: {
        name: "Eclipse Corsair",
        image: "assets/interceptor.png", // Safe fallback; auto-upgrades to assets/ship_corsair.png if present
        customAsset: "assets/ship_corsair.png",
        baseHull: 130,
        cargoCapacity: 55,
        baseTroops: 30,
        baseCost: 32000,
        baseSignature: 0.45,
        baseEvasion: 0.16,
        description: "A sleek Cartel boarding raider equipped with magnetic grapplers and low-emission thrusters.",
        loreKey: "FACTION_ECLIPSE",
        manufacturer: "ECLIPSE",
        reqFaction: "ECLIPSE",
        minRep: 15,
        ability: {
            name: "EMP Harpoon",
            desc: "Strips 35 enemy Shields and stuns enemy intent for 1 turn.",
            id: "EMP_HARPOON",
            cooldown: 6,
            execute: (combatCtx, playerStats) => {
                combatCtx.pirateShields = Math.max(0, (combatCtx.pirateShields || 0) - 35);
                combatCtx.nextMove = { type: 'STUNNED', label: 'Systems Disrupted', icon: '⚡' };
                return `EMP Harpoon tethered! Stripped 35 enemy shields and shorted their fire-control!`;
            }
        }
    },
    KTHARR_BLOODBARGE: {
        name: "K'tharr Blood-Barge",
        image: "assets/ship_bloodbarge.png", 
        baseHull: 350,
        cargoCapacity: 60,
        baseTroops: 45,
        baseCost: 50000,
        baseSignature: 1.9, 
        baseEvasion: 0.02,
        description: "A brutal, heavily armored war-hulk. Lacks finesse, but hits like a localized asteroid strike.",
        loreKey: "LORE_SHIP_BLOODBARGE",
        manufacturer: "KTHARR",
        reqFaction: "KTHARR",
        minRep: 30,
        ability: {
            name: "Ramming Speed",
            desc: "Deals massive damage, but hurts your own hull.",
            id: "CRIT",
            cooldown: 5,
            execute: (combatCtx, playerStats) => {
                const dmg = 60;
                // Prevent the player from committing suicide with their own ability
                const actualSelfDmg = Math.min(15, Math.max(0, playerStats.hull - 1));
                combatCtx.pirateHull -= dmg;
                playerStats.hull -= actualSelfDmg;
                return `RAMMING SPEED! Dealt ${dmg} damage to enemy, took ${actualSelfDmg} structural damage!`;
            }
        }
    },
    ECLIPSE_NIGHTRUNNER: {
        name: "Eclipse Night-Runner",
        image: "assets/ship_nightrunner.png", 
        baseHull: 90,
        cargoCapacity: 80,
        baseTroops: 20,
        baseCost: 55000,
        baseSignature: 0.2, 
        baseEvasion: 0.18,
        description: "A stealth smuggling vessel. Sensor-absorbent plating makes it a ghost on Concord radars.",
        loreKey: "LORE_SHIP_NIGHTRUNNER",
        manufacturer: "ECLIPSE",
        reqFaction: "ECLIPSE",
        minRep: 30,
        ability: {
            name: "Sensor Ghost",
            desc: "Guarantees evasion from incoming fire.",
            id: "DODGE",
            cooldown: 8,
            execute: (combatCtx, playerStats) => {
                playerStats.isEvading = true;
                return `Phase-shifters activated. You vanish from enemy targeting scanners!`;
            }
        }
    },
    AEGIS_GUNSHIP: {
        name: "Aegis Gunship",
        image: "assets/ship_aegis.png", 
        baseHull: 250,
        cargoCapacity: 40,
        baseTroops: 35,
        baseCost: 65000,
        baseSignature: 1.6, 
        baseEvasion: 0.05,
        description: "A Concord military patrol vessel. Heavily armored and built for pure combat superiority.",
        loreKey: "LORE_SHIP_AEGIS",
        manufacturer: "CONCORD",
        reqFaction: "CONCORD",
        minRep: 30,
        ability: {
            name: "Phalanx Array",
            desc: "Instantly restores shields and increases evasion.",
            id: "SHIELD_BOOST",
            cooldown: 6,
            execute: (combatCtx, playerStats) => {
                playerStats.shields = playerStats.maxShields;
                playerStats.isEvading = true;
                return `Aegis Phalanx online. Shields maxed and evasive sub-routines engaged.`;
            }
        }
    },
    CONCORD_DREADNOUGHT: {
        name: "Aegis Dreadnought",
        image: "assets/ship_aegis.png", // Safe fallback; auto-upgrades to assets/ship_dreadnought.png if present
        customAsset: "assets/ship_dreadnought.png",
        baseHull: 420,
        cargoCapacity: 110,
        baseTroops: 60,
        baseCost: 115000,
        baseSignature: 2.2,
        baseEvasion: 0.03,
        description: "The undisputed apex of Concord naval engineering. A mobile sector command fortress bristling with spinal battery mounts and troop bays.",
        loreKey: "LORE_SHIP_DREADNOUGHT",
        manufacturer: "CONCORD",
        reqFaction: "CONCORD",
        minRep: 50,
        ability: {
            name: "Spinal Broadside",
            desc: "Fires all batteries for 75 direct damage and bolsters Shields by +30.",
            id: "SPINAL_BROADSIDE",
            cooldown: 6,
            execute: (combatCtx, playerStats) => {
                const totalDmg = 75;
                if (combatCtx.pirateShields > 0) {
                    const absorbed = Math.min(combatCtx.pirateShields, totalDmg);
                    combatCtx.pirateShields -= absorbed;
                    combatCtx.pirateHull -= (totalDmg - absorbed);
                } else {
                    combatCtx.pirateHull -= totalDmg;
                }
                playerStats.shields = Math.min(playerStats.maxShields, playerStats.shields + 30);
                return `SPINAL BATTERY FIRED! Dealt ${totalDmg} devastating damage and reinforced shields +30!`;
            }
        }
    }
};

// ==========================================
// --- ENEMY SHIP CLASSES DATABASE ---
// ==========================================

const PIRATE_SHIP_CLASSES = {
    // --- STANDARD PIRATES & CARTEL ---
    RAIDER: { id: "RAIDER", name: "Pirate Raider", baseHull: 60, baseShields: 20, weight: 5 },
    STRIKER: { id: "STRIKER", name: "Pirate Striker", baseHull: 45, baseShields: 35, weight: 3 },
    BRUISER: { id: "BRUISER", name: "Pirate Bruiser", baseHull: 80, baseShields: 15, weight: 2 },
    PIRATE_GUNSHIP: { id: "PIRATE_GUNSHIP", name: "Void Vulture Gunship", baseHull: 110, baseShields: 45, weight: 1 },
    ECLIPSE_ASSASSIN: { id: "ECLIPSE_ASSASSIN", name: "Cartel Shadow-Interceptor", baseHull: 70, baseShields: 70, weight: 1 },
    PIRATE_DREADNOUGHT: { id: "PIRATE_DREADNOUGHT", name: "Cartel Pocket-Dreadnought", baseHull: 175, baseShields: 60, weight: 0.4 },

    // --- K'THARR HEGEMONY ---
    KTHARR_SCOUT: { id: "KTHARR_SCOUT", name: "K'tharr Vanguard", baseHull: 90, baseShields: 10, weight: 3 },
    KTHARR_DESTROYER: { id: "KTHARR_DESTROYER", name: "K'tharr War-Hulk", baseHull: 150, baseShields: 20, weight: 1 },
    KTHARR_WARLORD: { id: "KTHARR_WARLORD", name: "K'tharr Blood-Dreadnought", baseHull: 260, baseShields: 50, weight: 0, isBoss: true },

    // --- CONCORD SECURITY ---
    CONCORD_PATROL: { id: "CONCORD_PATROL", name: "Concord Patrol", baseHull: 60, baseShields: 60, weight: 3 },
    CONCORD_ENFORCER: { id: "CONCORD_ENFORCER", name: "Concord Enforcer", baseHull: 80, baseShields: 100, weight: 1 },

    // --- LEGENDARY BOUNTY BOSSES (weight: 0 so they never spawn as random pirates!) ---
    BOSS_VOSS: { id: "BOSS_VOSS", name: "The Butcher's Blade", baseHull: 400, baseShields: 150, weight: 0, isBoss: true },
    BOSS_THORNE: { id: "BOSS_THORNE", name: "Rogue Aegis Interceptor", baseHull: 200, baseShields: 350, weight: 0, isBoss: true }
};

// ==========================================
// --- COMPONENTS DATABASE ---
// ==========================================

const COMPONENTS_DATABASE = {
    // --- PROTOTYPE & BOSS GEAR (CRAFTING / BOSS LOOT ONLY) ---
    "WEAPON_VOID_CASTER": {
        name: "Void Caster Prototype", type: "weapon", slot: "weapon", cost: 0, manufacturer: "UNKNOWN",
        description: "An experimental weapon firing weaponized void energy. Incredible damage output and critical strike capability.", 
        stats: { damage: 35, hitChance: 0.85, critChance: 0.25 }, loreKey: "PHENOMENON_VOID_CRYSTALS"
    },
    "SHIELD_AETHER_WARD": {
        name: "Aether Ward Emitter", type: "shield", slot: "shield", cost: 0, manufacturer: "UNKNOWN",
        description: "A prototype shield utilizing phase-shifted tech to rapidly disperse kinetic and thermal impacts.", 
        stats: { maxShields: 200, rechargeRate: 5 }, loreKey: "TECH_PHASE_SHIFT_ALLOY"
    },
    "ENGINE_SLIPSTREAM": {
        name: "Slipstream Drive", type: "engine", slot: "engine", cost: 0, manufacturer: "UNKNOWN",
        description: "Reverse-engineered from precursor tech. Provides immense fuel reserves and peak sublight efficiency.", 
        stats: { maxFuel: 500, fuelEfficiency: 0.4 }, loreKey: "XENO_PRECURSORS"
    },
    "WEAPON_SINGULARITY_CANNON": {
        name: "Singularity Cannon", type: "weapon", slot: "weapon", manufacturer: "UNKNOWN",
        description: "Fires localized micro-black holes. Devastating hull damage. Prototype hardwired to ship.",
        cost: 999999,
        stats: { damage: 85, hitChance: 0.85, maxAmmo: 8 }
    },
    "WEAPON_VOID_BEAM": {
        name: "K'tharr Void-Beam", type: "weapon", slot: "weapon", manufacturer: "KTHARR",
        description: "An experimental continuous beam weapon stolen by the Cartel. Melts shields instantly.",
        cost: 999999, 
        stats: { damage: 45, hitChance: 0.95, vsShieldBonus: 50, maxAmmo: 12 }
    },

    // --- CONCORD MILITARY GEAR (AEGIS ARMORY) ---
    "WEAPON_CONCORD_PLASMA": {
        name: "Aegis Plasma Cannon", type: "weapon", slot: "weapon", cost: 8500, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 20,
        description: "Military-grade plasma projector. Melts pirate armor into slag.",
        stats: { damage: 45, hitChance: 0.90 }, loreKey: "LORE_COMP_PULSE_LASER"
    },
    "WEAPON_CONCORD_RAILGUN": {
        name: "Concord 'Punisher' Railgun", type: "weapon", slot: "weapon", cost: 15000, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 40,
        description: "Accelerates tungsten slugs to a fraction of lightspeed. Requires specialized ammo clips.",
        stats: { damage: 85, hitChance: 0.75, maxAmmo: 10 }, loreKey: "LORE_COMP_MASS_DRIVER"
    },
    "SHIELD_CONCORD_BULWARK": {
        name: "Aegis Bulwark Array", type: "shield", slot: "shield", cost: 12000, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 20,
        description: "Heavy military deflectors. Creates an almost impenetrable kinetic barrier.",
        stats: { maxShields: 150, rechargeRate: 2.5 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    "ENGINE_CONCORD_CRUISER": {
        name: "Concord Patrol Drive", type: "engine", slot: "engine", cost: 9500, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 20,
        description: "Incredibly efficient micro-fusion drive used by long-range security patrols.",
        stats: { maxFuel: 300, fuelEfficiency: 0.5 }, loreKey: "LORE_COMP_ENGINE" 
    },
    "SCANNER_CONCORD_MILITARY": {
        name: "Deep-Space Tactical Sensors", type: "scanner", slot: "scanner", cost: 6000, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 30,
        description: "Pierces through nebulas and stealth fields with ease. Highly classified tech.",
        stats: { scanBonus: 0.8, accuracyBonus: 0.08 }, loreKey: "LORE_COMP_SCANNER"
    },
    "UTIL_CONCORD_REACTIVE": {
        name: "Aegis Reactive Plating", type: "utility", slot: "utility", cost: 11000, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 50,
        description: "Smart-armor that actively pushes back against kinetic impacts.",
        stats: { hullBonus: 100 }, loreKey: "FACTION_CONCORD"
    },
    "MILITARY_SHIELD_MOD": {
        name: "Concord Shield Mod", type: "utility", slot: "utility", manufacturer: "CONCORD",
        description: "Military-grade capacitors. Increases Max Shields by 30.",
        cost: 5000, stats: { shieldBonus: 30 }, reqFaction: "CONCORD", minRep: 30, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },

    // --- STANDARD & FACTION UTILITY GEAR ---
    UTIL_NONE: {
        name: "Empty Slot", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "No utility module installed.", cost: 0, stats: {}
    },
    UTIL_ORBITAL_EXTRACTOR: {
        name: "Orbital Extractor", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "Fires localized tectonic charges to strip-mine planetary surfaces from orbit. Unlocks planetary mining.",
        cost: 8500, stats: { unlocksMining: true }, loreKey: "LORE_COMP_SCANNER"
    },
    UTIL_REINFORCED_PLATING: {
        name: "Reinforced Plating", type: "utility", slot: "utility", manufacturer: "CONCORD",
        description: "Adds thick ablative armor plates. (+40 Max Hull)",
        cost: 1500, stats: { hullBonus: 40 }, loreKey: "LORE_COMP_SHIELD_GENERATOR" 
    },
    UTIL_CARGO_POD: {
        name: "Ext. Cargo Pod", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "Bolted-on storage racks. (+20 Cargo Capacity)",
        cost: 2000, stats: { cargoBonus: 20 }, loreKey: "LORE_SHIP_LIGHT_FREIGHTER" 
    },
    UTIL_DOSIMETRY_ARRAY: {
        name: "Radiological Dosimeter", type: "utility", slot: "utility", manufacturer: "CONCORD",
        description: "A professional-grade health physics suite. Completely shields the vessel and crew from environmental radiation hazards.",
        cost: 3500, stats: { radImmunity: true, shieldBonus: 15 }, loreKey: "LORE_COMP_SCANNER" 
    },
    UTIL_TARGETING_COMPUTER: {
        name: "Gyroscopic Targeting AI", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "An automated tracking system that syncs ship gimbals to enemy vectors. Increases Weapon Hit Chance by 15%.",
        cost: 4200, stats: { accuracyBonus: 0.15 }, loreKey: "LORE_COMP_SCANNER" 
    },
    UTIL_MARINE_BARRACKS: {
        name: "Drop-Troop Barracks Pod", type: "utility", slot: "utility", manufacturer: "KTHARR",
        description: "Pressurized armored troop berths and breaching pods. Increases Max Troop & Mech capacity by +20 and reinforces hull (+20 Hull).",
        cost: 5500, stats: { hullBonus: 20, troopBonus: 20 }, loreKey: "FACTION_KTHARR"
    },

    // --- WEAPONS ---
    WEAPON_PULSE_LASER_MK1: {
        name: "Pulse Laser Mk1", type: "weapon", slot: "weapon", manufacturer: "FRONTIER",
        description: "Standard issue civilian pulse laser. Reliable but low power.",
        cost: 0, stats: { damage: 8, hitChance: 0.70, critChance: 0.05 }, loreKey: "LORE_COMP_PULSE_LASER"
    },
    WEAPON_PULSE_LASER_MK2: {
        name: "Pulse Laser Mk2", type: "weapon", slot: "weapon", manufacturer: "FRONTIER",
        description: "Upgraded pulse laser with improved focusing coils for higher damage.",
        cost: 2000, stats: { damage: 12, hitChance: 0.75, critChance: 0.10 }, loreKey: "LORE_COMP_PULSE_LASER"
    },
    WEAPON_PULSE_LASER_MK3: {
        name: "Pulse Laser Mk3", type: "weapon", slot: "weapon", manufacturer: "CONCORD",
        description: "Military-grade pulse laser. Significant damage output and better targeting.",
        cost: 5500, stats: { damage: 18, hitChance: 0.78, critChance: 0.15 }, loreKey: "LORE_COMP_PULSE_LASER"
    },
    WEAPON_GATLING_LASER_MK1: {
        name: "Gatling Laser Mk1", type: "weapon", slot: "weapon", manufacturer: "ECLIPSE",
        description: "Rapidly fires low-power beams. Very high accuracy and critical hit chance, but low base damage.",
        cost: 3200, stats: { damage: 6, hitChance: 0.95, critChance: 0.20 }, loreKey: "LORE_COMP_BEAM_LASER"
    },
    WEAPON_KINETIC_IMPULSOR_MK1: {
        name: "Kinetic Impulsor Mk1", type: "weapon", slot: "weapon", manufacturer: "KTHARR",
        description: "Fires solid slugs. Decent against unshielded hulls.",
        cost: 1800, stats: { damage: 15, hitChance: 0.65 }, loreKey: "LORE_COMP_KINETIC_WEAPON"
    },
    WEAPON_ION_CANNON_MK1: {
        name: "Ion Cannon Mk1", type: "weapon", slot: "weapon", manufacturer: "ECLIPSE",
        description: "Disrupts shields effectively, less hull damage.",
        cost: 2200, stats: { damage: 6, hitChance: 0.80, vsShieldBonus: 10 }, loreKey: "LORE_COMP_ION_WEAPON"
    },
    WEAPON_BEAM_LASER_MK1: {
        name: "Beam Laser Mk1", type: "weapon", slot: "weapon", manufacturer: "CONCORD",
        description: "Sustained energy beam. High accuracy, consistent damage over time.",
        cost: 2800, stats: { damage: 10, hitChance: 0.85 }, loreKey: "LORE_COMP_BEAM_LASER"
    },
    WEAPON_MASS_DRIVER_MK1: {
        name: "Mass Driver Mk1", type: "weapon", slot: "weapon", manufacturer: "KTHARR",
        description: "Accelerates a dense projectile to devastating speeds. High hull damage, slow fire rate.",
        cost: 3800, stats: { damage: 25, hitChance: 0.60, critChance: 0.25 }, loreKey: "LORE_COMP_MASS_DRIVER"
    },
    WEAPON_MISSILE_LAUNCHER_MK1: {
        name: "Missile Launcher Mk1", type: "weapon", slot: "weapon", manufacturer: "CONCORD",
        description: "Fires self-propelled explosive ordnance. High damage, limited ammo.",
        cost: 4500, stats: { damage: 30, hitChance: 0.60, maxAmmo: 5 }, loreKey: "LORE_COMP_MISSILE_LAUNCHER"
    },
    WEAPON_KTHARR_DISRUPTOR: {
        name: "K'tharr Heavy Disruptor", type: "weapon", slot: "weapon", manufacturer: "KTHARR", reqFaction: "KTHARR", minRep: 15,
        description: "Fires unstable bolts of compressed blood-red plasma that shred both shields and armor.",
        cost: 7200, stats: { damage: 32, hitChance: 0.78, critChance: 0.15, vsShieldBonus: 10 }, loreKey: "FACTION_KTHARR"
    },
    WEAPON_ECLIPSE_RAIL_REPEATER: {
        name: "Eclipse Silent Repeater", type: "weapon", slot: "weapon", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 15,
        description: "Flash-suppressed electromagnetic flechette cannon engineered for Cartel ambush wings.",
        cost: 6800, stats: { damage: 26, hitChance: 0.88, critChance: 0.22, signatureMod: -0.10 }, loreKey: "FACTION_ECLIPSE"
    },

    // --- SHIELDS ---
    SHIELD_BASIC_ARRAY_A: {
        name: "Basic Deflector Array A", type: "shield", slot: "shield", manufacturer: "FRONTIER",
        description: "Entry-level shield generator. Offers minimal protection.",
        cost: 0, stats: { maxShields: 50, rechargeRate: 1 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    SHIELD_GUARDIAN_B: {
        name: "Guardian Shield Emitter B", type: "shield", slot: "shield", manufacturer: "FRONTIER",
        description: "Military surplus shield, offering better resilience and faster recharge.",
        cost: 2500, stats: { maxShields: 80, rechargeRate: 2 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    SHIELD_AEGIS_C: {
        name: "Aegis Shield Projector C", type: "shield", slot: "shield", manufacturer: "CONCORD",
        description: "Top-tier Concord shield tech. Excellent protection and robust recharge.",
        cost: 5000, stats: { maxShields: 120, rechargeRate: 3 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    SHIELD_RAPID_CYCLE_A: {
        name: "Rapid-Cycle Unit A", type: "shield", slot: "shield", manufacturer: "ECLIPSE",
        description: "Lower capacity, but regenerates very quickly. Favored by agile fighters.",
        cost: 3000, stats: { maxShields: 65, rechargeRate: 4 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    SHIELD_FORTRESS_GRID_A: {
        name: "Fortress Grid A", type: "shield", slot: "shield", manufacturer: "KTHARR",
        description: "Extremely high capacity, but slow to regenerate. For ships that can take a beating.",
        cost: 4500, stats: { maxShields: 150, rechargeRate: 1 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    SHIELD_STEALTH_GRID: {
        name: "Whisper Deflector Grid", type: "shield", slot: "shield", manufacturer: "ECLIPSE",
        description: "A modified shield array that sacrifices raw capacity to absorb radar emissions. Reduces ship signature.",
        cost: 4200, stats: { maxShields: 40, rechargeRate: 2, signatureMod: -0.2 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },

    // --- ENGINES ---
    ENGINE_STD_DRIVE_MK1: {
        name: "Standard Drive Mk1", type: "engine", slot: "engine", manufacturer: "FRONTIER",
        description: "Common civilian stardrive. Gets you there, eventually.",
        cost: 0, stats: { maxFuel: 220, fuelEfficiency: 1.0 }, loreKey: "LORE_COMP_ENGINE"
    },
    ENGINE_RANGEPLUS_MK1: {
        name: "RangePlus Drive Mk1", type: "engine", slot: "engine", manufacturer: "FRONTIER",
        description: "Larger fuel tank for extended travel, slightly improved efficiency.",
        cost: 3000, stats: { maxFuel: 350, fuelEfficiency: 0.95 }, loreKey: "LORE_COMP_ENGINE"
    },
    ENGINE_IONFLOW_MK2: {
        name: "IonFlow Drive Mk2", type: "engine", slot: "engine", manufacturer: "CONCORD",
        description: "Advanced ion engine, significantly better fuel efficiency.",
        cost: 4000, stats: { maxFuel: 275, fuelEfficiency: 0.75 }, loreKey: "LORE_COMP_ENGINE"
    },
    ENGINE_HIGH_THRUST_MK1: {
        name: "High-Thrust Drive Mk1", type: "engine", slot: "engine", manufacturer: "ECLIPSE",
        description: "Powerful combat thruster. Trades fuel economy for +12% combat evasion.",
        cost: 3500, stats: { maxFuel: 210, fuelEfficiency: 1.15, evasionBonus: 0.12 }, loreKey: "LORE_COMP_ENGINE"
    },
    ENGINE_SMUGGLER_DRIVE: {
        name: "Night-Runner Injectors", type: "engine", slot: "engine", manufacturer: "ECLIPSE",
        description: "Runs cold to evade thermal tracking. Modest fuel capacity, but heavily reduces ship signature.",
        cost: 6500, stats: { maxFuel: 250, fuelEfficiency: 0.9, signatureMod: -0.3 }, loreKey: "LORE_SHIP_NIGHTRUNNER"
    },
    ENGINE_KTHARR_AFTERBURNER: {
        name: "K'tharr War-Torch Drive", type: "engine", slot: "engine", manufacturer: "KTHARR",
        description: "Heavy armored thrusters forged for K'tharr assault ships. Boosts hull integrity (+25 Hull) and combat thrust.",
        cost: 4800, stats: { maxFuel: 280, fuelEfficiency: 0.90, hullBonus: 25, evasionBonus: 0.05 }, loreKey: "FACTION_KTHARR"
    },

    // --- SCANNERS ---
    SCANNER_BASIC_SUITE: {
        name: "Standard Sensor Suite", type: "scanner", slot: "scanner", manufacturer: "FRONTIER",
        description: "Basic sensor package. Provides essential data.",
        cost: 0, stats: { scanBonus: 0 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_DEEP_RANGE_A: {
        name: "Deep-Range Array A", type: "scanner", slot: "scanner", manufacturer: "CONCORD",
        description: "Improved sensor resolution. May reveal more details or rarer finds.",
        cost: 1500, stats: { scanBonus: 0.05 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_NEXSTAR_4SE: {
        name: "NexStar-4 Optical Array", type: "scanner", slot: "scanner", manufacturer: "INDEPENDENT",
        description: "An antique but meticulously maintained optical tracking array. Exceptional for deep-space stargazing.",
        cost: 1200, stats: { scanBonus: 0.15, accuracyBonus: 0.05 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_KTHARR_HUNTER: {
        name: "K'tharr Prey-Tracker Array", type: "scanner", slot: "scanner", manufacturer: "KTHARR",
        description: "Aggressive target-acquisition sensors that lock onto enemy reactor cores (+10% Hit Chance, +4 Weapon Damage).",
        cost: 3600, stats: { accuracyBonus: 0.10, damageBonus: 4, scanBonus: 0.10 }, loreKey: "FACTION_KTHARR"
    },
    SCANNER_ECLIPSE_INTERCEPTOR: {
        name: "Eclipse Signal Slicer", type: "scanner", slot: "scanner", manufacturer: "ECLIPSE",
        description: "Intercepts patrol telemetry and masks your hull emissions (-15% Signature, +8% Accuracy).",
        cost: 3900, stats: { signatureMod: -0.15, accuracyBonus: 0.08, scanBonus: 0.15 }, loreKey: "FACTION_ECLIPSE"
    },
   
    // --- FACTION EXCLUSIVES ---
    SMUGGLERS_HOLD: {
        name: "Eclipse Cargo Bay", type: "utility", slot: "utility", manufacturer: "ECLIPSE",
        description: "Shielded cargo bays. +10 Cargo. Immune to standard scans.",
        cost: 4000, stats: { cargoBonus: 10, isSmuggler: true, signatureMod: -0.3 }, reqFaction: "ECLIPSE", minRep: 20, loreKey: "FACTION_ECLIPSE" 
    },
    BIO_REPAIR_NODES: {
        name: "Living Hull Tissue", type: "utility", slot: "utility", manufacturer: "KTHARR",
        description: "K'tharr biotech that reinforces hull structure (+40 Hull) and slowly regenerates armor in flight.",
        cost: 8000, stats: { hullBonus: 40, passiveRegen: true }, reqFaction: "KTHARR", minRep: 50, loreKey: "FACTION_KTHARR"
    }
};

// Expose databases globally
window.SHIP_CLASSES = SHIP_CLASSES;
window.PIRATE_SHIP_CLASSES = PIRATE_SHIP_CLASSES;
window.COMPONENTS_DATABASE = COMPONENTS_DATABASE;

// --- PROCEDURAL LOOT ENGINE ---
const LOOT_PREFIXES = [
    { name: "Hardened", stat: "hullBonus", val: 15, costMod: 1.2 },
    { name: "Overcharged", stat: "shieldBonus", val: 20, costMod: 1.3 },
    { name: "Smuggler's", stat: "cargoBonus", val: 10, costMod: 1.5 },
    { name: "Tuned", stat: "evasionBonus", val: 0.05, costMod: 1.4 },
    { name: "Vicious", stat: "damageBonus", val: 5, costMod: 1.5 },
    { name: "Calibrated", stat: "accuracyBonus", val: 0.10, costMod: 1.3 }
];

const LOOT_SUFFIXES = [
    { name: "of the Cartel", stat: "signatureMod", val: -0.20, costMod: 1.4 },
    { name: "from the Core", stat: "scanBonus", val: 0.10, costMod: 1.2 },
    { name: "of the Vanguard", stat: "hullBonus", val: 25, costMod: 1.5 },
    { name: "of the Void", stat: "fuelEfficiency", val: -0.15, costMod: 1.6 } // Lower is better for efficiency multiplier
];

function _applyProceduralModifier(itemObj, mod) {
    if (!itemObj || !mod) return;
    // BUG FIX: fuelEfficiency is a multiplier (baseline 1.0), not an additive 0-base stat!
    if (mod.stat === "fuelEfficiency") {
        const currentEff = itemObj.stats.fuelEfficiency !== undefined ? itemObj.stats.fuelEfficiency : 1.0;
        itemObj.stats.fuelEfficiency = Math.max(0.25, parseFloat((currentEff + mod.val).toFixed(2)));
    } else {
        const currentVal = itemObj.stats[mod.stat] || 0;
        const newVal = currentVal + mod.val;
        itemObj.stats[mod.stat] = Number.isInteger(mod.val) ? newVal : parseFloat(newVal.toFixed(2));
    }
}

function generateProceduralModule(baseModuleKey) {
    if (typeof COMPONENTS_DATABASE === 'undefined') return null;

    // 1. Resolve base item (supports specific key or "RANDOM" fallback)
    let resolvedKey = baseModuleKey;
    if (!resolvedKey || resolvedKey === "RANDOM" || !COMPONENTS_DATABASE[resolvedKey]) {
        const eligibleKeys = Object.keys(COMPONENTS_DATABASE).filter(k => {
            const c = COMPONENTS_DATABASE[k];
            return c && c.cost > 0 && c.cost < 999999 && !k.match(/_\d+$/);
        });
        resolvedKey = eligibleKeys[Math.floor(Math.random() * eligibleKeys.length)] || "MILITARY_SHIELD_MOD";
    }

    const baseItem = COMPONENTS_DATABASE[resolvedKey];
    if (!baseItem) return null;

    // 2. Deep clone base item
    const newItem = JSON.parse(JSON.stringify(baseItem));
    if (!newItem.stats) newItem.stats = {};

    let rolledPrefix = Math.random() < 0.65;
    let rolledSuffix = Math.random() < 0.40;
    // Guarantee at least one modifier so procedural modules are never identical to stock store items
    if (!rolledPrefix && !rolledSuffix) rolledPrefix = true;

    // 3. Apply Prefix
    if (rolledPrefix) {
        const prefix = LOOT_PREFIXES[Math.floor(Math.random() * LOOT_PREFIXES.length)];
        newItem.name = `${prefix.name} ${newItem.name}`;
        newItem.cost = Math.floor((newItem.cost || 2500) * prefix.costMod);
        _applyProceduralModifier(newItem, prefix);
    }

    // 4. Apply Suffix
    if (rolledSuffix) {
        const suffix = LOOT_SUFFIXES[Math.floor(Math.random() * LOOT_SUFFIXES.length)];
        newItem.name = `${newItem.name} ${suffix.name}`;
        newItem.cost = Math.floor((newItem.cost || 2500) * suffix.costMod);
        _applyProceduralModifier(newItem, suffix);
    }

    // 5. Assign collision-safe unique ID and register in databases
    newItem.id = `${resolvedKey}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    COMPONENTS_DATABASE[newItem.id] = newItem;

    if (typeof COMMODITIES !== 'undefined' && !COMMODITIES[newItem.id]) {
        COMMODITIES[newItem.id] = {
            name: newItem.name,
            basePrice: Math.max(500, Math.floor((newItem.cost || 2000) * 0.6)),
            icon: "⚙️",
            weight: 1,
            isComponent: true,
            slot: newItem.slot,
            description: `${newItem.description} [Custom Calibrated Module - Install at an Engineering Bay].`
        };
    }

    return newItem;
}

window.generateProceduralModule = generateProceduralModule;

// ==========================================
// --- SELF-CONTAINED ENGINE HOOKS ---
// ==========================================

(function initShipsModuleHooks() {
    function attachShipHooks() {
        // 1. Fix getWeightedRandomOutcome in script.js so weight: 0 (used on Boss ships) is never treated as 1!
        if (typeof window.getWeightedRandomOutcome === 'function' && !window._shipsWeightPatched) {
            window.getWeightedRandomOutcome = function(outcomes) {
                if (!Array.isArray(outcomes) || outcomes.length === 0) return null;
                const validOutcomes = outcomes.filter(o => o && !o.isBoss && (o.weight === undefined || o.weight > 0));
                const pool = validOutcomes.length > 0 ? validOutcomes : outcomes;
                const totalWeight = pool.reduce((sum, o) => sum + (o.weight !== undefined ? o.weight : 1), 0);
                let random = Math.random() * totalWeight;

                for (const outcome of pool) {
                    const weight = outcome.weight !== undefined ? outcome.weight : 1;
                    if (random < weight) return outcome;
                    random -= weight;
                }
                return pool[pool.length - 1];
            };
            window._shipsWeightPatched = true;
        }

        // 2. Sync maxTroops capacity with ship chassis baseTroops + UTIL_MARINE_BARRACKS bonus
        if (typeof window.applyPlayerShipStats === 'function' && !window._shipsTroopCapHooked) {
            const origApplyStats = window.applyPlayerShipStats;
            window.applyPlayerShipStats = function() {
                origApplyStats.apply(this, arguments);
                if (typeof playerShip !== 'undefined' && playerShip) {
                    const chassis = SHIP_CLASSES[playerShip.shipClass] || {};
                    let maxTroops = chassis.baseTroops || 20;
                    const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
                    slots.forEach(s => {
                        const cId = playerShip.components ? playerShip.components[s] : null;
                        const comp = cId ? COMPONENTS_DATABASE[cId] : null;
                        if (comp && comp.stats && comp.stats.troopBonus) {
                            maxTroops += comp.stats.troopBonus;
                        }
                    });
                    if (!playerShip.forces) {
                        playerShip.forces = { marines: 0, heavyMechs: 0, dropDropships: 0, maxTroops: maxTroops };
                    } else {
                        playerShip.forces.maxTroops = maxTroops;
                    }
                }
            };
            window._shipsTroopCapHooked = true;
        }

        // 3. Safely probe for optional custom ship assets without triggering <img> error events
        if (typeof fetch === 'function' && window.location && window.location.protocol !== 'file:') {
            Object.values(SHIP_CLASSES).forEach(ship => {
                if (ship.customAsset) {
                    fetch(ship.customAsset, { method: 'HEAD' })
                        .then(res => {
                            if (res && res.ok) ship.image = ship.customAsset;
                        })
                        .catch(() => {});
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachShipHooks);
    } else {
        attachShipHooks();
    }
})();

// --- END OF FILE ships.js ---
