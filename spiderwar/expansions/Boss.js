// expansions/Boss.js
import { MathUtils, Spider, Structure } from '../game.js';

export class CentipedeBoss {
    constructor(x, y) {
        this.x = x; this.y = y; this.team = 'nature'; this.hp = 3000; this.maxHp = 3000; this.damage = 50; this.speed = 1.8;
        this.angle = Math.random() * Math.PI*2; this.history = []; this.segmentCount = 15; this.cooldown = 0;
        this.headSprite = new Image(); this.headSprite.src = 'assets/centipede_head.png';
        this.bodySprite = new Image(); this.bodySprite.src = 'assets/centipede_body.png';
    }
    update(game) {
        this.history.unshift({x: this.x, y: this.y, angle: this.angle}); if(this.history.length > this.segmentCount * 5) this.history.pop(); 
        
        let nearest = null; let minDistSq = 800 * 800; 
        for (let i = 0; i < game.entities.length; i++) { 
            let t = game.entities[i];
            if (t instanceof Spider || t instanceof Structure) {
                let dSq = MathUtils.distSq(t.x, t.y, this.x, this.y); 
                if (dSq < minDistSq) { minDistSq = dSq; nearest = t; } 
            }
        }
        
        if (nearest) {
            this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            if (minDistSq > 900) { this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; } 
            else { this.cooldown--; if(this.cooldown <= 0) { nearest.hp -= this.damage; this.cooldown = 20; game.bus.emit('particles', {x: nearest.x, y: nearest.y, color: '#00ff00', count: 10}); game.bus.emit('playSound', 'harvest'); } }
        } else {
            if(Math.random() < 0.05) this.angle += (Math.random() - 0.5);
            this.x += Math.cos(this.angle) * (this.speed * 0.5); this.y += Math.sin(this.angle) * (this.speed * 0.5);
            this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        }
    }
    draw(ctx) {
        for(let i = 1; i < this.segmentCount; i++) {
            let histIndex = i * 4; 
            if(this.history[histIndex]) {
                let pos = this.history[histIndex]; ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(pos.angle);
                if (this.bodySprite.complete && this.bodySprite.naturalHeight !== 0) { ctx.drawImage(this.bodySprite, -15, -15, 30, 30); } 
                else { ctx.fillStyle = i % 2 === 0 ? '#113311' : '#225522'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill(); }
                ctx.restore();
            }
        }
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        if (this.headSprite.complete && this.headSprite.naturalHeight !== 0) { ctx.drawImage(this.headSprite, -20, -20, 40, 40); } 
        else { ctx.fillStyle = '#052205'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(8, -8, 4, 0, Math.PI*2); ctx.arc(8, 8, 4, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
        if(this.hp < this.maxHp) { ctx.fillStyle='black'; ctx.fillRect(this.x-30, this.y-35, 60, 8); ctx.fillStyle='red'; ctx.fillRect(this.x-29, this.y-34, 58, 6); ctx.fillStyle='#00ff00'; ctx.fillRect(this.x-29, this.y-34, 58*(this.hp/this.maxHp), 6); }
    }
}

export const GodUnitExpansion = {
    patch: (game) => {
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            if (this.tick === 10800) { 
                this.addEntity(new CentipedeBoss(this.world.width/2, this.world.height/2));
                this.bus.emit('playSound', 'spell');
            }
        });
    }
};