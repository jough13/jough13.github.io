// public/js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, getDocs, addDoc, doc, getDoc, deleteDoc, updateDoc, writeBatch, query, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCxSXC52M4M176X_U_s5z6tDZsJbyXCdkM",
    authDomain: "radiography-tracker.firebaseapp.com",
    projectId: "radiography-tracker",
    storageBucket: "radiography-tracker.firebasestorage.app",
    messagingSenderId: "124869239575",
    appId: "1:124869239575:web:c90d4e0b688abab448cd52",
    measurementId: "G-XRJWGPV6E5"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
const storage = getStorage(app);
const auth = getAuth(app); 

// --- GLOBAL VARIABLES ---
window.calendar = null; 
window.isotopeChart = null; 
window.doseChart = null;
window.decayChartInstance = null; // NEW: Track the Decay Line Chart
window.currentOpenDoc = null; 
window.editModeId = null;
window.editModeCollection = null;
window.sigPadDirty = false; 
window.sketchPadDirty = false; // NEW: Track the Boundary Sketchpad
let html5QrCode = null; 

// --- LIVE DECAY ENGINE ---
function calculateCurrentActivity(initialActivity, isotope, activityDateStr, targetDateObj = null) {
    if (!initialActivity || !isotope || !activityDateStr) return 0;
    const initial = parseFloat(initialActivity);
    const actDate = new Date(activityDateStr);
    const targetDate = targetDateObj ? targetDateObj : new Date();
    
    const daysElapsed = (targetDate - actDate) / (1000 * 60 * 60 * 24);
    if (daysElapsed < 0) return initial.toFixed(2); 

    let halfLifeDays = 0;
    if (isotope === 'Ir-192') halfLifeDays = 73.83;
    else if (isotope === 'Co-60') halfLifeDays = 1925.28; 
    else if (isotope === 'Se-75') halfLifeDays = 119.78;
    else if (isotope === 'Yb-169') halfLifeDays = 32.02;
    else if (isotope === 'Cs-137') halfLifeDays = 10957.5; 
    else return initial.toFixed(2); 

    const currentActivity = initial * Math.pow(0.5, (daysElapsed / halfLifeDays));
    return currentActivity.toFixed(2);
}

// --- NEW: SOURCE DECAY FORECAST CHART ---
window.updateDecayChart = async function() {
    const ctx = document.getElementById('decay-chart');
    if(!ctx) return;
    
    const srcSnap = await getDocs(collection(db, 'sources'));
    const labels = [];
    const today = new Date();
    
    // Generate X-Axis Labels (Today + next 6 months)
    for(let i=0; i<=6; i++) {
        let d = new Date(); 
        d.setMonth(today.getMonth() + i);
        labels.push(d.toLocaleDateString(undefined, {month:'short', year:'2-digit'}));
    }
    
    const datasets = [];
    srcSnap.forEach(doc => {
        const data = doc.data();
        if(data.vault_status === 'DELETED') return;
        
        const points = [];
        for(let i=0; i<=6; i++) {
            let futureDate = new Date(); 
            futureDate.setMonth(today.getMonth() + i);
            points.push(calculateCurrentActivity(data.initial_activity_curies, data.isotope, data.activity_date, futureDate));
        }
        
        datasets.push({
            label: `${data.serial_number} (${data.isotope})`,
            data: points,
            tension: 0.3,
            borderWidth: 2
        });
    });

    // Add the 20 Ci Replacement Threshold Line
    datasets.push({
        label: 'Replacement Threshold (20 Ci)',
        data: [20, 20, 20, 20, 20, 20, 20],
        borderColor: '#d9534f',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        borderWidth: 2
    });

    if(window.decayChartInstance) window.decayChartInstance.destroy();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    window.decayChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: datasets },
        options: {
            scales: {
                y: { 
                    ticks: { color: isDark ? '#e0e0e0' : '#333' }, 
                    title: {display: true, text: 'Activity (Curies)', color: isDark ? '#e0e0e0' : '#333'} 
                },
                x: { ticks: { color: isDark ? '#e0e0e0' : '#333' } }
            },
            plugins: { legend: { labels: { color: isDark ? '#e0e0e0' : '#333' } } }
        }
    });
}

// --- BARCODE SCANNER LOGIC ---
window.startScanner = function(targetInputId) {
    document.getElementById('scanner-modal').style.display = 'flex';
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
        document.getElementById(targetInputId).value = decodedText;
        window.stopScanner();
    }).catch(err => {
        console.error("Scanner failed:", err);
        alert("Could not access camera.");
        window.stopScanner();
    });
}

window.stopScanner = function() {
    const modal = document.getElementById('scanner-modal');
    
    if (html5QrCode) {
        // We attempt to stop the camera, but FORCE the modal to hide even if it throws an error
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            modal.style.display = 'none';
        }).catch(err => {
            console.log("Camera was not fully running yet:", err);
            modal.style.display = 'none'; // FORCE HIDE
        });
    } else {
        modal.style.display = 'none';
    }
}

// --- LOADER LOGIC ---
function showLoader() { 
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'flex'; 
}
function hideLoader() { 
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'none'; 
}

// --- THEME LOGIC ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeButton('dark');
    }
}
window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
    if(window.isotopeChart) updateDashboard(); 
    if(window.doseChart) updateDoseDashboard(); 
    if(window.decayChartInstance) window.updateDecayChart();
}
function updateThemeButton(theme) {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}
initTheme(); 

// --- AUTHENTICATION & ROLE ENGINE ---
const ADMIN_EMAIL = "rso@shipyard.com"; 

onAuthStateChanged(auth, async (user) => {
    showLoader(); 
    const loginScreen = document.getElementById('login-screen');
    const appWrapper = document.getElementById('app-wrapper');
    const userDisplay = document.getElementById('user-display');
    
    if (user) {
        if(loginScreen) loginScreen.style.display = 'none';
        if(appWrapper) appWrapper.style.display = 'block';
        if(userDisplay) userDisplay.textContent = `👤 ${user.email}`;

        const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        
        document.querySelectorAll('.admin-only').forEach(el => {
            if (isAdmin) {
                el.style.display = ''; 
            } else {
                el.style.display = 'none'; 
            }
        });

        try {
            await startApplication();
        } catch (err) {
            console.error("App startup error:", err);
        } finally {
            setTimeout(() => {
                hideLoader();
                if (localStorage.getItem('hideDisclaimer') !== 'true') {
                    document.getElementById('disclaimer-modal').style.display = 'flex';
                }
            }, 500); 
        }
        
    } else {
        hideLoader();
        if(loginScreen) loginScreen.style.display = 'flex';
        if(appWrapper) appWrapper.style.display = 'none';
    }
});

const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        showLoader(); 
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const rememberCheckbox = document.getElementById('login-remember');
        const remember = rememberCheckbox ? rememberCheckbox.checked : false;

        try {
            const persistenceType = remember ? browserLocalPersistence : browserSessionPersistence;
            await setPersistence(auth, persistenceType);
            
            await signInWithEmailAndPassword(auth, email, pass);
            document.getElementById('login-error').style.display = 'none';
        } catch(err) {
            document.getElementById('login-error').style.display = 'block';
            hideLoader(); 
        }
    });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => { signOut(auth); });
}

// --- EDIT & CLONE ENGINE ---
const formMaps = {
    'equipment': { formId: 'equipment-form', fields: { type: 'eq-type', serial_number: 'eq-serial', calibration_due_date: 'eq-cal-date' } },
    'sources': { formId: 'sources-form', fields: { serial_number: 'src-serial', isotope: 'src-isotope', initial_activity_curies: 'src-activity', activity_date: 'src-date', last_leak_test_date: 'src-leak-test' } },
    'cameras': { formId: 'cameras-form', fields: { make_model: 'cam-model', serial_number: 'cam-serial', du_leak_test_date: 'cam-du-date', annual_maintenance_date: 'cam-maint-date' } },
    'personnel': { formId: 'personnel-form', fields: { full_name: 'per-name', cert_number: 'per-cert', trust_authorization_date: 'per-trust', hazmat_expiration: 'per-hazmat', last_6mo_eval_date: 'per-eval', last_annual_drill_date: 'per-drill' } },
    'field_evaluations': { formId: 'eval-form', fields: { eval_date: 'ev-date', radiographer_evaluated: 'ev-rad', evaluator: 'ev-evaluator', duties_performed: 'ev-duties', comments: 'ev-comments' }, nested: { checklist: { followed_procedures: 'ev-c1', emergency_knowledge: 'ev-c2', instrument_checks: 'ev-c3', instrument_use: 'ev-c4', dosimetry_use: 'ev-c5', pri_checks: 'ev-c6', key_control: 'ev-c7', boundary_control: 'ev-c8', alara_used: 'ev-c9', logs_completed: 'ev-c10' } } },
    'work_plans': { formId: 'work-plans-form', fields: { job_number: 'wp-job', location_type: 'wp-loc-type', location: 'wp-location', planned_date: 'wp-date', source_id: 'wp-source', collimator_used: 'wp-collimator', calculated_boundary_mr_hr: 'wp-boundary', pri_entrance_tested: 'wp-pri-entrance', pri_alarm_tested: 'wp-pri-alarm' } },
    'transport_logs': { formId: 'transport-form', fields: { transport_date: 'tr-date', camera_sn: 'tr-camera', destination: 'tr-destination', max_contact_reading: 'tr-max-contact', transport_index: 'tr-ti', over_water_transport: 'tr-water' } },
    'dosimetry_logs': { formId: 'dosimetry-form', fields: { personnel_name: 'dl-name', dosimeter_serial: 'dl-serial', ratemeter_check_performed: 'dl-ratemeter-check', initial_reading: 'dl-initial', final_reading: 'dl-final' } },
    'utilization_logs': { formId: 'utilization-form', fields: { job_reference: 'ul-job', radiographer_in_charge: 'ul-ric', participants: 'ul-participants', survey_meter_serial: 'ul-meter', meter_response_checked: 'ul-response', max_survey_reading: 'ul-max-survey' } },
    'post_job_reports': { formId: 'reports-form', fields: { completed_by: 'pj-completed-by', source_secured: 'pj-source-secured', vault_verified: 'pj-vault-verified' } }
};

