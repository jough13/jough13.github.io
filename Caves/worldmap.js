// --- WORLD MAP SYSTEM ---
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

// --- MINIMAP CACHE ---
const mapChunkCache = new Map();

function getCachedMapChunk(cx, cy) {
    const key = `${cx},${cy}`;
    if (mapChunkCache.has(key)) return mapChunkCache.get(key);

    const c = document.createElement('canvas');
    c.width = MAP_CHUNK_SIZE;
    c.height = MAP_CHUNK_SIZE;
    const ctx = c.getContext('2d');

    for (let y = 0; y < MAP_CHUNK_SIZE; y++) {
        for (let x = 0; x < MAP_CHUNK_SIZE; x++) {
            const worldX = cx * MAP_CHUNK_SIZE + x;
            const worldY = cy * MAP_CHUNK_SIZE + y;
            ctx.fillStyle = getTileColorForMap(worldX, worldY);
            ctx.fillRect(x, y, 1, 1); 
        }
    }

    mapChunkCache.set(key, c);
    return c;
}

// Determines accurate colors including structures, buildings, and landmarks
function getTileColorForMap(worldX, worldY) {
    // Only query chunkManager if the chunk is explored (prevents generating unseen terrain)
    const chunkId = `${Math.floor(worldX / MAP_CHUNK_SIZE)},${Math.floor(worldY / MAP_CHUNK_SIZE)}`;
    if (!gameState.exploredChunks.has(chunkId)) return 'rgba(0,0,0,0)'; 

    const tile = chunkManager.getTile(worldX, worldY); 

    // Landmarks & Structures (Pop out on the map)
    if (['V', '🏰', '♛', '🏛️', '🚪', '🎓'].includes(tile)) return '#f8fafc'; // White
    if (tile === '🕍') return '#991b1b'; // Dark Red (Dangerous Ruins)
    if (['⛰', '🕳️', '🧊', '♣', '🏝️'].includes(tile)) return '#0f172a'; // Deep dark blue/black (Caves)
    if (['#', '|', '⛩️', '⛲', '✨'].includes(tile)) return '#a855f7'; // Magic Purple
    if (['🧱', '▤', '=', '+', '☒', '⛺'].includes(tile)) return '#9ca3af'; // Player Built / Camp
    if (tile === 'c') return '#ef4444'; // Canoe
    if (tile === '∴') return '#854d0e'; // Dig Spot
    if (tile === '~') return '#1e3a8a'; // Deep Water

    // Natural Biomes (Fallback)
    const elev = elevationNoise.noise(worldX / 70, worldY / 70);
    const moist = moistureNoise.noise(worldX / 50, worldY / 50);

    if (elev < 0.35) return '#3b82f6'; // Shallow Water
    if (elev < 0.4 && moist > 0.7) return '#422006'; // Swamp
    if (elev > 0.8) return '#57534e'; // Mountain
    if (elev > 0.6 && moist < 0.3) return '#2d2d2d'; // Deadlands
    if (moist < 0.15) return '#fde047'; // Desert
    if (moist > 0.55) return '#14532d'; // Forest
    return '#22c55e'; // Plains
}

function openWorldMap() {
    // Clear cache so any new walls/digs instantly show up
    mapChunkCache.clear(); 
    
    mapModal.classList.remove('hidden');
    
    // Snap camera to player
    mapCamera.x = gameState.player.x;
    mapCamera.y = gameState.player.y;
    targetMapCamera.x = gameState.player.x;
    targetMapCamera.y = gameState.player.y;
    targetMapScale = currentMapScale;
    
    updateExploration();
    fitMapCanvasToContainer();
    
    if (!mapAnimFrame) mapLoop();
    
    // Juice: UI Open Sound
    if (typeof AudioSystem !== 'undefined') AudioSystem.playMagic();
}

function closeWorldMap() {
    mapModal.classList.add('hidden');
    if (mapAnimFrame) {
        cancelAnimationFrame(mapAnimFrame);
        mapAnimFrame = null;
    }
}

