// ==========================================
// WORLD MAP SYSTEM & SETTINGS
// ==========================================

const mapModal = document.getElementById('mapModal');
const worldMapCanvas = document.getElementById('worldMapCanvas');
const worldMapCtx = worldMapCanvas.getContext('2d');
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
const MAX_CACHED_CHUNKS = 300; 

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
    EMPTY: [0, 0, 0, 0]
};

function getCachedMapChunk(cx, cy) {
    const key = `${cx},${cy}`;
    if (mapChunkCache.has(key)) return mapChunkCache.get(key);

    // Memory Leak Protection: Clear oldest chunks if we exceed the limit
    if (mapChunkCache.size > MAX_CACHED_CHUNKS) {
        const oldestKey = mapChunkCache.keys().next().value;
        mapChunkCache.delete(oldestKey);
    }

    const c = document.createElement('canvas');
    c.width = MAP_CHUNK_SIZE;
    c.height = MAP_CHUNK_SIZE;
    const ctx = c.getContext('2d');

    // PERFORMANCE UPGRADE: ImageData Buffer (10x-50x faster than fillRect)
    const imgData = ctx.createImageData(MAP_CHUNK_SIZE, MAP_CHUNK_SIZE);
    const data = imgData.data;

    for (let y = 0; y < MAP_CHUNK_SIZE; y++) {
        for (let x = 0; x < MAP_CHUNK_SIZE; x++) {
            const worldX = cx * MAP_CHUNK_SIZE + x;
            const worldY = cy * MAP_CHUNK_SIZE + y;
            const colorRGBA = getTileColorForMap(worldX, worldY); // Now returns raw array
            
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

// Determines accurate colors including new Nautical & Night items!
function getTileColorForMap(worldX, worldY) {
    // Fast Bitwise Math for Chunk ID
    const chunkId = `${Math.floor(worldX / MAP_CHUNK_SIZE)},${Math.floor(worldY / MAP_CHUNK_SIZE)}`;
    if (!gameState.exploredChunks.has(chunkId)) return MAP_COLORS.EMPTY; 

    const tile = chunkManager.getTile(worldX, worldY); 

    // Landmarks & Structures
    if (['V', '🏰', '♛', '🏛️', '🚪', '🎓'].includes(tile)) return MAP_COLORS.WHITE;
    if (tile === '🕍') return MAP_COLORS.DARK_RED; 
    if (['⛰', '🕳️', '🧊', '♣', '🏝️'].includes(tile)) return MAP_COLORS.CAVE;
    if (['#', '|', '⛩️', '⛲', '✨'].includes(tile)) return MAP_COLORS.MAGIC; 
    if (['🧱', '▤', '=', '+', '☒', '⛺'].includes(tile)) return MAP_COLORS.BUILT;
    if (tile === 'c' || tile === '⛵') return MAP_COLORS.RED;
    if (tile === '∴') return MAP_COLORS.DIG; 
    if (tile === '~') return MAP_COLORS.DEEP_WATER;
    
    // Anomalies
    if (tile === '🌋') return MAP_COLORS.VOLCANO;
    if (tile === '🛕') return MAP_COLORS.TEMPLE;
    if (tile === '🛟') return MAP_COLORS.FLOTSAM;
    if (tile === '🌺') return MAP_COLORS.MOONBLOOM;
    if (tile === '☄️') return MAP_COLORS.STAR;

    // Natural Biomes (Fallback)
    const elev = elevationNoise.noise(worldX / 70, worldY / 70);
    const moist = moistureNoise.noise(worldX / 50, worldY / 50);

    if (elev < 0.35) return MAP_COLORS.SHALLOW;
    if (elev < 0.4 && moist > 0.7) return MAP_COLORS.SWAMP;
    if (elev > 0.8) return MAP_COLORS.MOUNTAIN;
    if (elev > 0.6 && moist < 0.3) return MAP_COLORS.DEADLANDS;
    if (moist < 0.15) return MAP_COLORS.DESERT;
    if (moist > 0.55) return MAP_COLORS.FOREST;
    return MAP_COLORS.PLAINS;
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
    
    // MEMORY LEAK FIX: Unload all chunks that the minimap forced the engine to generate in the background
    if (typeof chunkManager !== 'undefined' && chunkManager.unloadOutOfRangeChunks && gameState.player) {
        const currentChunkX = Math.floor(gameState.player.x / MAP_CHUNK_SIZE);
        const currentChunkY = Math.floor(gameState.player.y / MAP_CHUNK_SIZE);
        chunkManager.unloadOutOfRangeChunks(currentChunkX, currentChunkY);
    }
}

function fitMapCanvasToContainer() {
    const container = worldMapCanvas.parentElement;
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        // UI WIN: Apply Device Pixel Ratio to fix blurry maps on Mobile/MacBooks
        const dpr = window.devicePixelRatio || 1;
        worldMapCanvas.width = container.clientWidth * dpr;
        worldMapCanvas.height = container.clientHeight * dpr;
        
        // Force CSS dimensions to match container exactly
        worldMapCanvas.style.width = `${container.clientWidth}px`;
        worldMapCanvas.style.height = `${container.clientHeight}px`;
        
        worldMapCtx.setTransform(1, 0, 0, 1, 0, 0);
        worldMapCtx.scale(dpr, dpr);
    }
}

// --- RENDERING LOOP ---
function mapLoop() {
    if (mapModal.classList.contains('hidden')) return;

    // Smooth Lerping for Zoom and Pan
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

    // Use logical width/height for calculations to support the DPI scaling fix
    const logicalWidth = worldMapCanvas.clientWidth;
    const logicalHeight = worldMapCanvas.clientHeight;

    // Clear Background
    worldMapCtx.fillStyle = '#000000';
    worldMapCtx.fillRect(0, 0, logicalWidth, logicalHeight);
    worldMapCtx.imageSmoothingEnabled = false;

    // PERFORMANCE WIN: Pre-calculate screen boundaries with fast Bitwise operators
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
        worldMapCtx.drawImage(chunkCanvas, screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);

        // Chunk Grid Lines
        worldMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        worldMapCtx.lineWidth = 1;
        worldMapCtx.strokeRect(screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);

        // CONTENT WIN: Fine Tile Grid at high zoom levels
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
    });

    worldMapCtx.font = `bold ${Math.max(14, currentMapScale * 2)}px monospace`;
    worldMapCtx.textAlign = 'center';
    worldMapCtx.textBaseline = 'middle';

    // Render Custom Player Pins
    if (gameState.player.customPins) {
        gameState.player.customPins.forEach(pin => {
            const screenX = (pin.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (pin.y - mapCamera.y) * currentMapScale + centerY;
            
            if (screenX >= 0 && screenX <= logicalWidth && screenY >= 0 && screenY <= logicalHeight) {
                worldMapCtx.fillStyle = 'rgba(0,0,0,0.8)';
                worldMapCtx.fillText('📌', screenX + currentMapScale/2, (screenY + currentMapScale/2) + 2);
                worldMapCtx.fillStyle = '#ffffff';
                worldMapCtx.fillText('📌', screenX + currentMapScale/2, screenY + currentMapScale/2);
            }
        });
    }

    // Render Unlocked Waystones
    if (gameState.player.unlockedWaypoints) {
        const wpPulse = (Math.sin(now / 200) + 1) / 2; 
        
        worldMapCtx.globalAlpha = 0.4 + wpPulse * 0.6;
        worldMapCtx.fillStyle = '#a855f7'; // Purple
        
        gameState.player.unlockedWaypoints.forEach(wp => {
            const screenX = (wp.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (wp.y - mapCamera.y) * currentMapScale + centerY;
            
            if (screenX >= 0 && screenX <= logicalWidth && screenY >= 0 && screenY <= logicalHeight) {
                worldMapCtx.beginPath();
                worldMapCtx.arc(screenX + currentMapScale/2, screenY + currentMapScale/2, currentMapScale * 1.5, 0, Math.PI * 2);
                worldMapCtx.fill();
            }
        });
        worldMapCtx.globalAlpha = 1.0;
    }

    // Render Discovered Points of Interest (POIs)
    if (gameState.player.discoveredPOIs) {
        worldMapCtx.font = `bold ${Math.max(10, currentMapScale * 1.5)}px monospace`;
        gameState.player.discoveredPOIs.forEach(poi => {
            const screenX = (poi.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (poi.y - mapCamera.y) * currentMapScale + centerY;
            
            if (screenX >= 0 && screenX <= logicalWidth && screenY >= 0 && screenY <= logicalHeight) {
                worldMapCtx.fillStyle = 'rgba(0,0,0,0.5)';
                worldMapCtx.beginPath();
                worldMapCtx.arc(screenX + currentMapScale/2, screenY + currentMapScale/2, currentMapScale, 0, Math.PI * 2);
                worldMapCtx.fill();
                
                worldMapCtx.fillStyle = '#ffffff';
                worldMapCtx.fillText(poi.icon, screenX + currentMapScale/2, screenY + currentMapScale/2);
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
        Object.values(otherPlayers).forEach(op => {
            if (op.mapMode === 'overworld' && op.x !== undefined && op.y !== undefined) {
                const opX = (op.x - mapCamera.x) * currentMapScale + centerX;
                const opY = (op.y - mapCamera.y) * currentMapScale + centerY;
                
                if (opX >= 0 && opX <= logicalWidth && opY >= 0 && opY <= logicalHeight) {
                    worldMapCtx.beginPath();
                    worldMapCtx.arc(opX + currentMapScale/2, opY + currentMapScale/2, Math.max(2, currentMapScale * 0.8), 0, Math.PI * 2);
                    worldMapCtx.fill();
                }
            }
        });
    }

    // Render Player Marker & Radar Pulse
    const playerScreenX = (gameState.player.x - mapCamera.x) * currentMapScale + centerX;
    const playerScreenY = (gameState.player.y - mapCamera.y) * currentMapScale + centerY;
    const playerPulse = (now % 2000) / 2000; // 0 to 1 over 2 seconds

    // Radar Ring
    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX + currentMapScale/2, playerScreenY + currentMapScale/2, currentMapScale * 2 + (playerPulse * 30), 0, Math.PI * 2);
    worldMapCtx.strokeStyle = '#3b82f6';
    worldMapCtx.globalAlpha = 1 - playerPulse;
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();
    worldMapCtx.globalAlpha = 1.0;

    // Core Player Dot
    worldMapCtx.fillStyle = '#ef4444';
    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX + currentMapScale/2, playerScreenY + currentMapScale/2, Math.max(3, currentMapScale), 0, Math.PI * 2);
    worldMapCtx.fill();
    worldMapCtx.strokeStyle = '#ffffff';
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();

    // Render Hover Highlight
    if (hoverWorldX !== null && hoverWorldY !== null) {
        const hScreenX = Math.floor((hoverWorldX - mapCamera.x) * currentMapScale + centerX);
        const hScreenY = Math.floor((hoverWorldY - mapCamera.y) * currentMapScale + centerY);
        
        worldMapCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        worldMapCtx.fillRect(hScreenX, hScreenY, currentMapScale, currentMapScale);
        worldMapCtx.strokeStyle = '#facc15';
        worldMapCtx.lineWidth = 1;
        worldMapCtx.strokeRect(hScreenX, hScreenY, currentMapScale, currentMapScale);
    }

    // Map Vignette Shadow
    const grad = worldMapCtx.createRadialGradient(centerX, centerY, centerY * 0.5, centerX, centerY, centerY * 1.2);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.8)');
    worldMapCtx.fillStyle = grad;
    worldMapCtx.fillRect(0, 0, logicalWidth, logicalHeight);

    updateMapUI();
}

function updateMapUI() {
    let hoverText = '';
    let actionHint = ' | <span class="text-gray-500">Right-Click to Pin</span>';
    
    if (hoverWorldX !== null && hoverWorldY !== null) {
        const chunkId = `${Math.floor(hoverWorldX / MAP_CHUNK_SIZE)},${Math.floor(hoverWorldY / MAP_CHUNK_SIZE)}`;
        let tileName = "Unexplored";
        
        if (gameState.exploredChunks.has(chunkId)) {
            const tile = chunkManager.getTile(hoverWorldX, hoverWorldY);
            if (typeof TILE_DATA !== 'undefined' && TILE_DATA[tile] && TILE_DATA[tile].name) {
                tileName = TILE_DATA[tile].name;
            } else if (tile === 'V') tileName = "Safe Haven Village";
            else if (tile === '🏰') tileName = "Castle Ruins";
            else if (tile === '♛') tileName = "Grand Fortress";
            else if (tile === '🛕') tileName = "Sunken Temple"; 
            else if (tile === '🌋') tileName = "Volcanic Island"; 
            else if (tile === '⛰') tileName = "Cave Entrance";
            else if (tile === 'F') tileName = "Forest";
            else if (tile === 'D') tileName = "Desert";
            else if (tile === 'd') tileName = "Deadlands";
            else if (tile === '^') tileName = "Mountains";
            else if (tile === '~') tileName = "Deep Water";
            else if (tile === '≈') tileName = "Swamp";
            else if (tile === '.') tileName = "Plains";
            else if (tile === '#') {
                tileName = "Waystone";
                const isUnlocked = gameState.player.unlockedWaypoints && gameState.player.unlockedWaypoints.some(wp => wp.x === hoverWorldX && wp.y === hoverWorldY);
                if (isUnlocked) actionHint = ' | <span class="text-purple-400 font-bold">Double-Click to Travel</span>';
            }
            else if (tile === '🗺️') tileName = "Cartographer's Guild";
            else if (['🧱', '=', '+', '☒'].includes(tile)) tileName = "Built Structure";
            else tileName = "Unknown Area";
        }
        
        // QoL WIN: Calculate precise distance from player
        const dist = Math.floor(Math.sqrt((hoverWorldX - gameState.player.x) ** 2 + (hoverWorldY - gameState.player.y) ** 2));
        hoverText = ` | Hover: <span class="text-yellow-400 font-bold">${tileName}</span> (${hoverWorldX}, ${-hoverWorldY}) <span class="text-gray-500">[${dist}m]</span>`;
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

// JUICE WIN: Zoom-to-Cursor Logic
worldMapCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const rect = worldMapCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const centerX = Math.floor(worldMapCanvas.clientWidth / 2);
    const centerY = Math.floor(worldMapCanvas.clientHeight / 2);
    
    // Find exactly what world coordinate the mouse is hovering over right now
    const worldXAtMouse = (mouseX - centerX) / currentMapScale + mapCamera.x;
    const worldYAtMouse = (mouseY - centerY) / currentMapScale + mapCamera.y;

    const oldTargetScale = targetMapScale;

    // Apply the zoom
    if (e.deltaY < 0) targetMapScale = Math.min(16, targetMapScale + 2); 
    else targetMapScale = Math.max(2, targetMapScale - 2); 

    // If we actually zoomed, shift the camera so the world coordinate stays under the mouse!
    if (oldTargetScale !== targetMapScale) {
        targetMapCamera.x = worldXAtMouse - (mouseX - centerX) / targetMapScale;
        targetMapCamera.y = worldYAtMouse - (mouseY - centerY) / targetMapScale;
        
        // Also snap current camera to prevent wild swinging when zooming rapidly
        mapCamera.x = targetMapCamera.x;
        mapCamera.y = targetMapCamera.y;
    }
}, { passive: false });
