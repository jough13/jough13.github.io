// --- WORLD MAP SYSTEM ---
const mapModal = document.getElementById('mapModal');
const worldMapCanvas = document.getElementById('worldMapCanvas');
const worldMapCtx = worldMapCanvas.getContext('2d');
const mapCoordsDisplay = document.getElementById('mapCoords');

// Settings
let currentMapScale = 4; 
const MAP_CHUNK_SIZE = 16; 

// Camera State
let mapCamera = { x: 0, y: 0 };
let isDraggingMap = false;
let lastMouseX = 0;
let lastMouseY = 0;

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
            ctx.fillStyle = getBiomeColorForMap(worldX, worldY);
            ctx.fillRect(x, y, 1, 1); 
        }
    }

    mapChunkCache.set(key, c);
    return c;
}

function openWorldMap() {
    mapModal.classList.remove('hidden');
    mapCamera.x = gameState.player.x;
    mapCamera.y = gameState.player.y;
    updateExploration();
    fitMapCanvasToContainer();
    renderWorldMap();
}

function closeWorldMap() {
    mapModal.classList.add('hidden');
}

function fitMapCanvasToContainer() {
    const container = worldMapCanvas.parentElement;
    if (container.clientWidth > 0 && container.clientHeight > 0) {
        worldMapCanvas.width = container.clientWidth;
        worldMapCanvas.height = container.clientHeight;
    }
}

// Visual Settings State
let crtEnabled = localStorage.getItem('crtSetting') !== 'false'; 

function applyVisualSettings() {
    const container = document.getElementById('gameCanvasWrapper');
    if (container) {
        if (crtEnabled) {
            container.classList.add('crt');
        } else {
            container.classList.remove('crt');
        }
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
        updateBackupUI(); 
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
            if (crtEnabled) AudioSystem.playMagic(); 
        };
    }

    if (btnBackup) {
        btnBackup.onclick = (e) => {
            e.preventDefault();
            btnBackup.disabled = true;
            btnBackup.textContent = "Saving...";
            createCloudBackup().then(() => {
                btnBackup.disabled = false;
                btnBackup.textContent = "☁️ Create Backup";
            });
        };
    }

    if (btnRestore) {
        btnRestore.onclick = (e) => {
            e.preventDefault();
            restoreCloudBackup();
        };
    }

    if (btnManualSave) {
        btnManualSave.onclick = (e) => {
            e.preventDefault();
            manualSaveGame();
        };
    }
}

function renderWorldMap() {
    if (!gameState.player.exploredChunks) return;

    worldMapCtx.fillStyle = '#000000';
    worldMapCtx.fillRect(0, 0, worldMapCanvas.width, worldMapCanvas.height);
    worldMapCtx.imageSmoothingEnabled = false;

    const centerX = Math.floor(worldMapCanvas.width / 2);
    const centerY = Math.floor(worldMapCanvas.height / 2);
    const chunkSizeOnScreen = MAP_CHUNK_SIZE * currentMapScale;

    gameState.exploredChunks.forEach(chunkId => {
        const [cx, cy] = chunkId.split(',').map(Number);
        if (isNaN(cx) || isNaN(cy)) return; 

        const chunkWorldX = cx * MAP_CHUNK_SIZE;
        const chunkWorldY = cy * MAP_CHUNK_SIZE;

        const screenX = Math.floor((chunkWorldX - mapCamera.x) * currentMapScale + centerX);
        const screenY = Math.floor((chunkWorldY - mapCamera.y) * currentMapScale + centerY);

        if (screenX + chunkSizeOnScreen < 0 || screenX > worldMapCanvas.width ||
            screenY + chunkSizeOnScreen < 0 || screenY > worldMapCanvas.height) {
            return;
        }

        const chunkCanvas = getCachedMapChunk(cx, cy);
        worldMapCtx.drawImage(chunkCanvas, screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);
    });

    const playerScreenX = (gameState.player.x - mapCamera.x) * currentMapScale + centerX;
    const playerScreenY = (gameState.player.y - mapCamera.y) * currentMapScale + centerY;

    worldMapCtx.fillStyle = '#ef4444';
    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX, playerScreenY, Math.max(3, currentMapScale), 0, Math.PI * 2);
    worldMapCtx.fill();
    worldMapCtx.strokeStyle = '#ffffff';
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();

    mapCoordsDisplay.textContent = `Current Location: ${gameState.player.x}, ${-gameState.player.y}`;
}

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
    mapCamera.x -= dx / currentMapScale;
    mapCamera.y -= dy / currentMapScale;
    lastMouseX = clientX;
    lastMouseY = clientY;
    renderWorldMap();
}

function stopMapDrag() {
    isDraggingMap = false;
    worldMapCanvas.style.cursor = 'grab';
}

worldMapCanvas.addEventListener('mousedown', (e) => startMapDrag(e.clientX, e.clientY));
window.addEventListener('mousemove', (e) => doMapDrag(e.clientX, e.clientY));
window.addEventListener('mouseup', stopMapDrag);

worldMapCanvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) startMapDrag(e.touches[0].clientX, e.touches[0].clientY);
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
    if (e.deltaY < 0) currentMapScale = Math.min(12, currentMapScale + 1); 
    else currentMapScale = Math.max(1, currentMapScale - 1); 
    renderWorldMap();
}, { passive: false });

function getBiomeColorForMap(x, y) {
    const elev = elevationNoise.noise(x / 70, y / 70);
    const moist = moistureNoise.noise(x / 50, y / 50);

    if (elev < 0.35) return '#3b82f6'; 
    if (elev < 0.4 && moist > 0.7) return '#422006'; 
    if (elev > 0.8) return '#57534e'; 
    if (elev > 0.6 && moist < 0.3) return '#2d2d2d'; 
    if (moist < 0.15) return '#fde047'; 
    if (moist > 0.55) return '#14532d'; 
    return '#22c55e'; 
}
