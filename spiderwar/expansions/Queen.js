// expansions/Queen.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const QUEEN_CONFIG = {
    hp: 2500,
    damage: 40,
    speed: 0.8,
    size: 28,
    attackSpeed: 30, // Swings once per second
    aggroRadius: 200 // Will defend herself if enemies get this close
};

// ==========================================
// 2. THE QUEEN ENTITY
// ==========================================
export class Queen extends Spider {
    constructor(x, y, team) {
        // Inherit from Spider, assign special 'queen' role
        super(x, y, team, 'queen'); 
        
        this.size = QUEEN_CONFIG.size; 
        this.baseSpeed = QUEEN_CONFIG.speed; 
        this.hp = QUEEN_CONFIG.hp; 
        this.maxHp = QUEEN_CONFIG.hp; 
        this.damage = QUEEN_CONFIG.damage; 
        
        this.commandTarget = null; 
        this.thinkTimer = 0; // Used for Red AI throttling
        this.age = 0;        // Used for deterministic drawing animations

        this.sprite.src = team === 'black' ? 'assets/queen_black.png' : 'assets/queen_red.png';
    }

    update(game) {
        this.age++;

        // 1. Self-Defense Combat Check (Queens hit hard!)
        this.cooldown = (this.cooldown || 0) - 1;
        let nearestEnemy = game.getNearestEnemy(this.x, this.y, this.team, QUEEN_CONFIG.aggroRadius);
        
        if (nearestEnemy) {
            // Face the enemy
            this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            
            const combatRange = nearestEnemy.size ? nearestEnemy.size + this.size : this.size + 10;
            const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
            
            if (distSq <= combatRange * combatRange) {
                if (this.cooldown <= 0) {
                    nearestEnemy.hp -= this.damage + (game.techLevel[this.team] * 5 || 0);
                    this.cooldown = QUEEN_CONFIG.attackSpeed;
                    
                    // Royal Recoil
                    this.x -= Math.cos(this.angle) * 15; 
                    this.y -= Math.sin(this.angle) * 15; 
                    
                    const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                    game.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: magicColor, count: 10}); 
                    game.bus.emit('playSound', 'harvest'); // Squish
                }
                return; // Stop moving if locked in melee combat
            }
        }

        // 2. RED TEAM AI (The Crimson Swarm Commander)
        if (this.team === 'red' && !this.commandTarget) {
            this.thinkTimer--;
            
            if (this.thinkTimer <= 0) {
                this.thinkTimer = 60; // Think once every 2 seconds
                
                // Tactical Evaluation: Don't charge the player immediately!
                // Wait until late game (Tick 9000 = ~5 mins) OR we have a massive army
                if (game.tick > 9000 || game.pop.red >= 40) {
                    // Lead the final assault!
                    const bNests = game.structures.filter(s => s.team === 'black' && s.type === 'nest');
                    if (bNests.length > 0) {
                        this.commandTarget = { x: bNests[0].x, y: bNests[0].y };
                    }
                } else {
                    // Defend own base (Patrol around the Red Nest)
                    const rNests = game.structures.filter(s => s.team === 'red' && s.type === 'nest');
                    if (rNests.length > 0) {
                        this.commandTarget = { 
                            x: rNests[0].x + MathUtils.randomRange(-150, 150), 
                            y: rNests[0].y + MathUtils.randomRange(-150, 150) 
                        };
                    }
                }
            }
        }

        // 3. Movement Execution
        if (this.commandTarget) {
            const dx = this.commandTarget.x - this.x; 
            const dy = this.commandTarget.y - this.y;
            
            // Apply Terrain Modifiers
            const terrain = game.getTerrainAt(this.x, this.y); 
            let tMod = 1.0;
            if(terrain === 'water') tMod = 0.05; 
            if(terrain === 'grass') tMod = 1.3;

            // Apply Tech and Status Modifiers
            let techSpeed = (game.techLevel[this.team] * 0.2); 
            if(this.isSlowed) techSpeed -= (this.baseSpeed / 2); 
            
            const currentSpeed = Math.max(0.1, (this.baseSpeed + techSpeed)) * tMod;

            if (MathUtils.distSq(0,0, dx, dy) > 100) { 
                this.angle = Math.atan2(dy, dx); 
                this.x += Math.cos(this.angle) * currentSpeed; 
                this.y += Math.sin(this.angle) * currentSpeed; 
            } else {
                this.commandTarget = null; // Target reached
            }
        }
        
        // Reset status ailments
        this.isSlowed = false; 
        
        // Ensure the Queen never walks off the map
        this.x = MathUtils.clamp(this.x, this.size, game.world.width - this.size);
        this.y = MathUtils.clamp(this.y, this.size, game.world.height - this.size);
    }

    draw(ctx) {
        super.draw(ctx);
        
        // Draw the tactical command line for the player (Obsidian Brood)
        if (this.team === 'black' && this.commandTarget) {
            ctx.save();
            ctx.strokeStyle = 'rgba(170, 0, 255, 0.6)'; // Obsidian Magic Purple
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 10]);
            
            // "Marching Ants" animation effect flowing toward the target
            ctx.lineDashOffset = -this.age; 
            
            ctx.beginPath(); 
            ctx.moveTo(this.x, this.y); 
            ctx.lineTo(this.commandTarget.x, this.commandTarget.y); 
            ctx.stroke();
            
            // Target Reticle
            ctx.setLineDash([]); 
            ctx.beginPath(); 
            ctx.arc(this.commandTarget.x, this.commandTarget.y, 10, 0, Math.PI * 2); 
            ctx.stroke();
            
            ctx.restore();
        }
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const QueenExpansion = {
    init: (game) => {
        game.queensSpawned = false;
        
        // Hook for UI/Control Commands
        game.bus.on('commandQueen', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if (queen) queen.commandTarget = { x: data.x, y: data.y };
        });
    },

    patch: (game) => {
        // Deterministic Spawning: Wait for Tick 2 (Guarantees bases spawned on Tick 1)
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            
            if (this.gameState === 'playing' && this.tick === 2 && !this.queensSpawned) {
                this.queensSpawned = true;
                
                const bNest = this.structures.find(s => s.team === 'black' && s.type === 'nest'); 
                const rNest = this.structures.find(s => s.team === 'red' && s.type === 'nest');
                
                if (bNest && rNest) {
                    this.addEntity(new Queen(bNest.x + 80, bNest.y + 80, 'black')); 
                    this.addEntity(new Queen(rNest.x - 80, rNest.y - 80, 'red'));
                }
            }
        });
    }
};
