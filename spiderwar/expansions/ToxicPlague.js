// expansions/ToxicPlague.js
import { Spider, Structure, MathUtils, UNIT_DATA, STRUCTURE_DATA, SPIDER_STATE } from '../game.js';

// ==========================================
// 1. TOXIC PUDDLE ENTITY (Area Denial)
// ==========================================
class ToxicPuddle {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team;
        this.life = 150; // Lasts 5 seconds
        this.radius = 25; 
        this.radiusSq = this.radius * this.radius;
    }

    update(game) {
        this.life--;
        
        // Damage and slow enemies walking through the puddle
        for (let i = 0; i < game.entities.length; i++) {
            let e = game.entities[i];
            if (e.team && e.team !== this.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                // Fast AABB check
                if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) continue;

                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < this.radiusSq) {
                    if (game.tick % 15 === 0) {
                        e.hp -= 2; // Acid DoT
                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 1});
                    }
                    e.isSlowed = true; // Melts their legs!
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = Math.min(this.life / 30, 0.5); // Fades in/out smoothly
        
        ctx.fillStyle = this.team === 'black' ? '#55ff00' : '#ffff00'; // Green for black team, yellow for red
        ctx.beginPath();
        // Draw an organic blob shape
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, Math.sin(this.life * 0.05), 0, Math.PI * 2);
        ctx.fill();
        
        // Random bubbling
        if (Math.random() < 0.1) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(MathUtils.randomRange(-10, 10), MathUtils.randomRange(-10, 10), 3, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.restore();
    }
}

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const ToxicPlagueExpansion = {
    init: (game) => {
        console.log("%c[DLC] Toxic Plague Expansion Loaded!", "color: #55ff00;");

        // 1. REGISTER ASSETS
        game.assets.register('assets/defiler_black.png');
        game.assets.register('assets/defiler_red.png');
        game.assets.register('assets/incubator_black.png');
        game.assets.register('assets/incubator_red.png');
        game.assets.register('assets/parasite_black.png');
        game.assets.register('assets/parasite_red.png');

        // 2. DATA CONFIGURATIONS
        UNIT_DATA['defiler'] = { 
            size: 18, hp: 250, damage: 15, attackSpeed: 30, 
            baseSpeedMin: 1.0, baseSpeedMax: 1.3, 
            traits: ['toxic_trail', 'melee'] 
        };

        UNIT_DATA['parasite'] = { 
            size: 8, hp: 15, damage: 8, attackSpeed: 15, 
            baseSpeedMin: 2.5, baseSpeedMax: 3.2, 
            traits: ['parasite_ai'] // Removed 'melee' because parasite_ai overrides everything!
        };

        STRUCTURE_DATA['incubator'] = { 
            hp: 300, size: 26, territory: 0 
        };

        // Note: UI Buttons are handled centrally in UI.js!

        // ==========================================
        // 3. ECS TRAIT REGISTRATION
        // ==========================================
        
        // Toxic Trail Trait
        game.registerTrait('toxic_trail', {
            update: (entity, gameObj) => {
                // Drop a puddle every 15 frames while moving
                if (!entity.puddleTimer) entity.puddleTimer = 0;
                entity.puddleTimer++;
                
                // We assume the spider is moving if the timer increments.
                // In a perfect world we'd check velocity, but this is a great, cheap approximation!
                if (entity.puddleTimer > 15) {
                    entity.puddleTimer = 0;
                    gameObj.addEntity(new ToxicPuddle(entity.x, entity.y, entity.team));
                }
                
                // RETURN FALSE: This is a passive trait. We want the spider to still run its 
                // normal 'melee' AI so it actually attacks things while dropping puddles!
                return false; 
            }
        });

        // Parasite AI Trait
        game.registerTrait('parasite_ai', {
            update: (entity, gameObj) => {
                // Parasites are hyper-aggressive and will wander randomly to seek out targets far away
                let enemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, 500); // Massive detection radius
                
                if (enemy) {
                    entity.state = SPIDER_STATE.COMBAT;
                    entity.angle = Math.atan2(enemy.y - entity.y, enemy.x - entity.x);
                    
                    if (MathUtils.distSq(entity.x, entity.y, enemy.x, enemy.y) > 400) { 
                        entity.x += Math.cos(entity.angle) * entity.baseSpeed; 
                        entity.y += Math.sin(entity.angle) * entity.baseSpeed;
                    } else {
                        // Attack!
                        entity.cooldown--;
                        if (entity.cooldown <= 0) {
                            enemy.hp -= entity.damage;
                            entity.cooldown = entity.attackSpeed;
                            entity.x -= Math.cos(entity.angle) * 5; entity.y -= Math.sin(entity.angle) * 5;
                            gameObj.bus.emit('playSound', 'harvest');
                        }
                    }
                } else {
                    // No enemies? Run around erratically looking for them
                    if (Math.random() < 0.2) entity.angle += MathUtils.randomRange(-1, 1);
                    entity.x += Math.cos(entity.angle) * entity.baseSpeed;
                    entity.y += Math.sin(entity.angle) * entity.baseSpeed;
                }

                // RETURN TRUE: The parasite handles its own movement and attacking. Do not run standard AI!
                return true; 
            }
        });

        // 4. SPELL LOGIC: CONTAGION
        game.bus.on('castSpell', (data) => {
            if (data.type === 'contagion') {
                if (game.eco[data.team].dew >= 80) {
                    game.eco[data.team].dew -= 80;
                    
                    game.bus.emit('playSound', 'spell'); 
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#55ff00', count: 100});
                    
                    const radiusSq = 22500; // 150px radius
                    
                    for (let i = 0; i < game.entities.length; i++) {
                        let e = game.entities[i];
                        if (e.team && e.team !== data.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                            if (MathUtils.distSq(e.x, e.y, data.x, data.y) < radiusSq) {
                                e.infectedTimer = 600; // Infected for 20 seconds
                                e.infectedByTeam = data.team; // Track who cast it
                                game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 10});
                            }
                        }
                    }
                }
            }
        });

        // Spawn Defiler/Parasite Logic
        game.bus.on('spawnSpider', (data) => {
            if (data.role === 'defiler' || data.role === 'parasite') {
                let canSpawn = true;
                
                // Only charge resources/pop for the Defiler. Parasites are FREE!
                if (data.role === 'defiler') {
                    if (game.eco[data.team].pumpkins >= 120 && game.eco[data.team].dew >= 40 && game.pop[data.team] < game.maxPop[data.team]) {
                        game.eco[data.team].pumpkins -= 120;
                        game.eco[data.team].dew -= 40;
                    } else {
                        canSpawn = false;
                    }
                }

                if (canSpawn) {
                    let s = new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role);
                    
                    if (data.role === 'defiler') s.sprite = game.assets.get(data.team === 'black' ? 'assets/defiler_black.png' : 'assets/defiler_red.png');
                    if (data.role === 'parasite') {
                        s.sprite = game.assets.get(data.team === 'black' ? 'assets/parasite_black.png' : 'assets/parasite_red.png');
                        s.isZombie = true; // Hack to ensure Necromancy.js doesn't spawn corpses for parasites
                    }
                    
                    s.imageLoaded = true; 
                    game.addEntity(s);
                    if (data.role === 'defiler') game.bus.emit('playSound', 'harvest'); 
                }
            }
        });

        // 5. GLOBAL DEBUFF MANAGER: INFECTION
        // We handle this via a bus listener on the main loop so it applies to ANY unit that gets infected!
        game.bus.on('preDraw', () => {
            if (game.tick % 30 !== 0) return; // Only process DoT damage once a second

            for (let i = 0; i < game.entities.length; i++) {
                let e = game.entities[i];
                if (e.infectedTimer > 0) {
                    e.infectedTimer--;
                    
                    e.hp -= 3; // Acid DoT
                    game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 2});
                    
                    // CHESTBURSTER EFFECT: If it dies from infection!
                    if (e.hp <= 0 && e.role !== 'parasite') {
                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 30});
                        game.bus.emit('playSound', 'death');
                        game.bus.emit('spawnSpider', {x: e.x, y: e.y, team: e.infectedByTeam, role: 'parasite'});
                    }
                }
            }
        });
    },

    patch: (game) => {
        // NOTE: The entire Spider.update patch is gone!

        // 6. STRUCTURE AI: THE INCUBATOR
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'incubator' && !this.isConstructing && this.hp > 0) {
                // Spawn a free Parasite every 5 seconds (150 ticks)
                if (gameObj.tick % 150 === 0) {
                    gameObj.bus.emit('particles', {x: this.x, y: this.y + 15, color: '#55ff00', count: 10});
                    gameObj.bus.emit('playSound', 'harvest'); 
                    gameObj.bus.emit('spawnSpider', {x: this.x, y: this.y + 20, team: this.team, role: 'parasite'});
                }
            }
        });

        // 7. DRAWING LOGIC: INFECTED AURA
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) {
            if (this.infectedTimer > 0) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.fillStyle = `rgba(85, 255, 0, 0.4)`;
                ctx.beginPath(); ctx.arc(0, 0, this.size + 4, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }
            original.call(this, ctx);
        });
        
        // Structure fallback drawing
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            original.call(this, ctx);

            if (this.type === 'incubator' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.fillStyle = '#112211'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#55ff00'; 
                const throb = Math.sin(game.tick * 0.1) * 3;
                ctx.beginPath(); ctx.arc(0, 0, 10 + throb, 0, Math.PI*2); ctx.fill();
                ctx.restore();
            }
        });
    }
};
