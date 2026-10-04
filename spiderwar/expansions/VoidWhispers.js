// expansions/VoidWhispers.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA } from '../game.js';

// ==========================================
// 1. THE VORTEX SPELL ENTITY (Black Hole)
// ==========================================
class VortexEntity {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team;
        this.life = 150; // Lasts 5 seconds
        this.radius = 300; 
        this.radiusSq = this.radius * this.radius;
        this.pullStrength = 3.5; // Very strong pull
    }

    update(game) {
        this.life--;
        
        // Drag ALL units (except Bosses) towards the center
        for (let i = 0; i < game.entities.length; i++) {
            let e = game.entities[i];
            // Only affect living spiders
            if (e.hp > 0 && e instanceof Spider && e.role !== 'queen') {
                
                // Fast AABB check
                if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) continue;

                const distSq = MathUtils.distSq(this.x, this.y, e.x, e.y);
                if (distSq < this.radiusSq && distSq > 100) { // Stop pulling if they are exactly in the center
                    const angle = Math.atan2(this.y - e.y, this.x - e.x);
                    
                    // The closer they get to the center, the harder it pulls (Event Horizon effect)
                    const intensity = 1 + (1 - (Math.sqrt(distSq) / this.radius));
                    
                    e.x += Math.cos(angle) * (this.pullStrength * intensity);
                    e.y += Math.sin(angle) * (this.pullStrength * intensity);
                    
                    // Disrupt their current movement
                    e.isSlowed = true;
                }
            }
        }

        // Suck in particles for visual flair
        if (game.tick % 2 === 0) {
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = MathUtils.randomRange(100, this.radius);
            const px = this.x + Math.cos(spawnAngle) * spawnDist;
            const py = this.y + Math.sin(spawnAngle) * spawnDist;
            // Send particles flying inwards
            game.bus.emit('particles', {x: px, y: py, color: '#aa00ff', count: 1});
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Swirling animation
        ctx.rotate(this.life * 0.2);
        
        // Fade in/out
        const alpha = Math.min(1, this.life / 30);
        ctx.globalAlpha = alpha;
        
        // Outer accretion disk
        let grad = ctx.createRadialGradient(0, 0, 10, 0, 0, this.radius);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.2, 'rgba(170, 0, 255, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
        
        // The Singularity (Pure black center)
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        
        ctx.restore();
    }
}

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const VoidWhispersExpansion = {
    init: (game) => {
        console.log("%c[DLC] Void Whispers Expansion Loaded!", "color: #9900ff;");

        // 1. REGISTER ASSETS
        game.assets.register('assets/voidweaver_black.png');
        game.assets.register('assets/voidweaver_red.png');
        game.assets.register('assets/maw_black.png');
        game.assets.register('assets/maw_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['voidweaver'] = { 
            size: 15, hp: 150, damage: 5, attackSpeed: 10, // Very low damage, attacks fast
            baseSpeedMin: 1.2, baseSpeedMax: 1.5, 
            traits: ['gravity_pull', 'ranged_attacker'] // Ranged AI with custom pull logic
        };

        STRUCTURE_DATA['maw'] = { 
            hp: 500, size: 35, territory: 0 
        };

        // Note: UI Buttons are handled centrally in UI.js!

        // ==========================================
        // 3. ECS TRAIT REGISTRATION
        // ==========================================
        game.registerTrait('gravity_pull', {
            update: (entity, gameObj) => {
                let enemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, entity.range || 250);
                
                if (enemy && !entity.isManual) {
                    entity.state = 1; // 1 = SPIDER_STATE.COMBAT
                    entity.angle = Math.atan2(enemy.y - entity.y, enemy.x - entity.x);
                    
                    const distSq = MathUtils.distSq(entity.x, entity.y, enemy.x, enemy.y);
                    const effectiveRangeSq = entity.rangeSq || 62500; // Default to 250px range
                    
                    // Instead of running away to kite, the unit stands its ground and drags the enemy in!
                    if (distSq <= effectiveRangeSq) {
                        if (!entity.cooldown) entity.cooldown = 0;
                        entity.cooldown--;
                        
                        if (entity.cooldown <= 0) {
                            // Minor damage
                            enemy.hp -= entity.damage;
                            
                            // THE PULL: Move the enemy directly towards the pulling unit!
                            enemy.x -= Math.cos(entity.angle) * 15;
                            enemy.y -= Math.sin(entity.angle) * 15;
                            enemy.isSlowed = true; // Disrupts their normal walking
                            
                            entity.cooldown = entity.attackSpeed;
                            
                            // Cosmic Tractor Beam visuals
                            gameObj.bus.emit('playSound', 'shoot');
                            gameObj.bus.emit('particles', {x: enemy.x, y: enemy.y, color: '#9900ff', count: 3});
                            
                            // Store line drawing data for 5 frames
                            entity.beamVisual = { x: enemy.x, y: enemy.y, timer: 5 };
                        }
                        return true; // RETURN TRUE: Halt movement while channeling gravity
                    }
                }
                
                return false; // RETURN FALSE: No enemies in pull range, let normal AI run
            }
        });

        // 4. SPELL LOGIC: VORTEX
        game.bus.on('castSpell', (data) => {
            if (data.type === 'vortex') {
                if (game.eco[data.team].dew >= 90) {
                    game.eco[data.team].dew -= 90;
                    game.bus.emit('playSound', 'death'); // Ominous rumble
                    game.addEntity(new VortexEntity(data.x, data.y, data.team));
                }
            }
        });

        // Spawn Voidweaver Logic
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'voidweaver') {
                if (game.eco[data.team].pumpkins >= 100 && game.eco[data.team].dew >= 30 && game.pop[data.team] < game.maxPop[data.team]) {
                    game.eco[data.team].pumpkins -= 100;
                    game.eco[data.team].dew -= 30;
                    
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    s.sprite = game.assets.get(data.team === 'black' ? 'assets/voidweaver_black.png' : 'assets/voidweaver_red.png');
                    s.imageLoaded = true; 
                    
                    // Give it decent range for its gravity beams
                    s.range = 250;
                    s.rangeSq = 62500;
                    
                    game.addEntity(s);
                    game.bus.emit('playSound', 'spell'); 
                }
            }
        });
    },

    patch: (game) => {
        // NOTE: Spider.update patch is entirely gone from this file!

        // 5. STRUCTURE AI: THE MAW
        const MAW_PULL_RADIUS = 200;
        const MAW_PULL_RADIUS_SQ = 40000;
        const MAW_BITE_RADIUS_SQ = 900; // 30px (Right in the center)

        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'maw' && !this.isConstructing && this.hp > 0) {
                if (!this.biteCooldown) this.biteCooldown = 0;
                if (this.biteCooldown > 0) this.biteCooldown--;

                // Constant gentle vacuum effect on nearby enemies
                for (let i = 0; i < gameObj.entities.length; i++) {
                    let e = gameObj.entities[i];
                    
                    // Only pull enemies (Units and Bosses)
                    if (e.team && e.team !== this.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                        if (Math.abs(this.x - e.x) > MAW_PULL_RADIUS || Math.abs(this.y - e.y) > MAW_PULL_RADIUS) continue;

                        const distSq = MathUtils.distSq(this.x, this.y, e.x, e.y);
                        
                        if (distSq < MAW_PULL_RADIUS_SQ) {
                            // Pull them in
                            const pullAngle = Math.atan2(this.y - e.y, this.x - e.x);
                            e.x += Math.cos(pullAngle) * 0.8;
                            e.y += Math.sin(pullAngle) * 0.8;
                            
                            // If they reach the center, CHOMP!
                            if (distSq < MAW_BITE_RADIUS_SQ && this.biteCooldown <= 0) {
                                e.hp -= 200; // Massive damage
                                this.biteCooldown = 90; // 3 seconds to chew
                                
                                gameObj.bus.emit('playSound', 'death');
                                gameObj.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 30});
                                
                                // Bosses are too big, they damage the maw when bitten
                                if (e.constructor.name === 'CentipedeBoss') {
                                    this.hp -= 50; 
                                }
                            }
                        }
                    }
                }
            }
        });

        // 6. DRAWING MODIFICATIONS
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            // Draw Voidweaver Tractor Beam
            if (this.hasTrait('gravity_pull') && this.beamVisual && this.beamVisual.timer > 0) {
                this.beamVisual.timer--;
                ctx.save();
                ctx.strokeStyle = `rgba(153, 0, 255, ${this.beamVisual.timer / 5})`; // Fade out
                ctx.lineWidth = 2 + Math.random() * 2; // Glitchy width
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.beamVisual.x, this.beamVisual.y);
                ctx.stroke();
                ctx.restore();
            }
            original.call(this, ctx);
        });
        
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            original.call(this, ctx);

            // Canvas fallback for The Maw
            if (this.type === 'maw' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                
                // Pulsing outer flesh ring
                const pulse = Math.sin(game.tick * 0.1) * 3;
                ctx.fillStyle = '#220022'; 
                ctx.beginPath(); ctx.arc(0, 0, this.size + pulse, 0, Math.PI*2); ctx.fill();
                
                // Teeth/Spikes pointing inwards
                ctx.fillStyle = '#dddddd';
                for(let i=0; i<8; i++) {
                    ctx.rotate(Math.PI / 4);
                    ctx.beginPath(); ctx.moveTo(this.size-5, -5); ctx.lineTo(this.size-5, 5); ctx.lineTo(10, 0); ctx.fill();
                }
                
                // Black hole center
                ctx.fillStyle = '#000000';
                ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill();
                
                ctx.restore();
            }
        });
    }
};
