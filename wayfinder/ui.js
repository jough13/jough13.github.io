// --- GENERIC MODAL HANDLER ---
function openGenericModal(title) {
    const modal = document.getElementById('genericModalOverlay');
    document.getElementById('genericModalTitle').textContent = title;
    
    const container = document.getElementById('genericModalContent');

    // --- CRITICAL FIX: SCRUB LINGERING INLINE STYLES ---
    // Wipes out flex-direction: column or specific heights left behind by other menus
    container.style.cssText = ''; 
    
    // --- SELF-REPAIRING LAYOUT ---
    // We reconstruct the base layout every time so it never crashes, 
    // even if the Trade system previously overwrote it!
    container.innerHTML = `
        <div id="genericModalList" class="trade-list-container"></div>
        <div id="genericModalDetails" class="trade-panel-right">
            <div id="genericDetailContent"><p style="color:#666; padding:10px;">Establishing connection...</p></div>
            <div class="trade-btn-group" id="genericModalActions"></div>
        </div>
    `;
    
    // Update the Info Bar
    updateModalInfoBar('genericInfoBar');

    modal.style.display = 'flex';
}

function closeGenericModal() {
    document.getElementById('genericModalOverlay').style.display = 'none';

    // Clear any running visual intervals
    if (typeof miningInterval !== 'undefined') clearInterval(miningInterval);

    // --- WIPE ALL MODAL CONTEXTS ---
    // Prevents the keyboard from getting "stuck" thinking a menu is still open!
    anomalyContext = null;
    boardingContext = null;
    currentTradeContext = null;
    currentOutfitContext = null;
    currentMissionContext = null;
    currentShipyardContext = null;
    window.activeTradeItemId = null; // Clears market analysis

    updateSideBorderVisibility();
}

