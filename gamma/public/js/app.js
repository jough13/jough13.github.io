// public/js/app.js
import { initAuth } from "./auth.js";
import { 
    showLoader, hideLoader, initTheme, toggleTheme, showSection, 
    togglePRI, toggleNA, initSignaturePad, clearSignature, 
    initSketchPad, clearSketch, openModal, closeModal, closeConfirmModal,
    startScanner, stopScanner, filterRecords, clearFilters, calculateBoundary,
    showToast, initNetworkMonitor // <-- Added UI Polish imports
} from "./ui.js";
import { 
    fetchData, setupEventListeners, executeDelete, 
    populateSourceDropdown, populatePersonnelDropdown, editRecord, cloneRecord, attachMinorListeners, approveWorkPlan
} from "./data.js";
import { 
    updateDecayChart, updateDashboard, updateDoseDashboard, updateDeployedAssetsDashboard,
    generateMasterPacket, generateQualCards, generatePDFInventory, generateRWP, 
    exportCSV, calculateDOTShipping, updateTransportSource, fullSystemBackup, executeSystemRestore,
    renderCalendar, generateAssetTags 
} from "./analytics.js";

window.sigPadDirty = false; 
window.sketchPadDirty = false;
window.currentOpenDoc = null; 
window.editModeId = null;
window.editModeCollection = null;
window.calendarInstance = null; 

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
    
    await updateDashboard(); 
    if(window.renderCalendar) await window.renderCalendar();
    await updateDecayChart(); 
    await updateDoseDashboard();
    await updateDeployedAssetsDashboard(); 
}

export async function startApplication() {
    initTheme();
    initNetworkMonitor(); // <-- Start monitoring offline mode
    showSection('dashboard');
    initSignaturePad();
    initSketchPad();
    
    setupEventListeners(); 
    attachMinorListeners(); 
    await populateSourceDropdown();
    await populatePersonnelDropdown();
    
    await loadAllData(); 
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => console.log(e));
    }

    setTimeout(() => {
        if (localStorage.getItem('hideDisclaimer') !== 'true') {
            const modal = document.getElementById('disclaimer-modal');
            if(modal) modal.style.display = 'flex';
        }
    }, 250);
}

initAuth(startApplication);

// --- WINDOW EXPORTS ---
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
window.startScanner = startScanner;
window.stopScanner = stopScanner;
window.filterRecords = filterRecords;
window.clearFilters = clearFilters;
window.calculateBoundary = calculateBoundary;
window.editRecord = editRecord;
window.cloneRecord = cloneRecord;
window.populatePersonnelDropdown = populatePersonnelDropdown;
window.populateSourceDropdown = populateSourceDropdown;
window.approveWorkPlan = approveWorkPlan; 
window.showToast = showToast; // <-- Expose Toast globally

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
window.renderCalendar = renderCalendar;
window.generateAssetTags = generateAssetTags;

window.loadAllData = loadAllData;
