// --- START OF FILE renderer.js ---

// ==========================================
// RENDERING ENGINE & VISUAL EFFECTS
// ==========================================

const TWO_PI = Math.PI * 2; // Cache this constant for drawing circles (saves CPU cycles)
const HALF_PI = Math.PI / 2;

function updateThemeColors() {
    const style = getComputedStyle(document.documentElement);
    cachedThemeColors = {
        canvasBg: style.getPropertyValue('--canvas-bg').trim(),
        mtnBase: style.getPropertyValue('--mtn-base').trim() || '#57534e',
        mtnShadow: style.getPropertyValue('--mtn-shadow').trim() || '#44403c',
        mtnCap: style.getPropertyValue('--mtn-cap').trim() || '#f9fafb'
    };
}

// --- ADVANCED PARTICLE SYSTEM ---
const ParticleSystem = {
    pool: [],
    activeParticles: [],
    MAX_PARTICLES: 1500, // INCREASED to 1500 to support MMO chaos and massive AoE spells!

    // Initialize the pool
    init: function() {
        for(let i=0; i<this.MAX_PARTICLES; i++) this.pool.push({ active: false });
    },

    spawn: function(x, y, color, type='dust', text='', size=2) {
        if(this.pool.length === 0) return; // Pool empty, skip particle
        
        const p = this.pool.pop(); // Reuse an old particle
        p.active = true;
        p.x = x + 0.5; 
        p.y = y + 0.5;
        p.color = color; 
        p.type = type; 
        p.text = text; 
        p.size = size;
        p.life = 1.0;
        p.friction = 1.0; // Default no friction
        
        if (type === 'text') {
            p.vx = (Math.random() - 0.5) * 0.02; // Slight horizontal drift
            p.vy = -0.03; 
            p.size = 14;
            p.gravity = -0.001; // JUICE: Floats UP and accelerates!
            p.lifeFade = 0.025; 
        } else if (type === 'smoke') {
            p.vx = (Math.random() - 0.5) * 0.02;
            p.vy = -0.02 - (Math.random() * 0.02);
            p.gravity = 0;
            p.lifeFade = 0.015; // Fades slowly
            p.size = Math.random() * 4 + 2;
        } else {
            // 'dust' / 'blood' / 'explosion'
            // JUICE: Explosive radial burst with heavy friction for a "Punchy" feel
            const angle = Math.random() * TWO_PI;
            const speed = Math.random() * 0.3 + 0.1;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.gravity = 0.01;
            p.friction = 0.85; // Slows down rapidly after initial burst
            p.lifeFade = 0.03 + Math.random() * 0.04;
        }
        this.activeParticles.push(p);
    },

    createExplosion: function(x, y, color, count=8) {
        for(let i=0; i<count; i++) this.spawn(x, y, color, 'dust', '', Math.random()*4+2);
    },

    // --- DIRECTIONAL FOOTSTEPS ---
    createFootstep: function(x, y, color, dx, dy, count=4) {
        for(let i=0; i<count; i++) {
            if(this.pool.length === 0) return;
            const p = this.pool.pop();
            p.active = true;
            // Add a tiny bit of random spread to the origin point
            p.x = x + 0.5 + (Math.random() - 0.5) * 0.4; 
            p.y = y + 0.5 + (Math.random() - 0.5) * 0.4;
            p.color = color; 
            p.type = 'dust'; 
            p.text = '';
            p.size = Math.random() * 3 + 1;
            p.life = 1.0;
            
            // Kick dust strictly in the OPPOSITE direction of movement (-dx, -dy)
            const spread = 0.8;
            p.vx = (-dx * 0.08) + (Math.random() - 0.5) * spread * 0.1;
            p.vy = (-dy * 0.08) + (Math.random() - 0.5) * spread * 0.1;
            
            p.gravity = 0; // ZERO GRAVITY! Dust stays on the exact tile it was kicked from
            p.friction = 0.85; 
            p.lifeFade = 0.05 + Math.random() * 0.05; // Fade out rapidly
            this.activeParticles.push(p);
        }
    },

    createFloatingText: function(x, y, text, color) {
        // Add a slight random offset so simultaneous numbers don't overlap perfectly
        const offsetX = (Math.random() - 0.5) * 0.7;
        const offsetY = (Math.random() - 0.5) * 0.7;
        this.spawn(x + offsetX, y + offsetY, color, 'text', text);
    },

    createLevelUp: function(x, y) {
        this.createFloatingText(x, y, "LEVEL UP!", "#facc15");
        for(let i=0; i<30; i++) {
            const colors = ['#facc15', '#ef4444', '#3b82f6', '#22c55e'];
            this.spawn(x, y, colors[Math.floor(Math.random()*colors.length)], 'dust', '', Math.random()*3+2);
        }
    },

    update: function() {
        // JUICE WIN: Calculate global wind once per frame for organic drifting
        const time = performance.now() / 2000;
        const windX = Math.sin(time) * 0.005;

        // PERFORMANCE WIN: Swap-and-Pop Garbage Collection
        // Avoids .splice() array re-indexing which causes V8 CPU stuttering.
        for (let i = 0; i < this.activeParticles.length; i++) {
            const p = this.activeParticles[i];
            
            // Physics
            p.x += p.vx; 
            p.y += p.vy;
            p.vx *= p.friction; // Apply air resistance
            p.vy *= p.friction;
            
            if(p.gravity) p.vy += p.gravity;
            
            // Apply wind drift to smoke and floating text!
            if (p.type === 'smoke' || p.type === 'text') p.x += windX;

            p.life -= p.lifeFade; 
            
            // If the particle is dead...
            if (p.life <= 0) {
                p.active = false;
                this.pool.push(p); // Recycle back to pool
                
                // Swap the dead particle with the LAST particle in the array, then pop it.
                // This is an O(1) operation compared to splice's O(N) operation!
                const lastParticle = this.activeParticles[this.activeParticles.length - 1];
                this.activeParticles[i] = lastParticle;
                this.activeParticles.pop();
                
                // Because we swapped the current index with a new particle from the end,
                // we must decrement 'i' so we don't skip processing the swapped particle!
                i--; 
            }
        }
    },

    draw: function(ctx, startX, startY) {
        // Simple culling bounds
        const minX = -TILE_SIZE;
        const maxX = ctx.canvas.width + TILE_SIZE;
        const minY = -TILE_SIZE;
        const maxY = ctx.canvas.height + TILE_SIZE;

        for(let i=0; i<this.activeParticles.length; i++) {
            const p = this.activeParticles[i];
            const screenX = (p.x - startX) * TILE_SIZE;
            const screenY = (p.y - startY) * TILE_SIZE;

            if (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY) continue;

            const alpha = p.life > 0 ? p.life : 0;

            // PERFORMANCE WIN: Bypassing save/restore matrix pushes for static particles
            if (p.type === 'text') {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                // Pop effect: Scales up slightly as it appears
                const scale = 1 + (Math.sin(p.life * Math.PI) * 0.3);
                ctx.font = `bold ${p.size * scale}px monospace`;
                
                // Draw stroke FIRST (behind the text) for thicker, cleaner outlines
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round'; 
                ctx.strokeText(p.text, screenX, screenY);
                
                ctx.fillText(p.text, screenX, screenY);
                ctx.globalAlpha = 1.0; // Reset manually
            } else if (p.type === 'smoke') {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size * p.life, 0, TWO_PI);
                ctx.fill();
                ctx.globalAlpha = 1.0; // Reset manually
            } else {
                // Dust uses Rotation, which necessitates a fast save/restore matrix shift
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                const currentSize = Math.max(0.5, p.size * p.life);
                // Rotate dust particles based on their X velocity for extra juice
                ctx.translate(screenX, screenY);
                ctx.rotate(p.vx * 10);
                ctx.fillRect(-currentSize/2, -currentSize/2, currentSize, currentSize);
                ctx.restore();
            }
        }
    }
};

