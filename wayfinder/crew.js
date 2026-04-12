// Ensure global arrays exist 
if (typeof playerCrew === 'undefined') window.playerCrew = [];

// Global helper for combat/trade engines
window.hasCrewPerk = function(perkId) {
    if (!window.playerCrew) return false;
    return window.playerCrew.some(crew => crew.perk === perkId);
};

// ==========================================
// --- UNIFIED RECRUITMENT UI ---
// ==========================================

function openRecruitmentBoard() {
    openGenericModal("CANTINA RECRUITMENT"); 
    
    // Generate new recruits if the station pool is empty
    if (typeof currentStationRecruits === 'undefined' || currentStationRecruits === null) {
        currentStationRecruits = generateStationRecruits();
    }

    // --- THE IRONCLAD FLEXBOX LAYOUT ---
    const container = document.getElementById('genericModalContent');
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--accent-color); margin-bottom: 15px; box-shadow: 0 0 25px rgba(0, 224, 224, 0.2); flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/crew_banner.png" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" onerror="this.onerror=null; this.src='assets/crew_banner.png';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">AVAILABLE FREELANCERS</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;">
                    <div style="text-align:center; padding: 10px 0 20px 0;">
                        <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 15px rgba(0,224,224,0.4)); opacity:0.8;">👨‍🚀</div>
                        <h3 style="color:var(--accent-color); margin-top:0; margin-bottom:10px; letter-spacing: 2px;">LOCAL DOSSIERS</h3>
                        <p style="color:var(--text-color); font-size:13px; line-height:1.5; font-style:italic; background: rgba(0,0,0,0.3); padding: 10px; border-left: 2px solid var(--accent-color); text-align: left;">
                            "Review the files of spacers looking for a bunk. They charge an upfront signing bonus, and require an ongoing salary, but their passive perks are permanent."
                        </p>
                        <div style="margin-top: 20px; font-size: 13px; font-weight: bold; color: var(--gold-text); background: rgba(255,215,0,0.05); border: 1px solid #886600; padding: 10px; border-radius: 4px;">
                            Current Crew Size: ${playerCrew.length} / ${typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3}
                        </div>
                    </div>
                </div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;">
                    <button class="action-button full-width-btn" onclick="visitCantina()" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;">◀ BACK TO CANTINA</button>
                </div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    
    if (currentStationRecruits.length === 0) {
        listEl.innerHTML = `<div style="padding:15px; color:#888; font-style:italic;">No capable spacers are looking for work here today. Try another station.</div>`;
    } else {
        currentStationRecruits.forEach((recruit, index) => {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
            
            const nameColor = recruit.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)';
            if (recruit.isLegendary) {
                row.style.borderLeft = '3px solid var(--gold-text)';
                row.style.background = 'rgba(255,215,0,0.05)';
            }

            row.innerHTML = `
                <div>
                    <div style="color:${nameColor}; font-weight:bold; font-size: 13px;">${recruit.name}</div>
                    <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">${recruit.role}</div>
                </div>
                <div style="text-align:right;">
                    <span style="color:var(--success); font-weight:bold;">${formatNumber(recruit.cost)}c</span>
                </div>
            `;
            row.onclick = () => showRecruitDetails(index);
            listEl.appendChild(row);
        });
    }
}

