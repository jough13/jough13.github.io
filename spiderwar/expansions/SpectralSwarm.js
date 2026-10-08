// expansions/SpectralSwarm.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported config so other mods can tweak stealth radii and spell durations!
export const SPECTRAL_CONFIG = {
    spellCost: 75,
    spellRadius: 150,
    spellRadiusSq: 22500,     // 150^2 pre-calculated
    stunDuration: 150,        // 5 seconds (at 30 updates/sec)
    
    lifestealAmount: 2,
    lifestealRadius: 100,
    lifestealRadiusSq: 10000,
    
    stealthRadius: 250,
    stealthRadiusSq: 62500
};

export const SpectralSwarmExpansion = {
    init: (game) => {
        console.log("%c[DLC] Spectral Swarm Expansion Loaded!", "color: #00ffff;");

        // [EXPANDABILITY] Hook config to the game engine
        game.spectralConfig = SPECTRAL_CONFIG;

        // 1. REGISTER ASSETS
        game.assets.register('assets/phantom_black.png');
        game.assets.register('assets/phantom_red.png');
        game.assets.register('assets/monolith_black.png');
        game.assets.register('assets/monolith_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['phantom'] = { 
            size: 14, hp: 80, damage: 15, attackSpeed: 30, 
            baseSpeedMin: 1.5, baseSpeedMax: 1.9, 
            traits: ['ethereal'] // Handled by TraitManager!
        };

        STRUCTURE_DATA['monolith'] = { 
            hp: 400, size: 28, territory: 0 
        };

        // ==========================================
        // 3. ECS TRAIT REGISTRATION
        // ==========================================
        game.registerTrait('ethereal', {
            update: (entity, gameObj) => {
                // Every 1 second, drain HP from all nearby enemies and heal self
                if (gameObj.tick % 30 === 0) {
                    let healed = false;
                    
                    // [PERFORMANCE] Spatial Grid Lookup for Life Drain
                    const CELL_SIZE = 250;
                    const maxGridX = Math.ceil(gameObj.world.width / CELL_SIZE);
                    const maxGridY = Math.ceil(gameObj.world.height / CELL_SIZE);
                    
                    const cx = MathUtils.clamp((entity.x / CELL_SIZE) | 0, 0, maxGridX);
                    const cy = MathUtils.clamp((entity.y / CELL_SIZE) | 0, 0, maxGridY);
                    
                    const radius = SPECTRAL_CONFIG.lifestealRadius;
                    const radiusSq = SPECTRAL_CONFIG.lifestealRadiusSq; 

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
                                    // Fast AABB check to skip circle math
                                    if (Math.abs(entity.x - e.x) > radius || Math.abs(entity.y - e.y) > radius) continue;
                                    
                                    if (MathUtils.distSq(entity.x, entity.y, e.x, e.y) < radiusSq) {
                                        e.hp -= SPECTRAL_CONFIG.lifestealAmount;
                                        
                                        // [FIX] Dynamically calculate absolute max HP based on current Tech Level!
                                        const techBoost = (gameObj.techLevel[entity.team] || 0) * 20;
                                        entity.hp = Math.min(entity.maxHp + techBoost, entity.hp + SPECTRAL_CONFIG.lifestealAmount);
                                        healed = true;
                                        
                                        // Visual soul-leech effect
                                        gameObj.bus.emit('particles', {x: e.x, y: e.y, color: '#00ffff', count: 1, type: 'magic'});
                                    }
                                }
                            }
                        }
                    }
                    if (healed) {
                        gameObj.bus.emit('particles', {x: entity.x, y: entity.y, color: '#00ff00', count: 3, type: 'magic'});
                    }
                }
                
                return false; // Return false because this is a passive ability (keep moving/attacking normally)
            }
        });

        // 4. SPELL LOGIC: PARALYZE
        game.bus.on('castSpell', (data) => {
            if (data.type === 'paralyze') {
                if (game.eco[data.team].dew >= SPECTRAL_CONFIG.spellCost) {
                    game.eco[data.team].dew -= SPECTRAL_CONFIG.spellCost;
                    
                    // [JUICE] The Deep Freeze!
                    if (game.triggerShake) game.triggerShake(8);
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#00ffff', count: 100});
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ffffff', count: 50, type: 'magic'});
                    
                    // Spawn a massive expanding ice ring
                    game.bus.emit('particles', {x: data.x, y: data.y, color: 'rgba(0, 255, 255, 0.6)', count: 1, type: 'ring'});
                    
                    const radius = SPECTRAL_CONFIG.spellRadius;
                    const radiusSq = SPECTRAL_CONFIG.spellRadiusSq; 
                    
                    // [PERFORMANCE] Spatial Grid Lookup for AoE Spell!
                    const CELL_SIZE = 250;
                    const maxGridX = Math.ceil(game.world.width / CELL_SIZE);
                    const maxGridY = Math.ceil(game.world.height / CELL_SIZE);
                    
                    const minCx = MathUtils.clamp(((data.x - radius) / CELL_SIZE) | 0, 0, maxGridX);
                    const maxCx = MathUtils.clamp(((data.x + radius) / CELL_SIZE) | 0, 0, maxGridX);
                    const minCy = MathUtils.clamp(((data.y - radius) / CELL_SIZE) | 0, 0, maxGridY);
                    const maxCy = MathUtils.clamp(((data.y + radius) / CELL_SIZE) | 0, 0, maxGridY);

                    for (let cx = minCx; cx <= maxCx; cx++) {
                        for (let cy = minCy; cy <= maxCy; cy++) {
                            const key = (cx << 16) | cy;
                            const cell = game.spatialGrid.get(key);
                            if (!cell) continue;

                            for (let i = 0; i < cell.length; i++) {
                                let e = cell[i];
                                // Target LIVING ENEMIES
                                if (e.team && e.team !== data.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                                    // Fast AABB check
                                    if (Math.abs(e.x - data.x) > radius || Math.abs(e.y - data.y) > radius) continue;
                                    
                                    if (MathUtils.distSq(e.x, e.y, data.x, data.y) < radiusSq) {
                                        e.stunTimer = SPECTRAL_CONFIG.stunDuration; 
                                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ffff', count: 5});
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Spawn Phantom Logic
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'phantom') {
                if (game.eco[data.team].pumpkins >= 60 && game.eco[data.team].dew >= 20 && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= 60;
                    game.eco[data.team].dew -= 20;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    s.sprite = game.assets.get(data.team === 'black' ? 'assets/phantom_black.png' : 'assets/phantom_red.png');
                    s.imageLoaded = true; 
                    
                    game.addEntity(s);
                    game.bus.emit('playSound', 'spell'); 
                }
            }
        });
    },

    patch: (game) => {
        
        // 5. GLOBAL DEBUFF MANAGER: PARALYSIS
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            // --- DEBUFF: STUNNED ---
            // Because ANY unit can be stunned, this stays as a patch to intercept the AI!
            if (this.stunTimer > 0) {
                this.stunTimer--;
                
                // [JUICE] Emit freeze particles while stunned
                if (gameObj.tick % 15 === 0) {
                    gameObj.bus.emit('particles', {x: this.x, y: this.y - 10, color: '#00ffff', count: 1, type: 'magic'});
                }
                
                // RETURN IMMEDIATELY! This completely bypasses all traits and AI, freezing them in place!
                return; 
            }

            original.call(this, gameObj); // Run normal AI if not stunned
        });

        // 6. STRUCTURE AI: THE MONOLITH STEALTH FIELD
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'monolith' && !this.isConstructing && this.hp > 0) {
                // Pulse every 5 frames to keep nearby allies cloaked
                if (gameObj.tick % 5 === 0) {
                    
                    // [PERFORMANCE] Spatial Grid Lookup for Cloaking!
                    const CELL_SIZE = 250;
                    const maxGridX = Math.ceil(gameObj.world.width / CELL_SIZE);
                    const maxGridY = Math.ceil(gameObj.world.height / CELL_SIZE);
                    
                    const cx = MathUtils.clamp((this.x / CELL_SIZE) | 0, 0, maxGridX);
                    const cy = MathUtils.clamp((this.y / CELL_SIZE) | 0, 0, maxGridY);
                    
                    const radius = SPECTRAL_CONFIG.stealthRadius;
                    const radiusSq = SPECTRAL_CONFIG.stealthRadiusSq;

                    for (let nx = cx - 1; nx <= cx + 1; nx++) {
                        if (nx < 0 || nx > maxGridX) continue;
                        for (let ny = cy - 1; ny <= cy + 1; ny++) {
                            if (ny < 0 || ny > maxGridY) continue;
                            
                            const key = (nx << 16) | ny;
                            const cell = gameObj.spatialGrid.get(key);
                            if (!cell) continue;

                            for (let i = 0; i < cell.length; i++) {
                                let e = cell[i];
                                // Only cloak friendly units (Spiders)
                                if (e.team === this.team && e.hp > 0 && e instanceof Spider) {
                                    // Fast AABB check
                                    if (Math.abs(this.x - e.x) > radius || Math.abs(this.y - e.y) > radius) continue;
                                    
                                    if (MathUtils.distSq(this.x, this.y, e.x, e.y) < radiusSq) {
                                        e.isCloaked = true;
                                        e.stealthAuraTimer = 10; // Gives them 10 frames of stealth
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // 7. DRAWING MODIFICATIONS
        // [FIX] Signature updated to accept (original, ctx, gameObj)
        game.expansions.patchClass(Spider, 'draw', function(original, ctx, gameObj) {
            
            // [JUICE] Shiver animation while stunned!
            let shiverX = 0;
            if (this.stunTimer > 0) {
                shiverX = (this.stunTimer % 4 < 2) ? 1 : -1;
                ctx.save();
                ctx.translate(shiverX, 0);
            }
            
            // Handle Monolith Stealth Transparency & Phantom passive transparency
            let oldAlpha = ctx.globalAlpha;
            let restoreAlpha = false;

            if (this.stealthAuraTimer > 0) {
                this.stealthAuraTimer--;
                ctx.globalAlpha = 0.35; // Ghostly transparent
                restoreAlpha = true;
                if (this.stealthAuraTimer <= 0) this.isCloaked = false; // Uncloak when leaving aura
            } else if (this.role === 'phantom' && ctx.globalAlpha === 1.0) {
                ctx.globalAlpha = 0.7; // Phantoms are naturally semi-transparent
                restoreAlpha = true;
            }

            // Draw the spider normally (respecting the shiver translation and alpha state)
            original.call(this, ctx, gameObj);
            
            if (restoreAlpha) ctx.globalAlpha = oldAlpha;

            // [JUICE] Draw an icy crystal block over stunned units
            if (this.stunTimer > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                
                // Jagged ice crystal shape
                ctx.beginPath();
                ctx.moveTo(0, -this.size - 4);
                ctx.lineTo(this.size + 2, -2);
                ctx.lineTo(this.size + 4, this.size + 2);
                ctx.lineTo(-2, this.size + 4);
                ctx.lineTo(-this.size - 4, 2);
                ctx.closePath();
                
                ctx.fill(); 
                ctx.stroke();
                
                ctx.restore();
                ctx.restore(); // Restore the shiver translation
            }
        });
        
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            // Sprite Caching Link
            if (this.type === 'monolith' && !this.spriteLoaded && gameObj.assets) {
                this.sprite = gameObj.assets.get(`assets/${this.type}_${this.team}.png`);
                if (this.sprite) this.spriteLoaded = true;
            }

            // [JUICE] Draw the ethereal Stealth Field Aura under the Monolith
            if (this.type === 'monolith' && !this.isConstructing && this.hp > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                const tick = gameObj ? gameObj.tick : 0;
                const pulse = Math.sin(tick * 0.05) * 0.1;
                
                // Create a smooth fading radial gradient
                let grad = ctx.createRadialGradient(0, 0, 0, 0, 0, SPECTRAL_CONFIG.stealthRadius);
                const rgb = this.team === 'black' ? '100, 0, 255' : '255, 0, 0';
                
                grad.addColorStop(0, `rgba(${rgb}, ${0.1 + pulse})`);
                grad.addColorStop(0.8, `rgba(${rgb}, ${0.05})`);
                grad.addColorStop(1, `rgba(${rgb}, 0)`);
                
                ctx.fillStyle = grad;
                ctx.beginPath(); 
                ctx.arc(0, 0, SPECTRAL_CONFIG.stealthRadius, 0, MathUtils.TWO_PI); 
                ctx.fill();
                ctx.restore();
            }

            // ALWAYS call original to guarantee base scaling and health bars draw properly!
            original.call(this, ctx, gameObj);

            // Chunk fallback for testing before you add art
            if (this.type === 'monolith' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                
                // Base
                ctx.fillStyle = '#222'; 
                ctx.beginPath(); ctx.moveTo(-15, 20); ctx.lineTo(15, 20); ctx.lineTo(5, -30); ctx.lineTo(-5, -30); ctx.fill();
                
                // Hovering, pulsing crystal
                const tick = gameObj ? gameObj.tick : 0;
                const floatY = Math.sin(tick * 0.1) * 3;
                
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#00ffff'; 
                ctx.beginPath(); ctx.arc(0, -15 + floatY, 4, 0, MathUtils.TWO_PI); ctx.fill();
                
                ctx.restore();
            }
        });
    }
};
