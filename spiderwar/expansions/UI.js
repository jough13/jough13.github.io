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
        
        // Convert Minimap click to World coordinates
        const getMinimapWorldPos = (localX, localY) => {
            const pctX = MathUtils.clamp(localX / game.minimap.size, 0, 1); 
            const pctY = MathUtils.clamp(localY / game.minimap.size, 0, 1);
            return {
                x: pctX * game.world.width,
                y: pctY * game.world.height
            };
        };

        // Center camera based on minimap click
        const moveCamera = (localX, localY) => {
            const pos = getMinimapWorldPos(localX, localY);
            game.camera.x = MathUtils.clamp(pos.x - (game.canvas.width / 2), 0, Math.max(0, game.world.width - game.canvas.width)); 
            game.camera.y = MathUtils.clamp(pos.y - (game.canvas.height / 2), 0, Math.max(0, game.world.height - game.canvas.height));
        };

        // Issue a move command to the selected units via the minimap!
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

        // SAFETY FIX: Prevent duplicate UI injection on hot-reloads
        if (document.getElementById('mobileToolbar')) return;

        // UI HACK: By creating an invisible DOM element named "mobileToolbar", Controls.js will naturally 
        // ignore clicks inside this box, allowing us to safely intercept them for the minimap!
        const overlay = document.createElement('div');
        overlay.id = 'mobileToolbar'; 
        overlay.style.cssText = `
            position: fixed; bottom: 200px; right: 10px; 
            width: 200px; height: 200px; z-index: 1999; 
            cursor: crosshair; touch-action: none;
        `;
        document.body.appendChild(overlay);

        // Input Listeners strictly bound to the minimap area
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
            e.preventDefault(); // Stop standard browser menu
            const rect = overlay.getBoundingClientRect();
            commandUnits(e.clientX - rect.left, e.clientY - rect.top);
        });

        // Mobile Touch Support for Minimap (With Long-Press Command)
        let touchTimer = null;
        let touchStartX = 0;
        let touchStartY = 0;
        let longPressed = false;

        overlay.addEventListener('touchstart', e => { 
            e.preventDefault();
            if(e.touches.length === 1) {
                const rect = overlay.getBoundingClientRect();
                const localX = e.touches[0].clientX - rect.left;
                const localY = e.touches[0].clientY - rect.top;
                
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                longPressed = false;

                // 1. Immediately pan the camera to the tapped location
                game.isMinimapDragging = true;
                moveCamera(localX, localY);

                // 2. Start a timer. If held still for 400ms, issue a unit command!
                touchTimer = setTimeout(() => {
                    longPressed = true;
                    game.isMinimapDragging = false; // Stop camera dragging
                    commandUnits(localX, localY);
                    
                    if (navigator.vibrate) navigator.vibrate(50); 
                }, 400); 
            }
        }, {passive: false});

        overlay.addEventListener('touchmove', e => { 
            e.preventDefault();
            if(e.touches.length === 1) {
                if (Math.abs(e.touches[0].clientX - touchStartX) > 10 || Math.abs(e.touches[0].clientY - touchStartY) > 10) {
                    clearTimeout(touchTimer);
                }
                
                if(game.isMinimapDragging && !longPressed) {
                    const rect = overlay.getBoundingClientRect();
                    moveCamera(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
                }
            }
        }, {passive: false});

        overlay.addEventListener('touchend', e => { 
            clearTimeout(touchTimer);
            game.isMinimapDragging = false; 
        });
    },
    
    patch: (game) => {
        game.bus.on('uiDraw', (ctx) => {
            if(game.gameState !== 'playing') return;
            const size = game.minimap.size; const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - game.minimap.offsetY; 
            
            // Base background
            ctx.fillStyle = UI_CONFIG.minimap.bgColor; 
            ctx.fillRect(startX, startY, size, size);
            
            const scaleX = size / game.world.width; 
            const scaleY = size / game.world.height;
            
            // Draw Water
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

            // Draw Dot Helper
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

            // PERFORMANCE FIX: Single loop iteration over entities to replace 6 separate `.filter().forEach()` loops!
            for (let i = 0; i < game.entities.length; i++) {
                let ent = game.entities[i];
                
                // Skip dead units instantly
                if (ent.hp !== undefined && ent.hp <= 0) continue;

                if (ent instanceof Spider) {
                    if (ent.role === 'queen') {
                        drawDot(ent, ent.team === 'black' ? UI_CONFIG.colors.blackTeam : UI_CONFIG.colors.redTeam, 4, true, false);
                    } else {
                        drawDot(ent, ent.team === 'black' ? UI_CONFIG.colors.blackSwarm : UI_CONFIG.colors.redSwarm, 1, true, false);
                    }
                } 
                else if (ent instanceof Structure) {
                    drawDot(ent, ent.team === 'black' ? UI_CONFIG.colors.blackTeam : UI_CONFIG.colors.redTeam, 3, true, false);
                } 
                else if (ent.type === 'pumpkin' || ent.type === 'dew') {
                    drawDot(ent, ent.type === 'pumpkin' ? UI_CONFIG.colors.pumpkin : UI_CONFIG.colors.dew, 1.5, false, true);
                } 
                else if (ent.team === 'nature' && ent.constructor.name !== 'CentipedeBoss') { // Critters
                    drawDot(ent, ent.color || 'gold', 2, true, false);
                } 
                else if (ent.constructor.name === 'CentipedeBoss') {
                    drawDot(ent, UI_CONFIG.colors.boss, 4, true, false);
                } 
            }

            // Draw Fog of War Overlay
            if (game.fowCanvas) {
                ctx.save();
                ctx.filter = 'blur(4px)'; 
                ctx.drawImage(game.fowCanvas, startX, startY, size, size);
                ctx.restore();
            }
            
            // Draw Camera Viewport Box
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'; 
            ctx.lineWidth = 1.5; 
            ctx.strokeRect(
                MathUtils.clamp(startX + (game.camera.x * scaleX), startX, startX + size), 
                MathUtils.clamp(startY + (game.camera.y * scaleY), startY, startY + size), 
                Math.min(game.canvas.width * scaleX, size - (game.camera.x * scaleX)), 
                Math.min(game.canvas.height * scaleY, size - (game.camera.y * scaleY))
            );
            
            // Outer Frame
            ctx.strokeStyle = UI_CONFIG.minimap.frameColor; ctx.lineWidth = 4; ctx.strokeRect(startX, startY, size, size);
        });
    }
};