window.editRecord = function() {
    if(!window.currentOpenDoc || !window.currentOpenDoc.fullData) return;
    populateFormForEditClone(window.currentOpenDoc, true);
}

window.cloneRecord = function() {
    if(!window.currentOpenDoc || !window.currentOpenDoc.fullData) return;
    populateFormForEditClone(window.currentOpenDoc, false);
}

function populateFormForEditClone(docObj, isEdit) {
    const { collection: col, fullData: data, id } = docObj;
    const map = formMaps[col];
    if(!map) return;

    const sectionMap = {
        'equipment': 'equipment', 'sources': 'equipment', 'cameras': 'equipment',
        'personnel': 'personnel', 'field_evaluations': 'personnel',
        'work_plans': 'planning',
        'transport_logs': 'execution', 'dosimetry_logs': 'execution', 'utilization_logs': 'execution',
        'post_job_reports': 'reporting'
    };
    window.showSection(sectionMap[col]);
    window.closeModal();

    if(isEdit) {
        window.editModeId = id;
        window.editModeCollection = col;
    } else {
        window.editModeId = null;
        window.editModeCollection = null;
    }

    const form = document.getElementById(map.formId);
    const btn = form.querySelector('button[type="submit"]');
    if(!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
    btn.textContent = isEdit ? '💾 Update Record' : '📄 Create Clone';
    btn.style.backgroundColor = isEdit ? '#f0ad4e' : '#5bc0de';
    btn.style.color = isEdit ? '#333' : '#fff';

    for (const [dbKey, htmlId] of Object.entries(map.fields)) {
        const el = document.getElementById(htmlId);
        if(el && data[dbKey] !== undefined) {
            if(el.type === 'checkbox') el.checked = data[dbKey];
            else el.value = data[dbKey];
        }
    }

    if(map.nested) {
        for (const [nestedObjKey, nestedMap] of Object.entries(map.nested)) {
            if(data[nestedObjKey]) {
                for (const [dbKey, htmlId] of Object.entries(nestedMap)) {
                    const el = document.getElementById(htmlId);
                    if(el && data[nestedObjKey][dbKey] !== undefined) {
                        if(el.type === 'checkbox') el.checked = data[nestedObjKey][dbKey];
                        else el.value = data[nestedObjKey][dbKey];
                    }
                }
            }
        }
    }

    if(col === 'work_plans') window.togglePRI();

    setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        form.style.transition = 'box-shadow 0.5s';
        form.style.boxShadow = isEdit ? '0 0 15px #f0ad4e' : '0 0 15px #5bc0de';
        setTimeout(() => { form.style.boxShadow = 'none'; }, 2000);
    }, 300);
}

function resetFormButton(collectionName) {
    const map = formMaps[collectionName];
    if(map) {
        const form = document.getElementById(map.formId);
        const btn = form.querySelector('button[type="submit"]');
        if(btn && btn.dataset.originalText) {
            btn.textContent = btn.dataset.originalText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }
        form.style.boxShadow = 'none';
    }
}

// --- DIGITAL SIGNATURE ENGINE ---
function initSignaturePad() {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0, lastY = 0;

    // Draw settings
    ctx.strokeStyle = '#005A9C'; 
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault(); 
        
        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        [lastX, lastY] = [x, y];
        window.sigPadDirty = true; 
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
    });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [lastX, lastY] = [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
    }, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', () => isDrawing = false);
}

window.clearSignature = function() {
    const canvas = document.getElementById('sig-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.sigPadDirty = false;
    }
}

// --- NEW: BOUNDARY SKETCHPAD ENGINE ---
function initSketchPad() {
    const canvas = document.getElementById('sketch-canvas');
    if (!canvas) return;
    
    // Set internal resolution to match container to prevent stretching
    canvas.width = canvas.parentElement.clientWidth - 20; 
    
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = '#d9534f'; // Red ink for boundary lines
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault(); 
        
        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        [lastX, lastY] = [x, y];
        window.sketchPadDirty = true; 
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        [lastX, lastY] = [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
    });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        [lastX, lastY] = [(e.touches[0].clientX - rect.left) * scaleX, (e.touches[0].clientY - rect.top) * scaleY];
    }, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', () => isDrawing = false);
}

window.clearSketch = function() {
    const canvas = document.getElementById('sketch-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.sketchPadDirty = false;
    }
}


// --- APP INITIALIZATION ---
async function startApplication() {
    window.showSection('dashboard');
    initSignaturePad();
    initSketchPad();
    await loadAllData();
    setupEventListeners();
    populateSourceDropdown(); 
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => console.log("Offline Mode Active")).catch(e => console.log(e));
    }
}

async function uploadFile(file, folderPath) {
    if (!file) return null;
    try {
        const fileRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file. Check console.");
        return null;
    }
}

