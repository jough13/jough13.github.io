// expansions/CombatAI.js
import { MathUtils, Spider, Structure, SPIDER_STATE } from '../game.js';
import { Queen } from './Queen.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak the global AI parameters
export const COMBAT_CONFIG = {
    gathererAggroRange: 150,
    meleeAggroRange: 150,
    turnSpeed: 0.15,          // How fast spiders rotate to face their targets
    harvestDelay: 15,         // Takes 15 frames (~0.25s) to bite a resource node
    escortOrbitRadiusSq: 6400 // 80px orbit radius
};

export const CombatAndHarvesterExpansion = {
    init: (game) => {
        // Expose to game object
        game.combatConfig = COMBAT_CONFIG;
        
        // ==========================================
        // ECS TRAIT: GATHERER (Economy & Self-Defense)
        // ==========================================
        game.registerTrait('gatherer', {
            update: (entity, gameObj) => {
                const techLvl = gameObj.techLevel[entity.team] || 0; 
                const currentDamage = entity.damage + (techLvl * 5); 
                
                const terrain = gameObj.getTerrainAt(entity.x, entity.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                let currentSpeed = (entity.baseSpeed + (techLvl * 0.15)) * tMod;
                
                if (entity.isSlowed) currentSpeed *= 0.3;
                entity.isSlowed = false; 

                // 1. SELF DEFENSE OVERRIDE
                let nearestEnemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, COMBAT_CONFIG.gathererAggroRange + (techLvl * 10));
                
                if (nearestEnemy) {
                    // [JUICE] Alert indicator when spotting an enemy
                    if (entity.state !== SPIDER_STATE.COMBAT) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y - 10, color: '#ff0000', count: 1});
                    }
                    
                    entity.state = SPIDER_STATE.COMBAT; 
                    
                    // [JUICE] Smooth organic turning towards the enemy
                    const targetAngle = Math.atan2(nearestEnemy.y - entity.y, nearestEnemy.x - entity.x);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * COMBAT_CONFIG.turnSpeed;
                    
                    const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;
                    if (MathUtils.distSq(entity.x, entity.y, nearestEnemy.x, nearestEnemy.y) > combatRange * combatRange) { 
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        entity.cooldown = (entity.cooldown || 0) - 1;
                        if (entity.cooldown <= 0) {
                            nearestEnemy.hp -= currentDamage; 
                            entity.cooldown = entity.attackSpeed;
                            
                            // [FIX] Only recoil if the unit actually has movement speed
                            if (currentSpeed > 0) {
                                entity.x -= Math.cos(entity.angle) * 10; 
                                entity.y -= Math.sin(entity.angle) * 10; 
                            }
                            
                            gameObj.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: entity.team==='black'?'#aa00ff':'#ffaa00', count: 5}); 
                            gameObj.bus.emit('playSound', 'harvest'); 
                        }
                    }
                    return true; // Bypass gathering if fighting
                }

                // 2. MANUAL MOVEMENT OVERRIDE
                if (entity.isManual && entity.commandTarget) {
                    const dx = entity.commandTarget.x - entity.x; 
                    const dy = entity.commandTarget.y - entity.y;
                    
                    // [PERFORMANCE] Fast distSq inline
                    if ((dx * dx + dy * dy) > 225) { 
                        // [JUICE] Smooth turning for manual move orders
                        const targetAngle = Math.atan2(dy, dx);
                        entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * COMBAT_CONFIG.turnSpeed;
                        
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        entity.commandTarget = null;
                    }
                    return true; // Bypass gathering if being manually controlled
                }

                // 3. HARVESTING LOGIC
                if (entity.target && ((entity.target.hp !== undefined && entity.target.hp <= 0) || (entity.target.resources !== undefined && entity.target.resources <= 0))) {
                    entity.target = null; 
                    entity.harvestTimer = 0;
                }

                if (entity.cargo.amount === 0) entity.state = SPIDER_STATE.SEEKING_RESOURCE; 
                else entity.state = SPIDER_STATE.RETURNING_HOME; 
                
                if (!entity.target) {
                    entity.searchDelay = (entity.searchDelay || 0) - 1;
                    if (entity.searchDelay <= 0) {
                        entity.searchDelay = MathUtils.randomInt(10, 20); 
                        let closest = null; 
                        let minD = Infinity;

                        if (entity.state === SPIDER_STATE.SEEKING_RESOURCE) {
                            const nodes = gameObj.resourceNodes;
                            for (let i = 0; i < nodes.length; i++) {
                                let r = nodes[i];
                                if (r.resources > 0) {
                                    let dSq = MathUtils.distSq(r.x, r.y, entity.x, entity.y); 
                                    if(dSq < minD) { minD = dSq; closest = r; } 
                                }
                            }
                        } else {
                            const structs = gameObj.structures;
                            for (let i = 0; i < structs.length; i++) {
                                let s = structs[i];
                                if (s.team === entity.team && (s.type === 'nest' || s.type === 'pylon') && s.hp > 0 && !s.isConstructing) {
                                    let dSq = MathUtils.distSq(s.x, s.y, entity.x, entity.y); 
                                    if(dSq < minD) { minD = dSq; closest = s; } 
                                }
                            }
                            
                            const queens = gameObj.queens;
                            for (let i = 0; i < queens.length; i++) {
                                let q = queens[i];
                                if (q.team === entity.team && q.hp > 0) {
                                    let dSq = MathUtils.distSq(q.x, q.y, entity.x, entity.y); 
                                    if(dSq < minD) { minD = dSq; closest = q; } 
                                }
                            }
                        }
                        entity.target = closest;
                    } else {
                        return true; 
                    }
                }

                if (entity.target) {
                    const dx = entity.target.x - entity.x; 
                    const dy = entity.target.y - entity.y;
                    const distSq = (dx * dx + dy * dy); 
                    
                    // [JUICE] Smooth organic turning towards the resource/base
                    const targetAngle = Math.atan2(dy, dx);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * COMBAT_CONFIG.turnSpeed;
                    
                    const targetRadius = entity.target.size ? entity.target.size + 5 : 15;
                    
                    if (distSq > targetRadius * targetRadius) { 
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        
                        // [JUICE] Added a small delay/animation to harvesting so they don't instantly snap it up
                        if (entity.state === SPIDER_STATE.SEEKING_RESOURCE && entity.target.resources > 0) {
                            entity.harvestTimer = (entity.harvestTimer || 0) + 1;
                            
                            if (entity.harvestTimer > COMBAT_CONFIG.harvestDelay) {
                                let amountGathered = Math.min(10, entity.target.resources);
                                entity.cargo.amount = amountGathered; 
                                entity.cargo.type = entity.target.type; 
                                entity.target.resources -= amountGathered; 
                                entity.target = null; 
                                entity.harvestTimer = 0;
                                
                                const resColor = entity.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff';
                                gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: resColor, count: 5}); 
                                gameObj.bus.emit('playSound', 'harvest');
                            } else {
                                // Wiggle animation while mining
                                entity.angle += Math.sin(gameObj.tick * 0.5) * 0.1;
                            }
                        } 
                        else if (entity.state === SPIDER_STATE.RETURNING_HOME) {
                            // JUICE: Visual confirmation of resources being deposited
                            const resColor = entity.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff';
                            gameObj.bus.emit('particles', {x: entity.x, y: entity.y - 15, color: resColor, count: 12, type: 'magic'}); 
                            
                            if (entity.cargo.type === 'pumpkin') gameObj.eco[entity.team].pumpkins += entity.cargo.amount;
                            else if (entity.cargo.type === 'dew') gameObj.eco[entity.team].dew += entity.cargo.amount;
                            
                            entity.cargo.amount = 0; 
                            entity.target = null; 
                        }
                    }
                }
                return true; 
            }
        });

        // ==========================================
        // ECS TRAIT: MELEE (Combat, Escort, Wander)
        // ==========================================
        game.registerTrait('melee', {
            update: (entity, gameObj) => {
                const techLvl = gameObj.techLevel[entity.team] || 0; 
                const currentDamage = entity.damage + (techLvl * 5); 
                
                const terrain = gameObj.getTerrainAt(entity.x, entity.y); 
                let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                let currentSpeed = (entity.baseSpeed + (techLvl * 0.15)) * tMod;
                
                if (entity.isSlowed) currentSpeed *= 0.3;
                entity.isSlowed = false; 

                // 1. COMBAT AGGRO OVERRIDE
                let nearestEnemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, COMBAT_CONFIG.meleeAggroRange + (techLvl * 10));
                
                if (nearestEnemy) {
                    if (entity.state !== SPIDER_STATE.COMBAT) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y - 10, color: '#ff0000', count: 1});
                    }
                    
                    entity.state = SPIDER_STATE.COMBAT; 
                    
                    // [JUICE] Smooth turn
                    const targetAngle = Math.atan2(nearestEnemy.y - entity.y, nearestEnemy.x - entity.x);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * COMBAT_CONFIG.turnSpeed;
                    
                    const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;
                    if (MathUtils.distSq(entity.x, entity.y, nearestEnemy.x, nearestEnemy.y) > combatRange * combatRange) { 
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        entity.cooldown = (entity.cooldown || 0) - 1;
                        if (entity.cooldown <= 0) {
                            nearestEnemy.hp -= currentDamage; 
                            entity.cooldown = entity.attackSpeed;
                            
                            if (currentSpeed > 0) {
                                entity.x -= Math.cos(entity.angle) * 10; 
                                entity.y -= Math.sin(entity.angle) * 10; 
                            }
                            
                            gameObj.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: entity.team==='black'?'#aa00ff':'#ffaa00', count: 5}); 
                            gameObj.bus.emit('playSound', 'harvest'); 
                        }
                    }
                    return true; 
                }

                // 2. ESCORT QUEEN BEHAVIOR (If they have the trait)
                if (entity.hasTrait('escort') && !entity.isManual) {
                    let myQueen = null;
                    const queens = gameObj.queens; 
                    for (let i = 0; i < queens.length; i++) {
                        if (queens[i].team === entity.team) { myQueen = queens[i]; break; }
                    }

                    if (myQueen) {
                        const dx = myQueen.x - entity.x; 
                        const dy = myQueen.y - entity.y;
                        
                        if ((dx * dx + dy * dy) > COMBAT_CONFIG.escortOrbitRadiusSq) { 
                            // [JUICE] Smooth turn to follow queen
                            const targetAngle = Math.atan2(dy, dx);
                            entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * COMBAT_CONFIG.turnSpeed;
                            
                            entity.x += Math.cos(entity.angle) * currentSpeed; 
                            entity.y += Math.sin(entity.angle) * currentSpeed;
                        }
                        return true; 
                    }
                }

                // 3. MANUAL MOVEMENT
                if (entity.isManual && entity.commandTarget) {
                    const dx = entity.commandTarget.x - entity.x; 
                    const dy = entity.commandTarget.y - entity.y;
                    
                    if ((dx * dx + dy * dy) > 225) { 
                        // [JUICE] Smooth turn
                        const targetAngle = Math.atan2(dy, dx);
                        entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * COMBAT_CONFIG.turnSpeed;
                        
                        entity.x += Math.cos(entity.angle) * currentSpeed; 
                        entity.y += Math.sin(entity.angle) * currentSpeed;
                    } else {
                        entity.commandTarget = null;
                    }
                    return true;
                }

                // 4. DEFAULT IDLE WANDERING
                entity.angle += MathUtils.randomRange(-0.2, 0.2); // Smoother wandering
                entity.x += Math.cos(entity.angle) * (currentSpeed * 0.5); 
                entity.y += Math.sin(entity.angle) * (currentSpeed * 0.5);
                
                const bnd = entity.size * 2;
                entity.x = MathUtils.clamp(entity.x, bnd, gameObj.world.width - bnd);
                entity.y = MathUtils.clamp(entity.y, bnd, gameObj.world.height - bnd);
                
                return true; 
            }
        });
    },

    patch: (game) => {
        // ==========================================
        // UNIVERSAL HEALTH BAR RENDERING
        // ==========================================
        const drawHealth = function(ctx) {
            const techBoost = (game.techLevel[this.team] || 0) * 20;
            const absoluteMaxHp = this.maxHp + techBoost;

            if (this.hp !== undefined && this.hp > 0 && this.hp < absoluteMaxHp) {
                const w = this.size * 1.5; 
                const hpPct = Math.max(0, this.hp) / absoluteMaxHp;

                let barColor = '#00ff00';
                if (hpPct < 0.5) barColor = '#ffff00';
                if (hpPct < 0.25) barColor = '#ff0000';

                ctx.fillStyle = '#000000'; 
                // Moved up 1px so it doesn't overlap the bottom of tall sprites
                ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 12, w + 2, 6);
                ctx.fillStyle = '#550000'; 
                ctx.fillRect(this.x - w/2, this.y - this.size - 11, w, 4);
                
                ctx.fillStyle = barColor; 
                ctx.fillRect(this.x - w/2, this.y - this.size - 11, w * hpPct, 4);
            }
        };
        
        // Attach the renderer to all standard combat entities
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) { original.call(this, ctx, gameObj); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Queen, 'draw', function(original, ctx, gameObj) { original.call(this, ctx, gameObj); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) { original.call(this, ctx, gameObj); drawHealth.call(this, ctx); });
    }
};
