// --- START OF FILE mechanics.js ---

// ==========================================
// --- WAYFINDER BACKGROUND SIMULATIONS ---
// ==========================================

let lastPayday = 0;
const PAYDAY_INTERVAL = 30.0; // Pay crew every 30 Stardates
const COST_PER_CREW = 250;    // 250c per crew member

// Helper to check if a blocking modal or combat screen is currently open
function isPlayerBusyInModalOrCombat() {
    if (typeof currentGameState !== 'undefined' && currentGameState !== 'galactic_map') return true;
    if (typeof currentCombatContext !== 'undefined' && currentCombatContext) return true;
    if (typeof currentTradeContext !== 'undefined' && currentTradeContext) return true;
    if (typeof currentOutfitContext !== 'undefined' && currentOutfitContext) return true;
    if (typeof currentMissionContext !== 'undefined' && currentMissionContext) return true;
    if (typeof currentEncounterContext !== 'undefined' && currentEncounterContext) return true;

    const genericModal = document.getElementById('genericModalOverlay');
    if (genericModal && genericModal.style.display === 'flex') return true;

    const stationModal = document.getElementById('stationOverlay');
    if (stationModal && stationModal.style.display === 'flex') return true;

    const xerxesModal = document.getElementById('xerxesOverlay');
    if (xerxesModal && xerxesModal.style.display === 'flex') return true;

    return false;
}

// ==========================================
// --- UNIFIED ENTITY MANAGER ---
// ==========================================