// --- MODAL INFO BAR HELPER ---
function updateModalInfoBar(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // --- THE FIX: USE CUSTOM NAME IF AVAILABLE ---
    const baseShipName = SHIP_CLASSES[playerShip.shipClass].name;
    const shipName = playerShip.name ? playerShip.name : baseShipName;
    
    // Calculate Reputation Text
    // Use the global title, or "Unknown" if undefined
    const rep = playerNotorietyTitle || "Unknown";

    el.innerHTML = `
        <div class="info-bar-item">
            <span class="info-bar-value info-ship">${playerName}</span>
            <span class="info-bar-label">LVL ${playerLevel}</span>
        </div>
        
        <div class="info-bar-item">
            <span class="info-bar-label">REP:</span>
            <span class="info-bar-value" style="color:var(--accent-color)">${rep}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">SHIP:</span>
            <span class="info-bar-value info-ship">${shipName}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">CARGO:</span>
            <span class="info-bar-value">${currentCargoLoad}/${PLAYER_CARGO_CAPACITY}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">CREDITS:</span>
            <span class="info-bar-value info-credits">${formatNumber(playerCredits)}c</span>
        </div>
    `;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');

    // Drop the oldest toast if there are already 3 on screen
    if (container.children.length >= 3) {
        container.removeChild(container.firstChild);
    }
    
    // Create Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message; // Allow HTML for bold text

    container.appendChild(toast);

    // Trigger Animation (Next Frame)
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto-Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        // Wait for fade-out transition to finish before removing from DOM
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

function logMessage(newMessage, isImportant = false) {
    if (!newMessage || newMessage.trim() === "") { render(); return; }
    
    // SAFETY CHECK: If game hasn't started (Title Screen), use "0.00"
    let dateStr = "0.00";
    if (typeof currentGameDate !== 'undefined' && currentGameDate !== null) {
        dateStr = currentGameDate.toFixed(2);
    }

    const timestamp = `<span class="log-datestamp">[SD ${dateStr}]</span>`;
    messageLog.unshift(`${timestamp}${newMessage}`);
    
    if (messageLog.length > MAX_LOG_MESSAGES) messageLog.pop();
    
    // Only try to render if the function exists (prevents rare startup crashes)
    if (typeof render === 'function') {
        render();
    }
}

 function renderContextualActions(actions) {
     const container = document.getElementById('contextual-actions');
     container.innerHTML = ''; // Clear old buttons
     if (!actions) return;

     actions.forEach(action => {
         const button = document.createElement('button');
         button.textContent = `${action.label} (${action.key.toUpperCase()})`;
         button.className = 'control-button';
         button.onclick = action.onclick;
         container.appendChild(button);
     });
 }

 // --- VISIBILITY MANAGER ---
function updateSideBorderVisibility() {
    // 1. Find the elements
    const leftBorder = document.getElementById('leftSideBorder');
    const rightBorder = document.getElementById('rightSideBorder');

    // Determine if they should be visible (usually only on the Galactic Map)
    const isVisible = (currentGameState === GAME_STATES.GALACTIC_MAP);
    const displayValue = isVisible ? 'block' : 'none';

    // 2. Safely update them ONLY if they exist
    if (leftBorder) {
        leftBorder.style.display = displayValue;
    }
    
    if (rightBorder) {
        rightBorder.style.display = displayValue;
    }
}

function formatNumber(num) {
    // Defensive check: If the engine passes undefined during startup, default to "0"
    if (num === undefined || num === null || isNaN(num)) return "0";
    
    // Force the number to an integer before applying the regex
    // This strips off any decimal tails (like .4000001) so commas don't get injected into them!
    const safeNum = Math.floor(Number(num));
    
    // Proceed with the standard comma formatting
    return safeNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function triggerHaptic(pattern) {
    // Only works if device supports it and user has interacted with page
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function triggerDamageEffect() {
    // 1. Shake the screen
    const app = document.getElementById('app-container');
    app.classList.remove('shake-effect'); // Reset
    void app.offsetWidth; // Force reflow (magic trick to restart animation)
    app.classList.add('shake-effect');

    // 2. Red Flash
    const flash = document.getElementById('damageFlash');
    if(flash) {
        flash.style.opacity = '1';
        setTimeout(() => { flash.style.opacity = '0'; }, 100);
    }
}

// ==========================================
// --- GALACTIC CODEX (LORE VIEWER V2) ---
// ==========================================

function toggleCodex(show) {
    const overlay = document.getElementById('codexOverlay');
    if (!overlay) return;

    if (show) {
        overlay.style.display = 'flex';
        if (typeof updateModalInfoBar === 'function') updateModalInfoBar('codexInfoBar');
        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        renderCodexCategories();
    } else {
        overlay.style.display = 'none';
        if (typeof updateSideBorderVisibility === 'function') updateSideBorderVisibility();
    }
}

function renderCodexCategories() {
    const catList = document.getElementById('codexCategories');
    const entriesList = document.getElementById('codexEntries');
    const textContent = document.getElementById('codexEntryText');
    
    if (!catList || !entriesList || !textContent) return;

    catList.innerHTML = '';
    entriesList.innerHTML = '';
    textContent.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; opacity: 0.3;">
            <div style="font-size: 60px; margin-bottom: 20px;">📖</div>
            <div style="font-family: var(--title-font); letter-spacing: 2px;">SELECT AN ARCHIVE</div>
        </div>
    `;

    // 1. Group unlocked lore by category
    const categories = {};
    discoveredLoreEntries.forEach(id => {
        const lore = LORE_DATABASE[id];
        if (lore) {
            if (!categories[lore.category]) categories[lore.category] = [];
            categories[lore.category].push({ id, ...lore });
        }
    });

    // 2. Count total entries in game to show a completion percentage
    // (This is the line that went missing!)
    let totalUnlocked = discoveredLoreEntries.size; 
    
    // OPTIMIZATION: Only calculate this once and cache it on the window object
    if (!window.cachedTotalLore) {
        window.cachedTotalLore = Object.keys(LORE_DATABASE).filter(k => !k.startsWith('SPIRE')).length; 
    }
    let totalAvailable = window.cachedTotalLore;
    
    let pct = Math.floor((totalUnlocked / totalAvailable) * 100) || 0;

    const progressHTML = `
        <div style="padding: 20px 15px; border-bottom: 1px solid var(--border-color); text-align:center; background: rgba(0,0,0,0.3);">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:8px;">ARCHIVE RECOVERY</div>
            <div style="font-size:24px; font-weight:bold; color:var(--text-color); font-family: var(--title-font);">${pct}%</div>
            <div style="font-size:11px; color:var(--item-desc-color); margin-top:5px;">${totalUnlocked} of ${totalAvailable} Entries Decrypted</div>
        </div>
    `;
    catList.innerHTML += progressHTML;

    // 3. Build Category Buttons
    Object.keys(categories).sort().forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'generic-list-item codex-cat-btn';
        btn.innerHTML = `
            <div style="font-weight:bold; color:var(--text-color); font-size: 14px;">${cat}</div>
            <div style="font-size:10px; color:var(--item-desc-color); margin-top: 4px;">${categories[cat].length} Entries</div>
        `;
        
        btn.onclick = () => {
            Array.from(catList.children).forEach(c => c.classList.remove('active-cat'));
            btn.classList.add('active-cat');
            if (typeof soundManager !== 'undefined') soundManager.playUIClick();
            renderCodexEntries(categories[cat]);
        };
        catList.appendChild(btn);
    });
}

function renderCodexEntries(entries) {
    const entriesList = document.getElementById('codexEntries');
    entriesList.innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px;">DECRYPTED FILES</div>
        </div>
    `;

    // Sort alphabetically by title
    entries.sort((a, b) => a.title.localeCompare(b.title)).forEach(entry => {
        const btn = document.createElement('div');
        btn.className = 'generic-list-item codex-entry-btn';
        btn.innerHTML = `<div style="font-weight:bold; color:var(--item-name-color); font-size: 13px;">${entry.title}</div>`;
        
        btn.onclick = () => {
            Array.from(entriesList.children).forEach(c => c.classList.remove('active-entry'));
            btn.classList.add('active-entry');
            if (typeof soundManager !== 'undefined') soundManager.playUIClick();
            renderCodexText(entry);
        };
        entriesList.appendChild(btn);
    });
}

function renderCodexText(entry) {
    const textContent = document.getElementById('codexEntryText');
    
    // Smooth fade-in animation
    textContent.style.animation = 'none';
    textContent.offsetHeight; /* trigger reflow */
    textContent.style.animation = 'fadeIn 0.3s ease-out';

    // Using semantic classes instead of inline colors!
    textContent.innerHTML = `
        <div class="codex-reading-pane">
            <div class="codex-classification">
                ARCHIVE ENTRY // CLASS: <span>${entry.category}</span>
            </div>
            
            <h1 class="codex-title">
                ${entry.title.toUpperCase()}
            </h1>
            
            <div class="codex-body-text">
                ${entry.text}
            </div>
            
            <div class="codex-footer">
                END OF TRANSMISSION // CONCORD DATA SYSTEMS
            </div>
        </div>
    `;
}

// ==========================================
// --- VESSEL REGISTRATION (NAMING) ---
// ==========================================

function renameShip() {
    const currentName = playerShip.name || SHIP_CLASSES[playerShip.shipClass].name;
    const newName = prompt("Enter new vessel registry name:", currentName);
    
    // Check if the user entered a valid string and didn't hit cancel
    if (newName && newName.trim() !== "") {
        playerShip.name = newName.trim();
        
        logMessage(`<span style="color:var(--success)">[ NAV-COM ] Vessel registry updated to: <b>${playerShip.name}</b></span>`);
        if (typeof showToast === 'function') showToast("REGISTRY UPDATED", "success");
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        
        // Refresh the UI to show the new name instantly!
        if (typeof displayCommanderProfile === 'function') displayCommanderProfile('SHIP'); 
        updateModalInfoBar('genericInfoBar'); 
        if (typeof autoSaveGame === 'function') autoSaveGame();
    }
}

// --- MODAL INFO BAR HELPER ---
function updateModalInfoBar(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // --- THE FIX: USE CUSTOM NAME IF AVAILABLE ---
    const baseShipName = SHIP_CLASSES[playerShip.shipClass].name;
    const shipName = playerShip.name ? playerShip.name : baseShipName;
    
    // Calculate Reputation Text
    // Use the global title, or "Unknown" if undefined
    const rep = playerNotorietyTitle || "Unknown";

    el.innerHTML = `
        <div class="info-bar-item">
            <span class="info-bar-value info-ship">${playerName}</span>
            <span class="info-bar-label">LVL ${playerLevel}</span>
        </div>
        
        <div class="info-bar-item">
            <span class="info-bar-label">REP:</span>
            <span class="info-bar-value" style="color:var(--accent-color)">${rep}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">SHIP:</span>
            <span class="info-bar-value info-ship">${shipName}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">CARGO:</span>
            <span class="info-bar-value">${currentCargoLoad}/${PLAYER_CARGO_CAPACITY}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">CREDITS:</span>
            <span class="info-bar-value info-credits">${formatNumber(playerCredits)}c</span>
        </div>
    `;
}

// --- COMMANDER PROFILE UI ---
function displayCommanderProfile(tab = 'OVERVIEW') {
    // Hide the SYS menu so it doesn't overlap
    document.getElementById('systemMenu').classList.add('hidden');
    
    openGenericModal("COMMANDER DATAPAD");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    document.getElementById('genericModalActions').innerHTML = ''; // Clear bottom buttons

    // 1. Build the Left-Side Navigation Tabs
    listEl.innerHTML = '';
    const tabs = [
        { id: 'OVERVIEW', name: 'Personal Log', icon: '👤' },
        { id: 'SHIP', name: 'Vessel Manifest', icon: '🚀' },
        { id: 'LOADOUT', name: 'Equipped Gear', icon: '⚙️' },
        { id: 'FACTIONS', name: 'Reputation', icon: '📜' },
        { id: 'LOG', name: "Captain's Log", icon: '📝' } // <-- NEW TAB ADDED
    ];

    tabs.forEach(t => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        // Highlight the currently active tab
        if (tab === t.id) row.style.background = 'rgba(0, 224, 224, 0.1)';
        
        row.innerHTML = `<span style="color:var(--text-color); font-weight:bold;">${t.icon} ${t.name}</span>`;
        row.onclick = () => displayCommanderProfile(t.id);
        listEl.appendChild(row);
    });

    // 2. Build the Right-Side Content based on the selected tab
    let html = `<div style="padding: 15px;">`;
    
    if (tab === 'OVERVIEW') {
        // Calculate Notoriety Title
        let notTitle = "Unknown";
        for (let i = NOTORIETY_TITLES.length - 1; i >= 0; i--) {
            if (playerNotoriety >= NOTORIETY_TITLES[i].score) {
                notTitle = NOTORIETY_TITLES[i].title; break;
            }
        }
        const xpReq = Math.floor(BASE_XP_TO_LEVEL * Math.pow(playerLevel, XP_LEVEL_EXPONENT));

        html += `
            <h3 style="color:var(--accent-color); border-bottom:1px solid #333; padding-bottom:10px; margin-top:0;">OVERVIEW</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:13px; line-height:1.5;">
                <div style="color:#888;">Clearance Level:</div> <div style="color:var(--text-color); text-align:right; font-weight:bold;">${playerLevel}</div>
                <div style="color:#888;">Experience:</div> <div style="color:var(--text-color); text-align:right;">${Math.floor(playerXP)} / ${xpReq}</div>
                <div style="color:#888;">Credits:</div> <div style="color:var(--gold-text); text-align:right; font-weight:bold;">${formatNumber(playerCredits)}c</div>
                <div style="color:#888;">Notoriety:</div> <div style="color:var(--text-color); text-align:right;">${notTitle} (${playerNotoriety})</div>
                <div style="color:#888;">Active Contract:</div> <div style="color:var(--text-color); text-align:right;">${playerActiveMission ? 'In Progress' : 'None'}</div>
                <div style="color:#888;">Crew Roster:</div> <div style="color:var(--text-color); text-align:right;">${playerCrew.length} / ${MAX_CREW}</div>
            </div>
        `;
    }

    else if (tab === 'SHIP') {
        const ship = SHIP_CLASSES[playerShip.shipClass];
        const customName = playerShip.name || ship.name; // Pull custom name
        
        html += `
            <div style="text-align:center;">
                ${ship.image ? `<img src="${ship.image}" style="width:100%; max-width:180px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(0,224,224,0.2));">` : '<div style="font-size:50px; opacity:0.5; margin-bottom:15px;">🚀</div>'}
            </div>
            
            <h3 style="color:var(--accent-color); margin-top:0; text-align:center; cursor:pointer;" onclick="renameShip()" title="Click to christen your vessel">
                ${customName.toUpperCase()} <span style="font-size:14px; opacity:0.7;">✏️</span>
            </h3>
            <div style="text-align:center; font-size:10px; color:#888; margin-top:-10px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px; letter-spacing:1px;">
                REGISTERED CHASSIS: ${ship.name.toUpperCase()}
            </div>
            
            ${activeSynergy ? `<div style="text-align:center; color:var(--gold-text); font-size:12px; margin-bottom:15px; padding:5px; background:rgba(255,215,0,0.1); border:1px solid #886600; border-radius:4px; font-weight:bold; letter-spacing:1px;">★ SET BONUS: ${activeSynergy.name.toUpperCase()} ★<br><span style="color:#CCC; font-size:10px; font-weight:normal;">${activeSynergy.desc}</span></div>` : ''}
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; font-size:13px;">
                <div style="color:#888;">Max Hull:</div> <div style="color:var(--success); text-align:right; font-weight:bold;">${MAX_PLAYER_HULL}</div>
                <div style="color:#888;">Max Shields:</div> <div style="color:#00E0E0; text-align:right; font-weight:bold;">${MAX_SHIELDS}</div>
                <div style="color:#888;">Fuel Capacity:</div> <div style="color:var(--warning); text-align:right; font-weight:bold;">${MAX_FUEL}</div>
                <div style="color:#888;">Cargo Space:</div> <div style="color:var(--text-color); text-align:right; font-weight:bold;">${currentCargoLoad} / ${PLAYER_CARGO_CAPACITY}</div>
                <div style="color:#888; grid-column: span 2; margin-top: 5px; border-top: 1px dashed #333; padding-top: 10px;">Combat Protocol: <span style="color:var(--danger); float:right;">${ship.ability.name}</span></div>
            </div>
        `;
    } 
    else if (tab === 'LOADOUT') {
        html += `<h3 style="color:var(--accent-color); border-bottom:1px solid #333; padding-bottom:10px; margin-top:0;">SYSTEM DIAGNOSTICS</h3>`;
        const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];
        
        slots.forEach(slot => {
            const compId = playerShip.components[slot];
            const comp = COMPONENTS_DATABASE[compId];
            const mfgBadge = (comp && comp.manufacturer) ? `<span style="background:rgba(255,255,255,0.1); color:#CCC; padding:2px 4px; border-radius:2px; font-size:9px; margin-left:6px; vertical-align:middle;">${comp.manufacturer}</span>` : '';
            
            html += `
                <div style="margin-bottom:12px; background:rgba(0,0,0,0.2); padding:10px; border-left:3px solid var(--accent-color); border-radius: 0 4px 4px 0;">
                    <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:1px;">${slot}</div>
                    <div style="color:var(--item-name-color); font-weight:bold; margin-top:4px;">${comp ? comp.name : 'Empty'} ${mfgBadge}</div>
                </div>
            `;
        });
    } 
    else if (tab === 'FACTIONS') {
        html += `<h3 style="color:var(--accent-color); border-bottom:1px solid #333; padding-bottom:10px; margin-top:0;">DIPLOMATIC STANDINGS</h3>`;
        html += `<div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">`;
        
        for (const [facKey, facData] of Object.entries(FACTIONS)) {
            if (facKey === 'INDEPENDENT') continue; // Skip lawless space
            
            const rep = playerFactionStanding[facKey] || 0;
            let repColor = rep > 20 ? 'var(--success)' : rep < -20 ? 'var(--danger)' : 'var(--text-color)';
            let repTitle = rep > 50 ? 'Allied' : rep > 20 ? 'Friendly' : rep < -50 ? 'Hostile' : rep < -20 ? 'Unfriendly' : 'Neutral';
            
            html += `
                <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:4px; border-left:4px solid ${facData.color};">
                    <div style="color:${facData.color}; font-weight:bold; font-size:14px; margin-bottom:6px; letter-spacing: 1px;">${facData.name.toUpperCase()}</div>
                    <div style="display:flex; justify-content:space-between; align-items: center;">
                        <span style="color:#888;">Standing:</span> 
                        <span style="color:${repColor}; font-weight:bold;">${repTitle} (${rep})</span>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
    }
    // --- NEW: THE CAPTAIN'S LOG TAB ---
    else if (tab === 'LOG') {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; margin-top:0;">
                <h3 style="color:var(--accent-color); margin:0;">CAPTAIN'S LOG</h3>
                <span style="font-size:10px; color:var(--item-desc-color); letter-spacing:1px;">LAST 50 ENTRIES</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height: 380px; overflow-y: auto; padding-right: 5px;">
        `;
        
        if (typeof messageLog !== 'undefined' && messageLog.length > 0) {
            // messageLog already has the newest items at index 0, so we just loop through it!
            messageLog.forEach(msg => {
                html += `
                    <div style="background:rgba(0,0,0,0.3); border-left:2px solid var(--accent-color); padding:10px; border-radius:0 4px 4px 0; font-size:12px; line-height:1.5;">
                        ${msg}
                    </div>
                `;
            });
        } else {
            html += `<div style="text-align:center; padding: 30px; color:#666; font-style:italic;">Log is currently empty.</div>`;
        }
        
        html += `</div>`;
    }
    
    html += `</div>`;
    detailEl.innerHTML = html;
}

// --- VISUAL CARGO SYSTEM ---

function openCargoModal() {
    if (currentTradeContext || currentCombatContext || currentMissionContext) return;

    document.getElementById('cargoOverlay').style.display = 'flex';
    selectedCargoIndex = -1;
    renderCargoList();
    
    document.getElementById('cargoItemName').textContent = "SELECT CARGO";
    document.getElementById('cargoItemDesc').textContent = "Select an item to inspect or jettison.";
    document.getElementById('cargoItemQty').textContent = "-";
    document.getElementById('cargoItemVal').textContent = "-";
    document.getElementById('jettisonBtn').disabled = true;
    
    currentOutfitContext = { step: 'viewingCargo' };

    // Update the Info Bar
    updateModalInfoBar('cargoInfoBar');

    // UPDATE BORDERS
    updateSideBorderVisibility();
}

function closeCargoModal() {
    document.getElementById('cargoOverlay').style.display = 'none';
    currentOutfitContext = null;
    handleInteraction();

    // UPDATE BORDERS
    updateSideBorderVisibility();
}

function renderCargoList() {
    const listEl = document.getElementById('cargoList');
    listEl.innerHTML = '';
    
    // Convert cargo object to array of keys for easier indexing
    const cargoKeys = Object.keys(playerCargo).filter(key => playerCargo[key] > 0);
    
    if (cargoKeys.length === 0) {
        listEl.innerHTML = '<div style="padding:20px; color:#666;">Cargo Hold Empty</div>';
        return;
    }

    cargoKeys.forEach((key, index) => {
        const item = COMMODITIES[key];
        const qty = playerCargo[key];
        
        // SAFETY CHECK: If the item doesn't exist in the database, skip rendering it!
        if (!item) return; 
        
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        if (index === selectedCargoIndex) row.classList.add('selected');
        
        row.innerHTML = `<span>${item.name}</span> <span style="color:#888;">x${qty}</span>`;
        
        row.onclick = () => selectCargoItem(index, key);
        listEl.appendChild(row);
    });
}

function selectCargoItem(index, key) {
    selectedCargoIndex = index;
    renderCargoList(); // Update highlight
    
    const item = COMMODITIES[key];
    const qty = playerCargo[key];
    
    document.getElementById('cargoItemName').textContent = item.name;
    document.getElementById('cargoItemDesc').textContent = item.description;
    document.getElementById('cargoItemQty').textContent = qty;
    document.getElementById('cargoItemVal').textContent = `${item.basePrice}c`;
    
    const jetBtn = document.getElementById('jettisonBtn');
    jetBtn.disabled = false;
    jetBtn.onclick = () => jettisonItem(key);

    // --- SPECIAL ITEM ACTIONS ---
    const decryptBtn = document.getElementById('decryptBtn');
    if (decryptBtn) {
        // Support all decryptable items!
        if (key === 'ENCRYPTED_ENGRAM' || key === 'ENCRYPTED_DATA' || key === 'ANCIENT_ARCHIVE') {
            decryptBtn.style.display = 'block';
            
            // Smart Button Logic
            if (playerPerks.has('CYBER_SLICER')) {
                decryptBtn.innerText = "DECRYPT (Perk: Cyber Slicer)";
                decryptBtn.disabled = false;
                decryptBtn.onclick = () => processDecryption('perk', key);
            } else if (playerCargo['PRECURSOR_CIPHER'] && playerCargo['PRECURSOR_CIPHER'] > 0) {
                decryptBtn.innerText = "DECRYPT (Consumes 1 Cipher)";
                decryptBtn.disabled = false;
                decryptBtn.onclick = () => processDecryption('cipher', key);
            } else {
                decryptBtn.innerText = "LOCKED (Requires Cipher)";
                decryptBtn.disabled = true;
            }
        } else {
            decryptBtn.style.display = 'none';
        }
    }
}

function jettisonItem(key) {
    if (playerCargo[key] > 0) {
        playerCargo[key]--;
        
        if (playerCargo[key] <= 0) delete playerCargo[key];
        
        updateCurrentCargoLoad();
        
        // Visual updates
        renderCargoList();
        renderUIStats();
        
        // Update detail view or deselect if empty
        if (playerCargo[key] > 0) {
            selectCargoItem(selectedCargoIndex, key);
        } else {
            // Item gone
            selectedCargoIndex = -1;
            document.getElementById('cargoItemName').textContent = "ITEM EJECTED";
            document.getElementById('jettisonBtn').disabled = true;
        }
        
        // Optional: Spawn a particle effect in the background?
        spawnParticles(playerX, playerY, 'mining'); // Reusing mining dust as "trash"
    }
}

function updateCurrentCargoLoad() {

     // Instead of doing the math here, we just tell the engine it changed!
     // Any future expansion (like a UI popup, a sound effect, or an achievement tracker)
     // can just listen for this exact event without you rewriting this function.

     GameBus.emit('CARGO_MODIFIED');
 }
