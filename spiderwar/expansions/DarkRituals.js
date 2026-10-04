// expansions/DarkRituals.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

export const DarkRitualsExpansion = {
    init: (game) => {
        console.log("%c[DLC] Dark Rituals Expansion Loaded!", "color: #ff0000;");

        // 1. REGISTER ASSETS
        game.assets.register('assets/tick_black.png');
        game.assets.register('assets/tick_red.png');
        game.assets.register('assets/extractor_black.png');
        game.assets.register('assets/extractor_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['tick'] = { 
            size: 10, hp: 20, damage: 100, attackSpeed: 1, 
            baseSpeedMin: 2.2, baseSpeedMax: 2.8, 
            traits: ['kamikaze'] // The TraitManager automatically handles this now!
        };

        STRUCTURE_DATA['extractor'] = { 
            hp: 250, size: 22, territory: 0 
        };

        // Note: UI Buttons are handled centrally in UI.js!

        // 3. SPELL LOGIC: BLOODLUST
        game.bus.on('castSpell', (data) => {
            if (data.type === 'bloodlust') {
                if (game.eco[data.team].dew >= 60) {
                    game.eco[data.team].dew -= 60;
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 80});
                    
                    for (let i = 0; i < game.entities.length; i++) {
                        let e = game.entities[i];
                        if (e.team === data.team && e.hp > 0 && (e instanceof Spider)) {
                            if (MathUtils.distSq(e.x, e.y, data.x, data.y) < 40000) {
                                e.bloodlustTimer = 300; 
                                game.bus.emit('particles', {x: e.x, y: e.y, color: '#ff0000', count: 5});
                            }
                        }
                    }
                }
            }
        });

        // Spawn Tick Logic
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'tick') {
                if (game.eco[data.team].pumpkins >= 30 && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= 30;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    s.sprite = game.assets.get(data.team === 'black' ? 'assets/tick_black.png' : 'assets/tick_red.png');
                    s.imageLoaded = true; 
                    
                    game.addEntity(s);
                    game.bus.emit('playSound', 'harvest'); 
                }
            }
        });
    },

    patch: (game) => {
        
        // 4. UNIT AI & BUFFS
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            let originalSpeed = this.baseSpeed;
            let originalDamage = this.damage;
            
            // --- BUFF: BLOODLUST ---
            // Much cleaner now! Only handles the temporary stat boost.
            if (this.bloodlustTimer > 0) {
                this.bloodlustTimer--;
                this.baseSpeed *= 1.8; 
                this.damage += 15;     
                if (gameObj.tick % 5 === 0) gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 1});
            }

            original.call(this, gameObj); // Run normal AI (or TraitManager AI!)

            this.baseSpeed = originalSpeed;
            this.damage = originalDamage;
        });

        // 5. EXTRACTOR LOGIC
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'extractor' && !this.isConstructing && this.hp > 0) {
                if (gameObj.tick % 90 === 0) {
                    gameObj.eco[this.team].dew += 2;
                    gameObj.bus.emit('particles', {x: this.x, y: this.y - 20, color: '#00aaff', count: 3});
                }
            }
        });

        // 6. DRAWING INJECTIONS
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            if (this.type === 'extractor' && !this.spriteLoaded && game.assets) {
                this.sprite = game.assets.get(this.team === 'black' ? 'assets/extractor_black.png' : 'assets/extractor_red.png');
                this.spriteLoaded = true;
            }

            original.call(this, ctx); 

            if (this.type === 'extractor' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.fillStyle = '#333'; ctx.fillRect(-15, -10, 30, 20);
                ctx.fillStyle = '#00aaff'; 
                const piston = Math.sin(game.tick * 0.1) * 10;
                ctx.fillRect(-5, -30 + piston, 10, 20);
                ctx.restore();
            }
        });
    }
};
