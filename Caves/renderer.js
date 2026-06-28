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
    MAX_PARTICLES: 1500, // Supports MMO chaos and massive AoE spells

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
            p.vy = -0.04; // Slightly faster initial pop
            p.size = 14;
            p.gravity = -0.0015; // JUICE: Floats UP and accelerates!
            p.lifeFade = 0.025; 
        } else if (type === 'smoke') {
            p.vx = (Math.random() - 0.5) * 0.02;
            p.vy = -0.02 - (Math.random() * 0.02);
            p.gravity = 0;
            p.lifeFade = 0.015; // Fades slowly
            p.size = Math.random() * 4 + 2;
        } else if (type === 'sparkle') {
            // EXPANDABILITY WIN: Magical twinkling particles
            p.vx = (Math.random() - 0.5) * 0.03;
            p.vy = (Math.random() - 0.5) * 0.03;
            p.gravity = -0.005; // Drifts upward
            p.lifeFade = 0.02 + Math.random() * 0.02;
            p.friction = 0.95;
            p.size = Math.random() * 2 + 1;
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
            const colors = ['#facc15', '#ef4444', '#3b82f6', '#22c55e', '#a855f7'];
            this.spawn(x, y, colors[Math.floor(Math.random()*colors.length)], 'dust', '', Math.random()*3+2);
            // Throw in some magical sparkles
            if (i % 3 === 0) this.spawn(x, y, colors[Math.floor(Math.random()*colors.length)], 'sparkle', '', Math.random()*2+1);
        }
    },

    update: function() {
        // JUICE WIN: Calculate global wind once per frame for organic drifting
        const time = performance.now() / 2000;
        const windX = Math.sin(time) * 0.005;

        // PERFORMANCE WIN: Swap-and-Pop Garbage Collection
        for (let i = 0; i < this.activeParticles.length; i++) {
            const p = this.activeParticles[i];
            
            // Physics
            p.x += p.vx; 
            p.y += p.vy;
            p.vx *= p.friction; 
            p.vy *= p.friction;
            
            if(p.gravity) p.vy += p.gravity;
            
            // Apply wind drift to smoke, text, and sparkles!
            if (p.type === 'smoke' || p.type === 'text' || p.type === 'sparkle') p.x += windX;

            p.life -= p.lifeFade; 
            
            if (p.life <= 0) {
                p.active = false;
                this.pool.push(p); 
                
                const lastParticle = this.activeParticles[this.activeParticles.length - 1];
                this.activeParticles[i] = lastParticle;
                this.activeParticles.pop();
                i--; 
            }
        }
    },

    draw: function(ctx, startX, startY) {
        const minX = -TILE_SIZE;
        const maxX = ctx.canvas.width + TILE_SIZE;
        const minY = -TILE_SIZE;
        const maxY = ctx.canvas.height + TILE_SIZE;

        const len = this.activeParticles.length;
        for (let i = 0; i < len; i++) {
            const p = this.activeParticles[i];
            const screenX = ((p.x - startX) * TILE_SIZE) | 0; 
            const screenY = ((p.y - startY) * TILE_SIZE) | 0;

            if (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY) continue;

            const alpha = p.life > 0 ? p.life : 0;

            if (p.type === 'text') {
                ctx.globalAlpha = alpha;
                
                const scale = 1 + (Math.sin(p.life * Math.PI) * 0.3);
                ctx.font = `bold ${(p.size * scale) | 0}px monospace`;
                
                ctx.strokeStyle = 'rgba(0,0,0,0.85)';
                ctx.lineWidth = 3;
                ctx.lineJoin = 'miter';
                ctx.miterLimit = 2; 
                ctx.strokeText(p.text, screenX, screenY);
                
                ctx.fillStyle = p.color;
                ctx.fillText(p.text, screenX, screenY);
                ctx.globalAlpha = 1.0; 
            } else if (p.type === 'smoke') {
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size * p.life, 0, TWO_PI);
                ctx.fill();
                ctx.globalAlpha = 1.0; 
            } else if (p.type === 'sparkle') {
                // JUICE WIN: Twinkling effect via sine wave tied to remaining life
                ctx.globalAlpha = alpha * Math.abs(Math.sin(p.life * 15)); 
                ctx.fillStyle = p.color;
                ctx.fillRect(screenX, screenY, p.size, p.size);
                ctx.globalAlpha = 1.0;
            } else {
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                const currentSize = Math.max(0.5, p.size * p.life);
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
        // Draws slightly larger than 1 tile to prevent hairline seam tearing on sub-pixel zooms
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

    // 🍄 Fungal Jungle (LORE WIN: Beautiful procedural glowing mushrooms)
    drawFungal: (ctx, x, y, mapX, mapY, baseColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
        
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        
        // Draw 1 or 2 mushrooms organically
        const count = rand > 0.5 ? 2 : 1;
        for(let i=0; i<count; i++) {
            const ox = tx + 4 + (rand * 8) + (i * 6);
            const oy = ty + 10 + (rand * 6) - (i * 4);
            
            // Fungal Stalk
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(ox + 2, oy, 2, 6);
            
            // Fungal Cap (Pinkish or Deep Purple)
            ctx.fillStyle = rand > 0.8 ? '#f0abfc' : '#d946ef'; 
            ctx.beginPath();
            ctx.arc(ox + 3, oy, 4, Math.PI, TWO_PI);
            ctx.fill();
            
            // Fungal Ambient Glow
            ctx.fillStyle = 'rgba(217, 70, 239, 0.2)';
            ctx.beginPath();
            ctx.arc(ox + 3, oy, 8, 0, TWO_PI);
            ctx.fill();
        }
    },

    // 💎 Crystal Peaks (LORE WIN: Jagged procedural crystal formations)
    drawCrystal: (ctx, x, y, mapX, mapY, baseColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);
        
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        
        // Crystal Ambient Glow
        ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'; 
        ctx.beginPath();
        ctx.arc(tx + TILE_SIZE/2, ty + TILE_SIZE/2, 10 + (rand * 2), 0, TWO_PI);
        ctx.fill();

        // Jagged Crystal Geometry
        ctx.fillStyle = '#06b6d4'; // Deep cyan
        ctx.beginPath();
        ctx.moveTo(tx + 10, ty + 18);
        ctx.lineTo(tx + 6, ty + 10);
        ctx.lineTo(tx + 10, ty + 2);
        ctx.lineTo(tx + 14, ty + 10);
        ctx.fill();
        
        // Bright edge highlight to sell the crystalline material
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.moveTo(tx + 10, ty + 18);
        ctx.lineTo(tx + 6, ty + 10);
        ctx.lineTo(tx + 10, ty + 2);
        ctx.fill();
    },

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

            // Draw Foliage (With Wind Sway at the top vertex)
            ctx.fillStyle = treeColor;
            ctx.beginPath();
            ctx.moveTo(tx + windSway, ty - height); 
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2)); 
            ctx.lineTo(tx - (width / 2), ty - (height * 0.2)); 
            ctx.fill();

            // Foliage Shadow
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

            const gradient = ctx.createLinearGradient(peakX, peakY, peakX, baseBottom);
            gradient.addColorStop(0, '#78716c'); 
            gradient.addColorStop(1, '#57534e'); 

            // Shadow Side
            ctx.fillStyle = '#292524';
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(baseRight, baseBottom);
            ctx.lineTo(peakX, baseBottom);
            ctx.fill();

            // Sunlit Side
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
        } else if (rand < 0.25) { 
            TileRenderer.drawGrassTuft(ctx, x, y, accentColor);
        } else if ((mapX * 123 + mapY * 456) % 7 === 0) { 
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
    drawWater: (ctx, x, y, mapX, mapY, baseColor, accentColor, isDeep = false) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        const time = performance.now() / (isDeep ? 2500 : 1500);
        
        const wavePhase1 = time + (Math.sin(mapX * 0.2) + Math.cos(mapY * 0.2));
        const wavePhase2 = time * 1.5 + (Math.sin(mapX * 0.3) - Math.cos(mapY * 0.3)); 

        ctx.strokeStyle = accentColor;
        
        // Primary Wave
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const yOffset1 = Math.sin(wavePhase1) * (isDeep ? 4 : 2);
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
        ctx.globalAlpha = 1.0; 

        const seed = Math.sin(mapX * 12.98 + mapY * 78.23);
        if (seed > 0.8) {
            const glintAlpha = (Math.sin(time * 5 + mapX) + 1) / 2; 
            ctx.fillStyle = `rgba(255, 255, 255, ${glintAlpha * 0.6})`;
            ctx.fillRect(tx + (seed * 10 % TILE_SIZE), ty + (seed * 20 % TILE_SIZE), 2, 2);
        }
    },

    // 🔥 Fire
    drawFire: (ctx, x, y, baseColor, mapX, mapY) => { 
        TileRenderer.drawBase(ctx, x, y, baseColor || '#451a03'); 

        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE - 2;
        const time = performance.now();
        const flicker = Math.sin(time / 100) * 3;

        ctx.fillStyle = 'rgba(249, 115, 22, 0.4)'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 8 + (flicker * 0.5), 0, TWO_PI); ctx.fill();
        
        ctx.fillStyle = '#ef4444'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 4 + (flicker * 0.2), 0, TWO_PI); ctx.fill();
        
        ctx.fillStyle = '#facc15'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 2 + (flicker * 0.1), 0, TWO_PI); ctx.fill();

        if (Math.random() < 0.05 && typeof mapX !== 'undefined') {
            ParticleSystem.spawn(mapX, mapY - 0.2, 'rgba(156, 163, 175, 0.4)', 'smoke');
        }
    },

    // Ω Void Rift
    drawVoid: (ctx, x, y, mapX, mapY) => {
        TileRenderer.drawBase(ctx, x, y, '#000');
        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE / 2;
        
        const now = performance.now();
        const pulse = Math.sin(now / 300);
        const size = 6 + (pulse * 2);

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate((now / 500) + (mapX * 0.1)); 

        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath(); ctx.arc(0, 0, size + 4, 0, TWO_PI); ctx.fill();
        
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, size, 0, TWO_PI); ctx.stroke();
        
        ctx.fillStyle = '#581c87';
        ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, TWO_PI); ctx.fill();
        
        ctx.restore();
    },

    // 🧱 Walls
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

        ctx.globalAlpha = 1.0; 
    },

    // 🩸 UI: High-Fidelity Health Bars
    drawHealthBar: (ctx, x, y, current, max) => {
        // Prevent NaN logic crashes on drawing bars for dead/ghost enemies
        const safeMax = max || 1;
        if (safeMax <= 0 || current >= safeMax) return; 
        
        const percent = Math.max(0, current / safeMax);
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        const barWidth = TILE_SIZE - 2; 
        const barHeight = 4;
        const yOffset = TILE_SIZE - barHeight - 1; 

        ctx.fillStyle = 'rgba(0,0,0,0.5)'; 
        ctx.beginPath(); ctx.roundRect(tx + 2, ty + yOffset + 1, barWidth, barHeight, 2); ctx.fill();

        ctx.fillStyle = '#111827'; 
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth, barHeight, 2); ctx.fill();

        let colorTop = '#4ade80'; let colorBot = '#16a34a'; // Green
        if (percent < 0.5) { colorTop = '#fde047'; colorBot = '#ca8a04'; } // Yellow
        if (percent < 0.25) { colorTop = '#f87171'; colorBot = '#dc2626'; } // Red

        const grad = ctx.createLinearGradient(0, ty + yOffset, 0, ty + yOffset + barHeight);
        grad.addColorStop(0, colorTop);
        grad.addColorStop(1, colorBot);

        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth * percent, barHeight, 2); ctx.fill();

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth, barHeight, 2); ctx.stroke();
    },

    // JUICE WIN: Dynamic Drop Shadows
    drawShadow: (ctx, x, y) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE - 3, TILE_SIZE / 3, TILE_SIZE / 6, 0, 0, TWO_PI);
        ctx.fill();
    }
};

