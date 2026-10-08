// expansions/Necromancy.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported config so other mods can tweak zombie decay, speed, and costs
export const NECRO_CONFIG = {
    spellCost: 40,
    spellRadius: 200,             
    spellRadiusSq: 40000,         // 200^2 pre-calculated for fast circle checks
    
    corpseLife: 1800,             // Stays on battlefield for 60 seconds (at 30fps baseline, 30s at 60fps)
    
    // Base stats for a standard Size-16 Zombie (Scales dynamically!)
    zombieHp: 80,
    zombieDamage: 25,
    zombieSpeed: 1.6,             // Fast zombies
    zombieDecayRate: 0.15         // Loses ~4.5 HP per second
};

// ==========================================
// 2. THE CORPSE ENTITY
// ==========================================
export class Corpse {
    constructor(x, y, size) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.x = x; 
        this.y = y;
        this.size = size || 12;
        
        // [PERFORMANCE FIX] Assigning a team ensures game.js adds this to the O(1) Spatial Grid!
        this.team = 'dead'; 
        
        // Give the corpse actual destructible HP based on its size so explosions can gib it!
        this.hp = 100 * (this.size / 16); 
        this.life = NECRO_CONFIG.corpseLife; 
        
        // Random rotation so the battlefield looks like an organic mess of casualties
        this.angle = Math.random() * MathUtils.TWO_PI;
        
        // Sprite will be pulled instantly from RAM cache on Tick 1 of its life
        this.sprite = null;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.sprite) {
            this.sprite = game.assets.get('assets/corpse.png');
        }

        this.life--;
        
        // [JUICE] Emit subtle rotting miasma particles over time
        if (game.tick % 60 === 0 && Math.random() > 0.5) {
            game.bus.emit('particles', {x: this.x, y: this.y, color: 'rgba(0, 255, 0, 0.4)', count: 1, type: 'magic'});
        }

        // The base engine culls entities if hp <= 0 OR life <= 0.
        // We let the engine handle the cleanup automatically!
    }

    draw(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Fade out into the dirt during the last portion of decay
        ctx.globalAlpha = Math.min(1, this.life / 300); 
        
        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            // ASPECT RATIO FIX: Calculate dynamic width based on actual image proportions
            const aspect = this.sprite.naturalWidth / this.sprite.naturalHeight;
            const drawH = this.size * 2;
            const drawW = drawH * aspect;
            
            // [JUICE] Drop shadow to anchor the corpse to the dirt
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;
            
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.shadowBlur = 0; // Reset
        } else {
            // Fallback drawing: A creepy wrapped web cocoon scaling with size
            ctx.fillStyle = '#dddddd';
            ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size * 0.66, Math.PI/4, 0, MathUtils.TWO_PI); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
            
            const w = this.size * 0.8;
            const h = this.size * 0.4;
            ctx.beginPath(); ctx.moveTo(-w, -h); ctx.lineTo(w, h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-w + 2, h); ctx.lineTo(w - 2, -h); ctx.stroke();
        }
        ctx.restore();
    }
}

// ==========================================
// 3. THE ZOMBIE SPIDER UNIT
// ==========================================
export class ZombieSpider extends Spider {
    constructor(x, y, team, size) {
        super(x, y, team, 'soldier'); // Inherit aggressive soldier AI
        
        this.isZombie = true; // Flags it so it doesn't drop another corpse when it dies!
        
        // POLISH FIX: Dynamic Scaling based on the corpse it came from!
        const scale = (size || 16) / 16;
        this.size = size || 16;
        
        // Apply Necro Config Stats (Multiplied by scale!)
        this.hp = NECRO_CONFIG.zombieHp * scale; 
        this.maxHp = this.hp;
        this.damage = NECRO_CONFIG.zombieDamage * scale; 
        this.baseSpeed = NECRO_CONFIG.zombieSpeed; 
        this.speed = this.baseSpeed;

        this.ramSpriteLoaded = false;
        
        // [JUICE] Pop-in scale animation
        this.spawnScale = 0.1;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        // Overrides the default Spider() constructor image safely
        if (!this.ramSpriteLoaded && game.assets) {
            this.sprite = game.assets.get(this.team === 'black' ? 'assets/zombie_black.png' : 'assets/zombie_red.png');
            this.imageLoaded = true; // Tell base class it's ready to draw
            this.ramSpriteLoaded = true;
        }

        // [JUICE] Scale up rapidly on spawn to simulate clawing out of the dirt
        if (this.spawnScale < 1.0) {
            this.spawnScale = Math.min(1.0, this.spawnScale + 0.15);
        }

        // Necrotic Rot: Zombies constantly take damage until they fall apart
        // A massive zombie will inherently live longer because it has more max HP!
        this.hp -= NECRO_CONFIG.zombieDecayRate; 
        super.update(game);
    }

    // [FIX] Pass game object down to super.draw to preserve the new breathing animations!
    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Apply pop-in spawn scale
        ctx.scale(this.spawnScale, this.spawnScale);
        