function showRecruitDetails(index) {
    const recruit = currentStationRecruits[index];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    const nameColor = recruit.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)';

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 10px 0;">
            <div style="position: relative; display: inline-block; margin-bottom: 15px;">
                <img src="${recruit.image || 'assets/default_npc.png'}" alt="Portrait" style="width:100px; height:100px; border-radius:4px; border:2px solid ${nameColor}; object-fit:cover; box-shadow: 0 0 15px ${recruit.isLegendary ? 'rgba(255,215,0,0.3)' : 'rgba(0,224,224,0.3)'};">
                ${recruit.isLegendary ? '<div style="position: absolute; top: -10px; right: -10px; font-size: 24px; filter: drop-shadow(0 0 5px var(--gold-text));">⭐</div>' : ''}
            </div>
            
            <h3 style="color:${nameColor}; margin:0 0 5px 0;">${recruit.name.toUpperCase()}</h3>
            
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 10px; color: var(--text-color); margin-bottom: 15px; letter-spacing: 1px;">
                ${recruit.role.toUpperCase()}
            </div>
            
            <p style="font-size:13px; color:var(--text-color); margin-bottom: 20px; line-height: 1.5; text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-left: 2px solid ${nameColor};">
                "${recruit.desc}"
            </p>
            
            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Signing Bonus:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(recruit.cost)}c</span></div>
                <div class="trade-stat-row"><span>Ongoing Salary:</span> <span style="color:var(--item-desc-color);">${typeof COST_PER_CREW !== 'undefined' ? COST_PER_CREW : 250}c / Mo</span></div>
                <div class="trade-stat-row" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                    <span>Granted Perk:</span> <span style="color:var(--success); font-weight:bold;">${recruit.perk.replace('_', ' ')}</span>
                </div>
            </div>
        </div>
    `;

    const canAfford = playerCredits >= recruit.cost;
    const hasSpace = playerCrew.length < (typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3);

    let btnHtml = "";
    if (!hasSpace) {
        btnHtml = `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>CREW QUARTERS FULL</button>`;
    } else if (!canAfford) {
        btnHtml = `<button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" disabled>INSUFFICIENT FUNDS (${formatNumber(recruit.cost)}c)</button>`;
    } else {
        btnHtml = `
            <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--success); color:var(--success); box-shadow: 0 0 10px rgba(0,255,0,0.2);" onclick="hireRecruit(${index})">
                AUTHORIZE HIRE
            </button>
        `;
    }
    
    btnHtml += `<button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="openRecruitmentBoard()">◀ CANCEL</button>`;
    actionsEl.innerHTML = btnHtml;
}

function hireRecruit(index) {
    const recruit = currentStationRecruits[index];
    if (playerCredits < recruit.cost || playerCrew.length >= (typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3)) return;

    playerCredits -= recruit.cost;
    playerCrew.push(recruit); 
    currentStationRecruits.splice(index, 1);
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    logMessage(`<span style="color:var(--success); font-weight:bold;">[ RECRUITMENT ]</span> ${recruit.name} (${recruit.role}) has joined your crew!`);
    if (typeof showToast === 'function') showToast("CREW HIRED", "success");
    
    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats(); 
    if (typeof renderUIStats === 'function') renderUIStats();
    
    openRecruitmentBoard(); 
}

