// expansions/Boss.js
import { MathUtils, Spider, Structure, ResourceNode } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can easily adjust boss stats or spawn times
export const BOSS_CONFIG = {
    spawnTick: 10800,       // 3 minutes at 60fps (or 6 minutes at 30fps)
    maxHp: 3000,
    damage: 50,
    speed: 1.8,
    aggroRange: 800,
    attackCooldown: 20,
    segmentCount: 15,
    lootDrops: 10           // Drops 10 pumpkins and 10 dew upon death
};

// ==========================================
// 2. THE BOSS ENTITY
// ==========================================
export class CentipedeBoss {
    constructor(x, y) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.x = x; this.y = y; 
        this.team = 'nature'; 
        
        this.hp = BOSS_CONFIG.maxHp; 
        this.maxHp = BOSS_CONFIG.maxHp; 
        this.damage = BOSS_CONFIG.damage; 
        this.speed = BOSS_CONFIG.speed;
        this.angle = Math.random() * MathUtils.TWO_PI; 
        
        // Segmented Body Mechanics
        this.segmentCount = BOSS_CONFIG.segmentCount; 
        this.history = []; 
        this.historyLength = this.segmentCount * 4; // Keep exactly enough history for the segments
        
        // AI State & Timers
        this.cooldown = 0;
        this.target = null;
        this.repathTimer = 0;
        
        // [JUICE] Animation States
        this.spawnPhase = 60; // Takes 1 second (60 frames) to unburrow
        this.flashFrames = 0;
        this._lastHp = this.hp;
        
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

        // [JUICE] Spawn-in Unburrowing Sequence
        if (this.spawnPhase > 0) {
            this.spawnPhase--;
            if (game.tick % 5 === 0) {
                game.bus.emit('particles', {x: this.x, y: this.y, color: '#3d2817', count: 5}); // Dirt kicking up
            }
            // Record initial history so segments don't pop in from 0,0
            if (this.history.length === 0) {
                for (let i = 0; i < this.historyLength; i++) {
                    this.history.push({ x: this.x, y: this.y, angle: this.angle });
                }
            }
            return; // Cannot move or attack while unburrowing!
        }

        // [JUICE] Damage Flashing Tracker
        if (this.hp < this._lastHp) this.flashFrames = 4;
        this._lastHp = this.hp;
        if (this.flashFrames > 0) this.flashFrames--;

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

        // 2. Target Acquisition ([PERFORMANCE FIX]: Throttled Spatial Grid Lookups!)
        this.repathTimer--;
        if (this.repathTimer <= 0 || !this.target || this.target.hp <= 0) {
            this.target = game.getNearestEnemy(this.x, this.y, this.team, BOSS_CONFIG.aggroRange);
            this.repathTimer = 15; // Only scan the massive 800px grid 4 times a second instead of 60!
        }
        
        // 3. Movement & Combat
        if (this.target) {
            const targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
            
            // [FIX] Use the MathUtils angle wrapper for flawless, glitch-free turning
            let diff = MathUtils.angleWrap(targetAngle - this.angle);
            this.angle += (diff * 0.05);

            const distSq = MathUtils.distSq(this.x, this.y, this.target.x, this.target.y);
            const combatRangeSq = (this.target.size ? this.target.size + 20 : 30) ** 2;

            if (distSq > combatRangeSq) { 
                // Move towards target
                this.x += Math.cos(this.angle) * this.speed; 
                this.y += Math.sin(this.angle) * this.speed; 
            } else { 
                // Melee Attack
                this.cooldown--; 
                if (this.cooldown <= 0) { 
                    this.target.hp -= this.damage; 
                    this.cooldown = BOSS_CONFIG.attackCooldown; 
                    
                    // JUICE: Vicious bite impact & Hit Stop
                    if (game.triggerShake) game.triggerShake(8); 
                    game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: '#00ff00', count: 10}); 
                    game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: '#ff0000', count: 5, type: 'splatter'}); 
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
            
            // Drop a massive ring of loot, [FIX] ensuring drops stay safely inside map boundaries
            for (let i = 0; i < BOSS_CONFIG.lootDrops; i++) {
                const dropAngle = (MathUtils.TWO_PI / BOSS_CONFIG.lootDrops) * i;
                
                const pX = MathUtils.clamp(this.x + Math.cos(dropAngle) * 100, 50, game.world.width - 50);
                const pY = MathUtils.clamp(this.y + Math.sin(dropAngle) * 100, 50, game.world.height - 50);
                
                const dX = MathUtils.clamp(this.x + Math.cos(dropAngle) * 150, 50, game.world.width - 50);
                const dY = MathUtils.clamp(this.y + Math.sin(dropAngle) * 150, 50, game.world.height - 50);
                
                game.addEntity(new ResourceNode(pX, pY, 'pumpkin'));
                game.addEntity(new ResourceNode(dX, dY, 'dew'));
            }
        }
    }

    draw(ctx, game) {
        ctx.save();
        
        // [JUICE] Spawn Unburrow Scale
        if (this.spawnPhase > 0) {
            const spawnProgress = 1 - (this.spawnPhase / 60);
            ctx.translate(this.x, this.y);
            ctx.scale(spawnProgress, spawnProgress);
            ctx.translate(-this.x, -this.y);
        }

        // [JUICE] Damage Flash Filter
        if (this.flashFrames > 0) ctx.filter = 'brightness(2.5)';

        const tick = game ? game.tick : 0;

        // 1. Draw Body Segments from History
        for (let i = 1; i < this.segmentCount; i++) {
            let histIndex = i * 4; 
            if (this.history[histIndex]) {
                let pos = this.history[histIndex]; 
                
                ctx.save(); 
                
                // [JUICE] Wriggle Offset! Adds an organic sine wave to the segments as it moves
                const wriggleOffset = Math.sin(tick * 0.2 + i) * 3;
                // Move to position, apply rotation, THEN apply local Y offset for the wriggle
                ctx.translate(pos.x, pos.y); 
                ctx.rotate(pos.angle);
                ctx.translate(0, wriggleOffset);
                
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
        
        // [JUICE] Head lunges forward slightly during attack cooldown
        if (this.cooldown > BOSS_CONFIG.attackCooldown - 5) {
            ctx.translate(5, 0); 
        }
        
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
        
        ctx.restore(); // Restore global context (removes filters/spawn scaling)

        // 3. Boss Health Bar (Only draw if damaged and fully spawned)
        if (this.hp < this.maxHp && this.hp > 0 && this.spawnPhase === 0) { 
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
        // [EXPANDABILITY] Inject config into game so other mods can read/write to it
        game.bossConfig = BOSS_CONFIG;

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
            
            // Spawn the Boss dynamically based on the injected configuration
            if (this.tick === this.bossConfig.spawnTick) { 
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
