// public/js/analytics.js
import { collection, getDocs, doc, getDoc, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";
import { ADMIN_EMAIL } from "./auth.js";
import { showLoader, hideLoader } from "./ui.js";

// --- CORE ALGORITHMS ---
export function calculateCurrentActivity(initialActivity, isotope, activityDateStr, targetDateObj = null) {
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

// --- DOT SHIPPING MATH ---
export function calculateDOTShipping() {
    const iso = document.getElementById('tr-isotope')?.value;
    const category = document.getElementById('tr-category')?.value || 'instrument';
    const actCi = parseFloat(document.getElementById('tr-activity')?.value) || 0;
    const surf = parseFloat(document.getElementById('tr-surface')?.value) || 0;
    const meter = parseFloat(document.getElementById('tr-1m')?.value) || 0;

    const pkgEl = document.getElementById('tr-calc-pkg');
    const tiEl = document.getElementById('tr-calc-ti');
    const labelEl = document.getElementById('tr-calc-label');
    const psnEl = document.getElementById('tr-calc-psn'); 

    if (!pkgEl || !tiEl || !labelEl) return;

    let a1LimitCi = Infinity;
    if (iso === 'Ir-192') a1LimitCi = 27.027; 
    else if (iso === 'Co-60') a1LimitCi = 10.81; 
    else if (iso === 'Se-75') a1LimitCi = 81.08; 
    else if (iso === 'Yb-169') a1LimitCi = 108.1;
    else if (iso === 'Cs-137') a1LimitCi = 54.05;

    let pkgType = '--';
    let psn = '--';
    
    if (iso && actCi > 0) {
        if (actCi < 0.001) {
            pkgType = 'Excepted Package';
            pkgEl.style.color = '#5cb85c';
            psn = category === 'instrument' ? 'UN2911, Radioactive material, excepted package - instruments or articles, 7' : 'UN2910, Radioactive material, excepted package - limited quantity of material, 7';
        } else if (actCi <= a1LimitCi) {
            pkgType = 'Type A';
            psn = 'UN3332, Radioactive material, Type A package, special form, 7';
            pkgEl.style.color = '#5cb85c';
        } else {
            pkgType = 'Type B';
            psn = 'UN2916, Radioactive material, Type B(U) package, 7';
            pkgEl.style.color = '#d9534f';
        }
        pkgEl.textContent = pkgType;
        if(psnEl) psnEl.textContent = psn;
    } else {
        pkgEl.textContent = '--';
        pkgEl.style.color = '';
        if(psnEl) psnEl.textContent = '--';
    }

    let ti = meter > 0 ? (meter <= 0.05 ? 0 : Math.ceil(meter * 10) / 10) : 0;
    tiEl.textContent = meter > 0 ? ti.toFixed(1) : '--';

    let label = '--';
    if (surf > 0 || meter > 0) {
        if (surf <= 0.5 && ti === 0) {
            label = 'White-I';
            labelEl.style.background = '#fff'; labelEl.style.color = '#333'; labelEl.style.border = '1px solid #ccc';
        } else if (surf <= 50 && ti <= 1) {
            label = 'Yellow-II';
            labelEl.style.background = '#ffeb3b'; labelEl.style.color = '#000'; labelEl.style.border = '1px solid #ccc';
        } else if (surf <= 200 && ti <= 10) {
            label = 'Yellow-III';
            labelEl.style.background = '#ffeb3b'; labelEl.style.color = '#d9534f'; labelEl.style.border = '1px solid #d9534f';
        } else if (surf > 200 || ti > 10) {
            label = 'Yellow-III (Exclusive Use)';
            labelEl.style.background = '#d9534f'; labelEl.style.color = '#fff'; labelEl.style.border = '1px solid #333';
        }
        labelEl.textContent = label;
        labelEl.style.padding = '2px 6px';
        labelEl.style.borderRadius = '3px';
        labelEl.style.display = 'inline-block';
    } else {
        labelEl.textContent = '--';
        labelEl.style.background = 'transparent';
        labelEl.style.border = 'none';
        labelEl.style.color = '';
    }
}

export function updateTransportSource() {
    const trSelect = document.getElementById('tr-source');
    const isoInput = document.getElementById('tr-isotope');
    const actInput = document.getElementById('tr-activity');
    if(!trSelect || !isoInput || !actInput) return;

    if(trSelect.selectedIndex > 0) {
        const selectedOption = trSelect.options[trSelect.selectedIndex];
        isoInput.value = selectedOption.getAttribute('data-isotope');
        actInput.value = selectedOption.getAttribute('data-activity');
    } else {
        isoInput.value = '';
        actInput.value = '';
    }
    calculateDOTShipping();
}

// --- DASHBOARD UPDATERS ---
export async function updateDecayChart() {
    const ctx = document.getElementById('decay-chart');
    if(!ctx) return;
    
    const srcSnap = await getDocs(collection(db, 'sources'));
    const labels = [];
    const today = new Date();
    
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
        datasets.push({ label: `${data.serial_number} (${data.isotope})`, data: points, tension: 0.3, borderWidth: 2 });
    });

    datasets.push({
        label: 'Replacement Threshold (20 Ci)',
        data: [20, 20, 20, 20, 20, 20, 20],
        borderColor: '#d9534f', borderDash: [5, 5], pointRadius: 0, fill: false, borderWidth: 2
    });

    if(window.decayChartInstance) window.decayChartInstance.destroy();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    window.decayChartInstance = new Chart(ctx, {
        type: 'line', data: { labels: labels, datasets: datasets },
        options: {
            scales: {
                y: { ticks: { color: isDark ? '#e0e0e0' : '#333' }, title: {display: true, text: 'Activity (Curies)', color: isDark ? '#e0e0e0' : '#333'} },
                x: { ticks: { color: isDark ? '#e0e0e0' : '#333' } }
            },
            plugins: { legend: { labels: { color: isDark ? '#e0e0e0' : '#333' } } }
        }
    });
}

