// expansions/Particles.js

export class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.life = Math.random() * 30 + 15; this.maxLife = this.life; this.size = Math.random() * 3 + 2;
    }
    update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.9; this.vy *= 0.9; this.life--; }
    draw(ctx) { 
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife); 
        ctx.fillStyle = this.color; 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); 
        ctx.fill(); 
        ctx.globalAlpha = 1.0; 
    }
}

export const ParticleExpansion = {
    init: (game) => {
        game.bus.on('particles', (data) => {
            for(let i=0; i<data.count; i++) {
                let c = data.color; 
                if (c === 'black') c = '#5533aa'; 
                if (c === 'red') c = '#ff2200';
                game.addEntity(new Particle(data.x, data.y, c));
            }
        });
    }
}