// --- START OF FILE ui.js ---

// ==========================================
// --- INTERNAL HELPERS & UI EXTENSION API ---
// ==========================================

const _uiRegisteredProfileTabs = [];
let _damageFlashTimer = null;
let _codexSearchQuery = "";

function _uiEscapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function _uiSanitizeName(raw, fallback = "Wayfinder", maxLen = 28) {
    if (typeof raw !== 'string') return fallback;
    const cleaned = raw.replace(/[<>"'`&]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLen);
    return cleaned.length > 0 ? cleaned : fallback;
}

function _uiGetCommanderRank(level) {
    const lvl = Math.max(1, Number(level) || 1);
    const ranks = [
        { min: 25, title: "Grand Wayfinder", code: "CLASS-OMEGA" },
        { min: 18, title: "Deep-Rim Vanguard", code: "CLASS-VI" },
        { min: 13, title: "Star-Captain", code: "CLASS-V" },
        { min: 9,  title: "Sector Commander", code: "CLASS-IV" },
        { min: 6,  title: "Void Pathfinder", code: "CLASS-III" },
        { min: 4,  title: "Frontier Navigator", code: "CLASS-II" },
        { min: 2,  title: "Licensed Freelancer", code: "CLASS-I" },
        { min: 1,  title: "Cadet Wayfinder", code: "PROVISIONAL" }
    ];
    return ranks.find(r => lvl >= r.min) || ranks[ranks.length - 1];
}

function _uiGetCodexMasteryBuff(category) {
    if (category === "Starships") return "+5 Max Hull Integrity";
    if (category === "Phenomena") return "+10 Max Fuel Capacity";
    if (category === "Locations") return "+2% Ship Evasion";
    if (category === "Factions") return "+5 Max Shields";
    return "+2 Cargo Capacity";
}

function _uiGetLoreDiscoveryHint(category) {
    switch (category) {
        case "Starships":
            return "Run Tactical Scans on passing vessels, inspect chassis at Shipyards, or engage hostile patrols.";
        case "Ship Components":
            return "Install upgraded weapons, shields, engines, and sensor suites at Engineering Bays.";
        case "Factions":
            return "Cross territory borders, dock at faction hubs, fence contraband, or hail passing ships.";
        case "Locations":
            return "Dock at major starbases, outposts, and deep-space landmarks across the galaxy.";
        case "Phenomena":
            return "Approach Stars, Asteroids, Nebulae, Wormholes, Black Holes, and Irradiated worlds.";
        case "Xeno-Archaeology":
            return "Investigate Derelicts, Anomalies, Precursor Tomb/Machine Worlds, and the Xerxes Spire.";
        case "Technology & Phenomena":
            return "Acquire exotic alloys, Pioneer Charters, Void Crystals, Cybernetics, or Stargates.";
        case "Commodities":
            return "Inspect or acquire rare Precursor relics, Encrypted Engrams, and restricted goods.";
        case "Mysteries":
            return "Follow Precursor bread-crumbs, assemble Star Map Fragments, and activate a Wayfinder Core.";
        case "Tactics":
            return "Board compromised vessels or fast-talk Concord Customs during contraband scans.";
        default:
            return "Eavesdrop on Cantina rumors, explore uncharted sectors, and decrypt ancient archives.";
    }
}

// Public UI utility & plugin API (100% self-contained)
window.UI = {
    escapeHtml: _uiEscapeHtml,
    sanitizeName: _uiSanitizeName,
    getCommanderRank: _uiGetCommanderRank,
    formatCredits: (val) => `${formatNumber(val)}c`,
    registerProfileTab: (tabConfig) => {
        // tabConfig: { id: 'CUSTOM', name: 'Tab Name', icon: '★', render: () => '<div>...</div>' }
        if (!tabConfig || !tabConfig.id || typeof tabConfig.render !== 'function') return false;
        const existingIdx = _uiRegisteredProfileTabs.findIndex(t => t.id === tabConfig.id);
        if (existingIdx !== -1) _uiRegisteredProfileTabs[existingIdx] = tabConfig;
        else _uiRegisteredProfileTabs.push(tabConfig);
        return true;
    },
    isAnyModalOpen: () => {
        const ids = [
            'genericModalOverlay',
            'stationOverlay',
            'xerxesOverlay',
            'codexOverlay',
            'levelUpOverlay',
            'gameOverOverlay',
            'confirmationOverlay'
        ];
        return ids.some(id => {
            const el = document.getElementById(id);
            return Boolean(el && el.style.display && el.style.display !== 'none');
        });
    }
};

// ==========================================
// --- GENERIC MODAL HANDLER ---
// ==========================================

function openGenericModal(title, bannerSrc = null) {
    const modal = document.getElementById('genericModalOverlay');
    const titleEl = document.getElementById('genericModalTitle');
    const container = document.getElementById('genericModalContent');
    if (!modal || !container) return;

    if (titleEl) titleEl.textContent = title || "";

    // Scrub lingering inline styles left behind by other menus
    container.style.cssText = '';

    // Optional cinematic banner (only renders when caller supplies an existing bannerSrc)
    let headerHtml = '';
    if (bannerSrc) {
        headerHtml = `
            <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 15px; flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
                <img src="${_uiEscapeHtml(bannerSrc)}" onerror="if(this.parentElement) this.parentElement.style.display='none';" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;">
            </div>
        `;
        container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";
    }

    // Self-repairing two-column modal layout
    container.innerHTML = `
        ${headerHtml}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden; width: 100%;">
            <div id="genericModalList" class="trade-list-container" style="flex: 1.2; overflow-y: auto;"></div>
            <div id="genericModalDetails" class="trade-panel-right" style="flex: 1; overflow-y: auto; padding: 20px;">
                <div id="genericDetailContent"><p style="color:#666; padding:10px;">Establishing connection...</p></div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: auto; padding-top: 15px;"></div>
            </div>
        </div>
    `;

    updateModalInfoBar('genericInfoBar');
    modal.style.display = 'flex';
}

function closeGenericModal() {
    // Prevent escaping locked hostile encounters via X / Escape
    if (window.activeHostileEncounter) {
        if (typeof showToast === 'function') showToast("Comm channel locked. You must respond!", "error");
        if (typeof soundManager !== 'undefined') soundManager.playError();
        return;
    }

    const modal = document.getElementById('genericModalOverlay');
    if (modal) modal.style.display = 'none';

    // Clear any running visual intervals
    if (typeof miningInterval !== 'undefined' && miningInterval) {
        clearInterval(miningInterval);
        miningInterval = null;
    }

    // Wipe all modal contexts so keyboard input never gets stuck
    if (typeof anomalyContext !== 'undefined') anomalyContext = null;
    if (typeof boardingContext !== 'undefined') boardingContext = null;
    if (typeof currentTradeContext !== 'undefined') currentTradeContext = null;
    if (typeof currentOutfitContext !== 'undefined') currentOutfitContext = null;
    if (typeof currentMissionContext !== 'undefined') currentMissionContext = null;
    if (typeof currentShipyardContext !== 'undefined') currentShipyardContext = null;
    if (typeof currentEncounterContext !== 'undefined') currentEncounterContext = null;
    window.activeTradeItemId = null;

    updateSideBorderVisibility();
}

// BUG FIX: Alias expected by script.js when closing the cargo manifest via Escape/I/button
function closeCargoModal() {
    closeGenericModal();
}

// ==========================================
// --- MODAL INFO BAR HELPER ---
// ==========================================

function updateModalInfoBar(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const shipObj = typeof playerShip !== 'undefined' && playerShip ? playerShip : { shipClass: "LIGHT_FREIGHTER" };
    const shipClassData = (typeof SHIP_CLASSES !== 'undefined' && SHIP_CLASSES[shipObj.shipClass])
        ? SHIP_CLASSES[shipObj.shipClass]
        : { name: "Unknown Chassis" };

    const safeCmdr = _uiEscapeHtml(typeof playerName !== 'undefined' ? playerName : "Captain");
    const safeShip = _uiEscapeHtml(shipObj.name ? shipObj.name : shipClassData.name);
    const safeRep = _uiEscapeHtml(typeof playerNotorietyTitle !== 'undefined' && playerNotorietyTitle ? playerNotorietyTitle : "Clean Record");
    const safeLvl = typeof playerLevel !== 'undefined' ? playerLevel : 1;
    const curCargo = typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0;
    const maxCargo = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
    const credits = typeof playerCredits !== 'undefined' ? playerCredits : 0;

    const cargoColor = curCargo >= maxCargo ? 'var(--danger)' : (curCargo >= maxCargo * 0.85 ? 'var(--warning)' : 'var(--accent-color)');

    el.innerHTML = `
        <div class="info-bar-item">
            <span class="info-bar-value info-ship">${safeCmdr}</span>
            <span class="info-bar-label">LVL ${safeLvl}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">REP:</span>
            <span class="info-bar-value" style="color:var(--accent-color)">${safeRep}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">SHIP:</span>
            <span class="info-bar-value info-ship">${safeShip}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">CARGO:</span>
            <span class="info-bar-value" style="color:${cargoColor}">${curCargo}/${maxCargo}</span>
        </div>

        <div class="info-bar-item">
            <span class="info-bar-label">CREDITS:</span>
            <span class="info-bar-value info-credits">${formatNumber(credits)}c</span>
        </div>
    `;
}

// ==========================================
// --- TOAST NOTIFICATIONS ---
// ==========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container || !message) return;

    // Drop the oldest toast if there are already 3 on screen
    while (container.children.length >= 3) {
        container.removeChild(container.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    toast.title = "Click to dismiss";
    toast.style.cursor = "pointer";

    let dismissed = false;
    const dismissToast = () => {
        if (dismissed) return;
        dismissed = true;
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    };

    toast.onclick = dismissToast;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(dismissToast, 3000);
}

// ==========================================
// --- MESSAGE LOG & SCROLL PRESERVATION ---
// ==========================================

function logMessage(newMessage, styleOrImportant = false) {
    if (!newMessage || String(newMessage).trim() === "") {
        if (typeof render === 'function') render();
        return;
    }

    let formattedBody = String(newMessage);

    // BUG FIX: Support legacy callers passing a CSS style string (e.g. "color:#FF5555") as 2nd arg
    if (typeof styleOrImportant === 'string' && styleOrImportant.includes(':')) {
        formattedBody = `<span style="${_uiEscapeHtml(styleOrImportant)}">${formattedBody}</span>`;
    }

    let dateStr = "0.00";
    if (typeof currentGameDate !== 'undefined' && currentGameDate !== null && !isNaN(currentGameDate)) {
        dateStr = Number(currentGameDate).toFixed(2);
    }

    const timestamp = `<span class="log-datestamp">[SD ${dateStr}]</span>`;
    if (typeof messageLog !== 'undefined' && Array.isArray(messageLog)) {
        messageLog.unshift(`${timestamp} ${formattedBody}`);
        const maxLogs = typeof MAX_LOG_MESSAGES !== 'undefined' ? MAX_LOG_MESSAGES : 50;
        if (messageLog.length > maxLogs) {
            messageLog.pop();
        }
    }

    // Feed background Flight Recorder telemetry
    console.info(newMessage);

    // Snapshot current log scroll position BEFORE the rAF render writes innerHTML
    const logEl = document.getElementById('messageArea');
    if (logEl && !window._isRenderingLog) {
        window._pendingLogScroll = {
            wasAtTop: logEl.scrollTop <= 20,
            prevScrollTop: logEl.scrollTop,
            prevScrollHeight: logEl.scrollHeight
        };
    }

    // Batch renders and restore scroll position immediately AFTER DOM update in the same frame
    if (!window._isRenderingLog) {
        window._isRenderingLog = true;
        requestAnimationFrame(() => {
            if (typeof render === 'function') render();
            else if (typeof renderUIStats === 'function') renderUIStats();

            const updatedLogEl = document.getElementById('messageArea');
            const snap = window._pendingLogScroll;
            if (updatedLogEl && snap) {
                if (snap.wasAtTop) {
                    updatedLogEl.scrollTop = 0;
                } else {
                    const heightDiff = updatedLogEl.scrollHeight - snap.prevScrollHeight;
                    updatedLogEl.scrollTop = snap.prevScrollTop + Math.max(0, heightDiff);
                }
            }
            window._pendingLogScroll = null;
            window._isRenderingLog = false;
        });
    }
}

function renderContextualActions(actions) {
    const container = document.getElementById('contextual-actions');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(actions) || actions.length === 0) return;

    const fragment = document.createDocumentFragment();
    actions.forEach(action => {
        if (!action) return;
        const button = document.createElement('button');
        const keyTag = action.key ? ` (${String(action.key).toUpperCase()})` : '';
        button.textContent = `${action.label}${keyTag}`;
        button.className = 'control-button';
        button.onclick = action.onclick;
        fragment.appendChild(button);
    });
    container.appendChild(fragment);
}

// ==========================================
// --- VISIBILITY, FORMATTING & FEEDBACK ---
// ==========================================

function updateSideBorderVisibility() {
    const leftBorder = document.querySelector('.side-border.left');
    const rightBorder = document.querySelector('.side-border.right');
    if (!leftBorder && !rightBorder) return;

    const onMap = (typeof currentGameState !== 'undefined' && typeof GAME_STATES !== 'undefined')
        ? (currentGameState === GAME_STATES.GALACTIC_MAP)
        : true;
    const displayValue = onMap ? 'block' : 'none';

    if (leftBorder) leftBorder.style.display = displayValue;
    if (rightBorder) rightBorder.style.display = displayValue;
}

function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    // BUG FIX: Math.trunc prevents negative decimals like -10.2 from rounding down to -11
    const safeNum = Math.trunc(Number(num));
    return safeNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function triggerHaptic(pattern) {
    try {
        if (navigator && typeof navigator.vibrate === 'function') {
            navigator.vibrate(pattern);
        }
    } catch (e) {}
}

function triggerDamageEffect() {
    const app = document.getElementById('app-container');
    if (app) {
        app.classList.remove('shake-effect');
        void app.offsetWidth; // Force reflow to restart CSS keyframe cleanly
        app.classList.add('shake-effect');
    }

    const flash = document.getElementById('damageFlash');
    if (flash) {
        flash.style.opacity = '1';
        if (_damageFlashTimer) clearTimeout(_damageFlashTimer);
        _damageFlashTimer = setTimeout(() => {
            flash.style.opacity = '0';
            _damageFlashTimer = null;
        }, 120);
    }
}

// ==========================================
// --- GALACTIC CODEX (LORE VIEWER V3) ---
// ==========================================

function _getUniqueCodexEntries() {
    if (typeof LORE_DATABASE === 'undefined') return [];
    const seenObjects = new Set();
    const entries = [];

    for (const key in LORE_DATABASE) {
        if (key.startsWith('SPIRE')) continue;
        const entry = LORE_DATABASE[key];
        if (!entry || seenObjects.has(entry)) continue;
        seenObjects.add(entry);

        const isUnlocked = Boolean(
            entry.unlocked ||
            (typeof discoveredLoreEntries !== 'undefined' && discoveredLoreEntries.has && discoveredLoreEntries.has(key))
        );
        entries.push({ id: key, unlocked: isUnlocked, ...entry });
    }
    return entries;
}

function toggleCodex(show) {
    const overlay = document.getElementById('codexOverlay');
    if (!overlay) return;

    if (show) {
        _codexSearchQuery = "";
        overlay.style.display = 'flex';
        if (typeof updateModalInfoBar === 'function') updateModalInfoBar('codexInfoBar');
        if (typeof soundManager !== 'undefined') soundManager.playUIHover();
        renderCodexCategories();
    } else {
        overlay.style.display = 'none';
        if (typeof updateSideBorderVisibility === 'function') updateSideBorderVisibility();
    }
}

function filterCodexBySearch(query) {
    _codexSearchQuery = String(query || "").trim().toLowerCase();
    const allEntries = _getUniqueCodexEntries();
    const entriesList = document.getElementById('codexEntries');
    if (!entriesList) return;

    if (!_codexSearchQuery) {
        entriesList.innerHTML = `
            <div style="padding: 15px; color: var(--item-desc-color); font-size: 12px; font-style: italic;">
                Select a category on the left or type a keyword to search decrypted archives.
            </div>
        `;
        return;
    }

    const matches = allEntries.filter(e =>
        e.unlocked && (
            (e.title && e.title.toLowerCase().includes(_codexSearchQuery)) ||
            (e.category && e.category.toLowerCase().includes(_codexSearchQuery)) ||
            (e.text && e.text.toLowerCase().includes(_codexSearchQuery))
        )
    );
    renderCodexEntries(matches, `SEARCH RESULTS (${matches.length})`);
}

function renderCodexCategories() {
    const catList = document.getElementById('codexCategories');
    const entriesList = document.getElementById('codexEntries');
    const textContent = document.getElementById('codexEntryText');
    if (!catList || !entriesList || !textContent) return;

    const allEntries = _getUniqueCodexEntries();
    const categories = {};
    let totalUnlocked = 0;

    allEntries.forEach(entry => {
        const cat = entry.category || "Miscellaneous";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(entry);
        if (entry.unlocked) totalUnlocked++;
    });

    const totalAvailable = Math.max(1, allEntries.length);
    window.cachedTotalLore = totalAvailable;
    const pct = Math.min(100, Math.floor((totalUnlocked / totalAvailable) * 100));

    catList.innerHTML = '';
    entriesList.innerHTML = '';

    // Build Mastery Overview for the landing reading pane
    const masteryCardsHtml = Object.keys(categories).sort().map(cat => {
        const list = categories[cat];
        const unlockedCount = list.filter(e => e.unlocked).length;
        const isMastered = unlockedCount === list.length && list.length > 0;
        const barPct = list.length > 0 ? Math.floor((unlockedCount / list.length) * 100) : 0;
        return `
            <div style="background:rgba(0,0,0,0.3); border:1px solid ${isMastered ? 'var(--gold-text)' : 'var(--border-color)'}; padding:10px 12px; border-radius:4px; text-align:left;">
                <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:bold; color:${isMastered ? 'var(--gold-text)' : 'var(--item-name-color)'};">
                    <span>${isMastered ? '★ ' : ''}${_uiEscapeHtml(cat)}</span>
                    <span>${unlockedCount} / ${list.length}</span>
                </div>
                <div style="height:4px; background:#222; margin:6px 0; border-radius:2px; overflow:hidden;">
                    <div style="height:100%; width:${barPct}%; background:${isMastered ? 'var(--gold-text)' : 'var(--accent-color)'};"></div>
                </div>
                <div style="font-size:10px; color:${isMastered ? 'var(--success)' : 'var(--item-desc-color)'};">
                    Mastery Buff: ${_uiGetCodexMasteryBuff(cat)} ${isMastered ? '(ACTIVE)' : ''}
                </div>
            </div>
        `;
    }).join('');

    textContent.innerHTML = `
        <div class="codex-reading-pane">
            <div class="codex-classification">CONCORD CENTRAL ARCHIVE // <span>MASTERY TELEMETRY</span></div>
            <h1 class="codex-title" style="font-size:24px;">ARCHIVE RECOVERY: ${pct}%</h1>
            <p style="font-size:13px; color:var(--item-desc-color); line-height:1.6; margin-bottom:20px;">
                Completing all archive entries within a category permanently optimizes your vessel's subsystems. Select any category on the left to inspect decrypted files or trace redacted leads.
            </p>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                ${masteryCardsHtml}
            </div>
        </div>
    `;

    // Top Archive Progress + Search Bar
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = "padding: 16px 12px; border-bottom: 1px solid var(--border-color); text-align:center; background: rgba(0,0,0,0.3);";
    headerDiv.innerHTML = `
        <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px; margin-bottom:6px;">ARCHIVE RECOVERY</div>
        <div style="font-size:24px; font-weight:bold; color:var(--text-color); font-family: var(--title-font);">${pct}%</div>
        <div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">${totalUnlocked} of ${totalAvailable} Decrypted</div>
        <input type="text" id="codexSearchInput" value="${_uiEscapeHtml(_codexSearchQuery)}" placeholder="Search archives..." aria-label="Search Galactic Archives"
            oninput="filterCodexBySearch(this.value)"
            style="width:100%; margin-top:10px; padding:6px 8px; background:#000; color:var(--accent-color); border:1px solid var(--border-color); font-size:11px; border-radius:3px;">
    `;
    catList.appendChild(headerDiv);

    const fragment = document.createDocumentFragment();
    Object.keys(categories).sort().forEach(cat => {
        const list = categories[cat];
        const unlockedCount = list.filter(e => e.unlocked).length;
        const isMastered = unlockedCount === list.length && list.length > 0;

        const btn = document.createElement('div');
        btn.className = 'generic-list-item codex-cat-btn';
        btn.innerHTML = `
            <div style="font-weight:bold; color:${isMastered ? 'var(--gold-text)' : 'var(--text-color)'}; font-size: 13px;">
                ${isMastered ? '★ ' : ''}${_uiEscapeHtml(cat)}
            </div>
            <div style="font-size:10px; color:var(--item-desc-color); margin-top: 4px; display:flex; justify-content:space-between;">
                <span>${unlockedCount} / ${list.length} Decrypted</span>
                ${isMastered ? '<span style="color:var(--success); font-weight:bold;">100%</span>' : ''}
            </div>
        `;

        btn.onclick = () => {
            catList.querySelectorAll('.codex-cat-btn').forEach(c => c.classList.remove('active-cat'));
            btn.classList.add('active-cat');
            if (typeof soundManager !== 'undefined') soundManager.playUIClick();
            renderCodexEntries(list, cat.toUpperCase());
        };
        fragment.appendChild(btn);
    });
    catList.appendChild(fragment);
}

function renderCodexEntries(entries, headerLabel = "DECRYPTED FILES") {
    const entriesList = document.getElementById('codexEntries');
    if (!entriesList) return;

    entriesList.innerHTML = `
        <div style="padding: 15px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
            <div style="font-size:10px; color:var(--accent-color); letter-spacing:2px;">${_uiEscapeHtml(headerLabel)}</div>
        </div>
    `;

    if (!Array.isArray(entries) || entries.length === 0) {
        entriesList.innerHTML += `<div style="padding:15px; color:var(--item-desc-color); font-size:12px; font-style:italic;">No matching archive files found.</div>`;
        return;
    }

    // Sort unlocked entries first (alphabetically), then redacted locked teasers
    const sorted = entries.slice().sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return String(a.title || "").localeCompare(String(b.title || ""));
    });

    const fragment = document.createDocumentFragment();
    sorted.forEach(entry => {
        const btn = document.createElement('div');
        btn.className = 'generic-list-item codex-entry-btn';

        if (entry.unlocked) {
            btn.innerHTML = `<div style="font-weight:bold; color:var(--item-name-color); font-size: 13px;">${_uiEscapeHtml(entry.title)}</div>`;
        } else {
            btn.style.opacity = '0.45';
            btn.innerHTML = `<div style="font-weight:bold; color:var(--item-desc-color); font-size: 12px;">🔒 [ENCRYPTED FILE]</div>`;
        }

        btn.onclick = () => {
            entriesList.querySelectorAll('.codex-entry-btn').forEach(c => c.classList.remove('active-entry'));
            btn.classList.add('active-entry');
            if (typeof soundManager !== 'undefined') soundManager.playUIClick();
            renderCodexText(entry);
        };
        fragment.appendChild(btn);
    });
    entriesList.appendChild(fragment);
}

