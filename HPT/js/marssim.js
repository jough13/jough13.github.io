// ==============================================================================
// MARSSIM STATISTICAL TESTS MODULE
// Includes: Sign Test, WRS Test, and Multi-Hot-Spot EMC Evaluation
// ==============================================================================

// --- HELPER: Unity Rule Warning Banner ---
const UnityRuleInfo = () => (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded text-sm text-blue-800 dark:text-blue-200 animate-fade-in">
        <p className="font-bold flex items-center gap-2">
            <Icon path={ICONS.info} className="w-4 h-4" />
            Input Requirement: Sum of Fractions (SOF)
        </p>
        <p className="mt-1 text-xs opacity-90">
            When applying the Unity Rule, <strong>DO NOT</strong> enter raw activity (pCi/g). 
            You must pre-calculate the dimensionless Sum of Fractions for each sample 
            (e.g., <span className="font-mono">Conc A/Limit A + Conc B/Limit B...</span>) and enter that single number here.
            The test compares your SOF values against 1.0.
        </p>
    </div>
);

// 1. SIGN TEST CALCULATOR
const SignTest_Calculator = ({ dcgl, setDcgl, dataInput, setDataInput, alpha, setAlpha, subtractBkg, setSubtractBkg, background, setBackground, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // Unity Rule State
    const [useUnityRule, setUseUnityRule] = React.useState(false);

    React.useEffect(() => {
        if (useUnityRule) setDcgl('1.0');
    }, [useUnityRule, setDcgl]);

    // Critical Values Lookup (MARSSIM Table I.3)
    const signTestCriticalValues = {
        '0.05': { 5: 5, 6: 6, 7: 7, 8: 7, 9: 8, 10: 8, 11: 9, 12: 10, 13: 11, 14: 11, 15: 12, 16: 12, 17: 13, 18: 14, 19: 14, 20: 15, 21: 16, 22: 16, 23: 17, 24: 17, 25: 18, 26: 19, 27: 19, 28: 20, 29: 21, 30: 21 },
        '0.025': { 5: 5, 6: 6, 7: 7, 8: 8, 9: 8, 10: 9, 11: 10, 12: 10, 13: 11, 14: 12, 15: 12, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15, 21: 16, 22: 17, 23: 17, 24: 18, 25: 19, 26: 19, 27: 20, 28: 20, 29: 21, 30: 22 },
        '0.01': { 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 9, 11: 10, 12: 11, 13: 11, 14: 12, 15: 13, 16: 13, 17: 14, 18: 15, 19: 15, 20: 16, 21: 17, 22: 17, 23: 18, 24: 18, 25: 19, 26: 20, 27: 20, 28: 21, 29: 22, 30: 22 },
        '0.10': { 5: 4, 6: 5, 7: 6, 8: 6, 9: 7, 10: 8, 11: 8, 12: 9, 13: 10, 14: 10, 15: 11, 16: 11, 17: 12, 18: 13, 19: 13, 20: 14, 21: 15, 22: 15, 23: 16, 24: 16, 25: 17, 26: 18, 27: 18, 28: 19, 29: 20, 30: 20 }
    };
    const zScores = { '0.05': 1.645, '0.025': 1.960, '0.01': 2.326, '0.10': 1.282 };
    
    const parseData = (dataString) => dataString.split(/[\s,;\n]+/).filter(d => d.trim() !== '' && !isNaN(d)).map(Number);
    
    const getStats = (data) => {
        if (!data.length) return null;
        const max = Math.max(...data);
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        return { max, mean };
    };
    
    const handleCalculate = () => {
        setResult(null); setError('');
        const rawChunks = dataInput.split(/[\s,;\n]+/).filter(d => d.trim() !== '');
        let measurements = rawChunks.map(Number).filter(n => !isNaN(n));
        const droppedCount = rawChunks.length - measurements.length;
        const dcgl_val = safeParseFloat(dcgl);
        const bkg_val = safeParseFloat(background);
        
        if (isNaN(dcgl_val) || dcgl_val <= 0) { setError('DCGL must be a valid positive number.'); return; }
        if (measurements.length === 0) { setError('Please enter measurement data.'); return; }
        
        if (subtractBkg && !useUnityRule) {
            if (isNaN(bkg_val)) { setError('Please enter a valid background value.'); return; }
            measurements = measurements.map(m => m - bkg_val);
        }
        
        const epsilon = 1e-9;
        const validData = measurements.filter(val => Math.abs(dcgl_val - val) > epsilon);
        const n_adjusted = validData.length;
        const ties = measurements.length - n_adjusted;
        
        if (n_adjusted === 0) { setError('All data points are equal to the DCGL; the test cannot be performed.'); return; }
        
        const S_plus = validData.filter(val => (dcgl_val - val) > 0).length;
        let Cs; let note = '';
        const tableValue = signTestCriticalValues[alpha]?.[n_adjusted];
        
        if (tableValue !== undefined) {
            Cs = tableValue; note = `Used MARSSIM Table I.3 for N=${n_adjusted}.`;
        } else {
            const zAlpha = zScores[alpha];
            Cs = Math.ceil((n_adjusted / 2) + (zAlpha * Math.sqrt(n_adjusted) / 2));
            note = `Used Large Sample Approximation for N=${n_adjusted}.`;
        }
        
        const testPassed = S_plus >= Cs;
        
        setResult({
            conclusion: testPassed ? 'PASS' : 'FAIL',
            reason: `S+ (${S_plus}) is ${testPassed ? '≥' : '<'} Critical Value (${Cs}).`,
            n: measurements.length,
            n_adjusted, ties, S_plus, Cs, note,
            stats: getStats(measurements),
            dcgl: dcgl_val,
            warning: droppedCount > 0 ? `Warning: ${droppedCount} non-numeric values were ignored.` : null, 
        });
    };
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'Sign Test', icon: ICONS.labStats, inputs: `N=${result.n}, DCGL=${dcgl} ${useUnityRule ? '(Unity Rule)' : ''}`, result: `UNIT ${result.conclusion}ES`, view: VIEWS.MARSSIM_TESTS });
            addToast("Saved to history!");
        }
    };
    
    React.useEffect(() => { handleCalculate(); }, [dcgl, dataInput, alpha, subtractBkg, background, useUnityRule]);
    
    return (
        <div className="space-y-4">
            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg text-sm text-sky-800 dark:text-sky-200">
                <strong>Applicability:</strong> Use when contaminant is <em>not</em> present in background (Class 1/2/3).
            </div>
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <label className="flex items-center gap-2 font-bold text-sm text-sky-600 dark:text-sky-400 cursor-pointer">
                    <input type="checkbox" checked={useUnityRule} onChange={e => setUseUnityRule(e.target.checked)} className="form-checkbox h-4 w-4 rounded text-sky-600" />
                    Apply Unity Rule (Sum of Fractions)
                </label>
                {useUnityRule && <UnityRuleInfo />}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">{useUnityRule ? "DCGL (Unity Limit)" : "DCGL (Activity Limit)"}</label>
                        <input type="number" value={dcgl} onChange={e => setDcgl(e.target.value)} disabled={useUnityRule} className={`w-full mt-1 p-2 rounded-md border ${useUnityRule ? 'bg-slate-200 text-slate-500' : 'bg-slate-100'} dark:bg-slate-700 dark:border-slate-600`}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Alpha (&alpha;)</label>
                        <select value={alpha} onChange={e => setAlpha(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700 dark:border-slate-600">
                            <option value="0.05">0.05</option><option value="0.025">0.025</option><option value="0.01">0.01</option><option value="0.10">0.10</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className={`flex items-center gap-2 text-sm font-medium cursor-pointer ${useUnityRule ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input type="checkbox" checked={subtractBkg} onChange={e => setSubtractBkg(e.target.checked)} disabled={useUnityRule} className="form-checkbox h-4 w-4 text-sky-600 rounded" />
                            Subtract Instrument Background?
                        </label>
                        {subtractBkg && !useUnityRule && <input type="number" value={background} onChange={e => setBackground(e.target.value)} placeholder="Bkg" className="w-24 p-1 text-sm rounded bg-slate-100 dark:bg-slate-700 border" />}
                    </div>
                    <label className="block text-sm font-medium mt-2">Survey Measurements <span className="text-xs text-slate-500">{useUnityRule ? '(Unitless SOF)' : '(pCi/g)'}</span></label>
                    <textarea value={dataInput} onChange={e => setDataInput(e.target.value)} rows="6" className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-sm" placeholder="Paste values..."></textarea>
                    <p className="text-right text-xs font-semibold text-slate-500 mt-1 pr-1">N: {parseData(dataInput).length}</p>
                </div>
            </div>
            
            <button onClick={handleSaveToHistory} className="w-full py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">Save to Calculations</button>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            {result && (
                <div className={`p-4 rounded-lg mt-4 text-center animate-fade-in ${result.conclusion === 'PASS' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    <p className={`text-3xl font-extrabold ${result.conclusion === 'PASS' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>UNIT {result.conclusion}ES</p>
                    <p className={`mt-2 text-sm ${result.conclusion === 'PASS' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{result.reason}</p>
                    <div className="mt-4 px-4">
                        <div className="flex justify-between text-xs font-bold mb-1 opacity-70"><span>0</span><span>Limit</span></div>
                        <div className="h-4 w-full bg-white/50 rounded-full overflow-hidden relative border border-black/10">
                            <div className={`h-full ${result.conclusion === 'FAIL' || result.stats.mean > result.dcgl ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((result.stats.mean / result.dcgl) * 100, 100)}%` }}></div>
                            <div className="absolute top-0 bottom-0 w-0.5 bg-black" style={{ left: `${Math.min((result.stats.max / result.dcgl) * 100, 100)}%` }} title="Max Value"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600 grid grid-cols-2 gap-2 text-sm">
                        <p>N: <span className="font-bold">{result.n}</span></p><p>S+: <span className="font-bold">{result.S_plus}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. WRS CALCULATOR
const WRS_Calculator = ({ dcgl, setDcgl, referenceData, setReferenceData, surveyData, setSurveyData, alpha, setAlpha, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // Unity Rule State
    const [useUnityRule, setUseUnityRule] = React.useState(false);

    React.useEffect(() => {
        if (useUnityRule) setDcgl('1.0');
    }, [useUnityRule, setDcgl]);

    const zScores = { '0.05': 1.645, '0.025': 1.960, '0.01': 2.326, '0.10': 1.282 };
    
    const getStats = (data) => {
        if (!data || data.length === 0) return null;
        const sum = data.reduce((a, b) => a + b, 0);
        const mean = sum / data.length;
        const max = Math.max(...data);
        const min = Math.min(...data);
        const sqDiff = data.map(v => Math.pow(v - mean, 2));
        const avgSqDiff = sqDiff.reduce((a, b) => a + b, 0) / (data.length - 1); 
        const sd = Math.sqrt(avgSqDiff);
        return { mean, max, min, sd };
    };
    
    const handleCalculate = () => {
        setResult(null); setError('');
        
        // Parse Data
        const parse = (s) => s.split(/[\s,;\n]+/).filter(d => d.trim() !== '' && !isNaN(d)).map(Number);
        const refData = parse(referenceData);
        const suData = parse(surveyData);
        const dcgl_val = safeParseFloat(dcgl);
        
        if (isNaN(dcgl_val)) { setError('DCGL must be a valid number.'); return; }
        if (refData.length < 5 || suData.length < 5) { setError('Need at least 5 data points per area.'); return; }
        
        let combined = [...refData.map(v => ({ value: v + dcgl_val, group: 'ref' })), ...suData.map(v => ({ value: v, group: 'su' }))].sort((a, b) => a.value - b.value);
        
        // Handle Ties
        for (let i = 0; i < combined.length; i++) {
            let ties = [i]; const epsilon = 1e-9;
            while (i + 1 < combined.length && Math.abs(combined[i].value - combined[i + 1].value) < epsilon) { i++; ties.push(i); }
            if (ties.length > 1) { const avgRank = (ties[0] + 1 + ties[ties.length - 1] + 1) / 2; ties.forEach(index => { combined[index].rank = avgRank; }); } else { combined[i].rank = i + 1; }
        }
        
        const W_rs = combined.filter(d => d.group === 'ref').reduce((sum, d) => sum + d.rank, 0);
        const n = refData.length; const m = suData.length; const N = n + m;
        const mean_W = (n * (N + 1)) / 2; 
        
        // Variance with tie correction
        const tieGroups = {};
        combined.forEach(item => { tieGroups[item.value] = (tieGroups[item.value] || 0) + 1; });
        const tieCorrection = Object.values(tieGroups).filter(t => t > 1).reduce((sum, t) => sum + (Math.pow(t, 3) - t), 0);
        const variance_W = ((n * m * (N + 1)) / 12) - ((n * m * tieCorrection) / (12 * N * (N - 1)));
        
        const C_w = Math.round(mean_W + (zScores[alpha] * Math.sqrt(variance_W)) + 0.5); 
        const wrsTestPassed = W_rs >= C_w;
        
        const refStats = getStats(refData);
        const suStats = getStats(suData);
        const hotMeasurements = suData.filter(v => v > (refStats.max + dcgl_val)); 
        
        let warningMsg = null;
        if (refStats.sd > suStats.sd * 1.5) warningMsg = "Note: Ref area variability is significantly higher than Survey Unit.";
        
        setResult({
            conclusion: wrsTestPassed ? 'PASS' : 'FAIL',
            reason: wrsTestPassed ? `Rank Sum (${W_rs}) ≥ Critical Value (${C_w}).` : `Rank Sum (${W_rs}) < Critical Value (${C_w}).`,
            n, m, W_rs, C_w, rankedData: combined, hotCount: hotMeasurements.length, refStats, suStats, warning: warningMsg
        });
    };
    
    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'WRS Test', icon: ICONS.labStats, inputs: `Ref(n)=${result.n}, SU(m)=${result.m}, DCGL=${dcgl} ${useUnityRule ? '(Unity Rule)' : ''}`, result: result.conclusion, view: VIEWS.MARSSIM_TESTS });
            addToast("Saved to history!");
        }
    };
    
    React.useEffect(() => { handleCalculate(); }, [dcgl, referenceData, surveyData, alpha, useUnityRule]);
    
    return (
        <div className="space-y-4">
            <div className="p-4 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg text-sm text-sky-800 dark:text-sky-200">
                <strong>Applicability:</strong> Use WRS when the contaminant <em>is</em> present in background (Class 1, 2, or 3).
            </div>
            
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <label className="flex items-center gap-2 font-bold text-sm text-sky-600 dark:text-sky-400 cursor-pointer mb-2">
                    <input type="checkbox" checked={useUnityRule} onChange={e => setUseUnityRule(e.target.checked)} className="form-checkbox h-4 w-4 rounded text-sky-600" />
                    Apply Unity Rule (Sum of Fractions)
                </label>
                {useUnityRule && <UnityRuleInfo />}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium">{useUnityRule ? "DCGL (Unity Limit)" : "DCGLw (Limit)"}</label>
                        <input type="number" value={dcgl} onChange={e => setDcgl(e.target.value)} disabled={useUnityRule} className={`w-full mt-1 p-2 rounded-md border ${useUnityRule ? 'bg-slate-200 text-slate-500' : 'bg-slate-100'} dark:bg-slate-700`}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Alpha (&alpha;)</label>
                        <select value={alpha} onChange={e => setAlpha(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700"><option value="0.05">0.05</option><option value="0.025">0.025</option><option value="0.01">0.01</option><option value="0.10">0.10</option></select>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <div className="flex justify-between items-center"><label className="block text-sm font-medium">Reference Area (n)</label><button onClick={() => setReferenceData('')} className="text-xs text-sky-600 dark:text-sky-400 hover:underline">Clear</button></div>
                        <textarea value={referenceData} onChange={e => setReferenceData(e.target.value)} rows="8" className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-sm border border-slate-300 dark:border-slate-600" placeholder="1.2, 1.5..."></textarea>
                    </div>
                    <div>
                        <div className="flex justify-between items-center"><label className="block text-sm font-medium">Survey Unit (m) {useUnityRule ? '(SOF)' : '(pCi/g)'}</label><button onClick={() => setSurveyData('')} className="text-xs text-sky-600 dark:text-sky-400 hover:underline">Clear</button></div>
                        <textarea value={surveyData} onChange={e => setSurveyData(e.target.value)} rows="8" className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-sm border border-slate-300 dark:border-slate-600" placeholder="2.2, 2.5..."></textarea>
                    </div>
                </div>
            </div>
            
            <button onClick={handleSaveToHistory} className="w-full py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">Save to Calculations</button>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            {result && (
                <div className={`p-4 rounded-lg mt-4 text-center animate-fade-in ${result.conclusion === 'PASS' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    <p className={`text-3xl font-extrabold ${result.conclusion === 'PASS' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>UNIT {result.conclusion}ES</p>
                    <p className={`mt-2 text-sm ${result.conclusion === 'PASS' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{result.reason}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm border-t border-slate-300 dark:border-slate-600 pt-2">
                        <p>Rank Sum: <span className="font-bold">{result.W_rs}</span></p><p>Critical: <span className="font-bold">{result.C_w}</span></p>
                        <p>Hot Spots ({'>'}Max Ref): <span className="font-bold">{result.hotCount}</span></p>
                    </div>
                </div>
            )}
        </div>
    );
};

// 3. UPDATED: EMC Evaluation (Multi-Spot Support)
const EMC_Evaluation_Calculator = ({ dcglw, setDcglw, areaFactor, setAreaFactor, avgConc, setAvgConc, maxConc, setMaxConc, result, setResult, error, setError }) => {
    const { addHistory } = useCalculationHistory();
    const { addToast } = useToast();
    
    // Local state for list of hot spots. 
    // We allow the user to input the FIRST one via props/state, then add more to this list.
    const [hotSpots, setHotSpots] = React.useState([{ id: 1, conc: maxConc, af: areaFactor }]);

    // Sync first row with parent props if they change externally (optional, but good for persistence)
    React.useEffect(() => {
        setHotSpots(prev => {
            const newSpots = [...prev];
            if (newSpots[0]) { newSpots[0].conc = maxConc; newSpots[0].af = areaFactor; }
            return newSpots;
        });
    }, [maxConc, areaFactor]);

    const updateSpot = (id, field, val) => {
        setHotSpots(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
        // Also update parent state if it's the first one
        if (id === 1) {
            if (field === 'conc') setMaxConc(val);
            if (field === 'af') setAreaFactor(val);
        }
    };

    const addSpot = () => {
        setHotSpots(prev => [...prev, { id: Date.now(), conc: '', af: '' }]);
    };

    const removeSpot = (id) => {
        if (hotSpots.length === 1) return; // Keep at least one
        setHotSpots(prev => prev.filter(s => s.id !== id));
    };

    const handleCalculate = () => {
        setResult(null); setError('');
        const dcgl = safeParseFloat(dcglw);
        const avg = safeParseFloat(avgConc);
        
        if (isNaN(dcgl) || dcgl <= 0) { setError('Invalid DCGLw'); return; }
        if (isNaN(avg) || avg < 0) { setError('Invalid Average Concentration'); return; }

        let totalUnity = avg / dcgl; // Term 1
        let term2Sum = 0;
        let details = [];

        // Term 1 Calculation
        details.push({ type: 'General Area', val: avg, limit: dcgl, fraction: totalUnity });

        for (let spot of hotSpots) {
            const c = safeParseFloat(spot.conc);
            const af = safeParseFloat(spot.af);
            if (isNaN(c) || isNaN(af)) continue; // Skip incomplete rows
            
            if (c < avg) { setError('Hot spot concentration cannot be less than average.'); return; }
            
            const dcgl_emc = dcgl * af;
            const term = (c - avg) / dcgl_emc;
            term2Sum += term;
            totalUnity += term;
            
            details.push({ type: 'Hot Spot', val: c, limit: dcgl_emc, fraction: term, af: af });
        }

        setResult({
            pass: totalUnity <= 1,
            totalUnity: totalUnity.toFixed(3),
            generalTerm: (avg/dcgl).toFixed(3),
            hotSpotTerm: term2Sum.toFixed(3),
            details
        });
    };

    const handleSaveToHistory = () => {
        if (result) {
            addHistory({ id: Date.now(), type: 'EMC Eval', icon: ICONS.labStats, inputs: `${hotSpots.length} Hot Spots`, result: result.pass ? 'PASS' : 'FAIL', view: VIEWS.MARSSIM_TESTS });
            addToast("Saved!");
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                <strong>Applicability:</strong> Use this to evaluate specific "hot spots". It ensures that small areas of elevated activity do not exceed the dose limit when averaged with the general area.
            </div>
            
            <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium">DCGL<sub>W</sub></label><input type="number" value={dcglw} onChange={e => setDcglw(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                    <div><label className="block text-sm font-medium">Average Conc.</label><input type="number" value={avgConc} onChange={e => setAvgConc(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" /></div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold">Hot Spots Identified</label>
                        <button onClick={addSpot} className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded hover:bg-slate-300">+ Add Spot</button>
                    </div>
                    
                    <div className="space-y-2">
                        {hotSpots.map((spot, index) => (
                            <div key={spot.id} className="flex gap-2 items-end">
                                <div className="flex-grow">
                                    <label className="text-xs text-slate-500">Max Conc.</label>
                                    <input type="number" value={spot.conc} onChange={e => updateSpot(spot.id, 'conc', e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm" />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-slate-500">Area Factor</label>
                                    <input type="number" value={spot.af} onChange={e => updateSpot(spot.id, 'af', e.target.value)} className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm" />
                                </div>
                                {hotSpots.length > 1 && (
                                    <button onClick={() => removeSpot(spot.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Icon path={ICONS.clear} className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <button onClick={handleCalculate} className="w-full py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">Calculate EMC</button>
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            {result && (
                <div className={`p-4 rounded-lg mt-4 text-center animate-fade-in ${result.pass ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                    <p className={`text-3xl font-extrabold ${result.pass ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>EMC {result.pass ? 'PASSES' : 'FAILS'}</p>
                    <p className="mt-1 font-bold">Total Unity Value: {result.totalUnity}</p>
                    
                    <div className="mt-4 text-sm text-left bg-white dark:bg-slate-800 p-2 rounded shadow-sm">
                        <table className="w-full">
                            <thead><tr className="text-xs text-slate-500 border-b"><th className="pb-1">Source</th><th className="pb-1 text-right">Value</th><th className="pb-1 text-right">Limit</th><th className="pb-1 text-right">Fraction</th></tr></thead>
                            <tbody>
                                {result.details.map((d, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                                        <td className="py-1">{d.type} {d.af ? `(AF=${d.af})` : ''}</td>
                                        <td className="py-1 text-right font-mono">{d.val}</td>
                                        <td className="py-1 text-right font-mono">{d.limit}</td>
                                        <td className="py-1 text-right font-bold font-mono">{d.fraction.toFixed(3)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// 4. MAIN CONTAINER: MARSSIM Tests
const MARSSIM_Statistical_Tests = () => {
    const TEST_WRS = 'wrs';
    const TEST_SIGN = 'sign';
    const TEST_EMC_EVAL = 'emc_eval';
    const [activeTest, setActiveTest] = React.useState(TEST_WRS);
    
    // WRS State
    const [wrs_dcgl, setWrs_dcgl] = React.useState(() => localStorage.getItem('wrs_dcgl') || '5');
    const [wrs_referenceData, setWrs_referenceData] = React.useState(() => localStorage.getItem('wrs_referenceData') || '1.6\n1.2\n1.4\n1.2\n0.5\n1.5\n0.8\n1.1\n1.9\n1.7\n1.8\n1.8\n1.7\n1.9\n2.1\n1.8\n2.1\n2.4\n2.2\n2.9\n2\n1.7\n2.3\n1.1\n2.3\n0.6\n1.1\n1.1\n1.4\n2.1');
    const [wrs_surveyData, setWrs_surveyData] = React.useState(() => localStorage.getItem('wrs_surveyData') || '2.928\n3.458\n3.31\n3.198\n2.218\n6.827\n2.269\n4.96\n2.766\n3.29\n10.833\n1.606\n1.856\n3.135\n1.808\n1.873\n3.373\n1.887\n1.457\n5.5\n1.973\n1.915\n2.205\n1.814\n3.7\n2.327\n1.919\n2.677\n3.253\n1.776\n5.201\n4.737\n2.585');
    const [wrs_alpha, setWrs_alpha] = React.useState(() => localStorage.getItem('wrs_alpha') || '0.05');
    const [wrs_result, setWrs_result] = React.useState(null);
    const [wrs_error, setWrs_error] = React.useState('');
    
    // Sign Test State
    const [sign_dcgl, setSign_dcgl] = React.useState(() => localStorage.getItem('sign_dcgl') || '100');
    const [sign_data, setSign_data] = React.useState(() => localStorage.getItem('sign_data') || '120, 90, 95, 80, 85, 110, 95, 70');
    const [sign_alpha, setSign_alpha] = React.useState(() => localStorage.getItem('sign_alpha') || '0.05');
    const [sign_subtractBkg, setSign_subtractBkg] = React.useState(() => JSON.parse(localStorage.getItem('sign_subtractBkg')) || false);
    const [sign_background, setSign_background] = React.useState(() => localStorage.getItem('sign_background') || '0');
    
    const [sign_result, setSign_result] = React.useState(null);
    const [sign_error, setSign_error] = React.useState('');
    
    // Persistence for new Sign Test fields
    React.useEffect(() => {
        localStorage.setItem('sign_subtractBkg', JSON.stringify(sign_subtractBkg));
        localStorage.setItem('sign_background', sign_background);
    }, [sign_subtractBkg, sign_background]);
    
    // EMC Evaluation State
    const [emc_dcglw, setEmc_dcglw] = React.useState(() => localStorage.getItem('emcEval_dcglw') || '100');
    const [emc_areaFactor, setEmc_areaFactor] = React.useState(() => localStorage.getItem('emcEval_areaFactor') || '3.0');
    const [emc_avgConc, setEmc_avgConc] = React.useState(() => localStorage.getItem('emcEval_avgConc') || '40');
    const [emc_maxConc, setEmc_maxConc] = React.useState(() => localStorage.getItem('emcEval_maxConc') || '150');
    const [emc_result, setEmc_result] = React.useState(null);
    const [emc_error, setEmc_error] = React.useState('');
    
    const handleClearActiveCalculator = () => {
        if (activeTest === TEST_WRS) {
            setWrs_dcgl('5'); setWrs_referenceData(''); setWrs_surveyData(''); setWrs_result(null); setWrs_error('');
            ['wrs_dcgl', 'wrs_referenceData', 'wrs_surveyData', 'wrs_alpha'].forEach(k => localStorage.removeItem(k));
        } else if (activeTest === TEST_SIGN) {
            setSign_dcgl('100'); setSign_data(''); setSign_result(null); setSign_error(''); setSign_subtractBkg(false); setSign_background('0');
            ['sign_dcgl', 'sign_data', 'sign_alpha', 'sign_subtractBkg', 'sign_background'].forEach(k => localStorage.removeItem(k));
        } else {
            setEmc_dcglw('100'); setEmc_areaFactor('3.0'); setEmc_avgConc('40'); setEmc_maxConc('150'); setEmc_result(null); setEmc_error('');
            ['emcEval_dcglw', 'emcEval_areaFactor', 'emcEval_avgConc', 'emcEval_maxConc'].forEach(k => localStorage.removeItem(k));
        }
    };
    
    return (
        <div className="p-4 animate-fade-in">
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">MARSSIM Statistical Tests</h2>
                    <ClearButton onClick={handleClearActiveCalculator} />
                </div>
                
                <div className="flex w-full p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4">
                    <button onClick={() => setActiveTest(TEST_WRS)} className={`flex-1 p-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeTest === TEST_WRS ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>WRS Test</button>
                    <button onClick={() => setActiveTest(TEST_SIGN)} className={`flex-1 p-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeTest === TEST_SIGN ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>Sign Test</button>
                    <button onClick={() => setActiveTest(TEST_EMC_EVAL)} className={`flex-1 p-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${activeTest === TEST_EMC_EVAL ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>EMC Eval</button>
                </div>
                
                {activeTest === TEST_WRS && (
                    <WRS_Calculator
                        dcgl={wrs_dcgl} setDcgl={setWrs_dcgl}
                        referenceData={wrs_referenceData} setReferenceData={setWrs_referenceData}
                        surveyData={wrs_surveyData} setSurveyData={setWrs_surveyData}
                        alpha={wrs_alpha} setAlpha={setWrs_alpha}
                        result={wrs_result} setResult={setWrs_result}
                        error={wrs_error} setError={setWrs_error}
                    />
                )}
                {activeTest === TEST_SIGN && (
                    <SignTest_Calculator
                        dcgl={sign_dcgl} setDcgl={setSign_dcgl}
                        dataInput={sign_data} setDataInput={setSign_data}
                        alpha={sign_alpha} setAlpha={setSign_alpha}
                        subtractBkg={sign_subtractBkg} setSubtractBkg={setSign_subtractBkg}
                        background={sign_background} setBackground={setSign_background}
                        result={sign_result} setResult={setSign_result}
                        error={sign_error} setError={setSign_error}
                    />
                )}
                {activeTest === TEST_EMC_EVAL && (
                    <EMC_Evaluation_Calculator
                        dcglw={emc_dcglw} setDcglw={setEmc_dcglw}
                        areaFactor={emc_areaFactor} setAreaFactor={setEmc_areaFactor}
                        avgConc={emc_avgConc} setAvgConc={setEmc_avgConc}
                        maxConc={emc_maxConc} setMaxConc={setEmc_maxConc}
                        result={emc_result} setResult={setEmc_result}
                        error={emc_error} setError={setEmc_error}
                    />
                )}
            </div>
        </div>
    );
};

/**
            * @description React component for a graphical survey unit drawing tool. This utility
            * allows users to visually plan and lay out radiation survey points on an interactive map.
            * The tool is designed to support the planning phase of a final status survey, particularly
            * for a **Multi-Agency Radiation Survey and Site Investigation Manual (MARSSIM)** project.
            *
            * Key features include:
            * - **Interactive Map:** A Leaflet-based map provides a visual canvas.
            * - **Drawing Controls:** Users can draw survey unit boundaries using **polygons** or
            * **rectangles**.
            * - **Sample Point Generation:** Automatically generates statistical sample points within
            * the drawn boundary using common MARSSIM patterns: **random**, **square grid**, or
            * **triangular grid**.
            * - **Manual Point Placement:** Allows for the placement of "biased" sample points in
            * areas of known or suspected contamination.
            * - **Area Calculation:** Automatically calculates the area of the drawn survey unit.
            * - **Data Export:** The final list of sample points, including coordinates and a unique
            * identifier, can be exported to a `.csv` file for use with GPS devices or for documentation.
            *
            * This component is an essential part of the MARSSIM suite, bridging the statistical
            * calculations with a practical, field-ready planning tool.
            *
            * @prop {boolean} isVisible - Boolean to trigger map redraw on component mount,
            * ensuring correct rendering within a tabbed interface.
            */
            
            const DrawingTool = ({ isVisible, importedSamples }) => {
            const mapRef = React.useRef(null);
            const drawnItemsRef = React.useRef(null);
            const samplePointsLayerRef = React.useRef(null);
            const originMarkerRef = React.useRef(null);
            const fileInputRef = React.useRef(null);
            const osmLayerRef = React.useRef(null);
            const satelliteLayerRef = React.useRef(null);
            const { addToast } = useToast();
            
            // --- STATE MANAGEMENT ---
            const [surveyUnitLayer, setSurveyUnitLayer] = React.useState(null);
            const [surveyUnitArea, setSurveyUnitArea] = React.useState(0);
            const [plottedPoints, setPlottedPoints] = React.useState([]);
            const [locationInput, setLocationInput] = React.useState('');
            const [surveyUnitName, setSurveyUnitName] = React.useState('SU-1');
            const [surveyClass, setSurveyClass] = React.useState('Class 1');
            const [samplesToPlace, setSamplesToPlace] = React.useState(25);
            const [sampleCalcMode, setSampleCalcMode] = React.useState('byNumber');
            const [gridSpacing, setGridSpacing] = React.useState(10);

            const [mapStyle, setMapStyle] = React.useState('street');
            
            const highlightStyle = { weight: 5, color: '#0ea5e9', dashArray: '', fillOpacity: 0.5 };
            const defaultStyle = { color: '#3388ff' };
            
            const plottedPointsRef = React.useRef(plottedPoints);
            const surveyUnitNameRef = React.useRef(surveyUnitName);
            const surveyClassRef = React.useRef(surveyClass);
            
            // Keep refs synchronized with state
            React.useEffect(() => { plottedPointsRef.current = plottedPoints; }, [plottedPoints]);
            React.useEffect(() => { surveyUnitNameRef.current = surveyUnitName; }, [surveyUnitName]);
            React.useEffect(() => { surveyClassRef.current = surveyClass; }, [surveyClass]);
            
            
            // Handle Imported Samples
            React.useEffect(() => {
                if (importedSamples && importedSamples > 0) {
                    setSamplesToPlace(importedSamples);
                    setSampleCalcMode('byNumber'); 
                    addToast(`Imported ${importedSamples} samples from calculator.`);
                }
            }, [importedSamples]);
            
            // --- HELPER FUNCTIONS ---
            
            React.useEffect(() => {
            if (surveyUnitLayer) {
            const popupContent = `<b>Survey Unit: ${surveyUnitName}</b><br>Class: ${surveyClass}<br>Area: ${surveyUnitArea.toFixed(1)} m²`;
            surveyUnitLayer.setPopupContent(popupContent);
            }
            }, [surveyUnitName, surveyClass, surveyUnitLayer, surveyUnitArea]);
            
            const getNextIdForPrefix = (points, prefix) => {
            const existingNumbers = points
            .filter(p => p.id.startsWith(prefix + '-'))
            .map(p => parseInt(p.id.split('-')[1], 10))
            .sort((a, b) => a - b);
            
            let nextNum = 1;
            for (const num of existingNumbers) {
            if (num === nextNum) {
              nextNum++;
            } else {
              break; // Found a gap
            }
            }
            return `${prefix}-${nextNum}`;
            };
            
            // Robust point-in-polygon check
            const isPointInPolygon = (point, polygonLatLngs) => {
            // Leaflet Draw polygons can have nested arrays for holes, we take the outer ring [0]
            const polyPoints = (Array.isArray(polygonLatLngs[0])) ? polygonLatLngs[0] : polygonLatLngs;
            const x = point.lat, y = point.lng;
            let inside = false;
            for (let i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            const xi = polyPoints[i].lat, yi = polyPoints[i].lng;
            const xj = polyPoints[j].lat, yj = polyPoints[j].lng;
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
            }
            return inside;
            };
            
            // Clears ONLY the statistical samples (Random, Square, Triangular)
            const handleClearPoints = () => {
            const biasedOnly = plottedPoints.filter(p => p.type === 'Biased');
            setPlottedPoints(biasedOnly);
            
            // Remove layers that are NOT the origin marker and NOT matched to a biased point ID
            samplePointsLayerRef.current.eachLayer(layer => {
            if (layer !== originMarkerRef.current) {
              // Check if this layer corresponds to a biased point we are keeping
              // Biased points are stored in state, so we can check IDs if we attached them to layers
              // Simplified approach: Clear all points layer, re-add biased points
              samplePointsLayerRef.current.removeLayer(layer);
            }
            });
            
            // Re-add biased points visually
            biasedOnly.forEach(p => {
            const latLng = { lat: p.lat, lng: p.lng };
            const popupContent = `<b>Bias Sample Point #${p.id}</b><br>Type: Biased<br>Lat: ${p.lat.toFixed(7)}<br>Lng: ${p.lng.toFixed(7)}`;
            const marker = L.circleMarker(latLng, { radius: 4, className: 'biased-sample-marker' }).bindPopup(popupContent);
            marker.myCustomId = p.id;
            drawnItemsRef.current.addLayer(marker); // Biased points live in drawnItems so they persist
            });
            };
            
            const handleClearAll = () => {
            if (drawnItemsRef.current) drawnItemsRef.current.clearLayers();
            if (samplePointsLayerRef.current) samplePointsLayerRef.current.clearLayers();
            setSurveyUnitLayer(null);
            setSurveyUnitArea(0);
            setPlottedPoints([]);
            };
            
            const onDrawDelete = (e) => {
            e.layers.eachLayer(layer => {
            if (layer instanceof L.CircleMarker && layer.myCustomId) {
              const deletedId = layer.myCustomId;
              setPlottedPoints(currentPoints =>
                  currentPoints.filter(p => p.id !== deletedId)
              );
            } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
              handleClearAll();
            }
            });
            addToast("Item(s) removed from map.");
            };
            
            // --- CORE LOGIC ---
            const onDrawEditOrCreate = (e) => {
            if (e.type === 'draw:edited') {
            const currentPoints = plottedPointsRef.current;
            
            // 1. Separate biased points (persist) from statistical (clear, as they may now be outside)
            const biasedPoints = currentPoints.filter(p => p.type === 'Biased');
            const statisticalPoints = currentPoints.filter(p => p.type !== 'Biased');
            
            // If we had statistical points, warn the user they are gone/need regen
            if (statisticalPoints.length > 0) {
               addToast("Boundary modified. Statistical samples cleared.");
               // Clear them visually
               samplePointsLayerRef.current.clearLayers();
               // Origin marker might need re-adding
               if (originMarkerRef.current) {
                    // Logic in useEffect will re-add origin based on surveyUnitLayer
                    originMarkerRef.current.remove();
                    originMarkerRef.current = null;
               }
            }
            
            // Update Biased Points positions if they were dragged (Leaflet Draw handles marker drag)
            const updatedBiasedPoints = [];
            e.layers.eachLayer(layer => {
              if (layer instanceof L.CircleMarker && layer.myCustomId) {
                  const latLng = layer.getLatLng();
                  updatedBiasedPoints.push({
                      id: layer.myCustomId,
                      lat: latLng.lat,
                      lng: latLng.lng,
                      type: 'Biased'
                  });
              } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
                  // Recalculate Area using Geodesic (more accurate)
                  const latLngs = layer.getLatLngs()[0];
                  const area = L.GeometryUtil.geodesicArea(latLngs);
                  setSurveyUnitArea(area);
            
                  const popupContent = `<b>Survey Unit: ${surveyUnitNameRef.current}</b><br>Class: ${surveyClassRef.current}<br>Area: ${area.toFixed(1)} m²`;
                  layer.setPopupContent(popupContent);
              }
            });
            
            // If we didn't find specific marker layers in the event, we keep the old biased points (they weren't edited)
            // But this event usually contains everything being edited.
            // Simplified: We set state to just the biased points. User must click "Generate" again for grid.
            setPlottedPoints(updatedBiasedPoints.length > 0 ? updatedBiasedPoints : biasedPoints);
            return;
            }
            
            const layer = e.layer;
            if (!layer) return;
            
            if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
            drawnItemsRef.current.eachLayer(l => {
              if (l instanceof L.Polygon || l instanceof L.Rectangle) { drawnItemsRef.current.removeLayer(l); }
            });
            handleClearPoints();
            drawnItemsRef.current.addLayer(layer);
            setSurveyUnitLayer(layer);
            
            // Use Geodesic Area
            const latLngs = layer.getLatLngs()[0];
            const area = L.GeometryUtil.geodesicArea(latLngs);
            setSurveyUnitArea(area);
            
            const popupContent = `<b>Survey Unit: ${surveyUnitNameRef.current}</b><br>Class: ${surveyClassRef.current}<br>Area: ${area.toFixed(1)} m²`;
            layer.bindPopup(popupContent).openPopup();
            
            layer.on({
              mouseover: (e) => e.target.setStyle(highlightStyle),
              mouseout: (e) => e.target.setStyle(defaultStyle)
            });
            } else if (layer instanceof L.Marker) {
            drawnItemsRef.current.removeLayer(layer);
            const latLng = layer.getLatLng();
            
            setPlottedPoints(prevPoints => {
              const newId = getNextIdForPrefix(prevPoints, 'B');
              const newPoint = { id: newId, lat: latLng.lat, lng: latLng.lng, type: 'Biased' };
            
              const popupContent = `<b>Bias Sample Point #${newId}</b><br>Type: Biased<br>Lat: ${latLng.lat.toFixed(7)}<br>Lng: ${latLng.lng.toFixed(7)}`;
              const newMarker = L.circleMarker(latLng, {
                  radius: 4,
                  className: 'biased-sample-marker'
              }).bindPopup(popupContent);
            
              newMarker.on('contextmenu', () => {
                   drawnItemsRef.current.removeLayer(newMarker);
                   setPlottedPoints(prev => prev.filter(p => p.id !== newId));
                   addToast(`Bias Point #${newId} removed.`);
               });
            
              newMarker.myCustomId = newId;
              drawnItemsRef.current.addLayer(newMarker);
            
              return [...prevPoints, newPoint];
            });
            }
            };
            
            const handleGenerateSamples = React.useCallback((pattern) => {
            if (!surveyUnitLayer) {
            addToast("Please draw a survey unit boundary first.");
            return;
            }
            handleClearPoints(); // Clear existing grid points
            
            // Retrieve biased points to preserve them
            const existingBiasedPoints = plottedPointsRef.current.filter(p => p.type === 'Biased');
            
            let numSamples = samplesToPlace;
            let spacingMeters = gridSpacing;
            const latLngs = surveyUnitLayer.getLatLngs();
            const bounds = surveyUnitLayer.getBounds();
            
            // 1. Calculate Spacing / Number
            if (pattern !== 'random') {
            if (sampleCalcMode === 'bySpacing') {
              if (spacingMeters <= 0) { addToast("Grid spacing must be > 0."); return; }
              // Estimate N
              const multiplier = pattern === 'triangular' ? 0.866 : 1;
              numSamples = Math.ceil(surveyUnitArea / (spacingMeters * spacingMeters * multiplier));
              setSamplesToPlace(numSamples);
            } else { // byNumber
              if (numSamples <= 0) { addToast("Number of samples must be > 0."); return; }
              const multiplier = pattern === 'triangular' ? 0.866 : 1;
              spacingMeters = Math.sqrt(surveyUnitArea / (multiplier * numSamples));
              setGridSpacing(spacingMeters.toFixed(2));
            }
            }
            
            // --- Infinite Loop Protection ---
            if (pattern !== 'random' && spacingMeters <= 0.01) {
            addToast("Calculated grid spacing is too small. Check area and sample count.");
            return;
            }
            
            const newPoints = [];
            
            if (pattern === 'random') {
            // Random generation (unchanged)
            for (let i = 0; i < numSamples; i++) {
              let pointFound = false;
              let attempts = 0;
              while (!pointFound && attempts < 2000) {
                  const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth());
                  const lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest());
                  if (isPointInPolygon({ lat, lng }, latLngs)) {
                      newPoints.push({ lat, lng });
                      pointFound = true;
                  }
                  attempts++;
              }
            }
            } else {
            // Systematic Grid
            // Approx conversion factors at the center latitude
            const centerLat = (bounds.getSouth() + bounds.getNorth()) / 2;
            const metersPerDegLat = 111320;
            const metersPerDegLng = 111320 * Math.cos(centerLat * Math.PI / 180);
            
            const spacingLat = spacingMeters / metersPerDegLat;
            const spacingLng = spacingMeters / metersPerDegLng;
            
            // Random start point logic (MARSSIM requirement)
            // L.GeometryUtil.randomPointInLayer(surveyUnitLayer) is better but manual is fine for now
            const randomLatOffset = Math.random() * spacingLat;
            const randomLngOffset = Math.random() * spacingLng;
            
            let row = 0;
            // Loop with safety check
            for (let lat = bounds.getSouth() + randomLatOffset - spacingLat; lat < bounds.getNorth() + spacingLat; lat += spacingLat * (pattern === 'triangular' ? 0.866 : 1)) {
            
              const triangularShift = (pattern === 'triangular' && row % 2 !== 0) ? spacingLng / 2 : 0;
            
              for (let lng = bounds.getWest() + randomLngOffset - spacingLng; lng < bounds.getEast() + spacingLng; lng += spacingLng) {
            
                  const actualLng = lng + triangularShift;
            
                  if (isPointInPolygon({ lat, lng: actualLng }, latLngs)) {
                      newPoints.push({ lat, lng: actualLng });
                  }
              }
              row++;
            }
            }
            
            // Add to map
            const pointsWithTypes = newPoints.map((p, index) => {
            const prefix = pattern.charAt(0).toUpperCase(); // R, S, T
            return {
              ...p,
              id: `${prefix}-${index + 1}`,
              type: pattern.charAt(0).toUpperCase() + pattern.slice(1)
            };
            });
            
            setPlottedPoints([...existingBiasedPoints, ...pointsWithTypes]);
            
            pointsWithTypes.forEach(point => {
            const marker = L.circleMarker([point.lat, point.lng], { radius: 4, className: 'grid-sample-marker' });
            const popupContent = `<b>Sample Point #${point.id}</b><br>Type: ${point.type}<br>Lat: ${point.lat.toFixed(7)}<br>Lng: ${point.lng.toFixed(7)}`;
            marker.bindPopup(popupContent).addTo(samplePointsLayerRef.current);
            });
            
            addToast(`${newPoints.length} ${pattern} sample points generated.`);
            
            }, [surveyUnitLayer, sampleCalcMode, samplesToPlace, gridSpacing, surveyUnitArea, addToast]);
            
            const handleZoomToSurveyUnit = () => { if (surveyUnitLayer && mapRef.current) { mapRef.current.fitBounds(surveyUnitLayer.getBounds()); } };
            
            const handleSavePlan = () => {
            if (!surveyUnitLayer) { addToast("Please draw a survey unit to save."); return; }
            const planData = {
            surveyUnit: surveyUnitLayer.toGeoJSON(),
            points: plottedPoints,
            surveyClass: surveyClass,
            samplesToPlace: samplesToPlace,
            };
            const blob = new Blob([JSON.stringify(planData, null, 2)], { type: 'application/json' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "survey-plan.json";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            };
            
            const handleLoadPlan = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
            try {
              const parsedData = JSON.parse(e.target.result);
              if (!parsedData.surveyUnit || !parsedData.points) { throw new Error("Invalid plan file format."); }
            
              handleClearAll();
            
              const newSurveyUnit = L.geoJSON(parsedData.surveyUnit, { style: defaultStyle });
              const layer = newSurveyUnit.getLayers()[0];
              if (layer) {
                  drawnItemsRef.current.addLayer(layer);
                  setSurveyUnitLayer(layer);
            
                  // Use Geodesic
                  const latLngs = layer.getLatLngs()[0];
                  const area = L.GeometryUtil.geodesicArea(latLngs);
                  setSurveyUnitArea(area);
            
                  mapRef.current.fitBounds(layer.getBounds());
            
                  const popupContent = `<b>Survey Unit</b><br>Class: ${parsedData.surveyClass || 'Class 1'}<br>Area: ${area.toFixed(1)} m²`;
                  layer.bindPopup(popupContent);
                  layer.on({
                      mouseover: (e) => e.target.setStyle(highlightStyle),
                      mouseout: (e) => e.target.setStyle(defaultStyle)
                  });
              }
            
              const loadedPoints = parsedData.points || [];
              setPlottedPoints(loadedPoints);
              setSurveyClass(parsedData.surveyClass || 'Class 1');
              setSamplesToPlace(parsedData.samplesToPlace || 25);
            
              loadedPoints.forEach((point, index) => {
                  const marker = L.circleMarker([point.lat, point.lng], {
                      radius: 4,
                      className: point.type === 'Biased' ? 'biased-sample-marker' : 'grid-sample-marker'
                  });
                  const popupContent = `<b>Sample Point #${point.id}</b><br>Type: ${point.type}<br>Lat: ${point.lat.toFixed(7)}<br>Lng: ${point.lng.toFixed(7)}`;
                  marker.bindPopup(popupContent);
            
                  marker.on('contextmenu', () => {
                       // Remove from map
                       samplePointsLayerRef.current.removeLayer(marker);
                       
                       // Update state
                       setPlottedPoints(prev => prev.filter(p => p.id !== point.id));
                       
                       addToast(`Point #${point.id} removed.`);
                   });
            
                  marker.addTo(samplePointsLayerRef.current);
            
                  if (point.type === 'Biased') {
                      marker.myCustomId = point.id;
                      drawnItemsRef.current.addLayer(marker); // Ensure Biased persist in edits
                  }
              });
            
            } catch (error) { 
               // Use app toast instead of browser alert
               addToast(`Error loading plan: ${error.message}`); 
            }
            };
            reader.readAsText(file);
            event.target.value = null;
            };
            
            // Export Function
            const handleExport = () => {
                if (!filteredList || filteredList.length === 0) return;
            
                // IMPROVEMENT: Added raw numeric columns for analysis
                const headers = [
                    'Name', 'Symbol', 'Category', 
                    'Half-Life (Text)', 'Half-Life (Seconds)', 
                    'Decay Constant (s^-1)', 
                    'Specific Activity (Bq/g)', 
                    'Gamma Constant (R-m2/hr-Ci)', 
                    'D-Value (TBq)',
                    'Emissions'
                ];
                
                const csvRows = [headers.join(',')];
            
                filteredList.forEach(n => {
                    // sanitize text to prevent CSV breakages
                    const name = `"${n.name}"`;
                    const emissions = `"${(n.emissionType || []).join('; ')}"`;
                    
                    // Parse raw values
                    const hlSeconds = parseHalfLifeToSeconds(n.halfLife);
                    const sa = parseSpecificActivity(n.specificActivity);
                    const lambda = hlSeconds === Infinity ? 0 : Math.log(2) / hlSeconds;
            
                    const row = [
                        name,
                        n.symbol,
                        n.category,
                        `"${n.halfLife}"`, // Quote text to handle spaces
                        hlSeconds === Infinity ? 'Infinity' : hlSeconds,
                        lambda,
                        sa || 'N/A',
                        n.gammaConstant ? safeParseFloat(n.gammaConstant) : 'N/A',
                        n.dValue || 'N/A',
                        emissions
                    ];
                    csvRows.push(row.join(','));
                });
            
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'nuclide_database_export.csv';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };
            
            const handleGoToLocation = async () => {
            if (!locationInput.trim()) return;
            const coordRegex = /^-?[\d.]+\s*,\s*-?[\d.]+$/;
            if (coordRegex.test(locationInput)) {
            const [lat, lng] = locationInput.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) { mapRef.current.setView([lat, lng], 16); return; }
            }
            try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationInput)}`);
            const data = await response.json();
            if (data && data.length > 0) {
              const { lat, lon } = data[0];
              mapRef.current.setView([safeParseFloat(lat), safeParseFloat(lon)], 16);
            } else { addToast("Location not found."); }
            } catch (error) { addToast("Could not connect to the location service."); }
            };
            
            // --- PRINT / PDF HANDLER (Simplified for brevity, includes origin style) ---
            const handlePrintMap = () => {
            if (!mapRef.current || !surveyUnitLayer) { addToast("No survey unit to print."); return; }
            // ... (Keep existing print logic, it works fine. Ensure you update the coordinate precision in the HTML table generation to .toFixed(7) if desired.)
            // Just triggering the existing function if you kept it.
            window.print();
            };
            
            // --- MAP INITIALIZATION ---
            React.useEffect(() => {
                // 1. Check if map is already initialized
                if (mapRef.current) return;
                
                // 2. Safety Check: Ensure the HTML element exists before trying to load Leaflet
                if (!document.getElementById('marssim-map')) return;
            
                L.drawLocal.draw.toolbar.buttons.marker = 'Place a bias sample';
                L.drawLocal.draw.handlers.marker.tooltip.start = 'Click map to place bias sample.';
                
                const biasMarkerIcon = new L.DivIcon({ className: 'leaflet-draw-biased-marker-icon', iconSize: new L.Point(12, 12), iconAnchor: new L.Point(8, 8) });
                const yourStadiaApiKey = 'a7f8d6b2-37be-4661-afa4-0409424b5708';
                
                osmLayerRef.current = L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png?api_key={apiKey}', {
                    attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>',
                    maxNativeZoom: 19, maxZoom: 21, apiKey: yourStadiaApiKey
                });
                satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri', maxNativeZoom: 19, maxZoom: 21 });
                
                mapRef.current = L.map('marssim-map', { layers: [osmLayerRef.current] }).setView([37.207, -76.51], 13);
                
                drawnItemsRef.current = new L.FeatureGroup();
                samplePointsLayerRef.current = new L.FeatureGroup();
                mapRef.current.addLayer(drawnItemsRef.current);
                mapRef.current.addLayer(samplePointsLayerRef.current);
                
                const drawControl = new L.Control.Draw({
                    edit: { featureGroup: drawnItemsRef.current },
                    draw: {
                        polyline: false, polygon: { shapeOptions: { color: '#3388ff' } },
                        rectangle: { shapeOptions: { color: '#3388ff' } },
                        marker: { icon: biasMarkerIcon }, circle: false, circlemarker: false
                    }
                });
                mapRef.current.addControl(drawControl);
                
                // Add North Arrow & Scale (Keep existing logic)
                L.control.scale({ imperial: true, metric: true }).addTo(mapRef.current);
                
                // Events
                mapRef.current.on(L.Draw.Event.CREATED, onDrawEditOrCreate);
                mapRef.current.on(L.Draw.Event.EDITED, onDrawEditOrCreate);
                mapRef.current.on(L.Draw.Event.DELETED, onDrawDelete);
                
                return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
            }, []);
            
            React.useEffect(() => { if (isVisible && mapRef.current) { setTimeout(() => mapRef.current.invalidateSize(), 100); } }, [isVisible]);
            
            // Manage Origin Marker
            React.useEffect(() => {
            if (originMarkerRef.current) { originMarkerRef.current.remove(); originMarkerRef.current = null; }
            if (surveyUnitLayer && samplePointsLayerRef.current) {
            const originLatLng = surveyUnitLayer.getBounds().getSouthWest();
            const originMarker = L.circleMarker(originLatLng, { radius: 6, className: 'origin-sample-marker' }).bindPopup(`<b>Survey Origin (SW Corner)</b><br>Lat: ${originLatLng.lat.toFixed(7)}<br>Lng: ${originLatLng.lng.toFixed(7)}`);
            originMarker.addTo(samplePointsLayerRef.current);
            originMarkerRef.current = originMarker;
            }
            }, [surveyUnitLayer]);

            // Handle Map Style Switching ---
            React.useEffect(() => {
                if (!mapRef.current || !osmLayerRef.current || !satelliteLayerRef.current) return;

                if (mapStyle === 'satellite') {
                    if (mapRef.current.hasLayer(osmLayerRef.current)) {
                        mapRef.current.removeLayer(osmLayerRef.current);
                    }
                    if (!mapRef.current.hasLayer(satelliteLayerRef.current)) {
                        mapRef.current.addLayer(satelliteLayerRef.current);
                    }
                } else {
                    if (mapRef.current.hasLayer(satelliteLayerRef.current)) {
                        mapRef.current.removeLayer(satelliteLayerRef.current);
                    }
                    if (!mapRef.current.hasLayer(osmLayerRef.current)) {
                        mapRef.current.addLayer(osmLayerRef.current);
                    }
                }
            }, [mapStyle]);
            
            return (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    {/* Header Row */}
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                        
                        {/* Left Side: Title + Toggle */}
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold">Survey Unit Drawing Tool</h3>
                            
                            {/* Map Style Toggle */}
                            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                                <button 
                                    onClick={() => setMapStyle('street')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mapStyle === 'street' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}
                                >
                                    Street
                                </button>
                                <button 
                                    onClick={() => setMapStyle('satellite')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${mapStyle === 'satellite' ? 'bg-white dark:bg-slate-600 shadow text-sky-600' : 'text-slate-500'}`}
                                >
                                    Satellite
                                </button>
                            </div>
                        </div>
                        
                        {/* Right Side: Action Buttons */}
                        <div className="flex items-center gap-2">
                            {surveyUnitLayer && ( <button onClick={handleZoomToSurveyUnit} className="px-3 py-2 text-sm bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">Zoom to Unit</button> )}
                            <input type="file" ref={fileInputRef} onChange={handleLoadPlan} accept=".json" style={{ display: 'none' }} />
                            <button onClick={() => fileInputRef.current.click()} className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Load Plan</button>
                            <button onClick={handleSavePlan} className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-600 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">Save Plan</button>
                        </div>
                    </div>

                    {/* Location Search Bar */}
                    <div className="flex gap-2 items-center mb-4">
                        <input type="text" value={locationInput} onChange={(e) => setLocationInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleGoToLocation(); }} placeholder="Enter an address or lat,lng coordinates" className="w-full p-2 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                        <button onClick={handleGoToLocation} className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">Go</button>
                    </div>
                    
                    {/* Map Container */}
                    <div id="marssim-map" className="w-full h-[60vh] my-4 rounded-lg bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 z-0"></div>
                    
                    {/* Dashboard Controls */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <h4 className="font-bold text-lg mb-3">Survey Unit Dashboard</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <label className="font-semibold text-slate-500 dark:text-slate-400">Unit Name</label>
                                    <input type="text" value={surveyUnitName} onChange={e => setSurveyUnitName(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600"/>
                                </div>
                                <div>
                                    <label className="font-semibold text-slate-500 dark:text-slate-400">Unit Class</label>
                                    <select value={surveyClass} onChange={e => setSurveyClass(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                                        <option>Class 1</option><option>Class 2</option><option>Class 3</option><option>Un-Impacted</option><option>Other</option>
                                    </select>
                                </div>
                                <div className="pt-2">
                                    <p className="font-semibold text-slate-500 dark:text-slate-400">Area (Geodesic)</p>
                                    <p className="text-xl font-bold text-sky-600 dark:text-sky-400">{surveyUnitArea.toFixed(1)} m²</p>
                                </div>
                                <div className="pt-2">
                                    <p className="font-semibold text-slate-500 dark:text-slate-400">Plotted Samples</p>
                                    <p className="text-xl font-bold text-sky-600 dark:text-sky-400">{plottedPoints.length}</p>
                                </div>
                            </div>
                            {gridSpacing > 0 && (
                                <div className="mt-3 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">Hotspot Detection:</span>
                                    <span className="ml-1 text-slate-500 dark:text-slate-400">
                                        With L = {gridSpacing}m, approx. unscanned area is 
                                        <strong> {((gridSpacing * gridSpacing) * 0.866).toFixed(1)} m²</strong> (Triangular) or 
                                        <strong> {(gridSpacing * gridSpacing).toFixed(1)} m²</strong> (Square).
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg h-full flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-lg mb-3">Statistical Samples</h4>
                                <div className="flex w-full p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3">
                                    <button onClick={() => setSampleCalcMode('byNumber')} className={`w-1/2 p-1 rounded-md text-xs font-semibold ${sampleCalcMode === 'byNumber' ? 'bg-white dark:bg-slate-800' : ''}`}>By Number</button>
                                    <button onClick={() => setSampleCalcMode('bySpacing')} className={`w-1/2 p-1 rounded-md text-xs font-semibold ${sampleCalcMode === 'bySpacing' ? 'bg-white dark:bg-slate-800' : ''}`}>By Spacing</button>
                                </div>
                                {sampleCalcMode === 'byNumber' ? (
                                    <div className="text-center">
                                        <label className="font-semibold text-sm text-slate-500 dark:text-slate-400 mb-2">Desired Number of Samples</label>
                                        <input type="number" value={samplesToPlace} onChange={(e) => setSamplesToPlace(parseInt(e.target.value, 10) || 0)} className="persistent-spinner w-24 text-center text-2xl font-bold text-sky-600 dark:text-sky-400 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <label className="font-semibold text-sm text-slate-500 dark:text-slate-400 mb-2">Grid Spacing (meters)</label>
                                        <input type="number" value={gridSpacing} onChange={(e) => setGridSpacing(parseInt(e.target.value, 10) || 0)} className="persistent-spinner w-24 text-center text-2xl font-bold text-sky-600 dark:text-sky-400 p-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none" />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <button onClick={() => handleGenerateSamples('square')} className="p-2 text-xs md:text-sm bg-slate-200 dark:bg-slate-600 font-semibold rounded-md hover:bg-sky-200 dark:hover:bg-sky-800">Square Grid</button>
                                <button onClick={() => handleGenerateSamples('triangular')} className="p-2 text-[12px] leading-tight bg-slate-200 dark:bg-slate-600 font-semibold rounded-md hover:bg-sky-200 dark:hover:bg-sky-800">Triangular Grid</button>
                                <button onClick={() => handleGenerateSamples('random')} className="p-2 text-xs md:text-sm bg-slate-200 dark:bg-slate-600 font-semibold rounded-md hover:bg-sky-200 dark:hover:bg-sky-800">Random</button>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Plotted Sample Coordinates ({plottedPoints.length})</h3>
                            <div className="flex items-center gap-4">
                                <button onClick={handleClearPoints} className="text-xs text-slate-500 hover:underline font-semibold flex items-center gap-1"><Icon path={ICONS.clear} className="w-3 h-3"/> Clear Grid Points</button>
                                <button onClick={handleClearAll} className="text-xs text-slate-500 hover:underline font-semibold flex items-center gap-1"><Icon path={ICONS.clear} className="w-3 h-3"/> Clear All</button>
                                <button onClick={handleExport} className="px-3 py-2 text-sm bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition flex items-center gap-2">Export CSV</button>
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto mt-2 pr-2">
                            {plottedPoints.length > 0 || surveyUnitLayer ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-center">
                                        <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0">
                                            <tr>
                                                <th className="p-2 text-center">#</th>
                                                <th className="p-2 text-center">Type</th>
                                                <th className="p-2 text-center">Latitude</th>
                                                <th className="p-2 text-center">Longitude</th>
                                                <th className="p-2 text-center">X (m)</th>
                                                <th className="p-2 text-center">Y (m)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const origin = surveyUnitLayer ? { lat: surveyUnitLayer.getBounds().getSouthWest().lat, lng: surveyUnitLayer.getBounds().getSouthWest().lng } : null;
                                                const sortedPoints = [...plottedPoints].sort((a, b) => {
                                                    const aIsBiased = a.type === 'Biased';
                                                    const bIsBiased = b.type === 'Biased';
                                                    if (aIsBiased && !bIsBiased) return -1;
                                                    if (!aIsBiased && bIsBiased) return 1;
                                                    const aNum = parseInt(a.id.split('-')[1]);
                                                    const bNum = parseInt(b.id.split('-')[1]);
                                                    return aNum - bNum;
                                                });
                                                return sortedPoints.map((point) => {
                                                    let xDist = 'N/A', yDist = 'N/A';
                                                    if (origin) {
                                                        yDist = calculateDistance(origin, { lat: point.lat, lng: origin.lng }).toFixed(3);
                                                        xDist = calculateDistance(origin, { lat: origin.lat, lng: point.lng }).toFixed(3);
                                                    }
                                                    return (
                                                        <tr key={point.id} className="border-b border-slate-200 dark:border-slate-700">
                                                            <td className="p-2 font-medium">{point.id}</td>
                                                            <td className="p-2">{point.type}</td>
                                                            <td className="p-2 font-mono">{point.lat.toFixed(7)}</td>
                                                            <td className="p-2 font-mono">{point.lng.toFixed(7)}</td>
                                                            <td className="p-2 font-mono">{xDist}</td>
                                                            <td className="p-2 font-mono">{yDist}</td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                        <tfoot>
                                            {(() => {
                                                const origin = surveyUnitLayer ? { lat: surveyUnitLayer.getBounds().getSouthWest().lat, lng: surveyUnitLayer.getBounds().getSouthWest().lng } : null;
                                                if (!origin) return null;
                                                return ( <tr className="bg-slate-200 dark:bg-slate-700 font-semibold border-t-2 border-slate-300 dark:border-slate-600"><td colSpan="2" className="p-2 text-left">Origin (SW Corner)</td><td className="p-2 font-mono">{origin.lat.toFixed(7)}</td><td className="p-2 font-mono">{origin.lng.toFixed(7)}</td><td className="p-2 font-mono">0.000</td><td className="p-2 font-mono">0.000</td></tr> );
                                            })()}
                                        </tfoot>
                                    </table>
                                </div>
                            ) : ( <p className="text-center text-slate-500 dark:text-slate-400 py-4">No sample points have been placed.</p> )}
                        </div>
                    </div>
                </div>
            );
            };
            
            /**
            * @description React component for the MARSSIM Sample Design Suite.
            * This component acts as a container for two main functionalities:
            * 1.  **Sample Size Calculator:** Calculates the number of samples required based on MARSSIM methodology.
            * 2.  **Survey Unit Drawing Tool:** Provides a user interface for drawing survey units and sample locations.
            *
            * It manages the active module state ('calculator' or 'drawing') and conditionally renders the corresponding
            * sub-component (`MARSSIM_SampleCalculator` or `DrawingTool`) based on user selection.
            */
            
            const MARSSIM_SampleDesign = () => {
            const [activeModule, setActiveModule] = React.useState('calculator');
            //  Shared state to hold the calculated N
            const [transferredSamples, setTransferredSamples] = React.useState(null);
            
            //  Handler to receive N and switch tabs
            const handleTransferN = (n) => {
            setTransferredSamples(n);
            setActiveModule('drawing');
            };
            
            return (
            <div className="p-4 animate-fade-in">
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">MARSSIM Sample Design Suite</h2>
            
              {/* Navigation Tabs */}
              <div className="flex w-full p-1 my-4 bg-slate-200 dark:bg-slate-700 rounded-lg">
                  <button
                      onClick={() => setActiveModule('calculator')}
                      className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${
                          activeModule === 'calculator' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'
                      }`}
                  >
                      1. Calculate Number of Samples
                  </button>
                  <button
                      onClick={() => setActiveModule('drawing')}
                      className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${
                          activeModule === 'drawing' ? 'bg-white dark:bg-slate-800 text-sky-600' : 'text-slate-600 dark:text-slate-300'
                      }`}
                  >
                      2. Draw Survey Unit
                  </button>
              </div>
            
              {/* Content Area */}
              <div>
                  <div style={{ display: activeModule === 'calculator' ? 'block' : 'none' }}>
                      {/* PASS the handler down */}
                      <MARSSIM_SampleCalculator onTransferResults={handleTransferN} />
                  </div>
                  <div style={{ display: activeModule === 'drawing' ? 'block' : 'none' }}>
                      {/* PASS the data down */}
                      <DrawingTool
                          isVisible={activeModule === 'drawing'}
                          importedSamples={transferredSamples}
                      />
                  </div>
              </div>
            </div>
            </div>
            );
            };

                        /**
            * @description A calculator to determine the required number of statistical samples for a
            * survey unit based on the more precise MARSSIM Equation 5-2.
            */
            
            const MARSSIM_SampleCalculator = ({ onTransferResults }) => {
            const { addHistory } = useCalculationHistory();
            const { addToast } = useToast();
            
            const [alpha, setAlpha] = React.useState('0.05');
            const [beta, setBeta] = React.useState('0.05');
            const [sigma, setSigma] = React.useState('15');
            const [dcgl, setDcgl] = React.useState('100');
            const [lbgr, setLbgr] = React.useState('50');
            const [cv, setCv] = React.useState('0.3');
            const [backgroundPresence, setBackgroundPresence] = React.useState('insignificant');
            
            const [result, setResult] = React.useState(null);
            const [error, setError] = React.useState('');
            
            const zScores = {
            '0.005': 2.576, '0.01': 2.326, '0.025': 1.960, '0.05': 1.645,
            '0.10': 1.282, '0.20': 0.841,
            };
            
            const getNormalCDF = (x) => {
            const t = 1 / (1 + 0.2316419 * Math.abs(x));
            const d = 0.3989423 * Math.exp(-x * x / 2);
            const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
            return x > 0 ? 1 - prob : prob;
            };
            
            const handleClearInputs = () => {
            setAlpha('0.05'); setBeta('0.05'); setSigma('15');
            setDcgl('100'); setLbgr('50'); setCv('0.3');
            setBackgroundPresence('insignificant');
            setResult(null); setError('');
            };
            
            React.useEffect(() => { handleCalculate(); }, []);
            
            React.useEffect(() => {
            localStorage.setItem('marssim_alpha', alpha);
            localStorage.setItem('marssim_beta', beta);
            localStorage.setItem('marssim_sigma', sigma);
            localStorage.setItem('marssim_dcgl', dcgl);
            localStorage.setItem('marssim_lbgr', lbgr);
            localStorage.setItem('marssim_cv', cv);
            localStorage.setItem('marssim_bg', backgroundPresence);
            }, [alpha, beta, sigma, dcgl, lbgr, cv, backgroundPresence]);
            
            const handleCalculateSigma = () => {
            const d = safeParseFloat(dcgl); const c = safeParseFloat(cv);
            if (!isNaN(d) && !isNaN(c)) setSigma((d * c).toPrecision(3));
            };
            
            const handleSetLbgr = () => {
            const d = safeParseFloat(dcgl);
            if (!isNaN(d)) setLbgr((d * 0.5).toPrecision(3));
            };
            
            const handleCalculate = () => {
            const sVal = safeParseFloat(sigma);
            const dVal = safeParseFloat(dcgl);
            const lVal = safeParseFloat(lbgr);
            
            if (isNaN(sVal) || isNaN(dVal) || isNaN(lVal) || sVal <= 0) {
            setResult(null); return;
            }
            if (dVal <= lVal) {
            setError('DCGL must be greater than LBGR.');
            setResult(null); return;
            }
            setError('');
            
            const z1_alpha = zScores[alpha];
            const z1_beta = zScores[beta];
            const delta = dVal - lVal;
            const rawRelShift = delta / sVal;
            const usedRelShift = rawRelShift > 3.0 ? 3.0 : rawRelShift;
            
            let Pr = 0;
            let N_raw = 0;
            let methodLabel = '';
            let samplesPerUnit = 0;
            let isWRS = false;
            
            if (backgroundPresence === 'insignificant') {
            methodLabel = 'No Background Correction (Sign Formula)';
            Pr = getNormalCDF(usedRelShift);
            if (Pr <= 0.5) { setError("Relative Shift too low."); setResult(null); return; }
            N_raw = Math.pow(z1_alpha + z1_beta, 2) / (4 * Math.pow(Pr - 0.5, 2));
            samplesPerUnit = Math.ceil(N_raw * 1.20);
            } else {
            isWRS = true;
            methodLabel = 'With Background Reference (WRS Formula)';
            Pr = getNormalCDF(usedRelShift / Math.sqrt(2));
            if (Pr <= 0.5) { setError("Relative Shift too low."); setResult(null); return; }
            N_raw = Math.pow(z1_alpha + z1_beta, 2) / (3 * Math.pow(Pr - 0.5, 2));
            const N_total_with_margin = N_raw * 1.20;
            samplesPerUnit = Math.ceil(N_total_with_margin / 2);
            }
            
            setResult({
            totalShift: delta,
            relativeShift: rawRelShift.toFixed(2),
            final_N: samplesPerUnit,
            methodLabel,
            isWRS
            });
            };
            
            const handleSaveToHistory = () => {
            if (result) {
            addHistory({
                id: Date.now(),
                type: 'MARSSIM Samples',
                icon: ICONS.calculator,
                inputs: `${result.methodLabel}, Δ/σ: ${result.relativeShift}`,
                result: `${result.final_N} samples`,
                view: VIEWS.MARSSIM_SAMPLES
            });
            addToast("Calculation saved to history!");
            }
            };
            
            React.useEffect(() => { handleCalculate(); }, [alpha, beta, sigma, dcgl, lbgr, cv, backgroundPresence]);
            
            return (
            <div className="p-4 animate-fade-in">
            <div className="max-w-md mx-auto bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">MARSSIM Samples Calculator</h2>
                    <ClearButton onClick={handleClearInputs} />
                </div>
            
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Is the Contaminant present in Background?</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="bgP" value="insignificant" checked={backgroundPresence === 'insignificant'} onChange={e => setBackgroundPresence(e.target.value)} className="text-sky-600"/>
                            <span className="text-sm font-medium">No (Use Sign Formula)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="bgP" value="significant" checked={backgroundPresence === 'significant'} onChange={e => setBackgroundPresence(e.target.value)} className="text-sky-600"/>
                            <span className="text-sm font-medium">Yes (Use WRS Formula)</span>
                        </label>
                    </div>
                </div>
            
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Type I Error (α)</label>
                            <select value={alpha} onChange={e => setAlpha(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                                {Object.keys(zScores).map(key => <option key={key} value={key}>{key}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Type II Error (β)</label>
                            <select value={beta} onChange={e => setBeta(e.target.value)} className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700">
                                {Object.keys(zScores).map(key => <option key={key} value={key}>{key}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Estimated Std. Deviation (σ)</label>
                            <input type="number" value={sigma} onChange={e => setSigma(e.target.value)} placeholder="in units of DCGL" className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">DCGL (Limit)</label>
                            <input type="number" value={dcgl} onChange={e => setDcgl(e.target.value)} placeholder="Cleanup limit" className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">LBGR (Mean)</label>
                            <input type="number" value={lbgr} onChange={e => setLbgr(e.target.value)} placeholder="Concentration that is 'clean'" className="w-full mt-1 p-2 rounded-md bg-slate-100 dark:bg-slate-700" />
                        </div>
                    </div>
            
                    <details className="p-3 my-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Scoping Data Helper
                        </summary>
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <label className="block text-xs font-medium">Coefficient of Variation (CV)</label>
                                    <input type="number" value={cv} onChange={e => setCv(e.target.value)} step="0.05" className="w-full mt-1 p-2 rounded-md bg-white dark:bg-slate-700" />
                                </div>
                                <button onClick={handleCalculateSigma} className="px-3 py-2 text-sm bg-slate-200 dark:bg-slate-600 rounded-md font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">
                                    Calculate σ
                                </button>
                            </div>
                            <button onClick={handleSetLbgr} className="w-full px-3 py-2 text-sm bg-slate-200 dark:bg-slate-600 rounded-md font-semibold hover:bg-slate-300 dark:hover:bg-slate-500">
                                Set LBGR to 50% of DCGL
                            </button>
                        </div>
                    </details>
            
                    <button onClick={handleSaveToHistory} className="w-full py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition">Save to Calculations</button>
            
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
                    {result && (
                        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg mt-4 space-y-3 text-center animate-fade-in">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-600">
                                <span className="text-sm font-bold text-slate-500 uppercase">Calculation Method</span>
                                <span className={`text-sm font-mono font-bold ${safeParseFloat(result.relativeShift) < 1 || safeParseFloat(result.relativeShift) > 3 ? 'text-amber-500' : 'text-green-600'}`}>Δ/σ: {result.relativeShift}</span>
                            </div>
            
                            <div className="py-2">
                                <p className="font-semibold block text-sm text-slate-500 dark:text-slate-400">
                                    {result.isWRS ? "Required Survey Points (N/2)" : "Required Survey Points (N)"}
                                </p>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">{result.final_N}</p>
                                    <CopyButton textToCopy={result.final_N} />
                                </div>
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">(Includes 20% MARSSIM adjustment)</p>
                            </div>
            
                            {result.isWRS && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200">
                                    <strong>WRS Requirement:</strong> You must also collect <strong>{result.final_N}</strong> samples in your Reference Area.
                                </div>
                            )}
            
                            <button
                                onClick={() => onTransferResults(result.final_N)}
                                className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm hover:shadow-md"
                            >
                                <Icon path={ICONS.map} className="w-5 h-5" />
                                Map These Points &rarr;
                            </button>
                        </div>
                    )}
                </div>
            </div>
            </div>
            );
            };
