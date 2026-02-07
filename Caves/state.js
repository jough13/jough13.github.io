let player_id;
let playerRef;
let onlinePlayerRef;
let otherPlayers = {};
let unsubscribePlayerListener;
let worldStateListeners = {};

let isProcessingMove = false; 

let lastAiExecution = 0;

let cachedThemeColors = {};

const processingSpawnTiles = new Set();

let areGlobalListenersInitialized = false;

// --- OPTIMIZATION GLOBALS ---
let saveTimeout = null; // Tracks the pending save timer