function setupEventListeners() {
    
    const ackCheckbox = document.getElementById('ack-checkbox');
    const proceedBtn = document.getElementById('disclaimer-proceed-btn');
    const dontShowCheckbox = document.getElementById('dont-show-checkbox');

    if (ackCheckbox && proceedBtn) {
        ackCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                proceedBtn.disabled = false;
                proceedBtn.style.opacity = '1';
                proceedBtn.style.cursor = 'pointer';
            } else {
                proceedBtn.disabled = true;
                proceedBtn.style.opacity = '0.5';
                proceedBtn.style.cursor = 'not-allowed';
            }
        });
    }

    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            if (dontShowCheckbox && dontShowCheckbox.checked) {
                localStorage.setItem('hideDisclaimer', 'true');
            }
            document.getElementById('disclaimer-modal').style.display = 'none';
        });
    }

    Object.values(formMaps).forEach(map => {
        const form = document.getElementById(map.formId);
        if(form) {
            form.addEventListener('reset', () => {
                if (window.editModeId && window.editModeCollection && formMaps[window.editModeCollection] && formMaps[window.editModeCollection].formId === map.formId) {
                    window.editModeId = null;
                    window.editModeCollection = null;
                }
                const btn = form.querySelector('button[type="submit"]');
                if(btn && btn.dataset.originalText) {
                    btn.textContent = btn.dataset.originalText;
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                }
                form.style.boxShadow = 'none';
                if(map.formId === 'reports-form') window.clearSignature(); 
                if(map.formId === 'work-plans-form') window.clearSketch(); 
            });
        }
    });

    // --- ASSET TRACKING (VAULT CHECK-IN/OUT) FORM LISTENER ---
    const assetForm = document.getElementById('asset-tracking-form');
    if (assetForm) {
        // Toggle the Radiographer/Job fields based on radio button
        const radios = assetForm.querySelectorAll('input[name="trk-action"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('trk-details-group').style.display = e.target.value === 'checkout' ? 'grid' : 'none';
            });
        });

        assetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const action = assetForm.querySelector('input[name="trk-action"]:checked').value;
            const camSN = document.getElementById('trk-cam').value.trim();
            const srcSN = document.getElementById('trk-src').value.trim();
            const user = document.getElementById('trk-user').value.trim();
            const job = document.getElementById('trk-job').value.trim();

            const status = action === 'checkout' ? 'OUT' : 'IN';

            try {
                // Update Camera Status
                const camQ = query(collection(db, 'cameras'), where('serial_number', '==', camSN));
                const camSnap = await getDocs(camQ);
                camSnap.forEach(async (d) => {
                    await updateDoc(doc(db, 'cameras', d.id), { vault_status: status, current_job: job, current_user: user });
                });

                // Update Source Status
                const srcQ = query(collection(db, 'sources'), where('serial_number', '==', srcSN));
                const srcSnap = await getDocs(srcQ);
                srcSnap.forEach(async (d) => {
                    await updateDoc(doc(db, 'sources', d.id), { vault_status: status, current_job: job, current_user: user });
                });

                assetForm.reset();
                // Ensure UI toggles back correctly after reset
                document.getElementById('trk-details-group').style.display = 'grid';
                await updateDeployedAssetsDashboard();
            } catch (err) {
                console.error("Asset Tracking Error:", err);
                alert("Failed to update vault tracking.");
            } finally {
                hideLoader();
            }
        });
    }

    const equipmentForm = document.getElementById('equipment-form');
    if (equipmentForm) {
        equipmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const fileInput = document.getElementById('eq-cert');
            const file = fileInput.files[0];
            const certUrl = file ? await uploadFile(file, 'equipment_certs') : null;
            const data = {
                type: document.getElementById('eq-type').value,
                serial_number: document.getElementById('eq-serial').value,
                calibration_due_date: document.getElementById('eq-cal-date').value,
                maintenance_status: 'Operational',
                certificate_url: certUrl
            };
            await addData('equipment', data);
            equipmentForm.reset();
            await fetchData('equipment', 'equipment-list');
            window.updateDashboard();
            window.renderCalendar(); 
            hideLoader();
        });
    }

    const sourcesForm = document.getElementById('sources-form');
    if (sourcesForm) {
        sourcesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const fileInput = document.getElementById('src-cert');
            const file = fileInput.files[0];
            const certUrl = file ? await uploadFile(file, 'source_certs') : null;
            const data = {
                serial_number: document.getElementById('src-serial').value,
                isotope: document.getElementById('src-isotope').value,
                initial_activity_curies: parseFloat(document.getElementById('src-activity').value),
                activity_date: document.getElementById('src-date').value,
                last_leak_test_date: document.getElementById('src-leak-test').value,
                current_location: 'Storage Vault',
                vault_status: 'IN', // Default to IN when created
                certificate_url: certUrl
            };
            await addData('sources', data);
            sourcesForm.reset();
            await fetchData('sources', 'sources-list');
            populateSourceDropdown(); 
            window.updateDashboard();
            window.updateDecayChart();
            await updateDeployedAssetsDashboard();
            hideLoader();
        });
    }

    const camerasForm = document.getElementById('cameras-form');
    if (camerasForm) {
        camerasForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const data = {
                make_model: document.getElementById('cam-model').value,
                serial_number: document.getElementById('cam-serial').value,
                du_leak_test_date: document.getElementById('cam-du-date').value,
                annual_maintenance_date: document.getElementById('cam-maint-date').value,
                vault_status: 'IN', // Default to IN when created
                timestamp: new Date().toISOString()
            };
            await addData('cameras', data);
            camerasForm.reset();
            await fetchData('cameras', 'cameras-list');
            window.updateDashboard();
            window.renderCalendar();
            await updateDeployedAssetsDashboard();
            hideLoader();
        });
    }

    const personnelForm = document.getElementById('personnel-form');
    if (personnelForm) {
        personnelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const data = {
                full_name: document.getElementById('per-name').value,
                cert_number: document.getElementById('per-cert').value,
                trust_authorization_date: document.getElementById('per-trust').value,
                hazmat_expiration: document.getElementById('per-hazmat').value,
                last_6mo_eval_date: document.getElementById('per-eval').value,
                last_annual_drill_date: document.getElementById('per-drill').value,
                logged_time: new Date().toISOString()
            };
            await addData('personnel', data);
            personnelForm.reset();
            await fetchData('personnel', 'personnel-list');
            window.updateDashboard();
            window.renderCalendar();
            hideLoader();
        });
    }

    const evalForm = document.getElementById('eval-form');
    if (evalForm) {
        evalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const data = {
                eval_date: document.getElementById('ev-date').value,
                radiographer_evaluated: document.getElementById('ev-rad').value,
                evaluator: document.getElementById('ev-evaluator').value,
                duties_performed: document.getElementById('ev-duties').value,
                comments: document.getElementById('ev-comments').value,
                checklist: {
                    followed_procedures: document.getElementById('ev-c1').checked,
                    emergency_knowledge: document.getElementById('ev-c2').checked,
                    instrument_checks: document.getElementById('ev-c3').checked,
                    instrument_use: document.getElementById('ev-c4').checked,
                    dosimetry_use: document.getElementById('ev-c5').checked,
                    pri_checks: document.getElementById('ev-c6').checked,
                    key_control: document.getElementById('ev-c7').checked,
                    boundary_control: document.getElementById('ev-c8').checked,
                    alara_used: document.getElementById('ev-c9').checked,
                    logs_completed: document.getElementById('ev-c10').checked
                },
                timestamp: new Date().toISOString()
            };
            await addData('field_evaluations', data);
            evalForm.reset();
            await fetchData('field_evaluations', 'eval-list');
            hideLoader();
        });
    }

    const workPlansForm = document.getElementById('work-plans-form');
    if (workPlansForm) {
        workPlansForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const fileInput = document.getElementById('wp-diagram');
            const file = fileInput.files[0];
            const diagramUrl = file ? await uploadFile(file, 'work_plan_diagrams') : null;

            const locType = document.getElementById('wp-loc-type').value;

            // Grab the Sketchpad Base64 data
            const sketchCanvas = document.getElementById('sketch-canvas');
            const sketchData = (sketchCanvas && window.sketchPadDirty) ? sketchCanvas.toDataURL('image/png') : null;

            const data = {
                job_number: document.getElementById('wp-job').value,
                location_type: locType,
                location: document.getElementById('wp-location').value,
                planned_date: document.getElementById('wp-date').value,
                source_id: document.getElementById('wp-source').value,
                collimator_used: document.getElementById('wp-collimator').checked,
                calculated_boundary_mr_hr: locType === 'temporary' ? parseFloat(document.getElementById('wp-boundary').value) : 'N/A (PRI)',
                pri_entrance_tested: locType === 'pri' ? document.getElementById('wp-pri-entrance').checked : 'N/A',
                pri_alarm_tested: locType === 'pri' ? document.getElementById('wp-pri-alarm').checked : 'N/A',
                rso_approval_status: 'Pending',
                raso_approval_status: 'Pending',
                created_at: new Date().toISOString(),
                diagram_url: diagramUrl,
                sketch_data: sketchData
            };
            await addData('work_plans', data);
            workPlansForm.reset();
            window.clearSketch();
            window.togglePRI(); 
            await fetchData('work_plans', 'work-plans-list');
            window.updateDashboard();
            window.renderCalendar();
            hideLoader();
        });
    }

    const transportForm = document.getElementById('transport-form');
    if (transportForm) {
        transportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const data = {
                transport_date: document.getElementById('tr-date').value,
                camera_sn: document.getElementById('tr-camera').value,
                destination: document.getElementById('tr-destination').value,
                max_contact_reading: parseFloat(document.getElementById('tr-max-contact').value),
                transport_index: parseFloat(document.getElementById('tr-ti').value),
                over_water_transport: document.getElementById('tr-water').checked,
                timestamp: new Date().toISOString()
            };
            await addData('transport_logs', data);
            transportForm.reset();
            await fetchData('transport_logs', 'transport-list');
            hideLoader();
        });
    }

    const dosimetryForm = document.getElementById('dosimetry-form');
    if (dosimetryForm) {
        dosimetryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const data = {
                personnel_name: document.getElementById('dl-name').value,
                dosimeter_serial: document.getElementById('dl-serial').value,
                ratemeter_check_performed: document.getElementById('dl-ratemeter-check').checked,
                initial_reading: parseFloat(document.getElementById('dl-initial').value),
                final_reading: parseFloat(document.getElementById('dl-final').value),
                logged_time: new Date().toISOString()
            };
            await addData('dosimetry_logs', data);
            dosimetryForm.reset();
            await fetchData('dosimetry_logs', 'dosimetry-list');
            updateDoseDashboard(); 
            hideLoader();
        });
    }

    const utilizationForm = document.getElementById('utilization-form');
    if (utilizationForm) {
        utilizationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            const data = {
                job_reference: document.getElementById('ul-job').value,
                radiographer_in_charge: document.getElementById('ul-ric').value,
                participants: document.getElementById('ul-participants').value,
                survey_meter_serial: document.getElementById('ul-meter').value,
                meter_response_checked: document.getElementById('ul-response').checked,
                max_survey_reading: parseFloat(document.getElementById('ul-max-survey').value),
                logged_time: new Date().toISOString()
            };
            await addData('utilization_logs', data);
            utilizationForm.reset();
            await fetchData('utilization_logs', 'utilization-list');
            hideLoader();
        });
    }

    const reportsForm = document.getElementById('reports-form');
    if (reportsForm) {
        reportsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoader();
            
            const canvas = document.getElementById('sig-canvas');
            const sigData = (canvas && window.sigPadDirty) ? canvas.toDataURL('image/png') : null;

            const data = {
                completed_by: document.getElementById('pj-completed-by').value,
                source_secured: document.getElementById('pj-source-secured').checked,
                vault_verified: document.getElementById('pj-vault-verified').checked,
                daily_log_generated: true, 
                completion_time: new Date().toISOString(),
                signature_data: sigData
            };
            await addData('post_job_reports', data);
            reportsForm.reset();
            window.clearSignature();
            await fetchData('post_job_reports', 'reports-list');
            hideLoader();
        });
    }

    const sourceSelect = document.getElementById('wp-source');
    const collimatorCheck = document.getElementById('wp-collimator');
    if(sourceSelect) sourceSelect.addEventListener('change', calculateBoundary);
    if(collimatorCheck) collimatorCheck.addEventListener('change', calculateBoundary);
}

