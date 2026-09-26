// expansions/Hazards.js
import { MathUtils, Spider } from '../game.js';

export class VenusFlytrap {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = 20; this.cooldown = 0;
        this.team = 'nature'; this.hp = 300; this.maxHp = 300;
        this.spriteOpen = new Image(); this.spriteOpen.src = 'assets/flytrap_open.png';
        this.spriteClosed = new Image(); this.spriteClosed.src = 'assets/flytrap_closed.png';
    }
    update(game) {
        if (this.cooldown > 0) { this.cooldown--; return; }
        
        // Look for lunch
        for (let i = 0; i < game.entities.length; i++) {
            let e = game.entities[i];
            if (e instanceof Spider && e.hp > 0) {
                if (MathUtils.distSq(this.x, this.y, e.x, e.y) < 2500) { // 50 radius
                    e.hp -= 200; // Massive damage
                    this.cooldown = 300; // Sleeps for 5 seconds after biting
                    game.bus.emit('particles', {x: this.x, y: this.y, color: '#ff0000', count: 15});
                    game.bus.emit('playSound', 'death');
                    break;
                }
            }
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        const sprite = this.cooldown > 0 ? this.spriteClosed : this.spriteOpen;
        if (sprite.complete && sprite.naturalHeight !== 0) {
            ctx.drawImage(sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            ctx.fillStyle = this.cooldown > 0 ? '#335533' : '#55ff55';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            if (this.cooldown === 0) { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.restore();
    }
}

export const HazardsExpansion = {
    init: (game) => {
        // Spawn flytraps shortly after the map generates
        setTimeout(() => {
            for (let i = 0; i < 20; i++) {
                let x = Math.random() * game.world.width;
                let y = Math.random() * game.world.height;
                if (game.getTerrainAt(x, y) === 'grass') {
                    game.addEntity(new VenusFlytrap(x, y));
                }
            }
        }, 200);
    }
};
