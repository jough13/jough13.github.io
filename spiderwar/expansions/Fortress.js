// expansions/Fortress.js
import { MathUtils, Structure } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const FORTRESS_CONFIG = {
    mortarRange: 750,
    mortarMinRangeSq: 22500, // 150px squared
    mortarSplashRadiusSq: 22500, // 150px squared
    mortarCooldown: 180, // 6 seconds at 30fps
    mortarBaseDamage: 150,
    
    shrineHealRadiusSq: 62500, // 250px squared
    shrineHealAmount: 15,
    shrinePulseRate: 30 // Pulses once per second
};

// ==========================================
// 2. BALLISTIC ARTILLERY SHELL
// ==========================================
export class MortarShell {
    constructor(startX, startY, targetX, targetY, damage, team) {
        this.startX = startX; this.startY = startY;
        this.x = startX; this.y = startY;
        this.targetX = targetX; this.targetY = targetY;
        this.damage = damage; 
        this.team = team;
        this.active = true;
        
        const totalDist = MathUtils.dist(startX, startY, targetX, targetY);
        const speed = 4.5;
        this.flightFrames = Math.max(1, totalDist / speed); 
        this.currentFrame = 0;
    }

    update(game) {
        this.currentFrame++;
        let progress = this.currentFrame / this.flightFrames;
        
        if (progress >= 1.0) {
            this.active = false;
            game.bus.emit('playSound', 'death'); 
            
            const primaryColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            const secondaryColor = this.team === 'black' ? '#ffffff' : '#ffaa00';
            
            game.bus.emit('particles', {x: this.targetX, y: this.targetY, color: primaryColor, count: 50});
            game.bus.emit('particles', {x: this.targetX, y: this.targetY, color: secondaryColor, count: 30});
            
            // Splash Damage Calculation
            for (let i = 0; i < game.entities.length; i++) {
                let e = game.entities[i];
                
                // FIX A: Ignore dead units, allies, AND Nature units
                if (!e.team || e.team === this.team || e.team === 'nature' || e.hp <= 0) continue;
                
                if (MathUtils.distSq(this.targetX, this.targetY, e.x, e.y) < FORTRESS_CONFIG.mortarSplashRadiusSq) {
                    // FIX A: Full damage to units, 50% damage to buildings
                    // (Checking e.role is a quick way to identify spiders without needing new imports)
                    if (e.role || e.constructor.name === 'CentipedeBoss') {
                        e.hp -= this.damage;
                    } else {
                        e.hp -= (this.damage * 0.5);
                    }
                }
            }
        } else {
            this.x = MathUtils.lerp(this.startX, this.targetX, progress);
            this.y = MathUtils.lerp(this.startY, this.targetY, progress);
        }
    }

