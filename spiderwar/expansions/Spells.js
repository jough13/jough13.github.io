// expansions/Spells.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const SPELL_CONFIG = {
    venomStrike: { cost: 50, radius: 100, radiusSq: 10000, life: 600, dps: 5, tickRate: 15 },
    silkTrap:    { cost: 25, radius: 150, radiusSq: 22500, life: 600 }
};

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
            
            // Fast early-exit: Ignore dead units, buildings, and allies
            if (!e.team || e.team === this.team || e.hp <= 0 || !(e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                continue;
            }
            
            // Fast AABB early-exit: If it's not even in the square boundary, skip the heavy circle math!
            if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) {
                continue;
            }

            // High Precision Circle Check
            if (MathUtils.distSq(e.x, e.y, this.x, this.y) < this.radiusSq) {
                
                // Venom Strike: DoT (Damage over Time)
                if (this.type === 'venomStrike') {
                    if (game.tick % SPELL_CONFIG.venomStrike.tickRate === 0) { 
                        e.hp -= SPELL_CONFIG.venomStrike.dps; 
                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 2}); 
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
            ctx.fillStyle = '#00ff00'; 
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
            ctx.fill();
            
            // Caustic ripple effect
            const ripple = this.radius * (0.8 + Math.sin(this.age * 0.1) * 0.1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, ripple, 0, Math.PI * 2); 
            ctx.fill();

            // Random bubbling splashes
            if (Math.random() < 0.2) { 
                ctx.fillStyle = '#fff'; 
                ctx.beginPath(); 
                ctx.arc(this.x + MathUtils.randomRange(-this.radius, this.radius), this.y + MathUtils.randomRange(-this.radius, this.radius), Math.random() * 5, 0, Math.PI * 2); 
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
            for (let i = 0; i < 8; i++) { 
                ctx.moveTo(0, 0); 
                ctx.lineTo(Math.cos(i * Math.PI / 4) * this.radius, Math.sin(i * Math.PI / 4) * this.radius); 
            }
            
            ctx.lineWidth = 2; 
            ctx.strokeStyle = '#fff'; 
            ctx.stroke();
            
            // Concentric magical rings
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2); ctx.stroke();
            
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
                
                const magicColor = data.type === 'venomStrike' ? '#00ff00' : '#ffffff';
                game.bus.emit('particles', {x: data.x, y: data.y, color: magicColor, count: 100});
                game.bus.emit('playSound', 'spell');
            }
        });
    }
}
