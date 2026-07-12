// --- START OF FILE settings-backup.js ---

// ==========================================
// CLOUD BACKUPS, SAVE INTEGRITY & THE AKASHIC RECORDS
// ==========================================

const BACKUP_SALT = "kEsMaI_v1_S3cR3t_s@lt"; // Change this to something random!

// Centralized Subcollection definitions.
const SUBCOLLECTIONS_TO_BACKUP = ['map_data'];

// Concurrency lock to prevent mashing buttons and causing DB race conditions
let isBackupOperationRunning = false;

// Prevents the user from accidentally closing the tab during a multi-batch Firestore operation
window.addEventListener('beforeunload', (e) => {
    if (isBackupOperationRunning) {
        e.preventDefault();
        e.returnValue = 'A timeline restore is currently in progress! Closing the tab now will corrupt your save data. Are you sure?';
        return e.returnValue;
    }
});

// --- Deep Hashing ---
function generateStrictSaveSignature(data) {
    let invStr = 'empty';
    if (data.inventory && Array.isArray(data.inventory) && data.inventory.length > 0) {
        invStr = '';
        for (let i = 0; i < data.inventory.length; i++) {
            const item = data.inventory[i];
            if (!item) continue; 
            
            const rar = item._rarity || 'n';
            const qty = Number(item.quantity) || 1;
            const dmg = Number(item.damage) || 0;
            const def = Number(item.defense) || 0;
            invStr += `${item.name}:${qty}:${rar}:${dmg}:${def}|`;
        }
    }
    
    let bankStr = 'empty';
    if (data.bank && Array.isArray(data.bank) && data.bank.length > 0) {
        bankStr = '';
        for (let i = 0; i < data.bank.length; i++) {
            const item = data.bank[i];
            if (!item) continue;
            
            const rar = item._rarity || 'n';
            const qty = Number(item.quantity) || 1;
            const dmg = Number(item.damage) || 0;
            const def = Number(item.defense) || 0;
            bankStr += `${item.name}:${qty}:${rar}:${dmg}:${def}|`;
        }
    }
    
    const stringToHash = `${data.xp}_${data.level}_${data.coins}_${data.maxHealth}_${invStr}_${bankStr}_${data.background}_${BACKUP_SALT}`;
    
    let hash = 0;
    if (stringToHash.length === 0) return hash.toString();
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; 
    }
    return hash.toString();
}

function generateSaveSignature(data) {
    const invLen = (data.inventory && Array.isArray(data.inventory)) ? data.inventory.length : 0;
    const bankLen = (data.bank && Array.isArray(data.bank)) ? data.bank.length : 0;
    const stringToHash = `${data.xp}_${data.level}_${data.coins}_${data.maxHealth}_${invLen}_${bankLen}_${data.background}_${BACKUP_SALT}`;
    let hash = 0;
    if (stringToHash.length === 0) return hash.toString();
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash.toString();
}

function generateLegacySaveSignature(data) {
    const stringToHash = `${data.xp}_${data.level}_${data.coins}_${data.background}_${BACKUP_SALT}`;
    let hash = 0;
    if (stringToHash.length === 0) return hash.toString();
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash.toString();
}

// --- BACKUP SYSTEM ---

let lastBackupTime = 0; 
let backupTextInterval = null; 

