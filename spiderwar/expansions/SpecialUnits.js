// expansions/SpecialUnits.js
import { Spider, Projectile, MathUtils, UNIT_DATA, SPIDER_STATE } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak the special unit stats
export const SPECIAL_CONFIG = {
    spitter: { 
        hp: 75, damage: 25, attackSpeed: 45, size: 12, 
        baseSpeedMin: 0.8, baseSpeedMax: 1.2, cost: 40,
        range: 250, rangeSq: 62500, // Pre-calculated for fast MathUtils.distSq comparisons
        turnSpeed: 0.2              // Aiming speed
    },
    tarantula: { 
        hp: 400, damage: 45, attackSpeed: 40, size: 22, 
        baseSpeedMin: 0.5, baseSpeedMax: 0.7, cost: 75 
    }
};

export const SpecialUnitsExpansion = {
    init: (game) => {
        // [EXPANDABILITY] Hook config to the game engine
        game.specialConfig = SPECIAL_CONFIG;

        // --- 1. ASSET REGISTRY ---
        game.assets.register('assets/spitter_black.png');
        game.assets.register('assets/spitter_red.png');
        game.assets.register('assets/tarantula_black.png');
        game.assets.register('assets/tarantula_red.png');

        // --- 2. DATA CONFIGURATIONS ---
        UNIT_DATA['spitter'] = { 
            size: SPECIAL_CONFIG.spitter.size, hp: SPECIAL_CONFIG.spitter.hp, 
            damage: SPECIAL_CONFIG.spitter.damage, attackSpeed: SPECIAL_CONFIG.spitter.attackSpeed, 
            baseSpeedMin: SPECIAL_CONFIG.spitter.baseSpeedMin, baseSpeedMax: SPECIAL_CONFIG.spitter.baseSpeedMax,
            traits: ['ranged_attacker', 'escort'] // Automatically guards the queen when idle!
        };
        
        UNIT_DATA['tarantula'] = { 
            size: SPECIAL_CONFIG.tarantula.size, hp: SPECIAL_CONFIG.tarantula.hp, 
            damage: SPECIAL_CONFIG.tarantula.damage, attackSpeed: SPECIAL_CONFIG.tarantula.attackSpeed, 
            baseSpeedMin: SPECIAL_CONFIG.tarantula.baseSpeedMin, baseSpeedMax: SPECIAL_CONFIG.tarantula.baseSpeedMax,
            traits: ['melee', 'escort'] // Heavy melee guard
        };

        // ==========================================
        // 3. ECS TRAIT REGISTRATION
        // ==========================================
        game.registerTrait('ranged_attacker', {
            update: (entity, gameObj) => {
                const techLvl = gameObj.techLevel[entity.team] || 0; 
                const currentDamage = entity.damage + (techLvl * 5); 
                
                // Environmental and magical speed modifiers
                const terrain = gameObj.getTerrainAt(entity.x, entity.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                
                // Safe fallback for buildings that might get this trait later
                let currentSpeed = ((entity.baseSpeed || 0) + (techLvl * 0.15)) * tMod;
                if (entity.isSlowed) currentSpeed *= 0.3;
                entity.isSlowed = false; // Reset trap debuff

                // Detect range based on unit's configured range, plus a little buffer
                const detectRadius = (entity.range || 200) + 50 + (techLvl * 10);
                let nearestEnemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, detectRadius);

                // COMBAT OVERRIDE: Prioritize shooting over everything else!
                if (nearestEnemy) {
                    
                    // [JUICE] Alert indicator when spotting an enemy
                    if (entity.state !== SPIDER_STATE.COMBAT) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y - 10, color: '#ff0000', count: 1});
                    }

                    entity.state = SPIDER_STATE.COMBAT;
                    
                    // [JUICE] Smooth organic turning towards the enemy for aiming
                    const targetAngle = Math.atan2(nearestEnemy.y - entity.y, nearestEnemy.x - entity.x);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * SPECIAL_CONFIG.spitter.turnSpeed;

                    const distSq = MathUtils.distSq(entity.x, entity.y, nearestEnemy.x, nearestEnemy.y);
                    const effectiveRangeSq = entity.rangeSq || 40000;

                    if (distSq > effectiveRangeSq && currentSpeed > 0) {
                        // Chase until in range (if it's a mobile unit)
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        // In range, open fire!
                        entity.cooldown = (entity.cooldown || 0) - 1;
                        if (entity.cooldown <= 0) {
                            
                            // [JUICE] Offset the projectile so it shoots from the 'mouth', not the center
                            const pX = entity.x + Math.cos(entity.angle) * entity.size;
                            const pY = entity.y + Math.sin(entity.angle) * entity.size;
                            
                            gameObj.addEntity(new Projectile(pX, pY, nearestEnemy, currentDamage, entity.team));
                            gameObj.bus.emit('playSound', 'shoot');
                            
                            // Ranged Recoil Effect (only for mobile units)
                            if (currentSpeed > 0) {
                                entity.x -= Math.cos(entity.angle) * 4; 
                                entity.y -= Math.sin(entity.angle) * 4; 
                            }
                            
                            entity.cooldown = entity.attackSpeed || 45;
                        }
                    }
                    return true; // RETURN TRUE: Prevent standard melee AI from running
                }

                // MANUAL MOVEMENT OVERRIDE: 
                // If the ranged unit has no enemies in range, but is under player command, move there!
                if (entity.isManual && entity.commandTarget && currentSpeed > 0) {
                    const dx = entity.commandTarget.x - entity.x; 
                    const dy = entity.commandTarget.y - entity.y;
                    
                    // [PERFORMANCE] Fast inline distance math
                    if ((dx * dx + dy * dy) > 225) { 
                        // [JUICE] Smooth rotation
                        const targetAngle = Math.atan2(dy, dx);
                        entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * 0.15; 
                        
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                        
                        // Clamp manual movement so they don't wander off the map!
                        const bnd = entity.size * 2;
                        entity.x = MathUtils.clamp(entity.x, bnd, gameObj.world.width - bnd);
                        entity.y = MathUtils.clamp(entity.y, bnd, gameObj.world.height - bnd);

                    } else {
                        entity.commandTarget = null; // Target reached
                    }
                    return true; // RETURN TRUE: Prevent standard melee AI from running
                }

                return false; // RETURN FALSE: Let normal AI handle idle behavior (Gathering/Escorting)
            }
        });

        // --- 4. SPAWNING LOGIC ---
        game.bus.on('spawnSpider', (data) => {
            const config = SPECIAL_CONFIG[data.role];
            
            if (config && config.cost !== undefined) {
                if (game.eco[data.team]?.pumpkins >= config.cost && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= config.cost;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    
                    if (data.role === 'spitter') {
                        // Inherits from Spider, but we ensure it uses the specific asset
                        s.sprite = game.assets.get(data.team === 'black' ? 'assets/spitter_black.png' : 'assets/spitter_red.png');
                        
                        // Inject configuration stats into the entity so the Trait can read them
                        if (s.hasTrait('ranged_attacker')) {
                            s.range = config.range; 
                            s.rangeSq = config.rangeSq; 
                        }
                    } else if (data.role === 'tarantula') {
                        s.sprite = game.assets.get(data.team === 'black' ? 'assets/tarantula_black.png' : 'assets/tarantula_red.png');
                    }
                    
                    s.imageLoaded = true; 
                    game.addEntity(s);
                    game.bus.emit('playSound', 'harvest'); 
                }
            }
        });
    },

    patch: (game) => {
        // --- 5. RANGED ATTACK ANIMATION ---
        // [FIX] Updated signature to accept gameObj
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            
            let restoreScale = false;
            
            // JUICE: If the unit is a ranged attacker and just fired (cooldown is high),
            // slightly squish and stretch its sprite to simulate "spitting" recoil!
            if (this.hasTrait('ranged_attacker') && this.cooldown && this.cooldown > (this.attackSpeed || 45) - 5) {
                
                // [FIX] Matrix transform trick! 
                // This applies the stretch locally, but allows the original drawing method 
                // to handle positioning, health bars, and breathing animations seamlessly.
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                
                // Squish on X, Stretch on Y
                ctx.scale(0.8, 1.2); 
                
                ctx.rotate(-this.angle);
                ctx.translate(-this.x, -this.y);
                
                restoreScale = true;
            }
            
            // Always call the original so healthbars and core animations run
            original.call(this, ctx, gameObj);
            
            if (restoreScale) ctx.restore();
        });
    }
};