function generateStationRecruits() {
    const recruits = [];
    const count = Math.floor(Math.random() * 3) + 1; 

    const legendaryRecruits = [
        { id: "LEGEND_ELARA", name: "Elara 'Ghost' Vance", role: "Master Infiltrator", perk: "STEALTH_DRIVE", desc: "Reduces pirate ambush chance by 90%.", baseCost: 5000, image: "assets/legend_elara.png", isLegendary: true },
        { id: "LEGEND_KAELEN", name: "Kaelen the Butcher", role: "K'tharr Warlord", perk: "PIRATE_TERROR", desc: "Increases combat damage by a massive 35%.", baseCost: 7500, image: "assets/legend_kaelen.png", isLegendary: true },
        { id: "LEGEND_CORTEX", name: "Unit-04 'Cortex'", role: "AI Navigator", perk: "QUANTUM_PATHING", desc: "Reveals the entire sector map upon entering a new system.", baseCost: 10000, image: "assets/legend_cortex.png", isLegendary: true },
        { id: "JAX_VANE", name: "Jax Vane", role: "Gunner", perk: "COMBAT_DAMAGE", desc: "Ex-pirate with a steady hand. Adds +15% to all ship weapon damage.", baseCost: 1500, image: "assets/gunner.png", isLegendary: true },
        { id: "KORG_MAH", name: "Korg'Mah", role: "Mechanic", perk: "PASSIVE_REPAIR", desc: "A rugged K'tharr engineer. Passively repairs hull damage while you travel.", baseCost: 1800, image: "assets/engineer.png", isLegendary: true },
        // NEW LEGENDARY RECRUITS
        { id: "LEGEND_ELIM", name: "Elim 'The Tailor' Darok", role: "Simple Tailor", perk: "SHADOW_NETWORK", desc: "Claims to be a humble clothier, yet somehow possesses high-level clearance codes for every major faction.", baseCost: 8500, image: "assets/legend_elim.png", isLegendary: true },
        { id: "LEGEND_MILES", name: "Chief Miles O'Tarek", role: "Miracle Worker", perk: "PASSIVE_REPAIR", desc: "A disgruntled but brilliant engineer. Can fix a warp core breach with a spanner and a piece of tape.", baseCost: 6000, image: "assets/legend_miles.png", isLegendary: true }
    ];

    // EXPANDED STANDARD ROLES POOL!
    const standardRoles = [
        { role: "Quartermaster", perk: "TRADE_BONUS", desc: "Negotiates 10% better prices at all stations.", baseCost: 1200, image: "assets/default_npc.png" },
        { role: "Astrogator", perk: "FUEL_EFFICIENCY", desc: "Reduces fuel consumption during hyper-jumps.", baseCost: 1000, image: "assets/default_npc.png" },
        { role: "Scientist", perk: "ASTROMETRICS", desc: "Improves deep space scanning. Grants bonus XP.", baseCost: 1400, image: "assets/scientist.png" },
        { role: "Eclipse Smuggler", perk: "SHADOW_NETWORK", desc: "Increases payouts for illegal cargo delivery by 20%.", baseCost: 1700, image: "assets/eclipse_smuggler.png" },
        { role: "Marine Veteran", perk: "BOARDING_ACTION", desc: "Increases success rate and survivability during derelict airlock breaches.", baseCost: 1600, image: "assets/default_npc.png" },
        { role: "Salvage Scrapper", perk: "SCRAP_HOUND", desc: "Yields 20% more salvage and scrap when stripping derelict wrecks.", baseCost: 1300, image: "assets/engineer.png" },
        { role: "Shield Technician", perk: "SHIELD_REGEN", desc: "Passively recharges 1% of the ship's shields every standard movement cycle.", baseCost: 1500, image: "assets/scientist.png" },
        { role: "Chief Medical Officer", perk: "TRAUMA_CARE", desc: "Dramatically reduces the chance of crew fatalities during hazards and combat.", baseCost: 1800, image: "assets/default_npc.png" },
        { role: "Gunnery Sergeant", perk: "CRITICAL_STRIKE", desc: "Optimizes weapon convergence, granting a 10% chance to deal double damage.", baseCost: 1750, image: "assets/gunner.png" },
        { role: "Cyber-Slicer", perk: "DATA_EXTRACTION", desc: "Bypasses encrypted networks, doubling the credit yield from derelict databanks.", baseCost: 1900, image: "assets/scientist.png" }
    ];

    const firstNames = ["Odin", "Nyx", "Garrus", "Sasha", "Vane", "Silas", "Kira", "Rook", "Juno", "Cassian"];
    const lastNames = ["Vance", "Karn", "Trex", "Valerius", "Thorne", "Graves", "Black", "Krykov", "Sol"];

    for (let i = 0; i < count; i++) {
        if (Math.random() < 0.25) {
            const legend = legendaryRecruits[Math.floor(Math.random() * legendaryRecruits.length)];
            if (!playerCrew.some(c => c.id === legend.id) && !recruits.some(c => c.id === legend.id)) {
                recruits.push({ ...legend, cost: legend.baseCost });
                continue; 
            }
        }
        
        const roleData = standardRoles[Math.floor(Math.random() * standardRoles.length)];
        recruits.push({
            id: `CREW_${Date.now()}_${i}`,
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            role: roleData.role,
            perk: roleData.perk,
            desc: roleData.desc,
            cost: roleData.baseCost + Math.floor(Math.random() * 300),
            image: roleData.image, 
            isLegendary: false
        });
    }
    return recruits;
}

// ==========================================
// --- CREW ROSTER & DISMISSAL ---
// ==========================================

