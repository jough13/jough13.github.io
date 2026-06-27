// --- START OF FILE worldmap.js ---

// ==========================================
// WORLD MAP SYSTEM & SETTINGS
// ==========================================

const mapModal = document.getElementById('mapModal');
const worldMapCanvas = document.getElementById('worldMapCanvas');
const worldMapCtx = worldMapCanvas.getContext('2d', { alpha: false }); // PERFORMANCE WIN: Disable alpha buffer for the main canvas!
const mapCoordsDisplay = document.getElementById('mapCoords');

// Settings & State
let currentMapScale = 4; 
let targetMapScale = 4;
const MAP_CHUNK_SIZE = 16; 

let mapCamera = { x: 0, y: 0 };
let targetMapCamera = { x: 0, y: 0 };

let isDraggingMap = false;
let lastMouseX = 0;
let lastMouseY = 0;
let hoverWorldX = null;
let hoverWorldY = null;
let mapAnimFrame = null;
let lastMapTouchTime = 0; // For mobile double-tap detection

// --- MINIMAP CACHE (With Memory Leak Protection) ---
const mapChunkCache = new Map();
const MAX_CACHED_CHUNKS = 500; // Optimal limit for smooth panning on modern devices

// PERFORMANCE WIN: Pre-compiled RGB Arrays
// Bypasses the incredibly expensive parseInt(hex, 16) operation inside the 16x16 loop!
const MAP_COLORS = {
    WHITE: [248, 250, 252, 255],
    DARK_RED: [153, 27, 27, 255],
    CAVE: [15, 23, 42, 255],
    MAGIC: [168, 85, 247, 255],
    BUILT: [156, 163, 175, 255],
    RED: [239, 68, 68, 255],
    DIG: [133, 77, 14, 255],
    DEEP_WATER: [30, 58, 138, 255],
    VOLCANO: [234, 88, 12, 255],
    TEMPLE: [2, 132, 199, 255],
    FLOTSAM: [250, 204, 21, 255],
    MOONBLOOM: [244, 114, 182, 255],
    STAR: [56, 189, 248, 255],
    SHALLOW: [59, 130, 246, 255],
    SWAMP: [66, 32, 6, 255],
    MOUNTAIN: [87, 83, 78, 255],
    DEADLANDS: [45, 45, 45, 255],
    DESERT: [253, 224, 71, 255],
    FOREST: [20, 83, 45, 255],
    PLAINS: [34, 197, 94, 255],
    CRYSTAL: [34, 211, 238, 255], 
    EMPTY: [0, 0, 0, 0],
    
    // Lore Anomalies
    ELDER_TREE: [6, 78, 59, 255],     
    FAIRY_RING: [217, 70, 239, 255],  
    CLOCKWORK: [180, 83, 9, 255],     
    MINE: [68, 64, 60, 255],          
    VOID: [46, 2, 73, 255],           
    ICE: [186, 230, 253, 255],
    BARD: [250, 204, 21, 255] // Yellow for the Wandering Bard       
};

function getCachedMapChunk(cx, cy) {
    const key = `${cx},${cy}`;
    if (mapChunkCache.has(key)) return mapChunkCache.get(key);

    // PERFORMANCE & MEMORY LEAK WIN: Strict Culling
    // Ensure we don't blow out the browser's GPU memory with thousands of cached canvases
    if (mapChunkCache.size >= MAX_CACHED_CHUNKS) {
        // Iterator trick to quickly pop the oldest (first) item from the Map
        const oldestKey = mapChunkCache.keys().next().value;
        mapChunkCache.delete(oldestKey);
    }

    const c = document.createElement('canvas');
    c.width = MAP_CHUNK_SIZE;
    c.height = MAP_CHUNK_SIZE;
    const ctx = c.getContext('2d', { alpha: false }); 

    // PERFORMANCE WIN: ImageData Buffer (Massively faster than ctx.fillRect)
    // Writing directly to the byte array is roughly 10x faster than issuing 256 vector drawing commands
    const imgData = ctx.createImageData(MAP_CHUNK_SIZE, MAP_CHUNK_SIZE);
    const data = imgData.data;

    for (let y = 0; y < MAP_CHUNK_SIZE; y++) {
        for (let x = 0; x < MAP_CHUNK_SIZE; x++) {
            const worldX = cx * MAP_CHUNK_SIZE + x;
            const worldY = cy * MAP_CHUNK_SIZE + y;
            const colorRGBA = getTileColorForMap(worldX, worldY); 
            
            const index = (y * MAP_CHUNK_SIZE + x) * 4;
            data[index] = colorRGBA[0];
            data[index + 1] = colorRGBA[1];
            data[index + 2] = colorRGBA[2];
            data[index + 3] = colorRGBA[3];
        }
    }

    ctx.putImageData(imgData, 0, 0);
    mapChunkCache.set(key, c);
    return c;
}

