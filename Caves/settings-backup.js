// --- START OF FILE settings-backup.js ---

// ==========================================
// CLOUD BACKUPS, SAVE INTEGRITY & THE AKASHIC RECORDS
// ==========================================

const BACKUP_SALT = "kEsMaI_v1_S3cR3t_s@lt"; // Change this to something random!

// Centralized Subcollection definitions.
// When you add player housing, farming, or mailboxes, just add the collection name here!
const SUBCOLLECTIONS_TO_BACKUP = ['map_data'];

// Concurrency lock to prevent mashing buttons and causing DB race conditions
let isBackupOperationRunning = false;

// Prevents the user from accidentally closing the tab during a multi-batch Firestore operation
window.addEventListener('beforeunload', (e) => {
    if (isBackupOperationRunning) {
        e.preventDefault();
        // Standard warning message for modern browsers
        e.returnValue = 'A timeline restore is currently in progress! Closing the tab now will corrupt your save data. Are you sure?';
        return e.returnValue;
    }
});

// --- Deep Hashing ---
// We now hash the exact sequence of item names, preventing players from modifying the save file
// to swap 5 pieces of "Stone" into 5 "Legendary Swords" (which bypassed the old length check).

function generateStrictSaveSignature(data) {
    // Bypassed .map().join() in favor of inline string building.
    // This prevents massive memory allocation spikes during the save process!
    let invStr = 'empty';
    if (data.inventory && data.inventory.length > 0) {
        invStr = '';
        for (let i = 0; i < data.inventory.length; i++) {
            const item = data.inventory[i];
            // Hash the stats and rarity too! Prevents players from manually 
            // editing the DB to give a basic dagger 999 damage without getting caught!
            // Strictly coerce values to prevent undefined/null bypasses
            const rar = item._rarity || 'n';
            const qty = Number(item.quantity) || 1;
            const dmg = Number(item.damage) || 0;
            const def = Number(item.defense) || 0;
            invStr += `${item.name}:${qty}:${rar}:${dmg}:${def}|`;
        }
    }
    
    let bankStr = 'empty';
    if (data.bank && data.bank.length > 0) {
        bankStr = '';
        for (let i = 0; i < data.bank.length; i++) {
            const item = data.bank[i];
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
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

// Intermediate compatibility for saves using the array-length hashing method.
function generateSaveSignature(data) {
    const invLen = data.inventory ? data.inventory.length : 0;
    const bankLen = data.bank ? data.bank.length : 0;
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

// Oldest backward compatibility for early-access backups.
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
let backupTextInterval = null; // UI poller

// EXPANDABILITY: Added slotId parameter so you can easily implement multiple save slots later
async function createCloudBackup(slotId = 'latest') {
    if (!playerRef || isBackupOperationRunning) return;

    // Use server-authoritative time if available to prevent client clock manipulation
    const now = typeof window.getServerTime === 'function' ? window.getServerTime() : Date.now();
    
    // Prevent players from spamming the backup button and hitting Firebase quotas
    if (now - lastBackupTime < 10000) {
        logMessage("{red:The Weavers of Fate need time to rest. Please wait.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        return;
    }
    
    isBackupOperationRunning = true;
    lastBackupTime = now;

    // JUICE WIN: Dynamic Button Phasing & Lore Flavor
    const btn = document.getElementById('btnBackup');
    const originalText = btn ? btn.innerHTML : "☁️ Anchor Timeline";
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-wait');
        
        // UX WIN: Dynamic poller keeps the text alive during long network calls
        const phases = ["⏳ Consulting Akashic Records...", "⏳ Weaving Fate...", "⏳ Sealing Anomaly..."];
        let pIdx = 0;
        btn.innerHTML = phases[0];
        backupTextInterval = setInterval(() => {
            pIdx = (pIdx + 1) % phases.length;
            if (btn.disabled) btn.innerHTML = phases[pIdx];
        }, 800);
    }

    logMessage("{cyan:Inscribing your current timeline into the Akashic Records...}");
    
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

    // 2. Sign the data using the newest Strict Hashing logic
    backupState.signature = generateStrictSaveSignature(backupState);

    // 3. Save
    try {
        // A. Save the main player document backup
        await playerRef.collection('backups').doc(slotId).set(backupState);
        
        // B. Backup the Subcollections safely using chunked batches (Max 500 ops per batch)
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
                        
                        // Firestore limit is 500 writes per batch
                        if (operationCount >= 450) {
                            await batch.commit();
                            batch = db.batch();
                            operationCount = 0;
                        }
                    }
                    // Commit any remaining writes
                    if (operationCount > 0) {
                        await batch.commit();
                    }
                }
            }
        }

        logMessage("{green:Your timeline has been safely anchored.}");
        
        // LORE/JUICE: Tactile feedback for stamping the timeline
        if (typeof gameState !== 'undefined') gameState.screenShake = 5; 
        if (typeof AudioSystem !== 'undefined') AudioSystem.playLevelUp();
        if (typeof ParticleSystem !== 'undefined' && gameState.player) {
            ParticleSystem.createFloatingText(gameState.player.x, gameState.player.y, "TIMELINE SECURED", "#22d3ee");
        }
        
        // Update the UI directly using our local timestamp instead of fetching from Firebase
        if (typeof updateBackupUI === 'function') updateBackupUI(slotId);
        
        // JUICE WIN: Flash the label cyan so they know it worked immediately
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
        // Reset Button State and Locks
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

    // LORE & QoL WIN: Hard confirmation prompt styled around reality manipulation
    const confirmation = prompt("⚠️ WARNING: This will collapse your current reality and overwrite it with the anchored timeline.\n\nType RESTORE to confirm:");
    if (confirmation !== "RESTORE") {
        logMessage("{gray:Timeline collapse cancelled.}");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playClick();
        return;
    }

    isBackupOperationRunning = true;

    // JUICE WIN: Dynamic Button States
    const btn = document.getElementById('btnRestore');
    const originalText = btn ? btn.innerHTML : "↺ Reweave Fate";
    if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-75', 'cursor-wait', 'animate-pulse');
        
        // LORE WIN: Added "Purging Alternate Futures" to match the new subcollection deletion phase!
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

        // 1. Verify Integrity (Check strict first, cascade down to legacy)
        const strictSig = generateStrictSaveSignature(data);
        const normalSig = generateSaveSignature(data);
        const legacySig = generateLegacySaveSignature(data);
        
        if (data.signature !== strictSig && data.signature !== normalSig && data.signature !== legacySig) {
            console.error(`Signature Mismatch! Saved: ${data.signature}, Strict: ${strictSig}, Legacy: ${legacySig}`);
            logMessage("{red:CORRUPT TIMELINE DETECTED.} The Weavers of Fate block the transition.");
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
            return; // STOP RESTORE
        }

        // 2. Anti-Cheat & Injection Checks
        
        // A. Actively block restores that feature massive impossible gold/xp disparities 
        if (data.coins > gameState.player.coins + 500000 && data.xp === gameState.player.xp) {
             console.error("Suspicious Backup Blocked: Massive gold discrepancy without XP gain.");
             logMessage("{red:Reality Violation Failed.} Anomalous gold detected.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }

        // B. Block Stat & Talent Point Injection
        if ((data.statPoints || 0) > (gameState.player.statPoints || 0) + 10 || 
            (data.talentPoints || 0) > (gameState.player.talentPoints || 0) + 5) {
             console.error("Suspicious Backup Blocked: Unearned Stat/Talent points detected.");
             logMessage("{red:Reality Violation Failed.} Anomalous progression detected.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }
        
        // C. Block structural JSON injection (e.g. modifying the save file to bypass inventory limits)
        const invLimit = window.MAX_INVENTORY_SLOTS || 9;
        const stashLimit = window.MAX_STASH_SLOTS || 50; 
        
        if ((data.inventory && data.inventory.length > invLimit + 5) || (data.bank && data.bank.length > stashLimit + 5)) {
             console.error(`Suspicious Backup Blocked: Inventory/Stash size exceeds maximum limits. (Inv: ${data.inventory?.length}, Bank: ${data.bank?.length})`);
             logMessage("{red:Reality Violation Failed.} Space-time container limits exceeded.");
             if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
             return;
        }

        // 3. Restore
        logMessage("{purple:Anchor point acquired. Rebuilding the world...}");
        
        // Remove the backup-specific fields before applying to game
        delete data.signature; 
        delete data.timestamp;

        // 🚨 CRITICAL FIX: The Subcollection "State Bleed" Purge
        // We MUST delete the live timeline's map data before copying the backup over it!
        // Otherwise, chunks explored AFTER the backup was created will remain in the restored timeline!
        if (typeof db !== 'undefined') {
            
            // Phase A: Purge Live Subcollections
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
                    if (delOpCount > 0) {
                        await delBatch.commit();
                    }
                }
            }

            // Phase B: Copy Backup Subcollections
            for (const collectionName of SUBCOLLECTIONS_TO_BACKUP) {
                const backupMapSnap = await playerRef.collection('backups').doc(slotId).collection(collectionName).get();
                if (!backupMapSnap.empty) {
                    let batch = db.batch();
                    let operationCount = 0;
                    
                    for (const doc of backupMapSnap.docs) {
                        const liveMapRef = playerRef.collection(collectionName).doc(doc.id);
                        
                        // BUG FIX: Removed {merge: true}. We want an absolute, pure overwrite of the document!
                        batch.set(liveMapRef, doc.data());
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

        // 🧹 ROBUSTNESS WIN: Deep Clean Current Local State ("State Bleed" Fix)
        // Without this, the memory of the aborted timeline (map chunks, un-looted tiles) 
        // will bleed directly into the restored timeline until the player refreshes the page!
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

        // Apply to Game State (Reuse your enterGame logic structure)
        if (typeof enterGame === 'function') {
            await enterGame(data);
        } else {
            Object.assign(gameState.player, data);
        }
        
        // --- CONTENT & LORE WIN: The Paradox Anomaly ---
        // 5% chance when save-scumming that the fabric of reality tears, giving you a strange item.
        let paradoxTriggered = false;
        if (Math.random() < 0.05 && gameState.player.inventory.length < (window.MAX_INVENTORY_SLOTS || 9)) {
            const paradoxShard = {
                templateId: '⏳', 
                name: 'Paradox Anomaly',
                type: 'junk',
                tags: ['anomaly', 'magic'], // 🛡️ ECS WIN: Added tags to the generated paradox!
                quantity: 1,
                tile: '⏳',
                description: "A crystallized fragment of a discarded timeline. You shouldn't have this.",
                _rarity: 'legendary' // Gives it a golden/glowing border in inventory
            };
            gameState.player.inventory.push(paradoxShard);
            paradoxTriggered = true;
        }
        
        // Save immediately to the main slot so it persists
        // Use set to ensure we don't accidentally merge corrupted fields
        await playerRef.set(gameState.player);

        // Force the UI to physically update to match the newly loaded old data!
        if (typeof renderStats === 'function') renderStats();
        if (typeof renderEquipment === 'function') renderEquipment();
        if (typeof renderInventory === 'function') renderInventory();

        // JUICE WIN: "Time Travel" feedback effect!
        gameState.screenShake = 35;
        if (typeof ParticleSystem !== 'undefined') {
            // Giant purple/white implosion
            ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#ffffff', 40);
            ParticleSystem.createExplosion(gameState.player.x, gameState.player.y, '#a855f7', 20);
        }
        
        // Play the massive timeline shift audio!
        if (typeof AudioSystem !== 'undefined' && typeof AudioSystem.playTimelineShift === 'function') {
            AudioSystem.playTimelineShift();
        } else if (typeof AudioSystem !== 'undefined') {
            AudioSystem.playMagic();
        }
        
        logMessage("{purple:Reality violently shifts... the timeline has been rewritten.}");
        
        if (paradoxTriggered) {
            logMessage("{gold:The violent shift in time left something unnatural in your pocket...}");
        }
        
        // Close modal
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.add('hidden');

    } catch (err) {
        console.error("Restore failed: ", err);
        logMessage("{red:Timeline Restore failed.} The Weavers reject this thread. Check console.");
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    } finally {
        // Reset Button State and Lock
        isBackupOperationRunning = false;
        if (backupTextInterval) {
            clearInterval(backupTextInterval);
            backupTextInterval = null;
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-75', 'cursor-wait', 'animate-pulse');
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
            
            // UX WIN: Relative Time Calculations (e.g. "12 minutes ago")
            const now = typeof window.getServerTime === 'function' ? window.getServerTime() : Date.now();
            const hoursOld = (now - timestamp) / (1000 * 60 * 60);
            
            let relativeStr = "";
            if (hoursOld < 0.016) { // Less than ~1 minute
                relativeStr = "Just now";
            } else if (hoursOld < 1) {
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

            // LORE WIN: Thematic status text
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

// --- END OF FILE settings-backup.js ---
