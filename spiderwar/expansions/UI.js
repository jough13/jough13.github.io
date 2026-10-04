// expansions/UI.js
import { Game, MathUtils, Structure, Spider, ResourceNode } from '../game.js';
import { Queen } from './Queen.js';

// ==========================================
// 1. CONFIGURATION & STYLING
// ==========================================
const UI_CONFIG = {
    minimap: {
        size: 200,
        padding: 10,
        offsetY: 190,
        bgColor: 'rgba(10, 5, 0, 0.8)',
        waterColor: 'rgba(26, 78, 110, 0.7)',
        frameColor: '#ff9d00'
    },
    colors: {
        blackTeam: '#ffffff',
        redTeam: '#ff4444',
        blackSwarm: '#aaaaaa',
        redSwarm: '#aa0000',
        pumpkin: '#ff7b00',
        dew: '#00aaff',
        boss: '#00ff00'
    }
};

const TWO_PI = Math.PI * 2;

// ==========================================
// 2. MINIMAP EXPANSION & HUD OVERLAY
// ==========================================
export const MinimapExpansion = {
    init: (game) => {
        game.minimap = UI_CONFIG.minimap; 
        game.isMinimapDragging = false;
        
        const getMinimapWorldPos = (localX, localY) => {
            const pctX = MathUtils.clamp(localX / game.minimap.size, 0, 1); 
            const pctY = MathUtils.clamp(localY / game.minimap.size, 0, 1);
            return { x: pctX * game.world.width, y: pctY * game.world.height };
        };

        const moveCamera = (localX, localY) => {
            const pos = getMinimapWorldPos(localX, localY);
            game.camera.x = MathUtils.clamp(pos.x - (game.canvas.width / 2), 0, Math.max(0, game.world.width - game.canvas.width)); 
            game.camera.y = MathUtils.clamp(pos.y - (game.canvas.height / 2), 0, Math.max(0, game.world.height - game.canvas.height));
        };

        const commandUnits = (localX, localY) => {
            let validUnits = game.selectedUnits ? game.selectedUnits.filter(u => u.team === 'black' && u.hp > 0) : [];
            if (validUnits.length > 0) {
                const pos = getMinimapWorldPos(localX, localY);
                game.bus.emit('particles', {x: pos.x, y: pos.y, color: '#aa00ff', count: 20});
                game.bus.emit('playSound', 'shoot');
                
                validUnits.forEach(u => {
                    let offsetX = MathUtils.randomRange(-validUnits.length * 4, validUnits.length * 4);
                    let offsetY = MathUtils.randomRange(-validUnits.length * 4, validUnits.length * 4);
                    u.commandTarget = { x: pos.x + offsetX, y: pos.y + offsetY };
                    u.isManual = true; 
                });
            }
        };

        if (document.getElementById('mobileToolbar')) return;

        const overlay = document.createElement('div');
        overlay.id = 'mobileToolbar'; 
        overlay.style.cssText = `position: fixed; bottom: 200px; right: 10px; width: 200px; height: 200px; z-index: 1999; cursor: crosshair; touch-action: none;`;
        document.body.appendChild(overlay);

        overlay.addEventListener('mousedown', e => {
            const rect = overlay.getBoundingClientRect();
            if (e.button === 0) {
                game.isMinimapDragging = true;
                moveCamera(e.clientX - rect.left, e.clientY - rect.top);
            }
        });

        overlay.addEventListener('mousemove', e => {
            if (game.isMinimapDragging) {
                const rect = overlay.getBoundingClientRect();
                moveCamera(e.clientX - rect.left, e.clientY - rect.top);
            }
        });

        window.addEventListener('mouseup', e => { if (e.button === 0) game.isMinimapDragging = false; });

        overlay.addEventListener('contextmenu', e => {
            e.preventDefault(); 
            const rect = overlay.getBoundingClientRect();
            commandUnits(e.clientX - rect.left, e.clientY - rect.top);
        });

        let touchTimer = null;
        let touchStartX = 0; let touchStartY = 0; let longPressed = false;

        overlay.addEventListener('touchstart', e => { 
            e.preventDefault();
            if(e.touches.length === 1) {
                const rect = overlay.getBoundingClientRect();
                const localX = e.touches[0].clientX - rect.left;
                const localY = e.touches[0].clientY - rect.top;
                touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
                longPressed = false;
                game.isMinimapDragging = true;
                moveCamera(localX, localY);

                touchTimer = setTimeout(() => {
                    longPressed = true; game.isMinimapDragging = false; 
                    commandUnits(localX, localY);
                    if (navigator.vibrate) navigator.vibrate(50); 
                }, 400); 
            }
        }, {passive: false});

        overlay.addEventListener('touchmove', e => { 
            e.preventDefault();
            if(e.touches.length === 1) {
                if (Math.abs(e.touches[0].clientX - touchStartX) > 10 || Math.abs(e.touches[0].clientY - touchStartY) > 10) clearTimeout(touchTimer);
                if(game.isMinimapDragging && !longPressed) {
                    const rect = overlay.getBoundingClientRect();
                    moveCamera(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
                }
            }
        }, {passive: false});

        overlay.addEventListener('touchend', e => { clearTimeout(touchTimer); game.isMinimapDragging = false; });
    },
    
    patch: (game) => {
        game.bus.on('uiDraw', (ctx) => {
            if(game.gameState !== 'playing') return;
            const size = game.minimap.size; const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - game.minimap.offsetY; 
            
            ctx.fillStyle = UI_CONFIG.minimap.bgColor; 
            ctx.fillRect(startX, startY, size, size);
            
            const scaleX = size / game.world.width; 
            const scaleY = size / game.world.height;
            
            if (game.mapGrid) {
                ctx.fillStyle = UI_CONFIG.minimap.waterColor;
                for (let y = 0; y < game.mapGrid.length; y++) {
                    for (let x = 0; x < game.mapGrid[y].length; x++) {
                        if (game.mapGrid[y][x].type === 'water') {
                            ctx.fillRect(startX + (x * game.tileSize * scaleX), startY + (y * game.tileSize * scaleY), (game.tileSize * scaleX)+0.5, (game.tileSize * scaleY)+0.5);
                        }
                    }
                }
            }

            const drawDot = (ent, color, r, hideIfInvisible, hideIfUndiscovered) => { 
                if (game.mapGrid) {
                    const tX = Math.floor(ent.x / game.tileSize); 
                    const tY = Math.floor(ent.y / game.tileSize);
                    if (tY >= 0 && tY < game.mapGrid.length && tX >= 0 && tX < game.mapGrid[0].length) {
                        const tile = game.mapGrid[tY][tX];
                        if (hideIfUndiscovered && !tile.discovered) return;
                        if (hideIfInvisible && !tile.visible && ent.team !== 'black') return; 
                    }
                }
                ctx.fillStyle = color; 
                ctx.fillRect(startX + (ent.x * scaleX) - r, startY + (ent.y * scaleY) - r, r*2, r*2); 
            };

            for (let i = 0; i < game.entities.length; i++) {
                let ent = game.entities[i];
                if (ent.hp !== undefined && ent.hp <= 0) continue;

                if (ent instanceof Spider) {
                    if (ent.role === 'queen') drawDot(ent, ent.team === 'black' ? UI_CONFIG.colors.blackTeam : UI_CONFIG.colors.redTeam, 4, true, false);
                    else drawDot(ent, ent.team === 'black' ? UI_CONFIG.colors.blackSwarm : UI_CONFIG.colors.redSwarm, 1, true, false);
                } 
                else if (ent instanceof Structure) drawDot(ent, ent.team === 'black' ? UI_CONFIG.colors.blackTeam : UI_CONFIG.colors.redTeam, 3, true, false);
                else if (ent.type === 'pumpkin' || ent.type === 'dew') drawDot(ent, ent.type === 'pumpkin' ? UI_CONFIG.colors.pumpkin : UI_CONFIG.colors.dew, 1.5, false, true);
                else if (ent.team === 'nature' && ent.constructor.name !== 'CentipedeBoss') drawDot(ent, ent.color || 'gold', 2, true, false);
                else if (ent.constructor.name === 'CentipedeBoss') drawDot(ent, UI_CONFIG.colors.boss, 4, true, false);
            }

            if (game.fowCanvas) {
                ctx.save(); ctx.filter = 'blur(4px)'; 
                ctx.drawImage(game.fowCanvas, startX, startY, size, size);
                ctx.restore();
            }
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; ctx.lineWidth = 1.5; 
            ctx.strokeRect(
                MathUtils.clamp(startX + (game.camera.x * scaleX), startX, startX + size), 
                MathUtils.clamp(startY + (game.camera.y * scaleY), startY, startY + size), 
                Math.min(game.canvas.width * scaleX, size - (game.camera.x * scaleX)), 
                Math.min(game.canvas.height * scaleY, size - (game.camera.y * scaleY))
            );
            ctx.strokeStyle = UI_CONFIG.minimap.frameColor; ctx.lineWidth = 4; ctx.strokeRect(startX, startY, size, size);
        });
    }
};

// ==========================================
// 3. COMMAND PANEL & HUD
// ==========================================
export const ContextUIExpansion = {
    init: (game) => {
        if (document.getElementById('rtsUI')) return;

        const style = document.createElement('style');
        style.innerHTML = `
            #topBar {
                position: fixed; top: 10px; left: 10px; padding: 0px 15px; 
                display: flex; justify-content: center; align-items: center; gap: 30px;
                border-style: solid; border-width: 24px; 
                border-image-source: url('assets/ui_frame.png'); border-image-slice: 32%; border-image-repeat: stretch; 
                background-color: rgba(5, 2, 0, 0.75); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
                font-family: 'Courier New', monospace; color: white; z-index: 2000;
                box-shadow: 0 10px 30px rgba(0,0,0,0.8); user-select: none;
                font-size: 16px; font-weight: bold; text-shadow: 1px 1px 0 #000;
            }
            .res-item { display: flex; align-items: center; gap: 8px; }
            .res-value { color: #ff9d00; }

            #rtsUI {
                position: fixed; bottom: 0; left: 0; width: 100%; height: 180px;
                border-style: solid; border-width: 32px; 
                border-image-source: url('assets/ui_frame.png'); border-image-slice: 32%; border-image-repeat: stretch; 
                background-color: rgba(0, 0, 0, 0.95); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); 
                display: flex; box-sizing: border-box; font-family: 'Courier New', monospace; color: white; z-index: 2000;
                box-shadow: 0 -5px 20px rgba(0,0,0,0.8); user-select: none;
                transition: bottom 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            #rtsUI.minimized { bottom: -150px; }

            #ui-toggle-btn {
                position: absolute; top: -40px; right: 20px; width: 60px; height: 40px;
                background: rgba(10, 5, 0, 0.95); border: 2px solid #ff9d00; border-bottom: none; border-radius: 8px 8px 0 0;
                color: #ff9d00; display: flex; justify-content: center; align-items: center;
                cursor: pointer; font-size: 20px; transition: background 0.2s, color 0.2s; z-index: 2005; pointer-events: auto;
            }
            #ui-toggle-btn:hover { background: #ff9d00; color: #000; }
            
            #ui-portrait-container { width: 140px; height: 100%; border-right: 2px solid rgba(255, 157, 0, 0.3); display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.6); }
            #ui-portrait { width: 90%; height: 90%; object-fit: contain; image-rendering: pixelated; }
            #ui-info { width: 200px; padding: 15px; border-right: 2px solid rgba(255, 157, 0, 0.3); display: flex; flex-direction: column; justify-content: center; }
            #ui-info h2 { margin: 0 0 10px 0; font-size: 16px; color: #ff9d00; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
            .ui-stat { font-size: 14px; color: #ccc; margin-bottom: 5px; }
            
            #ui-hp-bar-bg { width: 100%; height: 12px; background: rgba(0,0,0,0.8); margin-top: 5px; border: 1px solid #ff9d00; border-radius: 4px; overflow: hidden;}
            #ui-hp-bar-fill { width: var(--hp-pct, 100%); height: 100%; background: #00ff00; transition: width 0.2s; }
            
            /* --- SCROLLBAR FIX FOR ACTIONS MENU --- */
            #ui-actions { 
                flex-grow: 1; padding: 10px; display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; 
                overflow-y: auto; 
                scrollbar-width: thin; scrollbar-color: rgba(255, 157, 0, 0.4) rgba(0,0,0,0.2);
            }
            
            /* Dimmed scrollbar when not interacting */
            #ui-actions::-webkit-scrollbar { width: 8px; }
            #ui-actions::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
            #ui-actions::-webkit-scrollbar-thumb { background: rgba(255, 157, 0, 0.3); border-radius: 4px; border: 1px solid rgba(0,0,0,0.3); }
            
            /* Bright scrollbar when hovered */
            #ui-actions:hover::-webkit-scrollbar-track { background: rgba(0,0,0,0.5); }
            #ui-actions:hover::-webkit-scrollbar-thumb { background: rgba(255, 157, 0, 1.0); border: 1px solid #000; }
            
            .cmd-btn { width: 80px; height: 55px; background: rgba(34, 17, 0, 0.8); border: 2px solid #ff9d00; border-radius: 4px; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: 0.1s; }
            .cmd-btn:hover { background: rgba(68, 34, 0, 0.9); transform: scale(1.05); }
            .cmd-btn:active { transform: scale(0.95); }
            .cmd-btn.active-tool { background: rgba(255, 157, 0, 0.9); color: #000; font-weight: bold; }
            
            /* --- CUSTOM ICON SUPPORT --- */
            .cmd-icon { font-size: 20px; display: flex; justify-content: center; align-items: center; height: 24px; }
            .cmd-icon img { width: 24px; height: 24px; image-rendering: pixelated; }
            .cmd-text { font-size: 10px; margin-top: 2px; }
            .cmd-cost { font-size: 10px; color: #ff5555; font-weight: bold; letter-spacing: -0.5px; }

            /* --- TECH GATING CSS --- */
            .cmd-btn.locked { filter: grayscale(100%) brightness(0.5); cursor: not-allowed; border-color: #555; }
            .cmd-btn.locked:hover { transform: none; background: rgba(34, 17, 0, 0.8); }
            .cmd-btn.locked .cmd-cost { color: #ff3333; }
        `;
        document.head.appendChild(style);

        const uiBase = document.createElement('div');
        uiBase.innerHTML = `
            <div id="topBar">
                <div class="res-item" title="Pumpkins (Building Resource)">🎃 <span id="top-pumpkins" class="res-value">0</span></div>
                <div class="res-item" title="Dew Drops (Magic Resource)">💧 <span id="top-dew" class="res-value">0</span></div>
                <div class="res-item" title="Swarm Population">🕷️ <span id="top-pop" class="res-value">0/0</span></div>
                <div class="res-item" title="Hive Tech Level">🧬 Tech: <span id="top-tech" class="res-value">0</span></div>
            </div>
            <div id="rtsUI">
                <div id="ui-toggle-btn" title="Toggle HUD">▼</div>
                <div id="ui-portrait-container"><img id="ui-portrait" src=""></div>
                <div id="ui-info">
                    <h2 id="ui-name">Obsidian Hive</h2>
                    <div id="ui-stats-container"></div>
                </div>
                <div id="ui-actions"></div>
            </div>
        `;
        document.body.appendChild(uiBase);

        const toggleBtn = document.getElementById('ui-toggle-btn');
        const rtsUI = document.getElementById('rtsUI');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); rtsUI.classList.toggle('minimized');
            toggleBtn.innerText = rtsUI.classList.contains('minimized') ? '▲' : '▼';
        });

        // ==========================================
        // MASTER DICTIONARY (WITH TECH REQS & IMAGES)
        // ==========================================
        game.uiActions = {
            // -- BUILDINGS --
            'nest':      { reqTech: 0, icon: '🕸️', img: 'assets/nest_black.png', name: 'Nest', cost: '150🎃', type: 'tool', val: 'nest' },
            'eggsac':    { reqTech: 0, icon: '🥚', img: 'assets/eggsac_black.png', name: 'Sac', cost: '50🎃', type: 'tool', val: 'eggsac' },
            'pylon':     { reqTech: 0, icon: '🗼', img: 'assets/pylon_black.png', name: 'Pylon', cost: '25🎃', type: 'tool', val: 'pylon' },
            'wall':      { reqTech: 0, icon: '🧱', img: 'assets/wall_black.png', name: 'Wall', cost: '25🎃', type: 'tool', val: 'wall' },
            'turret':    { reqTech: 1, icon: '🔫', img: 'assets/turret_black.png', name: 'Turret', cost: '100🎃', type: 'tool', val: 'turret' },
            'extractor': { reqTech: 1, icon: '🛢️', img: 'assets/extractor_black.png', name: 'Extract', cost: '100🎃', type: 'tool', val: 'extractor' }, 
            'shrine':    { reqTech: 1, icon: '⛲', name: 'Shrine', cost: '150🎃100💧', type: 'tool', val: 'shrine' }, 
            'mortar':    { reqTech: 2, icon: '🌋', name: 'Mortar', cost: '200🎃50💧', type: 'tool', val: 'mortar' }, 
            'monolith':  { reqTech: 2, icon: '🪦', img: 'assets/monolith_black.png', name: 'Monolith', cost: '150🎃50💧', type: 'tool', val: 'monolith' }, 
            'obelisk':   { reqTech: 2, icon: '⚡', img: 'assets/obelisk_black.png', name: 'Obelisk', cost: '150🎃80💧', type: 'tool', val: 'obelisk' }, 
            'incubator': { reqTech: 2, icon: '🍄', img: 'assets/incubator_black.png', name: 'Incubate', cost: '200🎃', type: 'tool', val: 'incubator' }, 
            'maw':       { reqTech: 3, icon: '🕳️', img: 'assets/maw_black.png', name: 'The Maw', cost: '150🎃', type: 'tool', val: 'maw' }, 
            
            // -- SPELLS --
            'trap':      { reqTech: 0, icon: '🕸️', img: 'assets/icon_trap.png', name: 'Trap', cost: '25💧', type: 'tool', val: 'silkTrap' },
            'strike':    { reqTech: 1, icon: '☠️', img: 'assets/icon_strike.png', name: 'Strike', cost: '50💧', type: 'tool', val: 'venomStrike' },
            'raise':     { reqTech: 1, icon: '🧟', img: 'assets/icon_reanimate.png', name: 'Raise', cost: '40💧', type: 'tool', val: 'reanimate' },
            'ambush':    { reqTech: 1, icon: '🥚', name: 'Ambush', cost: '50💧', type: 'tool', val: 'ambush' }, 
            'bloodlust': { reqTech: 2, icon: '🩸', img: 'assets/icon_bloodlust.png', name: 'Frenzy', cost: '60💧', type: 'tool', val: 'bloodlust' }, 
            'paralyze':  { reqTech: 2, icon: '❄️', name: 'Paralyze', cost: '75💧', type: 'tool', val: 'paralyze' }, 
            'contagion': { reqTech: 2, icon: '☣️', name: 'Contagion', cost: '80💧', type: 'tool', val: 'contagion' }, 
            'eclipse':   { reqTech: 3, icon: '🌑', img: 'assets/icon_eclipse.png', name: 'Eclipse', cost: '150💧', type: 'tool', val: 'eclipse' }, 
            'vortex':    { reqTech: 3, icon: '🌀', img: 'assets/icon_vortex.png', name: 'Vortex', cost: '90💧', type: 'tool', val: 'vortex' }, 
            
            // -- UNITS --
            'harv':      { reqTech: 0, icon: '🕷️', img: 'assets/black_spider.png', name: 'Harvester', cost: '10🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'harvester'}) },
            'sold':      { reqTech: 0, icon: '🐜', img: 'assets/soldier_black.png', name: 'Soldier', cost: '25🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'soldier'}) },
            'tick':      { reqTech: 0, icon: '💣', img: 'assets/tick_black.png', name: 'Tick', cost: '30🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'tick'}) }, 
            'spitter':   { reqTech: 1, icon: '💦', name: 'Spitter', cost: '40🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'spitter'}) }, 
            'phantom':   { reqTech: 1, icon: '👻', img: 'assets/phantom_black.png', name: 'Phantom', cost: '60🎃20💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'phantom'}) }, 
            'tank':      { reqTech: 1, icon: '🪲', name: 'Tarantula', cost: '75🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'tarantula'}) }, 
            'wraith':    { reqTech: 2, icon: '🗡️', img: 'assets/wraith_black.png', name: 'Wraith', cost: '80🎃30💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'wraith'}) }, 
            'defiler':   { reqTech: 2, icon: '🦠', img: 'assets/defiler_black.png', name: 'Defiler', cost: '120🎃40💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'defiler'}) }, 
            'widow':     { reqTech: 2, icon: '👻', name: 'Widow', cost: '150🎃50💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'widow'}) }, 
            'voidweaver':{ reqTech: 3, icon: '👁️', img: 'assets/voidweaver_black.png', name: 'Weaver', cost: '100🎃30💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'voidweaver'}) }, 
            'goliath':   { reqTech: 3, icon: '🔥', name: 'Goliath', cost: '400🎃150💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'goliath'}) }, 
            
            // -- UTILITY --
            'tech':      { reqTech: 0, icon: '🧬', img: 'assets/icon_tech.png', name: 'Evolve', cost: '250🎃', type: 'instant', fn: (t) => { if(game.eco.black.pumpkins>=250){ game.eco.black.pumpkins-=250; game.techLevel.black++; game.bus.emit('playSound','spell');} } },
            'cancel':    { reqTech: 0, icon: '🛑', img: 'assets/icon_cancel.png', name: 'Stop', cost: '', type: 'instant', fn: () => { 
                game.activeTool = 'select'; game.bus.emit('toolChanged', 'select');
                if (game.selectedUnits) {
                    game.selectedUnits.forEach(u => { 
                        u.commandTarget = null; u.buildTarget = null;   
                        if (u.activeConstruction) { u.activeConstruction.isPaused = true; u.activeConstruction = null; }
                    });
                }
                game.bus.emit('playSound', 'shoot'); 
            }},
            'auto':      { reqTech: 0, icon: '⚙️', name: 'Automate', cost: '', type: 'instant', fn: () => { 
                game.selectedUnits.forEach(u => { u.isManual = false; u.commandTarget = null; u.target = null; }); 
                game.bus.emit('playSound', 'spell'); 
            }},
        };

        game.lastSelection = 'INIT'; 
    },

    patch: (game) => {
        document.getElementById('rtsUI').addEventListener('mousedown', (e) => e.stopPropagation());
        document.getElementById('rtsUI').addEventListener('touchstart', (e) => e.stopPropagation(), {passive: false});
        document.getElementById('topBar').addEventListener('mousedown', (e) => e.stopPropagation());
        document.getElementById('topBar').addEventListener('touchstart', (e) => e.stopPropagation(), {passive: false});

        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            document.getElementById('top-pumpkins').innerText = Math.floor(this.eco.black.pumpkins);
            document.getElementById('top-dew').innerText = Math.floor(this.eco.black.dew);
            document.getElementById('top-pop').innerText = `${this.pop.black}/${this.maxPop.black}`;
            document.getElementById('top-tech').innerText = this.techLevel.black;

            if (this.selectedUnits && this.selectedUnits.length > 0) {
                let aliveUnits = [];
                for (let i = 0; i < this.selectedUnits.length; i++) {
                    if (this.selectedUnits[i].hp > 0) aliveUnits.push(this.selectedUnits[i]);
                }
                this.selectedUnits = aliveUnits;
            }

            let currentSelection = null;
            if (this.selectedUnits && this.selectedUnits.length > 0) {
                currentSelection = this.selectedUnits.length === 1 ? this.selectedUnits[0] : 'swarm_group';
            } else if (this.selectedStructure) {
                currentSelection = this.selectedStructure;
            }

            // REBUILD UI ONLY IF SELECTION CHANGED OR TECH LEVEL CHANGED
            const stateString = (currentSelection ? (currentSelection.id || currentSelection.type || 'group') : 'none') + '_' + this.techLevel.black;

            if (this.lastSelection !== stateString) {
                this.lastSelection = stateString;
                
                const portrait = document.getElementById('ui-portrait');
                const nameEl = document.getElementById('ui-name');
                const actionsEl = document.getElementById('ui-actions');
                
                actionsEl.innerHTML = ''; 

                const addButton = (cmdKey) => {
                    const cmd = this.uiActions[cmdKey];
                    const reqTech = cmd.reqTech || 0;
                    const isLocked = this.techLevel.black < reqTech;
                    
                    const btn = document.createElement('div');
                    btn.className = 'cmd-btn';
                    if (isLocked) btn.classList.add('locked');
                    btn.setAttribute('data-tool', cmd.type === 'tool' ? cmd.val : '');
                    
                    const iconHtml = cmd.img ? `<img src="${cmd.img}" alt="${cmd.name}">` : cmd.icon;
                    
                    btn.innerHTML = `
                        <div class="cmd-icon">${isLocked ? '🔒' : iconHtml}</div>
                        <div class="cmd-text">${cmd.name}</div>
                        <div class="cmd-cost">${isLocked ? `Tech ${reqTech}` : cmd.cost}</div>
                    `;
                    
                    btn.onclick = () => {
                        if (isLocked) return; 
                        if (cmd.type === 'tool') {
                            this.activeTool = cmd.val;
                            this.bus.emit('toolChanged', cmd.val);
                        } else if (cmd.type === 'instant') {
                            cmd.fn(currentSelection);
                        }
                    };
                    actionsEl.appendChild(btn);
                };

                if (this.selectedUnits && this.selectedUnits.length > 1) {
                    portrait.src = 'assets/black_spider.png';
                    nameEl.innerText = `Brood Swarm (${this.selectedUnits.length})`;
                    addButton('auto'); 
                    addButton('cancel');
                }
                else if (this.selectedUnits && this.selectedUnits.length === 1) {
                    let unit = this.selectedUnits[0];
                    portrait.src = unit.sprite.src || '';
                    
                    if (unit instanceof Queen) {
                        nameEl.innerText = "Obsidian Queen";
                        addButton('nest'); addButton('eggsac'); addButton('pylon'); addButton('wall');
                        addButton('turret'); addButton('extractor'); addButton('shrine'); addButton('monolith'); 
                        addButton('mortar'); addButton('obelisk'); addButton('incubator'); addButton('maw'); 
                        addButton('cancel');
                    } else {
                        let roleName = unit.role.charAt(0).toUpperCase() + unit.role.slice(1);
                        if (unit.isZombie) roleName = "Zombie " + roleName;
                        nameEl.innerText = roleName;
                        addButton('auto'); addButton('cancel');
                    }
                }
                else if (this.selectedStructure) {
                    portrait.src = this.selectedStructure.sprite.src || '';
                    nameEl.innerText = this.selectedStructure.type === 'nest' ? `Main Nest (Lv ${this.techLevel.black})` : this.selectedStructure.type.toUpperCase();
                    
                    if (this.selectedStructure.type === 'nest' && this.selectedStructure.team === 'black') {
                        addButton('harv'); addButton('sold'); addButton('tick'); 
                        addButton('spitter'); addButton('phantom'); addButton('tank'); 
                        addButton('wraith'); addButton('defiler'); addButton('widow'); 
                        addButton('voidweaver'); addButton('goliath'); 
                        addButton('tech');
                    }
                } 
                else {
                    portrait.src = 'assets/nest_black.png'; 
                    nameEl.innerText = "Obsidian Hive";
                    addButton('trap'); addButton('strike'); addButton('raise'); addButton('ambush'); 
                    addButton('bloodlust'); addButton('paralyze'); addButton('contagion');
                    addButton('eclipse'); addButton('vortex'); 
                    addButton('cancel');
                }
            }

            // HP BAR UPDATE (Optimized)
            const statsContainer = document.getElementById('ui-stats-container');
            
            if (currentSelection && currentSelection.hp !== undefined) {
                let max = currentSelection.maxHp;
                if (currentSelection.team === 'black' && !(currentSelection instanceof Queen)) max += (this.techLevel.black * 20);
                
                let pct = Math.max(0, currentSelection.hp / max) * 100;
                let barColor = pct > 50 ? '#00ff00' : (pct > 25 ? '#ffff00' : '#ff0000');
                
                let extraStats = '';
                if (currentSelection.cargo && currentSelection.cargo.amount > 0) extraStats = `<div class="ui-stat">Cargo: ${currentSelection.cargo.amount} ${currentSelection.cargo.type}</div>`;
                if (currentSelection.damage) extraStats += `<div class="ui-stat">DMG: ${currentSelection.damage + (this.techLevel[currentSelection.team] * 5 || 0)}</div>`;

                const newHTML = `
                    <div class="ui-stat" id="ui-hp-text">HP: ${Math.ceil(currentSelection.hp)} / ${max}</div>
                    <div id="ui-hp-bar-bg"><div id="ui-hp-bar-fill" style="background: ${barColor}; --hp-pct: ${pct}%"></div></div>
                    ${extraStats}
                `;
                
                const fill = document.getElementById('ui-hp-bar-fill');
                const text = document.getElementById('ui-hp-text');
                
                if (fill && text && statsContainer.dataset.extra === extraStats) {
                    fill.style.setProperty('--hp-pct', `${pct}%`);
                    fill.style.background = barColor;
                    text.innerText = `HP: ${Math.ceil(currentSelection.hp)} / ${max}`;
                } else {
                    statsContainer.innerHTML = newHTML;
                    statsContainer.dataset.extra = extraStats; 
                }
                
            } else {
                const defaultMsg = `<div class="ui-stat">Select a unit or building to command the swarm.</div>`;
                if (statsContainer.innerHTML !== defaultMsg) statsContainer.innerHTML = defaultMsg;
            }

            // Sync Tool Highlights
            document.querySelectorAll('.cmd-btn').forEach(b => {
                if (b.getAttribute('data-tool') === this.activeTool) b.classList.add('active-tool');
                else b.classList.remove('active-tool');
            });
        });
    }
};

// ==========================================
// 4. GAME OVER MODAL
// ==========================================
export const GameLoopExpansion = {
    patch: (game) => {
        if (!document.getElementById('gameOverStyle')) {
            const style = document.createElement('style');
            style.id = 'gameOverStyle';
            style.innerHTML = `
                #gameOverModal {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: rgba(10, 5, 0, 0.95); border: 4px solid; border-radius: 12px;
                    padding: 40px; color: white; font-family: 'Courier New', monospace; text-align: center;
                    display: none; z-index: 9999; box-shadow: 0 0 50px rgba(0,0,0,1);
                }
                #gameOverModal h1 { font-size: 40px; margin: 0 0 20px 0; text-transform: uppercase; }
                .restart-btn { background: #fff; color: #000; padding: 15px 30px; font-size: 20px; font-weight: bold; border: none; cursor: pointer; border-radius: 8px; margin-top: 20px; transition: 0.2s;}
                .restart-btn:hover { background: #ff9d00; transform: scale(1.05); }
            `;
            document.head.appendChild(style);
        }
        
        let goModal = document.getElementById('gameOverModal');
        if (!goModal) {
            goModal = document.createElement('div'); 
            goModal.id = 'gameOverModal'; 
            document.body.appendChild(goModal);
        }

        game.expansions.patchClass(Game, 'update', function(original) {
            
            if (this.gameState === 'playing') {
                let blackQueen = null;
                let redQueen = null;
                
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    if (e.role === 'queen') {
                        if (e.team === 'black') blackQueen = e;
                        else if (e.team === 'red') redQueen = e;
                    }
                }
                
                if (blackQueen !== null && redQueen !== null) {
                    if (blackQueen.hp <= 0) { 
                        this.gameState = 'lose'; 
                        const ui = document.getElementById('rtsUI'); 
                        if (ui) ui.style.display = 'none'; 
                        goModal.style.borderColor = '#ff0000';
                        goModal.innerHTML = `<h1 style="color:#ff0000; text-shadow: 0 0 10px #ff0000;">DEFEAT</h1><p>The Obsidian Queen has fallen to the Crimson Swarm.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                        goModal.style.display = 'block';
                    } 
                    else if (redQueen.hp <= 0) { 
                        this.gameState = 'win'; 
                        const ui = document.getElementById('rtsUI'); 
                        if (ui) ui.style.display = 'none'; 
                        goModal.style.borderColor = '#aa00ff';
                        goModal.innerHTML = `<h1 style="color:#aa00ff; text-shadow: 0 0 10px #aa00ff;">VICTORY</h1><p>The Pumpkin Patch belongs to the Obsidian Brood.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                        goModal.style.display = 'block';
                    }
                }
            }

            original.call(this); 
        });

        game.bus.on('uiDraw', (ctx) => {
            if (game.gameState === 'playing') return;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; 
            ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        });
    }
};
