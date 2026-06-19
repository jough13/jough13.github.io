// --- START OF FILE config-firebase.js ---

// ==========================================
// FIREBASE CONFIGURATION & NETWORK SYSTEMS
// ==========================================

/* 
 * SECURITY NOTE: 
 * In Firebase, it is completely normal and safe for these API keys to be public in the client-side code.
 * However, the database MUST be protected by strict Firebase Security Rules (Firestore & RTDB) 
 * to ensure users can only read/write their own specific UID documents and the shared world map.
 */
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

// --- EXPANDABILITY: Global Server Time & Network Helpers ---
// Provides server-authoritative timestamps to prevent client-side clock manipulation/cheating
window.getFirestoreTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();
window.getRTDBTimestamp = () => firebase.database.ServerValue.TIMESTAMP;
window.getFirestoreDelete = () => firebase.firestore.FieldValue.delete();

// Expose Network State globally so other scripts can check ping/status easily
window.FirebaseNetworkState = {
    isConnected: false,
    serverTimeOffset: 0
};

// Global helper for instant online checks without traversing the object
window.isOnline = () => window.FirebaseNetworkState.isConnected;

// MMO SYNC: Keep track of the offset between the local client clock and the Firebase Server
rtdb.ref('.info/serverTimeOffset').on('value', function(snap) {
    window.FirebaseNetworkState.serverTimeOffset = snap.val() || 0;
});

// Use this to get the exact millisecond time on the server without an API call
window.getServerTime = () => Date.now() + window.FirebaseNetworkState.serverTimeOffset;

// --- JUICE & LORE: GLOBAL CONNECTION BANNER INJECTION ---
// We dynamically create this so it works across all screens (Login, Character Select, Game)
let connectionBanner = document.getElementById('firebase-connection-banner');
if (!connectionBanner) {
    connectionBanner = document.createElement('div');
    connectionBanner.id = 'firebase-connection-banner';
    // JUICE WIN: Added backdrop-blur-md, deep shadows, and borders for a polished UI overlay
    connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-2 z-[20000] transition-transform duration-500 transform -translate-y-full shadow-2xl font-mono tracking-widest uppercase text-shadow-sm backdrop-blur-md';
    connectionBanner.style.textShadow = "2px 2px 0px rgba(0,0,0,0.8)"; 
    document.body.appendChild(connectionBanner);
}

// Apply settings only if not already configured to avoid "Overriding host" error
try {
    db.settings({
        cacheSizeBytes: 10485760 // 10 MB Cache for fast map loading
    });

    // Enable Offline Persistence! 
    db.enablePersistence()
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Multiple tabs open. Offline persistence enabled in the first tab only.");
                
                // LORE WIN: Themed Multiple-Tab warning
                setTimeout(() => {
                    connectionBanner.innerHTML = "⚠️ Temporal Paradox Detected<br><span class='text-[9px] font-normal'>Multiple timelines open. Offline saving disabled for this instance.</span>";
                    connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-2 z-[20000] transition-all duration-500 bg-purple-900 bg-opacity-95 text-purple-200 border-b-2 border-purple-600 translate-y-0 shadow-2xl font-mono tracking-widest uppercase backdrop-blur-md';
                    
                    // Hide the banner 6 seconds after it appears
                    setTimeout(() => {
                        connectionBanner.classList.replace('translate-y-0', '-translate-y-full');
                    }, 6000);
                }, 3000);

            } else if (err.code === 'unimplemented') {
                console.warn("Browser does not support offline persistence.");
                // QoL WIN: Detect Incognito mode or incompatible browsers
                setTimeout(() => {
                    connectionBanner.innerHTML = "⚠️ Akashic Records Unavailable<br><span class='text-[9px] font-normal'>Your browser (or Incognito Mode) blocks local saves. Cloud saving only.</span>";
                    connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-2 z-[20000] transition-all duration-500 bg-gray-800 bg-opacity-95 text-gray-300 border-b-2 border-gray-600 translate-y-0 shadow-2xl font-mono tracking-widest uppercase backdrop-blur-md';
                    
                    setTimeout(() => {
                        connectionBanner.classList.replace('translate-y-0', '-translate-y-full');
                    }, 6000);
                }, 3000);
            }
        });
} catch (e) {
    console.log("Firestore settings already applied, skipping.");
}

