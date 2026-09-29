// expansions/Boss.js
import { MathUtils, Spider, Structure, ResourceNode } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const BOSS_CONFIG = {
    hp: 3000,
    damage: 50,
    speed: 1.8,
    segmentCount: 15,
    attackSpeed: 20,
    aggroRange: 800,
    spawnTick: 10800 // 10800 ticks = ~6 minutes at 30fps
};

const TWO_PI = Math.PI * 2;

// ==========================================
// 2. THE BOSS ENTITY
// ==========================================
export class CentipedeBoss {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.team = 'nature'; 
        this.hp = BOSS_CONFIG.hp; 
        this.maxHp = BOSS_CONFIG.hp; 
        this.damage = BOSS_CONFIG.damage; 
        this.speed = BOSS_CONFIG.speed;
        this.angle = Math.random() * TWO_PI; 
        
        // Segmented Body Mechanics
        this.segmentCount = BOSS_CONFIG.segmentCount; 
        this.historyLength = this.segmentCount * 4; 
        
        // PERFORMANCE FIX: Pre-allocated Ring Buffer! 
        // Prevents garbage collection stutter by recycling objects instead of using unshift/pop.
        this.history = new Array(this.historyLength);
        for(let i = 0; i < this.historyLength; i++) {
            this.history[i] = { x: this.x, y: this.y, angle: this.angle };
        }
        this.headIndex = 0; // Tracks the newest position in the ring buffer
        
        this.cooldown = 0;
        
