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
    
    // Add a new entity to the world
    add: function(entity) {
        if (!entity.id) entity.id = "ENT_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        this.entities.push(entity);
        return entity;
    },
    
    // Remove an entity by its unique ID
    remove: function(id) {
        this.entities = this.entities.filter(e => e.id !== id);
    },
    
    // Wipe everything (used on player death or loading a save)
    clear: function() {
        this.entities = [];
    },
    
    // Get all entities that share a specific tag (e.g., 'isHostile', 'isRenderable')
    getWithTag: function(tag) {
        return this.entities.filter(e => e[tag] === true);
    },

    // Get an entity at a specific coordinate
    getAt: function(x, y) {
        return this.entities.filter(e => e.x === x && e.y === y);
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

    openGenericModal("DEEP SPACE SENSOR CONTACT");
    const listEl = document.getElementById('genericModalList');
    const detailEl = document.getElementById('genericDetailContent');
    const actionsEl = document.getElementById('genericModalActions');

    listEl.innerHTML = ''; // Hide side list for full immersion

    detailEl.innerHTML = `
        <div style="text-align:center; padding: 30px 20px;">
            <div style="font-size:60px; margin-bottom:15px; filter: drop-shadow(0 0 20px ${encounter.color});">${encounter.icon}</div>
            <h3 style="color:${encounter.color}; margin-bottom:15px; letter-spacing: 2px;">${encounter.title}</h3>
            
            <div style="text-align:left; background:rgba(0,0,0,0.5); padding:20px; border-left:3px solid ${encounter.color}; margin-bottom:15px; border-radius:4px;">
                <p style="color:var(--text-color); font-size:14px; line-height:1.6; margin:0;">
                    ${encounter.text}
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
            choice.rewards.items.forEach(item => {
                if (currentCargoLoad + item.qty <= PLAYER_CARGO_CAPACITY) {
                    playerCargo[item.id] = (playerCargo[item.id] || 0) + item.qty;
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

    });
}
