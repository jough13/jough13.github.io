// expansions/Spells.js
import { MathUtils, Spider } from '../game.js';
import { CentipedeBoss } from './Boss.js';

export class Spell {
    constructor(x, y, team, type) { this.x = x; this.y = y; this.team = team; this.type = type; this.life = 600; this.radius = type === 'venomStrike' ? 100 : 150; }
    update(game) {
        this.life--;
        const radSq = this.radius * this.radius;
        for(let i=0; i<game.entities.length; i++) {
            let e = game.entities[i];
            if(e.team && e.team !== this.team && (e instanceof Spider || e instanceof CentipedeBoss)) {
                if(MathUtils.distSq(e.x, e.y, this.x, this.y) < radSq) {
                    if(this.type === 'venomStrike') {
                        if (game.tick % 15 === 0) { e.hp -= 5; game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 2}); }
                    } else if (this.type === 'silkTrap') { e.isSlowed = true; }
                }
            }
        }
    }
    draw(ctx) {
        ctx.globalAlpha = Math.min(this.life / 60, 0.4); 
        if(this.type === 'venomStrike') {
            ctx.fillStyle = '#00ff00'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
            if(Math.random() < 0.2) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x + (Math.random()-0.5)*this.radius, this.y + (Math.random()-0.5)*this.radius, Math.random()*5, 0, Math.PI*2); ctx.fill(); }
        } else {
            ctx.fillStyle = '#ffffff'; ctx.beginPath();
            for(let i=0; i<8; i++) { ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + Math.cos(i * Math.PI/4)*this.radius, this.y + Math.sin(i * Math.PI/4)*this.radius); }
            ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius*0.6, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius*0.3, 0, Math.PI*2); ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }
}

export const SpellExpansion = {
    init: (game) => {
        game.bus.on('castSpell', (data) => {
            const cost = data.type === 'venomStrike' ? 50 : 25; 
            if(game.eco[data.team].dew >= cost) {
                game.eco[data.team].dew -= cost; 
                game.addEntity(new Spell(data.x, data.y, data.team, data.type));
                game.bus.emit('particles', {x: data.x, y: data.y, color: data.type === 'venomStrike' ? '#00ff00' : '#ffffff', count: 100});
                game.bus.emit('playSound', 'spell');
            }
        });
    }
}