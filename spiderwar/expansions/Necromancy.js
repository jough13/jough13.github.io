// expansions/Necromancy.js
import { MathUtils, Spider } from '../game.js';

// 1. The Corpse Entity
export class Corpse {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.size = 12;
        this.hp = 100; // So the game engine can cull it naturally if we set it to 0
        this.life = 1800; // Lasts 60 seconds (at 30 tick) before rotting away completely
        this.sprite = new Image(); 
        this.sprite.src = 'assets/corpse.png';
    }
    update(game) {
        this.life--;
        if (this.life <= 0) this.hp = 0; // Natural decay
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.globalAlpha = Math.min(1, this.life / 300); // Fade out at the very end
        if (this.sprite.complete && this.sprite.naturalHeight !== 0) {
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

// 2. The Zombie Spider Unit
export class ZombieSpider extends Spider {
    constructor(x, y, team) {
        super(x, y, team, 'soldier'); // Inherit soldier AI
        this.isZombie = true;
        this.hp = 80; this.maxHp = 80; // Fragile
        this.damage = 25; // High damage
        this.baseSpeed = 1.6; // Very fast (28 Days Later zombies!)
        this.sprite.src = team === 'black' ? 'assets/zombie_spider.png' : 'assets/zombie_spider.png';
    }
    update(game) {
        this.hp -= 0.15; // Zombies constantly rot away (loses ~4.5 HP per second)
        super.update(game);
    }
    draw(ctx) {
        super.draw(ctx);
        // Add a spooky green aura
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// 3. The Reanimate Spell Visual
class ReanimateAOE {
    constructor(x, y) {
        this.x = x; this.y = y; this.radius = 200; this.life = 30;
    }
    update() { this.life--; if (this.life <= 0) this.hp = 0; }
    draw(ctx) {
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 4; ctx.stroke();
        ctx.globalAlpha = 1.0;
    }
}

// 4. The Expansion Logic
export const NecromancyExpansion = {
    init: (game) => {
        // Listen for the cast spell event from the UI
        game.bus.on('castSpell', (data) => {
            if (data.type === 'reanimate') {
                const cost = 40;
                if (game.eco[data.team].dew >= cost) {
                    game.eco[data.team].dew -= cost;
                    game.addEntity(new ReanimateAOE(data.x, data.y));
                    game.bus.emit('playSound', 'spell');
                    
                    let raisedCount = 0;
                    
                    // Find corpses in radius and resurrect them!
                    game.entities.forEach(e => {
                        if (e instanceof Corpse && MathUtils.distSq(e.x, e.y, data.x, data.y) <= 200 * 200) {
                            e.hp = 0; // Destroy corpse
                            game.addEntity(new ZombieSpider(e.x, e.y, data.team));
                            game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 15});
                            raisedCount++;
                        }
                    });

                    // Even if no corpses were found, pop some particles to show the spell worked
                    if (raisedCount === 0) game.bus.emit('particles', {x: data.x, y: data.y, color: '#00ff00', count: 20});
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
                    e.corpseSpawned = true; // Safety flag
                    this.addEntity(new Corpse(e.x, e.y));
                }
            }
            original.call(this); // Continue normal engine update
        });
    }
};
