// expansions/ControlPoints.js
import { MathUtils, Structure } from '../game.js';

// ==========================================
// 1. THE JACK-O'-LANTERN OBJECTIVE
// ==========================================
export class JackOLantern {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.size = 45; 
        this.captureRadius = 350;
        
        this.controllingTeam = null; 
        this.captureProgress = 0; // 0 to 100
        this.age = 0; // Deterministic animation timer
        
        this.spriteLoaded = false;
        this.sprite = new Image();
        this.sprite.onload = () => { this.spriteLoaded = true; };
        this.sprite.src = 'assets/jackolantern.png';
    }

    update(game) {
        this.age++;

        // 1. Calculate structural dominance inside the capture radius
        let blackScore = 0;
        let redScore = 0;
        
        const radiusSq = this.captureRadius * this.captureRadius;

        for (let i = 0; i < game.structures.length; i++) {
            let s = game.structures[i];
            
            // Only count alive, fully constructed structures inside the radius
            if (s.hp > 0 && !s.isConstructing && MathUtils.distSq(this.x, this.y, s.x, s.y) <= radiusSq) {
                
                // Weight the dominance by structure importance
                let weight = 1;
                if (s.type === 'nest') weight = 5;
                if (s.type === 'turret' || s.type === 'mortar' || s.type === 'shrine') weight = 3;
                if (s.type === 'pylon') weight = 2;

                if (s.team === 'black') blackScore += weight;
                if (s.team === 'red') redScore += weight;
            }
        }

        // 2. Determine dominance
        let dominantTeam = null;
        if (blackScore > redScore) dominantTeam = 'black';
        else if (redScore > blackScore) dominantTeam = 'red';

        // 3. Capture Logic
        if (dominantTeam) {
            if (this.controllingTeam !== dominantTeam) {
                this.captureProgress += 0.5; // Takes ~6 seconds at 30 ticks/sec
                
                if (this.captureProgress >= 100) {
                    this.controllingTeam = dominantTeam;
                    this.captureProgress = 100;
                    
                    game.bus.emit('playSound', 'spell');
                    const magicColor = dominantTeam === 'black' ? '#aa00ff' : '#ff0000';
                    game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 50});
                }
            }
        } else if (blackScore === 0 && redScore === 0) {
            // Slowly decay capture progress if completely abandoned by all teams
            this.captureProgress = Math.max(0, this.captureProgress - 0.2);
            if (this.captureProgress === 0) this.controllingTeam = null;
        }

        // 4. Generate Passive Income for the controlling team (Every 2 seconds)
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

        // 1. Draw Capture Radius Ring
        ctx.strokeStyle = 'rgba(255, 157, 0, 0.2)'; // Neutral
        if (this.controllingTeam === 'black') ctx.strokeStyle = 'rgba(170, 0, 255, 0.4)';
        if (this.controllingTeam === 'red') ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
        
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 15]);
        ctx.lineDashOffset = -this.age * 0.5; // Deterministic rotating dash effect
        ctx.beginPath(); ctx.arc(0, 0, this.captureRadius, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); // Reset for other draw calls

        // 2. Draw the Jack-O'-Lantern
        if (this.spriteLoaded) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            // Fallback Drawing
            ctx.fillStyle = '#cc5500'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            
            ctx.fillStyle = '#221100'; // Dark interior
            ctx.beginPath(); ctx.moveTo(-15, -10); ctx.lineTo(-5, -10); ctx.lineTo(-10, -20); ctx.fill(); // Left Eye
            ctx.beginPath(); ctx.moveTo(15, -10); ctx.lineTo(5, -10); ctx.lineTo(10, -20); ctx.fill();  // Right Eye
            ctx.beginPath(); ctx.arc(0, 10, 15, 0, Math.PI); ctx.fill(); // Mouth
        }

        // 3. Draw Glowing Magical Eyes based on faction control
        if (this.controllingTeam) {
            ctx.fillStyle = this.controllingTeam === 'black' ? '#aa00ff' : '#ff0000';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.arc(-10, -13, 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -13, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        // 4. Capture Progress Bar (Only visible while actively capturing)
        if (this.captureProgress > 0 && this.captureProgress < 100) {
            ctx.fillStyle = '#000'; ctx.fillRect(-30, -this.size - 20, 60, 8);
            ctx.fillStyle = '#fff'; ctx.fillRect(-29, -this.size - 19, 58 * (this.captureProgress / 100), 6);
        }

        ctx.restore();
    }
}

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const ControlPointsExpansion = {
    init: (game) => {
        game.controlPointsSpawned = false;
    },
    
    patch: (game) => {
        // Deterministic Spawning: Hook into game loop, wait for Tick 1
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState === 'playing' && this.tick === 1 && !this.controlPointsSpawned) {
                this.controlPointsSpawned = true;
                
                const w = this.world.width;
                const h = this.world.height;
                
                // Classic RTS 5-point layout (Center + 4 corners)
                const points = [
                    {x: w * 0.50, y: h * 0.50}, // Center
                    {x: w * 0.25, y: h * 0.25}, // Top Left
                    {x: w * 0.75, y: h * 0.75}, // Bottom Right
                    {x: w * 0.25, y: h * 0.75}, // Bottom Left
                    {x: w * 0.75, y: h * 0.25}  // Top Right
                ];

                points.forEach(p => {
                    this.addEntity(new JackOLantern(p.x, p.y));
                });
            }
        });

        // Minimap Integration
        game.bus.on('uiDraw', (ctx) => {
            if (game.gameState !== 'playing' || !game.mapGrid) return;
            
            const size = game.minimap.size; 
            const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - game.minimap.offsetY; 
            
            const scaleX = size / game.world.width; 
            const scaleY = size / game.world.height;
            
            // Extract the JackOLanterns cleanly
            const points = game.entities.filter(e => e instanceof JackOLantern);
            
            points.forEach(j => {
                let color = '#ffff00'; // Uncaptured (Yellow)
                if (j.controllingTeam === 'black') color = '#aa00ff'; // Obsidian Brood
                if (j.controllingTeam === 'red') color = '#ff0000';   // Crimson Swarm
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(startX + (j.x * scaleX), startY + (j.y * scaleY), 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#000'; 
                ctx.lineWidth = 1; 
                ctx.stroke();
            });
        });
    }
};