        // Sprites will be pulled instantly from RAM cache on Tick 1 of its life
        this.headSprite = null; 
        this.bodySprite = null; 
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.headSprite) {
            this.headSprite = game.assets.get('assets/centipede_head.png');
            this.bodySprite = game.assets.get('assets/centipede_body.png');
        }

        // 1. Manage Movement History (Zero Garbage Collection!)
        const lastPos = this.history[this.headIndex];
        
        if (MathUtils.distSq(this.x, this.y, lastPos.x, lastPos.y) >= 25) {
            // Advance the ring buffer write head
            this.headIndex = (this.headIndex + 1) % this.historyLength;
            // Overwrite existing object properties (No memory allocation!)
            this.history[this.headIndex].x = this.x;
            this.history[this.headIndex].y = this.y;
            this.history[this.headIndex].angle = this.angle;
        }

        // 2. Target Acquisition
        // PERFORMANCE FIX: Utilizing the Spatial Hash instead of scanning every entity on the map!
        let nearest = game.getNearestEnemy(this.x, this.y, this.team, BOSS_CONFIG.aggroRange);
        
        // 3. Movement & Combat
        if (nearest) {
            const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            
            // Smooth Rotation (Lerp) for organic, snake-like turning
            let diff = targetAngle - this.angle;
            while (diff > Math.PI) diff -= TWO_PI;
            while (diff < -Math.PI) diff += TWO_PI;
            this.angle += (diff * 0.05);

            const distSq = MathUtils.distSq(this.x, this.y, nearest.x, nearest.y);
            
            // COMBAT FIX: Dynamically adjust melee range based on target size to prevent rubbing against walls
            const combatRange = nearest.size ? nearest.size + 25 : 35;

            if (distSq > (combatRange * combatRange)) { 
                // Move towards target
                this.x += Math.cos(this.angle) * this.speed; 
                this.y += Math.sin(this.angle) * this.speed; 
            } else { 
                // Melee Attack
                this.cooldown--; 
                if (this.cooldown <= 0) { 
                    nearest.hp -= this.damage; 
                    this.cooldown = BOSS_CONFIG.attackSpeed; 
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
            game.bus.emit('playSound', 'death'); // Massive death sound
            
            // Ensure particles exist even if the asset fails to load
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#00ff00', count: 200});
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#225522', count: 50, type: 'splatter'});
            
            // Drop a massive ring of loot for the player that slayed it
            for (let i = 0; i < 10; i++) {
                const dropAngle = (TWO_PI / 10) * i;
                const dist = 100;
                game.addEntity(new ResourceNode(this.x + Math.cos(dropAngle)*dist, this.y + Math.sin(dropAngle)*dist, 'pumpkin'));
                game.addEntity(new ResourceNode(this.x + Math.cos(dropAngle)*(dist+50), this.y + Math.sin(dropAngle)*(dist+50), 'dew'));
            }
        }
    }

    draw(ctx) {
        // Set an intimidating drop shadow for the massive boss
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;

        // 1. Draw Body Segments from Ring Buffer History
        for (let i = this.segmentCount - 1; i > 0; i--) {
            // Read backwards through the ring buffer
            let histIndex = (this.headIndex - (i * 4) + this.historyLength) % this.historyLength; 
            let pos = this.history[histIndex]; 
            
            ctx.save(); 
            ctx.translate(pos.x, pos.y); 
            ctx.rotate(pos.angle);
            
            if (this.bodySprite && this.bodySprite.complete && this.bodySprite.naturalHeight !== 0) { 
                ctx.drawImage(this.bodySprite, -15, -15, 30, 30); 
            } else { 
                ctx.fillStyle = i % 2 === 0 ? '#113311' : '#225522'; 
                ctx.beginPath(); ctx.arc(0, 0, 15, 0, TWO_PI); ctx.fill(); 
            }
            ctx.restore();
        }

        // 2. Draw Head
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle);
        
        if (this.headSprite && this.headSprite.complete && this.headSprite.naturalHeight !== 0) { 
            ctx.drawImage(this.headSprite, -20, -20, 40, 40); 
        } else { 
            ctx.fillStyle = '#052205'; 
            ctx.beginPath(); ctx.arc(0, 0, 22, 0, TWO_PI); ctx.fill(); 
            ctx.fillStyle = 'red'; 
            ctx.beginPath(); ctx.arc(8, -8, 4, 0, TWO_PI); 
            ctx.arc(8, 8, 4, 0, TWO_PI); ctx.fill(); 
        }
        ctx.restore();

        // Turn off shadow for the health bar
        ctx.shadowColor = 'transparent';

        // 3. Boss Health Bar (Only draw if damaged)
        if (this.hp < this.maxHp && this.hp > 0) { 
            ctx.fillStyle = 'black'; ctx.fillRect(this.x - 30, this.y - 35, 60, 8); 
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - 29, this.y - 34, 58, 6); 
            ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - 29, this.y - 34, 58 * (Math.max(0, this.hp) / this.maxHp), 6); 
        }
    }
}

// ==========================================
// 3. EXPANSION LOGIC
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
            
            // Inject the animation if it doesn't exist
            if (!document.getElementById('bossAnimStyle')) {
                const style = document.createElement('style');
                style.id = 'bossAnimStyle';
                style.innerHTML = `@keyframes fadeUpOut { 0% { opacity: 0; transform: translate(-50%, -30%); } 15% { opacity: 1; transform: translate(-50%, -50%); } 80% { opacity: 1; transform: translate(-50%, -50%); } 100% { opacity: 0; transform: translate(-50%, -70%); } }`;
                document.head.appendChild(style);
            }

            // Cleanup DOM cleanly
            setTimeout(() => warningEl.remove(), 4000);
        });
    },

    patch: (game) => {
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            
            // Spawn the Boss precisely at the configured tick
            if (this.tick === BOSS_CONFIG.spawnTick) { 
                this.addEntity(new CentipedeBoss(this.world.width / 2, this.world.height / 2));
                
                // Trigger the massive global alert!
                this.bus.emit('playSound', 'death'); // Placeholder roar
                setTimeout(() => this.bus.emit('playSound', 'death'), 200); // Double-layer roar
                
                this.bus.emit('bossWarning', "The Rotwood Behemoth\nHas Awakened!");
            }
        });
    }
};
