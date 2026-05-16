// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
    apiKey: "AIzaSyCkQ7H6KzvnLFTYOblS1l12RR2tv7Os6iY",
    authDomain: "caves-and-castles.firebaseapp.com",
    projectId: "caves-and-castles",
    storageBucket: "caves-and-castles.firebasestorage.app",
    messagingSenderId: "555632047629",
    appId: "1:555632047629:web:32ae69c34b7dbc13578744",
    measurementId: "G-E2QZTWE6N6"
};

// Initialize Firebase (Prevent multiple instances)
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

// Apply settings only if not already configured to avoid "Overriding host" error
try {
    db.settings({
        cacheSizeBytes: 10485760 // 10 MB
    });

    // EASY WIN: Enable Offline Persistence! 
    // If the player's connection drops briefly, their inventory/stat changes 
    // are saved locally and synced automatically when they reconnect.
    db.enablePersistence()
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("Multiple tabs open. Offline persistence enabled in the first tab only.");
            } else if (err.code === 'unimplemented') {
                console.warn("Browser does not support offline persistence.");
            }
        });
} catch (e) {
    console.log("Firestore settings already applied, skipping.");
}

// --- CONNECTION MONITOR ---
// Automatically monitors if the user loses internet connection and dispatches an event
rtdb.ref('.info/connected').on('value', function(snap) {
    const isConnected = snap.val() === true;
    if (isConnected) {
        console.log("🟢 Firebase: Connected to server.");
    } else {
        console.warn("🔴 Firebase: Disconnected (Offline / Reconnecting...).");
    }
    // Dispatch a custom event so UI files can eventually listen and show a "No Connection" warning
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
        default:
            friendlyMessage = 'An unexpected error occurred. Please try again.';
            break;
    }
    
    const authErrorElement = document.getElementById('authError');
    if (authErrorElement) {
        authErrorElement.textContent = friendlyMessage;
    }
    
    console.error("Authentication Error:", error); // Keep detailed log for debugging
}

/**
 * High-Performance Recursive object cleaner.
 * Strips 'undefined' and 'function' properties to prevent Firebase crashes.
 * @param {any} obj The variable to clean.
 * @returns {any} A sanitized clone, safe for Firebase transmission.
 */
function sanitizeForFirebase(obj) {
    // 1. Convert undefined to null immediately
    if (obj === undefined) return null; 
    
    // 2. Base cases: primitives, null
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // 3. SAFETY: Pass native Dates and special Firebase FieldValues straight through!
    // Iterating over a FieldValue (like ServerValue.TIMESTAMP) destroys its functionality.
    if (obj instanceof Date) return obj;
    
    // If it's a complex class instance rather than a plain Object/Array, pass it through
    if (obj.constructor !== Object && !Array.isArray(obj)) return obj;

    // 4. Handle Arrays
    if (Array.isArray(obj)) {
        // PERFORMANCE: Pre-allocate array size for a slight speed boost on large inventories
        const newArr = new Array(obj.length);
        for (let i = 0; i < obj.length; i++) {
            newArr[i] = sanitizeForFirebase(obj[i]);
        }
        return newArr;
    }

    // 5. Handle Plain Objects
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            
            // PERFORMANCE: Skip functions immediately so they aren't processed at all
            if (typeof val === 'function') continue;
            
            newObj[key] = sanitizeForFirebase(val);
        }
    }
    return newObj;
}
