// public/js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, getDocs, addDoc, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
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
window.currentOpenDoc = null; 
window.editModeId = null;
window.editModeCollection = null;
window.sigPadDirty = false;
let html5QrCode = null;

// --- LIVE DECAY ENGINE ---
function calculateCurrentActivity(initialActivity, isotope, activityDateStr) {
    if (!initialActivity || !isotope || !activityDateStr) return 0;
    const initial = parseFloat(initialActivity);
    const actDate = new Date(activityDateStr);
    const today = new Date();
    const daysElapsed = (today - actDate) / (1000 * 60 * 60 * 24);
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

// --- NEW: BARCODE SCANNER LOGIC ---
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
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('scanner-modal').style.display = 'none';
        }).catch(err => console.log(err));
    } else {
        document.getElementById('scanner-modal').style.display = 'none';
    }
}

// --- LOADER LOGIC ---
function showLoader() { document.getElementById('global-loader').style.display = 'flex'; }
function hideLoader() { document.getElementById('global-loader').style.display = 'none'; }

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
    if(window.isotopeChart) window.updateDashboard(); 
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
            el.style.display = isAdmin ? '' : 'none'; 
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

window.editRecord = function() { if(!window.currentOpenDoc) return; populateFormForEditClone(window.currentOpenDoc, true); }
window.cloneRecord = function() { if(!window.currentOpenDoc) return; populateFormForEditClone(window.currentOpenDoc, false); }

