// --- GENERIC MODAL HANDLER ---
function openGenericModal(title) {
    const modal = document.getElementById('genericModalOverlay');
    document.getElementById('genericModalTitle').textContent = title;
    
    const container = document.getElementById('genericModalContent');

    // --- SCRUB LINGERING INLINE STYLES ---
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
    // THE EXPLOIT FIX
    if (window.activeHostileEncounter) {
        if (typeof showToast === 'function') showToast("Comm channel locked. You must respond!", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return; // Kills the function so the modal stays open!
    }
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
    if (!newMessage || newMessage.trim() === "") { 
        if (typeof render === 'function') render(); 
        return; 
    }
    
    // 1. Format the string
    let dateStr = "0.00";
    if (typeof currentGameDate !== 'undefined' && currentGameDate !== null) {
        dateStr = currentGameDate.toFixed(2);
    }

    const timestamp = `<span class="log-datestamp">[SD ${dateStr}]</span>`;
    messageLog.unshift(`${timestamp} ${newMessage}`);
    
    if (typeof MAX_LOG_MESSAGES !== 'undefined' && messageLog.length > MAX_LOG_MESSAGES) {
        messageLog.pop();
    }

    // Silently feed the background Diagnostician so your Crash Screen still catches everything
    console.info(newMessage);

    // --- 2. PRE-RENDER SCROLL SNAPSHOT ---
    // THE FIX: Target the actual ID of your text box!
    const oldLogEl = document.getElementById('messageArea');
    
    let isScrolledToTop = true;
    let previousScrollHeight = 0;
    let previousScrollTop = 0;

    if (oldLogEl) {
        previousScrollTop = oldLogEl.scrollTop;
        previousScrollHeight = oldLogEl.scrollHeight;
        // Check if the user is currently at the top (with a 20px grace area)
        isScrolledToTop = (oldLogEl.scrollTop <= 20); 
    }
    
    // --- 3. TRIGGER ENGINE RENDER ---
    if (typeof render === 'function') {
        // Debounce the render so multiple logs in one frame only draw the canvas once!
        if (!window._isRenderingLog) {
            window._isRenderingLog = true;
            requestAnimationFrame(() => {
                render();
                window._isRenderingLog = false;
            });
        }
    }

    // --- 4. POST-RENDER SCROLL RESTORATION ---
    setTimeout(() => {
        const newLogEl = document.getElementById('messageArea');
        
        if (newLogEl) {
            if (isScrolledToTop) {
                // Keep them pinned to the top to see the new messages
                newLogEl.scrollTop = 0;
            } else {
                // MAGIC MATH: Push the scrollbar down by the exact pixel height of the new text
                const heightDifference = newLogEl.scrollHeight - previousScrollHeight;
                newLogEl.scrollTop = previousScrollTop + Math.max(0, heightDifference);
            }
        }
    }, 0);
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
        { id: 'LOG', name: "Recent Comms", icon: '💬' },
        { id: 'MILESTONES', name: "Service Record", icon: '🏆' }
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
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                <img src="${typeof playerPfp !== 'undefined' ? playerPfp : 'assets/pfp_01.png'}" alt="Commander Profile" style="width: 80px; height: 80px; border-radius: 4px; border: 2px solid var(--accent-color); object-fit: cover; box-shadow: 0 0 15px rgba(0, 224, 224, 0.2);">
                <div>
                    <h3 style="color:var(--accent-color); margin: 0 0 5px 0; font-size: 18px; letter-spacing: 2px;">${playerName.toUpperCase()}</h3>
                    <div style="color:var(--item-desc-color); font-size: 10px; letter-spacing: 2px;">CONCORD REGISTRY IDENT</div>
                </div>
            </div>

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

    else if (tab === 'MILESTONES') {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; margin-top:0;">
                <h3 style="color:var(--gold-text); margin:0;">SERVICE RECORD</h3>
                <span style="font-size:10px; color:var(--item-desc-color); letter-spacing:1px;">CAREER MILESTONES</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height: 380px; overflow-y: auto; padding-right: 5px;">
        `;
        
        if (GameState.player.milestones && GameState.player.milestones.length > 0) {
            GameState.player.milestones.forEach(msg => {
                html += `
                    <div style="background:rgba(255,215,0,0.05); border-left:2px solid var(--gold-text); padding:10px; border-radius:0 4px 4px 0; font-size:12px; line-height:1.5;">
                        ${msg}
                    </div>
                `;
            });
        } else {
            html += `<div style="text-align:center; padding: 30px; color:#666; font-style:italic;">No major milestones recorded yet.</div>`;
        }
        
        html += `</div>`;
    }

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

function updateCurrentCargoLoad() {

     // Instead of doing the math here, we just tell the engine it changed!
     // Any future expansion (like a UI popup, a sound effect, or an achievement tracker)
     // can just listen for this exact event without you rewriting this function.

     GameBus.emit('CARGO_MODIFIED');
 }

// ==========================================
// --- CARGO MANAGEMENT UI ---
// ==========================================

function openCargoModal() {
    window.cargoSortMode = window.cargoSortMode || 'NAME'; // Default sort state
    openGenericModal("CARGO MANIFEST");
    
    // --- THE IRONCLAD FLEXBOX LAYOUT ---
    const container = document.getElementById('genericModalContent');
    container.style.cssText = "display: flex; gap: 20px; height: 100%; overflow: hidden; padding-top: 15px;";
    
    // We completely overwrite the generic layout to strictly control the scrolling zones!
    container.innerHTML = `
        <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-right: 10px; padding-left: 15px;">
            <div id="cargoSortHeader" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 10px; flex-shrink: 0;">
                </div>
            <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
        </div>
        
        <div style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-right: 15px;">
            <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            <div id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;"></div>
        </div>
    `;
    
    renderCargoList();
}

function cycleCargoSort() {
    const modes = ['NAME', 'VALUE', 'QUANTITY', 'ILLEGAL'];
    let currentIndex = modes.indexOf(window.cargoSortMode || 'NAME');
    currentIndex = (currentIndex + 1) % modes.length;
    window.cargoSortMode = modes[currentIndex];
    
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    renderCargoList();
}

function renderCargoList() {
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    const sortHeader = document.getElementById('cargoSortHeader');
    
    if (!listEl) return;
    listEl.innerHTML = '';
    
    // --- 1. Map Cargo into a Sortable Array ---
    let cargoArray = [];
    for (const itemKey in playerCargo) {
        if (playerCargo[itemKey] > 0) {
            const itemDef = typeof COMMODITIES !== 'undefined' ? COMMODITIES[itemKey] : null;
            cargoArray.push({
                key: itemKey,
                qty: playerCargo[itemKey],
                def: itemDef,
                name: itemDef ? itemDef.name : itemKey,
                value: itemDef ? itemDef.basePrice : 0,
                illegal: itemDef && itemDef.illegal ? 1 : 0
            });
        }
    }

    if (cargoArray.length === 0) {
        listEl.innerHTML = '<div style="padding:15px; color:#666;">Cargo hold is currently empty.</div>';
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 40px 20px;">
                <div style="font-size:50px; opacity:0.5; margin-bottom:15px;">🕸️</div>
                <h3 style="color:#666;">HOLD EMPTY</h3>
                <p style="color:var(--item-desc-color); font-size:12px;">No physical goods detected in the cargo bay.</p>
            </div>`;
        actionsEl.innerHTML = `<button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="closeGenericModal()">CLOSE MANIFEST</button>`;
        if(sortHeader) sortHeader.innerHTML = `<span style="color:var(--item-desc-color); font-size:10px; letter-spacing:2px;">INVENTORY</span>`;
        return;
    }

    // --- 2. Build the Sorting Header ---
    if (sortHeader) {
        let sortLabel = "A-Z";
        if (window.cargoSortMode === 'VALUE') sortLabel = "TOTAL VALUE";
        if (window.cargoSortMode === 'QUANTITY') sortLabel = "QUANTITY";
        if (window.cargoSortMode === 'ILLEGAL') sortLabel = "CONTRABAND";

        sortHeader.innerHTML = `
            <span style="color:var(--accent-color); font-size:10px; letter-spacing:2px;">INVENTORY</span>
            <button class="action-button" style="padding: 6px 10px; font-size: 10px; border-color:var(--accent-color); color:var(--accent-color);" onclick="cycleCargoSort()">
                SORT: ${sortLabel} ⟳
            </button>
        `;
    }

    // --- 3. Apply the Sorting Algorithm ---
    cargoArray.sort((a, b) => {
        if (window.cargoSortMode === 'VALUE') {
            return (b.value * b.qty) - (a.value * a.qty); 
        } else if (window.cargoSortMode === 'QUANTITY') {
            return b.qty - a.qty; 
        } else if (window.cargoSortMode === 'ILLEGAL') {
            if (b.illegal !== a.illegal) return b.illegal - a.illegal; 
            return a.name.localeCompare(b.name); 
        } else {
            return a.name.localeCompare(b.name); 
        }
    });

    // --- 4. Render the Sorted Rows ---
    const fragment = document.createDocumentFragment();

    cargoArray.forEach(item => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;";
        
        if (item.illegal) row.style.borderLeft = '3px solid var(--danger)';
        if (window.activeCargoItem === item.key) row.style.background = 'rgba(0, 224, 224, 0.1)';

        let subtext = "";
        if (window.cargoSortMode === 'VALUE') subtext = `<div style="color:var(--gold-text); font-size:10px; opacity:0.8; margin-top:4px;">Value: ${formatNumber(item.value * item.qty)}c</div>`;
        
        row.innerHTML = `
            <div>
                <div style="font-weight:bold; color:var(--item-name-color); font-size: 13px;">${item.illegal ? '⚠️' : '📦'} ${item.name}</div>
                ${subtext}
            </div>
            <div style="color:var(--accent-color); font-weight:bold; font-size:14px;">x${item.qty}</div>
        `;
        row.onclick = () => selectCargoItem(item.key);
        
        fragment.appendChild(row);
    });

    listEl.appendChild(fragment);

    // Auto-select the active item, or the first item in the list if none is active
    if (!window.activeCargoItem || !playerCargo[window.activeCargoItem]) {
        selectCargoItem(cargoArray[0].key);
    } else {
        selectCargoItem(window.activeCargoItem);
    }
}

