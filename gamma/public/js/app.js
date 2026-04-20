// public/js/app.js
import { initAuth } from "./auth.js";
import { 
    showLoader, hideLoader, initTheme, toggleTheme, showSection, 
    togglePRI, toggleNA, initSignaturePad, clearSignature, 
    initSketchPad, clearSketch, openModal, closeModal, closeConfirmModal 
} from "./ui.js";
import { fetchData, setupEventListeners, executeDelete } from "./data.js";
import { 
    updateDecayChart, updateDashboard, updateDoseDashboard, updateDeployedAssetsDashboard,
    generateMasterPacket, generateQualCards, generatePDFInventory, generateRWP, 
    exportCSV, calculateDOTShipping, updateTransportSource, fullSystemBackup, executeSystemRestore,
    renderCalendar, generateAssetTags 
} from "./analytics.js";

// And add them to your window exports at the bottom:
window.renderCalendar = renderCalendar;
window.generateAssetTags = generateAssetTags;

// --- GLOBALS EXPOSED FOR UI MODULES ---
window.sigPadDirty = false; 
window.sketchPadDirty = false;
window.currentOpenDoc = null; 
window.editModeId = null;
window.editModeCollection = null;

// --- FORM MAPS ---
export const formMaps = {
    'equipment': { formId: 'equipment-form', fields: { type: 'eq-type', serial_number: 'eq-serial', calibration_due_date: 'eq-cal-date' } },
    'sources': { formId: 'sources-form', fields: { serial_number: 'src-serial', isotope: 'src-isotope', initial_activity_curies: 'src-activity', activity_date: 'src-date', last_leak_test_date: 'src-leak-test' } },
    'cameras': { formId: 'cameras-form', fields: { make_model: 'cam-model', serial_number: 'cam-serial', du_leak_test_date: 'cam-du-date', annual_maintenance_date: 'cam-maint-date' } },
    'personnel': { formId: 'personnel-form', fields: { full_name: 'per-name', cert_number: 'per-cert', trust_authorization_date: 'per-trust', hazmat_expiration: 'per-hazmat', last_6mo_eval_date: 'per-eval', last_annual_drill_date: 'per-drill' } },
    'field_evaluations': { formId: 'eval-form', fields: { eval_date: 'ev-date', radiographer_evaluated: 'ev-rad', evaluator: 'ev-evaluator', duties_performed: 'ev-duties', comments: 'ev-comments' }, nested: { checklist: { followed_procedures: 'ev-c1', emergency_knowledge: 'ev-c2', instrument_checks: 'ev-c3', instrument_use: 'ev-c4', dosimetry_use: 'ev-c5', pri_checks: 'ev-c6', key_control: 'ev-c7', boundary_control: 'ev-c8', alara_used: 'ev-c9', logs_completed: 'ev-c10' } } },
    'work_plans': { formId: 'work-plans-form', fields: { job_number: 'wp-job', location_type: 'wp-loc-type', location: 'wp-location', planned_date: 'wp-date', source_id: 'wp-source', collimator_used: 'wp-collimator', calculated_boundary_mr_hr: 'wp-boundary', pri_entrance_tested: 'wp-pri-entrance', pri_alarm_tested: 'wp-pri-alarm' } },
    'transport_logs': { formId: 'transport-form', fields: { transport_date: 'tr-date', camera_sn: 'tr-camera', destination: 'tr-destination', max_contact_reading: 'tr-surface', transport_index: 'tr-ti', over_water_transport: 'tr-water' } },
    'dosimetry_logs': { formId: 'dosimetry-form', fields: { personnel_name: 'dl-name', dosimeter_serial: 'dl-serial', ratemeter_check_performed: 'dl-ratemeter-check', initial_reading: 'dl-initial', final_reading: 'dl-final' } },
    'utilization_logs': { formId: 'utilization-form', fields: { job_reference: 'ul-job', radiographer_in_charge: 'ul-ric', participants: 'ul-participants', survey_meter_serial: 'ul-meter', meter_response_checked: 'ul-response', max_survey_reading: 'ul-max-survey' } },
    'post_job_reports': { formId: 'reports-form', fields: { completed_by: 'pj-completed-by', source_secured: 'pj-source-secured', vault_verified: 'pj-vault-verified' } }
};

// --- DATA INITIALIZATION ---
export async function loadAllData() {
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
    
    // Call UI and Analytics updaters sequentially
    await updateDashboard(); 
    if(window.renderCalendar) await window.renderCalendar();
    await updateDecayChart(); 
    await updateDoseDashboard();
    await updateDeployedAssetsDashboard(); 
}

// --- APP INITIALIZATION ---
export async function startApplication() {
    initTheme();
    showSection('dashboard');
    initSignaturePad();
    initSketchPad();
    
    setupEventListeners(formMaps); 
    await loadAllData(); 
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => console.log(e));
    }
}

// --- KICKOFF ---
initAuth();

// --- WINDOW EXPORTS FOR HTML INLINE HANDLERS ---
window.showLoader = showLoader;
window.hideLoader = hideLoader;
window.toggleTheme = toggleTheme;
window.showSection = showSection;
window.togglePRI = togglePRI;
window.toggleNA = toggleNA;
window.clearSignature = clearSignature;
window.clearSketch = clearSketch;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeConfirmModal = closeConfirmModal;
window.executeDelete = executeDelete;

// Analytics & Reports Exports
window.updateDecayChart = updateDecayChart;
window.updateDashboard = updateDashboard;
window.updateDoseDashboard = updateDoseDashboard;
window.updateDeployedAssetsDashboard = updateDeployedAssetsDashboard;
window.generateMasterPacket = generateMasterPacket;
window.generateQualCards = generateQualCards;
window.generatePDFInventory = generatePDFInventory;
window.generateRWP = generateRWP;
window.exportCSV = exportCSV;
window.calculateDOTShipping = calculateDOTShipping;
window.updateTransportSource = updateTransportSource;
window.fullSystemBackup = fullSystemBackup;
window.executeSystemRestore = executeSystemRestore;
