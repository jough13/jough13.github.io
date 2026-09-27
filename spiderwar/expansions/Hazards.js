// expansions/Hazards.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const HAZARD_CONFIG = {
    flytrapCount: 30,
    flytrapDamage: 200,      // Massive damage, instantly kills most basic units
    flytrapCooldown: 300,    // 10 seconds of "digestion" sleep
    flytrapRadiusSq: 2500,   // 50px trigger radius
    flytrapHp: 300           // Tough enough to require a small squad to clear
};

// ==========================================
// 2. THE VENUS FLYTRAP ENTITY
// ==========================================
export class VenusFlytrap {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.size = 20; 
        this.cooldown = 0;
        this.team = 'nature'; 
        this.hp = HAZARD_CONFIG.flytrapHp; 
        this.maxHp = HAZARD_CONFIG.flytrapHp;
        
        this.age = Math.random() * 100; // Offset animation so they don't all breathe in sync
        
        this.spriteOpenLoaded = false;
        this.spriteOpen = new Image(); 
        this.spriteOpen.onload = () => { this.spriteOpenLoaded = true; };
        this.spriteOpen.src = 'assets/flytrap_open.png';
        
        this.spriteClosedLoaded = false;
        this.spriteClosed = new Image(); 
        this.spriteClosed.onload = () => { this.spriteClosedLoaded = true; };
        this.spriteClosed.src = 'assets/flytrap_closed.png';
    }

    update(game) {
        this.age++;

        // 1. Digestion / Sleep Phase
        if (this.cooldown > 0) { 
            this.cooldown--; 
            
            // Visual digestion particles (Acidic green bubbles)
            if (this.cooldown % 45 === 0) {
                game.bus.emit('particles', {x: this.x, y: this.y - 10, color: '#aaffaa', count: 2});
            }
            return; 
        }
        
        // 2. Ambush / Hunting Phase
        for (let i = 0; i < game.entities.length; i++) {
            let e = game.entities[i];
            
            // Fast early exits: Ignore dead, nature team, and non-spider entities
            if (e.hp <= 0 || !e.team || e.team === 'nature') continue;
            
            if (e instanceof Spider) { 
                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < HAZARD_CONFIG.flytrapRadiusSq) { 
                    
                    e.hp -= HAZARD_CONFIG.flytrapDamage; // CHOMP!
                    this.cooldown = HAZARD_CONFIG.flytrapCooldown; // Go to sleep
                    
                    // Violent blood and acid splatter
                    game.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 15});
                    game.bus.emit('particles', {x: this.x, y: this.y, color: '#55ff55', count: 10});
                    game.bus.emit('playSound', 'death');
                    
                    break; // Only eat one bug at a time!
                }
            }
        }
    }

    draw(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y);
        
        // Organic Breathing Animation
        // Pulses fast when hungry, slow when digesting
        const breathe = this.cooldown > 0 
            ? 1 + Math.sin(this.age * 0.05) * 0.02 
            : 1 + Math.sin(this.age * 0.1) * 0.05;
        ctx.scale(breathe, breathe);

        const isOpen = this.cooldown === 0;
        const activeSprite = isOpen ? this.spriteOpen : this.spriteClosed;
        const isLoaded = isOpen ? this.spriteOpenLoaded : this.spriteClosedLoaded;

        if (isLoaded) {
            ctx.drawImage(activeSprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            // Fallback drawing if sprites are missing
            ctx.fillStyle = isOpen ? '#55ff55' : '#335533';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            if (isOpen) { 
                ctx.fillStyle = 'red'; 
                ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); 
            }
        }
        ctx.restore();

        // Standard Universal Health Bar (Only draw if damaged)
        if (this.hp < this.maxHp && this.hp > 0) {
            const w = this.size * 1.5;
            ctx.fillStyle = 'black'; 
            ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 11, w + 2, 6);
            ctx.fillStyle = 'red'; 
            ctx.fillRect(this.x - w/2, this.y - this.size - 10, w, 4);
            ctx.fillStyle = '#00ff00'; 
            ctx.fillRect(this.x - w/2, this.y - this.size - 10, w * (this.hp / this.maxHp), 4);
        }
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const HazardsExpansion = {
    init: (game) => {
        game.hazardsSpawned = false;
    },

    patch: (game) => {
        // Deterministic Spawning: Hook into game loop, wait for Tick 1
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState === 'playing' && this.tick === 1 && !this.hazardsSpawned) {
                this.hazardsSpawned = true;
                
                let placed = 0;
                let attempts = 0;
                
                // Try to place the hazards primarily on Grass terrain
                while(placed < HAZARD_CONFIG.flytrapCount && attempts < HAZARD_CONFIG.flytrapCount * 3) {
                    attempts++;
                    let x = MathUtils.randomRange(100, this.world.width - 100);
                    let y = MathUtils.randomRange(100, this.world.height - 100);
                    
                    if (this.getTerrainAt(x, y) === 'grass') {
                        this.addEntity(new VenusFlytrap(x, y));
                        placed++;
                    }
                }
            }
        });
    }
};
