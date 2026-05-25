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
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            
            // Physics
            p.x += p.vx; 
            p.y += p.vy;
            p.vx *= p.friction; // Apply air resistance
            p.vy *= p.friction;
            
            if(p.gravity) p.vy += p.gravity;

            p.life -= p.lifeFade; 
            
            if (p.life <= 0) {
                p.active = false;
                this.pool.push(p); // Recycle back to pool
                this.activeParticles.splice(i, 1);
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

            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);

            if (p.type === 'text') {
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
            } else if (p.type === 'smoke') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, p.size * p.life, 0, TWO_PI);
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                const currentSize = Math.max(0.5, p.size * p.life);
                // Rotate dust particles based on their X velocity for extra juice
                ctx.translate(screenX, screenY);
                ctx.rotate(p.vx * 10);
                ctx.fillRect(-currentSize/2, -currentSize/2, currentSize, currentSize);
            }
            ctx.restore();
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

        // JUICE: Dynamic Wind Calculation
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

            // JUICE: Subtle gradient rendering on the lit side of the mountain
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

        // PERFORMANCE: Using performance.now() instead of Date.now()
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
        ctx.save();
        ctx.globalAlpha = 0.5; 
        ctx.lineWidth = 1;
        ctx.beginPath();
        const yOffset2 = Math.cos(wavePhase2) * 2 + 4; 
        ctx.moveTo(tx + 4, ty + TILE_SIZE / 2 + yOffset2);
        ctx.bezierCurveTo(tx + 10, ty + TILE_SIZE / 2 + yOffset2 + 2, tx + 14, ty + TILE_SIZE / 2 + yOffset2 - 2, tx + TILE_SIZE - 4, ty + TILE_SIZE / 2 + yOffset2);
        ctx.stroke();
        ctx.restore();

        // JUICE: Sunlight Glints (Sparkles randomly appearing on waves)
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

        ctx.save();
        
        // Outer Orange Glow
        ctx.fillStyle = 'rgba(249, 115, 22, 0.4)'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 8 + (flicker * 0.5), 0, TWO_PI); ctx.fill();
        
        // Mid Red Flame
        ctx.fillStyle = '#ef4444'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 4 + (flicker * 0.2), 0, TWO_PI); ctx.fill();
        
        // Inner Yellow Core
        ctx.fillStyle = '#facc15'; 
        ctx.beginPath(); ctx.arc(tx, ty - 4, 2 + (flicker * 0.1), 0, TWO_PI); ctx.fill();
        ctx.restore();

        // JUICE: Environmental Smoke Particle Emission
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

        ctx.save();
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath(); ctx.arc(tx, ty, size + 4, 0, TWO_PI); ctx.fill();
        
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, size, 0, TWO_PI); ctx.stroke();
        
        ctx.fillStyle = '#581c87';
        ctx.beginPath(); ctx.arc(tx, ty, size / 2, 0, TWO_PI); ctx.fill();
        ctx.restore();
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

        ctx.save();
        ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`; 
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

        ctx.beginPath();
        ctx.moveTo(tx, ty); ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
        ctx.moveTo(tx + TILE_SIZE, ty); ctx.lineTo(tx, ty + TILE_SIZE);
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.restore();
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

        ctx.save();

        // Drop shadow
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;

        // Container Pill (Black background)
        ctx.fillStyle = '#111827'; 
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth, barHeight, 2); ctx.fill();

        // Health Fill Color
        let colorTop = '#4ade80'; let colorBot = '#16a34a'; // Green
        if (percent < 0.5) { colorTop = '#fde047'; colorBot = '#ca8a04'; } // Yellow
        if (percent < 0.25) { colorTop = '#f87171'; colorBot = '#dc2626'; } // Red

        // JUICE: Inner Gradient for a glossy 3D RPG look
        const grad = ctx.createLinearGradient(0, ty + yOffset, 0, ty + yOffset + barHeight);
        grad.addColorStop(0, colorTop);
        grad.addColorStop(1, colorBot);

        ctx.shadowColor = "transparent"; 
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth * percent, barHeight, 2); ctx.fill();

        // Outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(tx + 1, ty + yOffset, barWidth, barHeight, 2); ctx.stroke();

        ctx.restore();
    }
};

// --- RENDER LIGHTING HELPER ---
function drawLighting(ctx, pScreenX, pScreenY) {
    let ambientLight = 0.0;
    let baseRadius = 10;
    const hasTorch = gameState.player.inventory.some(item => item.name === 'Torch');
    const torchBonus = hasTorch ? 6 : 0;
    const candleBonus = (gameState.player.candlelightTurns > 0) ? 8 : 0;

    // Determine ambient light and base radius
    if (gameState.mapMode === 'dungeon') {
        ambientLight = 0.85; // Dungeons are permanently dark
        baseRadius = 6 + Math.floor(gameState.player.perception / 2) + torchBonus + candleBonus;
    } else { 
        // Overworld AND Castles use the Day/Night Cycle!
        const timeInMinutes = (gameState.time.hour * 60) + gameState.time.minute;
        
        // Creates a perfectly smooth wave: 0.0 at noon, 1.0 at midnight
        const timeWave = (Math.cos((timeInMinutes / 1440) * Math.PI * 2) + 1) / 2;
        
        // Scale it so max darkness is 0.85 (pitch black) and noon is 0.0 (bright)
        ambientLight = timeWave * 0.85;
        
        // If it's darker than 30%, shrink vision so torches matter!
        baseRadius = (ambientLight > 0.3) ? 8 + torchBonus + candleBonus : 25;
    }

    const now = Date.now();
    const torchFlicker = (Math.sin(now / 1000) * 0.2) + (Math.cos(now / 2500) * 0.1);
    const lightRadius = baseRadius + torchFlicker;

    // Unify darkness variable
    const outerDarkness = ambientLight; 

    // If it's daytime (outerDarkness is 0), skip drawing the shadow entirely!
    if (outerDarkness > 0.0) {
        // Base Tint Color: Warm Orange
        let r = 255, g = 140, b = 0; 
        
        // Contextual Tints
        if (gameState.mapMode === 'dungeon') {
            const themeName = chunkManager.caveThemes[gameState.currentCaveId];
            if (themeName === 'ICE') { r = 100; g = 200; b = 255; }
            if (themeName === 'VOID') { r = 168; g = 85; b = 247; }
        } else if (gameState.mapMode === 'overworld') {
            if (gameState.isBloodMoon) {
                // BLOOD MOON TINT
                r = 220; g = 38; b = 38; // Deep Red
            } else if (gameState.weather === 'storm') {
                r = 100; g = 100; b = 150;
            }
        }

        // Hardware-Accelerated Gradient
        const lightPxRadius = lightRadius * TILE_SIZE;
        const darknessGradient = ctx.createRadialGradient(
            pScreenX, pScreenY, lightPxRadius * 0.2, // Inner radius
            pScreenX, pScreenY, lightPxRadius        // Outer edge
        );

        // Center: Bright glow
        darknessGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.15)`);
        // Midpoint: Fading into shadow
        darknessGradient.addColorStop(0.5, `rgba(0, 0, 0, ${outerDarkness * 0.6})`);
        // Edge: Pitch Black
        darknessGradient.addColorStop(1, `rgba(0, 0, 0, ${outerDarkness})`);

        // Draw one single massive rectangle over the whole screen (Max Performance)
        ctx.fillStyle = darknessGradient;
        ctx.fillRect(-TILE_SIZE * 2, -TILE_SIZE * 2, (VIEWPORT_WIDTH + 4) * TILE_SIZE, (VIEWPORT_HEIGHT + 4) * TILE_SIZE);
    }

    // --- Nighttime Fireflies ---
    // If it's dark, and we are in a forest, spawn ambient fireflies!
    if (outerDarkness > 0.4 && gameState.mapMode === 'overworld') {
        const p = gameState.player;
        const centerTile = chunkManager.getTile(p.x, p.y);
        if (centerTile === 'F' || centerTile === '🌳e') {
            // 5% chance per frame to spawn a firefly
            if (Math.random() < 0.05 && typeof ParticleSystem !== 'undefined') {
                const fx = p.x + (Math.random() * VIEWPORT_WIDTH) - (VIEWPORT_WIDTH / 2);
                const fy = p.y + (Math.random() * VIEWPORT_HEIGHT) - (VIEWPORT_HEIGHT / 2);
                ParticleSystem.spawn(fx, fy, '#86efac', 'dust', '', 2); // Glowing green
                
                // Hack: Override the standard gravity so fireflies float UP and drift
                const activeBug = ParticleSystem.activeParticles[ParticleSystem.activeParticles.length - 1];
                if (activeBug) {
                    activeBug.vy = -0.02 - (Math.random() * 0.02);
                    activeBug.vx = (Math.random() - 0.5) * 0.05;
                    activeBug.gravity = 0;
                    activeBug.lifeFade = 0.01; // Fade out very slowly
                }
            }
        }
    }
}

