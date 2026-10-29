// expansions/Caravans.js
import { Spider, ResourceNode, MathUtils } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// 🔌 [EXPANDABILITY] Exported so other mods can adjust spawn rates and loot drops
export const CARAVAN_CONFIG = {
    spawnTickMin: 10800, // Earliest spawn: 3 mins
    spawnTickMax: 18000, // Latest spawn: 5 mins
    
    speed: 0.4,          // Very slow, ponderous movement
    hp: 1500,            // Extremely tanky
    size: 35,            // Massive bug!
    
    // The Bounty
    lootPumpkins: 25,    // Number of pumpkin nodes dropped
    lootDew: 15,         // Number of dew nodes dropped
    dropSpread: 200      // How far the loot scatters on death
};

// ==========================================
// 2. THE CARAVAN ENTITY (The Goliath Beetle)
// ==========================================
export class GoldenCaravan extends Spider {
    constructor(startX, startY, endX, endY) {
        // Inherits from Spider so it automatically interacts with combat and spatial grids
        super(startX, startY, 'nature', 'caravan');
        
        // 🚨 FIXED: Remove default 'gatherer' traits so it doesn't try to mine resources!
        this.traits = [];
        
        this.size = CARAVAN_CONFIG.size;
        this.hp = CARAVAN_CONFIG.hp;
        this.maxHp = CARAVAN_CONFIG.hp;
        this.baseSpeed = CARAVAN_CONFIG.speed;
        this.speed = this.baseSpeed;
        this.color = '#ffd700'; // Gold

        // 🚀 [LOGIC FIX] Point the base class to the correct sprite target!
        this.spriteSrc = 'assets/caravan.png'; 
        
        // Pathing: Walk from start to end, ignoring everything else
        this.startX = startX; this.startY = startY; // [FIX] Store for save state!
        this.targetNode = { x: endX, y: endY };
        
        // Face the destination immediately
        this.angle = Math.atan2(endY - startY, endX - startX);
        
        // 🧃 [JUICE] Walk cycle animation
        this.animOffset = parseInt(this.id, 36) % 100;
        this.flashFrames = 0;
        this._lastHp = this.hp;
        
        // 🛡️ [FIX] Track if it left the map intentionally
        this.escaped = false;
    }

    update(game) {
        // 🧃 [JUICE] Damage Flashing Tracker
        if (this.hp < this._lastHp) {
            this.flashFrames = 4;
            // 🧃 Drop a few golden particles when hit, like chipping off gold armor!
            if (Math.random() > 0.5) game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffea00', count: 2});
        }
        this._lastHp = this.hp;
        if (this.flashFrames > 0) this.flashFrames--;
        
        // 🚨 FIXED: Allow the Caravan to be stunned by Paralyze spells!
        if (this.stunTimer > 0) {
            this.stunTimer--;
            if (game.tick % 15 === 0) game.bus.emit('particles', {x: this.x, y: this.y - 10, color: '#00ffff', count: 1, type: 'magic'});
            return; 
        }

        // 1. Move Towards Destination
        const dx = this.targetNode.x - this.x;
        const dy = this.targetNode.y - this.y;
        const distSq = (dx * dx) + (dy * dy);
        
        if (distSq > 400) { // Keep walking
            
            // 🛡️ [FIX] Recalculate angle so swarm physics deflections don't steer it permanently off course!
            this.angle = Math.atan2(dy, dx);
            
            // 🚨 FIXED: Apply SilkTrap and VenomStrike slow debuffs correctly!
            let currentSpeed = this.isSlowed ? (this.baseSpeed * 0.4) : this.baseSpeed;
            
            // [FIX] Use baseSpeed so the Universal Speed Tracker doesn't accidentally paralyze the slow-moving caravan!
            this.x += Math.cos(this.angle) * currentSpeed;
            this.y += Math.sin(this.angle) * currentSpeed;
            
            // 🧃 [JUICE] Heavy footsteps
            if (game.tick % 30 === 0) {
                if (game.triggerShake) game.triggerShake(1);
                game.bus.emit('particles', {x: this.x, y: this.y, color: '#3d2817', count: 3});
            }
        } else {
            // Reached the edge of the map! It escaped!
            this.hp = 0; 
            this.escaped = true; // 🛡️ [FIX] Prevents loot explosion
            
            if (game.showSystemMessage) game.showSystemMessage("THE CARAVAN ESCAPED", "#aaaaaa");
        }

        // We do NOT call super.update() because we don't want it to run the default combat/flee AI.
        // It should ignore enemies completely and just march forward.
        
        // 🚨 FIXED: Clear debuffs at the end of the frame so they must be actively reapplied by spells!
        this.isSlowed = false; 
    }

