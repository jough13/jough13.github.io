// expansions/CursedRelics.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

export const CursedRelicsExpansion = {
    init: (game) => {
        console.log("%c[DLC] Cursed Relics Expansion Loaded!", "color: #9900ff;");

        // 1. REGISTER ASSETS
        game.assets.register('assets/wraith_black.png');
        game.assets.register('assets/wraith_red.png');
        game.assets.register('assets/obelisk_black.png');
        game.assets.register('assets/obelisk_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['wraith'] = { 
            size: 13, hp: 120, damage: 30, attackSpeed: 25, 
            baseSpeedMin: 1.6, baseSpeedMax: 2.0, 
            traits: ['blink_strike', 'melee'] // Assassin logic
        };

        STRUCTURE_DATA['obelisk'] = { 
            hp: 350, size: 20, territory: 0 
        };

        // 3. UI BUTTONS (Master Dict is handled in UI.js)
        game.uiActions['wraith'] = { icon: '🗡️', name: 'Wraith', cost: '80🎃30💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'wraith'}) };
        game.uiActions['obelisk'] = { icon: '⚡', name: 'Obelisk', cost: '150🎃80💧', type: 'tool', val: 'obelisk' };
        game.uiActions['eclipse'] = { icon: '🌑', name: 'Eclipse', cost: '150💧', type: 'tool', val: 'eclipse' };

        // 4. SPELL LOGIC: ECLIPSE (Time Manipulation)
        game.bus.on('castSpell', (data) => {
            if (data.type === 'eclipse') {
                if (game.eco[data.team].dew >= 150) {
                    game.eco[data.team].dew -= 150;
                    
                    game.bus.emit('playSound', 'death'); 
                    setTimeout(() => game.bus.emit('playSound', 'death'), 300); // Double-boom ominous sound
                    
                    // The DayNight cycle is 7200 ticks. Night starts at exactly 50% (0.50).
                    // We calculate how many ticks we need to jump the global clock forward!
                    const cycleTicks = 7200;
                    const targetRatio = 0.51; // Just past dusk, plunging into night
                    
                    let ticksToAdd = (targetRatio * cycleTicks) - (game.tick % cycleTicks);
                    if (ticksToAdd < 0) ticksToAdd += cycleTicks; // Wrap around if we are past it
                    
                    game.tick += Math.floor(ticksToAdd); // FAST FORWARD TIME!
                    
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#aa00ff', count: 200});
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
        
        // 5. UNIT AI: BLINK STRIKE
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            if (this.hasTrait('blink_strike')) {
                if (!this.blinkCooldown) this.blinkCooldown = 0;
                if (this.blinkCooldown > 0) this.blinkCooldown--;

                // Scan for an enemy within teleport range (150px)
                let enemy = gameObj.getNearestEnemy(this.x, this.y, this.team, 150);
                
                if (enemy && this.blinkCooldown <= 0) {
                    // Poof! (Start location)
                    gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#aa00ff', count: 10});
                    
                    // Teleport behind them
                    this.x = enemy.x + MathUtils.randomRange(-10, 10);
                    this.y = enemy.y + MathUtils.randomRange(-10, 10);
                    
                    // Poof! (End location)
                    gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#aa00ff', count: 10});
                    gameObj.bus.emit('playSound', 'spell');
                    
                    // Sneak attack damage multiplier!
                    enemy.hp -= (this.damage * 1.5) + ((gameObj.techLevel[this.team] || 0) * 10);
                    this.blinkCooldown = 150; // Takes 5 seconds to recharge teleport
                }
            }

            original.call(this, gameObj); // Run normal AI afterward
        });

        // 6. STRUCTURE AI: THE OBELISK (Tesla Coil)
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'obelisk' && !this.isConstructing && this.hp > 0) {
                if (!this.zapCooldown) this.zapCooldown = 0;
                if (this.zapCooldown > 0) this.zapCooldown--;

                if (this.zapCooldown <= 0) {
                    let enemy = gameObj.getNearestEnemy(this.x, this.y, this.team, 300);
                    if (enemy) {
                        // Instant ZAP damage
                        enemy.hp -= 75 + ((gameObj.techLevel[this.team]||0) * 10);
                        this.zapCooldown = 90; // 3 second reload
                        
                        gameObj.bus.emit('playSound', 'shoot');
                        gameObj.bus.emit('particles', {x: enemy.x, y: enemy.y, color: '#ffffff', count: 10});
                        
                        // Store the target coordinate briefly so the draw function can render the lightning bolt!
                        this.zapVisual = { x: enemy.x, y: enemy.y, timer: 8 }; 
                    }
                }
            }
        });

        // 7. DRAWING LOGIC: JAGGED LIGHTNING
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            original.call(this, ctx); // Draw base structure first
            
            // Draw Lightning Strike
            if (this.type === 'obelisk' && this.zapVisual && this.zapVisual.timer > 0) {
                this.zapVisual.timer--;
                
                ctx.save();
                ctx.strokeStyle = this.team === 'black' ? '#aa00ff' : '#ff0000';
                ctx.lineWidth = 3;
                ctx.shadowColor = '#ffffff';
                ctx.shadowBlur = 10;
                
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - this.size); // Shoot from top of obelisk
                
                // Add a randomized "kink" in the middle of the line so it looks like electricity
                let midX = (this.x + this.zapVisual.x) / 2 + MathUtils.randomRange(-25, 25);
                let midY = (this.y - this.size + this.zapVisual.y) / 2 + MathUtils.randomRange(-25, 25);
                
                ctx.lineTo(midX, midY);
                ctx.lineTo(this.zapVisual.x, this.zapVisual.y); // Connect to enemy
                ctx.stroke();
                
                ctx.restore();
            }

            // Canvas fallback if sprite isn't loaded yet
            if (this.type === 'obelisk' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.fillStyle = '#222'; ctx.beginPath(); ctx.moveTo(-10, 15); ctx.lineTo(10, 15); ctx.lineTo(0, -30); ctx.fill();
                ctx.fillStyle = '#aa00ff'; ctx.beginPath(); ctx.arc(0, -30, 6, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }
        });
    }
};