// Determines accurate colors including Nautical, Night, and Void items
function getTileColorForMap(worldX, worldY) {
    const tile = chunkManager.getTile(worldX, worldY); 

    // Landmarks & Structures
    if (['V', '🏰', '♛', '🏛️', '🚪', '🎓'].includes(tile)) return MAP_COLORS.WHITE;
    if (tile === '🕍') return MAP_COLORS.DARK_RED; 
    if (['⛰', '♣', '🏝️'].includes(tile)) return MAP_COLORS.CAVE;
    if (['#', '|', '⛩️', '⛲', '✨'].includes(tile)) return MAP_COLORS.MAGIC; 
    if (['🧱', '▤', '=', '+', '☒', '⛺'].includes(tile)) return MAP_COLORS.BUILT;
    if (tile === 'c' || tile === '⛵') return MAP_COLORS.RED;
    if (tile === '∴') return MAP_COLORS.DIG; 
    if (tile === '~') return MAP_COLORS.DEEP_WATER;
    if (tile === '🧊' || tile === '❄️') return MAP_COLORS.ICE;
    if (tile === '💎c') return MAP_COLORS.CRYSTAL;
    if (tile === '🎵') return MAP_COLORS.BARD;
    
    // Anomalies
    if (tile === '🌋') return MAP_COLORS.VOLCANO;
    if (tile === '🛕') return MAP_COLORS.TEMPLE;
    if (tile === '🛟' || tile === '🚢') return MAP_COLORS.FLOTSAM;
    if (tile === '🌺') return MAP_COLORS.MOONBLOOM;
    if (tile === '☄️') return MAP_COLORS.STAR;
    if (tile === '🌳e') return MAP_COLORS.ELDER_TREE;
    if (tile === '🍄r') return MAP_COLORS.FAIRY_RING;
    if (tile === '⚙️d') return MAP_COLORS.CLOCKWORK;
    if (tile === '⛰️m') return MAP_COLORS.MINE;
    if (tile === 'Ω' || tile === '🕳️') return MAP_COLORS.VOID;

    // Natural Biomes (Fallback)
    const realmOffset = (typeof gameState !== 'undefined' && gameState.currentRealm) ? gameState.currentRealm * 100 : 0;
    const elev = elevationNoise.noise(worldX / 70, worldY / 70, realmOffset);
    const moist = moistureNoise.noise(worldX / 50, worldY / 50, realmOffset);

    if (elev < 0.35) return MAP_COLORS.SHALLOW;
    if (elev < 0.4 && moist > 0.7) return MAP_COLORS.SWAMP;
    if (elev > 0.8) return MAP_COLORS.MOUNTAIN;
    if (elev > 0.6 && moist < 0.3) return MAP_COLORS.DEADLANDS;
    if (moist < 0.15) return MAP_COLORS.DESERT;
    if (moist > 0.55) return MAP_COLORS.FOREST;
    return MAP_COLORS.PLAINS;
}

function getMapTileName(x, y) {
    const chunkId = `${Math.floor(x / MAP_CHUNK_SIZE)},${Math.floor(y / MAP_CHUNK_SIZE)}`;
    
    // LORE WIN: Dynamic Uncharted labeling based on distance and dimension
    if (!gameState.exploredChunks.has(chunkId)) {
        if (gameState.currentRealm !== 0 && gameState.currentRealm) return "Unknown Dimensional Void";
        const distSq = (x * x) + (y * y);
        if (distSq > 2250000) return "The Deep Uncharted"; // > 1500 tiles away
        return "Uncharted Wilderness";
    }

    const tile = chunkManager.getTile(x, y);
    if (typeof TILE_DATA !== 'undefined' && TILE_DATA[tile] && TILE_DATA[tile].name) {
        return TILE_DATA[tile].name;
    } 
    
    // LORE WIN: Deeply Expanded Biome Dictionary
    const names = {
        'V': "Safe Haven (The Last Settlement)", '🏰': "Fallen Castle Ruins", '♛': "The Grand Fortress (Danger)",
        '🛕': "Sunken Abyssal Temple", '🌋': "Infernal Volcanic Island", 
        '⛰': "Dark Cavern Entrance", '🌳e': "Ancient Elder Tree",
        '🍄r': "Fae Territory (Fairy Ring)", '⚙️d': "Clockwork Vault (Second Age)",
        '⛰️m': "Abandoned Dwarven Mines", 'Ω': "Tear in the Firmament (Void Rift)",
        '🕳️': "Abyssal Chasm (Underworld Entrance)", '🚢': "Barnacle-Encrusted Shipwreck",
        '🛟': "Ocean Flotsam", '🌺': "Rare Moonbloom Patch", '☄️': "Star-Metal Crater",
        'F': "Dense Overgrown Forest", 'D': "Scorching Sand Dunes", 'd': "Ashen Deadlands",
        '^': "Impassable Mountain Peaks", '~': "The Deep Ocean", '≈': "Fetid Swamp Waters",
        '.': "Open Plains", '#': "Magical Leyline Waystone", '🗺️': "Cartographer's Guild Station",
        '🧊': "Slippery Glacial Ice", '❄️': "Deep Tundra Snow", '🌲': "Frozen Pine Forest",
        '💎c': "Crystalline Spires", '🍄': "Towering Fungal Jungle", '🕸': "Infested Spider Nest",
        '⛺k': "Abandoned Campfire", '⚰️': "Forgotten Grave", '?': "Whispering Statue",
        '|': "Ancient Obelisk", '⛲': "Wishing Well", '⛩️': "Ruined Shrine", 'V': "Village Wall",
        '🎵': "Wandering Bard", '⛺a': "Abandoned Campsite"
    };

    if (names[tile]) return names[tile];
    if (['🧱', '=', '+', '☒', '▤'].includes(tile)) return "Man-Made Structure";
    
    return "Explored Wilderness";
}

