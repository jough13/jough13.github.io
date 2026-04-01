// public/js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Helper function to upload files to Firebase Storage
async function uploadFile(file, folderPath) {
    if (!file) return null;
    try {
        const fileRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Failed to upload file. Check console.");
        return null;
    }
}

function setupEventListeners() {
    // 1. Equipment Form
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
        });
    }

    // 2. Sources Form
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
            populateSourceDropdown(); // Update the dropdown with the new source!
        });
    }

    // 2.5 Personnel Form
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

    // 3. Work Plans Form
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
        });
    }

    // 4. Dosimetry Form
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

    // 5. Reports Form
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

    // Attach listeners for the auto-math
    const sourceSelect = document.getElementById('wp-source');
    const collimatorCheck = document.getElementById('wp-collimator');
    if(sourceSelect) sourceSelect.addEventListener('change', calculateBoundary);
    if(collimatorCheck) collimatorCheck.addEventListener('change', calculateBoundary);
}

async function addData(collectionName, data) {
    try {
        await addDoc(collection(db, collectionName), data);
    } catch (err) {
        console.error(`Error adding document to ${collectionName}:`, err);
        alert(`Failed to add record to ${collectionName}. Check console for details.`);
    }
}

// Expose showSection globally so inline onclick handlers in HTML continue to work
window.showSection = function(sectionId) {
    // Hide all sections
    document.querySelectorAll('.module').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });

    // Show the selected section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }

    // Hide dashboard if showing another section
    if (sectionId !== 'dashboard') {
        const dashboard = document.getElementById('dashboard');
        if(dashboard) dashboard.style.display = 'none';
    } else {
        const dashboard = document.getElementById('dashboard');
        if(dashboard) dashboard.style.display = 'block';
    }
}

// Initialize UI and data
window.showSection('dashboard');
loadAllData();
setupEventListeners();
populateSourceDropdown(); // Initial load of the dropdown

// Fetch placeholder data from Firestore
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
            ul.innerHTML = `<li>No data found in ${collectionName}.</li>`;
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
                // Prevent the modal from opening when clicking the document link directly
                link.onclick = (e) => e.stopPropagation(); 
                li.appendChild(link);
            }

            ul.appendChild(li);
        });
    } catch (err) {
        console.error(`Error fetching collection ${collectionName}:`, err);
        ul.innerHTML = `<li style="color:red;">Error loading data or Firestore configured incorrectly.</li>`;
    }
}

// --- NEW FEATURES: RELATIONAL DATA & MATH ---

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
                    html += `<p><strong>${key.replace('_url', '').toUpperCase()}:</strong> <a href="${value}" target="_blank">View Uploaded File</a></p>`;
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
            populateSourceDropdown(); // Update dropdown if a source is deleted!
        }
        if(currentOpenDoc.collection === 'personnel') listId = 'personnel-list';
        if(currentOpenDoc.collection === 'work_plans') listId = 'work-plans-list';
        if(currentOpenDoc.collection === 'dosimetry_logs') listId = 'dosimetry-list';
        if(currentOpenDoc.collection === 'post_job_reports') listId = 'reports-list';
        
        await fetchData(currentOpenDoc.collection, listId);
    } catch (err) {
        alert("Error deleting record. Check console for details.");
        console.error("Deletion Error:", err);
    }
}

// --- NEW FEATURE: COMMAND CENTER DASHBOARD ---

window.updateDashboard = async function() {
    try {
        // 1. Update Quick Stats
        const wpSnap = await getDocs(collection(db, 'work_plans'));
        const statWorkPlans = document.getElementById('stat-work-plans');
        if(statWorkPlans) statWorkPlans.textContent = wpSnap.size;

        const srcSnap = await getDocs(collection(db, 'sources'));
        const statSources = document.getElementById('stat-sources');
        if(statSources) statSources.textContent = srcSnap.size;

        // 2. Scan for Compliance Alerts
        const alertList = document.getElementById('alert-list');
        if(!alertList) return;
        
        alertList.innerHTML = '';
        let alertCount = 0;
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        // Check Equipment Calibration Dates
        const eqSnap = await getDocs(collection(db, 'equipment'));
        eqSnap.forEach(doc => {
            const eq = doc.data();
            if (eq.calibration_due_date) {
                const calDate = new Date(eq.calibration_due_date);
                if (calDate < today) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px;">🚨 OVERDUE: ${eq.type} (SN: ${eq.serial_number}) calibration expired!</li>`;
                    alertCount++;
                } else if (calDate < thirtyDaysFromNow) {
                    alertList.innerHTML += `<li style="color: #f0ad4e; margin-bottom: 5px;">⚠️ WARNING: ${eq.type} (SN: ${eq.serial_number}) calibration due within 30 days.</li>`;
                    alertCount++;
                }
            }
        });

        // Check Source Leak Tests (Requires < 6 months / ~182 days)
        srcSnap.forEach(doc => {
            const src = doc.data();
            if (src.last_leak_test_date) {
                const lastTest = new Date(src.last_leak_test_date);
                const daysSinceTest = (today - lastTest) / (1000 * 60 * 60 * 24);
                
                if (daysSinceTest > 182) {
                    alertList.innerHTML += `<li style="color: #d9534f; margin-bottom: 5px;">🚨 OVERDUE: Source ${src.serial_number} leak test expired (>6 months)!</li>`;
                    alertCount++;
                } else if (daysSinceTest > 152) { // Within 30 days of expiring
                    alertList.innerHTML += `<li style="color: #f0ad4e; margin-bottom: 5px;">⚠️ WARNING: Source ${src.serial_number} leak test due within 30 days.</li>`;
                    alertCount++;
                }
            }
        });

        // If everything is perfectly compliant
        if (alertCount === 0) {
            alertList.innerHTML = '<li style="color: #5cb85c; list-style-type: none;">✅ All equipment and sources are currently in compliance.</li>';
        }

    } catch (err) {
        console.error("Error updating dashboard stats:", err);
    }
}
