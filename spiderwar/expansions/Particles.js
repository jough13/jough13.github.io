// expansions/Particles.js
// ==========================================
// THE OBSIDIAN BROOD PARTICLE ENGINE
// ==========================================

import { MathUtils } from '../game.js';

// 1. CONFIGURATION
const PARTICLE_CONFIG = {
    maxParticles: 2000,    // Hard limit to guarantee 60fps on mobile.
    maxEmitPerCall: 100,   // Safety limit to prevent accidental browser freezes
    defaultFriction: 0.85,
    splatterFriction: 0.60,
    magicFloatSpeed: -1.5,
    gravity: 0.05,         // Subtle pull downwards
    wind: 0.2              // Gentle drift to the right
};

// 2. THE RECYCLABLE PARTICLE
// We use a single class that gets reused to prevent Garbage Collection stutter.
class PooledParticle {
    constructor() {
        this.active = false;
        this.x = 0; this.y = 0;
        this.vx = 0; this.vy = 0;
        this.color = '#fff';
        this.life = 0; this.maxLife = 1;
        this.size = 1; this.maxSize = 1;
        this.type = 'standard';
    }

    // "Awakens" the particle from the pool
    init(x, y, color, type) {
        this.active = true;
        this.x = x; this.y = y; 
        this.color = color;
        this.type = type || 'standard';
        
        const angle = Math.random() * MathUtils.TWO_PI; 
        const speed = Math.random() * 4 + 1;
        
        this.vx = Math.cos(angle) * speed; 
        this.vy = Math.sin(angle) * speed;
        
        // Type-specific overrides
        if (this.type === 'splatter') {
            this.life = Math.random() * 20 + 10;
            this.vx *= 1.5; this.vy *= 1.5; // Fast initial burst
        } else if (this.type === 'magic') {
            this.life = Math.random() * 40 + 20;
            this.vy = (Math.random() * -2) - 0.5; // Drift upwards
            this.vx *= 0.5; // Less horizontal spread
        } else {
            this.life = Math.random() * 30 + 15;
        }

        this.maxLife = this.life; 
        this.size = Math.random() * 4 + 2;
        this.maxSize = this.size;
    }

    update() {
        this.x += this.vx; 
        this.y += this.vy; 
        
        if (this.type === 'splatter') {
            this.vx *= PARTICLE_CONFIG.splatterFriction; 
            this.vy *= PARTICLE_CONFIG.splatterFriction;
            this.vy += PARTICLE_CONFIG.gravity; // Heavy blood/acid falls fast
        } else if (this.type === 'magic') {
            // Magic floats up and is caught by the wind
            this.vy = Math.min(this.vy, PARTICLE_CONFIG.magicFloatSpeed);
            this.x += PARTICLE_CONFIG.wind; 
        } else {
            this.vx *= PARTICLE_CONFIG.defaultFriction; 
            this.vy *= PARTICLE_CONFIG.defaultFriction; 
            this.vy += PARTICLE_CONFIG.gravity; // Standard dirt clods fall slowly
        }

        this.life--;
        if (this.life <= 0) this.active = false;
    }
}

// 3. THE RING-BUFFER OBJECT POOL
class ParticleSystem {
    constructor(maxCount) {
        this.particles = new Array(maxCount);
        for (let i = 0; i < maxCount; i++) {
            this.particles[i] = new PooledParticle();
        }
        this.index = 0; // The write head
    }

    emit(x, y, color, count, type) {
        // SAFETY FIX: Sanitize input and clamp max emission to prevent freezing
        const safeCount = Math.min(parseInt(count) || 1, PARTICLE_CONFIG.maxEmitPerCall);
        
        for (let i = 0; i < safeCount; i++) {
            let p = this.particles[this.index];
            
            // Offset spawn point slightly to create a cloud instead of a single point
            let offsetX = x + (Math.random() - 0.5) * 10;
            let offsetY = y + (Math.random() - 0.5) * 10;
            
            p.init(offsetX, offsetY, color, type);
            
            // Advance the write head. If we hit the max, loop back to 0 and overwrite the oldest particles!
            this.index = (this.index + 1) % this.particles.length;
        }
    }

