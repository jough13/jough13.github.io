// expansions/Decor.js
import { MathUtils } from '../game.js';

// ==========================================
// 1. DATA-DRIVEN DECOR CONFIGURATION
// ==========================================
// Easy to expand with new biomes and clutter types!
const DECOR_CONFIG = {
    water:   { src: 'assets/clutter_water.png',   count: 400, minSize: 15, maxSize: 30, minAlpha: 0.6, maxAlpha: 0.9, fallbackColor: '#1a4e6e' },
    grass:   { src: 'assets/clutter_grass.png',   count: 600, minSize: 10, maxSize: 25, minAlpha: 0.8, maxAlpha: 1.0, fallbackColor: '#1f4d15' },
    pebbles: { src: 'assets/clutter_pebbles.png', count: 500, minSize: 8,  maxSize: 18, minAlpha: 0.7, maxAlpha: 1.0, fallbackColor: '#4a4a4a' },
    
    // LORE-THEMED CLUTTER
    dirt:    { src: 'assets/clutter_bones.png',   count: 200, minSize: 12, maxSize: 25, minAlpha: 0.5, maxAlpha: 0.8, fallbackColor: '#dfba96' }, // Scattered prey bones
    vines:   { src: 'assets/clutter_web.png',     count: 300, minSize: 20, maxSize: 40, minAlpha: 0.3, maxAlpha: 0.7, fallbackColor: '#ffffff' }  // Old sticky webs
};

const CHUNK_SIZE = 500; // Size of spatial hash grids for rendering performance

export const DecorExpansion = {
    init: (game) => {
        game.decorChunks = new Map(); // PERFORMANCE FIX: Map() for integer key lookups
        game.decorInitialized = false;

        // --- 1. ASSET REGISTRY ---
        // Register all configured sprites to the Splash Screen Preloader
        for (const [type, config] of Object.entries(DECOR_CONFIG)) {
            game.assets.register(config.src);
        }
    },

    patch: (game) => {
        
        // ==========================================
        // 2. DETERMINISTIC GENERATION (Tick 1)
        // ==========================================
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState === 'playing' && this.tick === 1 && !this.decorInitialized) {
                this.decorInitialized = true;
                
                // Scatter decor across the map based on the config counts
                for (const [type, config] of Object.entries(DECOR_CONFIG)) {
                    let placed = 0;
                    let attempts = 0;
                    
                    while (placed < config.count && attempts < config.count * 3) {
                        attempts++;
                        const dx = Math.random() * this.world.width;
                        const dy = Math.random() * this.world.height;
                        const terrain = this.getTerrainAt(dx, dy);
                        
                        // Only place the decor if it matches the underlying terrain
                        if (terrain === type) {
                            const rawSize = MathUtils.randomRange(config.minSize, config.maxSize);
                            
                            const decorItem = {
                                x: dx, 
                                y: dy, 
                                type: type, 
                                size: rawSize,
                                renderSize: rawSize * 2, // Pre-calculated math saves multiplications per frame
                                angle: Math.random() * MathUtils.TWO_PI, // Organic rotation
                                alpha: MathUtils.randomRange(config.minAlpha, config.maxAlpha), // Organic transparency
                                fallbackColor: config.fallbackColor,
                                
                                // INSTANT RAM CACHE RETRIEVAL
                                sprite: this.assets.get(config.src)
                            };

                            // Assign to Spatial Hash Chunk
                            // PERFORMANCE FIX: Swapped Math.floor with bitwise | 0
                            const chunkX = Math.max(0, (dx / CHUNK_SIZE) | 0);
                            const chunkY = Math.max(0, (dy / CHUNK_SIZE) | 0);
                            const chunkKey = (chunkX << 16) | chunkY;

                            let chunk = this.decorChunks.get(chunkKey);
                            if (!chunk) {
                                chunk = [];
                                this.decorChunks.set(chunkKey, chunk);
                            }
                            chunk.push(decorItem);
                            
                            // Keep a flat array just in case other expansions need to loop through everything
                            this.decor.push(decorItem); 
                            
                            placed++;
                        }
                    }
                }
            }
        });

        // ==========================================
        // 3. HIGH-PERFORMANCE CHUNKED RENDERING
        // ==========================================
        game.bus.on('preDraw', (ctx) => {
            if (!game.decorInitialized) return;

            const padding = 100;
            
            // Calculate which chunks the camera is currently looking at
            // PERFORMANCE FIX: Swapped Math.floor with bitwise | 0
            const startX = Math.max(0, ((game.camera.x - padding) / CHUNK_SIZE) | 0);
            const endX = Math.max(0, ((game.camera.x + game.canvas.width + padding) / CHUNK_SIZE) | 0);
            const startY = Math.max(0, ((game.camera.y - padding) / CHUNK_SIZE) | 0);
            const endY = Math.max(0, ((game.camera.y + game.canvas.height + padding) / CHUNK_SIZE) | 0);

            // ONLY loop through the chunks that are visible!
            for (let cy = startY; cy <= endY; cy++) {
                for (let cx = startX; cx <= endX; cx++) {
                    
                    // PERFORMANCE FIX: Zero-allocation bitwise lookup
                    const chunkKey = (cx << 16) | cy;
                    const chunk = game.decorChunks.get(chunkKey);
                    
                    if (chunk) {
                        for (let i = 0; i < chunk.length; i++) {
                            let d = chunk[i];
                            
                            ctx.save();
                            
                            // JUICE: Ambient Wind and Water Ripples!
                            let drawY = d.y;
                            let drawAngle = d.angle;
                            
                            if (d.type === 'water') {
                                // Gentle bobbing on the Y axis, offset by its X coordinate so they don't all bob in sync
                                drawY += Math.sin(game.tick * 0.03 + d.x) * 2; 
                            } else if (d.type === 'grass' || d.type === 'vines') {
                                // Gentle swaying in the wind
                                drawAngle += Math.sin(game.tick * 0.015 + d.y) * 0.08; 
                            }

                            ctx.translate(d.x, drawY);
                            ctx.rotate(drawAngle);       
                            ctx.globalAlpha = d.alpha; 
                            
                            // Render Asset or Fallback Shape
                            if (d.sprite && d.sprite.complete && d.sprite.naturalHeight !== 0) {
                                // ASPECT RATIO FIX: Calculate dynamic width based on actual image proportions
                                const aspect = d.sprite.naturalWidth / d.sprite.naturalHeight;
                                const drawH = d.renderSize;
                                const drawW = drawH * aspect;
                                
                                ctx.drawImage(d.sprite, -drawW / 2, -drawH / 2, drawW, drawH);
                            } else {
                                // Graceful fallback
                                ctx.fillStyle = d.fallbackColor;
                                ctx.beginPath(); 
                                ctx.ellipse(0, 0, d.size, d.size * 0.6, 0, 0, MathUtils.TWO_PI); 
                                ctx.fill();
                            }
                            
                            ctx.restore();
                        }
                    }
                }
            }
        });
    }
};
