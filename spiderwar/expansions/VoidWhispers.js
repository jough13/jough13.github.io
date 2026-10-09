// expansions/VoidWhispers.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported config so other mods can tweak Void gravity and damage!
export const VOID_CONFIG = {
    vortexCost: 90,
    vortexRadius: 300,
    vortexRadiusSq: 90000,     // 300^2
    vortexPullStrength: 3.5,
    vortexLife: 150,           // 5 seconds
    
    weaverRange: 250,
    weaverRangeSq: 62500,      // 250^2
    weaverPullStrength: 15,
    
    mawPullRadius: 200,
    mawPullRadiusSq: 40000,    // 200^2
    mawBiteRadiusSq: 900,      // 30px (Right in the center)
    mawBiteDamage: 200,
    mawBiteCooldown: 90        // 3 seconds to chew
};

// ==========================================
// 2. THE VORTEX SPELL ENTITY (Black Hole)
// ==========================================
class VortexEntity {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team;
        this.life = VOID_CONFIG.vortexLife; 
        this.radius = VOID_CONFIG.vortexRadius; 
        this.radiusSq = VOID_CONFIG.vortexRadiusSq;
        this.pullStrength = VOID_CONFIG.vortexPullStrength; 
        
        // [JUICE] Pop-in scale animation
        this.spawnScale = 0.1;
    }

    update(game) {
        this.life--;
        
        // [JUICE] Scale up rapidly on spawn
        if (this.spawnScale < 1.0) {
            this.spawnScale = Math.min(1.0, this.spawnScale + 0.05);
        }

        // [JUICE] Violent implosion when the black hole collapses!
        if (this.life <= 0) {
            if (game.triggerShake) game.triggerShake(12);
            game.bus.emit('playSound', 'death');
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#aa00ff', count: 60, type: 'magic'});
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 30});
            return;
        }
        
        // [PERFORMANCE] Clamped Spatial Grid Lookup!
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
                    
                    // Only affect living physical objects
                    if (e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss') && e.role !== 'queen') {
                        
                        // Fast AABB check
                        if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) continue;

                        const distSq = MathUtils.distSq(this.x, this.y, e.x, e.y);
                        if (distSq < this.radiusSq && distSq > 100) { 
                            const angle = Math.atan2(this.y - e.y, this.x - e.x);
                            
                            // The closer they get to the center, the harder it pulls (Event Horizon effect)
                            const intensity = 1 + (1 - (Math.sqrt(distSq) / this.radius));
                            
                            e.x += Math.cos(angle) * (this.pullStrength * intensity);
                            e.y += Math.sin(angle) * (this.pullStrength * intensity);
                            
                            // Disrupt their current movement
                            e.isSlowed = true;
                        }
                    }
                }
            }
        }

        // [JUICE] Suck in particles for visual flair
        if (game.tick % 2 === 0) {
            const spawnAngle = Math.random() * MathUtils.TWO_PI;
            const spawnDist = MathUtils.randomRange(100, this.radius);
            const px = this.x + Math.cos(spawnAngle) * spawnDist;
            const py = this.y + Math.sin(spawnAngle) * spawnDist;
            
            // Negative vy trick to make magic particles drift inwards
            game.bus.emit('particles', {x: px, y: py, color: '#aa00ff', count: 1, type: 'magic'});
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Apply spawn scaling
        ctx.scale(this.spawnScale, this.spawnScale);
        
        // Swirling animation
        ctx.rotate(this.life * 0.2);
        
        // Fade in/out
        const alpha = Math.min(1, this.life / 30);
        ctx.globalAlpha = alpha;
        
        // [JUICE] Ethereal glow
        ctx.shadowColor = '#aa00ff';
        ctx.shadowBlur = 20;
        
        // Outer accretion disk
        let grad = ctx.createRadialGradient(0, 0, 10, 0, 0, this.radius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.2, 'rgba(170, 0, 255, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, MathUtils.TWO_PI); ctx.fill();
        
        // The Singularity (Pure black center)
        ctx.shadowBlur = 0; // Reset
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, MathUtils.TWO_PI); ctx.fill();
        
        ctx.restore();
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const VoidWhispersExpansion = {
    init: (game) => {
        console.log("%c[DLC] Void Whispers Expansion Loaded!", "color: #9900ff;");
        
        // [EXPANDABILITY] Hook config to the game engine
        game.voidConfig = VOID_CONFIG;

        // 1. REGISTER ASSETS
        game.assets.register('assets/voidweaver_black.png');
        game.assets.register('assets/voidweaver_red.png');
        game.assets.register('assets/maw_black.png');
        game.assets.register('assets/maw_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['voidweaver'] = { 
            size: 15, hp: 150, damage: 5, attackSpeed: 10, // Very low damage, attacks fast
            baseSpeedMin: 1.2, baseSpeedMax: 1.5, 
            traits: ['gravity_pull', 'ranged_attacker'] // Ranged AI with custom pull logic
        };

        STRUCTURE_DATA['maw'] = { 
            hp: 500, size: 35, territory: 0 
        };

        // ==========================================
        // 4. ECS TRAIT REGISTRATION
        // ==========================================
        game.registerTrait('gravity_pull', {
            update: (entity, gameObj) => {
                let enemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, entity.range || VOID_CONFIG.weaverRange);
                
                if (enemy && !entity.isManual) {
                    entity.state = 1; // 1 = SPIDER_STATE.COMBAT
                    
                    // [JUICE] Smooth Turn
                    const targetAngle = Math.atan2(enemy.y - entity.y, enemy.x - entity.x);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * 0.2;
                    
                    const distSq = MathUtils.distSq(entity.x, entity.y, enemy.x, enemy.y);
                    const effectiveRangeSq = entity.rangeSq || VOID_CONFIG.weaverRangeSq;
                    
                    // Instead of running away to kite, the unit stands its ground and drags the enemy in!
                    if (distSq <= effectiveRangeSq) {
                        if (!entity.cooldown) entity.cooldown = 0;
                        entity.cooldown--;
                        
                        if (entity.cooldown <= 0) {
                            // Minor damage
                            enemy.hp -= entity.damage;
                            
                            // THE PULL: Move the enemy directly towards the pulling unit!
                            enemy.x -= Math.cos(entity.angle) * VOID_CONFIG.weaverPullStrength;
                            enemy.y -= Math.sin(entity.angle) * VOID_CONFIG.weaverPullStrength;
                            enemy.isSlowed = true; // Disrupts their normal walking
                            
                            entity.cooldown = entity.attackSpeed;
                            
                            // Cosmic Tractor Beam visuals
                            gameObj.bus.emit('playSound', 'shoot');
                            gameObj.bus.emit('particles', {x: enemy.x, y: enemy.y, color: '#9900ff', count: 3, type: 'magic'});
                            
                            // Store line drawing data for 5 frames
                            entity.beamVisual = { x: enemy.x, y: enemy.y, timer: 5 };
                        }
                        return true; // RETURN TRUE: Halt movement while channeling gravity
                    }
                }
                
                return false; // RETURN FALSE: No enemies in pull range, let normal AI run
            }
        });

        // 5. SPELL LOGIC: VORTEX
        game.bus.on('castSpell', (data) => {
            if (data.type === 'vortex') {
                if (game.eco[data.team].dew >= VOID_CONFIG.vortexCost) {
                    game.eco[data.team].dew -= VOID_CONFIG.vortexCost;
                    
                    // [JUICE] Heavy, ominous rumble!
                    game.bus.emit('playSound', 'death'); 
                    if (game.triggerShake) game.triggerShake(10); 
                    
                    game.addEntity(new VortexEntity(data.x, data.y, data.team));
                }
            }
        });

        // Spawn Voidweaver Logic
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'voidweaver') {
                if (game.eco[data.team].pumpkins >= 100 && game.eco[data.team].dew >= 30 && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= 100;
                    game.eco[data.team].dew -= 30;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    s.sprite = game.assets.get(data.team === 'black' ? 'assets/voidweaver_black.png' : 'assets/voidweaver_red.png');
                    s.imageLoaded = true; 
                    
                    // Give it decent range for its gravity beams
                    s.range = VOID_CONFIG.weaverRange;
                    s.rangeSq = VOID_CONFIG.weaverRangeSq;
                    
                    game.addEntity(s);
                    game.bus.emit('playSound', 'spell'); 
                }
            }
        });
    },

    patch: (game) => {

        // 6. STRUCTURE AI: THE MAW
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'maw' && !this.isConstructing && this.hp > 0) {
                if (!this.biteCooldown) this.biteCooldown = 0;
                if (this.biteCooldown > 0) this.biteCooldown--;
                
                // [JUICE] Chew animation state management
                if (this.chewAnim > 0) this.chewAnim--;

                // [PERFORMANCE] Clamped Spatial Grid Lookup!
                const CELL_SIZE = 250;
                const maxGridX = Math.ceil(gameObj.world.width / CELL_SIZE);
                const maxGridY = Math.ceil(gameObj.world.height / CELL_SIZE);
                
                const cx = MathUtils.clamp((this.x / CELL_SIZE) | 0, 0, maxGridX);
                const cy = MathUtils.clamp((this.y / CELL_SIZE) | 0, 0, maxGridY);
                
                const pullRadius = VOID_CONFIG.mawPullRadius;

                for (let nx = cx - 1; nx <= cx + 1; nx++) {
                    if (nx < 0 || nx > maxGridX) continue;
                    for (let ny = cy - 1; ny <= cy + 1; ny++) {
                        if (ny < 0 || ny > maxGridY) continue;
                        
                        const key = (nx << 16) | ny;
                        const cell = gameObj.spatialGrid.get(key);
                        if (!cell) continue;

                        for (let i = 0; i < cell.length; i++) {
                            let e = cell[i];
                            
                            // Only pull enemies (Units and Bosses)
                            if (e.team && e.team !== this.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                                
                                // Fast AABB Check
                                if (Math.abs(this.x - e.x) > pullRadius || Math.abs(this.y - e.y) > pullRadius) continue;

                                const distSq = MathUtils.distSq(this.x, this.y, e.x, e.y);
                                
                                if (distSq < VOID_CONFIG.mawPullRadiusSq) {
                                    // Pull them in
                                    const pullAngle = Math.atan2(this.y - e.y, this.x - e.x);
                                    e.x += Math.cos(pullAngle) * 0.8;
                                    e.y += Math.sin(pullAngle) * 0.8;
                                    
                                    // If they reach the center, CHOMP!
                                    if (distSq < VOID_CONFIG.mawBiteRadiusSq && this.biteCooldown <= 0) {
                                        e.hp -= VOID_CONFIG.mawBiteDamage; 
                                        this.biteCooldown = VOID_CONFIG.mawBiteCooldown; 
                                        
                                        // [JUICE] Violent chewing reaction
                                        this.chewAnim = 15; 
                                        
                                        if (gameObj.triggerShake) gameObj.triggerShake(5);
                                        gameObj.bus.emit('playSound', 'death');
                                        gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 30, type: 'splatter'});
                                        
                                        // Bosses are too big, they damage the maw when bitten
                                        if (e.constructor.name === 'CentipedeBoss') {
                                            this.hp -= 50; 
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // 7. DRAWING MODIFICATIONS
        // [FIX] Pass `gameObj` through to original calls
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            
            // Draw Voidweaver Cosmic Tractor Beam BEFORE the spider, so it renders underneath
            if (this.hasTrait('gravity_pull') && this.beamVisual && this.beamVisual.timer > 0) {
                this.beamVisual.timer--;
                ctx.save();
                
                // [JUICE] Glowing, glitchy energy beam
                ctx.shadowColor = '#aa00ff'; ctx.shadowBlur = 10;
                ctx.strokeStyle = `rgba(153, 0, 255, ${this.beamVisual.timer / 5})`; // Fade out
                ctx.lineWidth = 2 + Math.random() * 3; 
                
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.beamVisual.x, this.beamVisual.y);
                ctx.stroke();
                
                ctx.restore();
            }
            
            original.call(this, ctx, gameObj);
        });
        
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            // Sprite Caching Link
            if (this.type === 'maw' && !this.spriteLoaded && gameObj.assets) {
                this.sprite = gameObj.assets.get(`assets/${this.type}_${this.team}.png`);
                if (this.sprite) this.spriteLoaded = true;
            }

            // [JUICE] The Chewing Animation (Squash and Stretch)
            let restoreChew = false;
            if (this.type === 'maw' && this.chewAnim > 0) {
                const squash = 1 - Math.sin((this.chewAnim / 15) * Math.PI) * 0.2;
                ctx.save();
                ctx.translate(this.x, this.y + this.size/2); 
                ctx.scale(1 / squash, squash);
                ctx.translate(-this.x, -(this.y + this.size/2));
                restoreChew = true;
            }

            original.call(this, ctx, gameObj);

            // Canvas fallback for The Maw
            if (this.type === 'maw' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                
                // [JUICE] Added drop shadow to fallback
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
                
                // Pulsing outer flesh ring
                const tick = gameObj ? gameObj.tick : 0;
                const pulse = Math.sin(tick * 0.1) * 3;
                ctx.fillStyle = '#220022'; 
                ctx.beginPath(); ctx.arc(0, 0, this.size + pulse, 0, MathUtils.TWO_PI); ctx.fill();
                
                ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; // Reset
                
                // Teeth/Spikes pointing inwards
                ctx.fillStyle = '#dddddd';
                for(let i=0; i<8; i++) {
                    ctx.rotate(Math.PI / 4);
                    ctx.beginPath(); ctx.moveTo(this.size-5, -5); ctx.lineTo(this.size-5, 5); ctx.lineTo(10, 0); ctx.fill();
                }
                
                // Black hole center
                ctx.shadowColor = '#aa00ff'; ctx.shadowBlur = 15;
                ctx.fillStyle = '#000000';
                ctx.beginPath(); ctx.arc(0, 0, 15, 0, MathUtils.TWO_PI); ctx.fill();
                
                ctx.restore();
            }

            if (restoreChew) ctx.restore(); // Clean up chew translation
        });
    }
};