    // 🛡️ [FIX] The Death Loot Drop is now safely handled here so it isn't skipped by GC
    onDeath(game) {
        if (this.escaped) return; // Didn't die, just walked off the map!

        // 🧃 [JUICE] Massive Death Impact
        if (game.triggerShake) game.triggerShake(15);
        game.bus.emit('playSound', 'roar');
        game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffea00', count: 150});
        game.bus.emit('particles', {x: this.x, y: this.y, color: '#00ff00', count: 50, type: 'splatter'}); // Bug guts
        
        if (game.showSystemMessage) game.showSystemMessage("THE CARAVAN HAS FALLEN", "#ffea00");

        const spread = CARAVAN_CONFIG.dropSpread;
        
        // Drop Pumpkins
        for(let i = 0; i < CARAVAN_CONFIG.lootPumpkins; i++) {
            const dropAngle = Math.random() * MathUtils.TWO_PI;
            const dropDist = Math.random() * spread;
            const pX = MathUtils.clamp(this.x + Math.cos(dropAngle) * dropDist, 50, game.world.width - 50);
            const pY = MathUtils.clamp(this.y + Math.sin(dropAngle) * dropDist, 50, game.world.height - 50);
            game.addEntity(new ResourceNode(pX, pY, 'pumpkin'));
        }
        
        // Drop Dew
        for(let i = 0; i < CARAVAN_CONFIG.lootDew; i++) {
            const dropAngle = Math.random() * MathUtils.TWO_PI;
            const dropDist = Math.random() * spread;
            const dX = MathUtils.clamp(this.x + Math.cos(dropAngle) * dropDist, 50, game.world.width - 50);
            const dY = MathUtils.clamp(this.y + Math.sin(dropAngle) * dropDist, 50, game.world.height - 50);
            game.addEntity(new ResourceNode(dX, dY, 'dew'));
        }
    }

    // 🛡️ [FIX] Pass game object down to super.draw to preserve RAM Cache and animations!
    draw(ctx, game) {
        // 🧃 [JUICE] Massive golden shadow/glow underneath
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(255, 234, 0, 0.2)';
        ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
        
        // 🚨 FIXED: Draw an icy crystal block over stunned units (Same as Spider.draw in SpectralSwarm)
        if (this.stunTimer > 0) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -this.size - 4); ctx.lineTo(this.size + 2, -2); ctx.lineTo(this.size + 4, this.size + 2);
            ctx.lineTo(-2, this.size + 4); ctx.lineTo(-this.size - 4, 2); ctx.closePath();
            ctx.fill(); ctx.stroke();
        }
        
        ctx.restore();
        
        // Temporarily inject the waddle into the angle so super.draw rotates the sprite organically
        const tick = game ? game.tick : 0;
        const waddle = Math.sin(tick * 0.1 + this.animOffset) * 0.15;
        const tempAngle = this.angle;
        this.angle += waddle;
        
        super.draw(ctx, game); // Inherits sprite drawing and patched health bar cleanly!
        
        this.angle = tempAngle;
        
        // 🧃 [JUICE] Flash bright white when damaged (Additive Blending instead of slow CSS filters!)
        if (this.flashFrames > 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
            ctx.restore();
        }
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const CaravansExpansion = {
    init: (game) => {
        // 🔌 [EXPANDABILITY] Export config to the engine
        game.caravanConfig = CARAVAN_CONFIG;
        
        // Generate the exact frame the caravan will spawn
        game.nextCaravanTick = MathUtils.randomInt(CARAVAN_CONFIG.spawnTickMin, CARAVAN_CONFIG.spawnTickMax);
        
        // --- ASSET REGISTRY ---
        game.assets.register('assets/caravan.png');
    },

    patch: (game) => {
        // Hook into the main game loop to handle spawning
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            // 🛡️ [FIX] Changed `===` to `>=` so the spawn event isn't skipped by lag or time-skips!
            if (this.gameState === 'playing' && this.tick >= this.nextCaravanTick) {
                
                // Pick a random side to spawn on (0=Top, 1=Right, 2=Bottom, 3=Left)
                const side = MathUtils.randomInt(0, 3);
                let startX, startY, endX, endY;
                const buffer = 50; // Spawn slightly inside the map to prevent physics glitches
                
                if (side === 0) { // Top to Bottom
                    startX = MathUtils.randomRange(1000, this.world.width - 1000);
                    startY = buffer;
                    endX = startX + MathUtils.randomRange(-500, 500); // Slight diagonal variance
                    endY = this.world.height - buffer;
                } else if (side === 1) { // Right to Left
                    startX = this.world.width - buffer;
                    startY = MathUtils.randomRange(1000, this.world.height - 1000);
                    endX = buffer;
                    endY = startY + MathUtils.randomRange(-500, 500);
                } else if (side === 2) { // Bottom to Top
                    startX = MathUtils.randomRange(1000, this.world.width - 1000);
                    startY = this.world.height - buffer;
                    endX = startX + MathUtils.randomRange(-500, 500);
                    endY = buffer;
                } else { // Left to Right
                    startX = buffer;
                    startY = MathUtils.randomRange(1000, this.world.height - 1000);
                    endX = this.world.width - buffer;
                    endY = startY + MathUtils.randomRange(-500, 500);
                }

                // Spawn the Caravan
                const caravan = new GoldenCaravan(startX, startY, endX, endY);
                this.addEntity(caravan);
                
                // 🧃 [JUICE] Global Announcement!
                if (this.showSystemMessage) {
                    this.showSystemMessage("A GOLDEN CARAVAN HAS APPEARED", "#ffea00");
                }
                this.bus.emit('playSound', 'roar');
                if (this.triggerShake) this.triggerShake(8);
                
                // 🛡️ [FIX] Standardized ping array to use raw World Coordinates!
                if (this.minimapPings) this.minimapPings.push({ x: startX, y: startY, age: 0 });

                // Schedule the next one! (Adding the random interval to the current tick)
                this.nextCaravanTick = this.tick + MathUtils.randomInt(CARAVAN_CONFIG.spawnTickMin, CARAVAN_CONFIG.spawnTickMax);
            }
        });
    }
};
