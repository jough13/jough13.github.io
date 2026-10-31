// expansions/AIDirector.js
import { Structure, Spider, MathUtils } from '../game.js';
import { Queen } from './Queen.js';
import { AI_PROFILES } from './AdvancedBase.js'; 

// ==========================================
// 1. CONFIGURATION & AI TUNING
// ==========================================
const AI_STATE = {
    BUILDING: 0,   // Rallying troops at home
    ATTACKING: 1,  // Marching on the player
    DEFENDING: 2   // Panicking and pulling troops back to save a base
};

// 🔌 [EXPANDABILITY] Exposed configuration so mods can tweak the Director's intelligence
export const DIRECTOR_CONFIG = {
    rallyDistance: 250,
    squadSpread: 100,
    retreatPercentage: 0.3,  // Squad retreats if it loses 70% of its forces
    defenseTimerDuration: 5, // How many seconds the AI stays in defense mode after being hit
    
    // [FIX] Pacing timers
    gracePeriodTicks: 10800, // 3 minutes (at 60fps) of peace at the start of the game
    waveCooldownTicks: 5400, // 90 seconds of breathing room between attack waves
    
    // Threat assessment for target picking
    targetWeights: {
        'queen': 200,      // Kill the leader!
        'nest': 150,       // Destroy the base!
        'mortar': 100,     // High threat artillery
        'shrine': 90,      // High priority support
        'incubator': 80,   // Spawner
        'turret': 60,      // Standard defense
        'pylon': 40,       // Web network node
        'default': 10      // Anything else
    }
};

