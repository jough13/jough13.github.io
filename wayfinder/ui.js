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

    // Get current ship name
    const shipName = SHIP_CLASSES[playerShip.shipClass].name;
    
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

function toggleCodex(show) {
    if (show) {
        codexOverlayElement.style.display = 'flex';
        renderCodexCategories();
        renderCodexEntries(null);
        codexEntryTextElement.innerHTML = "Select a category, then an entry.";
    } else {
        codexOverlayElement.style.display = 'none';
        currentCodexCategory = null;
    }
    
    // UPDATE BORDERS
    updateSideBorderVisibility();
}

function renderCodexCategories() {
    codexCategoriesElement.innerHTML = '';
    const cats = new Set();
    
    // OPTIMIZED: Grabbing the key and the entry together!
    Object.entries(LORE_DATABASE).forEach(([key, entry]) => {
        if (discoveredLoreEntries.has(key)) {
            cats.add(entry.category);
        }
    });
    
    Array.from(cats).sort().forEach(cat => {
        const cD = document.createElement('div');
        cD.textContent = cat;
        cD.className = 'codex-list-item';
        if (cat === currentCodexCategory) cD.classList.add('active');
        cD.onclick = () => {
            currentCodexCategory = cat;
            renderCodexCategories(); // Refreshes to move the 'active' class highlighting
            renderCodexEntries(cat);
            codexEntryTextElement.innerHTML = "Select an entry.";
        };
        codexCategoriesElement.appendChild(cD);
    });
}

function renderCodexEntries(category) {
    codexEntriesElement.innerHTML = '';
    if (!category) return;
    
    Object.entries(LORE_DATABASE).forEach(([k, e]) => {
        if (e.category === category && discoveredLoreEntries.has(k)) {
            const eD = document.createElement('div');
            eD.textContent = e.title;
            eD.className = 'codex-list-item';
            eD.onclick = () => {
                // Excellent touch replacing \n with <br> for proper formatting!
                codexEntryTextElement.innerHTML = `<strong>${e.title}</strong><hr style="margin:5px 0;border-color:#4a4a6a;"><p>${e.text.replace(/\n/g,'<br>')}</p>`;
                document.querySelectorAll('#codexEntries .codex-list-item').forEach(el => el.classList.remove('active'));
                eD.classList.add('active');
            };
            codexEntriesElement.appendChild(eD);
        }
    });
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
        { id: 'FACTIONS', name: 'Reputation', icon: '📜' }
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
        html += `
            <div style="text-align:center;">
                ${ship.image ? `<img src="${ship.image}" style="width:100%; max-width:180px; margin-bottom:15px; filter: drop-shadow(0 0 10px rgba(0,224,224,0.2));">` : '<div style="font-size:50px; opacity:0.5; margin-bottom:15px;">🚀</div>'}
            </div>
            <h3 style="color:var(--accent-color); border-bottom:1px solid #333; padding-bottom:10px; margin-top:0; text-align:center;">${ship.name.toUpperCase()}</h3>
            
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
    
    html += `</div>`;
    detailEl.innerHTML = html;
}

// --- VISUAL CARGO SYSTEM ---

let selectedCargoIndex = -1;

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
