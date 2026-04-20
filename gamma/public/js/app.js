// public/js/app.js
import { initAuth } from "./auth.js";
import { 
    showLoader, hideLoader, initTheme, toggleTheme, showSection, 
    togglePRI, toggleNA, initSignaturePad, clearSignature, 
    initSketchPad, clearSketch, openModal, closeModal, closeConfirmModal 
} from "./ui.js";

// We will build and import the data module next!
// import { loadAllData } from "./data.js";

// --- GLOBALS EXPOSED FOR UI MODULES ---
window.sigPadDirty = false; 
window.sketchPadDirty = false;
window.currentOpenDoc = null; 

// --- APP INITIALIZATION ---
export async function startApplication() {
    initTheme();
    showSection('dashboard');
    initSignaturePad();
    initSketchPad();
    
    // await loadAllData(); // Uncomment in Phase 3
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => console.log("Offline Mode Active")).catch(e => console.log(e));
    }
}

// --- KICKOFF ---
// Start listening for login state as soon as the file loads
initAuth();

// --- WINDOW EXPORTS FOR HTML INLINE HANDLERS ---
// This ensures your index.html onclick="" attributes still work perfectly!
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