export const AIDirectorExpansion = {
    init: (game) => {
        console.log("%c[DLC] AI Director Online. The Crimson Swarm is thinking...", "color: #ff0000; font-weight: bold;");
        
        // Link to global game instance for modding access
        game.aiDirectorConfig = DIRECTOR_CONFIG;
        
        game.aiDirector = {
            state: AI_STATE.BUILDING,
            squad: new Set(),
            target: null,
            rallyPoint: null,
            waveSize: 6, 
            defenseTimer: 0,
            nextAttackTick: DIRECTOR_CONFIG.gracePeriodTicks // [FIX] Start with the grace period
        };
    },

    patch: (game) => {
        // 🚀 [PERFORMANCE] Run the AI Director's brain every 60 frames (1 second) to save CPU
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState !== 'playing' || this.tick % 60 !== 0) return;

            const dir = this.aiDirector;
            const cfg = this.aiDirectorConfig;
            
            // Allow dynamic fallback if AdvancedBase config isn't loaded yet
            const aiProfiles = this.aiConfig ? this.aiConfig.profiles : AI_PROFILES;
            const diff = aiProfiles[this.aiDifficulty] || aiProfiles.normal;

            // 1. CLEANUP: Remove dead bugs from the assault squad
            for (let bug of dir.squad) {
                if (bug.hp <= 0 || bug.team !== 'red') dir.squad.delete(bug);
            }

            // 2. ADAPTIVE ESCALATION: Scale wave size to the player's army size and tech level
            // [FIX] Rubber-banding prevents the AI from overwhelming a slow player or under-attacking a fast one!
            const playerArmyEstimate = Math.max(4, Math.floor((this.pop.black || 0) * 0.75));
            const techBonus = (this.techLevel.black || 0) * 3;
            dir.waveSize = MathUtils.clamp(playerArmyEstimate + techBonus, 6, 25);

            // 3. IDENTIFY BASES & THREATS
            let redNest = null;
            let activelyAttacked = false;

            // 🚀 [PERFORMANCE] Local cache to prevent repeated array lookups
            const structs = this.structures;
            const structLen = structs.length;

            for (let i = 0; i < structLen; i++) {
                let s = structs[i];
                if (s.team === 'red') {
                    if (s.type === 'nest') redNest = s;
                    
                    // [FIX] INFINITE DEFENSE BUG
                    // We now track _lastHp. The AI only defends if HP actively drops between seconds!
                    if (s._lastHp === undefined) s._lastHp = s.hp;
                    if (s.hp < s._lastHp) {
                        activelyAttacked = true;
                        dir.defenseTimer = cfg.defenseTimerDuration; // Reset panic timer
                    }
                    s._lastHp = s.hp; // Update history
                }
            }

            if (!redNest) return; // AI is dead, stop thinking.

            if (dir.defenseTimer > 0) dir.defenseTimer--;

            // 4. STATE MACHINE LOGIC
            
            // --- STATE: DEFENDING ---
            if (activelyAttacked || dir.defenseTimer > 0) {
                
                // 🧃 [JUICE] Alarm reaction if just entering defense mode
                if (dir.state !== AI_STATE.DEFENDING) {
                    this.bus.emit('playSound', 'error'); // Sharp buzzer/alarm
                    this.bus.emit('particles', {x: redNest.x, y: redNest.y, color: '#ffea00', count: 30, type: 'magic'});
                    
                    if (this.showSystemMessage) this.showSystemMessage("CRIMSON SWARM IS DEFENDING", "#ffea00");
                }

                dir.state = AI_STATE.DEFENDING;
                dir.target = { x: redNest.x, y: redNest.y };
                
                // Panic! Grab ALL red combat bugs on the map and send them home!
                const entities = this.entities;
                const entLen = entities.length;
                for (let i = 0; i < entLen; i++) {
                    let e = entities[i];
                    // The AI director no longer recruits fragile, temporary chaff units, nor does it unbury perfectly hidden Trapdoors!
                    if (e.team === 'red' && e.hp > 0 && e instanceof Spider && e.role !== 'harvester' && e.role !== 'queen' && !e.isZombie && e.role !== 'broodling' && e.role !== 'parasite' && e.burrowState !== 2) {
                        e.commandTarget = { x: redNest.x + MathUtils.randomRange(-100, 100), y: redNest.y + MathUtils.randomRange(-100, 100) };
                        e.isManual = true; // Force them to move
                    }
                }
                return; // Stop thinking until defense is over
            }

            // --- STATE: BUILDING (Rallying troops) ---
            if (dir.state === AI_STATE.BUILDING || dir.state === AI_STATE.DEFENDING) {
                
                // 🚨 FIXED: Cleanly release hijacked defense units, flushing the squad so they can be freshly re-recruited!
                if (dir.state === AI_STATE.DEFENDING) {
                    const entities = this.entities;
                    const entLen = entities.length;
                    for (let i = 0; i < entLen; i++) {
                        let e = entities[i];
                        if (e.team === 'red' && e.hp > 0 && e instanceof Spider) {
                            e.isManual = false;
                            e.commandTarget = null;
                            e.isSquad = false;
                        }
                    }
                    dir.squad.clear(); // Flush the stranded units!
                }

                dir.state = AI_STATE.BUILDING;
                
                // SMART PATHING: Calculate an angle pointing towards the center of the map
                const angleToCenter = Math.atan2((this.world.height / 2) - redNest.y, (this.world.width / 2) - redNest.x);
                
                // 🛡️ [LOGIC FIX] Clamp the rally point to ensure the AI never rallies out of bounds!
                const rawRallyX = redNest.x + Math.cos(angleToCenter) * cfg.rallyDistance;
                const rawRallyY = redNest.y + Math.sin(angleToCenter) * cfg.rallyDistance;
                dir.rallyPoint = { 
                    x: MathUtils.clamp(rawRallyX, 100, this.world.width - 100), 
                    y: MathUtils.clamp(rawRallyY, 100, this.world.height - 100) 
                };

                // 🧃 [JUICE] Subtle visual indicator of the AI's rally point
                if (Math.random() > 0.5) {
                    this.bus.emit('particles', {x: dir.rallyPoint.x, y: dir.rallyPoint.y, color: '#ff2200', count: 5});
                }

                // Recruit idle red combat units into the squad
                const entities = this.entities;
                const entLen = entities.length;
                for (let i = 0; i < entLen; i++) {
                    let e = entities[i];
                    // The AI director no longer recruits fragile, temporary chaff units, nor does it unbury perfectly hidden Trapdoors!
                    if (e.team === 'red' && e.hp > 0 && e instanceof Spider && e.role !== 'harvester' && e.role !== 'queen' && !e.isZombie && e.role !== 'broodling' && e.role !== 'parasite' && e.burrowState !== 2) {
                        if (!dir.squad.has(e) && !e.target) {
                            dir.squad.add(e);
                            e.isSquad = true; // [FIX] Tag them so they ignore base duties
                            // Send them to the rally point
                            e.commandTarget = { 
                                x: dir.rallyPoint.x + MathUtils.randomRange(-cfg.squadSpread, cfg.squadSpread), 
                                y: dir.rallyPoint.y + MathUtils.randomRange(-cfg.squadSpread, cfg.squadSpread) 
                            };
                            e.isManual = true;
                        }
                    }
                }

                // [FIX] Only launch an attack if the opening grace period / wave cooldown has passed!
                if (this.tick >= dir.nextAttackTick && dir.squad.size >= dir.waveSize) {
                    
                    // 🔌 [EXPANDABILITY] Smart Threat Assessment!
                    let bestTarget = null;
                    let bestScore = -1;

                    for (let i = 0; i < entLen; i++) {
                        let e = entities[i];
                        // [FIX] The Director is no longer telepathic! Ignore cloaked units and hidden traps.
                        if (e.team === 'black' && e.hp > 0 && !e.isCloaked) {
                            
                            // Check weight dict (structures use type, spiders use role)
                            const weightKey = e.type || e.role || 'default';
                            let score = cfg.targetWeights[weightKey] || 0;
                            
                            if (score > 0) {
                                // Add a slight randomness to the score so the AI is slightly unpredictable
                                score += MathUtils.randomRange(0, 20);
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestTarget = e;
                                }
                            }
                        }
                    }
                    
                    if (bestTarget) {
                        dir.state = AI_STATE.ATTACKING;
                        dir.target = bestTarget;
                        
                        console.log(`[AI Director] Launching Wave of ${dir.squad.size} units at ${bestTarget.type || bestTarget.role}!`);
                        
                        // 🧃 [JUICE] Terrifying global visual and audio warning!
                        this.bus.emit('playSound', 'death');
                        setTimeout(() => this.bus.emit('playSound', 'death'), 150); // Double-boom roar
                        
                        if (this.triggerShake) this.triggerShake(10);
                        this.bus.emit('particles', {x: redNest.x, y: redNest.y, color: '#ff0000', count: 100, type: 'magic'});
                        
                        // 🧃 [JUICE] Flash system message and drop a radar ping on the minimap
                        if (this.showSystemMessage) this.showSystemMessage("CRIMSON SWARM IS ATTACKING", "#ff0000");
                        if (this.minimapPings) this.minimapPings.push({ x: dir.rallyPoint.x, y: dir.rallyPoint.y, age: 0 });
                    }
                }
            }

            // --- STATE: ATTACKING (Marching on player) ---
            if (dir.state === AI_STATE.ATTACKING) {
                
                // 🚀 [PERFORMANCE & LOGIC FIX] Target Re-evaluation
                // 🚨 FIXED: Re-evaluate target instantly right here without dropping to BUILDING to prevent wave stalling!
                if (!dir.target || dir.target.hp <= 0) {
                    
                    let bestTarget = null;
                    let bestScore = -1;
                    const entities = this.entities;
                    const entLen = entities.length;

                    for (let i = 0; i < entLen; i++) {
                        let e = entities[i];
                        if (e.team === 'black' && e.hp > 0 && !e.isCloaked) {
                            const weightKey = e.type || e.role || 'default';
                            let score = cfg.targetWeights[weightKey] || 0;
                            if (score > 0) {
                                score += MathUtils.randomRange(0, 20);
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestTarget = e;
                                }
                            }
                        }
                    }

                    if (bestTarget) {
                        dir.target = bestTarget;
                    } else {
                        // If NO targets are left on the map, then it's safe to drop to BUILDING and disband!
                        dir.target = null;
                        dir.state = AI_STATE.BUILDING; 
                        dir.nextAttackTick = this.tick + cfg.waveCooldownTicks;
                        
                        for (let bug of dir.squad) {
                            bug.isManual = false;
                            bug.commandTarget = null;
                            bug.isSquad = false; 
                        }
                        dir.squad.clear();
                        return; 
                    }
                }

                // Keep pushing the squad forward to the target (or the newly evaluated target!)
                for (let bug of dir.squad) {
                    bug.commandTarget = { 
                        x: dir.target.x + MathUtils.randomRange(-cfg.squadSpread, cfg.squadSpread), 
                        y: dir.target.y + MathUtils.randomRange(-cfg.squadSpread, cfg.squadSpread) 
                    };
                    bug.isManual = true;
                }

                // If the squad gets wiped out, retreat!
                if (dir.squad.size < (dir.waveSize * cfg.retreatPercentage)) { 
                    console.log(`[AI Director] Wave defeated. Retreating to rebuild!`);
                    dir.state = AI_STATE.BUILDING;
                    dir.nextAttackTick = this.tick + cfg.waveCooldownTicks; // [FIX] Apply wave cooldown!
                    
                    // 🛡️ [FIX] Actually release the survivors so they stop marching to their death!
                    for (let bug of dir.squad) {
                        bug.isManual = false;
                        bug.commandTarget = null;
                        bug.isSquad = false; // [FIX] Strip squad tag so they return to normal duties
                    }
                    
                    dir.squad.clear(); // Release survivors to gather/patrol normally
                }
            }
        });
    }
};