function renderCodexText(entry) {
    const textContent = document.getElementById('codexEntryText');
    if (!textContent || !entry) return;

    textContent.style.animation = 'none';
    void textContent.offsetHeight;
    textContent.style.animation = 'fadeIn 0.3s ease-out';

    if (!entry.unlocked) {
        const hint = _uiGetLoreDiscoveryHint(entry.category);
        textContent.innerHTML = `
            <div class="codex-reading-pane">
                <div class="codex-classification">
                    ARCHIVE ENTRY // CLASS: <span>${_uiEscapeHtml(entry.category || "CLASSIFIED")}</span>
                </div>
                <h1 class="codex-title" style="color:var(--danger);">
                    🔒 ENCRYPTED TRANSMISSION
                </h1>
                <div class="codex-body-text" style="color:var(--item-desc-color);">
                    This data packet remains sealed under Concord encryption protocols. Field telemetry is required to reconstruct the missing cipher blocks.
                    <div style="margin-top:20px; padding:15px; background:rgba(0,224,224,0.06); border-left:3px solid var(--accent-color); color:var(--text-color); font-size:13px;">
                        <strong style="color:var(--accent-color); letter-spacing:1px;">RECOVERY LEAD:</strong><br>
                        ${hint}
                    </div>
                </div>
                <div class="codex-footer">
                    ACCESS RESTRICTED // CONCORD DATA SYSTEMS
                </div>
            </div>
        `;
        return;
    }

    textContent.innerHTML = `
        <div class="codex-reading-pane">
            <div class="codex-classification">
                ARCHIVE ENTRY // CLASS: <span>${_uiEscapeHtml(entry.category || "ARCHIVE")}</span>
            </div>

            <h1 class="codex-title">
                ${_uiEscapeHtml(String(entry.title || "").toUpperCase())}
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
    if (typeof playerShip === 'undefined' || !playerShip) return;

    const shipClassData = (typeof SHIP_CLASSES !== 'undefined' && SHIP_CLASSES[playerShip.shipClass])
        ? SHIP_CLASSES[playerShip.shipClass]
        : { name: "Unknown Ship" };
    const currentName = playerShip.name || shipClassData.name;
    const rawName = prompt("Enter new vessel registry name (max 28 chars):", currentName);

    if (rawName !== null && rawName.trim() !== "") {
        const cleanName = _uiSanitizeName(rawName, shipClassData.name, 28);
        playerShip.name = cleanName;

        logMessage(`<span style="color:var(--success)">[ NAV-COM ] Vessel registry updated to: <b>${_uiEscapeHtml(cleanName)}</b></span>`);
        if (typeof showToast === 'function') showToast("REGISTRY UPDATED", "success");
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();

        // BUG FIX: Only refresh Commander Datapad if it is currently the active modal (avoids hijacking Shipyard)
        const titleEl = document.getElementById('genericModalTitle');
        if (titleEl && titleEl.textContent === "COMMANDER DATAPAD" && typeof displayCommanderProfile === 'function') {
            displayCommanderProfile('SHIP');
        }
        updateModalInfoBar('genericInfoBar');
        if (typeof autoSaveGame === 'function') autoSaveGame();
    }
}

// ==========================================
// --- COMMANDER PROFILE UI (DATAPAD V2) ---
// ==========================================

function displayCommanderProfile(tab = 'OVERVIEW') {
    const sysMenu = document.getElementById('systemMenu');
    if (sysMenu) sysMenu.classList.add('hidden');

    openGenericModal("COMMANDER DATAPAD");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!listEl || !detailEl || !actionsEl) return;

    // 1. Build Left-Side Navigation Tabs (includes any tabs registered via UI.registerProfileTab)
    listEl.innerHTML = '';
    const tabs = [
        { id: 'OVERVIEW', name: 'Personal Log', icon: '👤' },
        { id: 'SHIP', name: 'Vessel Manifest', icon: '🚀' },
        { id: 'LOADOUT', name: 'Equipped Gear', icon: '⚙️' },
        { id: 'HOLDINGS', name: 'Frontier Holdings', icon: '🏛️' },
        { id: 'FACTIONS', name: 'Reputation', icon: '📜' },
        { id: 'LOG', name: "Recent Comms", icon: '💬' },
        { id: 'MILESTONES', name: "Service Record", icon: '🏆' },
        ..._uiRegisteredProfileTabs
    ];

    const tabFrag = document.createDocumentFragment();
    tabs.forEach(t => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cursor = 'pointer';
        if (tab === t.id) {
            row.style.background = 'rgba(0, 224, 224, 0.12)';
            row.style.borderLeft = '3px solid var(--accent-color)';
        }
        row.innerHTML = `<span style="color:var(--text-color); font-weight:bold;">${t.icon || '•'} ${_uiEscapeHtml(t.name)}</span>`;
        row.onclick = () => window.displayCommanderProfile(t.id);
        tabFrag.appendChild(row);
    });
    listEl.appendChild(tabFrag);

    // 2. Build Right-Side Content
    let html = `<div style="padding: 12px 15px;">`;

    if (tab === 'OVERVIEW') {
        const safeNotoriety = typeof playerNotoriety !== 'undefined' ? playerNotoriety : 0;
        let notTitle = "Clean Record";
        if (typeof NOTORIETY_TITLES !== 'undefined') {
            for (let i = NOTORIETY_TITLES.length - 1; i >= 0; i--) {
                if (safeNotoriety >= NOTORIETY_TITLES[i].score) {
                    notTitle = NOTORIETY_TITLES[i].title;
                    break;
                }
            }
        }
        const safeLvl = typeof playerLevel !== 'undefined' ? playerLevel : 1;
        const safeXP = typeof playerXP !== 'undefined' ? Math.floor(playerXP) : 0;
        const xpReq = typeof xpToNextLevel !== 'undefined' && xpToNextLevel
            ? xpToNextLevel
            : Math.floor((typeof BASE_XP_TO_LEVEL !== 'undefined' ? BASE_XP_TO_LEVEL : 75) * Math.pow(safeLvl, typeof XP_LEVEL_EXPONENT !== 'undefined' ? XP_LEVEL_EXPONENT : 1.6));
        const rank = _uiGetCommanderRank(safeLvl);

        const sectorsVisited = (typeof visitedSectors !== 'undefined' && visitedSectors.size) ? visitedSectors.size : 0;
        const locsDiscovered = (typeof discoveredLocations !== 'undefined' && discoveredLocations.size) ? discoveredLocations.size : 0;
        const missionsDone = (typeof playerCompletedMissions !== 'undefined' && playerCompletedMissions.size) ? playerCompletedMissions.size : 0;
        const stardateStr = (typeof currentGameDate !== 'undefined' && !isNaN(currentGameDate)) ? Number(currentGameDate).toFixed(2) : "2458.00";

        let dossierNote = "Concord Flight Registry marks this vessel as an independent frontier operator.";
        if (safeNotoriety >= 30) dossierNote = "SEC-COM Priority Watch: Captain is flagged for repeated violations of Concord maritime law.";
        else if (typeof playerFactionStanding !== 'undefined' && (playerFactionStanding.CONCORD || 0) >= 30) dossierNote = "Decorated Concord auxiliary captain with elevated Aegis clearance.";
        else if (typeof playerFactionStanding !== 'undefined' && (playerFactionStanding.ECLIPSE || 0) >= 30) dossierNote = "Whispered about in Shadow Network channels as a trusted Cartel runner.";
        else if (typeof playerFactionStanding !== 'undefined' && (playerFactionStanding.KTHARR || 0) >= 20) dossierNote = "Recognized by K'tharr border warlords as an outlander of proven iron.";

        html += `
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 18px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
                <img src="${typeof playerPfp !== 'undefined' ? _uiEscapeHtml(playerPfp) : 'assets/pfp_01.png'}" alt="Commander Profile" style="width: 78px; height: 78px; border-radius: 4px; border: 2px solid var(--accent-color); object-fit: cover; box-shadow: 0 0 15px rgba(0, 224, 224, 0.2);">
                <div>
                    <h3 style="color:var(--accent-color); margin: 0 0 4px 0; font-size: 18px; letter-spacing: 2px;">${_uiEscapeHtml(String(playerName || "CAPTAIN").toUpperCase())}</h3>
                    <div style="color:var(--gold-text); font-size: 11px; font-weight:bold; letter-spacing: 1px;">${rank.title.toUpperCase()} // ${rank.code}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; letter-spacing: 1px; margin-top:3px;">STARDATE ${stardateStr}</div>
                </div>
            </div>

            <p style="font-size:12px; color:var(--item-desc-color); font-style:italic; background:rgba(0,0,0,0.3); padding:10px; border-left:2px solid var(--accent-color); margin:0 0 16px 0; line-height:1.5;">
                "${dossierNote}"
            </p>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:13px; line-height:1.5;">
                <div style="color:#888;">Clearance Level:</div> <div style="color:var(--text-color); text-align:right; font-weight:bold;">${safeLvl}</div>
                <div style="color:#888;">Experience:</div> <div style="color:var(--text-color); text-align:right;">${formatNumber(safeXP)} / ${formatNumber(xpReq)}</div>
                <div style="color:#888;">Credits:</div> <div style="color:var(--gold-text); text-align:right; font-weight:bold;">${formatNumber(playerCredits)}c</div>
                <div style="color:#888;">Notoriety:</div> <div style="color:${safeNotoriety > 0 ? 'var(--warning)' : 'var(--success)'}; text-align:right;">${_uiEscapeHtml(notTitle)} (${safeNotoriety})</div>
                <div style="color:#888;">Active Contract:</div> <div style="color:var(--text-color); text-align:right;">${(typeof playerActiveMission !== 'undefined' && playerActiveMission) ? _uiEscapeHtml(playerActiveMission.title) : 'None'}</div>
                <div style="color:#888;">Crew Roster:</div> <div style="color:var(--text-color); text-align:right;">${typeof playerCrew !== 'undefined' ? playerCrew.length : 0} / ${typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3}</div>
                <div style="color:#888;">Sectors / Landmarks:</div> <div style="color:var(--accent-color); text-align:right;">${sectorsVisited} / ${locsDiscovered}</div>
                <div style="color:#888;">Contracts Completed:</div> <div style="color:var(--success); text-align:right;">${missionsDone}</div>
            </div>
        `;
    }
    else if (tab === 'SHIP') {
        const ship = (typeof SHIP_CLASSES !== 'undefined' && SHIP_CLASSES[playerShip.shipClass])
            ? SHIP_CLASSES[playerShip.shipClass]
            : { name: "Unknown Ship", image: "", ability: { name: "None", desc: "" } };
        const customName = playerShip.name || ship.name;
        const hitPct = typeof PLAYER_HIT_CHANCE !== 'undefined' ? Math.round(PLAYER_HIT_CHANCE * 100) : 70;
        const evaPct = typeof PLAYER_EVASION !== 'undefined' ? Math.round(PLAYER_EVASION * 100) : 0;
        const sigPct = typeof window.PLAYER_SIGNATURE !== 'undefined' ? Math.round(window.PLAYER_SIGNATURE * 100) : 100;
        const fuelEff = typeof window.PLAYER_FUEL_EFFICIENCY !== 'undefined' ? Math.round(window.PLAYER_FUEL_EFFICIENCY * 100) : 100;

        html += `
            <div style="text-align:center;">
                ${ship.image ? `<img src="${_uiEscapeHtml(ship.image)}" onerror="this.style.display='none'" style="width:100%; max-width:170px; margin-bottom:12px; filter: drop-shadow(0 0 10px rgba(0,224,224,0.2));">` : '<div style="font-size:50px; opacity:0.5; margin-bottom:12px;">🚀</div>'}
            </div>

            <h3 style="color:var(--accent-color); margin-top:0; text-align:center; cursor:pointer;" onclick="renameShip()" title="Click to christen your vessel">
                ${_uiEscapeHtml(customName.toUpperCase())} <span style="font-size:14px; opacity:0.7;">✏️</span>
            </h3>
            <div style="text-align:center; font-size:10px; color:#888; margin-top:-8px; margin-bottom:14px; border-bottom:1px solid #333; padding-bottom:10px; letter-spacing:1px;">
                REGISTERED CHASSIS: ${_uiEscapeHtml(ship.name.toUpperCase())}
            </div>

            ${(typeof activeSynergy !== 'undefined' && activeSynergy) ? `<div style="text-align:center; color:var(--gold-text); font-size:12px; margin-bottom:14px; padding:6px; background:rgba(255,215,0,0.1); border:1px solid #886600; border-radius:4px; font-weight:bold; letter-spacing:1px;">★ SET BONUS: ${_uiEscapeHtml(activeSynergy.name.toUpperCase())} ★<br><span style="color:#CCC; font-size:10px; font-weight:normal;">${_uiEscapeHtml(activeSynergy.desc)}</span></div>` : ''}

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:12px;">
                <div style="color:#888;">Hull Integrity:</div> <div style="color:var(--success); text-align:right; font-weight:bold;">${Math.floor(playerHull)} / ${MAX_PLAYER_HULL}</div>
                <div style="color:#888;">Deflector Shields:</div> <div style="color:#00E0E0; text-align:right; font-weight:bold;">${Math.floor(playerShields)} / ${MAX_SHIELDS}</div>
                <div style="color:#888;">Fuel Reserves:</div> <div style="color:var(--warning); text-align:right; font-weight:bold;">${Math.floor(playerFuel)} / ${MAX_FUEL}</div>
                <div style="color:#888;">Cargo Space:</div> <div style="color:var(--text-color); text-align:right; font-weight:bold;">${currentCargoLoad} / ${PLAYER_CARGO_CAPACITY}</div>
                <div style="color:#888;">Weapon Output:</div> <div style="color:var(--danger); text-align:right; font-weight:bold;">${typeof PLAYER_ATTACK_DAMAGE !== 'undefined' ? PLAYER_ATTACK_DAMAGE : 8} DMG (${hitPct}% Hit)</div>
                <div style="color:#888;">Evasion / Signature:</div> <div style="color:#DDA0DD; text-align:right; font-weight:bold;">${evaPct}% Eva | ${sigPct}% Sig</div>
                <div style="color:#888;">Fuel Burn Rate:</div> <div style="color:var(--accent-color); text-align:right; font-weight:bold;">${fuelEff}% Baseline</div>
                <div style="color:#888; grid-column: span 2; margin-top: 4px; border-top: 1px dashed #333; padding-top: 8px;">
                    Combat Protocol: <span style="color:var(--danger); float:right; font-weight:bold;">${_uiEscapeHtml(ship.ability ? ship.ability.name : "None")}</span>
                    ${ship.ability && ship.ability.desc ? `<div style="font-size:11px; color:var(--item-desc-color); margin-top:4px;">${_uiEscapeHtml(ship.ability.desc)}</div>` : ''}
                </div>
            </div>
        `;
    }
    else if (tab === 'LOADOUT') {
        html += `<h3 style="color:var(--accent-color); border-bottom:1px solid #333; padding-bottom:10px; margin-top:0;">SYSTEM DIAGNOSTICS</h3>`;
        const slots = ['weapon', 'shield', 'engine', 'scanner', 'utility'];

        slots.forEach(slot => {
            const compId = playerShip && playerShip.components ? playerShip.components[slot] : null;
            const comp = (typeof COMPONENTS_DATABASE !== 'undefined' && compId) ? COMPONENTS_DATABASE[compId] : null;
            const mfgBadge = (comp && comp.manufacturer)
                ? `<span style="background:rgba(255,255,255,0.1); color:#CCC; padding:2px 4px; border-radius:2px; font-size:9px; margin-left:6px; vertical-align:middle;">${_uiEscapeHtml(comp.manufacturer)}</span>`
                : '';

            let ammoNote = '';
            if (slot === 'weapon' && comp && comp.stats && comp.stats.maxAmmo) {
                const curAmmo = (playerShip.ammo && playerShip.ammo[compId] !== undefined) ? playerShip.ammo[compId] : comp.stats.maxAmmo;
                ammoNote = `<div style="font-size:10px; color:var(--warning); margin-top:3px;">Ordnance Magazine: ${curAmmo} / ${comp.stats.maxAmmo}</div>`;
            }

            html += `
                <div style="margin-bottom:10px; background:rgba(0,0,0,0.25); padding:10px; border-left:3px solid var(--accent-color); border-radius: 0 4px 4px 0;">
                    <div style="font-size:10px; color:#888; text-transform:uppercase; letter-spacing:1px;">${slot}</div>
                    <div style="color:var(--item-name-color); font-weight:bold; margin-top:3px;">${comp ? _uiEscapeHtml(comp.name) : 'Empty'} ${mfgBadge}</div>
                    ${comp && comp.description ? `<div style="font-size:11px; color:var(--item-desc-color); margin-top:3px;">${_uiEscapeHtml(comp.description)}</div>` : ''}
                    ${ammoNote}
                </div>
            `;
        });
    }
    else if (tab === 'HOLDINGS') {
        const forces = (playerShip && playerShip.forces) ? playerShip.forces : { marines: 0, heavyMechs: 0, maxTroops: 20 };
        const colonies = (typeof playerColonies !== 'undefined' && playerColonies)
            ? Object.values(playerColonies).filter(c => c && c.established)
            : [];

        // Gather player-owned waystations from worldStateDeltas
        const outposts = [];
        if (typeof worldStateDeltas !== 'undefined') {
            for (const key in worldStateDeltas) {
                const d = worldStateDeltas[key];
                if (d && d.isPlayerOwned && d.isTinyOutpost) {
                    const coords = key.split('_')[0].split(',').map(Number);
                    outposts.push({
                        name: d.name || "Waystation",
                        tier: d.outpostTier || 1,
                        treasury: d.treasury || 0,
                        x: !isNaN(coords[0]) ? coords[0] : (d.x || 0),
                        y: !isNaN(coords[1]) ? coords[1] : (d.y || 0)
                    });
                }
            }
        }

        const probes = (typeof window.activeProbes !== 'undefined' && Array.isArray(window.activeProbes)) ? window.activeProbes : [];
        const escortJumps = window.concordEscortJumps || 0;

        // Estimate cargo + liquid net worth
        let cargoValue = 0;
        if (typeof playerCargo !== 'undefined' && typeof COMMODITIES !== 'undefined') {
            for (const id in playerCargo) {
                if (playerCargo[id] > 0 && COMMODITIES[id]) {
                    cargoValue += (COMMODITIES[id].basePrice || 0) * playerCargo[id];
                }
            }
        }
        const totalVaults = colonies.reduce((s, c) => s + Math.max(0, c.treasury || 0), 0) +
                            outposts.reduce((s, o) => s + Math.max(0, o.treasury || 0), 0);

        html += `
            <h3 style="color:var(--gold-text); border-bottom:1px solid #333; padding-bottom:8px; margin-top:0;">FRONTIER HOLDINGS &amp; ASSETS</h3>

            <div class="trade-math-area" style="margin-bottom:14px;">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:6px; border-bottom:1px solid #333; padding-bottom:4px;">ESTIMATED VALUATION &amp; FORCES</div>
                <div class="trade-stat-row"><span>Liquid Credits + Vaults:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber((playerCredits || 0) + totalVaults)}c</span></div>
                <div class="trade-stat-row"><span>Cargo Hold Valuation:</span> <span style="color:var(--success); font-weight:bold;">~${formatNumber(cargoValue)}c</span></div>
                <div class="trade-stat-row"><span>Marine Garrison / Mechs:</span> <span style="color:var(--text-color); font-weight:bold;">${forces.marines || 0}/${forces.maxTroops || 20} Marines | ${forces.heavyMechs || 0} Mechs</span></div>
                <div class="trade-stat-row"><span>Aegis Escort Contract:</span> <span style="color:${escortJumps > 0 ? 'var(--accent-color)' : '#666'}; font-weight:bold;">${escortJumps > 0 ? `${escortJumps} Jumps Remaining` : 'Inactive'}</span></div>
            </div>

            <div style="font-size:10px; color:var(--success); letter-spacing:1px; margin-bottom:6px; font-weight:bold;">COLONIAL SETTLEMENTS (${colonies.length})</div>
            ${colonies.length > 0 ? colonies.map(c => `
                <div style="background:rgba(0,0,0,0.3); border-left:3px solid var(--success); padding:8px 10px; margin-bottom:8px; border-radius:0 4px 4px 0; font-size:12px;">
                    <div style="display:flex; justify-content:space-between; font-weight:bold; color:var(--item-name-color);">
                        <span>${_uiEscapeHtml(c.name)} (${_uiEscapeHtml(c.phase || 'OUTPOST')})</span>
                        <span style="color:var(--accent-color);">[${c.x}, ${-c.y}]</span>
                    </div>
                    <div style="color:var(--item-desc-color); font-size:11px; margin-top:4px;">
                        Pop: ${formatNumber(c.population || 0)} | Morale: ${c.morale || 0}% | Vault: <span style="color:var(--gold-text);">${formatNumber(c.treasury || 0)}c</span>
                    </div>
                </div>
            `).join('') : `<div style="font-size:11px; color:#666; font-style:italic; margin-bottom:12px;">No colonies established. Acquire a Settlement Charter at Starbase Alpha.</div>`}

            <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin:10px 0 6px; font-weight:bold;">PLAYER WAYSTATIONS (${outposts.length}) &amp; PROBES (${probes.length})</div>
            ${outposts.map(o => `
                <div style="background:rgba(0,0,0,0.3); border-left:3px solid var(--accent-color); padding:7px 10px; margin-bottom:6px; font-size:12px; display:flex; justify-content:space-between;">
                    <span>🛰️ ${_uiEscapeHtml(o.name)} (Tier ${o.tier}) [${o.x}, ${-o.y}]</span>
                    <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(o.treasury)}c</span>
                </div>
            `).join('')}
            ${probes.map(p => {
                const drives = (typeof currentGameDate !== 'undefined' && p.deployedAt !== undefined)
                    ? Math.max(0, Math.floor((currentGameDate - p.deployedAt) / 10))
                    : 0;
                return `
                    <div style="background:rgba(0,0,0,0.3); border-left:3px solid #00FF88; padding:7px 10px; margin-bottom:6px; font-size:12px; display:flex; justify-content:space-between;">
                        <span>📡 Telemetry Probe [${p.x}, ${-p.y}]</span>
                        <span style="color:var(--success); font-weight:bold;">${drives} Data Drive(s)</span>
                    </div>
                `;
            }).join('')}
            ${(outposts.length === 0 && probes.length === 0) ? `<div style="font-size:11px; color:#666; font-style:italic;">No waystations or active probes deployed.</div>` : ''}
        `;
    }
    else if (tab === 'FACTIONS') {
        const perksByFaction = {
            CONCORD: "20+: Aegis Armory | 30+: Aegis Gunship | 50+: Dreadnought & 15% Discount",
            ECLIPSE: "15+: Corsair | 30+: Night-Runner | 50+: Pirate Truce & 15% Discount",
            KTHARR: "15+: Disruptors | 30+: Blood-Barge | 50+: Living Hull Biotech",
            FUEL_RATS: "5+: Free VIP Hull Repair on Rescue | 10+: Fuel Rats Salvage Tug"
        };

        html += `<h3 style="color:var(--accent-color); border-bottom:1px solid #333; padding-bottom:10px; margin-top:0;">DIPLOMATIC STANDINGS</h3>`;
        html += `<div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">`;

        if (typeof FACTIONS !== 'undefined') {
            for (const [facKey, facData] of Object.entries(FACTIONS)) {
                if (facKey === 'INDEPENDENT') continue;

                const rep = (typeof playerFactionStanding !== 'undefined' && playerFactionStanding[facKey] !== undefined)
                    ? playerFactionStanding[facKey]
                    : 0;
                const repColor = rep > 20 ? 'var(--success)' : rep < -20 ? 'var(--danger)' : 'var(--text-color)';
                const repTitle = rep >= 50 ? 'Allied' : rep > 20 ? 'Friendly' : rep <= -50 ? 'Hostile' : rep < -20 ? 'Unfriendly' : 'Neutral';
                const meterPct = Math.max(0, Math.min(100, Math.round(((rep + 100) / 200) * 100)));

                html += `
                    <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:4px; border-left:4px solid ${facData.color};">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="color:${facData.color}; font-weight:bold; font-size:13px; letter-spacing: 1px;">${_uiEscapeHtml(facData.name.toUpperCase())}</span>
                            <span style="color:${repColor}; font-weight:bold; font-size:12px;">${repTitle} (${rep})</span>
                        </div>
                        <div style="height:5px; background:#222; border-radius:3px; overflow:hidden; margin-bottom:6px;">
                            <div style="height:100%; width:${meterPct}%; background:${facData.color};"></div>
                        </div>
                        <div style="font-size:10px; color:var(--item-desc-color); line-height:1.4;">
                            ${perksByFaction[facKey] || _uiEscapeHtml(facData.description || "")}
                        </div>
                    </div>
                `;
            }
        }
        html += `</div>`;
    }
    else if (tab === 'MILESTONES') {
        const milestones = (typeof GameState !== 'undefined' && GameState.player && Array.isArray(GameState.player.milestones))
            ? GameState.player.milestones
            : [];

        html += `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; margin-top:0;">
                <h3 style="color:var(--gold-text); margin:0;">SERVICE RECORD</h3>
                <span style="font-size:10px; color:var(--item-desc-color); letter-spacing:1px;">${milestones.length} MILESTONES</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height: 360px; overflow-y: auto; padding-right: 5px;">
        `;

        if (milestones.length > 0) {
            milestones.forEach(msg => {
                html += `
                    <div style="background:rgba(255,215,0,0.05); border-left:2px solid var(--gold-text); padding:10px; border-radius:0 4px 4px 0; font-size:12px; line-height:1.5;">
                        ${msg}
                    </div>
                `;
            });
        } else {
            html += `<div style="text-align:center; padding: 30px; color:#666; font-style:italic;">No major milestones recorded yet. Complete contracts, commission new ships, or hunt bounties to build your legacy.</div>`;
        }

        html += `</div>`;
    }
    else if (tab === 'LOG') {
        html += `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px; margin-top:0;">
                <h3 style="color:var(--accent-color); margin:0;">CAPTAIN'S LOG</h3>
                <span style="font-size:10px; color:var(--item-desc-color); letter-spacing:1px;">LAST ${typeof MAX_LOG_MESSAGES !== 'undefined' ? MAX_LOG_MESSAGES : 50} ENTRIES</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px; max-height: 360px; overflow-y: auto; padding-right: 5px;">
        `;

        if (typeof messageLog !== 'undefined' && messageLog.length > 0) {
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
    else {
        const customTab = _uiRegisteredProfileTabs.find(t => t.id === tab);
        if (customTab) {
            html += customTab.render();
        }
    }

    html += `</div>`;
    detailEl.innerHTML = html;

    actionsEl.innerHTML = `
        <button class="action-button" style="width:100%; padding:10px; font-size:12px; border-color:#888; color:#888;" onclick="closeGenericModal()">CLOSE DATAPAD</button>
    `;
}

// ==========================================
// --- VISUAL CARGO SYSTEM ---
// ==========================================

function updateCurrentCargoLoad() {
    if (typeof GameBus !== 'undefined') {
        GameBus.emit('CARGO_MODIFIED');
    }
}

function openCargoModal() {
    window.cargoSortMode = window.cargoSortMode || 'NAME';
    window.cargoFilterMode = window.cargoFilterMode || 'ALL';
    openGenericModal("CARGO MANIFEST");

    const container = document.getElementById('genericModalContent');
    if (!container) return;
    container.style.cssText = "display: flex; gap: 20px; height: 100%; overflow: hidden; padding-top: 15px;";

    container.innerHTML = `
        <div id="cargoLeftColumn" style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-right: 10px; padding-left: 15px;">
            <div id="cargoSortHeader" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 10px; flex-shrink: 0;"></div>
            <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
        </div>

        <div id="cargoRightColumn" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-right: 15px;">
            <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            <div id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;"></div>
        </div>
    `;

    renderCargoList();
}

function cycleCargoSort() {
    const modes = ['NAME', 'VALUE', 'QUANTITY', 'ILLEGAL', 'WEIGHT'];
    const currentIndex = modes.indexOf(window.cargoSortMode || 'NAME');
    window.cargoSortMode = modes[(currentIndex + 1) % modes.length];

    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    renderCargoList();
}

function setCargoFilter(filterMode) {
    window.cargoFilterMode = filterMode || 'ALL';
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    renderCargoList();
}

function renderCargoList() {
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    const sortHeader = document.getElementById('cargoSortHeader');
    const leftCol = document.getElementById('cargoLeftColumn');
    const rightCol = document.getElementById('cargoRightColumn');

    if (!listEl || !detailEl || !actionsEl) return;

    listEl.innerHTML = '';

    // 1. Gather all owned cargo items
    const allCargo = [];
    let totalHoldValue = 0;

    if (typeof playerCargo !== 'undefined') {
        for (const itemKey in playerCargo) {
            if (playerCargo[itemKey] > 0) {
                const itemDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[itemKey]) ? COMMODITIES[itemKey] : null;
                const val = itemDef ? (itemDef.basePrice || 0) : 0;
                const wt = (itemDef && itemDef.weight !== undefined) ? itemDef.weight : 1;
                const qty = playerCargo[itemKey];
                totalHoldValue += val * qty;

                allCargo.push({
                    key: itemKey,
                    qty: qty,
                    def: itemDef,
                    name: itemDef ? itemDef.name : itemKey.replace(/_/g, ' '),
                    value: val,
                    weight: wt,
                    illegal: itemDef && itemDef.illegal ? 1 : 0,
                    usable: Boolean(itemDef && typeof itemDef.onUse === 'function'),
                    category: itemDef && itemDef.category ? itemDef.category : 'STANDARD'
                });
            }
        }
    }

    // Empty Cargo Hold Handling
    if (allCargo.length === 0) {
        if (leftCol) leftCol.style.display = 'none';
        if (rightCol) {
            rightCol.style.width = '100%';
            rightCol.style.paddingLeft = '15px';
        }
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 40px 20px;">
                <div style="font-size:50px; opacity:0.3; margin-bottom:15px; filter: grayscale(1);">📦</div>
                <h3 style="color:#666;">HOLD EMPTY</h3>
                <p style="color:var(--item-desc-color); font-size:13px; margin-top:10px;">No physical goods detected in the cargo bay.</p>
            </div>`;
        actionsEl.innerHTML = `<button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="closeGenericModal()">CLOSE MANIFEST</button>`;
        return;
    }

    // Restore standard split layout
    if (leftCol) leftCol.style.display = 'flex';
    if (rightCol) {
        rightCol.style.width = '340px';
        rightCol.style.paddingLeft = '0';
    }

    // 2. Build Sorting, Capacity Gauge & Category Filter Header
    const activeFilter = window.cargoFilterMode || 'ALL';
    if (sortHeader) {
        let sortLabel = "A-Z";
        if (window.cargoSortMode === 'VALUE') sortLabel = "TOTAL VALUE";
        if (window.cargoSortMode === 'QUANTITY') sortLabel = "QUANTITY";
        if (window.cargoSortMode === 'ILLEGAL') sortLabel = "CONTRABAND";
        if (window.cargoSortMode === 'WEIGHT') sortLabel = "WEIGHT";

        const curLoad = typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0;
        const maxLoad = typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50;
        const loadPct = Math.min(100, Math.round((curLoad / Math.max(1, maxLoad)) * 100));
        const barColor = loadPct >= 95 ? 'var(--danger)' : (loadPct >= 75 ? 'var(--warning)' : 'var(--accent-color)');

        const filterPills = ['ALL', 'USABLE', 'CONTRABAND', 'PRECURSOR'].map(f => {
            const selected = activeFilter === f;
            return `<button type="button" onclick="setCargoFilter('${f}')" style="flex:1; padding:4px 4px; font-size:9px; font-family:var(--title-font); cursor:pointer; border-radius:3px; background:${selected ? 'rgba(0,224,224,0.15)' : 'rgba(0,0,0,0.4)'}; border:1px solid ${selected ? 'var(--accent-color)' : '#444'}; color:${selected ? 'var(--accent-color)' : '#888'}; font-weight:bold;">${f}</button>`;
        }).join('');

        sortHeader.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                <div>
                    <div style="color:var(--accent-color); font-size:10px; letter-spacing:2px;">HOLD: ${curLoad}/${maxLoad}t (${loadPct}%)</div>
                    <div style="color:var(--gold-text); font-size:10px; margin-top:2px;">Est. Value: ${formatNumber(totalHoldValue)}c</div>
                </div>
                <button class="action-button" style="width:auto; margin:0; padding: 6px 10px; font-size: 10px; border-color:var(--accent-color); color:var(--accent-color);" onclick="cycleCargoSort()">
                    SORT: ${sortLabel} ⟳
                </button>
            </div>
            <div style="height:4px; background:#222; border-radius:2px; overflow:hidden;">
                <div style="height:100%; width:${loadPct}%; background:${barColor}; transition:width 0.3s;"></div>
            </div>
            <div style="display:flex; gap:5px;">${filterPills}</div>
        `;
    }

    // 3. Filter & Sort
    let cargoArray = allCargo.filter(item => {
        if (activeFilter === 'USABLE') return item.usable;
        if (activeFilter === 'CONTRABAND') return Boolean(item.illegal);
        if (activeFilter === 'PRECURSOR') return item.category === 'PRECURSOR' || item.category === 'QUEST';
        return true;
    });

    cargoArray.sort((a, b) => {
        if (window.cargoSortMode === 'VALUE') return (b.value * b.qty) - (a.value * a.qty);
        if (window.cargoSortMode === 'QUANTITY') return b.qty - a.qty;
        if (window.cargoSortMode === 'WEIGHT') return (b.weight * b.qty) - (a.weight * a.qty);
        if (window.cargoSortMode === 'ILLEGAL') {
            if (b.illegal !== a.illegal) return b.illegal - a.illegal;
            return a.name.localeCompare(b.name);
        }
        return a.name.localeCompare(b.name);
    });

    if (cargoArray.length === 0) {
        listEl.innerHTML = `<div style="padding:15px; color:var(--item-desc-color); font-size:12px; font-style:italic;">No items match the "${activeFilter}" filter.</div>`;
        detailEl.innerHTML = `
            <div style="text-align:center; padding:40px 15px; color:var(--item-desc-color); font-size:12px;">
                Switch filter back to <b>ALL</b> to view your full cargo manifest.
            </div>
        `;
        actionsEl.innerHTML = `<button class="action-button" style="width:100%; padding:10px; border-color:#888; color:#888;" onclick="closeGenericModal()">CLOSE MANIFEST</button>`;
        return;
    }

    // 4. Render Sorted Rows
    const fragment = document.createDocumentFragment();
    cargoArray.forEach(item => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; cursor:pointer;";
        row.dataset.itemKey = item.key;

        if (item.illegal) row.style.borderLeft = '3px solid var(--danger)';
        else if (item.usable) row.style.borderLeft = '3px solid var(--success)';
        if (window.activeCargoItem === item.key) row.style.background = 'rgba(0, 224, 224, 0.1)';

        let subtext = "";
        if (window.cargoSortMode === 'VALUE') {
            subtext = `<div style="color:var(--gold-text); font-size:10px; opacity:0.85; margin-top:3px;">Value: ${formatNumber(item.value * item.qty)}c</div>`;
        } else if (window.cargoSortMode === 'WEIGHT') {
            subtext = `<div style="color:var(--warning); font-size:10px; opacity:0.85; margin-top:3px;">Mass: ${item.weight * item.qty}t</div>`;
        } else if (item.usable) {
            subtext = `<div style="color:var(--success); font-size:9px; letter-spacing:1px; margin-top:3px;">ACTIVATABLE</div>`;
        }

        const iconGlyph = item.illegal ? '⚠️' : ((item.def && item.def.icon) ? item.def.icon : '📦');
        row.innerHTML = `
            <div>
                <div style="font-weight:bold; color:var(--item-name-color); font-size: 13px;">${iconGlyph} ${_uiEscapeHtml(item.name)}</div>
                ${subtext}
            </div>
            <div style="color:var(--accent-color); font-weight:bold; font-size:14px;">x${item.qty}</div>
        `;
        row.onclick = () => selectCargoItem(item.key);
        fragment.appendChild(row);
    });

    listEl.appendChild(fragment);

    // Auto-select active item if still visible in filtered list, else first item
    const activeStillVisible = window.activeCargoItem && cargoArray.some(i => i.key === window.activeCargoItem);
    selectCargoItem(activeStillVisible ? window.activeCargoItem : cargoArray[0].key);
}

