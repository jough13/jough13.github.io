const REG_GUIDE_1_86_LIMITS = {
   // Note: The key 'transuranics' is used here to represent the Regulatory Guide 1.86
   // group that includes "Transuranics, Ra-226, Ac-227, I-125, I-129".
   // I-125 and I-129 are mapped to this key in the database because they share
   // the same strict limits (20/100 dpm), despite not being transuranic elements.
   'transuranics': {
      removable: 20,
      total: 100,
      label: 'Transuranics, Ra-226, Ac-227, I-125, I-129'
   },
   'sr_90': {
      removable: 200,
      total: 1000,
      label: 'Th-nat, Sr-90, I-131, Ra-223, Ra-224, U-232'
   },
   'u_nat': {
      removable: 1000,
      total: 5000,
      label: 'U-nat, U-235, U-238, and associated decay products'
   },
   'beta_gamma': {
      removable: 1000,
      total: 5000,
      label: 'Beta-gamma emitters (nuclides with decay modes other than alpha)'
   }
};

const ANSI_13_12_LIMITS = {
   'alpha_very_high': {
      removable: 20,
      total: 100,
      label: 'Alpha Emitters (Very High Hazard - e.g., Pu-238, Am-241)'
   },
   'alpha_high': {
      removable: 200,
      total: 1000,
      label: 'Alpha Emitters (High Hazard - e.g., U-233, U-234)'
   },
   'beta_low_risk': {
      removable: 20000,
      total: 100000,
      label: 'Low-Hazard Beta Emitters (e.g., H-3, C-14)'
   },
   'beta_gamma': {
      removable: 2000,
      total: 10000,
      label: 'Other Beta-Gamma Emitters'
   }
};

/**
 * Half-Value Layer (HVL) data in cm for common gamma emitters and materials.
 * Source: Approximate values from various health physics resources.
 */

