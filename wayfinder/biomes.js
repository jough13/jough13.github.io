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
         resources: ['GENETIC_SAMPLES', 'KTHARR_SPICES', 'SENTIENT_MYCELIUM'],
         image: 'assets/toxic_jungle.png'
     },
     OCEANIC: {
        name: "Ocean World",
        landable: false,
        description: "A planet covered entirely in deep, turbulent water.",
        resources: ['FOOD_SUPPLIES', 'GENETIC_SAMPLES', 'HYDROGEN_3'],
        image: 'assets/ocean_world.png'
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
     },IRRADIATED: {
         name: "Irradiated Wasteland",
         landable: true,
         description: "A dangerously radioactive rock. Surface gamma spectrometry readings are off the charts, indicating high concentrations of unstable Uranium isotopes.",
         resources: ['RARE_METALS', 'VOID_CRYSTALS'],
         image: 'assets/wasteland.png' // Still need an image!
     },
     MACHINE_WORLD: {
         name: "Machine World",
         landable: true,
         description: "A planet entirely encased in metallic structures, humming data-conduits, and sprawling orbital rings. No biological life detected, but automated factories still churn out goods.",
         resources: ['TECH_PARTS', 'CYBERNETIC_IMPLANTS'],
         image: 'assets/machine_world.png' // Still need an image!
     }
 };