const EntityManager = {
    entities: [],
    
    add: function(entity) {
        if (!entity) return null;
        if (!entity.id) entity.id = "ENT_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

        // Normalize NPC properties so interactWithNPC() in script.js displays accurate faction & comms
        if (entity.isNPC && !entity.isFuelRat && !entity.isColonyHauler) {
            if (!entity.faction) {
                if (entity.id.includes("CONCORD") || (entity.name && entity.name.includes("Concord"))) {
                    entity.faction = "CONCORD";
                } else if (typeof getFactionAt === 'function' && entity.x !== undefined && entity.y !== undefined) {
                    const localFac = getFactionAt(entity.x, entity.y);
                    if (localFac === "KTHARR" && Math.random() < 0.65) {
                        entity.faction = "KTHARR";
                        entity.name = "K'tharr Blood-Patrol";
                        entity.shipClass = "K'tharr Vanguard";
                        entity.combatProfile = "KTHARR_SCOUT";
                        entity.color = "#4CAF50";
                        entity.image = "assets/pirate_ship.png";
                        entity.hails = [
                            "State your blood-price, outlander, or clear our vector!",
                            "The Ascendancy watches these stars. Tread lightly.",
                            "Weak hulls have no place in K'tharr space."
                        ];
                    } else if (localFac === "ECLIPSE" && Math.random() < 0.65) {
                        entity.faction = "ECLIPSE";
                        entity.name = "Cartel Shadow-Runner";
                        entity.shipClass = "Eclipse Night-Runner";
                        entity.combatProfile = "STRIKER";
                        entity.color = "#9933FF";
                        entity.image = "assets/pirate_ship.png";
                        entity.hails = [
                            "You didn't see us, we didn't see you. Keep flying.",
                            "Got contraband? Station Umbra is paying triple today.",
                            "Keep your sensors off our cargo hold if you value your hull."
                        ];
                    } else {
                        entity.faction = "INDEPENDENT";
                    }
                } else {
                    entity.faction = "INDEPENDENT";
                }
            }
            if ((!entity.dialogue || entity.dialogue.length === 0) && entity.hails && entity.hails.length > 0) {
                entity.dialogue = [entity.hails[Math.floor(Math.random() * entity.hails.length)]];
            }
        }

        this.entities.push(entity);
        return entity;
    },
    
    remove: function(id) {
        this.entities = this.entities.filter(e => e.id !== id);
    },
    
    clear: function() {
        this.entities = [];
    },
    
    // --- THE NATIVE ECS TICK ENGINE ---
    tick: function(isMovement) {
        // Waiting (.) passes 0.15 stardates, so dynamic world entities still advance!
        const shouldAdvanceWorld = Boolean(isMovement) || (typeof currentGameState !== 'undefined' && currentGameState === 'galactic_map');

        // Loop backwards to safely remove entities that expire or get destroyed
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            if (!entity) continue;
            
            // SYSTEM 1: Unidentified Signal Sources (USS)
            if (entity.isUSS) {
                if (isMovement) entity.lifespan--;
                if (entity.x === playerX && entity.y === playerY && !isPlayerBusyInModalOrCombat()) {
                    this.entities.splice(i, 1);
                    if (typeof resolveUSSEncounter === 'function') resolveUSSEncounter();
                    continue;
                } else if (entity.lifespan <= 0) {
                    this.entities.splice(i, 1);
                    continue;
                }
            }
            
            // SYSTEM 2: Comets
            if (entity.isComet && shouldAdvanceWorld) {
                entity.x += entity.vx; 
                entity.y += entity.vy;
                if (typeof spawnParticles === 'function') {
                    spawnParticles(entity.x, entity.y, 'thruster', { x: -entity.vx, y: -entity.vy });
                }

                // Did it hit the player?
                if (entity.x === playerX && entity.y === playerY) {
                    const ice = 5 + Math.floor(Math.random() * 10);
                    const rare = Math.floor(Math.random() * 3); 
                    
                    const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
                    
                    if (spaceLeft > 0) {
                        let totalAdded = 0;
                        let addedRare = 0;
                        
                        if (rare > 0 && spaceLeft >= rare) {
                            playerCargo['VOID_CRYSTALS'] = (playerCargo['VOID_CRYSTALS'] || 0) + rare;
                            addedRare = rare;
                        }
                        
                        const iceToAdd = Math.min(ice, spaceLeft - addedRare);
                        if (iceToAdd > 0) {
                            playerCargo['HYDROGEN_3'] = (playerCargo['HYDROGEN_3'] || 0) + iceToAdd;
                            totalAdded += iceToAdd;
                        }

                        if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                        
                        let lootMsg = `<span style='color:var(--accent-color); font-weight:bold;'>[ COMET INTERCEPTED ]</span> Harvested ${iceToAdd}x Hydrogen-3`;
                        if (addedRare > 0) lootMsg += ` and ${addedRare}x Void Crystals!`;
                        if (totalAdded + addedRare < ice + rare) lootMsg += " (Cargo Full, remainder lost)";
                        
                        logMessage(lootMsg);
                        if (typeof showToast === 'function') showToast("COMET HARVESTED", "success");
                        if (typeof soundManager !== 'undefined') soundManager.playGain();
                        if (typeof spawnFloatingText === 'function') {
                            spawnFloatingText(playerX, playerY, `+${iceToAdd} H-3`, "#00FFFF");
                        }
                    } else {
                        logMessage("<span style='color:var(--danger); font-weight:bold;'>[ COMET INTERCEPTED ]</span> Impact absorbed, but cargo hold is full! No materials extracted.");
                        if (typeof showToast === 'function') showToast("CARGO FULL", "error");
                    }
                    
                    this.entities.splice(i, 1);
                    continue;
                } else {
                    const cDist = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
                    if (typeof VIEWPORT_WIDTH_TILES !== 'undefined' && cDist > VIEWPORT_WIDTH_TILES * 1.5) {
                        this.entities.splice(i, 1);
                        continue;
                    }
                }
            }

            // SYSTEM 3: Ambient NPCs, Fuel Rats & Colony Haulers
            if ((entity.isNPC || entity.isFuelRat || entity.isColonyHauler) && shouldAdvanceWorld) {
                if (!entity.state) {
                    entity.state = 'CRUISING';
                    entity.vx = 0;
                    entity.vy = 0;
                    entity.stepsRemaining = 0;
                }

                if (entity.interactCooldown && entity.interactCooldown > 0) {
                    entity.interactCooldown--;
                }

                let movedThisTurn = false;
                const prevX = entity.x;
                const prevY = entity.y;

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
                    movedThisTurn = true;

                    if (entity.x === entity.targetX && entity.y === entity.targetY) {
                        entity.state = 'DOCKED';
                        entity.dockTimer = 20;
                    }
                }
                // B.5 RESCUE STATE (Fuel Rat intercepting stranded player - works on wait turns!)
                else if (entity.state === 'RESCUE') {
                    const steps = isMovement ? 2 : 3; // Move even faster when the player is waiting (.)
                    for (let step = 0; step < steps; step++) {
                        if (entity.x < playerX) entity.x++; else if (entity.x > playerX) entity.x--;
                        if (entity.y < playerY) entity.y++; else if (entity.y > playerY) entity.y--;
                        movedThisTurn = true;
                        if (entity.x === playerX && entity.y === playerY) break;
                    }
                }
                // B.75 HAULER STATE (Colony Trade Route)
                else if (entity.state === 'TRADE_ROUTE') {
                    if (entity.x < entity.targetX) entity.x++; else if (entity.x > entity.targetX) entity.x--;
                    if (entity.y < entity.targetY) entity.y++; else if (entity.y > entity.targetY) entity.y--;
                    movedThisTurn = true;

                    if (entity.x === entity.targetX && entity.y === entity.targetY) {
                        const payout = 3500 + Math.floor(Math.random() * 3500);
                        playerCredits += payout;
                        
                        const goods = ["Luxury Goods", "Refined Alloy", "Medical Supplies", "Atmospheric Processors"];
                        const deliveredGood = goods[Math.floor(Math.random() * goods.length)];
                        
                        logMessage(`<span style='color:var(--gold-text); font-weight:bold;'>[ TRADE ROUTE ]</span> ${entity.name} safely delivered ${deliveredGood} to ${entity.destName || 'port'}! Earned <b>${formatNumber(payout)}c</b> tariff.`);
                        if (typeof showToast === 'function') showToast(`CONVOY ARRIVED: +${formatNumber(payout)}c`, "success");
                        if (typeof soundManager !== 'undefined') soundManager.playBuy();
                        if (typeof renderUIStats === 'function') renderUIStats();
                        this.entities.splice(i, 1);
                        continue;
                    }

                    const pirate = (typeof activeEnemies !== 'undefined' && activeEnemies.find(e => !e.isProbe && Math.abs(e.x - entity.x) <= 1 && Math.abs(e.y - entity.y) <= 1)) ||
                                   this.entities.find(e => e.isHostile && e.x === entity.x && e.y === entity.y);
                    if (pirate) {
                        if (typeof spawnParticles === 'function') spawnParticles(entity.x, entity.y, 'explosion');
                        logMessage(`<span style='color:var(--danger); font-weight:bold;'>[ TRADE ROUTE LOST ]</span> ${entity.name} was ambushed and destroyed by hostiles at [${entity.x}, ${-entity.y}]!`);
                        if (typeof showToast === 'function') showToast("COLONY CONVOY DESTROYED", "error");
                        if (typeof soundManager !== 'undefined') soundManager.playExplosion();
                        this.entities.splice(i, 1);
                        continue;
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
                                        foundStation = true;
                                        break;
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
                                entity.x += entity.vx;
                                entity.y += entity.vy;
                                entity.stepsRemaining--;
                                movedThisTurn = true;
                            }
                        } else {
                            if (entity.stepsRemaining <= 0) {
                                entity.stepsRemaining = Math.floor(Math.random() * 15) + 5; 
                                do {
                                    entity.vx = Math.floor(Math.random() * 3) - 1;
                                    entity.vy = Math.floor(Math.random() * 3) - 1;
                                } while (entity.vx === 0 && entity.vy === 0);
                            }
                            entity.x += entity.vx;
                            entity.y += entity.vy;
                            entity.stepsRemaining--;
                            movedThisTurn = true;
                        }
                    }
                }
                
                // VISUAL POLISH: Draw engine trails at previous tile for moving ships
                if (movedThisTurn && typeof spawnParticles === 'function') {
                    const tdx = Math.sign(entity.x - prevX);
                    const tdy = Math.sign(entity.y - prevY);
                    spawnParticles(prevX, prevY, 'thruster', { x: tdx, y: tdy });
                }

                // DESPAWN, HAILING, & COLLISIONS
                const dist = Math.abs(entity.x - playerX) + Math.abs(entity.y - playerY);
                
                if (dist > VIEWPORT_WIDTH_TILES && !entity.isColonyHauler && !entity.isFuelRat) {
                    this.entities.splice(i, 1);
                    continue;
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
                        if (typeof executeRescueSequence === 'function') executeRescueSequence();
                        continue;
                    } else if (!entity.isColonyHauler && (!entity.interactCooldown || entity.interactCooldown <= 0) && !isPlayerBusyInModalOrCombat()) {
                        entity.interactCooldown = 3; // Prevent modal loop if player chooses "Maintain Course"
                        if (typeof interactWithNPC === 'function') interactWithNPC(entity);
                    }
                }
            }
        }
    }
};

