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
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Generate new recruits if the station pool is empty
    if (typeof currentStationRecruits === 'undefined' || currentStationRecruits.length === 0) {
        currentStationRecruits = generateStationRecruits();
    }

    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">AVAILABLE FREELANCERS</div>`;
    
    if (currentStationRecruits.length === 0) {
        listEl.innerHTML += `<div style="padding:15px; color:#888;">No capable spacers are looking for work here today. Try another station.</div>`;
    } else {
        currentStationRecruits.forEach((recruit, index) => {
            const row = document.createElement('div');
            row.className = 'trade-item-row';
            row.style.cursor = 'pointer';
            row.innerHTML = `
                <div style="display:flex; flex-direction:column; gap: 4px;">
                    <span style="color:${recruit.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)'}; font-weight:bold;">${recruit.name}</span> 
                    <span style="color:var(--item-desc-color); font-size:10px;">${recruit.role}</span>
                </div>
                <div style="color:var(--success); font-size:12px; font-weight:bold;">${formatNumber(recruit.cost)}c</div>
            `;
            row.onclick = () => showRecruitDetails(index);
            listEl.appendChild(row);
        });
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 40px 20px;">
            <div style="font-size:60px; margin-bottom:15px; opacity:0.5;">👨‍🚀</div>
            <h3 style="color:var(--accent-color); margin-bottom:10px;">LOCAL FREELANCERS</h3>
            <p style="color:var(--item-desc-color); font-size:13px; line-height:1.5;">
                Review the dossiers of spacers looking for a bunk on a decent ship. They charge an upfront signing bonus, but their passive perks are permanent.
            </p>
            <div style="margin-top: 20px; font-size: 13px; font-weight: bold; color: var(--gold-text);">
                Current Crew Size: ${playerCrew.length} / ${typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3}
            </div>
        </div>
    `;
    actionsEl.innerHTML = `<button class="action-button full-width-btn" onclick="visitCantina()">BACK TO CANTINA</button>`;
}

function showRecruitDetails(index) {
    const recruit = currentStationRecruits[index];
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <img src="${recruit.image || 'assets/default_npc.png'}" alt="Portrait" style="width:90px; height:90px; border-radius:50%; border:2px solid ${recruit.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)'}; object-fit:cover; margin-bottom:15px;">
            <h3 style="color:${recruit.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)'}; margin:0 0 5px 0;">${recruit.name.toUpperCase()}</h3>
            
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); display: inline-block; padding: 4px 8px; border-radius: 2px; font-size: 10px; color: var(--text-color); margin-bottom: 15px; letter-spacing: 1px;">
                ${recruit.role.toUpperCase()}
            </div>
            
            <p style="font-size:13px; color:var(--text-color); margin-bottom: 20px; line-height: 1.5;">"${recruit.desc}"</p>
            
            <div class="trade-math-area" style="text-align:left;">
                <div class="trade-stat-row"><span>Signing Bonus:</span> <span style="color:var(--gold-text); font-weight:bold;">${formatNumber(recruit.cost)}c</span></div>
                <div class="trade-stat-row"><span>Granted Perk:</span> <span style="color:var(--success);">${recruit.perk.replace('_', ' ')}</span></div>
            </div>
        </div>
    `;

    const canAfford = playerCredits >= recruit.cost;
    const hasSpace = playerCrew.length < (typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3);

    if (!hasSpace) {
        actionsEl.innerHTML = `<button class="action-button danger-btn" disabled>CREW QUARTERS FULL</button>`;
    } else if (!canAfford) {
        actionsEl.innerHTML = `<button class="action-button danger-btn" disabled>INSUFFICIENT FUNDS</button>`;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:var(--success); color:var(--success); box-shadow: 0 0 10px rgba(0,255,0,0.2);" onclick="hireRecruit(${index})">
                AUTHORIZE HIRE
            </button>
        `;
    }
    actionsEl.innerHTML += `<button class="action-button" onclick="openRecruitmentBoard()">CANCEL</button>`;
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

    // Mix the original CREW_DATABASE heroes into the legendary pool!
    const legendaryRecruits = [
        { id: "LEGEND_ELARA", name: "Elara 'Ghost' Vance", role: "Master Infiltrator", perk: "STEALTH_DRIVE", desc: "Reduces pirate ambush chance by 90%.", baseCost: 5000, image: "assets/legend_elara.png", isLegendary: true },
        { id: "LEGEND_KAELEN", name: "Kaelen the Butcher", role: "K'tharr Warlord", perk: "PIRATE_TERROR", desc: "Increases combat damage by a massive 35%.", baseCost: 7500, image: "assets/legend_kaelen.png", isLegendary: true },
        { id: "LEGEND_CORTEX", name: "Unit-04 'Cortex'", role: "AI Navigator", perk: "QUANTUM_PATHING", desc: "Reveals the entire sector map upon entering a new system.", baseCost: 10000, image: "assets/legend_cortex.png", isLegendary: true },
        // Imported from your old CREW_DATABASE
        { id: "JAX_VANE", name: "Jax Vane", role: "Gunner", perk: "COMBAT_DAMAGE", desc: "Ex-pirate with a steady hand. Adds +15% to all ship weapon damage.", baseCost: 1500, image: "assets/gunner.png", isLegendary: true },
        { id: "KORG_MAH", name: "Korg'Mah", role: "Mechanic", perk: "PASSIVE_REPAIR", desc: "A rugged K'tharr engineer. Passively repairs hull damage while you travel.", baseCost: 1800, image: "assets/engineer.png", isLegendary: true }
    ];

    const standardRoles = [
        { role: "Quartermaster", perk: "TRADE_BONUS", desc: "Negotiates 10% better prices at all stations.", baseCost: 1200, image: "assets/default_npc.png" },
        { role: "Astrogator", perk: "FUEL_EFFICIENCY", desc: "Reduces fuel consumption during hyper-jumps.", baseCost: 1000, image: "assets/default_npc.png" },
        { role: "Scientist", perk: "ASTROMETRICS", desc: "Improves deep space scanning. Grants bonus XP.", baseCost: 1400, image: "assets/scientist.png" },
        { role: "Eclipse Smuggler", perk: "SHADOW_NETWORK", desc: "Increases payouts for illegal cargo delivery by 20%.", baseCost: 1700, image: "assets/eclipse_smuggler.png" }
    ];

    const firstNames = ["Odin", "Nyx", "Garrus", "Sasha", "Vane", "Silas", "Kira", "Rook"];
    const lastNames = ["Vance", "Karn", "Trex", "Valerius", "Thorne", "Graves", "Black"];

    for (let i = 0; i < count; i++) {
        // 25% chance to spawn a Unique Hero
        if (Math.random() < 0.25) {
            const legend = legendaryRecruits[Math.floor(Math.random() * legendaryRecruits.length)];
            if (!playerCrew.some(c => c.id === legend.id) && !recruits.some(c => c.id === legend.id)) {
                recruits.push({ ...legend, cost: legend.baseCost });
                continue; 
            }
        }
        // Fallback to Standard Procedural Recruit
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
    document.getElementById('systemMenu').classList.add('hidden');
    openGenericModal("CREW MANIFEST");

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    
    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">ASSIGNED CREW (${playerCrew.length}/${typeof MAX_CREW !== 'undefined' ? MAX_CREW : 3})</div>`;

    if (playerCrew.length === 0) {
        listEl.innerHTML += `<div style="padding:10px; color:#666;">No crew assigned. Solo flight operation.</div>`;
        detailEl.innerHTML = `<div style="padding:40px; text-align:center; color:#888;">Crew quarters are empty.</div>`;
        document.getElementById('genericModalActions').innerHTML = `<button class="action-button full-width-btn" onclick="closeGenericModal()">CLOSE</button>`;
        return;
    }

    playerCrew.forEach((crew, index) => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.innerHTML = `<span style="color:var(--text-color); font-weight:bold;">${crew.name}</span> <span style="font-size:10px; color:#888;">${crew.role}</span>`;
        row.onclick = () => {
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <img src="${crew.image || 'assets/default_npc.png'}" style="width:80px; height:80px; object-fit: cover; border-radius:50%; margin-bottom:10px; border: 2px solid ${crew.isLegendary ? 'var(--gold-text)' : 'var(--accent-color)'};">
                    <h3 style="color:var(--text-color); margin:0 0 5px 0;">${crew.name.toUpperCase()}</h3>
                    <div style="color:var(--item-desc-color); font-size:12px; margin-bottom:15px;">${crew.role.toUpperCase()}</div>
                    <p style="font-size:13px; color:var(--text-color); line-height:1.5;">${crew.desc}</p>
                </div>
            `;
            document.getElementById('genericModalActions').innerHTML = `
                <button class="action-button danger-btn" onclick="fireCrew(${index})">DISMISS FROM SERVICE</button>
            `;
        };
        listEl.appendChild(row);
    });
    
    // Auto-click first member
    listEl.children[1].click();
}

function fireCrew(index) {
    const crew = playerCrew[index];
    playerCrew.splice(index, 1);
    
    if (crew.isMercenary) window.hasEclipseMerc = false;
    
    if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
    
    logMessage(`You dismissed ${crew.name} at the nearest port.`);
    if (typeof showToast === 'function') showToast("CREW MEMBER DISMISSED", "info");
    
    if (typeof renderUIStats === 'function') renderUIStats(); 
    displayCrewRoster(); 
}

// ==========================================
// --- ECLIPSE SHADOW MERCENARIES ---
// ==========================================

function hireMercenary(mercId) {
    const merc = ECLIPSE_MERCENARIES.find(m => m.id === mercId);
    if (playerCredits < merc.cost) return;
    
    playerCredits -= merc.cost;
    
    playerCrew.push({
        id: merc.id,
        name: merc.name,
        role: merc.role,
        desc: merc.desc,
        isMercenary: true,
        stats: merc.stats,
        drawback: merc.drawback
    });
    
    applyPlayerShipStats(); 
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("CONTRACT SIGNED", "success");
    
    logMessage(`<span style="color:#DDA0DD">Contract established. ${merc.name} has joined your crew. Keep an eye on your valuables.</span>`);
    
    if (typeof openMercenaryDen === 'function') openMercenaryDen();
    if (typeof renderUIStats === 'function') renderUIStats();
}

// Triggered by the Game Tick Engine periodically
function processMercenaryDrawbacks() {
    if (!playerCrew || playerCrew.length === 0) return;
    
    playerCrew.forEach(crewMember => {
        // Only trigger if they are a Merc and the random roll hits
        if (crewMember.isMercenary && crewMember.drawback && Math.random() < crewMember.drawback.chance) {
            
            if (crewMember.drawback.type === "STEAL_CARGO") {
                const cargoIds = Object.keys(playerCargo).filter(id => playerCargo[id] > 0);
                if (cargoIds.length > 0) {
                    const stolenId = cargoIds[Math.floor(Math.random() * cargoIds.length)];
                    playerCargo[stolenId] -= crewMember.drawback.amount;
                    if (playerCargo[stolenId] <= 0) delete playerCargo[stolenId];
                    
                    const itemName = COMMODITIES[stolenId] ? COMMODITIES[stolenId].name : "Cargo";
                    
                    if (typeof showToast === 'function') showToast(`CARGO MISSING: ${itemName}`, "warning");
                    logMessage(`<span style="color:#FF5555">Inventory discrepancy detected. ${crewMember.drawback.amount}x ${itemName} is missing from the hold. ${crewMember.name} looks suspiciously innocent.</span>`);
                    
                    if (typeof GameBus !== 'undefined') GameBus.emit('CARGO_MODIFIED');
                }
            } 
            else if (crewMember.drawback.type === "STEAL_CREDITS") {
                if (playerCredits >= crewMember.drawback.amount) {
                    playerCredits -= crewMember.drawback.amount;
                    if (typeof showToast === 'function') showToast(`CREDITS SKIMMED: -${crewMember.drawback.amount}c`, "warning");
                    logMessage(`<span style="color:#FF5555">Unauthorized ledger transfer detected. ${crewMember.drawback.amount}c has been siphoned from your account. ${crewMember.name} claims it was a 'routine maintenance fee'.</span>`);
                    
                    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                }
            }
            else if (crewMember.drawback.type === "STEAL_FUEL") {
                if (playerFuel > crewMember.drawback.amount) {
                    playerFuel -= crewMember.drawback.amount;
                    if (typeof showToast === 'function') showToast(`FUEL VENTED: -${crewMember.drawback.amount}`, "warning");
                    logMessage(`<span style="color:#FF5555">Warning: Unscheduled fuel venting detected. ${crewMember.name} says it was necessary to 'prevent a cascade failure.' Sure.</span>`);
                    
                    if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
                }
            }
        }
    });
}
