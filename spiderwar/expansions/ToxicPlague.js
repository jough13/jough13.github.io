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
        
        // PERFORMANCE FIX: Spatial Grid Lookup!
        // Puddles no longer loop through every unit on the map. They just check the tile they are sitting on.
        const CELL_SIZE = 250;
        const cx = Math.max(0, (this.x / CELL_SIZE) | 0);
        const cy = Math.max(0, (this.y / CELL_SIZE) | 0);

        for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx < 0) continue;
            for (let ny = cy - 1; ny <= cy + 1; ny++) {
                if (ny < 0) continue;
                
                const key = (nx << 16) | ny;
                const cell = game.spatialGrid.get(key);
                if (!cell) continue;

                for (let i = 0; i < cell.length; i++) {
                    let e = cell[i];
                    
                    // Fast early exits
                    if (!e.team || e.team === this.team || e.hp === undefined || e.hp <= 0) continue;
                    if (!(e instanceof Spider || e.constructor.name === 'CentipedeBoss')) continue;
                    
                    // Fast AABB check
                    if (Math.abs(this.x - e.x) > this.radius || Math.abs(this.y - e.y) > this.radius) continue;

                    // Circle Collision
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
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = Math.min(this.life / 30, 0.5); // Fades in/out smoothly
        
        ctx.fillStyle = this.team === 'black' ? '#55ff00' : '#ffff00'; // Green for black team, yellow for red
        ctx.beginPath();
        // Draw an organic blob shape
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, Math.sin(this.life * 0.05), 0, MathUtils.TWO_PI);
        ctx.fill();
        
        // Random bubbling
        if (Math.random() < 0.1) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(MathUtils.randomRange(-10, 10), MathUtils.randomRange(-10, 10), 3, 0, MathUtils.TWO_PI); ctx.fill();
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
            traits: ['parasite_ai'] 
        };

        STRUCTURE_DATA['incubator'] = { 
            hp: 300, size: 26, territory: 0 
        };

        // ==========================================
        // 3. ECS TRAIT REGISTRATION
        // ==========================================
        
        // Toxic Trail Trait
        game.registerTrait('toxic_trail', {
            update: (entity, gameObj) => {
                if (!entity.puddleTimer) entity.puddleTimer = 0;
                entity.puddleTimer++;
                
                if (entity.puddleTimer > 15) {
                    entity.puddleTimer = 0;
                    gameObj.addEntity(new ToxicPuddle(entity.x, entity.y, entity.team));
                }
                return false; 
            }
        });

        // Parasite AI Trait
        game.registerTrait('parasite_ai', {
            update: (entity, gameObj) => {
                let enemy = gameObj.getNearestEnemy(entity.x, entity.y, entity.team, 500); 
                
                if (enemy) {
                    entity.state = 1; // SPIDER_STATE.COMBAT
                    entity.angle = Math.atan2(enemy.y - entity.y, enemy.x - entity.x);
                    
                    if (MathUtils.distSq(entity.x, entity.y, enemy.x, enemy.y) > 400) { 
                        entity.x += Math.cos(entity.angle) * entity.baseSpeed; 
                        entity.y += Math.sin(entity.angle) * entity.baseSpeed;
                    } else {
                        entity.cooldown--;
                        if (entity.cooldown <= 0) {
                            enemy.hp -= entity.damage;
                            entity.cooldown = entity.attackSpeed;
                            entity.x -= Math.cos(entity.angle) * 5; entity.y -= Math.sin(entity.angle) * 5;
                            gameObj.bus.emit('playSound', 'harvest');
                        }
                    }
                } else {
                    if (Math.random() < 0.2) entity.angle += MathUtils.randomRange(-1, 1);
                    entity.x += Math.cos(entity.angle) * entity.baseSpeed;
                    entity.y += Math.sin(entity.angle) * entity.baseSpeed;
                }
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
                    
                    const radius = 150;
                    const radiusSq = 22500; 
                    
                    // PERFORMANCE FIX: Spatial Grid Lookup for AoE Spell!
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
                                
                                if (e.team && e.team !== data.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                                    if (Math.abs(e.x - data.x) > radius || Math.abs(e.y - data.y) > radius) continue;
                                    
                                    if (MathUtils.distSq(e.x, e.y, data.x, data.y) < radiusSq) {
                                        e.infectedTimer = 600; // Infected for 20 seconds
                                        e.infectedByTeam = data.team; // Track who cast it
                                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 10});
                                    }
                                }
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
                        s.isZombie = true; // Prevents Necromancy.js from dropping corpses for parasites
                    }
                    
                    s.imageLoaded = true; 
                    game.addEntity(s);
                    if (data.role === 'defiler') game.bus.emit('playSound', 'harvest'); 
                }
            }
        });

        // 5. GLOBAL DEBUFF MANAGER: INFECTION
        game.bus.on('preDraw', () => {
            if (game.tick % 30 !== 0) return; // Only process DoT damage once a second

            // PERFORMANCE FIX: Clean for-loop iteration
            for (let i = 0; i < game.entities.length; i++) {
                let e = game.entities[i];
                if (e.infectedTimer > 0) {
                    e.infectedTimer--;
                    
                    e.hp -= 3; // Acid DoT
                    game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 2});
                    
                    // CHESTBURSTER EFFECT: If it dies from infection!
                    if (e.hp <= 0 && e.role !== 'parasite') {
                        // JUICE: Vicious camera shake when the parasite bursts out!
                        if (game.triggerShake) game.triggerShake(5);
                        
                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#55ff00', count: 30});
                        game.bus.emit('playSound', 'death');
                        game.bus.emit('spawnSpider', {x: e.x, y: e.y, team: e.infectedByTeam, role: 'parasite'});
                    }
                }
            }
        });
    },

    patch: (game) => {
        // 6. STRUCTURE AI: THE INCUBATOR
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            original.call(this, gameObj);
            
            if (this.type === 'incubator' && !this.isConstructing && this.hp > 0) {
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
                ctx.beginPath(); ctx.arc(0, 0, this.size + 4, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.restore();
            }
            original.call(this, ctx);
        });
        
        // Structure fallback drawing
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            // Sprite Caching Link
            if (this.type === 'incubator' && !this.spriteLoaded && game.assets) {
                this.sprite = game.assets.get(`assets/${this.type}_${this.team}.png`);
                if (this.sprite) this.spriteLoaded = true;
            }

            original.call(this, ctx);

            if (this.type === 'incubator' && (!this.sprite || !this.sprite.complete || this.sprite.naturalHeight === 0)) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.fillStyle = '#112211'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.fillStyle = '#55ff00'; 
                const throb = Math.sin(game.tick * 0.1) * 3;
                ctx.beginPath(); ctx.arc(0, 0, 10 + throb, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.restore();
            }
        });
    }
};
