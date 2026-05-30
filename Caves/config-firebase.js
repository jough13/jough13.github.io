// --- START OF FILE config-firebase.js ---

// ==========================================
// FIREBASE CONFIGURATION & NETWORK SYSTEMS
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyCkQ7H6KzvnLFTYOblS1l12RR2tv7Os6iY",
    authDomain: "caves-and-castles.firebaseapp.com",
    projectId: "caves-and-castles",
    storageBucket: "caves-and-castles.firebasestorage.app",
    messagingSenderId: "555632047629",
    appId: "1:555632047629:web:32ae69c34b7dbc13578744",
    measurementId: "G-E2QZTWE6N6"
};

// Initialize Firebase (Prevent multiple instances on hot-reloads)
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
} else {
    app = firebase.app();
}

const db = firebase.firestore();
const auth = firebase.auth();
const rtdb = firebase.database();

// --- EXPANDABILITY: Global Server Time Helpers ---
// Provides server-authoritative timestamps to prevent client-side clock manipulation/cheating
window.getFirestoreTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
window.getRTDBTimestamp = () => firebase.database.ServerValue.TIMESTAMP;
window.getFirestoreDelete = () => firebase.firestore.FieldValue.delete();

// MMO SYNC: Keep track of the offset between the local client clock and the Firebase Server
window.serverTimeOffset = 0;
rtdb.ref('.info/serverTimeOffset').on('value', function(snap) {
    window.serverTimeOffset = snap.val() || 0;
});

// Use this to get the exact millisecond time on the server without an API call
window.getServerTime = () => Date.now() + window.serverTimeOffset;

// --- JUICE: GLOBAL CONNECTION BANNER INJECTION ---
// We dynamically create this so it works across all screens (Login, Character Select, Game)
let connectionBanner = document.getElementById('firebase-connection-banner');
if (!connectionBanner) {
    connectionBanner = document.createElement('div');
    connectionBanner.id = 'firebase-connection-banner';
    // Tailwind classes for a sleek, sliding top banner
    connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-1.5 z-[10000] transition-transform duration-300 transform -translate-y-full shadow-md font-mono tracking-widest uppercase';
    document.body.appendChild(connectionBanner);
}

// Apply settings only if not already configured to avoid "Overriding host" error
try {
    db.settings({
        cacheSizeBytes: 10485760 // 10 MB Cache for fast map loading
    });

    // EASY WIN: Enable Offline Persistence! 
    db.enablePersistence()
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // QoL WIN: Tell the user why persistence failed instead of hiding it in the console!
                console.warn("Multiple tabs open. Offline persistence enabled in the first tab only.");
                connectionBanner.textContent = "⚠️ Multiple Tabs Open - Offline Saving Disabled";
                connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-1.5 z-[10000] transition-all duration-500 bg-yellow-600 text-black translate-y-0 shadow-md font-mono tracking-widest uppercase';
                setTimeout(() => {
                    connectionBanner.classList.replace('translate-y-0', '-translate-y-full');
                }, 5000);
            } else if (err.code === 'unimplemented') {
                console.warn("Browser does not support offline persistence.");
            }
        });
} catch (e) {
    console.log("Firestore settings already applied, skipping.");
}

