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

// ==========================================
// 2. EXPANSION LOGIC
// ==========================================
export const TerrainExpansion = {
    init: (game) => {
        game.tileSize = TERRAIN_CONFIG.tileSize; 
        
        // --- 1. ASSET LOADING ---
        game.tiles = { 
            dirt: new Image(), vines: new Image(), pebbles: new Image(), grass: new Image(),
            water_straight: new Image(), water_corner: new Image(), 
            water_end: new Image(), water_t: new Image(), water_cross: new Image()
        };
        
        game.tiles.dirt.src = 'assets/tile_dirt.png'; 
        game.tiles.vines.src = 'assets/tile_vines.png'; 
        game.tiles.pebbles.src = 'assets/tile_pebbles.png'; 
        game.tiles.grass.src = 'assets/tile_grass.png';
        
        game.tiles.water_straight.src = 'assets/water_straight.png'; 
        game.tiles.water_corner.src = 'assets/water_corner.png';
        game.tiles.water_end.src = 'assets/water_end.png'; 
        game.tiles.water_t.src = 'assets/water_t.png';
        game.tiles.water_cross.src = 'assets/water_cross.png';

        // --- 2. TEXTURE BAKING ---
        // Pre-renders smaller repeating textures onto full 256x256 canvases for massive render performance
        game.bakedTiles = {};
        const bakeTile = (type) => {
            const img = game.tiles[type];
            if (!img.complete || img.naturalHeight === 0) return;
            
            const c = document.createElement('canvas');
            c.width = game.tileSize; 
            c.height = game.tileSize;
            const ctx = c.getContext('2d');
            
            ctx.imageSmoothingEnabled = false; // Preserve 16-bit retro aesthetic

            // If it's a micro-tile, repeat it across the canvas
            if (img.width < game.tileSize && !type.startsWith('water_')) {
                for (let y = 0; y < game.tileSize; y += img.height) {
                    for (let x = 0; x < game.tileSize; x += img.width) { 
                        ctx.drawImage(img, x, y); 
                    }
                }
            } else {
                ctx.drawImage(img, 0, 0, game.tileSize, game.tileSize);
            }
            game.bakedTiles[type] = c;
        };

        // Fire baking when assets finish downloading
        for (let key in game.tiles) {
            if (game.tiles[key].complete) bakeTile(key);
            else game.tiles[key].onload = () => bakeTile(key);
        }
        
        // --- 3. MAP GENERATION ---
        game.generateMap = function() {
            this.mapGrid = [];
            const cols = Math.ceil(this.world.width / this.tileSize); 
            const rows = Math.ceil(this.world.height / this.tileSize);
            
            // Generate Base Terrain
            for (let y = 0; y < rows; y++) {
                let row = [];
                for (let x = 0; x < cols; x++) { 
                    
                    // Select biome based on weighted probabilities
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

                    // Visual Polish: Randomly rotate base tiles (0, 90, 180, 270 deg) to hide repeating grid patterns!
                    const randomRotation = MathUtils.randomInt(0, 3) * (Math.PI / 2);
                    
                    row.push({ type: type, sprite: type, angle: randomRotation });
                }
                this.mapGrid.push(row);
            }
            
            // Generate Organic River
            let rX = Math.floor(cols / 2);
            for (let rY = 0; rY < rows; rY++) {
                this.mapGrid[rY][rX].type = 'water';
                this.mapGrid[rY][rX].angle = 0; // Water angle is strictly controlled by autotiling
                
                // Drunkard's Walk river generation
                if (Math.random() > 0.5 && rY < rows - 1) {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    rX = MathUtils.clamp(rX + dir, 1, cols - 2);
                    this.mapGrid[rY][rX].type = 'water';
                    this.mapGrid[rY][rX].angle = 0;
                }
            }

            // --- 4. WATER AUTOTILING (BITMASKING) ---
            this.updateBitmasks = function() {
                const bitMap = {
                    0:  {s: 'water_end',      a: 0},           
                    1:  {s: 'water_end',      a: 0},        
                    2:  {s: 'water_end',      a: Math.PI/2},   
                    4:  {s: 'water_end',      a: Math.PI},  
                    8:  {s: 'water_end',      a: -Math.PI/2},  
                    5:  {s: 'water_straight', a: 0},   
                    10: {s: 'water_straight', a: Math.PI/2}, 
                    3:  {s: 'water_corner',   a: 0}, 
                    6:  {s: 'water_corner',   a: Math.PI/2}, 
                    12: {s: 'water_corner',   a: Math.PI}, 
                    9:  {s: 'water_corner',   a: -Math.PI/2}, 
                    7:  {s: 'water_t',        a: 0},        
                    14: {s: 'water_t',        a: Math.PI/2},    
                    13: {s: 'water_t',        a: Math.PI},   
                    11: {s: 'water_t',        a: -Math.PI/2},   
                    15: {s: 'water_cross',    a: 0}      
                };

                // Helper: safely checks for water, treating map boundaries as water to make rivers flow off-screen
                const isWater = (gx, gy) => {
                    if (gy < 0 || gy >= rows || gx < 0 || gx >= cols) return true; 
                    return this.mapGrid[gy][gx].type === 'water';
                };

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        if (this.mapGrid[y][x].type === 'water') {
                            let mask = 0;
                            // Check North, East, South, West
                            if (isWater(x, y - 1)) mask += 1;
                            if (isWater(x + 1, y)) mask += 2;
                            if (isWater(x, y + 1)) mask += 4;
                            if (isWater(x - 1, y)) mask += 8;

                            this.mapGrid[y][x].sprite = bitMap[mask].s;
                            this.mapGrid[y][x].angle = bitMap[mask].a;
                        }
                    }
                }
            };
            this.updateBitmasks(); 
        };
        
        // Execute map generation immediately!
        game.generateMap();

        // Helper function for external expansions (like Speed Modifiers)
        game.getTerrainAt = function(x, y) {
            const tX = Math.floor(x / this.tileSize); 
            const tY = Math.floor(y / this.tileSize);
            if (this.mapGrid[tY] && this.mapGrid[tY][tX]) return this.mapGrid[tY][tX].type;
            return 'dirt'; // Default safe fallback
        };
    },

    patch: (game) => {
        // --- 5. RENDER LOOP ---
        game.bus.on('preDraw', (ctx) => {
            if (!game.mapGrid) return;
            
            // Viewport Culling Bounds (Prevents rendering the entire map)
            const startCol = Math.max(0, Math.floor(game.camera.x / game.tileSize)); 
            const endCol = Math.min(game.mapGrid[0].length - 1, startCol + Math.ceil(game.canvas.width / game.tileSize) + 1);
            
            const startRow = Math.max(0, Math.floor(game.camera.y / game.tileSize)); 
            const endRow = Math.min(game.mapGrid.length - 1, startRow + Math.ceil(game.canvas.height / game.tileSize) + 1);
            
            const halfSize = game.tileSize / 2;

            for (let y = startRow; y <= endRow; y++) {
                for (let x = startCol; x <= endCol; x++) {
                    
                    const tileData = game.mapGrid[y][x];
                    const drawX = x * game.tileSize;
                    const drawY = y * game.tileSize;

                    // 1. Draw solid dirt foundation to prevent 1px gap tearing between tiles
                    if (game.bakedTiles['dirt']) { 
                        ctx.drawImage(game.bakedTiles['dirt'], drawX, drawY); 
                    } else { 
                        ctx.fillStyle = TERRAIN_CONFIG.biomes.dirt.fallback; 
                        ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize); 
                    }

                    if (tileData.type === 'dirt') continue; // Foundation already drawn

                    // 2. Draw actual biome/water tile
                    const img = game.bakedTiles[tileData.sprite];
                    
                    if (img) {
                        // Apply angle (autotile rotation for water, or organic grid-breaking rotation for land)
                        if (tileData.angle !== 0) {
                            ctx.save(); 
                            ctx.translate(drawX + halfSize, drawY + halfSize); 
                            ctx.rotate(tileData.angle);
                            ctx.drawImage(img, -halfSize, -halfSize); 
                            ctx.restore();
                        } else {
                            ctx.drawImage(img, drawX, drawY);
                        }
                    } else {
                        // Safe fallback if images haven't loaded yet
                        ctx.fillStyle = tileData.type === 'water' ? TERRAIN_CONFIG.waterFallback : TERRAIN_CONFIG.biomes[tileData.type].fallback;
                        ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize);
                    }
                }
            }
        });
    }
};
