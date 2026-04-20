// public/js/app.js
import { initAuth } from "./auth.js";
// We will build and import these in Phase 2!
// import { initUI, showSection, toggleTheme } from "./ui.js"; 
// import { loadAllData } from "./data.js";

// --- GLOBAL UI HELPERS ---
export function showLoader() { 
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'flex'; 
}
export function hideLoader() { 
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'none'; 
}

// --- APP INITIALIZATION ---
export async function startApplication() {
    // These will be uncommented as we build out the other modules
    // showSection('dashboard');
    // initUI();
    // await loadAllData();
    
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(() => console.log("Offline Mode Active")).catch(e => console.log(e));
    }
}

// --- KICKOFF ---
// Start listening for login state as soon as the file loads
initAuth();

// --- WINDOW EXPORTS FOR HTML INLINE HANDLERS ---
// As we build out UI, Tools, and Data modules, we will map them here:
// window.showSection = showSection;
// window.toggleTheme = toggleTheme;
