// expansions/Hazards.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak hazard spawn rates and damage!
export const HAZARD_CONFIG = {
    flytrapCount: 30,
    flytrapDamage: 200,      // Massive damage, instantly kills most basic units
    flytrapCooldown: 300,    // 10 seconds of "digestion" sleep
    flytrapRadius: 50,       // Used for Spatial Grid lookup
    flytrapRadiusSq: 2500,   // 50^2 pre-calculated trigger radius
    flytrapHp: 300           // Tough enough to require a small squad to clear
};

// ==========================================
// 2. THE VENUS FLYTRAP ENTITY
// ==========================================
export class VenusFlytrap {
    constructor(x, y) {
        this.id = Math.random().toString(36).substring(2, 11);
        this.x = x; this.y = y; 
        this.size = 20; 
        this.cooldown = 0;
        this.team = 'nature'; 
        this.hp = HAZARD_CONFIG.flytrapHp; 
        this.maxHp = HAZARD_CONFIG.flytrapHp;
        
        // [JUICE] Animation Offsets & Damage Tracking
        this.animOffset = parseInt(this.id, 36) % 100;
        this.flashFrames = 0;
        this.chompAnim = 0;
        this._lastHp = this.hp;
        
        // Sprites will be pulled instantly from RAM cache on Tick 1 of its life
        this.spriteOpen = null;
        this.spriteClosed = null;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.spriteOpen && game.assets) {
            this.spriteOpen = game.assets.get('assets/flytrap_open.png');
            this.spriteClosed = game.assets.get('assets/flytrap_closed.png');
        }

        // [JUICE] Damage Flashing Tracker
        if (this.hp < this._lastHp) this.flashFrames = 4;
        this._lastHp = this.hp;
        
        if (this.flashFrames > 0) this.flashFrames--;
        if (this.chompAnim > 0) this.chompAnim--;

        // 1. Digestion / Sleep Phase
        if (this.cooldown > 0) { 
            this.cooldown--; 
            
            // Visual digestion particles (Acidic green bubbles floating up)
            if (this.cooldown % 45 === 0) {
                game.bus.emit('particles', {x: this.x, y: this.y - 10, color: '#aaffaa', count: 2, type: 'magic'});
            }
            return; 
        }
        
        // 2. Ambush / Hunting Phase
        // PERFORMANCE FIX: Use the Spatial Grid to only check units physically nearby!
        let prey = game.getNearestEnemy(this.x, this.y, this.team, HAZARD_CONFIG.flytrapRadius);
        
        if (prey && prey instanceof Spider) {
            // Check exact circle collision for the bite
            if (MathUtils.distSq(this.x, this.y, prey.x, prey.y) < HAZARD_CONFIG.flytrapRadiusSq) {
                
                prey.hp -= HAZARD_CONFIG.flytrapDamage; // CHOMP!
                this.cooldown = HAZARD_CONFIG.flytrapCooldown; // Go to sleep
                this.chompAnim = 15; // Trigger the vicious snap animation!
                
                // JUICE: The snap of the jaw shakes the screen!
                if (game.triggerShake) game.triggerShake(5);
                game.bus.emit('playSound', 'death');
                
                // Violent blood and acid splatter
                game.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 15, type: 'splatter'});
                game.bus.emit('particles', {x: this.x, y: this.y, color: '#55ff55', count: 10, type: 'magic'});
            }
        }
    }

    // [FIX] Pass game down so animations respect game.tick and hit-stops
    draw(ctx, game) {
        ctx.save(); 
        ctx.translate(this.x, this.y);
        
        // [JUICE] Damage flash filter
        if (this.flashFrames > 0) ctx.filter = 'brightness(2.5)';
        
        // Organic Breathing Animation
        // Pulses fast when hungry, slow when digesting
        const tick = game ? game.tick : 0;
        const breathe = this.cooldown > 0 
            ? 1 + Math.sin(tick * 0.05 + this.animOffset) * 0.02 
            : 1 + Math.sin(tick * 0.1 + this.animOffset) * 0.05;
        
        ctx.scale(breathe, breathe);

        // [JUICE] Chomp recoil animation!
        if (this.chompAnim > 0) {
            // A rapid squash and stretch to simulate snapping shut
            const squash = 1 - Math.sin((this.chompAnim / 15) * Math.PI) * 0.3;
            ctx.scale(1 / squash, squash); // Preserves volume
        }

        // [JUICE] Add an ambient drop shadow so the plant feels rooted to the earth
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 4;

        const isOpen = this.cooldown === 0;
        const activeSprite = isOpen ? this.spriteOpen : this.spriteClosed;

        if (activeSprite && activeSprite.complete && activeSprite.naturalHeight !== 0) {
            
            // ASPECT RATIO FIX: Calculate dynamic width based on the actual image proportions!
            const aspect = activeSprite.naturalWidth / activeSprite.naturalHeight;
            const drawH = this.size * 2;
            const drawW = drawH * aspect;
            
            ctx.drawImage(activeSprite, -drawW / 2, -drawH / 2, drawW, drawH);
            
        } else {
            // Fallback drawing if sprites are missing
            ctx.fillStyle = isOpen ? '#55ff55' : '#335533';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
            
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; // Reset shadow for eyes
            if (isOpen) { 
                ctx.fillStyle = 'red'; 
                ctx.beginPath(); ctx.arc(0, 0, 8, 0, MathUtils.TWO_PI); ctx.fill(); 
            }
        }
        ctx.restore();

        // Standard Universal Health Bar (Only draw if damaged)
        if (this.hp < this.maxHp && this.hp > 0) {
            const w = this.size * 1.5;
            // SAFETY FIX: Prevent negative width rendering if HP drops below zero before cleanup
            const pct = Math.max(0, this.hp) / this.maxHp;
            
            ctx.fillStyle = 'black'; 
            ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 11, w + 2, 6);
            ctx.fillStyle = '#550000'; // Darker red background
            ctx.fillRect(this.x - w/2, this.y - this.size - 10, w, 4);
            
            // Dynamic health color
            const barColor = pct > 0.5 ? '#00ff00' : (pct > 0.25 ? '#ffff00' : '#ff0000');
            ctx.fillStyle = barColor; 
            ctx.fillRect(this.x - w/2, this.y - this.size - 10, w * pct, 4);
        }
    }
}

// ==========================================
// 3. EXPANSION LOGIC
// ==========================================
export const HazardsExpansion = {
    init: (game) => {
        game.hazardsSpawned = false;
        
        // [EXPANDABILITY] Hook config to the game engine
        game.hazardConfig = HAZARD_CONFIG;
        
        // --- ASSET REGISTRY ---
        game.assets.register('assets/flytrap_open.png');
        game.assets.register('assets/flytrap_closed.png');
    },

    patch: (game) => {
        // Deterministic Spawning: Hook into game loop, wait for Tick 1
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState === 'playing' && this.tick === 1 && !this.hazardsSpawned) {
                this.hazardsSpawned = true;
                
                let placed = 0;
                let attempts = 0;
                
                const maxCount = this.hazardConfig.flytrapCount;
                
                // Try to place the hazards primarily on Grass terrain
                while(placed < maxCount && attempts < maxCount * 3) {
                    attempts++;
                    let x = MathUtils.randomRange(100, this.world.width - 100);
                    let y = MathUtils.randomRange(100, this.world.height - 100);
                    
                    if (this.getTerrainAt(x, y) === 'grass') {
                        this.addEntity(new VenusFlytrap(x, y));
                        placed++;
                    }
                }
            }
        });
    }
};