function openWorldMap() {
    mapChunkCache.clear(); 
    mapModal.classList.remove('hidden');
    
    mapCamera.x = gameState.player.x;
    mapCamera.y = gameState.player.y;
    targetMapCamera.x = gameState.player.x;
    targetMapCamera.y = gameState.player.y;
    targetMapScale = currentMapScale;
    
    if (typeof updateExploration === 'function') updateExploration();
    fitMapCanvasToContainer();
    
    if (!mapAnimFrame) mapLoop();
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
}

function closeWorldMap() {
    mapModal.classList.add('hidden');
    if (mapAnimFrame) {
        cancelAnimationFrame(mapAnimFrame);
        mapAnimFrame = null;
    }
    
    // Memory release for chunks outside our immediate view
    if (typeof chunkManager !== 'undefined' && chunkManager.unloadOutOfRangeChunks && gameState.player) {
        const currentChunkX = Math.floor(gameState.player.x / MAP_CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / MAP_CHUNK_SIZE);
        chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);
    }
}

function fitMapCanvasToContainer() {
    const container = worldMapCanvas.parentElement;
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        const dpr = window.devicePixelRatio || 1;
        worldMapCanvas.width = container.clientWidth * dpr;
        worldMapCanvas.height = container.clientHeight * dpr;
        
        worldMapCanvas.style.width = `${container.clientWidth}px`;
        worldMapCanvas.style.height = `${container.clientHeight}px`;
        
        worldMapCtx.setTransform(1, 0, 0, 1, 0, 0);
        worldMapCtx.scale(dpr, dpr);
    }
}

// --- RENDERING LOOP ---
function mapLoop() {
    if (mapModal.classList.contains('hidden')) return;

    currentMapScale += (targetMapScale - currentMapScale) * 0.3;
    if (!isDraggingMap) {
        mapCamera.x += (targetMapCamera.x - mapCamera.x) * 0.2;
        mapCamera.y += (targetMapCamera.y - mapCamera.y) * 0.2;
    }

    renderWorldMap();
    mapAnimFrame = requestAnimationFrame(mapLoop);
}

