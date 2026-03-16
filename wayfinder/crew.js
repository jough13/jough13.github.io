// --- CREW RECRUITMENT & MANAGEMENT UI ---
function openRecruitmentBoard() {
        openGenericModal("CANTINA RECRUITMENT"); 

    const listEl = document.getElementById('genericModalList');
    listEl.innerHTML = '';
    document.getElementById('genericDetailContent').innerHTML = '<div style="padding:20px; text-align:center; color:#888; margin-top:20px;">Select a candidate to view their dossier.</div>';
    document.getElementById('genericModalActions').innerHTML = '';

    Object.values(CREW_DATABASE).forEach(crew => {
        // Hide them if they are already on our ship!
        if (playerCrew.find(c => c.id === crew.id)) return; 

        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.innerHTML = `<span>${crew.icon} ${crew.name}</span> <span style="color:var(--gold-text)">${formatNumber(crew.cost)}c</span>`;
        row.onclick = () => showCrewDetails(crew);
        listEl.appendChild(row);
    });

    if (listEl.children.length === 0) {
        listEl.innerHTML = '<div style="padding:15px; color:#666;">No viable candidates currently looking for work here.</div>';
    }
}

function showCrewDetails(crew) {
    document.getElementById('genericDetailContent').innerHTML = `
        <div style="text-align:center; padding: 15px;">
            <div style="font-size:50px; margin-bottom:10px;">${crew.icon}</div>
            <h3 style="color:var(--accent-color); margin:0;">${crew.name.toUpperCase()}</h3>
            <div style="color:var(--item-desc-color); font-size:12px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">${crew.role.toUpperCase()}</div>
            <p style="font-size:13px; color:var(--text-color); line-height: 1.5;">${crew.desc}</p>
            <div style="margin-top:20px; font-weight:bold; color:var(--gold-text); background:rgba(255,215,0,0.1); padding:10px; border-radius:4px; border:1px solid #886600;">SIGNING BONUS: ${formatNumber(crew.cost)}c</div>
        </div>
    `;

    const canAfford = playerCredits >= crew.cost;
    const hasSpace = playerCrew.length < MAX_CREW;
    
    let btnText = `HIRE ${crew.name.toUpperCase()}`;
    if (!canAfford) btnText = "INSUFFICIENT FUNDS";
    if (!hasSpace) btnText = "CREW QUARTERS FULL";

    document.getElementById('genericModalActions').innerHTML = `
        <button class="action-button" ${(!canAfford || !hasSpace) ? 'disabled' : ''} onclick="hireCrew('${crew.id}')">${btnText}</button>
    `;
}

function hireCrew(crewId) {
    const crew = CREW_DATABASE[crewId];
    if (playerCredits >= crew.cost && playerCrew.length < MAX_CREW) {
        playerCredits -= crew.cost;
        playerCrew.push(crew);
        logMessage(`<span style="color:var(--success)">Recruited ${crew.name} to the crew!</span>`);
        if (typeof soundManager !== 'undefined') soundManager.playAbilityActivate();
        showToast(`${crew.name} HIRED`, "success");
        renderUIStats();
        openRecruitmentBoard(); // Refresh list to remove them
    }
}