async function addData(collectionName, data) {
    try {
        if (window.editModeId && window.editModeCollection === collectionName) {
            const existingDoc = await getDoc(doc(db, collectionName, window.editModeId));
            if(existingDoc.exists()) {
                const existingData = existingDoc.data();
                for (const key in data) {
                    if (key.includes('_url') && data[key] === null) {
                        data[key] = existingData[key];
                    }
                    if (key === 'signature_data' && data[key] === null && existingData[key]) {
                        data[key] = existingData[key];
                    }
                    if (key === 'sketch_data' && data[key] === null && existingData[key]) {
                        data[key] = existingData[key];
                    }
                }
            }
            await updateDoc(doc(db, collectionName, window.editModeId), data);
            window.editModeId = null;
            window.editModeCollection = null;
            resetFormButton(collectionName);
        } else {
            if(!data.timestamp) data.timestamp = new Date().toISOString();
            await addDoc(collection(db, collectionName), data);
        }
    } catch (err) {
        console.error(`Error saving document:`, err);
        alert(`Failed to save record.`);
    }
}

// --- DEPLOYED ASSETS DASHBOARD ---
async function updateDeployedAssetsDashboard() {
    const list = document.getElementById('deployed-assets-list');
    const badge = document.getElementById('out-count');
    if (!list) return;

    list.innerHTML = '';
    let outCount = 0;

    try {
        // Find Cameras checked out
        const camQ = query(collection(db, 'cameras'), where('vault_status', '==', 'OUT'));
        const camSnap = await getDocs(camQ);
        camSnap.forEach(d => {
            const data = d.data();
            list.innerHTML += `<li style="padding: 10px;">📸 Camera <b>${data.serial_number}</b> deployed to ${data.current_user || 'Unknown'} (Job: ${data.current_job || 'Unknown'})</li>`;
            outCount++;
        });

        // Find Sources checked out
        const srcQ = query(collection(db, 'sources'), where('vault_status', '==', 'OUT'));
        const srcSnap = await getDocs(srcQ);
        srcSnap.forEach(d => {
            const data = d.data();
            list.innerHTML += `<li style="padding: 10px;">☢️ Source <b>${data.serial_number} (${data.isotope})</b> deployed to ${data.current_user || 'Unknown'} (Job: ${data.current_job || 'Unknown'})</li>`;
            outCount++;
        });

        if (outCount === 0) {
            list.innerHTML = '<li style="padding: 10px; color: #5cb85c;">✅ All assets securely in vault.</li>';
        }
        
        if(badge) {
            badge.textContent = `${outCount} Deployed`;
            badge.style.background = outCount > 0 ? '#d9534f' : '#5cb85c';
            badge.style.color = 'white';
        }

    } catch (err) {
        console.error("Failed to load deployed assets:", err);
    }
}

// --- DOSE AGGREGATION & CHARTING ---
async function updateDoseDashboard() {
    const logsSnap = await getDocs(collection(db, 'dosimetry_logs'));
    const stats = {};
    
    logsSnap.forEach(d => {
        const log = d.data();
        const name = log.personnel_name;
        const dose = (log.final_reading - log.initial_reading);
        if(!stats[name]) stats[name] = 0;
        stats[name] += dose;
    });

    const list = document.getElementById('dose-summary-list');
    const alertList = document.getElementById('dose-alerts');
    if(!list) return;
    
    list.innerHTML = ''; 
    alertList.innerHTML = '';
    
    const names = Object.keys(stats);
    const doseValues = Object.values(stats);

    names.forEach(name => {
        const dose = stats[name];
        list.innerHTML += `<li>${name}: <strong>${dose.toFixed(2)} mRem</strong></li>`;
        if(dose > 1000) {
            alertList.innerHTML += `<li style="color: #d9534f;">🚨 CRITICAL: ${name} is over 1000mRem Administrative Limit!</li>`;
        }
    });

    if (alertList.innerHTML === '') {
        alertList.innerHTML = '<li style="color: #5cb85c; background: transparent; border: none;">✅ No active exposure warnings.</li>';
    }

    const ctx = document.getElementById('dose-chart');
    if(ctx) {
        if(window.doseChart) window.doseChart.destroy();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        window.doseChart = new Chart(ctx, {
            type: 'bar',
            data: { 
                labels: names, 
                datasets: [{ 
                    label: 'Cumulative Dose (mRem)', 
                    data: doseValues, 
                    backgroundColor: '#005A9C' 
                }] 
            },
            options: { 
                scales: { 
                    y: { beginAtZero: true, ticks: { color: isDark ? '#e0e0e0' : '#333' } },
                    x: { ticks: { color: isDark ? '#e0e0e0' : '#333' } }
                },
                plugins: { legend: { labels: { color: isDark ? '#e0e0e0' : '#333' } } }
            }
        });
    }
}

// --- UI TOGGLES ---
window.showSection = function(sectionId) {
    document.querySelectorAll('.module').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }
    if(sectionId === 'calendar-view' && window.calendar) {
        setTimeout(() => { window.calendar.render(); }, 100);
    }
}

window.togglePRI = function() {
    const locType = document.getElementById('wp-loc-type').value;
    const tempWrapper = document.getElementById('wp-temp-wrapper');
    const priWrapper = document.getElementById('wp-pri-wrapper');
    
    if(locType === 'pri') {
        tempWrapper.style.display = 'none';
        priWrapper.style.display = 'flex';
        document.getElementById('wp-boundary').value = '';
    } else {
        tempWrapper.style.display = 'flex';
        priWrapper.style.display = 'none';
        calculateBoundary(); 
    }
}

async function loadAllData() {
    await Promise.all([
        fetchData('equipment', 'equipment-list'),
        fetchData('sources', 'sources-list'),
        fetchData('cameras', 'cameras-list'),
        fetchData('personnel', 'personnel-list'), 
        fetchData('field_evaluations', 'eval-list'),
        fetchData('work_plans', 'work-plans-list'),
        fetchData('transport_logs', 'transport-list'),
        fetchData('dosimetry_logs', 'dosimetry-list'),
        fetchData('utilization_logs', 'utilization-list'),
        fetchData('post_job_reports', 'reports-list')
    ]);
    window.updateDashboard(); 
    window.renderCalendar();
    window.updateDecayChart(); // Build forecast curve
    await updateDoseDashboard(); 
    await updateDeployedAssetsDashboard(); 
}

