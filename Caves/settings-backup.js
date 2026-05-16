// --- BACKUP INTEGRITY UTILS ---
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

    // Prevent players from spamming the backup button and hitting Firebase quotas
    const now = Date.now();
    if (now - lastBackupTime < 10000) {
        logMessage("{red:Please wait a moment before creating another backup.}");
        return;
    }
    lastBackupTime = now;

    logMessage("Creating cloud backup...");
    
    // 1. Get clean data explicitly to prevent saving transient UI state
    const rawData = {
        ...gameState.player,
        lootedTiles: Array.from(gameState.lootedTiles || []),
        exploredChunks: Array.from(gameState.exploredChunks || []),
        foundLore: Array.from(gameState.foundLore || []),
        customPins: gameState.player.customPins || [],
        bank: gameState.player.bank || [], // Explicitly grab the Stash
        inventory: typeof getSanitizedInventory === 'function' ? getSanitizedInventory() : gameState.player.inventory,
        equipment: typeof getSanitizedEquipment === 'function' ? getSanitizedEquipment() : gameState.player.equipment,
        timestamp: Date.now()
    };

    // PERFORMANCE: Use our fast sanitizer instead of the slow JSON stringify hack
    const backupState = typeof sanitizeForFirebase === 'function' 
        ? sanitizeForFirebase(rawData) 
        : JSON.parse(JSON.stringify(rawData)); // Absolute fallback if sanitizer is missing

    // 2. Sign the data (After sanitization!)
    backupState.signature = generateSaveSignature(backupState);

    // 3. Save
    try {
        await playerRef.collection('backups').doc(slotId).set(backupState);
        logMessage("{green:Backup successful!}");
        
        // PERFORMANCE: Update the UI directly using our local timestamp instead of fetching from Firebase
        const label = document.getElementById('lastBackupLabel');
        if (label) {
            const date = new Date(backupState.timestamp);
            const dateString = date.toLocaleDateString();
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            label.textContent = `Last Backup: ${dateString} at ${timeString}`;
            label.classList.remove('text-red-500');
            label.classList.add('text-gray-400');
        }
    } catch (err) {
        console.error("Backup creation failed: ", err);
        logMessage("{red:Backup failed.} See console.");
    }
}

async function restoreCloudBackup(slotId = 'latest') {
    if (!playerRef) return;

    if (!confirm("Are you sure? This will overwrite your current progress with the selected backup.")) return;

    logMessage("Locating backup...");

    try {
        const doc = await playerRef.collection('backups').doc(slotId).get();

        if (!doc.exists) {
            logMessage("{red:No backup found.}");
            return;
        }

        const data = doc.data();

        // 1. Verify Integrity (Try new robust signature first, then fallback to legacy)
        const calculatedSig = generateSaveSignature(data);
        const legacySig = generateLegacySaveSignature(data);
        
        if (data.signature !== calculatedSig && data.signature !== legacySig) {
            logMessage("{red:CORRUPT DATA.} Backup signature mismatch.");
            return; // STOP RESTORE
        }

        // 2. Anti-Cheat Check
        // Actively block restores that feature massive impossible gold/xp disparities 
        if (data.coins > gameState.player.coins + 5000 && data.xp === gameState.player.xp) {
             console.error("Suspicious Backup Blocked: Massive gold discrepancy without XP gain.");
             logMessage("{red:Backup Validation Failed.} Anomalous data detected.");
             return;
        }

        // 3. Restore
        logMessage("Restoring data...");
        
        // Remove the backup-specific fields before applying to game
        delete data.signature; 
        delete data.timestamp;

        // Apply to Game State (Reuse your enterGame logic structure)
        if (typeof enterGame === 'function') {
            await enterGame(data);
        } else {
            Object.assign(gameState.player, data);
        }
        
        // Save immediately to the main slot so it persists
        await playerRef.set(data);

        // Force the UI to physically update to match the newly loaded old data!
        if (typeof renderStats === 'function') renderStats();
        if (typeof renderEquipment === 'function') renderEquipment();
        if (typeof renderInventory === 'function') renderInventory();

        logMessage("{green:Restore complete.}");
        
        // Close modal
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.add('hidden');

    } catch (err) {
        console.error("Restore failed: ", err);
        logMessage("{red:Restore failed.}");
    }
}

async function updateBackupUI(slotId = 'latest') {
    if (!playerRef) return;
    const label = document.getElementById('lastBackupLabel');
    if (!label) return;

    try {
        const doc = await playerRef.collection('backups').doc(slotId).get();
        if (doc.exists) {
            const date = new Date(doc.data().timestamp);
            
            const dateString = date.toLocaleDateString();
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            label.textContent = `Last Backup: ${dateString} at ${timeString}`;
            label.classList.remove('text-red-500');
            label.classList.add('text-gray-400');
        } else {
            label.textContent = "No backup found.";
        }
    } catch (e) {
        console.error("Failed to read backup status: ", e);
        label.textContent = "Status: Unknown";
    }
}
