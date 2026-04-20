// public/js/app.js
import { initAuth } from "./auth.js";
import { 
    showLoader, hideLoader, initTheme, toggleTheme, showSection, 
    togglePRI, toggleNA, initSignaturePad, clearSignature, 
    initSketchPad, clearSketch, openModal, closeModal, closeConfirmModal 
} from "./ui.js";
import { fetchData, setupEventListeners, executeDelete } from "./data.js";

// --- GLOBALS EXPOSED FOR UI MODULES ---
window.sigPadDirty = false; 
window.sketchPadDirty = false;
window.currentOpenDoc = null; 
window.editModeId = null;
window.editModeCollection = null;

// --- FORM MAPS (Moved to orchestrator so both UI and Data can access it) ---
export const formMaps = {
    'equipment': { formId: 'equipment-form', fields: { type: 'eq-type', serial_number: 'eq-serial', calibration_due_date: 'eq-cal-date' } },
    'sources': { formId: 'sources-form', fields: { serial_number: 'src-serial', isotope: 'src-isotope', initial_activity_curies: 'src-activity', activity_date: 'src-date', last_leak_test_date: 'src-leak-test' } },
    // ... [Paste the rest of your formMaps object here] ...
};

// --- DATA INITIALIZATION ---
export async function loadAllData() {
    // 1. Fetch all collections in parallel
    await Promise.all([
        fetchData('equipment', 'equipment-list'),
        fetchData('sources', 'sources-list'),
        fetchData('cameras', 'cameras-list'),
        fetchData('personnel', 'personnel-list'), 
        fetchData('work_plans', 'work-plans-list'),
        fetchData('transport_logs', 'transport-list'),
        // ... add the rest of your collections here
    ]);
    
    // 2. Await analytics/UI rendering sequentially (These remain in app.js for Phase 4)
    if(window.updateDashboard) await window.updateDashboard(); 
    if(window.renderCalendar) await window.renderCalendar();
    if(window.updateDecayChart) await window.updateDecayChart(); 
    if(window.updateDoseDashboard) await window.updateDoseDashboard();
    if(window.updateDeployedAssetsDashboard) await window.updateDeployedAssetsDashboard(); 
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
