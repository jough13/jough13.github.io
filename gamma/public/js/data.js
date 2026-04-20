// public/js/data.js

import { calculateCurrentActivity } from "./analytics.js";
import { formMaps } from "./app.js";
import { ADMIN_EMAIL } from "./auth.js";

import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-storage.js";
import { db, storage, auth } from "./firebase-config.js";
import { showLoader, hideLoader, closeConfirmModal, closeModal } from "./ui.js";

// --- STATE MANAGERS ---
const activeListeners = {}; 

// --- UTILITIES ---
export async function uploadFile(file, folderPath) {
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
    } catch (err) {
        console.error("Audit log failed to write:", err);
    }
}

// --- CORE CRUD OPERATIONS ---
export async function addData(collectionName, data, formMaps) {
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
            
            // Reset Form UI
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
        } else {
            if(!data.timestamp) data.timestamp = new Date().toISOString();
            const newDocRef = await addDoc(collection(db, collectionName), data);
            await logAudit('CREATED', collectionName, newDocRef.id, `New record added.`);
        }
    } catch (err) {
        console.error(`Error saving document:`, err);
        alert(`Failed to save record.`);
    }
}

export async function executeDelete() {
    if(!window.currentOpenDoc) return;
    try {
        showLoader();
        const colToDel = window.currentOpenDoc.collection;
        const idToDel = window.currentOpenDoc.id;
        
        await deleteDoc(doc(db, colToDel, idToDel));
        await logAudit('DELETED', colToDel, idToDel, `Record permanently deleted.`);
        
        closeConfirmModal();
        closeModal();
        
        // Let the UI charts/dashboards know they need to refresh
        if (window.updateDashboard) await window.updateDashboard();
        if (window.renderCalendar) await window.renderCalendar();
        hideLoader();
    } catch (err) {
        hideLoader();
        alert("Error deleting record.");
        console.error("Deletion Error:", err);
    }
}

// --- LIVE DATA SYNC (onSnapshot) ---
export function fetchData(collectionName, listId) {
    return new Promise((resolve) => {
        const ul = document.getElementById(listId);
        if (!ul) return resolve();

        if (activeListeners[collectionName]) {
            activeListeners[collectionName](); 
        }

        let isFirstLoad = true;

        activeListeners[collectionName] = onSnapshot(collection(db, collectionName), (querySnapshot) => {
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

                    // Standard UI Formatting based on Collection
                    if (collectionName === 'equipment') {
                        displayText = `${item.type?.toUpperCase() || 'UNKNOWN TYPE'} - Serial: ${item.serial_number} (Cal Due: ${item.calibration_due_date})`;
                        docUrl = item.certificate_url;
                    } else if (collectionName === 'sources') {
                        const statusTag = item.vault_status === 'OUT' ? ' [🦺 DEPLOYED]' : '';
                        displayText = `${item.isotope} (SN: ${item.serial_number}) - Initial: ${item.initial_activity_curies} Ci${statusTag}`;
                        if(item.vault_status === 'OUT') li.style.borderLeft = "5px solid #f0ad4e";
                        docUrl = item.certificate_url;
                    } else if (collectionName === 'cameras') {
                        const statusTag = item.vault_status === 'OUT' ? ' [🦺 DEPLOYED]' : '';
                        displayText = `${item.make_model} (SN: ${item.serial_number}) - Maint: ${item.annual_maintenance_date}${statusTag}`;
                        if(item.vault_status === 'OUT') li.style.borderLeft = "5px solid #f0ad4e";
                    } else if (collectionName === 'personnel') {
                        displayText = `${item.full_name} (Cert: ${item.cert_number}) - Eval: ${item.last_6mo_eval_date}`;
                    } else if (collectionName === 'work_plans') {
                        displayText = `Job ${item.job_number} - Location: ${item.location} (${item.location_type}) on ${item.planned_date}`;
                        docUrl = item.diagram_url;
                    } else if (collectionName === 'transport_logs') {
                        displayText = `${item.transport_date}: Camera ${item.camera_sn} to ${item.destination}`;
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

            if (isFirstLoad) {
                isFirstLoad = false;
                resolve();
            }
        }, (err) => {
            console.error(`Error syncing ${collectionName}:`, err);
            ul.innerHTML = `<li style="color:red; background: transparent; border: none;">Error loading live data.</li>`;
            resolve(); 
        });
    });
}

// --- INITIALIZE ALL EVENT LISTENERS ---
export function setupEventListeners(formMaps) {
    
    // Example: Equipment Form Listener
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
            await addData('equipment', data, formMaps);
            equipmentForm.reset();
            if(window.updateDashboard) window.updateDashboard();
            if(window.renderCalendar) window.renderCalendar(); 
            hideLoader();
        });
    }

    // Example: Vault Check-In/Out Listener
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
            const status = action === 'checkout' ? 'OUT' : 'IN';

            try {
                if (camSN) {
                    const camQ = query(collection(db, 'cameras'), where('serial_number', '==', camSN));
                    const camSnap = await getDocs(camQ);
                    camSnap.forEach(async (d) => await updateDoc(doc(db, 'cameras', d.id), { vault_status: status }));
                }
                if (srcSN) {
                    const srcQ = query(collection(db, 'sources'), where('serial_number', '==', srcSN));
                    const srcSnap = await getDocs(srcQ);
                    srcSnap.forEach(async (d) => await updateDoc(doc(db, 'sources', d.id), { vault_status: status }));
                }
                assetForm.reset();
                if(window.updateDeployedAssetsDashboard) await window.updateDeployedAssetsDashboard();
            } catch (err) {
                console.error("Asset Tracking Error:", err);
            } finally {
                hideLoader();
            }
        });
    }

    // Universal Form Listener for all other mapped forms
    for (const [collectionName, map] of Object.entries(formMaps)) {
        if (map.formId === 'equipment-form') continue; // Handled explicitly above

        const form = document.getElementById(map.formId);
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                showLoader();
                let data = {};
                
                // 1. Grab all standard text/number/checkbox inputs mapped in formMaps
                for (const [dbKey, htmlId] of Object.entries(map.fields)) {
                    const el = document.getElementById(htmlId);
                    if (el) {
                        data[dbKey] = el.type === 'checkbox' ? el.checked : el.value;
                    }
                }

                // 2. Handle nested checklist items (for Field Evaluations)
                if (map.nested && map.nested.checklist) {
                    data.checklist = {};
                    for (const [chkKey, chkId] of Object.entries(map.nested.checklist)) {
                        const cel = document.getElementById(chkId);
                        if(cel) data.checklist[chkKey] = cel.checked;
                    }
                }

                // 3. Handle Special Cases (Files, Canvases, Vault Status, Multi-Selects)
                if (collectionName === 'sources' || collectionName === 'cameras') {
                    data.vault_status = 'IN';
                    if (collectionName === 'sources') {
                        const fileInput = document.getElementById('src-cert');
                        if(fileInput && fileInput.files[0]) data.certificate_url = await uploadFile(fileInput.files[0], 'source_certs');
                    }
                }

                if (collectionName === 'work_plans') {
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

                if (collectionName === 'post_job_reports' && window.sigPadDirty) {
                    const canvas = document.getElementById('sig-canvas');
                    if(canvas) data.signature_data = canvas.toDataURL('image/png');
                }

                // Save to database and reset UI
                await addData(collectionName, data, formMaps);
                
                form.reset();
                if (collectionName === 'work_plans') window.clearSketch();
                if (collectionName === 'post_job_reports') window.clearSignature();
                
                if (window.updateDashboard) window.updateDashboard();
                if (window.renderCalendar) window.renderCalendar();
                hideLoader();
            });
        }
    }
}

