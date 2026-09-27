// expansions/BroodAmbush.js
import { MathUtils, Spider } from '../game.js';

// 1. The Invisible Egg Mine
export class EggTrap {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team;
        this.hp = 50; this.size = 14;
        this.isCloaked = true; // Leverages the stealth patch we built in Titans.js so enemies ignore it!
        
        this.sprite = new Image();
        this.sprite.src = team === 'black' ? 'assets/eggtrap_black.png' : 'assets/eggtrap_red.png';
    }
    update(game) {
        let triggered = false;
        
        // Scan for nearby enemies
        for (let i = 0; i < game.entities.length; i++) {
            let e = game.entities[i];
            // If it's an enemy, and it's alive, and it's a unit (Spider or Boss)
            if (e.team && e.team !== this.team && e.hp > 0 && (e instanceof Spider || e.constructor.name === 'CentipedeBoss')) {
                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < 6400) { // 80px trigger radius
                    triggered = true;
                    e.hp -= 40; // Explosion damage
                }
            }
        }

        if (triggered) {
            this.hp = 0; // Detonate
            game.bus.emit('playSound', 'death');
            game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 40});
            
            // Hatch 3 angry Broodlings!
            for (let i = 0; i < 3; i++) {
                let bx = this.x + (Math.random() - 0.5) * 30;
                let by = this.y + (Math.random() - 0.5) * 30;
                game.addEntity(new Broodling(bx, by, this.team));
            }
        }
    }
    draw(ctx) {
        // Only draw the trap if it belongs to the player (Black Team) so they remain invisible to the enemy!
        if (this.team !== 'black') return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Gentle pulsating animation to make it look alive
        const pulse = 1 + Math.sin(performance.now() / 150) * 0.08;
        ctx.scale(pulse, pulse);
        
        ctx.globalAlpha = 0.6; // Slightly ghosted so the player knows it's stealthed

        if (this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            ctx.fillStyle = '#dddddd'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#aa00ff'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
    }
}

// 2. The Baby Swarmer Unit
export class Broodling extends Spider {
    constructor(x, y, team) {
        super(x, y, team, 'soldier'); // Inherit aggressive soldier AI
        this.role = 'broodling';
        this.hp = 25; this.maxHp = 25; // Very fragile
        this.damage = 15; 
        this.baseSpeed = 2.8; // Faster than anything else in the game!
        this.size = 7; // Tiny
        this.life = 600; // Lives for 20 seconds before starving/expiring
        
        this.sprite.src = team === 'black' ? 'assets/broodling_black.png' : 'assets/broodling_red.png';
    }
    update(game) {
        this.life--;
        if (this.life <= 0) {
            this.hp = 0; 
            game.bus.emit('particles', {x: this.x, y: this.y, color: this.team === 'black' ? '#aa00ff' : '#ff0000', count: 10});
        }
        super.update(game);
    }
    draw(ctx) {
        super.draw(ctx);
    }
}

// 3. The Expansion Hook
export const BroodAmbushExpansion = {
    init: (game) => {
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
