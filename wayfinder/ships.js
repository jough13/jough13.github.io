// --- START OF FILE ships.js ---

// ==========================================
// --- MANUFACTURER DOCTRINE PROFILES ---
// ==========================================

const MANUFACTURER_PROFILES = {
    CONCORD: {
        id: "CONCORD",
        name: "Concord Fleet Yards",
        headquarters: "Starbase Alpha & Ceti Alpha Shipyards",
        doctrine: "Balanced defense, precision optics, and high-capacity shield harmonics.",
        synergySummary: "3-Piece Set: Concord Authority (+20 Max Shields)"
    },
    KTHARR: {
        id: "KTHARR",
        name: "Karak-Tor Blood-Forges",
        headquarters: "Karak-Tor & Fortress Drakon",
        doctrine: "Heavy kinetic impact, reinforced ablative armor, and bio-regenerative plating.",
        synergySummary: "3-Piece Set: K'tharr Blood-Iron (+5 Weapon Damage)"
    },
    ECLIPSE: {
        id: "ECLIPSE",
        name: "Eclipse Shadow-Works",
        headquarters: "Station Umbra & Port Erebus",
        doctrine: "Low-emission smuggling baffles, high-evasion thrusters, and sensor-slicing ECM.",
        synergySummary: "3-Piece Set: Eclipse Shadow (+15% Evasion)"
    },
    FRONTIER: {
        id: "FRONTIER",
        name: "Independent Frontier Guilds",
        headquarters: "Valkyrie Drift, Helios Refinery & Port Nomad",
        doctrine: "Rugged, field-serviceable industrial hardware built for cargo hauls and deep-rim range.",
        synergySummary: "3-Piece Set: Scrapper's Luck (+50 Max Fuel)"
    },
    INDEPENDENT: {
        id: "INDEPENDENT",
        name: "Custom Artisan Workshops",
        headquarters: "Frothy Moon Outpost & Free Systems",
        doctrine: "Bespoke civilian instruments and restored pre-Concord precision optics.",
        synergySummary: "Standalone Specialist Hardware"
    },
    UNKNOWN: {
        id: "UNKNOWN",
        name: "Precursor / Reverse-Engineered",
        headquarters: "Classified (Silentium Expanse / Xerxes Spire)",
        doctrine: "Experimental prototypes incorporating exotic spacetime alloys and zero-point cores.",
        synergySummary: "Exotic Prototype Hardware"
    }
};
Object.freeze(MANUFACTURER_PROFILES);

// ==========================================
// --- SHIP CLASSES DATABASE (Shipyard) ---
// ==========================================