async function fetchData(collectionName, listId) {
    const ul = document.getElementById(listId);
    if (!ul) return;
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        ul.innerHTML = '';
        if (querySnapshot.empty) {
            ul.innerHTML = `<li style="background: transparent; border: none;">No data found in ${collectionName.replace('_', ' ')}.</li>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const li = document.createElement('li');
            let displayText = '';
            let docUrl = null;

            let recordDate = item.timestamp || item.created_at || item.logged_time || item.completion_time || item.activity_date || item.planned_date || item.transport_date || item.eval_date || '';
            if (recordDate) {
                li.setAttribute('data-date', recordDate.split('T')[0]); 
            }

            if (collectionName === 'equipment') {
                displayText = `${item.type?.toUpperCase() || 'UNKNOWN TYPE'} - Serial: ${item.serial_number} (Cal Due: ${item.calibration_due_date})`;
                docUrl = item.certificate_url;
            } else if (collectionName === 'sources') {
                const currentAct = calculateCurrentActivity(item.initial_activity_curies, item.isotope, item.activity_date);
                const statusTag = item.vault_status === 'OUT' ? ' [🦺 DEPLOYED]' : '';
                displayText = `${item.isotope} (SN: ${item.serial_number}) - Initial: ${item.initial_activity_curies} Ci | CURRENT: ${currentAct} Ci${statusTag}`;
                if(item.vault_status === 'OUT') li.style.borderLeft = "5px solid #f0ad4e";
                docUrl = item.certificate_url;
            } else if (collectionName === 'cameras') {
                const statusTag = item.vault_status === 'OUT' ? ' [🦺 DEPLOYED]' : '';
                displayText = `${item.make_model} (SN: ${item.serial_number}) - Maint: ${item.annual_maintenance_date}${statusTag}`;
                if(item.vault_status === 'OUT') li.style.borderLeft = "5px solid #f0ad4e";
            } else if (collectionName === 'personnel') {
                displayText = `${item.full_name} (Cert: ${item.cert_number}) - Eval: ${item.last_6mo_eval_date}`;
            } else if (collectionName === 'field_evaluations') {
                displayText = `${item.eval_date}: ${item.radiographer_evaluated} evaluated by ${item.evaluator}`;
            } else if (collectionName === 'work_plans') {
                displayText = `Job ${item.job_number} - Location: ${item.location} (${item.location_type}) on ${item.planned_date}`;
                docUrl = item.diagram_url;
            } else if (collectionName === 'transport_logs') {
                displayText = `${item.transport_date}: Camera ${item.camera_sn} to ${item.destination} (TI: ${item.transport_index})`;
            } else if (collectionName === 'dosimetry_logs') {
                displayText = `${item.personnel_name} (Dosimeter: ${item.dosimeter_serial}) - ${item.initial_reading}mR to ${item.final_reading}mR`;
            } else if (collectionName === 'utilization_logs') {
                displayText = `Job ${item.job_reference} - RIC: ${item.radiographer_in_charge} (Max Survey: ${item.max_survey_reading} mR/hr)`;
            } else if (collectionName === 'post_job_reports') {
                const date = item.completion_time ? new Date(item.completion_time).toLocaleDateString() : 'Unknown Date';
                displayText = `Report by ${item.completed_by} on ${date} (Source Secured: ${item.source_secured ? 'Yes' : 'No'})`;
            } else {
                const values = Object.values(item).slice(0, 3).join(' - ');
                displayText = `ID ${doc.id}: ${values}`;
            }

            li.textContent = displayText;
            li.setAttribute('onclick', `openModal('${collectionName}', '${doc.id}')`);

            if (docUrl) {
                const link = document.createElement('a');
                link.href = docUrl;
                link.target = "_blank";
                link.textContent = " [View Document]";
                link.style.fontSize = "0.85em";
                link.style.color = "#005A9C";
                link.onclick = (e) => e.stopPropagation(); 
                li.appendChild(link);
            }
            ul.appendChild(li);
        });
    } catch (err) {
        console.error(`Error fetching collection ${collectionName}:`, err);
        ul.innerHTML = `<li style="color:red; background: transparent; border: none;">Error loading data.</li>`;
    }
}

async function populateSourceDropdown() {
    const sourceSelect = document.getElementById('wp-source');
    if (!sourceSelect) return;
    try {
        const querySnapshot = await getDocs(collection(db, 'sources'));
        sourceSelect.innerHTML = '<option value="">Select an active source...</option>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const currentAct = calculateCurrentActivity(data.initial_activity_curies, data.isotope, data.activity_date);
            sourceSelect.innerHTML += `
                <option value="${doc.id}" data-activity="${currentAct}" data-isotope="${data.isotope}">
                    ${data.isotope} (SN: ${data.serial_number}) - ${currentAct} Ci (Current)
                </option>`;
        });
    } catch (err) {
        console.error("Error loading sources for dropdown:", err);
    }
}

function calculateBoundary() {
    const sourceSelect = document.getElementById('wp-source');
    const boundaryInput = document.getElementById('wp-boundary');
    const collimatorChecked = document.getElementById('wp-collimator').checked;

    if(!sourceSelect || !sourceSelect.value || !boundaryInput) return;

    const selectedOption = sourceSelect.options[sourceSelect.selectedIndex];
    const activity = parseFloat(selectedOption.getAttribute('data-activity'));
    const isotope = selectedOption.getAttribute('data-isotope');

    let gammaConstant = 5200; 
    if(isotope === 'Co-60') gammaConstant = 14000;

    let intensityAt1Ft = activity * gammaConstant;
    if(collimatorChecked) {
        intensityAt1Ft = intensityAt1Ft * 0.1;
    }

    const targetRate = 2.0; 
    const distanceFeet = Math.sqrt(intensityAt1Ft / targetRate);
    boundaryInput.value = distanceFeet.toFixed(1); 
}

// --- FULLCALENDAR INTEGRATION ---
window.renderCalendar = async function() {
    const calendarEl = document.getElementById('calendar');
    if(!calendarEl) return;

    let events = [];

    try {
        const wpSnap = await getDocs(collection(db, 'work_plans'));
        wpSnap.forEach(doc => {
            const data = doc.data();
            if(data.planned_date) {
                events.push({ 
                    title: `Job: ${data.job_number}`, 
                    start: data.planned_date, 
                    color: '#005A9C',
                    extendedProps: { collection: 'work_plans', docId: doc.id } 
                });
            }
        });

        const eqSnap = await getDocs(collection(db, 'equipment'));
        eqSnap.forEach(doc => {
            const data = doc.data();
            if(data.calibration_due_date) {
                events.push({ 
                    title: `Cal Due: ${data.serial_number}`, 
                    start: data.calibration_due_date, 
                    color: '#f0ad4e',
                    extendedProps: { collection: 'equipment', docId: doc.id } 
                });
            }
        });

        const camSnap = await getDocs(collection(db, 'cameras'));
        camSnap.forEach(doc => {
            const data = doc.data();
            if(data.annual_maintenance_date) {
                let due = new Date(data.annual_maintenance_date);
                due.setFullYear(due.getFullYear() + 1);
                events.push({ 
                    title: `Maint Due: Cam ${data.serial_number}`, 
                    start: due.toISOString().split('T')[0], 
                    color: '#d9534f',
                    extendedProps: { collection: 'cameras', docId: doc.id } 
                });
            }
        });

        const perSnap = await getDocs(collection(db, 'personnel'));
        perSnap.forEach(doc => {
            const data = doc.data();
            if(data.last_6mo_eval_date) {
                let due = new Date(data.last_6mo_eval_date);
                due.setMonth(due.getMonth() + 6); 
                events.push({ 
                    title: `Eval Exp: ${data.full_name.split(' ')[0]}`, 
                    start: due.toISOString().split('T')[0], 
                    color: '#d9534f',
                    extendedProps: { collection: 'personnel', docId: doc.id } 
                });
            }
        });

    } catch(err) {
        console.error("Error loading calendar events:", err);
    }

    if(window.calendar) {
        window.calendar.destroy(); 
    }

    window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listWeek'
        },
        events: events,
        height: 650,
        eventClick: function(info) {
            const props = info.event.extendedProps;
            if(props.collection && props.docId) {
                window.openModal(props.collection, props.docId);
            }
        },
        eventMouseEnter: function(info) {
            info.el.style.cursor = 'pointer';
        }
    });
}

// --- COMMAND CENTER DASHBOARD ---
window.updateDashboard = async function() {
    try {
        const wpSnap = await getDocs(collection(db, 'work_plans'));
        const statWorkPlans = document.getElementById('stat-work-plans');
        if(statWorkPlans) statWorkPlans.textContent = wpSnap.size;

        const srcSnap = await getDocs(collection(db, 'sources'));
        const statSources = document.getElementById('stat-sources');
        if(statSources) statSources.textContent = srcSnap.size;

        let ir192 = 0, co60 = 0, se75 = 0, yb169 = 0;
        srcSnap.forEach(doc => {
            const iso = doc.data().isotope;
            if(iso === 'Ir-192') ir192++;
            if(iso === 'Co-60') co60++;
            if(iso === 'Se-75') se75++;
            if(iso === 'Yb-169') yb169++;
        });

        const ctx = document.getElementById('isotope-chart');
        if(ctx) {
            if(window.isotopeChart) window.isotopeChart.destroy(); 
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            window.isotopeChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Ir-192', 'Co-60', 'Se-75', 'Yb-169'],
                    datasets: [{
                        data: [ir192, co60, se75, yb169],
                        backgroundColor: ['#005A9C', '#d9534f', '#f0ad4e', '#5cb85c'],
                        borderWidth: 1,
                        borderColor: isDark ? '#1e1e1e' : '#fff'
                    }]
                },
                options: { plugins: { legend: { labels: { color: isDark ? '#e0e0e0' : '#333' } } } }
            });
        }

        const alertList = document.getElementById('alert-list');
        if(!alertList) return;
        
        alertList.innerHTML = '';
        let alertCount = 0;
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const eqSnap = await getDocs(collection(db, 'equipment'));
        eqSnap.forEach(doc => {
            const eq = doc.data();
            if (eq.calibration_due_date) {
                const calDate = new Date(eq.calibration_due_date);
                if (calDate < today) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">🚨 OVERDUE: ${eq.type} (SN: ${eq.serial_number}) calibration expired!</li>`;
                    alertCount++;
                } else if (calDate < thirtyDaysFromNow) {
                    alertList.innerHTML += `<li style="color: #f0ad4e; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">⚠️ WARNING: ${eq.type} (SN: ${eq.serial_number}) calibration due within 30 days.</li>`;
                    alertCount++;
                }
            }
        });

        srcSnap.forEach(doc => {
            const src = doc.data();
            if (src.last_leak_test_date) {
                const lastTest = new Date(src.last_leak_test_date);
                const daysSinceTest = (today - lastTest) / (1000 * 60 * 60 * 24);
                if (daysSinceTest > 182) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">🚨 OVERDUE: Source ${src.serial_number} leak test expired (> 6m)!</li>`;
                    alertCount++;
                } else if (daysSinceTest > 152) { 
                    alertList.innerHTML += `<li style="color: #f0ad4e; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">⚠️ WARNING: Source ${src.serial_number} leak test due within 30 days.</li>`;
                    alertCount++;
                }
            }
        });

        const camSnap = await getDocs(collection(db, 'cameras'));
        camSnap.forEach(doc => {
            const cam = doc.data();
            if (cam.annual_maintenance_date) {
                const maintDate = new Date(cam.annual_maintenance_date);
                const daysSinceMaint = (today - maintDate) / (1000 * 60 * 60 * 24);
                if (daysSinceMaint > 365) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">🚨 OVERDUE: Camera ${cam.serial_number} Annual Maint expired (> 12m)!</li>`;
                    alertCount++;
                }
            }
            if (cam.du_leak_test_date) {
                const duDate = new Date(cam.du_leak_test_date);
                const daysSinceDu = (today - duDate) / (1000 * 60 * 60 * 24);
                if (daysSinceDu > 365) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">🚨 OVERDUE: Camera ${cam.serial_number} DU Leak Test expired!</li>`;
                    alertCount++;
                }
            }
        });

        const perSnap = await getDocs(collection(db, 'personnel'));
        perSnap.forEach(doc => {
            const per = doc.data();
            if (per.last_6mo_eval_date) {
                const evalDate = new Date(per.last_6mo_eval_date);
                const daysSinceEval = (today - evalDate) / (1000 * 60 * 60 * 24);
                if (daysSinceEval > 182) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">🚨 DQ WARNING: ${per.full_name} 6-Month Field Eval expired!</li>`;
                    alertCount++;
                }
            }
            if (per.last_annual_drill_date) {
                const drillDate = new Date(per.last_annual_drill_date);
                const daysSinceDrill = (today - drillDate) / (1000 * 60 * 60 * 24);
                if (daysSinceDrill > 365) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">🚨 OVERDUE: ${per.full_name} Annual Emergency Drill expired!</li>`;
                    alertCount++;
                }
            }
        });

        if (alertCount === 0) {
            alertList.innerHTML = '<li style="color: #5cb85c; list-style-type: none; background: transparent; border: none; padding:0; cursor: default;">✅ All equipment, sources, and personnel are in compliance.</li>';
        }
    } catch (err) {
        console.error("Error updating dashboard stats:", err);
    }
}