function displayCrewRoster() {
    const sysMenu = document.getElementById('systemMenu');
    if (sysMenu) sysMenu.classList.add('hidden');
    
    openGenericModal("CREW MANIFEST");

    const container = document.getElementById('genericModalContent');
    container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden;";

    const headerImageHTML = `
        <div style="width: 100%; height: 180px; border-radius: 4px; border: 1px solid var(--success); margin-bottom: 15px; box-shadow: 0 0 25px rgba(0, 170, 170, 0.2); flex-shrink: 0; overflow: hidden; background: rgba(0,0,0,0.5);">
            <img src="assets/roster_banner.jpg" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.9;" onerror="this.onerror=null; this.src='assets/roster_banner.png';">
        </div>
    `;

    container.innerHTML = `
        ${headerImageHTML}
        <div style="display: flex; gap: 20px; flex: 1; min-height: 0; overflow: hidden;">
            
            <div style="flex: 1.2; display: flex; flex-direction: column; overflow: hidden; border-right: 1px solid var(--border-color); padding-left: 15px; padding-right: 10px;">
                <div class="trade-list-header" style="color:var(--success); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom: 5px;">ACTIVE ROSTER (${playerCrew.length}/${typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3})</div>
                <div id="genericModalList" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
                
                <div class="trade-math-area" style="text-align:left; border-color: #555; margin-top: 15px; margin-bottom: 5px;">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:5px;">PAYROLL / UPKEEP</div>
                    <div class="trade-stat-row"><span>Total Crew:</span> <span style="color:var(--text-color); font-weight:bold;">${playerCrew.length}</span></div>
                    <div class="trade-stat-row"><span>Salary Cost:</span> <span style="color:var(--warning); font-weight:bold;">-${playerCrew.length * (typeof COST_PER_CREW !== 'undefined' ? COST_PER_CREW : 250)}c</span></div>
                    <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #333; padding-top:5px;"><span style="font-size:10px; color:var(--item-desc-color);">* Paid automatically every 30 sectors</span></div>
                </div>
            </div>
            
            <div id="genericModalDetails" style="width: 340px; display: flex; flex-direction: column; overflow: hidden; padding-left: 5px; padding-right: 15px;">
                <div id="genericDetailContent" style="flex: 1; overflow-y: auto; padding-right: 10px;"></div>
                <div class="trade-btn-group" id="genericModalActions" style="margin-top: 15px; flex-shrink: 0; padding-bottom: 5px;"></div>
            </div>
        </div>
    `;

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    if (playerCrew.length === 0) {
        listEl.innerHTML = `<div style="padding:15px; color:#666; font-style:italic;">No crew assigned. Solo flight operation.</div>`;
        detailEl.innerHTML = `
            <div style="text-align:center; padding: 40px 20px;">
                <div style="font-size:50px; opacity:0.3; margin-bottom:15px;">🛌</div>
                <h3 style="color:#666; margin-bottom:10px;">QUARTERS EMPTY</h3>
                <p style="color:var(--item-desc-color); font-size:12px;">Visit a station cantina to hire specialists.</p>
            </div>
        `;
        actionsEl.innerHTML = `<button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="closeGenericModal()">CLOSE ROSTER</button>`;
        return;
    }

    playerCrew.forEach((crew, index) => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.style.cssText = "padding: 12px 10px; border-bottom: 1px solid var(--border-color); cursor: pointer; display:flex; justify-content:space-between; align-items:center;";
        
        const nameColor = crew.isLegendary ? 'var(--gold-text)' : 'var(--text-color)';
        if (crew.isLegendary) row.style.borderLeft = '2px solid var(--gold-text)';

        row.innerHTML = `
            <div>
                <div style="color:${nameColor}; font-weight:bold; font-size: 13px;">${crew.name}</div>
                <div style="color:var(--item-desc-color); font-size: 10px; margin-top: 4px;">${crew.role}</div>
            </div>
        `;
        row.onclick = () => {
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 10px 0;">
                    <img src="${crew.image || 'assets/default_npc.png'}" style="width:100px; height:100px; object-fit: cover; border-radius:4px; margin-bottom:15px; border: 2px solid ${crew.isLegendary ? 'var(--gold-text)' : 'var(--success)'}; box-shadow: 0 0 15px ${crew.isLegendary ? 'rgba(255,215,0,0.2)' : 'rgba(0,170,170,0.2)'};">
                    <h3 style="color:${nameColor}; margin:0 0 5px 0;">${crew.name.toUpperCase()}</h3>
                    
                    <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 10px; color: var(--success); margin-bottom: 15px; letter-spacing: 1px;">
                        ${crew.role.toUpperCase()}
                    </div>
                    
                    <p style="font-size:13px; color:var(--text-color); line-height:1.5; text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-left: 2px solid ${nameColor};">
                        "${crew.desc}"
                    </p>
                    
                    <div class="trade-math-area" style="text-align:left; border-color: var(--success);">
                        <div class="trade-stat-row">
                            <span style="color:#888;">Active Perk:</span> 
                            <span style="color:var(--success); font-weight:bold;">${crew.perk.replace('_', ' ')}</span>
                        </div>
                    </div>

                    ${crew.drawback ? `
                        <div style="background: rgba(255,0,0,0.1); border: 1px solid var(--danger); padding: 10px; border-radius: 4px; margin-top: 15px; text-align: left;">
                            <div style="color:var(--danger); font-size:10px; font-weight:bold; letter-spacing:1px; margin-bottom:5px;">⚠️ SECURITY WARNING</div>
                            <div style="font-size:11px; color:var(--text-color);">Known to occasionally siphon ${crew.drawback.type.replace('STEAL_', '').toLowerCase()}. Keep an eye on them.</div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            // NEW: Added the Intercom Button!
            actionsEl.innerHTML = `
                <button class="action-button" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px; border-color:var(--success); color:var(--success);" onclick="openCrewComm(${index})">OPEN COMM LINK</button>
                <button class="action-button danger-btn" style="width: 100%; padding: 10px; font-size: 12px; margin-bottom: 10px;" onclick="fireCrew(${index})">DISMISS FROM SERVICE</button>
                <button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color: #888; color: #888;" onclick="closeGenericModal()">CLOSE ROSTER</button>
            `;
        };
        listEl.appendChild(row);
    });
    
    if (listEl.children.length > 0) {
        listEl.querySelectorAll('.trade-item-row')[0].click();
    }
}

// ==========================================
// --- CREW INTERCOM (BANTER SYSTEM) ---
// ==========================================

function openCrewComm(index) {
    const crew = playerCrew[index];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Generate procedural flavor text based on their role
    let quotes = [
        "Everything looks green on my board, Captain.",
        "Just waiting for the next jump.",
        "I need a coffee. Do we have any coffee left in the hold?",
        "Ship's running smooth. For now."
    ];

    const role = crew.role.toLowerCase();
    if (role.includes('engineer') || role.includes('mechanic') || role.includes('worker')) {
        quotes = ["I can only patch these conduits so many times before we need a drydock.", "If you push the engines any harder, I'm not responsible for what happens.", "I bypassed the secondary coupling. We should get slightly better flow now."];
    } else if (role.includes('scientist') || role.includes('medical') || role.includes('trauma')) {
        quotes = ["The background radiation in this sector is fascinating.", "Please remember to take your anti-rad meds. I don't want to deal with another outbreak.", "I'm running a diagnostic on the local flora we brought aboard."];
    } else if (role.includes('gunner') || role.includes('marine') || role.includes('warlord')) {
        quotes = ["Weapons are hot and ready. Just give the word.", "When do we get to shoot something?", "I've recalibrated the targeting sensors. We won't miss."];
    } else if (role.includes('smuggler') || crew.isMercenary || role.includes('tailor')) {
        quotes = ["I didn't see anything. I wasn't even there.", "If Concord scans us, I'm hiding in the maintenance shaft.", "Don't ask where I got this. Just know it works."];
    }

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const nameColor = crew.isLegendary ? 'var(--gold-text)' : 'var(--success)';

    // Swap the right pane to the "Comms" view
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px 10px; animation: fadeIn 0.3s;">
            <div style="font-size:40px; margin-bottom:15px; filter: drop-shadow(0 0 15px ${nameColor}); animation: pulse 2s infinite;">🎙️</div>
            <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">SECURE CHANNEL OPEN</div>
            <h3 style="color:${nameColor}; margin:0 0 15px 0;">${crew.name.toUpperCase()}</h3>
            
            <div style="background: rgba(0,0,0,0.5); border: 1px solid var(--border-color); padding: 20px; border-radius: 4px; border-left: 4px solid ${nameColor}; text-align: left; position: relative;">
                <div style="font-size:14px; color:var(--text-color); font-style:italic; line-height:1.6;">
                    "${randomQuote}"
                </div>
            </div>
            
            <div style="margin-top: 20px; font-size:11px; color:var(--item-desc-color);">
                Signal Strength: 100% (Local Intranet)
            </div>
        </div>
    `;

    if (typeof soundManager !== 'undefined' && soundManager.playUIHover) {
        soundManager.playUIHover(); // Play a nice radio click sound!
    }

    actionsEl.innerHTML = `
        <button class="action-button full-width-btn" style="width: 100%; padding: 10px; font-size: 12px; border-color:var(--danger); color:var(--danger);" onclick="displayCrewRoster()">CLOSE COMM LINK</button>
    `;
}

function fireCrew(index) {
    const crew = playerCrew[index];
    
    // NEW: Severance Pay Logic (Costs 10% of their base cost to fire them)
    const severanceFee = Math.floor((crew.cost || 1000) * 0.10);
    
    if (playerCredits < severanceFee) {
        if (typeof showToast === 'function') showToast(`Cannot afford Severance (${severanceFee}c)`, "error");
        if (typeof soundManager !== 'undefined' && soundManager.playError) soundManager.playError();
        return;
    }

    playerCredits -= severanceFee;
    playerCrew.splice(index, 1);
    
    if (crew.isMercenary) window.hasEclipseMerc = false;
    
    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
    
    logMessage(`You dismissed <span style="color:var(--warning);">${crew.name}</span> at the nearest port. Paid ${severanceFee}c in severance.`);
    if (typeof showToast === 'function') showToast("CREW DISMISSED", "info");
    
    if (typeof renderUIStats === 'function') renderUIStats(); 
    displayCrewRoster(); 
}

// ==========================================
// --- ECLIPSE SHADOW MERCENARIES ---
// ==========================================

function hireMercenary(mercId) {
    if (typeof ECLIPSE_MERCENARIES === 'undefined') return;
    
    const merc = ECLIPSE_MERCENARIES.find(m => m.id === mercId);
    if (!merc || playerCredits < merc.cost) return;
    
    playerCredits -= merc.cost;
    
    playerCrew.push({
        id: merc.id,
        name: merc.name,
        role: merc.role,
        desc: merc.desc,
        isMercenary: true,
        stats: merc.stats,
        drawback: merc.drawback,
        image: merc.image || 'assets/eclipse_smuggler.png',
        isLegendary: false,
        perk: merc.role.toUpperCase().replace(' ', '_')
    });
    
    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats(); 
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("CONTRACT SIGNED", "success");
    
    logMessage(`<span style="color:#9C27B0; font-weight:bold;">[ SHADOW NETWORK ]</span> ${merc.name} has joined your crew. Keep an eye on your valuables.`);
    
    if (typeof openMercenaryDen === 'function') openMercenaryDen();
    if (typeof renderUIStats === 'function') renderUIStats();
}

function processMercenaryDrawbacks() {
    if (!playerCrew || playerCrew.length === 0) return;
    
    playerCrew.forEach(crewMember => {
        if (crewMember.isMercenary && crewMember.drawback && Math.random() < crewMember.drawback.chance) {
            
            if (crewMember.drawback.type === "STEAL_CARGO") {
                if (typeof playerCargo !== 'undefined') {
                    const cargoIds = Object.keys(playerCargo).filter(id => playerCargo[id] > 0);
                    if (cargoIds.length > 0) {
                        const stolenId = cargoIds[Math.floor(Math.random() * cargoIds.length)];
                        
                        const stealAmount = Math.min(crewMember.drawback.amount, playerCargo[stolenId]);
                        playerCargo[stolenId] -= stealAmount;
                        
                        if (playerCargo[stolenId] <= 0) delete playerCargo[stolenId];
                        
                        const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[stolenId]) ? COMMODITIES[stolenId].name : "Cargo";
                        
                        if (typeof showToast === 'function') showToast(`MISSING: ${itemName}`, "warning");
                        logMessage(`<span style="color:var(--warning); font-weight:bold;">[ THEFT ]</span> Inventory discrepancy. ${stealAmount}x ${itemName} missing from hold. ${crewMember.name} looks suspiciously innocent.`);
                        
                        if (typeof GameBus !== 'undefined') GameBus.emit('CARGO_MODIFIED');
                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                    }
                }
            } 
            else if (crewMember.drawback.type === "STEAL_CREDITS") {
                if (playerCredits >= crewMember.drawback.amount) {
                    playerCredits -= crewMember.drawback.amount;
                    if (typeof showToast === 'function') showToast(`SKIMMED: -${crewMember.drawback.amount}c`, "warning");
                    logMessage(`<span style="color:var(--warning); font-weight:bold;">[ THEFT ]</span> Unauthorized transfer detected. ${crewMember.drawback.amount}c siphoned from account by ${crewMember.name}.`);
                    
                    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                }
            }
            else if (crewMember.drawback.type === "STEAL_FUEL") {
                if (typeof playerFuel !== 'undefined' && playerFuel > crewMember.drawback.amount) {
                    playerFuel -= crewMember.drawback.amount;
                    if (typeof showToast === 'function') showToast(`VENTED: -${crewMember.drawback.amount} Fuel`, "warning");
                    logMessage(`<span style="color:var(--warning); font-weight:bold;">[ THEFT ]</span> Unscheduled fuel venting detected. ${crewMember.name} claims it was a 'cascade failure override.'`);
                    
                    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                }
            }
        }
    });
}