function renderWorldMap() {
    if (!gameState.player.exploredChunks) return;

    const logicalWidth = worldMapCanvas.clientWidth;
    const logicalHeight = worldMapCanvas.clientHeight;

    // Deep dark blue background for a blueprint/parchment feel
    // JUICE WIN: Darker, deeper blue for better contrast
    worldMapCtx.fillStyle = '#020617'; 
    worldMapCtx.fillRect(0, 0, logicalWidth, logicalHeight);
    worldMapCtx.imageSmoothingEnabled = false;

    // Draw panning cartography grid
    worldMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    worldMapCtx.lineWidth = 1;
    const gridSpacing = 50;
    const gridOffset_X = (mapCamera.x * currentMapScale) % gridSpacing;
    const gridOffset_Y = (mapCamera.y * currentMapScale) % gridSpacing;
    
    worldMapCtx.beginPath();
    for(let x = -gridOffset_X; x < logicalWidth; x += gridSpacing) {
        worldMapCtx.moveTo(x, 0);
        worldMapCtx.lineTo(x, logicalHeight);
    }
    for(let y = -gridOffset_Y; y < logicalHeight; y += gridSpacing) {
        worldMapCtx.moveTo(0, y);
        worldMapCtx.lineTo(logicalWidth, y);
    }
    worldMapCtx.stroke();

    // PERFORMANCE WIN: Bitwise rounding (`| 0`) is significantly faster than Math.floor()
    const centerX = (logicalWidth / 2) | 0;
    const centerY = (logicalHeight / 2) | 0;
    const chunkSizeOnScreen = MAP_CHUNK_SIZE * currentMapScale;
    const now = Date.now(); 

    // Render Explored Chunks
    gameState.exploredChunks.forEach(chunkId => {
        const parts = chunkId.split(',');
        const cx = parseInt(parts[0], 10);
        const cy = parseInt(parts[1], 10);
        if (isNaN(cx) || isNaN(cy)) return; 

        const chunkWorldX = cx * MAP_CHUNK_SIZE;
        const chunkWorldY = cy * MAP_CHUNK_SIZE;

        const screenX = ((chunkWorldX - mapCamera.x) * currentMapScale + centerX) | 0;
        const screenY = ((chunkWorldY - mapCamera.y) * currentMapScale + centerY) | 0;

        // Culling Check
        if (screenX + chunkSizeOnScreen < 0 || screenX > logicalWidth ||
            screenY + chunkSizeOnScreen < 0 || screenY > logicalHeight) {
            return;
        }

        const chunkCanvas = getCachedMapChunk(cx, cy);
        if (chunkCanvas) {
            worldMapCtx.drawImage(chunkCanvas, screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);
        }

        // Chunk Grid Lines
        worldMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        worldMapCtx.lineWidth = 1;
        worldMapCtx.strokeRect(screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);

        // Fine Tile Grid at high zoom levels
        if (currentMapScale >= 10) {
            worldMapCtx.beginPath();
            worldMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            for (let i = 1; i < MAP_CHUNK_SIZE; i++) {
                worldMapCtx.moveTo(screenX + i * currentMapScale, screenY);
                worldMapCtx.lineTo(screenX + i * currentMapScale, screenY + chunkSizeOnScreen);
                worldMapCtx.moveTo(screenX, screenY + i * currentMapScale);
                worldMapCtx.lineTo(screenX + chunkSizeOnScreen, screenY + i * currentMapScale);
            }
            worldMapCtx.stroke();
        }

        // LORE EXPANSION: Cartographer's Flourishes (Sea Monsters)
        // If zoomed out, procedurally draw faint sea monsters in deep ocean chunks
        if (currentMapScale < 12) {
            const seed = typeof stringToSeed === 'function' ? stringToSeed(`decor_${cx}_${cy}`) : cx * cy;
            const random = typeof Alea === 'function' ? Alea(seed) : Math.random; // Fallback
            
            if (random() < 0.04) { // 4% of chunks
                const decorType = random();
                let icon = '🦑';
                if (decorType < 0.3) icon = '🐋';
                else if (decorType < 0.6) icon = '⛵';
                else if (decorType < 0.75) icon = '🧜‍♀️';
                else icon = '👁️'; // The Leviathan watches...

                // Check if the center of this chunk is deep water
                const centerWorldX = cx * MAP_CHUNK_SIZE + 8;
                const centerWorldY = cy * MAP_CHUNK_SIZE + 8;
                const tile = chunkManager.getTile(centerWorldX, centerWorldY);
                
                if (tile === '~') {
                    worldMapCtx.fillStyle = icon === '👁️' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.2)'; 
                    worldMapCtx.font = `${currentMapScale * 8}px monospace`;
                    worldMapCtx.textAlign = 'center';
                    worldMapCtx.textBaseline = 'middle';
                    worldMapCtx.fillText(icon, screenX + chunkSizeOnScreen/2, screenY + chunkSizeOnScreen/2);
                }
            }
        }
    });

    // LORE EXPANSION: Dynamic Region Watermarks
    // Draws the text of the region ("The Whispering Plains") beautifully across the map
    const regSize = typeof REGION_SIZE !== 'undefined' ? REGION_SIZE : 160;
    const startWorldX = mapCamera.x - (logicalWidth / 2) / currentMapScale;
    const endWorldX = mapCamera.x + (logicalWidth / 2) / currentMapScale;
    const startWorldY = mapCamera.y - (logicalHeight / 2) / currentMapScale;
    const endWorldY = mapCamera.y + (logicalHeight / 2) / currentMapScale;

    const startRegX = Math.floor(startWorldX / regSize);
    const endRegX = Math.floor(endWorldX / regSize);
    const startRegY = Math.floor(startWorldY / regSize);
    const endRegY = Math.floor(endWorldY / regSize);

    worldMapCtx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // Highly transparent text
    worldMapCtx.font = `italic bold ${Math.max(16, currentMapScale * 6)}px "Uncial Antiqua", serif, cursive`;
    worldMapCtx.textAlign = 'center';
    worldMapCtx.textBaseline = 'middle';

    for (let ry = startRegY; ry <= endRegY; ry++) {
        for (let rx = startRegX; rx <= endRegX; rx++) {
            // Lazy visibility check: If they explored the center chunk of this region, show the name
            const centerChunkX = Math.floor((rx * regSize + (regSize/2)) / MAP_CHUNK_SIZE);
            const centerChunkY = Math.floor((ry * regSize + (regSize/2)) / MAP_CHUNK_SIZE);
            const centerChunkId = `${centerChunkX},${centerChunkY}`;

            if (gameState.exploredChunks.has(centerChunkId)) {
                const regName = typeof getRegionName === 'function' ? getRegionName(rx, ry) : "Wilderness";
                const regScreenX = ((rx * regSize + (regSize/2)) - mapCamera.x) * currentMapScale + centerX;
                const regScreenY = ((ry * regSize + (regSize/2)) - mapCamera.y) * currentMapScale + centerY;

                worldMapCtx.save();
                worldMapCtx.translate(regScreenX, regScreenY);
                worldMapCtx.rotate(-0.15); // Authentic diagonal map-text tilt
                worldMapCtx.fillText(regName, 0, 0);
                worldMapCtx.restore();
            }
        }
    }


    // ========================================================================
    // VISUAL WIN: THE LEYLINE NETWORK (Flowing Animation!)
    // ========================================================================
    if (gameState.player.unlockedWaypoints && gameState.player.unlockedWaypoints.length > 0) {
        worldMapCtx.strokeStyle = `rgba(168, 85, 247, 0.4)`; // Electric Purple
        worldMapCtx.lineWidth = Math.max(1.5, currentMapScale * 0.2);
        
        // Animated flowing dashes
        worldMapCtx.setLineDash([12 * currentMapScale, 6 * currentMapScale]);
        worldMapCtx.lineDashOffset = -(now / 30) % 1000; 

        worldMapCtx.beginPath();
        
        // Connect the Safe Haven Village (0,0) as the central hub to all other waypoints
        const vX = (0 - mapCamera.x) * currentMapScale + centerX;
        const vY = (0 - mapCamera.y) * currentMapScale + centerY;
        
        gameState.player.unlockedWaypoints.forEach(wp => {
            if (wp.x !== 0 || wp.y !== 0) { 
                const screenX = (wp.x - mapCamera.x) * currentMapScale + centerX;
                const screenY = (wp.y - mapCamera.y) * currentMapScale + centerY;
                
                // Culling Check
                if ((vX > -100 && vX < logicalWidth + 100 && vY > -100 && vY < logicalHeight + 100) ||
                    (screenX > -100 && screenX < logicalWidth + 100 && screenY > -100 && screenY < logicalHeight + 100)) {
                    worldMapCtx.moveTo(vX, vY);
                    worldMapCtx.lineTo(screenX, screenY);
                }
            }
        });
        worldMapCtx.stroke();
        worldMapCtx.setLineDash([]); // Reset
    }

    worldMapCtx.font = `bold ${Math.max(14, currentMapScale * 2)}px monospace`;
    worldMapCtx.textAlign = 'center';
    worldMapCtx.textBaseline = 'middle';

    // Render Custom Player Pins
    if (gameState.player.customPins && gameState.player.customPins.length > 0) {
        worldMapCtx.fillStyle = '#ffffff';
        const pinBob = Math.sin(now / 150) * (currentMapScale * 0.15); // Bounce!
        
        gameState.player.customPins.forEach(pin => {
            const screenX = (pin.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (pin.y - mapCamera.y) * currentMapScale + centerY;
            
            if (screenX >= 0 && screenX <= logicalWidth && screenY >= 0 && screenY <= logicalHeight) {
                // Drop shadow
                worldMapCtx.fillStyle = 'rgba(0,0,0,0.8)';
                worldMapCtx.fillText('📌', screenX + currentMapScale/2, (screenY + currentMapScale/2) + 2 + pinBob);
                
                // Pin
                worldMapCtx.fillStyle = '#ffffff';
                worldMapCtx.fillText('📌', screenX + currentMapScale/2, screenY + currentMapScale/2 + pinBob);
            }
        });
    }

    // Render Unlocked Waystones
    if (gameState.player.unlockedWaypoints && gameState.player.unlockedWaypoints.length > 0) {
        const wpPulse = (Math.sin(now / 200) + 1) / 2; 
        worldMapCtx.fillStyle = '#a855f7'; // Purple
        worldMapCtx.globalAlpha = 0.4 + wpPulse * 0.6;
        
        worldMapCtx.beginPath(); 
        gameState.player.unlockedWaypoints.forEach(wp => {
            const screenX = (wp.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (wp.y - mapCamera.y) * currentMapScale + centerY;
            
            if (screenX >= 0 && screenX <= logicalWidth && screenY >= 0 && screenY <= logicalHeight) {
                worldMapCtx.moveTo(screenX + currentMapScale/2, screenY + currentMapScale/2);
                worldMapCtx.arc(screenX + currentMapScale/2, screenY + currentMapScale/2, currentMapScale * 1.5, 0, Math.PI * 2);
            }
        });
        worldMapCtx.fill();
        worldMapCtx.globalAlpha = 1.0;
    }

    // Render Discovered Points of Interest (POIs)
    if (gameState.player.discoveredPOIs && gameState.player.discoveredPOIs.length > 0) {
        worldMapCtx.font = `bold ${Math.max(10, currentMapScale * 1.5)}px monospace`;
        const bobY = Math.sin(now / 300) * (currentMapScale * 0.2); 
        
        worldMapCtx.fillStyle = 'rgba(0,0,0,0.5)';
        worldMapCtx.beginPath();
        gameState.player.discoveredPOIs.forEach(poi => {
            const screenX = (poi.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (poi.y - mapCamera.y) * currentMapScale + centerY;
            if (screenX >= 0 && screenX <= logicalWidth && screenY >= 0 && screenY <= logicalHeight) {
                worldMapCtx.moveTo(screenX + currentMapScale/2, screenY + currentMapScale/2);
                worldMapCtx.arc(screenX + currentMapScale/2, screenY + currentMapScale/2, currentMapScale, 0, Math.PI * 2);
            }
        });
        worldMapCtx.fill();
        
        worldMapCtx.fillStyle = '#ffffff';
        gameState.player.discoveredPOIs.forEach(poi => {
            const screenX = (poi.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (poi.y - mapCamera.y) * currentMapScale + centerY;
            if (screenX >= 0 && screenX <= logicalWidth && screenY >= 0 && screenY <= logicalHeight) {
                worldMapCtx.fillText(poi.icon, screenX + currentMapScale/2, screenY + currentMapScale/2 + bobY);
            }
        });
    }

    // Render Active Treasure
    if (gameState.activeTreasure) {
        const tx = (gameState.activeTreasure.x - mapCamera.x) * currentMapScale + centerX;
        const ty = (gameState.activeTreasure.y - mapCamera.y) * currentMapScale + centerY;
        
        if (tx >= 0 && tx <= logicalWidth && ty >= 0 && ty <= logicalHeight) {
            worldMapCtx.fillStyle = '#ef4444'; 
            worldMapCtx.font = `bold ${Math.max(12, currentMapScale * 2)}px monospace`;
            worldMapCtx.fillText('❌', tx + currentMapScale/2, ty + currentMapScale/2);
            
            const pulse = (Math.sin(now / 200) + 1) / 2;
            worldMapCtx.strokeStyle = '#ef4444';
            worldMapCtx.globalAlpha = 1 - pulse;
            worldMapCtx.lineWidth = 2;
            worldMapCtx.beginPath();
            worldMapCtx.arc(tx + currentMapScale/2, ty + currentMapScale/2, currentMapScale * 2 + (pulse * 15), 0, Math.PI * 2);
            worldMapCtx.stroke();
            worldMapCtx.globalAlpha = 1.0;
        }
    }

    // Render Other Online Players
    if (typeof otherPlayers !== 'undefined') {
        worldMapCtx.fillStyle = '#f97316'; // Distinct Orange
        worldMapCtx.beginPath();
        Object.values(otherPlayers).forEach(op => {
            if (op.mapMode === 'overworld' && op.x !== undefined && op.y !== undefined) {
                const opX = (op.x - mapCamera.x) * currentMapScale + centerX;
                const opY = (op.y - mapCamera.y) * currentMapScale + centerY;
                
                if (opX >= 0 && opX <= logicalWidth && opY >= 0 && opY <= logicalHeight) {
                    worldMapCtx.moveTo(opX + currentMapScale/2, opY + currentMapScale/2);
                    worldMapCtx.arc(opX + currentMapScale/2, opY + currentMapScale/2, Math.max(2, currentMapScale * 0.8), 0, Math.PI * 2);
                }
            }
        });
        worldMapCtx.fill();
    }

    // Render Player Marker & Radar Pulse
    const playerScreenX = (gameState.player.x - mapCamera.x) * currentMapScale + centerX;
    const playerScreenY = (gameState.player.y - mapCamera.y) * currentMapScale + centerY;
    const playerPulse = (now % 2000) / 2000; 

    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX + currentMapScale/2, playerScreenY + currentMapScale/2, currentMapScale * 2 + (playerPulse * 30), 0, Math.PI * 2);
    worldMapCtx.strokeStyle = '#3b82f6';
    worldMapCtx.globalAlpha = 1 - playerPulse;
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();
    worldMapCtx.globalAlpha = 1.0;

    worldMapCtx.fillStyle = '#ef4444';
    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX + currentMapScale/2, playerScreenY + currentMapScale/2, Math.max(3, currentMapScale), 0, Math.PI * 2);
    worldMapCtx.fill();
    worldMapCtx.strokeStyle = '#ffffff';
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();
    
    worldMapCtx.fillStyle = '#ffffff';
    worldMapCtx.font = `bold ${Math.max(12, currentMapScale * 1.5)}px monospace`;
    worldMapCtx.fillText('You', playerScreenX + currentMapScale/2, playerScreenY - currentMapScale - 5);

    // Render Hover Highlight & Canvas Tooltip
    if (hoverWorldX !== null && hoverWorldY !== null) {
        const hScreenX = Math.floor((hoverWorldX - mapCamera.x) * currentMapScale + centerX);
        const hScreenY = Math.floor((hoverWorldY - mapCamera.y) * currentMapScale + centerY);
        
        worldMapCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        worldMapCtx.fillRect(hScreenX, hScreenY, currentMapScale, currentMapScale);
        worldMapCtx.strokeStyle = '#facc15';
        worldMapCtx.lineWidth = 1;
        worldMapCtx.strokeRect(hScreenX, hScreenY, currentMapScale, currentMapScale);

        const tileName = getMapTileName(hoverWorldX, hoverWorldY);
        if (tileName && !tileName.includes("Unknown")) {
            // JUICE WIN: Dynamic tooltip positioning prevents it from rendering off-screen!
            const padX = 8;
            const padY = 6;
            worldMapCtx.font = 'bold 12px monospace';
            const metrics = worldMapCtx.measureText(tileName);
            const boxWidth = metrics.width + padX * 2;
            const boxHeight = 24 + padY * 2;
            
            let tooltipX = hScreenX + currentMapScale + 8;
            let tooltipY = hScreenY + currentMapScale / 2;
            
            // Shift left if it hits the edge of the map bounds
            if (tooltipX + boxWidth > logicalWidth) {
                tooltipX = hScreenX - boxWidth - 8;
            }
            
            worldMapCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            worldMapCtx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
            worldMapCtx.lineWidth = 1;
            worldMapCtx.beginPath();
            if (worldMapCtx.roundRect) {
                worldMapCtx.roundRect(tooltipX, tooltipY - 12 - padY, boxWidth, boxHeight, 6);
            } else {
                worldMapCtx.rect(tooltipX, tooltipY - 12 - padY, boxWidth, boxHeight);
            }
            worldMapCtx.fill();
            worldMapCtx.stroke();
            
            worldMapCtx.fillStyle = '#facc15';
            worldMapCtx.textAlign = 'left';
            worldMapCtx.fillText(tileName, tooltipX + padX, tooltipY);
            worldMapCtx.textAlign = 'center'; 
        }
    }

    // Map Vignette Shadow (Fades into the "unknown" void)
    const grad = worldMapCtx.createRadialGradient(centerX, centerY, centerY * 0.5, centerX, centerY, centerY * 1.2);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    worldMapCtx.fillStyle = grad;
    worldMapCtx.fillRect(0, 0, logicalWidth, logicalHeight);

    // LORE & JUICE WIN: Detailed Old-World Cartography Compass Rose (Tracker)
    const cx = logicalWidth - 50;
    const cy = logicalHeight - 65;

    // Calculate Dynamic Tracker Angle
    let needleAngle = -Math.PI / 2; // North by default
    if (gameState.activeTreasure) {
        // Point toward the active treasure mark!
        needleAngle = Math.atan2(gameState.activeTreasure.y - mapCamera.y, gameState.activeTreasure.x - mapCamera.x);
    }

    worldMapCtx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
    worldMapCtx.lineWidth = 1;
    worldMapCtx.beginPath();
    worldMapCtx.arc(cx, cy, 30, 0, TWO_PI);
    worldMapCtx.stroke();
    
    worldMapCtx.beginPath();
    worldMapCtx.arc(cx, cy, 22, 0, TWO_PI);
    worldMapCtx.stroke();

    worldMapCtx.beginPath();
    for(let i=0; i<12; i++) {
        const angle = (i * Math.PI) / 6;
        const isMajor = (i % 3 === 0);
        const len = isMajor ? 6 : 3;
        worldMapCtx.moveTo(cx + Math.cos(angle) * 22, cy + Math.sin(angle) * 22);
        worldMapCtx.lineTo(cx + Math.cos(angle) * (22 + len), cy + Math.sin(angle) * (22 + len));
    }
    worldMapCtx.stroke();

    // Draw Rotated Needle
    worldMapCtx.save();
    worldMapCtx.translate(cx, cy);
    // Add Math.PI/2 because the needle graphic is drawn pointing UP (North)
    worldMapCtx.rotate(needleAngle + Math.PI / 2);

    // The Golden Needle (Forward)
    worldMapCtx.fillStyle = gameState.activeTreasure ? 'rgba(239, 68, 68, 0.9)' : 'rgba(250, 204, 21, 0.8)'; // Turns red if tracking
    worldMapCtx.beginPath();
    worldMapCtx.moveTo(0, -35); 
    worldMapCtx.lineTo(-6, 0); 
    worldMapCtx.lineTo(6, 0); 
    worldMapCtx.fill();
    
    // The Shadow Needle (Backwards)
    worldMapCtx.fillStyle = 'rgba(0, 0, 0, 0.6)'; 
    worldMapCtx.beginPath();
    worldMapCtx.moveTo(0, 35); 
    worldMapCtx.lineTo(-6, 0); 
    worldMapCtx.lineTo(6, 0); 
    worldMapCtx.fill();
    
    worldMapCtx.restore();

    // Letter 'N'
    worldMapCtx.fillStyle = '#facc15';
    worldMapCtx.font = 'bold 22px "Uncial Antiqua", cursive';
    worldMapCtx.textAlign = 'center';
    worldMapCtx.textBaseline = 'middle';
    worldMapCtx.fillText('N', cx, cy - 50);
    
    // Realm Banner (If not in the Prime Realm)
    if (typeof gameState !== 'undefined' && gameState.currentRealm !== 0 && gameState.currentRealm) {
        worldMapCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        worldMapCtx.fillRect(10, 10, 260, 30);
        worldMapCtx.fillStyle = '#facc15';
        worldMapCtx.font = 'bold 16px monospace';
        worldMapCtx.textAlign = 'left';
        worldMapCtx.fillText(`Shattered Realm #${gameState.currentRealm}`, 20, 25);
    }

    updateMapUI();
}

function updateMapUI() {
    let hoverText = '';
    let actionHint = ' | <span class="text-gray-500">Right-Click to Pin</span>';
    
    if (hoverWorldX !== null && hoverWorldY !== null) {
        const tileName = getMapTileName(hoverWorldX, hoverWorldY);
        
        if (tileName === "Magical Leyline Waystone") {
            const isUnlocked = gameState.player.unlockedWaypoints && gameState.player.unlockedWaypoints.some(wp => wp.x === hoverWorldX && wp.y === hoverWorldY);
            if (isUnlocked) actionHint = ' | <span class="text-purple-400 font-bold animate-pulse">Double-Click to Travel</span>';
            else actionHint = ' | <span class="text-gray-500">Unattuned Waystone</span>';
        }
        
        const dx = hoverWorldX - gameState.player.x;
        const dy = hoverWorldY - gameState.player.y;
        // PERFORMANCE WIN: Native Math.hypot
        const dist = Math.floor(Math.hypot(dx, dy));

        let dangerTag = "";
        if (tileName === "Uncharted Wilderness" && dist > 1500) {
            dangerTag = ` <span class="text-red-500 italic text-[10px] uppercase font-serif tracking-widest">(Here Be Monsters)</span>`;
        } else if (tileName === "The Deep Ocean" && dist > 1500) {
            dangerTag = ` <span class="text-blue-500 italic text-[10px] uppercase font-serif tracking-widest">(Here Be Leviathans)</span>`;
        }
        
        hoverText = ` | Hover: <span class="text-yellow-400 font-bold">${tileName}</span>${dangerTag} (${hoverWorldX}, ${-hoverWorldY}) <span class="text-gray-500">[${dist}m]</span>`;
    }
    
    mapCoordsDisplay.innerHTML = `Player: (${gameState.player.x}, ${-gameState.player.y})${hoverText}${actionHint}`;
}

// --- INPUT EVENTS ---
function startMapDrag(clientX, clientY) {
    isDraggingMap = true;
    lastMouseX = clientX;
    lastMouseY = clientY;
    worldMapCanvas.style.cursor = 'grabbing';
}

function doMapDrag(clientX, clientY) {
    if (!isDraggingMap) return;
    const dx = clientX - lastMouseX;
    const dy = clientY - lastMouseY;
    
    targetMapCamera.x -= dx / currentMapScale;
    targetMapCamera.y -= dy / currentMapScale;
    mapCamera.x = targetMapCamera.x;
    mapCamera.y = targetMapCamera.y;
    
    lastMouseX = clientX;
    lastMouseY = clientY;
}

function stopMapDrag() {
    isDraggingMap = false;
    worldMapCanvas.style.cursor = 'crosshair';
}

worldMapCanvas.addEventListener('mousedown', (e) => {
    // Only drag on left click (button 0)
    if (e.button === 0) startMapDrag(e.clientX, e.clientY);
});
window.addEventListener('mouseup', stopMapDrag);

worldMapCanvas.addEventListener('mousemove', (e) => {
    if (isDraggingMap) {
        doMapDrag(e.clientX, e.clientY);
        hoverWorldX = null; 
    } else {
        const rect = worldMapCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const centerX = Math.floor(worldMapCanvas.clientWidth / 2);
        const centerY = Math.floor(worldMapCanvas.clientHeight / 2);
        
        hoverWorldX = Math.floor((mouseX - centerX) / currentMapScale + mapCamera.x);
        hoverWorldY = Math.floor((mouseY - centerY) / currentMapScale + mapCamera.y);
    }
});

// Double click features
worldMapCanvas.addEventListener('dblclick', () => {
    if (hoverWorldX !== null && hoverWorldY !== null && gameState.player.unlockedWaypoints) {
        const isUnlocked = gameState.player.unlockedWaypoints.some(wp => wp.x === hoverWorldX && wp.y === hoverWorldY);
        if (isUnlocked && typeof handleFastTravel === 'function') {
            handleFastTravel(hoverWorldX, hoverWorldY);
            closeWorldMap();
            return;
        }
    }

    // Default: Center on player
    targetMapCamera.x = gameState.player.x;
    targetMapCamera.y = gameState.player.y;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
});

// Custom Map Pins (Right-Click)
worldMapCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); 
    if (hoverWorldX === null || hoverWorldY === null) return;
    
    if (!gameState.player.customPins) gameState.player.customPins = [];
    
    const existingIdx = gameState.player.customPins.findIndex(p => Math.abs(p.x - hoverWorldX) < 2 && Math.abs(p.y - hoverWorldY) < 2);
    
    if (existingIdx > -1) {
        gameState.player.customPins.splice(existingIdx, 1);
        if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
    } else {
        gameState.player.customPins.push({ x: hoverWorldX, y: hoverWorldY });
        if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
    }
    
    if (typeof playerRef !== 'undefined' && playerRef) playerRef.update({ customPins: gameState.player.customPins });
});

worldMapCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        startMapDrag(e.touches[0].clientX, e.touches[0].clientY);
        
        // UX WIN: Mobile Double-Tap Detection
        const now = Date.now();
        if (now - lastMapTouchTime < 300) {
            // Trigger the same double-click logic
            if (hoverWorldX !== null && hoverWorldY !== null && gameState.player.unlockedWaypoints) {
                const isUnlocked = gameState.player.unlockedWaypoints.some(wp => wp.x === hoverWorldX && wp.y === hoverWorldY);
                if (isUnlocked && typeof handleFastTravel === 'function') {
                    handleFastTravel(hoverWorldX, hoverWorldY);
                    closeWorldMap();
                    return;
                }
            }
            targetMapCamera.x = gameState.player.x;
            targetMapCamera.y = gameState.player.y;
            if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
        }
        lastMapTouchTime = now;
    }
    
    if (e.touches.length === 2) {
        const rect = worldMapCanvas.getBoundingClientRect();
        const touch = e.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;
        const centerX = Math.floor(worldMapCanvas.clientWidth / 2);
        const centerY = Math.floor(worldMapCanvas.clientHeight / 2);
        
        const pinX = Math.floor((mouseX - centerX) / currentMapScale + mapCamera.x);
        const pinY = Math.floor((mouseY - centerY) / currentMapScale + mapCamera.y);
        
        if (!gameState.player.customPins) gameState.player.customPins = [];
        
        const existingIdx = gameState.player.customPins.findIndex(p => Math.abs(p.x - pinX) < 3 && Math.abs(p.y - pinY) < 3);
        if (existingIdx > -1) {
            gameState.player.customPins.splice(existingIdx, 1);
            if (typeof AudioSystem !== 'undefined') AudioSystem.playError();
        } else {
            gameState.player.customPins.push({ x: pinX, y: pinY });
            if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
        }
        if (typeof playerRef !== 'undefined' && playerRef) playerRef.update({ customPins: gameState.player.customPins });
    }
    hoverWorldX = null; 
}, { passive: false });