// --- NEW: MASTER JOB PACKET GENERATOR ---
window.generateMasterPacket = async function() {
    const jobNum = document.getElementById('packet-job-number').value.trim();
    if(!jobNum) { 
        alert("Please enter a Job Number (e.g., J-2026-DryDock4) to compile."); 
        return; 
    }

    showLoader();
    try {
        const wpQ = query(collection(db, 'work_plans'), where('job_number', '==', jobNum));
        const wpSnap = await getDocs(wpQ);
        let wpData = null;
        wpSnap.forEach(d => wpData = d.data());

        const utQ = query(collection(db, 'utilization_logs'), where('job_reference', '==', jobNum));
        const utSnap = await getDocs(utQ);
        let utData = null;
        utSnap.forEach(d => utData = d.data());

        if(!wpData && !utData) {
            alert("No records found in the database for that Job Number.");
            hideLoader();
            return;
        }

        const container = document.getElementById('master-packet-container');
        let html = `<h2 style="text-align:center; border-bottom:3px solid #002244; padding-bottom:10px; margin-bottom: 10px;">MASTER JOB PACKET</h2>`;
        html += `<h3 style="text-align:center; margin-top: 0; color: #555;">JOB REF: ${jobNum}</h3>`;
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:20px; font-size: 0.9rem;"><span>Generated: ${new Date().toLocaleDateString()}</span><span>Command: ____________</span></div>`;

        if(wpData) {
            html += `<h3 style="background:#eee; padding:5px; border-left: 5px solid #005A9C;">PART 1: WORK PLAN & SAFETY CONTROLS</h3>`;
            html += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size: 0.9rem;" border="1">`;
            html += `<tr><td style="padding:8px; font-weight:bold; width: 40%;">Planned Date</td><td style="padding:8px;">${wpData.planned_date}</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Location</td><td style="padding:8px;">${wpData.location} (${wpData.location_type})</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Calculated Boundary (2mR/hr)</td><td style="padding:8px;">${wpData.calculated_boundary_mr_hr} ft</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Collimator Used</td><td style="padding:8px;">${wpData.collimator_used ? 'Yes' : 'No'}</td></tr>`;
            html += `</table>`;
            
            if (wpData.sketch_data) {
                html += `<h4 style="margin-top: 10px;">Boundary Sketch / Setup Diagram:</h4>`;
                html += `<div style="border: 2px solid #ccc; padding: 5px; text-align: center;"><img src="${wpData.sketch_data}" style="max-width: 100%; height: auto;" /></div>`;
            }
        }

        if(utData) {
            html += `<h3 style="background:#eee; padding:5px; border-left: 5px solid #f0ad4e;">PART 2: UTILIZATION & FIELD LOG</h3>`;
            html += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size: 0.9rem;" border="1">`;
            html += `<tr><td style="padding:8px; font-weight:bold; width: 40%;">Radiographer in Charge (RIC)</td><td style="padding:8px;">${utData.radiographer_in_charge}</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Assistants / Participants</td><td style="padding:8px;">${utData.participants || 'None'}</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Survey Meter Used (SN)</td><td style="padding:8px;">${utData.survey_meter_serial} (Response Checked: ${utData.meter_response_checked ? 'Yes':'No'})</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Max Device Survey Reading</td><td style="padding:8px;">${utData.max_survey_reading} mR/hr</td></tr>`;
            html += `</table>`;
        }

        html += `<div style="margin-top: 50px; border-top: 1px dashed #000; padding-top:20px; text-align:center; font-size: 0.85rem;">
                    <p><strong>AUDIT VERIFICATION COMPLETE</strong></p>
                    <p>Records compiled automatically by the Gamma Radiography Tracker System.</p>
                 </div>`;

        container.innerHTML = html;
        container.style.display = 'block';

        html2pdf().set({
            margin: 15,
            filename: `Job_Packet_${jobNum}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
        }).from(container).save().then(() => {
            container.style.display = 'none';
            document.getElementById('packet-job-number').value = '';
            hideLoader();
        });

    } catch (err) {
        console.error("Packet Error:", err);
        hideLoader();
        alert("Failed to generate master packet.");
    }
}

// --- NEW: GENERATE DIGITAL QUAL CARDS ---
window.generateQualCards = async function() {
    const container = document.getElementById('qual-card-container');
    if(!container) return;
    
    showLoader();
    try {
        const perSnap = await getDocs(collection(db, 'personnel'));
        if (perSnap.empty) {
            alert("No personnel records found.");
            hideLoader();
            return;
        }

        let html = '<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; font-family: Arial;">';
        
        perSnap.forEach(d => {
            const p = d.data();
            const qrString = `Name: ${p.full_name}\nCert: ${p.cert_number}\n6-Mo Eval: ${p.last_6mo_eval_date}\nHazmat: ${p.hazmat_expiration}`;
            const qrData = encodeURIComponent(qrString);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

            html += `
            <div style="border: 2px solid #002244; border-radius: 10px; width: 3.375in; height: 2.125in; padding: 15px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; background: white; color: black; page-break-inside: avoid;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0; color: #005A9C; font-size: 14px;">NAVSEA DET RASO</h3>
                    <h2 style="margin: 0 0 5px 0; font-size: 16px;">${p.full_name}</h2>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Cert:</b> ${p.cert_number}</p>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Eval Exp:</b> ${p.last_6mo_eval_date}</p>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Hazmat:</b> ${p.hazmat_expiration}</p>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Auth Date:</b> ${p.trust_authorization_date}</p>
                </div>
                <div style="width: 80px; height: 80px; border: 1px solid #ccc; padding: 2px;">
                    <img src="${qrUrl}" style="width: 100%; height: 100%;">
                </div>
            </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
        container.style.display = 'block';

        html2pdf().set({
            margin: 10,
            filename: `Radiographer_Qual_Cards_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(container).save().then(() => {
            container.style.display = 'none';
            hideLoader();
        });

    } catch(e) {
        console.error("Qual Card Error:", e);
        hideLoader();
        alert('Error generating qual cards.');
    }
}

window.generatePDFInventory = async function() {
    const srcBody = document.getElementById('pdf-source-body');
    const camBody = document.getElementById('pdf-cam-body');
    if(!srcBody || !camBody) return;
    
    srcBody.innerHTML = ''; 
    camBody.innerHTML = '';
    document.getElementById('pdf-date').textContent = `Date: ${new Date().toLocaleDateString()}`;

    try {
        showLoader();
        const srcSnap = await getDocs(collection(db, 'sources'));
        srcSnap.forEach(d => { 
            const x = d.data(); 
            const currentAct = calculateCurrentActivity(x.initial_activity_curies, x.isotope, x.activity_date);
            srcBody.innerHTML += `<tr>
                <td style="padding:8px;">${x.isotope}</td>
                <td style="padding:8px;">${currentAct}</td>
                <td style="padding:8px;">${x.serial_number}</td>
                <td style="padding:8px;">Vault</td>
                <td style="padding:8px; text-align:center;">[  ]</td>
            </tr>`; 
        });

        const camSnap = await getDocs(collection(db, 'cameras'));
        camSnap.forEach(d => { 
            const x = d.data(); 
            camBody.innerHTML += `<tr>
                <td style="padding:8px;">${x.make_model}</td>
                <td style="padding:8px;">${x.serial_number}</td>
                <td style="padding:8px;">Vault</td>
                <td style="padding:8px; text-align:center;">[  ]</td>
            </tr>`; 
        });

        const element = document.getElementById('pdf-report-container');
        element.style.display = 'block'; 

        html2pdf().set({
            margin: 10,
            filename: `RSO_Inventory_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
        }).from(element).save().then(() => {
            element.style.display = 'none'; 
            hideLoader();
        });

    } catch (err) {
        console.error("Error generating PDF:", err);
        hideLoader();
        alert("Failed to generate PDF inventory report.");
    }
}

window.openModal = async function(collectionName, docId) {
    const modal = document.getElementById('inspector-modal');
    const modalBody = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    
    modalBody.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; padding: 20px;"><div class="mini-spinner"></div><span style="font-weight: bold; color: var(--nav-bg);">Fetching database record...</span></div>';
    title.textContent = `${collectionName.replace('_', ' ').toUpperCase()} RECORD`;
    modal.style.display = 'flex';
    
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.currentOpenDoc = { collection: collectionName, id: docId, fullData: data };
            
            let html = '';
            for (const [key, value] of Object.entries(data)) {
                let displayKey = key.replace(/_/g, ' ').toUpperCase();
                if (key === 'chp_approval_status') displayKey = 'RSO APPROVAL STATUS'; 
                
                if (key === 'checklist' && typeof value === 'object') {
                    html += `<h4>Evaluation Checklist:</h4><ul>`;
                    for(const [checkKey, checkVal] of Object.entries(value)) {
                        html += `<li>${checkKey.replace('_', ' ')}: <b>${checkVal ? 'PASS' : 'FAIL'}</b></li>`;
                    }
                    html += `</ul>`;
                } else if (key === 'source_id') {
                    let sourceDisplay = value;
                    if (value && value !== 'DELETED') {
                        try {
                            const srcSnap = await getDoc(doc(db, 'sources', value));
                            if (srcSnap.exists()) {
                                sourceDisplay = `${srcSnap.data().serial_number} (${srcSnap.data().isotope})`;
                            } else {
                                sourceDisplay = "Source not found in vault";
                            }
                        } catch(e) { console.log("Could not resolve source."); }
                    }
                    html += `<p><strong>SOURCE:</strong> ${sourceDisplay}</p>`;
                
                } else if (key === 'signature_data' && value) {
                    html += `<p><strong>SIGNATURE:</strong><br><img src="${value}" style="max-width: 100%; border: 1px solid #ccc; border-radius: 4px; margin-top: 10px; background: white;" /></p>`;

                } else if (key === 'sketch_data' && value) {
                    html += `<p><strong>SETUP BOUNDARY SKETCH:</strong><br><img src="${value}" style="max-width: 100%; border: 2px solid #ccc; border-radius: 4px; margin-top: 10px; background: white;" /></p>`;

                } else if(key.includes('_url')) {
                    if (value && value !== 'null') {
                        html += `<p><strong>${displayKey.replace(' URL', '')}:</strong> <a href="${value}" target="_blank" style="color: #005A9C;">View Uploaded File</a></p>`;
                    } else {
                        html += `<p><strong>${displayKey.replace(' URL', '')}:</strong> <span style="color: #999; font-style: italic;">No file attached</span></p>`;
                    }
                } else {
                    html += `<p><strong>${displayKey}:</strong> ${value}</p>`;
                }
            }
            modalBody.innerHTML = html;
        } else {
            modalBody.innerHTML = '<p>Record not found.</p>';
        }
    } catch (err) {
        modalBody.innerHTML = '<p style="color:red;">Error retrieving data.</p>';
        console.error(err);
    }
}

