// Radionuclide data updated to include dosimetry values from 10 CFR 20, Appendix B

const RADIONUCLIDE_DATA = [{
      name: 'Actinium-225',
      symbol: 'Ac-225',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.83 MeV (dominant)'],
         gamma: ['0.099 MeV', '0.150 MeV'],
         beta: []
      },
      daughterEmissions: {
         from: 'Fr-221',
         alpha: ['6.34 MeV']
      },
      halfLife: '9.92 days',
      decayConstant: '0.0693 day⁻¹',
      specificActivity: '2.16e15 Bq/g',
      parent: 'Thorium-229 (α)',
      daughter: 'Francium-221 (α)',
      commonUses: ['Targeted Alpha Therapy (TAT) for cancer', 'alpha-emitter generator'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A promising but scarce alpha-emitter used in clinical trials for targeted cancer therapy.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.06,
      shipping: {
         A1: 0.8,
         A2: 0.006,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 50,
            inhalation_W: 0.6,
            inhalation_Y: 0.6
         },
         DAC: {
            inhalation_W: 3e-10,
            inhalation_Y: 3e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.32E-6,
            inhalation_Y: 2.19e-6
         },
         sourceRef: '10CFR20'
      },
      gammaConstant: '0.191364 R·m²/hr·Ci',
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Actinium-227',
      symbol: 'Ac-227',
      emissionType: ['Beta-minus', 'Alpha'],
      emissionEnergies: {
         beta: ['0.045 MeV (max)'],
         alpha: ['4.95 MeV (1.38%)'],
         gamma: []
      },
      avgBetaEnergy: '0.015 MeV',
      daughterEmissions: {
         from: 'Th-227',
         alpha: ['6.038 MeV'],
         gamma: ['0.236 MeV']
      },
      halfLife: '21.77 years',
      decayConstant: '0.0318 year⁻¹',
      specificActivity: '2.68e12 Bq/g',
      parent: 'Protactinium-231',
      daughter: 'Thorium-227 (β) or Francium-223 (α)',
      commonUses: ['Actinium-225 generator (medical)', 'Research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used in limited research applications and as a source for Ac-225 generators.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.9,
         A2: 0.00009,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.2,
            inhalation_D: 0.0004,
            inhalation_W: 0.002,
            inhalation_Y: 0.004
         },
         DAC: {
            inhalation_D: 2e-13,
            inhalation_W: 7e-12,
            inhalation_Y: 2e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.81e-3,
            inhalation_W: 4.64e-4,
            inhalation_Y: 3.49e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Actinium-228',
      symbol: 'Ac-228',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['2.14 MeV (max)'],
         gamma: ['0.911 MeV', '0.969 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.713 MeV',
      halfLife: '6.15 hours',
      decayConstant: '0.113 hour⁻¹',
      specificActivity: '1.2 x 10^17 Bq/g',
      parent: 'Radium-228',
      daughter: 'Thorium-228 (β-)',
      commonUses: ['Intermediate in Thorium-232 decay chain'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'Frequently encountered as a short-lived daughter product in the Thorium-232 natural decay series.',
      shipping: {
         A1: 0.6,
         A2: 0.5,
         unit: 'TBq'
      },
      gammaConstant: '0.84397 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 9,
            inhalation_W: 40,
            inhalation_Y: 40
         },
         DAC: {
            inhalation_D: 4e-9,
            inhalation_W: 2e-8,
            inhalation_Y: 2e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.33e-8,
            inhalation_W: 2.46e-6,
            inhalation_Y: 3.39e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Americium-241',
      symbol: 'Am-241',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.486 MeV'],
         gamma: ['0.0595 MeV'],
         beta: []
      },
      halfLife: '432.2 years',
      decayConstant: '0.00160 year⁻¹',
      specificActivity: '1.27 x 10^11 Bq/g',
      parent: 'Plutonium-241 (β-)',
      daughter: 'Neptunium-237',
      commonUses: ['Smoke detectors', 'Industrial gauges (thickness, density)', 'Neutron sources'],
      category: 'Industrial',
      commonality: 'Common',
      commonalityReason: 'Used in virtually all household ionization smoke detectors and in various industrial gauges.',
      shipping: {
         A1: 10,
         A2: 0.001,
         unit: 'TBq'
      },
      gammaConstant: '0.013 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dValue: 0.06,
      dosimetry: {
         ALI: {
            ingestion: 0.8,
            inhalation_W: 0.006
         },
         DAC: {
            inhalation_W: 3e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.20e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Antimony-124',
      symbol: 'Sb-124',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['2.35 MeV (max)'],
         gamma: ['0.603 MeV', '1.691 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.783 MeV',
      halfLife: '60.2 days',
      decayConstant: '0.0115 day⁻¹',
      specificActivity: '7.8 x 10^14 Bq/g',
      parent: 'Tin-124',
      daughter: 'Tellurium-124 (stable)',
      commonUses: ['Tracer in hydrology', 'Industrial applications', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'Used for specialized industrial tracer studies but not in widespread applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.06,
      shipping: {
         A1: 0.6,
         A2: 0.6,
         unit: 'TBq'
      },
      gammaConstant: '1.06671 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 500,
            inhalation_D: 900,
            inhalation_W: 200
         },
         DAC: {
            inhalation_D: 4e-7,
            inhalation_W: 1e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.5e-9,
            inhalation_W: 6.8e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Antimony-125',
      symbol: 'Sb-125',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.767 MeV (max)'],
         gamma: ['0.428 MeV', '0.601 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.256 MeV',
      halfLife: '2.758 years',
      decayConstant: '0.251 year⁻¹',
      specificActivity: '1.6 x 10^13 Bq/g',
      parent: 'Tin-125',
      daughter: 'Tellurium-125m (IT) -> Tellurium-125 (stable)',
      commonUses: ['Environmental tracer (fission product)', 'Calibration source'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived fission product used occasionally as a calibration source or environmental tracer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 2,
         A2: 1,
         unit: 'TBq'
      },
      dValue: 0.2,
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 2000,
            inhalation_W: 500
         },
         DAC: {
            inhalation_D: 1e-6,
            inhalation_W: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.75e-10,
            inhalation_W: 3.30e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Arsenic-74',
      symbol: 'As-74',
      emissionType: ['Positron Emission', 'Beta-minus', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['1.35 MeV (max)'],
         gamma: ['0.596 MeV', '0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.450 MeV',
      halfLife: '17.77 days',
      decayConstant: '0.039 day⁻¹',
      specificActivity: '5.1 x 10^15 Bq/g',
      parent: 'Germanium-74',
      daughter: 'Selenium-74 (stable) or Germanium-74 (stable)',
      commonUses: ['PET imaging research', 'Tracer studies'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used only in specialized PET imaging research; not for routine clinical use.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 0.9,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 1000,
            inhalation_W: 800
         },
         DAC: {
            inhalation_W: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.15e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Astatine-211',
      symbol: 'At-211',
      emissionType: ['Alpha', 'Electron Capture', 'X-ray'],
      emissionEnergies: {
         alpha: ['5.867 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '7.21 hours',
      decayConstant: '0.096 hour⁻¹',
      specificActivity: '7.8 x 10^16 Bq/g',
      parent: 'Bismuth-209 (α,2n)',
      daughter: 'Bismuth-207 (EC) or Polonium-211 (α)',
      commonUses: ['Targeted alpha therapy research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A promising research alpha-emitter that is difficult to produce and has a short half-life.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 20,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 100,
            inhalation_D: 80,
            inhalation_W: 50
         },
         DAC: {
            inhalation_D: 3e-8,
            inhalation_W: 2e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.22e-8,
            inhalation_W: 2.76e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Astatine-218',
      emissionType: ['Alpha', 'Beta-minus'],
      symbol: 'At-218',
      emissionEnergies: {
         alpha: ['6.757 MeV'],
         beta: ['2.88 MeV (max)']
      },
      avgBetaEnergy: '0.960 MeV',
      halfLife: '1.5 seconds',
      decayConstant: '0.462 s⁻¹',
      specificActivity: '1.28 x 10^21 Bq/g',
      parent: 'Polonium-218',
      daughter: 'Bismuth-214 (α) or Radon-218 (β-)',
      commonUses: ['Intermediate in U-238 decay chain'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived intermediate in a natural decay chain with no practical applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.1,
            inhalation: 0.002
         },
         DAC: {
            inhalation: 1e-13
         },
         sourceRef: '10CFR20 (Default Alpha)'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Barium-133',
      symbol: 'Ba-133',
      emissionType: ['Electron Capture', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.356 MeV', '0.303 MeV', '0.276 MeV', '0.081 MeV'], // Added 0.303 and 0.276
         alpha: []
      },
      halfLife: '10.51 years',
      decayConstant: '0.0659 year⁻¹',
      gammaConstant: '0.45547 R·m²/hr·Ci',
      dValue: 2,
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      specificActivity: '9.3 x 10^12 Bq/g',
      parent: 'Lanthanum-133',
      daughter: 'Cesium-133 (stable)',
      commonUses: ['Calibration sources', 'Density gauging'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A common, long-lived gamma source used for calibrating gamma spectroscopy systems.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 3,
         A2: 3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 700
         },
         DAC: {
            inhalation_D: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.11e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Barium-137',
      symbol: 'Ba-137',
      emissionType: ['Stable'],
      emissionEnergies: {
         alpha: [],
         beta: [],
         gamma: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      specificActivity: '0 Bq/g',
      parent: 'Barium-137m (IT)',
      daughter: 'Stable',
      commonUses: ['Final stable product of Cesium-137 decay', 'Stable isotope analysis'],
      category: 'Stable/Reference',
      commonality: 'Common',
      commonalityReason: 'The stable end-product of Cs-137 decay, one of the most common radioisotopes.',
      sourceRef: {},
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Barium-137m',
      symbol: 'Ba-137m',
      emissionType: ['Isomeric Transition', 'Gamma'],
      emissionEnergies: {
         alpha: [],
         beta: [],
         gamma: ['0.662 MeV']
      },
      halfLife: '2.55 minutes',
      decayConstant: '0.272 min⁻¹',
      specificActivity: '2.9 x 10^18 Bq/g',
      parent: 'Cesium-137 (β-)',
      daughter: 'Barium-137 (stable)',
      commonUses: ['Source of gamma rays from Cesium-137 calibration sources', 'Medical imaging (historical)'],
      category: 'Industrial',
      commonality: 'Common',
      commonalityReason: 'The immediate, gamma-emitting daughter of Cs-137, responsible for its characteristic 0.662 MeV gamma ray.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 2,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 100,
            inhalation_D: 200
         },
         DAC: {
            inhalation_D: 6e-8
         },
         // FGR 11 does not typically list separate inhalation DCFs for very short-lived Ba-137m; dose is usually attributed to Cs-137 parent
         sourceRef: '10CFR20 (Isomer)'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Bismuth-207',
      symbol: 'Bi-207',
      emissionType: ['Electron Capture', 'Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.570 MeV', '1.063 MeV'],
         alpha: []
      },
      halfLife: '31.55 years',
      decayConstant: '0.0219 year⁻¹',
      specificActivity: '2.07 x 10^12 Bq/g',
      parent: 'Lead-207 (p,n)',
      daughter: 'Lead-207 (stable)',
      commonUses: ['Calibration sources', 'Environmental tracer'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived isotope used for specialized gamma calibration, but not in routine use.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.7,
         A2: 0.7,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 1000,
            inhalation_D: 2000,
            inhalation_W: 400
         },
         DAC: {
            inhalation_D: 7e-7,
            inhalation_W: 1e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.73e-9,
            inhalation_W: 5.41e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Bismuth-209',
      symbol: 'Bi-209',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['3.137 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '20100000000000000000 years',
      decayConstant: '3.45 x 10⁻²⁰ year⁻¹',
      specificActivity: '0.0031 Bq/g',
      parent: 'Primordial',
      daughter: 'Thallium-205 (stable)',
      commonUses: ['Considered stable for most practical purposes', 'Recently discovered to be radioactive'],
      category: 'Natural',
      commonality: 'Common',
      commonalityReason: 'The most abundant isotope of bismuth, long considered stable, with an extremely long half-life.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Bismuth-210',
      emissionType: ['Beta-minus'],
      symbol: 'Bi-210',
      emissionEnergies: {
         beta: ['1.16 MeV (max)'],
         alpha: [],
         gamma: []
      },
      avgBetaEnergy: '0.387 MeV',
      halfLife: '5.012 days',
      decayConstant: '0.138 day⁻¹',
      specificActivity: '9.6 x 10^15 Bq/g',
      parent: 'Lead-210',
      daughter: 'Polonium-210 (β-) or Thallium-206 (α)',
      commonUses: ['Intermediate in U-238 decay chain', 'Used in disequilibrium studies with Pb-210'],
      category: 'Natural',
      decaySeriesId: 'U-238-series',
      commonality: 'Moderate',
      commonalityReason: 'A key intermediate in the U-238 decay series, the daughter of the common environmental nuclide Pb-210.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 800,
            inhalation_D: 200,
            inhalation_W: 30
         },
         DAC: {
            inhalation_D: 1e-7,
            inhalation_W: 1e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 4.18e-9,
            inhalation_W: 5.29e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Bismuth-211',
      emissionType: ['Alpha', 'Beta-minus', 'Gamma'],
      symbol: 'Bi-211',
      emissionEnergies: {
         alpha: ['6.623 MeV'],
         beta: ['0.579 MeV (max)'],
         gamma: ['0.351 MeV']
      },
      avgBetaEnergy: '0.193 MeV',
      halfLife: '2.14 minutes',
      decayConstant: '0.324 min⁻¹',
      specificActivity: '3.4 x 10^18 Bq/g',
      parent: 'Lead-211',
      daughter: 'Thallium-207 (α) or Polonium-211 (β-)',
      commonUses: ['Intermediate in Actinium-227 decay series'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A very short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Bismuth-212',
      emissionType: ['Beta-minus', 'Alpha', 'Gamma'],
      symbol: 'Bi-212',
      emissionEnergies: {
         beta: ['2.25 MeV (max)'],
         alpha: ['6.09 MeV'],
         gamma: ['0.727 MeV', '1.621 MeV']
      },
      avgBetaEnergy: '0.750 MeV',
      halfLife: '60.55 minutes',
      decayConstant: '0.0114 min⁻¹',
      specificActivity: '1.2 x 10^17 Bq/g',
      parent: 'Lead-212',
      daughter: 'Polonium-212 (β-) or Thallium-208 (α)',
      commonUses: ['Research in targeted alpha/beta therapy'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A short-lived nuclide in the Th-232 decay series, notable for its high-energy gamma daughter (Tl-208).',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.7,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 5000,
            inhalation_D: 200,
            inhalation_W: 300
         },
         DAC: {
            inhalation_D: 1e-7,
            inhalation_W: 1e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.83e-9,
            inhalation_W: 5.17e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Bismuth-213',
      emissionType: ['Beta-minus', 'Alpha', 'Gamma'],
      symbol: 'Bi-213',
      emissionEnergies: {
         beta: ['1.42 MeV (max)'],
         alpha: ['5.87 MeV'],
         gamma: ['0.440 MeV']
      },
      avgBetaEnergy: '0.473 MeV',
      halfLife: '45.6 minutes',
      decayConstant: '0.0152 min⁻¹',
      specificActivity: '1.09 x 10^17 Bq/g',
      parent: 'Actinium-225',
      daughter: 'Polonium-213 (β) or Thallium-209 (α)',
      commonUses: ['Targeted Alpha Therapy (TAT) for various cancers.'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A short-lived daughter of Ac-225, used in targeted alpha therapy research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      dosimetry: {
         ALI: {
            ingestion: 7000,
            inhalation_D: 300,
            inhalation_W: 400
         },
         DAC: {
            inhalation_D: 1e-7,
            inhalation_W: 1e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 4.63e-9,
            inhalation_W: 4.16e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Bismuth-214',
      emissionType: ['Beta-minus', 'Alpha', 'Gamma'],
      symbol: 'Bi-214',
      emissionEnergies: {
         beta: ['3.27 MeV (max)'],
         gamma: ['0.609 MeV', '1.120 MeV', '1.764 MeV'],
         alpha: ['5.62 MeV']
      },
      avgBetaEnergy: '1.090 MeV',
      halfLife: '19.9 minutes',
      decayConstant: '0.0348 min⁻¹',
      specificActivity: '3.6 x 10^17 Bq/g',
      parent: 'Lead-214',
      daughter: 'Polonium-214 (β-) / Thallium-210 (α)',
      commonUses: ['Source of natural background gamma radiation (from Radon decay products)'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A prominent gamma-emitter in the Radon-222 decay chain, contributing to natural background radiation.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      dosimetry: {
         ALI: {
            ingestion: 20000,
            inhalation_D: 800,
            inhalation_W: 900
         },
         DAC: {
            inhalation_D: 3e-7,
            inhalation_W: 4e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.78e-9,
            inhalation_W: 1.68e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },


   {
      name: 'Bromine-77',
      symbol: 'Br-77',
      emissionType: ['Electron Capture', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.239 MeV', '0.297 MeV'],
         alpha: []
      },
      halfLife: '57.04 hours',
      decayConstant: '0.0121 hour⁻¹',
      specificActivity: '1.2 x 10^16 Bq/g',
      parent: 'Krypton-77',
      daughter: 'Selenium-77 (stable)',
      commonUses: ['PET imaging research', 'Antibody labeling'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used for specialized medical research applications like antibody labeling.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 3,
         A2: 3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 20000,
            inhalation_D: 20000,
            inhalation_W: 20000
         },
         DAC: {
            inhalation_D: 1e-5,
            inhalation_W: 8e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.75e-11,
            inhalation_W: 7.46e-11
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Bromine-82',
      symbol: 'Br-82',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.444 MeV (max)'],
         gamma: ['0.777 MeV', '1.044 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.148 MeV',
      halfLife: '35.3 hours',
      decayConstant: '0.0196 hour⁻¹',
      specificActivity: '1.6 x 10^16 Bq/g',
      parent: 'Selenium-82',
      daughter: 'Krypton-82 (stable)',
      commonUses: ['Hydrological tracing', 'Flow measurements in pipelines', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A gamma-emitting tracer used for specialized industrial and hydrological studies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.4,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 3000,
            inhalation_D: 4000,
            inhalation_W: 4000
         },
         DAC: {
            inhalation_D: 2e-6,
            inhalation_W: 2e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.31e-10,
            inhalation_W: 4.13e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },

   {
      name: 'Cadmium-109',
      symbol: 'Cd-109',
      emissionType: ['Electron Capture', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.088 MeV (γ)'],
         alpha: []
      },
      halfLife: '461.4 days',
      decayConstant: '0.00150 day⁻¹',
      specificActivity: '1.2 x 10^14 Bq/g',
      parent: 'Indium-109',
      daughter: 'Silver-109 (stable)',
      commonUses: ['X-ray fluorescence', 'Calibration source'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A common source for X-ray fluorescence (XRF) analyzers and instrument calibration.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 30,
         A2: 2,
         unit: 'TBq'
      },
      dValue: 20,
      dosimetry: {
         ALI: {
            ingestion: 300,
            inhalation_D: 40,
            inhalation_W: 100,
            inhalation_Y: 100
         },
         DAC: {
            inhalation_D: 1e-8,
            inhalation_W: 5e-8,
            inhalation_Y: 5e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.09e-8,
            inhalation_W: 1.07e-8,
            inhalation_Y: 1.22e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Cadmium-115m',
      symbol: 'Cd-115m',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.62 MeV (max)'],
         gamma: ['0.934 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.540 MeV',
      halfLife: '44.6 days',
      decayConstant: '0.0155 day⁻¹',
      specificActivity: '1.3 x 10^15 Bq/g',
      parent: 'Silver-115',
      daughter: 'Indium-115',
      commonUses: ['Fission product', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A fission product with limited use outside of specific research applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 300,
            inhalation_D: 50,
            inhalation_W: 100,
            inhalation_Y: 100
         },
         DAC: {
            inhalation_D: 2e-8,
            inhalation_W: 5e-8,
            inhalation_Y: 6e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.95e-8,
            inhalation_W: 1.11e-8,
            inhalation_Y: 1.16e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Calcium-45',
      symbol: 'Ca-45',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.257 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.077 MeV',
      halfLife: '162.6 days',
      decayConstant: '0.00426 day⁻¹',
      specificActivity: '6.4 x 10^14 Bq/g',
      parent: 'Potassium-45',
      daughter: 'Scandium-45 (stable)',
      commonUses: ['Bone metabolism studies', 'Agricultural research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A pure beta-emitter used as a tracer in specialized biological and agricultural research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 100,
      shipping: {
         A1: 40,
         A2: 1,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 800
         },
         DAC: {
            inhalation_W: 4e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.79e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Calcium-47',
      symbol: 'Ca-47',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.694 MeV (max)'],
         gamma: ['1.297 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.231 MeV',
      daughterEmissions: {
         from: 'Sc-47',
         beta: ['0.601 MeV (max)'],
         gamma: ['0.159 MeV']
      },
      halfLife: '4.536 days',
      decayConstant: '0.153 day⁻¹',
      specificActivity: '2.07 x 10^16 Bq/g',
      parent: 'Potassium-47',
      daughter: 'Scandium-47',
      commonUses: ['Bone metabolism research (historical)', 'Medical studies'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Largely replaced by other isotopes for medical studies, now used only in limited research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 3,
         A2: 0.3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 800,
            inhalation_W: 900
         },
         DAC: {
            inhalation_W: 4e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.77e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },

   {
      name: 'Californium-252',
      symbol: 'Cf-252',
      emissionType: ['Alpha', 'Spontaneous Fission', 'Neutron', 'Gamma'],
      emissionEnergies: {
         alpha: ['6.118 MeV'],
         beta: [],
         gamma: ['~0.1-6 MeV (complex spectrum from fission)']
      },
      halfLife: '2.645 years',
      decayConstant: '0.262 year⁻¹',
      specificActivity: '2.0 x 10^13 Bq/g',
      parent: 'Curium-252',
      daughter: 'Curium-248 (α), Fission products',
      commonUses: ['Neutron source (neutron activation analysis)', 'Tumor treatment', 'Reactor startup', 'Well logging'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A powerful and widely used spontaneous fission neutron source for various industrial and medical applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.1,
         A2: 0.003,
         unit: 'TBq'
      },
      dValue: 0.02,
      dosimetry: {
         ALI: {
            ingestion: 2,
            inhalation_W: 0.02,
            inhalation_Y: 0.03
         },
         DAC: {
            inhalation_W: 8e-12,
            inhalation_Y: 1e-11
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 3.70e-5,
            inhalation_Y: 4.24e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Carbon-11',
      symbol: 'C-11',
      emissionType: ['Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['0.960 MeV (max)'],
         gamma: ['0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.320 MeV',
      halfLife: '20.36 minutes',
      decayConstant: '0.0340 min⁻¹',
      specificActivity: '1.9 x 10^18 Bq/g',
      parent: 'Boron-11 (p,n)',
      daughter: 'Boron-11 (stable)',
      commonUses: ['PET imaging for various tracers (e.g., methionine for tumors)'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A PET isotope with a very short half-life, requiring an on-site cyclotron for production.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 400000,
            inhalation_D: 400000
         },
         DAC: {
            inhalation_D: 2e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Carbon-14',
      symbol: 'C-14',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.156 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.049 MeV',
      halfLife: '5730 years',
      decayConstant: '1.21 x 10⁻⁴ year⁻¹',
      specificActivity: '1.65 x 10^11 Bq/g',
      parent: 'Nitrogen-14 (n,p)',
      daughter: 'Nitrogen-14 (stable)',
      commonUses: ['Radiometric dating (archeology, geology)', 'Tracers in biological and chemical research', 'Labeled compounds'],
      category: 'Industrial',
      commonality: 'Common',
      commonalityReason: 'Famously used for radiocarbon dating and as a tracer in countless biological and chemical research labs.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 3,
         unit: 'TBq'
      },
      dValue: 50,
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 2000, // Updated from generic 'inhalation' to 'W' (Compounds) for better matching
            inhalation_Vapor: 2000
         },
         DAC: {
            inhalation_W: 1e-6,
            inhalation_Vapor: 1e-6
         },
         DCF: {
            ingestion: 0, // Organic compounds
            inhalation_W: 7.83e-13, // Particulate
            inhalation_Vapor: 6.36e-12 // CO2
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_low_risk'
   },
   {
      name: 'Cerium-141',
      symbol: 'Ce-141',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.581 MeV (max)'],
         gamma: ['0.145 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.194 MeV',
      halfLife: '32.5 days',
      decayConstant: '0.0213 day⁻¹',
      specificActivity: '1.09 x 10^15 Bq/g',
      parent: 'Lanthanum-141',
      daughter: 'Praseodymium-141 (stable)',
      commonUses: ['Fission product', 'Medical research (historical)', 'Environmental tracer'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A fission product with limited use outside of specialized research applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 20,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 700,
            inhalation_Y: 600
         },
         DAC: {
            inhalation_W: 3e-7,
            inhalation_Y: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.25e-9,
            inhalation_Y: 2.42e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Cerium-144',
      symbol: 'Ce-144',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.319 MeV (max)'],
         gamma: ['0.133 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.106 MeV',
      daughterEmissions: {
         from: 'Pr-144',
         beta: ['2.997 MeV (max)']
      },
      halfLife: '284.9 days',
      decayConstant: '0.00243 day⁻¹',
      specificActivity: '1.18 x 10^14 Bq/g',
      parent: 'Lanthanum-144',
      daughter: 'Praseodymium-144 (β-)',
      commonUses: ['Fission product', 'Environmental tracer'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A fission product with limited use outside of specialized research applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.2,
         A2: 0.2,
         unit: 'TBq'
      },
      dValue: 0.4,
      dosimetry: {
         ALI: {
            ingestion: 200,
            inhalation_W: 30,
            inhalation_Y: 10
         },
         DAC: {
            inhalation_W: 1e-8,
            inhalation_Y: 6e-9
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 5.84e-8,
            inhalation_Y: 1.01e-7
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },

   {
      name: 'Cesium-134',
      symbol: 'Cs-134',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.658 MeV (max)'],
         gamma: ['0.605 MeV', '0.796 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.219 MeV',
      halfLife: '2.065 years',
      decayConstant: '0.335 year⁻¹',
      specificActivity: '4.8 x 10^13 Bq/g',
      parent: 'Cesium-133 (n,γ)',
      daughter: 'Barium-134 (stable)',
      commonUses: ['Environmental tracer (fallout)', 'Calibration sources'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'An activation product often seen alongside Cs-137 after reactor incidents, used as a tracer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.04,
      shipping: {
         A1: 0.7,
         A2: 0.7,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 70,
            inhalation_D: 100
         },
         DAC: {
            inhalation_D: 4e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.25e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Cesium-137',
      symbol: 'Cs-137',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.512 MeV (max, 94.6%)', '1.174 MeV (max, 5.4%)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.171 MeV',
         daughterEmissions: {
         from: 'Ba-137m',
         gamma: ['0.662 MeV (85.1% yield)'] // Explicit total yield per parent decay
      },
      halfLife: '30.08 years',
      decayConstant: '0.0230 year⁻¹',
      gammaConstant: '0.382 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dValue: 0.1,
      specificActivity: '3.21 x 10^12 Bq/g',
      parent: 'Uranium Fission',
      daughter: 'Barium-137m (IT) -> Barium-137 (stable)',
      branchingFraction: 0.946,
      commonUses: ['Calibration sources', 'Industrial gauges (density, level)', 'Blood irradiators', 'Radiotherapy (historical)'],
      category: 'Industrial',
      commonality: 'Common',
      commonalityReason: 'A major fission product and one of the most common gamma sources for industrial gauging and calibration.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 2,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 100,
            inhalation_D: 200
         },
         DAC: {
            inhalation_D: 6e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.63e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Chlorine-36',
      symbol: 'Cl-36',
      emissionType: ['Beta-minus', 'Electron Capture'],
      emissionEnergies: {
         beta: ['0.709 MeV (max, 98%)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.251 MeV',
      halfLife: '301,000 years',
      decayConstant: '2.30 x 10⁻⁶ year⁻¹',
      specificActivity: '1.2 x 10^9 Bq/g',
      parent: 'Chlorine-35 (n,γ)',
      daughter: 'Argon-36 (stable) or Sulfur-36 (stable)',
      commonUses: ['Beta calibration standard', 'Geological dating'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'The standard long-lived reference source for calibrating beta detectors.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 0.6,
         unit: 'TBq'
      },
      dValue: 20, // IAEA EPR-D-Values
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 200
         },
         DAC: {
            inhalation_W: 1e-7
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_low_risk'
   },
   {
      name: 'Cobalt-57',
      symbol: 'Co-57',
      emissionType: ['Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.122 MeV', '0.136 MeV'],
         alpha: []
      },
      halfLife: '271.79 days',
      decayConstant: '0.00255 day⁻¹',
      specificActivity: '3.12e14 Bq/g',
      parent: 'Nickel-57',
      daughter: 'Iron-57 (stable)',
      commonUses: ['Check sources', 'Medical diagnostics (historical)'],
      category: 'Industrial',
      commonality: 'Common',
      sourceRef: {
         halfLife: 'nndc'
      },
      gammaConstant: '0.151 R·m²/hr·Ci'
   },
   {
      name: 'Cobalt-60',
      symbol: 'Co-60',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.318 MeV (max)'],
         gamma: ['1.173 MeV', '1.332 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.106 MeV',
      halfLife: '5.27 years',
      decayConstant: '0.131 year⁻¹',
      gammaConstant: '1.32 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dValue: 0.03,
      specificActivity: '4.18 x 10^13 Bq/g',
      parent: 'Cobalt-59 (n,γ)',
      daughter: 'Nickel-60 (stable)',
      commonUses: ['Industrial radiography', 'Sterilization of medical equipment and food', 'Radiotherapy (external beam)', 'Tracers'],
      category: 'Industrial',
      commonality: 'Common',
      commonalityReason: 'Widely used for industrial radiography, medical equipment sterilization, and cancer therapy.',

      shipping: {
         A1: 0.4,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 200,
            inhalation_W: 200,
            inhalation_Y: 30
         },
         DAC: {
            inhalation_W: 7e-8,
            inhalation_Y: 1e-8
         },
         DCF: {
            ingestion: 0, // Oxide
            inhalation_W: 8.94e-9,
            inhalation_Y: 5.91e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Copper-64',
      symbol: 'Cu-64',
      emissionType: ['Positron Emission', 'Beta-minus', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['0.653 MeV (β+ max)', '0.579 MeV (β- max)'],
         gamma: ['1.345 MeV', '0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.193 MeV (β-)',
      halfLife: '12.7 hours',
      decayConstant: '0.0546 hour⁻¹',
      specificActivity: '1.74 x 10^17 Bq/g',
      parent: 'Nickel-64 (p,n)',
      daughter: 'Nickel-64 (stable) or Zinc-64 (stable)',
      commonUses: ['PET imaging (various applications)', 'Targeted radionuclide therapy research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A versatile medical isotope for PET imaging and therapy research, but not as widespread as F-18.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 6,
         A2: 1,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 10000,
            inhalation_D: 30000,
            inhalation_W: 20000,
            inhalation_Y: 20000
         },
         DAC: {
            inhalation_D: 1e-5,
            inhalation_W: 1e-5,
            inhalation_Y: 9e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.29e-11,
            inhalation_W: 6.93e-11,
            inhalation_Y: 7.48e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Copper-67',
      symbol: 'Cu-67',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.576 MeV (max)'],
         gamma: ['0.185 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.192 MeV',
      halfLife: '61.83 hours',
      decayConstant: '0.0112 hour⁻¹',
      specificActivity: '1.2 x 10^16 Bq/g',
      parent: 'Zinc-67 (n,p)',
      daughter: 'Zinc-67 (stable)',
      commonUses: ['Radioimmunotherapy, theranostic partner for Copper-64 PET imaging.'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A research isotope for targeted therapy, valued as a "theranostic" partner to the PET isotope Cu-64.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.7,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 5000,
            inhalation_D: 8000,
            inhalation_W: 5000,
            inhalation_Y: 5000
         },
         DAC: {
            inhalation_D: 3e-6,
            inhalation_W: 2e-6,
            inhalation_Y: 2e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.83e-10,
            inhalation_W: 3.15e-10,
            inhalation_Y: 3.32e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Curium-244',
      symbol: 'Cm-244',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.805 MeV'],
         gamma: ['0.043 MeV'],
         beta: []
      },
      halfLife: '18.1 years',
      decayConstant: '0.0383 year⁻¹',
      specificActivity: '3.0 x 10^12 Bq/g',
      parent: 'Americium-244 (β-)',
      daughter: 'Plutonium-240',
      commonUses: ['Alpha particle X-ray spectrometers (APXS) for space exploration', 'Neutron sources'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'Used in specialized applications like space exploration instruments due to its alpha emissions.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.05,
      shipping: {
         A1: 20,
         A2: 0.002,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 1, // Bone Surface 2
            inhalation_W: 0.01
         },
         DAC: {
            inhalation_W: 5e-12
         },
         DCF: {
            ingestion: 1.20e-7,
            inhalation_W: 6.70e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Erbium-169',
      symbol: 'Er-169',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.341 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.114 MeV',
      halfLife: '9.4 days',
      decayConstant: '0.0737 day⁻¹',
      specificActivity: '5.2 x 10^14 Bq/g',
      parent: 'Erbium-168 (n,γ)',
      daughter: 'Thulium-169 (stable)',
      commonUses: ['Radiation synovectomy for arthritis treatment.'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used for a specific medical therapy (radiation synovectomy) that is not widely performed.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 1,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 3000,
            inhalation_W: 3000
         },
         DAC: {
            inhalation_W: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 5.64e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Europium-152',
      symbol: 'Eu-152',
      emissionType: ['Beta-minus', 'Electron Capture', 'Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['1.48 MeV (max)'],
         gamma: ['0.122 MeV', '0.344 MeV', '0.779 MeV', '0.964 MeV', '1.112 MeV', '1.408 MeV'], // Added middle energies
         alpha: []
      },
      avgBetaEnergy: '0.493 MeV',
      halfLife: '13.54 years',
      decayConstant: '0.0512 year⁻¹',
      specificActivity: '6.4 x 10^12 Bq/g',
      parent: 'Samarium-152 (n,γ)',
      daughter: 'Samarium-152 (stable) or Gadolinium-152 (stable)',
      commonUses: ['Calibration sources for gamma spectroscopy', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived, multi-gamma emitting source excellent for calibration, but less common than Co-60 or Ba-133.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 1,
         unit: 'TBq'
      },
      dValue: 0.06,
      gammaConstant: '0.74444 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 800,
            inhalation_W: 20
         },
         DAC: {
            inhalation_W: 1e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 5.97e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Europium-154',
      symbol: 'Eu-154',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.85 MeV (max)'],
         gamma: ['1.274 MeV', '0.723 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.617 MeV',
      halfLife: '8.59 years',
      decayConstant: '0.0807 year⁻¹',
      specificActivity: '9.8 x 10^12 Bq/g',
      parent: 'Samarium-154 (n,γ)',
      daughter: 'Gadolinium-154 (stable)',
      commonUses: ['Environmental monitoring (fission product)', 'Calibration sources'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived fission product sometimes used for gamma calibration.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.9,
         A2: 0.6,
         unit: 'TBq'
      },
      dValue: 0.06,
      gammaConstant: '0.75554 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 500,
            inhalation_W: 20
         },
         DAC: {
            inhalation_W: 8e-9
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 7.73e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Fluorine-18',
      symbol: 'F-18',
      emissionType: ['Positron Emission', 'Annihilation Photons'],
      emissionEnergies: {
         beta: ['0.634 MeV (max)'],
         gamma: ['0.511 MeV (200% yield)'], // Crucial detail
         alpha: []
      },
      avgBetaEnergy: '0.250 MeV',
      halfLife: '109.77 minutes',
      decayConstant: '0.006315 min⁻¹',
      specificActivity: '3.52 x 10^18 Bq/g',
      // Gamma Constant: ~5.7 R-cm2/mCi-hr  =>  0.57 R-m2/Ci-hr
      gammaConstant: '0.57 R·m²/hr·Ci',
      parent: 'Oxygen-18 (p,n)',
      daughter: 'Oxygen-18 (stable)',
      commonUses: ['PET imaging (FDG)', 'Bone scans (NaF)'],
      category: 'Medical',
      commonality: 'Common',
      commonalityReason: 'The standard workhorse isotope for PET imaging.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 1,
         A2: 0.6,
         unit: 'TBq'
      },
      // 10 CFR 20 Appendix B values
      dosimetry: {
         ALI: {
            ingestion: 50000,
            inhalation_D: 70000,
            inhalation_W: 90000,
            inhalation_Y: 80000
         },
         DAC: {
            inhalation_D: 3e-5,
            inhalation_W: 4e-5,
            inhalation_Y: 3e-5
         },
         sourceRef: '10CFR20'
      }
   },
   {
      name: 'Fluorine-19',
      symbol: 'F-19',
      emissionType: ['Stable'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      parent: 'Stable',
      daughter: 'Stable',
      commonUses: ['NMR', 'Fluorinated compounds (not a radionuclide use)'],
      category: 'Stable/Reference',
      commonality: 'N/A',
      commonalityReason: 'This is a stable isotope and not radioactive.',
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Francium-223',
      symbol: 'Fr-223',
      emissionType: ['Beta-minus', 'Alpha', 'Gamma'],
      emissionEnergies: {
         beta: ['1.15 MeV (max)'],
         alpha: ['5.34 MeV (0.006%)'],
         gamma: ['0.050 MeV', '0.235 MeV'] // Weak emissions
      },
      avgBetaEnergy: '0.315 MeV',
      halfLife: '22.00 minutes',
      decayConstant: '0.0315 min⁻¹',
      specificActivity: '1.43 x 10^18 Bq/g',
      parent: 'Actinium-227',
      daughter: 'Radium-223 (β-) or Astatine-219 (α)',
      commonUses: ['Intermediate in Actinium-227 decay series', 'Research'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A short-lived intermediate in the Actinium decay series (U-235 chain).',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.6, // Generic beta/gamma short lived
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 600,
            inhalation_D: 800,
         },
         DAC: {
            inhalation_D: 3e-7,
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.33e-9 // Approximation based on similar short-lived betas
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Gadolinium-153',
      symbol: 'Gd-153',
      emissionType: ['Electron Capture', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.097 MeV', '0.103 MeV'],
         alpha: []
      },
      halfLife: '240.4 days',
      decayConstant: '0.00288 day⁻¹',
      specificActivity: '1.3 x 10^14 Bq/g',
      parent: 'Europium-153 (n,γ)',
      daughter: 'Europium-153 (stable)',
      commonUses: ['Bone densitometry', 'X-ray absorption measurements', 'Calibration sources'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A key source used in dual-photon absorptiometry for bone density scanning.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 9,
         unit: 'TBq'
      },
      dValue: 1,
      gammaConstant: '0.172383 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 5000,
            inhalation_D: 100,
            inhalation_W: 600
         },
         DAC: {
            inhalation_D: 6e-8,
            inhalation_W: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.434e-9,
            inhalation_W: 2.56e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Gadolinium-159',
      symbol: 'Gd-159',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.970 MeV (max)'],
         gamma: ['0.363 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.323 MeV',
      halfLife: '18.48 hours',
      decayConstant: '0.0375 hour⁻¹',
      specificActivity: '3.6 x 10^16 Bq/g',
      parent: 'Europium-159',
      daughter: 'Terbium-159 (stable)',
      commonUses: ['Boron Neutron Capture Therapy (BNCT) research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A short-lived isotope used in specialized medical therapy research (BNCT).',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 3,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 3000,
            inhalation_D: 8000,
            inhalation_W: 6000
         },
         DAC: {
            inhalation_D: 3e-6,
            inhalation_W: 2e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.81e-10,
            inhalation_W: 2.64e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Gallium-67',
      symbol: 'Ga-67',
      emissionType: ['Electron Capture', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.093 MeV', '0.185 MeV', '0.300 MeV'],
         alpha: []
      },
      halfLife: '3.26 days',
      decayConstant: '0.213 day⁻¹',
      specificActivity: '3.8 x 10^15 Bq/g',
      parent: 'Zinc-67 (p,n)',
      daughter: 'Zinc-67 (stable)',
      commonUses: ['Tumor imaging (lymphomas, lung cancer)', 'Infection imaging', 'Inflammation imaging'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A standard SPECT imaging agent for detecting tumors and inflammation.',
      sourceRef: {
         halfLife: 'nndc'
      },
      gammaConstant: '0.11 R·m²/hr·Ci',
      dValue: 0.3,
      shipping: {
         A1: 7,
         A2: 3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 7000,
            inhalation_D: 10000,
            inhalation_W: 10000
         },
         DAC: {
            inhalation_D: 6e-6,
            inhalation_W: 4e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 9.50e-11,
            inhalation_W: 1.1e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Gallium-68',
      symbol: 'Ga-68',
      emissionType: ['Positron Emission', 'Annihilation Photons'],
      emissionEnergies: {
         beta: ['1.90 MeV (max)'],
         gamma: ['0.511 MeV (178% yield)', '1.077 MeV (3%)'],
         alpha: []
      },
      avgBetaEnergy: '0.830 MeV',
      halfLife: '67.71 minutes',
      decayConstant: '0.0102 min⁻¹',
      specificActivity: '1.51 x 10^18 Bq/g',
      // Gamma Constant: ~5.4 R-cm2/mCi-hr => 0.54 R-m2/Ci-hr
      gammaConstant: '0.54 R·m²/hr·Ci',
      parent: 'Germanium-68',
      daughter: 'Zinc-68 (stable)',
      commonUses: ['PET imaging (Neuroendocrine tumors)', 'Prostate cancer imaging (PSMA)'],
      category: 'Medical',
      commonality: 'Common',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 20000,
            inhalation_D: 40000,
            inhalation_W: 50000
         },
         DAC: {
            inhalation_D: 2e-5,
            inhalation_W: 2e-5
         },
         sourceRef: '10CFR20'
      }
   },
   {
      name: 'Germanium-68',
      symbol: 'Ge-68',
      emissionType: ['Electron Capture', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      daughterEmissions: {
         from: 'Ga-68',
         beta: ['1.90 MeV (max)'],
         gamma: ['0.511 MeV (annihilation)']
      },
      halfLife: '270.95 days',
      decayConstant: '0.00256 day⁻¹',
      specificActivity: '2.8 x 10^14 Bq/g',
      parent: 'Arsenic-68',
      daughter: 'Gallium-68 (EC, β+)',
      commonUses: ['Generator for Ga-68 (PET imaging)'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'The long-lived parent used in generators to produce the short-lived PET isotope Ga-68.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.007,
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 5000,
            inhalation_D: 4000,
            inhalation_W: 100
         },
         DAC: {
            inhalation_D: 2e-6,
            inhalation_W: 4e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 4.49e-10,
            inhalation_W: 1.40e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Gold-195m',
      symbol: 'Au-195m',
      emissionType: ['Isomeric Transition', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.262 MeV'],
         alpha: []
      },
      halfLife: '30.5 seconds',
      decayConstant: '0.0227 s⁻¹',
      specificActivity: '1.5 x 10^18 Bq/g',
      parent: 'Mercury-195m',
      daughter: 'Gold-195',
      commonUses: ['Cardiac blood flow imaging (historical)'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used historically in medicine but has been replaced by other isotopes.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 50000,
            inhalation_D: 100000,
            inhalation_W: 1000,
            inhalation_Y: 400
         },
         DAC: {
            inhalation_D: 5e-6,
            inhalation_W: 6e-7,
            inhalation_D: 2e-7
         },
         sourceRef: 'Estimated'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Gold-198',
      symbol: 'Au-198',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.961 MeV (max)'],
         gamma: ['0.412 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.320 MeV',
      halfLife: '2.695 days',
      decayConstant: '0.257 day⁻¹',
      specificActivity: '9.3 x 10^15 Bq/g',
      parent: 'Gold-197 (n,γ)',
      daughter: 'Mercury-198 (stable)',
      commonUses: ['Radiotherapy (brachytherapy)', 'Tracers', 'Industrial applications'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'Used in specific brachytherapy applications and as an industrial tracer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 0.6,
         unit: 'TBq'
      },
      gammaConstant: '0.291634 R·m²/hr·Ci',
      dValue: 0.2,
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 1000,
            inhalation_D: 4000,
            inhalation_W: 2000,
            inhalation_Y: 2000
         },
         DAC: {
            inhalation_D: 2e-6,
            inhalation_W: 8e-7,
            inhalation_Y: 7e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.87e-10,
            inhalation_W: 8.20e-10,
            inhalation_Y: 8.87e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Holmium-166',
      symbol: 'Ho-166',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.854 MeV (max)'],
         gamma: ['0.080 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.618 MeV',
      halfLife: '26.8 hours',
      decayConstant: '0.0258 hour⁻¹',
      specificActivity: '2.5 x 10^16 Bq/g',
      parent: 'Holmium-165 (n,γ)',
      daughter: 'Erbium-166 (stable)',
      commonUses: ['Radiotherapy for liver tumors, bone pain palliation, radiosynovectomy.'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A therapeutic isotope used for treating liver tumors and for bone pain palliation.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.4,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 900,
            inhalation_W: 2000
         },
         DAC: {
            inhalation_W: 7e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 8.48e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Indium-111',
      symbol: 'In-111',
      emissionType: ['Electron Capture', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.171 MeV', '0.245 MeV'],
         alpha: []
      },
      gammaConstant: '0.33 R·m²/hr·Ci',
      dValue: 0.3,
      halfLife: '2.80 days',
      decayConstant: '0.247 day⁻¹',
      specificActivity: '2.6 x 10^16 Bq/g',
      parent: 'Cadmium-111 (p,n)',
      daughter: 'Cadmium-111 (stable)',
      commonUses: ['White blood cell labeling (infection imaging)', 'Tumor imaging', 'CSF flow studies'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A standard SPECT imaging agent, particularly for labeling white blood cells to find infections.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 3,
         A2: 3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4000,
            inhalation_D: 6000,
            inhalation_W: 6000
         },
         DAC: {
            inhalation_D: 3e-6,
            inhalation_W: 3e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.92e-11,
            inhalation_W: 2.09e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Indium-113m',
      symbol: 'In-113m',
      emissionType: ['Isomeric Transition', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.392 MeV'],
         alpha: []
      },
      halfLife: '1.658 hours',
      decayConstant: '0.418 hour⁻¹',
      specificActivity: '4.1 x 10^17 Bq/g',
      parent: 'Tin-113',
      daughter: 'Indium-113 (stable)',
      commonUses: ['Medical diagnostic imaging (historical)'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used historically in medicine but has been replaced by other isotopes like Tc-99m.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 4,
         A2: 2,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 50000,
            inhalation_D: 100000,
            inhalation_W: 200000
         },
         DAC: {
            inhalation_D: 6e-5,
            inhalation_W: 8e-5
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.11e-11,
            inhalation_W: 9.04e-12
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Indium-115',
      symbol: 'In-115',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.499 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.166 MeV',
      halfLife: '441000000000000 years',
      decayConstant: '1.57 x 10⁻¹⁵ year⁻¹',
      specificActivity: '0.26 Bq/g',
      parent: 'Primordial',
      daughter: 'Tin-115 (stable)',
      commonUses: ['Neutrino mass experiments', 'Research (extremely weak activity)'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A primordial isotope with an extremely long half-life, used in fundamental physics research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      dosimetry: {
         ALI: {
            ingestion: 40,
            inhalation_D: 1,
            inhalation_W: 5
         }, // Values for In-115m often used, but for stable/long-lived, usually treated as chemical toxicity or generic.
         DAC: {
            inhalation_D: 6e-10,
            inhalation_W: 2e-9
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.01e-6,
            inhalation_W: 2.76e-7
         },
         sourceRef: '10CFR20 (Conservative)'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iodine-123',
      symbol: 'I-123',
      emissionType: ['Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.159 MeV'],
         alpha: []
      },
      halfLife: '13.22 hours',
      decayConstant: '0.0524 hour⁻¹',
      specificActivity: '7.4 x 10^16 Bq/g',
      parent: 'Xenon-123',
      daughter: 'Tellurium-123 (stable)',
      commonUses: ['SPECT imaging for thyroid function and tumors', 'Cardiac and neurological imaging'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'An ideal isotope for thyroid imaging (SPECT) due to its short half-life and clean gamma emission.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 6,
         A2: 3,
         unit: 'TBq'
      },
      gammaConstant: '0.277 R·m²/hr·Ci',
      dValue: 0.2,
      dosimetry: {
         ALI: {
            ingestion: 3000,
            inhalation_D: 6000
         },
         DAC: {
            inhalation_D: 3e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.01e-11
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iodine-125',
      symbol: 'I-125',
      emissionType: ['Electron Capture', 'X-ray', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.0355 MeV'],
         alpha: []
      },
      halfLife: '59.4 days',
      decayConstant: '0.0117 day⁻¹',
      specificActivity: '6.4 x 10^14 Bq/g',
      parent: 'Xenon-125',
      daughter: 'Tellurium-125 (stable)',
      commonUses: ['Brachytherapy (prostate cancer)', 'Radioimmunoassay', 'Bone mineral density (historical)'],
      category: 'Medical',
      commonality: 'Common',
      commonalityReason: 'Widely used in permanent brachytherapy seeds for prostate cancer and in laboratory radioimmunoassays.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 20,
         A2: 3,
         unit: 'TBq'
      },
      dValue: 0.2,
      gammaConstant: '0.274984 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 40,
            inhalation_D: 60
         },
         DAC: {
            inhalation_D: 3e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.53e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iodine-129',
      symbol: 'I-129',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.154 MeV (max)'],
         gamma: ['0.039 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.051 MeV',
      halfLife: '16.1 million years',
      decayConstant: '4.31 x 10⁻⁸ year⁻¹',
      specificActivity: '6.54 x 10^6 Bq/g',
      parent: 'Tellurium-129 (β-)',
      daughter: 'Xenon-129 (stable)',
      commonUses: ['Environmental tracer (long-lived fission product)', 'Geological dating'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'An extremely long-lived fission product used as a tracer in environmental and geological studies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.0,
      shipping: {
         A1: 'unlimited',
         A2: 'unlimited',
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 5,
            inhalation_D: 9
         },
         DAC: {
            inhalation_D: 4e-9
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 4.69e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iodine-131',
      symbol: 'I-131',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.606 MeV (max)'],
         gamma: ['0.364 MeV (dominant)', '0.637 MeV', '0.284 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.202 MeV',
      halfLife: '8.02 days',
      decayConstant: '0.0864 day⁻¹',
      gammaConstant: '0.22 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         decayConstant: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      specificActivity: '4.6 x 10^15 Bq/g',
      parent: 'Tellurium-131',
      daughter: 'Xenon-131 (stable)',
      commonUses: ['Diagnosis and treatment of thyroid cancer and hyperthyroidism', 'Medical imaging (diagnostic tracer)'],
      category: 'Medical',
      commonality: 'Common',
      commonalityReason: 'A key radioisotope for the diagnosis and, at higher activities, the treatment of thyroid conditions.',
      sourceRef: {
         halfLife: 'nndc',
         decayConstant: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 3,
         A2: 0.7,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 30,
            inhalation_D: 50
         },
         DAC: {
            inhalation_D: 2e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.89e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'sr_90',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iridium-192',
      symbol: 'Ir-192',
      emissionType: ['Beta-minus', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['0.672 MeV (max)'],
         gamma: ['0.317 MeV', '0.468 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.224 MeV',
      halfLife: '73.83 days',
      decayConstant: '0.00939 day⁻¹',
      gammaConstant: '0.48 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dValue: 0.08,
      specificActivity: '3.41 x 10^14 Bq/g',
      parent: 'Iridium-191 (n,γ)',
      daughter: 'Platinum-192 (stable) / Osmium-192 (stable)',
      commonUses: ['High-dose-rate (HDR) brachytherapy', 'Industrial gamma radiography'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A primary source for industrial radiography and high-dose-rate (HDR) brachytherapy cancer treatment.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 1,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 900,
            inhalation_D: 300,
            inhalation_W: 400,
            inhalation_Y: 200
         },
         DAC: {
            inhalation_D: 1e-7,
            inhalation_W: 2e-7,
            inhalation_Y: 9e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.1e-9,
            inhalation_W: 4.88e-9,
            inhalation_Y: 7.61e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iron-52',
      symbol: 'Fe-52',
      emissionType: ['Positron Emission', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['0.804 MeV (max)'],
         gamma: ['0.169 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.268 MeV',
      halfLife: '8.275 hours',
      decayConstant: '0.0838 hour⁻¹',
      specificActivity: '1.2 x 10^17 Bq/g',
      parent: 'Manganese-52m',
      daughter: 'Manganese-52',
      commonUses: ['PET imaging research (bone marrow imaging, iron metabolism)'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A short-lived PET isotope used in specialized research to study iron metabolism and bone marrow.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.3,
         A2: 0.3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 900,
            inhalation_D: 3000,
            inhalation_W: 2000
         },
         DAC: {
            inhalation_D: 1e-6,
            inhalation_W: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.13e-10,
            inhalation_W: 5.92e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iron-55',
      symbol: 'Fe-55',
      emissionType: ['Electron Capture', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.0059 MeV (X-ray)'],
         alpha: []
      },
      halfLife: '2.73 years',
      decayConstant: '0.254 year⁻¹',
      specificActivity: '8.4 x 10^13 Bq/g',
      parent: 'Manganese-55 (p,n)',
      daughter: 'Manganese-55 (stable)',
      commonUses: ['X-ray fluorescence sources', 'Electron capture detectors', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'Used as a low-energy X-ray source for analytical techniques like X-ray fluorescence.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 40,
         unit: 'TBq'
      },
      dValue: 800,
      dosimetry: {
         ALI: {
            ingestion: 9000,
            inhalation_D: 2000,
            inhalation_W: 4000
         },
         DAC: {
            inhalation_D: 8e-7,
            inhalation_W: 2e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 7.26e-10,
            inhalation_W: 3.61e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Iron-59',
      symbol: 'Fe-59',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.475 MeV (max)'],
         gamma: ['1.099 MeV', '1.292 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.158 MeV',
      halfLife: '44.5 days',
      decayConstant: '0.0156 day⁻¹',
      specificActivity: '1.87 x 10^15 Bq/g',
      parent: 'Iron-58 (n,γ)',
      daughter: 'Cobalt-59 (stable)',
      commonUses: ['Red blood cell studies', 'Iron metabolism research', 'Industrial tracers'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A gamma-emitting tracer used in medical research to study iron metabolism and red blood cells.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.9,
         A2: 0.9,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 800,
            inhalation_D: 300,
            inhalation_W: 500
         },
         DAC: {
            inhalation_D: 1e-7,
            inhalation_W: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 4.00e-9,
            inhalation_W: 3.30e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Krypton-79',
      symbol: 'Kr-79',
      emissionType: ['Positron Emission', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['0.604 MeV (max)'],
         gamma: ['0.261 MeV', '0.398 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.201 MeV',
      halfLife: '35.04 hours',
      decayConstant: '0.0198 hour⁻¹',
      specificActivity: '1.7 x 10^16 Bq/g',
      parent: 'Bromine-79',
      daughter: 'Bromine-79 (stable)',
      commonUses: ['Lung ventilation studies (PET)', 'Research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used in medical research, particularly for PET-based lung ventilation studies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 4,
         A2: 2,
         unit: 'TBq'
      },
      dosimetry: {
         DAC: {
            inhalation: 2e-5
         }, // Submersion
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Krypton-81m',
      symbol: 'Kr-81m',
      emissionType: ['Gamma', 'Isomeric Transition'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.190 MeV'],
         alpha: []
      },
      halfLife: '13.1 seconds',
      decayConstant: '0.0529 s⁻¹',
      specificActivity: '4.85 x 10^18 Bq/g',
      parent: 'Rubidium-81',
      daughter: 'Krypton-81',
      commonUses: ['Lung ventilation studies (very short half-life allows for repeated scans)'],
      category: 'Medical',
      commonality: 'Common',
      commonalityReason: 'A very short-lived gas used for lung ventilation scans, typically produced from a Rb-81 generator.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 40,
         unit: 'TBq'
      },
      dosimetry: {
         DAC: {
            inhalation: 7e-4
         }, // Submersion
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Krypton-85',
      symbol: 'Kr-85',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.687 MeV (max)'],
         gamma: ['0.514 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.229 MeV',
      halfLife: '10.76 years',
      decayConstant: '0.0644 year⁻¹',
      specificActivity: '1.45 x 10^13 Bq/g',
      parent: 'Uranium Fission',
      daughter: 'Rubidium-85 (stable)',
      commonUses: ['Atmospheric tracer', 'Industrial applications (leak detection, gauging)'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A fission product gas used in industrial applications like leak detection and thickness gauging.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 10,
         unit: 'TBq'
      },
      dValue: 30,
      dosimetry: {
         DAC: {
            inhalation: 1e-4
         }, // Submersion
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Lanthanum-140',
      symbol: 'La-140',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.68 MeV (max)'],
         gamma: ['1.596 MeV', '0.816 MeV', '0.487 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.560 MeV',
      halfLife: '1.678 days',
      decayConstant: '0.413 day⁻¹',
      specificActivity: '2.07 x 10^16 Bq/g',
      parent: 'Barium-140',
      daughter: 'Cerium-140 (stable)',
      commonUses: ['Fission product', 'Research tracer'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A short-lived fission product used as a tracer in research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.4,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 600,
            inhalation_D: 1000,
            inhalation_W: 1000
         },
         DAC: {
            inhalation_D: 6e-7,
            inhalation_W: 5e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 9.33e-10,
            inhalation_W: 1.31e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Lead-206',
      symbol: 'Pb-206',
      emissionType: ['Stable'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      parent: 'Polonium-210',
      daughter: 'Stable',
      commonUses: ['Final stable product of U-238 decay series', 'Geological dating'],
      category: 'Stable/Reference',
      commonality: 'N/A',
      commonalityReason: 'This is a stable isotope and not radioactive.',
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Lead-207',
      symbol: 'Pb-207',
      emissionType: ['Stable'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      parent: 'Polonium-211',
      daughter: 'Stable',
      commonUses: ['Final stable product of U-235 decay series', 'Geological dating'],
      category: 'Stable/Reference',
      commonality: 'N/A',
      commonalityReason: 'This is a stable isotope and not radioactive.',
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Lead-208',
      symbol: 'Pb-208',
      emissionType: ['Stable'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      parent: 'Thallium-208',
      daughter: 'Stable',
      commonUses: ['Final stable product of Th-232 decay series', 'Geological dating'],
      category: 'Stable/Reference',
      commonality: 'N/A',
      commonalityReason: 'This is a stable isotope and not radioactive.',
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Lead-210',
      symbol: 'Pb-210',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.063 MeV (max)'],
         gamma: ['0.0465 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.021 MeV',
      daughterEmissions: {
         from: 'Bi-210',
         beta: ['1.16 MeV (max)']
      },
      halfLife: '22.23 years',
      decayConstant: '0.0312 year⁻¹',
      specificActivity: '2.8 x 10^12 Bq/g',
      parent: 'Polonium-214 (α)',
      daughter: 'Bismuth-210 (β-)',
      commonUses: ['Environmental tracers', 'Dating sediments and ice cores', 'Bone dosimetry'],
      category: 'Natural',
      commonality: 'Common',
      commonalityReason: 'A naturally occurring radionuclide from the U-238 series, widely used for dating recent sediments and ice cores.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 0.05,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.6,
            inhalation_D: 0.2
         },
         DAC: {
            inhalation_D: 1e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.67e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Lead-211',
      emissionType: ['Beta-minus', 'Gamma'],
      symbol: 'Pb-211',
      emissionEnergies: {
         beta: ['1.36 MeV (max)'],
         gamma: ['0.405 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.453 MeV',
      halfLife: '36.1 minutes',
      decayConstant: '0.0192 min⁻¹',
      specificActivity: '2.0 x 10^17 Bq/g',
      parent: 'Polonium-215',
      daughter: 'Bismuth-211 (β-)',
      commonUses: ['Intermediate in Actinium-227 decay series'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A very short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      dosimetry: {
         ALI: {
            ingestion: 10000,
            inhalation_D: 600,
         },
         DAC: {
            inhalation_D: 3e-7,
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.35e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Lead-212',
      symbol: 'Pb-212',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.570 MeV (max)'],
         gamma: ['0.238 MeV', '0.300 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.190 MeV',
      daughterEmissions: {
         from: 'Bi-212',
         beta: ['2.25 MeV (max)'],
         alpha: ['6.09 MeV'],
         gamma: ['0.727 MeV', '1.621 MeV']
      },
      halfLife: '10.64 hours',
      decayConstant: '0.0651 hour⁻¹',
      specificActivity: '6.9 x 10^16 Bq/g',
      parent: 'Polonium-216 (α)',
      daughter: 'Bismuth-212 (β-)',
      commonUses: ['Intermediate in Thorium-232 decay series', 'Research'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A key intermediate in the Th-232 decay chain with a relatively long half-life compared to its daughters.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.7,
         A2: 0.2,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 80,
            inhalation_D: 30
         },
         DAC: {
            inhalation_D: 1e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 4.56e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Lead-214',
      symbol: 'Pb-214',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.02 MeV (max)'],
         gamma: ['0.295 MeV', '0.352 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.340 MeV',
      halfLife: '26.8 minutes',
      decayConstant: '0.0259 min⁻¹',
      specificActivity: '2.7 x 10^17 Bq/g',
      parent: 'Polonium-218 (α)',
      daughter: 'Bismuth-214 (β-)',
      commonUses: ['Intermediate in Radon-222 decay chain', 'Environmental monitoring'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A prominent gamma-emitter in the Radon-222 decay chain, contributing to natural background radiation.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      dosimetry: {
         ALI: {
            ingestion: 9000,
            inhalation_D: 800
         },
         DAC: {
            inhalation_D: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.11e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Lutetium-176',
      symbol: 'Lu-176',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.593 MeV (max)'],
         gamma: ['0.202 MeV', '0.307 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.198 MeV',
      halfLife: '37800000000 years',
      decayConstant: '1.83 x 10⁻¹¹ year⁻¹',
      specificActivity: '2.0 x 10^6 Bq/g',
      parent: 'Primordial',
      daughter: 'Hafnium-176 (stable)',
      commonUses: ['Lutetium-Hafnium dating (geological)', 'Research'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A very long-lived primordial nuclide used for geological dating.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      dosimetry: {
         ALI: {
            ingestion: 700,
            inhalation_W: 10,
            inhalation_Y: 8
         },
         DAC: {
            inhalation_W: 2e-9,
            inhalation_Y: 3e-9
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.36e-7,
            inhalation_Y: 1.79e-7
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Lutetium-177',
      symbol: 'Lu-177',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.498 MeV (max)'],
         gamma: ['0.113 MeV', '0.208 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.166 MeV',
      halfLife: '6.647 days',
      decayConstant: '0.104 day⁻¹',
      specificActivity: '3.9 x 10^14 Bq/g',
      parent: 'Ytterbium-176 (n,γ)',
      daughter: 'Hafnium-177 (stable)',
      commonUses: ['Peptide receptor radionuclide therapy (PRRT) for neuroendocrine tumors'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A highly effective and increasingly common therapeutic isotope for treating neuroendocrine tumors (PRRT).',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 30,
         A2: 0.7,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 2000,
            inhalation_Y: 2000
         },
         DAC: {
            inhalation_W: 9e-7,
            inhalation_Y: 9e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 6.63e-10,
            inhalation_Y: 6.63e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Manganese-54',
      symbol: 'Mn-54',
      emissionType: ['Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.835 MeV'],
         alpha: []
      },
      halfLife: '312.1 days',
      decayConstant: '0.00222 day⁻¹',
      gammaConstant: '0.51134 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      specificActivity: '2.56 x 10^14 Bq/g',
      parent: 'Iron-54 (d,2n)',
      daughter: 'Chromium-54 (stable)',
      commonUses: ['Calibration sources', 'Environmental tracer'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A common activation product used as a calibration source and environmental tracer.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 1,
         A2: 1,
         unit: 'TBq'
      },
      dValue: 1,
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 900,
            inhalation_W: 800
         },
         DAC: {
            inhalation_D: 4e-7,
            inhalation_W: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.42e-10,
            inhalation_W: 1.81e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Molybdenum-99',
      symbol: 'Mo-99',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.214 MeV (max)'],
         gamma: ['0.739 MeV', '0.181 MeV', '0.778 MeV'], // Added 778
         alpha: []
      },
      avgBetaEnergy: '0.405 MeV',
      daughterEmissions: {
         from: 'Tc-99m',
         gamma: ['0.1405 MeV']
      },
      halfLife: '65.94 hours',
      decayConstant: '0.0105 hour⁻¹',
      specificActivity: '1.77 x 10^16 Bq/g',
      parent: 'Uranium-235 Fission',
      daughter: 'Technetium-99m',
      branchingFraction: 0.875,
      commonUses: ['Generator for Technetium-99m, the most widely used medical radioisotope.'],
      category: 'Medical',
      commonality: 'Common',
      commonalityReason: 'The parent isotope used in generators to produce Tc-99m, making it essential to nuclear medicine.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 0.6,
         unit: 'TBq'
      },
      gammaConstant: '0.18 R·m²/hr·Ci', // CORRECTED from 0.11 (Source: Unger & Trubey)
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 3000,
            inhalation_Y: 1000
         },
         DAC: {
            inhalation_D: 1e-6,
            inhalation_Y: 6e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.42e-10,
            inhalation_Y: 1.07e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Neptunium-237',
      symbol: 'Np-237',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.788 MeV'],
         beta: [],
         gamma: ['0.029 MeV', '0.086 MeV']
      },
      halfLife: '2.144 million years',
      decayConstant: '3.23 x 10⁻⁷ year⁻¹',
      specificActivity: '2.6 x 10^7 Bq/g',
      parent: 'Americium-241 (α)',
      daughter: 'Protactinium-233 (α)',
      commonUses: ['Intermediate in Neptunium series decay', 'Nuclear waste studies'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived transuranic isotope that is a major consideration in nuclear waste management.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 20,
         A2: 0.002,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.5,
            inhalation_W: 0.004
         },
         DAC: {
            inhalation_W: 2e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.46e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Nickel-56',
      symbol: 'Ni-56',
      emissionType: ['Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.158 MeV', '0.812 MeV'],
         alpha: []
      },
      halfLife: '6.075 days',
      decayConstant: '0.114 day⁻¹',
      specificActivity: '1.38 x 10^16 Bq/g',
      parent: 'Zinc-56',
      daughter: 'Cobalt-56',
      commonUses: ['Supernova studies (astrophysics)', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A short-lived isotope primarily of interest in astrophysical research related to supernovae.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      dosimetry: {
         ALI: {
            ingestion: 1000,
            inhalation_D: 2000,
            inhalation_W: 1000,
            inhalation_Vapor: 1000
         },
         DAC: {
            inhalation_D: 8e-7,
            inhalation_W: 5e-7,
            inhalation_Vapor: 5e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 7.11e-10,
            inhalation_W: 1.09e-10,
            inhalation_Vapor: 1.12e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Nickel-59',
      symbol: 'Ni-59',
      emissionType: ['Electron Capture', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: '76,000 years',
      decayConstant: '9.12 x 10⁻⁶ year⁻¹',
      specificActivity: '1.03 x 10^9 Bq/g',
      parent: 'Copper-59',
      daughter: 'Cobalt-59 (stable)',
      commonUses: ['Neutron activation product (long-lived)', 'Geological dating (historical)', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A very long-lived activation product relevant in nuclear reactor decommissioning.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 'unlimited',
         A2: 'unlimited',
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 20000,
            inhalation_D: 4000,
            inhalation_W: 7000,
            inhalation_Vapor: 2000
         },
         DAC: {
            inhalation_D: 2e-6,
            inhalation_W: 3e-6,
            inhalation_Vapor: 8e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.58e-10,
            inhalation_W: 2.48e-10,
            inhalation_Vapor: 7.31e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Nickel-63',
      symbol: 'Ni-63',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.0669 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.022 MeV',
      halfLife: '100.1 years',
      decayConstant: '0.00692 year⁻¹',
      specificActivity: '2.14 x 10^12 Bq/g',
      parent: 'Nickel-62 (n,γ)',
      daughter: 'Copper-63 (stable)',
      commonUses: ['Electron capture detectors (gas chromatography)', 'Beta-voltaic batteries'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A long-lived, low-energy beta emitter used in electron capture detectors for gas chromatographs.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 30,
         unit: 'TBq'
      },
      dValue: 60,
      dosimetry: {
         ALI: {
            ingestion: 9000,
            inhalation_D: 2000,
            inhalation_W: 3000,
            inhalation_Vapor: 800
         },
         DAC: {
            inhalation_D: 7e-7,
            inhalation_W: 1e-6,
            inhalation_Vapor: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.39e-10,
            inhalation_W: 6.22e-10,
            inhalation_Vapor: 1.70e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_low_risk'
   },
   {
      name: 'Niobium-95',
      symbol: 'Nb-95',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.160 MeV (max)'],
         gamma: ['0.766 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.053 MeV',
      halfLife: '34.99 days',
      decayConstant: '0.0198 day⁻¹',
      specificActivity: '1.6 x 10^15 Bq/g',
      parent: 'Zirconium-95',
      daughter: 'Molybdenum-95 (stable)',
      commonUses: ['Fission product', 'Environmental tracer (daughter of Zr-95)'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A fission product usually found in equilibrium with its parent, Zr-95.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 1,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 1000,
            inhalation_Y: 1000
         },
         DAC: {
            inhalation_W: 5e-7,
            inhalation_Y: 5e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.29e-9,
            inhalation_Y: 1.57e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Nitrogen-13',
      symbol: 'N-13',
      emissionType: ['Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['1.20 MeV (max)'],
         gamma: ['0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.400 MeV',
      halfLife: '9.97 minutes',
      decayConstant: '0.0695 min⁻¹',
      specificActivity: '3.7 x 10^18 Bq/g',
      parent: 'Carbon-13 (p,n)',
      daughter: 'Carbon-13 (stable)',
      commonUses: ['Cardiac PET imaging for myocardial perfusion and viability'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A PET isotope with a very short half-life, requiring an on-site cyclotron for production.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.9,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         DAC: {
            inhalation: 4e-6 // Submersion
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Nitrogen-14',
      symbol: 'N-14',
      emissionType: ['Stable'],
      emissionEnergies: {
         alpha: [],
         beta: [],
         gamma: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      specificActivity: '0 Bq/g',
      parent: 'Carbon-14 (β-)',
      daughter: 'Stable',
      commonUses: ['Most abundant stable isotope of nitrogen', 'NMR spectroscopy', 'Target material for producing Carbon-14'],
      category: 'Stable/Reference',
      commonality: 'Common',
      commonalityReason: 'The most abundant stable isotope of nitrogen and the stable daughter of Carbon-14.',
      sourceRef: {},
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Oxygen-15',
      symbol: 'O-15',
      emissionType: ['Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['1.73 MeV (max)'],
         gamma: ['0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.577 MeV',
      halfLife: '122.2 seconds',
      decayConstant: '0.00567 s⁻¹',
      specificActivity: '3.3 x 10^18 Bq/g',
      parent: 'Nitrogen-15 (p,n)',
      daughter: 'Nitrogen-15 (stable)',
      commonUses: ['Brain blood flow', 'Oxygen metabolism PET imaging'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A PET isotope with a very short half-life, requiring an on-site cyclotron for production.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      dosimetry: {
         DAC: {
            inhalation: 4e-6 // Submersion
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Palladium-103',
      symbol: 'Pd-103',
      emissionType: ['Electron Capture', 'X-ray', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: '16.99 days',
      decayConstant: '0.0408 day⁻¹',
      specificActivity: '3.5 x 10^15 Bq/g',
      parent: 'Rhodium-103 (p,n)',
      daughter: 'Rhodium-103 (stable)',
      commonUses: ['Brachytherapy (prostate cancer)'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A key isotope, along with I-125, used in permanent brachytherapy seeds for prostate cancer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 40,
         unit: 'TBq'
      },
      dValue: 90,
      dosimetry: {
         ALI: {
            ingestion: 6000,
            inhalation_D: 6000,
            inhalation_W: 4000,
            inhalation_Y: 4000
         },
         DAC: {
            inhalation_D: 3e-6,
            inhalation_W: 2e-6,
            inhalation_Y: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.34e-10,
            inhalation_W: 3.76e-10,
            inhalation_Y: 4.24e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Phosphorus-32',
      symbol: 'P-32',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['1.710 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.695 MeV',
      halfLife: '14.26 days',
      decayConstant: '0.0486 day⁻¹',
      specificActivity: '1.07 x 10^16 Bq/g',
      parent: 'Sulfur-32 (n,p)',
      daughter: 'Sulfur-32 (stable)',
      commonUses: ['Molecular biology (DNA/RNA labeling)', 'Radiotherapy for polycythemia vera', 'Agricultural research'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A high-energy pure beta-emitter widely used in molecular biology labs and for some therapies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      dValue: 10,
      dosimetry: {
         ALI: {
            ingestion: 600,
            inhalation_D: 900,
            inhalation_W: 400
         },
         DAC: {
            inhalation_D: 4e-7,
            inhalation_W: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.64e-9,
            inhalation_W: 4.19e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Plutonium-238',
      symbol: 'Pu-238',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.499 MeV'],
         gamma: ['0.043 MeV'],
         beta: []
      },
      halfLife: '87.7 years',
      decayConstant: '0.00790 year⁻¹',
      specificActivity: '6.34 x 10^11 Bq/g',
      parent: 'Neptunium-237 (n,γ) -> Np-238 (β-)',
      daughter: 'Uranium-234',
      commonUses: ['Radioisotope thermoelectric generators (RTGs) for spacecraft and pacemakers'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'The primary power source for RTGs used in deep space missions and other remote applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.001,
         unit: 'TBq'
      },
      dValue: 0.06,
      dosimetry: {
         ALI: {
            ingestion: 0.9,
            inhalation_W: 0.007,
            inhalation_Y: 0.02
         },
         DAC: {
            inhalation_W: 3e-12,
            inhalation_Y: 8e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.06e-4,
            inhalation_Y: 7.79e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Plutonium-239',
      symbol: 'Pu-239',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.157 MeV (73.3%)', '5.144 MeV (15.1%)'],
         beta: [],
         gamma: ['0.0516 MeV']
      },
      halfLife: '24,110 years',
      decayConstant: '2.87 x 10⁻⁵ year⁻¹',
      specificActivity: '2.3 x 10^9 Bq/g',
      parent: 'Uranium-238 (n,γ) -> ... -> Np-239 (β-)',
      daughter: 'Uranium-235 (α)',
      commonUses: ['Nuclear weapons', 'Nuclear fuel (MOX fuel)'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A primary fissile material used in nuclear weapons and as a component of MOX fuel.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.001,
         unit: 'TBq'
      },
      dValue: 0.06,
      dosimetry: {
         ALI: {
            ingestion: 0.8,
            inhalation_W: 0.006,
            inhalation_Y: 0.02
         },
         DAC: {
            inhalation_W: 3e-12,
            inhalation_Y: 7e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.16e-4,
            inhalation_Y: 8.33e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },

   {
      name: 'Polonium-208',
      symbol: 'Po-208',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.115 MeV'],
         beta: [],
         gamma: ['0.134 MeV']
      },
      halfLife: '2.898 years',
      decayConstant: '0.239 year⁻¹',
      specificActivity: '1.6 x 10^13 Bq/g',
      parent: 'Bismuth-209 (p,2n)',
      daughter: 'Lead-204 (stable)',
      commonUses: ['Alpha calibration', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A synthetic alpha-emitter used for specialized research and calibration.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      dosimetry: {
         ALI: {
            ingestion: 3,
            inhalation_D: 0.6,
            inhalation_W: 0.6
         },
         DAC: {
            inhalation_D: 3e-10,
            inhalation_W: 3e-10
         },
         DCF: {},
         sourceRef: '10CFR20 (Po-210 Proxy)'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Polonium-210',
      symbol: 'Po-210',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['5.304 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '138.376 days',
      decayConstant: '0.00501 day⁻¹',
      specificActivity: '1.66 x 10^14 Bq/g',
      parent: 'Bismuth-210 (β-)',
      daughter: 'Lead-206 (stable)',
      commonUses: ['Antistatic devices', 'Neutron sources', 'Research (alpha spectroscopy)'],
      category: 'Natural',
      commonality: 'Common',
      commonalityReason: 'A naturally occurring alpha-emitter (from Radon decay) used commercially in antistatic devices.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 0.02,
         unit: 'TBq'
      },
      dValue: 0.06,
      dosimetry: {
         ALI: {
            ingestion: 3,
            inhalation_D: 0.6,
            inhalation_W: 0.6
         },
         DAC: {
            inhalation_D: 3e-10,
            inhalation_W: 3e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.54e-6,
            inhalation_W: 2.32e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Polonium-211',
      symbol: 'Po-211',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['7.45 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '0.516 seconds',
      decayConstant: '1.34 s⁻¹',
      specificActivity: '1.4 x 10^20 Bq/g',
      parent: 'Bismuth-211',
      daughter: 'Lead-207 (stable)',
      commonUses: ['Fastest alpha emitter in natural series', 'Research'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.1,
            inhalation_W: 0.002
         },
         DAC: {
            inhalation_W: 1e-13
         },
         sourceRef: '10CFR20 (Default Alpha)'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Polonium-212',
      symbol: 'Po-212',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['8.785 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '0.299 microseconds',
      decayConstant: '2.32 x 10⁶ s⁻¹',
      specificActivity: '6.58 x 10^27 Bq/g',
      parent: 'Bismuth-212 (β-)',
      daughter: 'Lead-208 (stable)',
      commonUses: ['Fastest alpha emitter in natural series', 'Research'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Polonium-214',
      symbol: 'Po-214',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['7.687 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '164.3 microseconds',
      decayConstant: '4218 s⁻¹',
      specificActivity: '4.4 x 10^21 Bq/g',
      parent: 'Bismuth-214',
      daughter: 'Lead-210 (α)',
      commonUses: ['Very short-lived intermediate in U-238 decay chain'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Polonium-215',
      symbol: 'Po-215',
      emissionType: ['Alpha', 'Beta-minus'],
      emissionEnergies: {
         alpha: ['7.386 MeV'],
         beta: ['0.71 MeV (max)'],
         gamma: []
      },
      avgBetaEnergy: '0.237 MeV',
      halfLife: '1.781 milliseconds',
      decayConstant: '389 s⁻¹',
      specificActivity: '2.5 x 10^21 Bq/g',
      parent: 'Radon-219',
      daughter: 'Lead-211 (α) or Astatine-215 (β-)',
      commonUses: ['Very short-lived intermediate in U-235 decay chain'],
      category: 'Natural',
      decaySeriesId: 'U-235-series',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Polonium-216',
      symbol: 'Po-216',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['6.778 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '0.145 seconds',
      decayConstant: '4.78 s⁻¹',
      specificActivity: '1.6 x 10^20 Bq/g',
      parent: 'Radon-220',
      daughter: 'Lead-212 (α)',
      commonUses: ['Very short-lived intermediate in Th-232 chain'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Polonium-218',
      emissionType: ['Alpha'],
      symbol: 'Po-218',
      emissionEnergies: {
         alpha: ['6.002 MeV'],
         beta: []
      },
      avgBetaEnergy: '0.087 MeV',
      halfLife: '3.10 minutes',
      decayConstant: '0.224 min⁻¹',
      specificActivity: '2.3 x 10^18 Bq/g',
      parent: 'Radon-222',
      daughter: 'Lead-214 (α) or Astatine-218 (β-)',
      commonUses: ['Intermediate in U-238 decay chain'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A very short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Potassium-40',
      symbol: 'K-40',
      emissionType: ['Beta-minus', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['1.311 MeV (max)'],
         gamma: ['1.461 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.437 MeV',
      halfLife: '1.251 billion years',
      decayConstant: '5.54 x 10⁻¹⁰ year⁻¹',
      specificActivity: '2.6 x 10^5 Bq/g',
      parent: 'Primordial',
      daughter: 'Calcium-40 (β-) or Argon-40 (EC)',
      commonUses: ['Potassium-argon dating', 'Internal human radiation dose', 'Environmental monitoring'],
      category: 'Natural',
      commonality: 'Common',
      commonalityReason: 'A naturally occurring isotope found in soil, food (like bananas), and is a primary source of natural internal radiation dose in humans.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.9,
         A2: 0.9,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 300,
            inhalation_D: 400
         },
         DAC: {
            inhalation_D: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.34e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Praseodymium-144',
      symbol: 'Pr-144',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['2.997 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.999 MeV',
      halfLife: '17.28 minutes',
      decayConstant: '0.0401 min⁻¹',
      specificActivity: '1.96 x 10^17 Bq/g',
      parent: 'Cerium-144',
      daughter: 'Neodymium-144 (stable)',
      commonUses: ['High-energy beta source (daughter of Ce-144)'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A very short-lived daughter of Ce-144, notable for its high-energy beta emission.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      dosimetry: {
         ALI: {
            ingestion: 30000,
            inhalation_W: 100000,
            inhalation_Y: 100000
         },
         DAC: {
            inhalation_W: 5e-5,
            inhalation_Y: 5e-5
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.10e-11,
            inhalation_Y: 1.17e-11
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Promethium-147',
      symbol: 'Pm-147',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.224 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.075 MeV',
      halfLife: '2.623 years',
      decayConstant: '0.264 year⁻¹',
      specificActivity: '3.4 x 10^13 Bq/g',
      parent: 'Neodymium-147 (β-)',
      daughter: 'Samarium-147',
      commonUses: ['Atomic batteries (historical)', 'Luminous paints', 'Thickness gauges'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A fission product used in specialized applications like luminous paints and thickness gauges.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 2,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4000,
            inhalation_W: 100,
            inhalation_Y: 100
         },
         DAC: {
            inhalation_W: 5e-8,
            inhalation_Y: 6e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 6.97e-9,
            inhalation_Y: 1.06e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Protactinium-231',
      symbol: 'Pa-231',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.059 MeV'],
         beta: [],
         gamma: ['0.302 MeV', '0.283 MeV']
      },
      halfLife: '32,760 years',
      decayConstant: '2.11 x 10⁻⁵ year⁻¹',
      specificActivity: '1.75 x 10^9 Bq/g',
      parent: 'Thorium-231 (β-)',
      daughter: 'Actinium-227 (α)',
      commonUses: ['Intermediate in Actinium-227 decay series', 'Geological research'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A long-lived member of the U-235 decay series, used in geological dating.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 4,
         A2: 0.0004,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.2,
            inhalation_W: 0.002, // Bone surface
            inhalation_Y: 0.004
         },
         DAC: {
            inhalation_W: 6e-13,
            inhalation_Y: 2e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 3.47e-4,
            inhalation_Y: 2.32e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Protactinium-233',
      symbol: 'Pa-233',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.571 MeV (max)'],
         gamma: ['0.312 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.190 MeV',
      halfLife: '27.0 days',
      decayConstant: '0.0257 day⁻¹',
      specificActivity: '7.5 x 10^14 Bq/g',
      parent: 'Thorium-233 (β)',
      daughter: 'Uranium-233',
      commonUses: ['Intermediate in Th-232 to U-233 fuel cycle', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'An important intermediate in the process of breeding U-233 fuel from Thorium-232.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 5,
         A2: 0.7,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 1000,
            inhalation_W: 700,
            inhalation_Y: 600
         },
         DAC: {
            inhalation_W: 3e-7,
            inhalation_Y: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.24e-9,
            inhalation_Y: 2.58e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Protactinium-234m',
      symbol: 'Pa-234m',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['2.29 MeV (max)'],
         gamma: ['1.001 MeV', '0.766 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.763 MeV',
      halfLife: '1.17 minutes',
      decayConstant: '0.592 min⁻¹',
      specificActivity: '1.7 x 10^19 Bq/g',
      parent: 'Thorium-234',
      daughter: 'Uranium-234 (β-)',
      commonUses: ['Intermediate in U-238 decay chain'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A very short-lived but commonly present intermediate in the U-238 decay series.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 8000,
            inhalation_Y: 7000
         },
         DAC: {
            inhalation_W: 3e-6,
            inhalation_Y: 3e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Radium-220',
      symbol: 'Ra-220',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['6.818 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '27.4 seconds',
      decayConstant: '0.0253 s⁻¹',
      specificActivity: '1.8 x 10^18 Bq/g',
      parent: 'Thorium-224',
      daughter: 'Radon-216 (α)',
      commonUses: ['Intermediate in Thorium-232 decay series'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Radium-223',
      symbol: 'Ra-223',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.71 MeV (dominant)'],
         beta: [],
         gamma: ['0.269 MeV']
      },
      halfLife: '11.43 days',
      decayConstant: '0.0606 day⁻¹',
      specificActivity: '1.9 x 10^15 Bq/g',
      parent: 'Thorium-227',
      daughter: 'Radon-219 (α)',
      commonUses: ['Alpha-emitter for targeted alpha therapy (e.g., Xofigo for prostate cancer)'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A clinically approved alpha-emitter for treating bone metastases from prostate cancer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.07,
      shipping: {
         A1: 0.4,
         A2: 0.007,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 5, // Bone 9
            inhalation_W: 0.7
         },
         DAC: {
            inhalation_W: 3e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.12e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'sr_90',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Radium-224',
      symbol: 'Ra-224',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.685 MeV'],
         beta: [],
         gamma: ['0.241 MeV']
      },
      daughterEmissions: {
         from: 'Rn-220',
         alpha: ['6.288 MeV']
      },
      halfLife: '3.66 days',
      decayConstant: '0.189 day⁻¹',
      specificActivity: '5.9 x 10^15 Bq/g',
      parent: 'Thorium-228',
      daughter: 'Radon-220 (α)',
      commonUses: ['Intermediate in Thorium-232 decay series'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A short-lived alpha-emitter in the Th-232 decay series.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.4,
         A2: 0.02,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 8,
            inhalation_W: 2
         },
         DAC: {
            inhalation_W: 7e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 8.53e-7
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'sr_90',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Radium-226 in Equilibrium',
      symbol: 'Ra-226 eq',
      emissionType: ['Alpha', 'Beta-minus', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.784 MeV (Ra-226)'],
         beta: ['3.27 MeV (Bi-214 max)'],
         gamma: ['0.186 MeV (Ra-226)', '0.609 MeV (Bi-214)', '1.764 MeV (Bi-214)']
      },
      halfLife: '1600 years',
      decayConstant: '4.33 x 10⁻⁴ year⁻¹',
      gammaConstant: '0.825 R·m²/hr·Ci',
      specificActivity: '3.7 x 10^10 Bq/g',
      parent: 'Thorium-230',
      daughter: 'Radon-222 (α)',
      commonUses: ['Sealed brachytherapy sources', 'Calibration sources (aged >30 days)', 'Industrial radiography (historical)'],
      category: 'Natural',
      decaySeriesId: 'U-238-series',
      commonality: 'Common',
      commonalityReason: 'Represents an aged Ra-226 source where gamma-emitting daughters contribute significantly to the dose rate.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 0.2,
         A2: 0.003,
         unit: 'TBq'
      },
      dValue: 0.04,
      dosimetry: {
         ALI: {
            inhalation_W: 0.6,
            ingestion: 2 // Bone surface 5
         },
         DAC: {
            inhalation_W: 3e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.32e-6 // Note: Values for pure Ra-226; equilibrium dose depends on daughter retention
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Radium-226',
      symbol: 'Ra-226',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.784 MeV'],
         beta: [],
         gamma: ['0.186 MeV']
      },
      daughterEmissions: {
         from: 'Rn-222',
         alpha: ['5.490 MeV']
      },
      halfLife: '1600 years',
      decayConstant: '4.33 x 10⁻⁴ year⁻¹',
      gammaConstant: '0.0121138 R·m²/hr·Ci',
      specificActivity: '3.7 x 10^10 Bq/g',
      parent: 'Thorium-230',
      daughter: 'Radon-222 (α)',
      commonUses: ['Freshly separated sources', 'Neutron sources (Ra-Be)', 'Luminescent paint (historical)'],
      category: 'Natural',
      decaySeriesId: 'U-238-series',
      commonality: 'Common',
      commonalityReason: 'Historically significant nuclide. This entry represents the nuclide without its gamma-emitting progeny.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      shipping: {
         A1: 0.2,
         A2: 0.003,
         unit: 'TBq'
      },
      dValue: 0.04,
      dosimetry: {
         ALI: {
            inhalation_W: 0.6,
            ingestion: 2 // Bone surface
         },
         DAC: {
            inhalation_W: 3e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.32e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Radium-228',
      symbol: 'Ra-228',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.039 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.013 MeV',
      daughterEmissions: {
         from: 'Ac-228',
         beta: ['2.14 MeV (max)'],
         gamma: ['0.911 MeV', '0.969 MeV']
      },
      halfLife: '5.75 years',
      decayConstant: '0.120 year⁻¹',
      specificActivity: '8.1 x 10^12 Bq/g',
      parent: 'Thorium-232',
      daughter: 'Actinium-228 (β-)',
      commonUses: ['Intermediate in Thorium-232 decay chain', 'Environmental monitoring'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'The first daughter of Th-232, often monitored in environmental samples.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.6,
         A2: 0.02,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2, // Bone surface 4
            inhalation_W: 1 // Bone surface 2
         },
         DAC: {
            inhalation_W: 5e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.29e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Radon-219',
      symbol: 'Rn-219',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['6.819 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '3.96 seconds',
      decayConstant: '0.175 s⁻¹',
      specificActivity: '1.14 x 10^19 Bq/g',
      parent: 'Radium-223',
      daughter: 'Polonium-215 (α)',
      commonUses: ['Intermediate in Actinium-227 decay series'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An extremely short-lived noble gas intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Radon-220',
      symbol: 'Rn-220',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['6.288 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '55.6 seconds',
      decayConstant: '0.0125 s⁻¹',
      specificActivity: '8.1 x 10^17 Bq/g',
      parent: 'Radium-224',
      daughter: 'Polonium-216 (α)',
      commonUses: ['Environmental monitoring (thoron gas)', 'Research'],
      category: 'Natural',
      commonality: 'Common',
      commonalityReason: 'A naturally occurring noble gas (also called Thoron) from the Th-232 decay series.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dosimetry: {
         DAC: {
            inhalation: 7e-6
         }, // With daughters removed
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Radon-221',
      symbol: 'Rn-221',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.19 MeV (max)'],
         gamma: ['0.078 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.397 MeV',
      halfLife: '25 minutes',
      decayConstant: '0.0277 min⁻¹',
      specificActivity: '1.8 x 10^17 Bq/g',
      parent: 'Radium-225',
      daughter: 'Francium-221',
      commonUses: ['Research (intermediate in artificial decay series)'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A short-lived intermediate in an artificial decay series with no practical applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Radon-222',
      symbol: 'Rn-222',
      emissionType: ['Alpha'],
      emissionEnergies: {
         alpha: ['5.490 MeV'],
         beta: [],
         gamma: []
      },
      halfLife: '3.823 days',
      decayConstant: '0.181 day⁻¹',
      specificActivity: '5.73 x 10^15 Bq/g',
      parent: 'Radium-226',
      daughter: 'Polonium-218 (α)',
      commonUses: ['Indoor air quality concern', 'Geological tracer', 'Research'],
      category: 'Natural',
      decaySeriesId: 'U-238-series',
      commonality: 'Common',
      commonalityReason: 'A naturally occurring noble gas from the U-238 series, well-known as an indoor air quality concern.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.3,
         A2: 0.004,
         unit: 'TBq'
      },
      dosimetry: {
         DAC: {
            inhalation: 3e-8 // With daughters present. Or 4e-6 (0.33 WL) with daughters removed.
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },

   {
      name: 'Rhenium-186',
      symbol: 'Re-186',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.07 MeV (max)'],
         gamma: ['0.137 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.357 MeV',
      halfLife: '3.718 days',
      decayConstant: '0.186 day⁻¹',
      gammaConstant: '0.0181633 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      parent: 'Tungsten-186 (n,γ)',
      daughter: 'Osmium-186 (stable)',
      commonUses: ['Radiotherapy for bone pain palliation'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A therapeutic isotope used for bone pain palliation in metastatic cancer.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 2,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            inhalation_W: 2000,
            ingestion: 2000,
            inhalation_D: 3000
         },
         DAC: {
            inhalation_W: 7e-7,
            inhalation_D: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.28e-10,
            inhalation_W: 8.64e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Rhenium-187',
      symbol: 'Re-187',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.0025 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.001 MeV',
      halfLife: '43300000000 years',
      decayConstant: '1.60 x 10⁻¹¹ year⁻¹',
      specificActivity: '1.63 x 10^6 Bq/g',
      parent: 'Primordial',
      daughter: 'Osmium-187 (stable)',
      commonUses: ['Rhenium-Osmium dating (geological)', 'Neutrino mass experiments'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A very long-lived primordial nuclide used for geological dating (Re-Os system).',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 'unlimited',
         A2: 'unlimited',
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 600000,
            inhalation_D: 800000,
            inhalation_W: 100000
         },
         DAC: {
            inhalation_D: 4e-4,
            inhalation_W: 4e-5
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.80e-12,
            inhalation_W: 1.47e-12
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_low_risk'
   },
   {
      name: 'Rhenium-188',
      symbol: 'Re-188',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['2.12 MeV (max)'],
         gamma: ['0.155 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.707 MeV',
      halfLife: '17.0 hours',
      decayConstant: '0.0408 hour⁻¹',
      specificActivity: '3.7 x 10^16 Bq/g',
      parent: 'Tungsten-188',
      daughter: 'Osmium-188 (stable)',
      commonUses: ['Radiotherapy (bone pain palliation, synovectomy, arterial brachytherapy)'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A high-energy beta emitter produced from a W-188 generator for various therapeutic applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.4,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            inhalation_W: 3000,
            ingestion: 2000,
            inhalation_D: 3000
         },
         DAC: {
            inhalation_D: 1e-6,
            inhalation_W: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 5.25e-10,
            inhalation_W: 5.44e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Rhodium-105',
      symbol: 'Rh-105',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.567 MeV (max)'],
         gamma: ['0.306 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.189 MeV',
      halfLife: '35.36 hours',
      decayConstant: '0.0196 hour⁻¹',
      specificActivity: '1.27 x 10^16 Bq/g',
      parent: 'Ruthenium-105',
      daughter: 'Palladium-105 (stable)',
      commonUses: ['Targeted radiotherapy research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A short-lived isotope used in targeted radiotherapy research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.8,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            inhalation_Y: 6000,
            ingestion: 4000,
            inhalation_D: 10000,
            inhalation_W: 6000
         },
         DAC: {
            inhalation_D: 5e-6,
            inhalation_W: 3e-6,
            inhalation_Y: 2e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.28e-10,
            inhalation_W: 2.37e-10,
            inhalation_Y: 2.58e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Rubidium-81',
      symbol: 'Rb-81',
      emissionType: ['Electron Capture', 'Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['1.05 MeV (max)'],
         gamma: ['0.446 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.350 MeV',
      daughterEmissions: {
         from: 'Kr-81m',
         gamma: ['0.190 MeV']
      },
      halfLife: '4.57 hours',
      decayConstant: '0.152 hour⁻¹',
      specificActivity: '1.3 x 10^17 Bq/g',
      parent: 'Strontium-81',
      daughter: 'Krypton-81m (IT) -> Krypton-81 (stable)',
      commonUses: ['Generator for Kr-81m (lung ventilation PET imaging)'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'The parent isotope used in generators to produce the short-lived gas Kr-81m for lung scans.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 2,
         A2: 0.8,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 40000,
            inhalation_D: 50000
         },
         DAC: {
            inhalation_D: 2e-5
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.51e-11
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Rubidium-82',
      symbol: 'Rb-82',
      emissionType: ['Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['3.38 MeV (max)'],
         gamma: ['0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '1.127 MeV',
      halfLife: '76 seconds',
      decayConstant: '0.00912 s⁻¹',
      specificActivity: '8.3 x 10^17 Bq/g',
      parent: 'Strontium-82',
      daughter: 'Krypton-82 (stable)',
      commonUses: ['Cardiac PET imaging for myocardial perfusion'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'An extremely short-lived PET isotope produced from a Sr-82 generator for cardiac perfusion imaging.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         // FGR 11 does not list Committed Dose DCFs for Rb-82 (submersion only).
         DAC: {
            inhalation_D: 1e-4 // Submersion approximation
         },
         sourceRef: '10CFR20 (Submersion/Default)'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Rubidium-84',
      symbol: 'Rb-84',
      emissionType: ['Positron Emission', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['1.65 MeV (max)'],
         gamma: ['0.882 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.550 MeV',
      halfLife: '32.8 days',
      decayConstant: '0.0211 day⁻¹',
      specificActivity: '1.74 x 10^15 Bq/g',
      parent: 'Krypton-84',
      daughter: 'Krypton-84 (stable)',
      commonUses: ['Cardiac blood flow research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A research isotope used in studies of cardiac blood flow.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 1,
         A2: 1,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 500,
            inhalation_D: 800
         },
         DAC: {
            inhalation_D: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.76e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Rubidium-86',
      symbol: 'Rb-86',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.77 MeV (max)'],
         gamma: ['1.077 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.590 MeV',
      halfLife: '18.66 days',
      decayConstant: '0.0371 day⁻¹',
      specificActivity: '4.2 x 10^15 Bq/g',
      parent: 'Krypton-86',
      daughter: 'Strontium-86 (stable)',
      commonUses: ['Cardiac blood flow research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A research isotope used in studies of cardiac blood flow.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 500,
            inhalation_D: 800
         },
         DAC: {
            inhalation_D: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.79e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Ruthenium-103',
      symbol: 'Ru-103',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.226 MeV (max)'],
         gamma: ['0.497 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.075 MeV',
      halfLife: '39.25 days',
      decayConstant: '0.0176 day⁻¹',
      specificActivity: '1.3 x 10^15 Bq/g',
      parent: 'Technetium-103',
      daughter: 'Rhodium-103 (stable)',
      commonUses: ['Fission product', 'Environmental tracer'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A fission product with limited use outside of specialized research applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 2,
         A2: 2,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 2000,
            inhalation_W: 1000,
            inhalation_Y: 600
         },
         DAC: {
            inhalation_D: 7e-7,
            inhalation_W: 4e-7,
            inhalation_Y: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.24e-10,
            inhalation_W: 1.75e-9,
            inhalation_Y: 2.42e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Samarium-153',
      symbol: 'Sm-153',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.808 MeV (max)'],
         gamma: ['0.103 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.269 MeV',
      halfLife: '46.28 hours',
      decayConstant: '0.0150 hour⁻¹',
      specificActivity: '3.5 x 10^15 Bq/g',
      parent: 'Samarium-152 (n,γ)',
      daughter: 'Europium-153 (stable)',
      commonUses: ['Palliative bone pain therapy (metastatic cancer)'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A clinically used therapeutic isotope for palliative treatment of bone pain from cancer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 9,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 3000
         },
         DAC: {
            inhalation_W: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 5.31e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Scandium-44',
      symbol: 'Sc-44',
      emissionType: ['Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['1.47 MeV (max)'],
         gamma: ['1.157 MeV', '0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.490 MeV',
      halfLife: '3.97 hours',
      decayConstant: '0.174 hour⁻¹',
      parent: 'Titanium-44 (EC)',
      daughter: 'Calcium-44 (stable)',
      commonUses: ['PET imaging', 'Theranostic pair with Sc-47'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A research PET isotope, often explored as a "theranostic" partner to the therapeutic isotope Sc-47.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4000,
            inhalation_Y: 10000
         },
         DAC: {
            inhalation_Y: 5e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_Y: 1.33e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Scandium-46',
      symbol: 'Sc-46',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.357 MeV (max)'],
         gamma: ['0.889 MeV', '1.121 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.119 MeV',
      halfLife: '83.79 days',
      decayConstant: '0.00827 day⁻¹',
      specificActivity: '1.24 x 10^15 Bq/g',
      parent: 'Calcium-46 (n,p)',
      daughter: 'Titanium-46 (stable)',
      commonUses: ['Tracer in hydrology and industrial processes', 'Calibration source'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived gamma-emitter used as a tracer in specialized industrial processes.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      gammaConstant: '1.16735 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 900,
            inhalation_Y: 200
         },
         DAC: {
            inhalation_Y: 1e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_Y: 8.01e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Scandium-47',
      symbol: 'Sc-47',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.601 MeV (max)'],
         gamma: ['0.159 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.200 MeV',
      halfLife: '3.35 days',
      decayConstant: '0.207 day⁻¹',
      specificActivity: '3.1 x 10^16 Bq/g',
      parent: 'Titanium-47 (n,p)',
      daughter: 'Titanium-47 (stable)',
      commonUses: ['Theranostics (pairs with Sc-44 for PET), targeted radiotherapy research.'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A research therapeutic isotope, often explored as a "theranostic" partner to the PET isotope Sc-44.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.7,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_Y: 3000
         },
         DAC: {
            inhalation_Y: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_Y: 4.98e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Selenium-75',
      symbol: 'Se-75',
      emissionType: ['Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.136 MeV', '0.265 MeV', '0.401 MeV'], // Main imaging lines
         alpha: []
      },
      halfLife: '119.8 days',
      decayConstant: '0.00578 day⁻¹',
      specificActivity: '5.4 x 10^14 Bq/g',
      parent: 'Germanium-74 (n,γ) -> Ge-75 -> As-75', // Simplified production
      daughter: 'Arsenic-75 (stable)',
      commonUses: ['Industrial radiography (small bore pipes)', 'NDT'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A popular radiography source for thinner steel sections where Ir-192 is too energetic.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      shipping: {
         A1: 3,
         A2: 3,
         unit: 'TBq'
      },
      dValue: 0.2, // IAEA EPR-D-Values
      gammaConstant: '0.85951 R·m²/hr·Ci',
      dosimetry: {
         ALI: {
            ingestion: 500,
            inhalation_W: 700
         },
         DAC: {
            inhalation_W: 3e-7
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Selenium-76',
      symbol: 'Se-76',
      emissionType: ['Stable'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      parent: 'Stable',
      daughter: 'Stable',
      commonUses: ['Reference for stable selenium', 'not a radionuclide use'],
      category: 'Stable/Reference',
      commonality: 'N/A',
      commonalityReason: 'This is a stable isotope and not radioactive.',
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Selenium-79',
      symbol: 'Se-79',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.151 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.050 MeV',
      halfLife: '327,000 years',
      decayConstant: '2.12 x 10⁻⁶ year⁻¹',
      specificActivity: '9.2 x 10^8 Bq/g',
      parent: 'Bromine-79 (n,p)',
      daughter: 'Bromine-79 (stable)',
      commonUses: ['Environmental tracer (long-lived fission product)'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'An extremely long-lived fission product relevant in nuclear waste management and environmental studies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 2,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 600,
            inhalation_D: 800,
            inhalation_W: 600
         },
         DAC: {
            inhalation_D: 3e-7,
            inhalation_W: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.77e-9,
            inhalation_W: 2.66e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Silver-110m',
      symbol: 'Ag-110m',
      emissionType: ['Beta-minus', 'Isomeric Transition', 'Gamma'],
      emissionEnergies: {
         beta: ['0.529 MeV (max)'],
         gamma: ['0.885 MeV', '0.658 MeV', '1.505 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.176 MeV',
      halfLife: '249.8 days',
      decayConstant: '0.00277 day⁻¹',
      specificActivity: '1.93 x 10^14 Bq/g',
      parent: 'Cadmium-108',
      daughter: 'Cadmium-110 (stable) or Palladium-110 (stable)',
      commonUses: ['Environmental monitoring (fission product', 'activation product)'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'An activation product sometimes used as a gamma calibration source or environmental tracer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.4,
         A2: 0.4,
         unit: 'TBq'
      },
      gammaConstant: '1.65242 R·m²/hr·Ci',
      dValue: 0.02,
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 500,
            inhalation_D: 100,
            inhalation_W: 200,
            inhalation_Y: 90
         },
         DAC: {
            inhalation_D: 5e-8,
            inhalation_W: 8e-8,
            inhalation_Y: 4e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.07e-8,
            inhalation_W: 8.34e-9,
            inhalation_Y: 2.17e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Sodium-22',
      symbol: 'Na-22',
      emissionType: ['Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['0.546 MeV (max)'],
         gamma: ['1.275 MeV', '0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.182 MeV',
      halfLife: '2.602 years',
      decayConstant: '0.266 year⁻¹',
      gammaConstant: '1.3394 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      specificActivity: '6.45 x 10^13 Bq/g',
      parent: 'Magnesium-22 (EC)',
      daughter: 'Neon-22 (stable)',
      commonUses: ['Calibration sources for PET scanners', 'Tracers for biological studies'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A common long-lived positron emitter used to calibrate PET scanners and other detectors.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 0.5,
         A2: 0.5,
         unit: 'TBq'
      },
      dValue: 0.03,
      dosimetry: {
         ALI: {
            ingestion: 400,
            inhalation_D: 600
         },
         DAC: {
            inhalation_D: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.07e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Sodium-23',
      symbol: 'Na-23',
      emissionType: ['Stable'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      parent: 'Stable',
      daughter: 'Stable',
      commonUses: ['Reference for stable sodium', 'not a radionuclide use'],
      category: 'Stable/Reference',
      commonality: 'N/A',
      commonalityReason: 'This is a stable isotope and not radioactive.',
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Sodium-24',
      symbol: 'Na-24',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.39 MeV (max)'],
         gamma: ['1.369 MeV', '2.754 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.463 MeV',
      halfLife: '14.96 hours',
      decayConstant: '0.0463 hour⁻¹',
      specificActivity: '1.8 x 10^17 Bq/g',
      parent: 'Magnesium-24 (n,p)',
      daughter: 'Magnesium-24 (stable)',
      commonUses: ['Hydrological tracer', 'Flow studies', 'Research'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A short-lived, high-energy gamma emitter used as a tracer in industrial and environmental flow studies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 0.02,
      shipping: {
         A1: 0.2,
         A2: 0.2,
         unit: 'TBq'
      },
      gammaConstant: '1.93769 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 4000,
            inhalation_D: 5000
         },
         DAC: {
            inhalation_D: 2e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.27e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Strontium-82',
      symbol: 'Sr-82',
      emissionType: ['Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.776 MeV'],
         alpha: []
      },
      daughterEmissions: {
         from: 'Rb-82',
         beta: ['3.38 MeV (max)'],
         gamma: ['0.511 MeV (annihilation)']
      },
      halfLife: '25.36 days',
      decayConstant: '0.0273 day⁻¹',
      specificActivity: '2.4 x 10^15 Bq/g',
      parent: 'Yttrium-85',
      daughter: 'Rubidium-82',
      commonUses: ['Generator for Rubidium-82, used for cardiac PET imaging.'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'The long-lived parent used in generators to produce the very short-lived PET isotope Rb-82 for cardiac scans.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.2,
         A2: 0.2,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 300,
            inhalation_D: 400,
            inhalation_Y: 90
         },
         DAC: {
            inhalation_D: 2e-7,
            inhalation_Y: 4e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.62e-9,
            inhalation_Y: 1.66e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Strontium-89',
      symbol: 'Sr-89',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['1.49 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.497 MeV',
      halfLife: '50.5 days',
      decayConstant: '0.0137 day⁻¹',
      specificActivity: '1.09 x 10^15 Bq/g',
      parent: 'Uranium Fission',
      daughter: 'Yttrium-89 (stable)',
      commonUses: ['Palliative bone pain therapy (metastatic cancer)'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A clinically used high-energy beta-emitter for palliative treatment of bone pain from cancer.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 20,
      shipping: {
         A1: 0.6,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 600,
            inhalation_D: 800,
            inhalation_Y: 100
         },
         DAC: {
            inhalation_D: 4e-7,
            inhalation_Y: 6e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.76e-9,
            inhalation_Y: 1.12e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Strontium-90',
      symbol: 'Sr-90',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.546 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.196 MeV',
      daughterEmissions: {
         from: 'Y-90',
         beta: ['2.28 MeV (max)']
      },
      halfLife: '28.9 years',
      decayConstant: '0.0240 year⁻¹',
      specificActivity: '5.15 x 10^12 Bq/g',
      parent: 'Uranium Fission',
      daughter: 'Yttrium-90',
      commonUses: ['Radioisotope thermoelectric generators (RTGs)', 'Industrial gauges', 'Medical radiation therapy for bone cancer'],
      category: 'Industrial',
      commonality: 'Common',
      commonalityReason: 'A major fission product and long-lived, high-energy beta source (via its Y-90 daughter) for industrial and medical uses.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.3,
         A2: 0.3,
         unit: 'TBq'
      },
      dValue: 1,
      dosimetry: {
         ALI: {
            ingestion: 30, // Bone surface
            inhalation_D: 20,
            inhalation_Y: 4
         },
         DAC: {
            inhalation_D: 8e-9,
            inhalation_Y: 2e-9
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.47e-8,
            inhalation_Y: 3.51e-7
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'sr_90',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Sulfur-34',
      symbol: 'S-34',
      emissionType: ['Stable'],
      emissionEnergies: {
         beta: [],
         gamma: [],
         alpha: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      parent: 'Stable',
      daughter: 'Stable',
      commonUses: ['Reference for stable sulfur', 'not a radionuclide use'],
      category: 'Stable/Reference',
      commonality: 'N/A',
      commonalityReason: 'This is a stable isotope and not radioactive.',
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Sulfur-35',
      symbol: 'S-35',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.167 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.049 MeV',
      halfLife: '87.51 days',
      decayConstant: '0.00792 day⁻¹',
      specificActivity: '1.57 x 10^15 Bq/g',
      parent: 'Chlorine-35 (n,p)',
      daughter: 'Chlorine-35 (stable)',
      commonUses: ['Molecular biology (protein labeling)', 'Metabolic studies'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A low-energy beta-emitter widely used in molecular biology labs for labeling proteins.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 60,
      shipping: {
         A1: 40,
         A2: 3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 600, // W, elemental sulfur
            inhalation_D: 20000, // Vapor
            inhalation_W: 2000
         },
         DAC: {
            inhalation_D: 7e-6,
            inhalation_W: 9e-7
         },
         DCF: {
            ingestion: 0, // Organic
            inhalation_D: 8.15e-11, // Vapor
            inhalation_W: 6.69e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_low_risk'
   },
   {
      name: 'Tantalum-182',
      symbol: 'Ta-182',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.526 MeV (max)'],
         gamma: ['1.121 MeV', '1.221 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.175 MeV',
      halfLife: '114.4 days',
      decayConstant: '0.00606 day⁻¹',
      specificActivity: '5.2 x 10^14 Bq/g',
      parent: 'Tantalum-181 (n,γ)',
      daughter: 'Tungsten-182 (stable)',
      commonUses: ['Radiography of heavy metals', 'Calibration sources'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'Used for specialized industrial radiography of dense materials.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.9,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 800,
            inhalation_W: 300,
            inhalation_Y: 100
         },
         DAC: {
            inhalation_W: 1e-7,
            inhalation_Y: 6e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 5.88e-9,
            inhalation_Y: 1.21e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Technetium-99',
      symbol: 'Tc-99',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.294 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.098 MeV',
      halfLife: '211,100 years',
      decayConstant: '3.28 x 10⁻⁶ year⁻¹',
      specificActivity: '6.3 x 10^8 Bq/g',
      parent: 'Technetium-99m',
      daughter: 'Ruthenium-99 (stable)',
      commonUses: ['Daughter product of Tc-99m', 'Environmental tracer', 'Long-lived fission product in nuclear waste'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'The long-lived daughter of Tc-99m, relevant in nuclear waste management and environmental studies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 0.9,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4000,
            inhalation_D: 5000,
            inhalation_W: 700
         },
         DAC: {
            inhalation_D: 2e-6,
            inhalation_W: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.77e-10,
            inhalation_W: 2.25e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Technetium-99m',
      symbol: 'Tc-99m',
      emissionType: ['Gamma', 'Isomeric Transition'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.1405 MeV'],
         alpha: []
      },
      halfLife: '6.01 hours',
      decayConstant: '0.115 hour⁻¹',
      specificActivity: '1.95 x 10^17 Bq/g',
      parent: 'Molybdenum-99',
      daughter: 'Technetium-99',
      commonUses: ['Medical diagnostic imaging (most common medical isotope for various scans: bone, heart, kidney, brain, etc.)'],
      category: 'Medical',
      commonality: 'Common',
      commonalityReason: 'The most widely used medical radioisotope for diagnostic imaging procedures worldwide.',
      sourceRef: {
         halfLife: 'nndc',
         decayConstant: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 4,
         unit: 'TBq'
      },
      gammaConstant: '0.1227 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         decayConstant: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      dosimetry: {
         ALI: {
            ingestion: 80000,
            inhalation_D: 200000,
            inhalation_W: 200000
         },
         DAC: {
            inhalation_D: 6e-5,
            inhalation_W: 1e-4
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 8.80e-12,
            inhalation_W: 7.21e-12
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Tellurium-123m',
      symbol: 'Te-123m',
      emissionType: ['Isomeric Transition', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.159 MeV'],
         alpha: []
      },
      halfLife: '119.7 days',
      decayConstant: '0.00579 day⁻¹',
      specificActivity: '4.1 x 10^14 Bq/g',
      parent: 'Antimony-123',
      daughter: 'Tellurium-123 (stable)',
      commonUses: ['Medical imaging (historical)', 'Research tracer'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used historically in medicine but has been replaced by other isotopes.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 8,
         A2: 1,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 600,
            inhalation_D: 200,
            inhalation_W: 500
         },
         DAC: {
            inhalation_D: 9e-8,
            inhalation_W: 2e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.86e-9,
            inhalation_W: 2.86e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Tellurium-128',
      symbol: 'Te-128',
      emissionType: ['Double Beta-minus'],
      emissionEnergies: {
         beta: ['0.867 MeV (total)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.289 MeV',
      halfLife: '2200000000000000000000000 years',
      decayConstant: '3.15 x 10⁻²⁵ year⁻¹',
      specificActivity: '1.25 x 10^-7 Bq/g',
      parent: 'Primordial',
      daughter: 'Xenon-128 (stable)',
      commonUses: ['Longest measured half-life', 'Fundamental physics research'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'Notable for having one of the longest measured half-lives of any isotope.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Tellurium-130',
      symbol: 'Te-130',
      emissionType: ['Double Beta-minus'],
      emissionEnergies: {
         beta: ['2.528 MeV (total)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.843 MeV',
      halfLife: '2500000000000000000000 years',
      decayConstant: '2.77 x 10⁻²² year⁻¹',
      specificActivity: '1.6 x 10^-5 Bq/g',
      parent: 'Primordial',
      daughter: 'Xenon-130 (stable)',
      commonUses: ['Double beta decay research'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An isotope with an extremely long half-life used in fundamental physics research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Tellurium-131m',
      symbol: 'Te-131m',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.421 MeV (max)', '1.30 MeV (max)'],
         gamma: ['0.149 MeV (dominant)', '0.774 MeV', '1.21 MeV']
      },
      // Note: Te-131m has complex branching (IT to Te-131 and Beta to I-131).
      // For equilibrium testing, we model the effective path to I-131.
      daughterEmissions: {
         from: 'I-131',
         gamma: ['0.364 MeV (81%)']
      },
      halfLife: '33.25 hours',
      decayConstant: '0.0208 hour⁻¹', 
      specificActivity: '3.0 x 10^7 TBq/g', // ~800,000 Ci/g
      parent: 'Fission Product',
      daughter: 'Iodine-131',
      commonUses: ['Medical Isotope Production', 'Research'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Parent isotope for Iodine-131 production generators.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.7,
         A2: 0.5,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
             ingestion: 400,
             inhalation_D: 400,
             inhalation_W: 600
         },
         DAC: {
             inhalation_D: '2e-7',
             inhalation_W: '3e-7'
         }
      }
   },
   {
      name: 'Terbium-161',
      symbol: 'Tb-161',
      emissionType: ['Beta-minus', 'Gamma', 'Auger electron'],
      emissionEnergies: {
         beta: ['0.593 MeV (max)'],
         gamma: ['0.049 MeV', '0.075 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.198 MeV',
      halfLife: '6.89 days',
      decayConstant: '0.101 day⁻¹',
      specificActivity: '4.4 x 10^14 Bq/g',
      commonUses: ['Theranostics (combined therapy and diagnostics), particularly for cancer treatment research.'],
      parent: 'Gadolinium-160 (n,γ)',
      daughter: 'Dysprosium-161 (stable)',
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A promising research isotope for targeted radionuclide therapy due to its ideal decay properties.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 2000
         },
         DAC: {
            inhalation_W: 7e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 9.20e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },

   {
      name: 'Thallium-201',
      symbol: 'Tl-201',
      emissionType: ['Electron Capture', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.167 MeV', '0.135 MeV'],
         alpha: []
      },
      halfLife: '73.1 hours',
      decayConstant: '0.00948 hour⁻¹',
      specificActivity: '1.74 x 10^15 Bq/g',
      parent: 'Lead-201',
      daughter: 'Mercury-201 (stable)',
      commonUses: ['Cardiac imaging (myocardial perfusion)', 'Parathyroid gland imaging'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A once-common SPECT agent for cardiac imaging, still used for certain applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      gammaConstant: '0.045 R·m²/hr·Ci', // (Mostly X-rays)
      dValue: 1,
      shipping: {
         A1: 10,
         A2: 4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 20000,
            inhalation_D: 20000
         },
         DAC: {
            inhalation_D: 9e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.34e-11
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Thallium-204',
      symbol: 'Tl-204',
      emissionType: ['Beta-minus', 'Electron Capture'],
      emissionEnergies: {
         beta: ['0.763 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.254 MeV',
      halfLife: '3.78 years',
      decayConstant: '0.183 year⁻¹',
      specificActivity: '1.6 x 10^13 Bq/g',
      parent: 'Lead-204 (d,2n)',
      daughter: 'Lead-204 (stable) or Mercury-204 (stable)',
      commonUses: ['Calibration sources (beta)', 'Thickness gauging'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived pure beta-emitter used in specialized industrial gauges.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.7,
         unit: 'TBq'
      },
      dValue: 20,
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 2000
         },
         DAC: {
            inhalation_D: 9e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.5e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Thallium-205',
      symbol: 'Tl-205',
      emissionType: ['Stable'],
      emissionEnergies: {
         alpha: [],
         beta: [],
         gamma: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      specificActivity: '0 Bq/g',
      parent: 'Bismuth-209 (α)',
      daughter: 'Stable',
      commonUses: ['Final stable product of Bismuth-209 decay', 'Nuclear Magnetic Resonance (NMR) research', 'Target material for isotope production'],
      category: 'Stable/Reference',
      commonality: 'Common',
      commonalityReason: 'The stable end-product of the extremely long-lived Bi-209.',
      sourceRef: {
         halfLife: 'nndc'
      },
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Thallium-207',
      symbol: 'Tl-207',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['1.42 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.473 MeV',
      halfLife: '4.77 minutes',
      decayConstant: '0.145 min⁻¹',
      specificActivity: '1.5 x 10^18 Bq/g',
      parent: 'Bismuth-211',
      daughter: 'Lead-207 (stable)',
      commonUses: ['Intermediate in Actinium-227 decay series'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'A very short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {},
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Thallium-208',
      symbol: 'Tl-208',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['1.80 MeV (max)'],
         gamma: ['2.614 MeV (dominant)', '0.583 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.600 MeV',
      halfLife: '3.053 minutes',
      decayConstant: '0.227 min⁻¹',
      specificActivity: '2.4 x 10^18 Bq/g',
      parent: 'Bismuth-212 (α)',
      daughter: 'Lead-208 (stable)',
      commonUses: ['High-energy gamma source in natural background'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A daughter in the Th-232 series, notable for emitting one of the highest-energy natural gamma rays (2.6 MeV).',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Thorium-227',
      symbol: 'Th-227',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['6.038 MeV'],
         beta: [],
         gamma: ['0.236 MeV']
      },
      halfLife: '18.72 days',
      decayConstant: '0.037 day⁻¹',
      specificActivity: '1.2 x 10^15 Bq/g',
      parent: 'Actinium-227',
      daughter: 'Radium-223 (α)',
      commonUses: ['Intermediate in Actinium-227 decay series', 'Alpha therapy research'],
      category: 'Natural',
      commonality: 'Rare',
      commonalityReason: 'An alpha-emitter in the U-235 decay series, used in targeted alpha therapy research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.005,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 100,
            inhalation_W: 0.3,
            inhalation_Y: 0.3
         },
         DAC: {
            inhalation_W: 1e-10,
            inhalation_Y: 1e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 4.12e-6,
            inhalation_Y: 4.37e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Thorium-228',
      symbol: 'Th-228',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.423 MeV'],
         beta: [],
         gamma: ['0.084 MeV']
      },
      daughterEmissions: {
         from: 'Ra-224',
         alpha: ['5.685 MeV'],
         gamma: ['0.241 MeV']
      },
      halfLife: '1.91 years',
      decayConstant: '0.363 year⁻¹',
      specificActivity: '3.0 x 10^13 Bq/g',
      parent: 'Actinium-228',
      daughter: 'Radium-224 (α)',
      commonUses: ['Intermediate in Thorium-232 decay chain', 'Calibration sources'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A key alpha-emitting member of the Th-232 decay series.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.5,
         A2: 0.001,
         unit: 'TBq'
      },
      dValue: 0.4,
      dosimetry: {
         ALI: {
            ingestion: 6, // Bone Surface 10
            inhalation_W: 0.01,
            inhalation_Y: 0.02
         },
         DAC: {
            inhalation_W: 4e-12,
            inhalation_Y: 7e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 6.75e-5,
            inhalation_Y: 9.23e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Thorium-229',
      symbol: 'Th-229',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.845 MeV'],
         beta: [],
         gamma: ['0.029 MeV', '0.194 MeV']
      },
      halfLife: '7,340 years',
      decayConstant: '9.44 x 10⁻⁵ year⁻¹',
      specificActivity: '7.9 x 10^9 Bq/g',
      parent: 'Uranium-233',
      daughter: 'Radium-225 (α)',
      commonUses: ['Parent for Actinium-225 generators', 'Research in nuclear clocks due to its low-energy isomeric state'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A long-lived alpha emitter used to produce Ac-225 generators and for advanced physics research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 5,
         A2: 0.0005,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.6, // Bone surface 1
            inhalation_W: 9e-4,
            inhalation_Y: 2e-3
         },
         DAC: {
            inhalation_W: 4e-13,
            inhalation_Y: 1e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 5.80e-4,
            inhalation_Y: 4.67e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_very_high'
   },
   {
      name: 'Thorium-230',
      symbol: 'Th-230',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.688 MeV'],
         beta: [],
         gamma: ['0.067 MeV']
      },
      halfLife: '75,400 years',
      decayConstant: '9.19 x 10⁻⁶ year⁻¹',
      specificActivity: '7.6 x 10^8 Bq/g',
      parent: 'Uranium-234',
      daughter: 'Radium-226 (α)',
      commonUses: ['Dating of marine sediments', 'Component of natural decay series'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'A long-lived member of the U-238 decay series, used in geological dating.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.001,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4, // Bone surface 9
            inhalation_W: 0.006,
            inhalation_Y: 0.02
         },
         DAC: {
            inhalation_W: 3e-12,
            inhalation_Y: 6e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 8.80e-5,
            inhalation_Y: 7.07e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'transuranics',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Thorium-231',
      symbol: 'Th-231',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.39 MeV (max)'],
         gamma: ['0.084 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.130 MeV',
      halfLife: '25.52 hours',
      decayConstant: '0.0272 hour⁻¹',
      specificActivity: '2.6 x 10^16 Bq/g',
      parent: 'Uranium-235',
      daughter: 'Protactinium-231',
      commonUses: ['Intermediate in U-235 decay chain'],
      category: 'Natural',
      decaySeriesId: 'U-235-series',
      commonality: 'Rare',
      commonalityReason: 'A short-lived intermediate in a natural decay chain.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 0.02,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4000,
            inhalation_W: 6000,
            inhalation_Y: 6000
         },
         DAC: {
            inhalation_W: 3e-6,
            inhalation_Y: 3e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.33e-10,
            inhalation_Y: 2.37e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Thorium-232',
      symbol: 'Th-232',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.012 MeV'],
         beta: [],
         gamma: ['0.059 MeV']
      },
      daughterEmissions: {
         from: 'Ra-228',
         beta: ['0.039 MeV (max)']
      },
      halfLife: '14.05 billion years',
      decayConstant: '4.93 x 10⁻¹¹ year⁻¹',
      specificActivity: '4,059 Bq/g',
      parent: 'Primordial',
      daughter: 'Radium-228 (α)',
      commonUses: ['Nuclear fuel cycle (fertile material)', 'Gas mantles (historical)', 'Welding electrodes', 'Thoriated optics', 'Catalysis'],
      category: 'Natural',
      decaySeriesId: 'Th-232-series',
      commonality: 'Common',
      commonalityReason: 'A primordial, naturally occurring fertile isotope that is the head of its own decay series.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 'unlimited',
         A2: 'unlimited',
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 0.7, // Bone Surface 2
            inhalation_W: 0.001,
            inhalation_Y: 0.003
         },
         DAC: {
            inhalation_W: 5e-13,
            inhalation_Y: 1e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 4.43e-4,
            inhalation_Y: 3.11e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'sr_90',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Thorium-234',
      symbol: 'Th-234',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.193 MeV (max)'],
         gamma: ['0.063 MeV', '0.093 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.064 MeV',
      daughterEmissions: {
         from: 'Pa-234m',
         beta: ['2.29 MeV (max)'],
         gamma: ['1.001 MeV']
      },
      halfLife: '24.10 days',
      decayConstant: '0.0287 day⁻¹',
      specificActivity: '8.2 x 10^14 Bq/g',
      parent: 'Uranium-238',
      daughter: 'Protactinium-234m (β-)',
      commonUses: ['Intermediate in U-238 decay chain'],
      category: 'Natural',
      commonality: 'Moderate',
      commonalityReason: 'The first daughter of U-238, often found in equilibrium with its parent in natural samples.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.3,
         A2: 0.3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 300, // Y
            inhalation_W: 200,
            inhalation_Y: 200
         },
         DAC: {
            inhalation_W: 8e-8,
            inhalation_Y: 6e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 8.04e-9,
            inhalation_Y: 9.47e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Thulium-170',
      symbol: 'Tm-170',
      emissionType: ['Beta-minus', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: ['0.968 MeV (max)'],
         gamma: ['0.084 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.323 MeV',
      halfLife: '128.6 days',
      decayConstant: '0.00539 day⁻¹',
      specificActivity: '1.02 x 10^15 Bq/g',
      parent: 'Erbium-170',
      daughter: 'Ytterbium-170 (stable)',
      commonUses: ['Portable industrial radiography', 'Brachytherapy', 'Medical imaging (historical)'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A versatile isotope used for portable radiography and some brachytherapy applications.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 3,
         A2: 0.6,
         unit: 'TBq'
      },
      dValue: 20,
      dosimetry: {
         ALI: {
            ingestion: 800,
            inhalation_W: 200
         },
         DAC: {
            inhalation_W: 9e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 7.11e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },

   {
      name: 'Tin-117m',
      symbol: 'Sn-117m',
      emissionType: ['Isomeric Transition', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.159 MeV'],
         alpha: []
      },
      halfLife: '13.76 days',
      decayConstant: '0.0504 day⁻¹',
      specificActivity: '4.8 x 10^15 Bq/g',
      parent: 'Tin-116 (n,γ)',
      daughter: 'Tin-117 (stable)',
      commonUses: ['Bone pain palliation for metastatic cancer.', 'Radiosynovectomy.'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A therapeutic isotope used for treating bone pain and in radiosynovectomy.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 7,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 1000,
            inhalation_W: 1000
         },
         DAC: {
            inhalation_D: 5e-7,
            inhalation_W: 6e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.96e-10,
            inhalation_W: 1.17e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Tin-126',
      symbol: 'Sn-126',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.380 MeV (max)'],
         gamma: ['0.087 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.127 MeV',
      halfLife: '230,000 years',
      decayConstant: '3.01 x 10⁻⁶ year⁻¹',
      specificActivity: '1.4 x 10^9 Bq/g',
      parent: 'Cadmium-126',
      daughter: 'Antimony-126 (β-)',
      commonUses: ['Long-lived fission product', 'Nuclear waste assessment'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'An extremely long-lived fission product relevant in nuclear waste management.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.6,
         A2: 0.4,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 300,
            inhalation_D: 60,
            inhalation_W: 70
         },
         DAC: {
            inhalation_D: 2e-8,
            inhalation_W: 3e-8
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.36e-8,
            inhalation_W: 2.69e-8
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Tritium',
      symbol: 'H-3',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['0.0186 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.006 MeV',
      halfLife: '12.32 years',
      decayConstant: '0.0563 year⁻¹',
      specificActivity: '3.59 x 10^14 Bq/g',
      parent: 'Lithium-6 (n,α)',
      daughter: 'Helium-3 (stable)',
      commonUses: ['Self-powered lighting (e.g., exit signs, watches)', 'Medical and biological tracer', 'Nuclear weapons component'],
      category: 'Industrial',
      commonality: 'Common',
      commonalityReason: 'Widely used in self-powered lighting (e.g., exit signs), as a biological tracer, and in nuclear weapons.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 40,
         unit: 'TBq'
      },
      dValue: 2000,
      dosimetry: {
         ALI: {
            ingestion: 80000,
            inhalation_D: 80000 // HTO
         },
         DAC: {
            inhalation_D: 2e-5
         },
         DCF: {
            ingestion: 1.73e-11,
            inhalation_D: 1.73e-11 // Water vapor
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_low_risk'
   },
   {
      name: 'Tungsten-188',
      symbol: 'W-188',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.349 MeV (max)'],
         gamma: ['0.227 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.116 MeV',
      daughterEmissions: {
         from: 'Re-188',
         beta: ['2.12 MeV (max)'],
         gamma: ['0.155 MeV']
      },
      halfLife: '69.4 days',
      decayConstant: '0.00999 day⁻¹',
      specificActivity: '3.6 x 10^14 Bq/g',
      parent: 'Tantalum-186',
      daughter: 'Rhenium-188',
      commonUses: ['Generator for Rhenium-188, used in therapeutic applications.'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'The parent isotope used in generators to produce the therapeutic isotope Re-188.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.4,
         A2: 0.3,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 400,
            inhalation_D: 1000
         },
         DAC: {
            inhalation_D: 5e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.11e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Uranium-230',
      symbol: 'U-230',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.888 MeV'],
         beta: [],
         gamma: ['0.053 MeV']
      },
      halfLife: '20.8 days',
      decayConstant: '0.0333 day⁻¹',
      specificActivity: '1.87 x 10^15 Bq/g',
      parent: 'Plutonium-234 (α)',
      daughter: 'Thorium-226',
      commonUses: ['Medical isotope production (e.g., Ra-223 from Th-226 generator)', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A research isotope sometimes used in generators to produce medical alpha-emitters.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 30,
         A2: 0.003,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4,
            inhalation_D: 0.4,
            inhalation_W: 0.4,
            inhalation_Y: 0.3
         },
         DAC: {
            inhalation_D: 2e-10,
            inhalation_W: 1e-10,
            inhalation_Y: 1e-10
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 2.32e-6,
            inhalation_W: 4.36e-6,
            inhalation_Y: 5.26e-6
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Uranium-231',
      symbol: 'U-231',
      emissionType: ['Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.084 MeV', '0.143 MeV'],
         alpha: []
      },
      halfLife: '4.2 days',
      decayConstant: '0.165 day⁻¹',
      specificActivity: '1.27 x 10^16 Bq/g',
      parent: 'Neptunium-231 (EC)',
      daughter: 'Protactinium-231',
      commonUses: ['Intermediate in nuclear research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A short-lived isotope encountered only in specialized nuclear research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dosimetry: {
         ALI: {
            ingestion: 5000,
            inhalation_D: 8000,
            inhalation_W: 6000,
            inhalation_Y: 5000
         },
         DAC: {
            inhalation_D: 3e-6,
            inhalation_W: 2e-6,
            inhalation_Y: 2e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 1.79e-10,
            inhalation_W: 2.78e-10,
            inhalation_Y: 3.22e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Uranium-232',
      symbol: 'U-232',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['5.320 MeV'],
         beta: [],
         gamma: ['0.058 MeV']
      },
      daughterEmissions: {
         from: 'Th-228',
         alpha: ['5.423 MeV'],
         gamma: ['0.084 MeV']
      },
      halfLife: '68.9 years',
      decayConstant: '0.0101 year⁻¹',
      specificActivity: '8.1 x 10^11 Bq/g',
      parent: 'Plutonium-236 (α)',
      daughter: 'Thorium-228 (α)',
      commonUses: ['Contaminant in U-233 from thorium fuel cycle', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'An isotope primarily known as a problematic contaminant in the thorium fuel cycle due to its high-energy gamma daughters.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 10,
         A2: 0.001,
         unit: 'TBq'
      },
      dValue: 0.3,
      dosimetry: {
         ALI: {
            ingestion: 2,
            inhalation_D: 0.2,
            inhalation_W: 0.4,
            inhalation_Y: 0.008
         },
         DAC: {
            inhalation_D: 9e-11,
            inhalation_W: 2e-10,
            inhalation_Y: 3e-12
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.43e-6,
            inhalation_W: 4.02e-6,
            inhalation_Y: 1.78e-4
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Uranium-233',
      symbol: 'U-233',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.824 MeV'],
         beta: [],
         gamma: ['0.042 MeV', '0.312 MeV']
      },
      halfLife: '159,200 years',
      decayConstant: '4.35 x 10⁻⁶ year⁻¹',
      specificActivity: '3.56 x 10^8 Bq/g',
      parent: 'Protactinium-233',
      daughter: 'Thorium-229 (α)',
      commonUses: ['Thorium fuel cycle (fissile material)', 'Research'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A fissile isotope that can be bred from Thorium-232, central to thorium fuel cycle research.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 0.006,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 10,
            inhalation_D: 1,
            inhalation_W: 0.7,
            inhalation_Y: 0.04
         },
         DAC: {
            inhalation_D: 5e-10,
            inhalation_W: 3e-10,
            inhalation_Y: 2e-11
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 7.53e-7,
            inhalation_W: 2.16e-6,
            inhalation_Y: 3.66e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Uranium-234',
      symbol: 'U-234',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.776 MeV'],
         beta: [],
         gamma: ['0.053 MeV']
      },
      halfLife: '245,500 years',
      decayConstant: '2.82 x 10⁻⁶ year⁻¹',
      specificActivity: '2.3 x 10^8 Bq/g',
      parent: 'Protactinium-234m (β-)',
      daughter: 'Thorium-230',
      commonUses: ['Component of natural uranium', 'Geological dating (uranium-thorium dating)'],
      category: 'Natural',
      decaySeriesId: 'U-238-series',
      commonality: 'Moderate',
      commonalityReason: 'A member of the U-238 decay series present in all natural uranium.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 40,
         A2: 0.006,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 10,
            inhalation_D: 1,
            inhalation_W: 0.7,
            inhalation_Y: 0.04
         },
         DAC: {
            inhalation_D: 5e-10,
            inhalation_W: 3e-10,
            inhalation_Y: 2e-11
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 7.37e-7,
            inhalation_W: 2.13e-6,
            inhalation_Y: 3.58e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Uranium-235',
      symbol: 'U-235',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.398 MeV'],
         beta: [],
         gamma: ['0.186 MeV', '0.144 MeV']
      },
      daughterEmissions: {
         from: 'Th-231',
         beta: ['0.39 MeV (max)'],
         gamma: ['0.084 MeV']
      },
      halfLife: '703.8 million years',
      decayConstant: '9.85 x 10⁻¹⁰ year⁻¹',
      specificActivity: '8.0 x 10^4 Bq/g',
      parent: 'Primordial',
      daughter: 'Thorium-231 (α)',
      commonUses: ['Nuclear fuel for reactors', 'Nuclear weapons'],
      category: 'Natural',
      decaySeriesId: 'U-235-series',
      commonality: 'Common',
      commonalityReason: 'The primary fissile isotope of uranium, used for nuclear power generation and weapons.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 'unlimited',
         A2: 'unlimited',
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 10,
            inhalation_D: 1,
            inhalation_W: 0.8,
            inhalation_Y: 0.04
         },
         DAC: {
            inhalation_D: 6e-10,
            inhalation_W: 3e-10,
            inhalation_Y: 2e-11
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.85e-7,
            inhalation_W: 1.97e-6,
            inhalation_Y: 3.32e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Uranium-238',
      symbol: 'U-238',
      emissionType: ['Alpha', 'Gamma'],
      emissionEnergies: {
         alpha: ['4.197 MeV'],
         beta: [],
         gamma: ['0.0496 MeV']
      },
      daughterEmissions: {
         from: 'Th-234',
         beta: ['0.193 MeV (max)'],
         gamma: ['0.063 MeV', '0.093 MeV']
      },
      halfLife: '4.468 billion years',
      decayConstant: '1.55 x 10⁻¹⁰ year⁻¹',
      specificActivity: '1.24 x 10^4 Bq/g',
      parent: 'Primordial',
      daughter: 'Thorium-234 (α)',
      commonUses: ['Geological dating', 'Nuclear fuel cycle (raw material)', 'Shielding (depleted uranium)'],
      category: 'Natural',
      decaySeriesId: 'U-238-series',
      commonality: 'Common',
      commonalityReason: 'The most abundant isotope of natural uranium (>99%) and the head of a primary natural decay series.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 'unlimited',
         A2: 'unlimited',
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 10,
            inhalation_D: 1,
            inhalation_W: 0.8,
            inhalation_Y: 0.04
         },
         DAC: {
            inhalation_D: 6e-10,
            inhalation_W: 3e-10,
            inhalation_Y: 2e-11
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.62e-7,
            inhalation_W: 1.90e-6,
            inhalation_Y: 3.20e-5
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'u_nat',
      ansiCategory: 'alpha_high'
   },
   {
      name: 'Xenon-131',
      symbol: 'Xe-131',
      emissionType: ['Stable'],
      emissionEnergies: {
         alpha: [],
         beta: [],
         gamma: []
      },
      halfLife: 'Stable',
      decayConstant: '0',
      specificActivity: '0 Bq/g',
      parent: 'Iodine-131 (β-)',
      daughter: 'Stable',
      commonUses: ['Stable end-product of Iodine-131 decay.', 'Stable isotope analysis.'],
      category: 'Stable/Reference',
      commonality: 'Common',
      commonalityReason: 'The stable end-product of I-131 decay, a very common medical isotope.',
      sourceRef: {},
      regGuideCategory: null,
      ansiCategory: null
   },
   {
      name: 'Xenon-133',
      symbol: 'Xe-133',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.346 MeV (max)'],
         gamma: ['0.081 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.115 MeV',
      halfLife: '5.24 days',
      decayConstant: '0.132 day⁻¹',
      specificActivity: '6.4 x 10^15 Bq/g',
      parent: 'Uranium Fission',
      daughter: 'Cesium-133 (stable)',
      commonUses: ['Lung ventilation studies (medical imaging)', 'Blood flow measurements'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A radioactive noble gas widely used for lung ventilation studies in nuclear medicine.',
      sourceRef: {
         halfLife: 'nndc'
      },
      dValue: 200,
      shipping: {
         A1: 20,
         A2: 10,
         unit: 'TBq'
      },
      dosimetry: {
         DAC: {
            inhalation: 1e-4 // Submersion
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Ytterbium-169',
      symbol: 'Yb-169',
      emissionType: ['Electron Capture', 'Gamma', 'X-ray'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.198 MeV', '0.261 MeV', '0.308 MeV'],
         alpha: []
      },
      halfLife: '32.02 days',
      decayConstant: '0.0216 day⁻¹',
      gammaConstant: '0.326969 R·m²/hr·Ci',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      specificActivity: '1.9 x 10^14 Bq/g',
      parent: 'Lutetium-169',
      daughter: 'Thulium-169 (stable)',
      commonUses: ['Medical imaging (historical)', 'Brain and CSF studies', 'Industrial radiography'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'Used for specialized, small-format industrial radiography and historically in medicine.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'hps'
      },
      shipping: {
         A1: 4,
         A2: 1,
         unit: 'TBq'
      },
      dValue: 0.3,
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_W: 800,
            inhalation_Y: 700
         },
         DAC: {
            inhalation_W: 4e-7,
            inhalation_Y: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 1.89e-9,
            inhalation_Y: 2.18e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Yttrium-90',
      symbol: 'Y-90',
      emissionType: ['Beta-minus'],
      emissionEnergies: {
         beta: ['2.28 MeV (max)'],
         gamma: [],
         alpha: []
      },
      avgBetaEnergy: '0.934 MeV',
      halfLife: '64.0 hours',
      decayConstant: '0.0108 hour⁻¹',
      specificActivity: '1.21 x 10^16 Bq/g',
      parent: 'Strontium-90',
      daughter: 'Zirconium-90 (stable)',
      commonUses: ['Radioembolization (liver cancer therapy)', 'Radioimmunotherapy', 'Brachytherapy'],
      category: 'Medical',
      commonality: 'Moderate',
      commonalityReason: 'A high-energy pure beta-emitter used for liver cancer therapy and other treatments.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 0.3,
         A2: 0.3,
         unit: 'TBq'
      },
      dValue: 1,
      dosimetry: {
         ALI: {
            ingestion: 400,
            inhalation_W: 700,
            inhalation_Y: 600
         },
         DAC: {
            inhalation_W: 3e-7,
            inhalation_Y: 3e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_W: 2.13e-9,
            inhalation_Y: 2.28e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Zinc-65',
      symbol: 'Zn-65',
      emissionType: ['Electron Capture', 'Positron Emission', 'Gamma'],
      emissionEnergies: {
         beta: ['0.329 MeV (Positron max, 1.4%)'],
         gamma: ['1.115 MeV (50%)'],
         alpha: []
      },
      halfLife: '244.3 days',
      decayConstant: '0.00284 day⁻¹',
      specificActivity: '3.0 x 10^14 Bq/g',
      parent: 'Zinc-64 (n,γ)',
      daughter: 'Copper-65 (stable)',
      commonUses: ['Activation product', 'Tracer', 'Environmental monitor'],
      category: 'Industrial',
      commonality: 'Moderate',
      commonalityReason: 'A common neutron activation product found in reactor components.',
      sourceRef: {
         halfLife: 'nndc',
         gammaConstant: 'plexus_nsd'
      },
      shipping: {
         A1: 2,
         A2: 2,
         unit: 'TBq'
      },
      dValue: 0.2, // IAEA EPR-D-Values
      gammaConstant: '0.330188 R·m²/hr·Ci',
      dosimetry: {
         ALI: {
            ingestion: 400,
            inhalation_Y: 300
         },
         DAC: {
            inhalation_Y: 1e-7
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Zinc-69m',
      symbol: 'Zn-69m',
      emissionType: ['Isomeric Transition', 'Gamma'],
      emissionEnergies: {
         beta: [],
         gamma: ['0.439 MeV'],
         alpha: []
      },
      halfLife: '13.76 hours',
      decayConstant: '0.0504 hour⁻¹',
      specificActivity: '4.8 x 10^16 Bq/g',
      parent: 'Zinc-69',
      daughter: 'Zinc-69',
      commonUses: ['Zinc metabolism studies (historical)'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'Used historically as a tracer for zinc metabolism but has been replaced by other methods.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 3,
         A2: 0.6,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 4000,
            inhalation_Y: 7000
         },
         DAC: {
            inhalation_Y: 3e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_Y: 2.20e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Zirconium-89',
      symbol: 'Zr-89',
      emissionType: ['Positron Emission', 'Electron Capture', 'Gamma'],
      emissionEnergies: {
         beta: ['0.902 MeV (max)'],
         gamma: ['0.909 MeV', '0.511 MeV (annihilation)'],
         alpha: []
      },
      avgBetaEnergy: '0.301 MeV',
      halfLife: '78.41 hours',
      decayConstant: '0.00884 hour⁻¹',
      specificActivity: '1.18 x 10^16 Bq/g',
      parent: 'Yttrium-89 (p,n)',
      daughter: 'Yttrium-89 (stable)',
      commonUses: ['PET imaging, particularly for antibody-based imaging (immuno-PET) due to its longer half-life.'],
      category: 'Medical',
      commonality: 'Rare',
      commonalityReason: 'A PET isotope with a relatively long half-life, making it ideal for antibody-based imaging (immuno-PET).',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {

      },
      dosimetry: {
         ALI: {
            ingestion: 2000,
            inhalation_D: 4000,
            inhalation_W: 2000,
            inhalation_Y: 2000
         },
         DAC: {
            inhalation_D: 1e-6,
            inhalation_W: 1e-6,
            inhalation_Y: 1e-6
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 3.88e-10,
            inhalation_W: 6.06e-10,
            inhalation_Y: 6.41e-10
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   },
   {
      name: 'Zirconium-95',
      symbol: 'Zr-95',
      emissionType: ['Beta-minus', 'Gamma'],
      emissionEnergies: {
         beta: ['0.399 MeV (max)'],
         gamma: ['0.724 MeV', '0.757 MeV'],
         alpha: []
      },
      avgBetaEnergy: '0.133 MeV',
      daughterEmissions: {
         from: 'Nb-95',
         beta: ['0.160 MeV (max)'],
         gamma: ['0.766 MeV']
      },
      halfLife: '64.03 days',
      decayConstant: '0.0108 day⁻¹',
      specificActivity: '8.8 x 10^14 Bq/g',
      parent: 'Uranium Fission',
      daughter: 'Niobium-95',
      commonUses: ['Fission product', 'Environmental tracer'],
      category: 'Industrial',
      commonality: 'Rare',
      commonalityReason: 'A common fission product used as a tracer in environmental and fallout studies.',
      sourceRef: {
         halfLife: 'nndc'
      },
      shipping: {
         A1: 2,
         A2: 0.8,
         unit: 'TBq'
      },
      dosimetry: {
         ALI: {
            ingestion: 1000,
            inhalation_D: 100,
            inhalation_W: 400,
            inhalation_Y: 300
         },
         DAC: {
            inhalation_D: 5e-8,
            inhalation_W: 2e-7,
            inhalation_Y: 1e-7
         },
         DCF: {
            ingestion: 0,
            inhalation_D: 6.39e-9,
            inhalation_W: 4.29e-9,
            inhalation_Y: 6.31e-9
         },
         sourceRef: '10CFR20'
      },
      regGuideCategory: 'beta_gamma',
      ansiCategory: 'beta_gamma'
   }
];