function selectCargoItem(key) {
    window.activeCargoItem = key;

    const listEl = document.getElementById('genericModalList');
    if (listEl) {
        Array.from(listEl.children).forEach(child => {
            if (child.classList.contains('trade-item-row')) {
                child.style.background = (child.dataset.itemKey === key) ? 'rgba(0, 224, 224, 0.12)' : 'transparent';
            }
        });
    }

    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    if (!detailEl || !actionsEl) return;

    let itemDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[key]) ? COMMODITIES[key] : null;
    if (!itemDef) {
        itemDef = {
            name: key.replace(/_/g, ' '),
            description: "An unclassified or custom asset.",
            basePrice: 100,
            icon: '❓',
            weight: 1
        };
    }

    if (!playerCargo || !playerCargo[key]) {
        renderCargoList();
        return;
    }

    const qty = playerCargo[key];
    const isIllegal = itemDef.illegal
        ? '<span style="color:var(--danger); font-size:10px; border:1px solid var(--danger); padding:2px 5px; border-radius:2px; margin-left:8px;">CONTRABAND</span>'
        : '';
    const weight = itemDef.weight !== undefined ? itemDef.weight : 1;
    const totalVal = (itemDef.basePrice || 0) * qty;
    const avgCostHtml = (window.playerCargoCostBasis && window.playerCargoCostBasis[key] !== undefined)
        ? `<div style="color:var(--item-desc-color);">Avg Paid:</div> <div style="color:var(--accent-color); text-align:right;">${formatNumber(Math.round(window.playerCargoCostBasis[key]))}c/u</div>`
        : '';

    detailEl.innerHTML = `
        <div style="padding: 15px; text-align:center; animation: fadeIn 0.25s ease-out;">
            <div style="font-size:46px; margin-bottom:12px; filter: drop-shadow(0 0 10px ${itemDef.illegal ? 'var(--danger)' : 'var(--accent-color)'});">${itemDef.illegal ? '⚠️' : (itemDef.icon || '📦')}</div>
            <h3 style="color:var(--item-name-color); margin:0 0 10px 0; display:flex; justify-content:center; align-items:center; flex-wrap:wrap;">
                ${_uiEscapeHtml(itemDef.name.toUpperCase())} ${isIllegal}
            </h3>
            <div style="background:rgba(0,0,0,0.45); padding:12px; border-radius:4px; text-align:left; border-left: 3px solid ${itemDef.illegal ? 'var(--danger)' : 'var(--accent-color)'}; margin-bottom:16px;">
                <p style="color:var(--text-color); font-size:12px; margin:0; line-height:1.55;">${_uiEscapeHtml(itemDef.description || 'No data available.')}</p>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:12px; text-align:left; background:var(--bg-color); padding: 12px; border: 1px solid var(--border-color); border-radius: 4px;">
                <div style="color:var(--item-desc-color);">Current Stock:</div> <div style="color:var(--accent-color); text-align:right; font-weight:bold;">${qty} Units</div>
                <div style="color:var(--item-desc-color);">Base / Total Value:</div> <div style="color:var(--gold-text); text-align:right;">${formatNumber(itemDef.basePrice || 0)}c / ${formatNumber(totalVal)}c</div>
                ${avgCostHtml}
                <div style="color:var(--item-desc-color);">Unit / Total Mass:</div> <div style="color:var(--warning); text-align:right;">${weight}t / ${weight * qty}t</div>
            </div>
        </div>
    `;

    let useButtonHtml = "";
    if (typeof itemDef.onUse === 'function') {
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
    const itemDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[key]) ? COMMODITIES[key] : null;
    if (!itemDef || typeof itemDef.onUse !== 'function') return;

    const consumed = itemDef.onUse();
    if (consumed) {
        playerCargo[key]--;
        if (playerCargo[key] <= 0) {
            delete playerCargo[key];
            if (window.playerCargoCostBasis) delete window.playerCargoCostBasis[key];
        }

        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        if (typeof renderUIStats === 'function') renderUIStats();
        updateModalInfoBar('genericInfoBar');

        // Only rebuild cargo UI if the Cargo Manifest is still what the player is viewing
        const modal = document.getElementById('genericModalOverlay');
        const title = document.getElementById('genericModalTitle');
        if (modal && modal.style.display === 'flex' && title && title.textContent === "CARGO MANIFEST") {
            if (playerCargo[key]) {
                renderCargoList();
            } else {
                window.activeCargoItem = null;
                renderCargoList();
            }
        }
    }
}

