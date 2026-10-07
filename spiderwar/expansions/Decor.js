// expansions/Decor.js
import { MathUtils } from '../game.js';

// ==========================================
// 1. DATA-DRIVEN DECOR CONFIGURATION
// ==========================================
// [EXPANDABILITY] Exported so other mods can inject new biomes and behaviors!
export const DECOR_CONFIG = {
    // Behaviors: 'liquid' (bobs up/down), 'plant' (sways from base), 'solid' (casts shadow)
    water:   { src: 'assets/clutter_water.png',   count: 400, minSize: 15, maxSize: 30, minAlpha: 0.6, maxAlpha: 0.9, fallbackColor: '#1a4e6e', behavior: 'liquid' },
    grass:   { src: 'assets/clutter_grass.png',   count: 600, minSize: 10, maxSize: 25, minAlpha: 0.8, maxAlpha: 1.0, fallbackColor: '#1f4d15', behavior: 'plant' },
    pebbles: { src: 'assets/clutter_pebbles.png', count: 500, minSize: 8,  maxSize: 18, minAlpha: 0.7, maxAlpha: 1.0, fallbackColor: '#4a4a4a', behavior: 'solid' },
    
    // LORE-THEMED CLUTTER
    dirt:    { src: 'assets/clutter_bones.png',   count: 200, minSize: 12, maxSize: 25, minAlpha: 0.5, maxAlpha: 0.8, fallbackColor: '#dfba96', behavior: 'solid' }, // Scattered prey bones
    vines:   { src: 'assets/clutter_web.png',     count: 300, minSize: 20, maxSize: 40, minAlpha: 0.3, maxAlpha: 0.7, fallbackColor: '#ffffff', behavior: 'plant' }  // Old sticky webs
};

const CHUNK_SIZE = 500; // Size of spatial hash grids for rendering performance

export const DecorExpansion = {
    init: (game) => {
        game.decorChunks = new Map(); // PERFORMANCE FIX: Map() for integer key lookups
        game.decorInitialized = false;
        
        // Expose configuration to the game engine
        game.decorConfig = DECOR_CONFIG;

        // --- 1. ASSET REGISTRY ---
        // Dynamically register all configured sprites
        for (const [type, config] of Object.entries(game.decorConfig)) {
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
                
                const maxChunkX = Math.ceil(this.world.width / CHUNK_SIZE);
                const maxChunkY = Math.ceil(this.world.height / CHUNK_SIZE);
                
                // Scatter decor across the map based on the config counts
                for (const [type, config] of Object.entries(this.decorConfig)) {
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
                                behavior: config.behavior, // [PERFORMANCE] Cached behavior tag
                                size: rawSize,
                                renderSize: rawSize * 2,   // Pre-calculated math saves multiplications per frame
                                angle: Math.random() * MathUtils.TWO_PI, 
                                alpha: MathUtils.randomRange(config.minAlpha, config.maxAlpha), 
                                fallbackColor: config.fallbackColor,
                                
                                // INSTANT RAM CACHE RETRIEVAL
                                sprite: this.assets.get(config.src)
                            };

                            // Assign to Spatial Hash Chunk
                            const chunkX = MathUtils.clamp((dx / CHUNK_SIZE) | 0, 0, maxChunkX);
                            const chunkY = MathUtils.clamp((dy / CHUNK_SIZE) | 0, 0, maxChunkY);
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
            const maxChunkX = Math.ceil(game.world.width / CHUNK_SIZE);
            const maxChunkY = Math.ceil(game.world.height / CHUNK_SIZE);
            
            // [FIX] Viewport Clamping: Prevents looking up non-existent chunks if camera shakes out of bounds
            const startX = MathUtils.clamp(((game.camera.x - padding) / CHUNK_SIZE) | 0, 0, maxChunkX);
            const endX = MathUtils.clamp(((game.camera.x + game.canvas.width + padding) / CHUNK_SIZE) | 0, 0, maxChunkX);
            const startY = MathUtils.clamp(((game.camera.y - padding) / CHUNK_SIZE) | 0, 0, maxChunkY);
            const endY = MathUtils.clamp(((game.camera.y + game.canvas.height + padding) / CHUNK_SIZE) | 0, 0, maxChunkY);

            // [PERFORMANCE] Cache game tick once per frame
            const tick = game.tick;

            // ONLY loop through the chunks that are visible!
            for (let cy = startY; cy <= endY; cy++) {
                for (let cx = startX; cx <= endX; cx++) {
                    
                    const chunkKey = (cx << 16) | cy;
                    const chunk = game.decorChunks.get(chunkKey);
                    
                    if (chunk) {
                        for (let i = 0; i < chunk.length; i++) {
                            let d = chunk[i];
                            
                            ctx.save();
                            ctx.globalAlpha = d.alpha; 
                            
                            // [JUICE] Ambient Animations based on behavior tags!
                            if (d.behavior === 'liquid') {
                                // Gentle bobbing on the Y axis
                                const drawY = d.y + Math.sin(tick * 0.03 + d.x) * 2; 
                                ctx.translate(d.x, drawY);
                                ctx.rotate(d.angle);       
                                
                            } else if (d.behavior === 'plant') {
                                // [JUICE] Base-hinged swaying! 
                                // Translates to the BOTTOM of the sprite, rotates, then draws offset.
                                const sway = Math.sin(tick * 0.015 + d.y) * 0.08;
                                ctx.translate(d.x, d.y + d.size); // Move to the "roots"
                                ctx.rotate(d.angle + sway);       // Apply wind
                                ctx.translate(0, -d.size);        // Move back up to draw center
                                
                            } else {
                                // Solid objects
                                ctx.translate(d.x, d.y);
                                ctx.rotate(d.angle);
                                
                                // [JUICE] Drop Shadows anchor solid objects to the dirt!
                                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                                ctx.shadowBlur = 4;
                                ctx.shadowOffsetY = 2;
                            }
                            
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
                            
                            ctx.restore(); // Cleans up transforms, alphas, and shadows automatically!
                        }
                    }
                }
            }
        });
    }
};