// --- PERFORMANCE WIN: GLOBAL LIGHTING CACHE ---
let _cachedGradient = null;
let _cachedGradientParams = "";

// --- HEAVY RENDERING (Only runs when moving) ---
function renderTerrainCache(startX, startY) {
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
    terrainCtx.translate(padSize, padSize);

    let currentCaveThemeObj = null;
    let currentCastleMap = null;
    let currentCaveMap = null;
    let activeMapMode = gameState.mapMode;

    if (activeMapMode === 'dungeon') {
        // BUG FIX: Provide robust fallback if colors aren't defined in the theme object
        currentCaveThemeObj = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
        if (!currentCaveThemeObj.colors) {
            currentCaveThemeObj.colors = { floor: '#000', wall: '#333' };
        }
        currentCaveMap = chunkManager.caveMaps[gameState.currentCaveId];
    } else if (activeMapMode === 'castle') {
        currentCastleMap = chunkManager.castleMaps[gameState.currentCastleId];
    }

    const isWideCharCheck = typeof isWideChar === 'function' ? isWideChar : (c) => /\p{Extended_Pictographic}/u.test(c);

    for (let y = -2; y <= VIEWPORT_HEIGHT + 2; y++) {
        for (let x = -2; x <= VIEWPORT_WIDTH + 2; x++) {
            const mapX = startX + x;
            const mapY = startY + y;

            let tile;
            let fgChar = null;
            let fgColor = '#FFFFFF';
            let bgColor = null;

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
                bgColor = '#44403c'; 

                if (tile === '▓' || tile === '▒') {
                    TileRenderer.drawWall(terrainCtx, x, y, '#78350f', '#451a03', 'brick');
                } else if (tile === 'F') {
                    TileRenderer.drawForest(terrainCtx, x, y, mapX, mapY, '#14532d');
                } else if (tile === '=') {
                    TileRenderer.drawBase(terrainCtx, x, y, '#78350f'); 
                } else if (tile === '.') {
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                } else {
                    TileRenderer.drawBase(terrainCtx, x, y, bgColor);
                    if (tile !== ' ') fgChar = tile;
                }
            } 
            else { 
                // Calculate the chunk coordinates ONCE and use them for both lookups!
                // PERFORMANCE WIN: Math.trunc is identical to floor for positive, faster in some V8 paths. We stick to floor to handle negatives correctly.
                const cX = Math.floor(mapX / 16);
                const cY = Math.floor(mapY / 16);
                const lX = ((mapX % 16) + 16) % 16;
                const lY = ((mapY % 16) + 16) % 16;
                const chunkId = `${cX},${cY}`;
                const tileKey = `${lX},${lY}`;

                let baseTerrain = '.';
                if (chunkManager.loadedChunks[chunkId] && chunkManager.loadedChunks[chunkId][lY]) {
                    baseTerrain = chunkManager.loadedChunks[chunkId][lY][lX];
                }

                tile = baseTerrain;
                if (chunkManager.worldState[chunkId] && chunkManager.worldState[chunkId][tileKey] !== undefined) {
                    const val = chunkManager.worldState[chunkId][tileKey];
                    tile = (typeof val === 'object' && val !== null) ? val.t : val;
                }
                
                if (activeMapMode === 'underworld') {
                    bgColor = '#0f172a'; 
                    if (baseTerrain === '▓') bgColor = '#1e293b'; 
                    else if (baseTerrain === '🌋') bgColor = '#450a0a'; 
                    else if (baseTerrain === '🍄') bgColor = '#4a044e'; 
                    else if (baseTerrain === '💎c') bgColor = '#083344'; 
                } else {
                     bgColor = '#22c55e'; 
                    // Use 'tile' instead of 'baseTerrain' so worldState overrides (like Player built camps) get the correct background!
                    if (tile === 'F' || tile === '🌳e' || tile === '🌳' || tile === '🌲' || tile === '🌺') bgColor = '#14532d';
                    else if (tile === '❄️') bgColor = '#e0f2fe';
                    else if (tile === '🍄') bgColor = '#4a044e'; 
                    else if (tile === '💎c') bgColor = '#083344'; 
                    else if (tile === 'd') bgColor = '#2d2d2d';
                    else if (tile === 'D') bgColor = '#fde047';
                    else if (tile === '≈') bgColor = '#422006';
                    else if (tile === '^' || tile === '⛰') bgColor = '#57534e';
                    else if (tile === '~') bgColor = '#1e3a8a';
                    else if (tile === '🌋') bgColor = '#450a0a';
                    else if (baseTerrain === 'F' || baseTerrain === '🌳e' || baseTerrain === '🌳' || baseTerrain === '🌲' || baseTerrain === '🌺') bgColor = '#14532d';
                    else if (baseTerrain === 'd') bgColor = '#2d2d2d';
                    else if (baseTerrain === 'D') bgColor = '#fde047';
                    else if (baseTerrain === '^') bgColor = '#57534e';
                }

                TileRenderer.drawBase(terrainCtx, x, y, bgColor);

                // Add mystical components to animated loop so we can attach custom particle emitters
                if (['~', '≈', '🔥', 'Ω', '👻k', '#', '✨'].includes(tile) || (tile === 'D' && gameState.currentCaveTheme === 'FIRE') || (tile === '🌋' && activeMapMode === 'underworld')) {
                    gameState.visibleAnimatedTiles.push({ screenX: x, screenY: y, mapX: mapX, mapY: mapY, tile: tile });
                }

                // If not an animated tile, do static rendering
                if (!['~', '≈', '🔥', 'Ω'].includes(tile) && !(tile === 'D' && gameState.currentCaveTheme === 'FIRE')) {
                    switch (tile) {
                        case '▓': TileRenderer.drawWall(terrainCtx, x, y, '#1e293b', 'rgba(0,0,0,0.5)', 'rough'); break;
                        case '🍄': TileRenderer.drawFungal(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '💎c': TileRenderer.drawCrystal(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '🪜': fgChar = '🪜'; fgColor = '#fbbf24'; break;
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

    ctx.save(); 
    
    // --- 1. SMOOTH CAMERA MATH ---
    const p = gameState.player;
    const visX = p.visualX !== undefined ? p.visualX : p.x;
    const visY = p.visualY !== undefined ? p.visualY : p.y;

    const viewportCenterX = Math.trunc(VIEWPORT_WIDTH / 2);
    const viewportCenterY = Math.trunc(VIEWPORT_HEIGHT / 2);
    
    const startX = Math.trunc(visX) - viewportCenterX;
    const startY = Math.trunc(visY) - viewportCenterY;

    if (gameState.lastStartX !== startX || gameState.lastStartY !== startY) {
        gameState.mapDirty = true;
        gameState.lastStartX = startX;
        gameState.lastStartY = startY;
    }

    // Smooth panning offset
    const offsetX = (visX - Math.trunc(visX)) * TILE_SIZE;
    const offsetY = (visY - Math.trunc(visY)) * TILE_SIZE;
    
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
        const len = gameState.visibleAnimatedTiles.length;
        for (let i = 0; i < len; i++) {
            const anim = gameState.visibleAnimatedTiles[i];
            const x = anim.screenX;
            const y = anim.screenY;
            const mapX = anim.mapX;
            const mapY = anim.mapY;
            const tile = anim.tile;

            if (tile === '👻k') {
                if (hasLens) {
                    const floatY = Math.sin(now / 500 + mapX) * 3;
                    TileRenderer.drawShadow(ctx, x, y); 
                    ctx.fillStyle = 'rgba(168, 85, 247, 0.6)'; 
                    ctx.font = `bold ${TILE_SIZE}px monospace`;
                    ctx.fillText('👻', x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2 + floatY);
                }
            } 
            else if (tile === '~' || tile === '≈') {
                const isDeep = tile === '~';
                TileRenderer.drawWater(ctx, x, y, mapX, mapY, isDeep ? '#1e3a8a' : '#422006', isDeep ? '#3b82f6' : '#16a34a', isDeep);
            } else if (tile === '🔥' || tile === 'D') {
                const flicker = ((now / 100) | 0) % 3;
                let fgColor = flicker === 0 ? '#ef4444' : (flicker === 1 ? '#f97316' : '#facc15');
                if (tile === '🔥') {
                    TileRenderer.drawFire(ctx, x, y, null, mapX, mapY);
                } else {
                    ctx.fillStyle = fgColor;
                    ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            } else if (tile === 'Ω') {
                TileRenderer.drawVoid(ctx, x, y, mapX, mapY);
            } else if (tile === '#' || tile === '✨') {
                // LORE WIN: Waystones and Loot passively draw the eye by emitting sparkles!
                if (Math.random() < 0.03 && typeof ParticleSystem !== 'undefined') {
                    const sparkColor = tile === '#' ? '#a855f7' : '#facc15';
                    ParticleSystem.spawn(mapX, mapY, sparkColor, 'sparkle', '', 2);
                }
                ctx.fillStyle = tile === '#' ? '#a855f7' : '#facc15';
                ctx.font = `bold ${TILE_SIZE}px monospace`;
                ctx.fillText(tile, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            }
        }
    }

    // --- ENTITIES & PLAYERS ---
    
    // Attack Telegraphs
    if (gameState.mapMode === 'overworld') {
        for (const key in gameState.sharedEnemies) {
            const enemy = gameState.sharedEnemies[key];
            if (enemy.pendingAttacks) {
                for (let j = 0; j < enemy.pendingAttacks.length; j++) {
                    const t = enemy.pendingAttacks[j];
                    const screenX = t.x - startX;
                    const screenY = t.y - startY;
                    if (screenX >= 0 && screenX < VIEWPORT_WIDTH && screenY >= 0 && screenY < VIEWPORT_HEIGHT) {
                        TileRenderer.drawTelegraph(ctx, screenX, screenY);
                    }
                }
            }
        }
    } else if (gameState.instancedEnemies) {
        const len = gameState.instancedEnemies.length;
        for (let i = 0; i < len; i++) {
            const enemy = gameState.instancedEnemies[i];
            if (enemy.pendingAttacks) {
                for (let j = 0; j < enemy.pendingAttacks.length; j++) {
                    const t = enemy.pendingAttacks[j];
                    const screenX = t.x - startX;
                    const screenY = t.y - startY;
                    if (screenX >= 0 && screenX < VIEWPORT_WIDTH && screenY >= 0 && screenY < VIEWPORT_HEIGHT) {
                        TileRenderer.drawTelegraph(ctx, screenX, screenY);
                    }
                }
            }
        }
    }

    const drawEntity = (entity, x, y) => {
        if (entity.type === 'spirit' && !hasLens) return;

        const char = entity.tile || '?';
        const isWide = isWideChar(char);
        const breathOffset = Math.sin(now / 300 + (entity.x * 12.3 + entity.y * 7.1)) * (TILE_SIZE * 0.08);

        if (entity.type === 'spirit') ctx.globalAlpha = 0.6;

        if (entity.type !== 'spirit') TileRenderer.drawShadow(ctx, x, y);

        ctx.fillStyle = entity.color || '#ef4444';
        ctx.font = isWide ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
        
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = 3; 
        ctx.lineJoin = 'round';
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

    if (gameState.mapMode === 'overworld') {
        for (const key in gameState.sharedEnemies) {
            const enemy = gameState.sharedEnemies[key];
            const { vx, vy } = lerpEntity(enemy);
            const screenX = vx - startX;
            const screenY = vy - startY;
            if (screenX >= -2 && screenX <= VIEWPORT_WIDTH && screenY >= -2 && screenY <= VIEWPORT_HEIGHT) {
                drawEntity(enemy, screenX, screenY);
            }
        }
    } else if (gameState.instancedEnemies) {
        const len = gameState.instancedEnemies.length;
        for (let i = 0; i < len; i++) {
            const enemy = gameState.instancedEnemies[i];
            const { vx, vy } = lerpEntity(enemy);
            const screenX = vx - startX;
            const screenY = vy - startY;
            if (screenX >= -2 && screenX <= VIEWPORT_WIDTH && screenY >= -2 && screenY <= VIEWPORT_HEIGHT) {
                drawEntity(enemy, screenX, screenY);
            }
        }
    }

    if (gameState.mapMode !== 'dungeon') {
        const opKeys = Object.keys(otherPlayers);
        for (let i = 0; i < opKeys.length; i++) {
            const op = otherPlayers[opKeys[i]];
            if (op.mapMode !== gameState.mapMode || op.mapId !== (gameState.currentCaveId || gameState.currentCastleId)) continue;
            
            const { vx, vy } = lerpEntity(op);
            const screenX = (vx - startX) * TILE_SIZE;
            const screenY = (vy - startY) * TILE_SIZE;
            
            if (screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
                const opBreath = Math.sin(now / 300 + (op.x * 12.3 + op.y * 7.1)) * (TILE_SIZE * 0.08);
                
                TileRenderer.drawShadow(ctx, vx - startX, vy - startY);
                
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

    // --- DRAW PLAYER & MOUNTS ---
    const playerChar = gameState.player.isSailing ? '⛵' : (gameState.player.isBoating ? 'c' : gameState.player.character);
    
    const playerBreath = Math.sin(now / 300 + (p.x * 12.3 + p.y * 7.1)) * (TILE_SIZE * 0.08);
    const pScreenX = (visX - startX) * TILE_SIZE + TILE_SIZE / 2;
    const pScreenY = (visY - startY) * TILE_SIZE + TILE_SIZE / 2 + playerBreath;

    TileRenderer.drawShadow(ctx, visX - startX, visY - startY);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    const isStealthy = gameState.player.stealthTurns > 0;
    if (isStealthy) ctx.globalAlpha = 0.4;

    if (gameState.player.isMounted && gameState.player.companion) {
        ctx.font = `bold ${TILE_SIZE}px monospace`;
        ctx.strokeText(gameState.player.companion.tile, pScreenX, pScreenY);
        ctx.fillStyle = '#ffffff'; 
        ctx.fillText(gameState.player.companion.tile, pScreenX, pScreenY);

        ctx.font = `bold ${(TILE_SIZE * 0.6) | 0}px monospace`;
        ctx.strokeText(playerChar, pScreenX, pScreenY - (TILE_SIZE * 0.35));
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(playerChar, pScreenX, pScreenY - (TILE_SIZE * 0.35));
    } else {
        ctx.font = `bold ${TILE_SIZE}px monospace`;
        ctx.strokeText(playerChar, pScreenX, pScreenY);
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(playerChar, pScreenX, pScreenY);
    }

    if (isStealthy) ctx.globalAlpha = 1.0;

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
        ctx.fillStyle = `rgba(234, 179, 8, ${0.4 + pulse * 0.4})`; 
        ctx.font = `bold ${TILE_SIZE}px monospace`;
        
        const purePxX = (visX - startX) * TILE_SIZE + TILE_SIZE / 2;
        const purePxY = (visY - startY) * TILE_SIZE + TILE_SIZE / 2;

        ctx.fillText('✛', purePxX, purePxY - TILE_SIZE); 
        ctx.fillText('✛', purePxX, purePxY + TILE_SIZE); 
        ctx.fillText('✛', purePxX + TILE_SIZE, purePxY); 
        ctx.fillText('✛', purePxX - TILE_SIZE, purePxY); 
    }

    // --- 4. OPTIMIZED LIGHTING OVERLAY ---
    let ambientLight = 0.0;
    let baseRadius = 10;
    const hasTorch = gameState.player.inventory.some(item => item.name === 'Torch');
    const torchBonus = hasTorch ? 6 : 0;
    const candleBonus = (gameState.player.candlelightTurns > 0) ? 8 : 0;

    let r = 255, g = 140, b = 0; 

    if (gameState.mapMode === 'dungeon' || gameState.mapMode === 'underworld') {
        ambientLight = 0.85; 
        baseRadius = 6 + Math.floor(gameState.player.perception / 2) + torchBonus + candleBonus;
        
        const themeName = chunkManager.caveThemes[gameState.currentCaveId];
        if (themeName === 'ICE') { r = 100; g = 200; b = 255; }
        else if (themeName === 'VOID' || gameState.mapMode === 'underworld') { 
            r = 168; g = 85; b = 247; 
            // VOID PULSE: The darkness breathes organically
            ambientLight = 0.85 + (Math.sin(now / 800) * 0.05); 
        }
        
    } else { 
        const timeInMinutes = (gameState.time.hour * 60) + gameState.time.minute;
        const timeWave = (Math.cos((timeInMinutes / 1440) * Math.PI * 2) + 1) / 2;
        ambientLight = timeWave * 0.85;
        baseRadius = (ambientLight > 0.3) ? 8 + torchBonus + candleBonus : 25;

        if (ambientLight > 0.4 && (hasTorch || candleBonus > 0)) {
            const centerTile = chunkManager.getTile(p.x, p.y);
            if (centerTile === '🍄') { r = 168; g = 85; b = 247; } 
            else if (centerTile === '≈') { r = 134; g = 239; b = 172; } 
            else if (centerTile === '❄️' || centerTile === '🌲') { r = 186; g = 230; b = 253; } 
        }
        
        if (gameState.isBloodMoon) { r = 220; g = 38; b = 38; } 
        else if (gameState.weather === 'storm') { r = 100; g = 100; b = 150; }
    }

    const torchFlicker = (Math.sin(now / 1000) * 0.2) + (Math.cos(now / 2500) * 0.1);
    const lightRadius = baseRadius + torchFlicker;
    const outerDarkness = ambientLight; 

    if (outerDarkness > 0.0) {
        const lightPxRadius = lightRadius * TILE_SIZE;
        const gradKey = `${lightPxRadius.toFixed(1)}_${outerDarkness.toFixed(2)}_${r}_${g}_${b}`;
        
        if (_cachedGradientParams !== gradKey) {
            _cachedGradient = ctx.createRadialGradient(0, 0, lightPxRadius * 0.2, 0, 0, lightPxRadius);
            _cachedGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
            _cachedGradient.addColorStop(0.5, `rgba(0, 0, 0, ${outerDarkness * 0.6})`);
            _cachedGradient.addColorStop(1, `rgba(0, 0, 0, ${outerDarkness})`);
            _cachedGradientParams = gradKey;
        }

        ctx.save();
        ctx.translate((visX - startX) * TILE_SIZE + TILE_SIZE / 2, (visY - startY) * TILE_SIZE + TILE_SIZE / 2);
        ctx.fillStyle = _cachedGradient;
        
        const coverW = VIEWPORT_WIDTH * TILE_SIZE * 2;
        const coverH = VIEWPORT_HEIGHT * TILE_SIZE * 2;
        ctx.fillRect(-coverW, -coverH, coverW * 2, coverH * 2);
        ctx.restore();
    }

    // --- LORE & ATMOSPHERE WIN: Biome-Specific Ambient Particles ---
    if (gameState.mapMode === 'overworld' || gameState.mapMode === 'underworld') {
        const centerTile = chunkManager.getTile(p.x, p.y);
        const isNight = outerDarkness > 0.4;
        
        if (Math.random() < 0.15 && typeof ParticleSystem !== 'undefined') {
            const fx = p.x + (Math.random() * VIEWPORT_WIDTH) - (VIEWPORT_WIDTH / 2);
            const fy = p.y + (Math.random() * VIEWPORT_HEIGHT) - (VIEWPORT_HEIGHT / 2);
            
            if (centerTile === 'F' && isNight) {
                ParticleSystem.spawn(fx, fy, '#86efac', 'dust', '', 2); 
                const bug = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length - 1];
                if (bug) {
                    bug.vy = -0.01 - (Math.random() * 0.02);
                    bug.vx = (Math.random() - 0.5) * 0.05;
                    bug.gravity = 0; bug.lifeFade = 0.01; 
                }
            } else if (centerTile === 'd' || centerTile === '🌋') {
                ParticleSystem.spawn(fx, fy, '#9ca3af', 'dust', '', Math.random()*2 + 1); 
                const ash = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length - 1];
                if (ash) {
                    ash.vy = -0.03 - (Math.random() * 0.03); 
                    ash.vx = (Math.random() - 0.5) * 0.08;
                    ash.gravity = 0; ash.lifeFade = 0.015;
                }
            } else if (centerTile === '🍄') {
                ParticleSystem.spawn(fx, fy, '#d946ef', 'dust', '', Math.random()*2 + 1); 
                const spore = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length - 1];
                if (spore) {
                    spore.vy = (Math.random() - 0.5) * 0.02; 
                    spore.vx = (Math.random() - 0.5) * 0.02;
                    spore.gravity = 0; spore.lifeFade = 0.01;
                }
            } else if (centerTile === 'D') {
                ParticleSystem.spawn(fx, fy, '#fde047', 'dust', '', 1); 
                const sand = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length - 1];
                if (sand) {
                    sand.vy = 0; 
                    sand.vx = 0.1 + (Math.random() * 0.1); 
                    sand.gravity = 0; sand.lifeFade = 0.05; 
                }
            }
        }
    }

    // --- Dynamic Weather Particles ---
    const intensity = gameState.player.weatherIntensity || 0;
    if (intensity > 0 && gameState.weather !== 'clear' && gameState.mapMode === 'overworld') {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.scale(dpr, dpr);
        ctx.globalAlpha = intensity;
        
        if (gameState.weather === 'rain') {
            ctx.fillStyle = 'rgba(0, 0, 100, 0.2)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.strokeStyle = 'rgba(120, 140, 255, 0.6)';
            ctx.lineWidth = 1;
            
            const dropCount = Math.floor(200 * intensity);
            const windShift = Math.sin(now / 1500) * 5; 
            for (let i = 0; i < dropCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                const len = 10 + Math.random() * 10;
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 5 + windShift, ry + len); ctx.stroke();
                
                if (Math.random() < 0.1 * intensity) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.beginPath();
                    ctx.ellipse(rx - 5 + windShift, ry + len, 4, 1.5, 0, 0, TWO_PI);
                    ctx.stroke();
                }
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
                const drift = Math.sin(now / 2000 + ry) * 10;
                ctx.fillRect(rx + drift, ry, size, size);
            }
        }
        else if (gameState.weather === 'storm') {
            ctx.fillStyle = 'rgba(10, 10, 30, 0.4)';
            ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.strokeStyle = 'rgba(150, 150, 255, 0.5)';
            ctx.lineWidth = 2;
            const dropCount = Math.floor(300 * intensity);
            const windShift = Math.sin(now / 1000) * 8;
            for (let i = 0; i < dropCount; i++) {
                const rx = Math.random() * (canvas.width / dpr);
                const ry = Math.random() * (canvas.height / dpr);
                ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 8 + windShift, ry + 15); ctx.stroke();
            }
            
            if (Math.random() < 0.02 * intensity) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            } else if (Math.random() < 0.05 * intensity) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
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
            
            for (let i = 0; i < bosses.length; i++) {
                const b = bosses[i];
                const d = Math.sqrt(Math.pow(b.x - gameState.player.x, 2) + Math.pow(b.y - gameState.player.y, 2));
                if (d < minDist) {
                    minDist = d;
                    activeBoss = b;
                }
            }

            if (minDist < 20 || bosses.length === 1) {
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
                ctx.scale(dpr, dpr);
                
                const barWidth = (canvas.width / dpr) * 0.6;
                const barHeight = 24;
                const barX = ((canvas.width / dpr) - barWidth) / 2;
                const barY = 40;

                // UX WIN: Highly polished MMO-style boss frame
                ctx.strokeStyle = '#facc15'; 
                ctx.lineWidth = 2;
                ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
                
                ctx.fillStyle = '#450a0a'; 
                ctx.fillRect(barX, barY, barWidth, barHeight);

                const safeMaxHealth = activeBoss.maxHealth || 1; // Fallback to prevent NaN explosions
                const healthPercent = Math.max(0, activeBoss.health / safeMaxHealth);
                
                const grad = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
                grad.addColorStop(0, '#ef4444');
                grad.addColorStop(1, '#991b1b');
                
                ctx.fillStyle = grad;
                ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px monospace';
                ctx.textAlign = 'center';
                // Double text stroke for perfect legibility over backgrounds
                ctx.strokeStyle = 'rgba(0,0,0,0.8)';
                ctx.lineWidth = 4;
                ctx.lineJoin = 'round';
                ctx.strokeText(activeBoss.name, (canvas.width / dpr) / 2, barY - 10);
                ctx.fillText(activeBoss.name, (canvas.width / dpr) / 2, barY - 10);

                ctx.font = 'bold 12px monospace';
                ctx.strokeText(`${activeBoss.health} / ${safeMaxHealth}`, (canvas.width / dpr) / 2, barY + 16);
                ctx.fillText(`${activeBoss.health} / ${safeMaxHealth}`, (canvas.width / dpr) / 2, barY + 16);
            }
        }
    }

    // --- Visceral Blood Overlay for heavy hits ---
    if (gameState.screenShake > 8) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.scale(dpr, dpr);
        ctx.fillStyle = `rgba(220, 38, 38, ${Math.min(0.3, gameState.screenShake / 50)})`; 
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
            companion: gameState.player.companion ? {
                tile: gameState.player.companion.tile,
                name: gameState.player.companion.name,
                x: gameState.player.companion.x, 
                y: gameState.player.companion.y  
            } : null
        };
        onlinePlayerRef.set(stateToSync);
    }
}

// --- END OF FILE renderer.js ---
