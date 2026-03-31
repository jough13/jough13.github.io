// public/js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

function setupEventListeners() {
    // 1. Equipment Form
    const equipmentForm = document.getElementById('equipment-form');
    if (equipmentForm) {
        equipmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                type: document.getElementById('eq-type').value,
                serial_number: document.getElementById('eq-serial').value,
                calibration_due_date: document.getElementById('eq-cal-date').value,
                maintenance_status: 'Operational'
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
            const data = {
                serial_number: document.getElementById('src-serial').value,
                isotope: document.getElementById('src-isotope').value,
                initial_activity_curies: parseFloat(document.getElementById('src-activity').value),
                activity_date: document.getElementById('src-date').value,
                current_location: 'Storage Vault',
                status: 'Stored'
            };
            await addData('sources', data);
            sourcesForm.reset();
            await fetchData('sources', 'sources-list');
        });
    }

    // 3. Work Plans Form
    const workPlansForm = document.getElementById('work-plans-form');
    if (workPlansForm) {
        workPlansForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                job_number: document.getElementById('wp-job').value,
                location: document.getElementById('wp-location').value,
                planned_date: document.getElementById('wp-date').value,
                calculated_boundary_mr_hr: parseFloat(document.getElementById('wp-boundary').value),
                collimator_used: document.getElementById('wp-collimator').checked,
                chp_approval_status: 'Pending',
                raso_approval_status: 'Pending',
                created_at: new Date().toISOString()
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
            const data = {
                completed_by: document.getElementById('pj-completed-by').value,
                source_secured: document.getElementById('pj-source-secured').checked,
                vault_verified: document.getElementById('pj-vault-verified').checked,
                daily_log_generated: document.getElementById('pj-daily-log').checked,
                completion_time: new Date().toISOString()
            };
            await addData('post_job_reports', data);
            reportsForm.reset();
            await fetchData('post_job_reports', 'reports-list');
        });
    }
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

// Initialize UI and data (module scripts are naturally deferred)
window.showSection('dashboard');
loadAllData();
setupEventListeners();

// Fetch placeholder data from Firestore
async function loadAllData() {
    await Promise.all([
        fetchData('equipment', 'equipment-list'),
        fetchData('sources', 'sources-list'),
        fetchData('work_plans', 'work-plans-list'),
        fetchData('dosimetry_logs', 'dosimetry-list'),
        fetchData('post_job_reports', 'reports-list')
    ]);
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

            if (collectionName === 'equipment') {
                displayText = `${item.type?.toUpperCase() || 'UNKNOWN TYPE'} - Serial: ${item.serial_number} (Cal Due: ${item.calibration_due_date})`;
            } else if (collectionName === 'sources') {
                displayText = `${item.isotope} (Serial: ${item.serial_number}) - Activity: ${item.initial_activity_curies} Ci on ${item.activity_date}`;
            } else if (collectionName === 'work_plans') {
                displayText = `Job ${item.job_number} - Location: ${item.location} on ${item.planned_date}`;
            } else if (collectionName === 'dosimetry_logs') {
                displayText = `${item.personnel_name} (Dosimeter: ${item.dosimeter_serial}) - ${item.initial_reading}mR to ${item.final_reading}mR`;
            } else if (collectionName === 'post_job_reports') {
                const date = new Date(item.completion_time).toLocaleDateString();
                displayText = `Report by ${item.completed_by} on ${date} (Source Secured: ${item.source_secured ? 'Yes' : 'No'})`;
            } else {
                // Fallback
                const values = Object.values(item).slice(0, 3).join(' - ');
                displayText = `ID ${doc.id}: ${values}`;
            }

            li.textContent = displayText;
            ul.appendChild(li);
        });
    } catch (err) {
        console.error(`Error fetching collection ${collectionName}:`, err);
        ul.innerHTML = `<li style="color:red;">Error loading data or Firestore configured incorrectly.</li>`;
    }
}
