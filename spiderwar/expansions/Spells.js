// expansions/Spells.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const SPELL_CONFIG = {
    venomStrike: { 
        cost: 50, 
        radius: 100, 
        radiusSq: 10000, 
        life: 600, 
        dps: 5, 
        tickRate: 15,
        color: '#00ff00' 
    },
    silkTrap: { 
        cost: 25, 
        radius: 150, 
        radiusSq: 22500, 
        life: 600,
        color: '#ffffff'
    }
};

const TWO_PI = Math.PI * 2;
const PI_OVER_4 = Math.PI / 4;

// ==========================================
// 2. THE SPELL ENTITY (Area of Effect)
// ==========================================
export class Spell {
    constructor(x, y, team, type) { 
        this.x = x; 
        this.y = y; 
        this.team = team; 
        this.type = type; 
        
        const config = SPELL_CONFIG[type];
        this.life = config.life; 
        this.radius = config.radius; 
        this.radiusSq = config.radiusSq;
        
        this.age = 0; // Deterministic animation timer
    }

    update(game) {
        this.life--;
        this.age++;

        // Fast Iteration Loop
        for (let i = 0; i < game.entities.length; i++) {
            let e = game.entities[i];
            
            // Fast early-exit: Ignore dead units, allies, and non-spider/boss entities
            // SAFETY FIX: Added strict e.hp === undefined check
            if (!e.team || e.team === this.team || e.hp === undefined || e.hp <= 0) continue;
            if (!(e instanceof Spider || e.constructor.name === 'CentipedeBoss')) continue;
            
            // PERFORMANCE FIX: Fast AABB early-exit
            // If it's not even in the square boundary, skip the heavy circle math!
            if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) continue;

            // High Precision Circle Check
            if (MathUtils.distSq(e.x, e.y, this.x, this.y) < this.radiusSq) {
                
                // Venom Strike: DoT (Damage over Time)
                if (this.type === 'venomStrike') {
                    if (game.tick % SPELL_CONFIG.venomStrike.tickRate === 0) { 
                        e.hp -= SPELL_CONFIG.venomStrike.dps; 
                        game.bus.emit('particles', {x: e.x, y: e.y, color: SPELL_CONFIG.venomStrike.color, count: 2}); 
                    }
                } 
                // Silk Trap: Movement Debuff
                else if (this.type === 'silkTrap') { 
                    e.isSlowed = true; 
                }
            }
        }
    }

    draw(ctx) {
        // Fade in at the start, fade out at the end
        ctx.globalAlpha = Math.min(this.life / 60, 0.4); 
        
        if (this.type === 'venomStrike') {
            // Animated bubbling acid pool
            ctx.fillStyle = SPELL_CONFIG.venomStrike.color; 
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.radius, 0, TWO_PI); 
            ctx.fill();
            
            // Caustic ripple effect
            const ripple = this.radius * (0.8 + Math.sin(this.age * 0.1) * 0.1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, ripple, 0, TWO_PI); 
            ctx.fill();

            // Random bubbling splashes
            if (Math.random() < 0.2) { 
                ctx.fillStyle = '#fff'; 
                ctx.beginPath(); 
                
                // PERFORMANCE FIX: Inlined random range calculation avoids function call overhead
                const rx = this.x + (Math.random() * 2 - 1) * this.radius;
                const ry = this.y + (Math.random() * 2 - 1) * this.radius;
                
                ctx.arc(rx, ry, Math.random() * 5, 0, TWO_PI); 
                ctx.fill(); 
            }
        } 
        else if (this.type === 'silkTrap') {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            // Mesmerizing, slow rotation animation
            ctx.rotate(this.age * 0.01);
            
            ctx.fillStyle = '#ffffff'; 
            ctx.beginPath();
            
            // 8-point star web
            // PERFORMANCE FIX: PI_OVER_4 constant saves division math in the loop
            for (let i = 0; i < 8; i++) { 
                ctx.moveTo(0, 0); 
                ctx.lineTo(Math.cos(i * PI_OVER_4) * this.radius, Math.sin(i * PI_OVER_4) * this.radius); 
            }
            
            ctx.lineWidth = 2; 
            ctx.strokeStyle = '#fff'; 
            ctx.stroke();
            
            // Concentric magical rings
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.6, 0, TWO_PI); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.3, 0, TWO_PI); ctx.stroke();
            
            ctx.restore();
        }
        
        ctx.globalAlpha = 1.0;
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const SpellExpansion = {
    init: (game) => {
        game.bus.on('castSpell', (data) => {
            const config = SPELL_CONFIG[data.type];
            if (!config) return;

            if (game.eco[data.team].dew >= config.cost) {
                game.eco[data.team].dew -= config.cost; 
                
                game.addEntity(new Spell(data.x, data.y, data.team, data.type));
                
                // EXPANDABILITY FIX: Pulls color directly from config
                game.bus.emit('particles', {x: data.x, y: data.y, color: config.color, count: 100});
                game.bus.emit('playSound', 'spell');
            }
        });
    }
};