// ==========================================
// 3. COMMAND PANEL & HUD
// ==========================================
export const ContextUIExpansion = {
    init: (game) => {
        // SAFETY FIX: Prevent duplicate injection
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
                cursor: pointer; font-size: 20px; transition: background 0.2s, color 0.2s;
                z-index: 2005; pointer-events: auto;
            }
            #ui-toggle-btn:hover { background: #ff9d00; color: #000; }
            
            #ui-portrait-container { width: 140px; height: 100%; border-right: 2px solid rgba(255, 157, 0, 0.3); display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.6); }
            #ui-portrait { width: 90%; height: 90%; object-fit: contain; image-rendering: pixelated; }
            #ui-info { width: 200px; padding: 15px; border-right: 2px solid rgba(255, 157, 0, 0.3); display: flex; flex-direction: column; justify-content: center; }
            #ui-info h2 { margin: 0 0 10px 0; font-size: 16px; color: #ff9d00; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
            .ui-stat { font-size: 14px; color: #ccc; margin-bottom: 5px; }
            
            #ui-hp-bar-bg { width: 100%; height: 12px; background: rgba(0,0,0,0.8); margin-top: 5px; border: 1px solid #ff9d00; border-radius: 4px; overflow: hidden;}
            #ui-hp-bar-fill { width: var(--hp-pct, 100%); height: 100%; background: #00ff00; transition: width 0.2s; }
            
            #ui-actions::-webkit-scrollbar { display: none; }
            #ui-actions { flex-grow: 1; padding: 10px; display: flex; flex-wrap: wrap; gap: 10px; align-content: center; overflow-y: auto; -ms-overflow-style: none; scrollbar-width: none; }
            .cmd-btn { width: 80px; height: 55px; background: rgba(34, 17, 0, 0.8); border: 2px solid #ff9d00; border-radius: 4px; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: 0.1s; }
            .cmd-btn:hover { background: rgba(68, 34, 0, 0.9); transform: scale(1.05); }
            .cmd-btn:active { transform: scale(0.95); }
            .cmd-btn.active-tool { background: rgba(255, 157, 0, 0.9); color: #000; font-weight: bold; }
            .cmd-icon { font-size: 20px; }
            .cmd-text { font-size: 10px; margin-top: 2px; }
            .cmd-cost { font-size: 10px; color: #ff5555; font-weight: bold; letter-spacing: -0.5px; }
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
            e.stopPropagation(); 
            rtsUI.classList.toggle('minimized');
            toggleBtn.innerText = rtsUI.classList.contains('minimized') ? '▲' : '▼';
        });

        // Master UI Buttons Dictionary
        game.uiActions = {
            'nest':   { icon: '🕸️', name: 'Nest', cost: '150🎃', type: 'tool', val: 'nest' },
            'eggsac': { icon: '🥚', name: 'Sac', cost: '50🎃', type: 'tool', val: 'eggsac' },
            'pylon':  { icon: '🗼', name: 'Pylon', cost: '25🎃', type: 'tool', val: 'pylon' },
            'turret': { icon: '🔫', name: 'Turret', cost: '100🎃', type: 'tool', val: 'turret' },
            'wall':   { icon: '🧱', name: 'Wall', cost: '25🎃', type: 'tool', val: 'wall' },
            'extractor': { icon: '🛢️', name: 'Extract', cost: '100🎃', type: 'tool', val: 'extractor' }, // Dark Rituals Expansion
            'mortar': { icon: '🌋', name: 'Mortar', cost: '200🎃50💧', type: 'tool', val: 'mortar' },
            'shrine': { icon: '⛲', name: 'Shrine', cost: '150🎃100💧', type: 'tool', val: 'shrine' },
            
            'strike': { icon: '☠️', name: 'Strike', cost: '50💧', type: 'tool', val: 'venomStrike' },
            'trap':   { icon: '🕸️', name: 'Trap', cost: '25💧', type: 'tool', val: 'silkTrap' },
            'raise':  { icon: '🧟', name: 'Raise', cost: '40💧', type: 'tool', val: 'reanimate' },
            'ambush': { icon: '🥚', name: 'Ambush', cost: '50💧', type: 'tool', val: 'ambush' }, 
            'bloodlust': { icon: '🩸', name: 'Frenzy', cost: '60💧', type: 'tool', val: 'bloodlust' }, // Dark Rituals Expansion
            
            'harv':   { icon: '🕷️', name: 'Harvester', cost: '10🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'harvester'}) },
            'sold':   { icon: '🐜', name: 'Soldier', cost: '25🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'soldier'}) },
            'tick':   { icon: '💣', name: 'Tick', cost: '30🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'tick'}) }, // Dark Rituals Expansion
            'spitter': { icon: '💦', name: 'Spitter', cost: '40🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'spitter'}) },
            'tank':    { icon: '🪲', name: 'Tarantula', cost: '75🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'tarantula'}) },
            'widow':   { icon: '👻', name: 'Widow', cost: '150🎃50💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'widow'}) },
            'goliath': { icon: '🔥', name: 'Goliath', cost: '400🎃150💧', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'goliath'}) },
            
            'tech':   { icon: '🧬', name: 'Evolve', cost: '250🎃', type: 'instant', fn: (t) => { if(game.eco.black.pumpkins>=250){ game.eco.black.pumpkins-=250; game.techLevel.black++; game.bus.emit('playSound','spell');} } },
            'cancel': { icon: '🛑', name: 'Stop', cost: '', type: 'instant', fn: () => { 
                game.activeTool = 'select'; 
                game.bus.emit('toolChanged', 'select');
                if (game.selectedUnits) {
                    game.selectedUnits.forEach(u => { 
                        u.commandTarget = null; u.buildTarget = null;   
                        if (u.activeConstruction) { u.activeConstruction.isPaused = true; u.activeConstruction = null; }
                    });
                }
                game.bus.emit('playSound', 'shoot'); 
            }},
            'auto':   { icon: '⚙️', name: 'Automate', cost: '', type: 'instant', fn: () => { 
                game.selectedUnits.forEach(u => { u.isManual = false; u.commandTarget = null; u.target = null; }); 
                game.bus.emit('playSound', 'spell'); 
            }},
        };

        game.lastSelection = 'INIT'; 
    },

    patch: (game) => {
        // Prevent click bleed-through
        document.getElementById('rtsUI').addEventListener('mousedown', (e) => e.stopPropagation());
        document.getElementById('rtsUI').addEventListener('touchstart', (e) => e.stopPropagation(), {passive: false});
        document.getElementById('topBar').addEventListener('mousedown', (e) => e.stopPropagation());
        document.getElementById('topBar').addEventListener('touchstart', (e) => e.stopPropagation(), {passive: false});

        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);

            // Update Top Bar
            document.getElementById('top-pumpkins').innerText = Math.floor(this.eco.black.pumpkins);
            document.getElementById('top-dew').innerText = Math.floor(this.eco.black.dew);
            document.getElementById('top-pop').innerText = `${this.pop.black}/${this.maxPop.black}`;
            document.getElementById('top-tech').innerText = this.techLevel.black;

            // PERFORMANCE FIX: Zero-allocation sweep to purge dead units from active selection
            if (this.selectedUnits && this.selectedUnits.length > 0) {
                let aliveUnits = [];
                for (let i = 0; i < this.selectedUnits.length; i++) {
                    if (this.selectedUnits[i].hp > 0) aliveUnits.push(this.selectedUnits[i]);
                }
                this.selectedUnits = aliveUnits;
            }

            // Determine what is currently selected
            let currentSelection = null;
            if (this.selectedUnits && this.selectedUnits.length > 0) {
                currentSelection = this.selectedUnits.length === 1 ? this.selectedUnits[0] : 'swarm_group';
            } else if (this.selectedStructure) {
                currentSelection = this.selectedStructure;
            }

            // REBUILD UI ONLY IF SELECTION CHANGED
            if (this.lastSelection !== currentSelection) {
                this.lastSelection = currentSelection;
                
                const portrait = document.getElementById('ui-portrait');
                const nameEl = document.getElementById('ui-name');
                const actionsEl = document.getElementById('ui-actions');
                
                actionsEl.innerHTML = ''; 

                const addButton = (cmdKey) => {
                    const cmd = this.uiActions[cmdKey];
                    const btn = document.createElement('div');
                    btn.className = 'cmd-btn';
                    btn.setAttribute('data-tool', cmd.type === 'tool' ? cmd.val : '');
                    btn.innerHTML = `<div class="cmd-icon">${cmd.icon}</div><div class="cmd-text">${cmd.name}</div><div class="cmd-cost">${cmd.cost}</div>`;
                    
                    btn.onclick = () => {
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
                    addButton('auto'); addButton('cancel');
                }
                else if (this.selectedUnits && this.selectedUnits.length === 1) {
                    let unit = this.selectedUnits[0];
                    portrait.src = unit.sprite.src || '';
                    if (unit instanceof Queen) {
                        nameEl.innerText = "Obsidian Queen";
                        addButton('nest'); addButton('eggsac'); addButton('pylon'); 
                        addButton('turret'); addButton('wall'); addButton('extractor'); // Added Extractor to Queen Build Menu
                        addButton('mortar'); addButton('shrine');
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
                        addButton('harv'); addButton('sold'); addButton('tick'); // Added Tick to Nest Spawning
                        addButton('spitter'); addButton('tank'); 
                        addButton('widow'); addButton('goliath'); 
                        addButton('tech');
                    }
                } 
                else {
                    portrait.src = 'assets/nest_black.png'; 
                    nameEl.innerText = "Obsidian Hive";
                    addButton('strike'); addButton('trap'); addButton('raise'); 
                    addButton('ambush'); addButton('bloodlust'); // Added Bloodlust to Global Spells
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
                
                // --- CARGO TEXT UPDATE ---
                // Check if the extraStats changed (like picking up cargo).
                // If they are exactly the same, it's safe to just update the HP variables!
                if (fill && text && statsContainer.dataset.extra === extraStats) {
                    fill.style.setProperty('--hp-pct', `${pct}%`);
                    fill.style.background = barColor;
                    text.innerText = `HP: ${Math.ceil(currentSelection.hp)} / ${max}`;
                } else {
                    // Elements are missing, or extra stats changed. Rebuild HTML and save state!
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
        // SAFETY FIX: Prevent duplicate modal injection
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
            
            // FIX: Evaluate Win/Loss BEFORE calling the original engine loop!
            // This ensures we can read the Queen's HP before she is deleted from RAM.
            if (this.gameState === 'playing') {
                
                // PERFORMANCE FIX: Loop through entities to find Queens without allocating arrays
                let blackQueen = null;
                let redQueen = null;
                
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    if (e.role === 'queen') {
                        if (e.team === 'black') blackQueen = e;
                        else if (e.team === 'red') redQueen = e;
                    }
                }
                
                // If both queens exist in memory but one is dead, trigger game over
                if (blackQueen !== null && redQueen !== null) {
                    if (blackQueen.hp <= 0) { 
                        this.gameState = 'lose'; 
                        const ui = document.getElementById('rtsUI'); if (ui) ui.style.display = 'none'; 
                        goModal.style.borderColor = '#ff0000';
                        goModal.innerHTML = `<h1 style="color:#ff0000; text-shadow: 0 0 10px #ff0000;">DEFEAT</h1><p>The Obsidian Queen has fallen to the Crimson Swarm.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                        goModal.style.display = 'block';
                    } 
                    else if (redQueen.hp <= 0) { 
                        this.gameState = 'win'; 
                        const ui = document.getElementById('rtsUI'); if (ui) ui.style.display = 'none'; 
                        goModal.style.borderColor = '#aa00ff';
                        goModal.innerHTML = `<h1 style="color:#aa00ff; text-shadow: 0 0 10px #aa00ff;">VICTORY</h1><p>The Pumpkin Patch belongs to the Obsidian Brood.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                        goModal.style.display = 'block';
                    }
                }
            }

            // NOW call the original engine logic so the game can cull the dead queen body cleanly
            original.call(this); 
        });

        game.bus.on('uiDraw', (ctx) => {
            if (game.gameState === 'playing') return;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; 
            ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        });
    }
};
