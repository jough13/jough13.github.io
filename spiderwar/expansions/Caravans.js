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
        
        this.size = CARAVAN_CONFIG.size;
        this.hp = CARAVAN_CONFIG.hp;
        this.maxHp = CARAVAN_CONFIG.hp;
        this.baseSpeed = CARAVAN_CONFIG.speed;
        this.speed = this.baseSpeed;
        this.color = '#ffd700'; // Gold

        // 🚀 [LOGIC FIX] Point the base class to the correct sprite target!
        this.spriteSrc = 'assets/caravan.png'; 
        
        // Pathing: Walk from start to end, ignoring everything else
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

        // 1. Move Towards Destination
        const dx = this.targetNode.x - this.x;
        const dy = this.targetNode.y - this.y;
        const distSq = (dx * dx) + (dy * dy);
        
        if (distSq > 400) { // Keep walking
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            
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
            
            // Ensure no corpse is dropped by Necromancy.js since it just walked off-screen
            this.isZombie = true; 
        }

        // We do NOT call super.update() because we don't want it to run the default combat/flee AI.
        // It should ignore enemies completely and just march forward.
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
        
        // Prevent Necromancy corpse
        this.isZombie = true;
    }

    // 🛡️ [FIX] Pass game object down to super.draw to preserve RAM Cache and animations!
    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 🧃 [JUICE] Flash bright white when damaged
        if (this.flashFrames > 0) ctx.filter = 'brightness(2.5)';
        
        // 🧃 [JUICE] Heavy waddling animation
        const tick = game ? game.tick : 0;
        const waddle = Math.sin(tick * 0.1 + this.animOffset) * 0.15;
        ctx.rotate(waddle);
        
        // 🧃 [JUICE] Massive golden shadow/glow
        ctx.shadowColor = '#ffea00';
        ctx.shadowBlur = 15;
        
        ctx.translate(-this.x, -this.y); // Undo translation so super.draw handles it cleanly
        
        super.draw(ctx, game);
        
        ctx.restore();
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
