const TWO_PI = Math.PI * 2; // EASY WIN: Cache this constant for drawing circles (saves CPU cycles)

function updateThemeColors() {
    const style = getComputedStyle(document.documentElement);
    cachedThemeColors = {
        canvasBg: style.getPropertyValue('--canvas-bg').trim(),
        mtnBase: style.getPropertyValue('--mtn-base').trim() || '#57534e',
        mtnShadow: style.getPropertyValue('--mtn-shadow').trim() || '#44403c',
        mtnCap: style.getPropertyValue('--mtn-cap').trim() || '#f9fafb'
    };
}

const ParticleSystem = {
    pool: [],
    activeParticles: [],
    MAX_PARTICLES: 150,

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
        
        if (type === 'text') {
            p.vx = 0; 
            p.vy = -0.04; 
            p.size = 14;
            p.gravity = 0;
            p.lifeFade = 0.035; 
        } else {
            p.vx = (Math.random() - 0.5) * 0.2;
            p.vy = (Math.random() - 0.5) * 0.2;
            p.gravity = 0.01;
            p.lifeFade = 0.05 + Math.random() * 0.05;
        }
        this.activeParticles.push(p);
    },

    createExplosion: function(x, y, color, count=8) {
        for(let i=0; i<count; i++) this.spawn(x, y, color, 'dust', '', Math.random()*3+2);
    },

    createFloatingText: function(x, y, text, color) {
        // Add a slight random offset so simultaneous numbers don't overlap perfectly
        const offsetX = (Math.random() - 0.5) * 0.7;
        const offsetY = (Math.random() - 0.5) * 0.7;
        
        this.spawn(x + offsetX, y + offsetY, color, 'text', text);
    },

    createLevelUp: function(x, y) {
        this.createFloatingText(x, y, "LEVEL UP!", "#facc15");
        for(let i=0; i<20; i++) this.spawn(x, y, ['#facc15','#ef4444'][Math.floor(Math.random()*2)], 'dust');
    },

    update: function() {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.x += p.vx; 
            p.y += p.vy;
            p.life -= p.lifeFade; // Use dynamic fade rate
            
            if(p.gravity) p.vy += p.gravity;

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
                // Pop effect
                const scale = 1 + (Math.sin(p.life * Math.PI) * 0.5);
                ctx.font = `bold ${p.size * scale}px monospace`;
                ctx.strokeStyle = 'black';
                
                // Draw stroke FIRST (behind the text) for thicker, cleaner outlines
                ctx.lineWidth = 3;
                ctx.lineJoin = 'round'; // EASY WIN: Prevents ugly spikes on sharp letters like 'M' or 'W'
                ctx.strokeText(p.text, screenX, screenY);
                
                // Draw text fill on top
                ctx.fillText(p.text, screenX, screenY);
            } else {
                ctx.fillStyle = p.color;
                // JUICE: Make dust particles physically shrink as they fade out!
                const currentSize = Math.max(0.5, p.size * p.life);
                ctx.fillRect(screenX - currentSize/2, screenY - currentSize/2, currentSize, currentSize);
            }
            ctx.restore();
        }
    }
};

ParticleSystem.init();

