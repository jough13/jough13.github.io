// ==========================================
// --- WAYFINDER BACKGROUND SIMULATIONS ---
// ==========================================

let lastPayday = 0;
const PAYDAY_INTERVAL = 30.0; // Pay crew every 30 Stardates
const COST_PER_CREW = 250;    // 250c per crew member

// ==========================================
// --- UNIFIED ENTITY MANAGER ---
// ==========================================

const EntityManager = {
    entities: [],
    
    add: function(entity) {
        if (!entity.id) entity.id = "ENT_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        this.entities.push(entity);
        return entity;
    },
    
    remove: function(id) {
        this.entities = this.entities.filter(e => e.id !== id);
    },
    
    clear: function() { this.entities = []; },
    
    // --- THE NATIVE ECS TICK ENGINE ---
    tick: function(isMovement) {
        // Loop backwards to safely remove entities that expire or get destroyed
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            
            // SYSTEM 1: Unidentified Signal Sources (USS)
            if (entity.isUSS) {
                if (isMovement) entity.lifespan--;
                if (entity.x === playerX && entity.y === playerY) {
                    this.entities.splice(i, 1);
                    if (typeof resolveUSSEncounter === 'function') resolveUSSEncounter();
                } else if (entity.lifespan <= 0) {
                    this.entities.splice(i, 1);
                }
            }
            
            // SYSTEM 2: Comets (Migrated!)
            if (entity.isComet && isMovement) {
                // Move the comet
                entity.x += entity.vx; 
                entity.y += entity.vy;
                if (typeof spawnParticles === 'function') spawnParticles(entity.x, entity.y, 'thruster', { x: -entity.vx, y: -entity.vy });

                // Did it hit the player?
                if (entity.x === playerX && entity.y === playerY) {
                    const ice = 5 + Math.floor(Math.random() * 10);
                    const rare = Math.floor(Math.random() * 3); 
                    playerCargo['HYDROGEN_3'] = (playerCargo['HYDROGEN_3'] || 0) + ice;
                    if (rare > 0) playerCargo['VOID_CRYSTALS'] = (playerCargo['VOID_CRYSTALS'] || 0) + rare;
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                    
                    let lootMsg = `<span style='color:var(--accent-color); font-weight:bold;'>[ COMET INTERCEPTED ]</span> Harvested ${ice}x Hydrogen-3`;
                    if (rare > 0) lootMsg += ` and ${rare}x Void Crystals!`;
                    logMessage(lootMsg);
                    if (typeof showToast === 'function') showToast("COMET HARVESTED", "success");
                    if (typeof soundManager !== 'undefined') soundManager.playGain();
                    
                    this.entities.splice(i, 1); // Destroy the comet
                } else {
                    // Despawn if it flew too far off-screen
                    const cDist = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
                    if (typeof VIEWPORT_WIDTH_TILES !== 'undefined' && cDist > VIEWPORT_WIDTH_TILES * 1.5) {
                        this.entities.splice(i, 1);
                    }
                }
            }
            // SYSTEM 3: Ambient NPCs & Traffic
            if (entity.isNPC && isMovement) {
                // Initialize State Machine if they don't have one
                if (!entity.state) {
                    entity.state = 'CRUISING';
                    entity.vx = 0; entity.vy = 0;
                    entity.stepsRemaining = 0;
                }

                // A. DOCKED STATE
                if (entity.state === 'DOCKED') {
                    entity.dockTimer--;
                    if (entity.dockTimer <= 0) {
                        entity.state = 'CRUISING';
                        entity.stepsRemaining = Math.floor(Math.random() * 15) + 10;
                        do {
                            entity.vx = Math.floor(Math.random() * 3) - 1;
                            entity.vy = Math.floor(Math.random() * 3) - 1;
                        } while (entity.vx === 0 && entity.vy === 0);
                    }
                }
                // B. DOCKING STATE
                else if (entity.state === 'DOCKING') {
                    if (entity.x < entity.targetX) entity.x++; else if (entity.x > entity.targetX) entity.x--;
                    if (entity.y < entity.targetY) entity.y++; else if (entity.y > entity.targetY) entity.y--;

                    if (entity.x === entity.targetX && entity.y === entity.targetY) {
                        entity.state = 'DOCKED';
                        entity.dockTimer = 20;
                    }
                }
                // B.5 RESCUE STATE
                else if (entity.state === 'RESCUE') {
                    for (let step = 0; step < 2; step++) {
                        if (entity.x < playerX) entity.x++; else if (entity.x > playerX) entity.x--;
                        if (entity.y < playerY) entity.y++; else if (entity.y > playerY) entity.y--;
                        if (entity.x === playerX && entity.y === playerY) break;
                    }
                }
                // B.75 HAULER STATE
                else if (entity.state === 'TRADE_ROUTE') {
                    if (entity.x < entity.targetX) entity.x++; else if (entity.x > entity.targetX) entity.x--;
                    if (entity.y < entity.targetY) entity.y++; else if (entity.y > entity.targetY) entity.y--;

                    if (entity.x === entity.targetX && entity.y === entity.targetY) {
                        const payout = 5000 + Math.floor(Math.random() * 5000);
                        playerCredits += payout;
                        logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ TRADE ROUTE ] ${entity.name} safely arrived! Earned ${formatNumber(payout)}c.</span>`);
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                        if (typeof renderUIStats === 'function') renderUIStats();
                        this.entities.splice(i, 1); continue;
                    }

                    const pirate = activeEnemies.find(e => e.x === entity.x && e.y === entity.y) || this.entities.find(e => e.isHostile && e.x === entity.x && e.y === entity.y);
                    if (pirate) {
                        logMessage(`<span style='color:var(--danger); font-weight:bold;'>[ TRADE ROUTE ] ${entity.name} was destroyed by pirates! Cargo lost.</span>`);
                        if (typeof soundManager !== 'undefined') soundManager.playExplosion();
                        this.entities.splice(i, 1); continue;
                    }
                }
                // C. CRUISING STATE
                else if (entity.state === 'CRUISING') {
                    if (Math.random() >= 0.30) {
                        if (Math.random() < 0.10) {
                            let foundStation = false;
                            for (let dy = -3; dy <= 3; dy++) {
                                for (let dx = -3; dx <= 3; dx++) {
                                    const tile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(entity.x + dx, entity.y + dy) : null;
                                    const char = typeof getTileChar === 'function' ? getTileChar(tile) : '.';
                                    
                                    if (char === STARBASE_CHAR_VAL || char === OUTPOST_CHAR_VAL) {
                                        entity.state = 'DOCKING';
                                        entity.targetX = entity.x + dx;
                                        entity.targetY = entity.y + dy;
                                        foundStation = true; break;
                                    }
                                }
                                if (foundStation) break;
                            }
                            if (!foundStation) {
                                if (entity.stepsRemaining <= 0) {
                                    entity.stepsRemaining = Math.floor(Math.random() * 15) + 5; 
                                    do {
                                        entity.vx = Math.floor(Math.random() * 3) - 1;
                                        entity.vy = Math.floor(Math.random() * 3) - 1;
                                    } while (entity.vx === 0 && entity.vy === 0);
                                }
                                entity.x += entity.vx; entity.y += entity.vy; entity.stepsRemaining--;
                            }
                        } else {
                            if (entity.stepsRemaining <= 0) {
                                entity.stepsRemaining = Math.floor(Math.random() * 15) + 5; 
                                do {
                                    entity.vx = Math.floor(Math.random() * 3) - 1;
                                    entity.vy = Math.floor(Math.random() * 3) - 1;
                                } while (entity.vx === 0 && entity.vy === 0);
                            }
                            entity.x += entity.vx; entity.y += entity.vy; entity.stepsRemaining--;
                        }
                    }
                }

                // DESPAWN, HAILING, & COLLISIONS
                const dist = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
                
                if (dist > VIEWPORT_WIDTH_TILES && !entity.isColonyHauler) {
                    this.entities.splice(i, 1); continue;
                }

                if (dist > 0 && dist <= 3 && Math.random() < 0.15) {
                    if (entity.hails && entity.hails.length > 0) {
                        const randomHail = entity.hails[Math.floor(Math.random() * entity.hails.length)];
                        logMessage(`<span style="color:${entity.color || '#fff'}">[COMMS] ${entity.name}: "${randomHail}"</span>`);
                    }
                }
                
                if (entity.x === playerX && entity.y === playerY) {
                    if (entity.isFuelRat) {
                        this.entities.splice(i, 1);
                        executeRescueSequence();
                        continue;
                    } else {
                        if (typeof interactWithNPC === 'function') interactWithNPC(entity);
                    }
                }
            }
        }
    }
};

// ==========================================
// --- 1. EVENT FUNCTIONS ---
// ==========================================

function triggerNebulaEvent() {
    const events = [
        { type: "ION_STORM", msg: "<span style='color:var(--warning)'>[ ION STORM ]</span> Lightning arcs across the nebula! Shields drained.", fx: () => { playerShields = 0; if(typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED'); } },
        { type: "NURSERY", msg: "<span style='color:var(--success)'>[ STELLAR NURSERY ]</span> Your sensors capture a protostar igniting. (+100 XP)", fx: () => { playerXP += 100; if (typeof checkLevelUp === 'function') checkLevelUp(); } },
        { type: "PLASMA_EDDY", msg: "<span style='color:var(--accent-color)'>[ PLASMA EDDY ]</span> You fly through a pocket of volatile gas. Fuel tanks overcharged!", fx: () => { playerFuel = Math.floor(MAX_FUEL * 1.5); } },
        { type: "SENSOR_GHOSTS", msg: "<span style='color:#9933FF'>[ SENSOR GHOSTS ]</span> The nebula gas creates false radar signatures. Your targeting computer is confused.", fx: () => {} }
    ];
    
    const ev = events[Math.floor(Math.random() * events.length)];
    logMessage(ev.msg);
    ev.fx();
    if (typeof renderUIStats === 'function') renderUIStats();
}

function triggerRandomEncounter() {
    // Grab all available encounters from the database
    const keys = Object.keys(ENCOUNTER_DATABASE);
    if (keys.length === 0) return;
    
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const encounter = ENCOUNTER_DATABASE[randomKey];
    
    // Save the active context so it can be reloaded from a save file if needed!
    currentEncounterContext = encounter.id;

    // Lock the modal if this is a pirate or inescapable event!
    window.activeHostileEncounter = encounter.id.includes('PIRATE') || encounter.id === 'SPATIAL_ANOMALY';

    openGenericModal("DEEP SPACE SENSOR CONTACT");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // --- 📡 CUSTOM SENSOR FLAVOR TEXT FOR LEFT PANEL ---
    if (listEl) {
        // Generate consistent "random" numbers based on location and title
        const pseudoRandom = Math.abs((playerX * 7) ^ (playerY * 13) ^ (encounter.title.length * 5));
        let customListHtml = '';

        // Check if this is the Binary Star Merger
        if (encounter.title && encounter.title.toUpperCase().includes('BINARY STAR MERGER')) {
            const gravShear = (pseudoRandom % 900) + 100;
            const thermalFlux = ((pseudoRandom % 8) + 1) + "e28 W/m²";
            
            customListHtml = `
                <div style="padding:15px; border-bottom:1px solid var(--border-color);">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">LONG RANGE TELEMETRY</div>
                    <h4 style="color:#FF6600; margin:0; text-transform:uppercase; font-size:14px;">${encounter.title}</h4>
                    <div style="font-size:12px; color:var(--text-color); margin-top:10px; line-height: 1.8;">
                        • Gravimetric Shear: <span style="color:var(--danger)">${gravShear} m/s²</span><br>
                        • Stellar Class: <span style="color:#4488FF">Type-M Binary</span><br>
                        • Thermal Flux: ${thermalFlux}
                    </div>
                </div>
                <div style="padding:15px;">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">THREAT ANALYSIS</div>
                    <div style="font-size:12px; color:var(--text-color); margin-top:5px; line-height: 1.8;">
                        <span style="color:var(--danger)">[ STATUS ]</span> Collapsing<br>
                        <span style="color:var(--danger)">[ HAZARD ]</span> Catastrophic<br>
                        <span style="color:var(--warning)">[ TARGET ]</span> Evacuate
                    </div>
                </div>
            `;
        } else {
            // Default generic sensor text for all other encounters
            const distance = (pseudoRandom % 40) + 10;
            const radLevel = (pseudoRandom % 300) + 15;
            const sigStrength = (pseudoRandom % 90) + 10;

            customListHtml = `
                <div style="padding:15px; border-bottom:1px solid var(--border-color);">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">LONG RANGE TELEMETRY</div>
                    <h4 style="color:${encounter.color || 'var(--accent-color)'}; margin:0; text-transform:uppercase; font-size:14px;">${encounter.title}</h4>
                    <div style="font-size:12px; color:var(--text-color); margin-top:10px; line-height: 1.8;">
                        • Distance: <span style="color:var(--accent-color)">${distance} Mm</span><br>
                        • Signature: <span style="color:var(--warning)">${sigStrength}% Match</span><br>
                        • Emissions: ${radLevel} mSv/h
                    </div>
                </div>
                <div style="padding:15px;">
                    <div style="font-size:10px; color:#888; letter-spacing:2px; margin-bottom:10px;">THREAT ANALYSIS</div>
                    <div style="font-size:12px; color:var(--text-color); margin-top:5px; line-height: 1.8;">
                        <span style="color:${encounter.color || 'var(--success)'}">[ STATUS ]</span> Standby<br>
                        <span style="color:var(--warning)">[ HAZARD ]</span> Variable<br>
                        <span style="color:var(--accent-color)">[ TARGET ]</span> Locked
                    </div>
                </div>
            `;
        }
        
        // Animated scanning visual (common to all encounters)
        listEl.innerHTML = customListHtml + `
            <div style="padding:15px; text-align:center;">
                <div style="width:100%; height:2px; background:var(--border-color); position:relative; overflow:hidden;">
                    <div style="position:absolute; top:0; left:0; width:30%; height:100%; background:${encounter.color || 'var(--accent-color)'}; box-shadow: 0 0 10px ${encounter.color || 'var(--accent-color)'}; animation: radarSweep 2s infinite linear;"></div>
                </div>
                <div style="font-size:10px; color:${encounter.color || 'var(--accent-color)'}; margin-top:8px; letter-spacing:2px;">GATHERING DATA...</div>
            </div>
            <style>
                @keyframes radarSweep { 0% { left: -30%; } 100% { left: 100%; } }
            </style>
        `;
    }

    // --- 🏳️‍🌈 DYNAMIC VISUALS FOR THE RIGHT PANEL ---
    let visualHtml = '';
    
    // 1. Check for Pirates
    if (encounter.id === 'PIRATE_EXTORTION' || (encounter.title && encounter.title.toUpperCase().includes('PIRATE'))) {
         visualHtml = `
            <img src="assets/pirate_ship.png" alt="Pirate Interceptor" style="
                width: 100%; max-width: 420px; height: auto; border: 2px solid var(--danger);
                box-shadow: 0 0 25px rgba(255, 0, 0, 0.4); margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;
            ">
         `;
    } 
    // 2. Check for Anomalies and Signals
    else if (encounter.id === 'SPATIAL_ANOMALY' || (encounter.title && (encounter.title.toUpperCase().includes('SIGNAL') || encounter.title.toUpperCase().includes('ANOMALY')))) {
         visualHtml = `
            <img src="assets/anomaly.png" alt="Spatial Anomaly" style="
                width: 100%; max-width: 420px; height: auto; border: 2px solid ${encounter.color || '#9933FF'};
                box-shadow: 0 0 25px ${encounter.color ? encounter.color + '66' : 'rgba(153, 51, 255, 0.4)'}; margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;
            ">
         `;
    }
    // 3. Check for the Binary Star Merger
    else if (encounter.title && encounter.title.toUpperCase().includes('BINARY STAR MERGER')) {
         visualHtml = `
            <img src="assets/binary_merger.png" alt="Binary Star Merger" style="
                width: 100%; max-width: 420px; height: auto; border: 2px solid #FF6600;
                box-shadow: 0 0 25px rgba(255, 102, 0, 0.4); margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;
            ">
         `;
    }
    // 4. Fallback: Generic image property in DB
    else if (encounter.image) {
        visualHtml = `<img src="${encounter.image}" alt="${encounter.title}" style="width: 100%; max-width: 420px; height: auto; border: 2px solid ${encounter.color}; box-shadow: 0 0 25px ${encounter.color}44; margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;">`;
    } 
    // 5. Default: Basic Emoji Icon
    else {
        visualHtml = `<div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 20px ${encounter.color});">${encounter.icon}</div>`;
    }

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 30px 20px;">
            ${visualHtml}
            <h3 style="color:${encounter.color || '#FF6600'}; margin-bottom:15px; letter-spacing: 2px;">${encounter.title}</h3>
            
            <div style="text-align:left; background:rgba(0,0,0,0.5); padding:20px; border-left:3px solid ${encounter.color || '#FF6600'}; margin-bottom:15px; border-radius:4px;">
                <p style="color:var(--text-color); font-size:14px; line-height:1.6; margin:0; font-style:italic;">
                    "${encounter.text}"
                </p>
            </div>
        </div>
    `;

    actionsEl.innerHTML = '';
    
    encounter.choices.forEach((choice, index) => {
        let canAfford = true;
        if (choice.reqFuel && playerFuel < choice.reqFuel) canAfford = false;
        if (choice.reqCredits && playerCredits < choice.reqCredits) canAfford = false;
        if (choice.reqItem && (playerCargo[choice.reqItem] || 0) < choice.reqQty) canAfford = false;

        const btn = document.createElement('button');
        btn.className = 'action-button';
        btn.style.width = '100%';
        btn.style.marginBottom = '10px';
        btn.innerHTML = choice.label;
        
        if (choice.label.includes("Rep+") || choice.label.includes("DESTROY")) {
            btn.style.borderColor = "var(--danger)";
            btn.style.color = "var(--danger)";
        } else if (choice.label.includes("Rep+")) {
            btn.style.borderColor = "var(--success)";
            btn.style.color = "var(--success)";
        }

        if (!canAfford) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.innerHTML += " (Requirements Not Met)";
        } else {
            btn.onclick = () => resolveUniversalEncounter(encounter.id, index);
        }
        
        actionsEl.appendChild(btn);
    });
}

function resolveUniversalEncounter(encounterId, choiceIndex) {
    // Release the modal lock since a choice was made!
    window.activeHostileEncounter = false;
    const encounter = ENCOUNTER_DATABASE[encounterId];
    const choice = encounter.choices[choiceIndex];
    let leveledUp = false;

    if (choice.actionType) {
        if (choice.actionType === "CUSTOMS_SCAN") {
            performCustomsScan(); 
            closeGenericModal();
            currentEncounterContext = null;
            return;
        } 
        else if (choice.actionType === "FLEE_CONCORD") {
            if (Math.random() > 0.6) {
                logMessage("<span style='color:var(--success)'>[ ENCOUNTER ] EVASION SUCCESSFUL! You dump a sensor decoy and jump to warp before they can lock weapons!</span>");
            } else {
                playerHull -= 30;
                updatePlayerNotoriety(10);
                logMessage("<span style='color:var(--danger)'>[ ENCOUNTER ] EVASION FAILED! The Interceptors rake your hull for 30 damage before you escape!</span>");
                if (typeof GameBus !== 'undefined') GameBus.emit('HULL_DAMAGED', { amount: 30, reason: "Concord Patrol" });
            }
            closeGenericModal();
            currentEncounterContext = null;
            return;
        }
    }

    if (choice.costs) {
        if (choice.costs.fuel) playerFuel -= choice.costs.fuel;
        if (choice.costs.credits) playerCredits -= choice.costs.credits;
        if (choice.costs.hull) playerHull -= choice.costs.hull; 
        if (choice.costs.rep) {
            playerFactionStanding[choice.costs.rep.faction] = (playerFactionStanding[choice.costs.rep.faction] || 0) + choice.costs.rep.amount;
        }
        if (choice.costs.items) {
            choice.costs.items.forEach(item => {
                playerCargo[item.id] -= item.qty;
                if (playerCargo[item.id] <= 0) delete playerCargo[item.id];
            });
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
    }

    if (choice.rewards) {
        if (choice.rewards.xp) {
            playerXP += choice.rewards.xp;
            if (typeof checkLevelUp === 'function') leveledUp = checkLevelUp();
        }
        if (choice.rewards.credits) playerCredits += choice.rewards.credits;
        if (choice.rewards.rep) {
            playerFactionStanding[choice.rewards.rep.faction] = (playerFactionStanding[choice.rewards.rep.faction] || 0) + choice.rewards.rep.amount;
        }
        if (choice.rewards.items) {
            // Track the incoming weight dynamically within the loop
            let simulatedLoad = currentCargoLoad;
            choice.rewards.items.forEach(item => {
                const weight = (typeof COMMODITIES !== 'undefined' && COMMODITIES[item.id]) ? (COMMODITIES[item.id].weight || 1) : 1;
                
                if (simulatedLoad + (item.qty * weight) <= PLAYER_CARGO_CAPACITY) {
                    playerCargo[item.id] = (playerCargo[item.id] || 0) + item.qty;
                    simulatedLoad += (item.qty * weight);
                } else {
                    logMessage(`Could not recover ${item.qty}x ${COMMODITIES[item.id].name}. Cargo hold full!`);
                }
            });
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
    }

    if (choice.log) logMessage(choice.log);
    
    if (choice.sound && typeof soundManager !== 'undefined') {
        if (choice.sound === 'buy') soundManager.playBuy();
        if (choice.sound === 'error') soundManager.playError();
        if (choice.sound === 'laser') soundManager.playLaser();
    }

    currentEncounterContext = null;
    closeGenericModal();
    if (typeof renderUIStats === 'function') renderUIStats();
    
    if (!leveledUp) {
        if (typeof changeGameState === 'function') changeGameState(GAME_STATES.GALACTIC_MAP);
        if (typeof render === 'function') render();
    }
}

// ==========================================
// --- 2. MASTER TICK LISTENER ---
// ==========================================

if (typeof GameBus !== 'undefined') {
    
    GameBus.on('TICK_PROCESSED', (data) => {

        const { isMovement } = data;
        
        // --- A. GATHER LOCAL DATA ONCE ---
        const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        const tileChar = loc ? getTileChar(loc) : null;

        // --- B. CREW PAYDAY (Timer based) ---
        if (typeof playerCrew !== 'undefined' && playerCrew.length > 0) {
            if (lastPayday === 0) lastPayday = currentGameDate;

            if (currentGameDate - lastPayday >= PAYDAY_INTERVAL) {
                lastPayday = currentGameDate;
                const totalCost = playerCrew.length * COST_PER_CREW;
                
                if (playerCredits >= totalCost) {
                    playerCredits -= totalCost;
                    logMessage(`<span style="color:var(--item-desc-color)">[ ACCOUNTING ] Crew salaries automatically deducted: -${formatNumber(totalCost)}c.</span>`);
                    GameBus.emit('UI_REFRESH_REQUESTED');
                } else {
                    logMessage(`<span style="color:var(--danger); font-weight:bold;">[ MUTINY RISK ]</span> You missed Payday! The crew is furious.`);
                    if (typeof showToast === 'function') showToast("MISSED CREW PAYDAY", "error");
                    
                    if (Math.random() < 0.30) {
                        const quitterIndex = Math.floor(Math.random() * playerCrew.length);
                        const quitter = playerCrew[quitterIndex];
                        logMessage(`<span style="color:var(--danger)">${quitter.name} packed their bags and took the escape pod. You lost your ${quitter.role}!</span>`);
                        playerCrew.splice(quitterIndex, 1);
                        if (typeof applyPlayerShipStats === 'function') applyPlayerShipStats();
                    }
                }
                if (typeof autoSaveGame === 'function') autoSaveGame(); 
            }
        }

        // --- C. MODULAR WAR ENGINE (0.5% chance anywhere) ---
        if (Math.random() < 0.005) {
            const isKtharrFront = Math.random() > 0.5;
            const aggressorWins = Math.random() > 0.5;
            const offsets = GameState.world.factionOffsets;
            
            if (isKtharrFront) {
                if (aggressorWins && offsets.KTHARR > 10) {
                    offsets.KTHARR -= 1; 
                    logMessage("<span style='color:var(--danger); font-weight:bold'>[ WAR ALERT ]</span> The K'tharr Hegemony has seized a Concord border sector!");
                } else if (!aggressorWins && offsets.KTHARR < 35) {
                    offsets.KTHARR += 1; 
                    logMessage("<span style='color:var(--accent-color); font-weight:bold'>[ WAR ALERT ]</span> Concord Aegis fleets have pushed the K'tharr out of a border sector.");
                }
            } else {
                if (aggressorWins && offsets.ECLIPSE < -10) {
                    offsets.ECLIPSE += 1; 
                    logMessage("<span style='color:#9933FF; font-weight:bold'>[ WAR ALERT ]</span> The Eclipse Cartel has corrupted a Concord border world. Crime rates spiking.");
                } else if (!aggressorWins && offsets.ECLIPSE > -35) {
                    offsets.ECLIPSE -= 1; 
                    logMessage("<span style='color:var(--accent-color); font-weight:bold'>[ WAR ALERT ]</span> Concord Marines have raided an Eclipse shadow-port, securing the sector.");
                }
            }
            if (typeof render === 'function') render();
        }

        // --- D. NEBULA EVENTS (5% chance if in Nebula) ---
        if (tileChar === '~' && Math.random() < 0.05) {
            triggerNebulaEvent();
        }

        // --- E. DEEP SPACE ENCOUNTERS (0.01% chance if in Empty Space) ---
        if (tileChar === '.' && Math.random() < 0.0001) { 
            if (typeof triggerRandomEncounter === 'function') triggerRandomEncounter();
        }

        // --- NATIVE ECS ENGINE UPDATE ---
    EntityManager.tick(isMovement);

    // Spawn Unidentified Signal Sources (USS)
    if (isMovement && Math.random() < 0.02) { // 2% chance per jump
        const dist = 8 + Math.floor(Math.random() * 12); // 8-20 tiles away
        const angle = Math.random() * Math.PI * 2;
        
        EntityManager.add({
            x: Math.floor(playerX + Math.cos(angle) * dist),
            y: Math.floor(playerY + Math.sin(angle) * dist),
            char: '✧', color: '#FFFFFF', glowColor: '#FFFFFF', pulseSpeed: 600,
            isUSS: true, lifespan: 50 // Lasts 50 moves before fading
        });
        
        // Only notify the player if they have good sensors!
        if ((typeof hasCrewPerk === 'function' && hasCrewPerk('ASTROMETRICS')) || 
            (typeof playerPerks !== 'undefined' && playerPerks.has('LONG_RANGE_SENSORS'))) {
            logMessage("<span style='color:var(--accent-color)'>[ SENSORS ] Unidentified Signal Source (USS) detected in local space.</span>");
        }
    }

    });
}
