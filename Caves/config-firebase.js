// --- START OF FILE config-firebase.js ---

// ==========================================
// FIREBASE CONFIGURATION & NETWORK SYSTEMS
// ==========================================

// JUICE WIN: Thematic Developer Console Boot Sequence
console.log("%c[AKASHIC ENGINE] Initializing Leyline Network...", "color: #a855f7; font-weight: bold; font-family: monospace;");

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

// 🚨 ROBUSTNESS WIN: Firebase CDN Load Failsafe
// If an ad-blocker or strict firewall blocks the Firebase SDK scripts in index.html,
// the entire game will fatally crash. This intercepts the failure and warns the player gracefully!
if (typeof firebase === 'undefined') {
    console.error("%c[AKASHIC ENGINE] FATAL: Firebase SDK not found. Connection to the Leylines blocked.", "color: #ef4444; font-weight: bold;");
    
    // Create a dummy firebase object so the rest of the scripts don't throw Uncaught ReferenceErrors
    window.firebase = { 
        apps: [], 
        initializeApp: () => ({}), 
        app: () => ({}), 
        firestore: () => ({ collection: () => ({ doc: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) }) }) }), 
        auth: () => ({ onAuthStateChanged: () => {} }), 
        database: () => ({ ref: () => ({ on: () => {}, update: () => Promise.resolve(), set: () => Promise.resolve() }) }) 
    };

    // Inject a critical UI banner instantly
    window.addEventListener('DOMContentLoaded', () => {
        const fallbackBanner = document.createElement('div');
        fallbackBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-4 z-[999999] bg-red-950 text-red-200 border-b-4 border-red-600 shadow-[0_0_30px_rgba(220,38,38,1)] font-mono tracking-widest uppercase';
        fallbackBanner.innerHTML = "⚠️ CRITICAL LEYLINE FAILURE ⚠️<br><span class='text-[10px] font-normal text-red-300'>The Akashic Engine cannot connect. Please disable your Ad-Blocker, Pi-Hole, or Brave Shields and refresh.</span>";
        document.body.appendChild(fallbackBanner);
    });
}

// Initialize Firebase (Prevent multiple instances on hot-reloads)
let app;
if (!firebase.apps.length) {
    try {
        app = firebase.initializeApp(firebaseConfig);
    } catch (err) {
        console.error("%c[AKASHIC ENGINE] FATAL: Network Initialization Failed:", "color: #ef4444; font-weight: bold;", err);
    }
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
    // PERFORMANCE WIN: Added will-change and transform/translateZ for hardware-accelerated sliding
    // UX WIN: Added cursor-pointer to let players know they can dismiss it!
    connectionBanner.className = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-2 z-[50000] transition-transform duration-500 transform -translate-y-full shadow-2xl font-mono tracking-widest uppercase text-shadow-sm backdrop-blur-md cursor-pointer';
    connectionBanner.style.textShadow = "2px 2px 0px rgba(0,0,0,0.8)"; 
    connectionBanner.style.willChange = "transform";
    connectionBanner.style.transform = "translateZ(0)";
    
    // UX WIN: Click to dismiss! Prevents the banner from blinding the player during combat
    connectionBanner.onclick = () => {
        connectionBanner.classList.replace('translate-y-0', '-translate-y-full');
    };
    
    document.body.appendChild(connectionBanner);
}

// BUG FIX: Prevent banner timeout race-conditions
// If a user disconnected and reconnected rapidly, the old hide timeout would trigger 
// and accidentally hide the "Restored" banner instantly.
let _bannerTimeout = null;

function showNetworkBanner(htmlContent, colorClasses, durationMs) {
    if (_bannerTimeout) clearTimeout(_bannerTimeout);
    
    // Base classes applied to all banners
    const baseClasses = 'fixed top-0 left-0 w-full text-center text-xs font-bold py-2 z-[50000] transition-transform duration-500 font-mono tracking-widest uppercase backdrop-blur-md translate-y-0 cursor-pointer';
    
    connectionBanner.innerHTML = htmlContent;
    connectionBanner.className = `${baseClasses} ${colorClasses}`;
    
    _bannerTimeout = setTimeout(() => {
        connectionBanner.classList.replace('translate-y-0', '-translate-y-full');
    }, durationMs);
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
                console.warn("%c[AKASHIC ENGINE] Multiple timelines detected. Offline persistence limited to primary tab.", "color: #facc15;");
                
                // LORE WIN: Themed Multiple-Tab warning
                setTimeout(() => {
                    showNetworkBanner(
                        "⚠️ Temporal Paradox Detected<br><span class='text-[9px] font-normal'>Multiple timelines open. Offline saving disabled for this instance. (Click to dismiss)</span>",
                        "bg-purple-900 bg-opacity-95 text-purple-200 border-b-2 border-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
                        6000
                    );
                }, 3000);

            } else if (err.code === 'unimplemented') {
                console.warn("%c[AKASHIC ENGINE] Browser lacks local storage support (Incognito?).", "color: #facc15;");
                
                // QoL WIN: Detect Incognito mode or incompatible browsers
                setTimeout(() => {
                    showNetworkBanner(
                        "⚠️ Akashic Records Unavailable<br><span class='text-[9px] font-normal'>Your browser (or Incognito Mode) blocks local saves. Cloud saving only. (Click to dismiss)</span>",
                        "bg-gray-800 bg-opacity-95 text-gray-300 border-b-2 border-gray-600 shadow-2xl",
                        6000
                    );
                }, 3000);
            }
        });
} catch (e) {
    // Expected behavior on hot-reloads
}

