// expansions/Terrain.js
import { MathUtils } from '../game.js';

// ==========================================
// 1. CONFIGURATION & DATA DICTIONARIES
// ==========================================
const TERRAIN_CONFIG = {
    tileSize: 256,
    
    // Base Biomes (Weights determine spawn probability out of 100)
    biomes: {
        dirt:    { weight: 60, fallback: '#3d2817' }, // Standard Obsidian Brood soil
        pebbles: { weight: 15, fallback: '#4a4a4a' }, // Rocky patches
        vines:   { weight: 15, fallback: '#2a3b1a' }, // Overgrown roots
        grass:   { weight: 10, fallback: '#1f4d15' }  // Camouflage for critters
    },
    
    // Autotiling Water Config
    waterFallback: '#1a4e6e'
};

const PI = Math.PI;
const HALF_PI = Math.PI / 2;

// WATER_BITMASK maps adjacency logic to specific sprites and rotations
const WATER_BITMASK = {
    0:  {s: 'water_end',      a: 0},           
    1:  {s: 'water_end',      a: 0},        
    2:  {s: 'water_end',      a: HALF_PI},   
    4:  {s: 'water_end',      a: PI},  
    8:  {s: 'water_end',      a: -HALF_PI},  
    5:  {s: 'water_straight', a: 0},   
    10: {s: 'water_straight', a: HALF_PI}, 
    3:  {s: 'water_corner',   a: 0}, 
    6:  {s: 'water_corner',   a: HALF_PI}, 
    12: {s: 'water_corner',   a: PI}, 
    9:  {s: 'water_corner',   a: -HALF_PI}, 
    7:  {s: 'water_t',        a: 0},        
    14: {s: 'water_t',        a: HALF_PI},    
    13: {s: 'water_t',        a: PI},   
    11: {s: 'water_t',        a: -HALF_PI},   
    15: {s: 'water_cross',    a: 0}      
};

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const TerrainExpansion = {
    init: (game) => {
        game.tileSize = TERRAIN_CONFIG.tileSize; 
        game.bakedTiles = {};
        game.terrainBaked = false;
        
        // Dictionary linking tile names to their file paths
        game.mapAssetsDict = {
            dirt: 'assets/tile_dirt.png', vines: 'assets/tile_vines.png', 
            pebbles: 'assets/tile_pebbles.png', grass: 'assets/tile_grass.png',
            water_straight: 'assets/water_straight.png', water_corner: 'assets/water_corner.png', 
            water_end: 'assets/water_end.png', water_t: 'assets/water_t.png', water_cross: 'assets/water_cross.png'
        };

        // --- 1. ASSET REGISTRY ---
        for (const src of Object.values(game.mapAssetsDict)) {
            game.assets.register(src);
        }
        
        // --- 2. MAP GENERATION ---
        game.generateMap = function() {
            const cols = Math.ceil(this.world.width / this.tileSize); 
            const rows = Math.ceil(this.world.height / this.tileSize);
            
            this.mapGrid = new Array(rows);
            
            // Generate Base Terrain
            for (let y = 0; y < rows; y++) {
                this.mapGrid[y] = new Array(cols);
                
                for (let x = 0; x < cols; x++) { 
                    
                    let type = 'dirt';
                    const roll = Math.random() * 100;
                    let cumulative = 0;
                    for (const [biome, config] of Object.entries(TERRAIN_CONFIG.biomes)) {
                        cumulative += config.weight;
                        if (roll <= cumulative) {
                            type = biome;
                            break;
                        }
                    }

                    const randomRotation = MathUtils.randomInt(0, 3) * HALF_PI;
                    
                    // PERFORMANCE FIX: Pre-calculate the physical X/Y render coordinates during map generation
                    // so the engine doesn't have to multiply (x * tileSize) 200 times a frame!
                    this.mapGrid[y][x] = { 
                        type: type, 
                        sprite: type, 
                        angle: randomRotation,
                        drawX: x * this.tileSize,
                        drawY: y * this.tileSize
                    };
                }
            }
            
            // Generate Organic River (Drunkard's Walk)
            let rX = Math.floor(cols / 2);
            for (let rY = 0; rY < rows; rY++) {
                this.mapGrid[rY][rX].type = 'water';
                this.mapGrid[rY][rX].angle = 0; 
                
                if (Math.random() > 0.5 && rY < rows - 1) {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    rX = MathUtils.clamp(rX + dir, 1, cols - 2);
                    this.mapGrid[rY][rX].type = 'water';
                    this.mapGrid[rY][rX].angle = 0;
                }
            }

            // --- WATER AUTOTILING (BITMASKING) ---
            this.updateBitmasks = function() {
                const mapRows = this.mapGrid.length;
                const mapCols = this.mapGrid[0].length;

                const isWater = (gx, gy) => {
                    if (gy < 0 || gy >= mapRows || gx < 0 || gx >= mapCols) return true; 
                    return this.mapGrid[gy][gx].type === 'water';
                };

                for (let y = 0; y < mapRows; y++) {
                    for (let x = 0; x < mapCols; x++) {
                        if (this.mapGrid[y][x].type === 'water') {
                            let mask = 0;
                            if (isWater(x, y - 1)) mask |= 1; // North
                            if (isWater(x + 1, y)) mask |= 2; // East
                            if (isWater(x, y + 1)) mask |= 4; // South
                            if (isWater(x - 1, y)) mask |= 8; // West

                            const tileData = WATER_BITMASK[mask];
                            this.mapGrid[y][x].sprite = tileData.s;
                            this.mapGrid[y][x].angle = tileData.a;
                        }
                    }
                }
            };
            this.updateBitmasks(); 
        };
        
        game.generateMap();

        game.getTerrainAt = function(x, y) {
            // PERFORMANCE FIX: Bitwise | 0 instead of Math.floor
            const tX = (x / this.tileSize) | 0; 
            const tY = (y / this.tileSize) | 0;
            if (this.mapGrid[tY] && this.mapGrid[tY][tX]) return this.mapGrid[tY][tX].type;
            return 'dirt'; 
        };
    },

    patch: (game) => {
        // --- 3. TEXTURE BAKING (TICK 1) ---
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            if (this.gameState === 'playing' && this.tick === 1 && !this.terrainBaked) {
                this.terrainBaked = true;
                this.tiles = {};

                for (const [key, src] of Object.entries(this.mapAssetsDict)) {
                    this.tiles[key] = this.assets.get(src);
                    const img = this.tiles[key];
                    
                    if (img && img.complete && img.naturalHeight !== 0) {
                        if (img.width > 0 && img.height > 0) {
                            const c = document.createElement('canvas');
                            c.width = this.tileSize; 
                            c.height = this.tileSize;
                            const ctx = c.getContext('2d');
                            
                            ctx.imageSmoothingEnabled = false; 

                            if (img.width < this.tileSize && !key.startsWith('water_')) {
                                for (let y = 0; y < this.tileSize; y += img.height) {
                                    for (let x = 0; x < this.tileSize; x += img.width) { 
                                        ctx.drawImage(img, x, y); 
                                    }
                                }
                            } else {
                                ctx.drawImage(img, 0, 0, this.tileSize, this.tileSize);
                            }
                            this.bakedTiles[key] = c; 
                        }
                    }
                }
            }
        });

        // --- 4. RENDER LOOP ---
        game.bus.on('preDraw', (ctx) => {
            if (!game.mapGrid) return;
            
            // Viewport Culling Bounds (Prevents rendering the entire map)
            // PERFORMANCE FIX: Fast bitwise math for map bounds
            const startCol = Math.max(0, (game.camera.x / game.tileSize) | 0); 
            const endCol = Math.min(game.mapGrid[0].length - 1, startCol + Math.ceil(game.canvas.width / game.tileSize) + 1);
            
            const startRow = Math.max(0, (game.camera.y / game.tileSize) | 0); 
            const endRow = Math.min(game.mapGrid.length - 1, startRow + Math.ceil(game.canvas.height / game.tileSize) + 1);
            
            const halfSize = game.tileSize / 2;
            
            const dirtTile = game.bakedTiles['dirt'];
            const fallbackDirtColor = TERRAIN_CONFIG.biomes.dirt.fallback;

            for (let y = startRow; y <= endRow; y++) {
                for (let x = startCol; x <= endCol; x++) {
                    
                    const tileData = game.mapGrid[y][x];
                    
                    // Uses our pre-calculated X/Y from Map Generation!
                    const drawX = tileData.drawX;
                    const drawY = tileData.drawY;

                    // 1. Draw solid dirt foundation
                    if (dirtTile) ctx.drawImage(dirtTile, drawX, drawY); 
                    else { 
                        ctx.fillStyle = fallbackDirtColor; 
                        ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize); 
                    }

                    if (tileData.type === 'dirt') continue; 

                    // 2. Draw actual biome/water tile
                    const img = game.bakedTiles[tileData.sprite];
                    
                    if (img) {
                        
                        // JUICE: Subtle Water Rippling Animation!
                        let renderY = drawY;
                        if (tileData.type === 'water') {
                            // Uses the tile's X coordinate to stagger the sine wave so they don't all bob simultaneously!
                            renderY += Math.sin(game.tick * 0.05 + x) * 2;
                        }

                        // Apply angle (autotile rotation for water, or organic grid-breaking rotation for land)
                        if (tileData.angle !== 0 || tileData.type === 'water') {
                            ctx.save(); 
                            ctx.translate(drawX + halfSize, renderY + halfSize); 
                            ctx.rotate(tileData.angle);
                            ctx.drawImage(img, -halfSize, -halfSize); 
                            ctx.restore();
                        } else {
                            ctx.drawImage(img, drawX, drawY);
                        }
                    } else {
                        // Safe fallback
                        ctx.fillStyle = tileData.type === 'water' ? TERRAIN_CONFIG.waterFallback : TERRAIN_CONFIG.biomes[tileData.type].fallback;
                        ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize);
                    }
                }
            }
        });
    }
};