window.closeModal = function() {
    document.getElementById('inspector-modal').style.display = 'none';
    window.currentOpenDoc = null;
}

document.getElementById('modal-delete-btn').addEventListener('click', () => {
    if(!window.currentOpenDoc) return;
    document.getElementById('delete-confirm-modal').style.display = 'flex';
});

window.closeConfirmModal = function() {
    document.getElementById('delete-confirm-modal').style.display = 'none';
}

window.executeDelete = async function() {
    if(!window.currentOpenDoc) return;
    try {
        showLoader();
        await deleteDoc(doc(db, window.currentOpenDoc.collection, window.currentOpenDoc.id));
        closeConfirmModal();
        window.closeModal();
        
        let listId = '';
        if(window.currentOpenDoc.collection === 'equipment') listId = 'equipment-list';
        if(window.currentOpenDoc.collection === 'sources') { listId = 'sources-list'; populateSourceDropdown(); }
        if(window.currentOpenDoc.collection === 'cameras') listId = 'cameras-list';
        if(window.currentOpenDoc.collection === 'personnel') listId = 'personnel-list';
        if(window.currentOpenDoc.collection === 'field_evaluations') listId = 'eval-list';
        if(window.currentOpenDoc.collection === 'work_plans') listId = 'work-plans-list';
        if(window.currentOpenDoc.collection === 'transport_logs') listId = 'transport-list';
        if(window.currentOpenDoc.collection === 'dosimetry_logs') listId = 'dosimetry-list';
        if(window.currentOpenDoc.collection === 'utilization_logs') listId = 'utilization-list';
        if(window.currentOpenDoc.collection === 'post_job_reports') listId = 'reports-list';
        
        await fetchData(window.currentOpenDoc.collection, listId);
        window.updateDashboard();
        window.renderCalendar();
        hideLoader();
    } catch (err) {
        hideLoader();
        alert("Error deleting record.");
        console.error("Deletion Error:", err);
    }
}

window.filterRecords = function() {
    const searchInput = document.getElementById('global-search').value.toLowerCase();
    
    // Grab the new Audit Dates
    const startInput = document.getElementById('filter-start') ? document.getElementById('filter-start').value : '';
    const endInput = document.getElementById('filter-end') ? document.getElementById('filter-end').value : '';
    
    const allRecords = document.querySelectorAll('ul[id$="-list"] li');
    
    allRecords.forEach(record => {
        if(record.textContent.includes("No data found")) return;
        
        let matchesText = record.textContent.toLowerCase().includes(searchInput);
        let matchesDate = true;

        // Check if the record's hidden 'data-date' tag falls outside the requested audit window
        const recDate = record.getAttribute('data-date');
        if (startInput && recDate && recDate < startInput) matchesDate = false;
        if (endInput && recDate && recDate > endInput) matchesDate = false;

        if (matchesText && matchesDate) {
            record.style.display = '';
        } else {
            record.style.display = 'none';
        }
    });
}

// NEW: Quick reset button for the Audit Bar
window.clearFilters = function() {
    if(document.getElementById('filter-start')) document.getElementById('filter-start').value = '';
    if(document.getElementById('filter-end')) document.getElementById('filter-end').value = '';
    document.getElementById('global-search').value = '';
    window.filterRecords();
}

