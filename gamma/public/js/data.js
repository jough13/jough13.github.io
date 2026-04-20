// public/js/data.js
import { calculateCurrentActivity } from "./analytics.js";
import { ADMIN_EMAIL } from "./auth.js";
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot, enableNetwork, disableNetwork } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { db, storage, auth } from "./firebase-config.js";
import { showLoader, hideLoader, closeConfirmModal, closeModal, showToast, setAppOffline, setAppOnline } from "./ui.js";

const activeListeners = {}; 

export const formMaps = {
    'equipment': { formId: 'equipment-form', fields: { type: 'eq-type', serial_number: 'eq-serial', calibration_due_date: 'eq-cal-date' } },
    'sources': { formId: 'sources-form', fields: { serial_number: 'src-serial', isotope: 'src-isotope', initial_activity_curies: 'src-activity', activity_date: 'src-date', last_leak_test_date: 'src-leak-test' } },
    'cameras': { formId: 'cameras-form', fields: { make_model: 'cam-model', serial_number: 'cam-serial', du_leak_test_date: 'cam-du-date', annual_maintenance_date: 'cam-maint-date' } },
    'personnel': { formId: 'personnel-form', fields: { full_name: 'per-name', cert_number: 'per-cert', trust_authorization_date: 'per-trust', hazmat_expiration: 'per-hazmat', last_6mo_eval_date: 'per-eval', last_annual_drill_date: 'per-drill' } },
    'field_evaluations': { formId: 'eval-form', fields: { eval_date: 'ev-date', radiographer_evaluated: 'ev-rad', evaluator: 'ev-evaluator', duties_performed: 'ev-duties', comments: 'ev-comments' }, nested: { checklist: { followed_procedures: 'ev-c1', emergency_knowledge: 'ev-c2', instrument_checks: 'ev-c3', instrument_use: 'ev-c4', dosimetry_use: 'ev-c5', pri_checks: 'ev-c6', key_control: 'ev-c7', boundary_control: 'ev-c8', alara_used: 'ev-c9', logs_completed: 'ev-c10' } } },
    'work_plans': { formId: 'work-plans-form', fields: { job_number: 'wp-job', location_type: 'wp-loc-type', location: 'wp-location', planned_date: 'wp-date', source_id: 'wp-source', collimator_used: 'wp-collimator', calculated_boundary_mr_hr: 'wp-boundary', pri_entrance_tested: 'wp-pri-entrance', pri_alarm_tested: 'wp-pri-alarm' } },
    'transport_logs': { formId: 'transport-form', fields: { transport_date: 'tr-date', camera_sn: 'tr-camera', destination: 'tr-destination', max_contact_reading: 'tr-surface', over_water_transport: 'tr-water' } },
    'dosimetry_logs': { formId: 'dosimetry-form', fields: { personnel_name: 'dl-name', dosimeter_serial: 'dl-serial', ratemeter_check_performed: 'dl-ratemeter-check', initial_reading: 'dl-initial', final_reading: 'dl-final' } },
    'utilization_logs': { formId: 'utilization-form', fields: { job_reference: 'ul-job', radiographer_in_charge: 'ul-ric', participants: 'ul-participants', survey_meter_serial: 'ul-meter', meter_response_checked: 'ul-response', max_survey_reading: 'ul-max-survey' } },
    'post_job_reports': { formId: 'reports-form', fields: { completed_by: 'pj-completed-by', source_secured: 'pj-source-secured', vault_verified: 'pj-vault-verified' } }
};

export async function manualGoOffline() {
    try {
        await disableNetwork(db); // Instantly cuts Firebase off, forcing instant cache reads
        document.getElementById('btn-force-offline').style.display = 'none';
        document.getElementById('btn-force-online').style.display = 'inline-block';
        document.getElementById('network-status').innerHTML = '🔴 Offline';
        document.getElementById('network-status').classList.add('status-offline');
        showToast("App is now in Offline Mode. Data will pull instantly from cache.", "warning");
    } catch(e) { console.error(e); }
}

