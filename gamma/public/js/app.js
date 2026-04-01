// public/js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, getDocs, addDoc, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";

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
    if (btn) {
        btn.innerHTML = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}
initTheme(); // Run immediately

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
    const equipmentForm = document.getElementById('equipment-form');
    if (equipmentForm) {
        equipmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
            updateDashboard();
        });
    }

    const sourcesForm = document.getElementById('sources-form');
    if (sourcesForm) {
        sourcesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('src-cert');
            const file = fileInput.files[0];
            const certUrl = file ? await uploadFile(file, 'source_certs') : null;

            const data = {
                serial_number: document.getElementById('src-serial').value,
                isotope: document.getElementById('src-isotope').value,
                initial_activity_curies: parseFloat(document.getElementById('src-activity').value),
                activity_date: document.getElementById('src-date').value,
                last_leak_test_date: document.getElementById('src-leak-test').value,
                last_quarterly_maint_date: document.getElementById('src-quarterly-maint').value,
                current_location: 'Storage Vault',
                status: 'Stored',
                certificate_url: certUrl
            };
            await addData('sources', data);
            sourcesForm.reset();
            await fetchData('sources', 'sources-list');
            populateSourceDropdown(); 
            updateDashboard();
        });
    }

    const personnelForm = document.getElementById('personnel-form');
    if (personnelForm) {
        personnelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                full_name: document.getElementById('per-name').value,
                cert_number: document.getElementById('per-cert').value,
                trust_authorization_date: document.getElementById('per-trust').value,
                hazmat_expiration: document.getElementById('per-hazmat').value,
                logged_time: new Date().toISOString()
            };
            await addData('personnel', data);
            personnelForm.reset();
            await fetchData('personnel', 'personnel-list');
        });
    }

    const workPlansForm = document.getElementById('work-plans-form');
    if (workPlansForm) {
        workPlansForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('wp-diagram');
            const file = fileInput.files[0];
            const diagramUrl = file ? await uploadFile(file, 'work_plan_diagrams') : null;

            const data = {
                job_number: document.getElementById('wp-job').value,
                location: document.getElementById('wp-location').value,
                planned_date: document.getElementById('wp-date').value,
                source_id: document.getElementById('wp-source').value,
                calculated_boundary_mr_hr: parseFloat(document.getElementById('wp-boundary').value),
                collimator_used: document.getElementById('wp-collimator').checked,
                chp_approval_status: 'Pending',
                raso_approval_status: 'Pending',
                created_at: new Date().toISOString(),
                diagram_url: diagramUrl
            };
            await addData('work_plans', data);
            workPlansForm.reset();
            await fetchData('work_plans', 'work-plans-list');
            updateDashboard();
        });
    }

    const dosimetryForm = document.getElementById('dosimetry-form');
    if (dosimetryForm) {
        dosimetryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
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
        });
    }

    const reportsForm = document.getElementById('reports-form');
    if (reportsForm) {
        reportsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('pj-doc');
            const file = fileInput.files[0];
            const docUrl = file ? await uploadFile(file, 'report_documents') : null;

            const data = {
                completed_by: document.getElementById('pj-completed-by').value,
                source_secured: document.getElementById('pj-source-secured').checked,
                vault_verified: document.getElementById('pj-vault-verified').checked,
                daily_log_generated: document.getElementById('pj-daily-log').checked,
                completion_time: new Date().toISOString(),
                document_url: docUrl
            };
            await addData('post_job_reports', data);
            reportsForm.reset();
            await fetchData('post_job_reports', 'reports-list');
        });
    }

    const sourceSelect = document.getElementById('wp-source');
    const collimatorCheck = document.getElementById('wp-collimator');
    if(sourceSelect) sourceSelect.addEventListener('change', calculateBoundary);
    if(collimatorCheck) collimatorCheck.addEventListener('change', calculateBoundary);
}

async function addData(collectionName, data) {
    try {
        await addDoc(collection(db, collectionName), data);
    } catch (err) {
        console.error(`Error adding document:`, err);
        alert(`Failed to save record. Note: If offline, this will save locally and sync when connection returns!`);
    }
}

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
}

window.showSection('dashboard');
loadAllData();
setupEventListeners();
populateSourceDropdown(); 

