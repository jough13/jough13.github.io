// expansions/Boss.js
import { MathUtils, Spider, Structure, ResourceNode } from '../game.js';

export class CentipedeBoss {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.team = 'nature'; 
        this.hp = 3000; this.maxHp = 3000; 
        this.damage = 50; this.speed = 1.8;
        this.angle = Math.random() * Math.PI * 2; 
        
        // Segmented Body Mechanics
        this.segmentCount = 15; 
        this.history = []; 
        this.historyLength = this.segmentCount * 4; // Keep exactly enough history for the segments
        
        this.cooldown = 0;
        
        this.headSprite = new Image(); 
        this.headSprite.src = 'assets/centipede_head.png';
        
        this.bodySprite = new Image(); 
        this.bodySprite.src = 'assets/centipede_body.png';
    }

    update(game) {
        // 1. Manage Movement History (Fixed length array for performance)
        const lastPos = this.history[0];
        
        // Only record history if it's the first frame, OR if the boss has moved at least 5 pixels.
        // (25 is 5 squared, avoiding the expensive Math.sqrt calculation)
        if (!lastPos || MathUtils.distSq(this.x, this.y, lastPos.x, lastPos.y) >= 25) {
            this.history.unshift({ x: this.x, y: this.y, angle: this.angle }); 
            if (this.history.length > this.historyLength) {
                this.history.pop(); 
            }
        }

        // 2. Target Acquisition (Attack any spider or structure that isn't nature!)
        let nearest = null; 
        let minDistSq = 800 * 800; // Massive aggro range
        
        for (let i = 0; i < game.entities.length; i++) { 
            let t = game.entities[i];
            if (t.hp > 0 && t.team !== 'nature' && (t instanceof Spider || t instanceof Structure)) {
                let dSq = MathUtils.distSq(t.x, t.y, this.x, this.y); 
                if (dSq < minDistSq) { 
                    minDistSq = dSq; 
                    nearest = t; 
                } 
            }
        }
        
        // 3. Movement & Combat
        if (nearest) {
            const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            
            // Smooth Rotation (Lerp) for organic, snake-like turning
            let diff = targetAngle - this.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.angle += (diff * 0.05);

            if (minDistSq > 900) { 
                // Move towards target
                this.x += Math.cos(this.angle) * this.speed; 
                this.y += Math.sin(this.angle) * this.speed; 
            } else { 
                // Melee Attack
                this.cooldown--; 
                if (this.cooldown <= 0) { 
                    nearest.hp -= this.damage; 
                    this.cooldown = 20; 
                    game.bus.emit('particles', {x: nearest.x, y: nearest.y, color: '#00ff00', count: 10}); 
                    game.bus.emit('playSound', 'harvest'); 
                } 
            }
        } else {
            // Idle Wandering
            if (Math.random() < 0.05) this.angle += (Math.random() - 0.5);
            this.x += Math.cos(this.angle) * (this.speed * 0.5); 
            this.y += Math.sin(this.angle) * (this.speed * 0.5);
            
            // Bounce off world bounds cleanly
            this.x = MathUtils.clamp(this.x, 100, game.world.width - 100); 
            this.y = MathUtils.clamp(this.y, 100, game.world.height - 100);
        }

        // 4. Boss Death Loot Splosion!
        if (this.hp <= 0) {
            game.bus.emit('playSound', 'spell'); // Massive death sound
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#00ff00', count: 200});
            
            // Drop a massive ring of loot for the player that slayed it
            for (let i = 0; i < 10; i++) {
                const dropAngle = (Math.PI * 2 / 10) * i;
                const dist = 100;
                game.addEntity(new ResourceNode(this.x + Math.cos(dropAngle)*dist, this.y + Math.sin(dropAngle)*dist, 'pumpkin'));
                game.addEntity(new ResourceNode(this.x + Math.cos(dropAngle)*(dist+50), this.y + Math.sin(dropAngle)*(dist+50), 'dew'));
            }
        }
    }

    draw(ctx) {
        // 1. Draw Body Segments from History
        for (let i = 1; i < this.segmentCount; i++) {
            let histIndex = i * 4; 
            if (this.history[histIndex]) {
                let pos = this.history[histIndex]; 
                ctx.save(); 
                ctx.translate(pos.x, pos.y); 
                ctx.rotate(pos.angle);
                
                if (this.bodySprite.complete && this.bodySprite.naturalHeight !== 0) { 
                    ctx.drawImage(this.bodySprite, -15, -15, 30, 30); 
                } else { 
                    ctx.fillStyle = i % 2 === 0 ? '#113311' : '#225522'; 
                    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); 
                }
                ctx.restore();
            }
        }

        // 2. Draw Head
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle);
        
        if (this.headSprite.complete && this.headSprite.naturalHeight !== 0) { 
            ctx.drawImage(this.headSprite, -20, -20, 40, 40); 
        } else { 
            ctx.fillStyle = '#052205'; 
            ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill(); 
            ctx.fillStyle = 'red'; 
            ctx.beginPath(); ctx.arc(8, -8, 4, 0, Math.PI * 2); 
            ctx.arc(8, 8, 4, 0, Math.PI * 2); ctx.fill(); 
        }
        ctx.restore();

        // 3. Boss Health Bar (Only draw if damaged)
        if (this.hp < this.maxHp && this.hp > 0) { 
            ctx.fillStyle = 'black'; ctx.fillRect(this.x - 30, this.y - 35, 60, 8); 
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - 29, this.y - 34, 58, 6); 
            ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - 29, this.y - 34, 58 * (Math.max(0, this.hp) / this.maxHp), 6); 
        }
    }
}

export const GodUnitExpansion = {
    init: (game) => {
        // Add a global UI hook for Boss Warnings!
        game.bus.on('bossWarning', (msg) => {
            const warningEl = document.createElement('div');
            warningEl.innerText = msg;
            warningEl.style.cssText = `
                position: fixed; top: 20%; left: 50%; transform: translate(-50%, -50%);
                color: #00ff00; font-family: 'Courier New', monospace; font-size: 2.5rem;
                font-weight: bold; text-shadow: 2px 2px 0 #000, 0 0 20px #00ff00;
                z-index: 5000; pointer-events: none; text-align: center; text-transform: uppercase;
                animation: fadeUpOut 4s forwards;
            `;
            document.body.appendChild(warningEl);
            
            // Inject the animation if it doesn't exist
            if (!document.getElementById('bossAnimStyle')) {
                const style = document.createElement('style');
                style.id = 'bossAnimStyle';
                style.innerHTML = `@keyframes fadeUpOut { 0% { opacity: 0; transform: translate(-50%, -30%); } 15% { opacity: 1; transform: translate(-50%, -50%); } 80% { opacity: 1; transform: translate(-50%, -50%); } 100% { opacity: 0; transform: translate(-50%, -70%); } }`;
                document.head.appendChild(style);
            }

            setTimeout(() => warningEl.remove(), 4000);
        });
    },

    patch: (game) => {
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            
            // Spawn the Boss precisely at the 6-minute mark (10800 ticks)
            if (this.tick === 10800) { 
                this.addEntity(new CentipedeBoss(this.world.width / 2, this.world.height / 2));
                
                // Trigger the massive global alert!
                this.bus.emit('playSound', 'death'); // Placeholder roar
                setTimeout(() => this.bus.emit('playSound', 'death'), 200); // Double-layer roar
                
                this.bus.emit('bossWarning', "The Rotwood Behemoth\nHas Awakened!");
            }
        });
    }
};
