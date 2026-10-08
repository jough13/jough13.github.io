// expansions/Titans.js
import { Spider, MathUtils, UNIT_DATA, SPIDER_STATE } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak the heavy endgame units!
export const TITAN_CONFIG = {
    widow: { 
        hp: 150, damage: 100, attackSpeed: 20, size: 16, 
        baseSpeedMin: 1.8, baseSpeedMax: 2.1, costP: 150, costD: 50, 
        decloakTime: 150 
    },
    goliath: { 
        hp: 1200, damage: 90, attackSpeed: 60, size: 38, 
        baseSpeedMin: 0.3, baseSpeedMax: 0.5, costP: 400, costD: 150, 
        range: 300, rangeSq: 90000,                  
        splashRadius: 100, splashRadiusSq: 10000,    
        projSpeed: 3.5 
    }
};

// ==========================================
// 2. GOLIATH SIEGE PROJECTILE
// ==========================================
export class ExplosiveProjectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; 
        this.target = target; 
        this.damage = damage; 
        this.team = team;
        this.speed = TITAN_CONFIG.goliath.projSpeed; 
        this.active = true;
    }

    update(game) {
        if(!this.target || this.target.hp === undefined || this.target.hp <= 0) { 
            this.active = false; 
            return; 
        }

        const dx = this.target.x - this.x; 
        const dy = this.target.y - this.y;
        
        // [PERFORMANCE] Fast inline distance math
        const distSq = (dx * dx + dy * dy);
        
        if (distSq < 225) { 
            this.active = false; 
            
            // [JUICE] Heavy impact shake!
            if (game.triggerShake) game.triggerShake(8);
            game.bus.emit('playSound', 'death'); 
            
            const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: magicColor, count: 40, type: 'magic'});
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: '#ffaa00', count: 20, type: 'splatter'});
            
            const splashRad = TITAN_CONFIG.goliath.splashRadius;
            const splashRadSq = TITAN_CONFIG.goliath.splashRadiusSq;

            // [PERFORMANCE] Spatial Grid Lookup for Splash Damage!
            const CELL_SIZE = 250;
            const cx = Math.max(0, (this.x / CELL_SIZE) | 0);
            const cy = Math.max(0, (this.y / CELL_SIZE) | 0);

            for (let nx = cx - 1; nx <= cx + 1; nx++) {
                if (nx < 0) continue;
                for (let ny = cy - 1; ny <= cy + 1; ny++) {
                    if (ny < 0) continue;
                    
                    const key = (nx << 16) | ny;
                    const cell = game.spatialGrid.get(key);
                    if (!cell) continue;

                    for (let i = 0; i < cell.length; i++) {
                        let e = cell[i];
                        
                        // Fast early-exit checks
                        if (!e.team || e.team === this.team || e.team === 'nature' || e.hp === undefined || e.hp <= 0) continue;
                        
                        // Fast AABB check to avoid heavy circle math for distant units
                        if (Math.abs(this.x - e.x) > splashRad || Math.abs(this.y - e.y) > splashRad) continue;

                        if (MathUtils.distSq(this.x, this.y, e.x, e.y) < splashRadSq) { 
                            if (e instanceof Spider || e.constructor.name === 'CentipedeBoss') e.hp -= this.damage;
                            else e.hp -= (this.damage * 0.5); 
                        }
                    }
                }
            }
        } else {
            const dist = Math.sqrt(distSq);
            if (dist > 0) {
                this.x += (dx/dist) * this.speed; 
                this.y += (dy/dist) * this.speed; 
                
                // [JUICE] Dense, fiery particle trail!
                if (game.tick % 2 === 0) {
                    const magicColor = this.team === 'black' ? '#aa00ff' : '#ffaa00';
                    game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 2, type: 'magic'});
                }
            }
        }
    }

    draw(ctx) { 
        ctx.save();
        const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
        
        // [JUICE] Glowing aura
        ctx.shadowBlur = 15;
        ctx.shadowColor = magicColor;
        
        ctx.fillStyle = magicColor; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, MathUtils.TWO_PI); ctx.fill(); 
        
        ctx.shadowBlur = 0; // Turn off glow for the core
        ctx.fillStyle = '#ffaa00'; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, MathUtils.TWO_PI); ctx.fill(); 
        
        ctx.restore();
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const TitansExpansion = {
    init: (game) => {
        // [EXPANDABILITY] Hook config
        game.titanConfig = TITAN_CONFIG;

        // --- 1. ASSET REGISTRY ---
        game.assets.register('assets/widow_black.png');
        game.assets.register('assets/widow_red.png');
        game.assets.register('assets/goliath_black.png');
        game.assets.register('assets/goliath_red.png');

        // --- 2. TRAIT ASSIGNMENT ---
        UNIT_DATA['widow'] = { 
            size: TITAN_CONFIG.widow.size, hp: TITAN_CONFIG.widow.hp, 
            damage: TITAN_CONFIG.widow.damage, attackSpeed: TITAN_CONFIG.widow.attackSpeed, 
            baseSpeedMin: TITAN_CONFIG.widow.baseSpeedMin, baseSpeedMax: TITAN_CONFIG.widow.baseSpeedMax,
            traits: ['melee', 'stealth'] 
        };
        
        UNIT_DATA['goliath'] = { 
            size: TITAN_CONFIG.goliath.size, hp: TITAN_CONFIG.goliath.hp, 
            damage: TITAN_CONFIG.goliath.damage, attackSpeed: TITAN_CONFIG.goliath.attackSpeed, 
            baseSpeedMin: TITAN_CONFIG.goliath.baseSpeedMin, baseSpeedMax: TITAN_CONFIG.goliath.baseSpeedMax,
            traits: ['siege_attacker'] 
        };

        // --- 3. ECS TRAIT REGISTRATION! ---
        
        // Stealth Trait
        game.registerTrait('stealth', {
            update: (entity, gameObj) => {
                // Handle stealth cooldown and visual effects
                if (entity.cloakCooldown > 0) {
                    entity.cloakCooldown--;
                    
                    // [JUICE] Re-cloak puff of smoke
                    if (entity.cloakCooldown === 1) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#333333', count: 15, type: 'magic'});
                        gameObj.bus.emit('playSound', 'spell'); 
                    }
                }
                entity.isCloaked = (entity.cloakCooldown <= 0);

                // Strip stealth instantly if the unit just attacked!
                if (entity.cooldown >= entity.attackSpeed - 1 && entity.cooldown > 0) {
                    
                    // [JUICE] De-cloak puff of smoke
                    if (entity.isCloaked) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#333333', count: 15, type: 'magic'});
                    }
                    
                    entity.cloakCooldown = TITAN_CONFIG.widow.decloakTime; 
                    entity.isCloaked = false;
                }
                
                return false; // Return false to allow standard melee AI to continue running
            }
        });

        // Siege Attacker Trait
        game.registerTrait('siege_attacker', {
            update: (entity, gameObj) => {
                const techLvl = gameObj.techLevel[entity.team] || 0; 
                const currentDamage = entity.damage + (techLvl * 5); 
                
                const terrain = gameObj.getTerrainAt(entity.x, entity.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                
                // UNIVERSAL FIX: Fallback to 0 speed if it's a building!
                let currentSpeed = ((entity.baseSpeed || 0) + (techLvl * 0.15)) * tMod;
                if (entity.isSlowed) currentSpeed *= 0.3;
                entity.isSlowed = false; 

                // Default range to 300 if not specified
                const effectiveRangeSq = entity.rangeSq || 90000;
                const detectRadius = Math.sqrt(effectiveRangeSq) + 50 + (techLvl * 10);
                
                let nearestEnemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, detectRadius);

                // COMBAT OVERRIDE
                if (nearestEnemy) {
                    // [JUICE] Alert targeting indicator
                    if (entity.state !== SPIDER_STATE.COMBAT) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y - 10, color: '#ff0000', count: 1});
                    }

                    entity.state = SPIDER_STATE.COMBAT; 
                    
                    // [JUICE] Smooth organic turning towards the target
                    const targetAngle = Math.atan2(nearestEnemy.y - entity.y, nearestEnemy.x - entity.x);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * 0.10;

                    const distSq = MathUtils.distSq(entity.x, entity.y, nearestEnemy.x, nearestEnemy.y);

                    if (distSq > effectiveRangeSq && currentSpeed > 0) {
                        // Only move if it actually has speed (isn't a building)
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        entity.cooldown = (entity.cooldown || 0) - 1;
                        if (entity.cooldown <= 0) {
                            
                            // [JUICE] Offset spawn so the projectile comes from the 'mouth/cannon'
                            const pX = entity.x + Math.cos(entity.angle) * entity.size;
                            const pY = entity.y + Math.sin(entity.angle) * entity.size;

                            gameObj.addEntity(new ExplosiveProjectile(pX, pY, nearestEnemy, currentDamage, entity.team));
                            gameObj.bus.emit('playSound', 'shoot');
                            
                            // Only apply recoil to mobile units
                            if (currentSpeed > 0) {
                                entity.x -= Math.cos(entity.angle) * 8; 
                                entity.y -= Math.sin(entity.angle) * 8; 
                            }
                            // Default to 60 attack speed if the entity doesn't have one defined
                            entity.cooldown = entity.attackSpeed || 60;
                        }
                    }
                    return true; // Prevent standard AI!
                }

                // MANUAL MOVEMENT OVERRIDE
                if (entity.isManual && entity.commandTarget && currentSpeed > 0) {
                    const dx = entity.commandTarget.x - entity.x; 
                    const dy = entity.commandTarget.y - entity.y;
                    
                    if ((dx * dx + dy * dy) > 225) { 
                        // [JUICE] Smooth Turn
                        const targetAngle = Math.atan2(dy, dx);
                        entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * 0.10;
                        
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                        
                        const bnd = entity.size * 2;
                        entity.x = MathUtils.clamp(entity.x, bnd, gameObj.world.width - bnd);
                        entity.y = MathUtils.clamp(entity.y, bnd, gameObj.world.height - bnd);
                    } else {
                        entity.commandTarget = null; 
                    }
                    return true; 
                }
                
                return false; 
            }
        });

        // --- 4. SPAWN LOGIC ---
        game.bus.on('spawnSpider', (data) => {
            const config = TITAN_CONFIG[data.role];
            if (config && config.costP !== undefined) {
                if (game.eco[data.team]?.pumpkins >= config.costP && game.eco[data.team]?.dew >= config.costD && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= config.costP; 
                    game.eco[data.team].dew -= config.costD;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-30, 30), data.y + MathUtils.randomRange(-30, 30), data.team, data.role);
                    
                    if (data.role === 'widow') s.sprite = game.assets.get(data.team === 'black' ? 'assets/widow_black.png' : 'assets/widow_red.png');
                    if (data.role === 'goliath') s.sprite = game.assets.get(data.team === 'black' ? 'assets/goliath_black.png' : 'assets/goliath_red.png');

                    // ECS Trait Setup
                    if (s.hasTrait('stealth')) {
                        s.isCloaked = true; 
                        s.cloakCooldown = 0;
                    }
                    if (s.hasTrait('siege_attacker')) {
                        s.range = config.range;
                        s.rangeSq = config.rangeSq; 
                    }

                    s.imageLoaded = true; 
                    game.addEntity(s);
                    game.bus.emit('playSound', 'spell');
                }
            }
        });
    },

    patch: (game) => {
        // [FIX] Updated rendering signature to (original, ctx, gameObj)
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            
            let oldAlpha = ctx.globalAlpha;
            let restoreAlpha = false;

            if (this.hasTrait('stealth') && this.isCloaked) {
                ctx.globalAlpha = 0.35; // Highly transparent to the player
                restoreAlpha = true;
            }
            
            // Call original to preserve health bars and breathing animation!
            original.call(this, ctx, gameObj);
            
            if (restoreAlpha) ctx.globalAlpha = oldAlpha;
        });
    }
};