ParticleSystem.init();

const TileRenderer = {
    getPseudoRandom: (x, y) => {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    drawBase: (ctx, x, y, color) => {
        ctx.fillStyle = color;
        // Draw slightly larger than 1 tile to prevent hairline seam tearing on sub-pixel zooms
        ctx.fillRect(x * TILE_SIZE - 0.5, y * TILE_SIZE - 0.5, TILE_SIZE + 1, TILE_SIZE + 1);
    },

    // --- DECORATION HELPERS ---
    drawGrassTuft: (ctx, x, y, color) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx + 4, ty + 16); ctx.lineTo(tx + 4, ty + 10);
        ctx.moveTo(tx + 8, ty + 16); ctx.lineTo(tx + 8, ty + 8);
        ctx.moveTo(tx + 12, ty + 16); ctx.lineTo(tx + 12, ty + 11);
        ctx.stroke();
    },

    drawFlower: (ctx, x, y, seedX, seedY) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx + 10, ty + 16); ctx.lineTo(tx + 10, ty + 8); ctx.stroke();
        ctx.fillStyle = (seedX + seedY) % 2 === 0 ? '#f472b6' : '#facc15';
        ctx.beginPath(); ctx.arc(tx + 10, ty + 8, 2.5, 0, TWO_PI); ctx.fill();
    },

    drawPebble: (ctx, x, y, color, seedX, seedY) => {
        const tx = x * TILE_SIZE + (Math.abs(seedX) * 3 % 10) + 2;
        const ty = y * TILE_SIZE + (Math.abs(seedY) * 7 % 10) + 5;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(tx, ty, 2, 0, TWO_PI); ctx.fill();
    },

    drawBone: (ctx, x, y) => {
        const tx = x * TILE_SIZE + 10;
        const ty = y * TILE_SIZE + 10;
        ctx.strokeStyle = '#d4d4d8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 3, ty - 3); ctx.lineTo(tx + 3, ty + 3);
        ctx.moveTo(tx + 3, ty - 3); ctx.lineTo(tx - 3, ty + 3);
        ctx.stroke();
    },

    // --- BIOME RENDERERS ---

    // 🐊 Swamp (Static - Stagnant Muck)
    drawSwamp: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);

        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        ctx.fillStyle = accentColor;
        if (rand > 0.6) ctx.fillRect((x * TILE_SIZE) + 3, (y * TILE_SIZE) + 6, 8, 2);
        if (rand < 0.4) ctx.fillRect((x * TILE_SIZE) + 10, (y * TILE_SIZE) + 14, 6, 2);
        if (rand > 0.9) {
            ctx.beginPath();
            ctx.arc((x * TILE_SIZE) + 15, (y * TILE_SIZE) + 5, 1.5, 0, TWO_PI);
            ctx.fill();
        }
    },

    // 🌲 Procedural Pine Forests (Animated Wind Sway)
    drawForest: (ctx, x, y, mapX, mapY, baseColor) => {
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * TILE_SIZE - 0.5, y * TILE_SIZE - 0.5, TILE_SIZE + 1, TILE_SIZE + 1);

        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        const treeCount = rand > 0.7 ? 2 : 1;

        // Dynamic Wind Calculation
        const time = performance.now() / 1500;
        const windSway = Math.sin(time + mapX * 0.1 + mapY * 0.1) * 1.5;

        for (let i = 0; i < treeCount; i++) {
            const offsetX = (i === 0) ? (TILE_SIZE / 2) : (TILE_SIZE / 2) + ((rand - 0.5) * 10);
            const offsetY = (i === 0) ? (TILE_SIZE) : (TILE_SIZE) - ((rand) * 5);

            const tx = (x * TILE_SIZE) + offsetX;
            const ty = (y * TILE_SIZE) + offsetY;

            const height = (TILE_SIZE * 0.8) + (rand * (TILE_SIZE * 0.4)) - (i * 5);
            const width = height * 0.6;

            // Ground Drop Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(tx, ty, width * 0.4, width * 0.2, 0, 0, TWO_PI);
            ctx.fill();

            // Trunk
            ctx.fillStyle = '#451a03'; 
            ctx.fillRect(tx - 2, ty - (height * 0.2), 4, height * 0.2);

            const treeColor = (rand > 0.95) ? '#b45309' : ((mapX + mapY) % 2 === 0 ? '#166534' : '#15803d');

            // Draw Foliage (With Wind Sway at the top vertex!)
            ctx.fillStyle = treeColor;
            ctx.beginPath();
            ctx.moveTo(tx + windSway, ty - height); // Swaying Top
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2)); 
            ctx.lineTo(tx - (width / 2), ty - (height * 0.2)); 
            ctx.fill();

            // Foliage Shadow (Right side of tree)
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.moveTo(tx + windSway, ty - height);
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2));
            ctx.lineTo(tx, ty - (height * 0.2));
            ctx.fill();
        }
    },

    // ⛰️ Mountain (Gradient Shading)
     drawMountain: (ctx, x, y, mapX, mapY, baseColor, isCave = false) => {
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed); 

        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        TileRenderer.drawBase(ctx, x, y, baseColor);

        // Valley Space
        if (rand > 0.85 && !isCave) {
            ctx.fillStyle = '#44403c'; 
            ctx.beginPath();
            ctx.arc(tx + (TILE_SIZE * 0.3) + (rand * 5), ty + (TILE_SIZE * 0.3) + (rand * 5), 1.5, 0, TWO_PI);
            ctx.fill();
            return; 
        }

        const drawPeak = (offsetX, offsetY, scaleW, scaleH) => {
            const jitterX = (rand - 0.5) * 4;
            const peakX = tx + (TILE_SIZE / 2) + offsetX + jitterX;
            const peakY = ty + (TILE_SIZE * 0.1) + offsetY;
            const width = TILE_SIZE * scaleW;
            const height = TILE_SIZE * scaleH;
            const baseLeft = peakX - (width / 2);
            const baseRight = peakX + (width / 2);
            const baseBottom = ty + TILE_SIZE;

            // Subtle gradient rendering on the lit side of the mountain
            const gradient = ctx.createLinearGradient(peakX, peakY, peakX, baseBottom);
            gradient.addColorStop(0, '#78716c'); // Light peak
            gradient.addColorStop(1, '#57534e'); // Darker base

            // Shadow Side (Right)
            ctx.fillStyle = '#292524';
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(baseRight, baseBottom);
            ctx.lineTo(peakX, baseBottom);
            ctx.fill();

            // Sunlit Side (Left - Now with Gradient)
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(peakX, baseBottom);
            ctx.lineTo(baseLeft, baseBottom);
            ctx.fill();

            // Snow Cap
            if (scaleH > 0.85) {
                const snowLine = peakY + (height * 0.25);
                ctx.fillStyle = '#f3f4f6'; 
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(peakX + (width * 0.2), snowLine + 2);
                ctx.lineTo(peakX, snowLine - 1); 
                ctx.lineTo(peakX - (width * 0.2), snowLine + 2);
                ctx.fill();
            }
        };

        if (rand < 0.45) { drawPeak(0, 0, 1.2, 1.0); }
        else if (rand < 0.75) {
            const side = (rand < 0.60) ? -1 : 1;
            drawPeak(side * 5, 4, 0.7, 0.6);
            drawPeak(0, 0, 1.1, 1.0);
        }
        else {
            drawPeak(-3, 3, 0.7, 0.8);
            drawPeak(4, 5, 0.6, 0.6);
        }
    },

    // . Plains
    drawPlains: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);

        if (rand < 0.02) { 
            TileRenderer.drawFlower(ctx, x, y, mapX, mapY);
        } else if (rand < 0.10) {
            TileRenderer.drawGrassTuft(ctx, x, y, accentColor);
        } else if ((mapX * 123 + mapY * 456) % 11 === 0) { 
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 1;
            const tx = x * TILE_SIZE + TILE_SIZE / 2;
            const ty = y * TILE_SIZE + TILE_SIZE / 2;
            ctx.beginPath(); ctx.moveTo(tx - 2, ty + 2); ctx.lineTo(tx, ty - 2); ctx.lineTo(tx + 2, ty + 2); ctx.stroke();
        }
    },

    // d Deadlands
    drawDeadlands: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);
        if (rand < 0.03) TileRenderer.drawBone(ctx, x, y);
        else if (rand < 0.15) TileRenderer.drawPebble(ctx, x, y, '#52525b', mapX, mapY);
    },

    // D Desert
    drawDesert: (ctx, x, y, mapX, mapY, baseColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);
        if (rand > 0.7) { 
            const tx = x * TILE_SIZE;
            const ty = y * TILE_SIZE;
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(tx + 4, ty + 10); ctx.lineTo(tx + 16, ty + 10); ctx.stroke();
        }
    },

    // 🌊 Water (Animated - Organic Flow + Glints)
    drawWater: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        const time = performance.now() / 2000;
        
        const wavePhase1 = time + (Math.sin(mapX * 0.2) + Math.cos(mapY * 0.2));
        const wavePhase2 = time * 1.5 + (Math.sin(mapX * 0.3) - Math.cos(mapY * 0.3)); 

        ctx.strokeStyle = accentColor;
        
        // Primary Wave
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const yOffset1 = Math.sin(wavePhase1) * 3;
        ctx.moveTo(tx + 2, ty + TILE_SIZE / 2 + yOffset1);
        ctx.bezierCurveTo(tx + 8, ty + TILE_SIZE / 2 + yOffset1 - 2, tx + 12, ty + TILE_SIZE / 2 + yOffset1 + 2, tx + TILE_SIZE - 2, ty + TILE_SIZE / 2 + yOffset1);
        ctx.stroke();

        // Secondary Faint Wave
        ctx.globalAlpha = 0.5; 
        ctx.lineWidth = 1;
        ctx.beginPath();
        const yOffset2 = Math.cos(wavePhase2) * 2 + 4; 
        ctx.moveTo(tx + 4, ty + TILE_SIZE / 2 + yOffset2);
        ctx.bezierCurveTo(tx + 10, ty + TILE_SIZE / 2 + yOffset2 + 2, tx + 14, ty + TILE_SIZE / 2 + yOffset2 - 2, tx + TILE_SIZE - 4, ty + TILE_SIZE / 2 + yOffset2);
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset

        // Sunlight Glints (Sparkles randomly appearing on waves)
        const seed = Math.sin(mapX * 12.98 + mapY * 78.23);
        if (seed > 0.8) {
            // Glint pulses in and out based on time
            const glintAlpha = (Math.sin(time * 5 + mapX) + 1) / 2; 
            ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha * 0.6})`;
            ctx.fillRect(tx + (seed * 10 % TILE_SIZE), ty + (seed * 20 % TILE_SIZE), 2, 2);
        }
    },

    // 🔥 Fire (Animated + Auto Smoke Generation)
    drawFire: (ctx, x, y, baseColor, mapX, mapY) => { 
        TileRenderer.drawBase(ctx, x, y, baseColor || '#451a03'); 

        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE - 2;
        const time = performance.now();
        const flicker = Math.sin(time / 100) * 3;

        // Outer Orange Glow
        ctx.fillStyle = 'rgba(249, 115, 22, 0.4)'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 8 + (flicker * 0.5), 0, TWO_PI); ctx.fill();
        
        // Mid Red Flame
        ctx.fillStyle = '#ef4444'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 4 + (flicker * 0.2), 0, TWO_PI); ctx.fill();
        
        // Inner Yellow Core
        ctx.fillStyle = '#facc15'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 2 + (flicker * 0.1), 0, TWO_PI); ctx.fill();

        // Environmental Smoke Particle Emission
        // Only trigger randomly (approx 2 times per second at 60fps) to save pool space
        if (Math.random() < 0.03 && typeof mapX !== 'undefined') {
            ParticleSystem.spawn(mapX, mapY - 0.2, 'rgba(156, 163, 175, 0.4)', 'smoke');
        }
    },

    // Ω Void Rift (Animated)
    drawVoid: (ctx, x, y) => {
        TileRenderer.drawBase(ctx, x, y, '#000');
        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(performance.now() / 300);
        const size = 6 + (pulse * 2);

        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath(); ctx.arc(tx, ty, size + 4, 0, TWO_PI); ctx.fill();
        
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, size, 0, TWO_PI); ctx.stroke();
        
        ctx.fillStyle = '#581c87';
        ctx.beginPath(); ctx.arc(tx, ty, size / 2, 0, TWO_PI); ctx.fill();
    },

    // 🧱 Enhanced Wall Renderer
    drawWall: (ctx, x, y, baseColor, accentColor, style = 'rough') => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        TileRenderer.drawBase(ctx, x, y, baseColor);
        ctx.fillStyle = accentColor;

        if (style === 'brick') {
            const brickH = TILE_SIZE / 4;
            ctx.fillRect(tx, ty, TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 2, ty, 1, brickH);
            ctx.fillRect(tx, ty + brickH, TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 4, ty + brickH, 1, brickH);
            ctx.fillRect(tx + (TILE_SIZE * 0.75), ty + brickH, 1, brickH);
            ctx.fillRect(tx, ty + (brickH * 2), TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 2, ty + (brickH * 2), 1, brickH);
        } else {
            const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            const rand = seed - Math.floor(seed);

            ctx.fillRect(tx + (rand * 10), ty + (rand * 5), 4, 4);
            ctx.fillRect(tx + ((1 - rand) * 10), ty + ((1 - rand) * 10) + 5, 3, 3);

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(tx, ty + TILE_SIZE - 2, TILE_SIZE, 2); 
        }
    },

    drawTelegraph: (ctx, x, y) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        const alpha = 0.3 + (Math.sin(performance.now() / 150) * 0.15); 

        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#dc2626'; 
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty); ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
        ctx.moveTo(tx + TILE_SIZE, ty); ctx.lineTo(tx, ty + TILE_SIZE);
        ctx.stroke();

        ctx.globalAlpha = 1.0; // Reset for engine
    },

    // 🩸 UI: High-Fidelity Health Bars
    drawHealthBar: (ctx, x, y, current, max) => {
        if (max <= 0 || current >= max) return; 
        
        const percent = Math.max(0, current / max);
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        const barWidth = TILE_SIZE - 2; // Slight padding on sides
        const barHeight = 4;
        const yOffset = TILE_SIZE - barHeight - 1; 

        // PERFORMANCE WIN: Native Drop Shadows (ctx.shadowColor/Blur) are extremely slow.
        // Drawing a black rectangle 1px offset achieves the exact same visual depth instantly.
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; 
        ctx.beginPath(); ctx.roundRect(tx + 2, ty + yOffset + 1, barWidth, barHeight, 2); ctx.fill();

        // Container Pill (Black background)
        ctx.fillStyle = '#111827'; 
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth, barHeight, 2); ctx.fill();

        // Health Fill Color
        let colorTop = '#4ade80'; let colorBot = '#16a34a'; // Green
        if (percent < 0.5) { colorTop = '#fde047'; colorBot = '#ca8a04'; } // Yellow
        if (percent < 0.25) { colorTop = '#f87171'; colorBot = '#dc2626'; } // Red

        // Inner Gradient for a glossy 3D RPG look
        const grad = ctx.createLinearGradient(0, ty + yOffset, 0, ty + yOffset + barHeight);
        grad.addColorStop(0, colorTop);
        grad.addColorStop(1, colorBot);

        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth * percent, barHeight, 2); ctx.fill();

        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth, barHeight, 2); ctx.stroke();
    }
};

// --- PERFORMANCE WIN: GLOBAL LIGHTING CACHE ---
// Prevents recreating expensive radial gradients 60 times a second!
let _cachedGradient = null;
let _cachedGradientParams = "";

// --- HEAVY RENDERING (Only runs when moving) ---
function renderTerrainCache(startX, startY) {
    // Cache calculations
    const padSize = TILE_SIZE * 2;
    const halfTile = TILE_SIZE / 2;
    const paddedWidth = (VIEWPORT_WIDTH + 4) * TILE_SIZE;
    const paddedHeight = (VIEWPORT_HEIGHT + 4) * TILE_SIZE;

    terrainCtx.clearRect(0, 0, paddedWidth, paddedHeight);

    if (!cachedThemeColors.canvasBg) updateThemeColors();
    const { canvasBg } = cachedThemeColors;

    terrainCtx.fillStyle = canvasBg;
    terrainCtx.fillRect(0, 0, paddedWidth, paddedHeight);

    gameState.visibleAnimatedTiles = [];

    terrainCtx.save();
    // Shift down and right to allow drawing at negative coordinates
    terrainCtx.translate(padSize, padSize);

    // Lift heavy dictionary lookups OUT of the 1500 iteration x/y loop!
    let currentCaveThemeObj = null;
    let currentCastleMap = null;
    let currentCaveMap = null;
    let activeMapMode = gameState.mapMode;

    if (activeMapMode === 'dungeon') {
        currentCaveThemeObj = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        currentCaveMap = chunkManager.caveMaps[gameState.currentCaveId];
    } else if (activeMapMode === 'castle') {
        currentCastleMap = chunkManager.castleMaps[gameState.currentCastleId];
    }

    // Resolve emoji-width checking function once
    const isWideCharCheck = typeof isWideChar === 'function' ? isWideChar : (c) => /\p{Extended_Pictographic}/u.test(c);

    // INCREASED loop bounds to match the new +4 buffer
    for (let y = -2; y <= VIEWPORT_HEIGHT + 2; y++) {
        for (let x = -2; x <= VIEWPORT_WIDTH + 2; x++) {
            const mapX = startX + x;
            const mapY = startY + y;

            let tile;
            let fgChar = null;
            let fgColor = '#FFFFFF';
            let bgColor = null;

            // --- RESOLVE TILE TYPE ---
            if (activeMapMode === 'dungeon') {
                tile = (currentCaveMap && currentCaveMap[mapY] && currentCaveMap[mapY][mapX]) ? currentCaveMap[mapY][mapX] : ' ';
                bgColor = currentCaveThemeObj.colors.floor;

                if (tile === currentCaveThemeObj.wall) {
                    TileRenderer.drawWall(terrainCtx, x, y, currentCaveThemeObj.colors.wall, 'rgba(0,0,0,0.2)', 'rough');
                } else if (tile === currentCaveThemeObj.floor) {
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                } else {
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                    fgChar = tile;
                }
            } 
            else if (activeMapMode === 'castle') {
                tile = (currentCastleMap && currentCastleMap[mapY] && currentCastleMap[mapY][mapX]) ? currentCastleMap[mapY][mapX] : ' ';
                
                // Base cobblestone/dark stone floor color
                bgColor = '#44403c'; 

                if (tile === '▓' || tile === '▒') {
                    TileRenderer.drawWall(terrainCtx, x, y, '#78350f', '#451a03', 'brick');
                } else if (tile === 'F') {
                    // Render castle courtyard gardens
                    TileRenderer.drawForest(terrainCtx, x, y, mapX, mapY, '#14532d');
                } else if (tile === '=') {
                    // Render wooden bridges/paths
                    TileRenderer.drawBase(terrainCtx, x, y, '#78350f'); 
                } else if (tile === '.') {
                    // Render standard cobblestone floor
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                } else {
                    // Everything else (NPCs, Exits, Items)
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                    if (tile !== ' ') fgChar = tile;
                }
            } 
            else { // Overworld OR Underworld
                tile = chunkManager.getTile(mapX, mapY);
                
                const cX = Math.floor(mapX / 16);
                const cY = Math.floor(mapY / 16);
                const lX = (mapX % 16 + 16) % 16;
                const lY = (mapY % 16 + 16) % 16;
                const chunkId = `${cX},${cY}`;

                let baseTerrain = '.';
                if (chunkManager.loadedChunks[chunkId] && chunkManager.loadedChunks[chunkId][lY]) {
                    baseTerrain = chunkManager.loadedChunks[chunkId][lY][lX];
                }
                
                if (activeMapMode === 'underworld') {
                    // --- UNDERWORLD COLOR PALETTE ---
                    bgColor = '#0f172a'; // Deep abyss floor
                    if (baseTerrain === '▓') bgColor = '#1e293b'; // Cave Walls
                    else if (baseTerrain === '🌋') bgColor = '#450a0a'; // Magma
                    else if (baseTerrain === '🍄') bgColor = '#4a044e'; // Fungal Floor
                    else if (baseTerrain === '💎c') bgColor = '#083344'; // Crystal Floor
                } else {
                    // --- OVERWORLD COLOR PALETTE ---
                    bgColor = '#22c55e'; // Plains
                    if (baseTerrain === 'F' || baseTerrain === '🌳e') bgColor = '#14532d';
                    else if (baseTerrain === '🌲') bgColor = '#0f766e'; // Tundra Forest
                    else if (baseTerrain === '❄️') bgColor = '#e0f2fe'; // Snow
                    else if (baseTerrain === '🍄') bgColor = '#4a044e'; // Fungal Jungle
                    else if (baseTerrain === '💎c') bgColor = '#083344'; // Crystal Peaks
                    else if (baseTerrain === 'd') bgColor = '#2d2d2d';
                    else if (baseTerrain === 'D') bgColor = '#fde047';
                    else if (baseTerrain === '≈') bgColor = '#422006';
                    else if (baseTerrain === '^' || baseTerrain === '⛰') bgColor = '#57534e';
                    else if (baseTerrain === '~') bgColor = '#1e3a8a';
                    else if (baseTerrain === '🌋') bgColor = '#450a0a';
                }

                TileRenderer.drawBase(terrainCtx, x, y, bgColor);

                // Animation sorting
                if (['~', '≈', '🔥', 'Ω', '👻k'].includes(tile) || (tile === 'D' && gameState.currentCaveTheme === 'FIRE') || (tile === '🌋' && activeMapMode === 'underworld')) {
                    gameState.visibleAnimatedTiles.push({ screenX: x, screenY: y, mapX: mapX, mapY: mapY, tile: tile });
                } else {
                    switch (tile) {
                        case '▓': TileRenderer.drawWall(terrainCtx, x, y, '#1e293b', 'rgba(0,0,0,0.5)', 'rough'); break;
                        case '🍄': fgChar = '🍄'; fgColor = '#d946ef'; break;
                        case '💎c': fgChar = '💎'; fgColor = '#22d3ee'; break;
                        case '🪜': fgChar = '🪜'; fgColor = '#fbbf24'; break;
                        // Overworld defaults...
                        case '.': if(activeMapMode === 'overworld') TileRenderer.drawPlains(terrainCtx, x, y, mapX, mapY, bgColor, '#15803d'); break;
                        case 'F': TileRenderer.drawForest(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '^': TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case 'd': TileRenderer.drawDeadlands(terrainCtx, x, y, mapX, mapY, bgColor, '#444'); break;
                        case 'D': TileRenderer.drawDesert(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '🧱': TileRenderer.drawWall(terrainCtx, x, y, '#78716c', '#57534e'); break;
                        case '▤': 
                        case '=': TileRenderer.drawBase(terrainCtx, x, y, '#78350f'); break;
                        case '+': fgChar = '+'; fgColor = '#fbbf24'; break;
                        case '/': fgChar = '/'; fgColor = '#000'; break;
                        case '🌋': fgChar = '🌋'; break; 
                        default:
                            fgChar = tile;
                            if (window.ENEMY_DATA && window.ENEMY_DATA[tile]) fgColor = window.ENEMY_DATA[tile].color || '#ef4444';
                            break;
                    }
                }
            }

            // Draw Static Character (Items, Objects)
            if (fgChar) {
                if (fgChar === '^' || fgChar === '⛰') {
                    const isCave = (fgChar === '⛰');
                    TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor || '#22c55e', isCave);
                    if (isCave) {
                        terrainCtx.fillStyle = '#1f2937';
                        terrainCtx.fillRect((x * TILE_SIZE) + (TILE_SIZE * 0.4), (y * TILE_SIZE) + (TILE_SIZE * 0.7), TILE_SIZE * 0.2, TILE_SIZE * 0.3);
                    }
                } else {
                    terrainCtx.fillStyle = fgColor;
                    terrainCtx.font = isWideCharCheck(fgChar) ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
                    terrainCtx.fillText(fgChar, x * TILE_SIZE + halfTile, y * TILE_SIZE + halfTile);
                }
            }
        }
    }

    terrainCtx.restore();
}

const render = () => {
    if (!gameState.mapMode) return;

    // --- SETUP ---
    if (!cachedThemeColors.canvasBg) updateThemeColors();
    const { canvasBg } = cachedThemeColors;
    const hasLens = gameState.player.inventory.some(i => i.name === 'Spirit Lens');
    const now = Date.now();

    // 1. Clear & Fill Background
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore(); 

    // --- SCREEN SHAKE ---
    let shakeX = 0; let shakeY = 0;
    if (gameState.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * gameState.screenShake;
        shakeY = (Math.random() - 0.5) * gameState.screenShake;
        gameState.screenShake *= 0.9;
        if (gameState.screenShake < 0.5) gameState.screenShake = 0;
    }

    ctx.save(); // Start Scene Transform
    
    // --- 1. SMOOTH CAMERA MATH ---
    const p = gameState.player;
    const visX = p.visualX !== undefined ? p.visualX : p.x;
    const visY = p.visualY !== undefined ? p.visualY : p.y;

    const viewportCenterX = Math.floor(VIEWPORT_WIDTH / 2);
    const viewportCenterY = Math.floor(VIEWPORT_HEIGHT / 2);
    
    const startX = Math.floor(visX) - viewportCenterX;
    const startY = Math.floor(visY) - viewportCenterY;

    if (gameState.lastStartX !== startX || gameState.lastStartY !== startY) {
        gameState.mapDirty = true;
        gameState.lastStartX = startX;
        gameState.lastStartY = startY;
    }

    const offsetX = (visX - Math.floor(visX)) * TILE_SIZE;
    const offsetY = (visY - Math.floor(visY)) * TILE_SIZE;
    
    ctx.translate(Math.round(shakeX - offsetX), Math.round(shakeY - offsetY));

    // --- 2. UPDATE TERRAIN CACHE ---
    if (gameState.mapDirty) {
        renderTerrainCache(startX, startY);
        gameState.mapDirty = false;
    }

    // --- 3. DRAW CACHED TERRAIN ---
    const dpr = window.devicePixelRatio || 1;
    const logicalW = (VIEWPORT_WIDTH + 4) * TILE_SIZE;
    const logicalH = (VIEWPORT_HEIGHT + 4) * TILE_SIZE;

    ctx.drawImage(terrainCanvas, -(TILE_SIZE * 2), -(TILE_SIZE * 2), logicalW, logicalH);

    // --- EFFICIENT ANIMATED TILE LOOP ---
    if (gameState.visibleAnimatedTiles) {
        gameState.visibleAnimatedTiles.forEach(anim => {
            const { screenX: x, screenY: y, mapX, mapY, tile } = anim;

            if (tile === '👻k') {
                if (hasLens) {
                    // JUICE: Idle Floating for Spirits
                    const floatY = Math.sin(now / 500 + mapX) * 3;
                    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; 
                    ctx.font = `bold ${TILE_SIZE}px monospace`;
                    ctx.fillText('👻', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2 + floatY);
                }
            } 
            else if (tile === '~') {
                const waveVal = (performance.now() / 1500) + (mapX * 0.3) + (mapY * 0.2) + Math.sin(mapY * 0.5);
                let fgChar = Math.sin(waveVal) > 0 ? '~' : '≈';
                ctx.fillStyle = '#3b82f6';
                ctx.font = `bold ${TILE_SIZE}px monospace`;
                ctx.fillText(fgChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            } else if (tile === '🔥' || tile === 'D') {
                const flicker = Math.floor(performance.now() / 100) % 3;
                let fgColor = flicker === 0 ? '#ef4444' : (flicker === 1 ? '#f97316' : '#facc15');
                if (tile === '🔥') {
                    TileRenderer.drawFire(ctx, x, y, null, mapX, mapY);
                } else {
                    ctx.fillStyle = fgColor;
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            } else if (tile === 'Ω') {
                const spin = Math.floor(performance.now() / 150) % 4;
                const chars =['Ω', 'C', 'U', '∩'];
                ctx.fillStyle = '#a855f7';
                ctx.font = `bold ${TILE_SIZE}px monospace`;
                ctx.fillText(chars[spin], x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            }
        });
    }

    // --- ENTITIES & PLAYERS ---
    
    // Attack Telegraphs
    const allEnemies = gameState.mapMode === 'overworld' ? Object.values(gameState.sharedEnemies) : gameState.instancedEnemies;
    if (allEnemies) {
        allEnemies.forEach(enemy => {
            if (enemy.pendingAttacks) {
                enemy.pendingAttacks.forEach(t => {
                    const screenX = t.x - startX;
                    const screenY = t.y - startY;
                    if (screenX >= 0 && screenX < VIEWPORT_WIDTH && screenY >= 0 && screenY < VIEWPORT_HEIGHT) {
                        TileRenderer.drawTelegraph(ctx, screenX, screenY);
                    }
                });
            }
        });
    }

    const drawEntity = (entity, x, y) => {
        if (entity.type === 'spirit' && !hasLens) return;

        const char = entity.tile || '?';
        const isWide = isWideChar(char);

        // JUICE WIN: Idle Breathing Animation!
        const breathOffset = Math.sin(now / 300 + (entity.x * 12.3 + entity.y * 7.1)) * (TILE_SIZE * 0.08);

        if (entity.type === 'spirit') ctx.globalAlpha = 0.6;

        ctx.fillStyle = entity.color || '#ef4444';
        ctx.font = isWide ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
        
        ctx.strokeStyle = '#ef4444'; 
        ctx.lineWidth = 2; 
        ctx.strokeText(char, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2 + breathOffset);
        
        ctx.fillStyle = entity.color || '#ef4444';
        ctx.fillText(char, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2 + breathOffset);
        
        if (entity.type === 'spirit') ctx.globalAlpha = 1.0; 
        
        if (entity.isElite) {
            ctx.strokeStyle = entity.color || '#facc15';
            ctx.lineWidth = 1;
            ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2 + breathOffset, TILE_SIZE - 4, TILE_SIZE - 4);
        }
        
        TileRenderer.drawHealthBar(ctx, x, y, entity.health, entity.maxHealth);
    };

    const lerpEntity = (entity) => {
        if (entity.visualX === undefined) entity.visualX = entity.x;
        if (entity.visualY === undefined) entity.visualY = entity.y;
        
        if (Math.abs(entity.x - entity.visualX) > 2 || Math.abs(entity.y - entity.visualY) > 2) {
            entity.visualX = entity.x;
            entity.visualY = entity.y;
        }

        entity.visualX += (entity.x - entity.visualX) * 0.4;
        entity.visualY += (entity.y - entity.visualY) * 0.4;
        return { vx: entity.visualX, vy: entity.visualY };
    };

    const enemyList = gameState.mapMode === 'overworld' ? Object.values(gameState.sharedEnemies) : gameState.instancedEnemies;
    
    enemyList.forEach(enemy => {
        const { vx, vy } = lerpEntity(enemy);
        const screenX = vx - startX;
        const screenY = vy - startY;
        if (screenX >= -2 && screenX <= VIEWPORT_WIDTH && screenY >= -2 && screenY <= VIEWPORT_HEIGHT) {
            drawEntity(enemy, screenX, screenY);
        }
    });

    if (gameState.mapMode !== 'dungeon') {
        for (const id in otherPlayers) {
            const op = otherPlayers[id];
            if (op.mapMode !== gameState.mapMode || op.mapId !== (gameState.currentCaveId || gameState.currentCastleId)) continue;
            
            const { vx, vy } = lerpEntity(op);
            const screenX = (vx - startX) * TILE_SIZE;
            const screenY = (vy - startY) * TILE_SIZE;
            
            if (screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
                // Idle Breathing for Other Players
                const opBreath = Math.sin(now / 300 + (op.x * 12.3 + op.y * 7.1)) * (TILE_SIZE * 0.08);
                
                ctx.fillStyle = '#f97316';
                ctx.font = `bold ${TILE_SIZE}px monospace`;
                ctx.fillText('@', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2 + opBreath);
                
                if (op.companion) {
                    ctx.fillStyle = '#86efac';
                    ctx.font = `bold ${TILE_SIZE * 0.7}px monospace`;
                    ctx.fillText(op.companion.tile || '?', screenX + TILE_SIZE - 2, screenY + 6 + opBreath);
                }
                
                if (op.chatBubble && Date.now() < op.chatTimer) {
                    ctx.font = `bold 12px monospace`;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    const textWidth = ctx.measureText(op.chatBubble).width;
                    ctx.fillRect(screenX + TILE_SIZE/2 - textWidth/2 - 4, screenY - 20 + opBreath, textWidth + 8, 16);
                    
                    ctx.fillStyle = 'white';
                    ctx.fillText(op.chatBubble, screenX + TILE_SIZE/2, screenY - 12 + opBreath);
                }
            }
        }
    }

    // --- DRAW PLAYER ---
    const playerChar = gameState.player.isSailing ? '⛵' : (gameState.player.isBoating ? 'c' : gameState.player.character);
    ctx.font = `bold ${TILE_SIZE}px monospace`;
    
    // Idle Breathing for Player
    const playerBreath = Math.sin(now / 300 + (p.x * 12.3 + p.y * 7.1)) * (TILE_SIZE * 0.08);
    const pScreenX = (visX - startX) * TILE_SIZE + TILE_SIZE / 2;
    const pScreenY = (visY - startY) * TILE_SIZE + TILE_SIZE / 2 + playerBreath;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(playerChar, pScreenX, pScreenY);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(playerChar, pScreenX, pScreenY);

    if (gameState.player.chatBubble && Date.now() < gameState.player.chatTimer) {
        ctx.font = `bold 12px monospace`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        const textWidth = ctx.measureText(gameState.player.chatBubble).width;
        ctx.fillRect(pScreenX - textWidth/2 - 4, pScreenY - TILE_SIZE - 12, textWidth + 8, 16);
        
        ctx.fillStyle = 'white';
        ctx.fillText(gameState.player.chatBubble, pScreenX, pScreenY - TILE_SIZE - 4);
    }

    // --- UX WIN: AIMING RETICLES ---
    if (gameState.isAiming) {
        const pulse = (Math.sin(now / 150) + 1) / 2;
        ctx.fillStyle = `rgba(234, 179, 8, ${0.4 + pulse * 0.4})`; // Pulsing Yellow
        ctx.font = `bold ${TILE_SIZE}px monospace`;
        
        const purePxX = (visX - startX) * TILE_SIZE + TILE_SIZE / 2;
        const purePxY = (visY - startY) * TILE_SIZE + TILE_SIZE / 2;

        ctx.fillText('✛', purePxX, purePxY - TILE_SIZE); // North
        ctx.fillText('✛', purePxX, purePxY + TILE_SIZE); // South
        ctx.fillText('✛', purePxX + TILE_SIZE, purePxY); // East
        ctx.fillText('✛', purePxX - TILE_SIZE, purePxY); // West
    }

    // --- 4. OPTIMIZED LIGHTING OVERLAY ---
    let ambientLight = 0.0;
    let baseRadius = 10;
    const hasTorch = gameState.player.inventory.some(item => item.name === 'Torch');
    const torchBonus = hasTorch ? 6 : 0;
    const candleBonus = (gameState.player.candlelightTurns > 0) ? 8 : 0;

    if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'underworld') {
        ambientLight = 0.85; 
        baseRadius = 6 + Math.floor(gameState.player.perception / 2) + torchBonus + candleBonus;
    } else { 
        const timeInMinutes = (gameState.time.hour * 60) + gameState.time.minute;
        const timeWave = (Math.cos((timeInMinutes / 1440) * Math.PI * 2) + 1) / 2;
        ambientLight = timeWave * 0.85;
        baseRadius = (ambientLight > 0.3) ? 8 + torchBonus + candleBonus : 25;
    }

    const torchFlicker = (Math.sin(now / 1000) * 0.2) + (Math.cos(now / 2500) * 0.1);
    const lightRadius = baseRadius + torchFlicker;
    const outerDarkness = ambientLight; 

    if (outerDarkness > 0.0) {
        let r = 255, g = 140, b = 0; 
        if (gameState.mapMode === 'dungeon') {
            const themeName = chunkManager.caveThemes[gameState.currentCaveId];
            if (themeName === 'ICE') { r = 100; g = 200; b = 255; }
            if (themeName === 'VOID') { r = 168; g = 85; b = 247; }
        } else if (gameState.mapMode === 'overworld') {
            if (gameState.isBloodMoon) { r = 220; g = 38; b = 38; } 
            else if (gameState.weather === 'storm') { r = 100; g = 100; b = 150; }
        }

        const lightPxRadius = lightRadius * TILE_SIZE;
        const gradKey = `${lightPxRadius.toFixed(1)}_${outerDarkness.toFixed(2)}_${r}_${g}_${b}`;
        
        // PERFORMANCE WIN: Cache Radial Gradient using translation to prevent millions of math calculations!
        if (_cachedGradientParams !== gradKey) {
            _cachedGradient = ctx.createRadialGradient(0, 0, lightPxRadius * 0.2, 0, 0, lightPxRadius);
            _cachedGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
            _cachedGradient.addColorStop(0.5, `rgba(0, 0, 0, ${outerDarkness * 0.6})`);
            _cachedGradient.addColorStop(1, `rgba(0, 0, 0, ${outerDarkness})`);
            _cachedGradientParams = gradKey;
        }

        ctx.save();
        // Shift context to the exact pixel coordinate of the player
        ctx.translate((visX - startX) * TILE_SIZE + TILE_SIZE / 2, (visY - startY) * TILE_SIZE + TILE_SIZE / 2);
        ctx.fillStyle = _cachedGradient;
        
        // Draw the cached gradient infinitely outwards
        // We use VIEWPORT_WIDTH * 2 to guarantee the corners of the screen are covered regardless of player position
        const coverW = VIEWPORT_WIDTH * TILE_SIZE * 2;
        const coverH = VIEWPORT_HEIGHT * TILE_SIZE * 2;
        ctx.fillRect(-coverW, -coverH, coverW * 2, coverH * 2);
        ctx.restore();
    }

    // --- Ambient Fireflies ---
    if (outerDarkness > 0.4 && gameState.mapMode === 'overworld') {
        const centerTile = chunkManager.getTile(p.x, p.y);
        if (centerTile === 'F' || centerTile === '🌳e') {
            if (Math.random() < 0.05 && typeof ParticleSystem !== 'undefined') {
                const fx = p.x + (Math.random() * VIEWPORT_WIDTH) - (VIEWPORT_WIDTH / 2);
                const fy = p.y + (Math.random() * VIEWPORT_HEIGHT) - (VIEWPORT_HEIGHT / 2);
                ParticleSystem.spawn(fx, fy, '#86efac', 'dust', '', 2); 
                
                const activeBug = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length - 1];
                if (activeBug) {
                    activeBug.vy = -0.02 - (Math.random() * 0.02);
                    activeBug.vx = (Math.random() - 0.5) * 0.05;
                    activeBug.gravity = 0;
                    activeBug.lifeFade = 0.01; 
                }
            }
        }
    }

    // --- Weather Layer ---
    const intensity = gameState.player.weatherIntensity || 0;
        if (intensity > 0 && gameState.weather !== 'clear' && gameState.mapMode === 'overworld') {
        ctx.save();
        
        // Disable interpolation completely for weather rendering to ensure lines/flakes render crisply
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.scale(dpr, dpr);
        ctx.globalAlpha = intensity;
        
        if (gameState.weather === 'rain') {
            ctx.fillStyle = 'rgba(0, 0, 100, 0.2)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.strokeStyle = 'rgba(120, 140, 255, 0.6)';
            ctx.lineWidth = 1;
            const dropCount = Math.floor(200 * intensity);
            for (let i = 0; i < dropCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                const len = 10 + Math.random() * 10;
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5, ry + len); ctx.stroke();
            }
        }
        else if (gameState.weather === 'snow') {
            ctx.fillStyle = 'rgba(200, 200, 220, 0.15)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.fillStyle = 'white';
            const flakeCount = Math.floor(150 * intensity);
            for (let i = 0; i < flakeCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                const size = Math.random() * 2 + 1;
                ctx.fillRect(rx, ry, size, size);
            }
        }
        else if (gameState.weather === 'storm') {
            ctx.fillStyle = 'rgba(10, 10, 30, 0.4)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.strokeStyle = 'rgba(150, 150, 255, 0.5)';
            ctx.lineWidth = 2;
            const dropCount = Math.floor(300 * intensity);
            for (let i = 0; i < dropCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 8, ry + 15); ctx.stroke();
            }
            if (Math.random() < 0.05 * intensity) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            }
        }
        else if (gameState.weather === 'fog') {
            ctx.fillStyle = `rgba(200, 200, 200, ${0.5 * intensity})`;
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        }
        ctx.restore();
    }

    // --- Particle Render ---
    if (typeof ParticleSystem !== 'undefined') {
        ParticleSystem.draw(ctx, startX, startY);
    }

    // --- Boss Health Bars ---
    if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'castle') {
        const bosses = gameState.instancedEnemies.filter(e => e.isBoss);
        if (bosses.length > 0) {
            let activeBoss = bosses[0];
            let minDist = Infinity;
            bosses.forEach(b => {
                const d = Math.sqrt(Math.pow(b.x - gameState.player.x, 2) + Math.pow(b.y - gameState.player.y, 2));
                if (d < minDist) {
                    minDist = d;
                    activeBoss = b;
                }
            });
            if (minDist < 20 || bosses.length === 1) {
                // Draw in screen-space regardless of camera
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
                ctx.scale(dpr, dpr);
                
                const barWidth = (canvas.width / dpr) * 0.6;
                const barHeight = 20;
                const barX = ((canvas.width / dpr) - barWidth) / 2;
                const barY = 40;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(barX, barY - 20, barWidth, barHeight + 20);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(activeBoss.name, (canvas.width / dpr) / 2, barY - 5);

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX, barY, barWidth, barHeight);

                const healthPercent = Math.max(0, activeBoss.health / activeBoss.maxHealth);
                ctx.fillStyle = '#dc2626';
                ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * healthPercent, barHeight - 4);

                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
                ctx.fillText(`${activeBoss.health} / ${activeBoss.maxHealth}`, (canvas.width / dpr) / 2, barY + 14);
            }
        }
    }

    // --- JUICE WIN: Visceral Blood Overlay for heavy hits ---
    if (gameState.screenShake > 8) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.scale(dpr, dpr);
        ctx.fillStyle = `rgba(220, 38, 38, ${Math.min(0.3, gameState.screenShake / 50)})`; // Faint Red
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }

    ctx.restore();
};

function syncPlayerState() {
    if (onlinePlayerRef) {
        const stateToSync = {
            x: gameState.player.x,
            y: gameState.player.y,
            health: gameState.player.health,
            maxHealth: gameState.player.maxHealth,
            mapMode: gameState.mapMode,
            mapId: gameState.currentCaveId || gameState.currentCastleId || null,
            email: auth.currentUser.email,
            // Sync Companion Position
            companion: gameState.player.companion ? {
                tile: gameState.player.companion.tile,
                name: gameState.player.companion.name,
                x: gameState.player.companion.x, // Sync X
                y: gameState.player.companion.y  // Sync Y
            } : null
        };
        onlinePlayerRef.set(stateToSync);
    }
}
