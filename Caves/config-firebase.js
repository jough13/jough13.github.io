// --- ASSEMBLE GLOBAL MOCK ---
    const mockUser = { email: 'offline@cavesandcastles.local', uid: 'offline_guest', isAnonymous: true };
    
    window.firebase = { 
        apps: [], 
        initializeApp: () => ({}), 
        app: () => ({}), 
        firestore: Object.assign(() => dummyFirestoreCollection('root'), {
            FieldValue: { 
                serverTimestamp: () => Date.now(), 
                delete: () => _OFFLINE_DELETE_TOKEN, // <--- THE FIX
                // 🚨 BUG FIX & ROBUSTNESS WIN: Complete polyfill for Array and Math operations!
                arrayUnion: (...args) => args,