window.exportCSV = async function(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        if (querySnapshot.empty) {
            alert("No records found to export.");
            return;
        }

        const dataArray = [];
        querySnapshot.forEach((doc) => {
            let docData = doc.data();
            let flatData = { database_id: doc.id };
            for(const key in docData) {
                if(typeof docData[key] === 'object' && docData[key] !== null) {
                    for(const subKey in docData[key]) flatData[`${key}_${subKey}`] = docData[key][subKey];
                } else {
                    flatData[key] = docData[key];
                }
            }
            dataArray.push(flatData);
        });

        const headers = Object.keys(dataArray[0]);
        let csvContent = headers.join(",") + "\n";

        dataArray.forEach(row => {
            const rowString = headers.map(header => {
                let val = row[header] !== undefined ? row[header] : "";
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
            }).join(",");
            csvContent += rowString + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `${collectionName}_export_${dateStr}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error("CSV Export failed:", err);
        alert("Failed to generate CSV export.");
    }
}

window.fullSystemBackup = async function() {
    if (!auth.currentUser || auth.currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert("Unauthorized. Only the RSO may perform a full system backup.");
        return;
    }

    const collectionsToBackup = [
        'equipment', 'sources', 'cameras', 'personnel', 'field_evaluations', 
        'work_plans', 'transport_logs', 'dosimetry_logs', 'utilization_logs', 'post_job_reports'
    ];
    
    const backupData = {
        metadata: {
            exported_by: auth.currentUser.email,
            export_date: new Date().toISOString(),
            version: "1.0"
        },
        database: {}
    };

    try {
        showLoader();
        for (const colName of collectionsToBackup) {
            backupData.database[colName] = [];
            const querySnapshot = await getDocs(collection(db, colName));
            querySnapshot.forEach((doc) => {
                backupData.database[colName].push({
                    database_id: doc.id,
                    ...doc.data()
                });
            });
        }

        const jsonString = JSON.stringify(backupData, null, 2);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const dateStr = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `Radiography_System_Backup_${dateStr}.json`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (err) {
        console.error("Backup failed:", err);
        alert("Critical failure during system backup.");
    } finally {
        hideLoader();
    }
}

// --- RSO FULL SYSTEM RESTORE ---
window.executeSystemRestore = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!auth.currentUser || auth.currentUser.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        alert("Unauthorized. Only the RSO may restore the database.");
        return;
    }

    if (!confirm("WARNING: This will overwrite existing database records with the contents of this backup. Are you absolutely sure you want to proceed?")) {
        event.target.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            showLoader();
            const backupData = JSON.parse(e.target.result);
            
            if (!backupData.database) {
                throw new Error("Invalid backup file format.");
            }

            let allRecords = [];
            for (const [collectionName, records] of Object.entries(backupData.database)) {
                records.forEach(record => {
                    allRecords.push({ collection: collectionName, ...record });
                });
            }

            const chunkSize = 450;
            for (let i = 0; i < allRecords.length; i += chunkSize) {
                const chunk = allRecords.slice(i, i + chunkSize);
                const batch = writeBatch(db);
                
                chunk.forEach(record => {
                    const docId = record.database_id;
                    const colName = record.collection;
                    
                    delete record.database_id;
                    delete record.collection;
                    
                    const docRef = doc(db, colName, docId);
                    batch.set(docRef, record); 
                });

                await batch.commit();
                console.log(`Successfully restored chunk ${Math.floor(i / chunkSize) + 1}`);
            }

            alert("Database restore completed successfully!");
            window.loadAllData(); 

        } catch (err) {
            console.error("Restore failed:", err);
            alert("Critical failure during database restore. Check console for details.");
        } finally {
            hideLoader();
            event.target.value = ''; 
        }
    };
    reader.readAsText(file);
}

// --- GENERATE DIGITAL QUAL CARDS ---
window.generateQualCards = async function() {
    const container = document.getElementById('qual-card-container');
    if(!container) return;
    
    showLoader();
    try {
        const perSnap = await getDocs(collection(db, 'personnel'));
        if (perSnap.empty) {
            alert("No personnel records found.");
            hideLoader();
            return;
        }

        let html = '<div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; font-family: Arial;">';
        
        perSnap.forEach(d => {
            const p = d.data();
            const qrString = `Name: ${p.full_name}\nCert: ${p.cert_number}\n6-Mo Eval: ${p.last_6mo_eval_date}\nHazmat: ${p.hazmat_expiration}`;
            const qrData = encodeURIComponent(qrString);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

            html += `
            <div style="border: 2px solid #002244; border-radius: 10px; width: 3.375in; height: 2.125in; padding: 15px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; background: white; color: black; page-break-inside: avoid;">
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 5px 0; color: #005A9C; font-size: 14px;">NAVSEA DET RASO</h3>
                    <h2 style="margin: 0 0 5px 0; font-size: 16px;">${p.full_name}</h2>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Cert:</b> ${p.cert_number}</p>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Eval Exp:</b> ${p.last_6mo_eval_date}</p>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Hazmat:</b> ${p.hazmat_expiration}</p>
                    <p style="margin: 2px 0; font-size: 10px;"><b>Auth Date:</b> ${p.trust_authorization_date}</p>
                </div>
                <div style="width: 80px; height: 80px; border: 1px solid #ccc; padding: 2px;">
                    <img src="${qrUrl}" style="width: 100%; height: 100%;">
                </div>
            </div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
        container.style.display = 'block';

        html2pdf().set({
            margin: 10,
            filename: `Radiographer_Qual_Cards_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(container).save().then(() => {
            container.style.display = 'none';
            hideLoader();
        });

    } catch(e) {
        console.error("Qual Card Error:", e);
        hideLoader();
        alert('Error generating qual cards.');
    }
}

// --- MASTER JOB PACKET GENERATOR ---
window.generateMasterPacket = async function() {
    const jobNum = document.getElementById('packet-job-number').value.trim();
    if(!jobNum) { 
        alert("Please enter a Job Number to compile."); 
        return; 
    }

    showLoader();
    try {
        const wpQ = query(collection(db, 'work_plans'), where('job_number', '==', jobNum));
        const wpSnap = await getDocs(wpQ);
        let wpData = null;
        wpSnap.forEach(d => wpData = d.data());

        const utQ = query(collection(db, 'utilization_logs'), where('job_reference', '==', jobNum));
        const utSnap = await getDocs(utQ);
        let utData = null;
        utSnap.forEach(d => utData = d.data());

        if(!wpData && !utData) {
            alert("No records found in the database for that Job Number.");
            hideLoader();
            return;
        }

        const container = document.getElementById('master-packet-container');
        let html = `<h2 style="text-align:center; border-bottom:3px solid #002244; padding-bottom:10px; margin-bottom: 10px;">MASTER JOB PACKET</h2>`;
        html += `<h3 style="text-align:center; margin-top: 0; color: #555;">JOB REF: ${jobNum}</h3>`;
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:20px; font-size: 0.9rem;"><span>Generated: ${new Date().toLocaleDateString()}</span><span>Command: ____________</span></div>`;

        if(wpData) {
            html += `<h3 style="background:#eee; padding:5px; border-left: 5px solid #005A9C;">PART 1: WORK PLAN & SAFETY CONTROLS</h3>`;
            html += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size: 0.9rem;" border="1">`;
            html += `<tr><td style="padding:8px; font-weight:bold; width: 40%;">Planned Date</td><td style="padding:8px;">${wpData.planned_date}</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Location</td><td style="padding:8px;">${wpData.location} (${wpData.location_type})</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Calculated Boundary (2mR/hr)</td><td style="padding:8px;">${wpData.calculated_boundary_mr_hr} ft</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Collimator Used</td><td style="padding:8px;">${wpData.collimator_used ? 'Yes' : 'No'}</td></tr>`;
            html += `</table>`;
            
            if (wpData.sketch_data) {
                html += `<h4 style="margin-top: 10px;">Boundary Sketch / Setup Diagram:</h4>`;
                html += `<div style="border: 2px solid #ccc; padding: 5px; text-align: center;"><img src="${wpData.sketch_data}" style="max-width: 100%; height: auto;" /></div>`;
            }
        }

        if(utData) {
            html += `<h3 style="background:#eee; padding:5px; border-left: 5px solid #f0ad4e;">PART 2: UTILIZATION & FIELD LOG</h3>`;
            html += `<table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size: 0.9rem;" border="1">`;
            html += `<tr><td style="padding:8px; font-weight:bold; width: 40%;">Radiographer in Charge (RIC)</td><td style="padding:8px;">${utData.radiographer_in_charge}</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Assistants / Participants</td><td style="padding:8px;">${utData.participants || 'None'}</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Survey Meter Used (SN)</td><td style="padding:8px;">${utData.survey_meter_serial} (Response Checked: ${utData.meter_response_checked ? 'Yes':'No'})</td></tr>`;
            html += `<tr><td style="padding:8px; font-weight:bold;">Max Device Survey Reading</td><td style="padding:8px;">${utData.max_survey_reading} mR/hr</td></tr>`;
            html += `</table>`;
        }

        html += `<div style="margin-top: 50px; border-top: 1px dashed #000; padding-top:20px; text-align:center; font-size: 0.85rem;">
                    <p><strong>AUDIT VERIFICATION COMPLETE</strong></p>
                    <p>Records compiled automatically by the Gamma Radiography Tracker System.</p>
                 </div>`;

        container.innerHTML = html;
        container.style.display = 'block';

        html2pdf().set({
            margin: 15,
            filename: `Job_Packet_${jobNum}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
        }).from(container).save().then(() => {
            container.style.display = 'none';
            document.getElementById('packet-job-number').value = '';
            hideLoader();
        });

    } catch (err) {
        console.error("Packet Error:", err);
        hideLoader();
        alert("Failed to generate master packet.");
    }
}
