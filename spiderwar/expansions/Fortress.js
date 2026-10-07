// expansions/Fortress.js
import { MathUtils, Structure } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak artillery and healing stats!
export const FORTRESS_CONFIG = {
    // Mortar Artillery
    mortarRange: 750,
    mortarMinRangeSq: 22500,     // 150px squared
    mortarSplashRadius: 150,     
    mortarSplashRadiusSq: 22500, // 150^2 pre-calculated for fast AABB math
    mortarCooldown: 180,         // 6 seconds at 30fps
    mortarBaseDamage: 150,
    mortarShellSpeed: 4.5,       // Flight speed of the projectile
    
    // Nectar Shrine Healing
    shrineHealRadius: 250,       
    shrineHealRadiusSq: 62500,   // 250^2 pre-calculated for fast AABB math
    shrineHealAmount: 15,
    shrinePulseRate: 30,         // Pulses once per second
    shrineAuraFade: 0.05         // Visual fade speed of the healing ring
};

const TWO_PI = Math.PI * 2;

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
        this.flightFrames = Math.max(1, totalDist / FORTRESS_CONFIG.mortarShellSpeed); 
        this.currentFrame = 0;
    }

    update(game) {
        this.currentFrame++;
        let progress = this.currentFrame / this.flightFrames;
        
        if (progress >= 1.0) {
            this.active = false;
            
            // [JUICE] Massive Artillery Impact!
            if (game.triggerShake) game.triggerShake(10);
            game.bus.emit('playSound', 'death'); 
            
            const primaryColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            const secondaryColor = this.team === 'black' ? '#ffffff' : '#ffaa00';
            
            game.bus.emit('particles', {x: this.targetX, y: this.targetY, color: primaryColor, count: 50, type: 'magic'});
            game.bus.emit('particles', {x: this.targetX, y: this.targetY, color: secondaryColor, count: 30});
            game.bus.emit('particles', {x: this.targetX, y: this.targetY, color: '#3d2817', count: 40}); // Dirt clods
            
            // [PERFORMANCE] Splash Damage Calculation using O(1) Spatial Grid!
            const CELL_SIZE = 250;
            const cx = Math.max(0, (this.targetX / CELL_SIZE) | 0);
            const cy = Math.max(0, (this.targetY / CELL_SIZE) | 0);
            const radiusSq = FORTRESS_CONFIG.mortarSplashRadiusSq;

            for (let nx = cx - 1; nx <= cx + 1; nx++) {
                if (nx < 0) continue;
                for (let ny = cy - 1; ny <= cy + 1; ny++) {
                    if (ny < 0) continue;
                    
                    const key = (nx << 16) | ny;
                    const cell = game.spatialGrid.get(key);
                    if (!cell) continue;

                    for (let i = 0; i < cell.length; i++) {
                        let e = cell[i];
                        
                        // Fast Early Exits
                        if (!e.team || e.team === this.team || e.team === 'nature' || e.hp === undefined || e.hp <= 0) continue;
                        
                        // Fast AABB check skips expensive circle math for distant units
                        if (Math.abs(this.targetX - e.x) > FORTRESS_CONFIG.mortarSplashRadius || Math.abs(this.targetY - e.y) > FORTRESS_CONFIG.mortarSplashRadius) continue;

                        if (MathUtils.distSq(this.targetX, this.targetY, e.x, e.y) < radiusSq) {
                            if (e.role || e.constructor.name === 'CentipedeBoss') {
                                e.hp -= this.damage;
                            } else {
                                e.hp -= (this.damage * 0.5); // 50% damage to buildings
                            }
                        }
                    }
                }
            }
        } else {
            // Animate flight path
            this.x = MathUtils.lerp(this.startX, this.targetX, progress);
            this.y = MathUtils.lerp(this.startY, this.targetY, progress);
            
            // [JUICE] Smoke trail matching the Z-axis elevation!
            if (game.tick % 2 === 0) {
                let z = Math.sin(progress * Math.PI) * 100;
                game.bus.emit('particles', {x: this.x, y: this.y - z, color: 'rgba(200,200,200,0.5)', count: 1});
            }
        }
    }

    draw(ctx) {
        let progress = this.currentFrame / this.flightFrames;
        // Sine wave arc for Z-axis height during flight
        let z = Math.sin(progress * Math.PI) * 100; 
        
        // Ground Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(2, 8 - (z / 20)), 0, TWO_PI); ctx.fill();
        
        // Main Projectile Body (Elevated by Z)
        ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ff5500';
        ctx.beginPath(); ctx.arc(this.x, this.y - z, 10, 0, TWO_PI); ctx.fill();
        
        // Projectile Core glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(this.x, this.y - z, 4, 0, TWO_PI); ctx.fill();
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const FortressExpansion = {
    init: (game) => {
        // [EXPANDABILITY] Hook config to game engine
        game.fortressConfig = FORTRESS_CONFIG;

        // --- ASSET REGISTRY ---
        game.assets.register('assets/mortar_black.png');
        game.assets.register('assets/mortar_red.png');
        game.assets.register('assets/shrine_black.png');
        game.assets.register('assets/shrine_red.png');
    },

    patch: (game) => {
        
        // PATCH: Structure AI Logic
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj); // Run normal logic
            
            if (this.isConstructing || this.hp <= 0) return;

            // 1. Web Mortar Artillery Logic
            if (this.type === 'mortar') {
                this.cooldown = this.cooldown || 0;
                if (this.cooldown > 0) this.cooldown--;
                
                // [JUICE] Manage Recoil Animation State
                if (this.fireAnim > 0) this.fireAnim--;
                
                if (this.cooldown <= 0) {
                    let target = gameObj.getNearestEnemy(this.x, this.y, this.team, FORTRESS_CONFIG.mortarRange);
                    
                    // Minimum range check (Can't fire at things right at its base, mimicking real artillery)
                    if (target && MathUtils.distSq(this.x, this.y, target.x, target.y) > FORTRESS_CONFIG.mortarMinRangeSq) {
                        
                        const actualDamage = FORTRESS_CONFIG.mortarBaseDamage + ((gameObj.techLevel[this.team] || 0) * 15);
                        gameObj.addEntity(new MortarShell(this.x, this.y, target.x, target.y, actualDamage, this.team));
                        
                        // [JUICE] Recoil Shake & Squash Animation
                        if (gameObj.triggerShake) gameObj.triggerShake(4); 
                        gameObj.bus.emit('playSound', 'shoot'); 
                        this.fireAnim = 12; // Trigger structural squash animation
                        this.cooldown = FORTRESS_CONFIG.mortarCooldown; 
                    }
                }
            }

            // 2. Nectar Shrine Healing Logic
            if (this.type === 'shrine') {
                // Manage the visual aura animation
                this.auraAlpha = Math.max(0, (this.auraAlpha || 0) - FORTRESS_CONFIG.shrineAuraFade);

                if (gameObj.tick % FORTRESS_CONFIG.shrinePulseRate === 0) {
                    let healed = false;
                    
                    // Pre-calculate variables outside the loop for maximum performance
                    const techBoost = (gameObj.techLevel[this.team] || 0) * 20;
                    const radius = FORTRESS_CONFIG.shrineHealRadius;
                    const radiusSq = FORTRESS_CONFIG.shrineHealRadiusSq;

                    // [PERFORMANCE] Spatial Grid Lookup for Healing!
                    const CELL_SIZE = 250;
                    const cx = Math.max(0, (this.x / CELL_SIZE) | 0);
                    const cy = Math.max(0, (this.y / CELL_SIZE) | 0);

                    for (let nx = cx - 1; nx <= cx + 1; nx++) {
                        if (nx < 0) continue;
                        for (let ny = cy - 1; ny <= cy + 1; ny++) {
                            if (ny < 0) continue;
                            
                            const key = (nx << 16) | ny;
                            const cell = gameObj.spatialGrid.get(key);
                            if (!cell) continue;

                            for (let i = 0; i < cell.length; i++) {
                                let e = cell[i];
                                
                                // Fast early-exits: Must be friendly, alive, and missing health!
                                if (e.team !== this.team || e.hp <= 0 || e.hp >= e.maxHp + techBoost) continue;

                                // Fast AABB check
                                if (Math.abs(this.x - e.x) > radius || Math.abs(this.y - e.y) > radius) continue;

                                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < radiusSq) {
                                    e.hp = Math.min(e.maxHp + techBoost, e.hp + FORTRESS_CONFIG.shrineHealAmount);
                                    healed = true;
                                    // Emit a tiny green sparkle on the healed unit
                                    gameObj.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 1, type: 'magic'});
                                }
                            }
                        }
                    }
                    
                    // Emit a pulse from the Shrine if it successfully healed something
                    if (healed) {
                        this.auraAlpha = 1.0; // Trigger the visual expanding ring
                        gameObj.bus.emit('playSound', 'ping'); // JUICE: Satisfying healing chime
                        gameObj.bus.emit('particles', {x: this.x, y: this.y - 20, color: '#00ff00', count: 8, type: 'magic'});
                    }
                }
            }
        });

        // PATCH: Structure Rendering
        // [FIX] Signature updated to (original, ctx, gameObj)
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            
            // Draw Shrine Healing Aura underneath the structure
            if (this.type === 'shrine' && this.auraAlpha > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.strokeStyle = `rgba(0, 255, 0, ${this.auraAlpha})`;
                ctx.lineWidth = 4;
                
                // Ring expands as it fades out
                const radius = MathUtils.lerp(FORTRESS_CONFIG.shrineHealRadius, this.size, this.auraAlpha);
                ctx.beginPath(); 
                ctx.arc(0, 0, radius, 0, TWO_PI); 
                ctx.stroke();
                ctx.restore();
            }

            // Sprite Caching Link
            if ((this.type === 'mortar' || this.type === 'shrine') && !this.spriteLoaded && gameObj.assets) {
                this.sprite = gameObj.assets.get(`assets/${this.type}_${this.team}.png`);
                if (this.sprite) this.spriteLoaded = true;
            }

            // [JUICE] Heavy Recoil Animation for Mortars
            let restoreRecoil = false;
            if (this.type === 'mortar' && this.fireAnim > 0) {
                // Squash the mortar down by up to 20% on fire, snapping back quickly
                const squash = 1 - Math.sin((this.fireAnim / 12) * Math.PI) * 0.2;
                ctx.save();
                ctx.translate(this.x, this.y + this.size/2); // Pin to the ground
                ctx.scale(1 / squash, squash);               // Squash and stretch volume preservation
                ctx.translate(-this.x, -(this.y + this.size/2));
                restoreRecoil = true;
            }

            // ALWAYS call original to guarantee base scaling and health bars draw properly!
            original.call(this, ctx, gameObj);

            // If the sprite isn't loaded, draw our custom chunky fallback OVER the generic base shape
            if ((this.type === 'mortar' || this.type === 'shrine') && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save();
                if (this.type === 'mortar') {
                    // Improved chunky fallback art for Mortar
                    ctx.fillStyle = this.team === 'black' ? '#333' : '#522'; 
                    ctx.beginPath(); ctx.ellipse(this.x, this.y, 25, 20, 0, 0, TWO_PI); ctx.fill();
                    ctx.fillStyle = '#111'; 
                    ctx.beginPath(); ctx.arc(this.x, this.y - 5, 12, 0, TWO_PI); ctx.fill();
                    
                    // [JUICE] Glowing energy core
                    ctx.shadowColor = this.team === 'black' ? '#aa00ff' : '#ff5500';
                    ctx.shadowBlur = 10;
                    ctx.fillStyle = ctx.shadowColor;
                    ctx.beginPath(); ctx.arc(this.x, this.y - 5, 5, 0, TWO_PI); ctx.fill();
                } 
                else if (this.type === 'shrine') {
                    // Improved chunky fallback art for Shrine
                    ctx.fillStyle = '#225522'; 
                    ctx.beginPath(); ctx.moveTo(this.x, this.y - 30); ctx.lineTo(this.x + 20, this.y + 15); ctx.lineTo(this.x - 20, this.y + 15); ctx.fill();
                    
                    // [JUICE] Glowing healing basin
                    ctx.shadowColor = '#00ff00';
                    ctx.shadowBlur = 10 + Math.sin(gameObj.tick * 0.1) * 5;
                    ctx.fillStyle = '#00ff00'; 
                    ctx.beginPath(); ctx.ellipse(this.x, this.y + 15, 22, 8, 0, 0, TWO_PI); ctx.fill();
                } 
                ctx.restore();
            }

            if (restoreRecoil) ctx.restore(); // Clean up context state
        });
    }
};