const SHIP_CLASSES = {
    LIGHT_FREIGHTER: {
        name: "Light Freighter",
        role: "Multi-Role Utility",
        manufacturer: "FRONTIER",
        builder: "Ceti Alpha Civilian Yards",
        length: "38m",
        crewSpec: "1–4 Personnel",
        image: "assets/light_freighter.png",
        baseHull: 100,
        cargoCapacity: 50,
        baseTroops: 20,
        baseCost: 0,
        baseSignature: 1.0,
        baseEvasion: 0.05,
        description: "A reliable, jack-of-all-trades frontier freighter. Easy to patch in deep space and forgiving at the helm.",
        chassisLore: "Built on a standardized tri-girder truss that hasn't changed in ninety years. Every outpost mechanic from Sol to Valkyrie Drift carries spare bolts for it.",
        chassisTrait: {
            name: "Frontier Modular Frame",
            desc: "-5% Sublight Fuel Burn",
            stats: { fuelEfficiency: 0.95 }
        },
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
        role: "Ultralight Striker",
        manufacturer: "FRONTIER",
        builder: "Independent Rim Assemblers",
        length: "16m",
        crewSpec: "1 Pilot (Cramped)",
        image: "assets/void_skiff.png",
        baseHull: 50,
        cargoCapacity: 15,
        baseTroops: 10,
        baseCost: 2500,
        baseSignature: 0.4,
        baseEvasion: 0.25,
        description: "Fast, fragile, and cheap. Little more than a cockpit welded to an oversized reactor core.",
        chassisLore: "Originally designed as orbital tug pods before rim racers stripped out the safety bulkheads and wired the fusion bus straight into the weapon rail.",
        chassisTrait: {
            name: "Direct-Link Fire Control",
            desc: "+5% Weapon Accuracy",
            stats: { accuracyBonus: 0.05 }
        },
        loreKey: "LORE_SHIP_VOID_SKIFF",
        ability: {
            name: "Overload",
            desc: "Deals 40 direct damage straight to enemy hull.",
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
        role: "Fast Blockade Runner",
        manufacturer: "CONCORD",
        builder: "Concord Express Works",
        length: "32m",
        crewSpec: "1–3 Personnel",
        image: "assets/courier.png",
        baseHull: 115,
        cargoCapacity: 65,
        baseTroops: 20,
        baseCost: 6500,
        baseSignature: 0.8,
        baseEvasion: 0.10,
        description: "A sleek professional courier balancing respectable cargo bays, speed, and reinforced bulkheads.",
        chassisLore: "Commissioned to carry diplomatic pouches between Starbase Alpha and Cygnus Prime, the Courier outruns most pirate bruisers without sacrificing payload.",
        chassisTrait: {
            name: "Slipstream Fairings",
            desc: "-10% Sublight Fuel Burn",
            stats: { fuelEfficiency: 0.90 }
        },
        loreKey: "LORE_SHIP_COURIER",
        ability: {
            name: "Precision Burn",
            desc: "Engages evasion and guarantees your next shot hits.",
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
        role: "Dogfighter",
        manufacturer: "CONCORD",
        builder: "Aegis Interceptor Division",
        length: "21m",
        crewSpec: "1–2 Personnel",
        image: "assets/interceptor.png",
        baseHull: 75,
        cargoCapacity: 20,
        baseTroops: 15,
        baseCost: 8000,
        baseSignature: 0.5,
        baseEvasion: 0.20,
        description: "Built for pure speed and combat agility. Favored by bounty hunters patrolling the outer rim.",
        chassisLore: "Surplus Concord patrol frames de-militarized for licensed bounty hunters. Tight vernier thrusters let skilled pilots dance around capital batteries.",
        chassisTrait: {
            name: "Twin-Gimbal Hardpoints",
            desc: "+4 Base Weapon Damage",
            stats: { damageBonus: 4 }
        },
        loreKey: "LORE_SHIP_INTERCEPTOR",
        ability: {
            name: "Afterburner",
            desc: "Engages high-G evasion protocols for 1 turn.",
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
        role: "Deep-Space Recon",
        manufacturer: "CONCORD",
        builder: "Concord Astrometrics Guild",
        length: "46m",
        crewSpec: "2–5 Personnel",
        image: "assets/explorer.png",
        baseHull: 120,
        cargoCapacity: 40,
        baseTroops: 20,
        baseCost: 10000,
        baseSignature: 1.2,
        baseEvasion: 0.08,
        description: "Long-range survey vessel built for extended voyages into uncharted nebulae and anomaly belts.",
        chassisLore: "Outfitted with redundant life-support scrubbers and wide-aperture sensor booms designed for multi-cycle surveys beyond Sector 15.",
        chassisTrait: {
            name: "Extended Deuterium Baffles",
            desc: "+40 Max Fuel",
            stats: { fuelBonus: 40 }
        },
        loreKey: "LORE_SHIP_EXPLORER",
        ability: {
            name: "Sensor Blind",
            desc: "Stuns enemy for 1 turn (disrupts enemy attack).",
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
        role: "Astrometric Research",
        manufacturer: "CONCORD",
        builder: "University of Cygnus Prime",
        length: "52m",
        crewSpec: "2–6 Specialists",
        image: "assets/explorer.png",
        baseHull: 135,
        cargoCapacity: 75,
        baseTroops: 20,
        baseCost: 14000,
        baseSignature: 0.9,
        baseEvasion: 0.12,
        description: "Specialized astrometric research vessel fitted with gravimetric lenses and shielded sample bays.",
        chassisLore: "Co-engineered by Cygnus Prime astrophysicists to catalog pulsars, singularities, and Precursor ruins without frying sensitive spectrometers.",
        chassisTrait: {
            name: "Astrometric Lab Core",
            desc: "+30 Max Fuel & +5% Weapon Accuracy",
            stats: { fuelBonus: 30, accuracyBonus: 0.05 }
        },
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
        role: "Bulk Freighter",
        manufacturer: "FRONTIER",
        builder: "Xy-Corp Orbital Foundry",
        length: "84m",
        crewSpec: "3–8 Personnel",
        image: "assets/heavy_hauler.png",
        baseHull: 150,
        cargoCapacity: 120,
        baseTroops: 30,
        baseCost: 15000,
        baseSignature: 1.8,
        baseEvasion: 0.0,
        description: "A veritable industrial fortress with cavernous cargo holds engineered for inter-sector trade routes.",
        chassisLore: "Turns like a continental plate, but moves enough Refined Alloy and Habitation Modules in a single run to jump-start an entire frontier colony.",
        chassisTrait: {
            name: "Reinforced Cargo Ribs",
            desc: "+20 Max Hull",
            stats: { hullBonus: 20 }
        },
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
        role: "Industrial Mining Barge",
        manufacturer: "FRONTIER",
        builder: "Valkyrie Drift Collective",
        length: "68m",
        crewSpec: "2–6 Prospectors",
        image: "assets/rock_hopper.png",
        baseHull: 180,
        cargoCapacity: 150,
        baseTroops: 30,
        baseCost: 22000,
        baseSignature: 1.5,
        baseEvasion: 0.0,
        description: "Heavy industrial mining barge plated to shrug off asteroid collisions and deep-rim claim jumpers.",
        chassisLore: "Double-walled ore hoppers lined with reclaimed ferric slag allow the Rock-Hopper to park inside dense belts and soak up fire until pirates run dry.",
        chassisTrait: {
            name: "Ablative Slag-Armor",
            desc: "+25 Max Hull & +10 Max Shields",
            stats: { hullBonus: 25, shieldBonus: 10 }
        },
        loreKey: "LORE_SHIP_ROCK_HOPPER",
        ability: {
            name: "Shield Hardening",
            desc: "Fully restores Shields to 100%.",
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
        role: "Diplomatic Cruiser",
        manufacturer: "CONCORD",
        builder: "Aegis Dyson Prestige Works",
        length: "95m",
        crewSpec: "4–12 Personnel",
        image: "assets/star_galleon.png",
        baseHull: 200,
        cargoCapacity: 80,
        baseTroops: 35,
        baseCost: 50000,
        baseSignature: 2.0,
        baseEvasion: 0.02,
        description: "The pinnacle of luxury and defense, outfitted with Concord VIP transponders and heavy bulkheads.",
        chassisLore: "Built for Concord envoys and corporate magnates. Beneath its walnut-trimmed lounges sits a redundant military deflector bus.",
        chassisTrait: {
            name: "Diplomatic Shield Bus",
            desc: "+35 Max Shields",
            stats: { shieldBonus: 35 }
        },
        loreKey: "LORE_SHIP_STAR_GALLEON",
        ability: {
            name: "Diplomatic Immunity",
            desc: "Instantly disengages standard hostiles (against Bosses, boosts +60 Shields & Evasion).",
            id: "ESCAPE",
            cooldown: 10,
            execute: (combatCtx, playerStats) => {
                if (combatCtx && (combatCtx.isLegendary || (combatCtx.ship && combatCtx.ship.isBoss))) {
                    playerStats.shields = Math.min(playerStats.maxShields, playerStats.shields + 60);
                    playerStats.isEvading = true;
                    return `Diplomatic frequencies jammed by hostile commander! Rerouted power to emergency deflectors (+60 Shields & Evasion).`;
                }
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
        role: "Deep-Space Rescue Tug",
        manufacturer: "FRONTIER",
        builder: "Port Nomad Collective Yards",
        length: "44m",
        crewSpec: "1–4 Rescuers",
        image: "assets/courier.png",
        baseHull: 165,
        cargoCapacity: 95,
        baseTroops: 25,
        baseCost: 28000,
        baseSignature: 0.9,
        baseEvasion: 0.12,
        description: "A heavily modified deep-space rescue tug painted in high-visibility amber. Features oversized transfer coils and reinforced grapplers.",
        chassisLore: "Awarded only to trusted friends of Port Nomad. Its cryo-manifolds siphon hydrogen cleanly even under hostile fire, honoring the Collective's oath across the black.",
        chassisTrait: {
            name: "Cryo-Transfer Manifolds",
            desc: "+60 Max Fuel & -10% Fuel Burn",
            stats: { fuelBonus: 60, fuelEfficiency: 0.90 }
        },
        loreKey: "FACTION_FUEL_RATS",
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
                    playerFuel = Math.min(MAX_FUEL, Math.round((playerFuel + 15) * 10) / 10);
                }
                return `Refueling umbilicus fired! Siphoned enemy power grid (+Shields & +15 Fuel).`;
            }
        }
    },
    ECLIPSE_CORSAIR: {
        name: "Eclipse Corsair",
        role: "Boarding Raider",
        manufacturer: "ECLIPSE",
        builder: "Port Erebus Shadow-Docks",
        length: "36m",
        crewSpec: "2–5 Raiders",
        image: "assets/interceptor.png",
        baseHull: 130,
        cargoCapacity: 55,
        baseTroops: 30,
        baseCost: 32000,
        baseSignature: 0.45,
        baseEvasion: 0.16,
        description: "A sleek Cartel boarding raider equipped with magnetic grapplers and low-emission thrusters.",
        chassisLore: "Favored by Cartel ship-breakers who prefer taking freighters intact. Its bow EMP harpoon collapses deflectors so marine teams can breach immediately.",
        chassisTrait: {
            name: "Grappler Hardpoints",
            desc: "+5 Base Weapon Damage",
            stats: { damageBonus: 5 }
        },
        loreKey: "FACTION_ECLIPSE",
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
        role: "Assault War-Hulk",
        manufacturer: "KTHARR",
        builder: "Karak-Tor Orbital Magma-Forges",
        length: "78m",
        crewSpec: "4–10 Warriors",
        image: "assets/ship_bloodbarge.png",
        baseHull: 350,
        cargoCapacity: 60,
        baseTroops: 45,
        baseCost: 50000,
        baseSignature: 1.9,
        baseEvasion: 0.02,
        description: "A brutal, heavily armored war-hulk forged in volcanic gravity wells. Lacks finesse, but hits like a localized asteroid strike.",
        chassisLore: "Cast from layered basalt-iron ribs around a reinforced ramming prow. K'tharr shipwrights refuse to install escape pods, considering them an insult to the hull.",
        chassisTrait: {
            name: "Volcanic Forge-Plating",
            desc: "+8 Base Weapon Damage",
            stats: { damageBonus: 8 }
        },
        loreKey: "LORE_SHIP_BLOODBARGE",
        reqFaction: "KTHARR",
        minRep: 30,
        ability: {
            name: "Ramming Speed",
            desc: "Deals 60 direct hull damage at the cost of up to 15 self-damage.",
            id: "CRIT",
            cooldown: 5,
            execute: (combatCtx, playerStats) => {
                const dmg = 60;
                const actualSelfDmg = Math.min(15, Math.max(0, playerStats.hull - 1));
                combatCtx.pirateHull -= dmg;
                playerStats.hull -= actualSelfDmg;
                return `RAMMING SPEED! Dealt ${dmg} damage to enemy, took ${actualSelfDmg} structural damage!`;
            }
        }
    },
    ECLIPSE_NIGHTRUNNER: {
        name: "Eclipse Night-Runner",
        role: "Stealth Smuggler",
        manufacturer: "ECLIPSE",
        builder: "Station Umbra Clandestine Yard",
        length: "40m",
        crewSpec: "1–3 Ghosts",
        image: "assets/ship_nightrunner.png",
        baseHull: 90,
        cargoCapacity: 80,
        baseTroops: 20,
        baseCost: 55000,
        baseSignature: 0.2,
        baseEvasion: 0.18,
        description: "A stealth smuggling vessel coated in sensor-absorbent polymer, rendering it a ghost on Concord radars.",
        chassisLore: "Constructed in zero-emission drydocks hidden deep inside the western rim. Its faceted obsidian hull swallows active LIDAR sweeps and conceals deep-hold smuggling runs.",
        chassisTrait: {
            name: "Polymer Stealth Coating",
            desc: "-15% Radar Signature",
            stats: { signatureMod: -0.15 }
        },
        loreKey: "LORE_SHIP_NIGHTRUNNER",
        reqFaction: "ECLIPSE",
        minRep: 30,
        ability: {
            name: "Sensor Ghost",
            desc: "Engages phase-shifter evasion against incoming fire.",
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
        role: "Heavy Patrol Escort",
        manufacturer: "CONCORD",
        builder: "Ceti Alpha Naval Drydocks",
        length: "58m",
        crewSpec: "3–8 Navy Crew",
        image: "assets/ship_aegis.png",
        baseHull: 250,
        cargoCapacity: 40,
        baseTroops: 35,
        baseCost: 65000,
        baseSignature: 1.6,
        baseEvasion: 0.05,
        description: "A Concord military patrol vessel. Heavily armored and built for pure combat superiority.",
        chassisLore: "The steel fist of Concord maritime law. Civilian licensing requires high Aegis Command clearance and a clean SEC-COM dossier.",
        chassisTrait: {
            name: "Military Fire-Control Bus",
            desc: "+6 Base Weapon Damage & +20 Max Shields",
            stats: { damageBonus: 6, shieldBonus: 20 }
        },
        loreKey: "LORE_SHIP_AEGIS",
        reqFaction: "CONCORD",
        minRep: 30,
        ability: {
            name: "Phalanx Array",
            desc: "Instantly restores shields to 100% and engages evasion.",
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
        role: "Sector Command Fortress",
        manufacturer: "CONCORD",
        builder: "Aegis Dyson Naval Foundry",
        length: "142m",
        crewSpec: "12–30 Fleet Crew",
        image: "assets/ship_aegis.png",
        baseHull: 420,
        cargoCapacity: 110,
        baseTroops: 60,
        baseCost: 115000,
        baseSignature: 2.2,
        baseEvasion: 0.03,
        description: "The undisputed apex of Concord naval engineering. A mobile sector command fortress bristling with spinal battery mounts and troop bays.",
        chassisLore: "Designed to anchor contested border sectors alone against K'tharr war-fleets. Carries full marine drop-bays and a spinal capacitor array capable of splitting cruisers.",
        chassisTrait: {
            name: "Sector Command Grid",
            desc: "+10 Base Weapon Damage & +40 Max Shields",
            stats: { damageBonus: 10, shieldBonus: 40 }
        },
        loreKey: "LORE_SHIP_DREADNOUGHT",
        reqFaction: "CONCORD",
        minRep: 50,
        ability: {
            name: "Spinal Broadside",
            desc: "Fires all batteries for 75 damage and bolsters Shields by +30.",
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
    RAIDER:               { id: "RAIDER",               name: "Pirate Raider",             baseHull: 60,  baseShields: 20,  weight: 5 },
    STRIKER:              { id: "STRIKER",              name: "Pirate Striker",            baseHull: 45,  baseShields: 35,  weight: 3 },
    PIRATE_INTERCEPTOR:   { id: "PIRATE_INTERCEPTOR",   name: "Void Vulture Interceptor",  baseHull: 55,  baseShields: 45,  weight: 2.2 },
    BRUISER:              { id: "BRUISER",              name: "Pirate Bruiser",            baseHull: 80,  baseShields: 15,  weight: 2 },
    VOID_VULTURE_CORSAIR: { id: "VOID_VULTURE_CORSAIR", name: "Void Vulture Corsair",      baseHull: 95,  baseShields: 50,  weight: 1.4 },
    PIRATE_GUNSHIP:       { id: "PIRATE_GUNSHIP",       name: "Void Vulture Gunship",      baseHull: 110, baseShields: 45,  weight: 1 },
    ECLIPSE_ASSASSIN:     { id: "ECLIPSE_ASSASSIN",     name: "Cartel Shadow-Interceptor", baseHull: 70,  baseShields: 70,  weight: 1 },
    ECLIPSE_PHANTOM:      { id: "ECLIPSE_PHANTOM",      name: "Eclipse Phantom Raider",    baseHull: 85,  baseShields: 85,  weight: 0.9 },
    ECLIPSE_GUNSHIP:      { id: "ECLIPSE_GUNSHIP",      name: "Cartel Enforcer Gunship",   baseHull: 125, baseShields: 65,  weight: 0.8 },
    PIRATE_DREADNOUGHT:   { id: "PIRATE_DREADNOUGHT",   name: "Cartel Pocket-Dreadnought", baseHull: 175, baseShields: 60,  weight: 0.4 },

    // --- K'THARR HEGEMONY ---
    KTHARR_SCOUT:         { id: "KTHARR_SCOUT",         name: "K'tharr Vanguard",          baseHull: 90,  baseShields: 10,  weight: 3 },
    KTHARR_RAIDER:        { id: "KTHARR_RAIDER",        name: "K'tharr Blood-Cutter",      baseHull: 110, baseShields: 15,  weight: 2.2 },
    KTHARR_GUNSHIP:       { id: "KTHARR_GUNSHIP",       name: "K'tharr Siege Gunship",     baseHull: 125, baseShields: 20,  weight: 1.5 },
    KTHARR_DESTROYER:     { id: "KTHARR_DESTROYER",     name: "K'tharr War-Hulk",          baseHull: 150, baseShields: 20,  weight: 1 },
    KTHARR_CRUISER:       { id: "KTHARR_CRUISER",       name: "K'tharr Siege Cruiser",     baseHull: 185, baseShields: 35,  weight: 0.7 },

    // --- CONCORD SECURITY ---
    CONCORD_PATROL:       { id: "CONCORD_PATROL",       name: "Concord Patrol",            baseHull: 60,  baseShields: 60,  weight: 3 },
    CONCORD_INTERCEPTOR:  { id: "CONCORD_INTERCEPTOR",  name: "Aegis Pursuit Interceptor", baseHull: 65,  baseShields: 85,  weight: 1.8 },
    CONCORD_ENFORCER:     { id: "CONCORD_ENFORCER",     name: "Concord Enforcer",          baseHull: 80,  baseShields: 100, weight: 1 },
    CONCORD_CORVETTE:     { id: "CONCORD_CORVETTE",     name: "Concord Aegis Corvette",    baseHull: 95,  baseShields: 120, weight: 0.8 }
};

// Define Boss ships as non-enumerable properties so random patrol/pirate pools never roll an un-escapable Boss
Object.defineProperties(PIRATE_SHIP_CLASSES, {
    KTHARR_WARLORD: {
        value: { id: "KTHARR_WARLORD", name: "K'tharr Blood-Dreadnought", baseHull: 260, baseShields: 50, weight: 0, isBoss: true },
        enumerable: false, writable: true, configurable: true
    },
    BOSS_VOSS: {
        value: { id: "BOSS_VOSS", name: "The Butcher's Blade", baseHull: 400, baseShields: 150, weight: 0, isBoss: true },
        enumerable: false, writable: true, configurable: true
    },
    BOSS_THORNE: {
        value: { id: "BOSS_THORNE", name: "Rogue Aegis Interceptor", baseHull: 200, baseShields: 350, weight: 0, isBoss: true },
        enumerable: false, writable: true, configurable: true
    }
});

// ==========================================
// --- COMPONENTS DATABASE ---
// ==========================================

const COMPONENTS_DATABASE = {
    // --- PROTOTYPE & BOSS GEAR (CRAFTING / BOSS LOOT ONLY) ---
    "WEAPON_VOID_CASTER": {
        name: "Void Caster Prototype", type: "weapon", slot: "weapon", cost: 0, manufacturer: "UNKNOWN",
        description: "An experimental weapon firing coherent void energy. Incredible damage output and critical strike capability.",
        stats: { damage: 35, hitChance: 0.85, critChance: 0.25, vsShieldBonus: 15 }, loreKey: "PHENOMENON_VOID_CRYSTALS"
    },
    "SHIELD_AETHER_WARD": {
        name: "Aether Ward Emitter", type: "shield", slot: "shield", cost: 0, manufacturer: "UNKNOWN",
        description: "A prototype shield utilizing phase-shifted tech to rapidly disperse kinetic and thermal impacts.",
        stats: { maxShields: 200, rechargeRate: 5, evasionBonus: 0.05 }, loreKey: "TECH_PHASE_SHIFT_ALLOY"
    },
    "ENGINE_SLIPSTREAM": {
        name: "Slipstream Drive", type: "engine", slot: "engine", cost: 0, manufacturer: "UNKNOWN",
        description: "Reverse-engineered from Precursor tech. Provides immense fuel reserves and peak sublight efficiency.",
        stats: { maxFuel: 500, fuelEfficiency: 0.4, evasionBonus: 0.12 }, loreKey: "XENO_PRECURSORS"
    },
    "WEAPON_SINGULARITY_CANNON": {
        name: "Singularity Cannon", type: "weapon", slot: "weapon", manufacturer: "UNKNOWN",
        description: "Fires localized micro-black holes. Devastating hull damage. Prototype hardwired to ship.",
        cost: 999999,
        stats: { damage: 85, hitChance: 0.85, critChance: 0.20, maxAmmo: 8 }
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
        stats: { damage: 45, hitChance: 0.90, critChance: 0.12 }, loreKey: "LORE_COMP_PULSE_LASER"
    },
    "WEAPON_CONCORD_TORPEDO_POD": {
        name: "Aegis Photon Torpedo Pod", type: "weapon", slot: "weapon", cost: 11500, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 30,
        description: "Guided fleet anti-capital torpedo launcher. Heavy burst damage with reliable target tracking.",
        stats: { damage: 65, hitChance: 0.80, critChance: 0.18, maxAmmo: 6 }, loreKey: "LORE_COMP_MISSILE_LAUNCHER"
    },
    "WEAPON_CONCORD_RAILGUN": {
        name: "Concord 'Punisher' Railgun", type: "weapon", slot: "weapon", cost: 15000, manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 40,
        description: "Accelerates tungsten slugs to a fraction of lightspeed. Requires specialized ammo clips.",
        stats: { damage: 85, hitChance: 0.75, critChance: 0.20, maxAmmo: 10 }, loreKey: "LORE_COMP_MASS_DRIVER"
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
        description: "Pierces through nebulae and stealth fields with ease. Highly classified tech.",
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
        name: "Empty Slot", type: "utility", slot: "utility", manufacturer: "NONE",
        description: "No utility module installed.", cost: 0, stats: {}
    },
    UTIL_ORBITAL_EXTRACTOR: {
        name: "Orbital Extractor", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "Fires localized tectonic charges to strip-mine planetary surfaces from orbit. Unlocks orbital planetary extraction.",
        cost: 8500, stats: { unlocksMining: true, cargoBonus: 10 }, loreKey: "LORE_COMP_SCANNER"
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
    UTIL_FRONTIER_SALVAGE_RIG: {
        name: "Frontier Salvage Rig", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "Welded grapple-arms and external ore bins favored by outer-rim scrappers. (+25 Cargo, +20 Max Hull)",
        cost: 3800, stats: { cargoBonus: 25, hullBonus: 20 }, loreKey: "LORE_SHIP_ROCK_HOPPER"
    },
    UTIL_FRONTIER_REPAIR_BAY: {
        name: "Field Welding Rig", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "Compact hull-crawler bots that weld hairline fractures while in transit. (+30 Max Hull, +10 Cargo, Passive Hull Regen)",
        cost: 5400, stats: { hullBonus: 30, cargoBonus: 10, passiveRegen: true }, loreKey: "LORE_SHIP_LIGHT_FREIGHTER"
    },
    UTIL_FUEL_SCOOP_BOOSTER: {
        name: "Reserve Hydrogen Tanks", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "Conformal external deuterium bladders with optimized injector manifolds. (+80 Max Fuel, -10% Fuel Burn)",
        cost: 3200, stats: { fuelBonus: 80, fuelEfficiency: 0.90 }, loreKey: "LORE_COMP_ENGINE"
    },
    UTIL_DOSIMETRY_ARRAY: {
        name: "Radiological Dosimeter", type: "utility", slot: "utility", manufacturer: "CONCORD",
        description: "A professional-grade health physics suite. Completely shields the vessel and crew from environmental radiation hazards.",
        cost: 3500, stats: { radImmunity: true, shieldBonus: 15 }, loreKey: "LORE_COMP_SCANNER"
    },
    UTIL_THERMAL_BAFFLES: {
        name: "Aegis Thermal Heatsinks", type: "utility", slot: "utility", manufacturer: "CONCORD",
        description: "Active liquid-nitrogen radiator vanes that reinforce bulkheads and stabilize shield emitters. (+25 Hull, +20 Shields, +5% Evasion)",
        cost: 4600, stats: { hullBonus: 25, shieldBonus: 20, evasionBonus: 0.05 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    UTIL_TARGETING_COMPUTER: {
        name: "Gyroscopic Targeting AI", type: "utility", slot: "utility", manufacturer: "FRONTIER",
        description: "An automated tracking system that syncs ship gimbals to enemy vectors. Increases Weapon Hit Chance by 15%.",
        cost: 4200, stats: { accuracyBonus: 0.15 }, loreKey: "LORE_COMP_SCANNER"
    },
    UTIL_ECLIPSE_ECM_SUITE: {
        name: "Eclipse Chaff & ECM Suite", type: "utility", slot: "utility", manufacturer: "ECLIPSE",
        description: "Active radar spoofing array that masks ship emissions and throws off hostile fire-control. (-25% Signature, +10% Evasion)",
        cost: 4800, stats: { signatureMod: -0.25, evasionBonus: 0.10 }, loreKey: "FACTION_ECLIPSE"
    },
    UTIL_ECLIPSE_DECOY_BAY: {
        name: "Shadow Countermeasure Pod", type: "utility", slot: "utility", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 35,
        description: "Master-grade Cartel smuggling bay paired with active chaff dispensers. (+15 Cargo, Conceals Contraband, -35% Signature, +12% Evasion)",
        cost: 7800, stats: { cargoBonus: 15, isSmuggler: true, evasionBonus: 0.12, signatureMod: -0.35 }, loreKey: "FACTION_ECLIPSE_SMUGGLING"
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
    WEAPON_FRONTIER_MINING_LASER: {
        name: "Heavy Cutter Beam", type: "weapon", slot: "weapon", manufacturer: "FRONTIER",
        description: "Valkyrie Drift industrial ore-cutter refitted for combat. Reliable accuracy, shield disruption, and compact under-slung mounts (+5 Cargo).",
        cost: 3400, stats: { damage: 16, hitChance: 0.84, critChance: 0.08, vsShieldBonus: 6, cargoBonus: 5 }, loreKey: "LORE_COMP_BEAM_LASER"
    },
    WEAPON_AUTOCANNON_MK2: {
        name: "Frontier Rotary Autocannon", type: "weapon", slot: "weapon", manufacturer: "FRONTIER",
        description: "Heavy twin-linked slug thrower bolted together on rim shipyards. No ammo limits, brutal kinetic punch.",
        cost: 4200, stats: { damage: 20, hitChance: 0.74, critChance: 0.14 }, loreKey: "LORE_COMP_KINETIC_WEAPON"
    },
    WEAPON_FUELRAT_ARC_DISCHARGER: {
        name: "Fuel Rats Static Discharger", type: "weapon", slot: "weapon", manufacturer: "FRONTIER", reqFaction: "FUEL_RATS", minRep: 5,
        description: "High-precision arc projector used by Port Nomad rescue crews to strip pirate deflectors without blowing the hull.",
        cost: 4400, stats: { damage: 14, hitChance: 0.90, vsShieldBonus: 26, critChance: 0.08 }, loreKey: "FACTION_FUEL_RATS"
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
    WEAPON_ION_CANNON_MK2: {
        name: "Concord Arc-Ion Emitter", type: "weapon", slot: "weapon", manufacturer: "CONCORD",
        description: "High-voltage fleet ion projector engineered to collapse heavy pirate deflectors in seconds.",
        cost: 5200, stats: { damage: 14, hitChance: 0.86, vsShieldBonus: 22, critChance: 0.10 }, loreKey: "LORE_COMP_ION_WEAPON"
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
    WEAPON_PLASMA_LANCE: {
        name: "Karak-Tor Siege Lance", type: "weapon", slot: "weapon", manufacturer: "KTHARR", reqFaction: "KTHARR", minRep: 35,
        description: "Spinal magma-plasma lance forged by K'tharr smiths. Brutal critical impact against capital armor.",
        cost: 12500, stats: { damage: 48, hitChance: 0.76, critChance: 0.28 }, loreKey: "FACTION_KTHARR"
    },
    WEAPON_ECLIPSE_RAIL_REPEATER: {
        name: "Eclipse Silent Repeater", type: "weapon", slot: "weapon", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 15,
        description: "Flash-suppressed electromagnetic flechette cannon engineered for Cartel ambush wings.",
        cost: 6800, stats: { damage: 26, hitChance: 0.88, critChance: 0.22, signatureMod: -0.10 }, loreKey: "FACTION_ECLIPSE"
    },
    WEAPON_VOID_SIPHON_BEAM: {
        name: "Shadow-Stalker Beam", type: "weapon", slot: "weapon", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 35,
        description: "Dark-spectrum cutting beam built for silent ambushes. Melts shields with pinpoint accuracy.",
        cost: 11800, stats: { damage: 34, hitChance: 0.92, critChance: 0.20, vsShieldBonus: 20, signatureMod: -0.15 }, loreKey: "FACTION_ECLIPSE"
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
    SHIELD_FRONTIER_CAPACITOR: {
        name: "Frontier Heavy Capacitor", type: "shield", slot: "shield", manufacturer: "FRONTIER",
        description: "Oversized industrial mining deflector repurposed for deep-rim haulers. Reliable and spacious.",
        cost: 4800, stats: { maxShields: 110, rechargeRate: 2.2, hullBonus: 15 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    SHIELD_FUELRAT_CRYO_SCREEN: {
        name: "Nomad Cryo-Deflector", type: "shield", slot: "shield", manufacturer: "FRONTIER", reqFaction: "FUEL_RATS", minRep: 5,
        description: "Port Nomad rescue shield integrated with auxiliary deuterium heat-exchangers. (+115 Shields, +35 Max Fuel)",
        cost: 5200, stats: { maxShields: 115, rechargeRate: 2.8, fuelBonus: 35 }, loreKey: "FACTION_FUEL_RATS"
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
    SHIELD_KTHARR_BONEWEAVE: {
        name: "K'tharr Carapace Emitter", type: "shield", slot: "shield", manufacturer: "KTHARR", reqFaction: "KTHARR", minRep: 20,
        description: "Dense gravimetric barrier interwoven with chitinous hull reinforcement ribs. (+45 Max Hull)",
        cost: 7600, stats: { maxShields: 125, rechargeRate: 2, hullBonus: 45 }, loreKey: "FACTION_KTHARR"
    },
    SHIELD_KTHARR_VOLCANIC_GRID: {
        name: "Karak-Tor Magma Ward", type: "shield", slot: "shield", manufacturer: "KTHARR", reqFaction: "KTHARR", minRep: 35,
        description: "Apex K'tharr siege barrier built to endure orbital bombardments and volcanic plasma storms. (+165 Shields, +55 Max Hull)",
        cost: 11200, stats: { maxShields: 165, rechargeRate: 2.2, hullBonus: 55 }, loreKey: "FACTION_KTHARR"
    },
    SHIELD_STEALTH_GRID: {
        name: "Whisper Deflector Grid", type: "shield", slot: "shield", manufacturer: "ECLIPSE",
        description: "A modified shield array that sacrifices raw capacity to absorb radar emissions. Reduces ship signature.",
        cost: 4200, stats: { maxShields: 40, rechargeRate: 2, signatureMod: -0.2 }, loreKey: "LORE_COMP_SHIELD_GENERATOR"
    },
    SHIELD_ECLIPSE_MIRAGE: {
        name: "Eclipse Mirage Field", type: "shield", slot: "shield", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 20,
        description: "Refractive holo-shield that distorts enemy optics while keeping radar profile razor-thin.",
        cost: 7400, stats: { maxShields: 95, rechargeRate: 3.5, evasionBonus: 0.10, signatureMod: -0.20 }, loreKey: "FACTION_ECLIPSE"
    },
    SHIELD_ECLIPSE_VOID_SHROUD: {
        name: "Umbra Phase-Shroud", type: "shield", slot: "shield", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 35,
        description: "Station Umbra's flagship stealth barrier. Rapid regeneration, optical distortion, and deep emission masking.",
        cost: 10800, stats: { maxShields: 120, rechargeRate: 4.0, evasionBonus: 0.14, signatureMod: -0.25 }, loreKey: "FACTION_ECLIPSE"
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
    ENGINE_FRONTIER_MULE: {
        name: "Frontier Mule Deep-Burner", type: "engine", slot: "engine", manufacturer: "FRONTIER",
        description: "Heavy-duty long-rim freighter engine with integrated structural cargo bracing. (+420 Max Fuel, +15 Cargo)",
        cost: 6200, stats: { maxFuel: 420, fuelEfficiency: 0.85, cargoBonus: 15 }, loreKey: "LORE_COMP_ENGINE"
    },
    ENGINE_FUELRAT_SPRINT: {
        name: "Fuel Rats Rescue Thrusters", type: "engine", slot: "engine", manufacturer: "FRONTIER", reqFaction: "FUEL_RATS", minRep: 8,
        description: "High-efficiency long-rim rescue drive tuned at Port Nomad for cross-sector emergency sprints. (+460 Max Fuel, -35% Fuel Burn, +8% Evasion)",
        cost: 6400, stats: { maxFuel: 460, fuelEfficiency: 0.65, evasionBonus: 0.08 }, loreKey: "FACTION_FUEL_RATS"
    },
    ENGINE_IONFLOW_MK2: {
        name: "IonFlow Drive Mk2", type: "engine", slot: "engine", manufacturer: "CONCORD",
        description: "Advanced ion engine, significantly better fuel efficiency.",
        cost: 4000, stats: { maxFuel: 275, fuelEfficiency: 0.75 }, loreKey: "LORE_COMP_ENGINE"
    },
    ENGINE_CONCORD_INTERCEPT: {
        name: "Aegis Vector-Thrust Drive", type: "engine", slot: "engine", manufacturer: "CONCORD", reqFaction: "CONCORD", minRep: 15,
        description: "Precision vectored-nozzle patrol thrusters built for rapid interception and clean evasion.",
        cost: 6800, stats: { maxFuel: 290, fuelEfficiency: 0.70, evasionBonus: 0.10 }, loreKey: "LORE_COMP_ENGINE"
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
    ENGINE_VOID_GLIDER: {
        name: "Eclipse Whisper-Core Drive", type: "engine", slot: "engine", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 30,
        description: "Top-tier cold-burn smuggling drive combining deep range, quiet emissions, and razor-sharp thrust vectoring.",
        cost: 9200, stats: { maxFuel: 320, fuelEfficiency: 0.75, evasionBonus: 0.12, signatureMod: -0.25 }, loreKey: "LORE_SHIP_NIGHTRUNNER"
    },
    ENGINE_KTHARR_AFTERBURNER: {
        name: "K'tharr War-Torch Drive", type: "engine", slot: "engine", manufacturer: "KTHARR",
        description: "Heavy armored thrusters forged for K'tharr assault ships. Boosts hull integrity (+25 Hull) and combat thrust.",
        cost: 4800, stats: { maxFuel: 280, fuelEfficiency: 0.90, hullBonus: 25, evasionBonus: 0.05 }, loreKey: "FACTION_KTHARR"
    },
    ENGINE_KTHARR_SIEGE_DRIVE: {
        name: "Karak-Tor Ram-Thrusters", type: "engine", slot: "engine", manufacturer: "KTHARR", reqFaction: "KTHARR", minRep: 25,
        description: "Armored assault motivators engineered for K'tharr war-hulks. Reinforces frame (+45 Hull) and channels recoil into weapons (+4 Damage).",
        cost: 8400, stats: { maxFuel: 310, fuelEfficiency: 0.85, hullBonus: 45, damageBonus: 4 }, loreKey: "FACTION_KTHARR"
    },

    // --- SCANNERS ---
    SCANNER_BASIC_SUITE: {
        name: "Standard Sensor Suite", type: "scanner", slot: "scanner", manufacturer: "FRONTIER",
        description: "Basic sensor package. Provides essential data.",
        cost: 0, stats: { scanBonus: 0 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_FRONTIER_PROSPECTOR: {
        name: "Frontier Prospector Array", type: "scanner", slot: "scanner", manufacturer: "FRONTIER",
        description: "Deep-core gravimetric scanner designed to pinpoint mineral seams and salvage debris.",
        cost: 2400, stats: { scanBonus: 0.15, cargoBonus: 5, accuracyBonus: 0.04 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_DEEP_RANGE_A: {
        name: "Deep-Range Array A", type: "scanner", slot: "scanner", manufacturer: "CONCORD",
        description: "Improved sensor resolution. May reveal more details or rarer finds.",
        cost: 1500, stats: { scanBonus: 0.05 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_CONCORD_AUSPEX: {
        name: "Concord Fire-Control Auspex", type: "scanner", slot: "scanner", manufacturer: "CONCORD",
        description: "Synchronizes target telemetry directly into turret gimbals and deflector harmonics. (+10% Hit, +15 Shields)",
        cost: 4200, stats: { scanBonus: 0.20, accuracyBonus: 0.10, shieldBonus: 15 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_CYGNUS_SPECTROMETER: {
        name: "Cygnus Deep-Sky Spectrometer", type: "scanner", slot: "scanner", manufacturer: "CONCORD",
        description: "University of Cygnus Prime interferometric sensor rig. Enhances target resolution (+12% Hit), deflector tuning (+10 Shields), and reserve routing (+20 Fuel).",
        cost: 5400, stats: { scanBonus: 0.30, accuracyBonus: 0.12, shieldBonus: 10, fuelBonus: 20 }, loreKey: "LOCATION_CYGNUS_PRIME"
    },
    SCANNER_NEXSTAR_4SE: {
        name: "NexStar-4 Optical Array", type: "scanner", slot: "scanner", manufacturer: "INDEPENDENT",
        description: "An antique but meticulously maintained optical tracking array. Exceptional for deep-space stargazing and astrophotography.",
        cost: 1200, stats: { scanBonus: 0.15, accuracyBonus: 0.05 }, loreKey: "LORE_COMP_SCANNER"
    },
    SCANNER_KTHARR_HUNTER: {
        name: "K'tharr Prey-Tracker Array", type: "scanner", slot: "scanner", manufacturer: "KTHARR",
        description: "Aggressive target-acquisition sensors that lock onto enemy reactor cores (+10% Hit Chance, +4 Weapon Damage).",
        cost: 3600, stats: { accuracyBonus: 0.10, damageBonus: 4, scanBonus: 0.10 }, loreKey: "FACTION_KTHARR"
    },
    SCANNER_KTHARR_WAR_ARRAY: {
        name: "Drakon Battle-Auspex", type: "scanner", slot: "scanner", manufacturer: "KTHARR", reqFaction: "KTHARR", minRep: 25,
        description: "Armored Fortress Drakon targeting matrix that feeds live weak-point telemetry to gunners (+12% Hit, +7 Damage, +20 Hull).",
        cost: 6800, stats: { accuracyBonus: 0.12, damageBonus: 7, hullBonus: 20, scanBonus: 0.15 }, loreKey: "FACTION_KTHARR"
    },
    SCANNER_ECLIPSE_INTERCEPTOR: {
        name: "Eclipse Signal Slicer", type: "scanner", slot: "scanner", manufacturer: "ECLIPSE",
        description: "Intercepts patrol telemetry and masks your hull emissions (-15% Signature, +8% Accuracy).",
        cost: 3900, stats: { signatureMod: -0.15, accuracyBonus: 0.08, scanBonus: 0.15 }, loreKey: "FACTION_ECLIPSE"
    },
    SCANNER_ECLIPSE_PHANTOM_SUITE: {
        name: "Eclipse Shadow-Slicer Mk2", type: "scanner", slot: "scanner", manufacturer: "ECLIPSE", reqFaction: "ECLIPSE", minRep: 25,
        description: "Military-grade Cartel passive EW array. Masks transponder noise while predicting incoming fire vectors (-25% Signature, +8% Evasion, +10% Hit).",
        cost: 7200, stats: { signatureMod: -0.25, evasionBonus: 0.08, accuracyBonus: 0.10, scanBonus: 0.25 }, loreKey: "FACTION_ECLIPSE"
    },

    // --- FACTION EXCLUSIVES ---
    SMUGGLERS_HOLD: {
        name: "Eclipse Cargo Bay", type: "utility", slot: "utility", manufacturer: "ECLIPSE",
        description: "Shielded cargo bays. +10 Cargo. Conceals 5 units of contraband from standard Concord customs scans.",
        cost: 4000, stats: { cargoBonus: 10, isSmuggler: true, signatureMod: -0.3 }, reqFaction: "ECLIPSE", minRep: 20, loreKey: "FACTION_ECLIPSE"
    },
    BIO_REPAIR_NODES: {
        name: "Living Hull Tissue", type: "utility", slot: "utility", manufacturer: "KTHARR",
        description: "K'tharr biotech that reinforces hull structure (+40 Hull) and slowly regenerates armor in flight.",
        cost: 8000, stats: { hullBonus: 40, passiveRegen: true }, reqFaction: "KTHARR", minRep: 50, loreKey: "FACTION_KTHARR"
    }
};

// Normalize all static definitions for uniform V8 object shapes
for (const shipId in SHIP_CLASSES) {
    const s = SHIP_CLASSES[shipId];
    if (s) s.id = shipId;
}
for (const compId in COMPONENTS_DATABASE) {
    const c = COMPONENTS_DATABASE[compId];
    if (!c) continue;
    c.id = compId;
    if (!c.slot) c.slot = c.type || 'utility';
    if (!c.type) c.type = c.slot;
    if (!c.stats) c.stats = {};
}

// Expose databases globally
window.MANUFACTURER_PROFILES = MANUFACTURER_PROFILES;
window.SHIP_CLASSES = SHIP_CLASSES;
window.PIRATE_SHIP_CLASSES = PIRATE_SHIP_CLASSES;
window.COMPONENTS_DATABASE = COMPONENTS_DATABASE;

if (typeof GameRegistry !== 'undefined') {
    GameRegistry.ships = SHIP_CLASSES;
}

// ==========================================
// --- PROCEDURAL LOOT ENGINE ---
// ==========================================

const LOOT_PREFIXES = [
    { name: "Hardened",          stat: "hullBonus",     val: 15,    costMod: 1.20 },
    { name: "Overcharged",       stat: "shieldBonus",   val: 20,    costMod: 1.30 },
    { name: "Smuggler's",        stat: "cargoBonus",    val: 10,    costMod: 1.45 },
    { name: "Tuned",             stat: "evasionBonus",  val: 0.05,  costMod: 1.35 },
    { name: "Vicious",           stat: "damageBonus",   val: 5,     costMod: 1.50 },
    { name: "Calibrated",        stat: "accuracyBonus", val: 0.10,  costMod: 1.30 },
    { name: "Aegis-Spec",        stat: "shieldBonus",   val: 30,    costMod: 1.55 },
    { name: "Blood-Forged",      stat: "hullBonus",     val: 30,    costMod: 1.55 },
    { name: "Phantom",           stat: "signatureMod",  val: -0.18, costMod: 1.45 },
    { name: "Precursor-Tuned",   stat: "critChance",    val: 0.08,  costMod: 1.65, slots: ["weapon"] },
    { name: "Frontier-Rigged",   stat: "fuelBonus",     val: 45,    costMod: 1.25 },
    { name: "Masterwork",        stat: "damageBonus",   val: 7,     costMod: 1.70 },
    { name: "Cygnus-Calibrated", stat: "accuracyBonus", val: 0.12,  costMod: 1.45 },
    { name: "Drakon-Forged",     stat: "hullBonus",     val: 25,    costMod: 1.45 },
    { name: "Nomad-Tuned",       stat: "fuelBonus",     val: 65,    costMod: 1.35 },
    { name: "Umbra-Coated",      stat: "signatureMod",  val: -0.22, costMod: 1.50 }
];
Object.freeze(LOOT_PREFIXES);

const LOOT_SUFFIXES = [
    { name: "of the Cartel",      stat: "signatureMod",   val: -0.20, costMod: 1.40 },
    { name: "from the Core",      stat: "scanBonus",      val: 0.12,  costMod: 1.25 },
    { name: "of the Vanguard",    stat: "hullBonus",      val: 25,    costMod: 1.50 },
    { name: "of the Void",        stat: "fuelEfficiency", val: -0.15, costMod: 1.60 },
    { name: "of Karak-Tor",       stat: "damageBonus",    val: 6,     costMod: 1.55 },
    { name: "of Xerxes",          stat: "evasionBonus",   val: 0.08,  costMod: 1.50 },
    { name: "of the Expanse",     stat: "fuelBonus",      val: 60,    costMod: 1.40 },
    { name: "of the Fuel Rats",   stat: "fuelEfficiency", val: -0.12, costMod: 1.45 },
    { name: "of Cygnus",          stat: "accuracyBonus",  val: 0.08,  costMod: 1.40 },
    { name: "of Starbase Alpha",  stat: "shieldBonus",    val: 25,    costMod: 1.40 },
    { name: "of Port Nomad",      stat: "fuelBonus",      val: 75,    costMod: 1.45 },
    { name: "of Fortress Drakon", stat: "damageBonus",    val: 7,     costMod: 1.60 },
    { name: "of the First Chord", stat: "shieldBonus",    val: 35,    costMod: 1.65 }
];
Object.freeze(LOOT_SUFFIXES);

function _applyProceduralModifier(itemObj, mod) {
    if (!itemObj || !mod) return;
    if (mod.stat === "fuelEfficiency") {
        // fuelEfficiency is a multiplier (baseline 1.0); lower is better
        const currentEff = itemObj.stats.fuelEfficiency !== undefined ? itemObj.stats.fuelEfficiency : 1.0;
        itemObj.stats.fuelEfficiency = Math.max(0.25, parseFloat((currentEff + mod.val).toFixed(2)));
    } else {
        const currentVal = itemObj.stats[mod.stat] || 0;
        const newVal = currentVal + mod.val;
        itemObj.stats[mod.stat] = Number.isInteger(mod.val) ? newVal : parseFloat(newVal.toFixed(2));
    }
}

function _attachComponentCargoUseHandler(compId) {
    if (typeof COMMODITIES === 'undefined' || !COMMODITIES[compId]) return;
    COMMODITIES[compId].onUse = () => {
        const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        const isDocked = loc && loc.type === 'location' && (loc.isMajorHub || loc.char === OUTPOST_CHAR_VAL || loc.isPlayerOwned);
        if (!isDocked) {
            if (typeof showToast === 'function') showToast("DOCK AT A STATION TO INSTALL MODULES", "warning");
            return false;
        }
        if (typeof confirmBuyComponent === 'function') {
            confirmBuyComponent(compId, true);
        }
        return false; // confirmBuyComponent deducts 1 from playerCargo itself
    };
}

function generateProceduralModule(baseModuleKey) {
    if (typeof COMPONENTS_DATABASE === 'undefined') return null;

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

    const newItem = JSON.parse(JSON.stringify(baseItem));
    if (!newItem.stats) newItem.stats = {};
    const targetSlot = newItem.slot || newItem.type || 'utility';

    // Filter prefixes so slot-specific stats (like critChance) never roll as dead stats on non-weapons
    const validPrefixes = LOOT_PREFIXES.filter(p => !p.slots || p.slots.includes(targetSlot));
    const validSuffixes = LOOT_SUFFIXES.filter(s => !s.slots || s.slots.includes(targetSlot));

    let rolledPrefix = Math.random() < 0.70;
    let rolledSuffix = Math.random() < 0.45;
    if (!rolledPrefix && !rolledSuffix) rolledPrefix = true;

    if (rolledPrefix && validPrefixes.length > 0) {
        const prefix = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];
        newItem.name = `${prefix.name} ${newItem.name}`;
        newItem.cost = Math.min(999998, Math.floor((newItem.cost || 2500) * prefix.costMod));
        _applyProceduralModifier(newItem, prefix);
    }

    if (rolledSuffix && validSuffixes.length > 0) {
        const suffix = validSuffixes[Math.floor(Math.random() * validSuffixes.length)];
        newItem.name = `${newItem.name} ${suffix.name}`;
        newItem.cost = Math.min(999998, Math.floor((newItem.cost || 2500) * suffix.costMod));
        _applyProceduralModifier(newItem, suffix);
    }

    newItem.rarity = (rolledPrefix && rolledSuffix) ? "EXOTIC" : "RARE";
    // Prefix with PROC_ and suffix with numeric stamp so save serialization & outfitting stowing work seamlessly
    newItem.id = `PROC_${resolvedKey}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    COMPONENTS_DATABASE[newItem.id] = newItem;

    const slotIcons = { weapon: "🔫", shield: "🛡️", engine: "🚀", scanner: "📡", utility: "🔧" };
    if (typeof COMMODITIES !== 'undefined' && !COMMODITIES[newItem.id]) {
        COMMODITIES[newItem.id] = {
            id: newItem.id,
            name: newItem.name,
            basePrice: Math.max(500, Math.floor((newItem.cost || 2000) * 0.6)),
            icon: slotIcons[targetSlot] || "⚙️",
            weight: 1,
            isComponent: true,
            slot: targetSlot,
            category: "TECH",
            description: `${newItem.description} [${newItem.rarity} Custom Module — Install at an Engineering Bay or activate from Cargo while docked].`
        };
        _attachComponentCargoUseHandler(newItem.id);
    }

    return newItem;
}

window.generateProceduralModule = generateProceduralModule;

// ==========================================
// --- PUBLIC SHIP & COMPONENT UTILITY API ---
// ==========================================

const ShipUtils = {
    getShipClass(id) {
        return SHIP_CLASSES[id] || null;
    },
    getComponent(id) {
        return COMPONENTS_DATABASE[id] || null;
    },
    getManufacturerProfile(mfg) {
        return MANUFACTURER_PROFILES[mfg] || MANUFACTURER_PROFILES.INDEPENDENT;
    },
    getHullSpecs(id) {
        const s = SHIP_CLASSES[id];
        if (!s) return null;
        return {
            id: s.id,
            name: s.name,
            role: s.role || "General Purpose",
            manufacturer: s.manufacturer || "FRONTIER",
            builder: s.builder || "Independent Shipyard",
            length: s.length || "40m",
            crewSpec: s.crewSpec || "1–4 Personnel",
            baseTroops: s.baseTroops || 20,
            chassisTrait: s.chassisTrait || null,
            chassisLore: s.chassisLore || s.description
        };
    },
    getComponentsBySlot(slot) {
        return Object.values(COMPONENTS_DATABASE).filter(c => c && c.slot === slot);
    },
    getComponentsByManufacturer(mfg) {
        return Object.values(COMPONENTS_DATABASE).filter(c => c && c.manufacturer === mfg);
    },
    getEligibleShipsForStanding(standingObj) {
        const standing = standingObj || (typeof playerFactionStanding !== 'undefined' ? playerFactionStanding : {});
        return Object.values(SHIP_CLASSES).filter(s => {
            if (!s) return false;
            if (!s.reqFaction) return true;
            return (standing[s.reqFaction] || 0) >= (s.minRep || 0);
        });
    },
    compareShips(idA, idB) {
        const a = SHIP_CLASSES[idA];
        const b = SHIP_CLASSES[idB];
        if (!a || !b) return null;
        return {
            hullDiff: (b.baseHull || 0) - (a.baseHull || 0),
            cargoDiff: (b.cargoCapacity || 0) - (a.cargoCapacity || 0),
            troopsDiff: (b.baseTroops || 20) - (a.baseTroops || 20),
            evasionDiff: parseFloat(((b.baseEvasion || 0) - (a.baseEvasion || 0)).toFixed(2)),
            signatureDiff: parseFloat(((b.baseSignature || 1) - (a.baseSignature || 1)).toFixed(2)),
            costDiff: (b.baseCost || 0) - (a.baseCost || 0)
        };
    },
    getSetBonusProgress(componentsObj) {
        const counts = { CONCORD: 0, KTHARR: 0, ECLIPSE: 0, FRONTIER: 0 };
        if (!componentsObj) return { counts, activeSet: null };
        const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
        slots.forEach(s => {
            const comp = COMPONENTS_DATABASE[componentsObj[s]];
            if (comp && comp.manufacturer && counts[comp.manufacturer] !== undefined) {
                counts[comp.manufacturer]++;
            }
        });
        const activeSet = Object.keys(counts).find(k => counts[k] >= 3) || null;
        return { counts, activeSet };
    },
    syncProceduralCommodities() {
        if (typeof COMPONENTS_DATABASE === 'undefined' || typeof COMMODITIES === 'undefined') return;
        const slotIcons = { weapon: "🔫", shield: "🛡️", engine: "🚀", scanner: "📡", utility: "🔧" };
        for (const compId in COMPONENTS_DATABASE) {
            if (!compId.startsWith('PROC_')) continue;
            const comp = COMPONENTS_DATABASE[compId];
            if (!comp) continue;
            const slot = comp.slot || comp.type || 'utility';
            if (!COMMODITIES[compId]) {
                COMMODITIES[compId] = {
                    id: compId,
                    name: comp.name,
                    basePrice: Math.max(500, Math.floor((comp.cost || 2000) * 0.6)),
                    icon: slotIcons[slot] || "⚙️",
                    weight: 1,
                    isComponent: true,
                    slot: slot,
                    category: "TECH",
                    description: `${comp.description} [${comp.rarity || 'RARE'} Custom Module — Install at an Engineering Bay or activate from Cargo while docked].`
                };
            }
            _attachComponentCargoUseHandler(compId);
        }
    },
    registerShipClass(id, def) {
        if (!id || !def) return false;
        def.id = id;
        SHIP_CLASSES[id] = def;
        return true;
    },
    registerComponent(id, def) {
        if (!id || !def) return false;
        def.id = id;
        if (!def.slot) def.slot = def.type || 'utility';
        if (!def.type) def.type = def.slot;
        if (!def.stats) def.stats = {};
        COMPONENTS_DATABASE[id] = def;
        return true;
    },
    registerEnemyClass(id, def, isBoss = false) {
        if (!id || !def) return false;
        def.id = id;
        if (isBoss || def.isBoss) {
            def.isBoss = true;
            def.weight = 0;
            Object.defineProperty(PIRATE_SHIP_CLASSES, id, {
                value: def,
                enumerable: false,
                writable: true,
                configurable: true
            });
        } else {
            PIRATE_SHIP_CLASSES[id] = def;
        }
        return true;
    }
};

window.ShipUtils = ShipUtils;

// ==========================================
// --- SELF-CONTAINED ENGINE HOOKS ---
// ==========================================

(function initShipsModuleHooks() {
    function _restoreBossAndPrototypeFlags() {
        // Restore boss flags & critChance in case script.js overwrote BOSS_VOSS / BOSS_THORNE / WEAPON_SINGULARITY_CANNON after ships.js loaded
        ['KTHARR_WARLORD', 'BOSS_VOSS', 'BOSS_THORNE'].forEach(bossKey => {
            const b = PIRATE_SHIP_CLASSES[bossKey];
            if (b) {
                b.isBoss = true;
                b.weight = 0;
                Object.defineProperty(PIRATE_SHIP_CLASSES, bossKey, {
                    value: b,
                    enumerable: false,
                    writable: true,
                    configurable: true
                });
            }
        });

        if (COMPONENTS_DATABASE.WEAPON_SINGULARITY_CANNON && COMPONENTS_DATABASE.WEAPON_SINGULARITY_CANNON.stats) {
            COMPONENTS_DATABASE.WEAPON_SINGULARITY_CANNON.id = "WEAPON_SINGULARITY_CANNON";
            if (COMPONENTS_DATABASE.WEAPON_SINGULARITY_CANNON.stats.critChance === undefined) {
                COMPONENTS_DATABASE.WEAPON_SINGULARITY_CANNON.stats.critChance = 0.20;
            }
        }
        if (COMPONENTS_DATABASE.WEAPON_VOID_BEAM) {
            COMPONENTS_DATABASE.WEAPON_VOID_BEAM.id = "WEAPON_VOID_BEAM";
        }
    }

    function attachShipHooks() {
        if (typeof GameRegistry !== 'undefined') {
            GameRegistry.ships = SHIP_CLASSES;
        }

        _restoreBossAndPrototypeFlags();
        ShipUtils.syncProceduralCommodities();

        // 1. Fix getWeightedRandomOutcome so weight: 0 (Boss ships) is never treated as 1
        if (typeof window.getWeightedRandomOutcome === 'function' && !window._shipsWeightPatched) {
            window.getWeightedRandomOutcome = function(outcomes) {
                if (!Array.isArray(outcomes) || outcomes.length === 0) return null;
                const validOutcomes = outcomes.filter(o => o && !o.isBoss && (o.weight === undefined || o.weight > 0));
                const pool = validOutcomes.length > 0 ? validOutcomes : outcomes;
                const totalWeight = pool.reduce((sum, o) => sum + (o && o.weight !== undefined ? Math.max(0, o.weight) : 1), 0);
                if (totalWeight <= 0) return pool[0];

                let random = Math.random() * totalWeight;
                for (let i = 0; i < pool.length; i++) {
                    const outcome = pool[i];
                    const weight = outcome && outcome.weight !== undefined ? Math.max(0, outcome.weight) : 1;
                    if (random < weight) return outcome;
                    random -= weight;
                }
                return pool[pool.length - 1];
            };
            window._shipsWeightPatched = true;
        }

        // 2. Sync maxTroops capacity & apply Chassis Passive Traits cleanly inside applyPlayerShipStats
        if (typeof window.applyPlayerShipStats === 'function' && !window._shipsTroopCapHooked) {
            const origApplyStats = window.applyPlayerShipStats;
            window.applyPlayerShipStats = function() {
                const prevHull = typeof playerHull !== 'undefined' ? playerHull : 100;
                const prevShields = typeof playerShields !== 'undefined' ? playerShields : 50;
                const prevFuel = typeof playerFuel !== 'undefined' ? playerFuel : 220;

                origApplyStats.apply(this, arguments);

                if (typeof playerShip !== 'undefined' && playerShip) {
                    const chassis = SHIP_CLASSES[playerShip.shipClass] || {};

                    // A. Apply Chassis Passive Trait stats
                    if (chassis.chassisTrait && chassis.chassisTrait.stats) {
                        const ts = chassis.chassisTrait.stats;
                        if (ts.hullBonus && typeof MAX_PLAYER_HULL !== 'undefined') MAX_PLAYER_HULL += ts.hullBonus;
                        if (ts.shieldBonus && typeof MAX_SHIELDS !== 'undefined') MAX_SHIELDS += ts.shieldBonus;
                        if (ts.fuelBonus && typeof MAX_FUEL !== 'undefined') MAX_FUEL += ts.fuelBonus;
                        if (ts.cargoBonus && typeof PLAYER_CARGO_CAPACITY !== 'undefined') PLAYER_CARGO_CAPACITY += ts.cargoBonus;
                        if (ts.damageBonus && typeof PLAYER_ATTACK_DAMAGE !== 'undefined') PLAYER_ATTACK_DAMAGE += ts.damageBonus;
                        if (ts.accuracyBonus && typeof PLAYER_HIT_CHANCE !== 'undefined') {
                            PLAYER_HIT_CHANCE = Math.min(1.0, PLAYER_HIT_CHANCE + ts.accuracyBonus);
                        }
                        if (ts.evasionBonus && typeof PLAYER_EVASION !== 'undefined') PLAYER_EVASION += ts.evasionBonus;
                        if (ts.signatureMod) {
                            window.PLAYER_SIGNATURE = Math.max(0.1, (window.PLAYER_SIGNATURE || 1.0) + ts.signatureMod);
                        }
                        if (ts.fuelEfficiency) {
                            window.PLAYER_FUEL_EFFICIENCY = Math.max(0.1, (window.PLAYER_FUEL_EFFICIENCY || 1.0) * ts.fuelEfficiency);
                        }
                    }

                    // B. Sync Barracks maxTroops capacity from chassis + UTIL_MARINE_BARRACKS
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

                    // Restore vitals up to the boosted chassis maximums
                    if (typeof playerHull !== 'undefined' && typeof MAX_PLAYER_HULL !== 'undefined') {
                        playerHull = Math.min(prevHull, MAX_PLAYER_HULL);
                    }
                    if (typeof playerShields !== 'undefined' && typeof MAX_SHIELDS !== 'undefined') {
                        playerShields = Math.min(prevShields, MAX_SHIELDS);
                    }
                    if (typeof playerFuel !== 'undefined' && typeof MAX_FUEL !== 'undefined') {
                        playerFuel = Math.min(prevFuel, MAX_FUEL);
                    }
                }
            };
            window._shipsTroopCapHooked = true;

            if (typeof playerShip !== 'undefined' && playerShip) {
                window.applyPlayerShipStats();
            }
        }

        // 3. Re-attach onUse handlers for PROC_ modules whenever Cargo Manifest opens (survives JSON save loads)
        if (typeof window.openCargoModal === 'function' && !window._shipsCargoSyncHooked) {
            const origOpenCargo = window.openCargoModal;
            window.openCargoModal = function() {
                ShipUtils.syncProceduralCommodities();
                return origOpenCargo.apply(this, arguments);
            };
            window._shipsCargoSyncHooked = true;
        }

        // 4. Enrich Shipyard showShipDetails() with Manufacturer Doctrine, Barracks Cap, Chassis Trait & Registry Lore
        if (typeof window.showShipDetails === 'function' && !window._shipsDetailUIHooked) {
            const origShowShipDetails = window.showShipDetails;
            window.showShipDetails = function(shipId) {
                origShowShipDetails.apply(this, arguments);
                const ship = SHIP_CLASSES[shipId];
                const detailEl = document.getElementById('genericDetailContent');
                if (!ship || !detailEl) return;

                const mfg = ShipUtils.getManufacturerProfile(ship.manufacturer);
                const traitHtml = ship.chassisTrait
                    ? `<div class="trade-stat-row" style="margin-top:6px; border-top:1px dashed #333; padding-top:6px;">
                           <span>Chassis Trait:</span>
                           <span style="color:var(--gold-text); font-weight:bold;">${ship.chassisTrait.name} (${ship.chassisTrait.desc})</span>
                       </div>`
                    : '';

                const specBlock = document.createElement('div');
                specBlock.className = 'trade-math-area';
                specBlock.style.cssText = 'margin: 0 20px 15px 20px; text-align:left; background:rgba(0,0,0,0.35);';
                specBlock.innerHTML = `
                    <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">NAVAL REGISTRY DOSSIER</div>
                    <div class="trade-stat-row"><span>Role / Builder:</span> <span style="color:var(--text-color); font-weight:bold;">${ship.role || 'Utility'} · ${ship.builder || mfg.name}</span></div>
                    <div class="trade-stat-row"><span>Manufacturer:</span> <span style="color:var(--accent-color);">${mfg.name}</span></div>
                    <div class="trade-stat-row"><span>Dimensions / Crew:</span> <span style="color:var(--item-desc-color);">${ship.length || '40m'} · ${ship.crewSpec || '1–4 Personnel'}</span></div>
                    <div class="trade-stat-row"><span>Troop Barracks Cap:</span> <span style="color:var(--success); font-weight:bold;">${ship.baseTroops || 20} Berths</span></div>
                    ${traitHtml}
                    ${ship.chassisLore ? `<div style="margin-top:8px; padding-top:8px; border-top:1px dashed #333; font-size:11px; color:var(--item-desc-color); font-style:italic; line-height:1.45;">"${ship.chassisLore}"</div>` : ''}
                `;

                detailEl.appendChild(specBlock);
            };
            window._shipsDetailUIHooked = true;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachShipHooks);
    } else {
        attachShipHooks();
    }
})();

// --- END OF FILE ships.js ---