function selectCargoItem(key) {
    window.activeCargoItem = key; // Remember what we are looking at!
    
    // Visually update the list selection without doing a full re-render
    const listEl = document.getElementById('genericModalList');
    if (listEl) {
        Array.from(listEl.children).forEach(child => {
            if (child.classList.contains('trade-item-row')) {
                if (child.textContent.includes(typeof COMMODITIES !== 'undefined' && COMMODITIES[key] ? COMMODITIES[key].name : key)) {
                    child.style.background = 'rgba(0, 224, 224, 0.1)';
                } else {
                    child.style.background = 'transparent';
                }
            }
        });
    }

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    const itemDef = typeof COMMODITIES !== 'undefined' ? COMMODITIES[key] : null;
    
    if (!itemDef || !playerCargo[key]) {
        renderCargoList();
        return;
    }

    const qty = playerCargo[key];
    const isIllegal = itemDef.illegal ? '<span style="color:var(--danger); font-size:10px; border:1px solid var(--danger); padding:2px 4px; border-radius:2px; margin-left:10px;">CONTRABAND</span>' : '';
    const weight = itemDef.weight || 1;

    detailEl.innerHTML = `
        <div style="padding: 20px; text-align:center; animation: fadeIn 0.3s ease-out;">
            <div style="font-size:50px; margin-bottom:15px; filter: drop-shadow(0 0 10px ${itemDef.illegal ? 'var(--danger)' : 'var(--accent-color)'});">${itemDef.illegal ? '⚠️' : (itemDef.icon || '📦')}</div>
            <h3 style="color:var(--item-name-color); margin-bottom:10px; display:flex; justify-content:center; align-items:center;">
                ${itemDef.name.toUpperCase()} ${isIllegal}
            </h3>
            <div style="background:rgba(0,0,0,0.5); padding:15px; border-radius:4px; text-align:left; border-left: 3px solid ${itemDef.illegal ? 'var(--danger)' : 'var(--accent-color)'}; margin-bottom:20px;">
                <p style="color:var(--text-color); font-size:13px; margin:0; line-height:1.5;">${itemDef.description || 'No data available.'}</p>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:12px; text-align:left; background:var(--bg-color); padding: 15px; border: 1px solid var(--border-color); border-radius: 4px;">
                <div style="color:var(--item-desc-color);">Current Stock:</div> <div style="color:var(--accent-color); text-align:right; font-weight:bold;">${qty} Units</div>
                <div style="color:var(--item-desc-color);">Base Value:</div> <div style="color:var(--gold-text); text-align:right;">${itemDef.basePrice || 0}c</div>
                <div style="color:var(--item-desc-color);">Unit Weight:</div> <div style="color:var(--text-color); text-align:right;">${weight} Ton(s)</div>
                <div style="color:var(--item-desc-color);">Total Weight:</div> <div style="color:var(--warning); text-align:right;">${weight * qty} Ton(s)</div>
            </div>
        </div>
    `;

    // Check if the item has a usable function attached to it!
    let useButtonHtml = "";
    if (itemDef.onUse) {
        useButtonHtml = `
        <button class="action-button" style="border-color:var(--success); color:var(--success); box-shadow: 0 0 10px rgba(0,255,0,0.2); width:100%; padding:10px; margin-bottom:10px;" onclick="useCargoItem('${key}')">
            ACTIVATE / USE ITEM
        </button>`;
    }

    actionsEl.innerHTML = `
        ${useButtonHtml}
        <div style="display:flex; gap:10px; width:100%; margin-bottom:10px;">
            <button class="action-button danger-btn" style="flex:1; padding:10px;" onclick="jettisonItem('${key}', 1)">EJECT 1x</button>
            <button class="action-button danger-btn" style="flex:1; padding:10px; background:rgba(204,0,0,0.1);" onclick="jettisonItem('${key}', 'ALL')">DUMP ALL</button>
        </div>
        <button class="action-button" style="width:100%; padding:10px; border-color:#888; color:#888;" onclick="closeGenericModal()">CLOSE MANIFEST</button>
    `;
}

