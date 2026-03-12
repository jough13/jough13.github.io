// --- WORLD MAP SYSTEM ---
const mapModal = document.getElementById('mapModal');
const worldMapCanvas = document.getElementById('worldMapCanvas');
const worldMapCtx = worldMapCanvas.getContext('2d');
const mapCoordsDisplay = document.getElementById('mapCoords');

// Settings
const MAP_SCALE = 4;
const MAP_CHUNK_SIZE = 16; // Renamed to avoid conflicts, explicit constant

// Camera State
let mapCamera = { x: 0, y: 0 };
let isDraggingMap = false;
let lastMouseX = 0;
let lastMouseY = 0;

function openWorldMap() {
    mapModal.classList.remove('hidden');

    // 1. Center Camera on Player immediately
    mapCamera.x = gameState.player.x;
    mapCamera.y = gameState.player.y;

    // 2. Force Exploration of CURRENT tile immediately
    // This ensures you are never standing in a "void" when you open the map
    updateExploration();

    // 3. Resize Canvas to fill the modal window
    fitMapCanvasToContainer();

    // 4. Render
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
let crtEnabled = localStorage.getItem('crtSetting') !== 'false'; // Default to true

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
    console.log("⚙️ Initializing Settings Listeners...");

    // --- DOM ELEMENTS ---
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettingsButton');
    const openBtn = document.getElementById('settingsButton');

    // Audio Checkboxes
    const cbMaster = document.getElementById('settingMaster');
    const cbSteps = document.getElementById('settingSteps');
    const cbCombat = document.getElementById('settingCombat');
    const cbMagic = document.getElementById('settingMagic');
    const cbUI = document.getElementById('settingUI');

    // Visual Checkboxes
    const cbCRT = document.getElementById('settingCRT');

    // Cloud Backup Buttons
    const btnBackup = document.getElementById('btnBackup');
    const btnRestore = document.getElementById('btnRestore');

    const btnManualSave = document.getElementById('btnManualSave'); // Get the new button

    // Safety Check: If critical UI is missing, abort to prevent errors
    if (!modal || !openBtn || !closeBtn) {
        console.error("❌ Critical Settings UI elements missing from HTML!");
        return;
    }

    // --- HELPER: SYNC UI ---
    // Updates checkboxes to match current global variables/localStorage
    const syncUI = () => {
        // Audio Sync
        if (cbMaster) cbMaster.checked = AudioSystem.settings.master;
        if (cbSteps) cbSteps.checked = AudioSystem.settings.steps;
        if (cbCombat) cbCombat.checked = AudioSystem.settings.combat;
        if (cbMagic) cbMagic.checked = AudioSystem.settings.magic;
        if (cbUI) cbUI.checked = AudioSystem.settings.ui;

        // Visual Sync
        if (cbCRT) cbCRT.checked = crtEnabled;

        // Master Volume Logic: Disable sub-options if master is off
        if (cbMaster) {
            const isMasterOn = cbMaster.checked;
            [cbSteps, cbCombat, cbMagic, cbUI].forEach(cb => {
                if (cb) {
                    cb.disabled = !isMasterOn;
                    // Visual flair: dim the label if disabled (optional, depends on CSS)
                    cb.parentElement.style.opacity = isMasterOn ? '1' : '0.5';
                }
            });
        }
    };

    // --- 1. OPEN/CLOSE MODAL ---
    
    openBtn.onclick = (e) => {
        e.preventDefault();
        
        // 1. Refresh Checkboxes
        syncUI();
        
        // 2. Refresh Backup Timestamp (Async)
        updateBackupUI(); 
        
        // 3. Show Modal
        modal.classList.remove('hidden');
    };

    closeBtn.onclick = (e) => {
        e.preventDefault();
        modal.classList.add('hidden');
    };

    // --- 2. AUDIO HANDLERS ---
    
    const handleAudioToggle = (key, element) => {
        if (!element) return;
        element.onchange = (e) => {
            // Update State
            AudioSystem.settings[key] = e.target.checked;
            AudioSystem.saveSettings();
            
            // If Master changed, update the UI (disable/enable children)
            if (key === 'master') syncUI();

            // Feedback Sound
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

    // --- 3. VISUAL HANDLERS ---

    if (cbCRT) {
        cbCRT.onchange = (e) => {
            crtEnabled = e.target.checked;
            localStorage.setItem('crtSetting', crtEnabled);
            applyVisualSettings(); // Apply CSS class immediately
            
            if (crtEnabled) AudioSystem.playMagic(); // Sound effect
        };
    }

    // --- 4. CLOUD BACKUP HANDLERS ---

    if (btnBackup) {
        btnBackup.onclick = (e) => {
            e.preventDefault();
            // Prevent spamming
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

    // --- 5. MANUAL SAVE HANDLER ---
    if (btnManualSave) {
        btnManualSave.onclick = (e) => {
            e.preventDefault();
            manualSaveGame();
        };
    }
    
    console.log("✅ Settings Listeners (Audio, Visuals, Backups, Manual Save) Attached.");
}

function renderWorldMap() {
    if (!gameState.player.exploredChunks) return;

    // 1. Clear Background (Black Void)
    worldMapCtx.fillStyle = '#000000';
    worldMapCtx.fillRect(0, 0, worldMapCanvas.width, worldMapCanvas.height);

    // 2. Calculate Screen Center
    const centerX = Math.floor(worldMapCanvas.width / 2);
    const centerY = Math.floor(worldMapCanvas.height / 2);

    // 3. Iterate ONLY Explored Chunks
    gameState.exploredChunks.forEach(chunkId => {
        const [cx, cy] = chunkId.split(',').map(Number);

        if (isNaN(cx) || isNaN(cy)) return; // Safety check

        // Chunk's World Position (Top-Left of the chunk)
        const chunkWorldX = cx * MAP_CHUNK_SIZE;
        const chunkWorldY = cy * MAP_CHUNK_SIZE;

        // Calculate Screen Position for this chunk
        // Formula: (ChunkWorldPos - CameraPos) * Scale + CenterOffset
        const screenX = Math.floor((chunkWorldX - mapCamera.x) * MAP_SCALE + centerX);
        const screenY = Math.floor((chunkWorldY - mapCamera.y) * MAP_SCALE + centerY);

        // Optimization: Skip drawing if completely off-screen
        const chunkSizeOnScreen = MAP_CHUNK_SIZE * MAP_SCALE;
        if (screenX + chunkSizeOnScreen < 0 || screenX > worldMapCanvas.width ||
            screenY + chunkSizeOnScreen < 0 || screenY > worldMapCanvas.height) {
            return;
        }

        // Draw Tiles in Chunk
        for (let y = 0; y < MAP_CHUNK_SIZE; y++) {
            for (let x = 0; x < MAP_CHUNK_SIZE; x++) {
                const worldX = chunkWorldX + x;
                const worldY = chunkWorldY + y;

                const color = getBiomeColorForMap(worldX, worldY);

                // Draw pixel
                worldMapCtx.fillStyle = color;
                worldMapCtx.fillRect(
                    screenX + (x * MAP_SCALE),
                    screenY + (y * MAP_SCALE),
                    MAP_SCALE,
                    MAP_SCALE
                );
            }
        }

        // Debug: Draw faint outline around chunk to verify alignment
        // worldMapCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        // worldMapCtx.lineWidth = 1;
        // worldMapCtx.strokeRect(screenX, screenY, chunkSizeOnScreen, chunkSizeOnScreen);
    });

    // 4. Draw Player Marker
    // The player is always at 'mapCamera' coordinates + center offset
    // This assumes camera is locked to player unless dragged.
    const playerScreenX = (gameState.player.x - mapCamera.x) * MAP_SCALE + centerX;
    const playerScreenY = (gameState.player.y - mapCamera.y) * MAP_SCALE + centerY;

    // Draw Red Dot (with white border for visibility)
    worldMapCtx.fillStyle = '#ef4444';
    worldMapCtx.beginPath();
    worldMapCtx.arc(playerScreenX, playerScreenY, 4, 0, Math.PI * 2);
    worldMapCtx.fill();
    worldMapCtx.strokeStyle = '#ffffff';
    worldMapCtx.lineWidth = 2;
    worldMapCtx.stroke();

    // 5. Update Coordinates Text
    mapCoordsDisplay.textContent = `Current Location: ${gameState.player.x}, ${-gameState.player.y}`;
}

// --- MAP CONTROLS (Panning) ---
worldMapCanvas.addEventListener('mousedown', (e) => {
    isDraggingMap = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    worldMapCanvas.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
    isDraggingMap = false;
    worldMapCanvas.style.cursor = 'grab';
});

window.addEventListener('mousemove', (e) => {
    if (!isDraggingMap) return;

    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;

    // Move camera opposite to drag
    mapCamera.x -= dx / MAP_SCALE;
    mapCamera.y -= dy / MAP_SCALE;

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;

    renderWorldMap();
});

// Helper
function getBiomeColorForMap(x, y) {
    const elev = elevationNoise.noise(x / 70, y / 70);
    const moist = moistureNoise.noise(x / 50, y / 50);

    if (elev < 0.35) return '#3b82f6'; // Water
    if (elev < 0.4 && moist > 0.7) return '#422006'; // Swamp
    if (elev > 0.8) return '#57534e'; // Mountain
    if (elev > 0.6 && moist < 0.3) return '#2d2d2d'; // Deadlands
    if (moist < 0.15) return '#fde047'; // Desert
    if (moist > 0.55) return '#14532d'; // Forest
    return '#22c55e'; // Plains
}









// --- HELPER: DRAW FANCY MOUNTAIN (OPTIMIZED) ---
function drawMountain(ctx, x, y, size) {
    // Use the global cache we created in Step 1
    if (!cachedThemeColors.mtnBase) updateThemeColors();

    const { mtnBase, mtnShadow, mtnCap } = cachedThemeColors;

    // 1. Draw the main mountain body
    ctx.fillStyle = mtnBase;
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size / 2, y + size * 0.1);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();

    // 2. Draw the shadow
    ctx.fillStyle = mtnShadow;
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size * 0.1);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x + size / 2, y + size);
    ctx.closePath();
    ctx.fill();

    // 3. Draw the snow cap
    ctx.fillStyle = mtnCap;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.25, y + size * 0.5);
    ctx.lineTo(x + size * 0.35, y + size * 0.4);
    ctx.lineTo(x + size * 0.5, y + size * 0.55);
    ctx.lineTo(x + size * 0.65, y + size * 0.4);
    ctx.lineTo(x + size * 0.75, y + size * 0.5);
    ctx.lineTo(x + size / 2, y + size * 0.1);
    ctx.closePath();
    ctx.fill();
}