function jettisonItem(key, amount, skipConfirm = false) {
    if (!playerCargo || !playerCargo[key] || playerCargo[key] <= 0) return;

    const itemDef = (typeof COMMODITIES !== 'undefined' && COMMODITIES[key]) ? COMMODITIES[key] : null;
    const itemName = itemDef ? itemDef.name : key.replace(/_/g, ' ');
    const amountToDrop = amount === 'ALL' ? playerCargo[key] : 1;
    const estValue = (itemDef ? (itemDef.basePrice || 0) : 0) * amountToDrop;

    const protectedKeys = new Set(['HOT_CARGO', 'COLONY_CHARTER', 'WAYFINDER_CORE', 'STATION_CORE', 'WORMHOLE_STABILIZER', 'PREFAB_COLONY_CORE']);
    if (!skipConfirm && (protectedKeys.has(key) || estValue >= 5000) && typeof showConfirmationModal === 'function') {
        showConfirmationModal(
            `WARNING: Permanently jettison ${amountToDrop}x ${itemName} (~${formatNumber(estValue)}c) into deep space? This cannot be recovered.`,
            () => jettisonItem(key, amount, true)
        );
        return;
    }

    playerCargo[key] -= amountToDrop;
    if (playerCargo[key] <= 0) {
        delete playerCargo[key];
        if (window.playerCargoCostBasis) delete window.playerCargoCostBasis[key];
        window.activeCargoItem = null;
    }

    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
    if (typeof renderUIStats === 'function') renderUIStats();
    updateModalInfoBar('genericInfoBar');

    logMessage(`<span style="color:var(--danger)">[ CARGO ] Ejected ${amountToDrop}x ${_uiEscapeHtml(itemName)} into the void.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playHullHit();

    const modal = document.getElementById('genericModalOverlay');
    if (modal && modal.style.display === 'flex') {
        renderCargoList();
    }
}

// --- END OF FILE ui.js ---
