// expansions/Necromancy.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const NECRO_CONFIG = {
    spellCost: 40,
    spellRadius: 200,
    spellRadiusSq: 40000, // 200^2 for fast math
    
    corpseLife: 1800,     // Stays on battlefield for 60 seconds
    
    zombieHp: 80,
    zombieDamage: 25,
    zombieSpeed: 1.6,     // 28-Days-Later style fast zombies
    zombieDecayRate: 0.15 // Loses 4.5 HP per second
};

// ==========================================
// 2. THE CORPSE ENTITY
// ==========================================
export class Corpse {
    constructor(x, y) {
        this.x = x; 
        this.y = y;
        this.size = 12;
        this.hp = 100; // Fake HP so the engine doesn't auto-cull it until the timer finishes
        this.life = NECRO_CONFIG.corpseLife; 
        
        // Random rotation so the battlefield looks like an organic mess of casualties
        this.angle = Math.random() * Math.PI * 2;
        
        this.spriteLoaded = false;
        this.sprite = new Image(); 
        this.sprite.onload = () => { this.spriteLoaded = true; };
        this.sprite.src = 'assets/corpse.png';
    }

    update(game) {
        this.life--;
        if (this.life <= 0) this.hp = 0; // Natural decay triggers engine cleanup
    }

    draw(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Fade out into the dirt during the last 10 seconds of decay
        ctx.globalAlpha = Math.min(1, this.life / 300); 
        
        if (this.spriteLoaded) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            // Fallback drawing: A creepy wrapped web cocoon
            ctx.fillStyle = '#dddddd';
            ctx.beginPath(); ctx.ellipse(0, 0, 12, 8, Math.PI/4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(10, 5); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-8, 5); ctx.lineTo(8, -5); ctx.stroke();
        }
        ctx.restore();
    }
}

// ==========================================
// 3. THE ZOMBIE SPIDER UNIT
// ==========================================
export class ZombieSpider extends Spider {
    constructor(x, y, team) {
        super(x, y, team, 'soldier'); // Inherit aggressive soldier AI
        
        this.isZombie = true; // Flags it so it doesn't drop another corpse when it dies!
        
        // Apply Necro Config Stats
        this.hp = NECRO_CONFIG.zombieHp; 
        this.maxHp = NECRO_CONFIG.zombieHp;
        this.damage = NECRO_CONFIG.zombieDamage; 
        this.baseSpeed = NECRO_CONFIG.zombieSpeed; 
        this.speed = this.baseSpeed;

        this.sprite.src = team === 'black' ? 'assets/zombie_black.png' : 'assets/zombie_red.png';
    }

    update(game) {
        // Necrotic Rot: Zombies constantly take damage until they fall apart
        this.hp -= NECRO_CONFIG.zombieDecayRate; 
        super.update(game);
    }

    draw(ctx) {
        // 1. Draw glowing aura FIRST so it renders underneath the zombie body
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
        ctx.beginPath(); ctx.arc(0, 0, this.size + 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // 2. Draw the actual zombie sprite and health bar
        super.draw(ctx);
    }
}

// ==========================================
// 4. THE REANIMATE SPELL VISUAL
// ==========================================
class ReanimateAOE {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.maxRadius = NECRO_CONFIG.spellRadius; 
        this.life = 30; // 1 second animation
        this.maxLife = 30;
    }
    update() { 
        this.life--; 
        if (this.life <= 0) this.hp = 0; // Triggers engine cleanup
    }
    draw(ctx) {
        // Expanding shockwave effect
        const progress = 1 - (this.life / this.maxLife);
        const currentRadius = this.maxRadius * Math.pow(progress, 0.5); // Fast start, slow end expansion

        ctx.globalAlpha = this.life / this.maxLife; // Fade out as it expands
        
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.beginPath(); ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2); ctx.fill();
        
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
        // Handle UI spell cast
        game.bus.on('castSpell', (data) => {
            if (data.type === 'reanimate') {
                
                if (game.eco[data.team].dew >= NECRO_CONFIG.spellCost) {
                    game.eco[data.team].dew -= NECRO_CONFIG.spellCost;
                    
                    // Spawn the visual shockwave
                    game.addEntity(new ReanimateAOE(data.x, data.y));
                    game.bus.emit('playSound', 'spell');
                    
                    let raisedCount = 0;
                    
                    // Scan the battlefield for corpses
                    for (let i = 0; i < game.entities.length; i++) {
                        let e = game.entities[i];
                        
                        if (e instanceof Corpse && MathUtils.distSq(e.x, e.y, data.x, data.y) <= NECRO_CONFIG.spellRadiusSq) {
                            e.hp = 0; // Destroy corpse
                            
                            // Summon Zombie
                            game.addEntity(new ZombieSpider(e.x, e.y, data.team));
                            game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 15});
                            
                            raisedCount++;
                        }
                    }

                    // Visual feedback even if the player whiffed the spell
                    if (raisedCount === 0) {
                        game.bus.emit('particles', {x: data.x, y: data.y, color: '#00ff00', count: 20});
                    }
                }
            }
        });
    },

    patch: (game) => {
        // Intercept the main game loop to drop corpses right BEFORE a spider is culled
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            
            for (let i = 0; i < this.entities.length; i++) {
                let e = this.entities[i];
                
                // If a spider dies, and it wasn't already a zombie, drop a corpse!
                if (e instanceof Spider && e.hp <= 0 && !e.isZombie && !e.corpseSpawned) {
                    e.corpseSpawned = true; // Safety flag to prevent double-spawns
                    this.addEntity(new Corpse(e.x, e.y));
                }
            }
            
            original.call(this); // Continue normal engine update to actually cull the dead entities
        });
    }
};
