// expansions/Trapdoor.js
import { Spider, MathUtils, UNIT_DATA } from '../game.js';

export const TRAPDOOR_CONFIG = {
    costP: 100, costD: 40, requiredTech: 2,
    burrowFrames: 90, eruptFrames: 15,
    triggerRadius: 100, triggerRadiusSq: 10000,
    burstDamage: 120, stunDuration: 60 
};

export const TrapdoorExpansion = {
    init: (game) => {
        game.trapdoorConfig = TRAPDOOR_CONFIG;

        // 🚀 [ASSET INTEGRATION]
        game.assets.register('assets/trapdoor_black.png');
        game.assets.register('assets/trapdoor_red.png');
        game.assets.register('assets/dirt_mound.png');

        if (game.customUIHooks) {
            game.uiActions['trapdoor'] = { 
                reqTech: TRAPDOOR_CONFIG.requiredTech, icon: '🕳️', name: 'Assassin', 
                cost: `${TRAPDOOR_CONFIG.costP}🎃${TRAPDOOR_CONFIG.costD}💧`, type: 'instant', 
                fn: (t) => game.bus.emit('spawnSpider', {x: t.x, y: t.y, team: 'black', role: 'trapdoor'}) 
            };

            game.customUIHooks.push((currentSelection, addButton) => {
                if (currentSelection && currentSelection.type === 'nest' && currentSelection.team === 'black') addButton('trapdoor');
            });
        }

        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'trapdoor') {
                if (game.eco[data.team].pumpkins >= TRAPDOOR_CONFIG.costP && game.eco[data.team].dew >= TRAPDOOR_CONFIG.costD && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= TRAPDOOR_CONFIG.costP;
                    game.eco[data.team].dew -= TRAPDOOR_CONFIG.costD;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    s.spriteSrc = data.team === 'black' ? 'assets/trapdoor_black.png' : 'assets/trapdoor_red.png';
                    s.moundSrc = 'assets/dirt_mound.png'; // 🚀 New property!
                    
                    s.burrowState = 0; s.burrowTimer = 0;
                    game.addEntity(s);
                    game.bus.emit('playSound', 'harvest'); 
                }
            }
        });

        game.registerTrait('burrow_ambush', {
            update: (entity, gameObj) => {
                if (entity.burrowState === 0) {
                    if (!entity.commandTarget && !entity.target) {
                        entity.burrowState = 1; entity.burrowTimer = TRAPDOOR_CONFIG.burrowFrames;
                    }
                    return false; 
                }

                if (entity.commandTarget || entity.target) {
                    if (entity.burrowState === 1 || entity.burrowState === 2) {
                        entity.burrowState = 3; entity.burrowTimer = TRAPDOOR_CONFIG.eruptFrames; entity.isCloaked = false; 
                    }
                }

                if (entity.burrowState === 1) {
                    entity.burrowTimer--;
                    if (gameObj.tick % 5 === 0) gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#3d2817', count: 2});
                    if (entity.burrowTimer <= 0) { entity.burrowState = 2; entity.isCloaked = true; }
                    return true; 
                }

                if (entity.burrowState === 2) {
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
                                    if (Math.abs(entity.x - e.x) > radius || Math.abs(entity.y - e.y) > radius) continue;
                                    if (MathUtils.distSq(entity.x, entity.y, e.x, e.y) < radiusSq) {
                                        e.hp -= TRAPDOOR_CONFIG.burstDamage;
                                        e.stunTimer = TRAPDOOR_CONFIG.stunDuration;
                                        triggered = true;
                                        gameObj.bus.emit('particles', {x: e.x, y: e.y, color: '#ff0000', count: 5, type: 'splatter'});
                                    }
                                }
                            }
                        }
                    }

                    if (triggered) {
                        entity.burrowState = 3; entity.burrowTimer = TRAPDOOR_CONFIG.eruptFrames; entity.isCloaked = false;
                        if (gameObj.triggerShake) gameObj.triggerShake(8);
                        gameObj.bus.emit('playSound', 'death');
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#3d2817', count: 40});
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#dfba96', count: 10, type: 'magic'});
                    }
                    return true; 
                }

                if (entity.burrowState === 3) {
                    entity.burrowTimer--;
                    if (entity.burrowTimer <= 0) entity.burrowState = 0; 
                    return true; 
                }
                return false;
            }
        });
    },

    patch: (game) => {
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            
            if (this.role === 'trapdoor') {
                
                // 🚀 [ASSET INTEGRATION] Draw the pixel art dirt mound!
                if (this.burrowState === 2) {
                    if (!this.moundLoaded && gameObj.assets) {
                        this.moundSprite = gameObj.assets.get(this.moundSrc);
                        if (this.moundSprite) this.moundLoaded = true;
                    }

                    ctx.save();
                    ctx.translate(this.x, this.y);
                    
                    if (this.moundLoaded && this.moundSprite.complete && this.moundSprite.naturalHeight !== 0) {
                        const aspect = this.moundSprite.naturalWidth / this.moundSprite.naturalHeight;
                        const drawH = this.size * 2;
                        const drawW = drawH * aspect;
                        ctx.drawImage(this.moundSprite, -drawW / 2, -drawH / 2, drawW, drawH);
                    } else {
                        // Fallback
                        ctx.fillStyle = '#2a1a10'; 
                        ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#111'; ctx.fillRect(-5, -2, 3, 3); ctx.fillRect(4, 2, 2, 2);
                    }
                    
                    ctx.restore();
                    return; 
                }
                
                // Sinking/Rising animation using Canvas Scale
                if (this.burrowState === 1 || this.burrowState === 3) {
                    const progress = this.burrowState === 1 
                        ? this.burrowTimer / TRAPDOOR_CONFIG.burrowFrames 
                        : 1 - (this.burrowTimer / TRAPDOOR_CONFIG.eruptFrames); 
                        
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.scale(progress, progress);
                    ctx.translate(-this.x, -this.y);
                    original.call(this, ctx, gameObj); 
                    ctx.restore();
                    return;
                }
            }
            original.call(this, ctx, gameObj);
        });
    }
};
