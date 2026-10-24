// expansions/ControlPoints.js
import { MathUtils, Structure } from '../game.js';

// ==========================================
// 1. CONFIGURATION & BALANCING
// ==========================================
// 🔌 [EXPANDABILITY] Exported so other mods can tweak the point values and capture logic
export const CP_CONFIG = {
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
        this.id = Math.random().toString(36).substring(2, 11);
        this.x = x; this.y = y; 
        this.size = CP_CONFIG.size; 
        this.captureRadius = CP_CONFIG.captureRadius;
        
        this.controllingTeam = null; 
        this.captureProgress = 0; // 0 to 100
        this.isContested = false; // [FIX] Tracks stalemate states
        this.age = parseInt(this.id, 36) % 100; // Deterministic animation offset
        
        this.tethers = []; // 🧃 [JUICE] Stores linked structures for visual beams
        
        // 🚀 [LOGIC FIX] Store the SRC target
        this.spriteSrc = 'assets/jackolantern.png';
        this.sprite = null;
        this.spriteLoaded = false;
    }

    update(game) {
        this.age++;
        this.tethers.length = 0; // Reset visual links every frame

        // 1. Calculate structural dominance inside the capture radius
        let blackScore = 0;
        let redScore = 0;

        // 🚀 [PERFORMANCE] Cache the getter so we don't run an array filter 60 times a second!
        const structs = game.structures;
        const structLen = structs.length;

        for (let i = 0; i < structLen; i++) {
            let s = structs[i];
            
            // Fast early exits: Structure must be alive and fully built
            if (s.hp <= 0 || s.isConstructing) continue;
            
            // Fast AABB check skips expensive math for distant buildings
            if (Math.abs(this.x - s.x) > this.captureRadius || Math.abs(this.y - s.y) > this.captureRadius) continue;

            if (MathUtils.distSq(this.x, this.y, s.x, s.y) <= CP_CONFIG.captureRadiusSq) {
                
                // Weight the dominance by structure importance
                let weight = CP_CONFIG.weights[s.type] || CP_CONFIG.weights.default;

                if (s.team === 'black') blackScore += weight;
                if (s.team === 'red') redScore += weight;
                
                // 🧃 [JUICE] Store reference to draw a magical tether to this building!
                this.tethers.push(s);
            }
        }

        // 2. Determine dominance
        let dominantTeam = null;
        this.isContested = false;
        
        if (blackScore > redScore) dominantTeam = 'black';
        else if (redScore > blackScore) dominantTeam = 'red';
        else if (blackScore > 0 && redScore > 0) this.isContested = true; // [FIX] Detect exact stalemates

        // 3. Capture Logic
        if (dominantTeam) {
            // [FIX] Enemy must neutralize the point first!
            if (this.controllingTeam && this.controllingTeam !== dominantTeam) {
                this.captureProgress = Math.max(0, this.captureProgress - CP_CONFIG.captureSpeed);
                if (this.captureProgress === 0) this.controllingTeam = null;
            } 
            // Build up capture progress (or heal it if returning to a decayed point)
            else if (this.captureProgress < 100) {
                this.captureProgress = Math.min(100, this.captureProgress + CP_CONFIG.captureSpeed);
                
                // Only trigger the massive visual feedback if ownership ACTUALLY changes hands
                if (this.captureProgress >= 100 && this.controllingTeam !== dominantTeam) {
                    this.controllingTeam = dominantTeam;
                    
                    // 🧃 [JUICE] Massive visual feedback when a point is secured!
                    if (game.triggerShake) game.triggerShake(8); 
                    game.bus.emit('playSound', 'spell');
                    const magicColor = dominantTeam === 'black' ? '#aa00ff' : '#ff0000';
                    game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 50});
                    game.bus.emit('particles', {x: this.x, y: this.y, color: '#ffffff', count: 20});
                    
                    // Spawn a ring effect to signify capture wave
                    game.bus.emit('particles', {x: this.x, y: this.y, color: magicColor, count: 1, type: 'ring'});
                    
                    // UI Notification
                    if (game.showSystemMessage) {
                        const teamName = dominantTeam === 'black' ? 'OBSIDIAN BROOD' : 'CRIMSON SWARM';
                        game.showSystemMessage(`${teamName} SECURED A JACK-O'-LANTERN`, magicColor);
                    }
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
            
            // 🧃 [JUICE] Visual indicator of income popping out of the pumpkin
            game.bus.emit('particles', {x: this.x, y: this.y - this.size, color: '#ff9d00', count: 3, type: 'magic'});
        }
    }

    draw(ctx, game) {
        // 🚀 [LOGIC FIX] Pull the preloaded image directly from the RAM Cache!
        if (!this.spriteLoaded && game && game.assets) {
            this.sprite = game.assets.get(this.spriteSrc);
            if (this.sprite) this.spriteLoaded = true;
        }

        ctx.save(); 
        
        // 🧃 [JUICE] Draw magical tethers connecting to capturing structures FIRST (so they render under the pumpkin)
        if (this.tethers.length > 0) {
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = -this.age * 0.5; // Flowing energy effect
            
            for (let i = 0; i < this.tethers.length; i++) {
                let s = this.tethers[i];
                ctx.strokeStyle = s.team === 'black' ? 'rgba(170, 0, 255, 0.4)' : 'rgba(255, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(s.x, s.y);
                ctx.stroke();
            }
            ctx.setLineDash([]); // Reset
        }
        
        // 🧃 [JUICE] Smooth hovering animation
        const floatY = Math.sin(this.age * 0.05) * 4;
        ctx.translate(this.x, this.y + floatY);

        // 1. Draw Capture Radius Ring
        ctx.strokeStyle = 'rgba(255, 157, 0, 0.2)'; // Neutral
        if (this.controllingTeam === 'black') ctx.strokeStyle = 'rgba(170, 0, 255, 0.4)';
        if (this.controllingTeam === 'red') ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
        
        // 🧃 [JUICE] Flash the ring aggressively if the point is actively contested!
        if (this.isContested && this.age % 20 < 10) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        }
        
        ctx.lineWidth = 4;
        ctx.setLineDash([15, 15]);
        ctx.lineDashOffset = -this.age * 0.5; // Deterministic rotating dash effect
        ctx.beginPath(); ctx.arc(0, -floatY, this.captureRadius, 0, TWO_PI); ctx.stroke();
        ctx.setLineDash([]); // Reset for other draw calls

        // 2. Draw the Jack-O'-Lantern
        if (this.spriteLoaded && this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0) {
            // 🧃 [JUICE] Add a dark drop shadow so it pops off the map
            ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
            
            // Aspect Ratio scaling
            const aspect = this.sprite.naturalWidth / this.sprite.naturalHeight;
            const drawH = this.size * 2;
            const drawW = drawH * aspect;
            
            ctx.drawImage(this.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; // Reset
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
        
        // 🔌 [EXPANDABILITY] Export config to the engine
        game.cpConfig = CP_CONFIG;
        
        // --- ASSET REGISTRY ---
        game.assets.register('assets/jackolantern.png');
    },
    
    patch: (game) => {
        // Deterministic Spawning: Hook into game loop
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            // [FIX] Removed fragile this.tick === 1 dependency!
            if (this.gameState === 'playing' && !this.controlPointsSpawned) {
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
            // 🛡️ [FIX] Decouple from UI/Minimap expansions so it doesn't crash if they are missing
            if (game.gameState !== 'playing' || !game.mapGrid || !game.minimap) return;
            
            const size = game.minimap.size; 
            const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - game.minimap.offsetY; 
            
            const scaleX = size / game.world.width; 
            const scaleY = size / game.world.height;
            
            // 🚀 PERFORMANCE FIX: Replaced .filter().forEach() array allocation with a raw loop!
            const entities = game.entities;
            const entLen = entities.length;

            for (let i = 0; i < entLen; i++) {
                let j = entities[i];
                if (j instanceof JackOLantern) {
                    let color = '#ffff00'; // Uncaptured (Yellow)
                    if (j.controllingTeam === 'black') color = '#aa00ff'; // Obsidian Brood
                    if (j.controllingTeam === 'red') color = '#ff0000';   // Crimson Swarm
                    
                    const drawX = startX + (j.x * scaleX);
                    const drawY = startY + (j.y * scaleY);

                    // 🧃 [JUICE] Active capturing pulses on the minimap!
                    if (j.captureProgress > 0 && j.captureProgress < 100) {
                        const pulseRad = 5 + Math.sin(game.tick * 0.2) * 3;
                        ctx.fillStyle = j.isContested ? 'rgba(255,255,255,0.5)' : `rgba(255, 157, 0, 0.5)`;
                        ctx.beginPath(); ctx.arc(drawX, drawY, pulseRad, 0, TWO_PI); ctx.fill();
                    }
                    
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(drawX, drawY, 5, 0, TWO_PI);
                    ctx.fill();
                    ctx.strokeStyle = '#000'; 
                    ctx.lineWidth = 1; 
                    ctx.stroke();
                }
            }
        });
    }
};