window.EntityManager = EntityManager;

// ==========================================
// --- 1. EVENT FUNCTIONS ---
// ==========================================

function triggerNebulaEvent() {
    const events = [
        {
            type: "ION_STORM",
            msg: "<span style='color:var(--warning)'>[ ION STORM ]</span> Lightning arcs across the nebula! Shields drained.",
            fx: () => {
                playerShields = 0;
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "SHIELDS DRAINED", "var(--warning)");
                if (typeof GameBus !== 'undefined') GameBus.emit('UI_REFRESH_REQUESTED');
            }
        },
        {
            type: "NURSERY",
            msg: "<span style='color:var(--success)'>[ STELLAR NURSERY ]</span> Your sensors capture a protostar igniting. (+100 XP)",
            fx: () => {
                playerXP += 100;
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "+100 XP", "var(--success)");
                if (typeof checkLevelUp === 'function') checkLevelUp();
            }
        },
        {
            type: "PLASMA_EDDY",
            msg: "<span style='color:var(--accent-color)'>[ PLASMA EDDY ]</span> You fly through a pocket of volatile gas. Fuel tanks overcharged!",
            fx: () => {
                playerFuel = Math.floor(MAX_FUEL * 1.5);
                if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "FUEL OVERCHARGED!", "var(--accent-color)");
            }
        },
        {
            type: "SENSOR_GHOSTS",
            msg: "<span style='color:#9933FF'>[ SENSOR GHOSTS ]</span> The nebula gas creates false radar signatures. Your targeting computer is confused.",
            fx: () => {}
        },
        {
            type: "SPORE_CLOUD",
            msg: "<span style='color:#FF33FF'>[ BIO-SIGNATURE ]</span> You fly through a cloud of bioluminescent dust. Fungal spores cling to your hull.",
            fx: () => {
                const spaceLeft = (typeof PLAYER_CARGO_CAPACITY !== 'undefined' ? PLAYER_CARGO_CAPACITY : 50) - (typeof currentCargoLoad !== 'undefined' ? currentCargoLoad : 0);
                if (spaceLeft > 0) {
                    playerCargo['SENTIENT_MYCELIUM'] = (playerCargo['SENTIENT_MYCELIUM'] || 0) + 1;
                    logMessage("<span style='color:var(--success)'>Gathered 1x Sentient Mycelium.</span>");
                    if (typeof spawnFloatingText === 'function') spawnFloatingText(playerX, playerY, "+1 MYCELIUM", "#FF33FF");
                    if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
                } else {
                    logMessage("<span style='color:var(--danger)'>Cargo hold full. Spores drifted away.</span>");
                }
            }
        }
    ];
    
    const ev = events[Math.floor(Math.random() * events.length)];
    logMessage(ev.msg);
    ev.fx();
    if (typeof renderUIStats === 'function') renderUIStats();
}