    draw(ctx) {
        let progress = this.currentFrame / this.flightFrames;
        let z = Math.sin(progress * Math.PI) * 100; 
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(2, 8 - (z / 20)), 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ff5500';
        ctx.beginPath(); ctx.arc(this.x, this.y - z, 10, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.x, this.y - z, 4, 0, Math.PI * 2); ctx.fill();
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const FortressExpansion = {
    patch: (game) => {
        
        // PATCH: Structure AI Logic
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj); // Run normal logic
            
            if (this.isConstructing || this.hp <= 0) return;

            // 1. Web Mortar Artillery Logic
            if (this.type === 'mortar') {
                this.cooldown = this.cooldown || 0;
                if (this.cooldown > 0) this.cooldown--;
                
                if (this.cooldown <= 0) {
                    let target = gameObj.getNearestEnemy(this.x, this.y, this.team, FORTRESS_CONFIG.mortarRange);
                    
                    // Minimum range check (Can't fire at things right at its base, mimicking real artillery)
                    if (target && MathUtils.distSq(this.x, this.y, target.x, target.y) > FORTRESS_CONFIG.mortarMinRangeSq) {
                        
                        const actualDamage = FORTRESS_CONFIG.mortarBaseDamage + ((gameObj.techLevel[this.team] || 0) * 15);
                        gameObj.addEntity(new MortarShell(this.x, this.y, target.x, target.y, actualDamage, this.team));
                        
                        gameObj.bus.emit('playSound', 'shoot'); 
                        this.cooldown = FORTRESS_CONFIG.mortarCooldown; 
                    }
                }
            }

            // 2. Nectar Shrine Healing Logic
            if (this.type === 'shrine') {
                // Manage the visual aura animation
                this.auraAlpha = Math.max(0, (this.auraAlpha || 0) - 0.05);

                if (gameObj.tick % FORTRESS_CONFIG.shrinePulseRate === 0) {
                    let healed = false;
                    
                    // Pre-calculate max health boost ONCE outside the loop for performance
                    const techBoost = (gameObj.techLevel[this.team] || 0) * 20;

                    for (let i = 0; i < gameObj.entities.length; i++) {
                        let e = gameObj.entities[i];
                        
                        // Fast early-exits: Must be friendly, alive, and missing health!
                        if (e.team !== this.team || e.hp <= 0 || e.hp >= e.maxHp + techBoost) continue;

                        if (MathUtils.distSq(this.x, this.y, e.x, e.y) < FORTRESS_CONFIG.shrineHealRadiusSq) {
                            e.hp = Math.min(e.maxHp + techBoost, e.hp + FORTRESS_CONFIG.shrineHealAmount);
                            healed = true;
                            // Emit a tiny green sparkle on the healed unit
                            gameObj.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 1});
                        }
                    }
                    
                    // Emit a pulse from the Shrine if it successfully healed something
                    if (healed) {
                        this.auraAlpha = 1.0; // Trigger the visual expanding ring
                        gameObj.bus.emit('particles', {x: this.x, y: this.y - 20, color: '#00ff00', count: 8});
                    }
                }
            }
        });

        // PATCH: Structure Rendering
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            
            // Draw Shrine Healing Aura underneath the structure
            if (this.type === 'shrine' && this.auraAlpha > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.strokeStyle = `rgba(0, 255, 0, ${this.auraAlpha})`;
                ctx.lineWidth = 4;
                
                // Ring expands as it fades out
                const radius = MathUtils.lerp(Math.sqrt(FORTRESS_CONFIG.shrineHealRadiusSq), this.size, this.auraAlpha);
                ctx.beginPath(); 
                ctx.arc(0, 0, radius, 0, Math.PI * 2); 
                ctx.stroke();
                ctx.restore();
            }

            // Draw Sprite or Fallback Art
            if (this.spriteLoaded) {
                original.call(this, ctx);
            } else {
                ctx.save();
                if (this.type === 'mortar') {
                    // Improved chunky fallback art for Mortar
                    ctx.fillStyle = this.team === 'black' ? '#333' : '#522'; 
                    ctx.beginPath(); ctx.ellipse(this.x, this.y, 25, 20, 0, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#111'; 
                    ctx.beginPath(); ctx.arc(this.x, this.y - 5, 12, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ff5500';
                    ctx.beginPath(); ctx.arc(this.x, this.y - 5, 5, 0, Math.PI*2); ctx.fill();
                } 
                else if (this.type === 'shrine') {
                    // Improved chunky fallback art for Shrine
                    ctx.fillStyle = '#225522'; 
                    ctx.beginPath(); ctx.moveTo(this.x, this.y - 30); ctx.lineTo(this.x + 20, this.y + 15); ctx.lineTo(this.x - 20, this.y + 15); ctx.fill();
                    ctx.fillStyle = '#00ff00'; 
                    ctx.beginPath(); ctx.ellipse(this.x, this.y + 15, 22, 8, 0, 0, Math.PI*2); ctx.fill();
                } 
                else {
                    original.call(this, ctx); // Run original for Nests, Pylons, etc.
                }
                ctx.restore();
            }
        });
    }
};