function populateFormForEditClone(docObj, isEdit) {
    const { collection: col, fullData: data, id } = docObj;
    const map = formMaps[col];
    if(!map) return;
    const sectionMap = { 'equipment': 'equipment', 'sources': 'equipment', 'cameras': 'equipment', 'personnel': 'personnel', 'field_evaluations': 'personnel', 'work_plans': 'planning', 'transport_logs': 'execution', 'dosimetry_logs': 'execution', 'utilization_logs': 'execution', 'post_job_reports': 'reporting' };
    window.showSection(sectionMap[col]);
    window.closeModal();
    if(isEdit) { window.editModeId = id; window.editModeCollection = col; }
    else { window.editModeId = null; window.editModeCollection = null; }
    const form = document.getElementById(map.formId);
    const btn = form.querySelector('button[type="submit"]');
    if(!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
    btn.textContent = isEdit ? '💾 Update Record' : '📄 Create Clone';
    btn.style.backgroundColor = isEdit ? '#f0ad4e' : '#5bc0de';
    btn.style.color = isEdit ? '#333' : '#fff';
    for (const [dbKey, htmlId] of Object.entries(map.fields)) {
        const el = document.getElementById(htmlId);
        if(el && data[dbKey] !== undefined) { if(el.type === 'checkbox') el.checked = data[dbKey]; else el.value = data[dbKey]; }
    }
    if(map.nested) {
        for (const [nObj, nMap] of Object.entries(map.nested)) {
            if(data[nObj]) {
                for (const [dbK, htmlI] of Object.entries(nMap)) {
                    const el = document.getElementById(htmlI);
                    if(el && data[nObj][dbK] !== undefined) { if(el.type === 'checkbox') el.checked = data[nObj][dbK]; else el.value = data[nObj][dbK]; }
                }
            }
        }
    }
    if(col === 'work_plans') window.togglePRI();
    setTimeout(() => { form.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
}

function resetFormButton(collectionName) {
    const map = formMaps[collectionName];
    if(map) {
        const form = document.getElementById(map.formId);
        const btn = form.querySelector('button[type="submit"]');
        if(btn && btn.dataset.originalText) { btn.textContent = btn.dataset.originalText; btn.style.backgroundColor = ''; btn.style.color = ''; }
    }
}

// --- NEW: DIGITAL SIGNATURE ENGINE ---
function initSignaturePad() {
    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0, lastY = 0;
    ctx.strokeStyle = '#005A9C'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    function draw(e) {
        if (!isDrawing) return; e.preventDefault(); 
        let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left; const y = clientY - rect.top;
        ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(x, y); ctx.stroke();
        [lastX, lastY] = [x, y]; window.sigPadDirty = true;
    }
    canvas.addEventListener('mousedown', (e) => { isDrawing = true; const rect = canvas.getBoundingClientRect(); [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top]; });
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('touchstart', (e) => { isDrawing = true; const rect = canvas.getBoundingClientRect(); [lastX, lastY] = [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top]; }, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', () => isDrawing = false);
}
window.clearSignature = function() { const canvas = document.getElementById('sig-canvas'); if (canvas) { canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); window.sigPadDirty = false; } }

// --- APP INITIALIZATION ---
async function startApplication() {
    window.showSection('dashboard');
    initSignaturePad();
    await loadAllData();
    setupEventListeners();
    populateSourceDropdown(); 
    // NEW: Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => console.log("Offline Mode Active")).catch(e => console.log(e));
    }
}

async function uploadFile(file, folderPath) {
    if (!file) return null;
    const fileRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    return await getDownloadURL(snapshot.ref);
}

function setupEventListeners() {
    const ackCheckbox = document.getElementById('ack-checkbox');
    const proceedBtn = document.getElementById('disclaimer-proceed-btn');
    if (ackCheckbox && proceedBtn) {
        ackCheckbox.addEventListener('change', (e) => {
            proceedBtn.disabled = !e.target.checked;
            proceedBtn.style.opacity = e.target.checked ? '1' : '0.5';
            proceedBtn.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
        });
        proceedBtn.addEventListener('click', () => {
            if (document.getElementById('dont-show-checkbox').checked) localStorage.setItem('hideDisclaimer', 'true');
            document.getElementById('disclaimer-modal').style.display = 'none';
        });
    }

    Object.values(formMaps).forEach(map => {
        const form = document.getElementById(map.formId);
        if(form) form.addEventListener('reset', () => { resetFormButton(window.editModeCollection); window.editModeId = null; if(map.formId === 'reports-form') window.clearSignature(); });
    });

    const standardForms = ['equipment', 'sources', 'cameras', 'personnel', 'field_evaluations', 'work_plans', 'transport_logs', 'dosimetry_logs', 'utilization_logs'];
    standardForms.forEach(col => {
        const f = document.getElementById(formMaps[col].formId);
        if(f) f.addEventListener('submit', async (e) => {
            e.preventDefault(); showLoader();
            const data = {};
            for(const [dbK, htmlI] of Object.entries(formMaps[col].fields)) {
                const el = document.getElementById(htmlI);
                data[dbK] = (el.type === 'checkbox') ? el.checked : (el.type === 'number' ? parseFloat(el.value) : el.value);
            }
            if(formMaps[col].nested) {
                for(const [nObj, nMap] of Object.entries(formMaps[col].nested)) {
                    data[nObj] = {};
                    for(const [dbK, htmlI] of Object.entries(nMap)) {
                        const el = document.getElementById(htmlI);
                        data[nObj][dbK] = (el.type === 'checkbox') ? el.checked : el.value;
                    }
                }
            }
            await addData(col, data);
            f.reset(); await fetchData(col, col + '-list'); window.updateDashboard(); window.renderCalendar(); hideLoader();
        });
    });

    const reportsForm = document.getElementById('reports-form');
    if(reportsForm) reportsForm.addEventListener('submit', async (e) => {
        e.preventDefault(); showLoader();
        const canvas = document.getElementById('sig-canvas');
        const data = {
            completed_by: document.getElementById('pj-completed-by').value,
            source_secured: document.getElementById('pj-source-secured').checked,
            vault_verified: document.getElementById('pj-vault-verified').checked,
            completion_time: new Date().toISOString(),
            signature_data: (canvas && window.sigPadDirty) ? canvas.toDataURL('image/png') : null
        };
        await addData('post_job_reports', data);
        reportsForm.reset(); window.clearSignature(); await fetchData('post_job_reports', 'reports-list'); hideLoader();
    });

    if(document.getElementById('wp-source')) document.getElementById('wp-source').addEventListener('change', calculateBoundary);
    if(document.getElementById('wp-collimator')) document.getElementById('wp-collimator').addEventListener('change', calculateBoundary);
}

async function addData(collectionName, data) {
    if (window.editModeId && window.editModeCollection === collectionName) {
        const snap = await getDoc(doc(db, collectionName, window.editModeId));
        if(snap.exists()) {
            const old = snap.data();
            for(const k in data) if(k.includes('_url') || k === 'signature_data') if(data[k] === null) data[k] = old[k];
        }
        await updateDoc(doc(db, collectionName, window.editModeId), data);
        window.editModeId = null; resetFormButton(collectionName);
    } else {
        data.timestamp = new Date().toISOString();
        await addDoc(collection(db, collectionName), data);
    }
}

// --- NEW: DOSE AGGREGATION & CHARTING ---
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
    list.innerHTML = ''; alertList.innerHTML = '';
    
    const names = Object.keys(stats);
    const doseValues = Object.values(stats);

    names.forEach(name => {
        const dose = stats[name];
        list.innerHTML += `<li>${name}: <strong>${dose.toFixed(2)} mRem</strong></li>`;
        if(dose > 1000) alertList.innerHTML += `<li style="color: #d9534f;">🚨 CRITICAL: ${name} is over 1000mRem Administrative Limit!</li>`;
    });

    const ctx = document.getElementById('dose-chart');
    if(ctx) {
        if(window.doseChart) window.doseChart.destroy();
        window.doseChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: names, datasets: [{ label: 'Cumulative Dose (mRem)', data: doseValues, backgroundColor: '#005A9C' }] },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }
}