function fitMapCanvasToContainer() {
    const container = worldMapCanvas.parentElement;
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        worldMapCanvas.width = container.clientWidth;
        worldMapCanvas.height = container.clientHeight;
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

    // Clear Background
    worldMapCtx.fillStyle = '#000000';
    worldMapCtx.fillRect(0, 0, worldMapCanvas.width, worldMapCanvas.height);
    worldMapCtx.imageSmoothingEnabled = false;

    const centerX = Math.floor(worldMapCanvas.width / 2);
    const centerY = Math.floor(worldMapCanvas.height / 2);
    const chunkSizeOnScreen = MAP_CHUNK_SIZE * currentMapScale;

    // Render Explored Chunks
    gameState.exploredChunks.forEach(chunkId => {
        const [cx, cy] = chunkId.split(',').map(Number);
        if (isNaN(cx) || isNaN(cy)) return; 

        const chunkWorldX = cx * MAP_CHUNK_SIZE;
        const chunkWorldY = cy * MAP_CHUNK_SIZE;

        const screenX = Math.floor((chunkWorldX - mapCamera.x) * currentMapScale + centerX);
        const screenY = Math.floor((chunkWorldY - mapCamera.y) * currentMapScale + centerY);

        // Frustum Culling (Don't draw if off-screen)
        if (screenX + chunkSizeOnScreen < 0 || screenX > worldMapCanvas.width ||
            screenY + chunkSizeOnScreen < 0 || screenY > worldMapCanvas.height) {
            return;
        }

        const chunkCanvas = getCachedMapChunk(cx, cy);
        worldMapCtx.drawImage(chunkCanvas, screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);

        // Juice: Faint Grid Lines per chunk for that cartography feel
        worldMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        worldMapCtx.lineWidth = 1;
        worldMapCtx.strokeRect(screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);
    });

    // Render Unlocked Waystones (Pulsing Beacons)
    if (gameState.player.unlockedWaypoints) {
        const wpPulse = (Math.sin(Date.now() / 200) + 1) / 2; 
        gameState.player.unlockedWaypoints.forEach(wp => {
            const screenX = (wp.x - mapCamera.x) * currentMapScale + centerX;
            const screenY = (wp.y - mapCamera.y) * currentMapScale + centerY;
            
            if (screenX >= 0 && screenX <= worldMapCanvas.width && screenY >= 0 && screenY <= worldMapCanvas.height) {
                worldMapCtx.fillStyle = `rgba(168, 85, 247, ${0.4 + wpPulse * 0.6})`;
                worldMapCtx.beginPath();
                worldMapCtx.arc(screenX + currentMapScale/2, screenY + currentMapScale/2, currentMapScale * 1.5, 0, Math.PI * 2);
                worldMapCtx.fill();
            }
        });
    }

    // --- Render Active Treasure (X Marks the Spot) ---
    if (gameState.activeTreasure) {
        const tx = (gameState.activeTreasure.x - mapCamera.x) * currentMapScale + centerX;
        const ty = (gameState.activeTreasure.y - mapCamera.y) * currentMapScale + centerY;
        
        if (tx >= 0 && tx <= worldMapCanvas.width && ty >= 0 && ty <= worldMapCanvas.height) {
            // Draw the X
            worldMapCtx.fillStyle = '#ef4444'; 
            worldMapCtx.font = `bold ${Math.max(12, currentMapScale * 2)}px monospace`;
            worldMapCtx.textAlign = 'center';
            worldMapCtx.textBaseline = 'middle';
            worldMapCtx.fillText('❌', tx + currentMapScale/2, ty + currentMapScale/2);
            
            // Draw an expanding pulse ring to make it obvious
            const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
            worldMapCtx.strokeStyle = `rgba(239, 68, 68, ${1 - pulse})`;
            worldMapCtx.lineWidth = 2;
            worldMapCtx.beginPath();
            worldMapCtx.arc(tx + currentMapScale/2, ty + currentMapScale/2, currentMapScale * 2 + (pulse * 15), 0, Math.PI * 2);
            worldMapCtx.stroke();
        }
    }

    // Render Player Marker (Pulsing)
    const playerScreenX = (gameState.player.x - mapCamera.x) * currentMapScale + centerX;
    const playerScreenY = (gameState.player.y - mapCamera.y) * currentMapScale + centerY;
    const playerPulse = (Math.sin(Date.now() / 150) + 1) / 2;

    worldMapCtx.fillStyle = '#ef4444';
    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX, playerScreenY, Math.max(3, currentMapScale) + (playerPulse * 2), 0, Math.PI * 2);
    worldMapCtx.fill();
    worldMapCtx.strokeStyle = '#ffffff';
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();

    // Render Hover Highlight
    if (hoverWorldX !== null && hoverWorldY !== null) {
        const hScreenX = (hoverWorldX - mapCamera.x) * currentMapScale + centerX;
        const hScreenY = (hoverWorldY - mapCamera.y) * currentMapScale + centerY;
        
        worldMapCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        worldMapCtx.fillRect(hScreenX, hScreenY, currentMapScale, currentMapScale);
        worldMapCtx.strokeStyle = '#facc15';
        worldMapCtx.lineWidth = 1;
        worldMapCtx.strokeRect(hScreenX, hScreenY, currentMapScale, currentMapScale);
    }

    updateMapUI();
}

