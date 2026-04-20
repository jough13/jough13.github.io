// public/js/auth.js
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { showLoader, hideLoader } from "./ui.js";

export const ADMIN_EMAIL = "rso@shipyard.com";

// Passing onLoginSuccess safely breaks the circular dependency with app.js
export function initAuth(onLoginSuccess) {
    onAuthStateChanged(auth, async (user) => {
        showLoader(); 
        const loginScreen = document.getElementById('login-screen');
        const appWrapper = document.getElementById('app-wrapper');
        const userDisplay = document.getElementById('user-display');
        
        if (user) {
            if(loginScreen) loginScreen.style.display = 'none';
            if(appWrapper) appWrapper.style.display = 'block';
            if(userDisplay) userDisplay.textContent = `👤 ${user.email}`;

            const isAdmin = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = isAdmin ? '' : 'none'; 
            });

            if (onLoginSuccess) {
                try {
                    await onLoginSuccess();
                } catch (err) {
                    console.error("App startup error:", err);
                }
            }

            setTimeout(() => {
                hideLoader();
                // FIX: localStorage check bypassed entirely so it forces open on every refresh!
                const modal = document.getElementById('disclaimer-modal');
                if(modal) modal.style.display = 'flex';
            }, 500); 
            
        } else {
            hideLoader();
            if(loginScreen) loginScreen.style.display = 'flex';
            if(appWrapper) appWrapper.style.display = 'none';
        }
    });

    setupLoginListeners();
}

function setupLoginListeners() {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            showLoader(); 
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const remember = document.getElementById('login-remember')?.checked || false;

            try {
                const persistenceType = remember ? browserLocalPersistence : browserSessionPersistence;
                await setPersistence(auth, persistenceType);
                await signInWithEmailAndPassword(auth, email, pass);
                document.getElementById('login-error').style.display = 'none';
            } catch(err) {
                document.getElementById('login-error').style.display = 'block';
                hideLoader(); 
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => signOut(auth));
    }
}
