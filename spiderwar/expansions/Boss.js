// expansions/Boss.js
import { MathUtils, Spider, Structure, ResourceNode } from '../game.js';

// ==========================================
// 1. THE BOSS ENTITY
// ==========================================
export class CentipedeBoss {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.team = 'nature'; 
        this.hp = 3000; this.maxHp = 3000; 
        this.damage = 50; this.speed = 1.8;
        this.angle = Math.random() * MathUtils.TWO_PI; 
        
        // Segmented Body Mechanics
        this.segmentCount = 15; 
        this.history = []; 
        this.historyLength = this.segmentCount * 4; // Keep exactly enough history for the segments
        
        this.cooldown = 0;
        
        // Sprites will be pulled instantly from RAM cache on Tick 1 of its life
        this.headSprite = null; 
        this.bodySprite = null; 
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.headSprite && game.assets) {
            this.headSprite = game.assets.get('assets/centipede_head.png');
            this.bodySprite = game.assets.get('assets/centipede_body.png');
        }

        // 1. Manage Movement History (Fixed length array for performance)
        const lastPos = this.history[0];
        
        // ACCORDION BUG FIX: Only record history if the boss has moved at least 5 pixels.
        if (!lastPos || MathUtils.distSq(this.x, this.y, lastPos.x, lastPos.y) >= 25) {
            this.history.unshift({ x: this.x, y: this.y, angle: this.angle }); 
            if (this.history.length > this.historyLength) {
                this.history.pop(); 
            }
        }

        // JUICE: Heavy Footsteps!
        if (game.tick % 15 === 0) {
            if (game.triggerShake) game.triggerShake(1.5); // Micro-shake for heavy slithering
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#3d2817', count: 2}); // Kick up dirt
        }

        // 2. Target Acquisition (Using the ultra-fast Spatial Grid!)
        // The Boss is team 'nature', so it will automatically target 'red' and 'black' units
        let nearest = game.getNearestEnemy(this.x, this.y, this.team, 800); // 800px aggro range
        
        // 3. Movement & Combat
        if (nearest) {
            const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            
            // Smooth Rotation (Lerp) for organic, snake-like turning
            let diff = targetAngle - this.angle;
            while (diff > Math.PI) diff -= MathUtils.TWO_PI;
            while (diff < -Math.PI) diff += MathUtils.TWO_PI;
            this.angle += (diff * 0.05);

            const distSq = MathUtils.distSq(this.x, this.y, nearest.x, nearest.y);
            const combatRangeSq = (nearest.size ? nearest.size + 20 : 30) ** 2;

            if (distSq > combatRangeSq) { 
                // Move towards target
                this.x += Math.cos(this.angle) * this.speed; 
                this.y += Math.sin(this.angle) * this.speed; 
            } else { 
                // Melee Attack
                this.cooldown--; 
                if (this.cooldown <= 0) { 
                    nearest.hp -= this.damage; 
                    this.cooldown = 20; 
                    
                    // JUICE: Vicious bite impact
                    if (game.triggerShake) game.triggerShake(6); 
                    game.bus.emit('particles', {x: nearest.x, y: nearest.y, color: '#00ff00', count: 10}); 
                    game.bus.emit('particles', {x: nearest.x, y: nearest.y, color: '#ff0000', count: 5, type: 'splatter'}); 
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
            if (game.triggerShake) game.triggerShake(20); // Massive death throes
            game.bus.emit('playSound', 'death'); 
            setTimeout(() => game.bus.emit('playSound', 'spell'), 100);
            
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#00ff00', count: 200});
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffea00', count: 50});
            
            // Drop a massive ring of loot for the player that slayed it
            for (let i = 0; i < 10; i++) {
                const dropAngle = (MathUtils.TWO_PI / 10) * i;
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
                
                if (this.bodySprite && this.bodySprite.complete && this.bodySprite.naturalHeight !== 0) { 
                    ctx.drawImage(this.bodySprite, -15, -15, 30, 30); 
                } else { 
                    ctx.fillStyle = i % 2 === 0 ? '#113311' : '#225522'; 
                    ctx.beginPath(); ctx.arc(0, 0, 15, 0, MathUtils.TWO_PI); ctx.fill(); 
                }
                ctx.restore();
            }
        }

        // 2. Draw Head
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle);
        
        if (this.headSprite && this.headSprite.complete && this.headSprite.naturalHeight !== 0) { 
            ctx.drawImage(this.headSprite, -20, -20, 40, 40); 
        } else { 
            ctx.fillStyle = '#052205'; 
            ctx.beginPath(); ctx.arc(0, 0, 22, 0, MathUtils.TWO_PI); ctx.fill(); 
            ctx.fillStyle = 'red'; 
            ctx.beginPath(); ctx.arc(8, -8, 4, 0, MathUtils.TWO_PI); 
            ctx.arc(8, 8, 4, 0, MathUtils.TWO_PI); ctx.fill(); 
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

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const GodUnitExpansion = {
    init: (game) => {
        // --- ASSET REGISTRY ---
        game.assets.register('assets/centipede_head.png');
        game.assets.register('assets/centipede_body.png');

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
                const spawnX = this.world.width / 2;
                const spawnY = this.world.height / 2;

                this.addEntity(new CentipedeBoss(spawnX, spawnY));
                
                // JUICE: The Eruption Spawn!
                if (this.triggerShake) this.triggerShake(25); 
                this.bus.emit('playSound', 'death'); 
                setTimeout(() => this.bus.emit('playSound', 'death'), 200); 
                
                // Erupting dirt and magic
                this.bus.emit('particles', {x: spawnX, y: spawnY, color: '#3d2817', count: 300}); // Dirt clods
                this.bus.emit('particles', {x: spawnX, y: spawnY, color: '#00ff00', count: 100}); // Acid splash
                
                this.bus.emit('bossWarning', "The Rotwood Behemoth\nHas Awakened!");
            }
        });
    }
};
