// expansions/TraitManager.js
import { Spider, Structure, MathUtils, STRUCTURE_DATA } from '../game.js';

// ==========================================
// THE TRAIT MANAGER (Entity-Component System)
// ==========================================
export const TraitManagerExpansion = {
    init: (game) => {
        console.log("%c[Engine] Trait Manager Online. Modular ECS active.", "color: #00ffcc; font-weight: bold;");

        // 1. The Central Registry
        game.traitRegistry = {};

        // 2. The Global Registration API
        game.registerTrait = function(traitName, traitLogic) {
            this.traitRegistry[traitName] = traitLogic;
            console.log(`Registered Trait: [${traitName}]`);
        };

        // ==========================================
        // 3. REGISTERED TRAITS 
        // ==========================================

        // Trait 1: Regenerator (Passive Healing)
        game.registerTrait('regenerator', {
            update: (entity, gameObj) => {
                if (entity.hp < entity.maxHp && gameObj.tick % 60 === 0) {
                    entity.hp = Math.min(entity.maxHp, entity.hp + 5);
                    gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#00ff00', count: 2, type: 'magic'});
                }
                return false; 
            }
        });

        // Trait 2: Burning Aura (Damage Attackers)
        game.registerTrait('burning_aura', {
            update: (entity, gameObj) => {
                if (gameObj.tick % 30 === 0) { // Every 1 second
                    let burned = false;
                    
                    // [PERFORMANCE] Clamped Spatial Grid Lookup for AoE Burn
                    const CELL_SIZE = 250;
                    const maxGridX = Math.ceil(gameObj.world.width / CELL_SIZE);
                    const maxGridY = Math.ceil(gameObj.world.height / CELL_SIZE);
                    
                    const cx = MathUtils.clamp((entity.x / CELL_SIZE) | 0, 0, maxGridX);
                    const cy = MathUtils.clamp((entity.y / CELL_SIZE) | 0, 0, maxGridY);
                    const radiusSq = 2500; // 50px radius

                    for (let nx = cx - 1; nx <= cx + 1; nx++) {
                        if (nx < 0 || nx > maxGridX) continue;
                        for (let ny = cy - 1; ny <= cy + 1; ny++) {
                            if (ny < 0 || ny > maxGridY) continue;
                            
                            const key = (nx << 16) | ny;
                            const cell = gameObj.spatialGrid.get(key);
                            if (!cell) continue;

                            for (let i = 0; i < cell.length; i++) {
                                let e = cell[i];
                                if (e.team && e.team !== entity.team && e.hp > 0) {
                                    if (MathUtils.distSq(entity.x, entity.y, e.x, e.y) < radiusSq) {
                                        e.hp -= 2; // Burn damage
                                        burned = true;
                                    }
                                }
                            }
                        }
                    }
                    if (burned) gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#ff5500', count: 3, type: 'magic'});
                }
                return false; 
            },
            
            // ECS DRAW HOOK: Traits can now render their own visual overlays!
            draw: (entity, ctx, gameObj) => {
                ctx.save();
                ctx.translate(entity.x, entity.y);
                
                const tick = gameObj ? gameObj.tick : 0;
                const pulse = Math.sin(tick * 0.1) * 2;
                
                // [JUICE] Added a hot glowing shadow to the fire aura
                ctx.shadowColor = '#ff5500';
                ctx.shadowBlur = 10 + pulse;
                
                ctx.strokeStyle = `rgba(255, 85, 0, 0.4)`;
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, 50 + pulse, 0, MathUtils.TWO_PI); ctx.stroke();
                
                ctx.restore();
            }
        });

        // Trait 3: Kamikaze (Explode on contact)
        game.registerTrait('kamikaze', {
            update: (entity, gameObj) => {
                let enemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, 200);
                if (enemy) {
                    entity.state = 1; // SPIDER_STATE.COMBAT
                    
                    // [JUICE] Smooth organic turning instead of snapping!
                    const targetAngle = Math.atan2(enemy.y - entity.y, enemy.x - entity.x);
                    entity.angle += MathUtils.angleWrap(targetAngle - entity.angle) * 0.2;
                    
                    if (MathUtils.distSq(entity.x, entity.y, enemy.x, enemy.y) < 900) { 
                        entity.hp = 0; // Kill self
                        
                        // [JUICE] Explosion Screen Shake!
                        if (gameObj.triggerShake) gameObj.triggerShake(8);
                        gameObj.bus.emit('playSound', 'death');
                        
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#ffaa00', count: 40, type: 'splatter'});
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#ffffff', count: 20, type: 'magic'});
                        
                        // [PERFORMANCE] Clamped Spatial Grid Lookup for Splash Damage
                        const CELL_SIZE = 250;
                        const maxGridX = Math.ceil(gameObj.world.width / CELL_SIZE);
                        const maxGridY = Math.ceil(gameObj.world.height / CELL_SIZE);
                        
                        const cx = MathUtils.clamp((entity.x / CELL_SIZE) | 0, 0, maxGridX);
                        const cy = MathUtils.clamp((entity.y / CELL_SIZE) | 0, 0, maxGridY);
                        const splashRadiusSq = 10000; // 100px radius

                        for (let nx = cx - 1; nx <= cx + 1; nx++) {
                            if (nx < 0 || nx > maxGridX) continue;
                            for (let ny = cy - 1; ny <= cy + 1; ny++) {
                                if (ny < 0 || ny > maxGridY) continue;
                                
                                const key = (nx << 16) | ny;
                                const cell = gameObj.spatialGrid.get(key);
                                if (!cell) continue;

                                for (let i = 0; i < cell.length; i++) {
                                    let e = cell[i];
                                    if (e.team && e.team !== entity.team && e.hp > 0) {
                                        if (MathUtils.distSq(entity.x, entity.y, e.x, e.y) < splashRadiusSq) {
                                            e.hp -= entity.damage; 
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        entity.x += Math.cos(entity.angle) * entity.baseSpeed; 
                        entity.y += Math.sin(entity.angle) * entity.baseSpeed;
                    }
                    return true; 
                }
                return false; 
            }
        });
    },

    patch: (game) => {
        // ==========================================
        // 4. THE UNIVERSAL TRAIT EXECUTION LOOP
        // ==========================================

        const processTraitsUpdate = function(entity, gameObj, originalUpdate) {
            let skipDefaultAI = false;

            if (entity.traits && entity.traits.length > 0) {
                for (let i = 0; i < entity.traits.length; i++) {
                    const traitLogic = gameObj.traitRegistry[entity.traits[i]];
                    if (traitLogic && traitLogic.update) {
                        if (traitLogic.update(entity, gameObj)) skipDefaultAI = true;
                    }
                }
            }
            if (!skipDefaultAI) originalUpdate.call(entity, gameObj);
        };

        // [FIX] Update signature to receive gameObj for animations
        const processTraitsDraw = function(entity, ctx, gameObj, originalDraw) {
            // Run the standard unit/building rendering first
            originalDraw.call(entity, ctx, gameObj);
            
            // Allow traits to overlay their own custom graphics!
            if (entity.traits && entity.traits.length > 0) {
                for (let i = 0; i < entity.traits.length; i++) {
                    const traitLogic = gameObj.traitRegistry[entity.traits[i]];
                    if (traitLogic && traitLogic.draw) traitLogic.draw(entity, ctx, gameObj);
                }
            }
        };

        // --- APPLY TO SPIDERS ---
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            processTraitsUpdate(this, gameObj, original);
        });
        
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            processTraitsDraw(this, ctx, gameObj, original);
        });

        // --- APPLY TO STRUCTURES ---
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            if (!this.traits) {
                // [FIX] Ensure we correctly read from the imported STRUCTURE_DATA dict
                const stats = STRUCTURE_DATA[this.type];
                this.traits = stats && stats.traits ? [...stats.traits] : [];
            }
            processTraitsUpdate(this, gameObj, original);
        });

        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            processTraitsDraw(this, ctx, gameObj, original);
        });
    }
};