export async function manualGoOnline() {
    try {
        showToast("Attempting to reconnect...", "info");
        await enableNetwork(db); // Re-opens Firebase's connection
        document.getElementById('btn-force-online').style.display = 'none';
        document.getElementById('btn-force-offline').style.display = 'inline-block';
        document.getElementById('network-status').innerHTML = '🟢 Online';
        document.getElementById('network-status').classList.remove('status-offline');
        showToast("Reconnected to database!", "success");
        if(window.loadAllData) window.loadAllData();
    } catch(e) { 
        console.error(e); 
        showToast("Reconnection failed.", "error"); 
    }
}

export async function uploadFile(file, folderPath) {
    if (!file) return null;
    try {
        const fileRef = ref(storage, `${folderPath}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading file:", error);
        showToast("Failed to upload file to storage.", "error");
        return null;
    }
}

export async function logAudit(action, collectionName, recordId, details) {
    try {
        const userEmail = auth.currentUser ? auth.currentUser.email : 'System';
        await addDoc(collection(db, 'audit_logs'), {
            timestamp: new Date().toISOString(),
            user: userEmail,
            action: action, 
            collection: collectionName,
            record_id: recordId,
            details: details
        });
    } catch (err) { console.error("Audit log failed to write:", err); }
}

export async function addData(collectionName, data) {
    try {
        if (window.editModeId && window.editModeCollection === collectionName) {
            const existingDoc = await getDoc(doc(db, collectionName, window.editModeId));
            if(existingDoc.exists()) {
                const existingData = existingDoc.data();
                for (const key in data) {
                    if (key.includes('_url') && data[key] === null) data[key] = existingData[key];
                    if (key === 'signature_data' && data[key] === null && existingData[key]) data[key] = existingData[key];
                    if (key === 'sketch_data' && data[key] === null && existingData[key]) data[key] = existingData[key];
                }
            }
            await updateDoc(doc(db, collectionName, window.editModeId), data);
            await logAudit('UPDATED', collectionName, window.editModeId, `Record modified.`);
            
            window.editModeId = null;
            window.editModeCollection = null;
            
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
            showToast("Record successfully updated.", "success");
        } else {
            if(!data.timestamp) data.timestamp = new Date().toISOString();
            const newDocRef = await addDoc(collection(db, collectionName), data);
            await logAudit('CREATED', collectionName, newDocRef.id, `New record added.`);
            showToast("New record created successfully.", "success");
        }
    } catch (err) {
        console.error(`Error saving document:`, err);
        showToast("Failed to save record. Check connection.", "error");
    }
}

export async function executeDelete() {
    if(!window.currentOpenDoc) return;
    try {
        showLoader();
        const colToDel = window.currentOpenDoc.collection;
        const idToDel = window.currentOpenDoc.id;
        
        if (colToDel === 'sources') {
            const fileInput = document.getElementById('del-src-file');
            if (!fileInput || !fileInput.files[0]) {
                hideLoader();
                showToast("Audit Requirement: You must upload transfer/disposal paperwork.", "error");
                return;
            }
            const file = fileInput.files[0];
            const fileUrl = await uploadFile(file, 'source_disposals');
            const status = document.getElementById('del-src-status').value;

            // Soft-Delete: We mark it deleted, but keep the record
            await updateDoc(doc(db, colToDel, idToDel), {
                vault_status: 'DELETED',
                disposal_status: status,
                disposal_record_url: fileUrl,
                disposal_date: new Date().toISOString()
            });
            await logAudit('DISPOSED', colToDel, idToDel, `Source officially disposed/transferred.`);
            showToast("Source officially archived and removed from active inventory.", "success");
            
        } else {
            // Standard Hard-Delete for non-sources
            await deleteDoc(doc(db, colToDel, idToDel));
            await logAudit('DELETED', colToDel, idToDel, `Record permanently deleted.`);
            showToast("Record permanently deleted.", "info");
        }
        
        closeConfirmModal();
        closeModal();
        
        if (window.updateDashboard) await window.updateDashboard();
        if (window.renderCalendar) await window.renderCalendar();
        if (window.updateDeployedAssetsDashboard) await window.updateDeployedAssetsDashboard();
        
        hideLoader();
    } catch (err) {
        hideLoader();
        console.error("Deletion Error:", err);
        showToast("Error processing deletion.", "error");
    }
}

export async function approveWorkPlan() {
    if (!window.currentOpenDoc || window.currentOpenDoc.collection !== 'work_plans') return;
    try {
        showLoader();
        await updateDoc(doc(db, 'work_plans', window.currentOpenDoc.id), { rso_approval_status: 'Approved' });
        await logAudit('UPDATED', 'work_plans', window.currentOpenDoc.id, `RSO officially approved Work Plan.`);
        closeModal();
        if(window.updateDashboard) window.updateDashboard();
        if(window.renderCalendar) window.renderCalendar();
        hideLoader();
        showToast("Work Plan officially approved by RSO.", "success");
    } catch (e) {
        console.error("Failed to approve work plan:", e);
        hideLoader();
        showToast("Failed to approve plan.", "error");
    }
}

export function fetchData(collectionName, listId) {
    return new Promise((resolve) => {
        const ul = document.getElementById(listId);
        if (!ul) return resolve();

        if (activeListeners[collectionName]) activeListeners[collectionName](); 
        let isFirstLoad = true;

        // NEW: 10-Second Firebase Timeout Detector
        let connectionTimeout = setTimeout(() => {
            setAppOffline(); // Turns the button RED and makes it clickable
        }, 10000);

        // Notice we added { includeMetadataChanges: true } to track cache vs server
        activeListeners[collectionName] = onSnapshot(collection(db, collectionName), { includeMetadataChanges: true }, (querySnapshot) => {
            
            // If data comes from the server, we are truly online.
            if (!querySnapshot.metadata.fromCache) {
                clearTimeout(connectionTimeout); // Cancel the offline timer
                setAppOnline(); // Turn button GREEN
            }
            
            ul.innerHTML = '';
            if (querySnapshot.empty) {
                ul.innerHTML = `<li style="background: transparent; border: none;">No data found in ${collectionName.replace('_', ' ')}.</li>`;
            } else {
                querySnapshot.forEach((doc) => {
                    const item = doc.data();
                    const li = document.createElement('li');
                    let displayText = '';
                    let docUrl = null;

                    let recordDate = item.timestamp || item.created_at || item.logged_time || item.completion_time || item.activity_date || item.planned_date || item.transport_date || item.eval_date || '';
                    if (recordDate) li.setAttribute('data-date', recordDate.split('T')[0]); 

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
                        const labelTag = item.dot_label ? item.dot_label : 'Unknown Label';
                        const tiTag = item.transport_index !== undefined ? item.transport_index : 'Unknown TI';
                        displayText = `${item.transport_date}: Camera ${item.camera_sn} to ${item.destination} | Label: ${labelTag} (TI: ${tiTag})`;
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
            }
            if (isFirstLoad) { isFirstLoad = false; resolve(); }
        }, (err) => {
            console.error(`Error syncing ${collectionName}:`, err);
            setAppOffline(); 
            ul.innerHTML = `<li style="color:red; background: transparent; border: none;">Error loading live data (Offline).</li>`;
            resolve(); 
        });
    });
}

export function setupEventListeners() {
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
            if(window.updateDashboard) window.updateDashboard();
            if(window.renderCalendar) window.renderCalendar(); 

            if(window.populateSurveyMeterDropdown) window.populateSurveyMeterDropdown();
            
            hideLoader();
        });
    }

    const assetForm = document.getElementById('asset-tracking-form');
    if (assetForm) {
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
                if (camSN) {
                    const camQ = query(collection(db, 'cameras'), where('serial_number', '==', camSN));
                    const camSnap = await getDocs(camQ);
                    camSnap.forEach(async (d) => await updateDoc(doc(db, 'cameras', d.id), { vault_status: status, current_job: job, current_user: user }));
                }
                if (srcSN) {
                    const srcQ = query(collection(db, 'sources'), where('serial_number', '==', srcSN));
                    const srcSnap = await getDocs(srcQ);
                    srcSnap.forEach(async (d) => await updateDoc(doc(db, 'sources', d.id), { vault_status: status, current_job: job, current_user: user }));
                }
                assetForm.reset();
                document.getElementById('trk-details-group').style.display = 'grid';
                showToast("Vault transfer recorded successfully.", "success");
                if(window.updateDeployedAssetsDashboard) await window.updateDeployedAssetsDashboard();
            } catch (err) {
                console.error("Asset Tracking Error:", err);
                showToast("Failed to process vault transfer.", "error");
            } finally {
                hideLoader();
            }
        });
    }

    for (const [collectionName, map] of Object.entries(formMaps)) {
        if (map.formId === 'equipment-form') continue; 

        const form = document.getElementById(map.formId);
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoader();
                let data = {};
                
                for (const [dbKey, htmlId] of Object.entries(map.fields)) {
                    const el = document.getElementById(htmlId);
                    if (el) {
                        if (el.type === 'checkbox') {
                            data[dbKey] = el.checked;
                        } else if (el.type === 'number') {
                            data[dbKey] = parseFloat(el.value) || 0;
                        } else {
                            data[dbKey] = el.disabled ? 'N/A' : el.value;
                        }
                    }
                }

                if (map.nested && map.nested.checklist) {
                    data.checklist = {};
                    for (const [chkKey, chkId] of Object.entries(map.nested.checklist)) {
                        const cel = document.getElementById(chkId);
                        if(cel) data.checklist[chkKey] = cel.checked;
                    }
                }

                if (collectionName === 'sources' || collectionName === 'cameras') {
                    data.vault_status = 'IN';
                    if (collectionName === 'sources') {
                        const fileInput = document.getElementById('src-cert');
                        if(fileInput && fileInput.files[0]) data.certificate_url = await uploadFile(fileInput.files[0], 'source_certs');
                    }
                }

                if (collectionName === 'work_plans') {
                    data.rso_approval_status = 'Pending';
                    data.raso_approval_status = 'Pending';
                    
                    const ppe = document.getElementById('wp-ppe');
                    if(ppe) data.rwp_ppe = Array.from(ppe.selectedOptions).map(o => o.value).join(', ');
                    
                    const bar = document.getElementById('wp-barricade');
                    if(bar) data.rwp_barricade = Array.from(bar.selectedOptions).map(o => o.value).join(', ');
                    
                    const brief = document.getElementById('wp-brief');
                    if(brief) data.rwp_briefing = Array.from(brief.selectedOptions).map(o => o.value).join(', ');

                    const fileInput = document.getElementById('wp-diagram');
                    if(fileInput && fileInput.files[0]) data.diagram_url = await uploadFile(fileInput.files[0], 'work_plans');

                    if (window.sketchPadDirty) {
                        const canvas = document.getElementById('sketch-canvas');
                        if(canvas) data.sketch_data = canvas.toDataURL('image/png');
                    }
                }
                
                if (collectionName === 'transport_logs') {
                    if(window.calculateDOTShipping) window.calculateDOTShipping();
                    data.content_category = document.getElementById('tr-category')?.value || '';
                    data.isotope = document.getElementById('tr-isotope')?.value || '';
                    data.activity_ci = parseFloat(document.getElementById('tr-activity')?.value) || 0;
                    data.package_type = document.getElementById('tr-calc-pkg')?.textContent || '--';
                    data.transport_index = parseFloat(document.getElementById('tr-calc-ti')?.textContent) || 0;
                    data.dot_label = document.getElementById('tr-calc-label')?.textContent || '--';
                    data.proper_shipping_name = document.getElementById('tr-calc-psn')?.textContent || '--';
                }

                if (collectionName === 'post_job_reports') {
                    data.daily_log_generated = true;
                    if (window.sigPadDirty) {
                        const canvas = document.getElementById('sig-canvas');
                        if(canvas) data.signature_data = canvas.toDataURL('image/png');
                    }
                }

                await addData(collectionName, data);
                
                if (collectionName === 'sources') {
                    if(window.populateSourceDropdown) window.populateSourceDropdown();
                    if(window.updateDecayChart) window.updateDecayChart();
                }
                if (collectionName === 'cameras') {
                    if(window.populateCameraDropdown) window.populateCameraDropdown();
                }
                if (collectionName === 'personnel' && window.populatePersonnelDropdown) {
                    window.populatePersonnelDropdown();
                }
                if ((collectionName === 'cameras' || collectionName === 'sources') && window.updateDeployedAssetsDashboard) {
                    window.updateDeployedAssetsDashboard();
                }
                
                form.reset();
                if (collectionName === 'work_plans' && window.clearSketch) window.clearSketch();
                if (collectionName === 'post_job_reports' && window.clearSignature) window.clearSignature();
                
                if (window.updateDashboard) window.updateDashboard();
                if (window.renderCalendar) window.renderCalendar();
                
                if (collectionName === 'personnel') {
                    ['per-cert', 'per-trust', 'per-hazmat', 'per-eval', 'per-drill'].forEach(id => {
                        const ele = document.getElementById(id);
                        if(ele) { ele.disabled = false; ele.required = true; ele.style.backgroundColor = ''; }
                    });
                }
                
                hideLoader();
            });
        }
    }
}

export async function populatePersonnelDropdown() {
    const dlNameSelect = document.getElementById('dl-name');
    const trkUserSelect = document.getElementById('trk-user'); 
    const evRadSelect = document.getElementById('ev-rad');
    const ulRicSelect = document.getElementById('ul-ric');
    const pjCompletedBySelect = document.getElementById('pj-completed-by');

    try {
        const querySnapshot = await getDocs(collection(db, 'personnel'));
        const optHTML = '<option value="">Select Personnel...</option>';
        if(dlNameSelect) dlNameSelect.innerHTML = optHTML;
        if(trkUserSelect) trkUserSelect.innerHTML = optHTML;
        if(evRadSelect) evRadSelect.innerHTML = optHTML;
        if(ulRicSelect) ulRicSelect.innerHTML = optHTML;
        if(pjCompletedBySelect) pjCompletedBySelect.innerHTML = optHTML;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const val = data.full_name;
            if(dlNameSelect) dlNameSelect.innerHTML += `<option value="${val}">${val} (${data.cert_number})</option>`;
            if(trkUserSelect) trkUserSelect.innerHTML += `<option value="${val}">${val}</option>`;
            if(evRadSelect) evRadSelect.innerHTML += `<option value="${val}">${val}</option>`;
            if(ulRicSelect) ulRicSelect.innerHTML += `<option value="${val}">${val}</option>`;
            if(pjCompletedBySelect) pjCompletedBySelect.innerHTML += `<option value="${val}">${val}</option>`;
        });
    } catch (err) { console.error("Error loading personnel:", err); }
}

export async function populateCameraDropdown() {
    const trkCamSelect = document.getElementById('trk-cam');
    const trCameraSelect = document.getElementById('tr-camera');
    try {
        const querySnapshot = await getDocs(collection(db, 'cameras'));
        const optHTML = '<option value="">Select Camera...</option>';
        if(trkCamSelect) trkCamSelect.innerHTML = optHTML;
        if(trCameraSelect) trCameraSelect.innerHTML = optHTML;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const opt = `<option value="${data.serial_number}">${data.make_model} (SN: ${data.serial_number})</option>`;
            if(trkCamSelect) trkCamSelect.innerHTML += opt;
            if(trCameraSelect) trCameraSelect.innerHTML += opt;
        });
    } catch (err) { console.error("Error loading cameras:", err); }
}

export async function populateSurveyMeterDropdown() {
    const ulMeterSelect = document.getElementById('ul-meter');
    if (!ulMeterSelect) return;
    try {
        const querySnapshot = await getDocs(collection(db, 'equipment'));
        ulMeterSelect.innerHTML = '<option value="">Select Survey Meter...</option>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            ulMeterSelect.innerHTML += `<option value="${data.serial_number}">${data.type} (SN: ${data.serial_number})</option>`;
        });
    } catch (err) { console.error("Error loading equipment:", err); }
}

export async function populateSourceDropdown() {
    const wpSelect = document.getElementById('wp-source');
    const trSelect = document.getElementById('tr-source');
    const trkSelect = document.getElementById('trk-src'); // NEW: Vault Source
    try {
        const querySnapshot = await getDocs(collection(db, 'sources'));
        const optionsHTML = '<option value="">Select an active source...</option>';
        if(wpSelect) wpSelect.innerHTML = optionsHTML;
        if(trSelect) trSelect.innerHTML = optionsHTML;
        if(trkSelect) trkSelect.innerHTML = '<option value="">Select Source...</option>';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.vault_status !== 'DELETED') {
                const currentAct = calculateCurrentActivity(data.initial_activity_curies, data.isotope, data.activity_date);
                const opt = `<option value="${doc.id}" data-activity="${currentAct}" data-isotope="${data.isotope}">${data.isotope} (SN: ${data.serial_number}) - ${currentAct} Ci</option>`;
                
                // The Vault form searches by Serial Number, not Database ID
                const trkOpt = `<option value="${data.serial_number}">${data.isotope} (SN: ${data.serial_number})</option>`;
                
                if(wpSelect) wpSelect.innerHTML += opt;
                if(trSelect) trSelect.innerHTML += opt;
                if(trkSelect) trkSelect.innerHTML += trkOpt;
            }
        });
    } catch (err) { console.error("Error loading sources:", err); }
}

// Camera Dropdown Logic
export async function populateCameraDropdown() {
    const trkCamSelect = document.getElementById('trk-cam');
    if (!trkCamSelect) return;
    try {
        const querySnapshot = await getDocs(collection(db, 'cameras'));
        trkCamSelect.innerHTML = '<option value="">Select Camera...</option>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            trkCamSelect.innerHTML += `<option value="${data.serial_number}">${data.make_model} (SN: ${data.serial_number})</option>`;
        });
    } catch (err) { console.error("Error loading cameras:", err); }
}

export function editRecord() {
    if(!window.currentOpenDoc || !window.currentOpenDoc.fullData) return;
    if (window.currentOpenDoc.collection === 'work_plans' && window.currentOpenDoc.fullData.rso_approval_status === 'Approved') {
        const currentUser = auth.currentUser ? auth.currentUser.email : '';
        if (currentUser.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            showToast("🔒 COMPLIANCE LOCK: This Work Plan has been officially approved by the RSO and cannot be modified.", "warning");
            return;
        }
    }
    populateFormForEditClone(window.currentOpenDoc, true);
}

export function cloneRecord() {
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
    closeModal();

    window.editModeId = isEdit ? id : null;
    window.editModeCollection = isEdit ? col : null;

    const form = document.getElementById(map.formId);
    const btn = form.querySelector('button[type="submit"]');
    if(!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
    btn.textContent = isEdit ? '💾 Update Record' : '📄 Create Clone';
    btn.style.backgroundColor = isEdit ? '#f0ad4e' : '#5bc0de';
    btn.style.color = isEdit ? '#333' : '#fff';

    for (const [dbKey, htmlId] of Object.entries(map.fields)) {
        const el = document.getElementById(htmlId);
        if(el && data[dbKey] !== undefined) {
            if(el.type === 'checkbox') {
                el.checked = data[dbKey];
            } else {
                const specificLabel = document.querySelector(`label[for="${htmlId}"]`);
                const checkbox = specificLabel ? specificLabel.querySelector('input[type="checkbox"]') : null;

                if (data[dbKey] === 'N/A') {
                    if (checkbox) { checkbox.checked = true; window.toggleNA(htmlId, checkbox); } 
                    else { el.value = 'N/A'; }
                } else {
                    if (checkbox) { checkbox.checked = false; window.toggleNA(htmlId, checkbox); }
                    el.value = data[dbKey];
                }
            }
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

export function attachMinorListeners() {
    ['tr-isotope', 'tr-category', 'tr-activity', 'tr-surface', 'tr-1m'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', window.calculateDOTShipping);
            el.addEventListener('change', window.calculateDOTShipping);
        }
    });

    const sourceSelect = document.getElementById('wp-source');
    const collimatorCheck = document.getElementById('wp-collimator');
    if(sourceSelect) sourceSelect.addEventListener('change', window.calculateBoundary);
    if(collimatorCheck) collimatorCheck.addEventListener('change', window.calculateBoundary);

    const ackCheckbox = document.getElementById('ack-checkbox');
    const proceedBtn = document.getElementById('disclaimer-proceed-btn');
    const dontShowCheckbox = document.getElementById('dont-show-checkbox');

    if (ackCheckbox && proceedBtn) {
        ackCheckbox.addEventListener('change', (e) => {
            proceedBtn.disabled = !e.target.checked;
            proceedBtn.style.opacity = e.target.checked ? '1' : '0.5';
            proceedBtn.style.cursor = e.target.checked ? 'pointer' : 'not-allowed';
        });
        proceedBtn.addEventListener('click', () => {
            if (dontShowCheckbox && dontShowCheckbox.checked) localStorage.setItem('hideDisclaimer', 'true');
            document.getElementById('disclaimer-modal').style.display = 'none';
            showToast("Welcome to the Gamma Radiography Tracker", "info");
        });
    }
}
