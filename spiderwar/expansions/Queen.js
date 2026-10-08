// expansions/Queen.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported config so other mods can tweak the commander's stats
export const QUEEN_CONFIG = {
    hp: 2500,
    damage: 40,
    speed: 0.8,
    size: 28,
    attackSpeed: 30,  // Swings once per second
    aggroRadius: 100, // PERFORMANCE FIX: Reduced from 200. She only bites if you get right in her face!
    
    // Crimson Swarm AI Triggers
    aiAttackTick: 9000, // ~5 mins (When she decides to lead the charge)
    aiAttackPop: 40     // If her swarm gets this big, she attacks early
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
        
        // [JUICE] Animation Offsets
        this.animOffset = parseInt(this.id, 36) % 100;
        this.age = 0;

        this.ramSpriteLoaded = false; // Prevents reloading the image outside of RAM cache
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        // Instantly grabs the preloaded sprite from RAM instead of making the browser resolve a path
        if (!this.ramSpriteLoaded && game.assets) {
            this.sprite = game.assets.get(this.team === 'black' ? 'assets/queen_black.png' : 'assets/queen_red.png');
            this.imageLoaded = true; // Tell base class it's ready to draw
            this.ramSpriteLoaded = true;
        }

        this.age++;

        // 1. Self-Defense Combat Check (Queens hit hard!)
        this.cooldown = (this.cooldown || 0) - 1;
        let nearestEnemy = game.getNearestEnemy(this.x, this.y, this.team, QUEEN_CONFIG.aggroRadius);
        
        if (nearestEnemy) {
            // [JUICE] Smooth organic turning towards the enemy
            const targetAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            this.angle += MathUtils.angleWrap(targetAngle - this.angle) * 0.15;
            
            const combatRangeSq = (nearestEnemy.size ? nearestEnemy.size + this.size : this.size + 10) ** 2;
            const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
            
            if (distSq <= combatRangeSq) {
                if (this.cooldown <= 0) {
                    nearestEnemy.hp -= this.damage + (game.techLevel[this.team] * 5 || 0);
                    this.cooldown = QUEEN_CONFIG.attackSpeed;
                    
                    // Royal Recoil
                    this.x -= Math.cos(this.angle) * 15; 
                    this.y -= Math.sin(this.angle) * 15; 
                    
                    // [JUICE] Massive hit impact!
                    if (game.triggerShake) game.triggerShake(5);
                    const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                    game.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: magicColor, count: 15}); 
                    game.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: '#ff0000', count: 10, type: 'splatter'}); 
                    game.bus.emit('playSound', 'harvest'); // Squish
                }
                return; // Stop moving if locked in melee combat
            }
        }

        // 2. RED TEAM AI (The Crimson Swarm Commander)
        if (this.team === 'red' && !this.commandTarget) {
            this.thinkTimer--;
            
            if (this.thinkTimer <= 0) {
                this.thinkTimer = 90; // [FIX] Think once every 1.5 seconds so she doesn't jitter while leading an attack
                
                // Tactical Evaluation: Don't charge the player immediately!
                // Wait until late game OR we have a massive army
                if (game.tick > QUEEN_CONFIG.aiAttackTick || game.pop.red >= QUEEN_CONFIG.aiAttackPop) {
                    
                    // Lead the final assault! (PERFORMANCE FIX: No .filter allocation)
                    let targetNest = null;
                    const structs = game.structures; // Cache getter
                    for (let i = 0; i < structs.length; i++) {
                        let s = structs[i];
                        if (s.team === 'black' && s.type === 'nest' && s.hp > 0) {
                            targetNest = s; break;
                        }
                    }
                    if (targetNest) this.commandTarget = { x: targetNest.x, y: targetNest.y };
                    
                } else {
                    
                    // Defend own base - Patrol around the Red Nest (PERFORMANCE FIX: No .filter allocation)
                    let homeNest = null;
                    const structs = game.structures; // Cache getter
                    for (let i = 0; i < structs.length; i++) {
                        let s = structs[i];
                        if (s.team === 'red' && s.type === 'nest' && s.hp > 0) {
                            homeNest = s; break;
                        }
                    }
                    if (homeNest) {
                        this.commandTarget = { 
                            x: homeNest.x + MathUtils.randomRange(-150, 150), 
                            y: homeNest.y + MathUtils.randomRange(-150, 150) 
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

            // [PERFORMANCE] Avoid square root lookup for distance
            if ((dx * dx + dy * dy) > 100) { 
                
                // [JUICE] Smooth organic turning towards target
                const targetAngle = Math.atan2(dy, dx); 
                this.angle += MathUtils.angleWrap(targetAngle - this.angle) * 0.10;
                
                this.x += Math.cos(this.angle) * currentSpeed; 
                this.y += Math.sin(this.angle) * currentSpeed; 
            } else {
                this.commandTarget = null; // Target reached
            }
        }
        
        // Reset status ailments
        this.isSlowed = false; 
        
        // Ensure the Queen never walks off the map
        const bnd = this.size * 2;
        this.x = MathUtils.clamp(this.x, bnd, game.world.width - bnd);
        this.y = MathUtils.clamp(this.y, bnd, game.world.height - bnd);
    }

    // [FIX] Added game parameter so breathing animation inherits correctly
    draw(ctx, game) {
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle); 
        
        // [JUICE] Organic breathing animation! Faster when walking or fighting.
        const tick = game ? game.tick : 0;
        const breathSpeed = (this.commandTarget || this.cooldown > 0) ? 0.2 : 0.05;
        const breath = 1 + Math.sin(tick * breathSpeed + this.animOffset) * 0.05;
        ctx.scale(breath, 1 / breath);
        
        // ASPECT RATIO FIX: Queen sprites can now be rectangular!
        if (this.imageLoaded && this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) { 
            const aspect = this.sprite.naturalWidth / this.sprite.naturalHeight;
            const drawH = this.size * 2;
            const drawW = drawH * aspect;
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            // [JUICE] Add drop shadow to fallback graphics
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
            
            ctx.fillStyle = this.team; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
            
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; // Reset
            ctx.fillStyle = 'white'; ctx.fillRect(this.size/2, -3, 4, 6);
        }
        ctx.restore();
        
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
            ctx.arc(this.commandTarget.x, this.commandTarget.y, 10, 0, MathUtils.TWO_PI); 
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
        
        // [EXPANDABILITY] Export config to the game engine
        game.queenConfig = QUEEN_CONFIG;

        // --- ASSET REGISTRY ---
        game.assets.register('assets/queen_black.png');
        game.assets.register('assets/queen_red.png');

        // Hook for UI/Control Commands
        game.bus.on('commandQueen', (data) => {
            // PERFORMANCE FIX: Clean loop instead of array GC allocation
            let targetQueen = null;
            for (let i = 0; i < game.entities.length; i++) {
                if (game.entities[i].role === 'queen' && game.entities[i].team === data.team) {
                    targetQueen = game.entities[i];
                    break;
                }
            }
            if (targetQueen) targetQueen.commandTarget = { x: data.x, y: data.y };
        });
    },

    patch: (game) => {
        // Deterministic Spawning: Wait for Tick 2 (Guarantees bases spawned on Tick 1)
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            
            if (this.gameState === 'playing' && this.tick === 2 && !this.queensSpawned) {
                this.queensSpawned = true;
                
                // PERFORMANCE FIX: Clean loop instead of multiple filter/find allocations
                let bNest = null;
                let rNest = null;
                
                const structs = this.structures; // Cache
                for (let i = 0; i < structs.length; i++) {
                    let s = structs[i];
                    if (s.type === 'nest') {
                        if (s.team === 'black' && !bNest) bNest = s;
                        else if (s.team === 'red' && !rNest) rNest = s;
                    }
                }
                
                if (bNest && rNest) {
                    this.addEntity(new Queen(bNest.x + 80, bNest.y + 80, 'black')); 
                    this.addEntity(new Queen(rNest.x - 80, rNest.y - 80, 'red'));
                }
            }
        });
    }
};
