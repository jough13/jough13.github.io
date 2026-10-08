// expansions/Spells.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak spell parameters
export const SPELL_CONFIG = {
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
        
        // [JUICE] Pop-in scale animation
        this.spawnScale = 0.1;
    }

    update(game) {
        this.life--;

        // [JUICE] Scale up rapidly on spawn
        if (this.spawnScale < 1.0) {
            this.spawnScale = Math.min(1.0, this.spawnScale + 0.15);
        }

        // PERFORMANCE FIX: Clamped Spatial Grid Lookup!
        // Prevents OOB (Out-of-Bounds) lookups if spells are cast near the edge of the map.
        const CELL_SIZE = 250; 
        const maxGridX = Math.ceil(game.world.width / CELL_SIZE);
        const maxGridY = Math.ceil(game.world.height / CELL_SIZE);

        const minCx = MathUtils.clamp(((this.x - this.radius) / CELL_SIZE) | 0, 0, maxGridX);
        const maxCx = MathUtils.clamp(((this.x + this.radius) / CELL_SIZE) | 0, 0, maxGridX);
        const minCy = MathUtils.clamp(((this.y - this.radius) / CELL_SIZE) | 0, 0, maxGridY);
        const maxCy = MathUtils.clamp(((this.y + this.radius) / CELL_SIZE) | 0, 0, maxGridY);

        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                
                const key = (cx << 16) | cy;
                const cell = game.spatialGrid.get(key);
                if (!cell) continue; 

                for (let i = 0; i < cell.length; i++) {
                    let e = cell[i];
                    
                    // Fast early-exit: Ignore dead units, allies, and non-spider/boss entities
                    if (!e.team || e.team === this.team || e.hp === undefined || e.hp <= 0) continue;
                    if (!(e instanceof Spider || e.constructor.name === 'CentipedeBoss')) continue;
                    
                    // Fast AABB early-exit
                    if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) continue;

                    // High Precision Circle Check
                    if (MathUtils.distSq(e.x, e.y, this.x, this.y) < this.radiusSq) {
                        
                        // Venom Strike: DoT (Damage over Time)
                        if (this.type === 'venomStrike') {
                            if (game.tick % SPELL_CONFIG.venomStrike.tickRate === 0) { 
                                e.hp -= SPELL_CONFIG.venomStrike.dps; 
                                game.bus.emit('particles', {x: e.x, y: e.y, color: SPELL_CONFIG.venomStrike.color, count: 2, type: 'magic'}); 
                            }
                        } 
                        // Silk Trap: Movement Debuff
                        else if (this.type === 'silkTrap') { 
                            e.isSlowed = true; 
                        }
                    }
                }
            }
        }
    }

    // [FIX] Update signature to accept game object for Hit-Stop syncing
    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Apply the pop-in scaling
        ctx.scale(this.spawnScale, this.spawnScale);
        
        // Fade in at the start, fade out at the end
        ctx.globalAlpha = Math.min(this.life / 60, 0.4); 
        
        const tick = game ? game.tick : 0;
        
        if (this.type === 'venomStrike') {
            // Animated bubbling acid pool
            ctx.fillStyle = SPELL_CONFIG.venomStrike.color; 
            
            // [JUICE] Glowing acid aura
            ctx.shadowColor = SPELL_CONFIG.venomStrike.color;
            ctx.shadowBlur = 20;
            
            ctx.beginPath(); 
            ctx.arc(0, 0, this.radius, 0, MathUtils.TWO_PI); 
            ctx.fill();
            
            ctx.shadowBlur = 0; // Reset
            
            // Caustic ripple effect synced to global tick
            const ripple = this.radius * (0.8 + Math.sin(tick * 0.1) * 0.1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath(); 
            ctx.arc(0, 0, ripple, 0, MathUtils.TWO_PI); 
            ctx.fill();

            // Random bubbling splashes
            if (Math.random() < 0.2) { 
                ctx.fillStyle = '#fff'; 
                ctx.beginPath(); 
                
                const rx = (Math.random() * 2 - 1) * this.radius;
                const ry = (Math.random() * 2 - 1) * this.radius;
                
                ctx.arc(rx, ry, Math.random() * 5, 0, MathUtils.TWO_PI); 
                ctx.fill(); 
            }
        } 
        else if (this.type === 'silkTrap') {
            // Mesmerizing, slow rotation animation synced to global tick
            ctx.rotate(tick * 0.01);
            
            ctx.fillStyle = '#ffffff'; 
            
            // [JUICE] Ethereal web glow
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            
            // 8-point star web
            const PI_OVER_4 = MathUtils.HALF_PI / 2;
            for (let i = 0; i < 8; i++) { 
                ctx.moveTo(0, 0); 
                ctx.lineTo(Math.cos(i * PI_OVER_4) * this.radius, Math.sin(i * PI_OVER_4) * this.radius); 
            }
            
            ctx.lineWidth = 2; 
            ctx.strokeStyle = '#fff'; 
            ctx.stroke();
            
            // Concentric magical rings
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.6, 0, MathUtils.TWO_PI); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.3, 0, MathUtils.TWO_PI); ctx.stroke();
            
            ctx.shadowBlur = 0; // Reset
        }
        
        ctx.restore();
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const SpellExpansion = {
    init: (game) => {
        // [EXPANDABILITY] Export config to the game engine
        game.spellConfig = SPELL_CONFIG;

        game.bus.on('castSpell', (data) => {
            const config = SPELL_CONFIG[data.type];
            if (!config) return;

            if (game.eco[data.team].dew >= config.cost) {
                game.eco[data.team].dew -= config.cost; 
                
                game.addEntity(new Spell(data.x, data.y, data.team, data.type));
                
                // [JUICE] Trigger the expanding sonar ring particle!
                game.bus.emit('particles', {x: data.x, y: data.y, color: config.color, count: 1, type: 'ring'});
                game.bus.emit('particles', {x: data.x, y: data.y, color: config.color, count: 50, type: 'magic'});
                
                // JUICE: Camera shake for heavy offensive spells!
                if (data.type === 'venomStrike') {
                    if (game.triggerShake) game.triggerShake(12);
                    game.bus.emit('playSound', 'death'); // Heavy explosion
                } else {
                    game.bus.emit('playSound', 'spell'); // Ethereal chime
                }
            }
        });
    }
};
