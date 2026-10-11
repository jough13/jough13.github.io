// expansions/Trapdoor.js
import { Spider, MathUtils, UNIT_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// 🔌 [EXPANDABILITY] Exported so mods can tweak the assassin's behavior
export const TRAPDOOR_CONFIG = {
    costP: 100,
    costD: 40,
    requiredTech: 2,
    
    burrowFrames: 90,         // 1.5 seconds to dig underground
    eruptFrames: 15,          // 0.25 seconds to burst out
    
    triggerRadius: 100,
    triggerRadiusSq: 10000,   // 100^2
    burstDamage: 120,         // Massive initial AoE burst
    stunDuration: 60          // 2 seconds of stun to survivors
};

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const TrapdoorExpansion = {
    init: (game) => {
        console.log("%c[DLC] Trapdoor Assassins Online. The ground shifts...", "color: #dfba96; font-weight: bold;");
        
        game.trapdoorConfig = TRAPDOOR_CONFIG;

        // 1. REGISTER ASSETS
        game.assets.register('assets/trapdoor_black.png');
        game.assets.register('assets/trapdoor_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['trapdoor'] = { 
            size: 16, hp: 180, damage: 35, attackSpeed: 30, 
            baseSpeedMin: 2.2, baseSpeedMax: 2.6, // Fast movers above ground
            traits: ['burrow_ambush', 'melee']    // Snaps on both the new trait and standard combat
        };

        // 🔌 3. INJECT CUSTOM UI BUTTON dynamically!
        if (game.customUIHooks) {
            game.uiActions['trapdoor'] = { 
                reqTech: TRAPDOOR_CONFIG.requiredTech, 
                icon: '🕳️', 
                name: 'Assassin', 
                cost: `${TRAPDOOR_CONFIG.costP}🎃${TRAPDOOR_CONFIG.costD}💧`, 
                type: 'instant', 
                fn: (t) => game.bus.emit('spawnSpider', {x: t.x, y: t.y, team: 'black', role: 'trapdoor'}) 
            };

            // This hook runs every time the UI refreshes
            game.customUIHooks.push((currentSelection, addButton) => {
                // If a Nest is selected, add the Assassin button!
                if (currentSelection && currentSelection.type === 'nest' && currentSelection.team === 'black') {
                    addButton('trapdoor');
                }
            });
        }

        // 4. SPAWN LOGIC
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'trapdoor') {
                if (game.eco[data.team].pumpkins >= TRAPDOOR_CONFIG.costP && game.eco[data.team].dew >= TRAPDOOR_CONFIG.costD && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= TRAPDOOR_CONFIG.costP;
                    game.eco[data.team].dew -= TRAPDOOR_CONFIG.costD;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    s.spriteSrc = data.team === 'black' ? 'assets/trapdoor_black.png' : 'assets/trapdoor_red.png';
                    
                    // Initialize burrow states
                    s.burrowState = 0; // 0=Idle(Above), 1=Digging, 2=Hidden, 3=Erupting
                    s.burrowTimer = 0;

                    game.addEntity(s);
                    game.bus.emit('playSound', 'harvest'); 
                }
            }
        });

        // ==========================================
        // 5. ECS TRAIT REGISTRATION (The AI Brain)
        // ==========================================
        game.registerTrait('burrow_ambush', {
            update: (entity, gameObj) => {
                
                // State 0: Above ground. If idle, start digging!
                if (entity.burrowState === 0) {
                    if (!entity.commandTarget && !entity.target) {
                        entity.burrowState = 1;
                        entity.burrowTimer = TRAPDOOR_CONFIG.burrowFrames;
                    }
                    return false; // Run normal melee AI so it can fight/move
                }

                // Unburrow immediately if commanded to move by the player
                if (entity.commandTarget || entity.target) {
                    if (entity.burrowState === 1 || entity.burrowState === 2) {
                        entity.burrowState = 3;
                        entity.burrowTimer = TRAPDOOR_CONFIG.eruptFrames;
                        entity.isCloaked = false; // Targetable again!
                    }
                }

                // State 1: Digging into the earth
                if (entity.burrowState === 1) {
                    entity.burrowTimer--;
                    
                    // 🧃 [JUICE] Kick up dirt while digging
                    if (gameObj.tick % 5 === 0) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#3d2817', count: 2});
                    }

                    if (entity.burrowTimer <= 0) {
                        entity.burrowState = 2; // Fully hidden
                        entity.isCloaked = true; // Untargetable by enemies!
                    }
                    return true; // Halt movement/combat while digging
                }

                // State 2: Hidden & Waiting to Ambush
                if (entity.burrowState === 2) {
                    
                    // 🚀 [PERFORMANCE] Fast Spatial Grid Scan for Prey
                    const CELL_SIZE = 250;
                    const maxGridX = Math.ceil(gameObj.world.width / CELL_SIZE);
                    const maxGridY = Math.ceil(gameObj.world.height / CELL_SIZE);
                    
                    const cx = MathUtils.clamp((entity.x / CELL_SIZE) | 0, 0, maxGridX);
                    const cy = MathUtils.clamp((entity.y / CELL_SIZE) | 0, 0, maxGridY);
                    
                    const radius = TRAPDOOR_CONFIG.triggerRadius;
                    const radiusSq = TRAPDOOR_CONFIG.triggerRadiusSq;

                    let triggered = false;

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
                                    // Fast AABB check
                                    if (Math.abs(entity.x - e.x) > radius || Math.abs(entity.y - e.y) > radius) continue;
                                    
                                    if (MathUtils.distSq(entity.x, entity.y, e.x, e.y) < radiusSq) {
                                        
                                        // BOOM! Deal damage and apply stuns
                                        e.hp -= TRAPDOOR_CONFIG.burstDamage;
                                        e.stunTimer = TRAPDOOR_CONFIG.stunDuration;
                                        triggered = true;
                                        
                                        // 🧃 [JUICE] Hit FX
                                        gameObj.bus.emit('particles', {x: e.x, y: e.y, color: '#ff0000', count: 5, type: 'splatter'});
                                    }
                                }
                            }
                        }
                    }

                    if (triggered) {
                        entity.burrowState = 3;
                        entity.burrowTimer = TRAPDOOR_CONFIG.eruptFrames;
                        entity.isCloaked = false;
                        
                        // 🧃 [JUICE] Massive Eruption
                        if (gameObj.triggerShake) gameObj.triggerShake(8);
                        gameObj.bus.emit('playSound', 'death');
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#3d2817', count: 40});
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#dfba96', count: 10, type: 'magic'});
                    }

                    return true; // Halt movement while waiting
                }

                // State 3: Erupting / Standing up
                if (entity.burrowState === 3) {
                    entity.burrowTimer--;
                    if (entity.burrowTimer <= 0) {
                        entity.burrowState = 0; // Fully above ground, ready to fight!
                    }
                    return true; // Halt movement until fully emerged
                }

                return false;
            }
        });
    },

    patch: (game) => {
        // 6. DRAWING MODIFICATIONS (Visualizing the dig)
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            
            if (this.role === 'trapdoor') {
                
                // Draw a dirt mound when fully burrowed
                if (this.burrowState === 2) {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    
                    ctx.fillStyle = '#2a1a10'; // Dark packed dirt
                    ctx.beginPath(); 
                    ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2); 
                    ctx.fill();
                    
                    // A few decorative pebbles on the mound
                    ctx.fillStyle = '#111';
                    ctx.fillRect(-5, -2, 3, 3);
                    ctx.fillRect(4, 2, 2, 2);
                    
                    ctx.restore();
                    return; // Skip original draw! (Spider is invisible)
                }
                
                // Sinking/Rising animation using Canvas Scale
                if (this.burrowState === 1 || this.burrowState === 3) {
                    
                    const progress = this.burrowState === 1 
                        ? this.burrowTimer / TRAPDOOR_CONFIG.burrowFrames  // Shrinks 1.0 -> 0.0
                        : 1 - (this.burrowTimer / TRAPDOOR_CONFIG.eruptFrames); // Grows 0.0 -> 1.0
                        
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.scale(progress, progress);
                    ctx.translate(-this.x, -this.y);
                    
                    original.call(this, ctx, gameObj); // Draw the spider shrunken
                    ctx.restore();
                    return;
                }
            }

            // Normal rendering if state is 0
            original.call(this, ctx, gameObj);
        });
    }
};
