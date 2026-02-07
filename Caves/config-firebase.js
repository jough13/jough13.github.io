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

// Apply settings only if not already configured to avoid "Overriding host" error
// We wrap this in a try-catch because checking 'settings' directly is difficult in v8
try {
    db.settings({
        cacheSizeBytes: 10485760 // 10 MB
    });
} catch (e) {
    console.log("Firestore settings already applied, skipping.");
}

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
        default:
            friendlyMessage = 'An unexpected error occurred. Please try again.';
            break;
    }
    authError.textContent = friendlyMessage;
    console.error("Authentication Error:", error); // Keep the detailed log for yourself
}

/**
 * Recursively cleans an object to remove any keys with 'undefined' values.
 * Firestore cannot store 'undefined' and will throw an error. This prevents that.
 * @param {object} obj The object to clean.
 * @returns {object} A new object, safe to send to Firestore.
 */

function sanitizeForFirebase(obj) {
    // 1. Convert undefined to null immediately
    if (obj === undefined) return null; 
    
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // 2. Handle Arrays (Maps them so undefined items become null)
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirebase(item));
    }

    // 3. Handle Objects
    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // Recursively clean every property
            newObj[key] = sanitizeForFirebase(obj[key]);
        }
    }
    return newObj;
}
