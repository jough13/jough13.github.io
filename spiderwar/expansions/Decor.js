// expansions/Decor.js
import { MathUtils } from '../game.js';

// ==========================================
// 1. DATA-DRIVEN DECOR CONFIGURATION
// ==========================================
// Easy to expand with new biomes and clutter types!
const DECOR_CONFIG = {
    water:   { src: 'assets/clutter_water.png',   count: 400, minSize: 15, maxSize: 30, minAlpha: 0.6, maxAlpha: 0.9 },
    grass:   { src: 'assets/clutter_grass.png',   count: 600, minSize: 10, maxSize: 25, minAlpha: 0.8, maxAlpha: 1.0 },
    pebbles: { src: 'assets/clutter_pebbles.png', count: 500, minSize: 8,  maxSize: 18, minAlpha: 0.7, maxAlpha: 1.0 },
    
    // LORE-THEMED CLUTTER
    dirt:    { src: 'assets/clutter_bones.png',   count: 200, minSize: 12, maxSize: 25, minAlpha: 0.5, maxAlpha: 0.8 }, // Scattered prey bones
    vines:   { src: 'assets/clutter_web.png',     count: 300, minSize: 20, maxSize: 40, minAlpha: 0.3, maxAlpha: 0.7 }  // Old sticky webs
};

const CHUNK_SIZE = 500; // Size of spatial hash grids for rendering performance

export const DecorExpansion = {
    init: (game) => {
        game.decorChunks = {}; // Spatial Hash Map: "x,y" -> [decor array]
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
                            const decorItem = {
                                x: dx, 
                                y: dy, 
                                type: type, 
                                size: MathUtils.randomRange(config.minSize, config.maxSize),
                                angle: Math.random() * Math.PI * 2, // Organic rotation
                                alpha: MathUtils.randomRange(config.minAlpha, config.maxAlpha), // Organic transparency
                                
                                // --- 2. INSTANT RAM CACHE RETRIEVAL ---
                                sprite: this.assets.get(config.src)
                            };

                            // Assign to Spatial Hash Chunk
                            const chunkX = Math.floor(dx / CHUNK_SIZE);
                            const chunkY = Math.floor(dy / CHUNK_SIZE);
                            const chunkKey = `${chunkX},${chunkY}`;

                            if (!this.decorChunks[chunkKey]) this.decorChunks[chunkKey] = [];
                            this.decorChunks[chunkKey].push(decorItem);
                            
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
            const startX = Math.floor((game.camera.x - padding) / CHUNK_SIZE);
            const endX = Math.floor((game.camera.x + game.canvas.width + padding) / CHUNK_SIZE);
            const startY = Math.floor((game.camera.y - padding) / CHUNK_SIZE);
            const endY = Math.floor((game.camera.y + game.canvas.height + padding) / CHUNK_SIZE);

            // ONLY loop through the chunks that are visible!
            for (let cy = startY; cy <= endY; cy++) {
                for (let cx = startX; cx <= endX; cx++) {
                    
                    const chunk = game.decorChunks[`${cx},${cy}`];
                    
                    if (chunk) {
                        for (let i = 0; i < chunk.length; i++) {
                            let d = chunk[i];
                            
                            // Because these are pulled from RAM, they are instantly ready to draw
                            if (d.sprite && d.sprite.complete && d.sprite.naturalHeight !== 0) {
                                ctx.save();
                                ctx.translate(d.x, d.y);
                                ctx.rotate(d.angle);       // Apply organic rotation
                                ctx.globalAlpha = d.alpha; // Apply organic fading
                                
                                ctx.drawImage(d.sprite, -d.size, -d.size, d.size*2, d.size*2);
                                
                                ctx.restore();
                            }
                        }
                    }
                }
            }
        });
    }
};