// --- UI TOGGLES ---
window.showSection = function(sectionId) {
    document.querySelectorAll('.module').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
    const target = document.getElementById(sectionId);
    if (target) { target.classList.add('active'); target.style.display = 'block'; }
    if(sectionId === 'calendar-view' && window.calendar) setTimeout(() => { window.calendar.render(); }, 100);
}

window.togglePRI = function() {
    const loc = document.getElementById('wp-loc-type').value;
    document.getElementById('wp-temp-wrapper').style.display = loc === 'pri' ? 'none' : 'flex';
    document.getElementById('wp-pri-wrapper').style.display = loc === 'pri' ? 'flex' : 'none';
}

async function loadAllData() {
    const cols = ['equipment', 'sources', 'cameras', 'personnel', 'field_evaluations', 'work_plans', 'transport_logs', 'dosimetry_logs', 'utilization_logs', 'post_job_reports'];
    await Promise.all(cols.map(c => fetchData(c, c + '-list')));
    window.updateDashboard(); window.renderCalendar(); updateDoseDashboard();
}

async function fetchData(col, listId) {
    const ul = document.getElementById(listId); if (!ul) return;
    const snap = await getDocs(collection(db, col));
    ul.innerHTML = snap.empty ? `<li>No data in ${col}.</li>` : '';
    snap.forEach((doc) => {
        const item = doc.data(); const li = document.createElement('li');
        let recordDate = item.timestamp || item.created_at || item.activity_date || item.planned_date || item.transport_date || item.eval_date || '';
        if (recordDate) li.setAttribute('data-date', recordDate.split('T')[0]);

        li.textContent = `Record ID: ${doc.id.substring(0,6)}... (${col.replace('_',' ')})`;
        li.setAttribute('onclick', `window.openModal('${col}', '${doc.id}')`);
        ul.appendChild(li);
    });
}

async function populateSourceDropdown() {
    const select = document.getElementById('wp-source'); if (!select) return;
    const snap = await getDocs(collection(db, 'sources'));
    select.innerHTML = '<option value="">Select a source...</option>';
    snap.forEach(d => {
        const item = d.data(); const current = calculateCurrentActivity(item.initial_activity_curies, item.isotope, item.activity_date);
        select.innerHTML += `<option value="${d.id}" data-activity="${current}" data-isotope="${item.isotope}">${item.isotope} (SN: ${item.serial_number}) - ${current} Ci</option>`;
    });
}

