// expansions/DarkRituals.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA, SPIDER_STATE } from '../game.js';

export const DarkRitualsExpansion = {
    init: (game) => {
        console.log("%c[DLC] Dark Rituals Expansion Loaded!", "color: #ff0000;");

        // 1. ADD NEW DATA CONFIGURATIONS
        UNIT_DATA['tick'] = { 
            size: 10, hp: 20, damage: 100, attackSpeed: 1, 
            baseSpeedMin: 2.2, baseSpeedMax: 2.8, // Very fast!
            traits: ['kamikaze'] 
        };

        STRUCTURE_DATA['extractor'] = { 
            hp: 250, size: 22, territory: 0 
        };

        // 2. REGISTER UI ACTIONS
        game.uiActions['tick'] = { icon: '💣', name: 'Tick', cost: '30🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'tick'}) };
        game.uiActions['extractor'] = { icon: '🛢️', name: 'Extract', cost: '100🎃', type: 'tool', val: 'extractor' };
        game.uiActions['bloodlust'] = { icon: '🩸', name: 'Frenzy', cost: '60💧', type: 'tool', val: 'bloodlust' };

        // 3. SPELL LOGIC: BLOODLUST
        game.bus.on('castSpell', (data) => {
            if (data.type === 'bloodlust') {
                if (game.eco[data.team].dew >= 60) {
                    game.eco[data.team].dew -= 60;
                    
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 80});
                    
                    const radiusSq = 40000; // 200px radius
                    
                    // Buff all friendly units in the radius
                    for (let i = 0; i < game.entities.length; i++) {
                        let e = game.entities[i];
                        if (e.team === data.team && e.hp > 0 && (e instanceof Spider)) {
                            if (MathUtils.distSq(e.x, e.y, data.x, data.y) < radiusSq) {
                                e.bloodlustTimer = 300; // 10 seconds of frenzy
                                game.bus.emit('particles', {x: e.x, y: e.y, color: '#ff0000', count: 5});
                            }
                        }
                    }
                }
            }
        });
    },

    patch: (game) => {
        
        // 4. UNIT AI LOGIC: THE TICK & BLOODLUST BUFF
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            // --- TRAIT: KAMIKAZE ---
            if (this.hasTrait('kamikaze')) {
                let enemy = gameObj.getNearestEnemy(this.x, this.y, this.team, 200);
                if (enemy) {
                    this.state = SPIDER_STATE.COMBAT;
                    this.angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    
                    // If close enough, EXPLODE!
                    if (MathUtils.distSq(this.x, this.y, enemy.x, enemy.y) < 900) { // 30px
                        this.hp = 0; // Kill self
                        gameObj.bus.emit('playSound', 'death');
                        gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ffaa00', count: 40});
                        
                        // Splash damage
                        for (let i = 0; i < gameObj.entities.length; i++) {
                            let e = gameObj.entities[i];
                            if (e.team && e.team !== this.team && e.hp > 0 && MathUtils.distSq(this.x, this.y, e.x, e.y) < 10000) {
                                e.hp -= this.damage; 
                            }
                        }
                    } else {
                        // Sprint at enemy
                        this.x += Math.cos(this.angle) * this.baseSpeed; 
                        this.y += Math.sin(this.angle) * this.baseSpeed;
                    }
                    return; // Skip standard AI
                }
            }

            // --- BUFF: BLOODLUST ---
            let originalSpeed = this.baseSpeed;
            let originalDamage = this.damage;
            
            if (this.bloodlustTimer > 0) {
                this.bloodlustTimer--;
                this.baseSpeed *= 1.8; // +80% Speed
                this.damage += 15;     // +15 Flat Damage
                
                // Trail effect
                if (gameObj.tick % 5 === 0) gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 1});
            }

            original.call(this, gameObj); // Run normal AI with buffed stats!

            // Safely restore stats
            this.baseSpeed = originalSpeed;
            this.damage = originalDamage;
        });

        // 5. STRUCTURE AI LOGIC: THE EXTRACTOR
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'extractor' && !this.isConstructing && this.hp > 0) {
                // Generate 2 Dew every 3 seconds (90 ticks)
                if (gameObj.tick % 90 === 0) {
                    gameObj.eco[this.team].dew += 2;
                    gameObj.bus.emit('particles', {x: this.x, y: this.y - 20, color: '#00aaff', count: 3});
                }
            }
        });

        // 6. CUSTOM FALLBACK DRAWING (No images required to test!)
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            original.call(this, ctx);
            // Draw a bomb fuse on the Tick
            if (this.role === 'tick') {
                ctx.fillStyle = '#ff5500';
                ctx.beginPath(); ctx.arc(this.x, this.y - 8, 4, 0, Math.PI*2); ctx.fill();
            }
        });
        
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            original.call(this, ctx);
            if (this.type === 'extractor' && !this.spriteLoaded) {
                // Draw a chunky oil drill fallback
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.fillStyle = '#333'; ctx.fillRect(-15, -10, 30, 20);
                ctx.fillStyle = '#00aaff'; 
                // Drill piston animating up and down
                const piston = Math.sin(game.tick * 0.1) * 10;
                ctx.fillRect(-5, -30 + piston, 10, 20);
                ctx.restore();
            }
        });
    }
};
