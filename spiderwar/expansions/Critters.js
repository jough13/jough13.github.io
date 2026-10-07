// expansions/Critters.js
import { ResourceNode, MathUtils } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak critter stats, speeds, and loot tables!
export const CRITTER_CONFIG = {
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

// ==========================================
// 2. THE APHID (Dew Drop Source)
// ==========================================
export class Aphid {
    constructor(x, y) { 
        this.id = Math.random().toString(36).substring(2, 11);
        this.x = x; 
        this.y = y; 
        this.size = CRITTER_CONFIG.aphid.size; 
        this.hp = CRITTER_CONFIG.aphid.hp; 
        this.maxHp = CRITTER_CONFIG.aphid.hp; 
        this.angle = Math.random() * MathUtils.TWO_PI; 
        this.speed = CRITTER_CONFIG.aphid.speed; 
        this.team = 'nature'; 
        this.color = CRITTER_CONFIG.aphid.color;
        
        // [JUICE] Animation Offsets & Damage Tracking
        this.animOffset = parseInt(this.id, 36) % 100;
        this._lastHp = this.hp;
        this.flashFrames = 0;
        
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

        // [JUICE] Damage Flashing Tracker
        if (this.hp < this._lastHp) this.flashFrames = 4;
        this._lastHp = this.hp;
        if (this.flashFrames > 0) this.flashFrames--;

        // Idle AI: Erratic turning
        if (Math.random() < 0.1) {
            this.angle += MathUtils.randomRange(-0.5, 0.5);
            this.angle = MathUtils.angleWrap(this.angle); // Keep normalized
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
                // [FIX] Ensure the dropped node is safely clamped within the map bounds
                const pX = MathUtils.clamp(this.x + MathUtils.randomRange(-10, 10), 50, game.world.width - 50);
                const pY = MathUtils.clamp(this.y + MathUtils.randomRange(-10, 10), 50, game.world.height - 50);
                game.addEntity(new ResourceNode(pX, pY, CRITTER_CONFIG.aphid.dropType)); 
            }
        }
    }

    draw(ctx, game) { 
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle); 
        
        // [JUICE] Organic wiggle that speeds up significantly if they are fleeing in panic
        const tick = game ? game.tick : 0;
        const wiggleSpeed = this.hp < this.maxHp ? 0.8 : 0.1;
        const wiggle = Math.sin(tick * wiggleSpeed + this.animOffset) * 0.15;
        ctx.rotate(wiggle);

        // [JUICE] Flash bright white when damaged
        if (this.flashFrames > 0) ctx.filter = 'brightness(2.5)';
        
        // Render Sprite with dynamic Aspect Ratio
        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            const aspect = this.sprite.naturalWidth / this.sprite.naturalHeight;
            const drawH = this.size * 2;
            const drawW = drawH * aspect;
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.fillStyle = this.color; 
            ctx.beginPath(); 
            ctx.ellipse(0, 0, this.size, this.size - 2, 0, 0, MathUtils.TWO_PI); 
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
        this.id = Math.random().toString(36).substring(2, 11);
        this.x = x; 
        this.y = y; 
        this.size = CRITTER_CONFIG.goldenBug.size; 
        this.hp = CRITTER_CONFIG.goldenBug.hp; 
        this.maxHp = CRITTER_CONFIG.goldenBug.hp; 
        this.angle = Math.random() * MathUtils.TWO_PI; 
        this.speed = CRITTER_CONFIG.goldenBug.speed; 
        this.team = 'nature'; 
        this.color = CRITTER_CONFIG.goldenBug.color;

        // [JUICE] Animation Offsets & Damage Tracking
        this.animOffset = parseInt(this.id, 36) % 100;
        this._lastHp = this.hp;
        this.flashFrames = 0;

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

        // [JUICE] Damage Flashing Tracker
        if (this.hp < this._lastHp) this.flashFrames = 4;
        this._lastHp = this.hp;
        if (this.flashFrames > 0) this.flashFrames--;

        // Idle AI: Slow, gentle turning
        if (Math.random() < 0.05) {
            this.angle += MathUtils.randomRange(-0.5, 0.5);
            this.angle = MathUtils.angleWrap(this.angle);
        }

        // Fleeing AI: Run away quickly if attacked!
        let currentSpeed = this.speed;
        if (this.hp < this.maxHp) {
            currentSpeed *= CRITTER_CONFIG.goldenBug.fleeMultiplier; 
            // JUICE: The golden bug sheds golden particles when panicking/bleeding!
            if (game.tick % 5 === 0) game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffea00', count: 1});
        }

        // JUICE: Subtle sparkling trail while walking
        if (game.tick % 15 === 0 && Math.random() > 0.5) {
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 1, type: 'magic'});
        }

        this.x += Math.cos(this.angle) * currentSpeed; 
        this.y += Math.sin(this.angle) * currentSpeed;
        
        // Bounce off world bounds cleanly
        const bound = this.size * 2;
        this.x = MathUtils.clamp(this.x, bound, game.world.width - bound); 
        this.y = MathUtils.clamp(this.y, bound, game.world.height - bound);

        // Death: Drop a massive scatter of resources!
        if (this.hp <= 0) { 
            const spread = CRITTER_CONFIG.goldenBug.dropSpread;
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffea00', count: 50});
            
            for(let i = 0; i < CRITTER_CONFIG.goldenBug.dropCount; i++) {
                // [FIX] Strict boundary clamping so the massive loot explosion doesn't toss pumpkins off-map!
                const dropAngle = Math.random() * MathUtils.TWO_PI;
                const dropDist = Math.random() * spread;
                
                const pX = MathUtils.clamp(this.x + Math.cos(dropAngle) * dropDist, 50, game.world.width - 50);
                const pY = MathUtils.clamp(this.y + Math.sin(dropAngle) * dropDist, 50, game.world.height - 50);

                game.addEntity(new ResourceNode(pX, pY, CRITTER_CONFIG.goldenBug.dropType));
            }
        }
    }

    draw(ctx, game) {
        ctx.save(); 
        ctx.translate(this.x, this.y); 
        ctx.rotate(this.angle); 
        
        // [JUICE] Frantic wiggle animation when running away
        const tick = game ? game.tick : 0;
        const wiggleSpeed = this.hp < this.maxHp ? 0.6 : 0.05;
        const wiggle = Math.sin(tick * wiggleSpeed + this.animOffset) * 0.1;
        ctx.rotate(wiggle);

        // [JUICE] Flash bright white when damaged
        if (this.flashFrames > 0) ctx.filter = 'brightness(2.5)';

        // Render Sprite with dynamic Aspect Ratio
        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            const aspect = this.sprite.naturalWidth / this.sprite.naturalHeight;
            const drawH = this.size * 2;
            const drawW = drawH * aspect;
            
            // [JUICE] Pulsing golden aura behind the sprite
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 15 + Math.sin(tick * 0.1 + this.animOffset) * 5;
            
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.shadowBlur = 0;
        } else {
            // Shiny glowing aura
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 10;
            
            ctx.fillStyle = '#ffd700'; 
            ctx.beginPath(); 
            ctx.ellipse(0, 0, this.size, this.size - 5, 0, 0, MathUtils.TWO_PI); 
            ctx.fill();
            
            ctx.shadowBlur = 0; // Reset shadow so it doesn't apply to the eyes

            // Eyes
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(this.size / 2, -2, 4, 4); 
        }
        
        ctx.restore();
        
        // Health Bar (Only visible when damaged)
        if (this.hp < this.maxHp && this.hp > 0) { 
            const w = 20;
            const pct = Math.max(0, this.hp) / this.maxHp;

            ctx.fillStyle = 'black'; 
            // Placed slightly above the bug
            ctx.fillRect(this.x - (w/2 + 1), this.y - (this.size + 12), w + 2, 6); 
            
            ctx.fillStyle = 'red'; 
            ctx.fillRect(this.x - (w/2), this.y - (this.size + 11), w, 4); 
            
            ctx.fillStyle = 'lime'; 
            ctx.fillRect(this.x - (w/2), this.y - (this.size + 11), w * pct, 4); 
        }
    }
}