function calculateBoundary() {
    const sel = document.getElementById('wp-source');
    const inp = document.getElementById('wp-boundary');
    if(!sel || !sel.value || !inp) return;
    const opt = sel.options[sel.selectedIndex];
    const activity = parseFloat(opt.getAttribute('data-activity'));
    const iso = opt.getAttribute('data-isotope');
    let gamma = iso === 'Co-60' ? 14000 : 5200;
    let intensity = activity * gamma * (document.getElementById('wp-collimator').checked ? 0.1 : 1);
    inp.value = Math.sqrt(intensity / 2.0).toFixed(1);
}

window.renderCalendar = async function() {
    const el = document.getElementById('calendar'); if(!el) return;
    let events = [];
    const wpSnap = await getDocs(collection(db, 'work_plans'));
    wpSnap.forEach(d => { if(d.data().planned_date) events.push({ title: `Job: ${d.data().job_number}`, start: d.data().planned_date, color: '#005A9C', extendedProps: { collection: 'work_plans', docId: d.id } }); });
    if(window.calendar) window.calendar.destroy();
    window.calendar = new FullCalendar.Calendar(el, { initialView: 'dayGridMonth', events: events, eventClick: (i) => window.openModal(i.event.extendedProps.collection, i.event.extendedProps.docId) });
    window.calendar.render();
}

window.updateDashboard = async function() {
    const wp = await getDocs(collection(db, 'work_plans'));
    const src = await getDocs(collection(db, 'sources'));
    if(document.getElementById('stat-work-plans')) document.getElementById('stat-work-plans').textContent = wp.size;
    if(document.getElementById('stat-sources')) document.getElementById('stat-sources').textContent = src.size;
}

window.generatePDFInventory = async function() {
    const element = document.getElementById('pdf-report-container');
    element.style.display = 'block';
    html2pdf().from(element).save().then(() => element.style.display = 'none');
}

window.openModal = async function(col, id) {
    const modal = document.getElementById('inspector-modal');
    modal.style.display = 'flex';
    const snap = await getDoc(doc(db, col, id));
    if(snap.exists()){
        const data = snap.data(); window.currentOpenDoc = { collection: col, id: id, fullData: data };
        let html = ''; for(const [k, v] of Object.entries(data)) { if(k === 'signature_data' && v) html += `<p><strong>SIGNATURE:</strong><br><img src="${v}" style="max-width:100%; background:white;"/></p>`; else html += `<p><strong>${k.toUpperCase()}:</strong> ${v}</p>`; }
        document.getElementById('modal-body').innerHTML = html;
    }
}
window.closeModal = function() { document.getElementById('inspector-modal').style.display = 'none'; }
window.executeDelete = async function() {
    if(!window.currentOpenDoc) return;
    await deleteDoc(doc(db, window.currentOpenDoc.collection, window.currentOpenDoc.id));
    window.closeModal(); loadAllData();
}

window.filterRecords = function() {
    const s = document.getElementById('global-search').value.toLowerCase();
    const start = document.getElementById('filter-start').value;
    const end = document.getElementById('filter-end').value;
    document.querySelectorAll('ul[id$="-list"] li').forEach(li => {
        const d = li.getAttribute('data-date');
        const matches = li.textContent.toLowerCase().includes(s) && (!start || d >= start) && (!end || d <= end);
        li.style.display = matches ? '' : 'none';
    });
}
window.clearFilters = function() { document.getElementById('filter-start').value = ''; document.getElementById('filter-end').value = ''; window.filterRecords(); }

window.exportCSV = async function(col) {
    const snap = await getDocs(collection(db, col));
    let csv = "ID," + Object.keys(snap.docs[0].data()).join(",") + "\n";
    snap.forEach(d => { csv += d.id + "," + Object.values(d.data()).join(",") + "\n"; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${col}.csv`; a.click();
}

window.fullSystemBackup = async function() {
    const backup = {};
    const cols = ['equipment', 'sources', 'cameras', 'personnel', 'field_evaluations', 'work_plans', 'transport_logs', 'dosimetry_logs', 'utilization_logs', 'post_job_reports'];
    for(const c of cols) {
        backup[c] = []; const s = await getDocs(collection(db, c));
        s.forEach(d => backup[c].push(d.data()));
    }
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup.json'; a.click();
}
