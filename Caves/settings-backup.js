// --- START OF FILE settings-backup.js ---

// ==========================================
// CLOUD BACKUPS & SAVE INTEGRITY
// ==========================================

const BACKUP_SALT = "kEsMaI_v1_S3cR3t_s@lt"; // Change this to something random!

// Robust string hashing function (Upgraded Anti-Cheat)
function generateSaveSignature(data) {
    // EXPANDABILITY: We now hash inventory size, stash size, and maxHealth to prevent item injection
    const invLen = data.inventory ? data.inventory.length : 0;
    const bankLen = data.bank ? data.bank.length : 0;
    const stringToHash = `${data.xp}_${data.level}_${data.coins}_${data.maxHealth}_${invLen}_${bankLen}_${data.background}_${BACKUP_SALT}`;
    
    let hash = 0;
    if (stringToHash.length === 0) return hash.toString();
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// ROBUSTNESS: Backward compatibility for backups made before the signature upgrade
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

let lastBackupTime = 0; // Anti-Spam Timer

// EXPANDABILITY: Added slotId parameter so you can easily implement multiple save slots later
async function createCloudBackup(slotId = 'latest') {
    if (!playerRef) return;

    // Use server-authoritative time if available to prevent client clock manipulation
    const now = typeof window.getServerTime === 'function' ? window.getServerTime() : Date.now();
    
    // Prevent players from spamming the backup button and hitting Firebase quotas
    if (now - lastBackupTime < 10000) {
        logMessage("{red:Please wait a moment before creating another backup.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    lastBackupTime = now;

    // JUICE WIN: Dynamic Button States
    const btn = document.getElementById('btnBackup');
    const originalText = btn ? btn.innerHTML : "☁️ Create Backup";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ Uploading...";
        btn.classList.add('opacity-75', 'cursor-wait');
    }

    logMessage("{gray:Creating cloud backup...}");
    
    // 1. Get clean data explicitly to prevent saving transient UI state
    const rawData = {
        ...gameState.player,
        // Legacy map arrays are deliberately omitted here since they moved to subcollections!
        customPins: gameState.player.customPins || [],
        bank: gameState.player.bank || [], // Explicitly grab the Stash
        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory,
        equipment: typeof getSanitizedEquipment === 'function' ? getSanitizedEquipment() : gameState.player.equipment,
        timestamp: now // Use the validated timestamp
    };

    // PERFORMANCE: Use our fast sanitizer instead of the slow JSON stringify hack
    const backupState = typeof sanitizeForFirebase === 'function' 
        ? sanitizeForFirebase(rawData) 
        : JSON.parse(JSON.stringify(rawData)); // Absolute fallback if sanitizer is missing

    // 2. Sign the data (After sanitization!)
    backupState.signature = generateSaveSignature(backupState);

    // 3. Save
    try {
        // A. Save the main player document backup
        await playerRef.collection('backups').doc(slotId).set(backupState);
        
        // B. Backup the Map Subcollection safely using a batch
        const mapSnap = await playerRef.collection('map_data').get();
        if (!mapSnap.empty) {
            const batch = db.batch();
            mapSnap.forEach(doc => {
                const backupMapRef = playerRef.collection('backups').doc(slotId).collection('map_data').doc(doc.id);
                batch.set(backupMapRef, doc.data());
            });
            await batch.commit();
        }

        logMessage("{green:Backup successful!}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
        
        // Update the UI directly using our local timestamp instead of fetching from Firebase
        if (typeof updateBackupUI === 'function') updateBackupUI(slotId);
        
    } catch (err) {
        console.error("Backup creation failed: ", err);
        logMessage("{red:Backup failed.} See console.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    } finally {
        // Reset Button State
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-75', 'cursor-wait');
        }
    }
}

async function restoreCloudBackup(slotId = 'latest') {
    if (!playerRef) return;

    if (!confirm("Are you sure? This will overwrite your current progress with the selected backup.")) return;

    // JUICE WIN: Dynamic Button States
    const btn = document.getElementById('btnRestore');
    const originalText = btn ? btn.innerHTML : "↺ Restore";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = "⏳ Downloading...";
        btn.classList.add('opacity-75', 'cursor-wait');
    }

    logMessage("{gray:Locating backup...}");

    try {
        const doc = await playerRef.collection('backups').doc(slotId).get();

        if (!doc.exists) {
            logMessage("{red:No backup found.}");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return;
        }

        const data = doc.data();

        // 1. Verify Integrity (Try new robust signature first, then fallback to legacy)
        const calculatedSig = generateSaveSignature(data);
        const legacySig = generateLegacySaveSignature(data);
        
        if (data.signature !== calculatedSig && data.signature !== legacySig) {
            console.error(`Signature Mismatch! Saved: ${data.signature}, Calc: ${calculatedSig}, Legacy: ${legacySig}`);
            logMessage("{red:CORRUPT DATA.} Backup signature mismatch.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return; // STOP RESTORE
        }

        // 2. Anti-Cheat & Injection Checks
        
        // A. Actively block restores that feature massive impossible gold/xp disparities 
        if (data.coins > gameState.player.coins + 5000 && data.xp === gameState.player.xp) {
             console.error("Suspicious Backup Blocked: Massive gold discrepancy without XP gain.");
             logMessage("{red:Backup Validation Failed.} Anomalous data detected.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }

        // B. Block Stat & Talent Point Injection
        if ((data.statPoints || 0) > (gameState.player.statPoints || 0) + 10 || 
            (data.talentPoints || 0) > (gameState.player.talentPoints || 0) + 5) {
             console.error("Suspicious Backup Blocked: Unearned Stat/Talent points detected.");
             logMessage("{red:Backup Validation Failed.} Anomalous progression detected.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }
        
        // C. Block structural JSON injection (e.g. modifying the save file to bypass inventory limits)
        const invLimit = window.MAX_INVENTORY_SLOTS || 9;
        const stashLimit = 50; // Defined in stash.js, hardcoded here as a secondary safety net
        
        if ((data.inventory && data.inventory.length > invLimit + 5) || (data.bank && data.bank.length > stashLimit + 5)) {
             console.error(`Suspicious Backup Blocked: Inventory/Stash size exceeds maximum limits. (Inv: ${data.inventory?.length}, Bank: ${data.bank?.length})`);
             logMessage("{red:Backup Validation Failed.} Invalid container size.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }

        // 3. Restore
        logMessage("{gray:Restoring data...}");
        
        // Remove the backup-specific fields before applying to game
        delete data.signature; 
        delete data.timestamp;

        // Restore Map Subcollection
        const backupMapSnap = await playerRef.collection('backups').doc(slotId).collection('map_data').get();
        if (!backupMapSnap.empty) {
            const batch = db.batch();
            backupMapSnap.forEach(doc => {
                const liveMapRef = playerRef.collection('map_data').doc(doc.id);
                batch.set(liveMapRef, doc.data(), { merge: true });
            });
            await batch.commit();
        }

        // ROBUSTNESS WIN: Deep Clean Current State
        // Arrays merged via Object.assign can leave ghost items if the new array is shorter than the old one.
        gameState.player.inventory = [];
        gameState.player.bank = [];
        gameState.player.equipment = { weapon: null, armor: null, offhand: null, accessory: null, ammo: null };

        // Apply to Game State (Reuse your enterGame logic structure)
        if (typeof enterGame === 'function') {
            await enterGame(data);
        } else {
            Object.assign(gameState.player, data);
        }
        
        // Save immediately to the main slot so it persists
        // Use set to ensure we don't accidentally merge corrupted fields
        await playerRef.set(data);

        // Force the UI to physically update to match the newly loaded old data!
        if (typeof renderStats === 'function') renderStats();
        if (typeof renderEquipment === 'function') renderEquipment();
        if (typeof renderInventory === 'function') renderInventory();

        logMessage("{green:Restore complete.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
        
        // Close modal
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.add('hidden');

    } catch (err) {
        console.error("Restore failed: ", err);
        logMessage("{red:Restore failed.} Check console for details.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    } finally {
        // Reset Button State
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-75', 'cursor-wait');
        }
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
            
            // QoL WIN: Smart Age Warning
            // If the backup is older than 24 hours, color it yellow to gently warn the player!
            const now = typeof window.getServerTime === 'function' ? window.getServerTime() : Date.now();
            const hoursOld = (now - timestamp) / (1000 * 60 * 60);

            label.classList.remove('text-red-500', 'text-yellow-500', 'text-gray-400');

            if (hoursOld > 24) {
                label.innerHTML = `Last Backup: ${dateString} at ${timeString} <span class="font-bold text-yellow-500">(Over 24h old!)</span>`;
                label.classList.add('text-yellow-500');
            } else {
                label.textContent = `Last Backup: ${dateString} at ${timeString}`;
                label.classList.add('text-gray-400');
            }

        } else {
            label.textContent = "No backup found in the cloud.";
            label.classList.remove('text-red-500', 'text-yellow-500', 'text-gray-400');
            label.classList.add('text-gray-400');
        }
    } catch (e) {
        console.error("Failed to read backup status: ", e);
        label.textContent = "Status: Unknown (Network Error)";
        label.classList.remove('text-gray-400', 'text-yellow-500');
        label.classList.add('text-red-500');
    }
}
