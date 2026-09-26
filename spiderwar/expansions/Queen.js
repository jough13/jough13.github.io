// expansions/Queen.js
import { MathUtils, Spider } from '../game.js';

export class Queen extends Spider {
    constructor(x, y, team) {
        super(x, y, team);
        this.size = 28; this.baseSpeed = 0.8; this.hp = 2500; this.maxHp = 2500; this.damage = 40; this.commandTarget = null; 
        this.sprite.src = team === 'black' ? 'assets/queen_black.png' : 'assets/queen_red.png';
    }
    update(game) {
        if (this.team === 'red' && !this.commandTarget) {
            const bNests = game.structures.filter(s => s.team === 'black' && s.type === 'nest');
            if(bNests.length > 0) this.commandTarget = { x: bNests[0].x, y: bNests[0].y };
        }
        if (this.commandTarget) {
            const dx = this.commandTarget.x - this.x; const dy = this.commandTarget.y - this.y;
            
            const terrain = game.getTerrainAt(this.x, this.y); let tMod = 1.0;
            if(terrain === 'water') tMod = 0.05; if(terrain === 'grass') tMod = 1.3;

            let techSpeed = (game.techLevel[this.team] * 0.2); 
            if(this.isSlowed) techSpeed -= (this.baseSpeed / 2); 
            const currentSpeed = Math.max(0.1, (this.baseSpeed + techSpeed)) * tMod;

            if (MathUtils.distSq(0,0, dx, dy) > 100) { this.angle = Math.atan2(dy, dx); this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed; } 
            else this.commandTarget = null; 
        }
        this.isSlowed = false; 
    }
    draw(ctx) {
        super.draw(ctx);
        if(this.team === 'black' && this.commandTarget) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.commandTarget.x, this.commandTarget.y); ctx.stroke();
            ctx.setLineDash([]); ctx.beginPath(); ctx.arc(this.commandTarget.x, this.commandTarget.y, 10, 0, Math.PI*2); ctx.stroke();
        }
    }
}

export const QueenExpansion = {
    init: (game) => {
        const spawnInterval = setInterval(() => {
            if(game.queens.length > 0) return clearInterval(spawnInterval);
            const bNest = game.structures.find(s => s.team === 'black' && s.type === 'nest'); 
            const rNest = game.structures.find(s => s.team === 'red' && s.type === 'nest');
            if(bNest && rNest) {
                game.addEntity(new Queen(bNest.x + 50, bNest.y + 50, 'black')); 
                game.addEntity(new Queen(rNest.x - 50, rNest.y - 50, 'red'));
                clearInterval(spawnInterval);
            }
        }, 150);
        game.bus.on('commandQueen', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if(queen) queen.commandTarget = { x: data.x, y: data.y };
        });
    }
};