const TileRenderer = {
    // Helper: Deterministic random based on WORLD coordinates
    getPseudoRandom: (x, y) => {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    drawBase: (ctx, x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    },

    // --- DECORATION HELPERS ---
    drawGrassTuft: (ctx, x, y, color) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Draw 3 little blades
        ctx.moveTo(tx + 4, ty + 16); ctx.lineTo(tx + 4, ty + 10);
        ctx.moveTo(tx + 8, ty + 16); ctx.lineTo(tx + 8, ty + 8);
        ctx.moveTo(tx + 12, ty + 16); ctx.lineTo(tx + 12, ty + 11);
        ctx.stroke();
    },

    drawFlower: (ctx, x, y, seedX, seedY) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;
        // Stem
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx + 10, ty + 16); ctx.lineTo(tx + 10, ty + 8); ctx.stroke();
        // Petals (Color based on world coord, not screen)
        ctx.fillStyle = (seedX + seedY) % 2 === 0 ? '#f472b6' : '#facc15';
        ctx.beginPath(); ctx.arc(tx + 10, ty + 8, 2.5, 0, TWO_PI); ctx.fill();
    },

    drawPebble: (ctx, x, y, color, seedX, seedY) => {
        // Position relies on world coords to stay static
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

    // --- BIOME RENDERERS (Now accepting mapX/mapY) ---

    // 🐊 Swamp (Static - Stagnant Muck)
    drawSwamp: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);

        // Deterministic random (so the muck doesn't move when you walk)
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        ctx.fillStyle = accentColor;

        // Draw random horizontal "scum" patches or reeds
        if (rand > 0.6) {
            ctx.fillRect((x * TILE_SIZE) + 3, (y * TILE_SIZE) + 6, 8, 2);
        }
        if (rand < 0.4) {
            ctx.fillRect((x * TILE_SIZE) + 10, (y * TILE_SIZE) + 14, 6, 2);
        }
        // Occasional bubble
        if (rand > 0.9) {
            ctx.beginPath();
            ctx.arc((x * TILE_SIZE) + 15, (y * TILE_SIZE) + 5, 1.5, 0, TWO_PI);
            ctx.fill();
        }
    },

    // 🌲 Procedural Pine Forests
    drawForest: (ctx, x, y, mapX, mapY, baseColor) => {
        // 1. Draw Ground
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // 2. Deterministic Random
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed);

        // 3. Determine Tree Properties
        const treeCount = rand > 0.7 ? 2 : 1;

        for (let i = 0; i < treeCount; i++) {
            const offsetX = (i === 0) ? (TILE_SIZE / 2) : (TILE_SIZE / 2) + ((rand - 0.5) * 10);
            const offsetY = (i === 0) ? (TILE_SIZE) : (TILE_SIZE) - ((rand) * 5);

            const tx = (x * TILE_SIZE) + offsetX;
            const ty = (y * TILE_SIZE) + offsetY;

            const height = (TILE_SIZE * 0.8) + (rand * (TILE_SIZE * 0.4)) - (i * 5);
            const width = height * 0.6;

            // Draw Ground Drop Shadow for depth
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(tx, ty, width * 0.4, width * 0.2, 0, 0, TWO_PI);
            ctx.fill();

            // Trunk
            ctx.fillStyle = '#451a03'; // Dark Wood
            ctx.fillRect(tx - 2, ty - (height * 0.2), 4, height * 0.2);

            // JUICE: 5% chance for a rare Autumn tree!
            const treeColor = (rand > 0.95) ? '#b45309' : ((mapX + mapY) % 2 === 0 ? '#166534' : '#15803d');

            ctx.fillStyle = treeColor;
            ctx.beginPath();
            ctx.moveTo(tx, ty - height); // Top
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2)); // Bottom Right
            ctx.lineTo(tx - (width / 2), ty - (height * 0.2)); // Bottom Left
            ctx.fill();

            // Foliage Shadow (Right side of tree)
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.moveTo(tx, ty - height);
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2));
            ctx.lineTo(tx, ty - (height * 0.2));
            ctx.fill();
        }
    },

    // ⛰ Improved "Low Poly" Mountains with Valleys
    drawMountain: (ctx, x, y, mapX, mapY, baseColor) => {
        // 1. Deterministic Random Seed
        const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
        const rand = seed - Math.floor(seed); // 0.0 to 1.0

        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // 2. Draw Ground (Matches biome to hide gaps)
        ctx.fillStyle = baseColor;
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        // --- 3. NEGATIVE SPACE (The Valley) ---
        if (rand > 0.85) {
            ctx.fillStyle = '#44403c'; // Dark grey pebble
            ctx.beginPath();
            const pX = tx + (TILE_SIZE * 0.3) + (rand * 5);
            const pY = ty + (TILE_SIZE * 0.3) + (rand * 5);
            ctx.arc(pX, pY, 1.5, 0, TWO_PI);
            ctx.fill();
            return; 
        }

        // --- HELPER: Draw a single peak ---
        const drawPeak = (offsetX, offsetY, scaleW, scaleH) => {
            const jitterX = (rand - 0.5) * 4;
            const peakX = tx + (TILE_SIZE / 2) + offsetX + jitterX;
            const peakY = ty + (TILE_SIZE * 0.1) + offsetY;

            const width = TILE_SIZE * scaleW;
            const height = TILE_SIZE * scaleH;

            const baseLeft = peakX - (width / 2);
            const baseRight = peakX + (width / 2);
            const baseBottom = ty + TILE_SIZE;

            // Shadow Side (Right)
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(baseRight, baseBottom);
            ctx.lineTo(peakX, baseBottom);
            ctx.fill();

            // Sunlit Side (Left)
            ctx.fillStyle = '#78716c';
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
            ctx.beginPath();
            ctx.moveTo(tx - 2, ty + 2);
            ctx.lineTo(tx, ty - 2);
            ctx.lineTo(tx + 2, ty + 2);
            ctx.stroke();
        }
    },

    // d Deadlands
    drawDeadlands: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);

        if (rand < 0.03) { 
            TileRenderer.drawBone(ctx, x, y);
        } else if (rand < 0.15) {
            TileRenderer.drawPebble(ctx, x, y, '#52525b', mapX, mapY);
        }
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
            ctx.beginPath();
            ctx.moveTo(tx + 4, ty + 10);
            ctx.lineTo(tx + 16, ty + 10);
            ctx.stroke();
        }
    },

    // 🌊 Water (Animated - Organic Flow)
    drawWater: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        const time = Date.now() / 2000;
        
        // Smoother Water Math
        const wavePhase1 = time + (Math.sin(mapX * 0.2) + Math.cos(mapY * 0.2));
        const wavePhase2 = time * 1.5 + (Math.sin(mapX * 0.3) - Math.cos(mapY * 0.3)); 

        ctx.strokeStyle = accentColor;
        
        // Primary Wave
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const yOffset1 = Math.sin(wavePhase1) * 3;
        ctx.moveTo(tx + 2, ty + TILE_SIZE / 2 + yOffset1);
        ctx.bezierCurveTo(
            tx + 8, ty + TILE_SIZE / 2 + yOffset1 - 2,
            tx + 12, ty + TILE_SIZE / 2 + yOffset1 + 2,
            tx + TILE_SIZE - 2, ty + TILE_SIZE / 2 + yOffset1
        );
        ctx.stroke();

        // Secondary Faint Wave (Creates depth/flow)
        ctx.save();
        ctx.globalAlpha = 0.5; 
        ctx.lineWidth = 1;
        ctx.beginPath();
        const yOffset2 = Math.cos(wavePhase2) * 2 + 4; 
        ctx.moveTo(tx + 4, ty + TILE_SIZE / 2 + yOffset2);
        ctx.bezierCurveTo(
            tx + 10, ty + TILE_SIZE / 2 + yOffset2 + 2,
            tx + 14, ty + TILE_SIZE / 2 + yOffset2 - 2,
            tx + TILE_SIZE - 4, ty + TILE_SIZE / 2 + yOffset2
        );
        ctx.stroke();
        ctx.restore();
    },

    // 🔥 Fire (Animated)
    drawFire: (ctx, x, y, baseColor) => { 
        TileRenderer.drawBase(ctx, x, y, baseColor || '#451a03'); 

        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE - 2;
        const flicker = Math.sin(Date.now() / 100) * 3;

        ctx.save();
        
        // CRITICAL PERFORMANCE FIX: Replaced expensive shadowBlur with layered alpha circles!
        // This runs roughly 100x faster on mobile devices while looking almost identical.
        
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
    },

    // Ω Void Rift (Animated)
    drawVoid: (ctx, x, y) => {
        TileRenderer.drawBase(ctx, x, y, '#000');
        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(Date.now() / 300);
        const size = 6 + (pulse * 2);

        ctx.save();
        
        // CRITICAL PERFORMANCE FIX: Replaced expensive shadowBlur with layered alpha circles!
        
        // Outer Purple Glow
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath(); ctx.arc(tx, ty, size + 4, 0, TWO_PI); ctx.fill();
        
        // Mid Ring
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, size, 0, TWO_PI); ctx.stroke();
        
        // Dark Core
        ctx.fillStyle = '#581c87';
        ctx.beginPath(); ctx.arc(tx, ty, size / 2, 0, TWO_PI); ctx.fill();
        
        ctx.restore();
    },

    // 🧱 Enhanced Wall Renderer
    drawWall: (ctx, x, y, baseColor, accentColor, style = 'rough') => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Draw Base
        TileRenderer.drawBase(ctx, x, y, baseColor);
        ctx.fillStyle = accentColor;

        if (style === 'brick') {
            // CASTLE STYLE: Clean Bricks
            const brickH = TILE_SIZE / 4;
            // Row 1
            ctx.fillRect(tx, ty, TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 2, ty, 1, brickH);
            // Row 2
            ctx.fillRect(tx, ty + brickH, TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 4, ty + brickH, 1, brickH);
            ctx.fillRect(tx + (TILE_SIZE * 0.75), ty + brickH, 1, brickH);
            // Row 3
            ctx.fillRect(tx, ty + (brickH * 2), TILE_SIZE, 1);
            ctx.fillRect(tx + TILE_SIZE / 2, ty + (brickH * 2), 1, brickH);
        } else {
            // CAVE STYLE: Rough Stone (Noise)
            // Deterministic random based on position
            const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            const rand = seed - Math.floor(seed);

            // Draw random cracks/texture
            ctx.fillRect(tx + (rand * 10), ty + (rand * 5), 4, 4);
            ctx.fillRect(tx + ((1 - rand) * 10), ty + ((1 - rand) * 10) + 5, 3, 3);

            // Border shadow for depth
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(tx, ty + TILE_SIZE - 2, TILE_SIZE, 2); // Bottom shadow
        }
    },

    drawTelegraph: (ctx, x, y) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Pulsing Red Overlay
        const alpha = 0.3 + (Math.sin(Date.now() / 150) * 0.15); // Fast pulse

        ctx.save();
        ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`; // Red
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        // Warning Border with Cross
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);

        // Draw an 'X' to make it colorblind friendly
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + TILE_SIZE, ty + TILE_SIZE);
        ctx.moveTo(tx + TILE_SIZE, ty);
        ctx.lineTo(tx, ty + TILE_SIZE);
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        ctx.restore();
    },

    drawHealthBar: (ctx, x, y, current, max) => {
        // EASY WIN: UI Decluttering! Only draw the health bar if they are actually damaged.
        if (max <= 0 || current >= max) return; 
        
        const percent = Math.max(0, current / max);

        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        const barHeight = 4;
        const yOffset = TILE_SIZE - barHeight; // Bottom of tile

        ctx.save();

        // Tiny drop shadow so the bar stands out against same-colored sprites
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetY = 1;

        // Bar Container (Black background)
        ctx.fillStyle = '#1f2937'; 
        ctx.fillRect(tx, ty + yOffset, TILE_SIZE, barHeight);

        // Health Color (Green -> Yellow -> Red)
        let color = '#22c55e'; // Green
        if (percent < 0.5) color = '#eab308'; // Yellow
        if (percent < 0.25) color = '#ef4444'; // Red

        ctx.fillStyle = color;
        ctx.fillRect(tx, ty + yOffset, TILE_SIZE * percent, barHeight);

        // Border for clarity
        ctx.shadowColor = "transparent"; // Turn off shadow for the border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tx, ty + yOffset, TILE_SIZE, barHeight);

        ctx.restore();
    }
};
