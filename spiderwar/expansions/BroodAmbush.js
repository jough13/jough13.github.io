// expansions/BroodAmbush.js
import { MathUtils, Spider } from '../game.js';

// ==========================================
// 1. THE EGG TRAP MINE
// ==========================================
export class EggTrap {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team;
        this.hp = 50; this.maxHp = 50;
        this.size = 14;
        
        this.isCloaked = true; // Leverages the stealth patch so enemies ignore it!
        this.armingTimer = 30; // 1-second incubation before it can detonate
        this.age = 0;          // Used for deterministic pulsing animations
        
        // Sprite will be pulled instantly from RAM cache on Tick 1 of its life
        this.sprite = null;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.sprite) {
            this.sprite = game.assets.get(this.team === 'black' ? 'assets/eggtrap_black.png' : 'assets/eggtrap_red.png');
        }

        this.age++;
        
        // Trap cannot detonate while still incubating
        if (this.armingTimer > 0) {
            this.armingTimer--;
            return; 
        }

        let triggered = false;
        const triggerRadiusSq = 6400; // 80px radius
        
        // 1. Scan for nearby enemies to trigger the detonation
        for (let i = 0; i < game.entities.length; i++) {
            let e = game.entities[i];
            
            // Fast early exits: Exclude dead, allied, or non-targetable entities
            if (!e.team || e.team === this.team || e.hp <= 0) continue;
            
            // Only trigger on Units or Bosses (ignore buildings)
            if (e instanceof Spider || e.constructor.name === 'CentipedeBoss') {
                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < triggerRadiusSq) {
                    triggered = true;
                    break; // Just one enemy is enough to set it off!
                }
            }
        }

        // 2. Detonation Sequence
        if (triggered) {
            this.hp = 0; // Destroy self
            game.bus.emit('playSound', 'death'); // Viscous pop sound
            
            const magicColor = this.team === 'black' ? '#aa00ff' : '#ff0000';
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 30});
            game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 20});
            
            // Deal Splash Damage to EVERYTHING in the radius
            for (let i = 0; i < game.entities.length; i++) {
                let e = game.entities[i];
                
                // FIX: Added e.hp !== undefined check
                if (e.team && e.team !== this.team && e.team !== 'nature' && e.hp !== undefined && e.hp > 0) {
                    if (MathUtils.distSq(this.x, this.y, e.x, e.y) < triggerRadiusSq) {
                        if (e instanceof Spider || e.constructor.name === 'CentipedeBoss') {
                            e.hp -= 40; // High explosive venom damage to units
                        } else {
                            e.hp -= 20; // 50% damage to buildings
                        }
                    }
                }
            }
            
            // Hatch 3 angry Broodlings!
            for (let i = 0; i < 3; i++) {
                let bx = this.x + MathUtils.randomRange(-30, 30);
                let by = this.y + MathUtils.randomRange(-30, 30);
                game.addEntity(new Broodling(bx, by, this.team));
            }
        }
    }

    draw(ctx) {
        // Tactical Stealth: Invisible to the enemy team
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
// 2. THE BABY SWARMER UNIT
// ==========================================
export class Broodling extends Spider {
    constructor(x, y, team) {
        super(x, y, team, 'soldier'); // Inherit aggressive soldier AI targeting
        
        // Override base stats to be a hyper-fast, fragile swarmer
        this.role = 'broodling';
        this.hp = 25; this.maxHp = 25; 
        this.damage = 15; 
        this.baseSpeed = 2.8; 
        this.speed = this.baseSpeed;
        this.size = 7; 
        
        this.life = 600; // Lives for 20 seconds before starving/expiring
        
        this.ramSpriteLoaded = false;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        // Overrides the default Spider() constructor image safely
        if (!this.ramSpriteLoaded) {
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
// 3. EXPANSION LOGIC
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
                const cost = 50;
                if (game.eco[data.team].dew >= cost) {
                    game.eco[data.team].dew -= cost;
                    
                    game.addEntity(new EggTrap(data.x, data.y, data.team));
                    
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ffffff', count: 15});
                }
            }
        });
    }
};
