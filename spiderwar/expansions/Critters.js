// expansions/Critters.js
import { ResourceNode } from '../game.js';

export class Aphid {
    constructor(x, y) { this.x = x; this.y = y; this.size = 8; this.hp = 30; this.maxHp = 30; this.angle = Math.random() * Math.PI * 2; this.speed = 0.3; this.team = 'nature'; this.color = '#7eff5e'; }
    update(game) {
        if(Math.random() < 0.1) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        if(this.hp <= 0) { game.addEntity(new ResourceNode(this.x, this.y, 'dew')); }
    }
    draw(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle = this.color; ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-2, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
}

export class GoldenBug {
    constructor(x, y) { this.x = x; this.y = y; this.size = 15; this.hp = 250; this.maxHp = 250; this.angle = Math.random() * Math.PI * 2; this.speed = 0.5; this.team = 'nature'; this.color = 'gold';}
    update(game) {
        if(Math.random() < 0.05) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        if(this.hp <= 0) for(let i=0; i<5; i++) game.addEntity(new ResourceNode(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100, 'pumpkin'));
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle = '#ffd700'; 
        ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(this.size/2, -2, 4, 4); ctx.restore();
        if(this.hp < this.maxHp) { ctx.fillStyle='red'; ctx.fillRect(this.x-10, this.y-20, 20, 4); ctx.fillStyle='lime'; ctx.fillRect(this.x-10, this.y-20, 20*(this.hp/this.maxHp), 4); }
    }
}