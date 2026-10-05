// expansions/ControlPoints.js
import { MathUtils, Structure } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
const CP_CONFIG = {
    size: 45,
    captureRadius: 350,
    captureRadiusSq: 122500,  // 350^2 precalculated for fast math
    captureSpeed: 0.5,        // Takes ~6 seconds at 30 ticks/sec
    decaySpeed: 0.2,          // Speed at which neutral points decay
    
    // Passive Income Generation
    incomeTickRate: 60,       // Generates resources every 2 seconds
    incomePumpkins: 2,
    incomeDew: 1,
    
    // Dominance Weights (How much each structure contributes to capturing)
    weights: {
        nest: 5,
        turret: 3,
        mortar: 3,
        shrine: 3,
        pylon: 2,
        default: 1
    }
};

const TWO_PI = Math.PI * 2;

// ==========================================
// 2. THE JACK-O'-LANTERN OBJECTIVE
// ==========================================
export class JackOLantern {
    constructor(x, y) {
        this.x = x; this.y = y; 
        this.size = CP_CONFIG.size; 
        this.captureRadius = CP_CONFIG.captureRadius;
        
        this.controllingTeam = null; 
        this.captureProgress = 0; // 0 to 100
        this.age = 0; // Deterministic animation timer
        
        // Sprite will be pulled instantly from RAM cache on Tick 1 of its life
        this.sprite = null;
    }

    update(game) {
        // --- ASSET MANAGER CACHE LINKING ---
        if (!this.sprite && game.assets) {
            this.sprite = game.assets.get('assets/jackolantern.png');
        }

        this.age++;

        // 1. Calculate structural dominance inside the capture radius
        let blackScore = 0;
        let redScore = 0;

        // PERFORMANCE FIX: Cache the getter so we don't run an array filter 60 times a second!
        const structs = game.structures;

        for (let i = 0; i < structs.length; i++) {
            let s = structs[i];
            
            // Fast early exits: Structure must be alive and fully built
            if (s.hp <= 0 || s.isConstructing) continue;
            
            // PERFORMANCE FIX: Fast AABB check skips expensive math for distant buildings
            if (Math.abs(this.x - s.x) > this.captureRadius || Math.abs(this.y - s.y) > this.captureRadius) continue;

            if (MathUtils.distSq(this.x, this.y, s.x, s.y) <= CP_CONFIG.captureRadiusSq) {
                
                // Weight the dominance by structure importance
                let weight = CP_CONFIG.weights[s.type] || CP_CONFIG.weights.default;

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
                this.captureProgress += CP_CONFIG.captureSpeed; 
                
                if (this.captureProgress >= 100) {
                    this.controllingTeam = dominantTeam;
                    this.captureProgress = 100;
                    
                    // JUICE: Massive visual feedback when a point is secured!
                    if (game.triggerShake) game.triggerShake(5); 
                    game.bus.emit('playSound', 'spell');
                    const magicColor = dominantTeam === 'black' ? '#aa00ff' : '#ff0000';
                    game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 50});
                    game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 20});
                }
            }
        } else if (blackScore === 0 && redScore === 0) {
            // Slowly decay capture progress if completely abandoned by all teams
            this.captureProgress = Math.max(0, this.captureProgress - CP_CONFIG.decaySpeed);
            if (this.captureProgress === 0) this.controllingTeam = null;
        }

        // 4. Generate Passive Income for the controlling team
        if (this.controllingTeam && game.tick % CP_CONFIG.incomeTickRate === 0) {
            game.eco[this.controllingTeam].pumpkins += CP_CONFIG.incomePumpkins;
            game.eco[this.controllingTeam].dew += CP_CONFIG.incomeDew;
            
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
        ctx.beginPath(); ctx.arc(0, 0, this.captureRadius, 0, TWO_PI); ctx.stroke();
        ctx.setLineDash([]); // Reset for other draw calls

        // 2. Draw the Jack-O'-Lantern
        if (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            // Fallback Drawing
            ctx.fillStyle = '#cc5500'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, TWO_PI); ctx.fill();
            
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
            ctx.beginPath(); ctx.arc(-10, -13, 4, 0, TWO_PI); ctx.fill();
            ctx.beginPath(); ctx.arc(10, -13, 4, 0, TWO_PI); ctx.fill();
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
// 3. EXPANSION LOGIC
// ==========================================
export const ControlPointsExpansion = {
    init: (game) => {
        game.controlPointsSpawned = false;
        
        // --- ASSET REGISTRY ---
        game.assets.register('assets/jackolantern.png');
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
            // SAFETY FIX: Decouple from UI/Minimap expansions so it doesn't crash if they are missing
            if (game.gameState !== 'playing' || !game.mapGrid || !game.minimap) return;
            
            const size = game.minimap.size; 
            const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - game.minimap.offsetY; 
            
            const scaleX = size / game.world.width; 
            const scaleY = size / game.world.height;
            
            // PERFORMANCE FIX: Replaced .filter().forEach() array allocation with a raw loop!
            for (let i = 0; i < game.entities.length; i++) {
                let j = game.entities[i];
                if (j instanceof JackOLantern) {
                    let color = '#ffff00'; // Uncaptured (Yellow)
                    if (j.controllingTeam === 'black') color = '#aa00ff'; // Obsidian Brood
                    if (j.controllingTeam === 'red') color = '#ff0000';   // Crimson Swarm
                    
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    // Using pre-calculated startX/startY instead of doing the math over and over!
                    ctx.arc(startX + (j.x * scaleX), startY + (j.y * scaleY), 5, 0, TWO_PI);
                    ctx.fill();
                    ctx.strokeStyle = '#000'; 
                    ctx.lineWidth = 1; 
                    ctx.stroke();
                }
            }
        });
    }
};