// --- CONNECTION MONITOR ---
// Automatically monitors if the user loses internet connection and informs them
let wasConnected = true; // Assume connected at start to avoid spamming the log on boot
rtdb.ref('.info/connected').on('value', function(snap) {
    const isConnected = snap.val() === true;
    
    if (isConnected) {
        console.log("🟢 Firebase: Connected to server.");
        if (!wasConnected) {
            // Restore Banner
            connectionBanner.textContent = "📶 Connection Restored";
            connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-1.5 z-[10000] transition-all duration-500 bg-green-600 text-white translate-y-0 shadow-md font-mono tracking-widest uppercase';
            
            // Slide it away after 3 seconds
            setTimeout(() => {
                connectionBanner.classList.replace('translate-y-0', '-translate-y-full');
            }, 3000);

            if (typeof logMessage === 'function') logMessage("{green:Network restored. Reconnected to server.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        }
        wasConnected = true;
    } else {
        console.warn("🔴 Firebase: Disconnected (Offline / Reconnecting...).");
        if (wasConnected) {
            // Warning Banner
            connectionBanner.textContent = "⚠️ Connection Lost - Reconnecting...";
            connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-1.5 z-[10000] transition-all duration-500 bg-red-600 text-white translate-y-0 shadow-md font-mono tracking-widest uppercase';
            
            if (typeof logMessage === 'function') logMessage("{red:Connection lost! Trying to reconnect...}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        }
        wasConnected = false;
    }
    
    // Dispatch a custom event for other UI files to listen to
    window.dispatchEvent(new CustomEvent('firebase-connection-changed', { detail: { connected: isConnected } }));
});


function handleAuthError(error) {
    let friendlyMessage = '';
    switch (error.code) {
        case 'auth/invalid-email':
            friendlyMessage = 'Please enter a valid email address.';
            break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            friendlyMessage = 'Invalid credentials. Please check your email and password.';
            break;
        case 'auth/email-already-in-use':
            friendlyMessage = 'This email address is already in use.';
            break;
        case 'auth/weak-password':
            friendlyMessage = 'Password must be at least 6 characters long.';
            break;
        case 'auth/too-many-requests':
            friendlyMessage = 'Too many failed login attempts. Please try again later.';
            break;
        case 'auth/user-disabled':
            friendlyMessage = 'This account has been disabled by an administrator.';
            break;
        case 'auth/network-request-failed':
            friendlyMessage = 'Network error. Please check your internet connection.';
            break;
        case 'auth/popup-closed-by-user':
            friendlyMessage = 'Login popup was closed before completion.';
            break;
        case 'auth/operation-not-allowed':
            friendlyMessage = 'Email/Password accounts are not enabled on this server.';
            break;
        default:
            friendlyMessage = 'An unexpected error occurred. Please try again.';
            break;
    }
    
    const authErrorElement = document.getElementById('authError');
    if (authErrorElement) {
        authErrorElement.textContent = friendlyMessage;
        
        // Add a slight shake animation to the error text for feedback
        authErrorElement.classList.remove('shake');
        void authErrorElement.offsetWidth; // trigger reflow
        authErrorElement.classList.add('shake');
    }
    
    console.error("Authentication Error:", error); 
}

/**
 * High-Performance Recursive object cleaner.
 * Strips 'undefined', 'function', and safely converts Sets/Maps to Arrays/Objects.
 * 
 * PERFORMANCE & ROBUSTNESS WIN: Added `seen` WeakSet to prevent Maximum Call Stack 
 * Exceeded crashes caused by accidental Circular References in game state!
 * 
 * @param {any} obj The variable to clean.
 * @param {WeakSet} seen Tracks visited objects to prevent infinite loops.
 * @returns {any} A sanitized clone, safe for Firebase transmission.
 */
function sanitizeForFirebase(obj, seen = new WeakSet()) {
    // 1. Convert undefined to null immediately
    if (obj === undefined) return null; 
    
    // 2. Base cases: primitives, null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // 3. SAFETY: Pass native Dates and special Firebase FieldValues straight through!
    if (obj instanceof Date) return obj;
    
    // Ensure we don't accidentally iterate over a Firebase ServerValue
    if (obj.constructor && obj.constructor.name && obj.constructor.name.includes("FieldValue")) {
        return obj;
    }

    // 3.5 CIRCULAR REFERENCE PROTECTION
    if (seen.has(obj)) {
        console.warn("Circular reference detected and severed during Firebase sanitization.");
        return null; 
    }
    seen.add(obj);

    // 4. BULLETPROOF ES6 COLLECTION SUPPORT
    if (obj instanceof Set) {
        // Convert Set to Array and sanitize its children
        const newArr = new Array(obj.size);
        let i = 0;
        for (const val of obj) {
            newArr[i++] = sanitizeForFirebase(val, seen);
        }
        return newArr;
    }

    if (obj instanceof Map) {
        // Convert Map to plain Object
        const newObj = {};
        for (const [key, val] of obj) {
            newObj[key] = sanitizeForFirebase(val, seen);
        }
        return newObj;
    }
    
    // If it's a complex class instance rather than a plain Object/Array, pass it through safely
    if (obj.constructor !== Object && !Array.isArray(obj)) return obj;

    // 5. Handle Arrays
    if (Array.isArray(obj)) {
        // Pre-allocate array size for a slight speed boost on massive inventories
        const newArr = new Array(obj.length);
        for (let i = 0; i < obj.length; i++) {
            newArr[i] = sanitizeForFirebase(obj[i], seen);
        }
        return newArr;
    }

    // 6. Handle Plain Objects
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            
            // PERFORMANCE: Skip functions immediately so they aren't processed at all
            if (typeof val === 'function') continue;
            
            newObj[key] = sanitizeForFirebase(val, seen);
        }
    }
    return newObj;
}
