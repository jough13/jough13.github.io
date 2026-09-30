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
const TWO_PI = Math.PI * 2;

export const DecorExpansion = {
    init: (game) => {
        game.decorChunks = new Map(); // PERFORMANCE FIX: Swapped {} to Map() for integer key lookups
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
                                renderSize: rawSize * 2, // PERFORMANCE FIX: Pre-calculated math saves 2 multiplications per frame per decor item!
                                angle: Math.random() * TWO_PI, // Organic rotation
                                alpha: MathUtils.randomRange(config.minAlpha, config.maxAlpha), // Organic transparency
                                fallbackColor: config.fallbackColor,
                                
                                // --- 2. INSTANT RAM CACHE RETRIEVAL ---
                                sprite: this.assets.get(config.src)
                            };

                            // Assign to Spatial Hash Chunk
                            // SAFETY FIX: Ensure chunks don't go negative and use Bitwise Integers to prevent GC String Allocation
                            const chunkX = Math.max(0, Math.floor(dx / CHUNK_SIZE));
                            const chunkY = Math.max(0, Math.floor(dy / CHUNK_SIZE));
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
            
            // Calculate which chunks the camera is currently looking at (Safely clamped to 0)
            const startX = Math.max(0, Math.floor((game.camera.x - padding) / CHUNK_SIZE));
            const endX = Math.max(0, Math.floor((game.camera.x + game.canvas.width + padding) / CHUNK_SIZE));
            const startY = Math.max(0, Math.floor((game.camera.y - padding) / CHUNK_SIZE));
            const endY = Math.max(0, Math.floor((game.camera.y + game.canvas.height + padding) / CHUNK_SIZE));

            // ONLY loop through the chunks that are visible!
            for (let cy = startY; cy <= endY; cy++) {
                for (let cx = startX; cx <= endX; cx++) {
                    
                    // PERFORMANCE FIX: Zero-allocation bitwise lookup instead of string interpolation
                    const chunkKey = (cx << 16) | cy;
                    const chunk = game.decorChunks.get(chunkKey);
                    
                    if (chunk) {
                        for (let i = 0; i < chunk.length; i++) {
                            let d = chunk[i];
                            
                            ctx.save();
                            ctx.translate(d.x, d.y);
                            ctx.rotate(d.angle);       // Apply organic rotation
                            ctx.globalAlpha = d.alpha; // Apply organic fading
                            
                            // Render Asset or Fallback Shape
                            if (d.sprite && d.sprite.complete && d.sprite.naturalHeight !== 0) {
                                ctx.drawImage(d.sprite, -d.size, -d.size, d.renderSize, d.renderSize);
                            } else {
                                // SAFETY FIX: Graceful fallback so map still looks populated if an image is missing
                                ctx.fillStyle = d.fallbackColor;
                                ctx.beginPath(); 
                                ctx.ellipse(0, 0, d.size, d.size * 0.6, 0, 0, TWO_PI); 
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