worldMapCanvas.addEventListener('touchmove', (e) => {
    if (isDraggingMap && e.touches.length === 1) {
        e.preventDefault(); 
        doMapDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });

window.addEventListener('touchend', stopMapDrag);

// Ultra-Smooth Zoom-to-Cursor Logic
worldMapCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = worldMapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const centerX = Math.floor(worldMapCanvas.clientWidth / 2);
    const centerY = Math.floor(worldMapCanvas.clientHeight / 2);
    
    // 1. Find exactly what world coordinate the mouse is hovering over right now based on target scale
    const worldXAtMouse = (mouseX - centerX) / targetMapScale + targetMapCamera.x;
    const worldYAtMouse = (mouseY - centerY) / targetMapScale + targetMapCamera.y;

    // 2. Apply the zoom smoothly via a multiplier rather than a raw addition
    if (e.deltaY < 0) {
        targetMapScale *= 1.25; 
    } else {
        targetMapScale /= 1.25; 
    }
    
    // Clamp limits
    targetMapScale = Math.max(0.5, Math.min(32, targetMapScale));

    // 3. Shift the camera so the world coordinate stays perfectly pinned under the mouse!
    targetMapCamera.x = worldXAtMouse - (mouseX - centerX) / targetMapScale;
    targetMapCamera.y = worldYAtMouse - (mouseY - centerY) / targetMapScale;
    
}, { passive: false });

// --- END OF FILE worldmap.js ---
