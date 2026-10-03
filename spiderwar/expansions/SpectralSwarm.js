// expansions/SpectralSwarm.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

export const SpectralSwarmExpansion = {
    init: (game) => {
        console.log("%c[DLC] Spectral Swarm Expansion Loaded!", "color: #00ffff;");

        // 1. REGISTER ASSETS
        game.assets.register('assets/phantom_black.png');
        game.assets.register('assets/phantom_red.png');
        game.assets.register('assets/monolith_black.png');
        game.assets.register('assets/monolith_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['phantom'] = { 
            size: 14, hp: 80, damage: 15, attackSpeed: 30, 
            baseSpeedMin: 1.5, baseSpeedMax: 1.9, 
            traits: ['ethereal'] // Custom trait for Life Drain
        };

        STRUCTURE_DATA['monolith'] = { 
            hp: 400, size: 28, territory: 0 
        };

        // 3. UI BUTTONS
        game.uiActions['phantom'] = { icon: '👻', name: 'Phantom', cost: '60🎃20💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'phantom'}) };
        game.uiActions['monolith'] = { icon: '🪦', name: 'Monolith', cost: '150🎃50💧', type: 'tool', val: 'monolith' };
        game.uiActions['paralyze'] = { icon: '❄️', name: 'Paralyze', cost: '75💧', type: 'tool', val: 'paralyze' };

        // 4. SPELL LOGIC: PARALYZE
        game.bus.on('castSpell', (data) => {
            if (data.type === 'paralyze') {
                if (game.eco[data.team].dew >= 75) {
                    game.eco[data.team].dew -= 75;
                    
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#00ffff', count: 100});
                    
                    const radiusSq = 22500; // 150px radius
                    
                    for (let i = 0; i < game.entities.length; i++) {
                        let e = game.entities[i];
                        // Target LIVING ENEMIES
                        if (e.team && e.team !== data.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                            if (MathUtils.distSq(e.x, e.y, data.x, data.y) < radiusSq) {
                                e.stunTimer = 150; // 5 seconds of stun (30 ticks * 5)
                                game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ffff', count: 5});
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
        
        // 5. UNIT AI: PARALYSIS & LIFE DRAIN
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            // --- DEBUFF: STUNNED ---
            if (this.stunTimer > 0) {
                this.stunTimer--;
                // Emit freeze particles while stunned
                if (gameObj.tick % 10 === 0) gameObj.bus.emit('particles', {x: this.x, y: this.y - 10, color: '#00ffff', count: 1});
                
                // Return immediately! This completely bypasses their AI, freezing them in place!
                return; 
            }

            // --- TRAIT: ETHEREAL (Life Drain) ---
            if (this.hasTrait('ethereal') && gameObj.tick % 30 === 0) {
                // Every 1 second, drain 2 HP from all nearby enemies and heal self
                let healed = false;
                for (let i = 0; i < gameObj.entities.length; i++) {
                    let e = gameObj.entities[i];
                    if (e.team && e.team !== this.team && e.hp > 0) {
                        if (MathUtils.distSq(this.x, this.y, e.x, e.y) < 10000) { // 100px range
                            e.hp -= 2;
                            this.hp = Math.min(this.maxHp, this.hp + 2);
                            healed = true;
                            // Visual soul-leech effect
                            gameObj.bus.emit('particles', {x: e.x, y: e.y, color: '#00ffff', count: 1});
                        }
                    }
                }
                if (healed) gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#00ff00', count: 2});
            }

            original.call(this, gameObj); // Run normal AI
        });

        // 6. STRUCTURE AI: THE MONOLITH STEALTH FIELD
        const STEALTH_RADIUS = 250;
        const STEALTH_RADIUS_SQ = STEALTH_RADIUS * STEALTH_RADIUS;

        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'monolith' && !this.isConstructing && this.hp > 0) {
                // Pulse every 5 frames to keep nearby allies cloaked
                if (gameObj.tick % 5 === 0) {
                    for (let i = 0; i < gameObj.entities.length; i++) {
                        let e = gameObj.entities[i];
                        // Only cloak friendly units (Spiders)
                        if (e.team === this.team && e.hp > 0 && e instanceof Spider) {
                            if (MathUtils.distSq(this.x, this.y, e.x, e.y) < STEALTH_RADIUS_SQ) {
                                e.isCloaked = true;
                                e.stealthAuraTimer = 10; // Gives them 10 frames of stealth
                            }
                        }
                    }
                }
            }
        });

        // 7. DRAWING MODIFICATIONS
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            
            // Handle Monolith Stealth Transparency
            if (this.stealthAuraTimer > 0) {
                this.stealthAuraTimer--;
                ctx.globalAlpha = 0.35; // Ghostly transparent
                if (this.stealthAuraTimer <= 0) this.isCloaked = false; // Uncloak when leaving aura
            }
            
            // Phantoms are naturally semi-transparent
            if (this.role === 'phantom' && ctx.globalAlpha === 1.0) ctx.globalAlpha = 0.7;

            original.call(this, ctx);
            
            // Draw an icy/webbed cage over stunned units
            if (this.stunTimer > 0) {
                ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x - this.size, this.y - this.size); ctx.lineTo(this.x + this.size, this.y + this.size);
                ctx.moveTo(this.x + this.size, this.y - this.size); ctx.lineTo(this.x - this.size, this.y + this.size);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0; // Reset
        });
        
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            // Draw the Stealth Field Aura under the Monolith
            if (this.type === 'monolith' && !this.isConstructing && this.hp > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                const pulse = Math.sin(game.tick * 0.05) * 0.1;
                ctx.fillStyle = this.team === 'black' ? `rgba(100, 0, 255, ${0.1 + pulse})` : `rgba(255, 0, 0, ${0.1 + pulse})`;
                ctx.beginPath(); ctx.arc(0, 0, STEALTH_RADIUS, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }

            original.call(this, ctx);

            // Chunk fallback for testing before you add art
            if (this.type === 'monolith' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.fillStyle = '#222'; ctx.beginPath(); ctx.moveTo(-15, 20); ctx.lineTo(15, 20); ctx.lineTo(5, -30); ctx.lineTo(-5, -30); ctx.fill();
                ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }
        });
    }
};