        // 1. Draw glowing aura FIRST so it renders underneath the zombie body
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.beginPath(); ctx.arc(0, 0, this.size + 4, 0, MathUtils.TWO_PI); ctx.fill();
        ctx.shadowBlur = 0; // Reset
        
        ctx.translate(-this.x, -this.y); // Undo translation so super.draw handles it
        
        // 2. Draw the actual zombie sprite and health bar
        super.draw(ctx, game);
        
        ctx.restore();
    }
}

// ==========================================
// 4. THE REANIMATE SPELL VISUAL
// ==========================================
class ReanimateAOE {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.maxRadius = NECRO_CONFIG.spellRadius; 
        this.life = 30; // 0.5 second animation at 60fps
        this.maxLife = 30;
    }
    update() { 
        this.life--; 
    }
    draw(ctx) {
        // Expanding shockwave effect
        const progress = 1 - (this.life / this.maxLife);
        // MATH FIX: Math.sqrt is vastly faster than Math.pow(x, 0.5)
        const currentRadius = this.maxRadius * Math.sqrt(progress); 

        ctx.globalAlpha = this.life / this.maxLife; // Fade out as it expands
        
        // [JUICE] Added a dark magic underglow
        ctx.fillStyle = 'rgba(0, 50, 0, 0.5)';
        ctx.beginPath(); ctx.arc(this.x, this.y, currentRadius, 0, MathUtils.TWO_PI); ctx.fill();
        
        ctx.strokeStyle = '#00ff00'; 
        ctx.lineWidth = 4; 
        ctx.stroke();
        
        ctx.globalAlpha = 1.0;
    }
}

// ==========================================
// 5. EXPANSION LOGIC
// ==========================================
export const NecromancyExpansion = {
    init: (game) => {
        // [EXPANDABILITY] Hook config to the game engine
        game.necroConfig = NECRO_CONFIG;

        // --- ASSET REGISTRY ---
        game.assets.register('assets/corpse.png');
        game.assets.register('assets/zombie_black.png');
        game.assets.register('assets/zombie_red.png');

        // Handle UI spell cast
        game.bus.on('castSpell', (data) => {
            if (data.type === 'reanimate') {
                
                if (game.eco[data.team].dew >= NECRO_CONFIG.spellCost) {
                    game.eco[data.team].dew -= NECRO_CONFIG.spellCost;
                    
                    // Spawn the visual shockwave
                    game.addEntity(new ReanimateAOE(data.x, data.y));
                    
                    // JUICE: Heavy camera shake for the massive exertion of dark magic!
                    if (game.triggerShake) game.triggerShake(6);
                    game.bus.emit('playSound', 'spell');
                    
                    let raisedCount = 0;
                    const radius = NECRO_CONFIG.spellRadius;
                    const radiusSq = NECRO_CONFIG.spellRadiusSq;
                    
                    // [PERFORMANCE FIX] Use O(1) Spatial Grid instead of checking all entities
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
                                
                                if (e instanceof Corpse) {
                                    // Fast AABB check to skip circle math for distant corpses
                                    if (Math.abs(data.x - e.x) > radius || Math.abs(data.y - e.y) > radius) continue;

                                    if (MathUtils.distSq(e.x, e.y, data.x, data.y) <= radiusSq) {
                                        e.life = 0; // Destroy corpse cleanly
                                        
                                        // Summon Zombie (Passing the corpse's size!)
                                        game.addEntity(new ZombieSpider(e.x, e.y, data.team, e.size));
                                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 15, type: 'magic'});
                                        game.bus.emit('particles', {x: e.x, y: e.y, color: '#3d2817', count: 10}); // Dirt clods
                                        
                                        // JUICE: The wet snapping sound of bones reconstructing
                                        game.bus.emit('playSound', 'harvest'); 
                                        
                                        raisedCount++;
                                    }
                                }
                            }
                        }
                    }

                    // Visual feedback even if the player whiffed the spell
                    if (raisedCount === 0) {
                        game.bus.emit('particles', {x: data.x, y: data.y, color: '#00ff00', count: 20, type: 'magic'});
                    }
                }
            }
        });
    },

    patch: (game) => {
        // Intercept the main game loop to drop corpses right BEFORE a spider is culled
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            
            // PERFORMANCE FIX: Native for-loop is vastly faster than .forEach for the main update tick
            for (let i = 0; i < this.entities.length; i++) {
                let e = this.entities[i];
                
                // If a spider dies, and it wasn't already a zombie, drop a corpse!
                // LOGIC FIX: Exclude 'broodling' suicide units to prevent infinite zombie cheese and map clutter
                if (e.hp <= 0 && e instanceof Spider && !e.isZombie && !e.corpseSpawned && e.role !== 'broodling') {
                    e.corpseSpawned = true; // Safety flag to prevent double-spawns
                    this.addEntity(new Corpse(e.x, e.y, e.size));
                }
            }
            
            original.call(this); // Continue normal engine update to actually cull the dead entities
        });
    }
};
