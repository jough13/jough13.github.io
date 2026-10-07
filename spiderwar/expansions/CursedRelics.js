// expansions/CursedRelics.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported config for easy tweaking by other mods
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
                    // [JUICE] Poof! (Start location implosion)
                    gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#aa00ff', count: 15, type: 'magic'});
                    
                    // Teleport behind them
                    entity.x = enemy.x + MathUtils.randomRange(-10, 10);
                    entity.y = enemy.y + MathUtils.randomRange(-10, 10);
                    
                    // [JUICE] Poof! (End location explosion)
                    gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#aa00ff', count: 15, type: 'splatter'});
                    gameObj.bus.emit('playSound', 'spell');
                    
                    // [JUICE] Make the Wraith flash bright white for a split second after blinking
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
                    
                    // The DayNight cycle is 7200 ticks.
                    const cycleTicks = 7200;
                    
                    let ticksToAdd = (CURSED_CONFIG.eclipse.targetRatio * cycleTicks) - (game.tick % cycleTicks);
                    if (ticksToAdd < 0) ticksToAdd += cycleTicks; // Wrap around if we are past it
                    
                    const oldTick = game.tick;
                    game.tick += Math.floor(ticksToAdd); // FAST FORWARD TIME!
                    
                    // [FIX] THE TIME-WARP SAFETY NET
                    // If the time-skip accidentally skips exactly over the Boss Spawn frame, 
                    // the game breaks. This catches it and pins the engine to the exact spawn frame!
                    const bossTick = (game.bossConfig && game.bossConfig.spawnTick) ? game.bossConfig.spawnTick : 10800;
                    if (oldTick < bossTick && game.tick >= bossTick) {
                        game.tick = bossTick;
                        console.log("[Eclipse] Safely intercepted Boss Spawn during time-warp.");
                    }
                    
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
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    s.sprite = game.assets.get(data.team === 'black' ? 'assets/wraith_black.png' : 'assets/wraith_red.png');
                    s.imageLoaded = true; 
                    
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
                        
                        // JUICE: Chain Lightning! Find a secondary target near the primary target
                        let secondaryEnemy = gameObj.getNearestEnemy(enemy.x, enemy.y, this.team, CURSED_CONFIG.obelisk.chainRange);
                        let chainVisual = null;
                        
                        // Ensure it doesn't just hit the exact same bug twice
                        if (secondaryEnemy && secondaryEnemy !== enemy) {
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
            
            // Sprite Caching Link
            if (this.type === 'obelisk' && !this.spriteLoaded && gameObj.assets) {
                this.sprite = gameObj.assets.get(`assets/${this.type}_${this.team}.png`);
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
                
                // [JUICE] True Procedural Jagged Lightning Function
                const drawJaggedLine = (x1, y1, x2, y2, segments, variance, width) => {
                    ctx.lineWidth = width;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    for (let i = 1; i <= segments; i++) {
                        let px = MathUtils.lerp(x1, x2, i / segments);
                        let py = MathUtils.lerp(y1, y2, i / segments);
                        if (i < segments) {
                            px += MathUtils.randomRange(-variance, variance);
                            py += MathUtils.randomRange(-variance, variance);
                        }
                        ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                };

                // Primary Bolt (Thick, highly jagged)
                drawJaggedLine(this.x, this.y - this.size, this.zapVisual.x, this.zapVisual.y, 5, 20, 3);

                // Secondary Chain Lightning Bolt (Thinner, less jagged)
                if (this.zapVisual.chain) {
                    drawJaggedLine(this.zapVisual.x, this.zapVisual.y, this.zapVisual.chain.x, this.zapVisual.chain.y, 3, 10, 1.5);
                }
                
                ctx.restore();
            }

            // Canvas fallback if sprite isn't loaded yet
            if (this.type === 'obelisk' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                
                // Base
                ctx.fillStyle = '#222'; 
                ctx.beginPath(); ctx.moveTo(-10, 15); ctx.lineTo(10, 15); ctx.lineTo(0, -30); ctx.fill();
                
                // [JUICE] Glowing, pulsing crystal orb on top
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
            // [JUICE] Flash bright white immediately after a teleport
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
