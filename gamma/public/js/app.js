// public/js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
// NEW IMPORTS: onSnapshot (Real-time), query/orderBy/limit/where (Advanced Search), writeBatch (Relational safety)
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, doc, getDoc, addDoc, onSnapshot, query, orderBy, limit, where, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
// NEW IMPORTS: deleteObject (Storage cleanup)
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

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
let calendar; 

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
}
function updateThemeButton(theme) {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}
initTheme(); 

// --- FILE UPLOAD ---
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

// --- FORM SUBMISSIONS ---
// Notice how clean these are now! We no longer need to manually refresh the lists or dashboard
// because our new Real-Time Sync Engine handles UI updates automatically.
function setupEventListeners() {
    const equipmentForm = document.getElementById('equipment-form');
    if (equipmentForm) equipmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const certUrl = await uploadFile(document.getElementById('eq-cert').files[0], 'equipment_certs');
        await addData('equipment', {
            type: document.getElementById('eq-type').value,
            serial_number: document.getElementById('eq-serial').value,
            calibration_due_date: document.getElementById('eq-cal-date').value,
            maintenance_status: 'Operational',
            certificate_url: certUrl
        });
        equipmentForm.reset();
    });

    const sourcesForm = document.getElementById('sources-form');
    if (sourcesForm) sourcesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const certUrl = await uploadFile(document.getElementById('src-cert').files[0], 'source_certs');
        await addData('sources', {
            serial_number: document.getElementById('src-serial').value,
            isotope: document.getElementById('src-isotope').value,
            initial_activity_curies: parseFloat(document.getElementById('src-activity').value),
            activity_date: document.getElementById('src-date').value,
            last_leak_test_date: document.getElementById('src-leak-test').value,
            current_location: 'Storage Vault',
            status: 'Stored',
            certificate_url: certUrl
        });
        sourcesForm.reset();
    });

    const camerasForm = document.getElementById('cameras-form');
    if (camerasForm) camerasForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addData('cameras', {
            make_model: document.getElementById('cam-model').value,
            serial_number: document.getElementById('cam-serial').value,
            du_leak_test_date: document.getElementById('cam-du-date').value,
            annual_maintenance_date: document.getElementById('cam-maint-date').value,
        });
        camerasForm.reset();
    });

    const personnelForm = document.getElementById('personnel-form');
    if (personnelForm) personnelForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addData('personnel', {
            full_name: document.getElementById('per-name').value,
            cert_number: document.getElementById('per-cert').value,
            trust_authorization_date: document.getElementById('per-trust').value,
            hazmat_expiration: document.getElementById('per-hazmat').value,
            last_6mo_eval_date: document.getElementById('per-eval').value,
            last_annual_drill_date: document.getElementById('per-drill').value,
        });
        personnelForm.reset();
    });

    const evalForm = document.getElementById('eval-form');
    if (evalForm) evalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addData('field_evaluations', {
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
            }
        });
        evalForm.reset();
    });

    const workPlansForm = document.getElementById('work-plans-form');
    if (workPlansForm) workPlansForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const diagramUrl = await uploadFile(document.getElementById('wp-diagram').files[0], 'work_plan_diagrams');
        const locType = document.getElementById('wp-loc-type').value;
        await addData('work_plans', {
            job_number: document.getElementById('wp-job').value,
            location_type: locType,
            location: document.getElementById('wp-location').value,
            planned_date: document.getElementById('wp-date').value,
            source_id: document.getElementById('wp-source').value,
            collimator_used: document.getElementById('wp-collimator').checked,
            calculated_boundary_mr_hr: locType === 'temporary' ? parseFloat(document.getElementById('wp-boundary').value) : 'N/A (PRI)',
            pri_entrance_tested: locType === 'pri' ? document.getElementById('wp-pri-entrance').checked : 'N/A',
            pri_alarm_tested: locType === 'pri' ? document.getElementById('wp-pri-alarm').checked : 'N/A',
            chp_approval_status: 'Pending',
            diagram_url: diagramUrl
        });
        workPlansForm.reset();
        togglePRI(); 
    });

    const transportForm = document.getElementById('transport-form');
    if (transportForm) transportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addData('transport_logs', {
            transport_date: document.getElementById('tr-date').value,
            camera_sn: document.getElementById('tr-camera').value,
            destination: document.getElementById('tr-destination').value,
            max_contact_reading: parseFloat(document.getElementById('tr-max-contact').value),
            transport_index: parseFloat(document.getElementById('tr-ti').value),
            over_water_transport: document.getElementById('tr-water').checked,
        });
        transportForm.reset();
    });

    const dosimetryForm = document.getElementById('dosimetry-form');
    if (dosimetryForm) dosimetryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addData('dosimetry_logs', {
            personnel_name: document.getElementById('dl-name').value,
            dosimeter_serial: document.getElementById('dl-serial').value,
            ratemeter_check_performed: document.getElementById('dl-ratemeter-check').checked,
            initial_reading: parseFloat(document.getElementById('dl-initial').value),
            final_reading: parseFloat(document.getElementById('dl-final').value),
        });
        dosimetryForm.reset();
    });

    const utilizationForm = document.getElementById('utilization-form');
    if (utilizationForm) utilizationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addData('utilization_logs', {
            job_reference: document.getElementById('ul-job').value,
            radiographer_in_charge: document.getElementById('ul-ric').value,
            participants: document.getElementById('ul-participants').value,
            survey_meter_serial: document.getElementById('ul-meter').value,
            meter_response_checked: document.getElementById('ul-response').checked,
            max_survey_reading: parseFloat(document.getElementById('ul-max-survey').value),
        });
        utilizationForm.reset();
    });

    const reportsForm = document.getElementById('reports-form');
    if (reportsForm) reportsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const docUrl = await uploadFile(document.getElementById('pj-doc').files[0], 'report_documents');
        await addData('post_job_reports', {
            completed_by: document.getElementById('pj-completed-by').value,
            source_secured: document.getElementById('pj-source-secured').checked,
            vault_verified: document.getElementById('pj-vault-verified').checked,
            daily_log_generated: true, 
            document_url: docUrl
        });
        reportsForm.reset();
    });

    const sourceSelect = document.getElementById('wp-source');
    const collimatorCheck = document.getElementById('wp-collimator');
    if(sourceSelect) sourceSelect.addEventListener('change', calculateBoundary);
    if(collimatorCheck) collimatorCheck.addEventListener('change', calculateBoundary);
}

