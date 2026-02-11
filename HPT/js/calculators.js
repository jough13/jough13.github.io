const SHIELD_PROPS = {
    'Plastic': { Z: 6, density: 1.18, type: 'Low-Z', mapTo: 'Water' },
    'Lucite/Acrylic': { Z: 6, density: 1.19, type: 'Low-Z', mapTo: 'Water' },
    'Aluminum': { Z: 13, density: 2.70, type: 'Low-Z', mapTo: 'Aluminum' },
    'Concrete': { Z: 11, density: 2.35, type: 'Low-Z', mapTo: 'Concrete' }, // Avg Z
    'Steel': { Z: 26, density: 7.85, type: 'High-Z', mapTo: 'Steel' },
    'Tungsten': { Z: 74, density: 19.3, type: 'High-Z', mapTo: 'Lead' }, // Map to Lead as approx
    'Lead': { Z: 82, density: 11.34, type: 'High-Z', mapTo: 'Lead' },
    'Water': { Z: 7.4, density: 1.00, type: 'Low-Z', mapTo: 'Water' },
    'None': { Z: 0, density: 0, type: 'None', mapTo: 'None' }
};

/**
 * @description Calculates time required for a source to decay to a specific limit.
 * Visualizes the decay curve and the intersection point.
 */

const DecayToLimitCalculator = ({ radionuclides, selectedNuclide, setSelectedNuclide, initialActivity, setInitialActivity, initialUnit, setInitialUnit, finalActivity, setFinalActivity, finalUnit, setFinalUnit, result, setResult, error, setError, activityUnits, theme }) => {
    
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    const [chartData, setChartData] = React.useState(null);
    const [useLogScale, setUseLogScale] = React.useState(false);

    const nuclidesWithHalfLife = React.useMemo(() => 
        radionuclides.filter(r => r.halfLife !== 'Stable').sort((a,b) => a.name.localeCompare(b.name)), 
    [radionuclides]);

    // Expanded factors to handle 'uCi' vs 'µCi' ambiguity and other variants
    const activityFactorsBq = React.useMemo(() => ({ 
        'Bq': 1, 'kBq': 1e3, 'MBq': 1e6, 'GBq': 1e9, 'TBq': 1e12, 
        'µCi': 3.7e4, 'uCi': 3.7e4, // Handle both micro symbol and 'u'
        'mCi': 3.7e7, 'Ci': 3.7e10, 
        'dps': 1, 'dpm': 1/60 
    }), []);

    React.useEffect(() => {
        try {
            setError('');
            
            // 1. Validate Inputs
            if (!selectedNuclide) { setResult(null); setChartData(null); return; }

            const A0 = safeParseFloat(initialActivity);
            const Af = safeParseFloat(finalActivity);

            // Wait for both inputs to be numbers before calculating
            if (isNaN(A0) || isNaN(Af) || A0 <= 0 || Af <= 0) {
                if (initialActivity && finalActivity) setError("Activities must be positive numbers.");
                setResult(null); 
                return;
            }

            // 2. Validate Units & Convert to Bq
            const factor0 = activityFactorsBq[initialUnit];
            const factorF = activityFactorsBq[finalUnit];

            if (!factor0 || !factorF) {
                // This prevents the "undefined" result if units aren't recognized
                setResult(null);
                return; 
            }

            const A0_Bq = A0 * factor0;
            const Af_Bq = Af * factorF;

            if (Af_Bq >= A0_Bq) {
                setError("Final activity must be less than initial activity.");
                setResult(null); 
                return;
            }

            // 3. Physics Calculation
            const T_half_seconds = parseHalfLifeToSeconds(selectedNuclide.halfLife);
            if (!T_half_seconds || T_half_seconds === Infinity) {
                setError("Invalid half-life (Stable or Unknown).");
                setResult(null);
                return;
            }

            const lambda = Math.log(2) / T_half_seconds;
            const time_seconds = (-1 / lambda) * Math.log(Af_Bq / A0_Bq);

            if (!isFinite(time_seconds)) {
                setError("Invalid time result. Check inputs.");
                setResult(null);
                return;
            }

            // 4. Result Formatting (Case-Insensitive Safe Lookup)
            const num_half_lives = time_seconds / T_half_seconds;
            const bestUnit = getBestHalfLifeUnit(time_seconds) || 'seconds'; // Fallback to seconds
            
            const unitConversions = { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400, 'years': 31557600 };
            // Ensure we match the key regardless of case (e.g. "Days" vs "days")
            const conversionFactor = unitConversions[bestUnit.toLowerCase()] || 1; 
            
            const time_in_best_unit = time_seconds / conversionFactor;

            setResult({
                time: time_in_best_unit.toPrecision(4),
                unit: bestUnit,
                halfLives: num_half_lives.toFixed(2)
            });

            // 5. Chart Generation
            const steps = 100;
            const totalTimePlot = time_in_best_unit * 1.2; 
            
            const labels = [];
            const parentData = [];
            const limitData = []; 

            for (let i = 0; i <= steps; i++) {
                const t_plot = (totalTimePlot / steps) * i;
                const t_plot_seconds = t_plot * conversionFactor;

                const currentAct_Bq = A0_Bq * Math.exp(-lambda * t_plot_seconds);
                const currentAct_UserUnit = currentAct_Bq / factor0;
                const targetLimit_UserUnit = Af_Bq / factor0;

                // Dynamic X-Axis Labels
                let label = t_plot.toFixed(2);
                if (totalTimePlot < 0.1) label = t_plot.toExponential(2);
                else if (totalTimePlot > 100) label = t_plot.toFixed(0);

                labels.push(label);
                parentData.push(currentAct_UserUnit);
                limitData.push(targetLimit_UserUnit);
            }

            setChartData({
                labels,
                datasets: [
                    {
                        label: `${selectedNuclide.name} Decay`,
                        data: parentData,
                        borderColor: 'rgb(14, 165, 233)', 
                        backgroundColor: 'rgba(14, 165, 233, 0.5)',
                    },
                    {
                        label: `Limit (${finalActivity} ${finalUnit})`,
                        data: limitData,
                        borderColor: 'rgb(239, 68, 68)',
                        borderDash: [5, 5], 
                        pointRadius: 0,
                    }
                ],
                timeUnit: bestUnit,
                // Fallback prevents "Activity (undefined)" if props aren't ready
                yAxisLabel: `Activity (${initialUnit || '-'})` 
            });

        } catch (e) {
            setError("Calculation failed.");
            setResult(null);
        }
    }, [selectedNuclide, initialActivity, initialUnit, finalActivity, finalUnit, activityFactorsBq]);

    const handleSaveToHistory = () => {
        if (result && selectedNuclide) {
            addHistory({
                id: Date.now(),
                type: 'Decay to Limit',
                icon: ICONS.stopwatch,
                inputs: `${initialActivity} ${initialUnit} ${selectedNuclide.symbol} → ${finalActivity} ${finalUnit}`,
                result: `${result.time} ${result.unit}`,
                view: VIEWS.CALCULATOR
            });
            addToast('Calculation saved!');
        }
    };

    return (
        <div className="space-y-4 max-w-3xl mx-auto">
            <ContextualNote type="info">Calculates the time required for a radioactive source to decay down to a specific regulatory limit or release criteria.</ContextualNote>
            
            {/* Nuclide Selection */}
            <div>
                <label className="text-sm font-bold text-slate-500 uppercase">Radionuclide</label>
                <div className="mt-1">
                    {selectedNuclide ?
                        <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setSelectedNuclide(null)} /> :
                        <SearchableSelect options={nuclidesWithHalfLife} onSelect={(symbol) => setSelectedNuclide(radionuclides.find(n => n.symbol === symbol))} placeholder="Search..." />
                    }
                </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Current Activity</label>
                    <div className="flex gap-2">
                        <input type="number" value={initialActivity} onChange={e => setInitialActivity(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                        <select value={initialUnit} onChange={e => setInitialUnit(e.target.value)} className="w-24 p-2 rounded bg-slate-200 dark:bg-slate-600 border-none text-sm font-bold">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Limit</label>
                    <div className="flex gap-2">
                        <input type="number" value={finalActivity} onChange={e => setFinalActivity(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                        <select value={finalUnit} onChange={e => setFinalUnit(e.target.value)} className="w-24 p-2 rounded bg-slate-200 dark:bg-slate-600 border-none text-sm font-bold">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center font-bold">{error}</div>}

            {/* Result Display */}
            {result && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-sky-100 dark:border-sky-900 mt-6 overflow-hidden animate-slide-up">
                    <div className="p-3 bg-sky-50 dark:bg-sky-900/30 flex justify-between items-center border-b border-sky-100 dark:border-sky-800">
                        <span className="font-bold text-sm uppercase text-sky-700 dark:text-sky-300">Time Required</span>
                        <button onClick={handleSaveToHistory} className="text-sky-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 text-center">
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">{result.time}</span>
                            <span className="text-xl font-bold text-slate-500">{result.unit}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-wide">{result.halfLives} Half-lives</p>
                    </div>
                </div>
            )}

            {/* Chart Section */}
            {chartData && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300">Decay Curve</h3>
                        <label className="flex items-center gap-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            <input type="checkbox" checked={useLogScale} onChange={() => setUseLogScale(!useLogScale)} className="rounded text-sky-500 focus:ring-sky-500" /> 
                            Logarithmic Scale
                        </label>
                    </div>
                    <DecayChart 
                        chartData={chartData} 
                        useLogScale={useLogScale} 
                        theme={theme} 
                    />
                </div>
            )}
        </div>
    );
};

const getNowString = () => {
const now = new Date();
// Adjust to local timezone ISO string (YYYY-MM-DDTHH:mm)
const offset = now.getTimezoneOffset() * 60000;
const localIso = new Date(now - offset).toISOString().slice(0, 16);
return localIso;
};
const DecayTools = ({ radionuclides, preselectedNuclide, theme }) => {
const { settings } = React.useContext(SettingsContext);
const [activeCalculator, setActiveCalculator] = React.useState(() => localStorage.getItem('decayTools_activeTab') || 'standard');

const activityUnits = React.useMemo(() =>
settings.unitSystem === 'si'
? ['Bq', 'kBq', 'MBq', 'GBq', 'TBq', 'dps', 'dpm']
: ['µCi', 'mCi', 'Ci', 'dps', 'dpm'],
[settings.unitSystem]
);

const [std_selectedNuclide, setStd_selectedNuclide] = React.useState(() => { const savedSymbol = localStorage.getItem('decayCalc_nuclideSymbol'); if (!savedSymbol) return null; return radionuclides.find(n => n.symbol === savedSymbol) || null; });
const [std_calculationMode, setStd_calculationMode] = React.useState(() => localStorage.getItem('decayCalc_mode') || 'findRemaining');
const [std_initialActivity, setStd_initialActivity] = React.useState(() => localStorage.getItem('decayCalc_initialActivity') || '100');
// Unit State
const [std_initialUnit, setStd_initialUnit] = React.useState(() => localStorage.getItem('decayCalc_initialUnit') || activityUnits[1]);

const [std_initialDaughterActivity, setStd_initialDaughterActivity] = React.useState(() => localStorage.getItem('decayCalc_initialDaughterActivity') || '0');
const [std_branchingFraction, setStd_branchingFraction] = React.useState(() => localStorage.getItem('decayCalc_branchingFraction') || '1.0');

const [std_remainingActivity, setStd_remainingActivity] = React.useState(() => localStorage.getItem('decayCalc_remainingActivity') || '');
// Unit State
const [std_remainingUnit, setStd_remainingUnit] = React.useState(() => localStorage.getItem('decayCalc_remainingUnit') || activityUnits[1]);

const [std_timeElapsed, setStd_timeElapsed] = React.useState(() => localStorage.getItem('decayCalc_timeElapsed') || '1');
const [std_timeUnit, setStd_timeUnit] = React.useState(() => localStorage.getItem('decayCalc_timeUnit') || 'days');
const [std_useLogScale, setStd_useLogScale] = React.useState(() => JSON.parse(localStorage.getItem('decayCalc_useLogScale')) || false);

const [corr_nuclideSymbol, setCorr_nuclideSymbol] = React.useState(() => localStorage.getItem('corr_nuclideSymbol') || '');
const [corr_originalActivity, setCorr_originalActivity] = React.useState(() => localStorage.getItem('corr_originalActivity') || '10');
const [corr_originalActivityUnit, setCorr_originalActivityUnit] = React.useState(() => localStorage.getItem('corr_originalActivityUnit') || activityUnits[1]);
const [corr_originalDate, setCorr_originalDate] = React.useState(() => localStorage.getItem('corr_originalDate') || getNowString());
const [corr_targetDate, setCorr_targetDate] = React.useState(() => localStorage.getItem('corr_targetDate') || getNowString());

const [dtl_selectedNuclide, setDtl_selectedNuclide] = React.useState(() => { const saved = localStorage.getItem('dtl_nuclideSymbol'); return saved ? radionuclides.find(n => n.symbol === saved) : null; });
const [dtl_initialActivity, setDtl_initialActivity] = React.useState(() => localStorage.getItem('dtl_initialActivity') || '10');
const [dtl_initialUnit, setDtl_initialUnit] = React.useState(() => localStorage.getItem('dtl_initialUnit') || activityUnits[1]);
const [dtl_finalActivity, setDtl_finalActivity] = React.useState(() => localStorage.getItem('dtl_finalActivity') || '0.001');
const [dtl_finalUnit, setDtl_finalUnit] = React.useState(() => localStorage.getItem('dtl_finalUnit') || activityUnits[1]);
const [dtl_result, setDtl_result] = React.useState(null);
const [dtl_error, setDtl_error] = React.useState('');

// Unit safety checks
React.useEffect(() => { if (!activityUnits.includes(std_initialUnit)) setStd_initialUnit(activityUnits[1]); }, [activityUnits, std_initialUnit]);
React.useEffect(() => { if (!activityUnits.includes(std_remainingUnit)) setStd_remainingUnit(activityUnits[1]); }, [activityUnits, std_remainingUnit]);
React.useEffect(() => { if (!activityUnits.includes(corr_originalActivityUnit)) setCorr_originalActivityUnit(activityUnits[1]); }, [activityUnits, corr_originalActivityUnit]);
React.useEffect(() => { if (!activityUnits.includes(dtl_initialUnit)) setDtl_initialUnit(activityUnits[1]); }, [activityUnits, dtl_initialUnit]);
React.useEffect(() => { if (!activityUnits.includes(dtl_finalUnit)) setDtl_finalUnit(activityUnits[1]); }, [activityUnits, dtl_finalUnit]);

React.useEffect(() => { localStorage.setItem('decayTools_activeTab', activeCalculator); }, [activeCalculator]);
React.useEffect(() => { localStorage.setItem('corr_nuclideSymbol', corr_nuclideSymbol); localStorage.setItem('corr_originalActivity', corr_originalActivity); localStorage.setItem('corr_originalActivityUnit', corr_originalActivityUnit); localStorage.setItem('corr_originalDate', corr_originalDate); localStorage.setItem('corr_targetDate', corr_targetDate); }, [corr_nuclideSymbol, corr_originalActivity, corr_originalActivityUnit, corr_originalDate, corr_targetDate]);
React.useEffect(() => { localStorage.setItem('dtl_nuclideSymbol', dtl_selectedNuclide ? dtl_selectedNuclide.symbol : ''); localStorage.setItem('dtl_initialActivity', dtl_initialActivity); localStorage.setItem('dtl_initialUnit', dtl_initialUnit); localStorage.setItem('dtl_finalActivity', dtl_finalActivity); localStorage.setItem('dtl_finalUnit', dtl_finalUnit); }, [dtl_selectedNuclide, dtl_initialActivity, dtl_initialUnit, dtl_finalActivity, dtl_finalUnit]);

// Updated Persistence for Standard Calculator
React.useEffect(() => {
localStorage.setItem('decayCalc_nuclideSymbol', std_selectedNuclide ? std_selectedNuclide.symbol : '');
localStorage.setItem('decayCalc_mode', std_calculationMode);
localStorage.setItem('decayCalc_initialActivity', std_initialActivity);
localStorage.setItem('decayCalc_initialUnit', std_initialUnit); // Save
localStorage.setItem('decayCalc_initialDaughterActivity', std_initialDaughterActivity);
localStorage.setItem('decayCalc_branchingFraction', std_branchingFraction);
localStorage.setItem('decayCalc_remainingActivity', std_remainingActivity);
localStorage.setItem('decayCalc_remainingUnit', std_remainingUnit); // Save
localStorage.setItem('decayCalc_timeElapsed', std_timeElapsed);
localStorage.setItem('decayCalc_timeUnit', std_timeUnit);
localStorage.setItem('decayCalc_useLogScale', JSON.stringify(std_useLogScale));
}, [std_selectedNuclide, std_calculationMode, std_initialActivity, std_initialUnit, std_initialDaughterActivity, std_branchingFraction, std_remainingActivity, std_remainingUnit, std_timeElapsed, std_timeUnit, std_useLogScale]);

const handleStandardClear = () => {
setStd_selectedNuclide(null);
setStd_calculationMode('findRemaining');
setStd_initialActivity('100');
setStd_initialUnit(activityUnits[1]); // Reset unit
setStd_initialDaughterActivity('0');
setStd_branchingFraction('1.0');
setStd_remainingActivity('');
setStd_remainingUnit(activityUnits[1]); // Reset unit
setStd_timeElapsed('1');
setStd_timeUnit('days');
setStd_useLogScale(false);
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('decayCalc_')) {
        localStorage.removeItem(key);
    }
});
};

const handleCorrectionClear = () => {
setCorr_nuclideSymbol('');
setCorr_originalActivity('10');
setCorr_originalActivityUnit(activityUnits[1]);
setCorr_originalDate('2020-01-01');
setCorr_targetDate(getNowString());
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('corr_')) {
        localStorage.removeItem(key);
    }
});
};

const handleDecayToLimitClear = () => {
setDtl_selectedNuclide(null);
setDtl_initialActivity('10');
setDtl_initialUnit(activityUnits[1]);
setDtl_finalActivity('0.001');
setDtl_finalUnit(activityUnits[1]);
setDtl_result(null);
setDtl_error('');
Object.keys(localStorage).forEach(key => {
    if (key.startsWith('dtl_')) {
        localStorage.removeItem(key);
    }
});
};

const handleClearActiveCalculator = () => {
if (activeCalculator === 'standard') handleStandardClear();
else if (activeCalculator === 'correction') handleCorrectionClear();
else handleDecayToLimitClear();
};

return (
<div className="p-4 animate-fade-in">
    <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Decay Tools</h2>
            <ClearButton onClick={handleClearActiveCalculator} />
        </div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6">
            <button onClick={() => setActiveCalculator('standard')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${activeCalculator === 'standard' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Standard</button>
            <button onClick={() => setActiveCalculator('correction')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${activeCalculator === 'correction' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Correction</button>
            <button onClick={() => setActiveCalculator('toLimit')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${activeCalculator === 'toLimit' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>To Limit</button>
        </div>

        {activeCalculator === 'standard' &&
            <StandardDecayCalculator
                radionuclides={radionuclides}
                preselectedNuclide={preselectedNuclide}
                selectedNuclide={std_selectedNuclide}
                setSelectedNuclide={setStd_selectedNuclide}
                calculationMode={std_calculationMode}
                setCalculationMode={setStd_calculationMode}
                initialActivity={std_initialActivity}
                setInitialActivity={setStd_initialActivity}
                initialUnit={std_initialUnit}         // Pass
                setInitialUnit={setStd_initialUnit}   // Pass
                initialDaughterActivity={std_initialDaughterActivity}
                setInitialDaughterActivity={setStd_initialDaughterActivity}
                branchingFraction={std_branchingFraction}
                setBranchingFraction={setStd_branchingFraction}
                remainingActivity={std_remainingActivity}
                setRemainingActivity={setStd_remainingActivity}
                remainingUnit={std_remainingUnit}     // Pass
                setRemainingUnit={setStd_remainingUnit} // Pass
                timeElapsed={std_timeElapsed}
                setTimeElapsed={setStd_timeElapsed}
                timeUnit={std_timeUnit}
                setTimeUnit={setStd_timeUnit}
                useLogScale={std_useLogScale}
                setUseLogScale={setStd_useLogScale}
                theme={theme}
                activityUnits={activityUnits}         // Pass
            />
        }
        {activeCalculator === 'correction' && <SourceCorrectionCalculator radionuclides={radionuclides} nuclideSymbol={corr_nuclideSymbol} setNuclideSymbol={setCorr_nuclideSymbol} originalActivity={corr_originalActivity} setOriginalActivity={setCorr_originalActivity} originalActivityUnit={corr_originalActivityUnit} setOriginalActivityUnit={setCorr_originalActivityUnit} originalDate={corr_originalDate} setOriginalDate={setCorr_originalDate} targetDate={corr_targetDate} setTargetDate={setCorr_targetDate} activityUnits={activityUnits} />}
        {activeCalculator === 'toLimit' && <DecayToLimitCalculator radionuclides={radionuclides} selectedNuclide={dtl_selectedNuclide} setSelectedNuclide={setDtl_selectedNuclide} initialActivity={dtl_initialActivity} setInitialActivity={setDtl_initialActivity} initialUnit={dtl_initialUnit} setInitialUnit={setDtl_initialUnit} finalActivity={dtl_finalActivity} setFinalActivity={setDtl_finalActivity} finalUnit={dtl_finalUnit} setFinalUnit={setDtl_finalUnit} result={dtl_result} setResult={setDtl_result} error={dtl_error} setError={setDtl_error} activityUnits={activityUnits} theme={theme} />}
    </div>
</div>
);
};

// This component is a source correction calculator that computes the activity of a radioactive source on a future date by applying the principle of radioactive decay. It requires the original activity, the calibration date, and the radionuclide's half-life to perform the calculation.

const SourceCorrectionCalculator = ({ radionuclides, nuclideSymbol, setNuclideSymbol, originalActivity, setOriginalActivity, originalActivityUnit, setOriginalActivityUnit, originalDate, setOriginalDate, targetDate, setTargetDate, activityUnits }) => {
    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState('');
    
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();

    // MEMOIZED: Prevent recreating this object on every render
    const activityFactorsBq = React.useMemo(() => ({ 
        'Bq': 1, 'kBq': 1e3, 'MBq': 1e6, 'GBq': 1e9, 'TBq': 1e12, 
        'µCi': 3.7e4, 'mCi': 3.7e7, 'Ci': 3.7e10, 
        'dps': 1, 'dpm': 1/60 
    }), []);

    const nuclidesWithHalfLife = React.useMemo(() => 
        radionuclides.filter(r => r.halfLife !== 'Stable').sort((a,b) => a.name.localeCompare(b.name)), 
    [radionuclides]);

    const selectedNuclide = React.useMemo(() => 
        radionuclides.find(n => n.symbol === nuclideSymbol), 
    [nuclideSymbol, radionuclides]);

    React.useEffect(() => {
        if (!selectedNuclide) { setResult(null); return; }
        
        try {
            setError('');
            
            // 1. Validate Activity
            const A0 = safeParseFloat(originalActivity);
            if (isNaN(A0) || A0 < 0) throw new Error("Activity must be a positive number.");

            // 2. Validate Dates
            const start = new Date(originalDate);
            const end = new Date(targetDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                // Fail silently while user is typing/selecting dates
                setResult(null);
                return; 
            }

            // 3. Time Calculation
            const timeElapsed_ms = end - start;
            const timeElapsed_s = timeElapsed_ms / 1000;

            // Negative time is valid for back-calculating initial activity.

            // 4. Physics Calculation
            const T_half_s = parseHalfLifeToSeconds(selectedNuclide.halfLife);
            if (!T_half_s || T_half_s === Infinity) throw new Error("Cannot calculate decay for a stable nuclide.");

            const activity_Bq_0 = A0 * activityFactorsBq[originalActivityUnit];
            
            // Formula: A = A0 * (0.5)^(t / T_half)
            // Works for both positive t (decay) and negative t (growth/back-calc)
            const activity_Bq_t = activity_Bq_0 * Math.pow(0.5, timeElapsed_s / T_half_s);
            
            const finalActivity = activity_Bq_t / activityFactorsBq[originalActivityUnit];

            // 5. Smart Labeling
            const absSeconds = Math.abs(timeElapsed_s);
            const direction = timeElapsed_s >= 0 ? 'elapsed' : 'ago'; // Label for past/future
            
            let timeLabel = `${(absSeconds / 86400).toFixed(2)} days`;
            if (absSeconds < 60) {
                 timeLabel = `${absSeconds.toFixed(1)} seconds`;
            } else if (absSeconds < 3600) {
                 timeLabel = `${(absSeconds / 60).toFixed(1)} min`;
            } else if (absSeconds < 86400) {
                 timeLabel = `${(absSeconds / 3600).toFixed(2)} hours`;
            }

            setResult({ 
                currentActivity: finalActivity.toPrecision(4), 
                timeLabel: `${timeLabel} ${direction}`
            });

        } catch(e) {
            setError(e.message);
            setResult(null);
        }
    }, [selectedNuclide, originalActivity, originalActivityUnit, originalDate, targetDate, activityFactorsBq]);

    const handleSaveToHistory = () => {
        if (result && selectedNuclide) {
            const dateStr = new Date(targetDate).toLocaleString();
            addHistory({
                id: Date.now(),
                type: 'Source Correction',
                icon: ICONS.calculator,
                inputs: `${originalActivity} ${originalActivityUnit} ${selectedNuclide.symbol} @ ${new Date(originalDate).toLocaleDateString()}`,
                result: `${result.currentActivity} ${originalActivityUnit} (@ ${dateStr})`,
                view: VIEWS.CALCULATOR
            });
            addToast("Saved to history!");
        }
    };

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <ContextualNote type="info">Calculates radioactive decay between two dates. Enter a future "Target Date" to decay a source, or a past "Target Date" to back-calculate original activity.</ContextualNote>
            
            <div>
                <label className="text-sm font-bold text-slate-500 uppercase">Radionuclide</label>
                <div className="mt-1 min-h-[42px]">
                    {selectedNuclide ? (
                        <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} />
                    ) : (
                        <SearchableSelect options={nuclidesWithHalfLife} onSelect={setNuclideSymbol} placeholder="Search for a radionuclide..."/>
                    )}
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reference Activity</label>
                        <div className="flex gap-2">
                            <input type="number" value={originalActivity} onChange={e => setOriginalActivity(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"/>
                            <select value={originalActivityUnit} onChange={e => setOriginalActivityUnit(e.target.value)} className="w-24 p-2 rounded bg-slate-200 dark:bg-slate-600 border-none text-sm font-bold">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reference Date</label>
                        <input type="datetime-local" value={originalDate} onChange={e => setOriginalDate(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-sm"/>
                    </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Date</label>
                     <input type="datetime-local" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-sm"/>
                </div>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center font-bold">{error}</div>}

            {result && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-sky-100 dark:border-sky-900 mt-4 overflow-hidden animate-slide-up">
                     <div className="p-3 bg-sky-50 dark:bg-sky-900/30 flex justify-between items-center border-b border-sky-100 dark:border-sky-800">
                        <span className="font-bold text-sm uppercase text-sky-700 dark:text-sky-300">Corrected Activity</span>
                        <button onClick={handleSaveToHistory} className="text-sky-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{result.currentActivity} <span className="text-xl font-bold text-slate-500">{originalActivityUnit}</span></p>
                        <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-wide">{result.timeLabel}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const StandardDecayCalculator = ({
    radionuclides,
    selectedNuclide,
    setSelectedNuclide,
    calculationMode,
    setCalculationMode,
    initialActivity,
    setInitialActivity,
    initialUnit,
    setInitialUnit,
    initialDaughterActivity,
    setInitialDaughterActivity,
    branchingFraction,
    setBranchingFraction,
    remainingActivity,
    setRemainingActivity,
    remainingUnit,
    setRemainingUnit,
    timeElapsed,
    setTimeElapsed,
    timeUnit,
    setTimeUnit,
    useLogScale,
    setUseLogScale,
    theme,
    activityUnits
}) => {
    const [result, setResult] = React.useState(null);
    const [chartData, setChartData] = React.useState(null);
    const [error, setError] = React.useState('');
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();

    // --- Decoupled Daughter Unit State ---
    // Initialize with 'mCi' or whatever the parent defaults to, but keep independent
    const [daughterUnit, setDaughterUnit] = React.useState('mCi');

    // --- Branching Path State ---
    const [decayPaths, setDecayPaths] = React.useState([]);
    const [selectedPathIndex, setSelectedPathIndex] = React.useState(0);

    // --- Time Mode State ---
    const [timeMode, setTimeMode] = React.useState('duration');
    const [useUTC, setUseUTC] = React.useState(false);

    // Default Dates (Initialized to current time)
    const [referenceDate, setReferenceDate] = React.useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    const [targetDate, setTargetDate] = React.useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    const MODE_REMAINING = 'findRemaining';
    const MODE_TIME = 'findTime';
    const MODE_INITIAL = 'findInitial';
    const MODE_DAUGHTER = 'findDaughterActivity';

    const unitConversions = { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400, 'years': 31557600 };
    
    // Memoize factors to prevent re-calc
    const activityFactors = React.useMemo(() => ({
        'Bq': 1, 'kBq': 1e3, 'MBq': 1e6, 'GBq': 1e9, 'TBq': 1e12,
        'µCi': 3.7e4, 'uCi': 3.7e4, 'mCi': 3.7e7, 'Ci': 3.7e10, 'dps': 1, 'dpm': 1 / 60
    }), []);

    const sortedRadionuclides = React.useMemo(() => {
        const commonalityOrder = { 'Common': 3, 'Moderate': 2, 'Rare': 1 };
        return [...radionuclides].filter(r => r.halfLife !== 'Stable').sort((a, b) => {
            const orderA = commonalityOrder[a.commonality] || 0;
            const orderB = commonalityOrder[b.commonality] || 0;
            if (orderA !== orderB) { return orderB - orderA; }
            return a.name.localeCompare(b.name);
        });
    }, [radionuclides]);

    // --- Branching Path Detection ---
    React.useEffect(() => {
        if (selectedNuclide) {
            const dStr = selectedNuclide.daughter || '';
            const rawFraction = selectedNuclide.branchingFraction || 1.0;
            let newPaths = [];

            if (dStr.includes(' or ')) {
                const parts = dStr.split(' or ');
                const path1Name = parts[0].split('(')[0].trim();
                const path2Name = parts[1].split('(')[0].trim();

                newPaths.push({ name: path1Name, fraction: rawFraction, label: parts[0].trim() });
                
                const remainder = rawFraction < 1.0 ? (1.0 - rawFraction) : 0;
                newPaths.push({ name: path2Name, fraction: safeParseFloat(remainder.toFixed(4)), label: parts[1].trim() });
                
                setDecayPaths(newPaths);
                setSelectedPathIndex(0);
                if (calculationMode === MODE_DAUGHTER) setBranchingFraction(newPaths[0].fraction.toString());
            } 
            else {
                const cleanName = dStr.split('(')[0].trim();
                newPaths.push({ name: cleanName, fraction: rawFraction, label: dStr });
                setDecayPaths(newPaths);
                setSelectedPathIndex(0);
                
                if (calculationMode === MODE_DAUGHTER) {
                    if (selectedNuclide.symbol === 'Mo-99' && !selectedNuclide.branchingFraction) {
                        setBranchingFraction('0.875');
                    } else {
                        setBranchingFraction(rawFraction.toString());
                    }
                }
            }
        } else {
            setDecayPaths([]);
        }
    }, [selectedNuclide, calculationMode, setBranchingFraction]);

    const handlePathChange = (e) => {
        const idx = parseInt(e.target.value);
        setSelectedPathIndex(idx);
        if (decayPaths[idx]) {
            setBranchingFraction(decayPaths[idx].fraction.toString());
        }
    };

    const renderUnitField = (label, value, setter, unitVal, unitSetter, isValueEnabled) => (
        <div>
            <label className={`block text-sm font-medium ${isValueEnabled ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {label}
            </label>
            <div className="flex gap-2 mt-1">
                <input
                    type="number"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    disabled={!isValueEnabled}
                    className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                />
                <select
                    value={unitVal}
                    onChange={e => unitSetter(e.target.value)}
                    className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                    {activityUnits.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
            </div>
        </div>
    );

    const handleCalculate = React.useCallback(() => {
        if (!selectedNuclide) return;

        try {
            setError('');
            const T_half_seconds = parseHalfLifeToSeconds(selectedNuclide.halfLife);
            const lambda = Math.log(2) / T_half_seconds;

            // Safe Factor Lookup (Default to 1 if unit is somehow invalid to prevent NaN)
            const getFactor = (u) => activityFactors[u] || 1;

            const A0_Bq = safeParseFloat(initialActivity) * getFactor(initialUnit);
            const At_Bq = safeParseFloat(remainingActivity) * getFactor(remainingUnit);
            const br = safeParseFloat(branchingFraction) || 1.0;

            let t_seconds = 0;

            if (calculationMode === MODE_TIME) {
                // Time calculation logic happens below
            } else if (timeMode === 'date') {
                const startStr = useUTC ? referenceDate + 'Z' : referenceDate;
                const endStr = useUTC ? targetDate + 'Z' : targetDate;
                const start = new Date(startStr);
                const end = new Date(endStr);

                if (isNaN(start.getTime()) || isNaN(end.getTime())) { setError("Please enter valid dates."); setResult(null); return; }
                
                // Negative time (Reverse Decay) is scientifically valid.
                t_seconds = (end - start) / 1000;
            } else {
                const t_input = safeParseFloat(timeElapsed);
                if (isNaN(t_input)) return; 
                t_seconds = t_input * unitConversions[timeUnit];
            }

            let timeForChart_seconds = t_seconds;
            let displayLambda = lambda;
            let lambdaUnit = 's⁻¹';
            let plotA0_Bq = A0_Bq;

            if (lambda < 1e-6) { displayLambda = lambda * 31557600; lambdaUnit = 'yr⁻¹'; }
            else if (lambda < 1e-4) { displayLambda = lambda * 86400; lambdaUnit = 'd⁻¹'; }
            else if (lambda < 0.1) { displayLambda = lambda * 3600; lambdaUnit = 'hr⁻¹'; }

            // --- CALCULATION LOGIC ---

            if (calculationMode === MODE_REMAINING) {
                if (isNaN(A0_Bq)) throw new Error('Initial activity must be a valid number.');
                const finalActivity_Bq = A0_Bq * Math.exp(-lambda * t_seconds);
                setResult({
                    label: 'Remaining Activity',
                    value: (finalActivity_Bq / getFactor(remainingUnit)).toPrecision(4),
                    unit: remainingUnit,
                    lambdaVal: displayLambda.toPrecision(4),
                    lambdaUnit: lambdaUnit
                });
            } else if (calculationMode === MODE_TIME) {
                if (isNaN(A0_Bq) || isNaN(At_Bq) || A0_Bq <= 0 || At_Bq < 0) throw new Error('Activities must be valid numbers.');
                
                // Only throw "Remaining < Initial" error if we assume standard forward decay.
                // But for time elapsed, we generally assume A_t < A_0.
                if (At_Bq > A0_Bq) throw new Error('Remaining activity must be less than Initial for standard decay time.');

                const timeInSeconds = (-1 / lambda) * Math.log(At_Bq / A0_Bq);
                
                // Handle Infinite Time (decay to 0)
                if (!isFinite(timeInSeconds)) {
                     setResult({
                        label: 'Time Elapsed',
                        value: '∞',
                        unit: 'years',
                        lambdaVal: displayLambda.toPrecision(4),
                        lambdaUnit: lambdaUnit
                    });
                    timeForChart_seconds = 10 * T_half_seconds; // Just show a long plot
                } else {
                    const bestUnit = getBestHalfLifeUnit(timeInSeconds);
                    setResult({
                        label: 'Time Elapsed',
                        value: (timeInSeconds / unitConversions[bestUnit]).toPrecision(4),
                        unit: bestUnit,
                        lambdaVal: displayLambda.toPrecision(4),
                        lambdaUnit: lambdaUnit
                    });
                    timeForChart_seconds = timeInSeconds;
                }
                
            } else if (calculationMode === MODE_INITIAL) {
                if (isNaN(At_Bq)) throw new Error('Remaining activity must be a valid number.');
                // A0 = At / e^(-lambda*t)
                const initial_Bq = At_Bq / Math.exp(-lambda * t_seconds);
                plotA0_Bq = initial_Bq;
                setResult({
                    label: 'Initial Activity',
                    value: (initial_Bq / getFactor(initialUnit)).toPrecision(4),
                    unit: initialUnit,
                    lambdaVal: displayLambda.toPrecision(4),
                    lambdaUnit: lambdaUnit
                });
            } else if (calculationMode === MODE_DAUGHTER) {
                if (selectedNuclide.daughter.includes('/') && decayPaths.length < 2) throw new Error('Complex branching detected. Use Series Decay calculator.');
                
                const activePath = decayPaths[selectedPathIndex];
                const daughterName = activePath ? activePath.name : selectedNuclide.daughter.split('(')[0].trim();
                const daughter = radionuclides.find(n => normalizeString(n.name) === normalizeString(daughterName));
                if (!daughter) throw new Error('Daughter nuclide data not found.');

                const T_half_daughter_seconds = parseHalfLifeToSeconds(daughter.halfLife);
                const lambda2 = T_half_daughter_seconds === Infinity ? 0 : Math.log(2) / T_half_daughter_seconds;
                
                // Use daughterUnit factor
                // Force 0 if input is invalid/empty
                const rawDaughterInput = safeParseFloat(initialDaughterActivity);
                const A0_daughter_Bq = (isNaN(rawDaughterInput) ? 0 : rawDaughterInput) * getFactor(daughterUnit);

                if (isNaN(A0_Bq)) throw new Error("Invalid activity inputs.");

                const finalParentActivity_Bq = A0_Bq * Math.exp(-lambda * t_seconds);
                let finalDaughterActivity_Bq;

                // Bateman for 2 nuclides (Standard vs Special Case)
                if (Math.abs(lambda - lambda2) < 1e-12 * lambda) {
                    finalDaughterActivity_Bq = (A0_daughter_Bq * Math.exp(-lambda2 * t_seconds)) + (br * A0_Bq * lambda2 * t_seconds * Math.exp(-lambda2 * t_seconds));
                } else {
                    finalDaughterActivity_Bq = (A0_daughter_Bq * Math.exp(-lambda2 * t_seconds)) + (br * (lambda2 / (lambda2 - lambda)) * A0_Bq * (Math.exp(-lambda * t_seconds) - Math.exp(-lambda2 * t_seconds)));
                }

                 // SAFETY CHECK: If result is NaN or Infinity (e.g. Reverse Decay back to pre-existence), force to 0.
                if (!isFinite(finalDaughterActivity_Bq)) {
                    finalDaughterActivity_Bq = 0;
                }
                // Physically impossible to have negative activity (math artifact in reverse decay)
                finalDaughterActivity_Bq = Math.max(0, finalDaughterActivity_Bq);

                setResult({
                    parent: { name: selectedNuclide.name, value: (finalParentActivity_Bq / getFactor(initialUnit)).toPrecision(4) },
                    daughter: { name: daughter.name, value: (finalDaughterActivity_Bq / getFactor(daughterUnit)).toPrecision(4), isStable: T_half_daughter_seconds === Infinity },
                    lambdaVal: displayLambda.toPrecision(4),
                    lambdaUnit: lambdaUnit,
                    unit: initialUnit // Only used for parent label
                });
            }

            // --- CHART LOGIC (Safe & Complete) ---
            const plotTimeAbs = Math.abs(timeForChart_seconds);
            const bestChartUnit = getBestHalfLifeUnit(plotTimeAbs);
            const plotTimeConverted = plotTimeAbs / unitConversions[bestChartUnit];
            const labels = [], parentData = [], daughterData = [];
            const steps = 100;
            const plotFactor = getFactor(initialUnit); 
            const CUTOFF = plotA0_Bq * 1e-10;
            let labelDecimals = plotTimeConverted >= 100 ? 0 : 1;

            const tenHalfLives = 15 * T_half_seconds;
            const effectivePlotTime = Math.min(plotTimeAbs, tenHalfLives);

            for (let i = 0; i <= steps; i++) {
                let timePoint_seconds = (effectivePlotTime / steps) * i;
                if (i === steps) timePoint_seconds = plotTimeAbs; 

                const timePoint_display = timePoint_seconds / unitConversions[bestChartUnit];
                labels.push(safeParseFloat(timePoint_display.toFixed(labelDecimals)).toString());

                let p_val_bq = (plotA0_Bq * Math.exp(-lambda * timePoint_seconds));
                p_val_bq = Math.max(0, p_val_bq);
                if (useLogScale && p_val_bq < CUTOFF) p_val_bq = CUTOFF;
                parentData.push(p_val_bq / plotFactor);

                if (calculationMode === MODE_DAUGHTER) {
                     const activePath = decayPaths[selectedPathIndex];
                     const daughterName = activePath ? activePath.name : selectedNuclide.daughter.split('(')[0].trim();
                     const daughter = radionuclides.find(n => normalizeString(n.name) === normalizeString(daughterName));
                     
                     if (daughter) {
                        const T_half_daughter_seconds = parseHalfLifeToSeconds(daughter.halfLife);
                        const lambda2 = T_half_daughter_seconds === Infinity ? 0 : Math.log(2) / T_half_daughter_seconds;
                        
                        // Use daughterUnit factor for chart start point too
                        const rawDaughterInput = safeParseFloat(initialDaughterActivity);
                        const A0_daughter_Bq_Chart = (isNaN(rawDaughterInput) ? 0 : rawDaughterInput) * getFactor(daughterUnit);
                        let d_val_bq;

                        if (Math.abs(lambda - lambda2) < 1e-12 * lambda) {
                            d_val_bq = (A0_daughter_Bq_Chart * Math.exp(-lambda2 * timePoint_seconds)) + (br * plotA0_Bq * lambda2 * timePoint_seconds * Math.exp(-lambda2 * timePoint_seconds));
                        } else {
                            d_val_bq = (A0_daughter_Bq_Chart * Math.exp(-lambda2 * timePoint_seconds)) + (br * (lambda2 / (lambda2 - lambda)) * plotA0_Bq * (Math.exp(-lambda * timePoint_seconds) - Math.exp(-lambda2 * timePoint_seconds)));
                        }
                        
                        // Safety Checks for Chart Data
                        if (!isFinite(d_val_bq)) d_val_bq = 0;
                        d_val_bq = Math.max(0, d_val_bq);

                        if (useLogScale && d_val_bq < CUTOFF) d_val_bq = CUTOFF;
                        
                        // Normalize chart to Parent's unit for consistency in visualization
                        daughterData.push(d_val_bq / plotFactor);
                     }
                }
            }

            setChartData({
                labels, parentData, daughterData: daughterData.length > 0 ? daughterData : null,
                timeUnit: bestChartUnit, parentName: selectedNuclide.name,
                daughterName: calculationMode === MODE_DAUGHTER ? (decayPaths[selectedPathIndex]?.name || selectedNuclide.daughter.split('(')[0].trim()) : null,
                yAxisLabel: `Activity (${initialUnit})`
            });

        } catch (e) { setError(e.message); setResult(null); setChartData(null); }
    }, [selectedNuclide, calculationMode, initialActivity, initialUnit, remainingActivity, remainingUnit, timeElapsed, timeUnit, initialDaughterActivity, daughterUnit, branchingFraction, timeMode, targetDate, referenceDate, useUTC, radionuclides, activityFactors, useLogScale, decayPaths, selectedPathIndex]);

    React.useEffect(() => {
        if (timeMode === 'date' && initialActivity && referenceDate && targetDate) { handleCalculate(); }
    }, [referenceDate, targetDate, timeMode, useUTC]);

    React.useEffect(() => {
        if (selectedNuclide) { handleCalculate(); } 
        else { setResult(null); setChartData(null); setError(''); }
    }, [handleCalculate, selectedNuclide]);

    const handleSaveToHistory = () => {
        if (result && selectedNuclide) {
            let inputStr = '';
            let resultStr = '';
            const getTimeStr = () => timeMode === 'date' ? `at ${new Date(targetDate).toLocaleDateString()}` : `${timeElapsed} ${timeUnit}`;

            if (calculationMode === MODE_REMAINING) {
                inputStr = `${initialActivity} ${initialUnit} ${selectedNuclide.symbol} (${getTimeStr()})`;
                resultStr = `${result.value} ${result.unit}`;
            } else if (calculationMode === MODE_TIME) {
                inputStr = `${initialActivity} ${initialUnit} → ${remainingActivity} ${remainingUnit}`;
                resultStr = `${result.value} ${result.unit}`;
            } else if (calculationMode === MODE_INITIAL) {
                inputStr = `${remainingActivity} ${remainingUnit} remaining (${getTimeStr()} ago)`;
                resultStr = `${result.value} ${result.unit}`;
            } else if (calculationMode === MODE_DAUGHTER) {
                inputStr = `${initialActivity} ${initialUnit} ${selectedNuclide.symbol} → ${result.daughter.name}`;
                resultStr = `D: ${result.daughter.value} ${daughterUnit}`;
            }
            addHistory({ id: Date.now(), type: 'Decay Calc', icon: ICONS.calculator, inputs: inputStr, result: resultStr, view: VIEWS.CALCULATOR });
            addToast('Saved to history!');
        }
    };

    const handleKeyDown = (e) => { if (e.key === 'Enter') handleCalculate(); };

    return (
        <div className="space-y-4">
            <ContextualNote type="info">Calculates remaining activity, time, or daughter products.</ContextualNote>
            
            {/* 1. Nuclide Selection */}
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Radionuclide</label>
                <div className="mt-1 min-h-[42px]">
                    {selectedNuclide ? (
                        <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => { setSelectedNuclide(null); }} />
                    ) : (
                        <SearchableSelect options={sortedRadionuclides} onSelect={(symbol) => { const n = sortedRadionuclides.find(r => r.symbol === symbol); setSelectedNuclide(n); }} placeholder="Search for a radionuclide..." />
                    )}
                </div>
            </div>

            {/* Mode Selection */}
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Calculate</label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                    {[MODE_REMAINING, MODE_TIME, MODE_INITIAL, MODE_DAUGHTER].map(mode => (
                        <label key={mode} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="calcMode" value={mode} checked={calculationMode === mode} onChange={() => setCalculationMode(mode)} className="form-radio h-4 w-4 text-sky-600" />
                            <span className="text-sm">{{ [MODE_REMAINING]: 'Remaining Activity', [MODE_TIME]: 'Time Elapsed', [MODE_INITIAL]: 'Initial Activity', [MODE_DAUGHTER]: 'Daughter Activity' }[mode]}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                
                {renderUnitField("Initial Activity", initialActivity, setInitialActivity, initialUnit, setInitialUnit, calculationMode !== MODE_INITIAL)}

                {calculationMode !== MODE_DAUGHTER &&
                    renderUnitField("Remaining Activity", remainingActivity, setRemainingActivity, remainingUnit, setRemainingUnit, calculationMode === MODE_TIME || calculationMode === MODE_INITIAL)
                }

                {/* Use Daughter Unit State here */}
                {calculationMode === MODE_DAUGHTER && renderUnitField("Initial Daughter Activity", initialDaughterActivity, setInitialDaughterActivity, daughterUnit, setDaughterUnit, true)}

                {/* --- Branching Path Selector --- */}
                {calculationMode === MODE_DAUGHTER && decayPaths.length > 1 && (
                    <div className="col-span-1 md:col-span-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                        <label className="block text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">Select Decay Path</label>
                        <select value={selectedPathIndex} onChange={handlePathChange} className="w-full p-2 text-sm rounded border-amber-300 bg-white dark:bg-slate-800 focus:ring-amber-500">
                            {decayPaths.map((path, idx) => (
                                <option key={idx} value={idx}>{path.label} ({(path.fraction * 100).toFixed(2)}%)</option>
                            ))}
                        </select>
                    </div>
                )}

                {calculationMode === MODE_DAUGHTER && (
                    <div>
                        <Tooltip text="The fraction of parent decays that turn into this daughter.">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 cursor-help underline decoration-dotted">Branching Fraction</label>
                        </Tooltip>
                        <div className="flex gap-2 mt-1">
                            <input type="number" value={branchingFraction} onChange={e => setBranchingFraction(e.target.value)} step="0.01" min="0" max="1" className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                    </div>
                )}

                {/* Time Input Section */}
                {calculationMode !== MODE_TIME && (
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Time Elapsed</label>
                            <div className="flex bg-slate-200 dark:bg-slate-700 rounded p-0.5">
                                <button onClick={() => setTimeMode('duration')} className={`px-2 py-0.5 text-xs rounded ${timeMode === 'duration' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Duration</button>
                                <button onClick={() => setTimeMode('date')} className={`px-2 py-0.5 text-xs rounded ${timeMode === 'date' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Date</button>
                            </div>
                        </div>

                        {timeMode === 'duration' ? (
                            <div className="flex gap-2">
                                <input type="number" value={timeElapsed} onChange={e => setTimeElapsed(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                                <select value={timeUnit} onChange={e => setTimeUnit(e.target.value)} className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                    {['minutes', 'hours', 'days', 'years'].map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-end">
                                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={useUTC} onChange={e => setUseUTC(e.target.checked)} className="form-checkbox h-3 w-3 rounded text-sky-600" />
                                        Calculate in UTC (Ignore DST)
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Reference (Start) {useUTC ? '(UTC)' : '(Local)'}</label>
                                        <input type="datetime-local" value={referenceDate} onChange={e => setReferenceDate(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500">Target (End) {useUTC ? '(UTC)' : '(Local)'}</label>
                                        <input type="datetime-local" value={targetDate} onChange={e => setTargetDate(e.target.value)} onKeyDown={handleKeyDown} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 text-center animate-fade-in">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-600 pb-1">
                        <span>Decay Constant (λ): {result.lambdaVal} {result.lambdaUnit}</span>
                    </div>
                    {result.label ? (
                        <div className="flex items-center justify-center">
                            <div className="text-lg font-bold text-center flex-grow">
                                <span className="font-semibold block text-sm text-slate-500 dark:text-slate-400">{result.label}</span>
                                <span>{result.value} {result.unit}</span>
                            </div>
                            <CopyButton textToCopy={result.value} />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-left">
                                    <span className="font-semibold block text-sm text-slate-500 dark:text-slate-400">Remaining {result.parent.name}</span>
                                    <span>{result.parent.value} {result.unit}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-600 pt-2">
                                <div className="text-lg font-bold text-left">
                                    <span className="font-semibold block text-sm text-slate-500 dark:text-slate-400">{result.daughter.name} {result.daughter.isStable ? "(Stable)" : ""}</span>
                                    {/* Display with Daughter's unit */}
                                    <span>{result.daughter.value} {daughterUnit}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="text-right mt-2">
                        <button onClick={handleSaveToHistory} className="text-xs text-sky-600 dark:text-sky-400 hover:underline">Save Result</button>
                    </div>
                </div>
            )}

            {chartData && (
                <>
                    <div className="flex justify-end mt-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={useLogScale} onChange={() => setUseLogScale(!useLogScale)} className="form-checkbox h-4 w-4 rounded text-sky-600" /> Use Logarithmic Scale
                        </label>
                    </div>
                    <DecayChart chartData={chartData} useLogScale={useLogScale} theme={theme} />
                </>
            )}
        </div>
    );
};

const AirborneCalculator = ({ radionuclides, nuclideSymbol, setNuclideSymbol, releaseActivity, setReleaseActivity, activityUnit, setActivityUnit, activityUnits, roomVolume, setRoomVolume, volumeUnit, setVolumeUnit, ventilationRate, setVentilationRate, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // Filter only nuclides that have DAC data
    const dosimetryNuclides = React.useMemo(() => 
        radionuclides.filter(n => n.dosimetry?.DAC).sort((a, b) => a.name.localeCompare(b.name)), 
    [radionuclides]);
    
    const selectedNuclide = React.useMemo(() => 
        dosimetryNuclides.find(n => n.symbol === nuclideSymbol), 
    [nuclideSymbol, dosimetryNuclides]);

    // Move constants outside or memoize to avoid re-creation
    const toMicroCurie = React.useMemo(() => ({ 
        'pCi': 1e-6, 'nCi': 1e-3, 'µCi': 1, 'mCi': 1e3, 'Ci': 1e6, 
        'Bq': 2.7e-5, 'kBq': 0.027, 'MBq': 27, 'GBq': 27000 
    }), []);

    const volConversions = React.useMemo(() => ({ 
        'm³': 1e6, 'L': 1000, 'ft³': 28316.8 
    }), []);

    React.useEffect(() => {
        if (!selectedNuclide) { setResult(null); return; }
        
        try {
            setError('');
            const act = safeParseFloat(releaseActivity); 
            const vol = safeParseFloat(roomVolume); 
            const vent = safeParseFloat(ventilationRate);
            
            if ([act, vol, vent].some(isNaN) || act < 0 || vol <= 0 || vent < 0) {
                 // Don't throw error immediately on empty inputs, just wait
                 if (releaseActivity && roomVolume) throw new Error("Inputs must be valid numbers.");
                 setResult(null);
                 return;
            }

            // 1. Identify the Most Restrictive (Lowest) DAC
            const dacData = selectedNuclide.dosimetry.DAC;
            let bestDAC = Infinity;
            let bestType = 'Unknown';

            // Iterate over keys like 'inhalation_D', 'inhalation_W', 'inhalation_Y'
            Object.entries(dacData).forEach(([key, val]) => {
                if (typeof val === 'number' && val > 0 && val < bestDAC) {
                    bestDAC = val;
                    // Format key for display (e.g. "inhalation_Y" -> "Type Y")
                    bestType = key.replace('inhalation_', 'Type ').replace('inhalation', 'Generic');
                }
            });

            if (bestDAC === Infinity) throw new Error(`Valid DAC value not found for ${selectedNuclide.name}.`);

            // 2. Calculate Concentrations
            const act_uCi = act * toMicroCurie[activityUnit];
            const vol_mL = vol * volConversions[volumeUnit];
            
            const initialConc_uCi_mL = act_uCi / vol_mL;
            
            // 3. Calculate Time to 1 DAC
            // Formula: t = (-1/lambda) * ln(Target / Initial)
            // lambda = ventilation rate (ACH)
            let time_to_1_dac_hr = 0;
            
            if (initialConc_uCi_mL > bestDAC) {
                 if (vent > 0) {
                     time_to_1_dac_hr = (-1 / vent) * Math.log(bestDAC / initialConc_uCi_mL);
                 } else {
                     time_to_1_dac_hr = Infinity; // No ventilation = stays forever
                 }
            }

            setResult({
                initialConc: initialConc_uCi_mL.toExponential(3),
                dacValue: bestDAC.toExponential(2),
                dacType: bestType, // New field for safety awareness
                dacMultiple: (initialConc_uCi_mL / bestDAC).toPrecision(3),
                time_to_1_dac_hr: time_to_1_dac_hr === Infinity ? '∞' : time_to_1_dac_hr.toPrecision(3)
            });

        } catch (e) { 
            setError(e.message); 
            setResult(null); 
        }
    }, [selectedNuclide, releaseActivity, activityUnit, roomVolume, volumeUnit, ventilationRate, toMicroCurie, volConversions]);

    const handleSaveToHistory = () => {
        if (result) {
            addHistory({
                id: Date.now(),
                type: 'Airborne Release',
                icon: ICONS.radon || ICONS.activity, // Fallback if radon icon missing
                inputs: `${releaseActivity} ${activityUnit} in ${roomVolume} ${volumeUnit}`,
                result: `${result.dacMultiple}x DAC (${result.dacType})`,
                view: VIEWS.OPERATIONAL_HP
            });
            addToast("Calculation saved to history!");
        }
    };

    return (
        <div className="space-y-4 max-w-lg mx-auto">
            <ContextualNote type="info">Calculates the initial airborne concentration following a release and estimating the time required to clear the room to 1 DAC via dilution ventilation.</ContextualNote>
            
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Radionuclide</label>
                <div className="mt-1">
                    {selectedNuclide ? 
                        <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} /> : 
                        <SearchableSelect options={dosimetryNuclides} onSelect={setNuclideSymbol} placeholder="Select a nuclide..." />
                    }
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Released Activity</label>
                    <div className="flex gap-2">
                        <input type="number" value={releaseActivity} onChange={e => setReleaseActivity(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                        <select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="w-24 p-2 rounded bg-slate-200 dark:bg-slate-600 border-none text-sm font-bold">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Room Volume</label>
                    <div className="flex gap-2">
                        <input type="number" value={roomVolume} onChange={e => setRoomVolume(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                        <select value={volumeUnit} onChange={e => setVolumeUnit(e.target.value)} className="w-24 p-2 rounded bg-slate-200 dark:bg-slate-600 border-none text-sm font-bold">
                            <option value="m³">m³</option>
                            <option value="L">L</option>
                            <option value="ft³">ft³</option>
                        </select>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ventilation Rate (ACH)</label>
                    <input type="number" value={ventilationRate} onChange={e => setVentilationRate(e.target.value)} placeholder="Air Changes per Hour (e.g. 6)" className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600" />
                </div>
            </div>

            <ContextualNote type="warning">
                <strong>Safety Assumption:</strong> Uses the most restrictive DAC ({result?.dacType || 'Lowest'}) found for this nuclide. Model assumes perfect, instantaneous mixing.
            </ContextualNote>

            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

            {result && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-sky-100 dark:border-sky-900 mt-6 overflow-hidden animate-slide-up">
                    <div className="p-3 bg-sky-50 dark:bg-sky-900/30 flex justify-between items-center border-b border-sky-100 dark:border-sky-800">
                        <span className="font-bold text-sm uppercase text-sky-700 dark:text-sky-300">Airborne Hazards</span>
                        <button onClick={handleSaveToHistory} className="text-sky-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5" /></button>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4 text-center border-b border-slate-100 dark:border-slate-700">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Initial Conc.</p>
                            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.initialConc} µCi/mL</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Limit ({result.dacType})</p>
                            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.dacValue} µCi/mL</p>
                        </div>
                    </div>

                    <div className="p-6 text-center space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase">Initial Hazard</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className={`text-4xl font-black ${parseFloat(result.dacMultiple) > 1 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {result.dacMultiple}x
                                </span>
                                <span className="text-xl font-bold text-slate-500">DAC</span>
                            </div>
                        </div>
                        
                        {parseFloat(result.dacMultiple) > 1 && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-medium text-slate-400 uppercase">Time to Clear (1 DAC)</p>
                                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{result.time_to_1_dac_hr} hours</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Internal Helper: Result Badge ---
const Badge = ({ label, pass, limit }) => (
    <div className={`flex justify-between items-center px-2 py-1 rounded text-[10px] font-bold ${pass ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'} mt-1`}>
        <span>{label}</span>
        <span className="ml-2">{pass ? 'PASS' : 'FAIL'} <span className="opacity-60 font-normal">(&lt;{limit})</span></span>
    </div>
);

const SurfaceContaminationCalculator = ({ 
    radionuclides, nuclideSymbol, setNuclideSymbol, 
    staticData, setStaticData, 
    wipeGrossCpm, setWipeGrossCpm, 
    wipeBackgroundCpm, setWipeBackgroundCpm, 
    instrumentEff, setInstrumentEff, 
    smearEff, setSmearEff, 
    probeArea, setProbeArea, 
    result, setResult, error, setError 
}) => {
    
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();

    // --- Derived Data ---
    const surveyNuclides = React.useMemo(() => 
        radionuclides.filter(n => n.regGuideCategory && n.ansiCategory).sort((a,b) => a.name.localeCompare(b.name)), 
    [radionuclides]);

    const selectedNuclide = React.useMemo(() => 
        surveyNuclides.find(n => n.symbol === nuclideSymbol), 
    [nuclideSymbol, surveyNuclides]);

    // --- Helper: Presets ---
    const EfficiencyPresets = ({ onSelect }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {[ 
                { label: 'Pancake (10%)', val: '10' }, 
                { label: 'Alpha (35%)', val: '35' }, 
                { label: 'NaI (20%)', val: '20' } 
            ].map(p => (
                <button 
                    key={p.label} 
                    onClick={() => onSelect(p.val)} 
                    className="px-2 py-1 text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-sky-100 dark:hover:bg-sky-900 rounded border border-slate-300 dark:border-slate-600 whitespace-nowrap flex-shrink-0 transition-colors"
                >
                    {p.label}
                </button>
            ))}
        </div>
    );

    // --- MAIN CALCULATION ---
    React.useEffect(() => {
        try {
            setError('');
            if (!selectedNuclide) { setResult(null); return; }

            // 1. Parse Inputs
            const sPoints = staticData ? staticData.split(/[\s,;\n]+/).filter(d => d.trim() !== '' && !isNaN(d)).map(Number) : [];
            // Note: Your wrapper uses "wipeGrossCpm" but local vars used "wipeGross". 
            // I'm using the props passed in directly now.
            
            const wGross = safeParseFloat(wipeGrossCpm);
            const wBkg = safeParseFloat(wipeBackgroundCpm);
            const wEff = safeParseFloat(instrumentEff);
            const wFactor = safeParseFloat(smearEff);
            
            // Note: For Static, we assume instrumentEff applies to both unless separated? 
            // Usually Static and Wipe use different efficiencies. 
            // In the Wrapper, you pass 'sc_instrumentEff' to both 'instrumentEff' prop here?
            // If so, user changes one, both change. 
            // Recommendation: Add separate staticEff prop if needed, or share for now.
            // Assuming 'instrumentEff' is used for Wipes, and we reuse it for Static for simplicity 
            // unless 'staticEff' prop is added.
            
            const sBkg = 50; // Hardcoded default or needs prop? 
            // The wrapper passes 'sc_wipeBackgroundCpm'. 
            // It seems we might be missing a dedicated 'staticBkg' prop in the wrapper. 
            // For now, I will use wipeBackgroundCpm as a fallback for static bkg.
            
            const area = safeParseFloat(probeArea);

            let removableDPM = null;
            let totalAvgDPM = null;
            let totalMaxDPM = null;

            // 2. Calculate Removable (Wipe)
            if (wipeGrossCpm && wipeBackgroundCpm && instrumentEff) {
                if (wEff <= 0) throw new Error("Efficiency must be positive.");
                if (wFactor <= 0 || wFactor > 1) throw new Error("Smear Factor must be 0-1.");

                const netWipe = Math.max(0, wGross - wBkg);
                const totalWipeEff = (wEff / 100) * wFactor;
                removableDPM = netWipe / totalWipeEff;
            }

            // 3. Calculate Total (Static List)
            if (sPoints.length > 0 && instrumentEff && area > 0) {
                const sEffDec = wEff / 100; // Reusing instrumentEff for now
                
                const dpmValues = sPoints.map(gross => {
                    const net = Math.max(0, gross - wBkg); // Reusing Bkg
                    return (net / sEffDec) * (100 / area);
                });

                const sum = dpmValues.reduce((a, b) => a + b, 0);
                totalAvgDPM = sum / dpmValues.length;
                totalMaxDPM = Math.max(...dpmValues);
            }

            // 4. Compare Limits
            if (removableDPM !== null || totalAvgDPM !== null) {
                const rg = REG_GUIDE_1_86_LIMITS?.[selectedNuclide.regGuideCategory] || { removable: 0, total: 0 };
                const ansi = ANSI_13_12_LIMITS?.[selectedNuclide.ansiCategory] || { removable: 0, total: 0 };

                setResult({
                    removable: removableDPM,
                    total_avg: totalAvgDPM,
                    total_max: totalMaxDPM,
                    count: sPoints.length,
                    rg: {
                        removable_pass: removableDPM === null || removableDPM <= rg.removable,
                        total_pass: totalAvgDPM === null || totalAvgDPM <= rg.total,
                        max_pass: totalMaxDPM === null || totalMaxDPM <= (rg.total * 3),
                        removable_limit: rg.removable,
                        total_limit: rg.total
                    },
                    ansi: {
                        removable_pass: removableDPM === null || removableDPM <= ansi.removable,
                        total_pass: totalAvgDPM === null || totalAvgDPM <= ansi.total,
                        removable_limit: ansi.removable,
                        total_limit: ansi.total
                    }
                });
            } else {
                setResult(null);
            }

        } catch (e) {
            setError(e.message);
            setResult(null);
        }
    }, [selectedNuclide, staticData, wipeGrossCpm, wipeBackgroundCpm, instrumentEff, smearEff, probeArea, setResult, setError]);

    const handleSaveToHistory = () => {
        if (result && selectedNuclide) {
            addHistory({
                id: Date.now(),
                type: 'Surface Survey',
                icon: ICONS.warning,
                inputs: `${selectedNuclide.symbol}`,
                result: `Wipe: ${result.removable?.toFixed(0) || '-'}, Static Avg: ${result.total_avg?.toFixed(0) || '-'}`,
                view: VIEWS.OPERATIONAL_HP
            });
            addToast("Saved!");
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
             <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Contaminant of Concern</label>
                {selectedNuclide ? (
                    <div className="flex justify-between items-center bg-sky-50 dark:bg-sky-900/30 p-3 rounded-lg border border-sky-100 dark:border-sky-800">
                        <span className="font-bold text-sky-800 dark:text-sky-200">{selectedNuclide.name}</span>
                        <button onClick={() => setNuclideSymbol('')} className="text-xs text-slate-500 hover:text-red-500">Change</button>
                    </div>
                ) : (
                    <SearchableSelect options={surveyNuclides} onSelect={setNuclideSymbol} placeholder="Select Nuclide..." />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* STATIC SECTION */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Icon path={ICONS.activity} className="w-5 h-5"/> Direct Frisk (Static)</h3>
                    
                    <label className="block text-xs font-bold text-slate-500">Gross CPM Data Points</label>
                    <textarea value={staticData} onChange={e => setStaticData(e.target.value)} rows="3" className="w-full mt-1 p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono text-xs shadow-inner" placeholder="Paste list: 100, 120, 95..."></textarea>
                    
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                             <label className="text-xs font-bold text-slate-500">Probe Area (cm²)</label>
                             <div className="flex">
                                <input type="number" value={probeArea} onChange={e => setProbeArea(e.target.value)} className="w-full p-2 rounded-l border-slate-200 dark:bg-slate-700 dark:border-slate-600" />
                                <select onChange={e => setProbeArea(e.target.value)} className="bg-slate-200 dark:bg-slate-600 text-xs px-1 rounded-r border-l border-slate-300 dark:border-slate-500" value={probeArea}>
                                    <option value="100">100</option>
                                    <option value="15">15</option>
                                </select>
                             </div>
                        </div>
                    </div>
                </div>

                {/* WIPE SECTION */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"><Icon path={ICONS.paper} className="w-5 h-5"/> Wipe Test</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-slate-500">Gross CPM</label>
                            <input type="number" value={wipeGrossCpm} onChange={e => setWipeGrossCpm(e.target.value)} className="w-full p-2 rounded border-slate-200 dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Bkg (cpm)</label>
                            <input type="number" value={wipeBackgroundCpm} onChange={e => setWipeBackgroundCpm(e.target.value)} className="w-full p-2 rounded border-slate-200 dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <label className="text-xs font-bold text-slate-500">Efficiency (%)</label>
                        <input type="number" value={instrumentEff} onChange={e => setInstrumentEff(e.target.value)} className="w-full p-2 rounded border-slate-200 dark:bg-slate-700 dark:border-slate-600" />
                        <EfficiencyPresets onSelect={setInstrumentEff} />
                    </div>
                    <div className="mt-3">
                         <label className="text-xs font-bold text-slate-500">Smear Factor (0-1)</label>
                         <input type="number" value={smearEff} onChange={e => setSmearEff(e.target.value)} className="w-full p-2 rounded border-slate-200 dark:bg-slate-700 dark:border-slate-600" placeholder="0.1" />
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {result && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-slate-200 dark:border-slate-600 overflow-hidden animate-slide-up">
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 flex justify-between items-center">
                         <span className="font-bold text-sm uppercase text-slate-500">Results (dpm/100cm²)</span>
                         <button onClick={handleSaveToHistory} className="text-slate-400 hover:text-sky-500 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5" /></button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-100 dark:border-slate-700">
                             <p className="text-xs font-bold text-slate-400 uppercase">Static Average</p>
                             <p className="text-2xl font-black text-slate-800 dark:text-white my-1">{result.total_avg !== null ? result.total_avg.toFixed(0) : '-'}</p>
                             {result.total_avg !== null && <Badge label="Reg Guide" pass={result.rg.total_pass} limit={result.rg.total_limit} />}
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-100 dark:border-slate-700">
                             <p className="text-xs font-bold text-slate-400 uppercase">Static Max</p>
                             <p className="text-2xl font-black text-slate-800 dark:text-white my-1">{result.total_max !== null ? result.total_max.toFixed(0) : '-'}</p>
                             {result.total_max !== null && <Badge label="Reg Guide (3x)" pass={result.rg.max_pass} limit={result.rg.total_limit * 3} />}
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-100 dark:border-slate-700">
                             <p className="text-xs font-bold text-slate-400 uppercase">Removable</p>
                             <p className="text-2xl font-black text-slate-800 dark:text-white my-1">{result.removable !== null ? result.removable.toFixed(0) : '-'}</p>
                             {result.removable !== null && <Badge label="Reg Guide" pass={result.rg.removable_pass} limit={result.rg.removable_limit} />}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- HELPER: Beta Range Physics (Katz-Penfold) ---
// Outside component to prevent re-creation on every render
const calculateBetaRange = (energyMeV) => {
    if (!energyMeV || energyMeV <= 0) return 0;
    
    // Result in g/cm² (mass density)
    // Low Energy (< 0.8 MeV): Exponential curve
    // High Energy (> 0.8 MeV): Linear approximation (Feather's Rule / K-P)
    if (energyMeV < 0.8) {
        const exponent = 1.265 - (0.0954 * Math.log(energyMeV));
        return (412 * Math.pow(energyMeV, exponent)) / 1000;
    } else {
        return ((530 * energyMeV) - 106) / 1000;
    }
};

const DetectorResponseCalculator = ({ radionuclides, nuclideSymbol, setNuclideSymbol, activity, setActivity, activityUnit, setActivityUnit, distance, setDistance, distanceUnit, setDistanceUnit, detectorType, setDetectorType, shieldMaterial, setShieldMaterial, shieldThickness, setShieldThickness, shieldThicknessUnit, setShieldThicknessUnit, surfaceEff, setSurfaceEff, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();

    // --- CONFIG ---
    const DETECTORS = React.useMemo(() => ({
        'nai_1x1': { label: '1" x 1" NaI(Tl)', type: 'gamma_only', refCpmPerMicroR: 175, radius_cm: 1.27 },
        'nai_2x2': { label: '2" x 2" NaI(Tl)', type: 'gamma_only', refCpmPerMicroR: 900, radius_cm: 2.54 },
        'gm_pancake': { label: 'Pancake GM (Ludlum 44-9)', type: 'mix', refBetaEff: 0.20, alphaEff: 0.15, gammaCpmPerMicroR: 3.3, radius_cm: 2.2 },
        'zns_alpha': { label: 'ZnS(Ag) Scintillator', type: 'alpha_only', alphaEff: 0.25, radius_cm: 2.5 }
    }), []);
            
    // Updated Fallbacks to be Conservative (Co-60 energies)
    // Old Lead value (0.6) was too thin for high-energy emitters.
    const FALLBACK_HVL = React.useMemo(() => ({ 
        'Lead': 1.2,      // Conservative (approx Co-60)
        'Steel': 2.2, 
        'Aluminum': 6.5, 
        'Water': 14.0 
    }), []);

    // Conversion Factors
    const BQ_TO_CI = 1 / 3.7e10; 
    const activityFactorsCi = React.useMemo(() => ({
        'Ci': 1, 'mCi': 1e-3, 'µCi': 1e-6,
        'TBq': BQ_TO_CI * 1e12, 'GBq': BQ_TO_CI * 1e9, 'MBq': BQ_TO_CI * 1e6, 'kBq': BQ_TO_CI * 1e3, 'Bq': BQ_TO_CI
    }), [BQ_TO_CI]);

    const distanceFactorsM = { 'mm': 0.001, 'cm': 0.01, 'm': 1, 'in': 0.0254, 'ft': 0.3048 };
    const thicknessFactorsCm = { 'mm': 0.1, 'cm': 1, 'in': 2.54 };

    // --- Helpers ---
    const parseE = (str) => {
        if (!str) return 0;
        const parts = str.split(' ');
        let val = safeParseFloat(parts[0]);
        if (str.toLowerCase().includes('kev')) val /= 1000;
        return val;
    };

    const availableNuclides = React.useMemo(() => {
        const det = DETECTORS[detectorType];
        if (det.type === 'alpha_only') return radionuclides.filter(n => n.emissionEnergies?.alpha?.length > 0);
        if (det.type === 'gamma_only') return radionuclides.filter(n => n.gammaConstant);
        return radionuclides;
    }, [radionuclides, detectorType, DETECTORS]);

    const selectedNuclide = React.useMemo(() => radionuclides.find(n => n.symbol === nuclideSymbol), [nuclideSymbol, radionuclides]);

    // --- RECALCULATION TRIGGER ---
    React.useEffect(() => {
        try {
            setError('');
            if (!selectedNuclide) { setResult(null); return; }

            const A_val = safeParseFloat(activity);
            const d_val = safeParseFloat(distance);
            const t_val = shieldMaterial === 'None' ? 0 : safeParseFloat(shieldThickness);
            const eff_surf_pct = safeParseFloat(surfaceEff);

            if (isNaN(A_val) || isNaN(d_val) || A_val <= 0 || d_val <= 0) {
                if (activity && distance) setError("Inputs must be positive.");
                setResult(null);
                return;
            }

            const detInfo = DETECTORS[detectorType];
            
            // Standardize Units (Ci, meters, cm)
            const A_Ci = A_val * activityFactorsCi[activityUnit];
            const d_m = d_val * distanceFactorsM[distanceUnit];
            const t_cm = t_val * thicknessFactorsCm[shieldThicknessUnit];
            
            // Ensure SHIELD_PROPS is available in scope (from constants.js or passed prop)
            // If undefined, fallback to safe defaults to prevent crash
            const shieldProp = (typeof SHIELD_PROPS !== 'undefined' ? SHIELD_PROPS[shieldMaterial] : null) || { density: 0, mapTo: 'None' };
            const shieldDensity = shieldProp.density;
            
            const eff_surf = eff_surf_pct / 100.0;

            let cpmGamma = 0, cpmBeta = 0, cpmAlpha = 0;
            let attenuationMsg = [];

            // 1. Gamma Calculation (Point Source Inverse Square)
            if (detInfo.type !== 'alpha_only' && selectedNuclide.gammaConstant) {
                const gamma = safeParseFloat(selectedNuclide.gammaConstant);
                
                if (gamma > 0) {
                    // Dose Rate in uR/hr = (Gamma * A) / d^2
                    // Note: Gamma Constant is usually R-m^2/hr-Ci
                    const doseRate_uR_hr = ((gamma * A_Ci) / Math.pow(d_m, 2)) * 1e6;
                    
                    let transmission = 1;
                    if (shieldMaterial !== 'None' && t_cm > 0) {
                        const mapTo = shieldProp.mapTo;
                        // Use DB value if exists, otherwise Conservative Fallback
                        const hvl = (typeof HVL_DATA !== 'undefined' && HVL_DATA[selectedNuclide.symbol]?.[mapTo]) 
                                    || FALLBACK_HVL[mapTo] 
                                    || 1.2; // Default to 1.2 (Lead Co-60 approx) if all else fails
                        
                        transmission = Math.pow(0.5, t_cm / hvl);
                    }

                    const responseFactor = detInfo.refCpmPerMicroR || detInfo.gammaCpmPerMicroR;
                    cpmGamma = doseRate_uR_hr * transmission * responseFactor;
                }
            }

            // 2. Beta/Alpha Geometry (Solid Angle)
            if (detInfo.type === 'mix' || detInfo.type === 'alpha_only') {
                const r_det = detInfo.radius_cm;
                const d_cm = d_m * 100;
                
                // Solid Angle Efficiency: 0.5 * (1 - d / sqrt(d^2 + r^2))
                const geoEff = 0.5 * (1 - (d_cm / Math.sqrt(Math.pow(d_cm, 2) + Math.pow(r_det, 2))));
                const A_dpm = A_Ci * 2.22e12; // 1 Ci = 2.22e12 dpm

                if (detInfo.type === 'mix' && selectedNuclide.emissionEnergies?.beta?.length > 0) {
                    const eMax = parseE(selectedNuclide.emissionEnergies.beta[0]);

                    // Katz-Penfold Range Calculation
                    const range_g_cm2 = calculateBetaRange(eMax);

                    // A. Check Shield Penetration
                    const range_shield_cm = shieldDensity > 0 ? range_g_cm2 / shieldDensity : Infinity;

                    // B. Check Air Penetration (Density ~0.0012 g/cm³)
                    const densityAir = 0.0012; 
                    const range_air_cm = range_g_cm2 / densityAir;
                    
                    if (shieldMaterial !== 'None' && t_cm > range_shield_cm) {
                        attenuationMsg.push("Betas blocked by shield.");
                    } else if (d_cm > range_air_cm) { 
                        attenuationMsg.push("Betas ranged out in air.");
                    } else {
                        // If it reaches, apply efficiency
                        cpmBeta = A_dpm * geoEff * (detInfo.refBetaEff || 0.2) * eff_surf;
                    }
                }

                if (detInfo.alphaEff && selectedNuclide.emissionEnergies?.alpha?.length > 0) {
                    // Alphas blocked by almost anything or > 5cm air
                    if (shieldMaterial !== 'None' || d_cm > 5.0) { 
                        attenuationMsg.push("Alphas blocked.");
                    } else {
                        cpmAlpha = A_dpm * geoEff * detInfo.alphaEff * eff_surf;
                    }
                }
            }

            const totalCpm = cpmGamma + cpmBeta + cpmAlpha;

            setResult({
                // Smart formatting: Show decimals for low counts, integers for high
                displayValue: totalCpm < 10 ? totalCpm.toFixed(2) : Math.round(totalCpm).toLocaleString(),
                rawCpm: totalCpm,
                detLabel: detInfo.label,
                breakdown: `γ:${cpmGamma.toFixed(1)} β:${cpmBeta.toFixed(1)} α:${cpmAlpha.toFixed(1)}`,
                notes: attenuationMsg
            });

        } catch (e) {
            setError(e.message);
            setResult(null);
        }
    }, [nuclideSymbol, activity, activityUnit, distance, distanceUnit, detectorType, shieldMaterial, shieldThickness, shieldThicknessUnit, surfaceEff, radionuclides, activityFactorsCi, DETECTORS, FALLBACK_HVL]);

    const handleSave = () => {
        if (result) {
            addHistory({
                id: Date.now(),
                type: 'Detector Response',
                icon: ICONS.doseRate,
                inputs: `${activity} ${activityUnit} ${nuclideSymbol} @ ${distance} ${distanceUnit}`,
                result: `${result.displayValue} cpm`,
                view: VIEWS.OPERATIONAL_HP
            });
            addToast("Saved!");
        }
    }

    return (
        <div className="space-y-4">
            <ContextualNote type="info">
                <strong>Geometry:</strong> Calculates solid angle efficiency based on detector radius. Gamma response follows the Inverse Square Law.</ContextualNote>
            
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div>
                    <label className="block text-sm font-medium">Detector</label>
                    <select value={detectorType} onChange={e => setDetectorType(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                        {Object.entries(DETECTORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </div>
                
                <div className="min-h-[42px]">
                    {selectedNuclide ? 
                        <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} /> : 
                        <SearchableSelect options={availableNuclides} onSelect={setNuclideSymbol} placeholder="Select nuclide..." />
                    }
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Activity</label>
                        <div className="flex">
                            <input type="number" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                            <select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">
                                {Object.keys(activityFactorsCi).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Distance</label>
                        <div className="flex">
                            <input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                            <select value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">
                                {Object.keys(distanceFactorsM).map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                
                {/* Shielding Inputs */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        <label className="block text-sm font-medium">Shielding</label>
                        <select value={shieldMaterial} onChange={e => setShieldMaterial(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                            {/* Assumes SHIELD_PROPS is available in scope or imported */}
                            {typeof SHIELD_PROPS !== 'undefined' && Object.keys(SHIELD_PROPS).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    {shieldMaterial !== 'None' && (
                        <div>
                            <label className="block text-sm font-medium">Thickness</label>
                            <div className="flex mt-1">
                                <input type="number" value={shieldThickness} onChange={e => setShieldThickness(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                                <select value={shieldThicknessUnit} onChange={e => setShieldThicknessUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">
                                    {Object.keys(thicknessFactorsCm).map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in shadow-sm">
                    <div className="flex justify-end -mt-2 -mr-2">
                        <button onClick={handleSave}><Icon path={ICONS.notepad} className="w-5 h-5 text-slate-400 hover:text-sky-500" /></button>
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase">Estimated Response</p>
                    <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 my-2">
                        {result.displayValue} <span className="text-xl text-slate-500">cpm</span>
                    </p>
                    <p className="text-xs text-slate-500">{result.breakdown}</p>
                    {result.notes.map((n, i) => <p key={i} className="text-xs text-amber-600 mt-1">{n}</p>)}
                </div>
            )}
        </div>
    );
};

// 3. LeakTestCalculator
const LeakTestCalculator = ({ grossCpm, setGrossCpm, backgroundCpm, setBackgroundCpm, instrumentEff, setInstrumentEff, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // Standard Regulatory Limit for Sealed Sources (0.005 µCi)
    const LIMIT_UCI = 0.005;

    // Auto-calculate Action Level (The Net CPM that equals 0.005 uCi)
    // Helps user know "What number am I looking for on the meter?"
    const actionLevelNetCpm = React.useMemo(() => {
        const eff = safeParseFloat(instrumentEff);
        // SAFETY: Always treat input as percentage (e.g. 10 = 10% = 0.1)
        const efficiencyDecimal = eff / 100; 
        
        if (efficiencyDecimal > 0) {
            // Formula: Limit (µCi) * 2.22e6 (dpm/µCi) * Eff = CPM
            return Math.ceil(LIMIT_UCI * 2.22e6 * efficiencyDecimal);
        }
        return 0;
    }, [instrumentEff]);

    React.useEffect(() => {
        try {
            setError('');
            
            // 1. Safe Parsing
            const gross = safeParseFloat(grossCpm);
            const bkg = safeParseFloat(backgroundCpm);
            const effInput = safeParseFloat(instrumentEff);

            // 2. Validate Inputs (Wait for all fields)
            if (isNaN(gross) || isNaN(bkg) || isNaN(effInput)) { 
                setResult(null); 
                return; 
            }
            
            if (effInput <= 0) {
                // Silent return if efficiency is invalid/zero to prevent divide-by-zero
                setResult(null); 
                return;
            }

            // 3. Efficiency Normalization
            // SAFETY: Strictly divide by 100. "10" input means 10%.
            const efficiency = effInput / 100;

            // 4. Calculate Net CPM (Clamp to 0 if negative)
            const netCpm = Math.max(0, gross - bkg);

            // 5. Calculate DPM
            const dpm = netCpm / efficiency;

            // 6. Calculate uCi
            const act_uCi = dpm / 2.22e6;
            
            // 7. Pass/Fail Check
            const pass = act_uCi < LIMIT_UCI;

            setResult({ 
                activity: act_uCi.toExponential(2), 
                dpm: dpm.toFixed(0),
                pass, 
                netCpm: netCpm.toFixed(0) 
            });

        } catch (e) { 
            setError(e.message); 
            setResult(null); 
        }
    }, [grossCpm, backgroundCpm, instrumentEff, setResult, setError]);

    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ 
                id: Date.now(), 
                type: 'Leak Test', 
                icon: ICONS.check, 
                inputs: `Gross: ${grossCpm}, Bkg: ${backgroundCpm}, Eff: ${instrumentEff}%`, 
                result: `${result.activity} µCi (${result.pass ? 'PASS' : 'FAIL'})`, 
                view: VIEWS.OPERATIONAL_HP 
            });
            addToast("Saved to history!");
        }
    };

    return (
        <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
            <ContextualNote type="info">Checks if a sealed source is leaking by comparing removable contamination against the standard limit of <strong>0.005 µCi</strong>.</ContextualNote>
            
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4 bg-white dark:bg-slate-800 shadow-sm">
                
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Gross CPM</label>
                        <input 
                            type="number" 
                            value={grossCpm} 
                            onChange={e => setGrossCpm(e.target.value)} 
                            className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-sky-500 focus:ring-0"
                            placeholder="e.g. 60"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Bkg CPM</label>
                        <input 
                            type="number" 
                            value={backgroundCpm} 
                            onChange={e => setBackgroundCpm(e.target.value)} 
                            className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-sky-500 focus:ring-0"
                            placeholder="e.g. 45"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Efficiency (%)</label>
                        <input 
                            type="number" 
                            value={instrumentEff} 
                            onChange={e => setInstrumentEff(e.target.value)} 
                            className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border-transparent focus:border-sky-500 focus:ring-0"
                            placeholder="e.g. 10"
                        />
                    </div>
                </div>

                {/* Smart Action Level Indicator */}
                {actionLevelNetCpm > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-center">
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                            To exceed 0.005 µCi, you need <strong>&gt; {actionLevelNetCpm} Net CPM</strong>
                        </p>
                    </div>
                )}
            </div>

            {/* Result Card */}
            {result && (
                <div className={`p-6 rounded-xl shadow-lg border-2 text-center transition-colors duration-300 ${
                    result.pass 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-300' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-300'
                }`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">Status</span>
                        <button onClick={handleSaveToHistory} className="opacity-50 hover:opacity-100 transition-opacity" title="Save">
                            <Icon path={ICONS.notepad} className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <h3 className="text-4xl font-extrabold mb-1">
                        {result.pass ? 'PASS' : 'FAIL'}
                    </h3>
                    <p className="text-sm font-medium opacity-80 mb-4">
                        Limit: {LIMIT_UCI} µCi
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm bg-white/50 dark:bg-black/20 p-3 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-xs opacity-60">Activity</span>
                            <span className="font-mono font-bold">{result.activity} µCi</span>
                        </div>
                        <div className="flex flex-col border-l border-current/10">
                            <span className="text-xs opacity-60">Net Counts</span>
                            <span className="font-mono font-bold">{result.dpm} dpm</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SimpleEfficiencyCalculator = ({
    mode, setMode,
    counts, setCounts,
    time, setTime,
    cpm, setCpm,
    dpm, setDpm,
    efficiency, setEfficiency,
    result, setResult,
    error, setError
}) => {

    // Auto-Calculate Effect
    React.useEffect(() => {
        // 1. Reset
        setResult(null);
        setError('');

        // --- MODE 1: SCALER (Counts + Time -> CPM) ---
        if (mode === 'scaler') {
            if (!counts || !time) return; 
            const c = safeParseFloat(counts);
            const t = safeParseFloat(time);

            if (isNaN(c) || c < 0) return;
            if (isNaN(t) || t <= 0) return;

            const rate = c / t;
            // Poisson Error (Standard Deviation of Rate) = sqrt(N) / t
            // Note: This is 1-sigma (68% confidence)
            const stdDev = Math.sqrt(c) / t;

            setResult({ 
                label: 'Net Rate', 
                value: rate.toFixed(1) + ' cpm',
                subtext: `± ${stdDev.toFixed(1)} cpm (1σ)`
            });
        }

        // --- MODE 2: EFFICIENCY (CPM + DPM -> %) ---
        else if (mode === 'calcEff') {
            if (!cpm || !dpm) return;
            const c = safeParseFloat(cpm);
            const d = safeParseFloat(dpm);

            if (isNaN(c) || c < 0) return;
            if (isNaN(d) || d <= 0) return;

            const eff = (c / d) * 100;
            if (eff > 100) setError('Warning: Calculated efficiency > 100%');

            setResult({ label: 'Efficiency', value: eff.toFixed(2) + '%' });
        }

        // --- MODE 3: ACTIVITY (CPM + % -> DPM) ---
        else {
            if (!cpm || !efficiency) return;
            const c = safeParseFloat(cpm);
            const e = safeParseFloat(efficiency);

            if (isNaN(c) || c < 0) return;
            if (isNaN(e) || e <= 0) return;

            // DPM = CPM / Efficiency(decimal)
            const activity = c / (e / 100);

            setResult({ 
                label: 'Activity', 
                value: Math.round(activity).toLocaleString() + ' dpm',
                subtext: `${(activity / 2.22e6).toExponential(3)} µCi`
            });
        }
    // Removed setCpm/setEfficiency from dependencies to prevent loops
    }, [mode, counts, time, cpm, dpm, efficiency, setResult, setError]); 

    return (
        <div className="space-y-4 animate-fade-in">
            <ContextualNote type="info">Performs basic scaler math and efficiency conversions. Assumes standard Poisson statistics for count error.</ContextualNote>

            {/* 3-Way Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                <button onClick={() => setMode('scaler')} className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${mode === 'scaler' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}>Scaler</button>
                <button onClick={() => setMode('calcEff')} className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${mode === 'calcEff' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}>Find Eff %</button>
                <button onClick={() => setMode('calcDpm')} className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${mode === 'calcDpm' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}>Find DPM</button>
            </div>

            <div className="space-y-3">
                {/* Inputs for SCALER */}
                {mode === 'scaler' && (
                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Total Counts</label>
                            <input type="number" value={counts} onChange={e => setCounts(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Count Time (min)</label>
                            <input type="number" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                        </div>
                    </div>
                )}

                {/* Inputs for EFFICIENCY/DPM */}
                {mode !== 'scaler' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Net Count Rate (cpm)</label>
                        <input type="number" value={cpm} onChange={e => setCpm(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                )}

                {mode === 'calcEff' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Source Activity (dpm)</label>
                        <input type="number" value={dpm} onChange={e => setDpm(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                    </div>
                )}

                {mode === 'calcDpm' && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Instrument Efficiency (%)</label>
                        <div className="relative mt-1">
                            <input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">%</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm text-center animate-fade-in">{error}</p>}

            {/* Result Box */}
            {result && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-center border border-slate-200 dark:border-slate-600 animate-fade-in">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{result.label}</p>
                    <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{result.value}</p>
                    {result.subtext && <p className="text-sm text-slate-500 mt-1">{result.subtext}</p>}
                </div>
            )}
        </div>
    );
};

const InverseSquareCalculator = ({
    mode, setMode,
    i1, setI1,
    d1, setD1,
    i2, setI2,
    d2, setD2,
    result, setResult,
    error, setError
}) => {

    // Auto-Calculate Effect
    React.useEffect(() => {
        // 1. Reset State
        setResult(null);
        setError('');

        // 2. Parse Base Inputs (Reference)
        const rate1 = safeParseFloat(i1);
        const dist1 = safeParseFloat(d1);

        // 3. Silent Fail: If base inputs are empty/invalid, just do nothing yet.
        if (!i1 || !d1 || isNaN(rate1) || isNaN(dist1) || rate1 <= 0 || dist1 <= 0) {
            return; 
        }

        // --- MODE 1: CALCULATE NEW RATE (I2) ---
        if (mode === 'calcI2') {
            // Check Target Distance
            if (!d2) return; 
            const dist2 = safeParseFloat(d2);
            if (isNaN(dist2) || dist2 <= 0) return;

            // Calculate: I2 = I1 * (d1/d2)^2
            const rate2 = rate1 * Math.pow(dist1 / dist2, 2);

            setResult({ 
                label: 'Projected Rate (I₂)', 
                value: rate2.toPrecision(3),
                subtext: `at ${dist2} distance units`
            });
        }

        // --- MODE 2: CALCULATE DISTANCE (D2) ---
        else {
            // Check Target Rate
            if (!i2) return;
            const rate2 = safeParseFloat(i2);
            if (isNaN(rate2) || rate2 <= 0) return;

            // It is valid to calculate the distance to a HIGHER dose rate (moving closer).

            // Calculate: d2 = d1 * sqrt(I1/I2)
            const dist2 = dist1 * Math.sqrt(rate1 / rate2);

            setResult({ 
                label: 'Distance (d₂)', 
                value: dist2.toFixed(2),
                subtext: `Distance where rate is ${rate2}`
            });
        }

    }, [mode, i1, d1, i2, d2, setResult, setError]); 

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                <p>Calculate distance boundaries or projected dose rates using actual field measurements.</p></div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                <button onClick={() => setMode('calcD2')} className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${mode === 'calcD2' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}>Find Distance</button>
                <button onClick={() => setMode('calcI2')} className={`flex-1 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${mode === 'calcI2' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}>Find Dose Rate</button>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ref. Rate (I₁)</label>
                        <input type="number" value={i1} onChange={e => setI1(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" placeholder="e.g. 100" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ref. Distance (d₁)</label>
                        <input type="number" value={d1} onChange={e => setD1(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" placeholder="e.g. 1" />
                    </div>
                </div>

                {mode === 'calcD2' ? (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target Rate (I₂)</label>
                        <input type="number" value={i2} onChange={e => setI2(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" placeholder="e.g. 2 or 500" />
                        <p className="text-xs text-slate-500 mt-1">Example: Enter "2" to find the boundary line, or "500" to find the High Rad distance.</p>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Distance (d₂)</label>
                        <input type="number" value={d2} onChange={e => setD2(e.target.value)} className="w-full p-2 mt-1 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" placeholder="e.g. 10" />
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm text-center animate-fade-in">{error}</p>}

            {/* Result Box */}
            {result && (
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-center border border-slate-200 dark:border-slate-600 animate-fade-in">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{result.label}</p>
                    <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{result.value}</p>
                    {result.subtext && <p className="text-xs text-slate-500 mt-1">{result.subtext}</p>}
                </div>
            )}
        </div>

    );
};

const OperationalHPCalculators = ({ radionuclides, initialTab }) => {
    const [activeCalculator, setActiveCalculator] = React.useState(initialTab || 'surfaceContam');

    React.useEffect(() => {
        if (initialTab) setActiveCalculator(initialTab);
    }, [initialTab]);

    const { settings } = React.useContext(SettingsContext);
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq'] : ['pCi', 'nCi', 'µCi', 'mCi', 'Ci'], [settings.unitSystem]);

    // --- STATE: Surface Contamination ---
    const [sc_nuclideSymbol, setSc_nuclideSymbol] = React.useState('');
    const [sc_staticData, setSc_staticData] = React.useState('');
    const [sc_wipeGrossCpm, setSc_wipeGrossCpm] = React.useState('150');
    const [sc_wipeBackgroundCpm, setSc_wipeBackgroundCpm] = React.useState('50');
    const [sc_instrumentEff, setSc_instrumentEff] = React.useState('25');
    const [sc_smearEff, setSc_smearEff] = React.useState('0.1');
    const [sc_probeArea, setSc_probeArea] = React.useState('15'); 
    const [sc_result, setSc_result] = React.useState(null);
    const [sc_error, setSc_error] = React.useState('');

    // --- STATE: Leak Test ---
    const [lt_grossCpm, setLt_grossCpm] = React.useState(() => localStorage.getItem('leakTest_grossCpm') || '150');
    const [lt_backgroundCpm, setLt_backgroundCpm] = React.useState(() => localStorage.getItem('leakTest_backgroundCpm') || '50');
    const [lt_instrumentEff, setLt_instrumentEff] = React.useState(() => localStorage.getItem('leakTest_instrumentEff') || '25');
    const [lt_result, setLt_result] = React.useState(null);
    const [lt_error, setLt_error] = React.useState('');

    // --- STATE: Airborne ---
    const [ac_nuclideSymbol, setAc_nuclideSymbol] = React.useState('');
    const [ac_releaseActivity, setAc_releaseActivity] = React.useState('1');
    const [ac_activityUnit, setAc_activityUnit] = React.useState(activityUnits[0]);
    const [ac_roomVolume, setAc_roomVolume] = React.useState('100');
    const [ac_volumeUnit, setAc_volumeUnit] = React.useState('m³');
    const [ac_ventilationRate, setAc_ventilationRate] = React.useState('2');
    const [ac_result, setAc_result] = React.useState(null);
    const [ac_error, setAc_error] = React.useState('');

    // --- STATE: Detector Response ---
    const [resp_nuclideSymbol, setResp_nuclideSymbol] = React.useState('');
    const [resp_activity, setResp_activity] = React.useState('1');
    const [resp_activityUnit, setResp_activityUnit] = React.useState('µCi');
    const [resp_distance, setResp_distance] = React.useState('30');
    const [resp_distanceUnit, setResp_distanceUnit] = React.useState('cm');
    const [resp_detectorType, setResp_detectorType] = React.useState('nai_2x2');
    const [resp_shieldMaterial, setResp_shieldMaterial] = React.useState('None');
    const [resp_shieldThickness, setResp_shieldThickness] = React.useState('1');
    const [resp_shieldThicknessUnit, setResp_shieldThicknessUnit] = React.useState('cm');
    const [resp_surfaceEff, setResp_surfaceEff] = React.useState('100');
    const [resp_result, setResp_result] = React.useState(null);
    const [resp_error, setResp_error] = React.useState('');

    // --- STATE: Counting Lab (Eff/Activity) ---
    const [eff_mode, setEff_mode] = React.useState('scaler');
    const [eff_counts, setEff_counts] = React.useState('');
    const [eff_time, setEff_time] = React.useState('');
    const [eff_cpm, setEff_cpm] = React.useState('');
    const [eff_dpm, setEff_dpm] = React.useState('');
    const [eff_efficiency, setEff_efficiency] = React.useState('');
    const [eff_result, setEff_result] = React.useState(null);
    const [eff_error, setEff_error] = React.useState('');

    // --- STATE: Inverse Square (NEW 6th Module) ---
    const [inv_mode, setInv_mode] = React.useState('calcD2');
    const [inv_i1, setInv_i1] = React.useState('');
    const [inv_d1, setInv_d1] = React.useState('');
    const [inv_i2, setInv_i2] = React.useState('');
    const [inv_d2, setInv_d2] = React.useState('');
    const [inv_result, setInv_result] = React.useState(null);
    const [inv_error, setInv_error] = React.useState('');

    // Full Clear Handler
    const handleClear = () => {
        if(activeCalculator === 'surfaceContam') {
            setSc_nuclideSymbol(''); setSc_staticData(''); setSc_wipeGrossCpm('150'); setSc_wipeBackgroundCpm('50');
            setSc_instrumentEff('25'); setSc_smearEff('0.1'); setSc_probeArea('15'); setSc_result(null); setSc_error('');
        }
        if(activeCalculator === 'leakTest') {
            setLt_grossCpm('150'); setLt_backgroundCpm('50'); setLt_instrumentEff('25'); setLt_result(null); setLt_error('');
        }
        if(activeCalculator === 'efficiency') {
            setEff_counts(''); setEff_time(''); setEff_cpm(''); setEff_dpm(''); setEff_efficiency(''); setEff_result(null); setEff_error('');
        }
        if(activeCalculator === 'inverseSquare') {
            setInv_i1(''); setInv_d1(''); setInv_i2(''); setInv_d2(''); setInv_result(null); setInv_error('');
        }
        if(activeCalculator === 'airborne') {
            setAc_nuclideSymbol(''); setAc_releaseActivity('1'); setAc_roomVolume('100'); setAc_ventilationRate('2'); setAc_result(null); setAc_error('');
        }
        if(activeCalculator === 'response') {
            setResp_nuclideSymbol(''); setResp_activity('1'); setResp_distance('30'); setResp_shieldMaterial('None'); setResp_surfaceEff('100'); setResp_result(null); setResp_error('');
        }
    };

    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Operational HP Calculators</h2>
                    <ClearButton onClick={handleClear} />
                </div>

                {/* 6-Item Grid Navigation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6">
                    <button onClick={() => setActiveCalculator('surfaceContam')} className={`p-2 rounded-md text-xs sm:text-xs font-semibold transition-colors ${activeCalculator === 'surfaceContam' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Surface</button>
                    <button onClick={() => setActiveCalculator('leakTest')} className={`p-2 rounded-md text-xs sm:text-xs font-semibold transition-colors ${activeCalculator === 'leakTest' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Leak Test</button>
                    <button onClick={() => setActiveCalculator('efficiency')} className={`p-2 rounded-md text-xs sm:text-xs font-semibold transition-colors ${activeCalculator === 'efficiency' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Count Lab</button>
                    <button onClick={() => setActiveCalculator('inverseSquare')} className={`p-2 rounded-md text-xs sm:text-xs font-semibold transition-colors ${activeCalculator === 'inverseSquare' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Inv. Sq</button>
                    <button onClick={() => setActiveCalculator('airborne')} className={`p-2 rounded-md text-xs sm:text-xs font-semibold transition-colors ${activeCalculator === 'airborne' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Airborne</button>
                    <button onClick={() => setActiveCalculator('response')} className={`p-2 rounded-md text-xs sm:text-xs font-semibold transition-colors ${activeCalculator === 'response' ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Det. Resp.</button>
                </div>

                <div className="mt-4">
                    {activeCalculator === 'surfaceContam' && <SurfaceContaminationCalculator
                        radionuclides={radionuclides}
                        nuclideSymbol={sc_nuclideSymbol} setNuclideSymbol={setSc_nuclideSymbol}
                        staticData={sc_staticData} setStaticData={setSc_staticData}
                        wipeGrossCpm={sc_wipeGrossCpm} setWipeGrossCpm={setSc_wipeGrossCpm}
                        wipeBackgroundCpm={sc_wipeBackgroundCpm} setWipeBackgroundCpm={setSc_wipeBackgroundCpm}
                        instrumentEff={sc_instrumentEff} setInstrumentEff={setSc_instrumentEff}
                        smearEff={sc_smearEff} setSmearEff={setSc_smearEff}
                        probeArea={sc_probeArea} setProbeArea={setSc_probeArea}
                        result={sc_result} setResult={setSc_result}
                        error={sc_error} setError={setSc_error}
                    />}
                    
                    {activeCalculator === 'leakTest' && <LeakTestCalculator
                        grossCpm={lt_grossCpm} setGrossCpm={setLt_grossCpm}
                        backgroundCpm={lt_backgroundCpm} setBackgroundCpm={setLt_backgroundCpm}
                        instrumentEff={lt_instrumentEff} setInstrumentEff={setLt_instrumentEff}
                        result={lt_result} setResult={setLt_result}
                        error={lt_error} setError={setLt_error}
                    />}
                    
                    {activeCalculator === 'efficiency' && <SimpleEfficiencyCalculator
                        mode={eff_mode} setMode={setEff_mode}
                        counts={eff_counts} setCounts={setEff_counts}
                        time={eff_time} setTime={setEff_time}
                        cpm={eff_cpm} setCpm={setEff_cpm}
                        dpm={eff_dpm} setDpm={setEff_dpm}
                        efficiency={eff_efficiency} setEfficiency={setEff_efficiency}
                        result={eff_result} setResult={setEff_result}
                        error={eff_error} setError={setEff_error}
                    />}

                    {activeCalculator === 'inverseSquare' && <InverseSquareCalculator
                        mode={inv_mode} setMode={setInv_mode}
                        i1={inv_i1} setI1={setInv_i1}
                        d1={inv_d1} setD1={setInv_d1}
                        i2={inv_i2} setI2={setInv_i2}
                        d2={inv_d2} setD2={setInv_d2}
                        result={inv_result} setResult={setInv_result}
                        error={inv_error} setError={setInv_error}
                    />}

                    {activeCalculator === 'airborne' && <AirborneCalculator
                        radionuclides={radionuclides}
                        nuclideSymbol={ac_nuclideSymbol} setNuclideSymbol={setAc_nuclideSymbol}
                        releaseActivity={ac_releaseActivity} setReleaseActivity={setAc_releaseActivity}
                        activityUnit={ac_activityUnit} setActivityUnit={setAc_activityUnit} activityUnits={activityUnits}
                        roomVolume={ac_roomVolume} setRoomVolume={setAc_roomVolume}
                        volumeUnit={ac_volumeUnit} setVolumeUnit={setAc_volumeUnit}
                        ventilationRate={ac_ventilationRate} setVentilationRate={setAc_ventilationRate}
                        result={ac_result} setResult={setAc_result}
                        error={ac_error} setError={setAc_error}
                    />}
                    
                    {activeCalculator === 'response' && <DetectorResponseCalculator
                        radionuclides={radionuclides}
                        nuclideSymbol={resp_nuclideSymbol} setNuclideSymbol={setResp_nuclideSymbol}
                        activity={resp_activity} setActivity={setResp_activity}
                        activityUnit={resp_activityUnit} setActivityUnit={setResp_activityUnit}
                        distance={resp_distance} setDistance={setResp_distance}
                        distanceUnit={resp_distanceUnit} setDistanceUnit={setResp_distanceUnit}
                        detectorType={resp_detectorType} setDetectorType={setResp_detectorType}
                        shieldMaterial={resp_shieldMaterial} setShieldMaterial={setResp_shieldMaterial}
                        shieldThickness={resp_shieldThickness} setShieldThickness={setResp_shieldThickness}
                        shieldThicknessUnit={resp_shieldThicknessUnit} setShieldThicknessUnit={setResp_shieldThicknessUnit}
                        surfaceEff={resp_surfaceEff} setSurfaceEff={setResp_surfaceEff}
                        result={resp_result} setResult={setResp_result}
                        error={resp_error} setError={setResp_error}
                    />}
                </div>
            </div>
        </div>
    );
};

/**
 * @description A calculator to determine radioactive material shipping classification (Excepted, Type A, Type B)
 * based on the nuclide, activity, and form, according to DOT/IAEA A1/A2 values.
 */

const TransportationCalculator = ({ radionuclides, preselectedNuclide }) => {
    // --- 1. CONTEXT & CONSTANTS ---
    const { settings } = React.useContext(SettingsContext);
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();

    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq', 'TBq'] : ['µCi', 'mCi', 'Ci'], [settings.unitSystem]);

    const CONTAM_LIMITS = {
        beta_gamma: { removable: 22000, label: 'Beta/Gamma/Low-Tox Alpha' },
        alpha: { removable: 2200, label: 'Other Alpha' }
    };

    // --- 2. STATE ---
    const [packageItems, setPackageItems] = React.useState([]);

    // Add New Item State
    const [newItemSymbol, setNewItemSymbol] = React.useState('');
    const [newItemForm, setNewItemForm] = React.useState('A2');
    const [newItemState, setNewItemState] = React.useState('solid');
    const [newItemActivity, setNewItemActivity] = React.useState('1');
    const [newItemUnit, setNewItemUnit] = React.useState(() => activityUnits[activityUnits.length - 1]);

    // Package Level Inputs
    const [doseRateAt1m, setDoseRateAt1m] = React.useState('');
    const [doseRateUnit, setDoseRateUnit] = React.useState('mrem/hr');
    const [surfaceDoseRate, setSurfaceDoseRate] = React.useState('');
    const [surfaceDoseRateUnit, setSurfaceDoseRateUnit] = React.useState('mrem/hr');

    const [checkContam, setCheckContam] = React.useState(false);
    const [contamNuclideType, setContamNuclideType] = React.useState('beta_gamma');
    const [removableContam, setRemovableContam] = React.useState('');
    const [fixedContam, setFixedContam] = React.useState('');

    const [result, setResult] = React.useState(null);
    const [labelResult, setLabelResult] = React.useState(null);
    const [contamResult, setContamResult] = React.useState(null);
    const [classificationResult, setClassificationResult] = React.useState(null);
    const [error, setError] = React.useState('');

    // --- 3. HELPERS ---
    const transportNuclides = React.useMemo(() => radionuclides.filter(n => n.shipping && n.shipping.A1 !== undefined && n.shipping.A2 !== undefined).sort((a, b) => a.name.localeCompare(b.name)), [radionuclides]);

    // Helper to get data for the currently selected "New Item" to display the A1/A2 info
    const selectedNuclideData = React.useMemo(() => 
        transportNuclides.find(n => n.symbol === newItemSymbol), 
    [newItemSymbol, transportNuclides]);

    React.useEffect(() => {
        if (preselectedNuclide && transportNuclides.some(n => n.symbol === preselectedNuclide)) {
            setNewItemSymbol(preselectedNuclide);
        }
    }, [preselectedNuclide, transportNuclides]);

    React.useEffect(() => {
        if (!activityUnits.includes(newItemUnit)) {
            setNewItemUnit(activityUnits[activityUnits.length - 1]);
        }
    }, [activityUnits, newItemUnit]);

    // --- 4. LOGIC ---
    const activityFactorsTBq = { 'TBq': 1, 'GBq': 0.001, 'MBq': 1e-6, 'kBq': 1e-9, 'Bq': 1e-12, 'Ci': 0.037, 'mCi': 3.7e-5, 'µCi': 3.7e-8 };

    const handleAddItem = () => {
        if (!newItemSymbol) { setError('Select a nuclide.'); return; }

        // SAFE PARSE
        const val = safeParseFloat(newItemActivity);
        if (isNaN(val) || val <= 0) { setError('Invalid activity.'); return; }

        const nuclideData = transportNuclides.find(n => n.symbol === newItemSymbol);
        if(!nuclideData) return;

        let rawLimit = nuclideData.shipping[newItemForm];
        let limitTBq = (typeof rawLimit === 'string' && rawLimit.toLowerCase().includes('unlimited')) ? Infinity : parseFloat(rawLimit);

        let matMultiplier = 0; let instMultiplier = 0;
        if (newItemSymbol === 'H-3') { matMultiplier = 2e-2; instMultiplier = 2e-1; } 
        else {
            if (newItemState === 'liquid') { matMultiplier = 1e-4; instMultiplier = 1e-3; } 
            else { matMultiplier = 1e-3; instMultiplier = 1e-2; }
        }

        const actTBq = val * activityFactorsTBq[newItemUnit];

        const item = {
            id: Date.now(),
            symbol: newItemSymbol,
            form: newItemForm,
            state: newItemState,
            activityDisplay: `${val} ${newItemUnit}`,
            actTBq: actTBq,
            typeALimit: limitTBq,
            exceptedMatLimit: limitTBq === Infinity ? Infinity : limitTBq * matMultiplier,
            exceptedInstLimit: limitTBq === Infinity ? Infinity : limitTBq * instMultiplier,
            fracTypeA: limitTBq === Infinity ? 0 : actTBq / limitTBq,
            fracExcMat: (limitTBq === Infinity || limitTBq * matMultiplier === 0) ? 0 : actTBq / (limitTBq * matMultiplier),
            fracExcInst: (limitTBq === Infinity || limitTBq * instMultiplier === 0) ? 0 : actTBq / (limitTBq * instMultiplier),
        };

        setPackageItems(prev => [...prev, item]);
        setNewItemActivity('');
        setError('');
    };

    const handleRemoveItem = (id) => {
        setPackageItems(prev => prev.filter(i => i.id !== id));
    };

    // Calculate Package Totals
    React.useEffect(() => {
        if (packageItems.length === 0) { setClassificationResult(null); return; }

        let totalTBq = 0;
        let sumFracTypeA = 0;
        let sumFracExcMat = 0;
        let sumFracHRCQ = 0;

        packageItems.forEach(item => {
            totalTBq += item.actTBq;
            sumFracTypeA += item.fracTypeA;
            sumFracExcMat += item.fracExcMat;
            sumFracHRCQ += (item.actTBq / (3000 * item.typeALimit)); 
        });

        let classification = '';
        let methodology = '';

        if (sumFracExcMat <= 1.0) {
            classification = 'EXCEPTED';
            methodology = 'Sum of Fractions ≤ 1.0 (Excepted Material Limits)';
        } else if (sumFracTypeA <= 1.0) {
            classification = 'TYPE_A';
            methodology = 'Sum of Fractions ≤ 1.0 (A1/A2 Limits)';
        } else {
            if (sumFracHRCQ > 1.0 || totalTBq > 1000) {
                classification = 'HRCQ';
                methodology = 'Activity exceeds Type A and HRCQ thresholds.';
            } else {
                classification = 'TYPE_B';
                methodology = 'Activity exceeds Type A limits.';
            }
        }

        setClassificationResult({ count: packageItems.length, totalTBq, classification, methodology, sumFracTypeA, sumFracExcMat });
    }, [packageItems]);

    const toMremHr = (val, unit) => {
        if (unit === 'mrem/hr') return val;
        if (unit === 'rem/hr') return val * 1000;
        if (unit === 'mSv/hr') return val * 100;
        if (unit === 'µSv/hr') return val * 0.1;
        return 0;
    };

    React.useEffect(() => {
        // Label Logic
        if (!doseRateAt1m && !surfaceDoseRate) { setLabelResult(null); }
        else {
            const rate1m = safeParseFloat(doseRateAt1m);
            const rateSurface = safeParseFloat(surfaceDoseRate);

            if ((!isNaN(rate1m) && rate1m < 0) || (!isNaN(rateSurface) && rateSurface < 0)) { setLabelResult(null); return; }

            let TI = 0;
            if (!isNaN(rate1m) && rate1m > 0) {
                let mremAt1m = toMremHr(rate1m, doseRateUnit);
                if (mremAt1m <= 0.05) TI = 0;
                else TI = Math.ceil(mremAt1m * 10) / 10;
            }

            let labelCategory = "Unknown";
            const surfMrem = !isNaN(rateSurface) ? toMremHr(rateSurface, surfaceDoseRateUnit) : 0;

            if (surfMrem <= 0.5 && TI === 0) labelCategory = "White-I";
            else if (surfMrem <= 50 && TI <= 1) labelCategory = "Yellow-II";
            else if (surfMrem <= 200 && TI <= 10) labelCategory = "Yellow-III";
            else if (surfMrem > 200 || TI > 10) labelCategory = "Yellow-III (Exclusive Use)";
            else labelCategory = "Check Limits";

            setLabelResult({ TI, labelCategory });
        }

        // Contam Logic
        if (!checkContam) { setContamResult(null); }
        else {
            const remVal = safeParseFloat(removableContam);
            if (isNaN(remVal)) { setContamResult(null); }
            else if (remVal < 0) { setContamResult({ status: 'ERROR', msg: 'Negative value' }); }
            else {
                const limit = CONTAM_LIMITS[contamNuclideType].removable;
                const fail = remVal > limit;
                setContamResult({
                    status: fail ? 'FAIL' : 'PASS',
                    msg: fail ? `Exceeds 49 CFR Limit (${limit.toLocaleString()} dpm/100cm²)` : 'Within Limits',
                    limit
                });
            }
        }
    }, [doseRateAt1m, doseRateUnit, surfaceDoseRate, surfaceDoseRateUnit, checkContam, removableContam, contamNuclideType]);

    const handleClear = () => {
        setPackageItems([]); setNewItemSymbol(''); setNewItemActivity('1');
        setDoseRateAt1m(''); setSurfaceDoseRate(''); setCheckContam(false); setRemovableContam(''); setError('');
    };

    const handleSave = () => {
        if (!classificationResult) return;
        const labelInfo = labelResult ? ` | ${labelResult.labelCategory} (TI: ${labelResult.TI})` : '';
        const contamInfo = contamResult ? ` | Contam: ${contamResult.status}` : '';
        addHistory({
            id: Date.now(),
            type: 'Transportation',
            icon: ICONS.transport || ICONS.truck, // Fallback icon
            inputs: `${packageItems.length} Items (Total ${classificationResult.totalTBq.toExponential(2)} TBq)`,
            result: `${classificationResult.classification.replace('_', ' ')}${labelInfo}${contamInfo}`,
            view: VIEWS.TRANSPORTATION
        });
        addToast("Saved to history!");
    };

    // --- STATE & STYLE CONSTANTS ---
    const resultStyles = {
        EXCEPTED: { container: 'bg-green-100 dark:bg-green-900/50', title: 'text-green-600 dark:text-green-400', display: 'Excepted Package' },
        TYPE_A: { container: 'bg-sky-100 dark:bg-sky-900/50', title: 'text-sky-600 dark:text-sky-400', display: 'Type A Package' },
        TYPE_B: { container: 'bg-amber-100 dark:bg-amber-900/50', title: 'text-amber-600 dark:text-amber-400', display: 'Type B Package' },
        HRCQ: { container: 'bg-red-100 dark:bg-red-900/50', title: 'text-red-600 dark:text-red-400', display: 'HRCQ (Type B)' }
    };

    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Shipping Calculator</h2>
                    <ClearButton onClick={handleClear} />
                </div>

                <ContextualNote type="info">Determines package classification (Excepted, Type A, Type B) based on A1/A2 fractions. Also estimates label requirements.</ContextualNote>

                {/* --- 1. PACKAGE CONTENTS BUILDER --- */}
                <div className="space-y-4 mb-6 border-b border-slate-200 dark:border-slate-700 pb-6">
                    <h3 className="font-bold text-sm text-slate-500 uppercase">1. Add Package Contents</h3>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3 border border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Nuclide Selection */}
                            <div>
                                <label className="block text-xs font-medium mb-1">Radionuclide</label>
                                <div className="h-[38px]">
                                    {newItemSymbol ? (
                                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 border dark:border-slate-600 rounded p-2 text-sm">
                                            <span className="font-bold">{newItemSymbol}</span>
                                            <button onClick={() => setNewItemSymbol('')} className="text-red-500 hover:text-red-700"><Icon path={ICONS.clear || "M6 18L18 6M6 6l12 12"} className="w-4 h-4"/></button>
                                        </div>
                                    ) : (
                                        <SearchableSelect options={transportNuclides} onSelect={setNewItemSymbol} placeholder="Select..." />
                                    )}
                                </div>
                                
                                {/* A1/A2 INFO DISPLAY */}
                                {selectedNuclideData && (
                                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-[10px] sm:text-xs">
                                        <div className="flex justify-between font-bold text-blue-700 dark:text-blue-300 mb-1">
                                            <span>DOT Limits (TBq)</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex justify-between"><span className="text-slate-500">A₁ (Special):</span><span className="font-mono font-bold">{selectedNuclideData.shipping.A1}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-500">A₂ (Normal):</span><span className="font-mono font-bold">{selectedNuclideData.shipping.A2}</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Inputs */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Activity</label>
                                    <div className="flex">
                                        <input type="number" min="0" value={newItemActivity} onChange={e => setNewItemActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-white dark:bg-slate-800 border dark:border-slate-600 text-sm" />
                                        <select value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} className="p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Form & State</label>
                                    <div className="flex gap-2 mb-2">
                                        <label className={`flex-1 text-center p-1 text-[10px] font-bold rounded cursor-pointer border ${newItemForm === 'A1' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}><input type="radio" className="hidden" name="itemForm" checked={newItemForm === 'A1'} onChange={() => setNewItemForm('A1')} />Special (A1)</label>
                                        <label className={`flex-1 text-center p-1 text-[10px] font-bold rounded cursor-pointer border ${newItemForm === 'A2' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}><input type="radio" className="hidden" name="itemForm" checked={newItemForm === 'A2'} onChange={() => setNewItemForm('A2')} />Normal (A2)</label>
                                    </div>
                                    <select value={newItemState} onChange={e => setNewItemState(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-800 border dark:border-slate-600 text-xs">
                                        <option value="solid">Solid</option><option value="liquid">Liquid</option><option value="gas">Gas</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleAddItem} className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded shadow-sm text-sm">+ Add Item to Package</button>
                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                    </div>

                    {/* Items List */}
                    {packageItems.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden animate-fade-in">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 uppercase">
                                    <tr><th className="p-2">Nuclide</th><th className="p-2">Activity</th><th className="p-2">Type A Frac</th><th className="p-2"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {packageItems.map(item => (
                                        <tr key={item.id}>
                                            <td className="p-2 font-bold">{item.symbol} <span className="text-[10px] font-normal text-slate-500 block">{item.form}, {item.state}</span></td>
                                            <td className="p-2 font-mono">{item.activityDisplay}</td>
                                            <td className="p-2 font-mono">{item.fracTypeA.toFixed(3)}</td>
                                            <td className="p-2 text-right"><button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Icon path={ICONS.trash || "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"} className="w-4 h-4"/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold border-t border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <td className="p-2" colSpan="2">TOTAL FRACTION (Sum of A1/A2):</td>
                                        <td className="p-2 font-mono text-base text-sky-600 dark:text-sky-400">{classificationResult ? classificationResult.sumFracTypeA.toFixed(3) : '0.000'}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* --- 2. CLASSIFICATION RESULT --- */}
                {classificationResult && (
                    <div className={`p-4 rounded-lg text-center mb-6 animate-fade-in ${resultStyles[classificationResult.classification].container}`}>
                        <p className="text-xs uppercase font-bold opacity-70 mb-1">Package Classification</p>
                        <p className={`text-2xl font-extrabold ${resultStyles[classificationResult.classification].title}`}>{resultStyles[classificationResult.classification].display}</p>
                        <p className="text-xs mt-2 opacity-80">{classificationResult.methodology}</p>
                    </div>
                )}

                {/* --- 3. MEASUREMENTS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* LABEL ESTIMATION */}
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                        <h3 className="font-bold text-sm text-slate-500 uppercase">2. Label Estimation</h3>
                        
                        <div>
                            <label className="block text-[10px] font-bold mb-1">Max Dose Rate @ 1m (TI)</label>
                            <div className="flex"><input type="number" min="0" value={doseRateAt1m} onChange={e => setDoseRateAt1m(e.target.value)} placeholder="0" className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm" /><select value={doseRateUnit} onChange={e => setDoseRateUnit(e.target.value)} className="p-1 rounded-r-md bg-slate-200 dark:bg-slate-600 text-[10px]"><option value="mrem/hr">mrem/h</option><option value="mSv/hr">mSv/h</option></select></div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold mb-1">Max Surface Dose Rate</label>
                            <div className="flex"><input type="number" min="0" value={surfaceDoseRate} onChange={e => setSurfaceDoseRate(e.target.value)} placeholder="0" className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm" /><select value={surfaceDoseRateUnit} onChange={e => setSurfaceDoseRateUnit(e.target.value)} className="p-1 rounded-r-md bg-slate-200 dark:bg-slate-600 text-[10px]"><option value="mrem/hr">mrem/h</option><option value="mSv/hr">mSv/h</option></select></div>
                        </div>
                        {labelResult && (
                            <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded text-center">
                                <p className="text-xs text-slate-500">Required Label</p>
                                <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{labelResult.labelCategory}</p>
                                <p className="text-[10px] text-slate-400">TI: {labelResult.TI.toFixed(1)}</p>
                            </div>
                        )}
                    </div>

                    {/* CONTAMINATION */}
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                        <label className="flex items-center gap-2 font-bold text-sm text-slate-500 uppercase cursor-pointer">
                            <input type="checkbox" checked={checkContam} onChange={e => setCheckContam(e.target.checked)} className="form-checkbox h-4 w-4 rounded text-sky-600" />
                            3. Contamination
                        </label>
                        {checkContam && (
                            <div className="animate-fade-in space-y-2">
                                <div><label className="block text-[10px] font-bold mb-1">Nuclide Type</label><select value={contamNuclideType} onChange={e => setContamNuclideType(e.target.value)} className="w-full p-2 rounded bg-slate-100 dark:bg-slate-700 text-xs"><option value="beta_gamma">Beta / Gamma</option><option value="alpha">Alpha</option></select></div>
                                <div>
                                    <label className="block text-[10px] font-bold mb-1">Removable (dpm/100cm²)</label>
                                    <input type="number" min="0" value={removableContam} onChange={e => setRemovableContam(e.target.value)} className="w-full p-2 rounded bg-slate-100 dark:bg-slate-700 text-sm" placeholder="e.g. 500" />
                                    <p className="text-[10px] text-slate-400 italic text-right mt-1">Limit: {CONTAM_LIMITS[contamNuclideType].removable.toLocaleString()}</p>
                                </div>
                                {contamResult && (
                                    <div className={`p-2 rounded text-center text-sm font-bold ${contamResult.status === 'FAIL' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {contamResult.status === 'FAIL' ? '❌ Exceeds Limit' : '✅ Within Limits'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-right mt-4">
                    <button onClick={handleSave} className="text-sm text-sky-600 hover:underline font-semibold" disabled={!classificationResult}>Save Full Record</button>
                </div>
            </div>
        </div>
    );
};

/**
 * @description React component acting as a container for various medical physics tools.
 */

const MedicalCalculator = ({ radionuclides }) => {
    const [activeTab, setActiveTab] = React.useState('xrayShielding');
    const { settings } = React.useContext(SettingsContext);
    
    // --- SHARED DATA ---
    const COMMON_THERAPY_ISOTOPES = ['I-131', 'Lu-177', 'Y-90', 'In-111', 'Tc-99m', 'Ra-223', 'Sm-153'];
    
    // State for XRayShieldingCalculator
    const [xray_kvp, setXray_kvp] = React.useState('100');
    const [xray_workload, setXray_workload] = React.useState('200');
    const [xray_useFactor, setXray_useFactor] = React.useState('1');
    const [xray_occupancyFactor, setXray_occupancyFactor] = React.useState('1');
    const [xray_distance, setXray_distance] = React.useState('2.1');
    const [xray_doseLimit, setXray_doseLimit] = React.useState('0.02');
    const [xray_shieldMaterial, setXray_shieldMaterial] = React.useState('Lead');
    const [xray_result, setXray_result] = React.useState(null);
    const [xray_error, setXray_error] = React.useState('');
    
    // State for PatientReleaseCalculator
    const [pr_nuclideSymbol, setPr_nuclideSymbol] = React.useState('');
    const [pr_activity, setPr_activity] = React.useState('30');
    const [pr_activityUnit, setPr_activityUnit] = React.useState(settings.unitSystem === 'si' ? 'GBq' : 'mCi');
    const [pr_measuredRate, setPr_measuredRate] = React.useState(''); // NEW: 1m Rate Check
    const [pr_occupancyFactor, setPr_occupancyFactor] = React.useState('0.25');
    const [pr_distance, setPr_distance] = React.useState('1');
    const [pr_attenuation, setPr_attenuation] = React.useState('0.8');
    const [pr_effectiveHalfLife, setPr_effectiveHalfLife] = React.useState('');
    const [pr_effectiveHalfLifeUnit, setPr_effectiveHalfLifeUnit] = React.useState('hours');
    const [pr_result, setPr_result] = React.useState(null);
    const [pr_error, setPr_error] = React.useState('');
    
    // State for DecayInStorageCalculator
    const [dis_nuclideSymbol, setDis_nuclideSymbol] = React.useState('');
    const [dis_currentRate, setDis_currentRate] = React.useState('5.0');
    const [dis_limit, setDis_limit] = React.useState('0.02');
    const [dis_result, setDis_result] = React.useState(null);
    
    // Dynamic Units
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['MBq', 'GBq', 'TBq'] : ['µCi', 'mCi', 'Ci'], [settings.unitSystem]);
    
    React.useEffect(() => {
        if (!activityUnits.includes(pr_activityUnit)) setPr_activityUnit(activityUnits[1]);
    }, [settings.unitSystem]);
    
    // Auto-set Attenuation for I-131
    React.useEffect(() => {
        if (pr_nuclideSymbol === 'I-131') setPr_attenuation('0.8');
        else setPr_attenuation('1.0');
    }, [pr_nuclideSymbol]);
    
    const handleClearActiveCalculator = () => {
        if (activeTab === 'xrayShielding') {
            setXray_kvp('100'); setXray_workload('200'); setXray_useFactor('1');
            setXray_occupancyFactor('1'); setXray_distance('2.1'); setXray_doseLimit('0.02');
            setXray_shieldMaterial('Lead'); setXray_result(null); setXray_error('');
        } else if (activeTab === 'patientRelease') {
            setPr_nuclideSymbol(''); setPr_activity('30'); setPr_measuredRate('');
            setPr_occupancyFactor('0.25'); setPr_distance('1'); setPr_attenuation('0.8');
            setPr_effectiveHalfLife(''); setPr_result(null); setPr_error('');
        } else if (activeTab === 'decayStorage') {
            setDis_nuclideSymbol(''); setDis_currentRate('5.0'); setDis_result(null);
        }
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Medical Physics Tools</h2>
                    <ClearButton onClick={handleClearActiveCalculator} />
                </div>
            
                {/* 4-Way Navigation Tab */}
                <div className="flex w-full p-1 bg-slate-200 dark:bg-slate-700 rounded-lg my-4 gap-1">
                    {['xrayShielding', 'patientRelease', 'decayStorage', 'effHalfLife'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 p-2 rounded-md text-[10px] sm:text-xs font-bold transition-colors uppercase ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                            {tab === 'xrayShielding' ? 'X-Ray' : tab === 'patientRelease' ? 'Pt Release' : tab === 'decayStorage' ? 'Waste' : 'T½ Eff'}
                        </button>
                    ))}
                </div>
            
                {activeTab === 'xrayShielding' && <XRayShieldingCalculator
                    kvp={xray_kvp} setKvp={setXray_kvp}
                    workload={xray_workload} setWorkload={setXray_workload}
                    useFactor={xray_useFactor} setUseFactor={setXray_useFactor}
                    occupancyFactor={xray_occupancyFactor} setOccupancyFactor={setXray_occupancyFactor}
                    distance={xray_distance} setDistance={setXray_distance}
                    doseLimit={xray_doseLimit} setDoseLimit={setXray_doseLimit}
                    shieldMaterial={xray_shieldMaterial} setShieldMaterial={setXray_shieldMaterial}
                    result={xray_result} setResult={setXray_result}
                    error={xray_error} setError={setXray_error}
                />}
            
                {activeTab === 'patientRelease' && <PatientReleaseCalculator
                    radionuclides={radionuclides} therapyList={COMMON_THERAPY_ISOTOPES}
                    nuclideSymbol={pr_nuclideSymbol} setNuclideSymbol={setPr_nuclideSymbol}
                    activity={pr_activity} setActivity={setPr_activity}
                    activityUnit={pr_activityUnit} setActivityUnit={setPr_activityUnit}
                    measuredRate={pr_measuredRate} setMeasuredRate={setPr_measuredRate} // NEW PROP
                    activityUnits={activityUnits}
                    occupancyFactor={pr_occupancyFactor} setOccupancyFactor={setPr_occupancyFactor}
                    distance={pr_distance} setDistance={setPr_distance}
                    attenuation={pr_attenuation} setAttenuation={setPr_attenuation}
                    effectiveHalfLife={pr_effectiveHalfLife} setEffectiveHalfLife={setPr_effectiveHalfLife}
                    effectiveHalfLifeUnit={pr_effectiveHalfLifeUnit} setEffectiveHalfLifeUnit={setPr_effectiveHalfLifeUnit}
                    result={pr_result} setResult={setPr_result}
                    error={pr_error} setError={setPr_error}
                    settings={settings}
                />}
            
                {activeTab === 'decayStorage' && <DecayInStorageCalculator
                    radionuclides={radionuclides}
                    nuclideSymbol={dis_nuclideSymbol} setNuclideSymbol={setDis_nuclideSymbol}
                    currentRate={dis_currentRate} setCurrentRate={setDis_currentRate}
                    limit={dis_limit} setLimit={setDis_limit}
                    result={dis_result} setResult={setDis_result}
                />}

                {activeTab === 'effHalfLife' && <EffectiveHalfLifeCalculator radionuclides={radionuclides} />}
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const XRayShieldingCalculator = ({ kvp, setKvp, workload, setWorkload, useFactor, setUseFactor, occupancyFactor, setOccupancyFactor, distance, setDistance, doseLimit, setDoseLimit, shieldMaterial, setShieldMaterial, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // Simplified NCRP 147 / 49 Data
    const TVL_DATA = {
        'Lead': { 50: { TVL1: 0.06, TVLe: 0.17 }, 70: { TVL1: 0.15, TVLe: 0.25 }, 100: { TVL1: 0.25, TVLe: 0.35 }, 125: { TVL1: 0.27, TVLe: 0.38 }, 150: { TVL1: 0.29, TVLe: 0.41 } },
        'Concrete': { 50: { TVL1: 4.3, TVLe: 4.3 }, 70: { TVL1: 5.4, TVLe: 5.4 }, 100: { TVL1: 6.0, TVLe: 6.0 }, 125: { TVL1: 6.6, TVLe: 6.6 }, 150: { TVL1: 7.0, TVLe: 7.0 } },
        'Drywall': { 50: { TVL1: 1.8, TVLe: 1.8 }, 70: { TVL1: 2.5, TVLe: 2.5 }, 100: { TVL1: 3.5, TVLe: 3.5 }, 125: { TVL1: 4.2, TVLe: 4.2 }, 150: { TVL1: 4.8, TVLe: 4.8 } }
    };
    const K_FACTORS = { 50: 3.5, 70: 5.0, 100: 7.5, 125: 10.0, 150: 13.0 };
    
    React.useEffect(() => {
        try {
            setError('');
            const W = safeParseFloat(workload); const U = safeParseFloat(useFactor); const T = safeParseFloat(occupancyFactor);
            const d = safeParseFloat(distance); const P = safeParseFloat(doseLimit);
            if ([W, U, T, d, P].some(isNaN) || W <= 0 || d <= 0) {
                 if (workload) { throw new Error("All inputs must be valid, positive numbers."); }
                 setResult(null); return; 
            }
            
            const K_output = K_FACTORS[kvp] || 5.0;
            // Unshielded Air Kerma = (K * W * U * T) / d^2
            const K_unshielded = (K_output * W * U * T) / Math.pow(d, 2);
            
            // B = Transmission Factor required
            const B = P / K_unshielded;
            
            // SAFETY FIX: Clarity on "No Shielding"
            if (B >= 1) { 
                setResult({ thickness: 0, tvls: 0, transmission: 'No Shielding Required', msg: 'Unshielded dose < Limit' }); 
                return; 
            }
            
            // Calculate Thickness using Archer Equation logic (TVL1 + TVLe)
            const n_tvl = -Math.log10(B);
            const { TVL1, TVLe } = TVL_DATA[shieldMaterial][kvp];
            const thickness = TVL1 + (n_tvl - 1) * TVLe;
            
            // Safety Clamp: Don't show negative thickness if n_tvl < 1 (covered by B >= 1 check, but safe to keep)
            const finalThickness = Math.max(0, thickness);
            
            setResult({ transmission: B.toExponential(2), tvls: n_tvl.toFixed(2), thickness: finalThickness.toFixed(2) });
        } catch (e) { setResult(null); setError(e.message); }
    }, [kvp, workload, useFactor, occupancyFactor, distance, doseLimit, shieldMaterial, setResult, setError]);
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'X-Ray Shielding', icon: ICONS.medical, inputs: `${workload} mA-min/wk @ ${kvp} kVp`, result: `${result.thickness} ${shieldMaterial === 'Lead' ? 'mm' : 'cm'}`, view: VIEWS.MEDICAL });
            addToast("Saved!");
        }
    };
    
    const useFactorOptions = [ { value: 1, label: '1 (Floors, full-time)' }, { value: 0.25, label: '1/4 (Doors, walls)' }, { value: 0.0625, label: '1/16 (Ceilings)' } ];
    const occupancyOptions = [ { value: 1, label: '1 (Offices, labs)' }, { value: 0.2, label: '1/5 (Corridors)' }, { value: 0.05, label: '1/20 (Restrooms)' }, { value: 0.025, label: '1/40 (Outdoors)' } ];
    const doseLimitOptions = [ { value: 0.1, label: '0.1 mGy/wk (Controlled)' }, { value: 0.02, label: '0.02 mGy/wk (Uncontrolled)' } ];
    
    return (
        <div className="space-y-4">
            <ContextualNote type="warning"><strong>Limitation:</strong> Calculates Primary Barrier shielding only. Does not account for leakage or scatter radiation.</ContextualNote>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">Tube Potential</label><select value={kvp} onChange={e => setKvp(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm">{Object.keys(K_FACTORS).map(k => <option key={k} value={k}>{k} kVp</option>)}</select></div>
                <div><label className="block text-xs font-bold mb-1">Workload (mA-min/wk)</label><input type="number" value={workload} onChange={e => setWorkload(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
                <div><label className="block text-xs font-bold mb-1">Use Factor (U)</label><select value={useFactor} onChange={e => setUseFactor(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm">{useFactorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                <div><label className="block text-xs font-bold mb-1">Occupancy (T)</label><select value={occupancyFactor} onChange={e => setOccupancyFactor(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm">{occupancyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                <div><label className="block text-xs font-bold mb-1">Distance (m)</label><input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
                <div><label className="block text-xs font-bold mb-1">Limit (Air Kerma)</label><select value={doseLimit} onChange={e => setDoseLimit(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm">{doseLimitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></div>
                <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">Shield Material</label><select value={shieldMaterial} onChange={e => setShieldMaterial(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"><option value="Lead">Lead (mm)</option><option value="Concrete">Concrete (cm)</option><option value="Drywall">Drywall (cm)</option></select></div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 text-center animate-fade-in relative">
                    <div className="absolute top-2 right-2"><button onClick={handleSaveToHistory}><Icon path={ICONS.notepad} className="w-5 h-5 text-slate-400 hover:text-sky-500"/></button></div>
                    <p className="text-sm text-slate-500 uppercase font-bold">Required Shielding</p>
                    {result.thickness > 0 ? (
                        <>
                            <p className="text-4xl font-extrabold text-sky-600 dark:text-sky-400 my-2">{result.thickness} <span className="text-xl text-slate-500">{shieldMaterial === 'Lead' ? 'mm' : 'cm'}</span></p>
                            <p className="text-xs text-slate-400">TVLs needed: {result.tvls}</p>
                        </>
                    ) : (
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 my-2">{result.transmission}</p>
                    )}
                </div>
            )}
        </div>
    );
};

const PatientReleaseCalculator = ({ radionuclides, therapyList, nuclideSymbol, setNuclideSymbol, activity, setActivity, activityUnit, setActivityUnit, measuredRate, setMeasuredRate, activityUnits, occupancyFactor, setOccupancyFactor, distance, setDistance, attenuation, setAttenuation, effectiveHalfLife, setEffectiveHalfLife, effectiveHalfLifeUnit, setEffectiveHalfLifeUnit, result, setResult, error, setError, settings }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    const TEDE_LIMIT_MREM = 500;
    const I131_ACTIVITY_LIMIT_MCI = 33;
    const I131_RATE_LIMIT_MREM_HR = 7.0; 
    const actToMci = { 'µCi': 1e-3, 'mCi': 1, 'Ci': 1000, 'MBq': 1/37, 'GBq': 1000/37, 'TBq': 1e6/37 };
    
    const therapyNuclides = React.useMemo(() => radionuclides.filter(n => therapyList.includes(n.symbol) && n.gammaConstant).sort((a, b) => a.name.localeCompare(b.name)), [radionuclides, therapyList]);
    const selectedNuclide = React.useMemo(() => therapyNuclides.find(n => n.symbol === nuclideSymbol), [nuclideSymbol, therapyNuclides]);
    
    React.useEffect(() => {
        if (!selectedNuclide) { setResult(null); return; }
        try {
            setError('');
            const A0_mCi = safeParseFloat(activity) * actToMci[activityUnit];
            const rateCheck = safeParseFloat(measuredRate); 
            
            if (isNaN(A0_mCi) || A0_mCi <= 0) throw new Error("Invalid activity.");
            
            // 1. Tier 1 Check (Activity OR Dose Rate)
            if (selectedNuclide.symbol.includes('I-131')) {
                const passesActivity = A0_mCi <= I131_ACTIVITY_LIMIT_MCI;
                const passesRate = !isNaN(rateCheck) && rateCheck > 0 && rateCheck <= I131_RATE_LIMIT_MREM_HR;
                
                if (passesActivity) {
                    setResult({ title: 'PASS (Tier 1)', pass: true, details: [`Activity ≤ ${I131_ACTIVITY_LIMIT_MCI} mCi. Release permitted.`] });
                    return;
                }
                if (passesRate) {
                    setResult({ title: 'PASS (Tier 1)', pass: true, details: [`Rate @ 1m ≤ ${I131_RATE_LIMIT_MREM_HR} mrem/hr. Release permitted.`] });
                    return;
                }
            }
            
            // 2. Calc Effective Half Life
            let T_half_hours_eff;
            const T_half_hours_phys = parseHalfLifeToSeconds(selectedNuclide.halfLife) / 3600;
            const effHL = safeParseFloat(effectiveHalfLife);
            
            if (!isNaN(effHL) && effHL > 0) {
                const factors = { 'hours': 1, 'days': 24 };
                T_half_hours_eff = effHL * factors[effectiveHalfLifeUnit];
                
                // SAFETY: Clamp T_eff instead of throwing error
                if (T_half_hours_eff > T_half_hours_phys) {
                    T_half_hours_eff = T_half_hours_phys;
                    // Warning toast could go here, but silent clamp prevents crash
                }
            } else { T_half_hours_eff = T_half_hours_phys; }
            
            // 3. Dose Calc (NUREG-1556 Vol 9 Eq 1)
            const gamma_app = safeParseFloat(selectedNuclide.gammaConstant); // R·m²/hr·Ci
            const gamma_nureg = gamma_app * 10; // Convert to R·cm²/hr·mCi
            const d_cm = safeParseFloat(distance) * 100;
            const E = safeParseFloat(occupancyFactor);
            const att = safeParseFloat(attenuation);
            
            if ([d_cm, E, att].some(isNaN) || d_cm <= 0) throw new Error("Invalid inputs.");
            
            // If measured rate exists, use it as base!
            let rate_R_hr;
            if (!isNaN(rateCheck) && rateCheck > 0) {
                // rateCheck is mrem/hr at 1m. 
                // Convert to R/hr at 'd' meters
                const rate_mrem_hr_at_1m = rateCheck;
                // Inverse Square Law: I2 = I1 * (d1/d2)^2
                rate_R_hr = (rate_mrem_hr_at_1m / 1000) * Math.pow(100 / d_cm, 2); 
            } else {
                rate_R_hr = (gamma_nureg * A0_mCi * att) / Math.pow(d_cm, 2);
            }

            // Total Dose = Rate * Occupancy * (T_eff / ln(2))
            const total_dose_R = (rate_R_hr * E) * (T_half_hours_eff * 1.443);
            const dose_mrem = total_dose_R * 1000;
            
            setResult({
                title: dose_mrem <= TEDE_LIMIT_MREM ? 'PASS (Tier 2)' : 'FAIL',
                pass: dose_mrem <= TEDE_LIMIT_MREM,
                details: [`Total Dose: ${formatDoseValue(dose_mrem, 'dose', settings).value} ${formatDoseValue(dose_mrem, 'dose', settings).unit}`, `(Limit: 500 mrem)`],
                rawDose: dose_mrem
            });
        } catch (e) { setResult(null); setError(e.message); }
    }, [selectedNuclide, activity, activityUnit, measuredRate, occupancyFactor, distance, attenuation, effectiveHalfLife, effectiveHalfLifeUnit, settings.unitSystem]);
    
    const handleSave = () => {
        if (result && selectedNuclide) {
            addHistory({ id: Date.now(), type: 'Patient Release', icon: ICONS.medical, inputs: `${activity} ${activityUnit} ${selectedNuclide.symbol}`, result: result.title, view: VIEWS.MEDICAL });
            addToast("Saved!");
        }
    };
    
    return (
        <div className="space-y-4">
            <div><label className="text-xs font-bold mb-1 block">Isotope</label>{selectedNuclide ? <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} /> : <SearchableSelect options={therapyNuclides} onSelect={setNuclideSymbol} placeholder="Select nuclide..." />}</div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold mb-1 block">Activity</label><div className="flex"><input type="number" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                <div><label className="text-xs font-bold mb-1 block">Meas. Rate @ 1m (mrem/h)</label><input type="number" value={measuredRate} onChange={e => setMeasuredRate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm" placeholder="Optional" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold mb-1 block">Occupancy (E)</label><input type="number" value={occupancyFactor} onChange={e => setOccupancyFactor(e.target.value)} step="0.05" className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
                <div><label className="text-xs font-bold mb-1 block">Distance (m)</label><input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {result && (
                <div className={`p-4 rounded-lg text-center mt-4 relative ${result.pass ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    <div className="absolute top-2 right-2"><button onClick={handleSave}><Icon path={ICONS.notepad} className="w-5 h-5 text-slate-500 hover:text-black"/></button></div>
                    <p className={`text-2xl font-extrabold ${result.pass ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>{result.title}</p>
                    <div className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{result.details.map((d,i) => <p key={i}>{d}</p>)}</div>
                </div>
            )}
        </div>
    );
};

const DecayInStorageCalculator = ({ radionuclides, nuclideSymbol, setNuclideSymbol, currentRate, setCurrentRate, limit, setLimit, result, setResult }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    React.useEffect(() => {
        const n = radionuclides?.find(r => r.symbol === nuclideSymbol);
        const R_curr = safeParseFloat(currentRate); const R_lim = safeParseFloat(limit);
        if (!n || isNaN(R_curr) || isNaN(R_lim)) { setResult(null); return; }
        
        // Safety: If already below limit, days = 0.
        if (R_curr <= R_lim) { 
            setResult({ days: 0, date: 'Now', hl: 0 }); 
            return; 
        }
        
        const hlSeconds = parseHalfLifeToSeconds(n.halfLife);
        const hlDays = hlSeconds / 86400;
        if (hlDays === 0) return;
        
        const lambda = Math.log(2) / hlDays;
        const timeDays = -Math.log(R_lim / R_curr) / lambda;
        const releaseDate = new Date();
        releaseDate.setDate(releaseDate.getDate() + Math.ceil(timeDays));
        
        setResult({ days: Math.ceil(timeDays), date: releaseDate.toLocaleDateString(), hl: hlDays });
    }, [nuclideSymbol, currentRate, limit, radionuclides]);
    
    const handleSave = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'Waste Storage', icon: ICONS.trash, inputs: `${nuclideSymbol} @ ${currentRate} mR/hr`, result: `Hold ${result.days} days`, view: VIEWS.MEDICAL });
            addToast("Saved!");
        }
    };
    
    return (
        <div className="space-y-4">
            <div><label className="text-xs font-bold mb-1 block">Waste Isotope</label>{nuclideSymbol ? <CalculatorNuclideInfo nuclide={radionuclides.find(n => n.symbol === nuclideSymbol)} onClear={() => setNuclideSymbol('')} /> : <SearchableSelect options={radionuclides} onSelect={setNuclideSymbol} placeholder="Select nuclide..." />}</div>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold mb-1 block">Current Rate (mR/hr)</label><input type="number" value={currentRate} onChange={e => setCurrentRate(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
                <div><label className="text-xs font-bold mb-1 block">Release Limit</label><input type="number" value={limit} onChange={e => setLimit(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
            </div>
            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 text-center animate-fade-in relative">
                    <div className="absolute top-2 right-2"><button onClick={handleSave}><Icon path={ICONS.notepad} className="w-5 h-5 text-slate-400 hover:text-sky-500"/></button></div>
                    <p className="text-xs uppercase font-bold text-slate-500">Hold For</p>
                    <p className="text-4xl font-extrabold text-sky-600 dark:text-sky-400 my-1">{result.days} <span className="text-xl text-slate-500">Days</span></p>
                    <div className="mt-2 border-t border-slate-300 dark:border-slate-600 pt-2">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Release Date: {result.date}</p>
                        {result.hl > 0 && <p className="text-xs text-slate-400">({(result.days / result.hl).toFixed(1)} Half-Lives)</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

const EffectiveHalfLifeCalculator = ({ radionuclides }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const [selectedSymbol, setSelectedSymbol] = React.useState('');
    const [bioHalfLife, setBioHalfLife] = React.useState('');
    const [bioUnit, setBioUnit] = React.useState('hours');
    
    // NEW: Manual Physical T1/2 State
    const [useManualTp, setUseManualTp] = React.useState(false);
    const [manualTp, setManualTp] = React.useState('');
    const [manualTpUnit, setManualTpUnit] = React.useState('hours');
    
    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState('');

    const toHours = (val, unit) => { const factors = { 'seconds': 1/3600, 'minutes': 1/60, 'hours': 1, 'days': 24, 'years': 8760 }; return val * (factors[unit] || 1); };
    const formatTime = (hours) => { if (hours < 1) return `${(hours * 60).toFixed(2)} min`; if (hours > 48) return `${(hours / 24).toFixed(2)} days`; return `${hours.toFixed(2)} hours`; };
    const parseDbHalfLife = (hlString) => {
        if (!hlString || hlString === 'Stable') return null;
        const parts = hlString.split(' '); if (parts.length < 2) return null;
        const val = safeParseFloat(parts[0]); const unit = parts[1].toLowerCase();
        let normUnit = 'hours';
        if (unit.startsWith('s')) normUnit = 'seconds'; else if (unit.startsWith('m') && !unit.startsWith('mo')) normUnit = 'minutes'; else if (unit.startsWith('h')) normUnit = 'hours'; else if (unit.startsWith('d')) normUnit = 'days'; else if (unit.startsWith('y')) normUnit = 'years';
        return toHours(val, normUnit);
    };

    const handleCalculate = () => {
        setError(''); setResult(null);
        
        let tp_hours = 0;
        let displaySym = selectedSymbol;
        
        if (useManualTp) {
            const val = safeParseFloat(manualTp);
            if(isNaN(val) || val <= 0) { setError('Invalid Manual T½'); return; }
            tp_hours = toHours(val, manualTpUnit);
            displaySym = "Custom Isotope";
        } else {
            if (!selectedSymbol) { setError('Please select a radionuclide.'); return; }
            const nuclide = radionuclides.find(n => n.symbol === selectedSymbol);
            tp_hours = parseDbHalfLife(nuclide.halfLife);
            if (!tp_hours) { setError('Invalid physical half-life in database.'); return; }
        }

        const bioVal = safeParseFloat(bioHalfLife);
        if (isNaN(bioVal) || bioVal <= 0) { setError('Please enter a valid biological half-life.'); return; }
        const tb_hours = toHours(bioVal, bioUnit);
        
        // Teff = (Tp * Tb) / (Tp + Tb)
        const teff_hours = (tp_hours * tb_hours) / (tp_hours + tb_hours);
        setResult({ nuclide: displaySym, Tp: tp_hours, Tb: tb_hours, Teff: teff_hours, formattedTp: formatTime(tp_hours), formattedTb: formatTime(tb_hours), formattedTeff: formatTime(teff_hours), ratio: (teff_hours / tp_hours) });
    };

    const handleSave = () => {
        if (!result) return;
        addHistory({ id: Date.now(), type: 'Medical Calc', icon: ICONS.medical, inputs: `${result.nuclide} (Tb=${result.formattedTb})`, result: `Teff: ${result.formattedTeff}`, view: VIEWS.MEDICAL });
        addToast("Saved!");
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase">1. Physical Half-Life (T<sub>p</sub>)</h3>
                    <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={useManualTp} onChange={e => setUseManualTp(e.target.checked)} className="form-checkbox h-3 w-3 rounded text-sky-600" /> Manual Entry</label>
                </div>
                
                {useManualTp ? (
                    <div className="flex gap-2 animate-fade-in">
                        <input type="number" value={manualTp} onChange={e => setManualTp(e.target.value)} className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600" placeholder="e.g. 6.0" />
                        <select value={manualTpUnit} onChange={e => setManualTpUnit(e.target.value)} className="p-2 rounded border bg-slate-100 dark:bg-slate-800 dark:border-slate-600"><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select>
                    </div>
                ) : (
                    <>
                        {selectedSymbol ? (
                            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border dark:border-slate-600">
                                <span className="font-bold">{selectedSymbol}</span><span className="font-mono text-sm text-slate-500">{radionuclides.find(n => n.symbol === selectedSymbol)?.halfLife}</span>
                                <button onClick={() => { setSelectedSymbol(''); setResult(null); }} className="text-red-500 hover:underline text-xs ml-2">Change</button>
                            </div>
                        ) : (<SearchableSelect options={radionuclides} onSelect={setSelectedSymbol} placeholder="Select Radionuclide..." />)}
                    </>
                )}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">2. Biological Half-Life (T<sub>b</sub>)</h3>
                <div className="flex gap-2"><input type="number" value={bioHalfLife} onChange={e => setBioHalfLife(e.target.value)} className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600" placeholder="e.g. 24" /><select value={bioUnit} onChange={e => setBioUnit(e.target.value)} className="p-2 rounded border bg-slate-100 dark:bg-slate-800 dark:border-slate-600"><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div>
            </div>
            <button onClick={handleCalculate} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-md">Calculate T<sub>eff</sub></button>
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            {result && (
                <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-900 rounded-xl text-center animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-1000" style={{ width: `${result.ratio * 100}%` }}></div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Effective Half-Life</p>
                    <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-2">{result.formattedTeff}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-sm">
                        <div><p className="text-slate-500">Physical (T<sub>p</sub>)</p><p className="font-mono font-bold">{result.formattedTp}</p></div>
                        <div><p className="text-slate-500">Biological (T<sub>b</sub>)</p><p className="font-mono font-bold">{result.formattedTb}</p></div>
                    </div>
                    <div className="mt-4 text-xs text-slate-400 italic">Formula: (T<sub>p</sub> × T<sub>b</sub>) / (T<sub>p</sub> + T<sub>b</sub>)</div>
                    <button onClick={handleSave} className="mt-3 text-sky-600 hover:underline text-xs font-bold">Save Result</button>
                </div>
            )}
        </div>
    );
};

/**
 * @description A component to display sortable and filterable data tables of all radionuclide emissions.
 * NOTE: This must be defined BEFORE PeakIdentifier so it can be used there.
 */
const PeakDataTables = ({ radionuclides, onNuclideClick }) => {
    const [activeTable, setActiveTable] = React.useState('gamma');
    const [sortConfig, setSortConfig] = React.useState({ key: 'energyMeV', direction: 'ascending' });
    const [filterText, setFilterText] = React.useState('');

    // Local fallback styles
    const CATEGORY_STYLES = {
        'Medical': { border: 'border-l-emerald-400', bg: 'bg-emerald-100', text: 'text-emerald-800' },
        'Industrial': { border: 'border-l-amber-400', bg: 'bg-amber-100', text: 'text-amber-800' },
        'NORM': { border: 'border-l-blue-400', bg: 'bg-blue-100', text: 'text-blue-800' },
        'SNM': { border: 'border-l-rose-500', bg: 'bg-rose-100', text: 'text-rose-800' },
        'Fission Product': { border: 'border-l-purple-500', bg: 'bg-purple-100', text: 'text-purple-800' },
        'default': { border: 'border-l-slate-400', bg: 'bg-slate-100', text: 'text-slate-700' }
    };

    const parseEnergy = React.useCallback((energyStr) => {
        if (!energyStr) return null;
        const energyRegex = /([\d.]+)\s*(MeV|keV)/i;
        const energyMatch = energyStr.match(energyRegex);
        if (!energyMatch) return null;
        let energyMeV = safeParseFloat(energyMatch[1]);
        if (energyMatch[2].toLowerCase() === 'kev') energyMeV /= 1000;
        return { energyMeV, displayEnergy: energyStr };
    }, []);

    // 1. Heavy Lifting: Flatten Data Once
    const flattenedData = React.useMemo(() => {
        const data = { gamma: [], alpha: [], beta: [] };
        if (!radionuclides) return data;

        radionuclides.forEach(nuclide => {
            Object.keys(data).forEach(type => {
                nuclide.emissionEnergies?.[type]?.forEach(energyStr => {
                    const parsed = parseEnergy(energyStr);
                    if (parsed) data[type].push({ nuclideSymbol: nuclide.symbol, nuclideName: nuclide.name, category: nuclide.category, ...parsed });
                });
            });
            if (nuclide.daughterEmissions) {
                const daughterNuclide = radionuclides.find(n => n.symbol === nuclide.daughterEmissions.from);
                const daughterCategory = daughterNuclide ? daughterNuclide.category : 'N/A';
                Object.keys(data).forEach(type => {
                    nuclide.daughterEmissions?.[type]?.forEach(energyStr => {
                        const parsed = parseEnergy(energyStr);
                        if (parsed) {
                            const daughterName = `${nuclide.daughterEmissions.from} (from ${nuclide.symbol})`;
                            data[type].push({ nuclideSymbol: nuclide.daughterEmissions.from, nuclideName: daughterName, category: daughterCategory, ...parsed });
                        }
                    });
                });
            }
        });
        return data;
    }, [radionuclides, parseEnergy]);

    // 2. Filter & Sort Efficiently
    const sortedAndFilteredData = React.useMemo(() => {
        let dataToProcess = flattenedData[activeTable] || [];
        
        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            dataToProcess = dataToProcess.filter(item => 
                item.nuclideName.toLowerCase().includes(lowerFilter) || 
                item.displayEnergy.toLowerCase().includes(lowerFilter)
            );
        }
        
        if (sortConfig.key) {
            dataToProcess.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return dataToProcess;
    }, [flattenedData, activeTable, sortConfig, filterText]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key) => (sortConfig.key !== key ? '↕' : sortConfig.direction === 'ascending' ? '▲' : '▼');

    const handleExportCSV = () => {
        if (sortedAndFilteredData.length === 0) return;
        const headers = ['Nuclide', 'Energy', 'Category'];
        const rows = sortedAndFilteredData.map(item => [`"${item.nuclideName}"`, item.displayEnergy, item.category].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `${activeTable}_emissions_data.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in space-y-4">
            
            <div className="flex w-full p-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                {['alpha', 'beta', 'gamma'].map(type => (
                    <button key={type} onClick={() => setActiveTable(type)} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors capitalize ${activeTable === type ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                        {type === 'gamma' ? 'γ' : type === 'beta' ? 'β' : 'α'} {type}
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="relative flex-grow w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icon path={ICONS.search} className="w-4 h-4 text-slate-400" /></div>
                    <input type="text" placeholder={`Filter by nuclide or energy...`} value={filterText} onChange={(e) => setFilterText(e.target.value)} className="w-full p-2 pl-9 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm focus:ring-2 focus:ring-sky-500" />
                </div>
                <button onClick={handleExportCSV} className="w-full sm:w-auto px-4 py-2 text-sm bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition flex items-center justify-center gap-2">
                    <Icon path={ICONS.database} className="w-4 h-4" /> Export CSV
                </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 cursor-pointer whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => requestSort('nuclideName')}>Nuclide {getSortIndicator('nuclideName')}</th>
                            <th className="p-3 cursor-pointer whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => requestSort('energyMeV')}>Emission Energy {getSortIndicator('energyMeV')}</th>
                            <th className="p-3 cursor-pointer whitespace-nowrap hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => requestSort('category')}>Category {getSortIndicator('category')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {sortedAndFilteredData.length > 0 ? (
                            sortedAndFilteredData.map((item, index) => {
                                const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES['default'];
                                const borderClass = style.border ? style.border.replace('border-l-', 'border-') : 'border-slate-300';
                                const bgClass = style.bg || 'bg-slate-100';
                                const textClass = style.text || 'text-slate-700';
                                const badgeClass = `px-2 py-0.5 text-xs font-semibold rounded-full border ${borderClass} ${bgClass} ${textClass} dark:bg-slate-800`;

                                return (
                                    <tr key={`${item.nuclideSymbol}-${item.displayEnergy}-${index}`} className="hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors">
                                        <td className="p-3 font-medium">
                                            <button onClick={() => { const nuclideToFind = radionuclides.find(n => n.symbol === item.nuclideSymbol); if (nuclideToFind) onNuclideClick(nuclideToFind);}} className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-2">
                                                {item.nuclideName}
                                                <Icon path={ICONS.arrowRight || "M9 5l7 7-7 7"} className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </td>
                                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.displayEnergy}</td>
                                        <td className="p-3"><span className={badgeClass}>{item.category || 'Other'}</span></td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    No emissions found matching "{filterText}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-slate-400 text-right mt-2">Showing {sortedAndFilteredData.length} records</p>
        </div>
    );
};

/**
 * @description Smart Peak Search Tool. Identifies potential isotopes based on energy peaks.
 * NOTE: Uses PeakDataTables defined above.
 */
const PeakIdentifier = ({ radionuclides, onNuclideClick }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();

    const [peakIdMode, setPeakIdMode] = React.useState('search');

    // Search Tool State
    const [searchEnergy, setSearchEnergy] = React.useState('');
    const [resolution, setResolution] = React.useState('low'); // 'high' (HPGe) or 'low' (NaI)
    const [minYield, setMinYield] = React.useState('1');
    const [matches, setMatches] = React.useState([]);
    const [analysis, setAnalysis] = React.useState(null);

    // --- LIBRARY GENERATION ---
    const PEAK_LIBRARY = React.useMemo(() => {
        const lib = [];
        
        // 1. Ingest from DB
        if (radionuclides) {
            radionuclides.forEach(n => {
                if (n.emissionEnergies && n.emissionEnergies.gamma) {
                    n.emissionEnergies.gamma.forEach(eStr => {
                        const match = eStr.match(/([\d.]+)/);
                        if (match) {
                            let energy = safeParseFloat(match[1]);
                            if (eStr.includes('MeV')) energy *= 1000; 
                            
                            lib.push({ 
                                symbol: n.symbol, 
                                name: n.name, 
                                energy: energy, 
                                yield: 0, 
                                confirm: null,
                                isUnknownYield: true 
                            });
                        }
                    });
                }
            });
        }

        // 2. Fallback/Enrichment with High Quality Data
        const COMMON_ISOTOPES = [
            { symbol: 'Cs-137', name: 'Cesium-137', energy: 661.7, yield: 85.1, confirm: 'Single Peak' },
            { symbol: 'Co-60', name: 'Cobalt-60', energy: 1173.2, yield: 99.8, confirm: 'Look for 1332.5 keV' },
            { symbol: 'Co-60', name: 'Cobalt-60', energy: 1332.5, yield: 99.9, confirm: 'Look for 1173.2 keV' },
            { symbol: 'Am-241', name: 'Americium-241', energy: 59.5, yield: 35.9, confirm: 'Check for Alpha' },
            { symbol: 'I-131', name: 'Iodine-131', energy: 364.5, yield: 81.2, confirm: 'Look for 284, 637 keV' },
            { symbol: 'Tc-99m', name: 'Technetium-99m', energy: 140.5, yield: 89.0, confirm: 'Medical Short-lived' },
            { symbol: 'K-40', name: 'Potassium-40', energy: 1460.8, yield: 10.7, confirm: 'Background NORM' },
            { symbol: 'Ra-226', name: 'Radium-226', energy: 186.2, yield: 3.6, confirm: 'Check for 351, 609 keV' },
            { symbol: 'U-235', name: 'Uranium-235', energy: 185.7, yield: 57.2, confirm: 'Look for 143, 163, 205 keV' },
            { symbol: 'Ir-192', name: 'Iridium-192', energy: 316.5, yield: 82.7, confirm: 'Look for 468, 308 keV' },
            { symbol: 'Ir-192', name: 'Iridium-192', energy: 468.1, yield: 47.8, confirm: 'Look for 316, 308 keV' },
        ];
        
        COMMON_ISOTOPES.forEach(iso => {
            const existingIndex = lib.findIndex(l => l.symbol === iso.symbol && Math.abs(l.energy - iso.energy) < 2);
            if (existingIndex > -1) {
                lib[existingIndex] = { ...lib[existingIndex], ...iso, isUnknownYield: false };
            } else {
                lib.push({ ...iso, isUnknownYield: false });
            }
        });
        
        return lib;
    }, [radionuclides]);

    const LEAD_XRAYS = [
        { name: 'Pb K-α2', energy: 72.80 },
        { name: 'Pb K-α1', energy: 74.97 },
        { name: 'Pb K-β3', energy: 84.45 },
        { name: 'Pb K-β1', energy: 84.94 },
        { name: 'Pb K-β2', energy: 87.36 },
    ];

    // --- SEARCH LOGIC ---
    React.useEffect(() => {
        const energyVal = safeParseFloat(searchEnergy);
        if (!searchEnergy || isNaN(energyVal)) { setMatches([]); setAnalysis(null); return; }
        
        // Tolerance: High Res = max(1 keV, 0.3%), Low Res = max(10 keV, 7%)
        let tolerance = resolution === 'high' 
            ? Math.max(1.0, energyVal * 0.003) 
            : Math.max(10.0, energyVal * 0.07);
        
        const yieldCutoff = safeParseFloat(minYield) || 0;
        
        const results = PEAK_LIBRARY.filter(iso => {
            const delta = Math.abs(iso.energy - energyVal);
            const yieldPass = iso.isUnknownYield ? true : (iso.yield >= yieldCutoff);
            return delta <= tolerance && yieldPass;
        });
        
        results.sort((a, b) => {
            const deltaA = Math.abs(a.energy - energyVal);
            const deltaB = Math.abs(b.energy - energyVal);
            // Prioritize Energy match first if >1keV difference
            if (Math.abs(deltaA - deltaB) > 1.0) return deltaA - deltaB;
            // Then Yield
            return b.yield - a.yield;
        });
        
        setMatches(results);
        
        // Analyze artifacts
        const targetMeV = energyVal / 1000;
        const mc2 = 0.511;
        const comptonEdge = targetMeV / (1 + (mc2 / (2 * targetMeV)));
        const singleEscape = targetMeV > 1.022 ? targetMeV - 0.511 : null;
        const doubleEscape = targetMeV > 1.022 ? targetMeV - 1.022 : null;
        const leadXrayMatch = LEAD_XRAYS.find(xray => Math.abs(xray.energy - energyVal) <= tolerance);
        
        setAnalysis({
            comptonEdge: (comptonEdge * 1000).toFixed(1),
            singleEscape: singleEscape ? (singleEscape * 1000).toFixed(1) : null,
            doubleEscape: doubleEscape ? (doubleEscape * 1000).toFixed(1) : null,
            isLeadXray: leadXrayMatch ? leadXrayMatch.name : null,
        });
        
    }, [searchEnergy, resolution, minYield, PEAK_LIBRARY]);

    const handleSave = () => {
        if (matches.length > 0) {
            addHistory({ id: Date.now(), type: 'Peak ID', icon: ICONS.gammaSpec, inputs: `${searchEnergy} keV (${resolution})`, result: `Match: ${matches[0].symbol}`, view: VIEWS.PEAK_ID });
            addToast("Saved!");
        }
    };

    const handleClearInputs = () => {
        setSearchEnergy(''); setResolution('low'); setMinYield('1'); setMatches([]); setAnalysis(null);
    };

    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Peak Identifier</h2>
                    <button onClick={handleClearInputs} className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1">
                        <Icon path={ICONS.clear} className="w-3 h-3"/> Clear
                    </button>
                </div>
            
                <div className="flex w-full p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
                    <button onClick={() => setPeakIdMode('search')} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${peakIdMode === 'search' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Search</button>
                    <button onClick={() => setPeakIdMode('tables')} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${peakIdMode === 'tables' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Data Tables</button>
                </div>
            
                {peakIdMode === 'search' ? (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-sm font-medium">Peak Energy (keV)</label><input type="number" value={searchEnergy} onChange={e => setSearchEnergy(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700 font-bold text-lg" autoFocus placeholder="e.g. 662"/></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block text-sm font-medium">Min Yield %</label><input type="number" value={minYield} onChange={e => setMinYield(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                                <div><label className="block text-sm font-medium">Detector</label><select value={resolution} onChange={e => setResolution(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"><option value="low">NaI (Low)</option><option value="high">HPGe (High)</option></select></div>
                            </div>
                        </div>
            
                        {analysis && (
                            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Artifact Analysis</h3>
                                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                    <div><p className="text-xs text-slate-400">Compton Edge</p><p className="font-mono">{analysis.comptonEdge} keV</p></div>
                                    {analysis.singleEscape && <div><p className="text-xs text-slate-400">Single Esc.</p><p className="font-mono">{analysis.singleEscape} keV</p></div>}
                                    {analysis.doubleEscape && <div><p className="text-xs text-slate-400">Double Esc.</p><p className="font-mono">{analysis.doubleEscape} keV</p></div>}
                                </div>
                                {analysis.isLeadXray && <p className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 text-center">Possible {analysis.isLeadXray} X-ray (Shielding Artifact)</p>}
                            </div>
                        )}
            
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {matches.length > 0 ? (
                                matches.map((m, idx) => (
                                    <div key={idx} onClick={() => { if(m.symbol) { const n = radionuclides.find(r => r.symbol === m.symbol); if(n) onNuclideClick(n); } }} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-sky-200 cursor-pointer transition-all">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-sky-600 dark:text-sky-400">{m.name} ({m.symbol})</p>
                                                <div className="flex gap-2 text-xs mt-1">
                                                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{m.energy.toFixed(1)} keV</span>
                                                    {m.isUnknownYield ? (
                                                        <span className="bg-slate-200 dark:bg-slate-600 px-1 rounded text-slate-500 dark:text-slate-400 italic">Yield: N/A</span>
                                                    ) : (
                                                        <span className="bg-slate-200 dark:bg-slate-600 px-1 rounded text-slate-600 dark:text-slate-300">Y: {m.yield}%</span>
                                                    )}
                                                </div>
                                                {m.confirm && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic"><Icon path={ICONS.gammaSpec} className="w-3 h-3 inline mr-1"/>{m.confirm}</p>}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${Math.abs(m.energy - safeParseFloat(searchEnergy)) < 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Δ {Math.abs(m.energy - safeParseFloat(searchEnergy)).toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-slate-400 py-4">{searchEnergy ? "No matches found." : "Enter energy to search."}</p>
                            )}
                        </div>
                        {matches.length > 0 && <div className="mt-4 flex justify-center"><button onClick={handleSave} className="text-sm font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"><Icon path={ICONS.notepad} className="w-4 h-4"/> Save Top Match</button></div>}
                    </div>
                ) : (
                    <PeakDataTables radionuclides={radionuclides} onNuclideClick={onNuclideClick} />
                )}
            </div>
        </div>
    );
};

/**
 * @description A calculator that uses the Bateman equations to model the activity of every
 * nuclide in a full decay series over time. Now supports Mass input and Sub-Chain selection.
 * @param {{radionuclides: Array<object>, decaySeriesData: Array<object>}} props
 */

const DecaySeriesCalculator = ({ radionuclides, decaySeriesData, theme, onNuclideClick }) => {
    const { settings } = React.useContext(SettingsContext);
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // --- 1. DYNAMIC SUB-CHAINS ---
    const availableSeries = React.useMemo(() => {
        const list = [];
        decaySeriesData.forEach(series => {
            // Add the main series
            list.push({ label: series.name, value: `${series.id}|0`, chain: series.chain });
            
            // Add useful sub-chains
            if (series.id === 'U-238-series') {
                const raIndex = series.chain.findIndex(s => s.nuclide === 'Radium-226');
                if (raIndex > -1) list.push({ label: 'Radium-226 (Sub-chain of U-238)', value: `${series.id}|${raIndex}`, chain: series.chain.slice(raIndex) });
            }
            if (series.id === 'Th-232-series') {
                const th228Index = series.chain.findIndex(s => s.nuclide === 'Thorium-228');
                if (th228Index > -1) list.push({ label: 'Thorium-228 (Sub-chain of Th-232)', value: `${series.id}|${th228Index}`, chain: series.chain.slice(th228Index) });
            }
        });
        return list;
    }, [decaySeriesData]);
    
    // --- STATE ---
    const [selectedSeriesValue, setSelectedSeriesValue] = React.useState(availableSeries[0]?.value || '');
    
    // Input Mode: Activity vs Mass
    const [inputMode, setInputMode] = React.useState('activity'); // 'activity' or 'mass'
    const [inputValue, setInputValue] = React.useState('100'); 
    const [inputUnit, setInputUnit] = React.useState('µCi'); 
    
    // Time
    const [timeElapsed, setTimeElapsed] = React.useState('100');
    const [timeUnit, setTimeUnit] = React.useState('years');
    
    const [results, setResults] = React.useState([]);
    const [chartData, setChartData] = React.useState(null);
    const [rawDataForExport, setRawDataForExport] = React.useState(null); 
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    
    // Persist log scale preference
    const [useLogScale, setUseLogScale] = React.useState(() => {
        const saved = localStorage.getItem('series_useLogScale');
        return saved ? JSON.parse(saved) : (settings.chartScale === 'Logarithmic');
    });
    
    React.useEffect(() => {
        localStorage.setItem('series_useLogScale', JSON.stringify(useLogScale));
    }, [useLogScale]);
    
    // Units lists
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq', 'TBq'] : ['µCi', 'mCi', 'Ci'], [settings.unitSystem]);
    const massUnitsList = ['µg', 'mg', 'g', 'kg'];
    const timeUnitsList = ['seconds', 'minutes', 'hours', 'days', 'years', 'kiloyears', 'megayears', 'gigayears'];
    
    // Factors
    const activityFactorsBq = { 'Bq': 1, 'kBq': 1e3, 'MBq': 1e6, 'GBq': 1e9, 'TBq': 1e12, 'µCi': 3.7e4, 'mCi': 3.7e7, 'Ci': 3.7e10 };
    const massFactorsG = { 'µg': 1e-6, 'mg': 1e-3, 'g': 1, 'kg': 1000 };
    const unitConversionsTime = { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400, 'years': 31557600, 'kiloyears': 31557600 * 1e3, 'megayears': 31557600 * 1e6, 'gigayears': 31557600 * 1e9 };
    
    // Get active chain based on selection
    const activeSeriesObj = React.useMemo(() => availableSeries.find(s => s.value === selectedSeriesValue), [selectedSeriesValue, availableSeries]);
    
    const handleRowClick = (nuclideName) => {
        // Clean the name in case the click comes from a complex label
        const cleanName = nuclideName.split('(')[0].trim();
        const found = radionuclides.find(n => n.name === cleanName || n.symbol === cleanName);
        if (found && onNuclideClick) {
            onNuclideClick(found);
        }
    };
    
    const handleCalculate = () => {
        if (!activeSeriesObj) { setError('Please select a decay series.'); return; }
        const val = safeParseFloat(inputValue);
        const t_input = safeParseFloat(timeElapsed);
        
        if (isNaN(val) || val <= 0 || isNaN(t_input) || t_input < 0) {
            setError('Inputs must be non-negative numbers.');
            setResults([]); setChartData(null); return;
        }
        setError(''); setIsLoading(true);
        
        setTimeout(() => {
            try {
                // 1. Determine Initial Activity (A0) in Bq
                let A0_Bq = 0;
            
                if (inputMode === 'activity') {
                    A0_Bq = val * activityFactorsBq[inputUnit];
                } else { // Mass to Activity Calculation
                    // Helper to get clean parent name
                    const rawParentName = activeSeriesObj.chain[0].nuclide;
                    const parentName = rawParentName.split('(')[0].trim(); // CLEANING STEP
                    
                    const parentNuclide = radionuclides.find(n => n.name === parentName || n.symbol === parentName);
            
                    if (!parentNuclide) {
                        throw new Error(`Data for parent nuclide ${parentName} not found.`);
                    }
                    if (parentNuclide.halfLife === 'Stable') {
                        throw new Error(`Cannot calculate activity from mass for a stable nuclide.`);
                    }
            
                    let sa_Bq_g = parseSpecificActivity(parentNuclide.specificActivity);
            
                    // If specific activity is not pre-calculated in the database, calculate it.
                    if (!sa_Bq_g || sa_Bq_g === 0) {
                        const hl_seconds = parseHalfLifeToSeconds(parentNuclide.halfLife);
                        const match = parentNuclide.symbol.match(/-(\d+)/);
            
                        if (!match || !match[1]) {
                            throw new Error(`Could not determine atomic mass for ${parentNuclide.name}.`);
                        }
                        const atomicMass = parseInt(match[1], 10);
                        const AVOGADRO = 6.02214076e23;
            
                        if (hl_seconds === Infinity || hl_seconds === 0) {
                            throw new Error(`Invalid half-life for ${parentNuclide.name}.`);
                        }
            
                        sa_Bq_g = (Math.log(2) * AVOGADRO) / (hl_seconds * atomicMass);
                    }
            
                    const mass_g = val * massFactorsG[inputUnit];
                    A0_Bq = mass_g * sa_Bq_g;
                }
            
                const t_seconds = t_input * unitConversionsTime[timeUnit];
                const flatChain = flattenChainForCalculator(activeSeriesObj.chain);
            
                // 2. Calculate Final State (Single Point)
                const calculatedActivities_Bq = runBatemanWithBranching(flatChain, A0_Bq, t_seconds);
            
                let displayFactor;
                let displayUnit;
            
                if (inputMode === 'activity') {
                    displayUnit = inputUnit;
                    displayFactor = 1 / activityFactorsBq[inputUnit];
                } else {
                    displayFactor = settings.unitSystem === 'si' ? 1 : 1 / 3.7e10;
                    displayUnit = settings.unitSystem === 'si' ? 'Bq' : 'Ci';
                }
            
                const finalResults = flatChain.map((step, i) => {
                    const act = calculatedActivities_Bq[i] * displayFactor;
                    return {
                        name: step.nuclide,
                        activity: act,
                        halfLifeSeconds: parseHalfLifeToSeconds(step.halfLife)
                    };
                });
            
                const totalActivityNow = finalResults.reduce((a, b) => a + b.activity, 0);
                setResults({ items: finalResults, total: totalActivityNow, displayUnit });
            
                // 3. Calculate Chart Data
                const chartLabels = [];
                const steps = 100;
                
                const datasets = flatChain.map((step, i) => {

                    const hl = parseHalfLifeToSeconds(step.halfLife);

                    // Always show nodes for short chains (<6 items),
                    // or if HL > 10 minutes (catch short-lived med isotopes),
                    // or if it is the very first/last nuclide.

                    const isImportant = i === 0 || i === flatChain.length - 1 || flatChain.length <= 6 || hl > 600;
                    
                    return {
                        label: step.nuclide,
                        data: [],
                        borderColor: `hsl(${(i * 360 / Math.min(activeSeriesObj.chain.length, 15)) % 360}, 70%, 50%)`,
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4,
                        hidden: !isImportant // Logic applied here
                    };
                });

                const totalData = [];
            
                // CSV Prep
                const rawCsvRows = [];
                rawCsvRows.push(['Time (' + timeUnit + ')', 'Total Activity', ...flatChain.map(s => s.nuclide)].join(','));
            
                for (let i = 0; i <= steps; i++) {
                    const timePoint = (t_input / steps) * i;
            
                    if (t_input > 10) chartLabels.push(Math.round(timePoint).toString());
                    else chartLabels.push(timePoint.toPrecision(2));
            
                    const timePoint_seconds = timePoint * unitConversionsTime[timeUnit];
            
                    const actsAtT_Bq = runBatemanWithBranching(flatChain, A0_Bq, timePoint_seconds);
            
                    let sum = 0;
                    const rowValues = [timePoint]; // For CSV
            
                    actsAtT_Bq.forEach((act_Bq, j) => {
                        const val = act_Bq * displayFactor;
                        datasets[j].data.push(val);
                        sum += val;
                        rowValues.push(val); 
                    });
            
                    totalData.push(sum);
                    rawCsvRows.push([timePoint, sum, ...actsAtT_Bq.map(v => v * displayFactor)].join(','));
                }
            
                datasets.push({
                    label: 'Total Activity',
                    data: totalData,
                    borderColor: theme === 'dark' ? '#ffffff' : '#000000', 
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.4,
                    order: 0 
                });
            
                setChartData({ labels: chartLabels, datasets, timeUnit });
                setRawDataForExport(rawCsvRows.join('\n'));
            
            } catch (e) {
                setError('Calculation error: ' + e.message);
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        }, 50);
    };
    
    // Auto-calc on chain change or unit system change
    React.useEffect(() => {
        if (selectedSeriesValue) handleCalculate();
    }, [selectedSeriesValue, settings.unitSystem]);
    
    const handleExportCSV = () => {
        if (!rawDataForExport) return;
        const blob = new Blob([rawDataForExport], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Decay_Series_Data.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleClearInputs = () => {
        setSelectedSeriesValue(availableSeries[0]?.value || '');
        setInputValue('100');
        setInputMode('activity');
        setTimeElapsed('100');
        setTimeUnit('years');
        setResults([]);
        setChartData(null);
        setError('');
        setIsLoading(false);
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Decay Series Calculator</h2>
                    <button onClick={handleClearInputs} className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1">
                        <Icon path={ICONS.clear} className="w-3 h-3" /> Clear Inputs
                    </button>
                </div>

                <ContextualNote type="info">Models complex decay chains using the Bateman equations.  <strong>Assumption:</strong> Starts with 100% pure parent isotope at Time=0 (no initial progeny).</ContextualNote>
            
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mt-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Decay Chain</label>
                        <select value={selectedSeriesValue} onChange={e => setSelectedSeriesValue(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                            {availableSeries.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
            
                    {/* Initial Quantity Input (Mass or Activity) */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Initial Quantity</label>
                        <div className="flex">
                            <input type="number" value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                            <select
                                value={inputUnit}
                                onChange={e => {
                                    const u = e.target.value;
                                    setInputUnit(u);
                                    if (massUnitsList.includes(u)) setInputMode('mass');
                                    else setInputMode('activity');
                                }}
                                className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 border border-slate-300 dark:border-slate-600 text-sm font-bold w-24"
                            >
                                <optgroup label="Activity">
                                    {activityUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                </optgroup>
                                <optgroup label="Mass">
                                    {massUnitsList.map(u => <option key={u} value={u}>{u}</option>)}
                                </optgroup>
                            </select>
                        </div>
                    </div>
            
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Time Elapsed</label>
                        <div className="flex gap-2 mt-1">
                            <input type="number" value={timeElapsed} onChange={e => setTimeElapsed(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                            <select value={timeUnit} onChange={e => setTimeUnit(e.target.value)} className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                {timeUnitsList.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
            
                    <button onClick={handleCalculate} disabled={isLoading} className="w-full md:col-span-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition disabled:bg-sky-800 disabled:cursor-wait shadow-md">
                        {isLoading ? 'Running Bateman Simulation...' : 'Calculate Chain'}
                    </button>
                </div>
            
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Chart Section */}
                    <div className="min-h-[300px]">
                        {chartData ? (
                            <>
                                <div className="flex justify-between items-center mb-2">
                                    <button onClick={handleExportCSV} className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"><Icon path={ICONS.database} className="w-3 h-3" /> Download Data (CSV)</button>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input type="checkbox" checked={useLogScale} onChange={() => setUseLogScale(!useLogScale)} className="form-checkbox h-4 w-4 rounded text-sky-600" />
                                        Use Log Scale
                                    </label>
                                </div>
                                <SeriesDecayChart chartData={chartData} useLogScale={useLogScale} theme={theme} />
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500">Chart will display here</p>
                            </div>
                        )}
                    </div>
            
                    {/* Results Table Section */}
                    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {results.items && results.items.length > 0 ? (
                            <>
                                <h3 className="text-lg font-semibold mb-2">Results at {timeElapsed} {timeUnit}</h3>
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0 z-10">
                                        <tr><th className="p-2">Nuclide</th><th className="p-2 text-right">Activity ({results.displayUnit})</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr className="bg-sky-50 dark:bg-sky-900/30 font-bold border-b border-sky-200 dark:border-sky-800">
                                            <td className="p-2">TOTAL ACTIVITY</td>
                                            <td className="p-2 text-right">{results.total.toExponential(3)}</td>
                                        </tr>
                                        {results.items.map(r => (
                                            <tr key={r.name} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-2 font-medium">
                                                    <button
                                                        onClick={() => handleRowClick(r.name)}
                                                        className="text-sky-600 dark:text-sky-400 hover:underline text-left"
                                                    >
                                                        {r.name}
                                                    </button>
                                                </td>
                                                <td className="p-2 text-right font-mono text-slate-700 dark:text-slate-300">{r.activity.toExponential(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        ) : <p className="text-center text-slate-500 dark:text-slate-400 py-4">No results to display.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * @description A combined calculator for mass-to-activity conversions and for calculating
 * specific activity from first principles.
 */

// --- 1. Specific Activity Calculator (Child Component) ---
const SpecificActivityModule = ({ radionuclides, atomicWeight, setAtomicWeight, halfLifeValue, setHalfLifeValue, halfLifeUnit, setHalfLifeUnit, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const { settings } = React.useContext(SettingsContext);
    
    const AVOGADRO = 6.02214076e23;
    const timeUnits = { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400, 'years': 31557600 };
    
    const handleNuclideSelect = (symbol) => {
        const n = radionuclides.find(r => r.symbol === symbol);
        if (n && n.halfLife !== 'Stable') {
            const match = n.symbol.match(/-(\d+)/);
            if (match) setAtomicWeight(match[1]);
            const hlSec = parseHalfLifeToSeconds(n.halfLife);
            const bestUnit = getBestHalfLifeUnit(hlSec);
            setHalfLifeUnit(bestUnit);
            setHalfLifeValue((hlSec / timeUnits[bestUnit]).toPrecision(4));
        } else {
            // Reset if cleared or invalid
            setAtomicWeight('');
            setHalfLifeValue('');
        }
    };
    
    React.useEffect(() => {
        try {
            setError('');
            const aw = safeParseFloat(atomicWeight);
            const t_val = safeParseFloat(halfLifeValue);
            
            if (isNaN(aw) || isNaN(t_val) || aw <= 0 || t_val <= 0) {
                setResult(null); return;
            }
            
            const t_seconds = t_val * timeUnits[halfLifeUnit];
            const sa_Bq_g = (Math.log(2) * AVOGADRO) / (t_seconds * aw);
            
            const valToFormat = settings.unitSystem === 'si' ? sa_Bq_g : sa_Bq_g / 3.7e10;
            const configKey = settings.unitSystem === 'si' ? 'activity_si' : 'activity_conventional';
            
            const formatted = formatSensibleUnit(valToFormat, configKey);

            setResult({
                sa_Bq_g: sa_Bq_g,
                display: `${formatted.value} ${formatted.unit}/g`
            });
        
        } catch (e) { setError(e.message); setResult(null); }
    }, [atomicWeight, halfLifeValue, halfLifeUnit, settings.unitSystem]);
    
    const handleSave = () => {
        if(result) {
            addHistory({ id: Date.now(), type: 'Specific Activity', icon: ICONS.activity, inputs: `AW: ${atomicWeight}, T½: ${halfLifeValue} ${halfLifeUnit}`, result: result.display, view: VIEWS.ACTIVITY_MASS });
            addToast("Saved!");
        }
    };
    
    return (
        <div className="space-y-4 animate-fade-in">
            <ContextualNote type="info">Calculates theoretical specific activity from first principles (SA = ln(2)·N_A / (T½·AW)).</ContextualNote>
            <div className="flex justify-end mb-2">
                <div className="w-full sm:w-1/2">
                    <SearchableSelect options={radionuclides} onSelect={handleNuclideSelect} placeholder="Auto-fill from DB..." />
                </div>
            </div>
            
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div>
                    <label className="block text-sm font-medium">Atomic Weight (g/mol)</label>
                    <input type="number" value={atomicWeight} onChange={e => setAtomicWeight(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" placeholder="e.g. 238" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Half-Life</label>
                    <div className="flex">
                        <input type="number" value={halfLifeValue} onChange={e => setHalfLifeValue(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                        <select value={halfLifeUnit} onChange={e => setHalfLifeUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 text-sm">
                            {Object.keys(timeUnits).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 text-center animate-fade-in shadow-sm relative">
                    <div className="absolute top-2 right-2"><button onClick={handleSave}><Icon path={ICONS.notepad} className="w-5 h-5 text-slate-400 hover:text-sky-600"/></button></div>
                    <p className="text-xs uppercase font-bold text-slate-500 mb-2">Theoretical Specific Activity</p>
                    <div className="flex items-center justify-center gap-2">
                        <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{result.display}</p>
                        <CopyButton textToCopy={result.display} />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 2. Mass <-> Activity Converter (Child Component) ---
const MassActivityModule = ({ radionuclides, selectedNuclide, setSelectedNuclide, mass, setMass, massUnit, setMassUnit, activity, setActivity, activityUnit, setActivityUnit, error, setError, activityUnits }) => {
    const { settings } = React.useContext(SettingsContext);
    
    const [useManualSA, setUseManualSA] = React.useState(false);
    const [manualSA, setManualSA] = React.useState('');
    const [manualSAUnit, setManualSAUnit] = React.useState(settings.unitSystem === 'si' ? 'Bq/g' : 'Ci/g');
    
    const [lastEdited, setLastEdited] = React.useState('mass'); 
    
    const massUnits = { 'µg': 1e-6, 'mg': 1e-3, 'g': 1, 'kg': 1000, 'lb': 453.592 };
    const activityFactorsBq = { 'Bq': 1, 'kBq': 1e3, 'MBq': 1e6, 'GBq': 1e9, 'TBq': 1e12, 'Ci': 3.7e10, 'mCi': 3.7e7, 'µCi': 3.7e4, 'kCi': 3.7e13 };
    const saUnitFactors = { 'Bq/g': 1, 'kBq/g': 1e3, 'MBq/g': 1e6, 'GBq/g': 1e9, 'Ci/g': 3.7e10, 'mCi/g': 3.7e7, 'µCi/g': 37000 };
    
    const getOrCalculateSA = (nuclide) => {
        if (useManualSA) {
            const val = safeParseFloat(manualSA);
            if (isNaN(val) || val <= 0) return { value: 0 };
            return { value: val * saUnitFactors[manualSAUnit] };
        }
        if (!nuclide) return { value: 0 };
        const parsedSA = parseSpecificActivity(nuclide.specificActivity);
        if (parsedSA > 0) return { value: parsedSA };
        
        const seconds = parseHalfLifeToSeconds(nuclide.halfLife);
        if (seconds === 0 || seconds === Infinity) return { value: 0 };
        const match = nuclide.symbol.match(/-(\d+)/);
        if (!match) return { value: 0 };
        const atomicMass = parseInt(match[1], 10);
        const avogadro = 6.02214076e23;
        return { value: (Math.log(2) * avogadro) / (seconds * atomicMass) };
    };
    
    const nuclidesWithSA = React.useMemo(() => radionuclides.filter(r => r.halfLife !== 'Stable').sort((a, b) => a.name.localeCompare(b.name)), [radionuclides]);
    const [activeSA, setActiveSA] = React.useState(0);
    const [moles, setMoles] = React.useState(null);
    
    React.useEffect(() => {
        const { value } = getOrCalculateSA(selectedNuclide);
        setActiveSA(value);
        
        if (value <= 0) return;

        if (lastEdited === 'mass' && mass) {
            calculateActivity(safeParseFloat(mass), massUnit, activityUnit, value);
        } else if (lastEdited === 'activity' && activity) {
            calculateMass(safeParseFloat(activity), activityUnit, massUnit, value);
        }
    }, [selectedNuclide, useManualSA, manualSA, manualSAUnit]); 
    
    const calculateActivity = (massVal, mUnit, aUnit, saVal = activeSA) => {
        if (isNaN(massVal) || massVal < 0) { setActivity(''); setMoles(null); return; }
        const massInG = massVal * massUnits[mUnit];
        if (selectedNuclide) {
            const match = selectedNuclide.symbol.match(/-(\d+)/);
            if (match) { const aw = parseInt(match[1]); setMoles(massInG / aw); }
        }
        if (saVal > 0) {
            const activityInBq = massInG * saVal;
            setActivity((activityInBq / activityFactorsBq[aUnit]).toPrecision(4));
        }
    };
    
    const calculateMass = (actVal, aUnit, mUnit, saVal = activeSA) => {
        if (isNaN(actVal) || actVal < 0) { setMass(''); setMoles(null); return; }
        if (saVal > 0) {
            const activityInBq = actVal * activityFactorsBq[aUnit];
            const massInG = activityInBq / saVal;
            setMass((massInG / massUnits[mUnit]).toPrecision(4));
            if (selectedNuclide) {
                const match = selectedNuclide.symbol.match(/-(\d+)/);
                if (match) { const aw = parseInt(match[1]); setMoles(massInG / aw); }
            }
        }
    };
    
    return (
        <div className="space-y-4 animate-fade-in">
            <ContextualNote type="info">Convert between mass and activity using Specific Activity. Assumes pure isotope.</ContextualNote>
            <div className="flex justify-end items-center mb-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-sky-600 dark:text-sky-400">
                    <input type="checkbox" checked={useManualSA} onChange={() => setUseManualSA(!useManualSA)} className="form-checkbox h-3 w-3 rounded text-sky-600" />
                    Manual SA
                </label>
            </div>
            
            {useManualSA ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-medium mb-1">Specific Activity</label>
                    <div className="flex">
                        <input type="number" value={manualSA} onChange={e => setManualSA(e.target.value)} className="w-full p-2 rounded-l-md bg-white dark:bg-slate-700 text-sm" placeholder="e.g. 3.6e10"/>
                        <select value={manualSAUnit} onChange={e => setManualSAUnit(e.target.value)} className="p-2 rounded-r-md bg-slate-100 dark:bg-slate-600 text-xs">
                            {Object.keys(saUnitFactors).map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="min-h-[42px]">
                    {selectedNuclide ? ( <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setSelectedNuclide(null)} /> ) : ( <SearchableSelect options={nuclidesWithSA} onSelect={(s) => { const n = radionuclides.find(r => r.symbol === s); setSelectedNuclide(n); }} placeholder="Search for a radionuclide..."/> )}
                </div>
            )}
            
            {!useManualSA && selectedNuclide && activeSA > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700">
                    <span>Specific Activity: <strong>{formatWithUnitSystem(activeSA, 'activity', settings).value} {formatWithUnitSystem(activeSA, 'activity', settings).unit}/g</strong></span>
                </div>
            )}
            
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-1">Mass</label>
                    <div className="flex">
                        <input 
                            type="number" 
                            value={mass} 
                            onChange={(e) => { 
                                setLastEdited('mass'); 
                                setMass(e.target.value); 
                                calculateActivity(safeParseFloat(e.target.value), massUnit, activityUnit); 
                            }} 
                            className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"
                        />
                        <select value={massUnit} onChange={(e) => { setMassUnit(e.target.value); calculateActivity(safeParseFloat(mass), e.target.value, activityUnit); }} className="p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{Object.keys(massUnits).map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
                <div className="text-center text-xl text-slate-400">⇅</div>
                <div>
                    <label className="block text-sm font-semibold mb-1">Activity</label>
                    <div className="flex">
                        <input 
                            type="number" 
                            value={activity} 
                            onChange={(e) => { 
                                setLastEdited('activity'); 
                                setActivity(e.target.value); 
                                calculateMass(safeParseFloat(e.target.value), activityUnit, massUnit); 
                            }} 
                            className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"
                        />
                        <select value={activityUnit} onChange={(e) => { setActivityUnit(e.target.value); calculateMass(safeParseFloat(activity), e.target.value, massUnit); }} className="p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
            </div>
            {moles !== null && ( <div className="mt-2 text-center"><p className="text-xs font-mono text-slate-500 dark:text-slate-400">Substance Amount: <strong>{moles.toExponential(4)} mol</strong></p></div> )}
        </div>
    );
};

// --- 3. Dose Rate <-> Activity Calculator (Child Component) ---
const ActivityFromDoseRate = ({ radionuclides, nuclideSymbol, setNuclideSymbol, doseRate, setDoseRate, doseRateUnit, setDoseRateUnit, distance, setDistance, distanceUnit, setDistanceUnit, result, setResult, error, setError, doseRateUnits, distanceUnits }) => {
    const { settings } = React.useContext(SettingsContext);
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    const [useManualGamma, setUseManualGamma] = React.useState(false);
    const [manualGamma, setManualGamma] = React.useState('');
    const [transmission, setTransmission] = React.useState('1.0');
    const [usedGamma, setUsedGamma] = React.useState(null);
    
    const gammaNuclides = React.useMemo(() => radionuclides.filter(n => n.gammaConstant).sort((a, b) => a.name.localeCompare(b.name)), [radionuclides]);
    const selectedNuclide = React.useMemo(() => gammaNuclides.find(n => n.symbol === nuclideSymbol), [nuclideSymbol, gammaNuclides]);
    
    const doseRateFactors_mrem_hr = { 'µrem/hr': 0.001, 'mrem/hr': 1, 'rem/hr': 1000, 'µSv/hr': 0.1, 'mSv/hr': 100, 'Sv/hr': 100000 };
    const distanceFactors_m = { 'mm': 0.001, 'cm': 0.01, 'm': 1, 'in': 0.0254, 'ft': 0.3048 };
    
    React.useEffect(() => {
        try {
            setError('');
            let gammaConstant = 0;
            if (useManualGamma) {
                gammaConstant = safeParseFloat(manualGamma);
                if (isNaN(gammaConstant) || gammaConstant <= 0) { setResult(null); return; }
            } else {
                if (!selectedNuclide) { setResult(null); return; }
                gammaConstant = safeParseFloat(selectedNuclide.gammaConstant);
                // Check if gamma constant is valid/exists
                if (isNaN(gammaConstant) || gammaConstant <= 0) {
                    setError(`No gamma constant found for ${selectedNuclide.symbol}. Use Manual Gamma.`);
                    setResult(null);
                    return;
                }
            }
            setUsedGamma(gammaConstant);
            
            const doseRateVal = safeParseFloat(doseRate);
            const distanceVal = safeParseFloat(distance);
            const transVal = safeParseFloat(transmission);
            
            if (isNaN(doseRateVal) || isNaN(distanceVal) || isNaN(transVal) || doseRateVal <= 0 || distanceVal <= 0 || transVal <= 0) {
                setResult(null); return;
            }
            
            const doseRate_R_hr = (doseRateVal * doseRateFactors_mrem_hr[doseRateUnit]) / 1000;
            const distance_m = distanceVal * distanceFactors_m[distanceUnit];
            const activity_Ci = (doseRate_R_hr * Math.pow(distance_m, 2)) / (gammaConstant * transVal);
            
            setResult({ rawActivity_Ci: activity_Ci });
        } catch (e) { setError(e.message); setResult(null); }
    }, [selectedNuclide, useManualGamma, manualGamma, doseRate, doseRateUnit, distance, distanceUnit, transmission]);
    
    const handleSaveToHistory = () => {
        if (result) {
            const activityInBase = settings.unitSystem === 'si' ? result.rawActivity_Ci * 3.7e10 : result.rawActivity_Ci;
            const configKey = settings.unitSystem === 'si' ? 'activity_si' : 'activity_conventional';
            const formattedResult = formatSensibleUnit(activityInBase, configKey);
            const sourceName = useManualGamma ? `Γ=${manualGamma}` : selectedNuclide.symbol;
            addHistory({ id: Date.now(), type: 'Activity from Dose', icon: ICONS.activity, inputs: `${doseRate} ${doseRateUnit} @ ${distance} ${distanceUnit}`, result: `${formattedResult.value} ${formattedResult.unit} (${sourceName})`, view: VIEWS.ACTIVITY_MASS });
            addToast("Saved!");
        }
    };
    
    return (
        <div className="space-y-4 animate-fade-in">
            <ContextualNote type="info">Calculates the source activity required to produce a measured dose rate at a specific distance using the Gamma Constant.</ContextualNote>
            <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600 dark:text-slate-400"></p>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-sky-600 dark:text-sky-400">
                    <input type="checkbox" checked={useManualGamma} onChange={() => setUseManualGamma(!useManualGamma)} className="form-checkbox h-3 w-3 rounded text-sky-600" />
                    Manual Gamma
                </label>
            </div>
            
            <div>
                {useManualGamma ? (
                    <div className="animate-fade-in p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-medium mb-1">Gamma Constant (Γ)</label>
                        <div className="relative">
                            <input type="number" value={manualGamma} onChange={e => setManualGamma(e.target.value)} className="w-full p-2 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm" placeholder="R·m²/hr·Ci" />
                        </div>
                    </div>
                ) : (
                    <div className="mt-1">
                        {selectedNuclide ? ( <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} /> ) : ( <SearchableSelect options={gammaNuclides} onSelect={setNuclideSymbol} placeholder="Select a gamma emitter..." /> )}
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Dose Rate</label>
                    <div className="flex">
                        <input type="number" value={doseRate} onChange={e => setDoseRate(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                        <select value={doseRateUnit} onChange={e => setDoseRateUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{doseRateUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Distance</label>
                    <div className="flex">
                        <input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                        <select value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Transmission (0-1)</label>
                    <input type="number" step="0.1" min="0" max="1" value={transmission} onChange={e => setTransmission(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm" placeholder="e.g., 0.5 for 1 HVL"/>
                </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            {result && (() => {
                const activityInBase = settings.unitSystem === 'si' ? result.rawActivity_Ci * 3.7e10 : result.rawActivity_Ci;
                const configKey = settings.unitSystem === 'si' ? 'activity_si' : 'activity_conventional';
                const formattedResult = formatSensibleUnit(activityInBase, configKey);
                return (
                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 text-center animate-fade-in shadow-sm relative">
                        <div className="flex justify-end absolute top-2 right-2"><button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5" /></button></div>
                        <p className="font-semibold block text-sm text-slate-500 dark:text-slate-400">Calculated Source Activity</p>
                        <div className="flex items-center justify-center mt-2">
                            <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{formattedResult.value}</p>
                            <CopyButton textToCopy={formattedResult.value} />
                        </div>
                        <p className="text-md font-medium text-slate-600 dark:text-slate-300">{formattedResult.unit}</p>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400">Used Γ: <strong>{usedGamma}</strong> R·m²/hr·Ci</div>
                    </div>
                );
            })()}
        </div>
    );
};

// --- 4. Main Container: Activity & Mass Tools ---
const ActivityAndMassTools = ({ radionuclides }) => {
    const { settings } = React.useContext(SettingsContext);
    
    // --- State: Calculator Selection ---
    const MODE_MASS_ACTIVITY = 'massActivity';
    const MODE_SPECIFIC_ACTIVITY = 'specificActivity';
    const MODE_FROM_DOSE = 'fromDose';
    const [activeTool, setActiveTool] = React.useState(MODE_MASS_ACTIVITY);
    
    // --- State: Mass/Activity Converter ---
    const [ma_selectedNuclide, setMa_selectedNuclide] = React.useState(null);
    const [ma_mass, setMa_mass] = React.useState('1');
    const [ma_massUnit, setMa_massUnit] = React.useState('g');
    const [ma_activity, setMa_activity] = React.useState('');
    const [ma_activityUnit, setMa_activityUnit] = React.useState(settings.unitSystem === 'si' ? 'Bq' : 'Ci');
    const [ma_error, setMa_error] = React.useState('');
    
    // --- State: Specific Activity ---
    const [sa_atomicWeight, setSa_atomicWeight] = React.useState('238');
    const [sa_halfLife, setSa_halfLife] = React.useState('4.468e9');
    const [sa_halfLifeUnit, setSa_halfLifeUnit] = React.useState('years');
    const [sa_result, setSa_result] = React.useState(null);
    const [sa_error, setSa_error] = React.useState('');
    
    // --- State: Activity from Dose ---
    const [ad_symbol, setAd_symbol] = React.useState('');
    const [ad_doseRate, setAd_doseRate] = React.useState('10');
    const [ad_doseRateUnit, setAd_doseRateUnit] = React.useState('mrem/hr');
    const [ad_distance, setAd_distance] = React.useState('1');
    const [ad_distanceUnit, setAd_distanceUnit] = React.useState('ft');
    const [ad_result, setAd_result] = React.useState(null);
    const [ad_error, setAd_error] = React.useState('');
    
    // Unit Lists
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq', 'TBq'] : ['µCi', 'mCi', 'Ci', 'kCi'], [settings.unitSystem]);
    const doseRateUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['µSv/hr', 'mSv/hr', 'Sv/hr'] : ['µrem/hr', 'mrem/hr', 'rem/hr', 'mR/hr', 'R/hr'], [settings.unitSystem]);
    const distanceUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['cm', 'm'] : ['in', 'ft', 'm'], [settings.unitSystem]);
    
    const handleClear = () => {
        if(activeTool === MODE_MASS_ACTIVITY) { setMa_mass('1'); setMa_activity(''); setMa_selectedNuclide(null); }
        else if(activeTool === MODE_SPECIFIC_ACTIVITY) { setSa_atomicWeight('238'); setSa_halfLife('4.468e9'); setSa_result(null); }
        else { setAd_doseRate('10'); setAd_distance('1'); setAd_result(null); setAd_symbol(''); }
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Activity & Mass Tools</h2>
                    <ClearButton onClick={handleClear} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
                    <button 
                        onClick={() => setActiveTool(MODE_MASS_ACTIVITY)} 
                        className={`p-2 rounded-md text-sm font-semibold transition-colors ${
                            activeTool === MODE_MASS_ACTIVITY 
                            ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600'
                        }`}
                    >
                        Mass ↔ Activity
                    </button>
                    <button 
                        onClick={() => setActiveTool(MODE_SPECIFIC_ACTIVITY)} 
                        className={`p-2 rounded-md text-sm font-semibold transition-colors ${
                            activeTool === MODE_SPECIFIC_ACTIVITY 
                            ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600'
                        }`}
                    >
                        Specific Activity
                    </button>
                    <button 
                        onClick={() => setActiveTool(MODE_FROM_DOSE)} 
                        className={`p-2 rounded-md text-sm font-semibold transition-colors ${
                            activeTool === MODE_FROM_DOSE 
                            ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600'
                        }`}
                    >
                        Find Source Activity
                    </button>
                </div>
                
                {activeTool === MODE_MASS_ACTIVITY && (
                    <MassActivityModule
                        radionuclides={radionuclides}
                        selectedNuclide={ma_selectedNuclide} setSelectedNuclide={setMa_selectedNuclide}
                        mass={ma_mass} setMass={setMa_mass}
                        massUnit={ma_massUnit} setMassUnit={setMa_massUnit}
                        activity={ma_activity} setActivity={setMa_activity}
                        activityUnit={ma_activityUnit} setActivityUnit={setMa_activityUnit}
                        error={ma_error} setError={setMa_error}
                        activityUnits={activityUnits}
                    />
                )}
                
                {activeTool === MODE_SPECIFIC_ACTIVITY && (
                    <SpecificActivityModule
                        radionuclides={radionuclides}
                        atomicWeight={sa_atomicWeight} setAtomicWeight={setSa_atomicWeight}
                        halfLifeValue={sa_halfLife} setHalfLifeValue={setSa_halfLife}
                        halfLifeUnit={sa_halfLifeUnit} setHalfLifeUnit={setSa_halfLifeUnit}
                        result={sa_result} setResult={setSa_result}
                        error={sa_error} setError={setSa_error}
                    />
                )}
                
                {activeTool === MODE_FROM_DOSE && (
                    <ActivityFromDoseRate
                        radionuclides={radionuclides}
                        nuclideSymbol={ad_symbol} setNuclideSymbol={setAd_symbol}
                        doseRate={ad_doseRate} setDoseRate={setAd_doseRate}
                        doseRateUnit={ad_doseRateUnit} setDoseRateUnit={setAd_doseRateUnit}
                        distance={ad_distance} setDistance={setAd_distance}
                        distanceUnit={ad_distanceUnit} setDistanceUnit={setAd_distanceUnit}
                        result={ad_result} setResult={setAd_result}
                        error={ad_error} setError={setAd_error}
                        doseRateUnits={doseRateUnits} distanceUnits={distanceUnits}
                    />
                )}
            </div>
        </div>
    );
};
        
/**
 * @description A calculator to determine the activities of a parent-daughter pair over time,
 * and to analyze the type of equilibrium present based on their half-lives.
 * Now includes Auto-Branching logic and Secular Equilibrium shortcuts.
 */

const EquilibriumCalculator = ({ radionuclides, theme }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const { settings } = React.useContext(SettingsContext);
    
    // --- STATE ---
    const [parentNuclide, setParentNuclide] = React.useState(() => {
        const savedSymbol = localStorage.getItem('equilibrium_parentSymbol');
        if (!savedSymbol) return null;
        return radionuclides.find(n => n.symbol === savedSymbol) || null;
    });
    
    // NEW: Branching State
    const [decayPaths, setDecayPaths] = React.useState([]);
    const [selectedPathIndex, setSelectedPathIndex] = React.useState(0);
    const [daughterNuclide, setDaughterNuclide] = React.useState(null);
    
    const [initialActivity, setInitialActivity] = React.useState(() => localStorage.getItem('equilibrium_initialActivity') || '100');
    const [initialDaughterActivity, setInitialDaughterActivity] = React.useState(() => localStorage.getItem('equilibrium_initialDaughterActivity') || '0');
    const [branchingFraction, setBranchingFraction] = React.useState(() => localStorage.getItem('equilibrium_branchingFraction') || '1.0');
    
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['MBq', 'GBq', 'TBq', 'Bq'] : ['mCi', 'Ci', 'µCi'], [settings.unitSystem]);
    const [activityUnit, setActivityUnit] = React.useState(() => localStorage.getItem('equilibrium_activityUnit') || activityUnits[0]);
    
    const [timeElapsed, setTimeElapsed] = React.useState(() => localStorage.getItem('equilibrium_timeElapsed') || '10');
    const [timeUnit, setTimeUnit] = React.useState(() => localStorage.getItem('equilibrium_timeUnit') || 'days');

    const [result, setResult] = React.useState(null);
    const [chartData, setChartData] = React.useState(null);
    const [error, setError] = React.useState('');
    const [analysis, setAnalysis] = React.useState(null);
    const [useLogScale, setUseLogScale] = React.useState(() => JSON.parse(localStorage.getItem('equilibrium_useLogScale')) || false);
    
    const timeUnitsOrdered = ['minutes', 'hours', 'days', 'years'];

    // --- EFFECTS ---
    React.useEffect(() => {
        localStorage.setItem('equilibrium_parentSymbol', parentNuclide ? parentNuclide.symbol : '');
        localStorage.setItem('equilibrium_initialActivity', initialActivity);
        localStorage.setItem('equilibrium_initialDaughterActivity', initialDaughterActivity);
        localStorage.setItem('equilibrium_branchingFraction', branchingFraction);
        localStorage.setItem('equilibrium_activityUnit', activityUnit);
        localStorage.setItem('equilibrium_timeElapsed', timeElapsed);
        localStorage.setItem('equilibrium_timeUnit', timeUnit);
        localStorage.setItem('equilibrium_useLogScale', JSON.stringify(useLogScale));
    }, [parentNuclide, initialActivity, initialDaughterActivity, branchingFraction, activityUnit, timeElapsed, timeUnit, useLogScale]);
    
    React.useEffect(() => {
        if (!activityUnits.includes(activityUnit)) setActivityUnit(activityUnits[0]);
    }, [settings.unitSystem]);
    
    // Filter for Parents
    const parentNuclides = React.useMemo(() => {
        return radionuclides.filter(parent => {
            if (!parent.daughter || parent.halfLife === 'Stable') return false;
            const daughterName = parent.daughter.split('(')[0].split('/')[0].split(' or ')[0].trim();
            const normDaughter = normalizeString(daughterName);
            const daughter = radionuclides.find(n => normalizeString(n.name) === normDaughter || normalizeString(n.symbol) === normDaughter);
            return daughter && daughter.halfLife !== 'Stable';
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [radionuclides]);
    
    // --- 1. HANDLE PARENT CHANGE & PARSE PATHS ---
    const handleParentChange = (symbol) => {
        const parent = parentNuclides.find(p => p.symbol === symbol);
        setResult(null); setChartData(null); setError(''); setParentNuclide(parent || null);
    };

    React.useEffect(() => {
        if (parentNuclide) {
            const dStr = parentNuclide.daughter || '';
            const rawFraction = parentNuclide.branchingFraction || 1.0;
            let newPaths = [];

            if (dStr.includes(' or ')) {
                const parts = dStr.split(' or ');
                const path1Name = parts[0].split('(')[0].trim();
                const path2Name = parts[1].split('(')[0].trim();

                newPaths.push({ name: path1Name, fraction: rawFraction, label: parts[0].trim() });
                const remainder = rawFraction < 1.0 ? (1.0 - rawFraction) : 0;
                newPaths.push({ name: path2Name, fraction: safeParseFloat(remainder.toFixed(4)), label: parts[1].trim() });
                
                setDecayPaths(newPaths);
                setSelectedPathIndex(0);
                setBranchingFraction(newPaths[0].fraction.toString());
            } 
            else {
                const cleanName = dStr.split('(')[0].trim();
                newPaths.push({ name: cleanName, fraction: rawFraction, label: dStr });
                setDecayPaths(newPaths);
                setSelectedPathIndex(0);
                
                // Legacy overrides
                if (parentNuclide.symbol === 'Mo-99' && !parentNuclide.branchingFraction) {
                    setBranchingFraction('0.875');
                } else {
                    setBranchingFraction(rawFraction.toString());
                }
            }
        } else {
            setDecayPaths([]);
            setDaughterNuclide(null);
        }
    }, [parentNuclide]);

    // --- 2. HANDLE PATH CHANGE ---
    const handlePathChange = (e) => {
        const idx = parseInt(e.target.value);
        setSelectedPathIndex(idx);
        if (decayPaths[idx]) {
            setBranchingFraction(decayPaths[idx].fraction.toString());
        }
    };

    // --- 3. RESOLVE DAUGHTER DATA & ANALYZE ---
    React.useEffect(() => {
        if (!parentNuclide || decayPaths.length === 0) {
            setAnalysis(null); setDaughterNuclide(null); return;
        }
        
        const activePath = decayPaths[selectedPathIndex];
        if(!activePath) return;

        const normDaughter = normalizeString(activePath.name);
        const foundDaughter = radionuclides.find(n => normalizeString(n.name) === normDaughter || normalizeString(n.symbol) === normDaughter);
        
        if (!foundDaughter) {
            setAnalysis({ type: 'Analysis Error', message: `Data for ${activePath.name} not found in database.` });
            setDaughterNuclide(null);
            return;
        }
        setDaughterNuclide(foundDaughter);
        
        const T1_seconds = parseHalfLifeToSeconds(parentNuclide.halfLife);
        const T2_seconds = parseHalfLifeToSeconds(foundDaughter.halfLife);
        
        let type, message, theoreticalRatio = null, timeToEq = null, timeToMax = null;
        
        if (T1_seconds < T2_seconds) {
            type = 'No Equilibrium';
            message = `Parent half-life (${parentNuclide.halfLife}) is shorter than daughter half-life (${foundDaughter.halfLife}). No equilibrium will occur.`;
        } else if (T1_seconds > 100 * T2_seconds) {
            type = 'Secular Equilibrium';
            theoreticalRatio = 1.0;
            timeToEq = (7 * T2_seconds); // ~99% saturation
            message = `Parent half-life is much longer than daughter's. Daughter activity will eventually equal parent activity (adjusted for branching).`;
        } else {
            type = 'Transient Equilibrium';
            const lambda1 = Math.log(2) / T1_seconds;
            const lambda2 = Math.log(2) / T2_seconds;
            theoreticalRatio = lambda2 / (lambda2 - lambda1);
            timeToMax = Math.log(lambda2 / lambda1) / (lambda2 - lambda1);
            timeToEq = timeToMax * 2; 
            message = `Half-lives are comparable. Daughter will rise, exceed parent, then decay in lock-step.`;
        }
        
        setAnalysis({ type, message, theoreticalRatio, timeToEq, timeToMax });
        
    }, [parentNuclide, decayPaths, selectedPathIndex, radionuclides]);
    
    // --- CALCULATION ---
    const handleCalculate = () => {
        if (!parentNuclide || !daughterNuclide) return;
        
        const N0_parent = safeParseFloat(initialActivity);
        const N0_daughter = safeParseFloat(initialDaughterActivity);
        const br = safeParseFloat(branchingFraction);
        const t_input = safeParseFloat(timeElapsed);
        
        if ([N0_parent, N0_daughter, br, t_input].some(isNaN) || N0_parent < 0 || N0_daughter < 0 || br < 0 || br > 1 || t_input < 0) {
            setError('Please enter valid inputs.'); return;
        }
        setError('');
        
        const T1_seconds = parseHalfLifeToSeconds(parentNuclide.halfLife);
        const T2_seconds = parseHalfLifeToSeconds(daughterNuclide.halfLife);
        const unitConversions = { 'minutes': 60, 'hours': 3600, 'days': 86400, 'years': 31557600 };
        const t_seconds = t_input * unitConversions[timeUnit];
        const lambda1 = Math.log(2) / T1_seconds;
        const lambda2 = Math.log(2) / T2_seconds;
        
        // Bateman Calculation
        const A_parent = N0_parent * Math.exp(-lambda1 * t_seconds);
        const initialDaughterDecay = N0_daughter * Math.exp(-lambda2 * t_seconds);
        let daughterIngrowth;
        
        if (Math.abs(lambda1 - lambda2) < 1e-12) {
            daughterIngrowth = br * N0_parent * lambda1 * t_seconds * Math.exp(-lambda1 * t_seconds);
        } else {
            daughterIngrowth = br * (lambda2 / (lambda2 - lambda1)) * N0_parent * (Math.exp(-lambda1 * t_seconds) - Math.exp(-lambda2 * t_seconds));
        }
        
        const A_daughter = initialDaughterDecay + daughterIngrowth;
        const currentRatio = A_parent > 0 ? (A_daughter / A_parent) : 0;
        
        setResult({
            parent: { name: parentNuclide.name, activity: A_parent.toPrecision(4) },
            daughter: { name: daughterNuclide.name, activity: A_daughter.toPrecision(4) },
            currentRatio: currentRatio.toFixed(4)
        });
        
        // --- Chart Generation ---
        const labels = [], parentData = [], daughterData = [];
        const plotTime = t_seconds;
        const steps = 100;
        
        for (let i = 0; i <= steps; i++) {
            const timePoint = (plotTime / steps) * i;
            const displayTimeVal = timePoint / unitConversions[timeUnit];
            labels.push(displayTimeVal < 10 ? displayTimeVal.toPrecision(2) : Math.round(displayTimeVal).toString());
            
            const curr_A_parent = N0_parent * Math.exp(-lambda1 * timePoint);
            parentData.push(curr_A_parent);
            
            const curr_initD_decay = N0_daughter * Math.exp(-lambda2 * timePoint);
            let curr_D_ingrowth;
            if (Math.abs(lambda1 - lambda2) < 1e-12) {
                curr_D_ingrowth = br * N0_parent * lambda1 * timePoint * Math.exp(-lambda1 * timePoint);
            } else {
                curr_D_ingrowth = br * (lambda2 / (lambda2 - lambda1)) * N0_parent * (Math.exp(-lambda1 * timePoint) - Math.exp(-lambda2 * timePoint));
            }
            daughterData.push(curr_initD_decay + curr_D_ingrowth);
        }
        
        setChartData({ labels, parentData, daughterData, parentName: parentNuclide.name, daughterName: daughterNuclide.name, timeUnit });
    };
    
    // Auto-calculate
    React.useEffect(() => {
        if (parentNuclide && daughterNuclide) handleCalculate();
    }, [parentNuclide, daughterNuclide, initialActivity, initialDaughterActivity, branchingFraction, timeElapsed, timeUnit]);
    
    const handleSaveToHistory = () => {
        if (result && parentNuclide) {
            addHistory({
                id: Date.now(),
                type: 'Equilibrium',
                icon: ICONS.activity,
                inputs: `${initialActivity} ${activityUnit} ${parentNuclide.symbol} (t=${timeElapsed} ${timeUnit})`,
                result: `D: ${result.daughter.activity}, Ratio: ${result.currentRatio}`,
                view: VIEWS.EQUILIBRIUM
            });
            addToast("Calculation saved to history!");
        }
    };
    
    const setTimeTarget = (targetSeconds) => {
        const unitConv = { 'minutes': 60, 'hours': 3600, 'days': 86400, 'years': 31557600 };
        const bestUnit = getBestHalfLifeUnit(targetSeconds);
        // Ensure we stick to standard units the user expects
        const safeUnit = bestUnit === 'seconds' ? 'minutes' : bestUnit;
        setTimeUnit(safeUnit);
        setTimeElapsed((targetSeconds / unitConv[safeUnit]).toPrecision(4));
    };
    
    const handleClearInputs = () => {
        setParentNuclide(null); setDaughterNuclide(null);
        setInitialActivity('100'); setInitialDaughterActivity('0');
        setBranchingFraction('1.0');
        setTimeElapsed('10'); setTimeUnit('days');
        setResult(null); setChartData(null); setError(''); setAnalysis(null);
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Equilibrium Analyzer</h2>
                    <ClearButton onClick={handleClearInputs} />
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Parent Nuclide</label>
                        <div className="mt-1 min-h-[42px]">
                            {parentNuclide ?
                                <CalculatorNuclideInfo nuclide={parentNuclide} onClear={() => setParentNuclide(null)} />
                                : <SearchableSelect options={parentNuclides} onSelect={handleParentChange} placeholder="Search for a parent nuclide..."/>}
                        </div>
                    </div>

                    {/* --- PATH SELECTOR --- */}
                    {decayPaths.length > 1 && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                            <label className="block text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">Select Decay Path</label>
                            <select 
                                value={selectedPathIndex} 
                                onChange={handlePathChange}
                                className="w-full p-2 text-sm rounded border-amber-300 bg-white dark:bg-slate-800 focus:ring-amber-500"
                            >
                                {decayPaths.map((path, idx) => (
                                    <option key={idx} value={idx}>
                                        {path.label} ({(path.fraction * 100).toFixed(2)}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    {analysis && (
                        <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg animate-fade-in border border-sky-100 dark:border-sky-800">
                            <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400 mb-2">{analysis.type}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{analysis.message}</p>
                    
                            {(analysis.theoreticalRatio || analysis.timeToMax || analysis.timeToEq) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-sky-200 dark:border-sky-800 pt-3">
                                    {analysis.theoreticalRatio && (
                                        <div><p className="font-semibold text-slate-500 dark:text-slate-400">Equilibrium Ratio (A₂/A₁):</p><p className="font-mono">{(analysis.theoreticalRatio * safeParseFloat(branchingFraction)).toFixed(4)}</p></div>
                                    )}
                                    {analysis.timeToEq && (
                                        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded shadow-sm">
                                            <div>
                                                <p className="font-semibold text-slate-500 dark:text-slate-400">Time to ~Equilibrium (99%):</p>
                                                <p className="font-mono font-bold">{formatHalfLife(analysis.timeToEq.toString() + ' seconds', getBestHalfLifeUnit(analysis.timeToEq))}</p>
                                            </div>
                                            <button onClick={() => setTimeTarget(analysis.timeToEq)} className="text-xs px-3 py-1.5 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition">Jump to Eq</button>
                                        </div>
                                    )}
                                    {analysis.timeToMax && (
                                        <div className="col-span-1 sm:col-span-2 flex items-center justify-between mt-2 bg-white dark:bg-slate-800 p-2 rounded shadow-sm">
                                            <div>
                                                <p className="font-semibold text-sky-600 dark:text-sky-400">Time to Peak Daughter Activity:</p>
                                                <p className="font-mono font-bold">{formatHalfLife(analysis.timeToMax.toString() + ' seconds', getBestHalfLifeUnit(analysis.timeToMax))}</p>
                                            </div>
                                            <button onClick={() => setTimeTarget(analysis.timeToMax)} className="text-xs px-3 py-1.5 bg-sky-600 text-white font-bold rounded hover:bg-sky-700 transition">Jump to Peak</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {parentNuclide && (
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Initial Parent Activity</label>
                                    <div className="flex">
                                        <input type="number" value={initialActivity} onChange={e => setInitialActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                                        <select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 text-sm">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Initial Daughter Activity</label>
                                    <div className="flex">
                                        <input type="number" value={initialDaughterActivity} onChange={e => setInitialDaughterActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                                        <div className="flex items-center justify-center px-3 bg-slate-200 dark:bg-slate-600 rounded-r-md text-sm text-slate-500 dark:text-slate-300">{activityUnit}</div>
                                    </div>
                                </div>
                            </div>
                    
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Time Elapsed</label>
                                    <div className="flex gap-2 mt-1">
                                        <input type="number" value={timeElapsed} onChange={e => setTimeElapsed(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600" />
                                        <select value={timeUnit} onChange={e => setTimeUnit(e.target.value)} className="p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                            {timeUnitsOrdered.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <Tooltip text="The fraction of parent decays that result in this daughter. Example: Mo-99 -> Tc-99m is ~0.875.">
                                        <label className="block text-sm font-medium cursor-help underline decoration-dotted">Branching Fraction (0-1)</label>
                                    </Tooltip>
                                    <input type="number" value={branchingFraction} onChange={e => setBranchingFraction(e.target.value)} step="0.01" min="0" max="1" className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    
                    {result && (
                        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg space-y-2">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold text-center text-sm flex-grow">Activity at {timeElapsed} {timeUnit}</p>
                                <Tooltip text="Save to Recent Calculations" widthClass="w-auto">
                                    <button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-500 transition-colors -mr-2">
                                        <Icon path={ICONS.notepad} className="w-5 h-5" />
                                    </button>
                                </Tooltip>
                            </div>
                    
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded shadow-sm text-center">
                                    <p className="text-xs text-slate-500">Parent ({result.parent.name})</p>
                                    <p className="font-bold text-sky-600 dark:text-sky-400">{result.parent.activity}</p>
                                </div>
                                <div className="p-2 bg-white dark:bg-slate-800 rounded shadow-sm text-center border-b-2 border-rose-500">
                                    <p className="text-xs text-slate-500">Daughter ({result.daughter.name})</p>
                                    <p className="font-bold text-rose-600 dark:text-rose-400">{result.daughter.activity}</p>
                                </div>
                            </div>
                    
                            <div className="text-center pt-2">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Current Ratio (A₂/A₁): <span className="font-bold font-mono">{result.currentRatio}</span></span>
                            </div>
                        </div>
                    )}
                    
                    {chartData && (
                        <>
                            <div className="flex justify-end mt-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={useLogScale} onChange={() => setUseLogScale(!useLogScale)} className="form-checkbox h-4 w-4 rounded text-sky-600" />
                                    Use Logarithmic Scale
                                </label>
                            </div>
                            <DecayChart chartData={chartData} useLogScale={useLogScale} theme={theme} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * @description Updated Radon Concentration Calculator with EPA Context Bar and Occupancy Presets.
 */
const ConcentrationDoseModule = ({ calcMode, setCalcMode, concentration, setConcentration, unit, setUnit, equilibriumFactor, setEquilibriumFactor, workingLevel, setWorkingLevel, occupancyFactor, setOccupancyFactor, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const { settings } = React.useContext(SettingsContext);
    
    const Bq_per_m3_in_pCi_per_L = 37;
    const PAEC_J_per_m3_in_WL = 2.08e-5;
    const dose_conversion_mrem_per_WLM = 1250; // ICRP 65 / NCRP (approx)
    
    React.useEffect(() => {
        localStorage.setItem('radon_calcMode', calcMode);
        localStorage.setItem('radon_concentration', concentration);
        localStorage.setItem('radon_unit', unit);
        localStorage.setItem('radon_equilibriumFactor', equilibriumFactor);
        localStorage.setItem('radon_workingLevel', workingLevel);
        localStorage.setItem('radon_occupancyFactor', occupancyFactor);
    }, [calcMode, concentration, unit, equilibriumFactor, workingLevel, occupancyFactor]);
    
    React.useEffect(() => {
        try {
            setError('');
            const conc_val = safeParseFloat(concentration);
            const ef_val = safeParseFloat(equilibriumFactor);
            const wl_val = safeParseFloat(workingLevel);
            const of_val = safeParseFloat(occupancyFactor);
            
            let final_pCi_L, final_Bq_m3, final_WL, final_EF;
            
            switch(calcMode) {
                case 'doseFromConc':
                    if (isNaN(conc_val) || isNaN(ef_val)) { setResult(null); return; }
                    final_pCi_L = unit === 'pCi/L' ? conc_val : conc_val / Bq_per_m3_in_pCi_per_L;
                    final_EF = ef_val;
                    final_WL = (final_pCi_L / 100) * final_EF;
                    if (workingLevel !== final_WL.toPrecision(3)) setWorkingLevel(final_WL.toPrecision(3));
                    break;
                case 'findWL':
                    if (isNaN(conc_val) || isNaN(ef_val)) { setResult(null); return; }
                    final_pCi_L = unit === 'pCi/L' ? conc_val : conc_val / Bq_per_m3_in_pCi_per_L;
                    final_EF = ef_val;
                    final_WL = (final_pCi_L / 100) * final_EF;
                    setWorkingLevel(final_WL.toPrecision(3));
                    break;
                case 'findConc':
                    if (isNaN(wl_val) || isNaN(ef_val)) { setResult(null); return; }
                    if (ef_val <= 0) throw new Error('Equilibrium Factor must be > 0.');
                    final_WL = wl_val;
                    final_EF = ef_val;
                    final_pCi_L = (final_WL * 100) / final_EF;
                    const final_conc_display = unit === 'pCi/L' ? final_pCi_L : final_pCi_L * Bq_per_m3_in_pCi_per_L;
                    setConcentration(final_conc_display.toPrecision(3));
                    break;
                case 'findEF':
                    if (isNaN(wl_val) || isNaN(conc_val)) { setResult(null); return; }
                    final_pCi_L = unit === 'pCi/L' ? conc_val : conc_val / Bq_per_m3_in_pCi_per_L;
                    if (final_pCi_L <= 0) throw new Error('Concentration must be > 0.');
                    final_WL = wl_val;
                    final_EF = (final_WL * 100) / final_pCi_L;
                    setEquilibriumFactor(final_EF.toPrecision(3));
                    break;
                default: break;
            }
            
            if (isNaN(of_val)) throw new Error('Occupancy Factor must be a number.');
            
            final_Bq_m3 = final_pCi_L * Bq_per_m3_in_pCi_per_L;
            const paec_J_m3 = final_WL * PAEC_J_per_m3_in_WL;
            
            // WLM = (WL * Hours) / 170
            const hours_per_year = 8760 * of_val;
            const wlm_per_year = (final_WL * hours_per_year) / 170;
            const annualDose_mrem = wlm_per_year * dose_conversion_mrem_per_WLM;
            
            setResult({
                pCi_L: final_pCi_L.toPrecision(3),
                Bq_m3: final_Bq_m3.toPrecision(3),
                workingLevels: final_WL.toPrecision(3),
                equilibriumFactor: final_EF.toPrecision(3),
                paec_J_m3: paec_J_m3.toExponential(2),
                wlm_year: wlm_per_year.toPrecision(3),
                annualDose: formatDoseValue(annualDose_mrem, 'dose', settings)
            });
            
        } catch (e) { setError(e.message); setResult(null); }
    }, [concentration, unit, equilibriumFactor, workingLevel, occupancyFactor, calcMode, setConcentration, setEquilibriumFactor, setWorkingLevel, setResult, setError, settings]);
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({
                id: Date.now(),
                type: 'Radon Dose',
                icon: ICONS.radon,
                inputs: `${result.pCi_L} pCi/L, F=${result.equilibriumFactor}`,
                result: `${result.annualDose.value} ${result.annualDose.unit}/yr`,
                view: VIEWS.RADON
            });
            addToast("Saved to history!");
        }
    };
    
    const getHeroMetric = () => {
        if (!result) return null;
        switch (calcMode) {
            case 'findWL': return { label: 'Calculated Working Level', value: result.workingLevels, unit: 'WL' };
            case 'findConc': return unit === 'pCi/L' ? { label: 'Calculated Concentration', value: result.pCi_L, unit: 'pCi/L' } : { label: 'Calculated Concentration', value: result.Bq_m3, unit: 'Bq/m³' };
            case 'findEF': return { label: 'Calculated Equilibrium Factor', value: result.equilibriumFactor, unit: 'F' };
            case 'doseFromConc': default: return { label: 'Estimated Annual Dose', value: result.annualDose.value, unit: result.annualDose.unit, subtext: `(${result.wlm_year} WLM/year)` };
        }
    };
    
    const hero = getHeroMetric();
    
    // --- VISUAL CONTEXT LOGIC (EPA Action Level) ---
    const getSafetyContext = (pCiL_str) => {
        const val = safeParseFloat(pCiL_str);
        if (val < 2.0) return { color: 'bg-green-500', width: '25%', label: 'Normal (< 2.0)', advice: 'No action needed.' };
        if (val < 4.0) return { color: 'bg-yellow-400', width: '50%', label: 'Warning (2.0 - 4.0)', advice: 'Consider mitigation.' };
        if (val < 8.0) return { color: 'bg-orange-500', width: '75%', label: 'Action Level (> 4.0)', advice: 'Mitigation recommended.' };
        return { color: 'bg-red-500', width: '100%', label: 'High (> 8.0)', advice: 'Mitigation Required.' };
    };
    
    const safety = result ? getSafetyContext(result.pCi_L) : null;
    
    return (
        <div className="space-y-4">
            <ContextualNote type="info">Calculates dose from radon progeny inhalation. Assumes standard conversion (1 WLM ≈ 1250 mrem).</ContextualNote>
            
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <button onClick={() => setCalcMode('doseFromConc')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'doseFromConc' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Dose from Conc.</button>
                <button onClick={() => setCalcMode('findWL')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'findWL' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Find WL</button>
                <button onClick={() => setCalcMode('findConc')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'findConc' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Find Concentration</button>
                <button onClick={() => setCalcMode('findEF')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'findEF' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Find Equilibrium</button>
            </div>
            
            <div className="space-y-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                    <label className="block text-sm font-medium">Radon Concentration</label>
                    <div className="flex">
                        <input type="number" value={concentration} onChange={e => setConcentration(e.target.value)} disabled={calcMode === 'findConc'} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 disabled:bg-slate-200 dark:disabled:bg-slate-800" />
                        <select value={unit} onChange={e => setUnit(e.target.value)} disabled={calcMode === 'findConc'} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 disabled:opacity-50"><option>pCi/L</option><option>Bq/m³</option></select>
                    </div>
                </div>
                <div>
                    <Tooltip text="The fraction of radon progeny in equilibrium with the parent radon gas. 0.4 is a standard assumption for homes; 0.5-0.7 for clean rooms/labs.">
                        <label className="block text-sm font-medium cursor-help underline decoration-dotted">Equilibrium Factor (F)</label>
                    </Tooltip>
                    <input type="number" value={equilibriumFactor} onChange={e => setEquilibriumFactor(e.target.value)} step="0.05" min="0" max="1" disabled={calcMode === 'findEF'} placeholder="e.g., 0.4" className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700 disabled:bg-slate-200 dark:disabled:bg-slate-800" />
                </div>
                <div>
                    <label className="block text-sm font-medium">Working Level (WL)</label>
                    <input type="number" value={workingLevel} onChange={e => setWorkingLevel(e.target.value)} disabled={calcMode === 'findWL' || calcMode === 'doseFromConc'} placeholder="e.g., 0.02" className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700 disabled:bg-slate-200 dark:disabled:bg-slate-800" />
                </div>
                
                {/* Occupancy Section with Presets */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium">Occupancy Factor (0-1)</label>
                        <div className="flex gap-2">
                            <button onClick={() => setOccupancyFactor('0.75')} className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition">Home (75%)</button>
                            <button onClick={() => setOccupancyFactor('0.228')} className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition">Work (2k hr)</button>
                        </div>
                    </div>
                    <input type="number" value={occupancyFactor} onChange={e => setOccupancyFactor(e.target.value)} step="0.05" min="0" max="1" className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            
            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 animate-fade-in">
                    <div className="text-center pb-4 mb-4 border-b border-slate-300 dark:border-slate-600">
                        <div className="flex justify-between items-center -mt-2 -mb-2">
                            <div></div>
                            <p className="font-semibold block text-sm text-slate-500 dark:text-slate-400">{hero.label}</p>
                            <Tooltip text="Save to Recent Calculations" widthClass="w-auto">
                                <button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-500 transition-colors">
                                    <Icon path={ICONS.notepad} className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                        <div className="flex items-center justify-center mt-2">
                            <p className="text-4xl font-bold text-sky-600 dark:text-sky-400">{hero.value} <span className="text-2xl opacity-75">{hero.unit}</span></p>
                            <CopyButton textToCopy={hero.value} />
                        </div>
                        {hero.subtext && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hero.subtext}</p>}
                    </div>
                    
                    {/* VISUAL CONTEXT BAR */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs font-semibold mb-1 text-slate-500 dark:text-slate-400">
                            <span>EPA Context</span>
                            <span>{safety.label}</span>
                        </div>
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden relative border border-slate-300 dark:border-slate-500">
                            <div className={`h-full ${safety.color} transition-all duration-500`} style={{ width: safety.width }}></div>
                            <div className="absolute top-0 bottom-0 w-0.5 bg-black/50 dark:bg-white/50" style={{ left: '50%' }} title="Action Level (4.0 pCi/L)"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>0</span>
                            <span className="font-bold">4.0 pCi/L</span>
                            <span>8.0+</span>
                        </div>
                        <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-300 mt-1">{safety.advice}</p>
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Calculation Details</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {calcMode !== 'findConc' && ( <><span className="font-semibold text-slate-500 dark:text-slate-400">Concentration:</span><p className="font-mono text-right">{result.pCi_L} pCi/L</p></> )}
                        {calcMode !== 'findEF' && ( <><span className="font-semibold text-slate-500 dark:text-slate-400">Equilibrium (F):</span><p className="font-mono text-right">{result.equilibriumFactor}</p></> )}
                        {calcMode !== 'findWL' && calcMode !== 'doseFromConc' && ( <><span className="font-semibold text-slate-500 dark:text-slate-400">Working Level:</span><p className="font-mono text-right">{result.workingLevels}</p></> )}
                        <span className="font-semibold text-slate-500 dark:text-slate-400">PAEC:</span><p className="font-mono text-right">{result.paec_J_m3} J/m³</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. Updated RadonIngrowthCalculator (Added Leakage Note)
const RadonIngrowthCalculator = ({ result, setResult, error, setError, amount, setAmount, unit, setUnit, time, setTime, timeUnit, setTimeUnit }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const { settings } = React.useContext(SettingsContext);
    
    const RA226_SPECIFIC_ACTIVITY_BQ_PER_G = 3.66e10;
    const RN222_HALFLIFE_SECONDS = 3.8235 * 24 * 3600;
    const RN222_LAMBDA_PER_SECOND = Math.log(2) / RN222_HALFLIFE_SECONDS;
    
    const massFactors_g = { 'ng': 1e-9, 'µg': 1e-6, 'mg': 1e-3, 'g': 1 };
    const activityFactors_Bq = { 'Bq': 1, 'kBq': 1e3, 'MBq': 1e6, 'GBq': 1e9, 'µCi': 37000, 'mCi': 3.7e7, 'Ci': 3.7e10 };
    const timeUnits = { 'minutes': 60, 'hours': 3600, 'days': 86400, 'weeks': 604800 };
    
    React.useEffect(() => {
        try {
            setError('');
            const val = safeParseFloat(amount);
            const t_val = safeParseFloat(time);
            
            if (isNaN(val) || val <= 0 || isNaN(t_val) || t_val < 0) {
                if(amount && time) setError("Inputs must be positive numbers.");
                setResult(null); return;
            }
            
            let ra226_activity_Bq = 0;
            const isMass = Object.keys(massFactors_g).includes(unit);
            
            if (isMass) {
                const mass_g = val * massFactors_g[unit];
                ra226_activity_Bq = mass_g * RA226_SPECIFIC_ACTIVITY_BQ_PER_G;
            } else {
                ra226_activity_Bq = val * (activityFactors_Bq[unit] || 0);
            }
            
            const time_s = t_val * (timeUnits[timeUnit] || 0);
            
            const rn222_activity_Bq = ra226_activity_Bq * (1 - Math.exp(-RN222_LAMBDA_PER_SECOND * time_s));
            const percentEquilibrium = (rn222_activity_Bq / ra226_activity_Bq) * 100;
            
            const configKey = settings.unitSystem === 'si' ? 'activity_si' : 'activity_conventional';
            
            const ra226_base = settings.unitSystem === 'si' ? ra226_activity_Bq : ra226_activity_Bq / 3.7e10;
            const rn222_base = settings.unitSystem === 'si' ? rn222_activity_Bq : rn222_activity_Bq / 3.7e10;
            
            setResult({
                ra226_activity: formatSensibleUnit(ra226_base, configKey),
                rn222_activity: formatSensibleUnit(rn222_base, configKey),
                percentEquilibrium: percentEquilibrium.toFixed(2)
            });
            
        } catch (e) { setError("Calculation failed."); setResult(null); }
    }, [amount, unit, time, timeUnit, settings.unitSystem]);
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'Radon Ingrowth', icon: ICONS.radon, inputs: `${amount} ${unit} Ra-226, ${time} ${timeUnit}`, result: `${result.rn222_activity.value} ${result.rn222_activity.unit} Rn-222`, view: VIEWS.RADON });
            addToast("Calculation saved to history!");
        }
    };
    
    return (
        <div className="space-y-4">
            <ContextualNote type="info">
                <strong>Assumptions:</strong> Calculates theoretical max ingrowth in a hermetically sealed container. Actual levels will be lower if the container leaks Rn-222 gas.
            </ContextualNote>
            
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div>
                    <label className="block text-sm font-medium">Source Quantity</label>
                    <div className="flex">
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                        <select value={unit} onChange={e => setUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">
                            <optgroup label="Mass">{Object.keys(massFactors_g).map(u => <option key={u} value={u}>{u}</option>)}</optgroup>
                            <optgroup label="Activity">{(settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq'] : ['µCi', 'mCi', 'Ci']).map(u => <option key={u} value={u}>{u}</option>)}</optgroup>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Ingrowth Time</label>
                    <div className="flex">
                        <input type="number" value={time} onChange={e => setTime(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                        <select value={timeUnit} onChange={e => setTimeUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{Object.keys(timeUnits).map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 text-center animate-fade-in">
                    <div className="flex justify-between items-center -mt-2 -mb-2">
                        <div></div>
                        <p className="font-semibold block text-sm text-slate-500 dark:text-slate-400">Resulting Rn-222 Activity</p>
                        <Tooltip text="Save to Recent Calculations" widthClass="w-auto">
                            <button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-500 transition-colors">
                                <Icon path={ICONS.notepad} className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    </div>
                    <div className="flex items-center justify-center mt-2">
                        <p className="text-4xl font-bold text-sky-600 dark:text-sky-400">{result.rn222_activity.value} <span className="text-2xl opacity-75">{result.rn222_activity.unit}</span></p>
                        <CopyButton textToCopy={result.rn222_activity.value} />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">Parent Activity: {result.ra226_activity.value} {result.ra226_activity.unit}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">({result.percentEquilibrium}% of secular equilibrium)</p>
                </div>
            )}
        </div>
    );
};

// 3. Updated KusnetzCalculator (Hard Validation)
const KusnetzCalculator = ({ flowRate, setFlowRate, sampleTime, setSampleTime, delayTime, setDelayTime, grossCounts, setGrossCounts, countDuration, setCountDuration, backgroundCpm, setBackgroundCpm, efficiency, setEfficiency, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const KUSNETZ_FACTORS = { 40: 150, 45: 138, 50: 128, 55: 119, 60: 112, 65: 105, 70: 100, 75: 95, 80: 90, 85: 86, 90: 82 };
    
    React.useEffect(() => {
        localStorage.setItem('kusnetz_flowRate', flowRate); localStorage.setItem('kusnetz_sampleTime', sampleTime); localStorage.setItem('kusnetz_delayTime', delayTime);
        localStorage.setItem('kusnetz_grossCounts', grossCounts); localStorage.setItem('kusnetz_countDuration', countDuration);
        localStorage.setItem('kusnetz_backgroundCpm', backgroundCpm); localStorage.setItem('kusnetz_efficiency', efficiency);
    }, [flowRate, sampleTime, delayTime, grossCounts, countDuration, backgroundCpm, efficiency]);
    
    const interpolate = (x, points) => {
        const keys = Object.keys(points).map(Number).sort((a, b) => a - b);
        if (x <= keys[0]) return points[keys[0]]; if (x >= keys[keys.length - 1]) return points[keys[keys.length - 1]];
        const x1 = Math.max(...keys.filter(k => k <= x)); const x2 = Math.min(...keys.filter(k => k > x));
        const y1 = points[x1]; const y2 = points[x2];
        return y1 + (y2 - y1) * (x - x1) / (x2 - x1);
    };
    
    React.useEffect(() => {
        try {
            setError('');
            const params = { V_flow: safeParseFloat(flowRate), T_sample: safeParseFloat(sampleTime), T_delay: safeParseFloat(delayTime), C_gross: safeParseFloat(grossCounts), T_count: safeParseFloat(countDuration), cpm_bkg: safeParseFloat(backgroundCpm), eff: safeParseFloat(efficiency) };
            
            if (Object.values(params).some(isNaN) || params.V_flow <= 0 || params.T_sample <= 0 || params.T_delay <= 0 || params.eff <= 0) {
                if (Object.values(params).every(p => p || p === 0)) setError("Please enter valid positive numbers.");
                setResult(null); return;
            }
            
            // --- VALIDATION: Hard Stop for Invalid Time ---
            if (params.T_delay < 40 || params.T_delay > 90) {
                setError("Delay time must be between 40 and 90 minutes for the Kusnetz Method.");
                setResult(null);
                return;
            }
            
            const totalVolume_L = params.V_flow * params.T_sample;
            const gross_cpm = params.C_gross / params.T_count;
            const net_cpm = gross_cpm - params.cpm_bkg;
            const k_factor = interpolate(params.T_delay, KUSNETZ_FACTORS);
            const workingLevel = net_cpm / (k_factor * (params.eff / 100) * totalVolume_L);
            
            setResult({ workingLevel: workingLevel.toPrecision(3), k_factor: k_factor.toFixed(1), totalVolume_L: totalVolume_L.toPrecision(3), net_cpm: net_cpm.toPrecision(3) });
        } catch (e) { setError("Calculation error."); setResult(null); }
    }, [flowRate, sampleTime, delayTime, grossCounts, countDuration, backgroundCpm, efficiency, setResult, setError]);
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'Kusnetz Method (WL)', icon: ICONS.radon, inputs: `Delay: ${delayTime} min, Vol: ${result.totalVolume_L} L`, result: `${result.workingLevel} WL`, view: VIEWS.RADON });
            addToast("Calculation saved to history!");
        }
    };
    
    return (
        <div className="space-y-4">
            <ContextualNote type="info">Determine the Working Level (WL) of radon progeny using the standard Kusnetz time-delay method.</ContextualNote>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">Flow Rate (LPM)</label><input type="number" value={flowRate} onChange={e => setFlowRate(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                    <div><label className="block text-sm font-medium">Sample Time (min)</label><input type="number" value={sampleTime} onChange={e => setSampleTime(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                    <div><label className="block text-sm font-medium">Gross Counts</label><input type="number" value={grossCounts} onChange={e => setGrossCounts(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                    <div><label className="block text-sm font-medium">Count Duration (min)</label><input type="number" value={countDuration} onChange={e => setCountDuration(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                    <div><label className="block text-sm font-medium">Background (cpm)</label><input type="number" value={backgroundCpm} onChange={e => setBackgroundCpm(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                    <div><label className="block text-sm font-medium">Alpha Efficiency (%)</label><input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                </div>
                <div><Tooltip text="Time between end-of-sampling and start-of-count. Standard method requires 40-90 mins."><label className="block text-sm font-medium cursor-help underline decoration-dotted">Delay Time (minutes)</label></Tooltip><input type="number" value={delayTime} onChange={e => setDelayTime(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {result && (
                <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-fade-in space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Net Count Rate:</span><span className="font-mono text-right">{result.net_cpm} cpm</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Total Air Volume:</span><span className="font-mono text-right">{result.totalVolume_L} L</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Interpolated K Factor:</span><span className="font-mono text-right">{result.k_factor}</span>
                    </div>
                    <div className="text-center pt-3 border-t border-slate-300 dark:border-slate-600">
                        <div className="flex justify-between items-center -mt-2 -mb-2">
                            <div></div>
                            <p className="font-semibold block text-sm text-slate-500 dark:text-slate-400">Calculated Progeny Concentration</p>
                            <Tooltip text="Save to Recent Calculations" widthClass="w-auto">
                                <button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-500 transition-colors">
                                    <Icon path={ICONS.notepad} className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>
                        <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{result.workingLevel}</p>
                        <p className="text-md font-medium text-slate-600 dark:text-slate-300">Working Levels (WL)</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * @description The main container for the Radon Tools suite.
 * It manages the shared state for the sub-calculators and handles tab navigation.
 */

const RadonCalculator = ({ onNavClick }) => {
    const { settings } = React.useContext(SettingsContext);
    const [activeTab, setActiveTab] = React.useState('concentration');
    
    const isSI = settings.unitSystem === 'si';
    
    // --- 1. Concentration Tab State ---
    const [conc_calcMode, setConc_calcMode] = React.useState(() => localStorage.getItem('radon_calcMode') || 'doseFromConc');
    const [conc_concentration, setConc_concentration] = React.useState(() => localStorage.getItem('radon_concentration') || '4');
    const [conc_unit, setConc_unit] = React.useState(() => {
        const saved = localStorage.getItem('radon_unit');
        return saved || (isSI ? 'Bq/m³' : 'pCi/L');
    });
    const [conc_equilibriumFactor, setConc_equilibriumFactor] = React.useState(() => localStorage.getItem('radon_equilibriumFactor') || '0.4');
    const [conc_workingLevel, setConc_workingLevel] = React.useState(() => localStorage.getItem('radon_workingLevel') || '0.02');
    const [conc_occupancyFactor, setConc_occupancyFactor] = React.useState(() => localStorage.getItem('radon_occupancyFactor') || '1');
    const [conc_result, setConc_result] = React.useState(null);
    const [conc_error, setConc_error] = React.useState('');
    
    // --- 2. Ingrowth Tab State ---
    const [ingrowth_amount, setIngrowth_amount] = React.useState('1');
    const [ingrowth_unit, setIngrowth_unit] = React.useState('µg');
    const [ingrowth_time, setIngrowth_time] = React.useState('30');
    const [ingrowth_timeUnit, setIngrowth_timeUnit] = React.useState('days');
    const [ingrowth_result, setIngrowth_result] = React.useState(null);
    const [ingrowth_error, setIngrowth_error] = React.useState('');
    
    // --- 3. Kusnetz Tab State ---
    const [kusnetz_flowRate, setKusnetz_flowRate] = React.useState(() => localStorage.getItem('kusnetz_flowRate') || '2');
    const [kusnetz_sampleTime, setKusnetz_sampleTime] = React.useState(() => localStorage.getItem('kusnetz_sampleTime') || '5');
    const [kusnetz_delayTime, setKusnetz_delayTime] = React.useState(() => localStorage.getItem('kusnetz_delayTime') || '40');
    const [kusnetz_grossCounts, setKusnetz_grossCounts] = React.useState(() => localStorage.getItem('kusnetz_grossCounts') || '100');
    const [kusnetz_countDuration, setKusnetz_countDuration] = React.useState(() => localStorage.getItem('kusnetz_countDuration') || '1');
    const [kusnetz_backgroundCpm, setKusnetz_backgroundCpm] = React.useState(() => localStorage.getItem('kusnetz_backgroundCpm') || '0');
    const [kusnetz_efficiency, setKusnetz_efficiency] = React.useState(() => localStorage.getItem('kusnetz_efficiency') || '30');
    const [kusnetz_result, setKusnetz_result] = React.useState(null);
    const [kusnetz_error, setKusnetz_error] = React.useState('');
    
    // Auto-switch units if system setting changes
    React.useEffect(() => {
        if (isSI) {
            if (conc_unit === 'pCi/L') {
                setConc_unit('Bq/m³');
                setConc_concentration('148'); // Approx 4 pCi/L
            }
            if (['µCi', 'mCi', 'Ci'].includes(ingrowth_unit)) {
                setIngrowth_unit('kBq');
                setIngrowth_amount('1');
            }
        } else {
            if (conc_unit === 'Bq/m³') {
                setConc_unit('pCi/L');
                setConc_concentration('4'); // EPA Action Level
            }
            if (['Bq', 'kBq', 'MBq', 'GBq'].includes(ingrowth_unit)) {
                setIngrowth_unit('µCi');
                setIngrowth_amount('1');
            }
        }
    }, [isSI]);
    
    const handleClearActiveCalculator = () => {
        if (activeTab === 'concentration') {
            setConc_concentration('4'); setConc_unit(isSI ? 'Bq/m³' : 'pCi/L');
            setConc_equilibriumFactor('0.4'); setConc_workingLevel('0.02');
            setConc_occupancyFactor('1'); setConc_result(null); setConc_error('');
        } else if (activeTab === 'ingrowth') {
            setIngrowth_amount('1'); setIngrowth_unit('µg'); setIngrowth_time('30');
            setIngrowth_result(null); setIngrowth_error('');
        } else {
            setKusnetz_flowRate('2'); setKusnetz_sampleTime('5'); setKusnetz_delayTime('40');
            setKusnetz_grossCounts('100'); setKusnetz_countDuration('1'); setKusnetz_backgroundCpm('0');
            setKusnetz_efficiency('30'); setKusnetz_result(null); setKusnetz_error('');
        }
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Radon Tools</h2>
                    <button onClick={handleClearActiveCalculator} className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold flex items-center gap-1">
                        <Icon path={ICONS.clear} className="w-3 h-3"/>
                        Clear Inputs
                    </button>
                </div>
                <div className="flex w-full p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
                    <button onClick={() => setActiveTab('concentration')} className={`w-1/3 p-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'concentration' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Concentration</button>
                    <button onClick={() => setActiveTab('ingrowth')} className={`w-1/3 p-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'ingrowth' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Ingrowth</button>
                    <button onClick={() => setActiveTab('kusnetz')} className={`w-1/3 p-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'kusnetz' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Kusnetz (WL)</button>
                </div>
                
                {activeTab === 'concentration' &&
                    <ConcentrationDoseModule
                        calcMode={conc_calcMode} setCalcMode={setConc_calcMode}
                        concentration={conc_concentration} setConcentration={setConc_concentration}
                        unit={conc_unit} setUnit={setConc_unit}
                        equilibriumFactor={conc_equilibriumFactor} setEquilibriumFactor={setConc_equilibriumFactor}
                        workingLevel={conc_workingLevel} setWorkingLevel={setConc_workingLevel}
                        occupancyFactor={conc_occupancyFactor} setOccupancyFactor={setConc_occupancyFactor}
                        result={conc_result} setResult={setConc_result}
                        error={conc_error} setError={setConc_error}
                    />
                }
                
                {activeTab === 'ingrowth' &&
                    <RadonIngrowthCalculator
                        amount={ingrowth_amount} setAmount={setIngrowth_amount}
                        unit={ingrowth_unit} setUnit={setIngrowth_unit}
                        time={ingrowth_time} setTime={setIngrowth_time}
                        timeUnit={ingrowth_timeUnit} setTimeUnit={setIngrowth_timeUnit}
                        result={ingrowth_result} setResult={setIngrowth_result}
                        error={ingrowth_error} setError={setIngrowth_error}
                    />
                }
                
                {activeTab === 'kusnetz' &&
                    <KusnetzCalculator
                        flowRate={kusnetz_flowRate} setFlowRate={setKusnetz_flowRate}
                        sampleTime={kusnetz_sampleTime} setSampleTime={setKusnetz_sampleTime}
                        delayTime={kusnetz_delayTime} setDelayTime={setKusnetz_delayTime}
                        grossCounts={kusnetz_grossCounts} setGrossCounts={setKusnetz_grossCounts}
                        countDuration={kusnetz_countDuration} setCountDuration={setKusnetz_countDuration}
                        backgroundCpm={kusnetz_backgroundCpm} setBackgroundCpm={setKusnetz_backgroundCpm}
                        efficiency={kusnetz_efficiency} setEfficiency={setKusnetz_efficiency}
                        result={kusnetz_result} setResult={setKusnetz_result}
                        error={kusnetz_error} setError={setKusnetz_error}
                    />
                }
            </div>
        </div>
    );
};

/**
 * @description A versatile dose rate calculator handling Gamma (Point/Line/Area), Beta, and Internal Dose.
 * Features: Auto-calculation, Field Calc (Inverse Square), Geometry Visualizations, and Bremsstrahlung fix.
 */
const DoseRateCalculator = ({ radionuclides, preselectedNuclide }) => {
    // --- Constants ---
    const CALC_MODE_GAMMA = 'gamma';
    const CALC_MODE_BETA = 'beta';
    const CALC_MODE_BREMS = 'bremsstrahlung';
    const CALC_MODE_INTERNAL = 'internal';
    const CALC_MODE_FIELD = 'field'; 

    const INPUT_MODE_DB = 'fromSource';
    const INPUT_MODE_MANUAL = 'manual';

    const GEOMETRY_POINT = 'point';
    const GEOMETRY_LINE = 'line';
    const GEOMETRY_AREA = 'area';

    const BETA_MODE_SKIN = 'skin';
    const BETA_MODE_AIR = 'air';

    const METHOD_10CFR20 = '10CFR20';
    const METHOD_FGR11 = 'FGR11';

    const { settings } = React.useContext(SettingsContext);
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();

    // --- HELPER: Format Number ---
    const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '-';
        if (num === 0) return '0';
        if (Math.abs(num) < 0.001 || Math.abs(num) >= 10000) {
            return num.toExponential(3);
        }
        return safeParseFloat(num.toPrecision(4)).toString();
    };

    // --- Units ---
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq', 'TBq'] : ['µCi', 'mCi', 'Ci'], [settings.unitSystem]);
    const distanceUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['mm', 'cm', 'm'] : ['in', 'ft', 'm'], [settings.unitSystem]);
    const doseRateUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['µSv/hr', 'mSv/hr', 'Sv/hr'] : ['µrem/hr', 'mrem/hr', 'rem/hr', 'mR/hr', 'R/hr'], [settings.unitSystem]);
    const intakeUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq'] : ['pCi', 'nCi', 'µCi', 'mCi', 'Ci'], [settings.unitSystem]);

    // --- State ---
    const [calcMode, setCalcMode] = React.useState(() => localStorage.getItem('doseRate_calcMode') || CALC_MODE_GAMMA);
    const [inputMode, setInputMode] = React.useState(INPUT_MODE_DB);
    const [geometryMode, setGeometryMode] = React.useState(GEOMETRY_POINT);
    const [doseMethod, setDoseMethod] = React.useState(METHOD_10CFR20);

    // Inputs
    const [activity, setActivity] = React.useState('1');
    const [activityUnit, setActivityUnit] = React.useState(activityUnits[0]);
    const [distance, setDistance] = React.useState('1');
    const [distanceUnit, setDistanceUnit] = React.useState(distanceUnits[2]);
    const [transmission, setTransmission] = React.useState('1.0');

    // Geometry Specific
    const [lineLength, setLineLength] = React.useState('1');
    const [lineLengthUnit, setLineLengthUnit] = React.useState('m');
    const [linearActivityUnit, setLinearActivityUnit] = React.useState('mCi/m');
    const [diskRadius, setDiskRadius] = React.useState('10');
    const [diskRadiusUnit, setDiskRadiusUnit] = React.useState('cm');
    const [arealActivityUnit, setArealActivityUnit] = React.useState('µCi/cm²');

    // Beta/Brems Specific
    const [shieldMaterial, setShieldMaterial] = React.useState('Plastic');
    const [betaMode, setBetaMode] = React.useState(BETA_MODE_SKIN);
    const [skinActivity, setSkinActivity] = React.useState('1000');
    const [skinActivityUnit, setSkinActivityUnit] = React.useState('dpm/100cm²');

    // Internal Specific
    const [intakeRoute, setIntakeRoute] = React.useState('inhalation');
    const [solubility, setSolubility] = React.useState('');
    const [intakeAmount, setIntakeAmount] = React.useState('1');
    const [intakeUnit, setIntakeUnit] = React.useState(intakeUnits[2]);

    // Field Calc Specific
    const [field_d1, setField_d1] = React.useState('1');
    const [field_d1Unit, setField_d1Unit] = React.useState('ft');
    const [field_r1, setField_r1] = React.useState('100');
    const [field_r1Unit, setField_r1Unit] = React.useState('mrem/hr');
    const [field_targetType, setField_targetType] = React.useState('findRate'); 
    const [field_d2, setField_d2] = React.useState('10'); 
    const [field_d2Unit, setField_d2Unit] = React.useState('ft');
    const [field_r2, setField_r2] = React.useState('2'); 
    const [field_r2Unit, setField_r2Unit] = React.useState('mrem/hr');

    // Manual Data
    const [nuclideSymbol, setNuclideSymbol] = React.useState('');
    const [manualGammaConstant, setManualGammaConstant] = React.useState('');
    const [manualBetaEnergy, setManualBetaEnergy] = React.useState('');

    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState('');

    // --- Persistence Effects ---
    React.useEffect(() => {
        localStorage.setItem('doseRate_calcMode', calcMode);
    }, [calcMode]);

    React.useEffect(() => {
        setResult(null);
        setError('');
    }, [calcMode, inputMode, geometryMode, betaMode]); 

    React.useEffect(() => {
        if (!activityUnits.includes(activityUnit)) setActivityUnit(activityUnits[0]);
        if (!distanceUnits.includes(distanceUnit)) setDistanceUnit(distanceUnits[0]);
    }, [settings.unitSystem]);

    React.useEffect(() => { if (preselectedNuclide) { setNuclideSymbol(preselectedNuclide.symbol); setInputMode(INPUT_MODE_DB); } }, [preselectedNuclide]);

    // Data Filtering
    const gammaNuclides = React.useMemo(() => radionuclides.filter(n => n.gammaConstant).sort((a, b) => a.name.localeCompare(b.name)), [radionuclides]);
    const betaNuclides = React.useMemo(() => radionuclides.filter(n => n.emissionEnergies?.beta?.length > 0 || n.daughterEmissions?.beta?.length > 0).sort((a, b) => a.name.localeCompare(b.name)), [radionuclides]);
    const dosimetryNuclides = React.useMemo(() => radionuclides.filter(n => n.dosimetry?.ALI).sort((a, b) => a.name.localeCompare(b.name)), [radionuclides]);

    const selectedNuclide = React.useMemo(() => radionuclides.find(n => n.symbol === nuclideSymbol), [nuclideSymbol, radionuclides]);

    const availableClasses = React.useMemo(() => {
        if (!selectedNuclide || !selectedNuclide.dosimetry) return [];
        const sourceObject = doseMethod === METHOD_FGR11 ? selectedNuclide.dosimetry.DCF : selectedNuclide.dosimetry.ALI;
        if (!sourceObject) return [];
        return Object.keys(sourceObject).filter(k => k.startsWith('inhalation_')).map(k => k.split('_')[1]);
    }, [selectedNuclide, doseMethod]);

    React.useEffect(() => {
        if (calcMode === CALC_MODE_INTERNAL && intakeRoute === 'inhalation' && availableClasses.length > 0) {
            if (!solubility || !availableClasses.includes(solubility)) setSolubility(availableClasses[0]);
        }
    }, [calcMode, intakeRoute, availableClasses, solubility]);

    // --- HELPER: Geometry Visualizer ---
    const GeometryVisualizer = ({ mode }) => {
        if (mode === GEOMETRY_POINT) {
            return (
                <div className="flex justify-center my-4 opacity-80">
                    <svg width="200" height="60" viewBox="0 0 200 60">
                        <circle cx="20" cy="30" r="5" fill="#0ea5e9" />
                        <text x="20" y="50" fontSize="10" textAnchor="middle" fill="#64748b">Source</text>
                        <line x1="25" y1="30" x2="175" y2="30" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
                        <text x="100" y="25" fontSize="10" textAnchor="middle" fill="#64748b">Distance (d)</text>
                        <rect x="180" y="20" width="10" height="20" fill="#f43f5e" />
                        <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" /></marker></defs>
                    </svg>
                </div>
            );
        }
        if (mode === GEOMETRY_LINE) {
            return (
                <div className="flex justify-center my-4 opacity-80">
                    <svg width="200" height="80" viewBox="0 0 200 80">
                        <line x1="20" y1="10" x2="20" y2="70" stroke="#0ea5e9" strokeWidth="4" />
                        <text x="15" y="45" fontSize="10" textAnchor="end" fill="#0ea5e9">L</text>
                        <line x1="20" y1="40" x2="175" y2="40" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
                        <text x="100" y="35" fontSize="10" textAnchor="middle" fill="#64748b">Distance (Perpendicular to Center)</text>
                        <rect x="180" y="30" width="10" height="20" fill="#f43f5e" />
                        <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" /></marker></defs>
                    </svg>
                </div>
            );
        }
        if (mode === GEOMETRY_AREA) {
            return (
                <div className="flex justify-center my-4 opacity-80">
                    <svg width="200" height="80" viewBox="0 0 200 80">
                        <ellipse cx="40" cy="40" rx="10" ry="30" stroke="#0ea5e9" strokeWidth="2" fill="none" />
                        <text x="40" y="80" fontSize="10" textAnchor="middle" fill="#0ea5e9">Disk (R)</text>
                        <line x1="40" y1="40" x2="175" y2="40" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrow)" />
                        <text x="100" y="35" fontSize="10" textAnchor="middle" fill="#64748b">Distance (Perpendicular to Center)</text>
                        <rect x="180" y="30" width="10" height="20" fill="#f43f5e" />
                        <defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" /></marker></defs>
                    </svg>
                </div>
            );
        }
        return null;
    };

    // --- HELPER: Render Reference Card ---
    const renderDosimetryReference = () => {
        if (!selectedNuclide || !selectedNuclide.dosimetry || !selectedNuclide.dosimetry.ALI) return null;

        const ali = selectedNuclide.dosimetry.ALI;
        // DAC = ALI (uCi) / 2.4e9 mL
        // DCF (mrem/uCi) = 5000 / ALI
        const calcDAC = (aliVal) => aliVal ? (aliVal / 2.4e9).toExponential(2) : '-';
        const calcDCF = (aliVal) => aliVal ? (5000 / aliVal).toFixed(2) : '-';

        return (
            <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs animate-fade-in border border-slate-200 dark:border-slate-600">
                <h4 className="font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <Icon path={ICONS.database} className="w-4 h-4"/> Regulatory Data (10 CFR 20)
                </h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-300 dark:border-slate-500 text-slate-500">
                                <th className="py-1">Pathway</th><th className="py-1">ALI (µCi)</th><th className="py-1">DAC (µCi/ml)</th><th className="py-1">DCF (mrem/µCi)</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono text-slate-700 dark:text-slate-200">
                            {ali.ingestion && <tr><td className="py-1 font-sans">Ingestion</td><td className="py-1">{ali.ingestion.toLocaleString()}</td><td className="py-1 text-slate-400">-</td><td className="py-1 text-sky-600 dark:text-sky-400">{calcDCF(ali.ingestion)}</td></tr>}
                            {ali.inhalation_D && <tr><td className="py-1 font-sans">Inhal (Class D)</td><td className="py-1">{ali.inhalation_D.toLocaleString()}</td><td className="py-1">{calcDAC(ali.inhalation_D)}</td><td className="py-1 text-sky-600 dark:text-sky-400">{calcDCF(ali.inhalation_D)}</td></tr>}
                            {ali.inhalation_W && <tr><td className="py-1 font-sans">Inhal (Class W)</td><td className="py-1">{ali.inhalation_W.toLocaleString()}</td><td className="py-1">{calcDAC(ali.inhalation_W)}</td><td className="py-1 text-sky-600 dark:text-sky-400">{calcDCF(ali.inhalation_W)}</td></tr>}
                            {ali.inhalation_Y && <tr><td className="py-1 font-sans">Inhal (Class Y)</td><td className="py-1">{ali.inhalation_Y.toLocaleString()}</td><td className="py-1">{calcDAC(ali.inhalation_Y)}</td><td className="py-1 text-sky-600 dark:text-sky-400">{calcDCF(ali.inhalation_Y)}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // --- ROBUST CONVERSION FACTORS ---
    const BQ_TO_CI = 1 / 3.7e10; 
    const activityFactorsCi = React.useMemo(() => ({
        'Ci': 1, 'mCi': 1e-3, 'µCi': 1e-6,
        'TBq': BQ_TO_CI * 1e12, 'GBq': BQ_TO_CI * 1e9, 'MBq': BQ_TO_CI * 1e6, 'kBq': BQ_TO_CI * 1e3, 'Bq': BQ_TO_CI
    }), [BQ_TO_CI]);

    const distanceFactorsM = { 'mm': 0.001, 'cm': 0.01, 'm': 1, 'in': 0.0254, 'ft': 0.3048, 'km': 1000 };
    const linearActivityFactorsCi_per_m = { 'µCi/cm': 1e-4, 'mCi/cm': 0.1, 'Ci/cm': 100, 'µCi/m': 1e-6, 'mCi/m': 1e-3, 'Ci/m': 1 };
    const arealActivityFactorsCi_per_m2 = { 'µCi/cm²': 0.01, 'mCi/cm²': 10, 'Ci/cm²': 10000, 'µCi/m²': 1e-6, 'mCi/m²': 1e-3, 'Ci/m²': 1 };
    const doseRateFactors_mrem_hr = { 'µrem/hr': 0.001, 'mrem/hr': 1, 'rem/hr': 1000, 'mR/hr': 1, 'R/hr': 1000, 'µSv/hr': 0.1, 'mSv/hr': 100, 'Sv/hr': 100000 };
    const intakeUnitFactors = { 'pCi': 1e-6, 'nCi': 1e-3, 'µCi': 1, 'mCi': 1000, 'Ci': 1e6, 'Bq': 1/37000, 'kBq': 1/37, 'MBq': 1000/37, 'GBq': 1e6/37 };
    const intakeUnitFactorsBq = { 'pCi': 0.037, 'nCi': 37, 'µCi': 37000, 'mCi': 3.7e7, 'Ci': 3.7e10, 'Bq': 1, 'kBq': 1000, 'MBq': 1e6, 'GBq': 1e9 };
    const concentrationFactors_uCi_per_cm2 = { 'dpm/100cm²': 1 / 2.22e8, 'µCi/cm²': 1, 'mCi/cm²': 1000, 'Ci/cm²': 1e6, 'Bq/cm²': 1 / 37000 };

    const handleCalculate = React.useCallback(() => {
        setError(''); setResult(null);
        
        // --- FIELD CALC (Inverse Square) ---
        if (calcMode === CALC_MODE_FIELD) {
            const d1 = safeParseFloat(field_d1) * distanceFactorsM[field_d1Unit];
            const r1 = safeParseFloat(field_r1) * doseRateFactors_mrem_hr[field_r1Unit];
            
            if (isNaN(d1) || isNaN(r1) || d1 <= 0 || r1 <= 0) { // Safety: Rate must be > 0 to have a source
                if (field_d1 && field_r1) setError("Inputs must be positive numbers.");
                return;
            }
            
            const k = r1 * (d1 * d1);
            
            if (field_targetType === 'findRate') {
                const d2 = safeParseFloat(field_d2) * distanceFactorsM[field_d2Unit];
                if (isNaN(d2) || d2 <= 0) { setError("Target distance must be > 0."); return; }
                const r2 = k / (d2 * d2);
                setResult({ type: 'field', val: r2, unit: 'doseRate', label: 'Projected Dose Rate' });
            } else {
                const r2 = safeParseFloat(field_r2) * doseRateFactors_mrem_hr[field_r2Unit];
                if (isNaN(r2) || r2 <= 0) { setError("Target rate must be > 0."); return; }
                const d2_sq = k / r2;
                const d2 = Math.sqrt(d2_sq);
                setResult({ type: 'field', val: d2 / distanceFactorsM[field_d2Unit], unit: 'distance', label: 'Distance to Boundary' });
            }
            return;
        }
        
        // --- GAMMA / BETA / INTERNAL Logic ---
        const A_val = safeParseFloat(activity);
        const d_val = safeParseFloat(distance);
        
        if (calcMode !== CALC_MODE_INTERNAL && (isNaN(d_val) || d_val <= 0)) {
            if(distance) setError("Distance must be > 0."); return;
        }
        
        switch (calcMode) {
            case CALC_MODE_GAMMA: {
                let gammaConstant = 0;
                if (inputMode === INPUT_MODE_DB) {
                    if (!selectedNuclide) return;
                    gammaConstant = safeParseFloat(selectedNuclide.gammaConstant);
                } else {
                    gammaConstant = safeParseFloat(manualGammaConstant);
                }
                if (!gammaConstant || isNaN(gammaConstant)) return;
            
                const transValue = safeParseFloat(transmission) || 1.0;
                const d_m = d_val * distanceFactorsM[distanceUnit];
                let doseRateR_hr = 0;
            
                if (geometryMode === GEOMETRY_POINT) {
                    const A_Ci = A_val * activityFactorsCi[activityUnit];
                    doseRateR_hr = (gammaConstant * A_Ci) / Math.pow(d_m, 2);
                } else if (geometryMode === GEOMETRY_LINE) {
                    const len_val = safeParseFloat(lineLength);
                    const len_m = len_val * distanceFactorsM[lineLengthUnit];
                    const A_L_Ci_m = A_val * linearActivityFactorsCi_per_m[linearActivityUnit];
                    // Line Source: (Gamma * A_L / d) * 2 * atan(L/2d)
                    doseRateR_hr = (gammaConstant * A_L_Ci_m / d_m) * 2 * Math.atan(len_m / (2 * d_m));
                } else if (geometryMode === GEOMETRY_AREA) {
                    const r_val = safeParseFloat(diskRadius);
                    const r_m = r_val * distanceFactorsM[diskRadiusUnit];
                    const A_A_Ci_m2 = A_val * arealActivityFactorsCi_per_m2[arealActivityUnit];
                    // Disk Source: PI * Gamma * A_A * ln((R^2+d^2)/d^2)
                    doseRateR_hr = Math.PI * gammaConstant * A_A_Ci_m2 * Math.log((Math.pow(r_m, 2) + Math.pow(d_m, 2)) / Math.pow(d_m, 2));
                }
                
                setResult({ 
                    type: 'gamma', 
                    rawDoseRate_mrem_hr: doseRateR_hr * 1000 * transValue, 
                    usedGamma: gammaConstant,
                    label: "Est. Dose Eq. (1 R ≈ 1 rem)" 
                });
                break;
            }
            
            case CALC_MODE_BETA: 
            case CALC_MODE_BREMS: {
                let E_max = 0;
                if (inputMode === INPUT_MODE_DB) {
                    if (!selectedNuclide) return;
                    if (selectedNuclide.emissionEnergies?.beta?.length > 0) {
                        const str = selectedNuclide.emissionEnergies.beta[0];
                        E_max = safeParseFloat(str.split(' ')[0]); // Rough parse if not pre-calculated
                    } else if (selectedNuclide.daughterEmissions?.beta?.length > 0) {
                        const str = selectedNuclide.daughterEmissions.beta[0];
                        E_max = safeParseFloat(str.split(' ')[0]);
                    }
                } else {
                    E_max = safeParseFloat(manualBetaEnergy);
                }
                if (!E_max || isNaN(E_max)) return;
            
                if (calcMode === CALC_MODE_BETA) {
                    if (betaMode === BETA_MODE_SKIN) {
                        const skin_val = safeParseFloat(skinActivity);
                        if (isNaN(skin_val)) return;
                        const conc_uCi_cm2 = skin_val * concentrationFactors_uCi_per_cm2[skinActivityUnit];
                        
                        let doseRate_rad_hr = 0;
                        let note = "";
                        // Shallow Dose Rule of Thumb
                        if (E_max < 0.07) {
                            doseRate_rad_hr = 0;
                            note = `E_max (${E_max.toFixed(3)} MeV) is too low to penetrate the dead skin layer. Dose is zero.`;
                        } else {
                            let factor = 9.0;
                            if (E_max < 0.6) factor = 9.0 * ((E_max - 0.07) / (0.6 - 0.07)); // Approximate scaling
                            doseRate_rad_hr = factor * conc_uCi_cm2;
                        }
                        setResult({ 
                            type: 'beta_skin', 
                            rawDoseRate_mrem_hr: doseRate_rad_hr * 1000, 
                            e_max: E_max, 
                            sourceNote: note,
                            label: "Skin Dose Rate" 
                        });

                    } else {
                        // Dose in Air (External Point Source)
                        const A_Ci = A_val * activityFactorsCi[activityUnit];
                        const d_ft = (d_val * distanceFactorsM[distanceUnit]) * 3.28084;
                        const d_m = d_val * distanceFactorsM[distanceUnit];
                        
                        // Katz-Penfold Range
                        let range_g_cm2 = E_max > 0.8 ? (0.542 * E_max - 0.133) : (0.407 * Math.pow(E_max, 1.38));
                        const density_air_g_cm3 = 0.001225; 
                        const range_m = (range_g_cm2 / density_air_g_cm3) / 100;
                        
                        const isBeyondRange = d_m >= range_m;
                        
                        let doseRate_rad_hr = 0;
                        let warnings = [];

                        if (isBeyondRange) {
                            warnings.push("Target is beyond maximum beta range in air.");
                        } else {
                            // "300 Rule" -> 300 * A(Ci) / d(ft)^2
                            doseRate_rad_hr = (300 * A_Ci) / Math.pow(d_ft, 2);
                            
                            if (d_m < 0.30) {
                                warnings.push("Warning: Inverse square law is inaccurate for Beta geometry < 1 ft (30cm). Result may overestimate.");
                            } else {
                                warnings.push("Approximation: Uses '300 Rule'. Ignores air attenuation (conservative).");
                            }
                        }

                        setResult({ 
                            type: 'beta_air', 
                            rawDoseRate_mrem_hr: doseRate_rad_hr * 1000, 
                            e_max: E_max, 
                            isBeyondRange, 
                            range_m: range_m.toPrecision(2),
                            warning: warnings.join(" "), 
                            label: "Dose Rate in Air"
                        });
                    }

                } else {
                    // Bremsstrahlung
                    const matProps = SHIELD_PROPS[shieldMaterial];
                    if (!matProps) { setError("Invalid shield material."); return; }
                    const A_Ci = A_val * activityFactorsCi[activityUnit];
                    const d_m = d_val * distanceFactorsM[distanceUnit];
                    
                    // Brems Rule: 6e-4 * Z * E^2 * Activity
                    const doseRate_R_hr_1m = (6e-4 * matProps.Z * Math.pow(E_max, 2) * A_Ci);
                    const finalRate = doseRate_R_hr_1m / Math.pow(d_m, 2);
                    const fraction = 3.5e-4 * matProps.Z * E_max;
                    
                    let note = "";
                    if (matProps.type === 'High-Z') note = "Warning: High-Z shield generates significantly more Bremsstrahlung. Consider Plastic/Aluminum.";
                    
                    setResult({ 
                        type: 'bremsstrahlung', 
                        rawDoseRate_mrem_hr: finalRate * 1000, 
                        bremsstrahlungFraction: (fraction * 100).toPrecision(2),
                        sourceNote: note,
                        label: "X-Ray Dose Rate (Brems.)"
                    });
                }
                break;
            }
            
            case CALC_MODE_INTERNAL: {
                if (!selectedNuclide) return;
                const I_val = safeParseFloat(intakeAmount);
                if (isNaN(I_val) || I_val <= 0) return;
            
                const dataKey = intakeRoute === 'ingestion' ? 'ingestion' : `inhalation_${solubility}`;
                let cede_mrem = 0;
                
                if (doseMethod === METHOD_10CFR20) {
                    const I_uCi = I_val * intakeUnitFactors[intakeUnit];
                    const ALI = selectedNuclide.dosimetry.ALI?.[dataKey];
                    if (!ALI) { setError(`ALI not found for ${dataKey}`); setResult(null); return; }
                    cede_mrem = (I_uCi / ALI) * 5000;
                } else {
                    const I_Bq = I_val * intakeUnitFactorsBq[intakeUnit];
                    const DCF = selectedNuclide.dosimetry.DCF?.[dataKey];
                    if (!DCF) { setError(`DCF not found for ${dataKey}`); setResult(null); return; }
                    cede_mrem = (I_Bq * DCF) * 100000;
                }
                setResult({ 
                    type: 'internal', 
                    rawDose_mrem: cede_mrem, 
                    method: doseMethod,
                    label: "Committed Dose (CEDE)"
                });
                break;
            }
            
            default: break;
        }
    }, [calcMode, field_d1, field_d1Unit, field_r1, field_r1Unit, field_d2, field_d2Unit, field_r2, field_r2Unit, field_targetType, activity, activityUnit, distance, distanceUnit, geometryMode, inputMode, nuclideSymbol, manualGammaConstant, manualBetaEnergy, transmission, lineLength, lineLengthUnit, linearActivityUnit, diskRadius, diskRadiusUnit, arealActivityUnit, betaMode, skinActivity, skinActivityUnit, shieldMaterial, intakeRoute, solubility, intakeAmount, intakeUnit, doseMethod, selectedNuclide, activityFactorsCi]);

    // AUTO-CALCULATION TRIGGER
    React.useEffect(() => {
        handleCalculate();
    }, [handleCalculate]);

    const handleSaveToHistory = () => {
        if (result) {
            const formattedResult = formatDoseValue(
                result.rawDoseRate_mrem_hr !== undefined ? result.rawDoseRate_mrem_hr : result.rawDose_mrem, 
                result.type === 'internal' ? 'dose' : 'doseRate', 
                settings
            );
            
            let inputDetail = '';
            
            if (calcMode === CALC_MODE_FIELD) {
                inputDetail = `Field: ${field_r1} ${field_r1Unit} @ ${field_d1} ${field_d1Unit}`;
            } 
            else if (calcMode === CALC_MODE_INTERNAL) {
                inputDetail = `${intakeAmount} ${intakeUnit} ${nuclideSymbol} (${intakeRoute})`;
            } 
            else {
                const source = nuclideSymbol || 'Manual Source';
                inputDetail = `${activity} ${activityUnit} ${source} @ ${distance} ${distanceUnit}`;
                
                if (shieldMaterial !== 'None' && calcMode === CALC_MODE_BREMS) {
                    inputDetail += ` w/ ${shieldMaterial}`;
                }
            }
            
            addHistory({ 
                id: Date.now(), 
                type: 'Dose Calculation', 
                icon: ICONS.doseRate, 
                inputs: inputDetail, 
                result: `${formattedResult.value} ${formattedResult.unit}`, 
                view: VIEWS.DOSE_RATE 
            });
            addToast("Saved to history!");
        }
    };

    const handleClear = () => {
        setCalcMode(CALC_MODE_GAMMA);
        setInputMode(INPUT_MODE_DB);
        setGeometryMode(GEOMETRY_POINT);
        setNuclideSymbol('');
        setActivity('1');
        setDistance('1');
        setTransmission('1.0');
        setField_r1('100'); setField_d1('1'); setField_d2('10'); setField_r2('2');
        setIntakeAmount('1');
        setResult(null);
        setError('');
    };

    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dose Calculator</h2>
                    <ClearButton onClick={handleClear} />
                </div>
                
                <ContextualNote type="info">A multi-purpose dose calculator. Uses 10 CFR 20 ALI values or FGR-11 DCFs for internal dose.</ContextualNote>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6 overflow-x-auto">
                    <button onClick={() => setCalcMode(CALC_MODE_FIELD)} className={`py-2 rounded-md text-xs font-bold transition-all ${calcMode === CALC_MODE_FIELD ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Field Calc</button>
                    <button onClick={() => setCalcMode(CALC_MODE_GAMMA)} className={`py-2 rounded-md text-xs font-bold transition-all ${calcMode === CALC_MODE_GAMMA ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Gamma</button>
                    <button onClick={() => setCalcMode(CALC_MODE_BETA)} className={`py-2 rounded-md text-xs font-bold transition-all ${calcMode === CALC_MODE_BETA ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Beta</button>
                    <button onClick={() => setCalcMode(CALC_MODE_BREMS)} className={`py-2 rounded-md text-xs font-bold transition-all ${calcMode === CALC_MODE_BREMS ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Brems.</button>
                    <button onClick={() => setCalcMode(CALC_MODE_INTERNAL)} className={`py-2 rounded-md text-xs font-bold transition-all ${calcMode === CALC_MODE_INTERNAL ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>Internal</button>
                </div>
                
                {/* --- FIELD CALC (INVERSE SQUARE) UI --- */}
                {calcMode === CALC_MODE_FIELD && (
                    <div className="space-y-4 animate-fade-in">
                        

[Image of inverse square law diagram]

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <h3 className="text-sm font-bold mb-3">Known Point</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium">Rate (I₁)</label><div className="flex"><input type="number" min="0" value={field_r1} onChange={e => setField_r1(e.target.value)} className="w-full p-2 rounded-l-md bg-white dark:bg-slate-700 text-sm"/><select value={field_r1Unit} onChange={e => setField_r1Unit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{doseRateUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                <div><label className="block text-xs font-medium">Distance (d₁)</label><div className="flex"><input type="number" min="0" value={field_d1} onChange={e => setField_d1(e.target.value)} className="w-full p-2 rounded-l-md bg-white dark:bg-slate-700 text-sm"/><select value={field_d1Unit} onChange={e => setField_d1Unit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            </div>
                        </div>
                        
                        <div className="flex justify-center bg-slate-100 dark:bg-slate-900 rounded p-1 text-xs">
                            <button onClick={() => setField_targetType('findRate')} className={`flex-1 py-1 rounded ${field_targetType === 'findRate' ? 'bg-white dark:bg-slate-600 shadow font-bold text-sky-600' : ''}`}>Find New Rate (I₂)</button>
                            <button onClick={() => setField_targetType('findDist')} className={`flex-1 py-1 rounded ${field_targetType === 'findDist' ? 'bg-white dark:bg-slate-600 shadow font-bold text-sky-600' : ''}`}>Find Distance (d₂)</button>
                        </div>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                            {field_targetType === 'findRate' ? (
                                <div><label className="block text-xs font-medium">Target Distance (d₂)</label><div className="flex"><input type="number" min="0" value={field_d2} onChange={e => setField_d2(e.target.value)} className="w-full p-2 rounded-l-md bg-white dark:bg-slate-700 text-sm"/><select value={field_d2Unit} onChange={e => setField_d2Unit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            ) : (
                                <div><label className="block text-xs font-medium">Target Rate (I₂)</label><div className="flex"><input type="number" min="0" value={field_r2} onChange={e => setField_r2(e.target.value)} className="w-full p-2 rounded-l-md bg-white dark:bg-slate-700 text-sm"/><select value={field_r2Unit} onChange={e => setField_r2Unit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{doseRateUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            )}
                        </div>
                    </div>
                )}
                
                {/* --- GAMMA UI --- */}
                {calcMode === CALC_MODE_GAMMA && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Geometry Selection */}
                        <div className="flex justify-center">
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                                <button onClick={() => setGeometryMode(GEOMETRY_POINT)} className={`px-3 py-1 text-xs font-bold rounded ${geometryMode === GEOMETRY_POINT ? 'bg-white dark:bg-slate-700 shadow text-sky-600' : ''}`}>Point</button>
                                <button onClick={() => setGeometryMode(GEOMETRY_LINE)} className={`px-3 py-1 text-xs font-bold rounded ${geometryMode === GEOMETRY_LINE ? 'bg-white dark:bg-slate-700 shadow text-sky-600' : ''}`}>Line</button>
                                <button onClick={() => setGeometryMode(GEOMETRY_AREA)} className={`px-3 py-1 text-xs font-bold rounded ${geometryMode === GEOMETRY_AREA ? 'bg-white dark:bg-slate-700 shadow text-sky-600' : ''}`}>Disk</button>
                            </div>
                        </div>
                        
                        {/* VISUALIZER */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                            <GeometryVisualizer mode={geometryMode} />
                        </div>
                    
                        {/* Common Inputs */}
                        <div className="flex justify-center mb-2"><div className="flex bg-slate-100 dark:bg-slate-900 rounded p-1 text-xs"><button onClick={() => setInputMode(INPUT_MODE_DB)} className={`px-3 py-1 rounded ${inputMode === INPUT_MODE_DB ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Database</button><button onClick={() => setInputMode(INPUT_MODE_MANUAL)} className={`px-3 py-1 rounded ${inputMode === INPUT_MODE_MANUAL ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Manual</button></div></div>
                        
                        <div>
                            {inputMode === INPUT_MODE_DB ? (
                                <div className="mt-1 min-h-[42px]">{selectedNuclide ? <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} /> : <SearchableSelect options={gammaNuclides} onSelect={setNuclideSymbol} placeholder="Select a gamma source..." />}</div>
                            ) : (
                                <div className="animate-fade-in"><label className="block text-xs font-medium mb-1">Gamma Constant (Γ)</label><div className="flex"><input type="number" min="0" value={manualGammaConstant} onChange={e => setManualGammaConstant(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm" placeholder="R·m²/hr·Ci" /></div></div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {geometryMode === GEOMETRY_POINT && (
                                <div><label className="block text-xs font-medium">Activity</label><div className="flex"><input type="number" min="0" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            )}
                            {geometryMode === GEOMETRY_LINE && (
                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-medium">Length (L)</label><div className="flex"><input type="number" min="0" value={lineLength} onChange={e => setLineLength(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={lineLengthUnit} onChange={e => setLineLengthUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                        <div><label className="block text-xs font-medium">Linear Activity</label><select value={linearActivityUnit} onChange={e => setLinearActivityUnit(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"><option>µCi/cm</option><option>mCi/cm</option><option>Ci/cm</option><option>µCi/m</option><option>mCi/m</option><option>Ci/m</option></select></div>
                                    </div>
                            )}
                            {geometryMode === GEOMETRY_AREA && (
                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-medium">Radius (R)</label><div className="flex"><input type="number" min="0" value={diskRadius} onChange={e => setDiskRadius(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={diskRadiusUnit} onChange={e => setDiskRadiusUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                        <div><label className="block text-xs font-medium">Areal Activity</label><select value={arealActivityUnit} onChange={e => setArealActivityUnit(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"><option>µCi/cm²</option><option>mCi/cm²</option><option>Ci/cm²</option><option>µCi/m²</option><option>mCi/m²</option><option>Ci/m²</option></select></div>
                                    </div>
                            )}
                            <div><label className="block text-xs font-medium">Distance (d or h)</label><div className="flex"><input type="number" min="0" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs font-medium mb-1">Transmission (0-1)</label>
                                <input type="number" step="0.1" min="0" max="1" value={transmission} onChange={e => setTransmission(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm" placeholder="e.g. 0.5"/>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- BETA UI --- */}
                {(calcMode === CALC_MODE_BETA || calcMode === CALC_MODE_BREMS) && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Input Mode */}
                        <div className="flex justify-center mb-2"><div className="flex bg-slate-100 dark:bg-slate-900 rounded p-1 text-xs"><button onClick={() => setInputMode(INPUT_MODE_DB)} className={`px-3 py-1 rounded ${inputMode === INPUT_MODE_DB ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Database</button><button onClick={() => setInputMode(INPUT_MODE_MANUAL)} className={`px-3 py-1 rounded ${inputMode === INPUT_MODE_MANUAL ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Manual E_max</button></div></div>
                        
                        {inputMode === INPUT_MODE_DB ? (
                            <div className="min-h-[42px]">{selectedNuclide ? <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} /> : <SearchableSelect options={betaNuclides} onSelect={setNuclideSymbol} placeholder="Select a beta source..." />}</div>
                        ) : (
                            <div><label className="block text-xs font-medium">Max Beta Energy (MeV)</label><input type="number" min="0" value={manualBetaEnergy} onChange={e => setManualBetaEnergy(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm"/></div>
                        )}
                    
                        {calcMode === CALC_MODE_BETA && (
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg"><button onClick={() => setBetaMode(BETA_MODE_SKIN)} className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${betaMode === BETA_MODE_SKIN ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Skin Dose (Contamination)</button><button onClick={() => setBetaMode(BETA_MODE_AIR)} className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${betaMode === BETA_MODE_AIR ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Dose in Air (External)</button></div>
                        )}
                    
                        {calcMode === CALC_MODE_BETA && betaMode === BETA_MODE_SKIN && (
                            <div><label className="block text-xs font-medium">Contamination Level</label><div className="flex"><input type="number" min="0" value={skinActivity} onChange={e => setSkinActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={skinActivityUnit} onChange={e => setSkinActivityUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{['dpm/100cm²', 'µCi/cm²'].map(u=><option key={u}>{u}</option>)}</select></div></div>
                        )}
                    
                        {calcMode === CALC_MODE_BETA && betaMode === BETA_MODE_AIR && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium">Activity</label><div className="flex"><input type="number" min="0" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                <div><label className="block text-xs font-medium">Distance</label><div className="flex"><input type="number" min="0" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            </div>
                        )}
                    
                        {calcMode === CALC_MODE_BREMS && (
                            <div className="space-y-4">
                                <div><label className="block text-xs font-medium">Shielding Material</label><select value={shieldMaterial} onChange={e => setShieldMaterial(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm">{Object.keys(SHIELD_PROPS).filter(m => m !== 'None').map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-medium">Activity</label><div className="flex"><input type="number" min="0" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                    <div><label className="block text-xs font-medium">Distance</label><div className="flex"><input type="number" min="0" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- INTERNAL UI --- */}
                {calcMode === CALC_MODE_INTERNAL && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="min-h-[42px]">{selectedNuclide ? <CalculatorNuclideInfo nuclide={selectedNuclide} onClear={() => setNuclideSymbol('')} /> : <SearchableSelect options={dosimetryNuclides} onSelect={setNuclideSymbol} placeholder="Select nuclide..." />}</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-medium">Method</label><select value={doseMethod} onChange={e => setDoseMethod(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm"><option value={METHOD_10CFR20}>10 CFR 20 (ALI)</option><option value={METHOD_FGR11}>FGR 11 (DCF)</option></select></div>
                            <div><label className="block text-xs font-medium">Route</label><select value={intakeRoute} onChange={e => setIntakeRoute(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm"><option value="inhalation">Inhalation</option><option value="ingestion">Ingestion</option></select></div>
                            {intakeRoute === 'inhalation' && (<div><label className="block text-xs font-medium">Lung Class</label><select value={solubility} onChange={e => setSolubility(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm" disabled={availableClasses.length === 0}>{availableClasses.length > 0 ? availableClasses.map(c=><option key={c}>{c}</option>) : <option>N/A</option>}</select></div>)}
                            <div><label className="block text-xs font-medium">Intake Amount</label><div className="flex"><input type="number" min="0" value={intakeAmount} onChange={e => setIntakeAmount(e.target.value)} className="w-full p-2 rounded-l-md bg-slate-100 dark:bg-slate-700 text-sm"/><select value={intakeUnit} onChange={e => setIntakeUnit(e.target.value)} className="rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs">{intakeUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                        </div>
                    </div>
                )}
                
                {/* --- RESULTS --- */}
                {result && (
                    <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in shadow-sm relative">
                        <div className="flex justify-end -mt-3 -mr-3 mb-2"><Tooltip text="Save to history"><button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></Tooltip></div>
                        <p className="text-xs uppercase font-bold text-slate-500 mb-2">{result.label || "Calculated Dose Rate"}</p>
                        <div className="flex items-center justify-center gap-2">
                            {result.type === 'field' ? (
                                <>
                                    <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{formatNumber(result.val)}</span>
                                    <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{result.unit === 'doseRate' ? field_r1Unit : field_d2Unit}</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">
                                        {formatDoseValue(
                                            result.rawDoseRate_mrem_hr !== undefined ? result.rawDoseRate_mrem_hr : result.rawDose_mrem, 
                                            result.type === 'internal' ? 'dose' : 'doseRate', 
                                            settings
                                        ).value}
                                    </span>
                                    <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                                        {formatDoseValue(
                                            result.rawDoseRate_mrem_hr !== undefined ? result.rawDoseRate_mrem_hr : result.rawDose_mrem, 
                                            result.type === 'internal' ? 'dose' : 'doseRate', 
                                            settings
                                        ).unit}
                                    </span>
                                </>
                            )}
                        </div>
                        
                        {/* Contextual Info */}
                        {result.usedGamma && <p className="text-xs text-slate-400 mt-2">Gamma Constant: {result.usedGamma} R·m²/hr·Ci</p>}
                        {result.sourceNote && <p className="text-xs text-amber-600 mt-2 italic">{result.sourceNote}</p>}
                        {result.bremsstrahlungFraction && <p className="text-xs text-slate-500 mt-2">Radiative Fraction: ~{result.bremsstrahlungFraction}%</p>}
                        
                        {/* Beta Air Warning Block */}
                        {result.type === 'beta_air' && (
                            <div className="mt-2 border-t border-slate-200 dark:border-slate-600 pt-2">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Max Range in Air: {result.range_m} m</p>
                                {result.warning && (
                                    <p className={`text-xs mt-2 p-1 rounded font-bold ${result.isBeyondRange ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'text-sky-600 bg-sky-50 dark:bg-sky-900/20'}`}>
                                        {result.warning}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

                {/* INTERNAL DOSIMETRY REFERENCE CARD */}
                {calcMode === CALC_MODE_INTERNAL && result && selectedNuclide && renderDosimetryReference()}
            </div>
        </div>
    );
};

/**
 * @description A calculator for photon shielding with three modes:
 * 1. (Gamma Dose) Calculates final dose rate from a specific radionuclide.
 * 2. (Find Thickness) Calculates required shielding thickness for a specific radionuclide.
 * 3. (Beta Range) Calculates stopping distance for beta particles.
 */

const ShieldingCalculator = ({ radionuclides, preselectedNuclide }) => {
    // --- Constants ---
    const MODE_GAMMA_DOSE = 'gammaDose';
    const MODE_FIND_THICKNESS = 'findThickness';
    const MODE_BETA_RANGE = 'betaRange';
    
    const DEFINE_BY_SOURCE = 'bySource';
    const DEFINE_BY_RATE = 'byRate';
    
    const INPUT_MODE_DB = 'fromSource';
    const INPUT_MODE_MANUAL = 'manual';
    
    // --- Context & Hooks ---
    const { settings } = React.useContext(SettingsContext);
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // --- Units ---
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq', 'TBq'] : ['µCi', 'mCi', 'Ci'], [settings.unitSystem]);
    const distanceUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['mm', 'cm', 'm'] : ['in', 'ft', 'm'], [settings.unitSystem]);
    const doseRateUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['µSv/hr', 'mSv/hr', 'Sv/hr'] : ['µrem/hr', 'mrem/hr', 'rem/hr', 'mR/hr', 'R/hr'], [settings.unitSystem]);
    
    // --- State ---
    const [calcMode, setCalcMode] = React.useState(() => localStorage.getItem('shielding_calcMode') || MODE_GAMMA_DOSE);
    const [definitionMode, setDefinitionMode] = React.useState(DEFINE_BY_SOURCE);
    const [inputMode, setInputMode] = React.useState(INPUT_MODE_DB);
    const [useManualHVL, setUseManualHVL] = React.useState(false);
    const [useBuildup, setUseBuildup] = React.useState(false);
    
    const [nuclideSymbol, setNuclideSymbol] = React.useState(() => localStorage.getItem('shielding_nuclideSymbol') || '');
    const [activity, setActivity] = React.useState('1');
    const [activityUnit, setActivityUnit] = React.useState(activityUnits[1]);
    const [distance, setDistance] = React.useState('1');
    const [distanceUnit, setDistanceUnit] = React.useState(distanceUnits[2]);
    
    const [unshieldedRate, setUnshieldedRate] = React.useState('100');
    const [unshieldedRateUnit, setUnshieldedRateUnit] = React.useState(doseRateUnits[1]);
    
    const [genericReference, setGenericReference] = React.useState('Cs-137');
    
    const [manualGamma, setManualGamma] = React.useState('');
    const [manualHVL, setManualHVL] = React.useState('');
    const [manualBetaEnergy, setManualBetaEnergy] = React.useState('');
    
    const [shieldMaterial, setShieldMaterial] = React.useState('Lead');
    const [shieldThickness, setShieldThickness] = React.useState('1');
    const [thicknessUnit, setThicknessUnit] = React.useState('cm');
    const [targetDoseRate, setTargetDoseRate] = React.useState('2');
    const [targetDoseRateUnit, setTargetDoseRateUnit] = React.useState(doseRateUnits[1]);
    
    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState('');
    
    // --- Persistence ---
    React.useEffect(() => {
        localStorage.setItem('shielding_calcMode', calcMode);
        localStorage.setItem('shielding_nuclideSymbol', nuclideSymbol);
    }, [calcMode, nuclideSymbol]);
    
    const shieldingNuclides = React.useMemo(() => radionuclides.filter(n => n.gammaConstant && HVL_DATA[n.symbol]).sort((a,b) => a.name.localeCompare(b.name)), [radionuclides] );
    const betaNuclides = React.useMemo(() => radionuclides.filter(n => n.emissionEnergies?.beta?.length > 0).sort((a,b) => a.name.localeCompare(b.name)), [radionuclides] );
    
    const availableMaterials = React.useMemo(() => {
        if (calcMode === MODE_BETA_RANGE) return Object.keys(SHIELD_PROPS);
        if (useManualHVL) return ['Lead', 'Concrete', 'Steel', 'Water', 'Aluminum', 'Tungsten', 'Plastic', 'Glass'];
        if (definitionMode === DEFINE_BY_RATE) return ['Lead', 'Concrete', 'Steel', 'Water', 'Aluminum'];
        if (inputMode === INPUT_MODE_DB && nuclideSymbol && HVL_DATA[nuclideSymbol]) {
            return Object.keys(HVL_DATA[nuclideSymbol]).filter(k => k !== 'sourceRef');
        }
        return ['Lead', 'Concrete', 'Steel', 'Water', 'Aluminum', 'Tungsten'];
    }, [calcMode, inputMode, nuclideSymbol, definitionMode, useManualHVL]);
    
    React.useEffect(() => {
        if (!availableMaterials.includes(shieldMaterial)) setShieldMaterial(availableMaterials[0]);
    }, [availableMaterials, calcMode]);
    
    // Factors
    const activityFactors = { 'Bq': 1 / 3.7e10, 'kBq': 1 / 3.7e7, 'MBq': 1 / 37000, 'GBq': 1 / 37, 'TBq': 1/0.037, 'µCi': 1e-6, 'mCi': 1e-3, 'Ci': 1 };
    const distanceFactors = { 'mm': 0.001, 'cm': 0.01, 'm': 1, 'in': 0.0254, 'ft': 0.3048 };
    const thicknessFactors = { 'mm': 0.1, 'cm': 1, 'in': 2.54 };
    const doseRateFactors_mrem_hr = { 'µrem/hr': 0.001, 'mrem/hr': 1, 'rem/hr': 1000, 'mR/hr': 1, 'R/hr': 1000, 'µSv/hr': 0.1, 'mSv/hr': 100, 'Sv/hr': 100000 };
    
    // --- Core Calculation Logic ---
    React.useEffect(() => {
        try {
            setError(''); setResult(null);
            
            // 1. BETA CALCULATION
            if (calcMode === MODE_BETA_RANGE) {
                let E_max = 0;
                if (inputMode === INPUT_MODE_DB) {
                    if (!nuclideSymbol) return;
                    const n = radionuclides.find(r => r.symbol === nuclideSymbol);
                    if (n?.emissionEnergies?.beta) E_max = parseEnergyToMeV(n.emissionEnergies.beta);
                } else {
                    E_max = safeParseFloat(manualBetaEnergy);
                }
                
                if (!E_max || E_max <= 0) return;
                
                const mat = SHIELD_PROPS[shieldMaterial];
                if (!mat) { setError("Invalid shield material."); return; }
                if (mat.density <= 0) { setError("Cannot calculate range for 'None' density."); return; }
                
                // Katz-Penfold Range (mg/cm2)
                let range_mg_cm2;
                if (E_max > 0.8) range_mg_cm2 = 542 * E_max - 133;
                else if (E_max >= 0.15) range_mg_cm2 = 407 * Math.pow(E_max, 1.38);
                else range_mg_cm2 = 407 * Math.pow(E_max, 1.38);
                
                const density_mg_cm3 = mat.density * 1000;
                const thickness_cm = range_mg_cm2 / density_mg_cm3;
                
                let warning = null;
                if (mat.type === 'High-Z') {
                    warning = `High-Z material (${shieldMaterial}) generates Bremsstrahlung X-rays. Use Plastic/Lucite instead.`;
                }
                
                setResult({ type: 'beta', thickness_cm, material: shieldMaterial, range_mg_cm2, warning });
                return;
            }
            
            // 2. GAMMA CALCULATIONS
            let unshieldedRate_R_hr = 0;
            
            if (definitionMode === DEFINE_BY_RATE) {
                const rateVal = safeParseFloat(unshieldedRate);
                if (isNaN(rateVal) || rateVal < 0) { if(unshieldedRate) setError("Rate must be positive."); return; }
                unshieldedRate_R_hr = (rateVal * doseRateFactors_mrem_hr[unshieldedRateUnit]) / 1000;
            } else {
                const actVal = safeParseFloat(activity);
                const distVal = safeParseFloat(distance);
                
                if (isNaN(actVal) || isNaN(distVal) || actVal <= 0 || distVal <= 0) {
                    if (activity && distance) setError("Inputs must be valid positive numbers.");
                    return;
                }
                
                let gammaConst = 0;
                if (inputMode === INPUT_MODE_DB) {
                    if (nuclideSymbol) {
                        const n = radionuclides.find(r => r.symbol === nuclideSymbol);
                        gammaConst = safeParseFloat(n?.gammaConstant);
                    }
                } else {
                    gammaConst = safeParseFloat(manualGamma);
                }
                
                if (!gammaConst || isNaN(gammaConst)) {
                    if(inputMode === INPUT_MODE_MANUAL) setError("Invalid Gamma Constant.");
                    return;
                }
                
                const actCi = actVal * activityFactors[activityUnit];
                const distM = distVal * distanceFactors[distanceUnit];
                unshieldedRate_R_hr = (gammaConst * actCi) / Math.pow(distM, 2);
            }
            
            let hvl_cm = 0;
            if (useManualHVL) {
                hvl_cm = safeParseFloat(manualHVL);
            } else if (definitionMode === DEFINE_BY_RATE) {
                hvl_cm = HVL_DATA[genericReference]?.[shieldMaterial];
            } else if (inputMode === INPUT_MODE_DB && nuclideSymbol) {
                hvl_cm = HVL_DATA[nuclideSymbol]?.[shieldMaterial];
            } else {
                hvl_cm = safeParseFloat(manualHVL);
            }
            
            if ((!useManualHVL && !hvl_cm) || isNaN(hvl_cm) || hvl_cm <= 0) {
                if (shieldMaterial && definitionMode === DEFINE_BY_RATE) { /* Wait */ }
                else if (shieldMaterial && nuclideSymbol) {
                    setError(`HVL data unavailable for ${shieldMaterial}. Enable "Override HVL" to enter it manually.`);
                }
                return;
            }

            // TVL Calculation
            const tvl_cm = hvl_cm * 3.3219;
            
            if (calcMode === MODE_GAMMA_DOSE) {
                const thickVal = safeParseFloat(shieldThickness);
                if (isNaN(thickVal) || thickVal < 0) return;
                const thickCm = thickVal * thicknessFactors[thicknessUnit];
                
                let buildup = 1;
                let warning = null;
                
                if (useBuildup) {
                    const mu = Math.log(2) / hvl_cm;
                    const mfp = mu * thickCm; // Mean Free Paths
                    buildup = 1 + mfp;

                    if (thickCm > (1.5 * hvl_cm)) {
                        warning = "Caution: Linear buildup approximation underestimates dose for thick shields (>1.5 HVL).";
                    }
                }
                                                        
                let transmission = Math.pow(0.5, thickCm / hvl_cm);
                if (transmission < 1e-9) transmission = 0;
                
                const shieldedRate_R_hr = unshieldedRate_R_hr * transmission * buildup;
                const shieldedRate_mrem_hr = shieldedRate_R_hr * 1000;
                
                let reductionFactor = transmission > 0 ? (1 / transmission) : 99999; 
                if (reductionFactor > 10000) reductionFactor = 10000;
                
                setResult({
                    type: 'gamma_dose',
                    unshielded_mrem_hr: unshieldedRate_R_hr * 1000,
                    shielded_mrem_hr: shieldedRate_mrem_hr < 1e-9 ? 0 : shieldedRate_mrem_hr,
                    transmission: transmission,
                    reduction: reductionFactor,
                    buildup: buildup,
                    hvl: hvl_cm,
                    tvl: tvl_cm, 
                    warning: warning
                });

                
            } else if (calcMode === MODE_FIND_THICKNESS) {
                const targetVal = safeParseFloat(targetDoseRate);
                if (isNaN(targetVal) || targetVal <= 0) return;
                const target_R_hr = (targetVal * doseRateFactors_mrem_hr[targetDoseRateUnit]) / 1000;
                
                if (target_R_hr >= unshieldedRate_R_hr) {
                    setResult({ type: 'thickness', val: 0, msg: "Target > Unshielded Rate", unshielded_mrem_hr: unshieldedRate_R_hr * 1000, hvl: hvl_cm, tvl: tvl_cm });
                    return;
                }
                
                let reqThickCm = hvl_cm * Math.log2(unshieldedRate_R_hr / target_R_hr);
                
                // SAFETY FIX: Finite Check on Iterative Buildup
                if (useBuildup) {
                    for(let i=0; i<10; i++) {
                        const mfp = (Math.log(2) / hvl_cm) * reqThickCm;
                        const B = 1 + mfp;
                        // Avoid runaway
                        if (!isFinite(B) || B > 1e6) break;
                        reqThickCm = hvl_cm * Math.log2((unshieldedRate_R_hr * B) / target_R_hr);
                    }
                }
                
                setResult({
                    type: 'thickness',
                    val: reqThickCm,
                    unshielded_mrem_hr: unshieldedRate_R_hr * 1000,
                    hvl: hvl_cm,
                    tvl: tvl_cm 
                });
            }
            
        } catch (e) { setError(e.message); setResult(null); }
    }, [calcMode, definitionMode, inputMode, nuclideSymbol, manualGamma, manualHVL, manualBetaEnergy, activity, activityUnit, distance, distanceUnit, unshieldedRate, unshieldedRateUnit, genericReference, shieldMaterial, shieldThickness, thicknessUnit, targetDoseRate, targetDoseRateUnit, useManualHVL, useBuildup]);
    
    const handleSaveToHistory = () => {
        if (!result) return;
        let resStr = "";
        if (result.type === 'beta' || result.type === 'thickness') {
            const fmt = formatSensibleUnit(result.val || result.thickness_cm, 'distance');
            resStr = `${fmt.value} ${fmt.unit} ${shieldMaterial}`;
        } else {
            const fmt = formatDoseValue(result.shielded_mrem_hr, 'doseRate', settings);
            resStr = `${fmt.value} ${fmt.unit}`;
        }
        addHistory({ id: Date.now(), type: 'Shielding', icon: ICONS.shield, inputs: `${shieldMaterial} calculation`, result: resStr, view: VIEWS.SHIELDING });
        addToast("Saved to history!");
    };
    
    const handleClearInputs = () => {
        setCalcMode(MODE_GAMMA_DOSE);
        setDefinitionMode(DEFINE_BY_SOURCE);
        setInputMode(INPUT_MODE_DB);
        setUseManualHVL(false);
        setUseBuildup(false);
        setNuclideSymbol('');
        setActivity('1');
        setUnshieldedRate('100');
        setShieldMaterial('Lead');
        setShieldThickness('1');
        setResult(null);
        setError('');
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Shielding Calculator</h2>
                    <ClearButton onClick={handleClearInputs} />
                </div>
                
                <ContextualNote type="info">Calculates attenuation of photons using Half-Value Layers (HVL). </ContextualNote>
                
                {/* MAIN TABS */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6">
                    {[
                        { id: MODE_GAMMA_DOSE, label: 'Gamma Dose' },
                        { id: MODE_FIND_THICKNESS, label: 'Find Thickness' },
                        { id: MODE_BETA_RANGE, label: 'Beta Range' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setCalcMode(tab.id)}
                            className={`py-2 rounded-md text-sm font-bold transition-all
                            ${calcMode === tab.id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                <div className="space-y-5">
                    {/* 1. GAMMA DEFINITION MODE */}
                    {calcMode !== MODE_BETA_RANGE && (
                        <div className="flex justify-center mb-2">
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                                <button onClick={() => setDefinitionMode(DEFINE_BY_SOURCE)} className={`px-4 py-1 text-xs font-bold rounded transition-colors ${definitionMode === DEFINE_BY_SOURCE ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Define Source</button>
                                <button onClick={() => setDefinitionMode(DEFINE_BY_RATE)} className={`px-4 py-1 text-xs font-bold rounded transition-colors ${definitionMode === DEFINE_BY_RATE ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Known Dose Rate</button>
                            </div>
                        </div>
                    )}
                    
                    {/* 2. SOURCE INPUTS */}
                    {calcMode === MODE_BETA_RANGE || (definitionMode === DEFINE_BY_SOURCE) ? (
                        <>
                            {calcMode !== MODE_BETA_RANGE && (
                                <div className="flex justify-end -mt-4 mb-2">
                                    <button onClick={() => setInputMode(inputMode === INPUT_MODE_DB ? INPUT_MODE_MANUAL : INPUT_MODE_DB)} className="text-xs text-sky-600 hover:underline">
                                        Switch to {inputMode === INPUT_MODE_DB ? 'Manual' : 'Database'}
                                    </button>
                                </div>
                            )}
                            
                            {inputMode === INPUT_MODE_DB || calcMode === MODE_BETA_RANGE ? (
                                <div className="min-h-[42px]">
                                    {nuclideSymbol ?
                                        <CalculatorNuclideInfo nuclide={radionuclides.find(n => n.symbol === nuclideSymbol)} onClear={() => setNuclideSymbol('')} />
                                        : <SearchableSelect options={calcMode === MODE_BETA_RANGE ? betaNuclides : shieldingNuclides} onSelect={setNuclideSymbol} placeholder="Select radionuclide..." />
                                    }
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                    <div><label className="text-xs font-bold">Gamma Constant (Γ)</label><input type="number" value={manualGamma} onChange={e => setManualGamma(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm" placeholder="R·m²/hr·Ci" /></div>
                                    <div><label className="text-xs font-bold">Half-Value Layer (cm)</label><input type="number" value={manualHVL} onChange={e => { setManualHVL(e.target.value); setUseManualHVL(true); }} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm" /></div>
                                </div>
                            )}
                            
                            {calcMode === MODE_BETA_RANGE && !nuclideSymbol && (
                                <div><label className="text-xs font-bold">Max Beta Energy (MeV)</label><input type="number" value={manualBetaEnergy} onChange={e => setManualBetaEnergy(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm" /></div>
                            )}
                            
                            {calcMode !== MODE_BETA_RANGE && (
                                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                    <div><label className="text-xs font-bold mb-1 block">Activity</label><div className="flex"><input type="number" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/><select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{activityUnits.map(u=><option key={u}>{u}</option>)}</select></div></div>
                                    <div><label className="text-xs font-bold mb-1 block">Distance</label><div className="flex"><input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/><select value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u=><option key={u}>{u}</option>)}</select></div></div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="animate-fade-in">
                            <label className="text-xs font-bold mb-1 block">Initial (Unshielded) Dose Rate</label>
                            <div className="flex">
                                <input type="number" value={unshieldedRate} onChange={e => setUnshieldedRate(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/>
                                <select value={unshieldedRateUnit} onChange={e => setUnshieldedRateUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{doseRateUnits.map(u=><option key={u}>{u}</option>)}</select>
                            </div>
                            
                            {!useManualHVL && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 text-xs text-blue-800 dark:text-blue-200 rounded border border-blue-100 dark:border-blue-800">
                                    <p><strong>Note:</strong> Since the isotope is unknown, we must assume an energy to estimate shielding effectiveness.</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="font-semibold">Assume:</span>
                                        <select value={genericReference} onChange={e => setGenericReference(e.target.value)} className="p-1 rounded border border-blue-200 dark:border-blue-700 dark:bg-slate-800">
                                            <option value="I-125">Low Energy (I-125 / 30 keV)</option>
                                            <option value="Cs-137">Medium Energy (Cs-137 / 662 keV)</option>
                                            <option value="Co-60">High Energy (Co-60 / 1.25 MeV)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Shielding Configuration</label>
                            {calcMode !== MODE_BETA_RANGE && (inputMode === INPUT_MODE_DB || definitionMode === DEFINE_BY_RATE) && (
                                <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={useManualHVL} onChange={e => setUseManualHVL(e.target.checked)} className="form-checkbox h-3 w-3 rounded text-sky-600" /> Override HVL</label>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium mb-1 block">Material</label>
                                <select value={shieldMaterial} onChange={e => setShieldMaterial(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm">
                                    {availableMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            
                            {calcMode === MODE_GAMMA_DOSE && (
                                <div><label className="text-xs font-medium mb-1 block">Thickness</label><div className="flex"><input type="number" value={shieldThickness} onChange={e => setShieldThickness(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/><select value={thicknessUnit} onChange={e => setThicknessUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{Object.keys(thicknessFactors).map(u=><option key={u}>{u}</option>)}</select></div></div>
                            )}
                            
                            {useManualHVL && calcMode !== MODE_BETA_RANGE && (
                                <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Manual HVL (cm)</label><input type="number" value={manualHVL} onChange={e => setManualHVL(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 rounded text-sm" /></div>
                            )}
                            
                            {calcMode === MODE_FIND_THICKNESS && (
                                <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Target Dose Rate</label><div className="flex"><input type="number" value={targetDoseRate} onChange={e => setTargetDoseRate(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/><select value={targetDoseRateUnit} onChange={e => setTargetDoseRateUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{doseRateUnits.map(u=><option key={u}>{u}</option>)}</select></div></div>
                            )}
                        </div>
                        
                        {calcMode !== MODE_BETA_RANGE && (
                            <div className="flex justify-end pt-2">
                                <Tooltip text="Approximation (B = 1 + μx). Conservative for < 3 mfp."><label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-600 dark:text-slate-400"><input type="checkbox" checked={useBuildup} onChange={e => setUseBuildup(e.target.checked)} className="form-checkbox h-3 w-3 rounded text-sky-600" /> Apply Buildup Factor</label></Tooltip>
                            </div>
                        )}
                    </div>
                </div>
                
                {error && <p className="text-red-500 text-sm text-center mt-4 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
                
                {result && (
                    <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in shadow-sm relative overflow-hidden">
                        <div className="flex justify-end -mt-3 -mr-3 mb-2"><Tooltip text="Save to history"><button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></Tooltip></div>
                        
                        {result.type === 'gamma_dose' && (
                            <>
                                <p className="text-xs uppercase font-bold text-slate-500 mb-2">Shielded Dose Rate</p>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{formatDoseValue(result.shielded_mrem_hr, 'doseRate', settings).value}</span>
                                    <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{formatDoseValue(result.shielded_mrem_hr, 'doseRate', settings).unit}</span>
                                    <CopyButton textToCopy={formatDoseValue(result.shielded_mrem_hr, 'doseRate', settings).value} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-600 pt-3">
                                    <p>Unshielded: <strong>{formatDoseValue(result.unshielded_mrem_hr, 'doseRate', settings).value} {formatDoseValue(result.unshielded_mrem_hr, 'doseRate', settings).unit}</strong></p>
                                    
                                    {/* TVL & HVL DISPLAY */}
                                    <p>HVL: <strong>{result.hvl ? result.hvl.toFixed(3) : 'N/A'} cm</strong></p>
                                    <p>TVL: <strong>{result.tvl ? result.tvl.toFixed(3) : 'N/A'} cm</strong></p>
                                    
                                    <p>Shielding Factor: <strong>{result.reduction > 10 ? Math.round(result.reduction) : result.reduction.toFixed(1)}x</strong></p>
                                    <p>Transmission: <strong>{(result.transmission * 100).toFixed(1)}%</strong></p>
                                    {useBuildup && <p>Buildup Factor: <strong>{result.buildup.toFixed(2)}</strong></p>}
                                </div>
                            </>
                        )}
                        
                        {result.type === 'thickness' && (
                            <>
                                {result.val === 0 ? (
                                    <p className="text-amber-600 font-bold">No shielding required</p>
                                ) : (
                                    <>
                                        <p className="text-xs uppercase font-bold text-slate-500 mb-2">Required Thickness</p>
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{formatSensibleUnit(result.val, 'distance').value}</span>
                                            <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{formatSensibleUnit(result.val, 'distance').unit}</span>
                                        </div>
                                        <p className="text-sm text-slate-500">of {shieldMaterial}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            HVL: {result.hvl ? result.hvl.toFixed(3) : 'N/A'} cm | TVL: {result.tvl ? result.tvl.toFixed(3) : 'N/A'} cm
                                        </p>
                                    </>
                                )}
                            </>
                        )}
                        
                        {result.type === 'beta' && (
                            <>
                                <p className="text-xs uppercase font-bold text-slate-500 mb-2">Range (Stopping Thickness)</p>
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{formatSensibleUnit(result.thickness_cm, 'distance').value}</span>
                                    <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{formatSensibleUnit(result.thickness_cm, 'distance').unit}</span>
                                </div>
                                <p className="text-sm text-slate-500">of {result.material}</p>
                            </>
                        )}
                        
                        {/* WARNINGS */}
                        <div className="space-y-2 mt-4 text-left">
                            {result.warning && <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs rounded font-medium border-l-4 border-amber-500">{result.warning}</div>}
                            {result.msg && <div className="p-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs rounded">{result.msg}</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
            
/**
 * @description A calculator for determining allowable stay time and total dose received.
 * Features: Theoretical (Source) vs. Measured (Manual) modes, and a live countdown timer.
 */
const StayTimeCalculator = ({ radionuclides, preselectedNuclide }) => {
    const INPUT_MODE_SOURCE = 'fromSource';
    const INPUT_MODE_MANUAL = 'manualRate';
    
    const { settings } = React.useContext(SettingsContext);
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // --- UNITS & FACTORS ---
    const activityUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['Bq', 'kBq', 'MBq', 'GBq', 'TBq'] : ['µCi', 'mCi', 'Ci'], [settings.unitSystem]);
    const distanceUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['mm', 'cm', 'm'] : ['in', 'ft', 'm'], [settings.unitSystem]);
    const doseRateUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['µSv/hr', 'mSv/hr', 'Sv/hr'] : ['µrem/hr', 'mrem/hr', 'rem/hr', 'R/hr'], [settings.unitSystem]);
    const doseUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['µSv', 'mSv', 'Sv'] : ['µrem', 'mrem', 'rem'], [settings.unitSystem]);
    
    // Conversion Factors (Base: Ci, m, mrem)
    const activityFactorsCi = { 'Bq': 1 / 3.7e10, 'kBq': 1 / 3.7e7, 'MBq': 1 / 37000, 'GBq': 1 / 37, 'TBq': 1/0.037, 'µCi': 1e-6, 'mCi': 1e-3, 'Ci': 1 };
    const distanceFactorsM = { 'mm': 0.001, 'cm': 0.01, 'm': 1, 'in': 0.0254, 'ft': 0.3048 };
    const timeFactorsHours = { 'minutes': 1 / 60, 'hours': 1, 'days': 24 };
    const doseRateFactors_mrem_hr = { 'µrem/hr': 0.001, 'mrem/hr': 1, 'rem/hr': 1000, 'R/hr': 1000, 'µSv/hr': 0.1, 'mSv/hr': 100, 'Sv/hr': 100000 };
    const doseFactors_mrem = { 'µrem': 0.001, 'mrem': 1, 'rem': 1000, 'µSv': 0.1, 'mSv': 100, 'Sv': 100000 };
    const timeUnits_ordered = ['minutes', 'hours', 'days'];

    // --- STATE ---
    const [inputMode, setInputMode] = React.useState(() => localStorage.getItem('stayTime_inputMode') || INPUT_MODE_MANUAL); // Default to Manual (Safer)
    const [nuclideSymbol, setNuclideSymbol] = React.useState(() => localStorage.getItem('stayTime_nuclideSymbol') || '');
    
    const [activity, setActivity] = React.useState(() => localStorage.getItem('stayTime_activity') || '1');
    const [activityUnit, setActivityUnit] = React.useState(activityUnits[1]);
    const [distance, setDistance] = React.useState(() => localStorage.getItem('stayTime_distance') || '1');
    const [distanceUnit, setDistanceUnit] = React.useState(distanceUnits[2]);
    const [transmission, setTransmission] = React.useState(() => localStorage.getItem('stayTime_transmission') || '1.0');
    
    const [manualDoseRate, setManualDoseRate] = React.useState(() => localStorage.getItem('stayTime_manualDoseRate') || '10');
    const [manualDoseRateUnit, setManualDoseRateUnit] = React.useState(doseRateUnits[1]);
    
    const [doseLimit, setDoseLimit] = React.useState(() => localStorage.getItem('stayTime_doseLimit') || '100');
    const [doseLimitUnit, setDoseLimitUnit] = React.useState(doseUnits[1]);
    
    const [plannedTime, setPlannedTime] = React.useState(() => localStorage.getItem('stayTime_plannedTime') || '10');
    const [plannedTimeUnit, setPlannedTimeUnit] = React.useState(() => localStorage.getItem('stayTime_plannedTimeUnit') || 'minutes');
    
    const [result, setResult] = React.useState(null);
    const [error, setError] = React.useState('');

    // Timer State
    const [isTimerRunning, setIsTimerRunning] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState(0);
    
    // --- Persistence ---
    React.useEffect(() => {
        localStorage.setItem('stayTime_inputMode', inputMode);
        localStorage.setItem('stayTime_nuclideSymbol', nuclideSymbol);
        localStorage.setItem('stayTime_activity', activity);
        localStorage.setItem('stayTime_distance', distance);
        localStorage.setItem('stayTime_transmission', transmission);
        localStorage.setItem('stayTime_manualDoseRate', manualDoseRate);
        localStorage.setItem('stayTime_doseLimit', doseLimit);
        localStorage.setItem('stayTime_plannedTime', plannedTime);
        localStorage.setItem('stayTime_plannedTimeUnit', plannedTimeUnit);
    }, [inputMode, nuclideSymbol, activity, distance, transmission, manualDoseRate, doseLimit, plannedTime, plannedTimeUnit]);
    
    React.useEffect(() => { if (!activityUnits.includes(activityUnit)) setActivityUnit(activityUnits[1]); }, [activityUnits, activityUnit]);
    React.useEffect(() => { if (!distanceUnits.includes(distanceUnit)) setDistanceUnit(distanceUnits[2]); }, [distanceUnits, distanceUnit]);
    React.useEffect(() => { if (!doseRateUnits.includes(manualDoseRateUnit)) setManualDoseRateUnit(doseRateUnits[1]); }, [doseRateUnits, manualDoseRateUnit]);
    React.useEffect(() => { if (!doseUnits.includes(doseLimitUnit)) setDoseLimitUnit(doseUnits[1]); }, [doseUnits, doseLimitUnit]);
    
    // Handle Preselection
    React.useEffect(() => {
        if (preselectedNuclide) {
            const gammaNuclides = radionuclides.filter(n => n.gammaConstant);
            if (gammaNuclides.find(n => n.symbol === preselectedNuclide)) {
                setNuclideSymbol(preselectedNuclide);
                setInputMode(INPUT_MODE_SOURCE);
            }
        }
    }, [preselectedNuclide, radionuclides]);
    
    const gammaNuclides = React.useMemo(() => radionuclides.filter(n => n.gammaConstant).sort((a,b) => a.name.localeCompare(b.name)), [radionuclides] );
    
    // --- Calculation ---
    const handleCalculate = React.useCallback(() => {
        let effectiveDoseRate_mrem_hr = 0;
        try {
            const transValue = safeParseFloat(transmission);
            if (isNaN(transValue) || transValue < 0 || transValue > 1) { throw new Error('Transmission must be between 0 and 1.'); }
            
            if (inputMode === INPUT_MODE_SOURCE) {
                const nuclide = gammaNuclides.find(n => n.symbol === nuclideSymbol);
                if (!nuclide) { throw new Error('Please select a radionuclide.'); }
                const activityValue = safeParseFloat(activity);
                const distanceValue = safeParseFloat(distance);
                
                if (isNaN(activityValue) || isNaN(distanceValue) || distanceValue <= 0 || activityValue < 0) { throw new Error('Please enter valid, positive numbers for activity and distance.'); }
                
                const gammaConstant = safeParseFloat(nuclide.gammaConstant);
                const activityInCi = activityValue * activityFactorsCi[activityUnit];
                const distanceInM = distanceValue * distanceFactorsM[distanceUnit];
                
                // Inverse Square + Transmission
                const doseRateR_hr = (gammaConstant * activityInCi) / Math.pow(distanceInM, 2);
                effectiveDoseRate_mrem_hr = doseRateR_hr * 1000 * transValue;
                
            } else {
                const manualRate = safeParseFloat(manualDoseRate);
                if (isNaN(manualRate) || manualRate < 0) { throw new Error('Please enter a valid, non-negative dose rate.'); }
                const baseRate = manualRate * doseRateFactors_mrem_hr[manualDoseRateUnit];
                
                // Apply transmission to manual rate too
                effectiveDoseRate_mrem_hr = baseRate * transValue;
            }
            
            const limitVal = safeParseFloat(doseLimit);
            const plannedTimeValue = safeParseFloat(plannedTime);
            if (isNaN(limitVal) || isNaN(plannedTimeValue) || limitVal <= 0 || plannedTimeValue < 0) { throw new Error('Please enter valid, positive numbers for dose limit and planned time.'); }
            
            if (effectiveDoseRate_mrem_hr <= 1e-9) {
             setResult({ rawDoseRate_mrem_hr: 0, stayTime: 'Infinite', seconds: Infinity, rawTotalDose_mrem: 0, isSafe: true });
             return;
            }
            
            const limit_mrem = limitVal * doseFactors_mrem[doseLimitUnit];
            const stayTimeHours = limit_mrem / effectiveDoseRate_mrem_hr;
            
            let formattedStayTime = "";
            const totalMinutes = stayTimeHours * 60;
            const totalSeconds = stayTimeHours * 3600;

            if (totalMinutes > 6000) {
               formattedStayTime = `> 100 hours`;
            } else if (totalMinutes > 60) {
              const hrs = Math.floor(totalMinutes / 60);
              const mins = Math.round(totalMinutes % 60);
              formattedStayTime = `${hrs} hr ${mins} min`;
            } else {
              const mins = Math.floor(totalMinutes);
              const secs = Math.round((totalMinutes - mins) * 60);
              formattedStayTime = `${mins} min ${secs} sec`;
            }
            
            const plannedTimeInHours = plannedTimeValue * timeFactorsHours[plannedTimeUnit];
            const totalDoseReceived_mrem = effectiveDoseRate_mrem_hr * plannedTimeInHours;
            const isSafe = totalDoseReceived_mrem <= limit_mrem;
            
            setResult({ 
                rawDoseRate_mrem_hr: effectiveDoseRate_mrem_hr, 
                stayTime: formattedStayTime, 
                seconds: totalSeconds,
                rawTotalDose_mrem: totalDoseReceived_mrem, 
                isSafe: isSafe 
            });
        } catch(e) {
            setError(e.message);
            setResult(null);
        }
    }, [inputMode, nuclideSymbol, activity, activityUnit, distance, distanceUnit, transmission, manualDoseRate, manualDoseRateUnit, doseLimit, doseLimitUnit, plannedTime, plannedTimeUnit, gammaNuclides]);
    
    // Auto-Calc Trigger
    React.useEffect(() => {
        setResult(null); setError('');
        if (inputMode === INPUT_MODE_SOURCE && !nuclideSymbol) return;
        // Basic debounce via useEffect dependency
        const timer = setTimeout(handleCalculate, 50);
        return () => clearTimeout(timer);
    }, [handleCalculate]);

    // Timer Logic
    React.useEffect(() => {
        let interval = null;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0 && isTimerRunning) {
            setIsTimerRunning(false);
            addToast("Time Expired!", "warning");
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const handleStartTimer = () => {
        if (!result) return;
        setTimeLeft(Math.floor(result.seconds));
        setIsTimerRunning(true);
    };

    const formatCountdown = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };
    
    const handleClearInputs = () => {
        setInputMode(INPUT_MODE_MANUAL);
        setNuclideSymbol('');
        setActivity('1');
        setDistance('1');
        setTransmission('1.0');
        setManualDoseRate('10');
        setDoseLimit('100');
        setPlannedTime('10');
        setError('');
        setResult(null);
        setIsTimerRunning(false);
        
        const keysToClear = ['stayTime_inputMode', 'stayTime_nuclideSymbol', 'stayTime_activity', 'stayTime_distance', 'stayTime_transmission', 'stayTime_manualDoseRate', 'stayTime_doseLimit', 'stayTime_plannedTime'];
        keysToClear.forEach(key => localStorage.removeItem(key));
    };
    
    const handleSaveToHistory = () => {
        if (result) {
            const formattedDoseRate = formatDoseValue(result.rawDoseRate_mrem_hr, 'doseRate', settings);
            addHistory({
                id: Date.now(),
                type: 'Stay Time',
                icon: ICONS.stopwatch,
                inputs: `${formattedDoseRate.value} ${formattedDoseRate.unit}, ${doseLimit} ${doseLimitUnit} limit`,
                result: result.stayTime,
                view: VIEWS.STAY_TIME
            });
            addToast("Calculation saved to history!");
        }
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Stay Time Calculator</h2>
                    <ClearButton onClick={handleClearInputs} />
                </div>
                
                <div className="flex justify-center mb-6">
                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 w-full">
                        <button onClick={() => setInputMode(INPUT_MODE_SOURCE)} className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${inputMode === INPUT_MODE_SOURCE ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>From Source (Theor.)</button>
                        <button onClick={() => setInputMode(INPUT_MODE_MANUAL)} className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${inputMode === INPUT_MODE_MANUAL ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Known Rate (Meas.)</button>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {inputMode === INPUT_MODE_SOURCE ? (
                        <div className="space-y-4 animate-fade-in">
                             <ContextualNote type="warning"><strong>Warning:</strong> Calculates theoretical unshielded dose rate. Does not account for self-shielding or scatter. Use measured rates for critical safety decisions.</ContextualNote>
                            <div className="min-h-[42px]">
                                {nuclideSymbol ?
                                    <CalculatorNuclideInfo nuclide={gammaNuclides.find(n => n.symbol === nuclideSymbol)} onClear={() => setNuclideSymbol('')} /> :
                                    <SearchableSelect options={gammaNuclides} onSelect={setNuclideSymbol} placeholder="Select a gamma source..." />
                                }
                            </div>
                
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold mb-1 block">Activity</label><div className="flex"><input type="number" value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/><select value={activityUnit} onChange={e => setActivityUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{activityUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                                <div><label className="text-xs font-bold mb-1 block">Distance</label><div className="flex"><input type="number" value={distance} onChange={e => setDistance(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/><select value={distanceUnit} onChange={e => setDistanceUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{distanceUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <label className="text-xs font-bold mb-1 block">Work Area Dose Rate (Unshielded)</label>
                            <div className="flex"><input type="number" value={manualDoseRate} onChange={e => setManualDoseRate(e.target.value)} className="w-full p-2 rounded-l bg-slate-100 dark:bg-slate-700 text-sm"/><select value={manualDoseRateUnit} onChange={e => setManualDoseRateUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{doseRateUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                        </div>
                    )}
                
                    {/* Shared Transmission Input */}
                    <div>
                        <Tooltip text="Factor to account for shielding. 1.0 = Unshielded. 0.5 = 1 HVL.">
                            <label className="text-xs font-bold mb-1 block cursor-help underline decoration-dotted">Transmission Factor (0-1)</label>
                        </Tooltip>
                        <input type="number" step="0.1" min="0" max="1" value={transmission} onChange={e => setTransmission(e.target.value)} className="w-full p-2 rounded bg-slate-100 dark:bg-slate-700 text-sm" placeholder="e.g., 0.5 for 1 HVL"/>
                    </div>
                
                    {/* Planning Section */}
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-1"><Icon path={ICONS.stopwatch} className="w-4 h-4 text-slate-400"/><span className="text-sm font-bold text-slate-600 dark:text-slate-300">ALARA Planning</span></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold mb-1 block">Dose Limit</label><div className="flex"><input type="number" value={doseLimit} onChange={e => setDoseLimit(e.target.value)} className="w-full p-2 rounded-l bg-white dark:bg-slate-700 text-sm"/><select value={doseLimitUnit} onChange={e => setDoseLimitUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{doseUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                            <div><label className="text-xs font-bold mb-1 block">Planned Time</label><div className="flex"><input type="number" value={plannedTime} onChange={e => setPlannedTime(e.target.value)} className="w-full p-2 rounded-l bg-white dark:bg-slate-700 text-sm"/><select value={plannedTimeUnit} onChange={e => setPlannedTimeUnit(e.target.value)} className="rounded-r bg-slate-200 dark:bg-slate-600 text-xs">{timeUnits_ordered.map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                        </div>
                    </div>
                
                    {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
                
                    {result && (
                        <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in shadow-sm relative overflow-hidden">
                            <div className="flex justify-end -mt-3 -mr-3 mb-2"><Tooltip text="Save to history"><button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></Tooltip></div>
                
                            <p className="text-xs uppercase font-bold text-slate-500 mb-2">Maximum Stay Time</p>
                            
                            {/* LIVE TIMER UI */}
                            {isTimerRunning ? (
                                <div className="mb-4 animate-pulse">
                                    <span className="text-5xl font-black text-red-500 font-mono tracking-wider">{formatCountdown(timeLeft)}</span>
                                    <div className="mt-2"><button onClick={() => setIsTimerRunning(false)} className="px-4 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full hover:bg-red-200">STOP TIMER</button></div>
                                </div>
                            ) : (
                                <div className="mb-4 group relative">
                                    <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{result.stayTime}</span>
                                    {result.seconds < Infinity && (
                                        <button onClick={handleStartTimer} className="absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-sky-500 hover:text-sky-700">
                                            <Icon path={ICONS.play || "M8 5v14l11-7z"} className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            )}
                
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-600 pt-3">
                                <div>
                                    <p>Effective Rate:</p>
                                    <p className="font-bold text-sm text-slate-800 dark:text-white">
                                        {formatDoseValue(result.rawDoseRate_mrem_hr, 'doseRate', settings).value} {formatDoseValue(result.rawDoseRate_mrem_hr, 'doseRate', settings).unit}
                                    </p>
                                </div>
                                <div>
                                    <p>Proj. Dose:</p>
                                    <p className={`font-bold text-sm ${result.isSafe ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                        {formatDoseValue(result.rawTotalDose_mrem, 'dose', settings).value} {formatDoseValue(result.rawTotalDose_mrem, 'dose', settings).unit}
                                    </p>
                                </div>
                            </div>
                
                            {!result.isSafe && <p className="text-xs font-bold text-red-500 mt-2 bg-red-50 dark:bg-red-900/30 p-1 rounded">Planned time exceeds dose limit!</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};      
        
/**
 * @description Integrated Neutron Tools: Fluence-Dose, Activation, Composite, and Shielding.
 */

// --- 1. Fluence <-> Dose Converter ---
const FluenceDoseConverter = ({ calcMode, setCalcMode, energy, setEnergy, inputValue, setInputValue, inputUnit, setInputUnit, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const { settings } = React.useContext(SettingsContext);
    
    // Dynamic Units
    const doseUnits = React.useMemo(() => settings.unitSystem === 'si' ? ['µSv', 'mSv', 'Sv'] : ['µrem', 'mrem', 'rem'], [settings.unitSystem]);
    
    // Auto-switch default input unit
    React.useEffect(() => {
        if (calcMode === 'doseToFluence') {
            if (!doseUnits.includes(inputUnit)) setInputUnit(doseUnits[1]);
        } else {
            setInputUnit('n/cm²');
        }
    }, [calcMode, settings.unitSystem]);
    
    const logLogInterpolate = (targetX, x1, y1, x2, y2) => y1 * Math.pow(targetX / x1, Math.log(y2 / y1) / Math.log(x2 / x1));
    const doseFactorsRem = { 'µrem': 1e-6, 'mrem': 1e-3, 'rem': 1, 'µSv': 1e-4, 'mSv': 0.1, 'Sv': 100 };
    
    React.useEffect(() => {
        try {
            setError('');
            const val = safeParseFloat(inputValue);
            const energyVal = safeParseFloat(energy);
            
            if (isNaN(val) || isNaN(energyVal) || val < 0 || energyVal <= 0) {
                if(inputValue) setError('Inputs must be positive numbers.');
                setResult(null); return;
            }
            
            // Interpolate Fluence-to-Rem factor (n/cm2 per rem)
            // Note: NEUTRON_CONVERSION_FACTORS must be sorted by energyMeV ascending
            let p1 = NEUTRON_CONVERSION_FACTORS[0], p2 = NEUTRON_CONVERSION_FACTORS[NEUTRON_CONVERSION_FACTORS.length - 1];
            
            if (energyVal < p1.energyMeV) { p2 = p1; }
            else if (energyVal > p2.energyMeV) { p1 = p2; }
            else {
                for (let i = 0; i < NEUTRON_CONVERSION_FACTORS.length - 1; i++) {
                    if (energyVal >= NEUTRON_CONVERSION_FACTORS[i].energyMeV && energyVal <= NEUTRON_CONVERSION_FACTORS[i + 1].energyMeV) {
                        p1 = NEUTRON_CONVERSION_FACTORS[i];
                        p2 = NEUTRON_CONVERSION_FACTORS[i + 1];
                        break;
                    }
                }
            }
            
            const fluencePerRem = (p1.energyMeV === p2.energyMeV) 
                ? p1.fluencePerRem 
                : logLogInterpolate(energyVal, p1.energyMeV, p1.fluencePerRem, p2.energyMeV, p2.fluencePerRem);
            
            if (calcMode === 'fluenceToDose') {
                const dose_rem = val / fluencePerRem;
                const formatted = formatDoseValue(dose_rem * 1000, 'dose', settings);
                setResult({
                    val: formatted.value,
                    unit: formatted.unit,
                    label: 'Equivalent Dose',
                    factor: fluencePerRem.toExponential(2)
                });
            } else {
                const dose_rem = val * doseFactorsRem[inputUnit];
                const fluence = dose_rem * fluencePerRem;
                setResult({
                    val: fluence.toExponential(3),
                    unit: 'n/cm²',
                    label: 'Required Fluence',
                    factor: fluencePerRem.toExponential(2)
                });
            }
        } catch (e) { setError('Calculation error.'); setResult(null); }
    }, [calcMode, energy, inputValue, inputUnit, settings.unitSystem]);
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'Neutron Conversion', icon: ICONS.neutron, inputs: `${inputValue} ${inputUnit} (${energy} MeV)`, result: `${result.val} ${result.unit}`, view: VIEWS.NEUTRON });
            addToast("Calculation saved to history!");
        }
    };
    
    return (
        <div className="space-y-4">
            <ContextualNote type="info">Converts between neutron fluence and dose equivalent using 10 CFR 20 (NCRP 38) quality factors.</ContextualNote>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <button onClick={() => setCalcMode('fluenceToDose')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'fluenceToDose' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Fluence → Dose</button>
                <button onClick={() => setCalcMode('doseToFluence')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'doseToFluence' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Dose → Fluence</button>
            </div>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div><label className="block text-sm font-medium">Neutron Energy</label><select value={energy} onChange={e => setEnergy(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">{NEUTRON_CONVERSION_FACTORS.map(f => <option key={f.energyMeV} value={f.energyMeV}>{f.label}</option>)}</select></div>
                <div>
                    <label className="block text-sm font-medium">{calcMode === 'fluenceToDose' ? 'Neutron Fluence' : 'Dose'}</label>
                    <div className="flex">
                        <input type="number" value={inputValue} onChange={e => setInputValue(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700" />
                        {calcMode === 'doseToFluence' ? (
                            <select value={inputUnit} onChange={e => setInputUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{doseUnits.map(u => <option key={u} value={u}>{u}</option>)}</select>
                        ) : (
                            <div className="mt-1 px-3 flex items-center bg-slate-200 dark:bg-slate-600 rounded-r-md text-sm text-slate-500 dark:text-slate-300">n/cm²</div>
                        )}
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {result && (
                <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in shadow-sm relative overflow-hidden">
                    <div className="flex justify-end -mt-3 -mr-3 mb-2"><Tooltip text="Save to history"><button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></Tooltip></div>
                    
                    <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2">{result.label}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{result.val}</span>
                        <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{result.unit}</span>
                        <CopyButton textToCopy={result.val} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Factor: {result.factor} n/cm² per rem</p>
                </div>
            )}
        </div>
    );
};

// --- 2. Activation Calculator ---
const ActivationCalculator = ({ radionuclides, inputMode, setInputMode, targetMass, setTargetMass, massUnit, setMassUnit, abundance, setAbundance, neutronFlux, setNeutronFlux, irradiationTime, setIrradiationTime, timeUnit, setTimeUnit, result, setResult, error, setError, targetSymbol, setTargetSymbol, manualAW, setManualAW, manualCS, setManualCS, manualHL, setManualHL, manualHLUnit, setManualHLUnit, manualProductName, setManualProductName }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const { settings } = React.useContext(SettingsContext);
    
    const massUnits = { 'µg': 1e-6, 'mg': 1e-3, 'g': 1, 'kg': 1000 };
    const timeUnits = { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400 };
    
    // Auto-set abundance
    React.useEffect(() => {
        if (inputMode === 'fromDB') {
            const data = NEUTRON_ACTIVATION_DATA.find(t => t.targetSymbol === targetSymbol);
            if (data) setAbundance(data.abundance.toString());
        }
    }, [targetSymbol, inputMode]);
    
    React.useEffect(() => {
        try {
            setError('');
            let atomicWeight, crossSection, halfLife_s, productName;
            
            if (inputMode === 'fromDB') {
                const targetData = NEUTRON_ACTIVATION_DATA.find(t => t.targetSymbol === targetSymbol);
                if (!targetData) throw new Error('Target material data not found.');
                const productData = radionuclides.find(r => r.symbol === targetData.productSymbol);
                if (!productData) throw new Error(`Product ${targetData.productSymbol} data missing.`);
            
                atomicWeight = targetData.atomicWeight;
                crossSection = targetData.thermalCrossSection_barns;
                halfLife_s = parseHalfLifeToSeconds(productData.halfLife);
                productName = `${productData.name} (${productData.symbol})`;
            } else {
                atomicWeight = safeParseFloat(manualAW);
                crossSection = safeParseFloat(manualCS);
                const hl_val = safeParseFloat(manualHL);
                halfLife_s = hl_val * (parseHalfLifeToSeconds(`1 ${manualHLUnit}`));
                productName = manualProductName || 'Product';
                if ([atomicWeight, crossSection, hl_val].some(isNaN)) { if(manualAW) setError('Invalid manual inputs.'); setResult(null); return; }
            }
            
            const mass_g = safeParseFloat(targetMass) * massUnits[massUnit];
            const flux = safeParseFloat(neutronFlux);
            const t_s = safeParseFloat(irradiationTime) * timeUnits[timeUnit];
            const abund = safeParseFloat(abundance) / 100.0;
            
            if ([mass_g, flux, t_s, abund].some(isNaN) || mass_g <= 0 || flux < 0 || t_s < 0 || abund <= 0) {
                if (targetMass && neutronFlux) setError('Inputs must be valid positive numbers.');
                setResult(null); return;
            }
            
            const AVOGADRO = 6.02214076e23;
            const num_target_atoms = (mass_g * abund * AVOGADRO) / atomicWeight;
            const lambda = Math.log(2) / halfLife_s;
            const sigma_cm2 = crossSection * 1e-24;
            
            // Saturation Activity Formula: A = N * sigma * phi * (1 - e^-lambda*t)
            const sat_activity = num_target_atoms * sigma_cm2 * flux;
            const saturation_fraction = 1 - Math.exp(-lambda * t_s);
            const activity_Bq = sat_activity * saturation_fraction;
            
            const configKey = settings.unitSystem === 'si' ? 'activity_si' : 'activity_conventional';
            const baseAct = settings.unitSystem === 'si' ? activity_Bq : activity_Bq / 3.7e10;
            const formatted = formatSensibleUnit(baseAct, configKey);
            
            setResult({
                productName,
                displayVal: formatted.value,
                unit: formatted.unit,
                saturationPct: (saturation_fraction * 100)
            });
            
        } catch (e) { setError(e.message); setResult(null); }
    }, [inputMode, targetSymbol, targetMass, massUnit, abundance, neutronFlux, irradiationTime, timeUnit, manualAW, manualCS, manualHL, manualHLUnit, manualProductName, settings.unitSystem]);
    
    const handleSaveToHistory = () => {
        if (result) {
            let inputs = '';
            if (inputMode === 'fromDB') {
                inputs = `${targetMass} ${massUnit} ${targetSymbol} @ ${neutronFlux} n/cm²s`;
            } else {
                inputs = `${targetMass} ${massUnit} Manual Target @ ${neutronFlux} n/cm²s`;
            }
            
            addHistory({ 
                id: Date.now(), 
                type: 'Activation', 
                icon: ICONS.neutron, 
                inputs: inputs, 
                result: `${result.displayVal} ${result.unit} ${result.productName}`, 
                view: VIEWS.NEUTRON 
            });
            addToast("Calculation saved!");
        }
    };
    
    return (
        <div className="space-y-4">
            <ContextualNote type="info">Calculates induced activity using the saturation equation. Assumes "thin target" approximation (no flux depression).</ContextualNote>
            
            <div className="flex justify-center mb-2">
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                    <button onClick={() => setInputMode('fromDB')} className={`px-4 py-1 text-xs font-bold rounded transition-colors ${inputMode === 'fromDB' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Database</button>
                    <button onClick={() => setInputMode('manual')} className={`px-4 py-1 text-xs font-bold rounded transition-colors ${inputMode === 'manual' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Manual</button>
                </div>
            </div>
            
            {inputMode === 'fromDB' ? (
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg animate-fade-in">
                    <label className="block text-sm font-medium">Target Isotope</label>
                    <select value={targetSymbol} onChange={e => setTargetSymbol(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">{NEUTRON_ACTIVATION_DATA.map(t => <option key={t.targetSymbol} value={t.targetSymbol}>{t.name} ({t.abundance}% nat.)</option>)}</select>
                </div>
            ) : (
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">Atomic Weight</label><input type="number" value={manualAW} onChange={e => setManualAW(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                        <div><label className="block text-sm font-medium">Cross-Section (b)</label><input type="number" value={manualCS} onChange={e => setManualCS(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                    </div>
                    <div><label className="block text-sm font-medium">Product Half-Life</label><div className="flex"><input type="number" value={manualHL} onChange={e => setManualHL(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/><select value={manualHLUnit} onChange={e => setManualHLUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{['seconds', 'minutes', 'hours', 'days', 'years'].map(u => <option key={u} value={u}>{u}</option>)}</select></div></div>
                </div>
            )}
            
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Total Mass</label>
                        <div className="flex">
                            <input type="number" value={targetMass} onChange={e => setTargetMass(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                            <select value={massUnit} onChange={e => setMassUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{Object.keys(massUnits).map(u => <option key={u} value={u}>{u}</option>)}</select>
                        </div>
                    </div>
                    <div>
                        <Tooltip text="Percentage of the total mass that is the target isotope. Defaults to natural abundance.">
                            <label className="block text-sm font-medium cursor-help underline decoration-dotted">Abundance (%)</label>
                        </Tooltip>
                        <input type="number" value={abundance} onChange={e => setAbundance(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/>
                    </div>
                </div>
                <div><label className="block text-sm font-medium">Thermal Flux (n/cm²·s)</label><input type="text" value={neutronFlux} onChange={e => setNeutronFlux(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                <div>
                    <label className="block text-sm font-medium">Irradiation Time</label>
                    <div className="flex">
                        <input type="number" value={irradiationTime} onChange={e => setIrradiationTime(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                        <select value={timeUnit} onChange={e => setTimeUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{Object.keys(timeUnits).map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            {result && (
                <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in shadow-sm relative overflow-hidden">
                    <div className="flex justify-end -mt-3 -mr-3 mb-2"><Tooltip text="Save to Recent Calculations" widthClass="w-auto"><button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-500 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></Tooltip></div>
            
                    <p className="text-xs uppercase font-bold text-slate-500 mb-2">Produced Activity</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{result.displayVal}</span>
                        <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{result.unit}</span>
                        <CopyButton textToCopy={result.displayVal} />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4">of {result.productName}</p>
            
                    {/* Saturation Bar */}
                    <div className="relative pt-1">
                        <div className="flex mb-1 items-center justify-between">
                            <span className="text-xs font-semibold inline-block text-sky-600 dark:text-sky-400">Saturation</span>
                            <span className="text-xs font-semibold inline-block text-sky-600 dark:text-sky-400">{result.saturationPct.toFixed(1)}%</span>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-sky-200 dark:bg-slate-600">
                            <div style={{ width: `${result.saturationPct}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-sky-500"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. Composite Activation Calculator ---
const CompositeActivationCalculator = ({ radionuclides, material, setMaterial, totalMass, setTotalMass, massUnit, setMassUnit, neutronFlux, setNeutronFlux, irradiationTime, setIrradiationTime, timeUnit, setTimeUnit, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const massUnits = { 'µg': 1e-6, 'mg': 1e-3, 'g': 1, 'kg': 1000 };
    const timeUnits = { 'seconds': 1, 'minutes': 60, 'hours': 3600, 'days': 86400 };
    
    React.useEffect(() => {
        try {
            setError('');
            const materialData = COMPOSITE_MATERIALS_DATA[material];
            if (!materialData) throw new Error("Selected material data not found.");
            const total_mass_g = safeParseFloat(totalMass) * massUnits[massUnit];
            const flux_n_cm2_s = safeParseFloat(neutronFlux);
            const time_s = safeParseFloat(irradiationTime) * timeUnits[timeUnit];
            if (isNaN(total_mass_g) || isNaN(flux_n_cm2_s) || isNaN(time_s)) { if(totalMass && neutronFlux && irradiationTime) setError("Inputs must be valid numbers."); setResult(null); return; }
            
            const activationProducts = [];
            for (const component of materialData.composition) {
                const targetData = NEUTRON_ACTIVATION_DATA.find(t => t.targetSymbol === component.targetSymbol);
                if (!targetData) continue;
                const productData = radionuclides.find(r => r.symbol === targetData.productSymbol);
                if (!productData || productData.halfLife === 'Stable') continue;
                
                const component_mass_g = total_mass_g * component.massFraction;
                const AVOGADRO = 6.02214076e23; const BARN_TO_CM2 = 1e-24;
                const num_target_atoms = (component_mass_g / targetData.atomicWeight) * AVOGADRO;
                const product_half_life_s = parseHalfLifeToSeconds(productData.halfLife);
                const product_lambda = Math.log(2) / product_half_life_s;
                const cross_section_cm2 = targetData.thermalCrossSection_barns * BARN_TO_CM2;
                const saturation_factor = 1 - Math.exp(-product_lambda * time_s);
                const activity_Bq = num_target_atoms * cross_section_cm2 * flux_n_cm2_s * saturation_factor;
                
                if (activity_Bq > 1e-3) { activationProducts.push({ product: productData, targetElement: component.element, activity_Bq: activity_Bq, activity_Ci: activity_Bq / 3.7e10 }); }
            }
            activationProducts.sort((a, b) => b.activity_Bq - a.activity_Bq);
            setResult(activationProducts);
        } catch (e) { setError(e.message); setResult(null); }
    }, [material, totalMass, massUnit, neutronFlux, irradiationTime, timeUnit, radionuclides, setResult, setError]);
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'Composite Activation', icon: ICONS.neutron, inputs: `${totalMass} ${massUnit} of ${material}`, result: `${result.length} products found`, view: VIEWS.NEUTRON });
            addToast("Calculation saved to history!");
        }
    };
    
    return (
        <div className="space-y-4">
            <ContextualNote type="info">Estimates activation products in complex materials (concrete, steel, etc.) based on typical composition.</ContextualNote>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div><label className="block text-sm font-medium">Composite Material</label><select value={material} onChange={e => setMaterial(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">{Object.keys(COMPOSITE_MATERIALS_DATA).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div>
                    <label className="block text-sm font-medium">Total Mass</label>
                    <div className="flex">
                        <input type="number" value={totalMass} onChange={e => setTotalMass(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                        <select value={massUnit} onChange={e => setMassUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{Object.keys(massUnits).map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
                <div><label className="block text-sm font-medium">Thermal Neutron Flux (n/cm²·s)</label><input type="text" value={neutronFlux} onChange={e => setNeutronFlux(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                <div>
                    <label className="block text-sm font-medium">Irradiation Time</label>
                    <div className="flex">
                        <input type="number" value={irradiationTime} onChange={e => setIrradiationTime(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                        <select value={timeUnit} onChange={e => setTimeUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{Object.keys(timeUnits).map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {result && (<div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-fade-in">
                <div className="flex justify-between items-center -mt-2">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Principal Activation Products</h3>
                    <Tooltip text="Save to Recent Calculations" widthClass="w-auto">
                        <button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-500 transition-colors">
                            <Icon path={ICONS.notepad} className="w-5 h-5" />
                        </button>
                    </Tooltip>
                </div>
                <div className="space-y-2">{result.length > 0 ? result.map(p => (<div key={p.product.symbol} className="grid grid-cols-3 items-center text-sm border-b border-slate-200 dark:border-slate-600 pb-1 last:border-0"><span className="font-semibold text-sky-600 dark:text-sky-400">{p.product.name}</span><span className="text-xs text-center text-slate-500 dark:text-slate-400">(from {p.targetElement})</span><span className="font-mono text-right">{p.activity_Ci.toExponential(2)} Ci</span></div>)) : <p className="text-center text-sm text-slate-500 dark:text-slate-400">No significant activation products found.</p>}</div>
            </div>)}
        </div>
    );
};

// --- 4. Neutron Shielding Calculator ---
const NeutronShieldingCalculator = ({ selectedEnergy, setSelectedEnergy, initialFlux, setInitialFlux, shieldMaterial, setShieldMaterial, shieldThickness, setShieldThickness, thicknessUnit, setThicknessUnit, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    const thicknessFactors_cm = { 'mm': 0.1, 'cm': 1, 'in': 2.54, 'ft': 30.48 };
    
    // Source Spectrum state
    const [spectrum, setSpectrum] = React.useState('fission'); // 'fission' or 'fusion14'
    
    // Auto-select spectrum based on energy
    React.useEffect(() => {
        const energyMeV = safeParseFloat(selectedEnergy);
        if (isNaN(energyMeV)) return;
        const fusionThreshold = 10; // MeV
        if (energyMeV >= fusionThreshold) {
            setSpectrum('fusion14');
        } else {
            setSpectrum('fission');
        }
    }, [selectedEnergy]);
    
    const getHvl = (mat) => {
        const data = NEUTRON_SHIELDING_DATA[mat];
        if (!data) return null;
        
        const energyMeV = safeParseFloat(selectedEnergy);
        // Thermal neutrons (< 0.1 eV approx)
        if (energyMeV < 1e-6) return data.thermal;
        
        return spectrum === 'fission' ? data.fission : data.fusion14;
    };
    
    const logLogInterpolate = (targetX, x1, y1, x2, y2) => y1 * Math.pow(targetX / x1, Math.log(y2 / y1) / Math.log(x2 / x1));
    
    React.useEffect(() => {
        try {
            setError('');
            const flux_val = safeParseFloat(initialFlux); const thickness_val = safeParseFloat(shieldThickness); const energyVal = safeParseFloat(selectedEnergy);
            if (isNaN(flux_val) || isNaN(thickness_val) || isNaN(energyVal) || flux_val < 0 || thickness_val < 0 || energyVal <= 0) {
                if(initialFlux && shieldThickness && selectedEnergy) setError("Please enter valid positive numbers.");
                setResult(null); return;
            }
            
            const hvl_cm = getHvl(shieldMaterial);
            if (!hvl_cm || hvl_cm >= 99) { throw new Error("This material is ineffective as a shield for the selected neutron energy."); }
            
            // Re-use interpolation logic for dose factor
            let p1 = NEUTRON_CONVERSION_FACTORS[0], p2 = NEUTRON_CONVERSION_FACTORS[NEUTRON_CONVERSION_FACTORS.length - 1];
            if (energyVal < p1.energyMeV) { p2 = p1; }
            else if (energyVal > p2.energyMeV) { p1 = p2; }
            else {
                for (let i = 0; i < NEUTRON_CONVERSION_FACTORS.length - 1; i++) {
                    if (energyVal >= NEUTRON_CONVERSION_FACTORS[i].energyMeV && energyVal <= NEUTRON_CONVERSION_FACTORS[i + 1].energyMeV) {
                        p1 = NEUTRON_CONVERSION_FACTORS[i]; p2 = NEUTRON_CONVERSION_FACTORS[i + 1]; break;
                    }
                }
            }
            const fluencePerRem = (p1.energyMeV === p2.energyMeV) ? p1.fluencePerRem : logLogInterpolate(energyVal, p1.energyMeV, p1.fluencePerRem, p2.energyMeV, p2.fluencePerRem);
            const FLUX_TO_DOSE_RATE_FACTOR = (1 / fluencePerRem) * 1000 * 3600; // rem/hr -> mrem/hr if flux is n/cm2s? No wait.
            // 1 rem = fluencePerRem (n/cm2). 
            // Flux (n/cm2/s) -> Dose Rate (mrem/hr)
            // Dose Rate = (Flux * 3600) / fluencePerRem * 1000
            
            const thickness_cm = thickness_val * thicknessFactors_cm[thicknessUnit];
            const final_flux = flux_val * Math.pow(0.5, thickness_cm / hvl_cm);
            const initial_dose_rate_mrem_hr = (flux_val * 3600 / fluencePerRem) * 1000;
            const final_dose_rate_mrem_hr = (final_flux * 3600 / fluencePerRem) * 1000;
            
            setResult({
                initialFlux: flux_val.toExponential(3),
                finalFlux: final_flux.toExponential(3),
                initialDose: formatSensibleUnit(initial_dose_rate_mrem_hr, 'doseRate'),
                finalDose: formatSensibleUnit(final_dose_rate_mrem_hr, 'doseRate'),
                hvlUsed: hvl_cm
            });
        } catch(e) { setError(e.message); setResult(null); }
    }, [initialFlux, shieldMaterial, shieldThickness, thicknessUnit, selectedEnergy, spectrum, setResult, setError]);
    
    // Save handler 
    const handleSaveToHistory = () => {
        if (result) {
            const inputs = `${initialFlux} n/cm²s (${selectedEnergy} MeV) + ${shieldThickness} ${thicknessUnit} ${shieldMaterial}`;
            addHistory({ 
                id: Date.now(), 
                type: 'Neutron Shielding', 
                icon: ICONS.shield, 
                inputs: inputs, 
                result: `Final: ${result.finalDose.value} ${result.finalDose.unit}`, 
                view: VIEWS.NEUTRON 
            });
            addToast("Calculation saved to history!");
        }
    };
    
    return (
        <div className="space-y-4">
            <ContextualNote type="warning"><strong>Warning:</strong> Uses removal cross-section approximations (modeled as HVL). Effective for fast neutrons in hydrogenous shields, but does not account for thermal neutron capture gammas.</ContextualNote>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div>
                    <label className="block text-sm font-medium">Neutron Energy</label>
                    <select value={selectedEnergy} onChange={e => setSelectedEnergy(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">{NEUTRON_CONVERSION_FACTORS.map(f => <option key={f.energyMeV} value={f.energyMeV}>{f.label}</option>)}</select>
                </div>
                
                {/* A toggle for the spectrum, disabled for thermal neutrons */}
                {safeParseFloat(selectedEnergy) >= 1e-4 && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Assumed Source Spectrum</label>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                            <button onClick={() => setSpectrum('fission')} className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${spectrum === 'fission' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>Fission / AmBe (~2 MeV)</button>
                            <button onClick={() => setSpectrum('fusion14')} className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${spectrum === 'fusion14' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-sm' : 'text-slate-500'}`}>D-T Fusion (~14 MeV)</button>
                        </div>
                    </div>
                )}
                
                <div><label className="block text-sm font-medium">Initial Neutron Flux (n/cm²·s)</label><input type="text" value={initialFlux} onChange={e => setInitialFlux(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                <div><label className="block text-sm font-medium">Shield Material</label><select value={shieldMaterial} onChange={e => setShieldMaterial(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">{Object.keys(NEUTRON_SHIELDING_DATA).map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                <div>
                    <label className="block text-sm font-medium">Shield Thickness</label>
                    <div className="flex">
                        <input type="number" value={shieldThickness} onChange={e => setShieldThickness(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                        <select value={thicknessUnit} onChange={e => setThicknessUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600">{Object.keys(thicknessFactors_cm).map(u => <option key={u} value={u}>{u}</option>)}</select>
                    </div>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
            {result && (
                <div className="mt-6 p-6 bg-slate-100 dark:bg-slate-700 rounded-lg text-center animate-fade-in shadow-sm relative overflow-hidden">
                    <div className="flex justify-end -mt-3 -mr-3 mb-2"><Tooltip text="Save to Recent Calculations" widthClass="w-auto"><button onClick={handleSaveToHistory} className="p-2 text-slate-400 hover:text-sky-600 transition-colors"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></Tooltip></div>
                    <p className="text-xs uppercase font-bold text-slate-500 mb-2">Shielded Dose Rate</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{result.finalDose.value}</span>
                        <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{result.finalDose.unit}</span>
                        <CopyButton textToCopy={result.finalDose.value} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-600 pt-3">
                        <p>Unshielded: <strong>{result.initialDose.value} {result.initialDose.unit}</strong></p>
                        <p>HVL Used: <strong>{result.hvlUsed} cm</strong></p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Container ---
const NeutronCalculator = ({radionuclides}) => {
    const [activeTab, setActiveTab] = React.useState('fluenceDose');
    const { settings } = React.useContext(SettingsContext);
    
    // State wrappers for sub-components (hoisted to keep alive on tab switch if needed, or local)
    // For simplicity, defining state locally in sub-components is cleaner unless persistence across tabs is required.
    // However, the original code hoisted them. To match the requested structure, I will keep the container simple and let sub-components manage state, OR hoist if persistence is desired.
    // Given the complexity, let's let sub-components manage their own state to avoid a massive prop drilling file.
    // BUT the original code passed props. I will hoist state as requested in the prompt's style.
    
    // ... Actually, to ensure the code is "complete" and copy-pasteable as a block, 
    // I will use the hoisted state pattern from the user's snippet.
    
    // State for FluenceDoseConverter
    const [fluence_calcMode, setFluence_calcMode] = React.useState('fluenceToDose');
    const [fluence_energy, setFluence_energy] = React.useState('1');
    const [fluence_inputValue, setFluence_inputValue] = React.useState('1e6');
    const [fluence_inputUnit, setFluence_inputUnit] = React.useState('n/cm²');
    const [fluence_result, setFluence_result] = React.useState(null);
    const [fluence_error, setFluence_error] = React.useState('');
    
    // State for ActivationCalculator
    const [act_inputMode, setAct_inputMode] = React.useState('fromDB');
    const [act_targetMass, setAct_targetMass] = React.useState('1');
    const [act_massUnit, setAct_massUnit] = React.useState('g');
    const [act_abundance, setAct_abundance] = React.useState('100');
    const [act_neutronFlux, setAct_neutronFlux] = React.useState('1e12');
    const [act_irradiationTime, setAct_irradiationTime] = React.useState('1');
    const [act_timeUnit, setAct_timeUnit] = React.useState('hours');
    const [act_result, setAct_result] = React.useState(null);
    const [act_error, setAct_error] = React.useState('');
    const [act_targetSymbol, setAct_targetSymbol] = React.useState('Co-59');
    const [act_manualAW, setAct_manualAW] = React.useState('58.933');
    const [act_manualCS, setAct_manualCS] = React.useState('37.2');
    const [act_manualHL, setAct_manualHL] = React.useState('5.27');
    const [act_manualHLUnit, setAct_manualHLUnit] = React.useState('years');
    const [act_manualProductName, setAct_manualProductName] = React.useState('Co-60');
    
    // State for CompositeActivationCalculator
    const [comp_material, setComp_material] = React.useState('Ordinary Concrete');
    const [comp_totalMass, setComp_totalMass] = React.useState('100');
    const [comp_massUnit, setComp_massUnit] = React.useState('kg');
    const [comp_neutronFlux, setComp_neutronFlux] = React.useState('1e12');
    const [comp_irradiationTime, setComp_irradiationTime] = React.useState('8');
    const [comp_timeUnit, setComp_timeUnit] = React.useState('hours');
    const [comp_result, setComp_result] = React.useState(null);
    const [comp_error, setComp_error] = React.useState('');
    
    // State for NeutronShieldingCalculator
    const [shield_selectedEnergy, setShield_selectedEnergy] = React.useState('2.5');
    const [shield_initialFlux, setShield_initialFlux] = React.useState('1e6');
    const [shield_shieldMaterial, setShield_shieldMaterial] = React.useState('Polyethylene');
    const [shield_shieldThickness, setShield_shieldThickness] = React.useState('10');
    const [shield_thicknessUnit, setShield_thicknessUnit] = React.useState('cm');
    const [shield_result, setShield_result] = React.useState(null);
    const [shield_error, setShield_error] = React.useState('');
    
    const handleClearActiveCalculator = () => {
        switch (activeTab) {
            case 'fluenceDose': 
                setFluence_calcMode('fluenceToDose'); setFluence_energy('1'); setFluence_inputValue('1e6');
                setFluence_result(null); setFluence_error(''); break;
            case 'activation': 
                setAct_inputMode('fromDB'); setAct_targetMass('1'); setAct_massUnit('g'); setAct_neutronFlux('1e12');
                setAct_irradiationTime('1'); setAct_timeUnit('hours'); setAct_targetSymbol('Co-59'); setAct_abundance('100');
                setAct_result(null); setAct_error(''); break;
            case 'composite': 
                setComp_material('Ordinary Concrete'); setComp_totalMass('100'); setComp_massUnit('kg');
                setComp_neutronFlux('1e12'); setComp_irradiationTime('8'); setComp_timeUnit('hours');
                setComp_result(null); setComp_error(''); break;
            case 'shielding': 
                setShield_selectedEnergy('2.5'); setShield_initialFlux('1e6'); setShield_shieldMaterial('Polyethylene');
                setShield_shieldThickness('10'); setShield_thicknessUnit('cm'); setShield_result(null); setShield_error(''); break;
            default: break;
        }
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Neutron Tools</h2>
                    <ClearButton onClick={handleClearActiveCalculator} />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
                    <button onClick={() => setActiveTab('fluenceDose')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'fluenceDose' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Fluence</button>
                    <button onClick={() => setActiveTab('activation')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'activation' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Activation</button>
                    <button onClick={() => setActiveTab('composite')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'composite' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Composite</button>
                    <button onClick={() => setActiveTab('shielding')} className={`p-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'shielding' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Shielding</button>
                </div>
                {activeTab === 'fluenceDose' && <FluenceDoseConverter
                    calcMode={fluence_calcMode} setCalcMode={setFluence_calcMode}
                    energy={fluence_energy} setEnergy={setFluence_energy}
                    inputValue={fluence_inputValue} setInputValue={setFluence_inputValue}
                    inputUnit={fluence_inputUnit} setInputUnit={setFluence_inputUnit}
                    result={fluence_result} setResult={setFluence_result}
                    error={fluence_error} setError={setFluence_error}
                />}
                {activeTab === 'activation' && <ActivationCalculator
                    radionuclides={radionuclides}
                    inputMode={act_inputMode} setInputMode={setAct_inputMode}
                    targetMass={act_targetMass} setTargetMass={setAct_targetMass}
                    massUnit={act_massUnit} setMassUnit={setAct_massUnit}
                    abundance={act_abundance} setAbundance={setAct_abundance}
                    neutronFlux={act_neutronFlux} setNeutronFlux={setAct_neutronFlux}
                    irradiationTime={act_irradiationTime} setIrradiationTime={setAct_irradiationTime}
                    timeUnit={act_timeUnit} setTimeUnit={setAct_timeUnit}
                    result={act_result} setResult={setAct_result}
                    error={act_error} setError={setAct_error}
                    targetSymbol={act_targetSymbol} setTargetSymbol={setAct_targetSymbol}
                    manualAW={act_manualAW} setManualAW={setAct_manualAW}
                    manualCS={act_manualCS} setManualCS={setAct_manualCS}
                    manualHL={act_manualHL} setManualHL={setAct_manualHL}
                    manualHLUnit={act_manualHLUnit} setManualHLUnit={setAct_manualHLUnit}
                    manualProductName={act_manualProductName} setManualProductName={setAct_manualProductName}
                />}
                {activeTab === 'composite' && <CompositeActivationCalculator
                    radionuclides={radionuclides}
                    material={comp_material} setMaterial={setComp_material}
                    totalMass={comp_totalMass} setTotalMass={setComp_totalMass}
                    massUnit={comp_massUnit} setMassUnit={setComp_massUnit}
                    neutronFlux={comp_neutronFlux} setNeutronFlux={setComp_neutronFlux}
                    irradiationTime={comp_irradiationTime} setIrradiationTime={setComp_irradiationTime}
                    timeUnit={comp_timeUnit} setTimeUnit={setComp_timeUnit}
                    result={comp_result} setResult={setComp_result}
                    error={comp_error} setError={setComp_error}
                />}
                {activeTab === 'shielding' && <NeutronShieldingCalculator
                    selectedEnergy={shield_selectedEnergy} setSelectedEnergy={setShield_selectedEnergy}
                    initialFlux={shield_initialFlux} setInitialFlux={setShield_initialFlux}
                    shieldMaterial={shield_shieldMaterial} setShieldMaterial={setShield_shieldMaterial}
                    shieldThickness={shield_shieldThickness} setShieldThickness={setShield_shieldThickness}
                    thicknessUnit={shield_thicknessUnit} setThicknessUnit={setShield_thicknessUnit}
                    result={shield_result} setResult={setShield_result}
                    error={shield_error} setError={setShield_error}
                />}
            </div>
        </div>
    );
};
            
            /**
            * @description A unified calculator for determining detection limits for both
            * MARSSIM-compliant static counts and scanning surveys. Now includes "Time to Target" reverse calc.
            */
            
            const MDACalculator = ({ onNavClick, onDeepLink }) => {
            const MDA_MODE_STATIC = 'static';
            const MDA_MODE_SCAN = 'scan';
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            
            // --- State Management ---
            const [mdaMode, setMdaMode] = React.useState(() => localStorage.getItem('mda_mdaMode') || MDA_MODE_STATIC);
            
            // Shared State
            const [backgroundMode, setBackgroundMode] = React.useState('rate'); // 'rate' or 'counts'
            const [backgroundCpm, setBackgroundCpm] = React.useState(() => localStorage.getItem('mda_backgroundCpm') || '50');
            const [bkgCounts, setBkgCounts] = React.useState('50');
            const [bkgTime, setBkgTime] = React.useState('1');
            
            const [instrumentEff, setInstrumentEff] = React.useState(() => localStorage.getItem('mda_instrumentEff') || '20');
            const [surfaceEff, setSurfaceEff] = React.useState(() => localStorage.getItem('mda_surfaceEff') || '50');
            const [probeArea, setProbeArea] = React.useState(() => localStorage.getItem('mda_probeArea') || '15');
            
            // Static State
            const [grossTime, setGrossTime] = React.useState(() => localStorage.getItem('mda_grossTime') || '1');
            const [outputUnit, setOutputUnit] = React.useState(() => localStorage.getItem('mda_outputUnit') || 'dpm/100cm²');
            const [sampleVolume, setSampleVolume] = React.useState(() => localStorage.getItem('mda_sampleVolume') || '1');
            const [sampleMass, setSampleMass] = React.useState(() => localStorage.getItem('mda_sampleMass') || '100');
            const [targetLimit, setTargetLimit] = React.useState(() => localStorage.getItem('mda_targetLimit') || '');
            
            // Scan State
            const [scanSpeed, setScanSpeed] = React.useState(() => localStorage.getItem('mda_scanSpeed') || '5');
            const [probeDimension, setProbeDimension] = React.useState(() => localStorage.getItem('mda_probeDimension') || '4.4');
            const [dprime, setDprime] = React.useState(() => localStorage.getItem('mda_dprime') || '1.38');
            const [surveyorEff, setSurveyorEff] = React.useState(() => localStorage.getItem('mda_surveyorEff') || '0.5');
            
            const [result, setResult] = React.useState(null);
            const [error, setError] = React.useState('');
            
            // --- Data and Constants ---
            const MDA_UNIT_CONFIG = { 'counts': { label: 'LLD (counts)', category: 'Counts', requires: [] }, 'cpm': { label: 'LLD Rate (cpm)', category: 'Rate', requires: [] }, 'dpm': { label: 'Activity (dpm)', category: 'Activity', requires: ['efficiency'] }, 'Bq': { label: 'Activity (Bq)', category: 'Activity', requires: ['efficiency'] }, 'µCi': { label: 'Activity (µCi)', category: 'Activity', requires: ['efficiency'] }, 'dpm/100cm²': { label: 'Surface (dpm/100cm²)', category: 'Concentration', requires: ['efficiency', 'area'] }, 'Bq/L': { label: 'Liquid (Bq/L)', category: 'Concentration', requires: ['efficiency', 'volume'] }, 'pCi/g': { label: 'Solid (pCi/g)', category: 'Concentration', requires: ['efficiency', 'mass'] } };
            const dpmFactors = { 'dpm': 1, 'Bq': 1 / 60, 'µCi': 1 / 2.22e6 };
            
            const PROBE_PRESETS = {
            'custom': { label: 'Custom / Manual', area: '', dim: '' },
            '44-9': { label: 'Pancake GM (Ludlum 44-9)', area: '15', dim: '4.4' },
            '43-5': { label: 'Alpha Scint. (Ludlum 43-5)', area: '50', dim: '7.6' },
            '43-37': { label: 'Floor Monitor (Gas Prop)', area: '584', dim: '13' },
            '43-68': { label: 'Handheld Gas Prop', area: '100', dim: '10' },
            '43-89': { label: 'Alpha/Beta Scint (Square)', area: '100', dim: '10' },
            '43-93': { label: 'Alpha/Beta Scint (Round)', area: '100', dim: '11' }
            };
            
            React.useEffect(() => {
            localStorage.setItem('mda_mdaMode', mdaMode);
            localStorage.setItem('mda_backgroundCpm', backgroundCpm);
            localStorage.setItem('mda_instrumentEff', instrumentEff);
            localStorage.setItem('mda_surfaceEff', surfaceEff);
            localStorage.setItem('mda_probeArea', probeArea);
            localStorage.setItem('mda_grossTime', grossTime);
            localStorage.setItem('mda_outputUnit', outputUnit);
            localStorage.setItem('mda_sampleVolume', sampleVolume);
            localStorage.setItem('mda_sampleMass', sampleMass);
            localStorage.setItem('mda_scanSpeed', scanSpeed);
            localStorage.setItem('mda_probeDimension', probeDimension);
            localStorage.setItem('mda_dprime', dprime);
            localStorage.setItem('mda_surveyorEff', surveyorEff);
            localStorage.setItem('mda_targetLimit', targetLimit);
            }, [mdaMode, backgroundCpm, instrumentEff, surfaceEff, probeArea, grossTime, outputUnit, sampleVolume, sampleMass, scanSpeed, probeDimension, dprime, surveyorEff, targetLimit]);
            
            React.useEffect(() => { setResult(null); setError(''); }, [mdaMode]);
            
            const handlePresetChange = (key) => {
            const p = PROBE_PRESETS[key];
            if (p && key !== 'custom') {
            setProbeArea(p.area);
            setProbeDimension(p.dim);
            addToast(`Loaded settings for ${p.label}`);
            }
            };
            
            const handleTabSwitch = (newMode) => {
            if (newMode === MDA_MODE_SCAN && backgroundMode === 'counts') {
            const cts = safeParseFloat(bkgCounts);
            const tm = safeParseFloat(bkgTime);
            if (!isNaN(cts) && !isNaN(tm) && tm > 0) {
                setBackgroundCpm((cts / tm).toString());
                setBackgroundMode('rate');
                addToast("Background rate synced from counts.");
            }
            }
            setMdaMode(newMode);
            };
            
            const getTotalEfficiency = (iEff, sEff) => (iEff / 100.0) * (sEff / 100.0);
            
            const handleStaticCalculate = React.useCallback(() => {
            let bkgRate = 0;
            let Tb = 0;
            
            if (backgroundMode === 'rate') {
            bkgRate = safeParseFloat(backgroundCpm);
            Tb = 0; 
            } else {
            const counts = safeParseFloat(bkgCounts);
            Tb = safeParseFloat(bkgTime);
            if (isNaN(counts) || isNaN(Tb) || Tb <= 0) throw new Error("Invalid background counts/time.");
            bkgRate = counts / Tb;
            }
            
            const Ts = safeParseFloat(grossTime);
            const ei = safeParseFloat(instrumentEff);
            const es = safeParseFloat(surfaceEff);
            const A = safeParseFloat(probeArea);
            const V = safeParseFloat(sampleVolume);
            const M = safeParseFloat(sampleMass);
            
            if (isNaN(bkgRate) || isNaN(Ts) || Ts <= 0) throw new Error('Please enter valid, positive numbers for background and time.');
            
            let Ld_counts;
            if (backgroundMode === 'counts' && Math.abs(Ts - Tb) > 0.01 * Ts) {
            Ld_counts = (2.71) + 3.29 * Math.sqrt(bkgRate * Ts * (1 + Ts/Tb));
            } else {
            Ld_counts = 2.71 + 4.65 * Math.sqrt(bkgRate * Ts);
            }
            
            if (isNaN(ei) || isNaN(es) || ei <= 0 || es <= 0) throw new Error('Valid efficiencies are required.');
            const E_total = getTotalEfficiency(ei, es);
            const mda_dpm = (Ld_counts / Ts) / E_total;
            
            let finalMDA;
            if (MDA_UNIT_CONFIG[outputUnit].category === 'Activity') {
            finalMDA = mda_dpm * dpmFactors[outputUnit];
            } else if (outputUnit === 'dpm/100cm²') {
            if (isNaN(A) || A <= 0) throw new Error('Probe Area is required.');
            finalMDA = mda_dpm * (100 / A);
            } else if (outputUnit === 'Bq/L') {
            if (isNaN(V) || V <= 0) throw new Error('Sample Volume is required.');
            finalMDA = (mda_dpm / 60) / V;
            } else if (outputUnit === 'pCi/g') {
            if (isNaN(M) || M <= 0) throw new Error('Sample Mass is required.');
            finalMDA = (mda_dpm / 2.22) / M;
            } else if (outputUnit === 'cpm') {
            finalMDA = Ld_counts / Ts;
            } else if (outputUnit === 'counts') {
            finalMDA = Ld_counts;
            }
            
            let timeToTarget = null;
            const target = safeParseFloat(targetLimit);
            if (outputUnit !== 'counts' && !isNaN(target) && target > 0 && finalMDA > target) {
            timeToTarget = Ts * Math.pow(finalMDA / target, 2);
            }
            
            setResult({ 
            type: 'static', 
            LLD: Ld_counts.toPrecision(3), 
            MDA: finalMDA.toPrecision(3), 
            unit: outputUnit,
            timeToTarget: timeToTarget ? timeToTarget.toFixed(1) : null
            });
            
            }, [backgroundMode, bkgCounts, bkgTime, backgroundCpm, grossTime, instrumentEff, surfaceEff, outputUnit, probeArea, sampleVolume, sampleMass, targetLimit]);
            
            const handleScanCalculate = React.useCallback(() => {
            const bkgRate = safeParseFloat(backgroundCpm);
            const dimension_cm = safeParseFloat(probeDimension);
            const eff_i = safeParseFloat(instrumentEff);
            const eff_s = safeParseFloat(surfaceEff);
            const speed_cms = safeParseFloat(scanSpeed);
            const dp = safeParseFloat(dprime);
            const p = safeParseFloat(surveyorEff);
            const total_area_cm2 = safeParseFloat(probeArea);
            
            if (isNaN(bkgRate) || isNaN(eff_i) || isNaN(eff_s) || isNaN(speed_cms) || isNaN(dimension_cm) || bkgRate < 0 || eff_i <= 0 || eff_s <= 0 || speed_cms <= 0 || dimension_cm <= 0) {
            throw new Error('Please enter valid, positive numbers.');
            }
            if (isNaN(total_area_cm2) || total_area_cm2 <= 0) throw new Error("Probe Area required.");
            
            const residence_time_s = dimension_cm / speed_cms;
            const b_cps = bkgRate / 60.0;
            const E_total = getTotalEfficiency(eff_i, eff_s);
            const B_i = b_cps * residence_time_s;
            const mdcr_instrument_cpm = dp * Math.sqrt(B_i) * (60 / residence_time_s);
            const mdcr_surveyor_cpm = mdcr_instrument_cpm / Math.sqrt(p);
            const scan_mda = mdcr_surveyor_cpm / (E_total * (total_area_cm2 / 100.0));
            
            setResult({
            type: 'scan',
            obs_interval: residence_time_s.toPrecision(2),
            scan_mda: scan_mda.toPrecision(3),
            scan_mdcr: mdcr_surveyor_cpm.toFixed(0),
            isAlphaWarn: bkgRate < 5
            });
            }, [backgroundCpm, probeDimension, instrumentEff, surfaceEff, scanSpeed, dprime, surveyorEff, probeArea]);
            
            const handleSaveToHistory = () => {
            if (!result) return;
            let inputs = mdaMode === MDA_MODE_STATIC ? `Time: ${grossTime} min` : `Speed: ${scanSpeed} cm/s`;
            let resString = mdaMode === MDA_MODE_STATIC ? `${result.MDA} ${result.unit}` : `${result.scan_mda} dpm/100cm²`;
            addHistory({ id: Date.now(), type: mdaMode === MDA_MODE_STATIC ? 'Static MDA' : 'Scan MDC', icon: ICONS.search, inputs: inputs, result: resString, view: VIEWS.MDA });
            addToast("Calculation saved to history!");
            };
            
            React.useEffect(() => {
            try {
            setError(''); setResult(null);
            if (mdaMode === MDA_MODE_STATIC) handleStaticCalculate();
            else handleScanCalculate();
            } catch (e) { setError(e.message); setResult(null); }
            }, [mdaMode, backgroundMode, backgroundCpm, bkgCounts, bkgTime, grossTime, outputUnit, sampleVolume, sampleMass, scanSpeed, dprime, surveyorEff, probeArea, instrumentEff, surfaceEff, probeDimension, targetLimit, handleStaticCalculate, handleScanCalculate]);
            
            const handleClearInputs = () => {
            setMdaMode(MDA_MODE_STATIC);
            setBackgroundCpm('50'); setBkgCounts('50'); setBkgTime('1');
            setInstrumentEff('20'); setSurfaceEff('50'); setProbeArea('15');
            setGrossTime('1'); setOutputUnit('dpm/100cm²'); setTargetLimit('');
            setScanSpeed('5'); setProbeDimension('4.4');
            setResult(null); setError('');
            const keys = ['mda_mdaMode', 'mda_backgroundCpm', 'mda_instrumentEff', 'mda_surfaceEff', 'mda_probeArea', 'mda_grossTime', 'mda_outputUnit', 'mda_targetLimit', 'mda_scanSpeed'];
            keys.forEach(k => localStorage.removeItem(k));
            };
            
            return (
            <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Detection Limit Calculator</h2>
                    <ClearButton onClick={handleClearInputs} />
                </div>
                <div className="flex w-full p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
                    <button onClick={() => handleTabSwitch(MDA_MODE_STATIC)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${mdaMode === MDA_MODE_STATIC ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Static Count MDA</button>
                    <button onClick={() => handleTabSwitch(MDA_MODE_SCAN)} className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${mdaMode === MDA_MODE_SCAN ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Scan Survey MDC</button>
                </div>
            
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4 mb-4">
                    <div className="flex justify-between items-center -mb-2">
                        <h3 className="text-md font-semibold text-center">Shared Inputs</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Preset:</span>
                            <select onChange={(e) => handlePresetChange(e.target.value)} className="text-xs p-1 rounded border border-slate-300 dark:bg-slate-700 dark:border-slate-600">
                                {Object.entries(PROBE_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>
            
                    {mdaMode === MDA_MODE_STATIC && (
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded p-1 text-xs">
                            <button onClick={() => setBackgroundMode('rate')} className={`flex-1 py-1 rounded ${backgroundMode === 'rate' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Enter Rate (CPM)</button>
                            <button onClick={() => setBackgroundMode('counts')} className={`flex-1 py-1 rounded ${backgroundMode === 'counts' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Enter Counts</button>
                        </div>
                    )}
            
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {backgroundMode === 'rate' || mdaMode === MDA_MODE_SCAN ? (
                            <div><label className="block text-sm font-medium">Background Rate (cpm)</label><input type="number" value={backgroundCpm} onChange={e => setBackgroundCpm(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                        ) : (
                            <>
                                <div><label className="block text-sm font-medium">Bkg Counts</label><input type="number" value={bkgCounts} onChange={e => setBkgCounts(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                                <div><label className="block text-sm font-medium">Bkg Time (min)</label><input type="number" value={bkgTime} onChange={e => setBkgTime(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                            </>
                        )}
            
                        <div><label className="block text-sm font-medium">Probe Area (cm²)</label><input type="number" value={probeArea} onChange={e => setProbeArea(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                        <div><label className="block text-sm font-medium">Instrument Eff. (%)</label><input type="number" value={instrumentEff} onChange={e => setInstrumentEff(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                        <div><label className="block text-sm font-medium">Source Eff. (%)</label><input type="number" value={surfaceEff} onChange={e => setSurfaceEff(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                    </div>
                </div>
            
                {mdaMode === MDA_MODE_STATIC ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Sample Time (min)</label><input type="number" value={grossTime} onChange={e => setGrossTime(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                            <div><label className="block text-sm font-medium">Desired Unit</label><select value={outputUnit} onChange={e => setOutputUnit(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">{Object.keys(MDA_UNIT_CONFIG).map(u => <option key={u} value={u}>{MDA_UNIT_CONFIG[u].label}</option>)}</select></div>
                        </div>
                        {MDA_UNIT_CONFIG[outputUnit].requires.includes('volume') && (
                            <div><label className="block text-sm font-medium">Sample Volume (L)</label><input type="number" value={sampleVolume} onChange={e => setSampleVolume(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                        )}
                        {MDA_UNIT_CONFIG[outputUnit].requires.includes('mass') && (
                            <div><label className="block text-sm font-medium">Sample Mass (g)</label><input type="number" value={sampleMass} onChange={e => setSampleMass(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target Limit (Optional)</label>
                            <div className="flex items-center gap-2">
                                <input type="number" value={targetLimit} onChange={e => setTargetLimit(e.target.value)} placeholder={`e.g. 1000`} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                                <span className="text-xs text-slate-500 mt-1 whitespace-nowrap">{outputUnit}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium">Scan Speed (cm/s)</label><input type="number" value={scanSpeed} onChange={e => setScanSpeed(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                            <div><label className="block text-sm font-medium">Probe Dimension (Scan Direction)</label><input type="number" value={probeDimension} onChange={e => setProbeDimension(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                        </div>
                    </div>
                )}
            
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            
                {result && (
                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 animate-fade-in shadow-sm">
                        <div className="flex justify-end -mt-3 -mr-3 mb-2"><button onClick={handleSaveToHistory} className="text-slate-400 hover:text-sky-600"><Icon path={ICONS.notepad} className="w-5 h-5" /></button></div>
            
                        {result.type === 'static' ? (
                            <>
                                <p className="text-xs uppercase font-bold text-slate-500 text-center">
                                    {['cpm', 'counts'].includes(result.unit) ? 'Detection Limit (Ld)' : 'Minimum Detectable Activity'}
                                </p>
            
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{result.MDA}</span>
                                    <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">{result.unit}</span>
                                </div>
            
                                {targetLimit && (
                                    <div className={`mt-3 p-3 rounded text-center border-l-4 ${safeParseFloat(result.MDA) <= safeParseFloat(targetLimit) ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800'}`}>
                                        <p className="font-bold text-sm">{safeParseFloat(result.MDA) <= safeParseFloat(targetLimit) ? "PASS: Meets Limit" : "FAIL: Exceeds Limit"}</p>
                                        {safeParseFloat(result.MDA) > safeParseFloat(targetLimit) && result.timeToTarget && (
                                            <p className="text-xs mt-1">
                                                To reach {targetLimit} {result.unit}, increase sample time to <strong>{result.timeToTarget} min</strong>.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <p className="text-xs uppercase font-bold text-slate-500 text-center">Scan MDC</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{result.scan_mda}</span>
                                    <span className="text-md font-semibold text-slate-600 dark:text-slate-300">dpm/100cm²</span>
                                </div>
                                <div className="mt-2 text-center border-t border-slate-200 dark:border-slate-600 pt-2">
                                    <p className="text-xs text-slate-500">Surveyor Minimum Detectable Count Rate</p>
                                    <p className="font-mono font-bold text-lg text-slate-700 dark:text-slate-200">{result.scan_mdcr} net cpm</p>
                                </div>
                                {result.isAlphaWarn && (
                                    <p className="text-xs text-amber-600 mt-2 text-center bg-amber-50 p-2 rounded">
                                        <strong>Note:</strong> Background is very low (&lt;5 cpm). MARSSIM probability methods (Section 6.7.2.2) may be more accurate than the <em>d'</em> method for Alpha scanning.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            </div>
            );
            };
            
            /**
            * @description A professional-grade scientific calculator component.
            */
            
            const ScientificCalculator = ({ calcState, setCalcState }) => {
            const { addToast } = useToast();
            const calculatorRef = React.useRef(null);
            
            // --- State ---
            const [customConstants, setCustomConstants] = React.useState(() => {
            try { return JSON.parse(localStorage.getItem('user_calc_constants') || '[]'); }
            catch { return []; }
            });
            const [isAddMode, setIsAddMode] = React.useState(false);
            const [newConstName, setNewConstName] = React.useState('');
            const [newConstVal, setNewConstVal] = React.useState('');
            const [angleMode, setAngleMode] = React.useState('deg'); // Default to DEG (more common for techs)
            const [activeKey, setActiveKey] = React.useState(null);
            
            // Ensure state has new fields
            React.useEffect(() => {
            setCalcState(prev => ({
            ...prev,
            lastAnswer: prev.lastAnswer || 0,
            memory: prev.memory || 0,
            isError: false
            }));
            }, [setCalcState]);
            
            // Save constants
            React.useEffect(() => {
            localStorage.setItem('user_calc_constants', JSON.stringify(customConstants));
            }, [customConstants]);
            
            const { expression, result, history, memory, lastAnswer, isError } = calcState;
            
            // --- Helper: Format Display Number ---
            const formatNumber = (numStr) => {
            if (!numStr) return '';
            if (numStr.includes('e') || isError) return numStr;
            const num = safeParseFloat(numStr);
            if (isNaN(num)) return numStr;
            // Limit precision to fit screen, but keep decimals
            return num.toLocaleString('en-US', { maximumFractionDigits: 10, maximumSignificantDigits: 12 });
            };
            
            // --- Core Logic ---
            const safeEvaluate = (expr, currentMode, currentAns) => {
            try {
            // Clean up visual operators for mathjs
            let cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
            
            const scope = {
              Ans: currentAns,
              ...math,
              ln: math.log,
              // Trig overrides for DEG mode: Only convert if input is a NUMBER.
              // If user types 'sin(90 deg)', x is a Unit, so we skip conversion to avoid error.
              sin: (x) => (currentMode === 'deg' && typeof x === 'number') ? math.sin(math.unit(x, 'deg')) : math.sin(x),
              cos: (x) => (currentMode === 'deg' && typeof x === 'number') ? math.cos(math.unit(x, 'deg')) : math.cos(x),
              tan: (x) => (currentMode === 'deg' && typeof x === 'number') ? math.tan(math.unit(x, 'deg')) : math.tan(x),
              
              // Inverse trig returns radians, so we convert TO degrees if in DEG mode
              asin: (x) => currentMode === 'deg' ? math.asin(x) * (180 / Math.PI) : math.asin(x),
              acos: (x) => currentMode === 'deg' ? math.acos(x) * (180 / Math.PI) : math.acos(x),
              atan: (x) => currentMode === 'deg' ? math.atan(x) * (180 / Math.PI) : math.atan(x),
            };
            
            const evalResult = math.evaluate(cleanExpr, scope);
            
            // Math.js returns objects {re, im} for complex results like sqrt(-1) or asin(2)
            if (typeof evalResult === 'object' || isNaN(evalResult)) {
                // If it has a real part and negligible imaginary part, use real.
                // Otherwise, throw error because UI can't handle complex numbers.
                if (evalResult && evalResult.re !== undefined && Math.abs(evalResult.im || 0) < 1e-9) {
                    return evalResult.re;
                }
                throw new Error('Domain Error');
            }
            
            return evalResult;
            } catch (e) {
                // Catch all calculation errors (Syntax, Domain, etc.)
                throw new Error('Error');
            }
            };
            
            const handleCalculate = React.useCallback(() => {
            setCalcState(currentState => {
            if (!currentState.expression) return currentState;
            try {
              const evalResult = safeEvaluate(currentState.expression, angleMode, currentState.lastAnswer);
            
              let resultStr;
              if (Math.abs(evalResult) < 1e-9 || Math.abs(evalResult) > 1e12) {
                  resultStr = evalResult.toExponential(6).replace('e+', 'e');
              } else {
                  resultStr = safeParseFloat(evalResult.toPrecision(12)).toString(); // Clean trailing zeros
              }
            
              // Add to history (Limit to 50 items)
              const newHistoryItem = { expr: currentState.expression, res: resultStr };
              const newHistory = [newHistoryItem, ...(currentState.history || [])].slice(0, 50);
            
              return {
                  ...currentState,
                  result: resultStr,
                  lastAnswer: evalResult,
                  history: newHistory,
                  expression: '',
                  isError: false
              };
            } catch (e) {
              return { ...currentState, result: 'Error', isError: true };
            }
            });
            }, [setCalcState, angleMode]);
            
            const handleInput = React.useCallback((val) => {
            setCalcState(currentState => {
            if (currentState.isError) {
              const initExpr = val === '.' ? '0.' : val;
              return { ...currentState, expression: initExpr, result: '', isError: false };
            }
            
            let newExpression = currentState.expression;
            const isOperator = ['+', '-', '*', '/', '^', '%', '!', '^', '×', '÷'].includes(val);
            
            // Smart Decimal: Prefix "0." if empty or after operator
            if (val === '.') {
              const segments = newExpression.split(/[\+\-\*\/\^\%\(\)×÷]/);
              const currentSegment = segments[segments.length - 1];
              if (currentSegment.includes('.')) return currentState; // Prevent 1.2.3
              if (newExpression === '' || /[\+\-\*\/\^\%\(×÷]$/.test(newExpression)) {
                   return { ...currentState, expression: newExpression + '0.', result: '' };
              }
            }
            
            // Smart Start: If result exists and typing operator, use Ans
            if (newExpression === '' && currentState.result !== '') {
              if (isOperator) {
                  newExpression = 'Ans';
              } else if (val === 'e') { // EXP shortcut
                  return { ...currentState, expression: 'Ans*10^', result: '' };
              } else if (!isNaN(parseInt(val)) || val === '.') {
                  // Typing number overwrites result (implicit AC)
                  const startVal = val === '.' ? '0.' : val;
                  return { ...currentState, expression: startVal, result: '' };
              }
            }
            
            // Smart EXP key
            if (val === 'e' && newExpression.endsWith('Ans')) {
              return { ...currentState, expression: newExpression + '*10^', result: '' };
            }
            
            return { ...currentState, expression: newExpression + val, result: '' };
            });
            
            if (calculatorRef.current) calculatorRef.current.focus();
            
            }, [setCalcState]);
            
            const handleClear = () => setCalcState(s => ({ ...s, expression: '', result: '', isError: false }));
            const handleBackspace = () => setCalcState(s => ({ ...s, expression: s.expression.slice(0, -1) }));
            
            // Memory
            const memClear = () => { setCalcState(s => ({ ...s, memory: 0 })); addToast("Memory Cleared"); };
            const memRecall = () => { setCalcState(s => ({ ...s, expression: s.expression + s.memory })); };
            const memAdd = () => {
            try {
            const valToStore = calcState.expression ? safeEvaluate(calcState.expression, angleMode, lastAnswer) : (safeParseFloat(calcState.result) || 0);
            setCalcState(s => ({ ...s, memory: s.memory + valToStore }));
            addToast(`M+ (${(calcState.memory + valToStore).toPrecision(4)})`);
            } catch { addToast("Invalid value"); }
            };
            const memSub = () => {
            try {
            const valToStore = calcState.expression ? safeEvaluate(calcState.expression, angleMode, lastAnswer) : (safeParseFloat(calcState.result) || 0);
            setCalcState(s => ({ ...s, memory: s.memory - valToStore }));
            addToast(`M- (${(calcState.memory - valToStore).toPrecision(4)})`);
            } catch { addToast("Invalid value"); }
            };
            
            const handleHistoryClick = (histItem) => {
            handleInput(histItem.res); // Insert the result
            addToast("Value inserted from history");
            };
            
            const copyResult = () => {
            const textToCopy = result || expression;
            if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            addToast("Copied to clipboard");
            }
            };
            
            const handleKeyDown = React.useCallback((event) => {
            const { key } = event;
            if (event.target.tagName === 'INPUT') return;
            
            let mappedKey = key;
            if (key === 'Enter') mappedKey = '=';
            if (key === 'Escape') mappedKey = 'AC';
            if (key === 'Backspace' || key === 'Delete') mappedKey = 'DEL';
            
            setActiveKey(mappedKey);
            setTimeout(() => setActiveKey(null), 150);
            
            if (/[0-9+\-*/.^()%!]/.test(key)) { event.preventDefault(); handleInput(key); }
            else if (key === 'Enter' || key === '=') { event.preventDefault(); handleCalculate(); }
            else if (key === 'Backspace' || key === 'Delete') { event.preventDefault(); handleBackspace(); }
            else if (key === 'Escape') { event.preventDefault(); handleClear(); }
            else if (key === 'e' || key === 'E') { event.preventDefault(); handleInput('e'); }
            }, [handleInput, handleCalculate, handleBackspace, handleClear]);
            
            const insertConstant = (constVal, name) => {
            handleInput(constVal);
            addToast(`${name} inserted`);
            };
            
            const handleAddConstant = () => {
            if (!newConstName || !newConstVal) { addToast("Name and Value required"); return; }
            if (isNaN(safeParseFloat(newConstVal))) { addToast("Value must be a number"); return; }
            setCustomConstants(prev => [...prev, { name: newConstName, value: newConstVal }]);
            setNewConstName(''); setNewConstVal(''); setIsAddMode(false);
            addToast("Constant Saved");
            };
            
            const handleDeleteConstant = (index, name) => {
            setCustomConstants(prev => prev.filter((_, i) => i !== index));
            addToast(`Deleted ${name}`);
            };
            
            const btnClass = "p-3 text-sm font-bold rounded-lg transition-all shadow-sm border-b-2 active:border-b-0 active:translate-y-[2px] active:brightness-90 duration-75 select-none";
            const getBtnStyle = (baseStyle, keyVal) => {
            const isActive = activeKey === keyVal;
            return `${baseStyle} ${isActive ? 'brightness-90 border-b-0 translate-y-[2px]' : ''}`;
            };
            
            const styles = {
            num: `${btnClass} bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700`,
            op: `${btnClass} bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 border-slate-400 dark:border-slate-900 hover:bg-slate-400 dark:hover:bg-slate-500`,
            func: `${btnClass} bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border-slate-300 dark:border-slate-900 hover:bg-slate-300 dark:hover:bg-slate-600`,
            mem: `${btnClass} bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 text-xs border-amber-300 dark:border-amber-900 hover:bg-amber-300 dark:hover:bg-amber-600`,
            action: `${btnClass} bg-sky-600 text-white border-sky-800 hover:bg-sky-500`,
            danger: `${btnClass} bg-red-500 text-white border-red-700 hover:bg-red-600`,
            del: `${btnClass} bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-900 hover:bg-red-300 dark:hover:bg-red-800`
            };
            
            return (
            <div
            ref={calculatorRef}
            onKeyDown={handleKeyDown}
            tabIndex="0"
            className="focus:outline-none rounded-2xl p-6 shadow-xl bg-sky-50 dark:bg-slate-900 border-2 border-sky-600 dark:border-sky-700 transition-colors"
            >
            {/* LCD Screen */}
            <div className="bg-slate-100 dark:bg-black rounded-xl p-4 mb-4 border-4 border-slate-300 dark:border-slate-700 shadow-inner relative">
            
              {/* Header Row */}
              <div className="flex justify-between items-start mb-2 h-6">
                  <div className="flex gap-2">
                      <button
                          onClick={() => setAngleMode(prev => prev === 'rad' ? 'deg' : 'rad')}
                          className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded shadow-sm hover:bg-slate-300 transition"
                      >
                          {angleMode.toUpperCase()}
                      </button>
                      {memory !== 0 && (
                          <span className="text-[10px] font-bold bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded shadow-sm animate-pulse">M</span>
                      )}
                  </div>
                  <div className="flex gap-2">
                      {(result || expression) && (
                          <Tooltip text="Copy Result">
                              <button onClick={copyResult} className="text-slate-400 hover:text-sky-600 transition">
                                  <Icon path={ICONS.copy} className="w-3.5 h-3.5" />
                              </button>
                          </Tooltip>
                      )}
                      <Tooltip text="Shortcuts: 'e'=EXP, Backspace=DEL" position="left">
                          <span className="text-slate-400 cursor-help"><Icon path={ICONS.help} className="w-3.5 h-3.5" /></span>
                      </Tooltip>
                  </div>
              </div>
            
              {/* History (Paper Tape Style) */}
              <div className="h-24 overflow-y-auto flex flex-col-reverse pr-1 custom-scrollbar gap-1">
                  {history.map((h, i) => (
                      <div
                          key={i}
                          onClick={() => handleHistoryClick(h)}
                          className="flex justify-between items-center text-[10px] font-mono cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 px-1 rounded transition-colors group"
                          title="Click to insert value"
                      >
                          <span className="text-slate-400 dark:text-slate-500 truncate max-w-[60%]">{h.expr}</span>
                          <span className="text-slate-600 dark:text-slate-300 font-bold group-hover:text-sky-600 dark:group-hover:text-sky-400">= {h.res}</span>
                      </div>
                  ))}
              </div>
            
              {/* Current Expression */}
              <div className="text-right h-8 overflow-hidden flex items-end justify-end mt-1">
                  <span className="text-sm font-mono text-slate-500 dark:text-slate-400 whitespace-pre">
                      {expression || (result ? 'Ans' : '')}
                  </span>
              </div>
            
              {/* Main Result */}
              <div className="text-right">
                  <span className={`text-3xl font-mono font-bold tracking-tight break-all ${isError ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                      {result ? formatNumber(result) : (expression || '0')}
                  </span>
              </div>
            </div>
            
            {/* Keypad */}
            <div className="grid grid-cols-5 gap-2">
              <button onClick={memClear} className={styles.mem}>MC</button>
              <button onClick={memRecall} className={styles.mem}>MR</button>
              <button onClick={memAdd} className={styles.mem}>M+</button>
              <button onClick={memSub} className={styles.mem}>M-</button>
              <button onClick={handleClear} className={getBtnStyle(styles.danger, 'AC')}>AC</button>
            
              <button onClick={() => handleInput('sin(')} className={styles.func}>sin</button>
              <button onClick={() => handleInput('cos(')} className={styles.func}>cos</button>
              <button onClick={() => handleInput('tan(')} className={styles.func}>tan</button>
              <button onClick={() => handleInput('log10(')} className={styles.func}>log</button>
              <button onClick={() => handleInput('ln(')} className={styles.func}>ln</button>
            
              <button onClick={() => handleInput('^2')} className={styles.func}>x²</button>
              <button onClick={() => handleInput('^')} className={styles.func}>xʸ</button>
              <button onClick={() => handleInput('sqrt(')} className={styles.func}>√</button>
              <button onClick={() => handleInput('1/')} className={styles.func}>1/x</button>
              <button onClick={() => handleInput('!')} className={styles.func}>n!</button>
            
              <button onClick={() => handleInput('(')} className={styles.func}>(</button>
              <button onClick={() => handleInput(')')} className={styles.func}>)</button>
              <button onClick={() => handleInput('7')} className={getBtnStyle(styles.num, '7')}>7</button>
              <button onClick={() => handleInput('8')} className={getBtnStyle(styles.num, '8')}>8</button>
              <button onClick={() => handleInput('9')} className={getBtnStyle(styles.num, '9')}>9</button>
            
              <button onClick={handleBackspace} className={getBtnStyle(styles.del, 'DEL')}>DEL</button>
              <button onClick={() => handleInput('/')} className={getBtnStyle(styles.op, '/')}>÷</button>
              <button onClick={() => handleInput('4')} className={getBtnStyle(styles.num, '4')}>4</button>
              <button onClick={() => handleInput('5')} className={getBtnStyle(styles.num, '5')}>5</button>
              <button onClick={() => handleInput('6')} className={getBtnStyle(styles.num, '6')}>6</button>
            
              <button onClick={() => handleInput('*')} className={getBtnStyle(styles.op, '*')}>×</button>
              <button onClick={() => handleInput('-')} className={getBtnStyle(styles.op, '-')}>-</button>
              <button onClick={() => handleInput('1')} className={getBtnStyle(styles.num, '1')}>1</button>
              <button onClick={() => handleInput('2')} className={getBtnStyle(styles.num, '2')}>2</button>
              <button onClick={() => handleInput('3')} className={getBtnStyle(styles.num, '3')}>3</button>
            
              <button onClick={() => handleInput('+')} className={getBtnStyle(styles.op, '+')}>+</button>
              <Tooltip text="Scientific Notation (e.g., 5e6)">
                  <button onClick={() => handleInput('e')} className={getBtnStyle(styles.func, 'e')}>EXP</button>
              </Tooltip>
              <button onClick={() => handleInput('0')} className={getBtnStyle(styles.num, '0')}>0</button>
              <button onClick={() => handleInput('.')} className={getBtnStyle(styles.num, '.')}>.</button>
              <Tooltip text="Insert previous answer">
                  <button onClick={() => handleInput('Ans')} className={`${styles.func} font-bold text-sky-700`}>Ans</button>
              </Tooltip>
            </div>
            
            <button onClick={handleCalculate} className={`${getBtnStyle(styles.action, '=')} w-full mt-2 text-xl shadow-lg`}>=</button>
            
            {/* Quick Constants */}
            <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
              <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Physics Constants</p>
                  <button
                      onClick={() => setIsAddMode(!isAddMode)}
                      className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                  >
                      {isAddMode ? 'Cancel' : '+ Add Custom'}
                  </button>
              </div>
            
              {isAddMode && (
                  <div className="mb-3 p-2 bg-white dark:bg-slate-800 rounded border border-sky-200 dark:border-sky-800 animate-fade-in flex gap-2 items-center">
                      <input type="text" placeholder="Name" className="w-1/3 p-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600" value={newConstName} onChange={(e) => setNewConstName(e.target.value)} />
                      <input type="text" placeholder="Value" className="w-1/3 p-1 text-sm border rounded dark:bg-slate-700 dark:border-slate-600" value={newConstVal} onChange={(e) => setNewConstVal(e.target.value)} />
                      <button onClick={handleAddConstant} className="flex-1 p-1 bg-sky-600 text-white text-xs font-bold rounded hover:bg-sky-700">Save</button>
                  </div>
              )}
            
              <div className="flex flex-wrap gap-2 justify-center">
                  <Tooltip text="Pi (approx. 3.14159)"><button onClick={() => insertConstant('3.14159265', 'π')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">π</button></Tooltip>
                  <Tooltip text="Euler's Number (approx. 2.71828)"><button onClick={() => insertConstant('2.71828182', 'e')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">e</button></Tooltip>
                  <Tooltip text="Curie (3.7e10 Bq)"><button onClick={() => insertConstant('3.7e10', 'Ci')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">Ci</button></Tooltip>
                  <Tooltip text="Avogadro's Number (6.022e23)"><button onClick={() => insertConstant('6.022e23', 'Na')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">Nₐ</button></Tooltip>
                  <Tooltip text="Elementary Charge (1.602e-19 C)"><button onClick={() => insertConstant('1.60217663e-19', 'e (charge)')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">qₑ</button></Tooltip>
                  <Tooltip text="Planck's Constant (6.626e-34 J⋅s)"><button onClick={() => insertConstant('6.62607015e-34', 'h')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">h</button></Tooltip>
                  <Tooltip text="Atomic Mass Unit (1.66e-27 kg)"><button onClick={() => insertConstant('1.66053906e-27', 'u')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">u</button></Tooltip>
                  <Tooltip text="Roentgen to C/kg (2.58e-4)"><button onClick={() => insertConstant('2.58e-4', 'R -> C/kg')} className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-slate-700 font-mono rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition">R</button></Tooltip>
            
                  {customConstants.map((c, idx) => (
                      <Tooltip key={idx} text={`Value: ${c.value} (Right-click to delete)`}>
                          <button
                              onClick={() => insertConstant(c.value, c.name)}
                              onContextMenu={(e) => { e.preventDefault(); handleDeleteConstant(idx, c.name); }}
                              className="px-3 py-1.5 text-xs bg-sky-100 dark:bg-sky-900 font-mono font-bold text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-sky-700 rounded hover:bg-sky-200 dark:hover:bg-sky-800 transition"
                          >
                              {c.name}
                          </button>
                      </Tooltip>
                  ))}
              </div>
            </div>
            </div>
            );
            };

                               
    // 1. MDA Calculator (Currie Equation)
        const MdaCalculator = ({ bkgCounts, setBkgCounts, countTime, setCountTime, bkgTime, setBkgTime, efficiency, setEfficiency, effUnit, setEffUnit, probeArea, setProbeArea, result, setResult }) => {
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            
            React.useEffect(() => {
            try {
            const Rb = safeParseFloat(bkgCounts) / safeParseFloat(bkgTime); // Rate Bkg
            const Ts = safeParseFloat(countTime);
            const Tb = safeParseFloat(bkgTime);
            const effVal = safeParseFloat(efficiency);
            const area = safeParseFloat(probeArea);
            
            if (isNaN(Rb) || isNaN(Ts) || isNaN(Tb) || isNaN(effVal) || Ts <= 0 || Tb <= 0) { setResult(null); return; }
            
            // Efficiency -> Decimal
            const effDec = effUnit === '%' ? effVal / 100 : effVal;
            if (effDec <= 0) { setResult(null); return; }
            
            // Currie Equation (Paired vs Unpaired)
            // Lc = Critical Level (Is it real?)
            // Ld = Detection Limit (Can I see it?)
            let Lc, Ld;
            
            if (Math.abs(Ts - Tb) < 0.01) {
              // Paired Observations (Ts = Tb) -> Simplified Currie
              // Ld = 2.71 + 4.65 * sqrt(BkgCounts)
              const B = Rb * Tb;
              Lc = 2.33 * Math.sqrt(B);
              Ld = 2.71 + 4.65 * Math.sqrt(B);
            } else {
              // Unpaired (Different times) -> NUREG-1507 exact formulation
              // Ld (rate) = (2.71/Ts) + 3.29 * sqrt( Rb * (1/Ts + 1/Tb) )
              const term1 = 2.71 / Ts;
              const term2 = 3.29 * Math.sqrt(Rb * (1/Ts + 1/Tb));
              const Ld_rate = term1 + term2;
              Ld = Ld_rate * Ts; // Convert back to counts for display consistency
            
              // Lc (rate) = 1.645 * sqrt( Rb * (1/Ts + 1/Tb) )
              const Lc_rate = 1.645 * Math.sqrt(Rb * (1/Ts + 1/Tb));
              Lc = Lc_rate * Ts;
            }
            
            // Calculate MDA (Activity)
            // MDA = Ld / (T * Eff * Yield * 2.22) -> Yield assumed 1 for now
            // Result in dpm = Ld / (T * Eff) if T is min
            const Ld_rate_cpm = Ld / Ts;
            const mda_dpm = Ld_rate_cpm / effDec;
            const mda_pCi = mda_dpm / 2.22;
            const mdc_dpm_100cm2 = (mda_dpm / area) * 100;
            
            setResult({ Lc: Math.round(Lc), Ld: Math.round(Ld), mda_dpm, mda_pCi, mdc: mdc_dpm_100cm2 });
            
            } catch (e) { setResult(null); }
            }, [bkgCounts, countTime, bkgTime, efficiency, effUnit, probeArea]);
            
            const handleSave = () => {
            if (result) {
            addHistory({ id: Date.now(), type: 'MDA Calc', icon: ICONS.microscope, inputs: `Bkg: ${bkgCounts}c/${bkgTime}m`, result: `MDA: ${result.mda_dpm.toFixed(1)} dpm`, view: VIEWS.LAB_STATS });
            addToast("Saved!");
            }
            };
            
            return (
            <div className="space-y-4">
            <ContextualNote type="info"><strong>Currie Equation:</strong> Calculates the <i>a priori</i> detection limit (Ld) ensuring 95% confidence of detection.</ContextualNote>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium">Bkg Counts</label><input type="number" value={bkgCounts} onChange={e => setBkgCounts(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                  <div><label className="block text-sm font-medium">Bkg Time (min)</label><input type="number" value={bkgTime} onChange={e => setBkgTime(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium">Sample Time (min)</label><input type="number" value={countTime} onChange={e => setCountTime(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
                  <div>
                      <label className="block text-sm font-medium">Efficiency</label>
                      <div className="flex">
                          <input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} className="w-full mt-1 p-2 rounded-l-md bg-slate-100 dark:bg-slate-700"/>
                          <select value={effUnit} onChange={e => setEffUnit(e.target.value)} className="mt-1 p-2 rounded-r-md bg-slate-200 dark:bg-slate-600 text-xs"><option>%</option><option>dec</option></select>
                      </div>
                  </div>
              </div>
              <div><label className="block text-sm font-medium">Probe Area (cm²) <span className="text-xs text-slate-400 font-normal">(For MDC)</span></label><input type="number" value={probeArea} onChange={e => setProbeArea(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
            </div>
            
            {result && (
              <div className="mt-4 p-5 bg-slate-100 dark:bg-slate-700 rounded-lg animate-fade-in shadow-sm">
                  <div className="flex justify-end -mt-3 -mr-3 mb-2"><button onClick={handleSave} className="text-slate-400 hover:text-sky-600"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></div>
            
                  <div className="text-center mb-4">
                      <p className="text-xs uppercase font-bold text-slate-500">Minimum Detectable Activity</p>
                      <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400">{result.mda_dpm.toFixed(1)}</span>
                          <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">dpm</span>
                      </div>
                      <p className="text-xs text-slate-500">({result.mda_pCi.toFixed(2)} pCi)</p>
                  </div>
            
                  <div className="grid grid-cols-2 gap-4 text-center border-t border-slate-200 dark:border-slate-600 pt-4">
                      <div>
                          <p className="text-xs text-slate-500">Critical Level (Lc)</p>
                          <p className="font-mono font-bold">{result.Lc} counts</p>
                      </div>
                      <div>
                          <p className="text-xs text-slate-500">Detection Limit (Ld)</p>
                          <p className="font-mono font-bold">{result.Ld} counts</p>
                      </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 text-center">
                      <p className="text-xs text-slate-500">Surface MDC</p>
                      <p className="font-bold text-slate-700 dark:text-slate-200">{result.mdc.toFixed(0)} dpm/100cm²</p>
                  </div>
              </div>
            )}
            </div>
            );
            };
            
            // 2. UPDATED: ChiSquaredCalculator (Visual Polish)
            const ChiSquaredCalculator = ({ chiSquaredData, setChiSquaredData, alpha, setAlpha, result, setResult, error, setError }) => {
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            // (Keep your existing CRITICAL_VALUES and UPPER_BOUNDS constants here...)
            const CHI_SQUARED_CRITICAL_VALUES = { '0.10': { lowerP: 0.05, upperP: 0.95, 1: 0.004, 2: 0.103, 3: 0.352, 4: 0.711, 5: 1.145, 6: 1.635, 7: 2.167, 8: 2.733, 9: 3.325, 10: 3.940, 11: 4.575, 12: 5.226, 13: 5.892, 14: 6.571, 15: 7.261, 16: 7.962, 17: 8.672, 18: 9.390, 19: 10.117, 20: 10.851, 21: 11.591, 22: 12.338, 23: 13.091, 24: 13.848, 25: 14.611, 26: 15.379, 27: 16.151, 28: 16.928, 29: 17.708, 30: 18.493, 40: 26.509 }, '0.05': { lowerP: 0.025, upperP: 0.975, 1: 0.001, 2: 0.051, 3: 0.216, 4: 0.484, 5: 0.831, 6: 1.237, 7: 1.690, 8: 2.180, 9: 2.700, 10: 3.247, 11: 3.816, 12: 4.404, 13: 5.009, 14: 5.629, 15: 6.262, 16: 6.908, 17: 7.564, 18: 8.231, 19: 8.907, 20: 9.591, 21: 10.283, 22: 10.982, 23: 11.689, 24: 12.401, 25: 13.120, 26: 13.844, 27: 14.573, 28: 15.308, 29: 16.047, 30: 16.791, 40: 24.433 }, '0.01': { lowerP: 0.005, upperP: 0.995, 1: 0.000, 2: 0.010, 3: 0.072, 4: 0.207, 5: 0.412, 6: 0.676, 7: 0.989, 8: 1.344, 9: 1.735, 10: 2.156, 11: 2.603, 12: 3.074, 13: 3.565, 14: 4.075, 15: 4.601, 16: 5.142, 17: 5.697, 18: 6.265, 19: 6.844, 20: 7.434, 21: 8.034, 22: 8.643, 23: 9.260, 24: 9.886, 25: 10.520, 26: 11.160, 27: 11.808, 28: 12.461, 29: 13.121, 30: 13.787, 40: 20.707 } };
            const UPPER_BOUNDS = { '0.10': { 1: 3.841, 2: 5.991, 3: 7.815, 4: 9.488, 5: 11.070, 6: 12.592, 7: 14.067, 8: 15.507, 9: 16.919, 10: 18.307, 11: 19.675, 12: 21.026, 13: 22.362, 14: 23.685, 15: 24.996, 16: 26.296, 17: 27.587, 18: 28.869, 19: 30.144, 20: 31.410, 21: 32.671, 22: 33.924, 23: 35.172, 24: 36.415, 25: 37.652, 26: 38.885, 27: 40.113, 28: 41.337, 29: 42.557, 30: 43.773, 40: 55.758 }, '0.05': { 1: 5.024, 2: 7.378, 3: 9.348, 4: 11.143, 5: 12.833, 6: 14.449, 7: 16.013, 8: 17.535, 9: 19.023, 10: 20.483, 11: 21.920, 12: 23.337, 13: 24.736, 14: 26.119, 15: 27.488, 16: 28.845, 17: 30.191, 18: 31.526, 19: 32.852, 20: 34.170, 21: 35.479, 22: 36.781, 23: 38.076, 24: 39.364, 25: 40.646, 26: 41.923, 27: 43.195, 28: 44.461, 29: 45.722, 30: 46.979, 40: 59.342 }, '0.01': { 1: 7.879, 2: 10.597, 3: 12.838, 4: 14.860, 5: 16.750, 6: 18.548, 7: 20.278, 8: 21.955, 9: 23.589, 10: 25.188, 11: 26.757, 12: 28.300, 13: 29.819, 14: 31.319, 15: 32.801, 16: 34.267, 17: 35.718, 18: 37.156, 19: 38.582, 20: 39.997, 21: 41.401, 22: 42.796, 23: 44.181, 24: 45.559, 25: 46.928, 26: 48.290, 27: 49.645, 28: 50.993, 29: 52.336, 30: 53.672, 40: 66.766 } };
            
            React.useEffect(() => {
            try {
            setError('');
            const dataPoints = chiSquaredData.split(/[\s,]+/).filter(v => v.trim() !== '').map(Number);
            if (dataPoints.some(isNaN)) { if (chiSquaredData.trim().length > 0) setError("Data contains non-numeric values."); setResult(null); return; }
            
            const n = dataPoints.length;
            if (n < 2) { setResult(null); return; }
            
            const mean = dataPoints.reduce((sum, val) => sum + val, 0) / n;
            const chiSquared = dataPoints.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / mean;
            const df = n - 1;
            
            let lowerCrit, upperCrit;
            const tableRow = CHI_SQUARED_CRITICAL_VALUES?.[alpha];
            if (tableRow && tableRow[df] !== undefined) {
              if (Array.isArray(tableRow[df])) [lowerCrit, upperCrit] = tableRow[df];
              else { lowerCrit = tableRow[df]; upperCrit = UPPER_BOUNDS[alpha][df] || Infinity; } // Handle your logic
            } else {
              // Wilson-Hilferty approx
              const zScoreMap = { '0.10': 1.645, '0.05': 1.960, '0.01': 2.576 };
              const z = zScoreMap[alpha];
              const term1 = 2 / (9 * df);
              lowerCrit = df * Math.pow(1 - term1 - z * Math.sqrt(term1), 3);
              upperCrit = df * Math.pow(1 - term1 + z * Math.sqrt(term1), 3);
            }
            
            const pass = chiSquared >= lowerCrit && chiSquared <= upperCrit;
            setResult({ n, df, mean: mean.toFixed(2), chiSquared: chiSquared.toFixed(4), lowerBound: lowerCrit.toFixed(3), upperBound: upperCrit.toFixed(3), conclusion: pass ? 'PASS' : 'FAIL' });
            } catch (e) { setError("Calculation Error"); setResult(null); }
            }, [chiSquaredData, alpha]);
            
            const handleSave = () => {
            if (result) {
            addHistory({ id: Date.now(), type: 'χ² Test', icon: ICONS.labStats, inputs: `N=${result.n}, α=${alpha}`, result: `χ²=${result.chiSquared} (${result.conclusion})`, view: VIEWS.LAB_STATS });
            addToast("Saved!");
            }
            };
            
            return (
            <div className="space-y-4">
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
              <div><label className="block text-sm font-medium">Count Data</label><textarea value={chiSquaredData} onChange={e => setChiSquaredData(e.target.value)} rows="5" className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-sm" placeholder="Paste counts..."></textarea></div>
              <div><label className="block text-sm font-medium">Significance Level (α)</label><select value={alpha} onChange={e => setAlpha(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"><option value="0.10">0.10 (90%)</option><option value="0.05">0.05 (95%)</option><option value="0.01">0.01 (99%)</option></select></div>
            </div>
            
            {result && (
              <div className={`p-5 rounded-lg mt-4 text-center animate-fade-in shadow-sm ${result.conclusion === 'PASS' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                  <div className="flex justify-end -mt-3 -mr-3 mb-1"><button onClick={handleSave} className="text-slate-500 hover:text-black dark:hover:text-white"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></div>
                  <p className={`text-3xl font-extrabold ${result.conclusion === 'PASS' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>SYSTEM {result.conclusion}ES</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm border-t border-black/10 pt-4">
                      <div><p className="text-xs text-slate-500">Lower Limit</p><p className="font-mono font-bold">{result.lowerBound}</p></div>
                      <div><p className="text-xs text-slate-500">Calculated χ²</p><p className="font-mono font-bold text-lg">{result.chiSquared}</p></div>
                      <div><p className="text-xs text-slate-500">Upper Limit</p><p className="font-mono font-bold">{result.upperBound}</p></div>
                  </div>
              </div>
            )}
            </div>
            );
            };
            
            // 3. UPDATED: DeadTimeCorrector (Visual Polish)
            const DeadTimeCorrector = ({ observedCpm, setObservedCpm, deadTime, setDeadTime, result, setResult, error, setError }) => {
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            
            React.useEffect(() => {
            try {
            setError('');
            const R = safeParseFloat(observedCpm); const tau = safeParseFloat(deadTime);
            if (isNaN(R) || isNaN(tau) || R < 0 || tau < 0) { setResult(null); return; }
            
            const R_cps = R / 60.0;
            const tau_s = tau / 1e6;
            const denom = 1 - (R_cps * tau_s);
            if (denom <= 0) throw new Error("Detector Saturated!");
            
            const N_cpm = (R_cps / denom) * 60;
            setResult({ trueCpm: N_cpm, loss: (1 - R/N_cpm)*100 });
            } catch(e) { setError(e.message); setResult(null); }
            }, [observedCpm, deadTime]);
            
            const handleSave = () => {
            if (result) {
            addHistory({ id: Date.now(), type: 'Dead Time', icon: ICONS.stopwatch, inputs: `Obs: ${observedCpm}, τ: ${deadTime}µs`, result: `True: ${Math.round(result.trueCpm)} cpm`, view: VIEWS.LAB_STATS });
            addToast("Saved!");
            }
            };
            
            return (
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div><label className="block text-sm font-medium">Observed CPM</label><input type="number" value={observedCpm} onChange={e => setObservedCpm(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
              <div><label className="block text-sm font-medium">Dead Time (µs)</label><input type="number" value={deadTime} onChange={e => setDeadTime(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
            </div>
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            {result && (
              <div className="mt-4 p-5 bg-slate-100 dark:bg-slate-700 rounded-lg text-center shadow-sm">
                  <div className="flex justify-end -mt-3 -mr-3 mb-2"><button onClick={handleSave} className="text-slate-400 hover:text-sky-600"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></div>
                  <p className="text-xs uppercase font-bold text-slate-500">True Count Rate</p>
                  <p className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 my-1">{Math.round(result.trueCpm).toLocaleString()}</p>
                  <p className="text-sm text-slate-500 font-medium">cpm</p>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <p className={`font-bold ${result.loss > 10 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>{result.loss.toFixed(2)}% Loss</p>
                  </div>
              </div>
            )}
            </div>
            );
            };
            
            // 4. RpdCalculator
            const RpdCalculator = ({ sample1, setSample1, sample2, setSample2, result, setResult }) => {
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            
            React.useEffect(() => {
            const s1 = safeParseFloat(sample1); const s2 = safeParseFloat(sample2);
            if (!isNaN(s1) && !isNaN(s2) && (s1+s2 > 0)) {
            const rpd = Math.abs(s1 - s2) / ((s1 + s2)/2) * 100;
            setResult({ rpd: rpd.toFixed(2), pass: rpd <= 20 });
            } else { setResult(null); }
            }, [sample1, sample2]);
            
            const handleSave = () => {
            if (result) {
            addHistory({ id: Date.now(), type: 'RPD', icon: ICONS.compare, inputs: `${sample1} vs ${sample2}`, result: `${result.rpd}%`, view: VIEWS.LAB_STATS });
            addToast("Saved!");
            }
            };
            
            return (
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div><label className="block text-sm font-medium">Sample 1</label><input type="number" value={sample1} onChange={e => setSample1(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
              <div><label className="block text-sm font-medium">Sample 2</label><input type="number" value={sample2} onChange={e => setSample2(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"/></div>
            </div>
            {result && (
              <div className="mt-4 p-5 bg-slate-100 dark:bg-slate-700 rounded-lg text-center shadow-sm">
                  <div className="flex justify-end -mt-3 -mr-3 mb-2"><button onClick={handleSave} className="text-slate-400 hover:text-sky-600"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></div>
                  <p className="text-xs uppercase font-bold text-slate-500">Relative Percent Difference</p>
                  <p className={`text-4xl font-extrabold my-2 ${result.pass ? 'text-sky-600 dark:text-sky-400' : 'text-amber-500'}`}>{result.rpd}%</p>
                  {result.pass ? <p className="text-green-600 font-bold text-sm">Acceptable (≤ 20%)</p> : <p className="text-amber-600 font-bold text-sm">Investigate (&gt; 20%)</p>}
              </div>
            )}
            </div>
            );
            };
            
            // 5. FwhmCalculator
            const FwhmCalculator = ({ centroid, setCentroid, lower, setLower, upper, setUpper, result, setResult }) => {
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            
            React.useEffect(() => {
            const c = safeParseFloat(centroid); const l = safeParseFloat(lower); const u = safeParseFloat(upper);
            if (!isNaN(c) && !isNaN(l) && !isNaN(u) && c > 0) {
            const fwhm = u - l;
            setResult({ fwhm: fwhm.toFixed(2), res: (fwhm/c)*100 });
            } else { setResult(null); }
            }, [centroid, lower, upper]);
            
            const handleSave = () => {
            if (result) {
            addHistory({ id: Date.now(), type: 'Resolution', icon: ICONS.gammaSpec, inputs: `Peak: ${centroid}`, result: `${result.res.toFixed(2)}%`, view: VIEWS.LAB_STATS });
            addToast("Saved!");
            }
            };
            
            return (
            <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div><label className="block text-xs font-bold mb-1">Centroid</label><input type="number" value={centroid} onChange={e => setCentroid(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
              <div><label className="block text-xs font-bold mb-1">Lower ½</label><input type="number" value={lower} onChange={e => setLower(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
              <div><label className="block text-xs font-bold mb-1">Upper ½</label><input type="number" value={upper} onChange={e => setUpper(e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 text-sm"/></div>
            </div>
            {result && (
              <div className="mt-4 p-5 bg-slate-100 dark:bg-slate-700 rounded-lg text-center shadow-sm">
                  <div className="flex justify-end -mt-3 -mr-3 mb-2"><button onClick={handleSave} className="text-slate-400 hover:text-sky-600"><Icon path={ICONS.notepad} className="w-5 h-5"/></button></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs uppercase font-bold text-slate-500">FWHM</p><p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{result.fwhm}</p></div>
                      <div><p className="text-xs uppercase font-bold text-slate-500">Resolution</p><p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{result.res.toFixed(2)}%</p></div>
                  </div>
              </div>
            )}
            </div>
            );
            };
            
            // 6. MAIN CONTAINER: LabStatistics
            const LabStatistics = () => {
            const [activeTab, setActiveTab] = React.useState('mda');
            
            // MDA State
            const [mda_bkgCounts, setMda_bkgCounts] = React.useState('50');
            const [mda_countTime, setMda_countTime] = React.useState('1');
            const [mda_bkgTime, setMda_bkgTime] = React.useState('1');
            const [mda_eff, setMda_eff] = React.useState('10');
            const [mda_effUnit, setMda_effUnit] = React.useState('%');
            const [mda_area, setMda_area] = React.useState('100');
            const [mda_result, setMda_result] = React.useState(null);
            
            // ChiSq State
            const [chi_data, setChi_data] = React.useState('');
            const [chi_alpha, setChi_alpha] = React.useState('0.05');
            const [chi_result, setChi_result] = React.useState(null);
            const [chi_error, setChi_error] = React.useState('');
            
            // DeadTime State
            const [dt_obs, setDt_obs] = React.useState('50000');
            const [dt_tau, setDt_tau] = React.useState('100');
            const [dt_result, setDt_result] = React.useState(null);
            const [dt_error, setDt_error] = React.useState('');
            
            // RPD State
            const [rpd_s1, setRpd_s1] = React.useState('1250');
            const [rpd_s2, setRpd_s2] = React.useState('1180');
            const [rpd_result, setRpd_result] = React.useState(null);
            
            // FWHM State
            const [fw_cent, setFw_cent] = React.useState('661.7');
            const [fw_low, setFw_low] = React.useState('658.2');
            const [fw_up, setFw_up] = React.useState('665.2');
            const [fw_result, setFw_result] = React.useState(null);
            
            const handleClear = () => {
            if(activeTab === 'mda') { setMda_bkgCounts('50'); setMda_result(null); }
            if(activeTab === 'chi') { setChi_data(''); setChi_result(null); }
            if(activeTab === 'dt') { setDt_obs('50000'); setDt_result(null); }
            if(activeTab === 'rpd') { setRpd_s1(''); setRpd_result(null); }
            if(activeTab === 'fwhm') { setFw_cent(''); setFw_result(null); }
            };
            
            return (
            <div className="p-4 animate-fade-in">
            <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Lab Statistics</h2>
                  <ClearButton onClick={handleClear} />
              </div>
            
               <div className="grid grid-cols-3 md:grid-cols-5 gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-6">
                   {['mda', 'chi', 'dt', 'rpd', 'fwhm'].map(id => {
                       const labels = { mda: 'MDA/MDC', chi: 'Chi-Sq', dt: 'Dead Time', rpd: 'RPD', fwhm: 'Resolution' };
                       return (
                           <button key={id} onClick={() => setActiveTab(id)}
                               className={`p-2 rounded-md text-xs sm:text-sm font-bold text-center transition-all duration-200
                               ${activeTab === id
                                   ? 'bg-white dark:bg-slate-800 text-sky-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                   : 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-600'
                               }`}>
                               {labels[id]}
                           </button>
                       )
                   })}
               </div>
            
              <div className="mt-2">
                  {activeTab === 'mda' && <MdaCalculator
                      bkgCounts={mda_bkgCounts} setBkgCounts={setMda_bkgCounts} countTime={mda_countTime} setCountTime={setMda_countTime}
                      bkgTime={mda_bkgTime} setBkgTime={setMda_bkgTime} efficiency={mda_eff} setEfficiency={setMda_eff}
                      effUnit={mda_effUnit} setEffUnit={setMda_effUnit} probeArea={mda_area} setProbeArea={setMda_area}
                      result={mda_result} setResult={setMda_result}
                  />}
                  {activeTab === 'chi' && <ChiSquaredCalculator
                      chiSquaredData={chi_data} setChiSquaredData={setChi_data} alpha={chi_alpha} setAlpha={setChi_alpha}
                      result={chi_result} setResult={setChi_result} error={chi_error} setError={setChi_error}
                  />}
                  {activeTab === 'dt' && <DeadTimeCorrector
                      observedCpm={dt_obs} setObservedCpm={setDt_obs} deadTime={dt_tau} setDeadTime={setDt_tau}
                      result={dt_result} setResult={setDt_result} error={dt_error} setError={setDt_error}
                  />}
                  {activeTab === 'rpd' && <RpdCalculator
                      sample1={rpd_s1} setSample1={setRpd_s1} sample2={rpd_s2} setSample2={setRpd_s2}
                      result={rpd_result} setResult={setRpd_result}
                  />}
                  {activeTab === 'fwhm' && <FwhmCalculator
                      centroid={fw_cent} setCentroid={setFw_cent} lower={fw_low} setLower={setFw_low} upper={fw_up} setUpper={setFw_up}
                      result={fw_result} setResult={setFw_result}
                  />}
              </div>
            </div>
            </div>
            );
            };

            /**
             * @description Displays a full decay series chain.
             * @param {{seriesId: string, onBack: () => void, onNuclideClick: (nuclide: object) => void}} props - The series ID and navigation handlers.
             */
            
            const DecaySeriesViewer = ({ seriesId, onBack, onNuclideClick }) => {
                const series = decaySeriesData.find(s => s.id === seriesId);
                if (!series) return <p>Decay series not found.</p>;
            
                // --- INTERNAL COMPONENTS FOR THE DIAGRAM ---
            
                // A single nuclide in the chain
                   const NuclideNode = ({ step }) => (
                       <div className="p-3 my-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-center shadow flex-shrink-0 border border-slate-200 dark:border-slate-600">
                           <span
                               className="font-bold text-lg text-sky-600 dark:text-sky-400 cursor-pointer hover:underline"
                               onClick={() => {
                                   // Check BOTH name and symbol to ensure a match
                                   const target = normalizeString(step.nuclide);
                                   const found = radionuclides.find(n => 
                                       normalizeString(n.name) === target || 
                                       normalizeString(n.symbol) === target
                                   );
                                   if (found) onNuclideClick(found);
                               }}
                           >
                               {step.nuclide}
                           </span>
                           <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{step.halfLife}</div>
                       </div>
                   );
            
                // An arrow representing a decay step
            
            const DecayArrow = ({ decayType }) => (
                    <div className="flex-shrink-0 flex items-center justify-center relative mx-2 min-w-[10rem] w-auto px-2 text-center">
            
            {/* The horizontal line of the arrow */}
            
            <div className="absolute left-0 w-full h-0.5 bg-slate-300 dark:bg-slate-600"></div>
            
            {/* Arrowhead */}
            
            <div className="absolute right-0 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-slate-400 dark:border-l-slate-500"></div>
            
            {/* Text label floating above the line */}
            
                        <div className="relative bg-white dark:bg-slate-800 px-2">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{decayType}</span>
                        </div>
                    </div>
                );
            
                // Recursive component that renders a chain or a sub-chain horizontally
            
                const RenderChain = ({ chain }) => (
                    <div className="flex items-center">
                        {chain.map((step, index) => (
                            <div key={step.nuclide + index} className="flex items-center">
                                <NuclideNode step={step} />
            
                                {/* If the step has branches, render them vertically stacked */}
            
                                {step.branches && (
                                    <>
                                        <DecayArrow decayType="" />
                                        <div className="flex flex-col">
                                            {step.branches.map((branch, branchIndex) => (
                                                <div key={branchIndex} className="flex items-center p-2">
                                                    <DecayArrow decayType={step.decayType.split('/')[branchIndex]?.trim() || ''} />
                                                    <RenderChain chain={branch} />
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
            
                                {/* If it's a linear step, render the arrow to the next step */}
            
                                {!step.branches && index < chain.length - 1 && chain[index+1].nuclide !== step.nuclide && (
                                    <DecayArrow decayType={step.decayType} />
                                )}
                            </div>
                        ))}
                    </div>
                );
            
                // --- MAIN COMPONENT RENDER ---
            
                return (
                    <div className="p-4 animate-fade-in">
                        <button onClick={onBack} className="mb-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition">&larr; Back to Result</button>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{series.name}</h2>
                            {/* Container that allows horizontal scrolling for long chains */}
                            <div className="overflow-x-auto pb-4">
                               <div className="inline-block min-w-full p-2">
                                    <RenderChain chain={series.chain} />
                               </div>
                            </div>
                        </div>
                    </div>
                );
            };
