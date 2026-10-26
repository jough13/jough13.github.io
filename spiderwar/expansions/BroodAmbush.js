// expansions/BroodAmbush.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// 🔌 [EXPANDABILITY] Exported config so other mods can tweak the trap stats!
export const AMBUSH_CONFIG = {
    spellCost: 50,
    trapHp: 50,
    armingTimer: 30,              // 1-second incubation before it can detect enemies
    fuseTimer: 15,                // 0.5-second fuse delay after triggered before it explodes
    triggerRadius: 80,            
    triggerRadiusSq: 6400,        
    splashRadius: 100,            // Splash damage reaches slightly further than trigger radius
    splashRadiusSq: 10000,        
    explosionDamageUnit: 40,      
    explosionDamageStruct: 20,    
    broodlingCount: 3,            
    broodlingLife: 600            
};

// ==========================================
// 2. THE EGG TRAP MINE
// ==========================================
export class EggTrap {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team;
        this.hp = AMBUSH_CONFIG.trapHp; 
        this.maxHp = AMBUSH_CONFIG.trapHp;
        this.size = 14;
        
        this.isCloaked = true; 
        
        // State Timers
        this.armingTimer = AMBUSH_CONFIG.armingTimer; 
        this.fuseTimer = 0;
        this.detonating = false;
        this.age = 0;          
        