    update() {
        for (let i = 0; i < this.particles.length; i++) {
            if (this.particles[i].active) {
                this.particles[i].update();
            }
        }
    }

    draw(ctx, viewL, viewR, viewT, viewB) {
        // PERFORMANCE FIX: Massive Canvas API Batching!
        // Instead of setting the color and drawing 2000 individual rectangles, we group the particles
        // into buckets based on their color and alpha, and draw them all in ONE single API call per bucket!
        
        const batches = {};

        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            
            // Strict Viewport Culling! Only process particles actually on the screen.
            if (p.active && p.x >= viewL && p.x <= viewR && p.y >= viewT && p.y <= viewB) {
                
                const lifeRatio = p.life / p.maxLife;
                let currentSize = p.size;
                
                // We quantize the alpha to 10 discrete steps (0.1, 0.2, etc.) to keep the batch map small
                let alphaStep = 1.0; 
                
                if (p.type === 'magic') {
                    // Magic particles shrink to a pinpoint but stay opaque
                    currentSize = Math.max(0.5, p.maxSize * lifeRatio);
                } else {
                    // Standard/Splatter fade out. Multiply by 10, bitwise floor, divide by 10 to quantize!
                    alphaStep = Math.max(0.1, ((lifeRatio * 10) | 0) / 10); 
                }

                const batchKey = `${p.color}_${alphaStep}`;
                if (!batches[batchKey]) batches[batchKey] = { color: p.color, alpha: alphaStep, rects: [] };
                
                // Add this particle's dimensions to the batch
                batches[batchKey].rects.push({ x: p.x - currentSize/2, y: p.y - currentSize/2, s: currentSize });
            }
        }
        
        // Now, execute the batched draw calls!
        for (const key in batches) {
            const batch = batches[key];
            ctx.globalAlpha = batch.alpha;
            ctx.fillStyle = batch.color;
            ctx.beginPath();
            
            for (let i = 0; i < batch.rects.length; i++) {
                const r = batch.rects[i];
                ctx.rect(r.x, r.y, r.s, r.s);
            }
            
            ctx.fill(); // Send the entire batch to the GPU at once
        }
        
        // Clean up the global alpha state for the rest of the game's rendering cycle
        ctx.globalAlpha = 1.0;
    }
}

// 4. THE EXPANSION HOOK
export const ParticleExpansion = {
    init: (game) => {
        game.particleSystem = new ParticleSystem(PARTICLE_CONFIG.maxParticles);

        game.bus.on('particles', (data) => {
            let c = data.color; 
            
            // Lore/Faction Color Translation layer
            if (c === 'black') c = '#aa00ff';       // Obsidian Brood Magic
            else if (c === 'red') c = '#ff2200';    // Crimson Swarm Magic
            else if (c === 'nature') c = '#00ff00'; // Neutral Bug Guts
            
            // Determine type based on source if not explicitly provided
            let type = data.type || 'standard';
            if (c === '#00ff00' || c === '#aaffaa' || c === '#00ffff') type = 'magic'; // Healing/Spells
            if (c === '#ff0000') type = 'splatter'; // Blood
            
            game.particleSystem.emit(data.x, data.y, c, data.count, type);
        });
    },

    patch: (game) => {
        // Detach particle updates from the main entity array for immense performance gains
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            if (this.gameState === 'playing') {
                this.particleSystem.update();
            }
        });

        // Draw particles on the top layer, but safely culled!
        game.bus.on('postDraw', (ctx) => {
            const padding = 50;
            const viewL = game.camera.x - padding;
            const viewR = game.camera.x + game.canvas.width + padding;
            const viewT = game.camera.y - padding;
            const viewB = game.camera.y + game.canvas.height + padding;

            game.particleSystem.draw(ctx, viewL, viewR, viewT, viewB);
        });
    }
};