const HVL_DATA = {
   'Am-241': {
      'Lead': 0.02,
      'Steel': 0.8,
      'Concrete': 2.3,
      'Aluminum': 1.5,
      'Water': 4.2,
      sourceRef: 'rse'
   },
   'Au-198': {
      'Lead': 0.33,
      'Steel': 1.4,
      'Concrete': 4.7,
      'Aluminum': 2.5,
      'Water': 6.8,
      sourceRef: 'rse'
   },
   'Ba-133': {
      'Lead': 0.29,
      'Steel': 1.2,
      'Concrete': 4.1,
      'Aluminum': 2.2,
      'Water': 5.8,
      sourceRef: 'rse'
   },

   'C-11': {
      'Lead': 0.40,
      'Steel': 1.1,
      'Concrete': 3.4,
      'Aluminum': 3.0,
      'Water': 7.1,
      sourceRef: 'rse'
   },

   'Co-60': {
      'Lead': 1.2,
      'Tungsten': 0.7,
      'Steel': 2.1,
      'Concrete': 6.0,
      'Aluminum': 4.8,
      'Water': 11.0,
      sourceRef: 'rse'
   },
   'Cs-137': {
      'Lead': 0.65,
      'Steel': 1.6,
      'Concrete': 4.8,
      'Aluminum': 3.0,
      'Water': 8.0,
      sourceRef: 'rse'
   },
   'Eu-152': {
      'Lead': 1.0,
      'Steel': 2.0,
      'Concrete': 5.8,
      'Aluminum': 4.5,
      'Water': 10.5,
      sourceRef: 'rse'
   },

   'F-18': {
      'Lead': 0.40,
      'Steel': 1.1,
      'Concrete': 3.4,
      'Aluminum': 3.0,
      'Water': 7.1,
      sourceRef: 'rse'
   },

   'Ga-67': {
      'Lead': 0.07,
      'Steel': 0.8,
      'Concrete': 3.0,
      'Aluminum': 1.5,
      'Water': 4.8,
      sourceRef: 'rse'
   },

   'Ga-68': {
      'Lead': 0.41,
      'Steel': 1.2,
      'Concrete': 3.6,
      'Aluminum': 3.2,
      'Water': 7.5,
      sourceRef: 'rse'
   },

   'I-125': {
      'Lead': 0.002,
      'Steel': 0.1,
      'Concrete': 1.9,
      'Aluminum': 0.6,
      'Water': 1.8,
      sourceRef: 'rse'
   },
   'I-131': {
      'Lead': 0.3,
      'Steel': 1.2,
      'Concrete': 4.0,
      'Aluminum': 2.2,
      'Water': 6.0,
      sourceRef: 'rse'
   },
   'In-111': {
   'Lead': 0.07,
   'Steel': 0.6,
   'Concrete': 2.9,
   'Aluminum': 1.4,
   'Water': 4.5,
   sourceRef: 'estimated'
},
   'Ir-192': {
      'Lead': 0.33,
      'Steel': 1.3,
      'Concrete': 4.3,
      'Aluminum': 2.1,
      'Water': 6.1,
      sourceRef: 'rse'
   },
   'Mn-54': {
      'Lead': 0.8,
      'Steel': 1.8,
      'Concrete': 5.2,
      'Aluminum': 3.6,
      'Water': 9.0,
      sourceRef: 'rse'
   },
   'Mo-99': {
      'Lead': 0.7,
      'Steel': 1.7,
      'Concrete': 5.0,
      'Aluminum': 3.1,
      'Water': 8.2,
      sourceRef: 'rse'
   },

   'N-13': {
      'Lead': 0.40,
      'Steel': 1.1,
      'Concrete': 3.4,
      'Aluminum': 3.0,
      'Water': 7.1,
      sourceRef: 'rse'
   },

   'Na-22': {
      'Lead': 1.1,
      'Steel': 2.0,
      'Concrete': 5.8,
      'Aluminum': 4.5,
      'Water': 10.2,
      sourceRef: 'rse'
   },
   'Na-24': {
      'Lead': 1.5,
      'Steel': 2.5,
      'Concrete': 7.2,
      'Aluminum': 6.1,
      'Water': 14.5,
      sourceRef: 'rse'
   },
   'Ra-226': {
      'Lead': 1.4,
      'Steel': 2.3,
      'Concrete': 6.9,
      'Aluminum': 5.5,
      'Water': 13.0,
      sourceRef: 'rse'
   },
   'Sc-46': {
      'Lead': 1.0,
      'Steel': 2.0,
      'Concrete': 5.9,
      'Aluminum': 4.2,
      'Water': 10.0,
      sourceRef: 'rse'
   },
   'Tc-99m': {
      'Lead': 0.03,
      'Steel': 0.3,
      'Concrete': 2.2,
      'Aluminum': 0.8,
      'Water': 4.6,
      sourceRef: 'rse'
   }
};

/**
 * Defines the primary natural decay chains. Each object represents a series
 * and contains an array of steps in its decay chain.
 */

