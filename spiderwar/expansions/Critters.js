// expansions/Critters.js
import { ResourceNode, MathUtils } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const CRITTER_CONFIG = {
    aphid: {
        hp: 30,
        size: 8,
        speed: 0.3,
        fleeMultiplier: 3.0,
        dropType: 'dew',
        dropCount: 1,
        color: '#7eff5e' // Bright neon green
    },
    goldenBug: {
        hp: 250,
        size: 15,
        speed: 0.5,
        fleeMultiplier: 2.5,
        dropType: 'pumpkin',
        dropCount: 5,
        dropSpread: 100, // Distance pumpkins scatter on death
        color: 'gold'
    }
};

const TWO_PI = Math.PI * 2;

// ==========================================
// 2. THE APHID (Dew Drop Source)
// ==========================================
export class Aphid {
    constructor(x, y) { 
        this.x = x; 
        this.y = y; 
        this.size = CRITTER_CONFIG.aphid.size; 
        this.hp = CRITTER_CONFIG.aphid.hp; 
        this.maxHp = CRITTER_CONFIG.aphid.hp; 
        this.angle = Math.random() * TWO_PI; 
        this.speed = CRITTER_CONFIG.aphid.speed; 
        this.team = 'nature'; 
        this.color = CRITTER_CONFIG.aphid.color;
        
        // Sprite linking
        this.spriteFetched = false;
        this.sprite = null;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.spriteFetched && game.assets) {
            this.sprite = game.assets.get('assets/aphid.png');
            this.spriteFetched = true;
        }

        // Idle AI: Erratic turning
        if (Math.random() < 0.1) {
            this.angle += MathUtils.randomRange(-0.5, 0.5);
        }

        // Fleeing AI: Run away quickly if attacked!
        let currentSpeed = this.speed;
        if (this.hp < this.maxHp) {
            currentSpeed *= CRITTER_CONFIG.aphid.fleeMultiplier; 
        }

        this.x += Math.cos(this.angle) * currentSpeed; 
        this.y += Math.sin(this.angle) * currentSpeed;
        
        // Bounce off world bounds cleanly (Dynamic based on size)
        const bound = this.size * 2;
        this.x = MathUtils.clamp(this.x, bound, game.world.width - bound); 
        this.y = MathUtils.clamp(this.y, bound, game.world.height - bound);

        // Death: Drop a magic dew node!
        if (this.hp <= 0) { 
            for(let i = 0; i < CRITTER_CONFIG.aphid.dropCount; i++) {
                game.addEntity(new ResourceNode(this.x, this.y, CRITTER_CONFIG.aphid.dropType)); 
            }
        }
    }

    draw(ctx) { 
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle); 
        
        // Render Sprite if it exists in assets, otherwise fallback to shape
        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size * 2, this.size * 2);
        } else {
            ctx.fillStyle = this.color; 
            ctx.beginPath(); 
            ctx.ellipse(0, 0, this.size, this.size - 2, 0, 0, TWO_PI); 
            ctx.fill(); 
        }
        
        ctx.restore(); 
    }
}

// ==========================================
// 3. THE GOLDEN SCARAB (High-Value Target)
// ==========================================
export class GoldenBug {
    constructor(x, y) { 
        this.x = x; 
        this.y = y; 
        this.size = CRITTER_CONFIG.goldenBug.size; 
        this.hp = CRITTER_CONFIG.goldenBug.hp; 
        this.maxHp = CRITTER_CONFIG.goldenBug.hp; 
        this.angle = Math.random() * TWO_PI; 
        this.speed = CRITTER_CONFIG.goldenBug.speed; 
        this.team = 'nature'; 
        this.color = CRITTER_CONFIG.goldenBug.color;

        // Sprite linking
        this.spriteFetched = false;
        this.sprite = null;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.spriteFetched && game.assets) {
            this.sprite = game.assets.get('assets/goldenbug.png');
            this.spriteFetched = true;
        }

        // Idle AI: Slow, gentle turning
        if (Math.random() < 0.05) {
            this.angle += MathUtils.randomRange(-0.5, 0.5);
        }

        // Fleeing AI: Run away quickly if attacked!
        let currentSpeed = this.speed;
        if (this.hp < this.maxHp) {
            currentSpeed *= CRITTER_CONFIG.goldenBug.fleeMultiplier; 
        }

        this.x += Math.cos(this.angle) * currentSpeed; 
        this.y += Math.sin(this.angle) * currentSpeed;
        
        // Bounce off world bounds cleanly (Dynamic based on size)
        const bound = this.size * 2;
        this.x = MathUtils.clamp(this.x, bound, game.world.width - bound); 
        this.y = MathUtils.clamp(this.y, bound, game.world.height - bound);

        // Death: Drop a massive scatter of resources!
        if (this.hp <= 0) { 
            const spread = CRITTER_CONFIG.goldenBug.dropSpread;
            for(let i = 0; i < CRITTER_CONFIG.goldenBug.dropCount; i++) {
                game.addEntity(new ResourceNode(
                    this.x + MathUtils.randomRange(-spread, spread), 
                    this.y + MathUtils.randomRange(-spread, spread), 
                    CRITTER_CONFIG.goldenBug.dropType
                ));
            }
        }
    }

    draw(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle); 
        
        // Render Sprite if it exists in assets, otherwise fallback to glowing shape
        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size * 2, this.size * 2);
        } else {
            // Shiny glowing aura
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 10;
            
            ctx.fillStyle = '#ffd700'; 
            ctx.beginPath(); 
            ctx.ellipse(0, 0, this.size, this.size - 5, 0, 0, TWO_PI); 
            ctx.fill();
            
            ctx.shadowBlur = 0; // Reset shadow so it doesn't apply to the eyes

            // Eyes
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(this.size / 2, -2, 4, 4); 
        }
        
        ctx.restore();
        
        // Health Bar (Only visible when damaged)
        if (this.hp < this.maxHp) { 
            const w = 20;
            const pct = Math.max(0, this.hp) / this.maxHp;

            ctx.fillStyle = 'black'; 
            ctx.fillRect(this.x - (w/2 + 1), this.y - (this.size + 6), w + 2, 6); 
            
            ctx.fillStyle = 'red'; 
            ctx.fillRect(this.x - (w/2), this.y - (this.size + 5), w, 4); 
            
            ctx.fillStyle = 'lime'; 
            ctx.fillRect(this.x - (w/2), this.y - (this.size + 5), w * pct, 4); 
        }
    }
}
