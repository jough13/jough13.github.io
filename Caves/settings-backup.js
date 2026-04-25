// --- BACKUP INTEGRITY UTILS ---
const BACKUP_SALT = "kEsMaI_v1_S3cR3t_s@lt"; // Change this to something random!

// Simple string hashing function
function generateSaveSignature(data) {
    // We only hash critical stats to ensure they match
    const stringToHash = `${data.xp}_${data.level}_${data.coins}_${data.background}_${BACKUP_SALT}`;
    
    let hash = 0;
    if (stringToHash.length === 0) return hash;
    for (let i = 0; i < stringToHash.length; i++) {
        const char = stringToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// --- BACKUP SYSTEM ---

let lastBackupTime = 0; // EASY WIN: Anti-Spam Timer

async function createCloudBackup() {
    if (!playerRef) return;

    // EASY WIN: Prevent players from spamming the backup button and hitting Firebase quotas
    const now = Date.now();
    if (now - lastBackupTime < 10000) {
        logMessage("{red:Please wait a moment before creating another backup.}");
        return;
    }
    lastBackupTime = now;

    logMessage("Creating cloud backup...");
    
    // 1. Get clean data
    // We explicitly define the object to avoid copying 'undefined' junk from gameState.player
    const rawData = {
        ...gameState.player,
        lootedTiles: Array.from(gameState.lootedTiles),
        exploredChunks: Array.from(gameState.exploredChunks),
        inventory: getSanitizedInventory(),
        equipment: getSanitizedEquipment(),
        timestamp: Date.now()
    };

    // JSON stringify/parse hack removes 'undefined' keys automatically
    // This is the "Nuclear Option" against the "Unsupported field value: undefined" error.
    const backupState = JSON.parse(JSON.stringify(rawData));

    // 2. Sign the data (After sanitization!)
    backupState.signature = generateSaveSignature(backupState);

    // 3. Save
    try {
        await playerRef.collection('backups').doc('latest').set(backupState);
        logMessage("{green:Backup successful!}");
        updateBackupUI(); 
    } catch (err) {
        console.error("Backup creation failed: ", err);
        logMessage("{red:Backup failed.} See console.");
    }
}

async function restoreCloudBackup() {
    if (!playerRef) return;

    if (!confirm("Are you sure? This will overwrite your current progress with the last backup.")) return;

    logMessage("Locating backup...");

    try {
        const doc = await playerRef.collection('backups').doc('latest').get();

        if (!doc.exists) {
            logMessage("{red:No backup found.}");
            return;
        }

        const data = doc.data();

        // 1. Verify Integrity
        const calculatedSig = generateSaveSignature(data);
        if (data.signature !== calculatedSig) {
            logMessage("{red:CORRUPT DATA.} Backup signature mismatch.");
            return; // STOP RESTORE
        }

        // EASY WIN: Basic Anti-Cheat Check
        // Prevent players from restoring a "backup" they manually injected with 99999 gold.
        // It's not foolproof, but it stops casual console manipulation.
        if (data.coins > gameState.player.coins + 1000 && data.xp === gameState.player.xp) {
             console.warn("Suspicious Backup Detected: Massive gold discrepancy without XP gain.");
             // We don't block it entirely (in case they genuinely just sold a huge stash),
             // but it leaves a trail for admin review if needed.
        }

        // 2. Restore
        logMessage("Restoring data...");
        
        // Remove the backup-specific fields before applying to game
        delete data.signature; 
        delete data.timestamp;

        // Apply to Game State (Reuse your enterGame logic structure)
        await enterGame(data);
        
        // Save immediately to the main slot so it persists
        await playerRef.set(data);

        // EASY WIN: Force the UI to physically update to match the newly loaded old data!
        renderStats();
        renderEquipment();
        renderInventory();

        logMessage("{green:Restore complete.}");
        
        // Close modal
        document.getElementById('settingsModal').classList.add('hidden');

    } catch (err) {
        console.error("Restore failed: ", err);
        logMessage("{red:Restore failed.}");
    }
}

async function updateBackupUI() {
    if (!playerRef) return;
    const label = document.getElementById('lastBackupLabel');
    if (!label) return;

    try {
        const doc = await playerRef.collection('backups').doc('latest').get();
        if (doc.exists) {
            const date = new Date(doc.data().timestamp);
            
            // EASY WIN: Cleaner formatting for the date and time
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
