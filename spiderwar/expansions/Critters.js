// expansions/Critters.js
import { ResourceNode, MathUtils } from '../game.js';

// ==========================================
// 1. THE APHID (Dew Drop Source)
// ==========================================
export class Aphid {
    constructor(x, y) { 
        this.x = x; 
        this.y = y; 
        this.size = 8; 
        this.hp = 30; 
        this.maxHp = 30; 
        this.angle = Math.random() * Math.PI * 2; 
        this.speed = 0.3; 
        this.team = 'nature'; 
        this.color = '#7eff5e'; // Bright neon green
    }

    update(game) {
        // Idle AI: Erratic turning
        if (Math.random() < 0.1) {
            this.angle += MathUtils.randomRange(-0.5, 0.5);
        }

        // Fleeing AI: Run away quickly if attacked!
        let currentSpeed = this.speed;
        if (this.hp < this.maxHp) {
            currentSpeed *= 3; // Panic speed
        }

        this.x += Math.cos(this.angle) * currentSpeed; 
        this.y += Math.sin(this.angle) * currentSpeed;
        
        // Bounce off world bounds cleanly
        this.x = MathUtils.clamp(this.x, 50, game.world.width - 50); 
        this.y = MathUtils.clamp(this.y, 50, game.world.height - 50);

        // Death: Drop a magic dew node!
        if (this.hp <= 0) { 
            game.addEntity(new ResourceNode(this.x, this.y, 'dew')); 
        }
    }

    draw(ctx) { 
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle); 
        
        ctx.fillStyle = this.color; 
        ctx.beginPath(); 
        ctx.ellipse(0, 0, this.size, this.size - 2, 0, 0, Math.PI * 2); 
        ctx.fill(); 
        
        ctx.restore(); 
    }
}

// ==========================================
// 2. THE GOLDEN SCARAB (High-Value Target)
// ==========================================
export class GoldenBug {
    constructor(x, y) { 
        this.x = x; 
        this.y = y; 
        this.size = 15; 
        this.hp = 250; 
        this.maxHp = 250; 
        this.angle = Math.random() * Math.PI * 2; 
        this.speed = 0.5; 
        this.team = 'nature'; 
        this.color = 'gold';
    }

    update(game) {
        // Idle AI: Slow, gentle turning
        if (Math.random() < 0.05) {
            this.angle += MathUtils.randomRange(-0.5, 0.5);
        }

        // Fleeing AI: Run away quickly if attacked!
        let currentSpeed = this.speed;
        if (this.hp < this.maxHp) {
            currentSpeed *= 2.5; // Panic speed
        }

        this.x += Math.cos(this.angle) * currentSpeed; 
        this.y += Math.sin(this.angle) * currentSpeed;
        
        // Bounce off world bounds cleanly
        this.x = MathUtils.clamp(this.x, 50, game.world.width - 50); 
        this.y = MathUtils.clamp(this.y, 50, game.world.height - 50);

        // Death: Drop a massive scatter of pumpkins!
        if (this.hp <= 0) { 
            for(let i = 0; i < 5; i++) {
                game.addEntity(new ResourceNode(
                    this.x + MathUtils.randomRange(-100, 100), 
                    this.y + MathUtils.randomRange(-100, 100), 
                    'pumpkin'
                ));
            }
        }
    }

    draw(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle); 
        
        // Shiny glowing aura
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = '#ffd700'; 
        ctx.beginPath(); 
        ctx.ellipse(0, 0, this.size, this.size - 5, 0, 0, Math.PI * 2); 
        ctx.fill();
        
        ctx.shadowBlur = 0; // Reset shadow so it doesn't apply to the eyes

        // Eyes
        ctx.fillStyle = '#fff'; 
        ctx.fillRect(this.size / 2, -2, 4, 4); 
        ctx.restore();
        
        // Health Bar (Only visible when damaged)
        if (this.hp < this.maxHp) { 
            ctx.fillStyle = 'black'; 
            ctx.fillRect(this.x - 11, this.y - 21, 22, 6); 
            ctx.fillStyle = 'red'; 
            ctx.fillRect(this.x - 10, this.y - 20, 20, 4); 
            ctx.fillStyle = 'lime'; 
            ctx.fillRect(this.x - 10, this.y - 20, 20 * (Math.max(0, this.hp) / this.maxHp), 4); 
        }
    }
}
