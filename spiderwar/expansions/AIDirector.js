// expansions/AIDirector.js
import { Structure, Spider, MathUtils } from '../game.js';
import { Queen } from './Queen.js';
import { AI_PROFILES } from './AdvancedBase.js'; 

// ==========================================
// THE AI DIRECTOR STATE MACHINE
// ==========================================
const AI_STATE = {
    BUILDING: 0,   // Rallying troops at home
    ATTACKING: 1,  // Marching on the player
    DEFENDING: 2   // Panicking and pulling troops back to save a base
};

export const AIDirectorExpansion = {
    init: (game) => {
        console.log("%c[DLC] AI Director Online. The Crimson Swarm is thinking...", "color: #ff0000; font-weight: bold;");
        
        game.aiDirector = {
            state: AI_STATE.BUILDING,
            squad: new Set(),
            target: null,
            rallyPoint: null,
            waveSize: 5 // Starts small, grows over time
        };
    },

    patch: (game) => {
        // Run the AI Director's brain every 60 frames (1 second) to save CPU
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState !== 'playing' || this.tick % 60 !== 0) return;

            const dir = this.aiDirector;
            const diff = AI_PROFILES[this.aiDifficulty] || AI_PROFILES.normal;

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
            let blackNest = null;
            let underAttack = false;

            // PERFORMANCE FIX: Clean for-loop instead of array iterators
            for (let i = 0; i < this.structures.length; i++) {
                let s = this.structures[i];
                if (s.team === 'red' && s.type === 'nest') redNest = s;
                else if (s.team === 'black' && s.type === 'nest') blackNest = s;
                
                // If a red building is damaged, we are under attack!
                if (s.team === 'red' && s.hp < s.maxHp && s.hp > 0) underAttack = true;
            }

            if (!redNest) return; // AI is dead, stop thinking.

            // 4. STATE MACHINE LOGIC
            
            // --- STATE: DEFENDING ---
            if (underAttack) {
                dir.state = AI_STATE.DEFENDING;
                dir.target = { x: redNest.x, y: redNest.y };
                
                // Panic! Grab ALL red combat bugs on the map and send them home!
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    if (e.team === 'red' && e.hp > 0 && e instanceof Spider && e.role !== 'harvester' && e.role !== 'queen') {
                        e.commandTarget = { x: redNest.x + MathUtils.randomRange(-100, 100), y: redNest.y + MathUtils.randomRange(-100, 100) };
                        e.isManual = true; // Force them to move using the same logic the player's mouse uses
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
                    x: redNest.x + Math.cos(angleToCenter) * 250, 
                    y: redNest.y + Math.sin(angleToCenter) * 250 
                };

                // Recruit idle red combat units into the squad
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    // Find living red combat units that aren't already in the squad and aren't busy fighting
                    if (e.team === 'red' && e.hp > 0 && e instanceof Spider && e.role !== 'harvester' && e.role !== 'queen') {
                        if (!dir.squad.has(e) && !e.target) {
                            dir.squad.add(e);
                            // Send them to the rally point
                            e.commandTarget = { x: dir.rallyPoint.x + MathUtils.randomRange(-80, 80), y: dir.rallyPoint.y + MathUtils.randomRange(-80, 80) };
                            e.isManual = true;
                        }
                    }
                }

                // If squad is big enough, LAUNCH THE ATTACK!
                if (dir.squad.size >= dir.waveSize) {
                    dir.state = AI_STATE.ATTACKING;
                    
                    // Pick a target (Player Nest, or Queen if no nest exists)
                    if (blackNest) {
                        dir.target = { x: blackNest.x, y: blackNest.y };
                    } else {
                        // PERFORMANCE FIX: Clean for-loop instead of .find()
                        let blackQueen = null;
                        for (let i = 0; i < this.queens.length; i++) {
                            if (this.queens[i].team === 'black' && this.queens[i].hp > 0) {
                                blackQueen = this.queens[i]; break;
                            }
                        }
                        if (blackQueen) dir.target = { x: blackQueen.x, y: blackQueen.y };
                    }
                    
                    if (dir.target) {
                        console.log(`[AI Director] Launching Wave of ${dir.squad.size} units!`);
                        
                        // JUICE: Terrifying global visual and audio warning!
                        this.bus.emit('playSound', 'death');
                        setTimeout(() => this.bus.emit('playSound', 'death'), 150); // Double-boom roar
                        
                        if (this.triggerShake) this.triggerShake(10);
                        this.bus.emit('particles', {x: redNest.x, y: redNest.y, color: '#ff0000', count: 100, type: 'magic'});
                    }
                }
            }

            // --- STATE: ATTACKING (Marching on player) ---
            if (dir.state === AI_STATE.ATTACKING && dir.target) {
                // Keep pushing the squad forward
                for (let bug of dir.squad) {
                    // Update their target coordinate so they march together
                    // Add slight random offset so they spread out into a frontline (aided by SwarmDynamics!)
                    bug.commandTarget = { 
                        x: dir.target.x + MathUtils.randomRange(-100, 100), 
                        y: dir.target.y + MathUtils.randomRange(-100, 100) 
                    };
                    bug.isManual = true;
                }

                // If the squad gets wiped out, go back to building
                if (dir.squad.size < (dir.waveSize * 0.3)) { // If we lose 70% of the wave, retreat
                    dir.state = AI_STATE.BUILDING;
                    dir.squad.clear(); // Release survivors to gather/patrol normally
                }
            }
        });
    }
};