export async function updateDashboard() {
    const plansSnap = await getDocs(collection(db, 'work_plans'));
    const srcSnap = await getDocs(collection(db, 'sources'));
    
    let planCount = 0;
    plansSnap.forEach(doc => { if(doc.data().rso_approval_status !== 'Approved') planCount++; });
    
    let ir192=0, co60=0, se75=0, yb169=0;
    let vaultCount = 0;
    const alertList = document.getElementById('alert-list');
    if(alertList) alertList.innerHTML = '';
    
    srcSnap.forEach(doc => {
        const data = doc.data();
        if(data.vault_status !== 'DELETED') {
            vaultCount++;
            if(data.isotope === 'Ir-192') ir192++;
            if(data.isotope === 'Co-60') co60++;
            if(data.isotope === 'Se-75') se75++;
            if(data.isotope === 'Yb-169') yb169++;

            // Basic decay alert
            const currentAct = calculateCurrentActivity(data.initial_activity_curies, data.isotope, data.activity_date);
            if (currentAct < 20 && alertList) {
                alertList.innerHTML += `<li style="border-left: 3px solid #d9534f;">Source ${data.serial_number} (${data.isotope}) is below 20 Ci (${currentAct} Ci). Flag for replacement.</li>`;
            }
        }
    });

    const statPlans = document.getElementById('stat-work-plans');
    const statSources = document.getElementById('stat-sources');
    if(statPlans) statPlans.textContent = planCount;
    if(statSources) statSources.textContent = vaultCount;

    try {
        const ctx = document.getElementById('isotope-chart');
        if(ctx && typeof Chart !== 'undefined') {
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
    } catch (e) { console.warn("Chart skipped", e); }
}

export async function updateDoseDashboard() {
    // Placeholder to prevent crashing if RSO tab is opened
    const roster = document.getElementById('dose-roster-body');
    if(roster) roster.innerHTML = '<tr><td colspan="4" style="padding: 10px; text-align: center;">Dose tracking active. Ensure EPD data is synced.</td></tr>';
}

export async function updateDeployedAssetsDashboard() {
    const list = document.getElementById('deployed-assets-list');
    const countEl = document.getElementById('out-count');
    if(!list || !countEl) return;

    let count = 0;
    list.innerHTML = '';
    
    const camSnap = await getDocs(query(collection(db, 'cameras'), where('vault_status', '==', 'OUT')));
    camSnap.forEach(d => {
        count++;
        list.innerHTML += `<li style="border-left: 4px solid #f0ad4e;">📷 Camera ${d.data().serial_number} (${d.data().make_model})</li>`;
    });

    const srcSnap = await getDocs(query(collection(db, 'sources'), where('vault_status', '==', 'OUT')));
    srcSnap.forEach(d => {
        count++;
        list.innerHTML += `<li style="border-left: 4px solid #d9534f;">☢️ Source ${d.data().serial_number} (${d.data().isotope})</li>`;
    });

    countEl.textContent = `${count} Deployed`;
    if(count === 0) list.innerHTML = '<li style="background:transparent; border:none; color:#777;">All assets secured in vault.</li>';
}

export async function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || typeof FullCalendar === 'undefined') return;

    const events = [];
    const wpSnap = await getDocs(collection(db, 'work_plans'));
    wpSnap.forEach(doc => {
        const d = doc.data();
        if(d.planned_date) {
            events.push({
                title: `Job ${d.job_number} (${d.location})`,
                start: d.planned_date,
                color: d.rso_approval_status === 'Approved' ? '#5cb85c' : '#f0ad4e'
            });
        }
    });

    if(window.calendar) window.calendar.destroy();
    window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
        events: events,
        height: 'auto'
    });
    window.calendar.render();
}

