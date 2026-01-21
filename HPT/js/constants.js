//==============================================================================
// --- APPLICATION METADATA & CONSTANTS
//==============================================================================

const VERSION = '3.8.4';
const LAST_UPDATED = 'January 21st, 2026';

// Global constant for all navigation views

const VIEWS = {
   HOME: 'home',
   DATABASE: 'database',
   COMPARE: 'compare',
   CALCULATOR: 'calculator',
   MDA: 'mda',
   MARSSIM_SAMPLES: 'marssim',
   MARSSIM_TESTS: 'marssimTests',
   WRS_TEST: 'wrs',
   EMC_TEST: 'emc',
   SERIES_CALCULATOR: 'seriesCalculator',
   EQUILIBRIUM: 'equilibrium',
   RADON: 'radon',
   ACTIVITY_MASS: 'activityMassTools',
   DOSE_RATE: 'doseRate',
   SHIELDING: 'shielding',
   STAY_TIME: 'stayTime',
   NEUTRON: 'neutron',
   OPERATIONAL_HP: 'operationalHp',
   TRANSPORTATION: 'transportation',
   CONVERTER: 'converter',
   SETTINGS: 'settings',
   DECAY_SERIES: 'decaySeries',
   DETAIL: 'detail',
   MEDICAL: 'medical',
   PEAK_ID: 'peakId',
   LAB_STATS: 'labStats',
   SCRATCHPAD: 'scratchpad',
   SCIENTIFIC_CALCULATOR: 'scientificCalculator',

   REFERENCES: 'references'
};

/**
 * Data sources used in the application.
 * Each key is a short identifier, and the value is an object
 * containing the full name and URL of the source.
 */

const sources = {
   nndc: {
      name: 'NNDC NuDat 3',
      url: 'https://www.nndc.bnl.gov/nudat3/'
   },
   wiki: {
      name: 'Wikipedia',
      url: 'https://en.wikipedia.org/'
   },
   hps: {
      name: 'Health Physics Society',
      url: 'https://hps.org/'
   },
   plexus_nsd: {
      name: 'Plexus-NSD Gamma Constants',
      url: 'http://www.iem-inc.com/information/tools/gamma-ray-dose-constants'
   },
   rse: {
      name: 'Rad. Safety Engineering',
      url: 'https://www.radpro.com/sourcehvl.htm'
   },
   '10CFR20': {
      name: '10 CFR 20 Appendix B',
      url: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part020/part020-appb.html'
   },
   'FGR11': {
      name: 'EPA Federal Guidance Report No. 11',
      url: 'https://www.epa.gov/radiation/federal-guidance-report-no-11-limiting-values-radionuclide-intake-and-air-concentration'
   }
};

/**
 * Configuration for smart unit selection.
 * For each type, it lists units from smallest to largest.
 * - threshold: The value above which the *next* unit in the list is considered.
 * - factor: How many of the current unit are in one base unit (e.g., 1000 mrem in 1 rem).
 */

const SENSIBLE_UNIT_CONFIG = {
   // Conventional Units
   doseRate: {
      baseUnit: 'mrem/hr',
      units: [{
            unit: 'µrem/hr',
            threshold: 1,
            factor: 0.001
         },
         {
            unit: 'mrem/hr',
            threshold: 1000,
            factor: 1
         },
         {
            unit: 'rem/hr',
            threshold: Infinity,
            factor: 1000
         }
      ]
   },
   dose: {
      baseUnit: 'mrem',
      units: [{
            unit: 'µrem',
            threshold: 1,
            factor: 0.001
         },
         {
            unit: 'mrem',
            threshold: 1000,
            factor: 1
         },
         {
            unit: 'rem',
            threshold: Infinity,
            factor: 1000
         }
      ]
   },
   // --- ADDED: SI Unit Configurations ---
   doseRate_si: {
      baseUnit: 'mSv/hr',
      units: [{
            unit: 'µSv/hr',
            threshold: 1,
            factor: 0.001
         },
         {
            unit: 'mSv/hr',
            threshold: 1000,
            factor: 1
         },
         {
            unit: 'Sv/hr',
            threshold: Infinity,
            factor: 1000
         }
      ]
   },
   dose_si: {
      baseUnit: 'mSv',
      units: [{
            unit: 'µSv',
            threshold: 1,
            factor: 0.001
         },
         {
            unit: 'mSv',
            threshold: 1000,
            factor: 1
         },
         {
            unit: 'Sv',
            threshold: Infinity,
            factor: 1000
         }
      ]
   },
   // --- Distance units remain the same ---
   distance: {
      baseUnit: 'cm',
      units: [{
            unit: 'mm',
            threshold: 1,
            factor: 0.1
         },
         {
            unit: 'cm',
            threshold: 100,
            factor: 1
         },
         {
            unit: 'm',
            threshold: Infinity,
            factor: 100
         }
      ]
   },
   activity_conventional: {
      baseUnit: 'Ci',
      units: [{
            unit: 'µCi',
            threshold: 1e-3,
            factor: 1e-6
         },
         {
            unit: 'mCi',
            threshold: 1,
            factor: 1e-3
         },
         {
            unit: 'Ci',
            threshold: Infinity,
            factor: 1
         }
      ]
   },
   activity_si: {
      baseUnit: 'Bq',
      units: [{
            unit: 'Bq',
            threshold: 1e3,
            factor: 1
         },
         {
            unit: 'kBq',
            threshold: 1e6,
            factor: 1e3
         },
         {
            unit: 'MBq',
            threshold: 1e9,
            factor: 1e6
         },
         {
            unit: 'GBq',
            threshold: 1e12,
            factor: 1e9
         },
         {
            unit: 'TBq',
            threshold: Infinity,
            factor: 1e12
         }
      ]
   }
};

