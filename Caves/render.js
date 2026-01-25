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
            p.vy = -0.02; 
            p.size = 14;
            p.gravity = 0;
        } else {
            p.vx = (Math.random() - 0.5) * 0.2;
            p.vy = (Math.random() - 0.5) * 0.2;
            p.gravity = 0.01;
        }
        this.activeParticles.push(p);
    },

    createExplosion: function(x, y, color, count=8) {
        for(let i=0; i<count; i++) this.spawn(x, y, color, 'dust', '', Math.random()*3+2);
    },

    createFloatingText: function(x, y, text, color) {
        this.spawn(x, y, color, 'text', text);
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
            p.life -= 0.02;
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
                ctx.lineWidth = 3;
                ctx.strokeText(p.text, screenX, screenY);
                ctx.fillText(p.text, screenX, screenY);
            } else {
                ctx.fillStyle = p.color;
                ctx.fillRect(screenX, screenY, p.size, p.size);
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
        ctx.beginPath(); ctx.arc(tx + 10, ty + 8, 2.5, 0, Math.PI * 2); ctx.fill();
    },

    drawPebble: (ctx, x, y, color, seedX, seedY) => {
        // Position relies on world coords to stay static
        const tx = x * TILE_SIZE + (Math.abs(seedX) * 3 % 10) + 2;
        const ty = y * TILE_SIZE + (Math.abs(seedY) * 7 % 10) + 5;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(tx, ty, 2, 0, Math.PI * 2); ctx.fill();
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
            ctx.arc((x * TILE_SIZE) + 15, (y * TILE_SIZE) + 5, 1.5, 0, Math.PI * 2);
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
        // Some tiles have 1 big tree, others have 2 smaller ones
        const treeCount = rand > 0.7 ? 2 : 1;

        for (let i = 0; i < treeCount; i++) {
            // Offset logic for multiple trees
            const offsetX = (i === 0) ? (TILE_SIZE / 2) : (TILE_SIZE / 2) + ((rand - 0.5) * 10);
            const offsetY = (i === 0) ? (TILE_SIZE) : (TILE_SIZE) - ((rand) * 5);

            const tx = (x * TILE_SIZE) + offsetX;
            const ty = (y * TILE_SIZE) + offsetY;

            // Height variation
            const height = (TILE_SIZE * 0.8) + (rand * (TILE_SIZE * 0.4)) - (i * 5);
            const width = height * 0.6;

            // Trunk
            ctx.fillStyle = '#451a03'; // Dark Wood
            ctx.fillRect(tx - 2, ty - (height * 0.2), 4, height * 0.2);

            // Foliage (Triangle)
            // We use two shades of green for "lighting"
            const treeColor = (mapX + mapY) % 2 === 0 ? '#166534' : '#15803d'; // Varying greens

            ctx.fillStyle = treeColor;
            ctx.beginPath();
            ctx.moveTo(tx, ty - height); // Top
            ctx.lineTo(tx + (width / 2), ty - (height * 0.2)); // Bottom Right
            ctx.lineTo(tx - (width / 2), ty - (height * 0.2)); // Bottom Left
            ctx.fill();

            // Shadow (Right side of tree for 3D effect)
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
        // 15% chance to be a flat valley tile.
        // This breaks up the "wall" of mountains.
        if (rand > 0.85) {
            // Draw a tiny pebble so it looks intentional, not like a glitch
            ctx.fillStyle = '#44403c'; // Dark grey pebble
            ctx.beginPath();
            // Randomize pebble position slightly based on seed
            const pX = tx + (TILE_SIZE * 0.3) + (rand * 5);
            const pY = ty + (TILE_SIZE * 0.3) + (rand * 5);
            ctx.arc(pX, pY, 1.5, 0, Math.PI * 2);
            ctx.fill();
            return; // Stop here! Don't draw a peak.
        }

        // --- HELPER: Draw a single peak ---
        const drawPeak = (offsetX, offsetY, scaleW, scaleH) => {
            // Randomize peak tip slightly based on seed
            const jitterX = (rand - 0.5) * 4;

            const peakX = tx + (TILE_SIZE / 2) + offsetX + jitterX;
            const peakY = ty + (TILE_SIZE * 0.1) + offsetY;

            const width = TILE_SIZE * scaleW;
            const height = TILE_SIZE * scaleH;

            const baseLeft = peakX - (width / 2);
            const baseRight = peakX + (width / 2);
            const baseBottom = ty + TILE_SIZE;

            // Shadow Side (Right) - Warm Dark Grey
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(baseRight, baseBottom);
            ctx.lineTo(peakX, baseBottom);
            ctx.fill();

            // Sunlit Side (Left) - Warm Medium Grey
            ctx.fillStyle = '#78716c';
            ctx.beginPath();
            ctx.moveTo(peakX, peakY);
            ctx.lineTo(peakX, baseBottom);
            ctx.lineTo(baseLeft, baseBottom);
            ctx.fill();

            // Snow Cap (Only on tall peaks)
            if (scaleH > 0.85) {
                const snowLine = peakY + (height * 0.25);
                ctx.fillStyle = '#f3f4f6'; // White
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(peakX + (width * 0.2), snowLine + 2);
                ctx.lineTo(peakX, snowLine - 1); // Slight jagged dip
                ctx.lineTo(peakX - (width * 0.2), snowLine + 2);
                ctx.fill();
            }
        };

        // --- 4. CHOOSE PEAK VARIATION ---
        // Adjusted probabilities since top 15% is now Valley

        if (rand < 0.45) {
            // VARIATION A: The Titan (45% Chance)
            // One large, dominant peak.
            drawPeak(0, 0, 1.2, 1.0);
        }
        else if (rand < 0.75) {
            // VARIATION B: The Ridge (30% Chance)
            // One main peak with a small "shoulder" peak attached.
            const side = (rand < 0.60) ? -1 : 1;
            drawPeak(side * 5, 4, 0.7, 0.6);
            drawPeak(0, 0, 1.1, 1.0);
        }
        else {
            // VARIATION C: Twin Peaks (10% Chance)
            // Two distinct peaks.
            drawPeak(-3, 3, 0.7, 0.8);
            drawPeak(4, 5, 0.6, 0.6);
        }
    },

    // . Plains
    drawPlains: (ctx, x, y, mapX, mapY, baseColor, accentColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);

        const rand = TileRenderer.getPseudoRandom(mapX, mapY);

        // Reduced frequencies:
        if (rand < 0.02) { // 2% Chance for Flower (was 10%)
            TileRenderer.drawFlower(ctx, x, y, mapX, mapY);
        } else if (rand < 0.10) { // 8% Chance for Grass (was 20%)
            TileRenderer.drawGrassTuft(ctx, x, y, accentColor);
        } else if ((mapX * 123 + mapY * 456) % 11 === 0) { // Spread out detail lines
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

        if (rand < 0.03) { // 3% Chance for Bones (was 10%)
            TileRenderer.drawBone(ctx, x, y);
        } else if (rand < 0.15) {
            TileRenderer.drawPebble(ctx, x, y, '#52525b', mapX, mapY);
        }
    },

    // D Desert
    drawDesert: (ctx, x, y, mapX, mapY, baseColor) => {
        TileRenderer.drawBase(ctx, x, y, baseColor);
        const rand = TileRenderer.getPseudoRandom(mapX, mapY);
        if (rand > 0.7) { // Reduced ripples
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
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1;
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Slower time factor (2000 instead of 1500)
        // Mix mapX and mapY to create diagonal drift instead of vertical bouncing
        const time = Date.now() / 2000;
        const wavePhase = time + (mapX * 0.2) + (mapY * 0.1);

        const yOffset = Math.sin(wavePhase) * 3;

        ctx.beginPath();
        // Draw a slight curve instead of a straight line
        ctx.moveTo(tx + 2, ty + TILE_SIZE / 2 + yOffset);
        ctx.bezierCurveTo(
            tx + 8, ty + TILE_SIZE / 2 + yOffset - 2,
            tx + 12, ty + TILE_SIZE / 2 + yOffset + 2,
            tx + TILE_SIZE - 2, ty + TILE_SIZE / 2 + yOffset
        );
        ctx.stroke();
    },

    // 🔥 Fire (Animated)

    drawFire: (ctx, x, y, baseColor) => { // <-- Added baseColor parameter
        TileRenderer.drawBase(ctx, x, y, baseColor || '#451a03'); // <-- Use it, or fallback to brown

        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE - 2;
        const flicker = Math.sin(Date.now() / 100) * 3;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(tx, ty - 4, 4 + (flicker * 0.2), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(tx, ty - 4, 2 + (flicker * 0.1), 0, Math.PI * 2); ctx.fill();
    },

    // Ω Void Rift (Animated)
    drawVoid: (ctx, x, y) => {
        TileRenderer.drawBase(ctx, x, y, '#000');
        const tx = x * TILE_SIZE + TILE_SIZE / 2;
        const ty = y * TILE_SIZE + TILE_SIZE / 2;
        const pulse = Math.sin(Date.now() / 300);
        const size = 6 + (pulse * 2);

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, size, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#581c87';
        ctx.beginPath(); ctx.arc(tx, ty, size / 2, 0, Math.PI * 2); ctx.fill();
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

    // 1. NEW: Visual Warning Zone
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

    // 2. NEW: Universal Health Bar Helper
    drawHealthBar: (ctx, x, y, current, max) => {
        if (max <= 0) return;
        const percent = Math.max(0, current / max);

        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        // Bar Container (Black background)
        const barHeight = 4;
        const yOffset = TILE_SIZE - barHeight; // Bottom of tile

        ctx.fillStyle = '#1f2937'; // Dark Gray
        ctx.fillRect(tx, ty + yOffset, TILE_SIZE, barHeight);

        // Health Color (Green -> Yellow -> Red)
        let color = '#22c55e'; // Green
        if (percent < 0.5) color = '#eab308'; // Yellow
        if (percent < 0.25) color = '#ef4444'; // Red

        ctx.fillStyle = color;
        ctx.fillRect(tx, ty + yOffset, TILE_SIZE * percent, barHeight);

        // Border for clarity
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tx, ty + yOffset, TILE_SIZE, barHeight);
    }
};