// --- DROPDOWN POPULATORS ---
export async function populatePersonnelDropdown() {
    const dlNameSelect = document.getElementById('dl-name');
    if (!dlNameSelect) return;
    try {
        const querySnapshot = await getDocs(collection(db, 'personnel'));
        dlNameSelect.innerHTML = '<option value="">Select Personnel...</option>';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            dlNameSelect.innerHTML += `<option value="${data.full_name}">${data.full_name} (${data.cert_number})</option>`;
        });
    } catch (err) { console.error("Error loading personnel:", err); }
}

export async function populateSourceDropdown() {
    const wpSelect = document.getElementById('wp-source');
    const trSelect = document.getElementById('tr-source');
    try {
        const querySnapshot = await getDocs(collection(db, 'sources'));
        const optionsHTML = '<option value="">Select an active source...</option>';
        if(wpSelect) wpSelect.innerHTML = optionsHTML;
        if(trSelect) trSelect.innerHTML = optionsHTML;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.vault_status !== 'DELETED') {
                const currentAct = calculateCurrentActivity(data.initial_activity_curies, data.isotope, data.activity_date);
                const opt = `<option value="${doc.id}" data-activity="${currentAct}" data-isotope="${data.isotope}">${data.isotope} (SN: ${data.serial_number}) - ${currentAct} Ci</option>`;
                if(wpSelect) wpSelect.innerHTML += opt;
                if(trSelect) trSelect.innerHTML += opt;
            }
        });
    } catch (err) { console.error("Error loading sources:", err); }
}

// --- EDIT & CLONE ENGINE ---
export function editRecord() {
    if(!window.currentOpenDoc || !window.currentOpenDoc.fullData) return;
    if (window.currentOpenDoc.collection === 'work_plans' && window.currentOpenDoc.fullData.rso_approval_status === 'Approved') {
        const currentUser = auth.currentUser ? auth.currentUser.email : '';
        if (currentUser.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            alert("🔒 COMPLIANCE LOCK: This Work Plan has been officially approved by the RSO and cannot be modified.");
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

// Attach isolated UI event listeners
export function attachMinorListeners() {
    // DOT Math auto-calc listeners
    ['tr-isotope', 'tr-category', 'tr-activity', 'tr-surface', 'tr-1m'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', window.calculateDOTShipping);
            el.addEventListener('change', window.calculateDOTShipping);
        }
    });

    // Boundary auto-calc listeners
    const sourceSelect = document.getElementById('wp-source');
    const collimatorCheck = document.getElementById('wp-collimator');
    if(sourceSelect) sourceSelect.addEventListener('change', window.calculateBoundary);
    if(collimatorCheck) collimatorCheck.addEventListener('change', window.calculateBoundary);

    // Disclaimer Modal
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
        });
    }
}