function triggerRandomEncounter(forcedEncounterId = null) {
    if (typeof ENCOUNTER_DATABASE === 'undefined') return;
    const keys = Object.keys(ENCOUNTER_DATABASE);
    if (keys.length === 0) return;
    
    const chosenKey = (forcedEncounterId && ENCOUNTER_DATABASE[forcedEncounterId])
        ? forcedEncounterId
        : keys[Math.floor(Math.random() * keys.length)];
    const encounter = ENCOUNTER_DATABASE[chosenKey];
    if (!encounter) return;
    
    // Save the active context so it can be reloaded or tracked
    currentEncounterContext = encounter.id;

    // Lock the modal on hostile or inescapable hazard events so the player cannot X out for free
    window.activeHostileEncounter = Boolean(
        encounter.id.includes('PIRATE') ||
        encounter.id === 'SPATIAL_ANOMALY' ||
        encounter.id === 'BINARY_STAR_MERGER' ||
        encounter.id === 'CONCORD_STING'
    );

    openGenericModal("DEEP SPACE SENSOR CONTACT");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    // --- 📡 CUSTOM SENSOR FLAVOR TEXT FOR LEFT PANEL ---
    if (listEl) {
        const pseudoRandom = Math.abs((playerX * 7) ^ (playerY * 13) ^ (encounter.title.length * 5));
        let customListHtml = '';

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

    // --- DYNAMIC VISUALS FOR THE RIGHT PANEL ---
    let visualHtml = '';
    
    if (encounter.id === 'PIRATE_EXTORTION' || (encounter.title && encounter.title.toUpperCase().includes('PIRATE'))) {
        visualHtml = `
            <img src="assets/pirate_ship.png" alt="Pirate Interceptor" style="
                width: 100%; max-width: 420px; height: auto; border: 2px solid var(--danger);
                box-shadow: 0 0 25px rgba(255, 0, 0, 0.4); margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;
            ">
        `;
    } 
    else if (encounter.id === 'SPATIAL_ANOMALY' || (encounter.title && (encounter.title.toUpperCase().includes('SIGNAL') || encounter.title.toUpperCase().includes('ANOMALY')))) {
        visualHtml = `
            <img src="assets/anomaly.png" alt="Spatial Anomaly" style="
                width: 100%; max-width: 420px; height: auto; border: 2px solid ${encounter.color || '#9933FF'};
                box-shadow: 0 0 25px ${encounter.color ? encounter.color + '66' : 'rgba(153, 51, 255, 0.4)'}; margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;
            ">
        `;
    }
    else if (encounter.title && encounter.title.toUpperCase().includes('BINARY STAR MERGER')) {
        visualHtml = `
            <img src="assets/binary_merger.png" alt="Binary Star Merger" style="
                width: 100%; max-width: 420px; height: auto; border: 2px solid #FF6600;
                box-shadow: 0 0 25px rgba(255, 102, 0, 0.4); margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;
            ">
        `;
    }
    else if (encounter.image) {
        visualHtml = `<img src="${encounter.image}" alt="${encounter.title}" style="width: 100%; max-width: 420px; height: auto; border: 2px solid ${encounter.color}; box-shadow: 0 0 25px ${encounter.color}44; margin-bottom: 20px; border-radius: 4px; display: block; margin-left: auto; margin-right: auto;">`;
    } 
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
        
        if (choice.label.includes("DESTROY") || choice.label.includes("DEATH") || choice.label.includes("Rep-") || choice.label.includes("Risk") || choice.label.includes("Hull-")) {
            btn.style.borderColor = "var(--danger)";
            btn.style.color = "var(--danger)";
        } else if (choice.label.includes("Rep+") || choice.label.includes("XP+") || choice.label.includes("Safe")) {
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
    window.activeHostileEncounter = false;
    const encounter = ENCOUNTER_DATABASE[encounterId];
    if (!encounter || !encounter.choices[choiceIndex]) {
        currentEncounterContext = null;
        closeGenericModal();
        return;
    }

    const choice = encounter.choices[choiceIndex];
    let leveledUp = false;

    if (choice.actionType) {
        if (choice.actionType === "CUSTOMS_SCAN") {
            closeGenericModal();
            currentEncounterContext = null;
            const passed = typeof performCustomsScan === 'function' ? performCustomsScan() : true;
            if (passed) {
                logMessage("<span style='color:var(--success)'>[ CUSTOMS STING ]</span> Concord Interceptors complete their deep-scan of your hold. Finding no exposed contraband, they解锁 weapons and jump away.");
                if (typeof showToast === 'function') showToast("INSPECTION PASSED", "success");
            }
            return;
        } 
        else if (choice.actionType === "FLEE_CONCORD") {
            closeGenericModal();
            currentEncounterContext = null;
            const evadeBonus = typeof PLAYER_EVASION !== 'undefined' ? PLAYER_EVASION : 0;
            if (Math.random() < (0.4 + evadeBonus)) {
                logMessage("<span style='color:var(--success)'>[ ENCOUNTER ] EVASION SUCCESSFUL! You dump a sensor decoy and jump to warp before they can lock weapons!</span>");
                if (typeof soundManager !== 'undefined') soundManager.playWarp();
            } else {
                if (typeof updatePlayerNotoriety === 'function') updatePlayerNotoriety(10);
                logMessage("<span style='color:var(--danger)'>[ ENCOUNTER ] EVASION FAILED! Hostile interceptors rake your hull for 30 damage before you escape!</span>");
                if (typeof GameBus !== 'undefined') {
                    GameBus.emit('HULL_DAMAGED', { amount: 30, reason: encounter.title || "Interceptor Fire" });
                } else {
                    playerHull -= 30;
                }
            }
            return;
        }
    }

    if (choice.log) logMessage(choice.log);

    if (choice.costs) {
        if (choice.costs.fuel) playerFuel = Math.max(0, playerFuel - choice.costs.fuel);
        if (choice.costs.credits) playerCredits = Math.max(0, playerCredits - choice.costs.credits);
        if (choice.costs.rep) {
            playerFactionStanding[choice.costs.rep.faction] = (playerFactionStanding[choice.costs.rep.faction] || 0) + choice.costs.rep.amount;
        }
        if (choice.costs.items) {
            choice.costs.items.forEach(item => {
                playerCargo[item.id] = Math.max(0, (playerCargo[item.id] || 0) - item.qty);
                if (playerCargo[item.id] <= 0) delete playerCargo[item.id];
            });
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
        if (choice.costs.hull) {
            // Route through GameBus so damage flash, audio, and Game Over triggers work properly
            if (typeof GameBus !== 'undefined') {
                GameBus.emit('HULL_DAMAGED', { amount: choice.costs.hull, reason: encounter.title || "Deep Space Hazard" });
            } else {
                playerHull -= choice.costs.hull;
            }
        }
    }

    // If the hull cost killed the player, exit immediately so we don't overwrite the Game Over screen!
    if (typeof playerHull !== 'undefined' && playerHull <= 0) {
        currentEncounterContext = null;
        closeGenericModal();
        return;
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
            let simulatedLoad = currentCargoLoad;
            choice.rewards.items.forEach(item => {
                const weight = (typeof COMMODITIES !== 'undefined' && COMMODITIES[item.id] && COMMODITIES[item.id].weight !== undefined)
                    ? COMMODITIES[item.id].weight
                    : 1;
                
                if (simulatedLoad + (item.qty * weight) <= PLAYER_CARGO_CAPACITY) {
                    playerCargo[item.id] = (playerCargo[item.id] || 0) + item.qty;
                    simulatedLoad += (item.qty * weight);
                } else {
                    const itemName = (typeof COMMODITIES !== 'undefined' && COMMODITIES[item.id]) ? COMMODITIES[item.id].name : item.id;
                    logMessage(`Could not recover ${item.qty}x ${itemName}. Cargo hold full!`);
                }
            });
            if (typeof updateCurrentCargoLoad === 'function') updateCurrentCargoLoad();
        }
    }
    
    if (choice.sound && typeof soundManager !== 'undefined') {
        if (choice.sound === 'buy' && typeof soundManager.playBuy === 'function') soundManager.playBuy();
        else if (choice.sound === 'error' && typeof soundManager.playError === 'function') soundManager.playError();
        else if (choice.sound === 'laser' && typeof soundManager.playLaser === 'function') soundManager.playLaser();
        else if (choice.sound === 'warp' && typeof soundManager.playWarp === 'function') soundManager.playWarp();
        else if (choice.sound === 'gain' && typeof soundManager.playGain === 'function') soundManager.playGain();
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
// --- COLONY CONVOY DISPATCH HELPER ---
// ==========================================

let lastColonyHaulerDispatch = 0;
const HAULER_DISPATCH_INTERVAL = 25.0; // Dispatch a trade convoy every 25 Stardates

function checkColonyHaulerDispatch() {
    if (typeof playerColonies === 'undefined' || typeof currentGameDate === 'undefined') return;
    if (lastColonyHaulerDispatch === 0 || currentGameDate < lastColonyHaulerDispatch) {
        lastColonyHaulerDispatch = currentGameDate;
        return;
    }
    if (currentGameDate - lastColonyHaulerDispatch < HAULER_DISPATCH_INTERVAL) return;

    // Cap active colony haulers at 1 at a time
    const existingHauler = EntityManager.entities.some(e => e.isColonyHauler);
    if (existingHauler) return;

    const eligibleColonies = Object.values(playerColonies).filter(c => c && c.established && c.population >= 250);
    if (eligibleColonies.length === 0) return;

    lastColonyHaulerDispatch = currentGameDate;
    const sourceColony = eligibleColonies[Math.floor(Math.random() * eligibleColonies.length)];
    const destStation = typeof findNearestStation === 'function'
        ? findNearestStation(sourceColony.x, sourceColony.y)
        : { name: "Starbase Alpha", x: MAP_WIDTH - 7, y: MAP_HEIGHT - 5 };

    EntityManager.add({
        x: sourceColony.x,
        y: sourceColony.y,
        targetX: destStation.x,
        targetY: destStation.y,
        destName: destStation.name,
        name: `${sourceColony.name} Trade Convoy`,
        char: "=",
        color: "#FFD700",
        glowColor: "#FFD700",
        state: "TRADE_ROUTE",
        isNPC: true,
        isColonyHauler: true,
        hasSensorCone: true,
        desc: `An armored colonial freighter hauling surplus goods from ${sourceColony.name} to ${destStation.name}.`,
        hails: [
            `Colonial convoy en route to ${destStation.name}. Keep the lane clear of pirates, Governor!`,
            `Hauling tariff cargo from ${sourceColony.name}. Shields at maximum.`
        ]
    });

    logMessage(`<span style='color:var(--gold-text)'>[ COLONY LOGISTICS ]</span> <b>${sourceColony.name}</b> launched a Trade Convoy toward <b>${destStation.name}</b>.`);
}

// ==========================================
// --- 2. MASTER TICK LISTENER ---
// ==========================================

if (typeof GameBus !== 'undefined') {
    
    GameBus.on('TICK_PROCESSED', (data) => {
        // Respect tick interrupts if combat or death already triggered earlier in the tick!
        if (!data || data.interrupt) return;

        const { isMovement } = data;
        
        // --- A. GATHER LOCAL DATA ONCE ---
        const loc = typeof chunkManager !== 'undefined' ? chunkManager.getTile(playerX, playerY) : null;
        const tileChar = loc ? getTileChar(loc) : null;

        // --- B. CREW PAYDAY (Timer based, synced to GameState) ---
        if (typeof GameState !== 'undefined' && GameState.player) {
            if (!GameState.player.lastPayday || currentGameDate < GameState.player.lastPayday) {
                GameState.player.lastPayday = currentGameDate;
            }
            lastPayday = GameState.player.lastPayday;
        } else if (lastPayday === 0 || currentGameDate < lastPayday) {
            lastPayday = currentGameDate;
        }

        if (typeof playerCrew !== 'undefined' && playerCrew.length > 0) {
            if (currentGameDate - lastPayday >= PAYDAY_INTERVAL) {
                lastPayday = currentGameDate;
                if (typeof GameState !== 'undefined' && GameState.player) {
                    GameState.player.lastPayday = currentGameDate;
                }
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

        // --- D. NEBULA EVENTS (5% chance if moving in Nebula) ---
        if (isMovement && tileChar === '~' && Math.random() < 0.05 && !isPlayerBusyInModalOrCombat()) {
            triggerNebulaEvent();
        }

        // --- E. DEEP SPACE ENCOUNTERS (0.15% chance if moving in Empty Space) ---
        if (isMovement && tileChar === '.' && Math.random() < 0.0015 && !isPlayerBusyInModalOrCombat()) { 
            if (typeof triggerRandomEncounter === 'function') {
                triggerRandomEncounter();
                data.interrupt = true;
                return;
            }
        }

        // --- F. COLONY TRADE ROUTE DISPATCH ---
        checkColonyHaulerDispatch();

        // --- G. NATIVE ECS ENGINE UPDATE ---
        EntityManager.tick(isMovement);

        // --- H. SPAWN UNIDENTIFIED SIGNAL SOURCES (USS) ---
        const activeUSSCount = EntityManager.entities.filter(e => e.isUSS).length;
        if (isMovement && activeUSSCount < 3 && Math.random() < 0.02) {
            const dist = 8 + Math.floor(Math.random() * 12); // 8-20 tiles away
            const angle = Math.random() * Math.PI * 2;
            const ux = Math.floor(playerX + Math.cos(angle) * dist);
            const uy = Math.floor(playerY + Math.sin(angle) * dist);

            const targetTile = typeof chunkManager !== 'undefined' ? chunkManager.getTile(ux, uy) : '.';
            const targetChar = typeof getTileChar === 'function' ? getTileChar(targetTile) : targetTile;

            // Only spawn USS on empty space so resolveUSSEncounter() never fizzles on a gravity well
            if (targetChar === '.') {
                EntityManager.add({
                    x: ux,
                    y: uy,
                    char: '✧', color: '#FFFFFF', glowColor: '#FFFFFF', pulseSpeed: 600,
                    isUSS: true, lifespan: 50
                });
                
                if ((typeof hasCrewPerk === 'function' && hasCrewPerk('ASTROMETRICS')) || 
                    (typeof playerPerks !== 'undefined' && playerPerks.has('LONG_RANGE_SENSORS'))) {
                    logMessage("<span style='color:var(--accent-color)'>[ SENSORS ] Unidentified Signal Source (USS) detected at [" + ux + ", " + (-uy) + "].</span>");
                }
            }
        }
    });
}

// Ensure the mobile D-Pad WAIT button calls playerWaitTurn() so ECS entities (like Fuel Rats) advance!
window.addEventListener('DOMContentLoaded', () => {
    const btnWait = document.getElementById('btnWait');
    if (btnWait && !window._mechanicsWaitPatched) {
        const cleanBtn = btnWait.cloneNode(true);
        btnWait.parentNode.replaceChild(cleanBtn, btnWait);
        cleanBtn.addEventListener('click', () => {
            if (typeof currentGameState !== 'undefined' && currentGameState === 'galactic_map') {
                if (typeof playerWaitTurn === 'function') playerWaitTurn();
            }
        });
        window._mechanicsWaitPatched = true;
    }
});

// --- END OF FILE mechanics.js ---
