// ==========================================
// --- WAYFINDER COLONY MANAGEMENT ENGINE ---
// ==========================================

// --- 1. FOUNDING A COLONY ---
function establishColony(locationIndex) {
    if ((playerCargo["COLONY_CHARTER"] || 0) < 1) {
        logMessage("<span style='color:var(--danger)'>You need a Concord Colony Charter to legally claim a world.</span>");
        return;
    }

    const planet = currentSystemData.planets[locationIndex];
    
    // Consume the charter
    playerCargo["COLONY_CHARTER"]--;
    if (playerCargo["COLONY_CHARTER"] <= 0) delete playerCargo["COLONY_CHARTER"];
    updateCurrentCargoLoad();

    // Generate a unique ID based on world coordinates and planet index
    const colId = `${playerX}_${playerY}_p${locationIndex}`;
    
    // Initialize the Colony Object
    playerColonies[colId] = {
        id: colId,
        name: `${planet.biome.name} Prime`,
        x: playerX,
        y: playerY,
        planetIndex: locationIndex,
        established: true,
        phase: 'POPULATED',
        policy: 'BALANCED',
        population: 100,
        morale: 100,
        treasury: 0,
        storage: {},
        biome: planet.biome.name,
        lastTick: currentGameDate
    };

    // Save this state to the world generator so the map remembers it!
    updateWorldState(playerX, playerY, { hasColony: true, colonyId: colId }, colId);

    logMessage(`<span style='color:var(--success); font-weight:bold;'>[ COLONY ESTABLISHED ] Welcome to the frontier.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast("COLONY FOUNDED", "success");
    
    // Close the planet view and immediately open the new management dashboard
    closeGenericModal();
    openColonyManagement(colId);
}

// --- 2. COLONY DASHBOARD UI ---
function openColonyManagement(colonyId) {
    if (!colonyId) {
        const localColonies = Object.values(playerColonies).filter(c => c.x === playerX && c.y === playerY);
        if (localColonies.length === 0) return;
        colonyId = localColonies[0].id; 
    }

    const colony = playerColonies[colonyId];
    if (!colony) return;

    openGenericModal(`COLONY: ${colony.name.toUpperCase()}`);
    
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    let policyColor = "var(--accent-color)";
    if (colony.policy === 'WEALTH') policyColor = "var(--gold-text)";
    if (colony.policy === 'INDUSTRY') policyColor = "var(--success)";
    if (colony.policy === 'MILITIA') policyColor = "var(--danger)";

    listEl.innerHTML = `
        <div style="padding:15px;">
            <div style="text-align:center; margin-bottom: 20px;">
                <div style="font-size:50px; filter: drop-shadow(0 0 15px var(--success)); margin-bottom:10px;">🏙️</div>
                <div style="color:var(--success); font-weight:bold; letter-spacing:2px; font-size:12px;">STATUS: ${colony.phase}</div>
            </div>

            <div class="trade-math-area" style="background: rgba(0,0,0,0.3); border: 1px solid #333; padding: 10px; border-radius: 4px;">
                <div class="trade-stat-row"><span>Population:</span> <span style="color:var(--text-color); font-weight:bold;">${formatNumber(colony.population)}</span></div>
                <div class="trade-stat-row"><span>Morale:</span> <span style="color:${colony.morale >= 50 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">${colony.morale}%</span></div>
                <div class="trade-stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                    <span>Active Directive:</span> 
                    <span style="color:${policyColor}; font-weight:bold;">${colony.policy}</span>
                </div>
            </div>
        </div>
    `;

    let storageHtml = "";
    if (Object.keys(colony.storage).length === 0) {
        storageHtml = "<span style='color:#666;'>Warehouses are currently empty.</span>";
    } else {
        for (const item in colony.storage) {
            const itemName = typeof COMMODITIES !== 'undefined' && COMMODITIES[item] ? COMMODITIES[item].name : item;
            storageHtml += `<span style="display:inline-block; background:rgba(255,255,255,0.1); padding:4px 8px; margin: 2px; border-radius:4px; font-size:11px;">${itemName}: <b style="color:var(--accent-color);">${colony.storage[item]}</b></span>`;
        }
    }

    detailEl.innerHTML = `
        <div style="padding: 20px;">
            <h3 style="color:var(--accent-color); margin:0 0 15px 0;">SETTLEMENT LEDGER</h3>
            
            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--gold-text); padding:15px; border-radius:4px; margin-bottom:20px;">
                <div style="font-size:10px; color:var(--gold-text); letter-spacing:1px; margin-bottom:5px;">TAX VAULT</div>
                <div style="font-size:24px; color:var(--gold-text); font-weight:bold;">${formatNumber(colony.treasury)}c</div>
                <div style="font-size:11px; color:var(--item-desc-color); margin-top:5px;">Taxes accumulate every Stardate. High taxes reduce morale.</div>
            </div>

            <div style="background:rgba(0,0,0,0.5); border:1px solid var(--border-color); padding:15px; border-radius:4px;">
                <div style="font-size:10px; color:var(--accent-color); letter-spacing:1px; margin-bottom:10px;">LOCAL STORAGE & PRODUCTION</div>
                <div>${storageHtml}</div>
            </div>
        </div>
    `;

    actionsEl.innerHTML = `
        <button class="action-button" style="border-color:var(--gold-text); color:var(--gold-text);" onclick="collectColonyTaxes('${colonyId}')">
            WITHDRAW FUNDS
        </button>
        <button class="action-button" onclick="cycleColonyPolicy('${colonyId}')">
            CHANGE DIRECTIVE
        </button>
        <button class="action-button" onclick="closeGenericModal(); handleInteraction();">
            RETURN TO ORBIT
        </button>
    `;
}

// --- 3. COLONY ACTIONS ---
function collectColonyTaxes(colonyId) {
    const colony = playerColonies[colonyId];
    if (!colony || colony.treasury <= 0) {
        if (typeof showToast === 'function') showToast("VAULT EMPTY", "warning");
        return;
    }

    const amount = colony.treasury;
    playerCredits += amount;
    colony.treasury = 0;

    logMessage(`<span style='color:var(--success)'>[ COLONY ] Transferred ${formatNumber(amount)}c from ${colony.name}'s tax vault.</span>`);
    if (typeof soundManager !== 'undefined') soundManager.playBuy();
    if (typeof showToast === 'function') showToast(`COLLECTED ${formatNumber(amount)}c`, "success");
    
    renderUIStats();
    openColonyManagement(colonyId); 
    autoSaveGame();
}

