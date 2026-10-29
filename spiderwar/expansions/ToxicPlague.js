// expansions/ToxicPlague.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA, SPIDER_STATE } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak plague damage and durations!
export const PLAGUE_CONFIG = {
    spellCost: 80,
    spellRadius: 150,
    spellRadiusSq: 22500,     // 150^2
    infectionDuration: 600,   // 20 seconds
    infectionDot: 3,          // Damage per second
    
    puddleLife: 150,          // 5 seconds
    puddleRadius: 25,
    puddleRadiusSq: 625,      // 25^2
    puddleDamage: 2
};

// ==========================================
// 2. TOXIC PUDDLE ENTITY (Area Denial)
// ==========================================
class ToxicPuddle {
    constructor(x, y, team) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.x = x; this.y = y; this.team = team;
        this.life = PLAGUE_CONFIG.puddleLife; 
        this.radius = PLAGUE_CONFIG.puddleRadius; 
        this.radiusSq = PLAGUE_CONFIG.puddleRadiusSq;
        this.animOffset = parseInt(this.id, 36) % 100;
    }

    update(game) {
        this.life--;
        
        // [PERFORMANCE] Clamped Spatial Grid Lookup!
        const CELL_SIZE = 250;
        const maxGridX = Math.ceil(game.world.width / CELL_SIZE);
        const maxGridY = Math.ceil(game.world.height / CELL_SIZE);
        
        const cx = MathUtils.clamp((this.x / CELL_SIZE) | 0, 0, maxGridX);
        const cy = MathUtils.clamp((this.y / CELL_SIZE) | 0, 0, maxGridY);

        for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx < 0 || nx > maxGridX) continue;
            for (let ny = cy - 1; ny <= cy + 1; ny++) {
                if (ny < 0 || ny > maxGridY) continue;
                
                const key = (nx << 16) | ny;
                const cell = game.spatialGrid.get(key);
                if (!cell) continue;

                for (let i = 0; i < cell.length; i++) {
                    let e = cell[i];
                    
                    // Fast early exits
                    if (!e.team || e.team === this.team || e.hp === undefined || e.hp <= 0) continue;
                    
                    // 🚨 FIXED: Check for isCritter so Toxic Puddles can melt Golden Bugs!
                    if (!(e instanceof Spider || e.isBoss || e.isHazard || e.isCritter)) continue;
                    
                    // Fast AABB check
                    if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) continue;

                    // Circle Collision
                    if (MathUtils.distSq(this.x, this.y, e.x, e.y) < this.radiusSq) {
                        if (game.tick % 15 === 0) {
                            e.hp -= PLAGUE_CONFIG.puddleDamage; // Acid DoT
                            game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 1, type: 'magic'});
                        }
                        e.isSlowed = true; // Melts their legs!
                    }
                }
            }
        }
    }

    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = Math.min(this.life / 30, 0.5); // Fades in/out smoothly
        
        // [JUICE] Sickly green glow
        ctx.shadowColor = this.team === 'black' ? '#55ff00' : '#ffff00';
        ctx.shadowBlur = 10;
        ctx.fillStyle = ctx.shadowColor; 
        
        ctx.beginPath();
        // [JUICE] Organic pulsating blob shape
        const tick = game ? game.tick : 0;
        const pulseX = 1 + Math.sin(tick * 0.05 + this.animOffset) * 0.005;
        const pulseY = 1 + Math.cos(tick * 0.05 + this.animOffset) * 0.005;
        
        ctx.ellipse(0, 0, this.radius * pulseX, this.radius * 0.7 * pulseY, Math.sin(this.life * 0.05), 0, MathUtils.TWO_PI);
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset
        
        // Random bubbling
        if (Math.random() < 0.1) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(MathUtils.randomRange(-10, 10), MathUtils.randomRange(-10, 10), 3, 0, MathUtils.TWO_PI); ctx.fill();
        }
        
        ctx.restore();
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const ToxicPlagueExpansion = {
    init: (game) => {
        console.log("%c[DLC] Toxic Plague Expansion Loaded!", "color: #55ff00;");
        
        // [EXPANDABILITY] Expose config
        game.plagueConfig = PLAGUE_CONFIG;

        // 1. REGISTER ASSETS
        game.assets.register('assets/defiler_black.png');
        game.assets.register('assets/defiler_red.png');
        game.assets.register('assets/incubator_black.png');
        game.assets.register('assets/incubator_red.png');
        game.assets.register('assets/parasite_black.png');
        game.assets.register('assets/parasite_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['defiler'] = { 
            size: 18, hp: 250, damage: 15, attackSpeed: 30, 
            baseSpeedMin: 1.0, baseSpeedMax: 1.3, 
            traits: ['toxic_trail', 'melee'] 
        };

        UNIT_DATA['parasite'] = { 
            size: 8, hp: 15, damage: 8, attackSpeed: 15, 
            baseSpeedMin: 2.5, baseSpeedMax: 3.2, 
            traits: ['parasite_ai'] 
        };

        STRUCTURE_DATA['incubator'] = { 
            hp: 300, size: 26, territory: 0 
        };

        // ==========================================
        // 3. ECS TRAIT REGISTRATION
        // ==========================================
        
        // Toxic Trail Trait
        game.registerTrait('toxic_trail', {
            update: (entity, gameObj) => {
                if (!entity.puddleTimer) entity.puddleTimer = 0;
                
                // Only drop puddles while actively moving
                if (entity.speed > 0) {
                    entity.puddleTimer++;
                    if (entity.puddleTimer > 25) {
                        entity.puddleTimer = 0;
                        gameObj.addEntity(new ToxicPuddle(entity.x, entity.y, entity.team));
                        // [JUICE] Tiny squelch particle
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#55ff00', count: 2});
                    }
                }
                return false; 
            }
        });

        // Parasite AI Trait
        game.registerTrait('parasite_ai', {
            update: (entity, gameObj) => {
                // Pull tech level, terrain, and slow modifiers dynamically!
                const techLvl = gameObj.techLevel[entity.team] || 0; 
                const currentDamage = entity.damage + (techLvl * 5); 
                
                const terrain = gameObj.getTerrainAt(entity.x, entity.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                let currentSpeed = (entity.baseSpeed + (techLvl * 0.15)) * tMod;
                
                if (entity.isSlowed) currentSpeed *= 0.3;
                entity.isSlowed = false; 

                let enemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, 500); 
                
                if (enemy) {
                    entity.state = SPIDER_STATE.COMBAT;
                    
                    // [JUICE] Smooth Turn
                    const targetAngle = Math.atan2(enemy.y - entity.y, enemy.x - entity.x);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * 0.2;
                    
                    // [PERFORMANCE] Fast inline distance math
                    const dx = enemy.x - entity.x; const dy = enemy.y - entity.y;
                    const distSq = (dx * dx) + (dy * dy);
                    
                    // Dynamically calculate hitbox combat range!
                    const combatRange = (enemy.size || 10) + entity.size + 5;
                    const combatRangeSq = combatRange * combatRange;
                    
                    if (distSq > combatRangeSq) { 
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        if (!entity.cooldown) entity.cooldown = 0;
                        entity.cooldown--;
                        
                        if (entity.cooldown <= 0) {
                            enemy.hp -= currentDamage; // Uses tech-modified damage
                            entity.cooldown = entity.attackSpeed;
                            
                            // Tiny Recoil
                            entity.x -= Math.cos(entity.angle) * 5; 
                            entity.y -= Math.sin(entity.angle) * 5;
                            
                            gameObj.bus.emit('playSound', 'harvest');
                            gameObj.bus.emit('particles', {x: enemy.x, y: enemy.y, color: '#55ff00', count: 3, type: 'splatter'});
                        }
                    }
                } else {
                    if (Math.random() < 0.2) entity.angle += MathUtils.randomRange(-0.5, 0.5);
                    entity.angle = MathUtils.angleWrap(entity.angle);
                    entity.x += Math.cos(entity.angle) * (currentSpeed * 0.5);
                    entity.y += Math.sin(entity.angle) * (currentSpeed * 0.5);
                }
                
                // Keep parasites on the map cleanly
                const bnd = entity.size * 2;
                entity.x = MathUtils.clamp(entity.x, bnd, gameObj.world.width - bnd);
                entity.y = MathUtils.clamp(entity.y, bnd, gameObj.world.height - bnd);
                
                return true; 
            }
        });

        // 4. SPELL LOGIC: CONTAGION
        game.bus.on('castSpell', (data) => {
            if (data.type === 'contagion') {
                if (game.eco[data.team].dew >= PLAGUE_CONFIG.spellCost) {
                    game.eco[data.team].dew -= PLAGUE_CONFIG.spellCost;
                    
                    if (game.triggerShake) game.triggerShake(5);
                    game.bus.emit('playSound', 'spell'); 
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#55ff00', count: 100, type: 'magic'});
                    game.bus.emit('particles', {x: data.x, y: data.y, color: 'rgba(85, 255, 0, 0.6)', count: 1, type: 'ring'});
                    
                    const radius = PLAGUE_CONFIG.spellRadius;
                    const radiusSq = PLAGUE_CONFIG.spellRadiusSq; 
                    
                    // [PERFORMANCE] Clamped Spatial Grid Lookup
                    const CELL_SIZE = 250;
                    const maxGridX = Math.ceil(game.world.width / CELL_SIZE);
                    const maxGridY = Math.ceil(game.world.height / CELL_SIZE);
                    
                    const minCx = MathUtils.clamp(((data.x - radius) / CELL_SIZE) | 0, 0, maxGridX);
                    const maxCx = MathUtils.clamp(((data.x + radius) / CELL_SIZE) | 0, 0, maxGridX);
                    const minCy = MathUtils.clamp(((data.y - radius) / CELL_SIZE) | 0, 0, maxGridY);
                    const maxCy = MathUtils.clamp(((data.y + radius) / CELL_SIZE) | 0, 0, maxGridY);

                    for (let cx = minCx; cx <= maxCx; cx++) {
                        for (let cy = minCy; cy <= maxCy; cy++) {
                            const key = (cx << 16) | cy;
                            const cell = game.spatialGrid.get(key);
                            if (!cell) continue;

                            for (let i = 0; i < cell.length; i++) {
                                let e = cell[i];
                                
                                // 🚨 FIXED: Allow Contagion to infect Critters (Aphids & GoldenBugs)!
                                if (e.team && e.team !== data.team && e.hp > 0 && (e instanceof Spider || e.isBoss || e.isHazard || e.isCritter)) {
                                    if (Math.abs(e.x - data.x) > radius || Math.abs(e.y - data.y) > radius) continue;
                                    
                                    if (MathUtils.distSq(e.x, e.y, data.x, data.y) < radiusSq) {
                                        e.infectedTimer = PLAGUE_CONFIG.infectionDuration; 
                                        e.infectedByTeam = data.team; // Track who cast it
                                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 10, type: 'magic'});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Spawn Defiler/Parasite Logic
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'defiler' || data.role === 'parasite') {
                let canSpawn = true;
                
                if (data.role === 'defiler') {
                    if (game.eco[data.team].pumpkins >= 120 && game.eco[data.team].dew >= 40 && game.pop[data.team] < game.maxPop[data.team]) {
                        game.eco[data.team].pumpkins -= 120;
                        game.eco[data.team].dew -= 40;
                    } else {
                        canSpawn = false;
                    }
                }

                if (canSpawn) {
                    // Only the core Defiler unit increments the population cap. Parasites are free temporary swarms!
                    if (data.role === 'defiler') {
                        game.pop[data.team]++;
                    }
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    
                    // (Sprite loading is handled lazily natively by Spider base class)
                    
                    game.addEntity(s);
                    if (data.role === 'defiler') game.bus.emit('playSound', 'harvest'); 
                }
            }
        });
    },

    patch: (game) => {
        // 5. GLOBAL DEBUFF MANAGER: INFECTION (Properly hooked into Update)
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            
            // Run DoT logic BEFORE the main game update so dead units are cleaned up instantly!
            if (this.gameState === 'playing' && this.tick % 30 === 0) {
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    if (e.infectedTimer > 0) {
                        // [FIX] Decrement by 30 since this loop only runs every 30 frames!
                        e.infectedTimer -= 30;
                        
                        e.hp -= PLAGUE_CONFIG.infectionDot;

                        this.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 2, type: 'magic'});
                        
                        // CHESTBURSTER EFFECT: If it dies from infection!
                        // 🚀 [LOGIC FIX] Prevent infinite parasite loops by explicitly banning suicide/temp units
                        if (e.hp <= 0 && e.role !== 'parasite' && e.role !== 'broodling' && !e.isZombie) {
                            if (this.triggerShake) this.triggerShake(5);
                            this.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 30, type: 'splatter'});
                            this.bus.emit('playSound', 'death');
                            this.bus.emit('spawnSpider', {x: e.x, y: e.y, team: e.infectedByTeam, role: 'parasite'});
                        }
                    }
                }
            }

            // Now run the rest of the game loop
            original.call(this); 
        });

        // 6. STRUCTURE AI: THE INCUBATOR
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'incubator' && !this.isConstructing && this.hp > 0) {
                // [JUICE] Animation Decay
                if (this.spawnAnim > 0) this.spawnAnim--;
                
                if (gameObj.tick % 150 === 0) {
                    gameObj.bus.emit('particles', {x: this.x, y: this.y + 15, color: '#55ff00', count: 10, type: 'magic'});
                    gameObj.bus.emit('playSound', 'harvest'); 
                    gameObj.bus.emit('spawnSpider', {x: this.x, y: this.y + 20, team: this.team, role: 'parasite'});
                    
                    // [JUICE] Trigger birthing animation
                    this.spawnAnim = 15;
                }
            }
        });

        // 7. DRAWING LOGIC: INFECTED AURA
        // [FIX] Signature updated to accept (original, ctx, gameObj)
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            
            // 1. Draw the pulsing under-aura FIRST
            if (this.infectedTimer > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                const tick = gameObj ? gameObj.tick : 0;
                const pulse = Math.sin(tick * 0.2) * 0.1;
                
                ctx.fillStyle = `rgba(85, 255, 0, 0.3)`;
                ctx.beginPath(); ctx.arc(0, 0, this.size + 4 + pulse, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.restore();
            }
            
            // 2. Draw the spider sprite ON TOP of the aura
            original.call(this, ctx, gameObj);
            
            // 3. Draw the sickness tint OVER the spider
            if (this.infectedTimer > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                // [FIX] 'lighter' additive blending creates a great sickly wash without clipping into the dirt
                ctx.globalCompositeOperation = 'lighter';
                ctx.fillStyle = 'rgba(85, 255, 0, 0.4)';
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
                
                ctx.restore();
            }
        });
        
        // Structure fallback drawing & animations
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            // Sprite Caching Link
            if (this.type === 'incubator' && !this.spriteLoaded && gameObj.assets) {
                this.sprite = gameObj.assets.get(`assets/${this.type}_${this.team}.png`);
                if (this.sprite) this.spriteLoaded = true;
            }

            // [JUICE] Birthing Squash & Stretch
            let restoreScale = false;
            if (this.type === 'incubator' && this.spawnAnim > 0) {
                const stretch = 1 + Math.sin((this.spawnAnim / 15) * Math.PI) * 0.01;
                ctx.save();
                ctx.translate(this.x, this.y + this.size/2); // Pin to ground
                ctx.scale(1 / stretch, stretch);
                ctx.translate(-this.x, -(this.y + this.size/2));
                restoreScale = true;
            }

            original.call(this, ctx, gameObj);

            if (this.type === 'incubator' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                
                ctx.fillStyle = '#112211'; 
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
                
                ctx.shadowColor = '#55ff00'; ctx.shadowBlur = 15;
                ctx.fillStyle = '#55ff00'; 
                
                const tick = gameObj ? gameObj.tick : 0;
                const throb = Math.sin(tick * 0.1) * 3; // (Left untouched as requested, matching existing codebase state)
                
                ctx.beginPath(); ctx.arc(0, 0, 10 + throb, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.restore();
            }
            
            if (restoreScale) ctx.restore();
        });
    }
};
