// ==========================================
// --- PLANET BIOMES DATABASE ---
// ==========================================

const PLANET_BIOMES = {
     BARREN_ROCK: {
         name: "Barren Rock",
         landable: true,
         weight: 100, // Very Common
         description: "A lifeless rock, rich in common minerals.",
         resources: ['MINERALS'],
         image: 'assets/barren_rock.png'
     },
     GAS_GIANT: {
         name: "Gas Giant",
         landable: false,
         weight: 60, // Common
         description: "A swirling mass of hydrogen and helium.",
         resources: ['HYDROGEN_3'],
         image: 'assets/gas_giant.png'
     },
     ICE_GIANT: {
         name: "Ice Giant",
         landable: false,
         weight: 50, // Common
         description: "A colossal ball of frozen gases.",
         resources: ['HYDROGEN_3'],
         image: 'assets/ice_giant.png'
     },
     VOLCANIC: {
         name: "Volcanic World",
         landable: true,
         weight: 20, // Uncommon
         description: "A molten hellscape, home to rare metals.",
         resources: ['RARE_METALS', 'PLATINUM_ORE'],
         image: 'assets/volcanic_world.png'
     },
     TOXIC: {
         name: "Toxic Jungle",
         landable: true,
         weight: 15, // Uncommon
         description: "A world teeming with aggressive, alien flora.",
         resources: ['GENETIC_SAMPLES', 'KTHARR_SPICES', 'SENTIENT_MYCELIUM'],
         image: 'assets/toxic_jungle.png'
     },
     OCEANIC: {
        name: "Ocean World",
        landable: false,
        weight: 10, // Rare
        description: "A planet covered entirely in deep, turbulent water.",
        resources: ['FOOD_SUPPLIES', 'GENETIC_SAMPLES', 'HYDROGEN_3'],
        image: 'assets/ocean_world.png'
    },
    TERRAN: {
         name: "Terran World",
         landable: true,
         weight: 5, // Very Rare (Earth-like)
         description: "An Earth-like world with liquid water and a stable atmosphere.",
         resources: ['FOOD_SUPPLIES', 'GENETIC_SAMPLES'],
         image: 'assets/terran_world.png'
     },
     IRRADIATED: {
         name: "Irradiated Wasteland",
         landable: true,
         weight: 4, // Very Rare
         description: "A dangerously radioactive rock. Surface gamma spectrometry readings are off the charts, indicating high concentrations of unstable Uranium isotopes.",
         resources: ['RARE_METALS', 'VOID_CRYSTALS'],
         image: 'assets/wasteland.png' 
     },
     CRYSTAL: {
         name: "Crystalline Anomaly",
         landable: true,
         weight: 2, // Ultra Rare
         description: "A rare world composed entirely of exotic, resonant crystals.",
         resources: ['VOID_CRYSTALS', 'PHASE_SHIFTED_ALLOY'],
         image: 'assets/crystal_anomaly.png'
     },
     MACHINE_WORLD: {
         name: "Machine World",
         landable: true,
         weight: 1, // Legendary (1 in ~260 chance)
         description: "A planet entirely encased in metallic structures, humming data-conduits, and sprawling orbital rings. No biological life detected.",
         resources: ['TECH_PARTS', 'CYBERNETIC_IMPLANTS'],
         image: 'assets/machine_world.png' 
     }
 };