function cycleColonyPolicy(colonyId) {
    const colony = playerColonies[colonyId];
    if (!colony) return;

    const policies = ['BALANCED', 'INDUSTRY', 'WEALTH', 'MILITIA'];
    const currentIndex = policies.indexOf(colony.policy);
    const nextIndex = (currentIndex + 1) % policies.length;
    
    colony.policy = policies[nextIndex];
    
    if (typeof soundManager !== 'undefined') soundManager.playUIHover();
    openColonyManagement(colonyId); 
}

// --- 4. COLONY EVENTS & CRISES ---
const COLONY_EVENTS = [
    {
        id: "PIRATE_RAID",
        title: "COLONY UNDER ATTACK",
        icon: "☠️",
        color: "var(--danger)",
        getText: (colony) => `Emergency hail from ${colony.name}! An Eclipse Cartel raiding party has breached the outer perimeter. The militia is holding them back, but they need immediate support!`,
        choices: [
            {
                label: "WIRE RANSOM FUNDS (5,000c)",
                condition: () => playerCredits >= 5000,
                execute: (colony) => {
                    playerCredits -= 5000;
                    logMessage(`<span style='color:var(--warning)'>[ COLONY ] You wired 5,000c to the raiders. They took the credits and left ${colony.name} alone.</span>`);
                    closeGenericModal();
                }
            },
            {
                label: "IGNORE THE HAIL (Lose Hab Module)",
                condition: () => true,
                execute: (colony) => {
                    if (colony.suppliesDelivered && colony.suppliesDelivered.habModules > 0) colony.suppliesDelivered.habModules--;
                    logMessage(`<span style='color:var(--danger)'>[ COLONY ] The raiders bombarded ${colony.name}, destroying a Habitation Module before Concord authorities arrived.</span>`);
                    closeGenericModal();
                }
            }
        ]
    },
    {
        id: "RESOURCE_BOOM",
        title: "DEEP VEIN DISCOVERED",
        icon: "💎",
        color: "var(--gold-text)",
        getText: (colony) => `Great news from ${colony.name}, Commander! Our automated excavators just broke through into a massive, previously undetected vein of rare materials!`,
        choices: [
            {
                label: "ACKNOWLEDGE (Yield Increased)",
                condition: () => true,
                execute: (colony) => {
                    if (!colony.storage) colony.storage = {};
                    colony.storage['RARE_METALS'] = (colony.storage['RARE_METALS'] || 0) + 15;
                    colony.storage['VOID_CRYSTALS'] = (colony.storage['VOID_CRYSTALS'] || 0) + 2;
                    logMessage(`<span style='color:var(--success)'>[ COLONY ] ${colony.name} successfully extracted the deep vein materials! They are waiting in the colony storage.</span>`);
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    closeGenericModal();
                }
            }
        ]
    },
    {
        id: "MEDICAL_EMERGENCY",
        title: "OUTBREAK DETECTED",
        icon: "☣️",
        color: "var(--success)", 
        getText: (colony) => `Priority alert from ${colony.name}! A dormant, indigenous pathogen has infected the water supply. We desperately need Medical Supplies!`,
        choices: [
            {
                label: "TRANSFER 5 MEDICAL SUPPLIES",
                condition: () => (playerCargo['MEDICAL_SUPPLIES'] || 0) >= 5,
                execute: (colony) => {
                    playerCargo['MEDICAL_SUPPLIES'] -= 5;
                    if (playerCargo['MEDICAL_SUPPLIES'] <= 0) delete playerCargo['MEDICAL_SUPPLIES'];
                    playerXP += 200;
                    logMessage(`<span style='color:var(--success)'>[ COLONY ] You remotely deployed Medical Supplies to ${colony.name}. The outbreak is contained! (+200 XP)</span>`);
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                    if (typeof checkLevelUp === 'function') checkLevelUp();
                    closeGenericModal();
                }
            },
            {
                label: "INITIATE QUARANTINE (Production Halted)",
                condition: () => true,
                execute: (colony) => {
                    colony.quarantined = true; 
                    logMessage(`<span style='color:var(--warning)'>[ COLONY ] You ordered ${colony.name} into strict quarantine. The population will survive, but production will suffer for a time.</span>`);
                    closeGenericModal();
                }
            }
        ]
    }
];