// --- CONNECTION MONITOR ---
// Automatically monitors if the user loses internet connection and informs them
let hasInitiallyConnected = false; 
let wasConnected = false; 

rtdb.ref('.info/connected').on('value', function(snap) {
    const isConnected = snap.val() === true;
    window.FirebaseNetworkState.isConnected = isConnected;
    
    if (isConnected) {
        console.log("🟢 Firebase: Leyline Resonance Stable.");
        
        // Only show "Restored" if we already successfully connected once before and lost it
        if (hasInitiallyConnected && !wasConnected) {
            // Restore Banner
            connectionBanner.textContent = "✨ Leyline Resonance Restored";
            connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-2 z-[20000] transition-all duration-500 bg-green-900 bg-opacity-95 text-green-200 border-b-2 border-green-500 translate-y-0 shadow-2xl font-mono tracking-widest uppercase backdrop-blur-md';
            
            // Slide it away after 3 seconds
            setTimeout(() => {
                connectionBanner.classList.replace('translate-y-0', '-translate-y-full');
            }, 3000);

            if (typeof logMessage === 'function') logMessage("{green:The leylines stabilize. Connection to the realm restored.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        }
        
        hasInitiallyConnected = true;
        wasConnected = true;
    } else {
        console.warn("🔴 Firebase: Disconnected (Offline / Reconnecting...).");
        
        // Only show "Connection Lost" if we were actually connected in the first place
        if (hasInitiallyConnected && wasConnected) {
            // Warning Banner (JUICE WIN: Added animate-pulse so the user knows it's actively trying to reconnect)
            connectionBanner.textContent = "⚠️ Leyline Connection Severed - Re-Attuning...";
            connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-2 z-[20000] transition-all duration-500 bg-red-900 bg-opacity-95 text-red-200 border-b-2 border-red-600 translate-y-0 shadow-2xl font-mono tracking-widest uppercase animate-pulse backdrop-blur-md';
            
            if (typeof logMessage === 'function') logMessage("{red:The leylines have ruptured! Trying to re-attune...}");
            
            // JUICE WIN: Ominous low rumble and screen shake to alert the player their connection dropped
            if (typeof AudioSystem !== 'undefined') {
                AudioSystem.playNoise(1.5, 0.4, 200); // Deep, long rumble
                AudioSystem.playTone(100, 'sawtooth', 1.0, 0.2, false, 50); // Descending bass tone
            }
            if (typeof gameState !== 'undefined' && gameState.player) {
                gameState.screenShake = 15;
            }
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
        case 'auth/invalid-credential':
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
        case 'auth/user-token-expired':
            friendlyMessage = 'Your session has expired. Please log in again.';
            break;
        // EXPANDABILITY WIN: Handled Account Linking & Security Errors
        case 'auth/credential-already-in-use':
            friendlyMessage = 'This credential is already linked to another account.';
            break;
        case 'auth/requires-recent-login':
            friendlyMessage = 'For your security, please log out and log back in to perform this action.';
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

    // 3. SAFETY & MINIFICATION FIX: 
    // Checking obj.constructor.name breaks when Javascript is minified (e.g., 'FieldValue' becomes 'e').
    // Using instanceof directly against the global firebase object is 100% minification safe!
    if (obj instanceof Date) return obj;
    if (typeof firebase !== 'undefined' && firebase.firestore && obj instanceof firebase.firestore.FieldValue) {
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
        // PERFORMANCE WIN: O(1) Fast-Path for empty arrays (Saves a ton of time on empty bank/inventory syncs)
        if (obj.length === 0) return [];

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

// --- END OF FILE config-firebase.js ---
