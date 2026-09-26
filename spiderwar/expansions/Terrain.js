// expansions/Terrain.js

export const TerrainExpansion = {
    init: (game) => {
        game.tileSize = 256; 
        
        game.tiles = { 
            dirt: new Image(), vines: new Image(), pebbles: new Image(), grass: new Image(),
            water_straight: new Image(), water_corner: new Image(), 
            water_end: new Image(), water_t: new Image(), water_cross: new Image()
        };
        
        game.tiles.dirt.src = 'assets/tile_dirt.png'; game.tiles.vines.src = 'assets/tile_vines.png'; 
        game.tiles.pebbles.src = 'assets/tile_pebbles.png'; game.tiles.grass.src = 'assets/tile_grass.png';
        game.tiles.water_straight.src = 'assets/water_straight.png'; game.tiles.water_corner.src = 'assets/water_corner.png';
        game.tiles.water_end.src = 'assets/water_end.png'; game.tiles.water_t.src = 'assets/water_t.png';
        game.tiles.water_cross.src = 'assets/water_cross.png';

        game.bakedTiles = {};
        const bakeTile = (type) => {
            const img = game.tiles[type];
            if(!img.complete || img.naturalHeight === 0) return;
            
            const c = document.createElement('canvas');
            c.width = game.tileSize; c.height = game.tileSize;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = false; 

            if (img.width < game.tileSize && !type.startsWith('water_')) {
                for(let y = 0; y < game.tileSize; y += img.height) {
                    for(let x = 0; x < game.tileSize; x += img.width) { ctx.drawImage(img, x, y); }
                }
            } else {
                ctx.drawImage(img, 0, 0, game.tileSize, game.tileSize);
            }
            game.bakedTiles[type] = c;
        };

        for(let key in game.tiles) {
            if (game.tiles[key].complete) bakeTile(key);
            else game.tiles[key].onload = () => bakeTile(key);
        }
        
        game.generateMap = function() {
            this.mapGrid = [];
            const cols = Math.ceil(this.world.width / this.tileSize); 
            const rows = Math.ceil(this.world.height / this.tileSize);
            
            for (let y = 0; y < rows; y++) {
                let row = [];
                for (let x = 0; x < cols; x++) { 
                    let type = Math.random() > 0.75 ? 'vines' : (Math.random() > 0.60 ? 'pebbles' : 'dirt');
                    if(Math.random() > 0.85) type = 'grass';
                    row.push({ type: type, sprite: type, angle: 0 });
                }
                this.mapGrid.push(row);
            }
            
            let rX = Math.floor(cols / 2);
            for (let rY = 0; rY < rows; rY++) {
                this.mapGrid[rY][rX].type = 'water';
                if(Math.random() > 0.5 && rY < rows - 1) {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    rX = Math.max(1, Math.min(rX + dir, cols-2));
                    this.mapGrid[rY][rX].type = 'water';
                }
            }

            this.updateBitmasks = function() {
                const bitMap = {
                    0: {s: 'water_end', a: 0},           1: {s: 'water_end', a: 0},        
                    2: {s: 'water_end', a: Math.PI/2},   4: {s: 'water_end', a: Math.PI},  
                    8: {s: 'water_end', a: -Math.PI/2},  5: {s: 'water_straight', a: 0},   
                    10: {s: 'water_straight', a: Math.PI/2}, 3: {s: 'water_corner', a: 0}, 
                    6: {s: 'water_corner', a: Math.PI/2}, 12: {s: 'water_corner', a: Math.PI}, 
                    9: {s: 'water_corner', a: -Math.PI/2}, 7: {s: 'water_t', a: 0},        
                    14: {s: 'water_t', a: Math.PI/2},    13: {s: 'water_t', a: Math.PI},   
                    11: {s: 'water_t', a: -Math.PI/2},   15: {s: 'water_cross', a: 0}      
                };

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        if (this.mapGrid[y][x].type === 'water') {
                            let mask = 0;
                            if (y > 0 && this.mapGrid[y-1][x].type === 'water') mask += 1;
                            if (x < cols-1 && this.mapGrid[y][x+1].type === 'water') mask += 2;
                            if (y < rows-1 && this.mapGrid[y+1][x].type === 'water') mask += 4;
                            if (x > 0 && this.mapGrid[y][x-1].type === 'water') mask += 8;

                            this.mapGrid[y][x].sprite = bitMap[mask].s;
                            this.mapGrid[y][x].angle = bitMap[mask].a;
                        }
                    }
                }
            };
            this.updateBitmasks(); 
        };
        game.generateMap();

        game.getTerrainAt = function(x, y) {
            const tX = Math.floor(x / this.tileSize); const tY = Math.floor(y / this.tileSize);
            if(this.mapGrid[tY] && this.mapGrid[tY][tX]) return this.mapGrid[tY][tX].type;
            return 'dirt';
        };
    },
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            if (!game.mapGrid) return;
            
            const startCol = Math.floor(game.camera.x / game.tileSize); 
            const endCol = startCol + Math.ceil(game.canvas.width / game.tileSize) + 1;
            const startRow = Math.floor(game.camera.y / game.tileSize); 
            const endRow = startRow + Math.ceil(game.canvas.height / game.tileSize) + 1;
            
            for (let y = startRow; y <= endRow; y++) {
                for (let x = startCol; x <= endCol; x++) {
                    if (y >= 0 && y < game.mapGrid.length && x >= 0 && x < game.mapGrid[y].length) {
                        const tileData = game.mapGrid[y][x];
                        const drawX = x * game.tileSize;
                        const drawY = y * game.tileSize;

                        if (game.bakedTiles['dirt']) { ctx.drawImage(game.bakedTiles['dirt'], drawX, drawY); } 
                        else { ctx.fillStyle = '#3d2817'; ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize); }

                        if (tileData.type === 'dirt') continue;

                        const img = game.bakedTiles[tileData.sprite];
                        if (img) {
                            if (tileData.angle !== 0) {
                                ctx.save(); ctx.translate(drawX + game.tileSize/2, drawY + game.tileSize/2); ctx.rotate(tileData.angle);
                                ctx.drawImage(img, -game.tileSize/2, -game.tileSize/2); ctx.restore();
                            } else {
                                ctx.drawImage(img, drawX, drawY);
                            }
                        }
                    }
                }
            }
        });
    }
};