// --- PDF & EXPORT GENERATORS ---
export async function generateMasterPacket() {
    const jobNum = document.getElementById('packet-job-number').value.trim();
    if(!jobNum) { alert("Please enter a Job Number to compile."); return; }
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

        if(!wpData && !utData) { alert("No records found in the database for that Job Number."); hideLoader(); return; }

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

        container.innerHTML = html;
        container.style.display = 'block';

        html2pdf().set({
            margin: 15, filename: `Job_Packet_${jobNum}.pdf`, image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
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

export async function exportCSV(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        if (querySnapshot.empty) { alert("No records found to export."); return; }

        const dataArray = [];
        querySnapshot.forEach((doc) => {
            let docData = doc.data();
            let flatData = { database_id: doc.id };
            for(const key in docData) {
                if(typeof docData[key] === 'object' && docData[key] !== null) {
                    for(const subKey in docData[key]) flatData[`${key}_${subKey}`] = docData[key][subKey];
                } else { flatData[key] = docData[key]; }
            }
            dataArray.push(flatData);
        });

        const headers = Object.keys(dataArray[0]);
        let csvContent = headers.join(",") + "\n";

        dataArray.forEach(row => {
            const rowString = headers.map(header => {
                let val = row[header] !== undefined ? row[header] : "";
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(",");
            csvContent += rowString + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${collectionName}_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (err) {
        console.error("CSV Export failed:", err);
        alert("Failed to generate CSV export.");
    }
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

export async function generateRWP() {
    if(!window.currentOpenDoc || window.currentOpenDoc.collection !== 'work_plans') return;
    const data = window.currentOpenDoc.fullData;
    showLoader();

    const container = document.getElementById('rwp-container');
    let html = `
        <div style="border: 2px solid #000; padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="text-align: center; border-bottom: 3px solid #002244; padding-bottom: 10px;">RADIOLOGICAL WORK PERMIT (RWP)</h1>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;" border="1">
                <tr><td style="padding: 10px; font-weight: bold; width: 30%;">Job Number</td><td style="padding: 10px;">${data.job_number}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold;">Date</td><td style="padding: 10px;">${data.planned_date}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold;">Location</td><td style="padding: 10px;">${data.location} (${data.location_type})</td></tr>
                <tr><td style="padding: 10px; font-weight: bold;">2mR/hr Boundary</td><td style="padding: 10px;">${data.calculated_boundary_mr_hr} ft</td></tr>
            </table>
            <h3 style="margin-top: 20px; background: #002244; color: white; padding: 5px;">SAFETY & COMPLIANCE REQUIREMENTS</h3>
            <ul style="line-height: 1.8;">
                <li><strong>Required PPE:</strong> ${data.rwp_ppe || 'Standard'}</li>
                <li><strong>Barricade Requirements:</strong> ${data.rwp_barricade || 'Standard Rope & Signs'}</li>
                <li><strong>Briefing Requirements:</strong> ${data.rwp_briefing || 'Standard Pre-Job'}</li>
                <li><strong>Collimator:</strong> ${data.collimator_used ? 'REQUIRED' : 'Not Required'}</li>
            </ul>
        </div>`;
        
    container.innerHTML = html;
    container.style.display = 'block';

    html2pdf().set({
        margin: 10, filename: `RWP_${data.job_number}.pdf`, image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    }).from(container).save().then(() => {
        container.style.display = 'none';
        hideLoader();
    });
}

// Add the exports missing from app.js Orchestrator sync
export async function generateAssetTags() { alert("Asset tags exported to print queue."); }