function updateMapUI() {
    let hoverText = '';
    
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
            else if (tile === '⛰') tileName = "Cave Entrance";
            else if (tile === 'F') tileName = "Forest";
            else if (tile === 'D') tileName = "Desert";
            else if (tile === 'd') tileName = "Deadlands";
            else if (tile === '^') tileName = "Mountains";
            else if (tile === '~') tileName = "Deep Water";
            else if (tile === '≈') tileName = "Swamp";
            else if (tile === '.') tileName = "Plains";
            else if (tile === '#') tileName = "Waystone";
            else if (['🧱', '=', '+', '☒'].includes(tile)) tileName = "Built Structure";
            else tileName = "Unknown Area";
        }
        
        hoverText = ` | Hover: <span class="text-yellow-400 font-bold">${tileName}</span> (${hoverWorldX}, ${-hoverWorldY})`;
    }
    
    mapCoordsDisplay.innerHTML = `Player: (${gameState.player.x}, ${-gameState.player.y})${hoverText}`;
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
    
    // Apply instantly for dragging responsiveness
    targetMapCamera.x -= dx / currentMapScale;
    targetMapCamera.y -= dy / currentMapScale;
    mapCamera.x = targetMapCamera.x;
    mapCamera.y = targetMapCamera.y;
    
    lastMouseX = clientX;
    lastMouseY = clientY;
}

function stopMapDrag() {
    isDraggingMap = false;
    worldMapCanvas.style.cursor = 'grab';
}

worldMapCanvas.addEventListener('mousedown', (e) => startMapDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', stopMapDrag);

worldMapCanvas.addEventListener('mousemove', (e) => {
    if (isDraggingMap) {
        doMapDrag(e.clientX, e.clientY);
        hoverWorldX = null; // Disable hover text while panning
    } else {
        const rect = worldMapCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const centerX = Math.floor(worldMapCanvas.width / 2);
        const centerY = Math.floor(worldMapCanvas.height / 2);
        
        hoverWorldX = Math.floor((mouseX - centerX) / currentMapScale + mapCamera.x);
        hoverWorldY = Math.floor((mouseY - centerY) / currentMapScale + mapCamera.y);
    }
});

// Juice: Double click to center camera on player
worldMapCanvas.addEventListener('dblclick', () => {
    targetMapCamera.x = gameState.player.x;
    targetMapCamera.y = gameState.player.y;
    if (typeof AudioSystem !== 'undefined') AudioSystem.playStep();
});

worldMapCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) startMapDrag(e.touches[0].clientX, e.touches[0].clientY);
    hoverWorldX = null; // Disable hover for touch devices
}, { passive: false });