// --- CONNECTION MONITOR ---
// Automatically monitors if the user loses internet connection and informs them
let hasInitiallyConnected = false; 
let wasConnected = false; 

rtdb.ref('.info/connected').on('value', function(snap) {
    const isConnected = snap.val() === true;
    window.FirebaseNetworkState.isConnected = isConnected;
    
    if (isConnected) {
        // JUICE WIN: Styled Console Outputs for Developers!
        console.log("%c🟢 Leyline Resonance Stable. [Connection Established]", "color: #4ade80; font-weight: bold; font-family: monospace;");
        
        // Only show "Restored" if we already successfully connected once before and lost it
        if (hasInitiallyConnected && !wasConnected) {
            showNetworkBanner(
                "✨ Leyline Resonance Restored<br><span class='text-[9px] font-normal'>Connection to the physical world re-established. (Click to dismiss)</span>",
                "bg-green-900 bg-opacity-95 text-green-200 border-b-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]",
                4000
            );

            if (typeof logMessage === 'function') logMessage("{green:The leylines stabilize. Connection to the realm restored.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        }
        
        hasInitiallyConnected = true;
        wasConnected = true;
    } else {
        console.warn("%c🔴 Leyline Connection Severed. [Offline / Reconnecting...]", "color: #ef4444; font-weight: bold; font-family: monospace;");
        
        // Only show "Connection Lost" if we were actually connected in the first place
        if (hasInitiallyConnected && wasConnected) {
            // Warning Banner (JUICE WIN: Added animate-pulse and greyscale/contrast filters for a "glitching" effect)
            showNetworkBanner(
                "⚠️ Leyline Connection Severed<br><span class='text-[9px] font-normal'>Re-attuning to the Akashic Records... Please wait. (Click to dismiss)</span>",
                "bg-red-950 bg-opacity-95 text-red-200 border-b-2 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse grayscale contrast-125",
                8000 // Holds on screen longer to let them know it's trying to reconnect
            );
            
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

// PERFORMANCE WIN: Cache DOM lookups for the auth error display
let _authErrorCache = null;

function handleAuthError(error) {
    let friendlyMessage = '';
    
    // LORE WIN: Thematic, universe-appropriate error messages, vastly expanded!
    switch (error.code) {
        case 'auth/invalid-email':
            friendlyMessage = 'The Akashic Records cannot decipher this soul-signature. (Invalid Email)';
            break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            friendlyMessage = 'The leylines reject your credentials. A mismatch in the weave.';
            break;
        case 'auth/email-already-in-use':
            friendlyMessage = 'This soul-signature is already bound to the realm. (Email in use)';
            break;
        case 'auth/weak-password':
            friendlyMessage = 'Your anchor is too weak to withstand the Void. (Password must be 6+ chars)';
            break;
        case 'auth/too-many-requests':
            friendlyMessage = 'The Weavers of Fate are exhausted by your repeated attempts. Wait a moment.';
            break;
        case 'auth/user-disabled':
            friendlyMessage = 'This soul has been banished by the Archmages. (Account Disabled)';
            break;
        case 'auth/network-request-failed':
            friendlyMessage = 'The leylines are silent. Check your connection to the physical world.';
            break;
        case 'auth/popup-closed-by-user':
            friendlyMessage = 'The scrying ritual was interrupted before completion.';
            break;
        case 'auth/operation-not-allowed':
            friendlyMessage = 'This magic is forbidden on this server. (Method Disabled)';
            break;
        case 'auth/user-token-expired':
            friendlyMessage = 'Your temporal tether has snapped. Please re-anchor your soul (Log in again).';
            break;
        case 'auth/credential-already-in-use':
            friendlyMessage = 'This artifact is already attuned to another traveler.';
            break;
        case 'auth/requires-recent-login':
            friendlyMessage = 'The ancient wards require a fresh tether. Log out and return to proceed.';
            break;
        case 'auth/account-exists-with-different-credential':
            friendlyMessage = 'A fractured soul detected. You must unify your identities (Sign in with original provider).';
            break;
        default:
            friendlyMessage = 'The Void stirs. An unexpected error occurred: ' + (error.message || '');
            break;
    }
    
    if (!_authErrorCache) _authErrorCache = document.getElementById('authError');
    
    if (_authErrorCache) {
        _authErrorCache.textContent = friendlyMessage;
        
        // Add a slight shake animation to the error text for tactile feedback
        _authErrorCache.classList.remove('shake');
        void _authErrorCache.offsetWidth; // trigger reflow
        _authErrorCache.classList.add('shake');
    }
    
    // JUICE WIN: Auditory feedback for login failure
    if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    
    console.error("%c[AKASHIC ENGINE] Auth Rejection:", "color: #ef4444; font-weight: bold;", error); 
}

/**
 * High-Performance Recursive object cleaner.
 * Strips 'undefined', 'function', and safely converts Sets/Maps to Arrays/Objects.
 * 
 * 🚨 SECURITY & STABILITY WIN: Added strict protection against `NaN` and `Infinity`.
 * Firebase SDKs will critically crash and permanently halt all database writes if fed 
 * a NaN or Infinity value. This intercepts them and neutralizes them before the crash.
 * 
 * 🚨 MAXIMUM STACK GUARD: Limits recursive depth to prevent stack overflow exploits.
 * 
 * @param {any} obj The variable to clean.
 * @param {WeakSet} seen Tracks visited objects to prevent infinite loops.
 * @param {number} depth Tracks recursion depth to prevent stack overflow attacks.
 * @returns {any} A sanitized clone, safe for Firebase transmission.
 */
function sanitizeForFirebase(obj, seen = new WeakSet(), depth = 0) {
    // 0. Maximum Depth Guard
    if (depth > 50) {
        console.warn("%c[AKASHIC ENGINE] Maximum stack depth exceeded during sanitization. Pruning object.", "color: #ef4444;");
        return null;
    }

    // 1. Convert undefined to null immediately
    if (obj === undefined) return null; 
    
    // 1.5 FIREBASE CRASH PREVENTION: NaN and Infinity
    if (typeof obj === 'number') {
        if (Number.isNaN(obj)) {
            console.warn("%c[AKASHIC ENGINE] Void Anomaly (NaN) detected and neutralized before DB save.", "color: #facc15;");
            return 0; // Safest fallback to prevent DB explosion
        }
        if (!Number.isFinite(obj)) {
            console.warn("%c[AKASHIC ENGINE] Infinite Loop (Infinity) detected and neutralized before DB save.", "color: #facc15;");
            return 999999; // Safe clamp
        }
        return obj;
    }
    
    // 2. Base cases: primitives, null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // 3. SAFETY & MINIFICATION FIX: 
    // Checking obj.constructor.name breaks when Javascript is minified (e.g., 'FieldValue' becomes 'e').
    // Using instanceof directly against the global firebase object is 100% minification safe!
    if (obj instanceof Date) return obj;
    if (typeof firebase !== 'undefined') {
        if (firebase.firestore && obj instanceof firebase.firestore.FieldValue) return obj;
        if (firebase.firestore && obj instanceof firebase.firestore.Timestamp) return obj;
        // EXPANDABILITY WIN: Add support for RTDB Server Values too!
        if (firebase.database && obj instanceof Object && Object.keys(obj).includes('.sv')) return obj; 
    }

    // 3.5 CIRCULAR REFERENCE PROTECTION
    if (seen.has(obj)) {
        console.warn("%c[AKASHIC ENGINE] Circular reference detected and severed during Firebase sanitization.", "color: #facc15;");
        return null; 
    }
    seen.add(obj);

    // 4. BULLETPROOF ES6 COLLECTION SUPPORT
    if (obj instanceof Set) {
        // Convert Set to Array and sanitize its children
        const newArr = new Array(obj.size);
        let i = 0;
        for (const val of obj) {
            newArr[i++] = sanitizeForFirebase(val, seen, depth + 1);
        }
        return newArr;
    }

    if (obj instanceof Map) {
        // Convert Map to plain Object
        const newObj = {};
        for (const [key, val] of obj) {
            newObj[key] = sanitizeForFirebase(val, seen, depth + 1);
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
            newArr[i] = sanitizeForFirebase(obj[i], seen, depth + 1);
        }
        return newArr;
    }

    // 6. Handle Plain Objects
    // Object.keys() iteration is notably faster in V8 for object deep-cloning 
    // than a traditional `for...in` loop with `hasOwnProperty` checks!
    const newObj = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const val = obj[key];
        
        // Skip functions immediately so they aren't processed at all
        if (typeof val === 'function') continue;
        
        newObj[key] = sanitizeForFirebase(val, seen, depth + 1);
    }
    return newObj;
}

// --- END OF FILE config-firebase.js ---