// --- HEAVY RENDERING (Only runs when moving) ---
function renderTerrainCache(startX, startY) {
    // Use the new padded dimensions
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
    terrainCtx.translate(TILE_SIZE * 2, TILE_SIZE * 2);

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
            if (gameState.mapMode === 'dungeon') {
                const map = chunkManager.caveMaps[gameState.currentCaveId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';
                const theme = CAVE_THEMES[gameState.currentCaveTheme] || CAVE_THEMES.ROCK;
                
                bgColor = theme.colors.floor;

                if (tile === theme.wall) {
                    TileRenderer.drawWall(terrainCtx, x, y, theme.colors.wall, 'rgba(0,0,0,0.2)', 'rough');
                } else if (tile === theme.floor) {
                    TileRenderer.drawBase(terrainCtx, x, y, theme.colors.floor);
                } else {
                    TileRenderer.drawBase(terrainCtx, x, y, theme.colors.floor);
                    fgChar = tile;
                }
            } 
            else if (gameState.mapMode === 'castle') {
                const map = chunkManager.castleMaps[gameState.currentCastleId];
                tile = (map && map[mapY] && map[mapY][mapX]) ? map[mapY][mapX] : ' ';
                
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
            else { // Overworld
                tile = chunkManager.getTile(mapX, mapY);
                const baseTerrain = getBaseTerrain(mapX, mapY);
                
                // Color Logic
                bgColor = '#22c55e'; // Plains
                if (baseTerrain === 'F') bgColor = '#14532d';
                else if (baseTerrain === 'd') bgColor = '#2d2d2d';
                else if (baseTerrain === 'D') bgColor = '#fde047';
                else if (baseTerrain === '≈') bgColor = '#422006';
                else if (baseTerrain === '^') bgColor = '#57534e';
                else if (baseTerrain === '~') bgColor = '#1e3a8a';

                TileRenderer.drawBase(terrainCtx, x, y, bgColor);

                // --- STATIC DRAWING & ANIMATION SORTING ---
                // Note: We skip animated tiles here, but save them to an array so the main loop can draw them fast!
                if (tile === '~' || tile === '≈' || tile === '🔥' || tile === 'Ω' || tile === '👻k' || (tile === 'D' && gameState.currentCaveTheme === 'FIRE')) {
                    gameState.visibleAnimatedTiles.push({ screenX: x, screenY: y, mapX: mapX, mapY: mapY, tile: tile });
                } else {
                    switch (tile) {
                        case '.': TileRenderer.drawPlains(terrainCtx, x, y, mapX, mapY, bgColor, '#15803d'); break;
                        case 'F': TileRenderer.drawForest(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '^': TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case 'd': TileRenderer.drawDeadlands(terrainCtx, x, y, mapX, mapY, bgColor, '#444'); break;
                        case 'D': TileRenderer.drawDesert(terrainCtx, x, y, mapX, mapY, bgColor); break;
                        case '🧱': TileRenderer.drawWall(terrainCtx, x, y, '#78716c', '#57534e'); break;
                        case '▤': 
                        case '=': TileRenderer.drawBase(terrainCtx, x, y, '#78350f'); break;
                        case '+': fgChar = '+'; fgColor = '#fbbf24'; break;
                        case '/': fgChar = '/'; fgColor = '#000'; break;
                        default:
                            fgChar = tile;
                            const isWideCharCheck = typeof isWideChar === 'function' ? isWideChar : (c) => /\p{Extended_Pictographic}/u.test(c);
                            if (ENEMY_DATA[tile]) fgColor = ENEMY_DATA[tile].color || '#ef4444';
                            break;
                    }
                }
            }

            // Draw Static Character (Items, Objects)
            if (fgChar) {
                if (fgChar === '^' || fgChar === '⛰') {
                    const isCave = (fgChar === '⛰');
                    
                    // Pass the isCave boolean so it forces a mountain peak to render!
                    TileRenderer.drawMountain(terrainCtx, x, y, mapX, mapY, bgColor || '#22c55e', isCave);
                    
                    if (isCave) {
                        terrainCtx.fillStyle = '#1f2937';
                        terrainCtx.fillRect((x * TILE_SIZE) + (TILE_SIZE * 0.4), (y * TILE_SIZE) + (TILE_SIZE * 0.7), TILE_SIZE * 0.2, TILE_SIZE * 0.3);
                    }
                } else {
                    terrainCtx.fillStyle = fgColor;
                    const isWideCharCheck = typeof isWideChar === 'function' ? isWideChar : (c) => /\p{Extended_Pictographic}/u.test(c);
                    terrainCtx.font = isWideCharCheck(fgChar) ? `${TILE_SIZE}px monospace` : `bold ${TILE_SIZE}px monospace`;
                    terrainCtx.fillText(fgChar, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            }
        }
    }

    // --- CLEANUP: Restore the context so subsequent draws aren't permanently shifted
    terrainCtx.restore();
}
