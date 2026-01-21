/**
 * Normalizes a string by converting it to lowercase and removing spaces and hyphens.
 * @param {string} str - The input string.
 * @returns {string} The normalized string.
 */

const normalizeString = (str) => (typeof str === 'string' ? str.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

/**
 * @description Creates a formatted string of key info for a nuclide tooltip.
 * @param {object} nuclide - The nuclide object.
 * @returns {string} A formatted string with half-life and emission types.
 */

const generateQuickInfoText = (nuclide) => {
   if (!nuclide) return '';
   const halfLife = `Half-life: ${formatHalfLife(nuclide.halfLife, getBestHalfLifeUnit(parseHalfLifeToSeconds(nuclide.halfLife)))}`;
   const emissions = `Emissions: ${(nuclide.emissionType || []).join(', ')}`;
   return `${halfLife} | ${emissions}`;
};
/**
 * Formats a number for compact display on mobile screens.
 * Rounds to 3 significant figures and handles special cases.
 * @param {number} num - The number to format.
 * @returns {string} The compacted, formatted string.
 */

const formatForMobile = (num) => {
   if (num === null || num === undefined || isNaN(num) || num === Infinity) return 'N/A';
   if (num === 0) return '0';
   return num.toPrecision(3);
};

/**
 * @description Formats a dose or dose rate value based on the global unit system.
 * @param {number} value_mrem - The numerical value in mrem or mrem/hr.
 * @param {string} type - The type of quantity ('dose' or 'doseRate').
 * @param {object} settings - The global settings object from SettingsContext.
 * @returns {{value: string, unit: string}} An object with the formatted value and unit.
 */
const formatDoseValue = (value_mrem, type, settings) => {
   const {
      unitSystem
   } = settings;

   if (unitSystem === 'si') {
      // Convert mrem to mSv (100 mrem = 1 mSv)
      const value_mSv = value_mrem / 100;
      return formatSensibleUnit(value_mSv, `${type}_si`);
   } else {
      // Already in conventional, just format it
      return formatSensibleUnit(value_mrem, type);
   }
};

/**
 * @description Calculates the ANSI/HPS N43.6 source category based on activity and D-value.
 * @param {number} activityInTbq - The activity of the source in TBq.
 * @param {number} dValueInTbq - The D-value for the nuclide in TBq.
 * @returns {object|null} An object with the category and description, or null if not applicable.
 */
const calculateAnsiCategory = (activityInTbq, dValueInTbq) => {
   if (!dValueInTbq || dValueInTbq <= 0) return null;

   const ratio = activityInTbq / dValueInTbq;

   if (ratio >= 1000) {
      return {
         category: 1,
         description: 'Category 1 Source (Extremely Dangerous)'
      };
   } else if (ratio >= 10) {
      return {
         category: 2,
         description: 'Category 2 Source (Very Dangerous)'
      };
   } else if (ratio >= 1) {
      return {
         category: 3,
         description: 'Category 3 Source (Dangerous)'
      };
   } else if (ratio >= 0.01) {
      return {
         category: 4,
         description: 'Category 4 Source (Unlikely to be Dangerous)'
      };
   } else {
      return {
         category: 5,
         description: 'Category 5 Source (Very Unlikely to be Dangerous)'
      };
   }
};

/**
 * @description Formats a value based on the global unit system preference.
 * @param {number} value - The numerical value in its base unit.
 * @param {string} type - The type of quantity (e.g., 'activity', 'dose', 'gammaConstant').
 * @param {object} settings - The global settings object from SettingsContext.
 * @returns {{value: string, unit: string}} An object with the formatted value and unit.
 */
const formatWithUnitSystem = (value, type, settings) => {
   const {
      unitSystem
   } = settings;

   if (value === null || value === undefined || isNaN(value)) {
      return {
         value: 'N/A',
         unit: ''
      };
   }

   const formatNumber = (num) => {
      if (num === 0) return '0';
      const absVal = Math.abs(num);
      if (absVal > 1e4 || absVal < 1e-3) {
         return num.toExponential(2);
      }
      return num.toPrecision(3);
   };

   switch (type) {
      case 'activity': // Base unit is Bq/g
         if (unitSystem === 'si') {
            return {
               value: formatNumber(value),
               unit: 'Bq/g'
            };
         } else {
            const value_Ci_g = value / 3.7e10;
            return {
               value: formatNumber(value_Ci_g),
               unit: 'Ci/g'
            };
         }

      case 'ali': // Base unit is µCi
         if (unitSystem === 'si') {
            const value_Bq = value * 37000;
            return {
               value: formatNumber(value_Bq),
               unit: 'Bq'
            };
         } else {
            return {
               value: formatNumber(value),
               unit: 'µCi'
            };
         }

      case 'dac': // Base unit is µCi/mL
         if (unitSystem === 'si') {
            const value_Bq_m3 = value * 3.7e10;
            return {
               value: formatNumber(value_Bq_m3),
               unit: 'Bq/m³'
            };
         } else {
            return {
               value: formatNumber(value),
               unit: 'µCi/mL'
            };
         }

      case 'gammaConstant': // Base unit is R·m²/hr·Ci
         if (unitSystem === 'si') {
            // Conversion: R -> Gy (0.01), Ci -> Bq (3.7e10) -> (Gy·m²/hr·Bq)
            // For dose equivalent, use Sv, assuming QF=1 for photons
            const value_Sv_m2_hr_Bq = (value * 0.01) / 3.7e10;
            return {
               value: formatNumber(value_Sv_m2_hr_Bq),
               unit: 'Sv·m²/hr·Bq'
            };
         } else {
            return {
               value: value.toString(),
               unit: 'R·m²/hr·Ci'
            };
         }

      default:
         return {
            value: value.toString(), unit: ''
         };
   }
};

/**
 * Parses a half-life string (e.g., "1600 years") into a total number of seconds.
 * Handles various units, scientific notation, and the "Stable" keyword.
 * @param {string} halfLifeStr - The half-life string to parse.
 * @returns {number} The half-life in seconds, or Infinity for "Stable".
 */

const parseHalfLifeToSeconds = (halfLifeStr) => {
   if (!halfLifeStr || halfLifeStr.toLowerCase() === 'stable') return Infinity;

   const match = halfLifeStr.trim().match(/^(.*?)\s*([a-zA-Zμµ]+.*)$/);
   let numericStr, unitStr;
   if (match) {
      numericStr = match[1].trim();
      unitStr = match[2].trim();
   } else {
      numericStr = halfLifeStr.trim();
      unitStr = '';
   }

   let value;
   const sciNotationRegex = /([\d.,]+)\s*x\s*10\^?([⁻⁺\-−\d⁰¹²³⁴⁵⁶⁷⁸⁹]+)/i;
   const sciMatch = numericStr.match(sciNotationRegex);

   if (sciMatch) {
      const mantissa = parseFloat(sciMatch[1].replace(/,/g, ''));
      const exponentStr = sciMatch[2];
      const superToRegularMap = {
         '⁰': '0',
         '¹': '1',
         '²': '2',
         '³': '3',
         '⁴': '4',
         '⁵': '5',
         '⁶': '6',
         '⁷': '7',
         '⁸': '8',
         '⁹': '9',
         '⁺': '+',
         '⁻': '-',
         '−': '-'
      };
      const regularExponentStr = [...exponentStr].map(char => superToRegularMap[char] || char).join('');
      const exponent = parseInt(regularExponentStr);
      if (!isNaN(mantissa) && !isNaN(exponent)) {
         value = mantissa * Math.pow(10, exponent);
      }
   } else {
      value = parseFloat(numericStr.replace(/,/g, ''));
   }

   if (isNaN(value)) return 0;

   const unit = unitStr.toLowerCase();
   const unitMultipliers = {
      'billion years': 3.15576e16,
      'million years': 3.15576e13,
      'kiloyears': 3.15576e10, // Note: The data does not contain this unit, but the logic is ready for it.
      'years': 31557600,
      'year': 31557600,
      'days': 86400,
      'day': 86400,
      'hours': 3600,
      'hour': 3600,
      'minutes': 60,
      'minute': 60,
      'seconds': 1,
      'second': 1,
      's': 1,
      'milliseconds': 1e-3,
      'millisecond': 1e-3,
      'microseconds': 1e-6,
      'microsecond': 1e-6,
   };

   // Sort keys by length in descending order to match 'billion years' before 'years'

   const sortedKeys = Object.keys(unitMultipliers).sort((a, b) => b.length - a.length);

   for (const key of sortedKeys) {
      if (unit.startsWith(key)) {
         return value * unitMultipliers[key];
      }
   }
   return value;
};

const getHalfLifeCategory = (seconds) => {
   if (seconds === Infinity) return {
      label: 'Stable',
      color: 'text-slate-500 dark:text-slate-400'
   };
   if (seconds < 3600) return {
      label: 'Very Short',
      color: 'text-red-500'
   }; // < 1 Hour
   if (seconds < 86400 * 2) return {
      label: 'Short',
      color: 'text-amber-500'
   }; // < 2 Days
   if (seconds < 31557600 * 10) return {
      label: 'Medium',
      color: 'text-sky-500'
   }; // < 10 Years
   if (seconds < 31557600 * 1000000) return {
      label: 'Long',
      color: 'text-indigo-500'
   }; // < 1 Million Years
   return {
      label: 'Geological',
      color: 'text-purple-500'
   };
};

/*
 * Parses a string to standardize its numeric part into "e" notation if it's very large or small.
 * Handles multiple formats: "1.23 x 10^4", "1.23 x 10⁻⁴", "4,059", and "0.0123".
 * @param {string} str - The input string (e.g., "1.55 x 10⁻¹⁰ year⁻¹").
 * @returns {string} The formatted string with standardized notation.
 */

const standardizeScientificDisplay = (str) => {
   if (typeof str !== 'string' || !str) return str;

   // A map to convert unicode superscripts and minus signs to standard characters.

   const superToRegularMap = {
      '⁰': '0',
      '¹': '1',
      '²': '2',
      '³': '3',
      '⁴': '4',
      '⁵': '5',
      '⁶': '6',
      '⁷': '7',
      '⁸': '8',
      '⁹': '9',
      '⁺': '+',
      '⁻': '-',
      '−': '-'
   };

   // Regex to capture the mantissa, exponent (in any format), and any trailing units.

   const sciNotationRegex = /([\d.,]+)\s*x\s*10\^?([⁻⁺\-−\d⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*(.*)/;
   const sciMatch = str.match(sciNotationRegex);

   if (sciMatch) {
      const mantissa = parseFloat(sciMatch[1].replace(/,/g, ''));
      const exponentStr = sciMatch[2];
      const units = sciMatch[3] || '';

      const regularExponentStr = [...exponentStr].map(char => superToRegularMap[char] || char).join('');
      const exponent = parseInt(regularExponentStr);

      if (isNaN(mantissa) || isNaN(exponent)) return str;

      const numericValue = mantissa * Math.pow(10, exponent);
      return `${numericValue.toExponential(2)} ${units}`.trim();
   }

   // If not in scientific notation, handle it as a plain number.

   const plainNumberRegex = /^([-\d.,]+)(.*)/;
   const plainMatch = str.match(plainNumberRegex);
   if (plainMatch) {
      const numberPart = plainMatch[1].replace(/,/g, '');
      const units = plainMatch[2] || '';
      const numericValue = parseFloat(numberPart);
      if (isNaN(numericValue)) return str;

      const absValue = Math.abs(numericValue);
      if (numericValue === 0) return `0 ${units}`.trim();

      // Use exponential notation for very large or very small numbers.

      if (absValue > 10000 || absValue < 0.001) {
         return `${numericValue.toExponential(2)} ${units}`.trim();
      }
      // For other numbers, use a fixed precision.

      return `${numericValue.toPrecision(3)} ${units}`.trim();
   }

   return str;
};

/**
 * Determines the most appropriate human-readable unit for a given duration in seconds.
 * @param {number} seconds - The duration in seconds.
 * @returns {string} The most fitting unit ('years', 'days', 'hours', 'minutes', or 'seconds').
 */

const getBestHalfLifeUnit = (seconds) => {
   if (seconds === Infinity) return 'years';

   const secondsInMinute = 60;
   const secondsInHour = 3600;
   const secondsInDay = 86400;
   const secondsInYear = 31557600; // 365.25 days

   if (seconds >= secondsInYear) return 'years';
   if (seconds >= secondsInDay) return 'days';
   if (seconds >= secondsInHour) return 'hours';
   if (seconds >= secondsInMinute) return 'minutes';
   return 'seconds';
};

/**
 * Formats a half-life string into a specified target unit with appropriate precision.
 * @param {string} halfLifeStr - The original half-life string (e.g., "1.25 billion years").
 * @param {string} targetUnit - The desired unit for the output (e.g., 'years', 'days').
 * @returns {string} The formatted half-life string (e.g., "1.25e+9 years").
 */

const formatHalfLife = (halfLifeStr, targetUnit) => {
   const seconds = parseHalfLifeToSeconds(halfLifeStr);

   if (seconds === Infinity) return 'Stable';
   if (seconds === 0 || !halfLifeStr) return 'N/A';

   const unitConversions = {
      'seconds': 1,
      'minutes': 60,
      'hours': 3600,
      'days': 86400,
      'years': 31557600,
      'kiloyears': 3.15576e10, // Use standardized scientific notation
      'megayears': 3.15576e13,
      'gigayears': 3.15576e16,
   };

   const value = seconds / unitConversions[targetUnit];

   // Use the existing standardization function to format the output

   const formattedValue = standardizeScientificDisplay(`${value} ${targetUnit}`);

   return formattedValue;
};

/**
 * Parses an array of energy strings and returns the primary energy value in MeV.
 * Assumes the first entry in the array is the most significant.
 * @param {string[]} energyArray - An array of energy strings (e.g., ["5.3 MeV", "5.2 MeV"]).
 * @returns {number} The energy value in MeV. Returns 0 if input is invalid.
 */

const parseEnergyToMeV = (energyArray) => {
   if (!energyArray || energyArray.length === 0) return 0;
   const energyStr = energyArray[0];
   const parts = energyStr.split(' ');
   let value = parseFloat(parts[0]);

   if (isNaN(value)) return 0;

   const unit = parts[1]?.toLowerCase();
   if (unit && unit.includes('kev')) return value / 1000; // Convert keV to MeV
   return value;
};

/**
 * Parses a specific activity string, handling scientific notation (e.g., "3.7 x 10^10 Bq/g").
 * @param {string} saStr - The specific activity string.
 * @returns {number} The parsed specific activity as a number. Returns 0 if input is invalid.
 */

const parseSpecificActivity = (saStr) => {
   if (!saStr) return 0;
   const parts = saStr.toLowerCase().split(' ');

   // Check for the specific "x 10^" format.

   if (parts.length < 3 || parts[1] !== 'x' || !parts[2].includes('10^')) {
      return parseFloat(saStr.replace(/,/g, '')); // Fallback for simple numbers.
   }

   const value = parseFloat(parts[0]);
   const exponent = parseInt(parts[2].split('^')[1]);

   if (isNaN(value) || isNaN(exponent)) return 0;

   return value * Math.pow(10, exponent);
};

/**
 * Takes a raw value in a base unit and formats it into the most "sensible"
 * larger or smaller unit for display.
 * @param {number} value - The raw numerical value.
 * @param {string} unitType - The type of unit (e.g., 'doseRate', 'distance').
 * @param {number} [precision=3] - The number of significant figures to use.
 * @returns {{value: string, unit: string}} An object with the formatted value and the chosen unit.
 */

const formatSensibleUnit = (value, unitType, precision = 3) => {
   const config = SENSIBLE_UNIT_CONFIG[unitType];
   if (!config) {
      return {
         value: value.toPrecision(precision),
         unit: ''
      };
   }

   for (const unitInfo of config.units) {
      if (Math.abs(value) < unitInfo.threshold) {
         const displayValue = value / unitInfo.factor;
         return {
            value: displayValue.toPrecision(precision),
            unit: unitInfo.unit
         };
      }
   }

   const largestUnit = config.units[config.units.length - 1];
   return {
      value: (value / largestUnit.factor).toPrecision(precision),
      unit: largestUnit.unit
   };
};

/**
 * Flattens a potentially nested decay chain into a simple, unique list of nuclides
 * for the Bateman calculator.
 * @param {Array<object>} chain - The potentially nested chain data.
 * @returns {Array<object>} A flat array of unique nuclide steps.
 */

const flattenChainForCalculator = (chain) => {
   const seen = new Set();
   const flatChain = [];

   function recurse(steps) {
      if (!steps) return;
      for (const step of steps) {
         if (!seen.has(step.nuclide)) {
            flatChain.push(step);
            seen.add(step.nuclide);
         }
         if (step.branches) {
            step.branches.forEach(branch => recurse(branch));
         }
      }
   }

   recurse(chain);
   return flatChain;
};

/**
 * Implements the Bateman equations for a full decay series, including branching decays.
 * It iteratively builds an analytical solution for each nuclide as a sum of exponential terms.
 * @param {Array<object>} chain - The array of nuclide objects in the decay series.
 * @param {number} A1_0 - The initial activity of the parent nuclide.
 * @param {number} t_seconds - The elapsed time in seconds.
 * @returns {Array<number>} An array of activities for each nuclide in the chain at time t.
 */

const runBatemanWithBranching = (chain, A1_0, t_seconds) => {
   const nuclideMap = new Map();

   // 1. Pre-process the chain into a graph-like map for easy lookup.

   chain.forEach(step => {
      const lambda = parseHalfLifeToSeconds(step.halfLife) === Infinity ? 0 : Math.log(2) / parseHalfLifeToSeconds(step.halfLife);
      if (!nuclideMap.has(step.nuclide)) {
         nuclideMap.set(step.nuclide, {
            name: step.nuclide,
            lambda,
            parents: [],
            solution: []
         });
      } else {
         nuclideMap.get(step.nuclide).lambda = lambda;
      }

      if (step.daughter !== 'N/A') {
         const decayTypes = step.decayType.split(' / ').map(s => s.trim());
         const daughters = step.daughter.split(' / ').map(s => s.trim());
         daughters.forEach((daughterName, i) => {
            // Extract branching ratio if present, e.g., "Beta-minus (64.1%)"
            const match = decayTypes[i] ? decayTypes[i].match(/\(([\d.]+)%\)/) : null;
            const br = match ? parseFloat(match[1]) / 100.0 : 1.0;

            if (!nuclideMap.has(daughterName)) {
               nuclideMap.set(daughterName, {
                  name: daughterName,
                  lambda: 0,
                  parents: [],
                  solution: []
               });
            }
            nuclideMap.get(daughterName).parents.push({
               name: step.nuclide,
               br: br
            });
         });
      }
   });

   // 2. Iteratively build the analytical solution for each nuclide.

   for (const step of chain) {
      const nuclideName = step.nuclide;
      const nuclide = nuclideMap.get(nuclideName);

      if (nuclide.parents.length === 0) { // This is the root parent
         if (nuclide.lambda === 0) continue;
         const N0 = A1_0 / nuclide.lambda;
         nuclide.solution.push({
            coeff: N0,
            lambda: nuclide.lambda
         });
      } else {
         const solutionMap = new Map(); // Used to consolidate terms
         for (const parent of nuclide.parents) {
            const parentNuclide = nuclideMap.get(parent.name);
            for (const term of parentNuclide.solution) {
               const C = parent.br * parentNuclide.lambda * term.coeff;

               // Handle the case where decay constants are identical (or very close)

               if (Math.abs(nuclide.lambda - term.lambda) < 1e-20) {

                  // This case leads to a t*e^(-lambda*t) term, which complicates the solution structure.
                  // For simplicity and to avoid a full rewrite, we'll approximate by introducing a tiny difference.
                  // This is a common numerical stability trick.

                  term.lambda *= (1 + 1e-10);
               }

               const coeff = C / (nuclide.lambda - term.lambda);
               // Add the two new terms to the solution map, consolidating as we go
               solutionMap.set(term.lambda, (solutionMap.get(term.lambda) || 0) + coeff);
               solutionMap.set(nuclide.lambda, (solutionMap.get(nuclide.lambda) || 0) - coeff);
            }
         }
         // Convert the map back to the solution array format
         nuclide.solution = Array.from(solutionMap, ([lambda, coeff]) => ({
            lambda,
            coeff
         }));
      }
   }

   // 3. Calculate the final activities at the specified time.

   const finalActivities = [];
   for (const step of chain) {
      const nuclide = nuclideMap.get(step.nuclide);
      if (nuclide.lambda === 0) {
         finalActivities.push(0);
         continue;
      }
      let N_t = 0;
      for (const term of nuclide.solution) {
         N_t += term.coeff * Math.exp(-term.lambda * t_seconds);
      }
      const A_t = N_t * nuclide.lambda;
      finalActivities.push(A_t > 0 ? A_t : 0); // Ensure no negative activities from floating point errors
   }
   return finalActivities;
};

/**
 * Calculates the distance between two lat lng points in meters using the Haversine formula.
 * @param {{lat: number, lng: number}} p1 - The first point.
 * @param {{lat: number, lng: number}} p2 - The second point.
 * @returns {number} The distance in meters.
 */

const calculateDistance = (p1, p2) => {
   const R = 6371e3; // Earth's radius in meters
   const phi1 = p1.lat * Math.PI / 180;
   const phi2 = p2.lat * Math.PI / 180;
   const deltaPhi = (p2.lat - p1.lat) * Math.PI / 180;
   const deltaLambda = (p2.lng - p1.lng) * Math.PI / 180;

   const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

   return R * c;
};

/**
 * Calculates the area of a polygon given its geographical coordinates.
 * @param {L.LatLng[]} latLngs - An array of Leaflet LatLng objects.
 * @returns {number} The area in square meters.
 */
const calculatePolygonArea = (latLngs) => {
   if (!latLngs || latLngs.length === 0 || latLngs[0].length < 3) return 0;

   const points = latLngs[0];
   const earthRadius = 6378137; // Earth's radius in meters
   let area = 0;

   for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const xi = points[i].lng * Math.PI / 180;
      const yi = points[i].lat * Math.PI / 180;
      const xj = points[j].lng * Math.PI / 180;
      const yj = points[j].lat * Math.PI / 180;

      area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
   }
   return Math.abs(area * earthRadius * earthRadius / 2.0);
};