function displayCrewRoster() {
    // Hide the system menu so it doesn't overlap the new window
    document.getElementById('systemMenu').classList.add('hidden');
    openGenericModal("CREW MANIFEST");

    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    
    detailEl.innerHTML = `<div style="padding:20px; text-align:center; color:#888; margin-top:20px;">Select a crew member to review their assignment or dismiss them.</div>`;
    document.getElementById('genericModalActions').innerHTML = '';
    
    listEl.innerHTML = `<div class="trade-list-header" style="color:var(--accent-color); font-size:10px; letter-spacing:2px; margin-bottom:10px; border-bottom:1px solid #333;">ASSIGNED CREW (${playerCrew.length}/${MAX_CREW})</div>`;

    if (playerCrew.length === 0) {
        listEl.innerHTML += `<div style="padding:10px; color:#666;">No crew assigned. Solo flight operation.</div>`;
        return;
    }

    playerCrew.forEach(crew => {
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        row.innerHTML = `<span>${crew.icon} ${crew.name}</span> <span style="font-size:10px; color:#888;">${crew.role}</span>`;
        row.onclick = () => {
            document.querySelectorAll('.generic-list-item').forEach(el => el.classList.remove('active'));
            row.classList.add('active');
            
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <img src="${crew.image}" alt="${crew.name}" style="width:80px; height:80px; object-fit: cover; object-position: top; border-radius:50%; margin-bottom:10px; border: 2px solid var(--accent-color);">
                    
                    <h3 style="color:var(--text-color); margin:0 0 5px 0; font-size:20px;">${crew.name.toUpperCase()}</h3>
                    <div style="color:var(--item-desc-color); font-size:12px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">${crew.role.toUpperCase()}</div>
                    <p style="font-size:13px; color:var(--text-color); line-height:1.5;">${crew.desc}</p>
                </div>
            `;
            document.getElementById('genericModalActions').innerHTML = `
                <button class="action-button danger-btn" onclick="fireCrew('${crew.id}')">DISMISS FROM SERVICE</button>
            `;
        };
        listEl.appendChild(row);
    });
}

function fireCrew(crewId) {
    const crew = playerCrew.find(c => c.id === crewId);
    playerCrew = playerCrew.filter(c => c.id !== crewId);
    logMessage(`You dismissed ${crew.name} at the nearest port.`);
    showToast("CREW MEMBER DISMISSED", "info");
    displayCrewRoster(); // Refresh screen
}

// ==========================================
// --- ECLIPSE MERCENARY DEN ---
// ==========================================

function openMercenaryDen() {
    openGenericModal("THE SHADOW NETWORK");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // 1. Default Landing Screen
    detailEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <div style="font-size:60px; margin-bottom:15px; color:#9933FF; filter: drop-shadow(0 0 10px rgba(153, 51, 255, 0.4));">💀</div>
            <h3 style="color:#DDA0DD; margin-bottom:10px;">MERCENARY CONTRACTS</h3>
            <p style="color:var(--item-desc-color); font-size:12px; line-height: 1.5;">These freelancers operate far outside Concord law. They bring unparalleled expertise to your vessel, but their loyalty only goes as far as their next payout. Watch your back... and your cargo bay.</p>
        </div>
    `;
    listEl.innerHTML = '';
    actionsEl.innerHTML = '';

    // 2. Populate the Roster
    ECLIPSE_MERCENARIES.forEach(merc => {
        // Check if player already hired them
        const isHired = playerCrew.some(c => c.id === merc.id);
        const row = document.createElement('div');
        row.className = 'trade-item-row';
        
        if (isHired) {
            row.style.opacity = '0.4';
            row.innerHTML = `<span style="color:var(--success); font-weight:bold;">${merc.name}</span> <span style="color:var(--item-desc-color); font-size:10px;">ON PAYROLL</span>`;
            row.onclick = () => {
                detailEl.innerHTML = `<div style="text-align:center; padding:30px;"><div style="font-size:50px; margin-bottom:15px;">✅</div><h3 style="color:var(--success);">ALREADY CONTRACTED</h3></div>`;
                actionsEl.innerHTML = '';
            };
        } else {
            row.innerHTML = `<span style="color:#DDA0DD; font-weight:bold;">${merc.name}</span> <span style="color:var(--gold-text)">${formatNumber(merc.cost)}c</span>`;
            row.onclick = () => showMercenaryDetails(merc);
        }
        listEl.appendChild(row);
    });
}

function showMercenaryDetails(merc) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // Format the stat bonuses nicely
    let statText = "";
    if (merc.stats.damageBonus) statText += `<span style="color:var(--danger)">+${merc.stats.damageBonus} Weapon Damage</span><br>`;
    if (merc.stats.evasionBonus) statText += `<span style="color:var(--warning)">+${merc.stats.evasionBonus * 100}% Base Evasion</span><br>`;
    if (merc.stats.hullBonus) statText += `<span style="color:var(--success)">+${merc.stats.hullBonus} Max Hull</span><br>`;

    // Format the nasty drawbacks
    let drawbackText = "";
    if (merc.drawback.type === "STEAL_CARGO") drawbackText = `High risk of missing cargo (${merc.drawback.chance * 100}% chance per jump).`;
    if (merc.drawback.type === "STEAL_CREDITS") drawbackText = `High risk of credit skimming (${merc.drawback.chance * 100}% chance per jump).`;
    if (merc.drawback.type === "STEAL_FUEL") drawbackText = `High risk of fuel venting (${merc.drawback.chance * 100}% chance per jump).`;

    detailEl.innerHTML = `
        <div style="padding: 15px; text-align: center; border: 1px solid #9933FF; background: #020005; border-radius: 4px; box-shadow: inset 0 0 20px rgba(153, 51, 255, 0.1);">
            <h3 style="color:#DDA0DD; margin-top:0; margin-bottom: 5px; text-transform:uppercase;">${merc.name}</h3>
            <div style="color:#888; font-size:11px; margin-bottom:15px; letter-spacing:1px;">ROLE: ${merc.role.toUpperCase()}</div>
            
            <p style="font-size:13px; color:var(--text-color); margin-bottom: 20px; line-height: 1.5; text-align:left;">${merc.desc}</p>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px; text-align:left; background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid #333;">
                <div>
                    <span style="font-size:10px; color:var(--accent-color); display:block; margin-bottom:5px;">COMBAT BONUS</span>
                    <div style="font-size:12px; font-weight:bold;">${statText}</div>
                </div>
                <div>
                    <span style="font-size:10px; color:#FF5555; display:block; margin-bottom:5px;">KNOWN RISK</span>
                    <div style="font-size:12px; color:#FF5555; font-style:italic;">${drawbackText}</div>
                </div>
            </div>
            
            <div style="text-align:left; border-top:1px dashed #9933FF; padding-top:10px; font-weight:bold;">
                <span style="color:#DDA0DD;">UPFRONT FEE:</span> <span style="color:var(--gold-text); float:right;">${formatNumber(merc.cost)}c</span>
            </div>
        </div>
    `;

    if (playerCredits < merc.cost) {
        actionsEl.innerHTML = `<button class="action-button" disabled>INSUFFICIENT FUNDS</button>`;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 15px rgba(153, 51, 255, 0.3);" onclick="hireMercenary('${merc.id}')">
                AUTHORIZE CONTRACT
            </button>
        `;
    }
}

function hireMercenary(mercId) {
    const merc = ECLIPSE_MERCENARIES.find(m => m.id === mercId);
    if (playerCredits < merc.cost) return;
    
    playerCredits -= merc.cost;
    
    // Add them to your existing crew structure flawlessly
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
    
    openMercenaryDen(); // Refresh the screen
    renderUIStats();
}

// Call this function every time the player moves to a new sector/tile!
function processMercenaryDrawbacks() {
    if (!playerCrew || playerCrew.length === 0) return;
    
    playerCrew.forEach(crewMember => {
        // Only trigger if they are a Merc and the random roll hits
        if (crewMember.isMercenary && crewMember.drawback && Math.random() < crewMember.drawback.chance) {
            
            if (crewMember.drawback.type === "STEAL_CARGO") {
                // Find a random cargo item the player currently owns
                const cargoIds = Object.keys(playerCargo).filter(id => playerCargo[id] > 0);
                if (cargoIds.length > 0) {
                    const stolenId = cargoIds[Math.floor(Math.random() * cargoIds.length)];
                    playerCargo[stolenId] -= crewMember.drawback.amount;
                    if (playerCargo[stolenId] <= 0) delete playerCargo[stolenId];
                    
                    const itemName = COMMODITIES[stolenId] ? COMMODITIES[stolenId].name : "Cargo";
                    
                    if (typeof showToast === 'function') showToast(`CARGO MISSING: ${itemName}`, "warning");
                    logMessage(`<span style="color:#FF5555">Inventory discrepancy detected. ${crewMember.drawback.amount}x ${itemName} is missing from the hold. ${crewMember.name} looks suspiciously innocent.</span>`);
                    
                    // Trigger your existing Event Bus
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

function showStandardCrewDetails(crew) {
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    detailEl.innerHTML = `
        <div style="padding: 15px; text-align: center; border: 1px solid var(--accent-color); background: rgba(0,224,224,0.05); border-radius: 4px;">
            <div style="font-size:40px; margin-bottom:10px;">${crew.icon}</div>
            <h3 style="color:var(--accent-color); margin-top:0; margin-bottom: 5px; text-transform:uppercase;">${crew.name}</h3>
            <div style="color:#888; font-size:11px; margin-bottom:15px; letter-spacing:1px;">ROLE: ${crew.role.toUpperCase()}</div>
            
            <p style="font-size:13px; color:var(--text-color); margin-bottom: 20px; line-height: 1.5; text-align:left;">${crew.desc}</p>
            
            <div style="background:rgba(0,0,0,0.5); padding:10px; border-radius:4px; border:1px solid #333; text-align:left;">
                <span style="font-size:10px; color:var(--success); display:block; margin-bottom:5px;">GUARANTEED PERK</span>
                <div style="font-size:12px; font-weight:bold; color:var(--text-color);">${crew.perk.replace('_', ' ')}</div>
            </div>
            
            <div style="text-align:left; border-top:1px dashed var(--accent-color); padding-top:10px; margin-top:15px; font-weight:bold;">
                <span style="color:var(--text-color);">HIRING BONUS:</span> <span style="color:var(--gold-text); float:right;">${formatNumber(crew.cost)}c</span>
            </div>
        </div>
    `;

    if (playerCrew.length >= MAX_CREW) {
        actionsEl.innerHTML = `<button class="action-button danger-btn" disabled>CREW QUARTERS FULL</button>`;
    } else if (playerCredits < crew.cost) {
        actionsEl.innerHTML = `<button class="action-button" disabled>INSUFFICIENT FUNDS</button>`;
    } else {
        actionsEl.innerHTML = `
            <button class="action-button" style="border-color:#9933FF; color:#DDA0DD; box-shadow: 0 0 15px rgba(153, 51, 255, 0.3);" onclick="hireMercenary('${merc.id}')">
                AUTHORIZE CONTRACT
            </button>
        `;
    }
}

function hireStandardCrew(crewId) {
    const crew = CREW_DATABASE[crewId];
    if (playerCredits < crew.cost || playerCrew.length >= MAX_CREW) return;
    
    playerCredits -= crew.cost;
    
    // Add them to the universal roster!
    playerCrew.push({
        id: crew.id,
        name: crew.name,
        role: crew.role,
        desc: crew.desc,
        icon: crew.icon,
        isMercenary: false, // Flag them as SAFE
        perk: crew.perk
    });
    
    applyPlayerShipStats(); 
    
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("CREW HIRED", "success");
    logMessage(`<span style="color:var(--success)">${crew.name} has joined your crew!</span>`);
    
    openRecruitmentBoard(); 
    renderUIStats();
}

function openJobBoard() {
    // Generate fresh recruits if the board is empty
    if (currentStationRecruits.length === 0) {
        if (typeof generateRecruits === 'function') generateRecruits();
    }
    
    openGenericModal("LOCAL JOB BOARD");
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');
    
    // --- 1. BRIDGE TO YOUR EXISTING MISSION SYSTEM ---
    listEl.innerHTML = `
        <div style="padding: 15px; border-bottom: 2px solid var(--accent-color); background: rgba(0, 224, 224, 0.05);">
            <button class="action-button" onclick="displayMissionBoard()" style="width: 100%; border-color: var(--accent-color); color: var(--accent-color);">
                📜 VIEW LOCAL CONTRACTS
            </button>
            <div style="font-size:10px; color:var(--item-desc-color); text-align:center; margin-top:5px;">
                Find cargo runs, courier jobs, and station deliveries.
            </div>
        </div>
        <div style="padding: 10px 15px; font-size: 11px; color: var(--item-desc-color); letter-spacing: 2px; text-align: center; background: var(--panel-bg);">
            --- FREELANCERS FOR HIRE ---
        </div>
    `;

    // --- 2. RENDER PROCEDURAL CREW ---
    currentStationRecruits.forEach(recruit => {
        const row = document.createElement('div');
        row.className = 'generic-list-item';
        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="color:var(--text-color);">${recruit.name}</strong>
                <span style="color:var(--success); font-size:12px;">${formatNumber(recruit.cost)}c</span>
            </div>
            <div style="color:var(--item-desc-color); font-size:11px; margin-top:4px;">${recruit.role}</div>
        `;
        
        row.onclick = () => {
            document.querySelectorAll('.generic-list-item').forEach(el => el.classList.remove('active'));
            row.classList.add('active');
            
            if (typeof soundManager !== 'undefined' && soundManager.playUIHover) soundManager.playUIHover();
            
            detailEl.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <img src="${recruit.image}" alt="${recruit.role}" style="width:100px; height:100px; object-fit: cover; object-position: top; border-radius:50%; margin-bottom:15px; border: 2px solid var(--accent-color);">
                    
                    <h3 style="color:var(--text-color); margin:0 0 5px 0; font-size:24px; text-transform:uppercase;">${recruit.name}</h3>
                    <div style="color:var(--item-desc-color); letter-spacing: 2px; margin-bottom: 20px;">SPECIALTY: ${recruit.role.toUpperCase()}</div>
                    
                    <div style="text-align:left; background: var(--bg-color); border: 1px solid var(--border-color); padding: 15px; border-radius: 4px;">
                        <span style="font-size:10px; color:var(--accent-color); display:block; margin-bottom:5px;">SIGNING BONUS (COST)</span>
                        <div style="font-size:18px; font-weight:bold; color:var(--success); margin-bottom:15px;">${formatNumber(recruit.cost)}c</div>
                        
                        <span style="font-size:10px; color:var(--accent-color); display:block; margin-bottom:5px;">SERVICE PERK</span>
                        <p style="font-size:13px; color:var(--text-color); line-height:1.4; margin:0;">
                            <strong>[${recruit.perk}]</strong><br>
                            ${recruit.desc}
                        </p>
                    </div>
                </div>
            `;
            
            // --- THE FIX: Render Hire Button AND Escape Hatch ---
            actionsEl.innerHTML = `
                <button class="action-button" onclick="hireCrewMember('${recruit.id}')" style="border-color:var(--success); color:var(--success);">
                    SIGN CONTRACT (${formatNumber(recruit.cost)}c)
                </button>
                <button class="action-button" onclick="openStationView()" style="margin-top: 10px;">
                    BACK TO CONCOURSE
                </button>
            `;
        };
        listEl.appendChild(row);
    });
    
    // Auto-click the first recruit if available
    if (currentStationRecruits.length > 0) {
        listEl.children[2].click(); // Skip the contract bridge header
    } else {
        detailEl.innerHTML = `<div style="padding:40px 20px; text-align:center; color:var(--item-desc-color);">No freelancers currently seeking a ship.</div>`;
    }

    // --- Default exit button in case no recruits are selected ---
    if (currentStationRecruits.length === 0) {
        actionsEl.innerHTML = `
            <button class="action-button" onclick="openStationView()">BACK TO CONCOURSE</button>
        `;
    }
}

function hireCrewMember(recruitId) {
    const maxCrewSize = 4; // You can tie this to ship stats later!
    
    if (playerCrew.length >= maxCrewSize) {
        if (typeof showToast === 'function') showToast("CREW QUARTERS FULL", "error");
        return;
    }

    const recruitIndex = currentStationRecruits.findIndex(r => r.id === recruitId);
    if (recruitIndex > -1) {
        const recruit = currentStationRecruits[recruitIndex];
        
        if (playerCredits >= recruit.cost) {
            playerCredits -= recruit.cost;
            playerCrew.push(recruit);
            
            // Remove them from the job board
            currentStationRecruits.splice(recruitIndex, 1);
            
            if (typeof showToast === 'function') showToast(`${recruit.name.toUpperCase()} HIRED`, "success");
            logMessage(`<span style="color:var(--success);">Welcome aboard.</span> ${recruit.name} (${recruit.role}) joined your crew.`);
            if (typeof soundManager !== 'undefined' && soundManager.playBuy) soundManager.playBuy();
            if (typeof renderUIStats === 'function') renderUIStats();
            
            // Refresh the board
            openJobBoard(); 
        } else {
            if (typeof showToast === 'function') showToast("INSUFFICIENT FUNDS", "error");
        }
    }
}

// ==========================================
// --- CREW ROSTER & RECRUITMENT ---
// ==========================================

// Ensure the player has a crew array
if (typeof playerCrew === 'undefined') {
    window.playerCrew = [];
}

// Helper function for your combat and exploration engines to check for buffs!
function hasCrewPerk(perkName) {
    if (!playerCrew) return false;
    return playerCrew.some(crew => crew.perk === perkName);
}

function generateRecruits() {
    currentStationRecruits = [];
    const numRecruits = Math.floor(Math.random() * 3) + 1; // 1 to 3 recruits per station
    
    // --- TIER 1: STANDARD PROCEDURAL CREW ---
    const firstNames = ["Jax", "Elara", "Odin", "Nyx", "Garrus", "Sasha", "Vane", "Silas", "Kira", "Rook"];
    const lastNames = ["Vance", "Karn", "Trex", "Valerius", "Thorne", "Graves", "Black", "Kryik"];
    
    const standardRoles = [
        { 
            role: "Gunner", perk: "COMBAT_DAMAGE", 
            desc: "Increases ship weapon damage by 15%.", 
            baseCost: 300, image: "assets/gunner.png" 
        },
        { 
            role: "Engineer", perk: "REPAIR_EFFICIENCY", 
            desc: "Reduces hull repair costs by 20%.", 
            baseCost: 400, image: "assets/engineer.png" // --- UPDATED ASSET ---
        },
        { 
            role: "Navigator", perk: "FUEL_EFFICIENCY", 
            desc: "Reduces fuel consumption during hyper-jumps.", 
            baseCost: 350, image: "assets/default_npc.png" 
        },
        { 
            role: "Hazard Specialist", perk: "RAD_SHIELDING", 
            desc: "Expert in ionizing radiation. Prevents hull damage when scooping O & B class stars.", 
            baseCost: 600, image: "assets/default_npc.png" 
        },
        // --- NEW: SCIENTIST ---
        { 
            role: "Scientist", perk: "ASTROMETRICS", 
            desc: "Improves deep space scanning. Grants bonus XP when discovering new phenomena.", 
            baseCost: 450, image: "assets/scientist.png" 
        },
        // --- NEW: ECLIPSE SMUGGLER ---
        { 
            role: "Eclipse Smuggler", perk: "SHADOW_NETWORK", 
            desc: "A connected operative. Increases payouts for illegal cargo delivery by 20%.", 
            baseCost: 700, image: "assets/eclipse_smuggler.png" 
        }
    ];

    // --- TIER 2: LEGENDARY SPECIALISTS ---
    // These are unique heroes. If you want a custom portrait, name it after them in your assets folder!
    const legendaryRecruits = [
        { 
            id: "LEGEND_ELARA", name: "Elara 'Ghost' Vance", role: "Master Infiltrator", 
            perk: "STEALTH_DRIVE", desc: "Reduces pirate ambush chance by 90%.", 
            baseCost: 5000, image: "assets/legend_elara.png", isLegendary: true 
        },
        { 
            id: "LEGEND_KAELEN", name: "Kaelen the Butcher", role: "K'tharr Warlord", 
            perk: "PIRATE_TERROR", desc: "Increases combat damage by a massive 35%.", 
            baseCost: 7500, image: "assets/legend_kaelen.png", isLegendary: true 
        },
        { 
            id: "LEGEND_CORTEX", name: "Unit-04 'Cortex'", role: "AI Navigator", 
            perk: "QUANTUM_PATHING", desc: "Reveals the entire sector map upon entering a new system.", 
            baseCost: 10000, image: "assets/legend_cortex.png", isLegendary: true 
        }
    ];

    for (let i = 0; i < numRecruits; i++) {
        // 15% chance to spawn a Legendary recruit
        if (Math.random() < 0.15) {
            const legend = legendaryRecruits[Math.floor(Math.random() * legendaryRecruits.length)];
            
            // Check if we already hired them, or if they are already on the board this roll!
            const alreadyHired = playerCrew.some(c => c.id === legend.id);
            const alreadyOnBoard = currentStationRecruits.some(c => c.id === legend.id);
            
            if (!alreadyHired && !alreadyOnBoard) {
                currentStationRecruits.push({
                    ...legend, 
                    cost: legend.baseCost // Static cost for legendaries
                });
                continue; // Skip the standard generation for this slot
            }
        }

        // Fallback to Tier 1 Standard Recruit
        const roleData = standardRoles[Math.floor(Math.random() * standardRoles.length)];
        currentStationRecruits.push({
            // Added random entropy to prevent duplicate Crew IDs
            id: `CREW_${Date.now()}_${Math.floor(Math.random() * 100000)}_${i}`,
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            role: roleData.role,
            perk: roleData.perk,
            desc: roleData.desc,
            cost: roleData.baseCost + Math.floor(Math.random() * 200),
            
            // --- PULL THE SPECIFIC IMAGE ---
            image: roleData.image, 
            
            isLegendary: false
        });
    }
}