        // 🚀 [LOGIC FIX] Store the SRC target
        this.spriteSrc = this.team === 'black' ? 'assets/eggtrap_black.png' : 'assets/eggtrap_red.png';
        this.sprite = null;
        this.spriteLoaded = false;
    }

    update(game) {
        this.age++;
        
        // 1. Detonation Fuse Phase
        if (this.detonating) {
            this.fuseTimer--;
            
            // 🧃 [JUICE] Suck in particles while about to explode!
            if (this.fuseTimer % 3 === 0) {
                const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
                game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 2, type: 'magic'});
            }

            if (this.fuseTimer <= 0) {
                this.explode(game);
            }
            return; 
        }

        // 2. Arming Phase
        if (this.armingTimer > 0) {
            this.armingTimer--;
            return; 
        }

        // 3. Detection Phase (High-Performance Spatial Grid Scan)
        // 🚨 FIXED: Scans the entire radius for ANY valid enemy, preventing Aphids from blinding the trap!
        let triggered = false;
        const CELL_SIZE = 250;
        const maxGridX = Math.ceil(game.world.width / CELL_SIZE);
        const maxGridY = Math.ceil(game.world.height / CELL_SIZE);
        
        const cx = MathUtils.clamp((this.x / CELL_SIZE) | 0, 0, maxGridX);
        const cy = MathUtils.clamp((this.y / CELL_SIZE) | 0, 0, maxGridY);
        const radius = AMBUSH_CONFIG.triggerRadius;
        const radiusSq = AMBUSH_CONFIG.triggerRadiusSq;

        outerLoop: for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx < 0 || nx > maxGridX) continue;
            for (let ny = cy - 1; ny <= cy + 1; ny++) {
                if (ny < 0 || ny > maxGridY) continue;
                
                // 🛡️ [FIX] Bitwise isolation protects against negative Y coordinate corruption bugs!
                const key = (nx << 16) | (ny & 0xFFFF);
                const cell = game.spatialGrid.get(key);
                if (!cell) continue;

                for (let i = 0; i < cell.length; i++) {
                    let e = cell[i];
                    
                    // Only trigger on living, uncloaked units (Spiders, Queens, Bosses) of opposing teams
                    if (e.team && e.team !== this.team && e.team !== 'dead' && e.hp > 0 && !e.isCloaked && (e.role || e.isBoss)) {
                        
                        // Ignore harmless nature critters
                        if (e.team === 'nature' && !e.isBoss) continue;

                        // Fast AABB check
                        if (Math.abs(this.x - e.x) > radius || Math.abs(this.y - e.y) > radius) continue;

                        if (MathUtils.distSq(this.x, this.y, e.x, e.y) < radiusSq) {
                            triggered = true;
                            break outerLoop; // Detonate immediately!
                        }
                    }
                }
            }
        }

        if (triggered) {
            // 🧃 [JUICE] Trigger the "Click" of the mine!
            this.detonating = true;
            this.fuseTimer = AMBUSH_CONFIG.fuseTimer;
            game.bus.emit('playSound', 'ping'); // High pitched warning!
        }
    }

    explode(game) {
        this.hp = 0; // Destroy self
        
        // 🧃 [JUICE] Heavy Explosion Screen Shake!
        if (game.triggerShake) game.triggerShake(12);
        game.bus.emit('playSound', 'death'); // Viscous pop sound
        
        const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
        game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 40});
        game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 30, type: 'splatter'});
        
        // 🚀 [PERFORMANCE] Deal Splash Damage using O(1) Spatial Grid!
        const CELL_SIZE = 250;
        const maxGridX = Math.ceil(game.world.width / CELL_SIZE);
        const maxGridY = Math.ceil(game.world.height / CELL_SIZE);
        
        // 🛡️ [FIX] Clamp bounds to prevent out-of-bounds array lookups
        const cx = MathUtils.clamp((this.x / CELL_SIZE) | 0, 0, maxGridX);
        const cy = MathUtils.clamp((this.y / CELL_SIZE) | 0, 0, maxGridY);
        const radiusSq = AMBUSH_CONFIG.splashRadiusSq;

        for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx < 0 || nx > maxGridX) continue;
            for (let ny = cy - 1; ny <= cy + 1; ny++) {
                if (ny < 0 || ny > maxGridY) continue;
                
                const key = (nx << 16) | ny;
                const cell = game.spatialGrid.get(key);
                if (!cell) continue;

                for (let i = 0; i < cell.length; i++) {
                    let e = cell[i];
                    
                    if (e.team && e.team !== this.team && e.hp !== undefined && e.hp > 0) {
                        // Fast AABB early exit
                        if (Math.abs(this.x - e.x) > AMBUSH_CONFIG.splashRadius || Math.abs(this.y - e.y) > AMBUSH_CONFIG.splashRadius) continue;

                        if (MathUtils.distSq(this.x, this.y, e.x, e.y) < radiusSq) {
                            // [FIX] Use minification-safe isBoss flag!
                            if (e.role || e.isBoss) {
                                e.hp -= AMBUSH_CONFIG.explosionDamageUnit; 
                            } else {
                                e.hp -= AMBUSH_CONFIG.explosionDamageStruct; 
                            }
                        }
                    }
                }
            }
        }
        
        // Hatch angry Broodlings!
        for (let i = 0; i < AMBUSH_CONFIG.broodlingCount; i++) {
            // 🛡️ [FIX] Clamp spawn coordinates strictly to the map boundaries
            let bx = MathUtils.clamp(this.x + MathUtils.randomRange(-30, 30), 50, game.world.width - 50);
            let by = MathUtils.clamp(this.y + MathUtils.randomRange(-30, 30), 50, game.world.height - 50);
            game.addEntity(new Broodling(bx, by, this.team));
        }
    }

    // [FIX] Pass `game` to draw so the RAM cache can be accessed
    draw(ctx, game) {
        // 🛡️ [FIX] Enemy traps are invisible until they trigger! 
        if (this.team !== 'black' && !this.detonating) return; 

        // 🚀 [LOGIC FIX] Pull the preloaded image directly from the RAM Cache!
        if (!this.spriteLoaded && game && game.assets) {
            this.sprite = game.assets.get(this.spriteSrc);
            if (this.sprite) this.spriteLoaded = true;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 🧃 [JUICE] High-Performance Drop Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        // 🧃 [JUICE] Fuse Detonation Animation
        if (this.detonating) {
            // Swell up rapidly and flash bright white!
            const swell = 1 + (1 - (this.fuseTimer / AMBUSH_CONFIG.fuseTimer)) * 0.5;
            ctx.scale(swell, swell);
            
            // 🚨 FIXED: Use additive blending instead of expensive CSS filter
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 1.0;
        } else {
            // Gentle, deterministic pulsating animation based on age
            const pulse = 1 + Math.sin(this.age * 0.1) * 0.08;
            ctx.scale(pulse, pulse);
            ctx.globalAlpha = 0.6; // Slightly ghosted to indicate stealth
        }

        if (this.spriteLoaded && this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            // Aspect ratio fix
            const aspect = this.sprite.naturalWidth / this.sprite.naturalHeight;
            const drawH = this.size * 2;
            const drawW = drawH * aspect;
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.fillStyle = '#dddddd'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
            
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; // Reset shadow for stroke
            ctx.strokeStyle = this.team === 'black' ? '#aa00ff' : '#ff0000'; 
            ctx.lineWidth = 2; ctx.stroke();
        }
        
        // 🚨 FIXED: Flash white overlay if detonating!
        if (this.detonating) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.restore();
    }
}