function useCargoItem(key) {
    const itemDef = COMMODITIES[key];
    if (itemDef && itemDef.onUse) {
        // Execute the item's unique code. If it returns true, it was successfully consumed!
        const consumed = itemDef.onUse();
        
        if (consumed) {
            playerCargo[key]--;
            if (playerCargo[key] <= 0) delete playerCargo[key];
            
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
            if (typeof renderUIStats === 'function') renderUIStats();
            
            // Refresh the UI to reflect the new quantity, or close if we ran out
            if (playerCargo[key]) {
                selectCargoItem(key); 
            } else {
                renderCargoList();
            }
        }
    }
}

function jettisonItem(key, amount) {
    if (!playerCargo[key] || playerCargo[key] <= 0) return;

    // Calculate how much we are dumping
    let amountToDrop = amount === 'ALL' ? playerCargo[key] : 1;
    playerCargo[key] -= amountToDrop;
    
    const itemDef = typeof COMMODITIES !== 'undefined' ? COMMODITIES[key] : null;
    const itemName = itemDef ? itemDef.name : key;

    // Clean up the object if it hits zero
    if (playerCargo[key] <= 0) {
        delete playerCargo[key];
    }

    // Ping the rest of the game to update UI bars
    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof renderUIStats === 'function') renderUIStats();
    
    // Feedback
    logMessage(`<span style="color:var(--danger)">[ CARGO ] Ejected ${amountToDrop}x ${itemName} into the void.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playHullHit(); // We'll use the dull thud sound for the airlock cycling
    
    // --- Refresh the Cargo Modal so the ghost item disappears! ---
    if (document.getElementById('genericModalOverlay').style.display === 'flex') {
        renderCargoList(); 
    }
}
