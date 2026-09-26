// expansions/ControlPoints.js
import { MathUtils, Structure } from '../game.js';

export class JackOLantern {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.size = 45; 
        this.captureRadius = 350;
        this.controllingTeam = null; 
        this.captureProgress = 0; // 0 to 100
        
        // We will try to load a sprite, but fallback to canvas drawing if it's missing
        this.sprite = new Image();
        this.sprite.src = 'assets/jackolantern.png';
    }

    update(game) {
        // 1. Find all structures inside the capture radius
        let blackStructs = 0;
        let redStructs = 0;
        
        for (let i = 0; i < game.structures.length; i++) {
            let s = game.structures[i];
            if (s.hp > 0 && MathUtils.distSq(this.x, this.y, s.x, s.y) <= this.captureRadius ** 2) {
                if (s.team === 'black') blackStructs++;
                if (s.team === 'red') redStructs++;
            }
        }

        // 2. Determine dominance
        let dominantTeam = null;
        if (blackStructs > redStructs) dominantTeam = 'black';
        else if (redStructs > blackStructs) dominantTeam = 'red';

        // 3. Capture Logic
        if (dominantTeam) {
            if (this.controllingTeam !== dominantTeam) {
                this.captureProgress += 0.5; // Takes a few seconds to capture
                if (this.captureProgress >= 100) {
                    this.controllingTeam = dominantTeam;
                    this.captureProgress = 100;
                    game.bus.emit('playSound', 'spell');
                    game.bus.emit('particles', {x: this.x, y: this.y, color: dominantTeam === 'black' ? '#aa00ff' : '#ff0000', count: 50});
                }
            }
        } else if (blackStructs === 0 && redStructs === 0) {
            // Decay capture progress if abandoned
            this.captureProgress = Math.max(0, this.captureProgress - 0.2);
            if (this.captureProgress === 0) this.controllingTeam = null;
        }

        // 4. Generate Passive Income for the controlling team!
        if (this.controllingTeam && game.tick % 60 === 0) {
            game.eco[this.controllingTeam].pumpkins += 2;
            game.eco[this.controllingTeam].dew += 1;
            
            // Visual indicator of income
            game.bus.emit('particles', {x: this.x, y: this.y - this.size, color: '#ff9d00', count: 2});
        }
    }

    draw(ctx) {
        ctx.save(); 
        ctx.translate(this.x, this.y);

        // Draw Capture Radius Ring
        ctx.strokeStyle = 'rgba(255, 157, 0, 0.2)';
        if (this.controllingTeam === 'black') ctx.strokeStyle = 'rgba(170, 0, 255, 0.4)';
        if (this.controllingTeam === 'red') ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 15]);
        ctx.lineDashOffset = -performance.now() / 50; // Rotating dash effect
        ctx.beginPath(); ctx.arc(0, 0, this.captureRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        // Draw the Jack O' Lantern
        if (this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            // Fallback drawing if no sprite exists
            ctx.fillStyle = '#cc5500'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#221100'; // Dark eyes
            ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(-5, -10); ctx.lineTo(-10, -20); ctx.fill();
            ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(5, -10); ctx.lineTo(10, -20); ctx.fill();
            ctx.beginPath(); ctx.arc(0, 10, 15, 0, Math.PI); ctx.fill(); // Mouth
        }

        // Draw Glowing Eyes based on control
        if (this.controllingTeam) {
            ctx.fillStyle = this.controllingTeam === 'black' ? '#aa00ff' : '#ff0000';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(-10, -13, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -13, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Capture Progress Bar
        if (this.captureProgress > 0 && this.captureProgress < 100) {
            ctx.fillStyle = '#000'; ctx.fillRect(-30, -this.size - 20, 60, 8);
            ctx.fillStyle = '#fff'; ctx.fillRect(-29, -this.size - 19, 58 * (this.captureProgress / 100), 6);
        }

        ctx.restore();
    }
}

export const ControlPointsExpansion = {
    init: (game) => {
        // Spawn 5 control points around the map
        setTimeout(() => {
            const w = game.world.width;
            const h = game.world.height;
            const points = [
                {x: w / 2, y: h / 2},           // Center
                {x: w * 0.25, y: h * 0.25},     // Top Left
                {x: w * 0.75, y: h * 0.75},     // Bottom Right
                {x: w * 0.25, y: h * 0.75},     // Bottom Left
                {x: w * 0.75, y: h * 0.25}      // Top Right
            ];

            points.forEach(p => {
                game.addEntity(new JackOLantern(p.x, p.y));
            });
        }, 300);
    },
    
    patch: (game) => {
        // Dynamically add a minimap drawing rule for the Jack O' Lanterns!
        game.bus.on('uiDraw', (ctx) => {
            if (game.gameState !== 'playing' || !game.mapGrid) return;
            
            const size = game.minimap.size; const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - game.minimap.offsetY; 
            const scaleX = size / game.world.width; const scaleY = size / game.world.height;
            
            game.entities.filter(e => e instanceof JackOLantern).forEach(j => {
                let color = '#ffff00'; // Neutral Yellow
                if (j.controllingTeam === 'black') color = '#aa00ff';
                if (j.controllingTeam === 'red') color = '#ff0000';
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(startX + (j.x * scaleX), startY + (j.y * scaleY), 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke();
            });
        });
    }
};
