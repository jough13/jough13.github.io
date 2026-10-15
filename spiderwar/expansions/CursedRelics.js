// expansions/CursedRelics.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// 🔌 [EXPANDABILITY] Exported config for easy tweaking by other mods
export const CURSED_CONFIG = {
    wraith: { 
        hp: 120, damage: 30, attackSpeed: 25, 
        baseSpeedMin: 1.6, baseSpeedMax: 2.0, 
        blinkCooldown: 150, blinkRange: 150, blinkDamageMult: 1.5 
    },
    obelisk: { 
        hp: 350, size: 20, 
        zapCooldown: 90, zapRange: 300, 
        baseDamage: 75, chainDamageMult: 0.5, chainRange: 100 
    },
    eclipse: { 
        cost: 150, 
        targetRatio: 0.51 // Just past dusk, plunging into night 
    }
};

export const CursedRelicsExpansion = {
    init: (game) => {
        console.log("%c[DLC] Cursed Relics Expansion Loaded!", "color: #9900ff;");

        game.cursedConfig = CURSED_CONFIG;

        // 1. REGISTER ASSETS
        game.assets.register('assets/wraith_black.png');
        game.assets.register('assets/wraith_red.png');
        game.assets.register('assets/obelisk_black.png');
        game.assets.register('assets/obelisk_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['wraith'] = { 
            size: 13, hp: CURSED_CONFIG.wraith.hp, 
            damage: CURSED_CONFIG.wraith.damage, attackSpeed: CURSED_CONFIG.wraith.attackSpeed, 
            baseSpeedMin: CURSED_CONFIG.wraith.baseSpeedMin, baseSpeedMax: CURSED_CONFIG.wraith.baseSpeedMax, 
            traits: ['blink_strike', 'melee'] // Assassin logic
        };

        STRUCTURE_DATA['obelisk'] = { 
            hp: CURSED_CONFIG.obelisk.hp, size: CURSED_CONFIG.obelisk.size, territory: 0 
        };

        // ==========================================
        // 3. ECS TRAIT REGISTRATION
        // ==========================================
        game.registerTrait('blink_strike', {
            update: (entity, gameObj) => {
                if (!entity.blinkCooldown) entity.blinkCooldown = 0;
                if (entity.blinkCooldown > 0) entity.blinkCooldown--;

                // Scan for an enemy within teleport range
                let enemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, CURSED_CONFIG.wraith.blinkRange);
                
                if (enemy && entity.blinkCooldown <= 0) {
                    // 🧃 [JUICE] Poof! (Start location implosion)
                    gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#aa00ff', count: 15, type: 'magic'});
                    
                    // Teleport behind them (🛡️ FIX: Clamped to map boundaries!)
                    const bnd = entity.size * 2;
                    entity.x = MathUtils.clamp(enemy.x + MathUtils.randomRange(-10, 10), bnd, gameObj.world.width - bnd);
                    entity.y = MathUtils.clamp(enemy.y + MathUtils.randomRange(-10, 10), bnd, gameObj.world.height - bnd);
                    
                    // 🧃 [JUICE] Poof! (End location explosion)
                    gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#aa00ff', count: 15, type: 'splatter'});
                    gameObj.bus.emit('playSound', 'spell');
                    
                    // 🧃 [JUICE] Make the Wraith flash bright white for a split second after blinking
                    entity.flashFrames = 5;
                    
                    // Sneak attack damage multiplier!
                    enemy.hp -= (entity.damage * CURSED_CONFIG.wraith.blinkDamageMult) + ((gameObj.techLevel[entity.team] || 0) * 10);
                    entity.blinkCooldown = CURSED_CONFIG.wraith.blinkCooldown; 
                }
                
                // RETURN FALSE: This allows the normal "melee" AI trait to keep running 
                // so the Wraith actually attacks the target after teleporting!
                return false; 
            }
        });

        // 4. SPELL LOGIC: ECLIPSE (Time Manipulation)
        game.bus.on('castSpell', (data) => {
            if (data.type === 'eclipse') {
                if (game.eco[data.team].dew >= CURSED_CONFIG.eclipse.cost) {
                    game.eco[data.team].dew -= CURSED_CONFIG.eclipse.cost;
                    
                    game.bus.emit('playSound', 'death'); 
                    setTimeout(() => game.bus.emit('playSound', 'death'), 300); // Double-boom ominous sound
                    if (game.triggerShake) game.triggerShake(15);
                    
                    // 🛡️ [FIX] Do NOT mutate game.tick! It breaks AI escalation and deterministic spawns.
                    // Instead, trigger DayNight.js to handle the atmospheric changes decoupled from the game clock!
                    game.bus.emit('triggerEclipse');
                    
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#aa00ff', count: 200, type: 'magic'});
                }
            }
        });

        // Spawn Wraith Logic
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'wraith') {
                if (game.eco[data.team].pumpkins >= 80 && game.eco[data.team].dew >= 30 && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= 80;
                    game.eco[data.team].dew -= 30;
                    
                    // 🛡️ [FIX] Increment population immediately to prevent spam-click bypass!
                    game.pop[data.team]++; 
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    
                    // 🚀 [LOGIC FIX] Point the base class to the correct sprite target!
                    s.spriteSrc = data.team === 'black' ? 'assets/wraith_black.png' : 'assets/wraith_red.png';
                    
                    game.addEntity(s);
                    game.bus.emit('playSound', 'spell'); 
                }
            }
        });
    },

    patch: (game) => {

        // 5. STRUCTURE AI: THE OBELISK (Tesla Coil)
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'obelisk' && !this.isConstructing && this.hp > 0) {
                if (!this.zapCooldown) this.zapCooldown = 0;
                if (this.zapCooldown > 0) this.zapCooldown--;

                if (this.zapCooldown <= 0) {
                    let enemy = gameObj.getNearestEnemy(this.x, this.y, this.team, CURSED_CONFIG.obelisk.zapRange);
                    
                    if (enemy) {
                        const baseDamage = CURSED_CONFIG.obelisk.baseDamage + ((gameObj.techLevel[this.team]||0) * 10);
                        enemy.hp -= baseDamage;
                        this.zapCooldown = CURSED_CONFIG.obelisk.zapCooldown;
                        
                        gameObj.bus.emit('playSound', 'shoot');
                        gameObj.bus.emit('particles', {x: enemy.x, y: enemy.y, color: '#ffffff', count: 10});
                        
                        // 🧃 [JUICE] Chain Lightning! 
                        let secondaryEnemy = null;
                        
                        // 🚀 [PERFORMANCE] Fast Spatial Grid Secondary Scan
                        const CELL_SIZE = 250;
                        const maxGridX = Math.ceil(gameObj.world.width / CELL_SIZE);
                        const maxGridY = Math.ceil(gameObj.world.height / CELL_SIZE);
                        
                        const cx = MathUtils.clamp((enemy.x / CELL_SIZE) | 0, 0, maxGridX);
                        const cy = MathUtils.clamp((enemy.y / CELL_SIZE) | 0, 0, maxGridY);
                        
                        // 🛡️ [FIX] Use 3x3 grid scan to prevent border-line misses, and add bitwise Y mask
                        outerLoop: for (let nx = cx - 1; nx <= cx + 1; nx++) {
                            if (nx < 0 || nx > maxGridX) continue;
                            for (let ny = cy - 1; ny <= cy + 1; ny++) {
                                if (ny < 0 || ny > maxGridY) continue;
                                
                                const key = (nx << 16) | (ny & 0xFFFF);
                                const cell = gameObj.spatialGrid.get(key);
                                
                                if (!cell) continue;

                                for (let i = 0; i < cell.length; i++) {
                                    let possibleTarget = cell[i];
                                    
                                    // 🛡️ [FIX] Skip cloaked targets and projectiles!
                                    if (possibleTarget.team && possibleTarget.team !== this.team && possibleTarget.hp > 0 && possibleTarget !== enemy && !possibleTarget.isCloaked) {
                                        if (MathUtils.distSq(enemy.x, enemy.y, possibleTarget.x, possibleTarget.y) < (CURSED_CONFIG.obelisk.chainRange * CURSED_CONFIG.obelisk.chainRange)) {
                                            secondaryEnemy = possibleTarget;
                                            break outerLoop; // Found one, chain complete! Escapes the 3D loop.
                                        }
                                    }
                                }
                            }
                        }
                        
                        let chainVisual = null;
                        
                        if (secondaryEnemy) {
                            secondaryEnemy.hp -= (baseDamage * CURSED_CONFIG.obelisk.chainDamageMult); 
                            gameObj.bus.emit('particles', {x: secondaryEnemy.x, y: secondaryEnemy.y, color: '#aa00ff', count: 5});
                            chainVisual = { x: secondaryEnemy.x, y: secondaryEnemy.y };
                        }

                        // Store the target coordinate briefly so the draw function can render the lightning bolt!
                        this.zapVisual = { x: enemy.x, y: enemy.y, timer: 8, chain: chainVisual }; 
                    }
                }
            }
        });

        // 6. DRAWING LOGIC: PROCEDURAL JAGGED LIGHTNING
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            
            // 🚀 [LOGIC FIX] Pull the preloaded image directly from the RAM Cache!
            if (this.type === 'obelisk' && !this.spriteLoaded && gameObj.assets) {
                this.sprite = gameObj.assets.get(this.spriteSrc);
                if (this.sprite) this.spriteLoaded = true;
            }

            original.call(this, ctx, gameObj); // Draw base structure first
            
            // Draw Procedural Lightning Strike
            if (this.type === 'obelisk' && this.zapVisual && this.zapVisual.timer > 0) {
                this.zapVisual.timer--;
                
                ctx.save();
                ctx.strokeStyle = this.team === 'black' ? '#aa00ff' : '#ff0000';
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                
                // 🧃 [JUICE] True Procedural Jagged Lightning Function
                const drawJaggedLine = (x1, y1, x2, y2, segments, variance, width) => {
                    ctx.lineWidth = width;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    for (let i = 1; i <= segments; i++) {
                        let px = MathUtils.lerp(x1, x2, i / segments);
                        let py = MathUtils.lerp(y1, y2, i / segments);
                        
                        // Add organic jagged variance, except to the final connecting point
                        if (i < segments) {
                            px += MathUtils.randomRange(-variance, variance);
                            py += MathUtils.randomRange(-variance, variance);
                        }
                        ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                };

                // Primary Bolt (Thick, highly jagged)
                drawJaggedLine(this.x, this.y - this.size, this.zapVisual.x, this.zapVisual.y, 6, 25, 3);

                // Secondary Chain Lightning Bolt (Thinner, less jagged)
                if (this.zapVisual.chain) {
                    drawJaggedLine(this.zapVisual.x, this.zapVisual.y, this.zapVisual.chain.x, this.zapVisual.chain.y, 4, 15, 1.5);
                }
                
                ctx.restore();
            }

            // Canvas fallback if sprite isn't loaded yet
            if (this.type === 'obelisk' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                
                // Base
                ctx.fillStyle = '#222'; 
                ctx.beginPath(); ctx.moveTo(-10, 15); ctx.lineTo(10, 15); ctx.lineTo(0, -30); ctx.fill();
                
                // 🧃 [JUICE] Glowing, pulsing crystal orb on top
                const tick = gameObj ? gameObj.tick : 0;
                const throb = Math.sin(tick * 0.2) * 2;
                
                ctx.shadowColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                ctx.shadowBlur = 15 + throb * 2;
                ctx.fillStyle = ctx.shadowColor; 
                ctx.beginPath(); ctx.arc(0, -30, 6 + (throb * 0.5), 0, MathUtils.TWO_PI); ctx.fill();
                
                ctx.restore();
            }
        });
        
        // 7. WRAITH AFTERIMAGE RENDER
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            // 🧃 [JUICE] Flash bright white immediately after a teleport
            if (this.flashFrames && this.flashFrames > 0) {
                this.flashFrames--;
                ctx.save();
                ctx.filter = 'brightness(3.0)';
                original.call(this, ctx, gameObj);
                ctx.restore();
            } else {
                original.call(this, ctx, gameObj);
            }
        });
    }
};
