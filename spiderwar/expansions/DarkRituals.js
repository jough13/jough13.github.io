// expansions/DarkRituals.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported config so other mods can tweak economy and spells!
export const RITUAL_CONFIG = {
    spellCost: 60,
    spellRadius: 200,
    spellRadiusSq: 40000, 
    bloodlustDuration: 300,   // 10 seconds of frenzy
    bloodlustSpeedMult: 1.8,
    bloodlustDamageBonus: 15,
    
    extractorTickRate: 90,    // Mines every 1.5 seconds
    extractorDewYield: 2
};

export const DarkRitualsExpansion = {
    init: (game) => {
        console.log("%c[DLC] Dark Rituals Expansion Loaded!", "color: #ff0000;");

        game.ritualConfig = RITUAL_CONFIG;

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
                if (game.eco[data.team].dew >= RITUAL_CONFIG.spellCost) {
                    game.eco[data.team].dew -= RITUAL_CONFIG.spellCost;
                    
                    // [JUICE] Heavy camera shake for the massive surge of power!
                    if (game.triggerShake) game.triggerShake(8);
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 80, type: 'magic'});
                    
                    const radius = RITUAL_CONFIG.spellRadius;
                    const radiusSq = RITUAL_CONFIG.spellRadiusSq; 
                    
                    // [PERFORMANCE] Spatial Grid Lookup for AoE Buffs!
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
                                        e.bloodlustTimer = RITUAL_CONFIG.bloodlustDuration; 
                                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#ff0000', count: 10, type: 'magic'});
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
                this.baseSpeed *= RITUAL_CONFIG.bloodlustSpeedMult; 
                this.damage += RITUAL_CONFIG.bloodlustDamageBonus;     
                
                // [JUICE] Bloody particle trail while enraged
                if (gameObj.tick % 5 === 0 && this.speed > 0) {
                    gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 1});
                }
            }

            original.call(this, gameObj); // Run normal AI (or TraitManager AI!)

            this.baseSpeed = originalSpeed;
            this.damage = originalDamage;
        });

        // 5. EXTRACTOR LOGIC
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'extractor' && !this.isConstructing && this.hp > 0) {
                
                // [JUICE] Manage pump animation decay
                if (this.pumpAnim > 0) this.pumpAnim--;

                if (gameObj.tick % RITUAL_CONFIG.extractorTickRate === 0) {
                    gameObj.eco[this.team].dew += RITUAL_CONFIG.extractorDewYield;
                    gameObj.bus.emit('particles', {x: this.x, y: this.y - 20, color: '#00aaff', count: 3, type: 'magic'});
                    
                    // [JUICE] Trigger the pump animation!
                    this.pumpAnim = 15; 
                }
            }
        });

        // 6. DRAWING INJECTIONS
        
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            const tick = gameObj ? gameObj.tick : 0;
            
            // [JUICE] Volatile pulsing animation for the explosive 'Tick' unit
            let restoreScale = false;
            if (this.role === 'tick') {
                const tickPulse = 1 + Math.sin(tick * 0.4 + this.animOffset) * 0.15;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.scale(tickPulse, tickPulse);
                ctx.translate(-this.x, -this.y);
                restoreScale = true;
            }

            // [JUICE] The Bloodlust Aura and Afterimages!
            if (this.bloodlustTimer > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                const pulse = Math.sin(tick * 0.3) * 2;
                
                // Red glowing ring
                ctx.fillStyle = `rgba(255, 0, 0, 0.3)`;
                ctx.beginPath(); ctx.arc(0, 0, this.size + 4 + pulse, 0, MathUtils.TWO_PI); ctx.fill();
                
                // Aggressive red tint over the sprite
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
                ctx.restore();
            }

            original.call(this, ctx, gameObj); // Draw the spider normally on top

            if (restoreScale) ctx.restore(); // Clean up Tick animation scale
        });

        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            if (this.type === 'extractor' && !this.spriteLoaded && gameObj.assets) {
                this.sprite = gameObj.assets.get(this.team === 'black' ? 'assets/extractor_black.png' : 'assets/extractor_red.png');
                this.spriteLoaded = true;
            }

            // [JUICE] The Kinetic Piston Animation!
            let restorePump = false;
            if (this.type === 'extractor' && this.pumpAnim > 0) {
                // Squash and stretch based on the pumpAnim timer
                const stretch = 1 + Math.sin(this.pumpAnim * 0.4) * 0.15;
                ctx.save();
                ctx.translate(this.x, this.y + (this.size / 2)); // Pin to the bottom
                ctx.scale(1 / stretch, stretch);
                ctx.translate(-this.x, -(this.y + (this.size / 2)));
                restorePump = true;
            }

            original.call(this, ctx, gameObj); 

            // Canvas Fallback
            if (this.type === 'extractor' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                
                // Base shadow
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
                ctx.fillStyle = '#333'; ctx.fillRect(-15, -10, 30, 20);
                
                // Glowing magic piston
                ctx.shadowColor = '#00aaff'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 0;
                ctx.fillStyle = '#00aaff'; 
                
                const tick = gameObj ? gameObj.tick : 0;
                const piston = Math.sin(tick * 0.1) * 10;
                ctx.fillRect(-5, -30 + piston, 10, 20);
                
                ctx.restore();
            }

            if (restorePump) ctx.restore();
        });
    }
};