const decaySeriesData = [{
      id: 'U-238-series',
      name: 'Uranium-238 Decay Series (Uranium Series)',
      startNuclide: 'Uranium-238',
      chain: [{
            nuclide: 'Uranium-238',
            decayType: 'Alpha',
            halfLife: '4.468 billion years',
            daughter: 'Thorium-234'
         },
         {
            nuclide: 'Thorium-234',
            decayType: 'Beta-minus',
            halfLife: '24.10 days',
            daughter: 'Protactinium-234m'
         },
         {
            nuclide: 'Protactinium-234m',
            decayType: 'Beta-minus',
            halfLife: '1.17 minutes',
            daughter: 'Uranium-234'
         },
         {
            nuclide: 'Uranium-234',
            decayType: 'Alpha',
            halfLife: '245,500 years',
            daughter: 'Thorium-230'
         },
         {
            nuclide: 'Thorium-230',
            decayType: 'Alpha',
            halfLife: '75,400 years',
            daughter: 'Radium-226'
         },
         {
            nuclide: 'Radium-226',
            decayType: 'Alpha',
            halfLife: '1600 years',
            daughter: 'Radon-222'
         },
         {
            nuclide: 'Radon-222',
            decayType: 'Alpha',
            halfLife: '3.82 days',
            daughter: 'Polonium-218'
         },
         {
            nuclide: 'Polonium-218',
            decayType: 'Alpha',
            halfLife: '3.1 minutes',
            daughter: 'Lead-214'
         },
         {
            nuclide: 'Lead-214',
            decayType: 'Beta-minus',
            halfLife: '26.8 minutes',
            daughter: 'Bismuth-214'
         },
         {
            nuclide: 'Bismuth-214',
            decayType: 'Beta-minus',
            halfLife: '19.9 minutes',
            daughter: 'Polonium-214'
         },
         {
            nuclide: 'Polonium-214',
            decayType: 'Alpha',
            halfLife: '164.3 microseconds',
            daughter: 'Lead-210'
         },
         {
            nuclide: 'Lead-210',
            decayType: 'Beta-minus',
            halfLife: '22.2 years',
            daughter: 'Bismuth-210'
         },
         {
            nuclide: 'Bismuth-210',
            decayType: 'Beta-minus',
            halfLife: '5.012 days',
            daughter: 'Polonium-210'
         },
         {
            nuclide: 'Polonium-210',
            decayType: 'Alpha',
            halfLife: '138.376 days',
            daughter: 'Lead-206'
         },
         {
            nuclide: 'Lead-206',
            decayType: 'Stable',
            halfLife: 'Stable',
            daughter: 'N/A'
         }
      ]
   },

   {
      id: 'Th-232-series',
      name: 'Thorium-232 Decay Series (Thorium Series)',
      startNuclide: 'Thorium-232',
      chain: [{
            nuclide: 'Thorium-232',
            decayType: 'Alpha',
            halfLife: '14.05 billion years',
            daughter: 'Radium-228'
         },
         {
            nuclide: 'Radium-228',
            decayType: 'Beta-minus',
            halfLife: '5.75 years',
            daughter: 'Actinium-228'
         },
         {
            nuclide: 'Actinium-228',
            decayType: 'Beta-minus',
            halfLife: '6.15 hours',
            daughter: 'Thorium-228'
         },
         {
            nuclide: 'Thorium-228',
            decayType: 'Alpha',
            halfLife: '1.913 years',
            daughter: 'Radium-224'
         },
         {
            nuclide: 'Radium-224',
            decayType: 'Alpha',
            halfLife: '3.63 days',
            daughter: 'Radon-220'
         },
         {
            nuclide: 'Radon-220',
            decayType: 'Alpha',
            halfLife: '55.6 seconds',
            daughter: 'Polonium-216'
         },
         {
            nuclide: 'Polonium-216',
            decayType: 'Alpha',
            halfLife: '0.145 seconds',
            daughter: 'Lead-212'
         },
         {
            nuclide: 'Lead-212',
            decayType: 'Beta-minus',
            halfLife: '10.64 hours',
            daughter: 'Bismuth-212'
         },
         {
            nuclide: 'Bismuth-212',
            decayType: 'Beta-minus (64.1%) / Alpha (35.9%)',
            halfLife: '60.55 minutes',
            daughter: 'Polonium-212 / Thallium-208',
            branches: [
               [ // Path 1: Beta decay
                  {
                     nuclide: 'Polonium-212',
                     decayType: 'Alpha',
                     halfLife: '0.299 microseconds',
                     daughter: 'Lead-208'
                  },
                  {
                     nuclide: 'Lead-208',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ],
               [ // Path 2: Alpha decay
                  {
                     nuclide: 'Thallium-208',
                     decayType: 'Beta-minus',
                     halfLife: '3.053 minutes',
                     daughter: 'Lead-208'
                  },
                  {
                     nuclide: 'Lead-208',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ]
            ]
         }
      ]
   },
   {
      id: 'U-235-series',
      name: 'Uranium-235 Decay Series (Actinium Series)',
      startNuclide: 'Uranium-235',
      chain: [{
            nuclide: 'Uranium-235',
            decayType: 'Alpha',
            halfLife: '703.8 million years',
            daughter: 'Thorium-231'
         },
         {
            nuclide: 'Thorium-231',
            decayType: 'Beta-minus',
            halfLife: '25.5 hours',
            daughter: 'Protactinium-231'
         },
         {
            nuclide: 'Protactinium-231',
            decayType: 'Alpha',
            halfLife: '32,760 years',
            daughter: 'Actinium-227'
         },
         {
            nuclide: 'Actinium-227',
            decayType: 'Beta-minus',
            halfLife: '21.77 years',
            daughter: 'Thorium-227'
         },
         {
            nuclide: 'Thorium-227',
            decayType: 'Alpha',
            halfLife: '18.72 days',
            daughter: 'Radium-223'
         },
         {
            nuclide: 'Radium-223',
            decayType: 'Alpha',
            halfLife: '11.43 days',
            daughter: 'Radon-219'
         },
         {
            nuclide: 'Radon-219',
            decayType: 'Alpha',
            halfLife: '3.96 seconds',
            daughter: 'Polonium-215'
         },
         {
            nuclide: 'Polonium-215',
            decayType: 'Alpha',
            halfLife: '1.78 milliseconds',
            daughter: 'Lead-211'
         },
         {
            nuclide: 'Lead-211',
            decayType: 'Beta-minus',
            halfLife: '36.1 minutes',
            daughter: 'Bismuth-211'
         },
         {
            nuclide: 'Bismuth-211',
            decayType: 'Alpha (99.72%) / Beta-minus (0.28%)',
            halfLife: '2.14 minutes',
            daughter: 'Thallium-207 / Polonium-211',
            branches: [
               [ // Path 1: Alpha decay
                  {
                     nuclide: 'Thallium-207',
                     decayType: 'Beta-minus',
                     halfLife: '4.77 minutes',
                     daughter: 'Lead-207'
                  },
                  {
                     nuclide: 'Lead-207',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ],
               [ // Path 2: Beta decay
                  {
                     nuclide: 'Polonium-211',
                     decayType: 'Alpha',
                     halfLife: '0.516 seconds',
                     daughter: 'Lead-207'
                  },
                  {
                     nuclide: 'Lead-207',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ]
            ]
         }
      ]
   },
   {
      id: 'Ra-226-series',
      name: 'Radium-226 Decay Series',
      startNuclide: 'Radium-226',
      chain: [{
            nuclide: 'Radium-226',
            decayType: 'Alpha',
            halfLife: '1600 years',
            daughter: 'Radon-222'
         },
         {
            nuclide: 'Radon-222',
            decayType: 'Alpha',
            halfLife: '3.82 days',
            daughter: 'Polonium-218'
         },
         {
            nuclide: 'Polonium-218',
            decayType: 'Alpha',
            halfLife: '3.1 minutes',
            daughter: 'Lead-214'
         },
         {
            nuclide: 'Lead-214',
            decayType: 'Beta-minus',
            halfLife: '26.8 minutes',
            daughter: 'Bismuth-214'
         },
         {
            nuclide: 'Bismuth-214',
            decayType: 'Beta-minus',
            halfLife: '19.9 minutes',
            daughter: 'Polonium-214'
         },
         {
            nuclide: 'Polonium-214',
            decayType: 'Alpha',
            halfLife: '164.3 microseconds',
            daughter: 'Lead-210'
         },
         {
            nuclide: 'Lead-210',
            decayType: 'Beta-minus',
            halfLife: '22.2 years',
            daughter: 'Bismuth-210'
         },
         {
            nuclide: 'Bismuth-210',
            decayType: 'Beta-minus',
            halfLife: '5.012 days',
            daughter: 'Polonium-210'
         },
         {
            nuclide: 'Polonium-210',
            decayType: 'Alpha',
            halfLife: '138.376 days',
            daughter: 'Lead-206'
         },
         {
            nuclide: 'Lead-206',
            decayType: 'Stable',
            halfLife: 'Stable',
            daughter: 'N/A'
         }
      ]
   },
   {
      id: 'Np-237-series',
      name: 'Neptunium-237 Decay Series (Artificial)',
      startNuclide: 'Neptunium-237',
      chain: [{
            nuclide: 'Neptunium-237',
            decayType: 'Alpha',
            halfLife: '2.14 million years',
            daughter: 'Protactinium-233'
         },
         {
            nuclide: 'Protactinium-233',
            decayType: 'Beta-minus',
            halfLife: '27.0 days',
            daughter: 'Uranium-233'
         },
         {
            nuclide: 'Uranium-233',
            decayType: 'Alpha',
            halfLife: '159,200 years',
            daughter: 'Thorium-229'
         },
         {
            nuclide: 'Thorium-229',
            decayType: 'Alpha',
            halfLife: '7,340 years',
            daughter: 'Radium-225'
         },
         {
            nuclide: 'Radium-225',
            decayType: 'Beta-minus',
            halfLife: '14.9 days',
            daughter: 'Actinium-225'
         },
         {
            nuclide: 'Actinium-225',
            decayType: 'Alpha',
            halfLife: '9.92 days',
            daughter: 'Francium-221'
         },
         {
            nuclide: 'Francium-221',
            decayType: 'Alpha',
            halfLife: '4.8 minutes',
            daughter: 'Astatine-217'
         },
         {
            nuclide: 'Astatine-217',
            decayType: 'Alpha',
            halfLife: '32.3 milliseconds',
            daughter: 'Bismuth-213'
         },
         {
            nuclide: 'Bismuth-213',
            decayType: 'Beta-minus (97.9%) / Alpha (2.1%)',
            halfLife: '45.6 minutes',
            daughter: 'Polonium-213 / Thallium-209',
            branches: [
               [ // Path 1: Beta to Po-213
                  {
                     nuclide: 'Polonium-213',
                     decayType: 'Alpha',
                     halfLife: '4.2 microseconds',
                     daughter: 'Lead-209'
                  },
                  {
                     nuclide: 'Lead-209',
                     decayType: 'Beta-minus',
                     halfLife: '3.25 hours',
                     daughter: 'Bismuth-209'
                  },
                  {
                     nuclide: 'Bismuth-209',
                     decayType: 'Effectively Stable',
                     halfLife: '2.01 x 10¹⁹ years',
                     daughter: 'Thallium-205'
                  },
                  {
                     nuclide: 'Thallium-205',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ],
               [ // Path 2: Alpha to Tl-209
                  {
                     nuclide: 'Thallium-209',
                     decayType: 'Beta-minus',
                     halfLife: '2.16 minutes',
                     daughter: 'Lead-209'
                  },
                  // Lead-209 merges back into the main chain, but Bateman solver handles linear trees.
                  // We duplicate the tail here for the solver's graph logic.
                  {
                     nuclide: 'Lead-209',
                     decayType: 'Beta-minus',
                     halfLife: '3.25 hours',
                     daughter: 'Bismuth-209'
                  },
                  {
                     nuclide: 'Bismuth-209',
                     decayType: 'Effectively Stable',
                     halfLife: '2.01 x 10¹⁹ years',
                     daughter: 'Thallium-205'
                  },
                  {
                     nuclide: 'Thallium-205',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ]
            ]
         }
      ]
   },
   {
      id: 'Ac-225-series',
      name: 'Actinium-225 (Medical Alpha Generator)',
      startNuclide: 'Actinium-225',
      chain: [{
            nuclide: 'Actinium-225',
            decayType: 'Alpha',
            halfLife: '9.92 days',
            daughter: 'Francium-221'
         },
         {
            nuclide: 'Francium-221',
            decayType: 'Alpha',
            halfLife: '4.8 minutes',
            daughter: 'Astatine-217'
         },
         {
            nuclide: 'Astatine-217',
            decayType: 'Alpha',
            halfLife: '32.3 milliseconds',
            daughter: 'Bismuth-213'
         },
         {
            nuclide: 'Bismuth-213',
            decayType: 'Beta-minus (97.9%) / Alpha (2.1%)',
            halfLife: '45.6 minutes',
            daughter: 'Polonium-213 / Thallium-209',
            branches: [
               [ // Path 1: Beta
                  {
                     nuclide: 'Polonium-213',
                     decayType: 'Alpha',
                     halfLife: '4.2 microseconds',
                     daughter: 'Lead-209'
                  },
                  {
                     nuclide: 'Lead-209',
                     decayType: 'Beta-minus',
                     halfLife: '3.25 hours',
                     daughter: 'Bismuth-209'
                  },
                  {
                     nuclide: 'Bismuth-209',
                     decayType: 'Effectively Stable',
                     halfLife: '2.01 x 10¹⁹ years',
                     daughter: 'Thallium-205'
                  },
                  {
                     nuclide: 'Thallium-205',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ],
               [ // Path 2: Alpha
                  {
                     nuclide: 'Thallium-209',
                     decayType: 'Beta-minus',
                     halfLife: '2.16 minutes',
                     daughter: 'Lead-209'
                  },
                  {
                     nuclide: 'Lead-209',
                     decayType: 'Beta-minus',
                     halfLife: '3.25 hours',
                     daughter: 'Bismuth-209'
                  },
                  {
                     nuclide: 'Bismuth-209',
                     decayType: 'Effectively Stable',
                     halfLife: '2.01 x 10¹⁹ years',
                     daughter: 'Thallium-205'
                  },
                  {
                     nuclide: 'Thallium-205',
                     decayType: 'Stable',
                     halfLife: 'Stable',
                     daughter: 'N/A'
                  }
               ]
            ]
         }
      ]
   }
];

 /**
            * Data and components for the Neutron Tools module.
            */
            
            // --- Data from 10 CFR 20.1004 for Fluence/Dose Conversion ---
            
            const NEUTRON_CONVERSION_FACTORS = [
            { energyMeV: 2.5e-8, fluencePerRem: 980e6, q: 2, label: 'Thermal (0.025 eV)' },
            { energyMeV: 1e-7, fluencePerRem: 980e6, q: 2, label: '0.1 eV' },
            { energyMeV: 1e-6, fluencePerRem: 810e6, q: 2, label: '1 eV' },
            { energyMeV: 1e-5, fluencePerRem: 810e6, q: 2, label: '10 eV' },
            { energyMeV: 1e-4, fluencePerRem: 840e6, q: 2, label: '100 eV' },
            { energyMeV: 1e-3, fluencePerRem: 980e6, q: 2, label: '1 keV' },
            { energyMeV: 1e-2, fluencePerRem: 1000e6, q: 2.5, label: '10 keV' },
            { energyMeV: 1e-1, fluencePerRem: 170e6, q: 7.5, label: '100 keV' },
            { energyMeV: 5e-1, fluencePerRem: 39e6, q: 11, label: '0.5 MeV' },
            { energyMeV: 1, fluencePerRem: 27e6, q: 11, label: '1 MeV' },
            { energyMeV: 2.5, fluencePerRem: 29e6, q: 9, label: '2.5 MeV' },
            { energyMeV: 5, fluencePerRem: 23e6, q: 8, label: '5 MeV' },
            { energyMeV: 7, fluencePerRem: 24e6, q: 7, label: '7 MeV' },
            { energyMeV: 10, fluencePerRem: 24e6, q: 6.5, label: '10 MeV' },
            { energyMeV: 14, fluencePerRem: 17e6, q: 7.5, label: '14 MeV' },
            { energyMeV: 20, fluencePerRem: 16e6, q: 8, label: '20 MeV' },
            { energyMeV: 40, fluencePerRem: 14e6, q: 7, label: '40 MeV' },
            { energyMeV: 60, fluencePerRem: 16e6, q: 5.5, label: '60 MeV' },
            { energyMeV: 100, fluencePerRem: 20e6, q: 4, label: '100 MeV' },
            { energyMeV: 200, fluencePerRem: 19e6, q: 3.5, label: '200 MeV' },
            { energyMeV: 300, fluencePerRem: 19e6, q: 3.5, label: '300 MeV' },
            { energyMeV: 400, fluencePerRem: 20e6, q: 3.5, label: '400 MeV' }
            ];
            
            // 1. Updated Data with Abundances
            const NEUTRON_ACTIVATION_DATA = [
            { targetSymbol: 'Co-59', name: 'Cobalt-59', atomicWeight: 58.933, thermalCrossSection_barns: 37.2, productSymbol: 'Co-60', abundance: 100 },
            { targetSymbol: 'Na-23', name: 'Sodium-23', atomicWeight: 22.990, thermalCrossSection_barns: 0.53, productSymbol: 'Na-24', abundance: 100 },
            { targetSymbol: 'Au-197', name: 'Gold-197', atomicWeight: 196.967, thermalCrossSection_barns: 98.65, productSymbol: 'Au-198', abundance: 100 },
            { targetSymbol: 'Ir-191', name: 'Iridium-191', atomicWeight: 190.960, thermalCrossSection_barns: 954, productSymbol: 'Ir-192', abundance: 37.3 },
            { targetSymbol: 'Ho-165', name: 'Holmium-165', atomicWeight: 164.930, thermalCrossSection_barns: 64.7, productSymbol: 'Ho-166', abundance: 100 },
            { targetSymbol: 'Fe-58', name: 'Iron-58', atomicWeight: 57.933, thermalCrossSection_barns: 1.3, productSymbol: 'Fe-59', abundance: 0.282 },
            { targetSymbol: 'Lu-176', name: 'Lutetium-176', atomicWeight: 175.942, thermalCrossSection_barns: 2090, productSymbol: 'Lu-177', abundance: 2.59 },
            { targetSymbol: 'Ta-181', name: 'Tantalum-181', atomicWeight: 180.948, thermalCrossSection_barns: 20.6, productSymbol: 'Ta-182', abundance: 99.988 },
            { targetSymbol: 'Sc-45', name: 'Scandium-45', atomicWeight: 44.956, thermalCrossSection_barns: 27.5, productSymbol: 'Sc-46', abundance: 100 },
            { targetSymbol: 'Cu-63', name: 'Copper-63', atomicWeight: 62.929, thermalCrossSection_barns: 4.5, productSymbol: 'Cu-64', abundance: 69.15 },
            { targetSymbol: 'Ag-109', name: 'Silver-109', atomicWeight: 108.905, thermalCrossSection_barns: 89, productSymbol: 'Ag-110m', abundance: 48.16 },
            { targetSymbol: 'Sb-123', name: 'Antimony-123', atomicWeight: 122.904, thermalCrossSection_barns: 4.1, productSymbol: 'Sb-124', abundance: 42.79 },
            { targetSymbol: 'Eu-151', name: 'Europium-151', atomicWeight: 150.920, thermalCrossSection_barns: 9200, productSymbol: 'Eu-152', abundance: 47.8 },
            { targetSymbol: 'Ca-44', name: 'Calcium-44', atomicWeight: 43.955, thermalCrossSection_barns: 1.0, productSymbol: 'Ca-45', abundance: 2.086 },
            ].sort((a,b) => a.name.localeCompare(b.name));
            
            // --- Updated Data: Expanded Material & Shielding Data ---
            
            // 1. Expanded Composite Materials
            const COMPOSITE_MATERIALS_DATA = {
            'Ordinary Concrete': {
            density_g_cm3: 2.3,
            composition: [
            { element: 'Sodium-23', targetSymbol: 'Na-23', massFraction: 0.01 },
            { element: 'Iron-58', targetSymbol: 'Fe-58', massFraction: 0.015 * 0.0028 },
            { element: 'Cobalt-59', targetSymbol: 'Co-59', massFraction: 0.00001 },
            { element: 'Europium-151', targetSymbol: 'Eu-151', massFraction: 0.000001 },
            { element: 'Calcium-44', targetSymbol: 'Ca-44', massFraction: 0.08 * 0.02086 }
            ]
            },
            'Standard Human Tissue': {
            density_g_cm3: 1.0,
            composition: [ { element: 'Sodium-23', targetSymbol: 'Na-23', massFraction: 0.0015 } ]
            },
            'Stainless Steel 304': {
            density_g_cm3: 8.0,
            composition: [
            { element: 'Iron-58', targetSymbol: 'Fe-58', massFraction: 0.70 * 0.0028 },
            { element: 'Cobalt-59', targetSymbol: 'Co-59', massFraction: 0.001 },
            { element: 'Chromium-50', targetSymbol: 'Cr-50', massFraction: 0.19 * 0.0435 }
            ]
            },
            'Aluminum 6061': {
            density_g_cm3: 2.7,
            composition: [
            { element: 'Aluminum-27', targetSymbol: 'Al-27', massFraction: 0.97 }, // Activates to Al-28 (short) -> Na-24 (via n,alpha)
            { element: 'Magnesium-26', targetSymbol: 'Mg-26', massFraction: 0.01 * 0.11 }, // Activates to Mg-27
            { element: 'Copper-63', targetSymbol: 'Cu-63', massFraction: 0.003 * 0.69 }
            ]
            },
            'Standard Soil': {
            density_g_cm3: 1.6,
            composition: [
            { element: 'Sodium-23', targetSymbol: 'Na-23', massFraction: 0.006 }, // Na-24
            { element: 'Manganese-55', targetSymbol: 'Mn-55', massFraction: 0.0008 }, // Mn-56
            { element: 'Aluminum-27', targetSymbol: 'Al-27', massFraction: 0.07 } // Al-28
            ]
            }
            };
            
            // 2. Expanded Neutron Shielding Data (Split Fission vs 14 MeV)
            // Values approximated from NCRP 38 / 79 & IAEA
            const NEUTRON_SHIELDING_DATA = {
            'Water': { thermal: 2.8, fission: 6.1, fusion14: 12.0 },
            'Polyethylene': { thermal: 3.5, fission: 5.3, fusion14: 10.5 },
            'Concrete': { thermal: 4.8, fission: 10.7, fusion14: 18.0 },
            'Borated Poly (5%)': { thermal: 0.8, fission: 5.1, fusion14: 10.2 }, // High thermal capture
            'Steel': { thermal: 99, fission: 7.9, fusion14: 13.0 }, // Thermal Hvl is large (poor absorber)
            'Lead': { thermal: 99, fission: 15.0, fusion14: 14.0 }, // Poor neutron shield
            'Cadmium': { thermal: 0.02, fission: 99, fusion14: 99 } // Excellent thermal, useless fast
            };

            const SHIELD_PROPS = {
            'None': { density: 0 },
            'Paper/Clothing': { density: 0.8 },
            'Plastic/Lucite': { density: 1.18, mapTo: 'Water' },
            'Wood': { density: 0.6, mapTo: 'Water' },
            'Aluminum': { density: 2.7, mapTo: 'Aluminum' },
            'Steel': { density: 7.8, mapTo: 'Steel' },
            'Lead': { density: 11.34, mapTo: 'Lead' }
            };

            // New constant for Buildup Factor approximations

const BUILDUP_K_FACTORS = {
   'Water': 0.40,
   'Concrete': 0.35,
   'Aluminum': 0.30,
   'Steel': 0.25,
   'Tungsten': 0.15,
   'Lead': 0.10,
};

const SHIELDING_MATERIALS = {
   'Plastic': {
      Z: 6,
      density: 1.18
   }, // Using Carbon for approximation
   'Aluminum': {
      Z: 13,
      density: 2.70
   },
   'Steel': {
      Z: 26,
      density: 7.85
   }, // Using Iron for approximation
   'Lead': {
      Z: 82,
      density: 11.34
   },
   'Water': {
      Z: 8,
      density: 1.00
   }, // Using Oxygen for approximation
   'Concrete': {
      Z: 11.3,
      density: 2.35
   } // Weighted average of common elements
};
