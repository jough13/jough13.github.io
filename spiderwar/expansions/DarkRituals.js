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
            size: 10, hp: 20, damage: 100, attackSpeed: 45, 
            baseSpeedMin: 2.2, baseSpeedMax: 2.8, 
            range: 250, rangeSq: 62500, // Used by siege_attacker trait
            traits: ['siege_attacker'] 
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
                    
                    // JUICE: Heavy camera shake for the massive surge of power!
                    if (game.triggerShake) game.triggerShake(8);
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 80});
                    
                    const radius = 200;
                    const radiusSq = 40000; 
                    
                    // PERFORMANCE FIX: Spatial Grid Lookup for AoE Buffs!
                    const CELL_SIZE = 250;
                    const minCx = Math.max(0, ((data.x - radius) / CELL_SIZE) | 0);
                    const maxCx = Math.max(0, ((data.x + radius) / CELL_SIZE) | 0);
                    const minCy = Math.max(0, ((data.y - radius) / CELL_SIZE) | 0);
                    const maxCy = Math.max(0, ((data.y + radius) / CELL_SIZE) | 0);

                    for (let cx = minCx; cx <= maxCx; cx++) {
                        for (let cy = minCy; cy <= maxCy; cy++) {
                            const key = (cx << 16) | cy;
                            const cell = game.spatialGrid.get(key);
                            if (!cell) continue;

                            for (let i = 0; i < cell.length; i++) {
                                let e = cell[i];
                                
                                // Target friendly, living spiders
                                if (e.team === data.team && e.hp > 0 && (e instanceof Spider)) {
                                    
                                    // Fast AABB early exit
                                    if (Math.abs(e.x - data.x) > radius || Math.abs(e.y - data.y) > radius) continue;
                                    
                                    if (MathUtils.distSq(e.x, e.y, data.x, data.y) < radiusSq) {
                                        e.bloodlustTimer = 300; // 10 seconds of frenzy
                                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#ff0000', count: 10});
                                    }
                                }
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
                    
                    // ECS Trait Setup for Tick's Siege capabilities
                    if (s.hasTrait('siege_attacker')) {
                        s.range = UNIT_DATA['tick'].range;
                        s.rangeSq = UNIT_DATA['tick'].rangeSq;
                    }

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
            if (this.bloodlustTimer > 0) {
                this.bloodlustTimer--;
                this.baseSpeed *= 1.8; 
                this.damage += 15;     
                
                // Bloody particle trail
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
        
        // JUICE: The Bloodlust Aura!
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            // Draw a glowing, pulsating red ring under Frenzied units
            if (this.bloodlustTimer > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                const pulse = Math.sin(game.tick * 0.2) * 2;
                ctx.fillStyle = `rgba(255, 0, 0, 0.3)`;
                ctx.beginPath(); ctx.arc(0, 0, this.size + 4 + pulse, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.restore();
            }

            original.call(this, ctx); // Draw the spider normally on top of the aura
        });

        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            if (this.type === 'extractor' && !this.spriteLoaded && game.assets) {
                this.sprite = game.assets.get(this.team === 'black' ? 'assets/extractor_black.png' : 'assets/extractor_red.png');
                this.spriteLoaded = true;
            }

            original.call(this, ctx); 

            // Canvas Fallback
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
