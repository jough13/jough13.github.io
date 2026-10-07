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

// [EXPANDABILITY] Exposed configuration so mods can tweak the Director's intelligence
export const DIRECTOR_CONFIG = {
    rallyDistance: 250,
    squadSpread: 100,
    retreatPercentage: 0.3, // Squad retreats if it loses 70% of its forces
    defenseTimerDuration: 5, // How many seconds the AI stays in defense mode after being hit
    
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
        
        game.aiDirector = {
            state: AI_STATE.BUILDING,
            squad: new Set(),
            target: null,
            rallyPoint: null,
            waveSize: 5, 
            defenseTimer: 0 // [FIX] Tracks active defense time
        };
    },

    patch: (game) => {
        // [PERFORMANCE] Run the AI Director's brain every 60 frames (1 second) to save CPU
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState !== 'playing' || this.tick % 60 !== 0) return;

            const dir = this.aiDirector;
            
            // Allow dynamic fallback if AdvancedBase config isn't loaded yet
            const aiProfiles = this.aiConfig ? this.aiConfig.profiles : AI_PROFILES;
            const diff = aiProfiles[this.aiDifficulty] || aiProfiles.normal;

            // 1. CLEANUP: Remove dead bugs from the assault squad
            for (let bug of dir.squad) {
                if (bug.hp <= 0) dir.squad.delete(bug);
            }

            // 2. ESCALATION: Increase the required wave size as the game goes on
            if (this.tick > diff.phase2Tick) dir.waveSize = 10;
            if (this.tick > diff.phase3Tick) dir.waveSize = 15;
            if (this.tick > diff.phase4Tick) dir.waveSize = 25;

            // 3. IDENTIFY BASES & THREATS
            let redNest = null;
            let activelyAttacked = false;

            for (let i = 0; i < this.structures.length; i++) {
                let s = this.structures[i];
                if (s.team === 'red') {
                    if (s.type === 'nest') redNest = s;
                    
                    // [FIX] INFINITE DEFENSE BUG
                    // We now track _lastHp. The AI only defends if HP actively drops between seconds!
                    if (s._lastHp === undefined) s._lastHp = s.hp;
                    if (s.hp < s._lastHp) {
                        activelyAttacked = true;
                        dir.defenseTimer = DIRECTOR_CONFIG.defenseTimerDuration; // Reset panic timer
                    }
                    s._lastHp = s.hp; // Update history
                }
            }

            if (!redNest) return; // AI is dead, stop thinking.

            if (dir.defenseTimer > 0) dir.defenseTimer--;

            // 4. STATE MACHINE LOGIC
            
            // --- STATE: DEFENDING ---
            if (activelyAttacked || dir.defenseTimer > 0) {
                
                // [JUICE] Alarm reaction if just entering defense mode
                if (dir.state !== AI_STATE.DEFENDING) {
                    this.bus.emit('playSound', 'error'); // Sharp buzzer/alarm
                    this.bus.emit('particles', {x: redNest.x, y: redNest.y, color: '#ffea00', count: 30, type: 'magic'});
                }

                dir.state = AI_STATE.DEFENDING;
                dir.target = { x: redNest.x, y: redNest.y };
                
                // Panic! Grab ALL red combat bugs on the map and send them home!
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    if (e.team === 'red' && e.hp > 0 && e instanceof Spider && e.role !== 'harvester' && e.role !== 'queen') {
                        e.commandTarget = { x: redNest.x + MathUtils.randomRange(-100, 100), y: redNest.y + MathUtils.randomRange(-100, 100) };
                        e.isManual = true; // Force them to move
                    }
                }
                return; // Stop thinking until defense is over
            }

            // --- STATE: BUILDING (Rallying troops) ---
            if (dir.state === AI_STATE.BUILDING || dir.state === AI_STATE.DEFENDING) {
                dir.state = AI_STATE.BUILDING;
                
                // SMART PATHING: Calculate an angle pointing towards the center of the map
                // This ensures the AI never rallies its troops out-of-bounds off the screen!
                const angleToCenter = Math.atan2((this.world.height / 2) - redNest.y, (this.world.width / 2) - redNest.x);
                dir.rallyPoint = { 
                    x: redNest.x + Math.cos(angleToCenter) * DIRECTOR_CONFIG.rallyDistance, 
                    y: redNest.y + Math.sin(angleToCenter) * DIRECTOR_CONFIG.rallyDistance 
                };

                // [JUICE] Subtle visual indicator of the AI's rally point
                if (Math.random() > 0.5) {
                    this.bus.emit('particles', {x: dir.rallyPoint.x, y: dir.rallyPoint.y, color: '#ff2200', count: 5});
                }

                // Recruit idle red combat units into the squad
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    if (e.team === 'red' && e.hp > 0 && e instanceof Spider && e.role !== 'harvester' && e.role !== 'queen') {
                        if (!dir.squad.has(e) && !e.target) {
                            dir.squad.add(e);
                            // Send them to the rally point
                            e.commandTarget = { 
                                x: dir.rallyPoint.x + MathUtils.randomRange(-DIRECTOR_CONFIG.squadSpread, DIRECTOR_CONFIG.squadSpread), 
                                y: dir.rallyPoint.y + MathUtils.randomRange(-DIRECTOR_CONFIG.squadSpread, DIRECTOR_CONFIG.squadSpread) 
                            };
                            e.isManual = true;
                        }
                    }
                }

                // If squad is big enough, LAUNCH THE ATTACK!
                if (dir.squad.size >= dir.waveSize) {
                    
                    // [EXPANDABILITY] Smart Threat Assessment!
                    // Instead of hardcoding the Nest, the AI grades all Black targets and attacks the most valuable one.
                    let bestTarget = null;
                    let bestScore = -1;

                    for (let i = 0; i < this.entities.length; i++) {
                        let e = this.entities[i];
                        if (e.team === 'black' && e.hp > 0) {
                            
                            // Check weight dict (structures use type, spiders use role)
                            const weightKey = e.type || e.role || 'default';
                            let score = DIRECTOR_CONFIG.targetWeights[weightKey] || 0;
                            
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
                        
                        // [JUICE] Terrifying global visual and audio warning!
                        this.bus.emit('playSound', 'death');
                        setTimeout(() => this.bus.emit('playSound', 'death'), 150); // Double-boom roar
                        
                        if (this.triggerShake) this.triggerShake(10);
                        this.bus.emit('particles', {x: redNest.x, y: redNest.y, color: '#ff0000', count: 100, type: 'magic'});
                    }
                }
            }

            // --- STATE: ATTACKING (Marching on player) ---
            if (dir.state === AI_STATE.ATTACKING) {
                
                // [PERFORMANCE & LOGIC FIX] Target Re-evaluation
                // If the target dies before the squad gets there, immediately pick a new one or retreat!
                if (!dir.target || dir.target.hp <= 0) {
                    dir.target = null;
                    dir.state = AI_STATE.BUILDING; // Temporarily drop to building to trigger re-evaluation on next frame
                    return; 
                }

                // Keep pushing the squad forward
                for (let bug of dir.squad) {
                    bug.commandTarget = { 
                        x: dir.target.x + MathUtils.randomRange(-DIRECTOR_CONFIG.squadSpread, DIRECTOR_CONFIG.squadSpread), 
                        y: dir.target.y + MathUtils.randomRange(-DIRECTOR_CONFIG.squadSpread, DIRECTOR_CONFIG.squadSpread) 
                    };
                    bug.isManual = true;
                }

                // If the squad gets wiped out, retreat!
                if (dir.squad.size < (dir.waveSize * DIRECTOR_CONFIG.retreatPercentage)) { 
                    console.log(`[AI Director] Wave defeated. Retreating to rebuild!`);
                    dir.state = AI_STATE.BUILDING;
                    dir.squad.clear(); // Release survivors to gather/patrol normally
                }
            }
        });
    }
};