async function loadAllData() {
    await Promise.all([
        fetchData('equipment', 'equipment-list'),
        fetchData('personnel', 'personnel-list'), 
        fetchData('sources', 'sources-list'),
        fetchData('work_plans', 'work-plans-list'),
        fetchData('dosimetry_logs', 'dosimetry-list'),
        fetchData('post_job_reports', 'reports-list')
    ]);
    updateDashboard(); 
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

            if (collectionName === 'equipment') {
                displayText = `${item.type?.toUpperCase() || 'UNKNOWN TYPE'} - Serial: ${item.serial_number} (Cal Due: ${item.calibration_due_date})`;
                docUrl = item.certificate_url;
            } else if (collectionName === 'sources') {
                displayText = `${item.isotope} (Serial: ${item.serial_number}) - Activity: ${item.initial_activity_curies} Ci on ${item.activity_date}`;
                docUrl = item.certificate_url;
            } else if (collectionName === 'personnel') {
                displayText = `${item.full_name} (Cert: ${item.cert_number}) - Hazmat Expires: ${item.hazmat_expiration}`;
            } else if (collectionName === 'work_plans') {
                displayText = `Job ${item.job_number} - Location: ${item.location} on ${item.planned_date}`;
                docUrl = item.diagram_url;
            } else if (collectionName === 'dosimetry_logs') {
                displayText = `${item.personnel_name} (Dosimeter: ${item.dosimeter_serial}) - ${item.initial_reading}mR to ${item.final_reading}mR`;
            } else if (collectionName === 'post_job_reports') {
                const date = new Date(item.completion_time).toLocaleDateString();
                displayText = `Report by ${item.completed_by} on ${date} (Source Secured: ${item.source_secured ? 'Yes' : 'No'})`;
                docUrl = item.document_url;
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
            sourceSelect.innerHTML += `
                <option value="${doc.id}" data-activity="${data.initial_activity_curies}" data-isotope="${data.isotope}">
                    ${data.isotope} (SN: ${data.serial_number}) - ${data.initial_activity_curies} Ci
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

    if(!sourceSelect || !sourceSelect.value) {
        if(boundaryInput) boundaryInput.value = '';
        return;
    }

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

// --- COMMAND CENTER DASHBOARD ---
window.updateDashboard = async function() {
    try {
        const wpSnap = await getDocs(collection(db, 'work_plans'));
        const statWorkPlans = document.getElementById('stat-work-plans');
        if(statWorkPlans) statWorkPlans.textContent = wpSnap.size;

        const srcSnap = await getDocs(collection(db, 'sources'));
        const statSources = document.getElementById('stat-sources');
        if(statSources) statSources.textContent = srcSnap.size;

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
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">🚨 OVERDUE: Source ${src.serial_number} leak test expired!</li>`;
                    alertCount++;
                } else if (daysSinceTest > 152) { 
                    alertList.innerHTML += `<li style="color: #f0ad4e; margin-bottom: 5px; background: transparent; border: none; padding:0; cursor: default;">⚠️ WARNING: Source ${src.serial_number} leak test due within 30 days.</li>`;
                    alertCount++;
                }
            }
        });

        if (alertCount === 0) {
            alertList.innerHTML = '<li style="color: #5cb85c; list-style-type: none; background: transparent; border: none; padding:0; cursor: default;">✅ All equipment and sources are in compliance.</li>';
        }
    } catch (err) {
        console.error("Error updating dashboard stats:", err);
    }
}

// --- INSPECTOR MODAL ---
let currentOpenDoc = null; 

window.openModal = async function(collectionName, docId) {
    const modal = document.getElementById('inspector-modal');
    const modalBody = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    
    modalBody.innerHTML = '<p>Loading database record...</p>';
    title.textContent = `${collectionName.replace('_', ' ').toUpperCase()} RECORD`;
    modal.style.display = 'flex';
    
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            currentOpenDoc = { collection: collectionName, id: docId };
            
            let html = '';
            for (const [key, value] of Object.entries(data)) {
                if(key.includes('_url') && value) {
                    html += `<p><strong>${key.replace('_url', '').toUpperCase()}:</strong> <a href="${value}" target="_blank" style="color: #005A9C;">View Uploaded File</a></p>`;
                } else {
                    html += `<p><strong>${key.replace(/_/g, ' ').toUpperCase()}:</strong> ${value}</p>`;
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
    currentOpenDoc = null;
}

document.getElementById('modal-delete-btn').addEventListener('click', () => {
    if(!currentOpenDoc) return;
    document.getElementById('delete-confirm-modal').style.display = 'flex';
});

window.closeConfirmModal = function() {
    document.getElementById('delete-confirm-modal').style.display = 'none';
}

window.executeDelete = async function() {
    if(!currentOpenDoc) return;
    try {
        await deleteDoc(doc(db, currentOpenDoc.collection, currentOpenDoc.id));
        closeConfirmModal();
        closeModal();
        
        let listId = '';
        if(currentOpenDoc.collection === 'equipment') listId = 'equipment-list';
        if(currentOpenDoc.collection === 'sources') {
            listId = 'sources-list';
            populateSourceDropdown(); 
        }
        if(currentOpenDoc.collection === 'personnel') listId = 'personnel-list';
        if(currentOpenDoc.collection === 'work_plans') listId = 'work-plans-list';
        if(currentOpenDoc.collection === 'dosimetry_logs') listId = 'dosimetry-list';
        if(currentOpenDoc.collection === 'post_job_reports') listId = 'reports-list';
        
        await fetchData(currentOpenDoc.collection, listId);
        updateDashboard();
    } catch (err) {
        alert("Error deleting record.");
        console.error("Deletion Error:", err);
    }
}

// --- SEARCH & FILTER LOGIC ---
window.filterRecords = function() {
    const searchInput = document.getElementById('global-search').value.toLowerCase();
    const allRecords = document.querySelectorAll('ul[id$="-list"] li');
    
    allRecords.forEach(record => {
        if(record.textContent.includes("No data found")) return;
        
        if (record.textContent.toLowerCase().includes(searchInput)) {
            record.style.display = '';
        } else {
            record.style.display = 'none';
        }
    });
}

// --- CSV EXPORT LOGIC ---
window.exportCSV = async function(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        if (querySnapshot.empty) {
            alert("No records found to export.");
            return;
        }

        const dataArray = [];
        querySnapshot.forEach((doc) => {
            dataArray.push({ database_id: doc.id, ...doc.data() });
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