async function createCloudBackup(slotId = 'latest') {
    if (!playerRef || isBackupOperationRunning) return;

    const now = typeof window.getServerTime === 'function' ? window.getServerTime() : Date.now();
    
    if (now - lastBackupTime < 10000) {
        logMessage("{red:The Weavers of Fate need time to rest. Please wait.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    
    isBackupOperationRunning = true;
    lastBackupTime = now;

    const btn = document.getElementById('btnBackup');
    const originalText = btn ? btn.innerHTML : "☁️ Anchor Timeline";
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-wait');
        
        const phases = ["⏳ Consulting Akashic Records...", "⏳ Weaving Fate...", "⏳ Sealing Anomaly..."];
        let pIdx = 0;
        btn.innerHTML = phases[0];
        backupTextInterval = setInterval(() => {
            pIdx = (pIdx + 1) % phases.length;
            if (btn.disabled) btn.innerHTML = phases[pIdx];
        }, 800);
    }

    logMessage("{cyan:Inscribing your current timeline into the Akashic Records...}");
    
    const rawData = {
        ...gameState.player,
        customPins: gameState.player.customPins || [],
        bank: gameState.player.bank || [], 
        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory,
        equipment: typeof getSanitizedEquipment === 'function' ? getSanitizedEquipment() : gameState.player.equipment,
        timestamp: now 
    };
    
    delete rawData.lootedTiles;
    delete rawData.exploredChunks;
    delete rawData.foundLore;

    const backupState = typeof sanitizeForFirebase === 'function' 
        ? sanitizeForFirebase(rawData) 
        : JSON.parse(JSON.stringify(rawData)); 

    backupState.signature = generateStrictSaveSignature(backupState);

    try {
        await playerRef.collection('backups').doc(slotId).set(backupState);
        
        if (typeof db !== 'undefined') {
            for (const collectionName of SUBCOLLECTIONS_TO_BACKUP) {
                const mapSnap = await playerRef.collection(collectionName).get();
                if (!mapSnap.empty) {
                    let batch = db.batch();
                    let operationCount = 0;
                    
                    for (const doc of mapSnap.docs) {
                        const backupMapRef = playerRef.collection('backups').doc(slotId).collection(collectionName).doc(doc.id);
                        batch.set(backupMapRef, doc.data());
                        operationCount++;
                        
                        if (operationCount >= 450) {
                            await batch.commit();
                            batch = db.batch();
                            operationCount = 0;
                        }
                    }
                    if (operationCount > 0) {
                        await batch.commit();
                    }
                }
            }
        }

        logMessage("{green:Your timeline has been safely anchored.}");
        
        if (typeof gameState !== 'undefined') gameState.screenShake = 5; 
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
        if (typeof ParticleSystem !== 'undefined' && gameState.player) {
            ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "TIMELINE SECURED", "#22d3ee");
        }
        
        if (typeof updateBackupUI === 'function') updateBackupUI(slotId);
        
        const label = document.getElementById('lastBackupLabel');
        if (label) {
            label.classList.remove('text-gray-400');
            label.classList.add('text-cyan-400', 'animate-pulse');
            setTimeout(() => {
                label.classList.remove('text-cyan-400', 'animate-pulse');
                label.classList.add('text-gray-400');
            }, 2500);
        }
        
    } catch (err) {
        console.error("Backup creation failed: ", err);
        logMessage("{red:The Akashic Records rejected the anchor.} See console.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    } finally {
        isBackupOperationRunning = false;
        if (backupTextInterval) {
            clearInterval(backupTextInterval);
            backupTextInterval = null;
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-75', 'cursor-wait');
        }
    }
}

async function restoreCloudBackup(slotId = 'latest') {
    if (!playerRef || isBackupOperationRunning) return;

    const confirmation = prompt("⚠️ WARNING: This will collapse your current reality and overwrite it with the anchored timeline.\n\nType RESTORE to confirm:");
    if (confirmation !== "RESTORE") {
        logMessage("{gray:Timeline collapse cancelled.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        return;
    }

    isBackupOperationRunning = true;

    const blocker = document.createElement('div');
    blocker.id = 'restoreBlocker';
    blocker.className = 'fixed inset-0 z-[999999] cursor-wait bg-black bg-opacity-70 flex flex-col items-center justify-center backdrop-blur-sm';
    blocker.innerHTML = `
        <div class="text-purple-400 font-bold text-3xl animate-pulse font-mono tracking-widest" style="text-shadow: 0 0 20px #a855f7;">REWEAVING TIMELINE...</div>
        <div class="text-red-400 font-bold text-sm mt-4 tracking-widest">⚠️ DO NOT CLOSE THE BROWSER ⚠️</div>
    `;
    document.body.appendChild(blocker);

    const btn = document.getElementById('btnRestore');
    const originalText = btn ? btn.innerHTML : "↺ Reweave Fate";
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-wait', 'animate-pulse');
        
        const phases = ["⏳ Searching the Void...", "⏳ Extracting Anchor...", "⏳ Purging Alternate Futures...", "⏳ Reweaving Leylines..."];
        let pIdx = 0;
        btn.innerHTML = phases[0];
        backupTextInterval = setInterval(() => {
            pIdx = (pIdx + 1) % phases.length;
            if (btn.disabled) btn.innerHTML = phases[pIdx];
        }, 800);
    }

    logMessage("{purple:Unraveling the current reality... seeking the anchor point.}");

    try {
        const doc = await playerRef.collection('backups').doc(slotId).get();

        if (!doc.exists) {
            logMessage("{red:No anchor found in the Void.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const data = doc.data();

        // 1. Verify Integrity
        const strictSig = generateStrictSaveSignature(data);
        const normalSig = generateSaveSignature(data);
        const legacySig = generateLegacySaveSignature(data);
        
        if (data.signature !== strictSig && data.signature !== normalSig && data.signature !== legacySig) {
            console.error(`Signature Mismatch! Saved: ${data.signature}, Strict: ${strictSig}, Legacy: ${legacySig}`);
            logMessage("{red:CORRUPT TIMELINE DETECTED.} The Weavers of Fate block the transition.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return; 
        }

        // 2. Anti-Cheat Checks
        const currentCoins = (gameState && gameState.player && gameState.player.coins) ? gameState.player.coins : 0;
        const currentXp = (gameState && gameState.player && gameState.player.xp) ? gameState.player.xp : 0;
        const currentStatPoints = (gameState && gameState.player && gameState.player.statPoints) ? gameState.player.statPoints : 0;
        const currentTalentPoints = (gameState && gameState.player && gameState.player.talentPoints) ? gameState.player.talentPoints : 0;

        if (data.coins > currentCoins + 500000 && data.xp === currentXp) {
             console.error("Suspicious Backup Blocked: Massive gold discrepancy without XP gain.");
             logMessage("{red:Reality Violation Failed.} Anomalous gold detected.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }

        if ((data.statPoints || 0) > currentStatPoints + 10 || (data.talentPoints || 0) > currentTalentPoints + 5) {
             console.error("Suspicious Backup Blocked: Unearned Stat/Talent points detected.");
             logMessage("{red:Reality Violation Failed.} Anomalous progression detected.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }
        
        const invLimit = window.MAX_INVENTORY_SLOTS || 9;
        const stashLimit = window.MAX_STASH_SLOTS || 50; 
        const invLen = Array.isArray(data.inventory) ? data.inventory.length : 0;
        const bankLen = Array.isArray(data.bank) ? data.bank.length : 0;

        if (invLen > invLimit + 5 || bankLen > stashLimit + 5) {
             console.error(`Suspicious Backup Blocked: Limits exceeded. (Inv: ${invLen}, Bank: ${bankLen})`);
             logMessage("{red:Reality Violation Failed.} Space-time container limits exceeded.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }

        // 3. Restore
        logMessage("{purple:Anchor point acquired. Rebuilding the world...}");
        
        delete data.signature; 
        delete data.timestamp;

        if (typeof db !== 'undefined') {
            for (const collectionName of SUBCOLLECTIONS_TO_BACKUP) {
                const liveMapSnap = await playerRef.collection(collectionName).get();
                if (!liveMapSnap.empty) {
                    let delBatch = db.batch();
                    let delOpCount = 0;
                    
                    for (const doc of liveMapSnap.docs) {
                        delBatch.delete(doc.ref);
                        delOpCount++;
                        
                        if (delOpCount >= 450) {
                            await delBatch.commit();
                            delBatch = db.batch();
                            delOpCount = 0;
                        }
                    }
                    if (delOpCount > 0) await delBatch.commit();
                }
            }

            for (const collectionName of SUBCOLLECTIONS_TO_BACKUP) {
                const backupMapSnap = await playerRef.collection('backups').doc(slotId).collection(collectionName).get();
                if (!backupMapSnap.empty) {
                    let batch = db.batch();
                    let operationCount = 0;
                    
                    for (const doc of backupMapSnap.docs) {
                        const liveMapRef = playerRef.collection(collectionName).doc(doc.id);
                        batch.set(liveMapRef, doc.data());
                        operationCount++;
                        
                        if (operationCount >= 450) {
                            await batch.commit();
                            batch = db.batch();
                            operationCount = 0;
                        }
                    }
                    if (operationCount > 0) await batch.commit();
                }
            }
        }

        // Deep Clean Current Local State 
        gameState.player.inventory = [];
        gameState.player.bank = [];
        gameState.player.equipment = { weapon: null, armor: null, offhand: null, accessory: null, ammo: null };
        
        if (typeof chunkManager !== 'undefined') {
            chunkManager.loadedChunks = {};
            chunkManager.worldState = {};
            chunkManager.caveMaps = {};
            chunkManager.castleMaps = {};
        }
        
        if (gameState.lootedTiles) gameState.lootedTiles.clear();
        if (gameState.exploredChunks) gameState.exploredChunks.clear();
        if (gameState.discoveredRegions) gameState.discoveredRegions.clear();
        if (gameState.foundLore) gameState.foundLore.clear();
        if (gameState.foundCodexEntries) gameState.foundCodexEntries.clear();
        if (gameState.pendingMapSaves) gameState.pendingMapSaves = { chunks: new Set(), lore: new Set(), looted: {} };

        // Apply to Game State
        if (typeof enterGame === 'function') {
            await enterGame(data);
        } else {
            Object.assign(gameState.player, data);
        }
        
        // Paradox Anomaly
        let paradoxTriggered = false;
        if (Math.random() < 0.05 && gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
            const paradoxShard = {
                templateId: '⏳', name: 'Paradox Anomaly', type: 'junk', tags: ['anomaly', 'magic'],
                quantity: 1, tile: '⏳', description: "A crystallized fragment of a discarded timeline.", _rarity: 'legendary'
            };
            gameState.player.inventory.push(paradoxShard);
            paradoxTriggered = true;
        }
        
        await playerRef.set(typeof sanitizeForFirebase === 'function' ? sanitizeForFirebase(gameState.player) : gameState.player);

        if (typeof renderStats === 'function') renderStats();
        if (typeof renderEquipment === 'function') renderEquipment();
        if (typeof renderInventory === 'function') renderInventory();

        gameState.screenShake = 35;
        if (typeof ParticleSystem !== 'undefined') {
            ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#ffffff', 40);
            ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#a855f7', 20);
        }
        
        if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playTimelineShift === 'function') {
            AudioSystem.playTimelineShift();
        } else if (typeof AudioSystem !== 'undefined') {
            AudioSystem.playMagic();
        }
        
        logMessage("{purple:Reality violently shifts... the timeline has been rewritten.}");
        if (paradoxTriggered) logMessage("{gold:The violent shift in time left something unnatural in your pocket...}");
        
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.add('hidden');

    } catch (err) {
        console.error("Restore failed: ", err);
        logMessage("{red:Timeline Restore failed.} The Weavers reject this thread. Check console.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    } finally {
        const existingBlocker = document.getElementById('restoreBlocker');
        if (existingBlocker) existingBlocker.remove();

        if (backupTextInterval) {
            clearInterval(backupTextInterval);
            backupTextInterval = null;
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-75', 'cursor-wait', 'animate-pulse');
        }
        isBackupOperationRunning = false;
    }
}

async function updateBackupUI(slotId = 'latest') {
    if (!playerRef) return;
    const label = document.getElementById('lastBackupLabel');
    if (!label) return;

    try {
        const doc = await playerRef.collection('backups').doc(slotId).get();
        if (doc.exists) {
            const timestamp = doc.data().timestamp;
            const date = new Date(timestamp);
            
            const dateString = date.toLocaleDateString();
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const now = typeof window.getServerTime === 'function' ? window.getServerTime() : Date.now();
            const hoursOld = (now - timestamp) / (1000 * 60 * 60);
            
            let relativeStr = "";
            if (hoursOld < 0.016) relativeStr = "Just now";
            else if (hoursOld < 1) {
                const mins = Math.max(1, Math.floor(hoursOld * 60));
                relativeStr = `${mins} minute${mins !== 1 ? 's' : ''} ago`;
            } else if (hoursOld < 24) {
                const hrs = Math.floor(hoursOld);
                relativeStr = `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
            } else {
                const days = Math.floor(hoursOld / 24);
                relativeStr = `${days} day${days !== 1 ? 's' : ''} ago`;
            }

            label.classList.remove('text-red-500', 'text-yellow-500', 'text-gray-400');

            if (hoursOld > 24) {
                label.innerHTML = `Timeline Anchored: ${dateString} at ${timeString} <br><span class="font-bold text-yellow-500 drop-shadow-md">(Over 24h old! Anchor weakening...)</span>`;
                label.classList.add('text-yellow-500');
            } else {
                label.innerHTML = `Timeline Anchored: ${dateString} at ${timeString} <br><span class="text-cyan-400 font-bold drop-shadow-sm">(${relativeStr})</span>`;
                label.classList.add('text-gray-400');
            }
        } else {
            label.textContent = "No anchor found in the Akashic Records.";
            label.classList.remove('text-red-500', 'text-yellow-500', 'text-gray-400');
            label.classList.add('text-gray-400');
        }
    } catch (e) {
        console.error("Failed to read backup status: ", e);
        label.textContent = "Status: Unknown (Leyline Interference)";
        label.classList.remove('text-gray-400', 'text-yellow-500');
        label.classList.add('text-red-500');
    }
}

// ==========================================
// EXPANSION: EXPORT & IMPORT SAVES (BASE64)
// ==========================================

window.exportTimelineToClipboard = function() {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    // 1. Gather exact state
    const rawData = {
        ...gameState.player,
        customPins: gameState.player.customPins || [],
        bank: gameState.player.bank || [], 
        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory,
        equipment: typeof getSanitizedEquipment === 'function' ? getSanitizedEquipment() : gameState.player.equipment
    };
    
    // Strip heavy map arrays to keep string size manageable for clipboards
    delete rawData.lootedTiles;
    delete rawData.exploredChunks;
    delete rawData.foundLore;
    delete rawData.timestamp;

    const backupState = typeof sanitizeForFirebase === 'function' 
        ? sanitizeForFirebase(rawData) 
        : JSON.parse(JSON.stringify(rawData)); 

    // 2. Sign it securely
    backupState.signature = generateStrictSaveSignature(backupState);

    // 3. Compress to Base64 String
    try {
        const jsonString = JSON.stringify(backupState);
        // UTF-8 safe base64 encoding
        const base64String = btoa(unescape(encodeURIComponent(jsonString))); 
        const finalExportString = `AKASHIC_SAVE||${base64String}`;

        navigator.clipboard.writeText(finalExportString).then(() => {
            logMessage("{cyan:Timeline Copied to Clipboard! Save it somewhere safe.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
            alert("Save Data copied to clipboard!\n\nYou can paste this text anywhere to back up your character.");
        }).catch(err => {
            console.error("Clipboard API failed:", err);
            prompt("Clipboard access denied. Please copy your save data manually:", finalExportString);
        });

    } catch (e) {
        console.error("Export Failed:", e);
        logMessage("{red:Failed to compress timeline.}");
    }
};

window.importTimelineFromClipboard = async function() {
    if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
    
    const inputString = prompt("Paste your Timeline Code (begins with AKASHIC_SAVE||):");
    if (!inputString || !inputString.startsWith('AKASHIC_SAVE||')) {
        logMessage("{gray:Import cancelled or invalid code.}");
        return;
    }

    const base64String = inputString.split('||')[1];

    try {
        // 1. Decode Base64 to JSON
        const jsonString = decodeURIComponent(escape(atob(base64String)));
        const importedData = JSON.parse(jsonString);

        // 2. Verify Integrity
        const strictSig = generateStrictSaveSignature(importedData);
        if (importedData.signature !== strictSig) {
            logMessage("{red:CORRUPT TIMELINE DETECTED.} The signature does not match. Import blocked.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        // 3. Confirm Override
        const confirmRestore = confirm(`Valid timeline found for Level ${importedData.level} ${importedData.background}.\n\nWARNING: Importing this will overwrite your current character. Proceed?`);
        if (!confirmRestore) return;

        // 4. Execute Restore
        logMessage("{purple:Reconstructing imported reality...}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playTimelineShift();

        delete importedData.signature;

        // Deep Clean local state
        gameState.player.inventory = [];
        gameState.player.bank = [];
        gameState.player.equipment = { weapon: null, armor: null, offhand: null, accessory: null, ammo: null };
        if (typeof chunkManager !== 'undefined') {
            chunkManager.loadedChunks = {};
            chunkManager.worldState = {};
        }

        // Apply Data
        if (typeof enterGame === 'function') {
            await enterGame(importedData);
        } else {
            Object.assign(gameState.player, importedData);
        }

        // Save to Firebase
        if (playerRef) {
            await playerRef.set(typeof sanitizeForFirebase === 'function' ? sanitizeForFirebase(gameState.player) : gameState.player);
        }

        // Force UI Renders
        if (typeof renderStats === 'function') renderStats();
        if (typeof renderEquipment === 'function') renderEquipment();
        if (typeof renderInventory === 'function') renderInventory();
        
        gameState.screenShake = 35;
        logMessage("{cyan:Timeline successfully imported!}");
        
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.add('hidden');

    } catch (e) {
        console.error("Import Decode Failed:", e);
        logMessage("{red:Failed to decode the timeline string.} The format is invalid.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    }
};

// --- DYNAMIC UI INJECTION ---
// Injects the Export/Import buttons into the Settings Menu dynamically
function injectExportImportUI() {
    const backupContainer = document.getElementById('btnBackup')?.parentElement;
    if (backupContainer && !document.getElementById('btnExportTimeline')) {
        const divider = document.createElement('div');
        divider.className = "w-full border-t border-gray-700 my-4";
        backupContainer.appendChild(divider);

        const btnGroup = document.createElement('div');
        btnGroup.className = "flex gap-2";
        
        btnGroup.innerHTML = `
            <button id="btnExportTimeline" onclick="exportTimelineToClipboard()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow-sm transition-transform active:scale-95 text-xs border-b-2 border-gray-800">
                📋 Copy Save
            </button>
            <button id="btnImportTimeline" onclick="importTimelineFromClipboard()" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded shadow-sm transition-transform active:scale-95 text-xs border-b-2 border-gray-800">
                📥 Paste Save
            </button>
        `;
        backupContainer.appendChild(btnGroup);
    }
}

// Wait for DOM to load, then inject
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectExportImportUI);
} else {
    injectExportImportUI();
}

// --- END OF FILE settings-backup.js ---