// Ensure every record gets a timestamp for accurate querying
async function addData(collectionName, data) {
    if(!data.timestamp) data.timestamp = new Date().toISOString();
    try {
        await addDoc(collection(db, collectionName), data);
    } catch (err) {
        console.error(`Error adding document:`, err);
        alert(`Failed to save record. Note: If offline, this will save locally and sync when connection returns!`);
    }
}


// --- REAL-TIME SYNC ENGINE ---

let syncTimeout; 
function triggerGlobalSync() {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        updateDashboard();
        renderCalendar();
        populateSourceDropdown();
    }, 300); // Debounce to prevent lag spikes
}

function attachRealtimeListener(collectionName, listId) {
    const ul = document.getElementById(listId);
    if (!ul) return;

    // ADVANCED QUERY: Only pull the 50 most recent items, ordered by newest first!
    const q = query(collection(db, collectionName), orderBy('timestamp', 'desc'), limit(50));
    
    // LIVE WEBSOCKET: Any changes to DB instantly trigger this function
    onSnapshot(q, (querySnapshot) => {
        ul.innerHTML = '';
        if (querySnapshot.empty) {
            ul.innerHTML = `<li style="background: transparent; border: none;">No data found in ${collectionName.replace(/_/g, ' ')}.</li>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const li = document.createElement('li');
            let displayText = '';
            let docUrl = item.certificate_url || item.diagram_url || item.document_url;

            if (collectionName === 'equipment') displayText = `${item.type?.toUpperCase()} - Serial: ${item.serial_number} (Cal Due: ${item.calibration_due_date})`;
            else if (collectionName === 'sources') displayText = `${item.isotope} (SN: ${item.serial_number}) - Activity: ${item.initial_activity_curies} Ci on ${item.activity_date}`;
            else if (collectionName === 'cameras') displayText = `${item.make_model} (SN: ${item.serial_number}) - Maint: ${item.annual_maintenance_date}`;
            else if (collectionName === 'personnel') displayText = `${item.full_name} (Cert: ${item.cert_number}) - Eval: ${item.last_6mo_eval_date}`;
            else if (collectionName === 'field_evaluations') displayText = `${item.eval_date}: ${item.radiographer_evaluated} evaluated by ${item.evaluator}`;
            else if (collectionName === 'work_plans') displayText = `Job ${item.job_number} - Loc: ${item.location} on ${item.planned_date}`;
            else if (collectionName === 'transport_logs') displayText = `${item.transport_date}: Cam ${item.camera_sn} to ${item.destination} (TI: ${item.transport_index})`;
            else if (collectionName === 'dosimetry_logs') displayText = `${item.personnel_name} (Dosimeter: ${item.dosimeter_serial}) - ${item.initial_reading}mR to ${item.final_reading}mR`;
            else if (collectionName === 'utilization_logs') displayText = `Job ${item.job_reference} - RIC: ${item.radiographer_in_charge} (Max: ${item.max_survey_reading} mR/hr)`;
            else if (collectionName === 'post_job_reports') displayText = `Report by ${item.completed_by} on ${new Date(item.timestamp).toLocaleDateString()}`;
            else displayText = `ID ${doc.id}: ${Object.values(item).slice(0, 3).join(' - ')}`;

            li.textContent = displayText;
            li.setAttribute('onclick', `openModal('${collectionName}', '${doc.id}')`);

            if (docUrl) {
                const link = document.createElement('a');
                link.href = docUrl; link.target = "_blank"; link.textContent = " [View File]";
                link.style.fontSize = "0.85em"; link.style.color = "#005A9C";
                link.onclick = (e) => e.stopPropagation(); 
                li.appendChild(link);
            }
            ul.appendChild(li);
        });

        triggerGlobalSync(); // Tell Dash and Calendar to recalculate
    }, (error) => {
        console.error("Real-time listener failed:", error);
    });
}

// Initialize Application
window.showSection = function(sectionId) {
    document.querySelectorAll('.module').forEach(el => { el.classList.remove('active'); el.style.display = 'none'; });
    const target = document.getElementById(sectionId);
    if (target) { target.classList.add('active'); target.style.display = 'block'; }
    if(sectionId === 'calendar-view' && calendar) setTimeout(() => { calendar.render(); }, 100);
}

window.togglePRI = function() {
    const locType = document.getElementById('wp-loc-type').value;
    const tempWrapper = document.getElementById('wp-temp-wrapper');
    const priWrapper = document.getElementById('wp-pri-wrapper');
    
    if(locType === 'pri') {
        tempWrapper.style.display = 'none'; priWrapper.style.display = 'flex';
        document.getElementById('wp-boundary').value = '';
    } else {
        tempWrapper.style.display = 'flex'; priWrapper.style.display = 'none';
        calculateBoundary(); 
    }
}

window.showSection('dashboard');
setupEventListeners();

// Turn on the Real-Time Listeners!
attachRealtimeListener('equipment', 'equipment-list');
attachRealtimeListener('sources', 'sources-list');
attachRealtimeListener('cameras', 'cameras-list');
attachRealtimeListener('personnel', 'personnel-list');
attachRealtimeListener('field_evaluations', 'eval-list');
attachRealtimeListener('work_plans', 'work-plans-list');
attachRealtimeListener('transport_logs', 'transport-list');
attachRealtimeListener('dosimetry_logs', 'dosimetry-list');
attachRealtimeListener('utilization_logs', 'utilization-list');
attachRealtimeListener('post_job_reports', 'reports-list');


// --- ADVANCED DELETE ENGINE (Storage Cleanup & Batch Relational Data) ---
let currentOpenDoc = null; 

window.openModal = async function(collectionName, docId) {
    const modal = document.getElementById('inspector-modal');
    const modalBody = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    modalBody.innerHTML = '<p>Loading database record...</p>';
    title.textContent = `${collectionName.replace(/_/g, ' ').toUpperCase()} RECORD`;
    modal.style.display = 'flex';
    
    try {
        const docSnap = await getDoc(doc(db, collectionName, docId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            currentOpenDoc = { collection: collectionName, id: docId, fullData: data };
            
            let html = '';
            for (const [key, value] of Object.entries(data)) {
                if(key === 'checklist' && typeof value === 'object') {
                    html += `<h4>Evaluation Checklist:</h4><ul>`;
                    for(const [checkKey, checkVal] of Object.entries(value)) {
                        html += `<li>${checkKey.replace(/_/g, ' ')}: <b>${checkVal ? 'PASS' : 'FAIL'}</b></li>`;
                    }
                    html += `</ul>`;
                } else if(key.includes('_url') && value) {
                    html += `<p><strong>${key.replace('_url', '').toUpperCase()}:</strong> <a href="${value}" target="_blank" style="color: #005A9C;">View Uploaded File</a></p>`;
                } else {
                    html += `<p><strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong> ${value}</p>`;
                }
            }
            modalBody.innerHTML = html;
        }
    } catch (err) { modalBody.innerHTML = '<p style="color:red;">Error retrieving data.</p>'; }
}

window.closeModal = function() { document.getElementById('inspector-modal').style.display = 'none'; currentOpenDoc = null; }
document.getElementById('modal-delete-btn').addEventListener('click', () => {
    if(currentOpenDoc) document.getElementById('delete-confirm-modal').style.display = 'flex';
});
window.closeConfirmModal = function() { document.getElementById('delete-confirm-modal').style.display = 'none'; }

window.executeDelete = async function() {
    if(!currentOpenDoc) return;
    try {
        const docRef = doc(db, currentOpenDoc.collection, currentOpenDoc.id);
        const data = currentOpenDoc.fullData;

        // 1. ORPHANED FILE CLEANUP
        const fileUrl = data.certificate_url || data.diagram_url || data.document_url;
        if (fileUrl) {
            try { 
                await deleteObject(ref(storage, fileUrl)); 
                console.log("Associated cloud storage file deleted.");
            } catch(e) { console.warn("Could not delete associated file", e); }
        }

        // 2. RELATIONAL BATCHED WRITES
        const batch = writeBatch(db);
        batch.delete(docRef);

        if (currentOpenDoc.collection === 'sources') {
            // Find all Work Plans that were going to use this deleted source
            const wpQuery = query(collection(db, 'work_plans'), where('source_id', '==', currentOpenDoc.id));
            const wpSnap = await getDocs(wpQuery);
            wpSnap.forEach(wp => {
                // Update them so they don't break, warning the user the source is missing
                batch.update(wp.ref, { source_id: 'DELETED', calculated_boundary_mr_hr: 'SOURCE MISSING - RECALCULATE' });
            });
        }
        
        await batch.commit(); // Execute safely as a single atomic operation

        closeConfirmModal();
        closeModal();
    } catch (err) {
        alert("Error deleting record.");
        console.error("Deletion Error:", err);
    }
}


// --- MATH & UTILS ---
async function populateSourceDropdown() {
    const sourceSelect = document.getElementById('wp-source');
    if (!sourceSelect) return;
    try {
        const querySnapshot = await getDocs(collection(db, 'sources'));
        sourceSelect.innerHTML = '<option value="">Select an active source...</option>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            sourceSelect.innerHTML += `<option value="${doc.id}" data-activity="${data.initial_activity_curies}" data-isotope="${data.isotope}">${data.isotope} (SN: ${data.serial_number}) - ${data.initial_activity_curies} Ci</option>`;
        });
    } catch (err) {}
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
    if(collimatorChecked) intensityAt1Ft *= 0.1;

    boundaryInput.value = Math.sqrt(intensityAt1Ft / 2.0).toFixed(1); 
}

// --- DASHBOARD, CALENDAR & EXPORTS ---
window.updateDashboard = async function() {
    try {
        const wpSnap = await getDocs(collection(db, 'work_plans'));
        if(document.getElementById('stat-work-plans')) document.getElementById('stat-work-plans').textContent = wpSnap.size;

        const srcSnap = await getDocs(collection(db, 'sources'));
        if(document.getElementById('stat-sources')) document.getElementById('stat-sources').textContent = srcSnap.size;

        const alertList = document.getElementById('alert-list');
        if(!alertList) return;
        alertList.innerHTML = '';
        let alertCount = 0;
        const today = new Date();
        const thirtyDays = new Date(); thirtyDays.setDate(today.getDate() + 30);

        const eqSnap = await getDocs(collection(db, 'equipment'));
        eqSnap.forEach(doc => {
            const eq = doc.data();
            if (eq.calibration_due_date) {
                const calDate = new Date(eq.calibration_due_date);
                if (calDate < today) { alertList.innerHTML += `<li style="color: #d9534f; border:none; background:none;">🚨 OVERDUE: ${eq.type} SN: ${eq.serial_number}</li>`; alertCount++; } 
                else if (calDate < thirtyDays) { alertList.innerHTML += `<li style="color: #f0ad4e; border:none; background:none;">⚠️ DUE SOON: ${eq.type} SN: ${eq.serial_number}</li>`; alertCount++; }
            }
        });

        const camSnap = await getDocs(collection(db, 'cameras'));
        camSnap.forEach(doc => {
            const cam = doc.data();
            if (cam.annual_maintenance_date) {
                const md = new Date(cam.annual_maintenance_date);
                if ((today - md)/86400000 > 365) { alertList.innerHTML += `<li style="color: #d9534f; border:none; background:none;">🚨 OVERDUE: Cam ${cam.serial_number} Maint</li>`; alertCount++; }
            }
        });

        const perSnap = await getDocs(collection(db, 'personnel'));
        perSnap.forEach(doc => {
            const per = doc.data();
            if (per.last_6mo_eval_date) {
                const ed = new Date(per.last_6mo_eval_date);
                if ((today - ed)/86400000 > 182) { alertList.innerHTML += `<li style="color: #d9534f; border:none; background:none;">🚨 DQ WARNING: ${per.full_name} 6-Mo Eval</li>`; alertCount++; }
            }
        });

        if (alertCount === 0) alertList.innerHTML = '<li style="color: #5cb85c; border:none; background:none;">✅ All systems in compliance.</li>';
    } catch (err) { }
}

async function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    if(!calendarEl) return;
    let events = [];
    try {
        const wpSnap = await getDocs(collection(db, 'work_plans'));
        wpSnap.forEach(doc => { const d = doc.data(); if(d.planned_date) events.push({ title: `Job: ${d.job_number}`, start: d.planned_date, color: '#005A9C' }); });

        const eqSnap = await getDocs(collection(db, 'equipment'));
        eqSnap.forEach(doc => { const d = doc.data(); if(d.calibration_due_date) events.push({ title: `Cal: ${d.serial_number}`, start: d.calibration_due_date, color: '#f0ad4e' }); });

        const perSnap = await getDocs(collection(db, 'personnel'));
        perSnap.forEach(doc => { const d = doc.data(); if(d.last_6mo_eval_date) { let due = new Date(d.last_6mo_eval_date); due.setMonth(due.getMonth() + 6); events.push({ title: `Eval: ${d.full_name.split(' ')[0]}`, start: due.toISOString().split('T')[0], color: '#d9534f' }); } });

    } catch(err) { }

    if(calendar) calendar.destroy(); 
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth', headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' },
        events: events, height: 650
    });
}

window.filterRecords = function() {
    const searchInput = document.getElementById('global-search').value.toLowerCase();
    document.querySelectorAll('ul[id$="-list"] li').forEach(record => {
        if(record.textContent.includes("No data found")) return;
        record.style.display = record.textContent.toLowerCase().includes(searchInput) ? '' : 'none';
    });
}

window.exportCSV = async function(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        if (querySnapshot.empty) { alert("No records found."); return; }
        const dataArray = [];
        querySnapshot.forEach((doc) => {
            let docData = doc.data(), flatData = { id: doc.id };
            for(const key in docData) {
                if(typeof docData[key] === 'object' && docData[key] !== null) for(const subKey in docData[key]) flatData[`${key}_${subKey}`] = docData[key][subKey];
                else flatData[key] = docData[key];
            }
            dataArray.push(flatData);
        });
        const headers = Object.keys(dataArray[0]);
        let csvContent = headers.join(",") + "\n";
        dataArray.forEach(row => { csvContent += headers.map(header => `"${String(row[header] !== undefined ? row[header] : "").replace(/"/g, '""')}"`).join(",") + "\n"; });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
        link.download = `${collectionName}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) { alert("Export failed."); }
}

window.generateInventory = async function() {
    try {
        const srcSnap = await getDocs(collection(db, 'sources'));
        const camSnap = await getDocs(collection(db, 'cameras'));
        let reportHtml = `<html><head><title>Inventory</title><style>body{font-family:Arial;padding:40px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:10px}th{background:#f4f4f9}.signatures{margin-top:60px;display:flex;justify-content:space-between}.sig-line{border-top:1px solid #333;width:300px;padding-top:5px;margin-top:50px}</style></head><body><h1>Quarterly Physical Inventory</h1><div style="display:flex;justify-content:space-between;margin-bottom:20px;"><span>Date: ${new Date().toLocaleDateString()}</span><span>Command: _______</span></div><h3>1. Sealed Sources</h3><table><tr><th>Isotope</th><th>Activity (Ci)</th><th>SN</th><th>Location</th><th>Verified</th></tr>`;
        srcSnap.forEach(doc => { const d=doc.data(); reportHtml += `<tr><td>${d.isotope}</td><td>${d.initial_activity_curies}</td><td>${d.serial_number}</td><td>${d.current_location}</td><td>[ ]</td></tr>`; });
        reportHtml += `</table><h3>2. Exposure Devices</h3><table><tr><th>Model</th><th>SN</th><th>Location</th><th>Verified</th></tr>`;
        camSnap.forEach(doc => { const d=doc.data(); reportHtml += `<tr><td>${d.make_model}</td><td>${d.serial_number}</td><td>Vault</td><td>[ ]</td></tr>`; });
        reportHtml += `</table><div class="signatures"><div><div class="sig-line">Verifier Signature</div></div><div><div class="sig-line">RSO Signature</div></div></div></body></html>`;
        const win = window.open('', '_blank'); win.document.write(reportHtml); win.document.close();
    } catch (err) { alert("Failed to generate inventory."); }
}
