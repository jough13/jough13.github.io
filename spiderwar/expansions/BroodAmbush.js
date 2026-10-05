// expansions/BroodAmbush.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const AMBUSH_CONFIG = {
    spellCost: 50,
    trapHp: 50,
    armingTimer: 30,              // 1-second incubation before it can detonate
    triggerRadius: 80,            // 80px radius
    triggerRadiusSq: 6400,        // 80^2 for distance checks
    explosionDamageUnit: 40,      // High explosive venom damage to units
    explosionDamageStruct: 20,    // 50% damage to buildings
    broodlingCount: 3,            // Number of babies hatched
    broodlingLife: 600            // 20 seconds of life
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
        
        this.isCloaked = true; // Leverages the stealth patch so enemies ignore it!
        this.armingTimer = AMBUSH_CONFIG.armingTimer; 
        this.age = 0;          // Used for deterministic pulsing animations
        
        // Sprite will be pulled instantly from RAM cache on Tick 1 of its life
        this.sprite = null;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.sprite && game.assets) {
            this.sprite = game.assets.get(this.team === 'black' ? 'assets/eggtrap_black.png' : 'assets/eggtrap_red.png');
        }

        this.age++;
        
        // Trap cannot detonate while still incubating
        if (this.armingTimer > 0) {
            this.armingTimer--;
            return; 
        }

        // PERFORMANCE FIX: Use the zero-allocation Spatial Grid to check for triggers!
        // This prevents the trap from looping through 2000 entities every single frame.
        let triggerTarget = game.getNearestEnemy(this.x, this.y, this.team, AMBUSH_CONFIG.triggerRadius);

        // 2. Detonation Sequence
        if (triggerTarget) {
            this.hp = 0; // Destroy self
            
            // JUICE: Explosion Screen Shake!
            if (game.triggerShake) game.triggerShake(8);
            game.bus.emit('playSound', 'death'); // Viscous pop sound
            
            const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 30});
            game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 20});
            
            // Deal Splash Damage to EVERYTHING in the radius
            for (let i = 0; i < game.entities.length; i++) {
                let e = game.entities[i];
                
                // Deal damage to all non-allied physical entities (including CentipedeBoss!)
                if (e.team && e.team !== this.team && e.hp !== undefined && e.hp > 0) {
                    
                    // Fast AABB check to save CPU
                    if (Math.abs(this.x - e.x) > AMBUSH_CONFIG.triggerRadius || Math.abs(this.y - e.y) > AMBUSH_CONFIG.triggerRadius) continue;

                    if (MathUtils.distSq(this.x, this.y, e.x, e.y) < AMBUSH_CONFIG.triggerRadiusSq) {
                        if (e.role || e.constructor.name === 'CentipedeBoss') {
                            e.hp -= AMBUSH_CONFIG.explosionDamageUnit; 
                        } else {
                            e.hp -= AMBUSH_CONFIG.explosionDamageStruct; 
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
    }

    draw(ctx) {
        // Tactical Stealth: Invisible to the enemy team (The Red AI can't see this anyway, but if you add multiplayer, this hides it!)
        if (this.team !== 'black') return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Gentle, deterministic pulsating animation based on age
        const pulse = 1 + Math.sin(this.age * 0.1) * 0.08;
        ctx.scale(pulse, pulse);
        
        ctx.globalAlpha = 0.6; // Slightly ghosted so the player knows it's stealthed

        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            // Fallback drawing if asset is missing
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
        super(x, y, team, 'soldier'); // Pull base stats
        
        // Override base stats to be a hyper-fast, fragile swarmer
        this.role = 'broodling';
        this.hp = 25; this.maxHp = 25; 
        this.damage = 15; 
        this.baseSpeed = 2.8; 
        this.speed = this.baseSpeed;
        this.size = 7; 
        
        // AI POLISH FIX: Overwrite inherited 'escort' trait so they don't run away to guard the Queen!
        this.traits = ['melee']; 
        
        this.life = AMBUSH_CONFIG.broodlingLife; 
        this.ramSpriteLoaded = false;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.ramSpriteLoaded && game.assets) {
            this.sprite = game.assets.get(this.team === 'black' ? 'assets/broodling_black.png' : 'assets/broodling_red.png');
            this.imageLoaded = true; // Tell base class it's ready to draw
            this.ramSpriteLoaded = true;
        }

        this.life--;
        
        if (this.life <= 0) {
            this.hp = 0; // Natural death
            const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 10});
        }
        
        super.update(game); // Execute normal soldier combat AI
    }

    draw(ctx) {
        // Visual polish: Fade out into ghosts during the last 3 seconds of their life
        if (this.life < 90) { 
            ctx.globalAlpha = Math.max(0, this.life / 90);
        }
        
        super.draw(ctx);
        
        ctx.globalAlpha = 1.0;
    }
}

// ==========================================
// 4. EXPANSION LOGIC
// ==========================================
export const BroodAmbushExpansion = {
    init: (game) => {
        // --- ASSET REGISTRY ---
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
                    // Add a tiny dirt kickup to show the egg "burrowing"
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#3d2817', count: 10});
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ffffff', count: 15});
                }
            }
        });
    }
};