const THERAPY_NUCLIDES = ['I-131', 'Lu-177', 'Sm-153', 'Ra-223', 'Ho-166', 'Re-186', 'Au-198', 'I-125', 'Cs-137'];

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
 * A mapping of icon names to their corresponding SVG path data.
 */

const ICONS = {
   // --- UI Essentials ---
   menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
   home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z",
   settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.58 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
   help: "M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z",
   check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
   clear: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
   search: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
   copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-2-.9-2-2-2zm0 16H8V7h11v14z",
   download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
   trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
   notepad: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
   popOut: "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
   filter: "M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z", // Added Filter Icon

   // --- Theme ---
   sun: "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zm-9-8c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1v2c0 .55.45 1 1 1zm0 16c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1v2c0 .55.45 1 1 1zM5.64 6.36c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L5.64 3.54c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41L5.64 6.36zm12.72 12.72c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41l-1.41-1.41c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l1.41 1.41zM4.22 18.36c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-1.41 1.41zM18.36 4.22c-.39.39-.39 1.02 0 1.41l1.41 1.41c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-1.41-1.41c-.39-.39-1.02-.39-1.41 0z",
   moon: "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.64-.11 2.41-.31-3.26-1.46-5.41-4.56-5.41-8.19 0-3.63 2.15-6.73 5.41-8.19A8.96 8.96 0 0012 3z",

   // --- Physics & Tools ---
   atom: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z",
   radioactive: "M12 2a9.97 9.97 0 0 0-5.49 1.76L12 15.35l5.49-11.59A9.97 9.97 0 0 0 12 2zm-9.24 9a10.016 10.016 0 0 0 14.48 0L12 17.65l-9.24-6.65zM4.93 16.24l-2.17-1.45A10.003 10.003 0 0 0 12 22a10.003 10.003 0 0 0 9.24-7.21l-2.17 1.45L12 19.35l-7.07-3.11z",
   activity: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
   hourglass: "M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6z",
   stopwatch: "M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.98-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-1.68-.46-3.24-1.25-4.55l.22-.16zm-1.07-1.01A6.995 6.995 0 115.34 19.66 6.995 6.995 0 0117.96 6.38z",

   // --- Calculators ---
   calculator: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-2-.9-2-2-2zm-7 0c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V4c0-.55.45-1 1-1zm3 14H9v-2h6v2zm2-4H7v-2h10v2zm0-4H7V7h10v2z",
   scientificCalculator: "M7 21a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7zm2-2h6v-2H9v2zm0-4h6v-2H9v2zm4-4h2v-2h-2v2zm-4 0h2v-2H9v2zM7 7h10V5H7v2z",
   doseRate: "M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H12v-2l-4 4 4 4v-2h9.5c.28 0 .5-.22.5-.5.01-2.09-1.26-3.87-3.15-4.96z",
   shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
   neutron: "M21 10.78V8c0-1.65-1.35-3-3-3h-1V3c0-.55-.45-1-1-1s-1 .45-1 1v2h-4V3c0-.55-.45-1-1-1s-1 .45-1 1v2H8c-1.65 0-3 1.35-3 3v2.78c-.61.55-1 1.34-1 2.22v6c0 1.65 1.35 3 3 3h10c1.65 0 3-1.35 3-3v-6c0-.88-.39-1.67-1-2.22zM9 19H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm2-7h-2v-2h2v2z",
   gammaSpec: "M3 3v18h18V3H3zm16 16H5V5h14v14zM11 7h2v2h-2zM7 11h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2zm-8 4h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z",

   // --- Logistics & Ops ---
   transport: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
   clipboard: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
   medical: "M18 10.5V6H6v4.5c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h1v3h2v-3h8v3h2v-3h1c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2zM8 8h8v2H8V8zm10 7.5H6v-3h12v3zM11 2h2v2h-2z",
   labStats: "M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z",

   radon: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z", // Cloud icon

   mass: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zM12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z", // Used shield as placeholder in some, but Scale is better:

   // Re-definition of 'scale' used for Mass if desired:
   scale: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",

   series: "M2 5v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2zm12 4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-4 8c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z", // Chain/List icon

   // --- Other ---
   wind: "M12.5 2.5a2.5 2.5 0 0 0-2.5 2.5v.5h-3v-1a2.5 2.5 0 0 0-5 0v3a2.5 2.5 0 0 0 5 0v-.5h3v5h-3v-1a2.5 2.5 0 0 0-5 0v3a2.5 2.5 0 0 0 5 0v-.5h3v2.5a2.5 2.5 0 0 0 5 0v-13a2.5 2.5 0 0 0-2.5-2.5zm-5 5a.5.5 0 0 1-.5.5v-2a.5.5 0 0 1 .5.5v1zm0 9a.5.5 0 0 1-.5.5v-2a.5.5 0 0 1 .5.5v1z",
   map: "M20.5 3l-6 2-6-2-5.5 1.83c-.29.1-.5.37-.5.67v15c0 .36.2.68.54.79l5.46 1.82 6-2 6 2 5.5-1.83c.29-.1.5-.37.5-.67v-15c0-.36-.2-.68-.54-.79l-5.46-1.82zM15 19l-6-2V5l6 2v12z",
   compare: "M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v-2H5V5h5V3zm9 0h-5v2h5v14h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
   references: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
   converter: "M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z",
   warning: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
   database: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V6h4v2z",
   internalDose: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
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
