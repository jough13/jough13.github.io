// expansions/BroodAmbush.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// [EXPANDABILITY] Exported config so other mods can tweak the trap stats!
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
        
        this.sprite = null;
    }

    update(game) {
        if (!this.sprite && game.assets) {
            this.sprite = game.assets.get(this.team === 'black' ? 'assets/eggtrap_black.png' : 'assets/eggtrap_red.png');
        }

        this.age++;
        
        // 1. Detonation Fuse Phase
        if (this.detonating) {
            this.fuseTimer--;
            
            // [JUICE] Suck in particles while about to explode!
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

        // 3. Detection Phase
        let triggerTarget = game.getNearestEnemy(this.x, this.y, this.team, AMBUSH_CONFIG.triggerRadius);

        if (triggerTarget) {
            // [JUICE] Trigger the "Click" of the mine!
            this.detonating = true;
            this.fuseTimer = AMBUSH_CONFIG.fuseTimer;
            game.bus.emit('playSound', 'ping'); // High pitched warning!
        }
    }

    explode(game) {
        this.hp = 0; // Destroy self
        
        // [JUICE] Heavy Explosion Screen Shake!
        if (game.triggerShake) game.triggerShake(12);
        game.bus.emit('playSound', 'death'); // Viscous pop sound
        
        const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
        game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 40});
        game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 30, type: 'splatter'});
        
        // [PERFORMANCE] Deal Splash Damage using O(1) Spatial Grid instead of checking all entities!
        const CELL_SIZE = 250;
        const cx = Math.max(0, (this.x / CELL_SIZE) | 0);
        const cy = Math.max(0, (this.y / CELL_SIZE) | 0);
        const radiusSq = AMBUSH_CONFIG.splashRadiusSq;

        for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx < 0) continue;
            for (let ny = cy - 1; ny <= cy + 1; ny++) {
                if (ny < 0) continue;
                
                const key = (nx << 16) | ny;
                const cell = game.spatialGrid.get(key);
                if (!cell) continue;

                for (let i = 0; i < cell.length; i++) {
                    let e = cell[i];
                    
                    if (e.team && e.team !== this.team && e.hp !== undefined && e.hp > 0) {
                        // Fast AABB early exit
                        if (Math.abs(this.x - e.x) > AMBUSH_CONFIG.splashRadius || Math.abs(this.y - e.y) > AMBUSH_CONFIG.splashRadius) continue;

                        if (MathUtils.distSq(this.x, this.y, e.x, e.y) < radiusSq) {
                            if (e.role || e.constructor.name === 'CentipedeBoss') {
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
            let bx = this.x + MathUtils.randomRange(-30, 30);
            let by = this.y + MathUtils.randomRange(-30, 30);
            game.addEntity(new Broodling(bx, by, this.team));
        }
    }

    draw(ctx) {
        if (this.team !== 'black') return; // Invisible to enemy team

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // [JUICE] Fuse Detonation Animation
        if (this.detonating) {
            // Swell up rapidly and flash bright white!
            const swell = 1 + (1 - (this.fuseTimer / AMBUSH_CONFIG.fuseTimer)) * 0.5;
            ctx.scale(swell, swell);
            ctx.filter = 'brightness(2.5)';
            ctx.globalAlpha = 1.0;
        } else {
            // Gentle, deterministic pulsating animation based on age
            const pulse = 1 + Math.sin(this.age * 0.1) * 0.08;
            ctx.scale(pulse, pulse);
            ctx.globalAlpha = 0.6; // Slightly ghosted to indicate stealth
        }

        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            ctx.fillStyle = '#dddddd'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = this.team === 'black' ? '#aa00ff' : '#ff0000'; 
            ctx.lineWidth = 2; ctx.stroke();
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
        this.ramSpriteLoaded = false;
        
        // [JUICE] Pop-in scale animation
        this.spawnScale = 0.1;
    }

    update(game) {
        if (!this.ramSpriteLoaded && game.assets) {
            this.sprite = game.assets.get(this.team === 'black' ? 'assets/broodling_black.png' : 'assets/broodling_red.png');
            this.imageLoaded = true; 
            this.ramSpriteLoaded = true;
        }

        // [JUICE] Scale up rapidly on spawn
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

    // [FIX] Pass `game` to draw so the new breathing animations inherit properly!
    draw(ctx, game) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.spawnScale, this.spawnScale);
        ctx.translate(-this.x, -this.y);
        
        // Visual polish: Fade out into ghosts during the last 3 seconds of their life
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
        // [EXPANDABILITY] Hook config
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
                    
                    // [JUICE] Dirt burrowing visual + Range Indicator Ring!
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#3d2817', count: 15});
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#aa00ff', count: 10, type: 'magic'});
                    
                    // Flash the trigger ring to the player briefly
                    game.bus.emit('particles', {x: data.x, y: data.y, color: 'rgba(170, 0, 255, 0.5)', count: 1, type: 'ring'});
                }
            }
        });
    }
};