// ==========================================
// 3. THE BABY SWARMER UNIT
// ==========================================
export class Broodling extends Spider {
    constructor(x, y, team) {
        super(x, y, team, 'soldier'); 
        
        this.role = 'broodling';
        this.hp = 25; this.maxHp = 25; 
        this.damage = 15; 
        this.baseSpeed = 2.8; 
        this.speed = this.baseSpeed;
        this.size = 7; 
        
        this.traits = ['melee']; 
        
        this.life = AMBUSH_CONFIG.broodlingLife; 
        
        // 🚀 [LOGIC FIX] Point the base class to the correct sprite target!
        this.spriteSrc = this.team === 'black' ? 'assets/broodling_black.png' : 'assets/broodling_red.png';
        
        // 🧃 [JUICE] Pop-in scale animation
        this.spawnScale = 0.1;
    }

    update(game) {
        // 🧃 [JUICE] Scale up rapidly on spawn
        if (this.spawnScale < 1.0) {
            this.spawnScale = Math.min(1.0, this.spawnScale + 0.15);
        }

        this.life--;
        
        if (this.life <= 0) {
            this.hp = 0; 
            const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 10});
        }
        
        super.update(game); 
    }

    // 🛡️ [FIX] Pass `game` to draw so the new RAM Cache and breathing animations inherit properly!
    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.spawnScale, this.spawnScale);
        ctx.translate(-this.x, -this.y);
        
        // 🧃 Visual polish: Fade out into ghosts during the last 3 seconds of their life
        if (this.life < 90) { 
            ctx.globalAlpha = Math.max(0, this.life / 90);
        }
        
        super.draw(ctx, game);
        
        ctx.restore();
    }
}

// ==========================================
// 4. EXPANSION LOGIC
// ==========================================
export const BroodAmbushExpansion = {
    init: (game) => {
        // 🔌 [EXPANDABILITY] Hook config to the game engine
        game.ambushConfig = AMBUSH_CONFIG;

        game.assets.register('assets/eggtrap_black.png');
        game.assets.register('assets/eggtrap_red.png');
        game.assets.register('assets/broodling_black.png');
        game.assets.register('assets/broodling_red.png');

        game.bus.on('castSpell', (data) => {
            if (data.type === 'ambush') {
                if (game.eco[data.team].dew >= AMBUSH_CONFIG.spellCost) {
                    game.eco[data.team].dew -= AMBUSH_CONFIG.spellCost;
                    
                    game.addEntity(new EggTrap(data.x, data.y, data.team));
                    
                    game.bus.emit('playSound', 'spell');
                    
                    // 🛡️ [FIX] Dynamic colors for whichever team casts it!
                    const magicColor = data.team === 'black' ? '#aa00ff' : '#ff0000';
                    const ringColor = data.team === 'black' ? 'rgba(170, 0, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                    
                    // 🧃 [JUICE] Dirt burrowing visual + Range Indicator Ring!
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#3d2817', count: 15});
                    game.bus.emit('particles', {x: data.x, y: data.y, color: magicColor, count: 10, type: 'magic'});
                    
                    // Flash the trigger ring to the player briefly
                    game.bus.emit('particles', {x: data.x, y: data.y, color: ringColor, count: 1, type: 'ring'});
                }
            }
        });
    }
};