function triggerColonyEvent(colony) {
    const event = COLONY_EVENTS[Math.floor(Math.random() * COLONY_EVENTS.length)];
    
    openGenericModal("INCOMING TRANSMISSION");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = ''; 

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 30px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 20px ${event.color});">${event.icon}</div>
            <h3 style="color:${event.color}; margin-bottom:15px; letter-spacing: 2px;">${event.title}</h3>
            
            <div style="text-align:left; background:rgba(0,0,0,0.5); padding:20px; border-left:3px solid ${event.color}; margin-bottom:15px; border-radius:4px;">
                <p style="color:var(--text-color); font-size:14px; line-height:1.6; margin:0;">
                    ${event.getText(colony)}
                </p>
            </div>
        </div>
    `;

    actionsEl.innerHTML = '';
    
    event.choices.forEach(choice => {
        if (choice.condition()) {
            const btn = document.createElement('button');
            btn.className = 'action-button';
            btn.style.width = '100%';
            btn.style.marginBottom = '10px';
            btn.innerHTML = choice.label;
            
            if (choice.label.includes("Lose") || choice.label.includes("Halted") || choice.label.includes("IGNORE")) {
                btn.style.borderColor = "var(--danger)";
                btn.style.color = "var(--danger)";
            } else if (choice.label.includes("TRANSFER") || choice.label.includes("ACKNOWLEDGE")) {
                btn.style.borderColor = "var(--success)";
                btn.style.color = "var(--success)";
            }

            btn.onclick = () => {
                choice.execute(colony);
                if (typeof renderUIStats === 'function') renderUIStats();
                if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
                if (typeof render === 'function') render();
            };
            actionsEl.appendChild(btn);
        }
    });
    
    if (typeof soundManager !== 'undefined') soundManager.playWarning();
}

// --- 5. COLONY MASTER TICK ENGINE ---
// This hooks seamlessly into your existing Event Bus!
GameBus.on('TICK_PROCESSED', (tick) => {
    if (tick.interrupt) return;

    if (typeof playerColonies !== 'undefined') {
        Object.values(playerColonies).forEach(colony => {
            if (colony.established) {
                if (typeof colony.treasury === 'undefined') colony.treasury = 0;
                if (typeof colony.storage === 'undefined') colony.storage = {};
                if (typeof colony.lastTick === 'undefined') colony.lastTick = currentGameDate;

                // Process updates every 1.0 stardate
                if (currentGameDate - colony.lastTick >= 1.0) {
                    colony.lastTick = currentGameDate;
                    const policy = colony.policy || 'BALANCED';

                    // TAX COLLECTION
                    if ((colony.phase === 'POPULATED' || colony.phase === 'OPERATIONAL') && policy !== 'INDUSTRY') {
                        let taxRate = 0.5; 
                        if (policy === 'WEALTH') {
                            taxRate = 0.75; 
                            colony.morale = Math.max(0, colony.morale - 2); 
                        } else if (colony.morale < 100) {
                            colony.morale = Math.min(100, colony.morale + 1); 
                        }
                        const moraleMult = colony.morale / 100;
                        colony.treasury += Math.floor(colony.population * taxRate * moraleMult);
                    }

                    // RESOURCE PRODUCTION
                    if (colony.phase === 'OPERATIONAL' || colony.phase === 'POPULATED') {
                        const biomeDef = typeof PLANET_BIOMES !== 'undefined' ? PLANET_BIOMES[colony.biome] : null;
                        if (biomeDef && biomeDef.resources && biomeDef.resources.length > 0) {
                            const res = biomeDef.resources[Math.floor(Math.random() * biomeDef.resources.length)];
                            let amount = Math.floor(Math.random() * 3) + 1 + Math.floor(colony.population / 100);
                            if (policy === 'INDUSTRY') amount *= 2; 
                            colony.storage[res] = (colony.storage[res] || 0) + amount;
                        }

                        if (policy === 'MILITIA') {
                            colony.storage['MARINES'] = (colony.storage['MARINES'] || 0) + 1;
                        }
                        
                        // HAULER SPAWN
                        if (Math.random() < 0.005) {
                            const existingHauler = typeof activeNPCs !== 'undefined' ? activeNPCs.find(n => n.isColonyHauler && n.colonyId === colony.id) : null;
                            if (!existingHauler && typeof activeNPCs !== 'undefined') {
                                activeNPCs.push({
                                    x: colony.x, y: colony.y, id: "HAULER_" + Date.now(), name: colony.name + " Transport",
                                    char: "H", color: "var(--success)", state: "TRADE_ROUTE", isColonyHauler: true,
                                    colonyId: colony.id, targetX: 33, targetY: 17 
                                });
                                logMessage(`<span style='color:var(--success)'>[ COLONY ] ${colony.name} has launched a heavy transport bound for Starbase Alpha.</span>`);
                            }
                        }
                    }
                    
                    // RANDOM CRISES
                    if ((colony.phase === 'POPULATED' || colony.phase === 'OPERATIONAL') && Math.random() < 0.0002) {
                        if (typeof triggerColonyEvent === 'function') triggerColonyEvent(colony);
                    }
                }
            }
        });
    }
});