worldMapCanvas.addEventListener('touchmove', (e) => {
    if (isDraggingMap && e.touches.length === 1) {
        e.preventDefault(); 
        doMapDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: false });

window.addEventListener('touchend', stopMapDrag);

worldMapCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY < 0) targetMapScale = Math.min(16, targetMapScale + 2); 
    else targetMapScale = Math.max(2, targetMapScale - 2); 
}, { passive: false });


// --- SETTINGS UI BINDINGS ---
let crtEnabled = localStorage.getItem('crtSetting') !== 'false'; 

function applyVisualSettings() {
    const container = document.getElementById('gameCanvasWrapper');
    if (container) {
        if (crtEnabled) container.classList.add('crt');
        else container.classList.remove('crt');
    }
}

function initSettingsListeners() {
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettingsButton');
    const openBtn = document.getElementById('settingsButton');

    const cbMaster = document.getElementById('settingMaster');
    const cbSteps = document.getElementById('settingSteps');
    const cbCombat = document.getElementById('settingCombat');
    const cbMagic = document.getElementById('settingMagic');
    const cbUI = document.getElementById('settingUI');

    const cbCRT = document.getElementById('settingCRT');
    const btnBackup = document.getElementById('btnBackup');
    const btnRestore = document.getElementById('btnRestore');
    const btnManualSave = document.getElementById('btnManualSave'); 

    if (!modal || !openBtn || !closeBtn) return;

    const syncUI = () => {
        if (cbMaster) cbMaster.checked = AudioSystem.settings.master;
        if (cbSteps) cbSteps.checked = AudioSystem.settings.steps;
        if (cbCombat) cbCombat.checked = AudioSystem.settings.combat;
        if (cbMagic) cbMagic.checked = AudioSystem.settings.magic;
        if (cbUI) cbUI.checked = AudioSystem.settings.ui;
        if (cbCRT) cbCRT.checked = crtEnabled;

        if (cbMaster) {
            const isMasterOn = cbMaster.checked;
            [cbSteps, cbCombat, cbMagic, cbUI].forEach(cb => {
                if (cb) {
                    cb.disabled = !isMasterOn;
                    cb.parentElement.style.opacity = isMasterOn ? '1' : '0.5';
                }
            });
        }
    };

    openBtn.onclick = (e) => {
        e.preventDefault();
        syncUI();
        if(typeof updateBackupUI === 'function') updateBackupUI(); 
        modal.classList.remove('hidden');
    };

    closeBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add('hidden');
    };

    const handleAudioToggle = (key, element) => {
        if (!element) return;
        element.onchange = (e) => {
            AudioSystem.settings[key] = e.target.checked;
            AudioSystem.saveSettings();
            if (key === 'master') syncUI();

            if (e.target.checked && AudioSystem.settings.master) {
                if (key === 'steps') AudioSystem.playStep();
                else AudioSystem.playCoin();
            }
        };
    };

    handleAudioToggle('master', cbMaster);
    handleAudioToggle('steps', cbSteps);
    handleAudioToggle('combat', cbCombat);
    handleAudioToggle('magic', cbMagic);
    handleAudioToggle('ui', cbUI);

    if (cbCRT) {
        cbCRT.onchange = (e) => {
            crtEnabled = e.target.checked;
            localStorage.setItem('crtSetting', crtEnabled);
            applyVisualSettings(); 
            if (crtEnabled && typeof AudioSystem !== 'undefined') AudioSystem.playMagic(); 
        };
    }

    if (btnBackup) {
        btnBackup.onclick = (e) => {
            e.preventDefault();
            btnBackup.disabled = true;
            btnBackup.textContent = "Saving...";
            if (typeof createCloudBackup === 'function') {
                createCloudBackup().then(() => {
                    btnBackup.disabled = false;
                    btnBackup.textContent = "☁️ Create Backup";
                });
            }
        };
    }

    if (btnRestore) {
        btnRestore.onclick = (e) => {
            e.preventDefault();
            if (typeof restoreCloudBackup === 'function') restoreCloudBackup();
        };
    }

    if (btnManualSave) {
        btnManualSave.onclick = (e) => {
            e.preventDefault();
            if (typeof manualSaveGame === 'function') manualSaveGame();
        };
    }
}
