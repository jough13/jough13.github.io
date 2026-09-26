// expansions/UI.js
import { Game } from '../game.js';
import { Queen } from './Queen.js';

export const MinimapExpansion = {
    init: (game) => {
        game.minimap = { size: 200, padding: 10, offsetY: 150 }; 
        game.isMinimapDragging = false;
        
        game.moveCameraFromMinimap = function(localX, localY) {
            const pctX = Math.max(0, Math.min(localX / this.minimap.size, 1)); 
            const pctY = Math.max(0, Math.min(localY / this.minimap.size, 1));
            this.camera.x = (pctX * this.world.width) - (this.canvas.width / 2); 
            this.camera.y = (pctY * this.world.height) - (this.canvas.height / 2);
        };
        
        const checkMinimapClick = (clientX, clientY) => {
            const mmX = game.canvas.width - game.minimap.size - game.minimap.padding; 
            const mmY = game.canvas.height - game.minimap.size - game.minimap.padding - game.minimap.offsetY; 
            if (clientX >= mmX && clientX <= mmX + game.minimap.size && clientY >= mmY && clientY <= mmY + game.minimap.size) {
                game.isMinimapDragging = true; 
                game.moveCameraFromMinimap(clientX - mmX, clientY - mmY);
            }
        };

        const checkMinimapMove = (clientX, clientY) => {
            if (game.isMinimapDragging) {
                const mmX = game.canvas.width - game.minimap.size - game.minimap.padding; 
                const mmY = game.canvas.height - game.minimap.size - game.minimap.padding - game.minimap.offsetY;
                game.moveCameraFromMinimap(clientX - mmX, clientY - mmY);
            }
        };

        game.canvas.addEventListener('mousedown', e => { if (e.button === 0) checkMinimapClick(e.clientX, e.clientY); });
        window.addEventListener('mousemove', e => checkMinimapMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', e => { if (e.button === 0) game.isMinimapDragging = false; });
        
        game.canvas.addEventListener('touchstart', e => { if(e.touches.length===1) checkMinimapClick(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        window.addEventListener('touchmove', e => { if(e.touches.length===1) checkMinimapMove(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        window.addEventListener('touchend', e => { game.isMinimapDragging = false; });
    },
    patch: (game) => {
        game.bus.on('uiDraw', (ctx) => {
            if(game.gameState !== 'playing') return;
            const size = game.minimap.size; const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - game.minimap.offsetY; 
            
            ctx.fillStyle = 'rgba(20, 10, 5, 0.8)'; ctx.fillRect(startX, startY, size, size);
            
            const scaleX = size / game.world.width; const scaleY = size / game.world.height;
            
            if (game.mapGrid) {
                ctx.fillStyle = 'rgba(26, 78, 110, 0.7)';
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
                    const tX = Math.floor(ent.x / game.tileSize); const tY = Math.floor(ent.y / game.tileSize);
                    const tile = game.mapGrid[tY] && game.mapGrid[tY][tX];
                    if (tile) {
                        if (hideIfUndiscovered && !tile.discovered) return;
                        if (hideIfInvisible && !tile.visible && ent.team !== 'black') return; 
                    }
                }
                ctx.fillStyle = color; ctx.fillRect(startX + (ent.x * scaleX) - r, startY + (ent.y * scaleY) - r, r*2, r*2); 
            };

            game.resourceNodes.forEach(r => drawDot(r, r.type === 'pumpkin' ? '#ff7b00' : '#00aaff', 1.5, false, true));
            game.structures.forEach(s => drawDot(s, s.team === 'black' ? '#ffffff' : '#ff4444', 3, true, false));
            game.spiders.forEach(s => drawDot(s, s.team === 'black' ? '#aaaaaa' : '#aa0000', 1, true, false));
            game.critters.forEach(c => drawDot(c, c.color || 'gold', 2, true, false));
            game.bosses.forEach(b => drawDot(b, '#00ff00', 4, true, false)); 
            game.queens.forEach(q => { drawDot(q, q.team === 'black' ? '#ffffff' : '#ff4444', 4, true, false); });

            if (game.fowCanvas) {
                ctx.save();
                ctx.filter = 'blur(4px)'; 
                ctx.drawImage(game.fowCanvas, startX, startY, size, size);
                ctx.restore();
            }
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1; 
            ctx.strokeRect(startX + (game.camera.x * scaleX), startY + (game.camera.y * scaleY), game.canvas.width * scaleX, game.canvas.height * scaleY);
            ctx.strokeStyle = '#ff9d00'; ctx.lineWidth = 2; ctx.strokeRect(startX, startY, size, size);
        });
    }
};

export const ContextUIExpansion = {
    init: (game) => {
        const style = document.createElement('style');
        style.innerHTML = `
            #rtsUI {
                position: fixed; bottom: 0; left: 0; width: 100%; height: 140px;
                background: linear-gradient(180deg, #1a1005 0%, #0a0500 100%);
                border-top: 3px solid #ff9d00; display: flex; box-sizing: border-box;
                font-family: 'Courier New', monospace; color: white; z-index: 2000;
                box-shadow: 0 -5px 20px rgba(0,0,0,0.8); user-select: none;
            }
            #ui-portrait-container {
                width: 140px; height: 100%; border-right: 2px solid #553311;
                display: flex; align-items: center; justify-content: center; background: #000;
            }
            #ui-portrait { width: 90%; height: 90%; object-fit: contain; image-rendering: pixelated; }
            #ui-info {
                width: 200px; padding: 15px; border-right: 2px solid #553311;
                display: flex; flex-direction: column; justify-content: flex-start;
            }
            #ui-info h2 { margin: 0 0 10px 0; font-size: 16px; color: #ff9d00; text-transform: uppercase;}
            .ui-stat { font-size: 14px; color: #ccc; margin-bottom: 5px; }
            #ui-hp-bar-bg { width: 100%; height: 10px; background: #333; margin-top: 5px; border: 1px solid #000; }
            #ui-hp-bar-fill { width: 100%; height: 100%; background: #00ff00; transition: 0.2s width; }
            
            #ui-actions {
                flex-grow: 1; padding: 10px; display: flex; flex-wrap: wrap; 
                gap: 10px; align-content: flex-start; overflow-y: auto;
            }
            .cmd-btn {
                width: 80px; height: 55px; background: #221100; border: 2px solid #ff9d00;
                border-radius: 4px; color: white; display: flex; flex-direction: column;
                align-items: center; justify-content: center; cursor: pointer; transition: 0.1s;
            }
            .cmd-btn:hover { background: #442200; transform: scale(1.05); }
            .cmd-btn:active { transform: scale(0.95); }
            .cmd-btn.active-tool { background: #ff9d00; color: #000; font-weight: bold; }
            .cmd-icon { font-size: 20px; }
            .cmd-text { font-size: 10px; margin-top: 2px; }
            .cmd-cost { font-size: 10px; color: #ff5555; }
        `;
        document.head.appendChild(style);

        const uiBase = document.createElement('div');
        uiBase.id = 'rtsUI';
        uiBase.innerHTML = `
            <div id="ui-portrait-container"><img id="ui-portrait" src=""></div>
            <div id="ui-info">
                <h2 id="ui-name">Hive Mind</h2>
                <div id="ui-stats-container"></div>
            </div>
            <div id="ui-actions"></div>
        `;
        document.body.appendChild(uiBase);

        game.uiActions = {
            'nest':   { icon: '🕸️', name: 'Nest', cost: '150🎃', type: 'tool', val: 'nest' },
            'eggsac': { icon: '🥚', name: 'Sac', cost: '50🎃', type: 'tool', val: 'eggsac' },
            'pylon':  { icon: '🗼', name: 'Pylon', cost: '25🎃', type: 'tool', val: 'pylon' },
            'turret': { icon: '🔫', name: 'Turret', cost: '100🎃', type: 'tool', val: 'turret' },
            'wall':   { icon: '🧱', name: 'Wall', cost: '25🎃', type: 'tool', val: 'wall' },
            'strike': { icon: '☠️', name: 'Strike', cost: '50💧', type: 'tool', val: 'venomStrike' },
            'trap':   { icon: '🕸️', name: 'Trap', cost: '25💧', type: 'tool', val: 'silkTrap' },
            'harv':   { icon: '🕷️', name: 'Harvester', cost: '10🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'harvester'}) },
            'sold':   { icon: '🐜', name: 'Soldier', cost: '25🎃', type: 'instant', fn: (t) => game.bus.emit('spawnSpider', {x:t.x, y:t.y, team:'black', role:'soldier'}) },
            'tech':   { icon: '🧬', name: 'Evolve', cost: '250🎃', type: 'instant', fn: (t) => { if(game.eco.black.pumpkins>=250){ game.eco.black.pumpkins-=250; game.techLevel.black++; game.bus.emit('playSound','spell');} } },
            'cancel': { icon: '🛑', name: 'Stop', cost: '', type: 'instant', fn: () => { 
                game.activeTool = 'select'; 
                game.bus.emit('toolChanged', 'select');
                if (game.selectedUnits) {
                    game.selectedUnits.forEach(u => { 
                        u.commandTarget = null; 
                        u.buildTarget = null;   
                        if (u.activeConstruction) {
                            u.activeConstruction.isPaused = true;
                            u.activeConstruction = null;
                        }
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
        document.getElementById('rtsUI').addEventListener('mousedown', (e) => e.stopPropagation());
        document.getElementById('rtsUI').addEventListener('touchstart', (e) => e.stopPropagation(), {passive: false});

        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this);

            if(this.selectedUnits) this.selectedUnits = this.selectedUnits.filter(u => u.hp > 0);

            let currentSelection = null;
            if (this.selectedUnits && this.selectedUnits.length > 0) {
                currentSelection = this.selectedUnits.length === 1 ? this.selectedUnits[0] : 'swarm_group';
            } else if (this.selectedStructure) {
                currentSelection = this.selectedStructure;
            }

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
                    nameEl.innerText = `Swarm Group (${this.selectedUnits.length})`;
                    addButton('auto'); addButton('cancel');
                }
                else if (this.selectedUnits && this.selectedUnits.length === 1) {
                    let unit = this.selectedUnits[0];
                    portrait.src = unit.sprite.src || '';
                    if (unit instanceof Queen) {
                        nameEl.innerText = "Swarm Queen";
                        addButton('nest'); addButton('eggsac'); addButton('pylon'); 
                        addButton('turret'); addButton('wall'); addButton('cancel');
                    } else {
                        nameEl.innerText = unit.role === 'soldier' ? "Soldier" : "Harvester";
                        addButton('auto'); addButton('cancel');
                    }
                }
                else if (this.selectedStructure) {
                    portrait.src = this.selectedStructure.sprite.src || '';
                    nameEl.innerText = this.selectedStructure.type === 'nest' ? `Main Nest (Lv ${this.techLevel.black})` : this.selectedStructure.type.toUpperCase();
                    if (this.selectedStructure.type === 'nest' && this.selectedStructure.team === 'black') {
                        addButton('harv'); addButton('sold'); addButton('tech');
                    }
                } 
                else {
                    portrait.src = 'assets/nest_black.png'; 
                    nameEl.innerText = "Hive Mind";
                    addButton('strike'); addButton('trap'); addButton('cancel');
                }
            }

            const statsContainer = document.getElementById('ui-stats-container');
            if (currentSelection && currentSelection.hp !== undefined) {
                let max = currentSelection.maxHp;
                if (currentSelection.team === 'black' && !(currentSelection instanceof Queen)) max += (this.techLevel.black * 20);
                
                let pct = Math.max(0, currentSelection.hp / max) * 100;
                
                let extraStats = '';
                if (currentSelection.cargo && currentSelection.cargo.amount > 0) extraStats = `<div class="ui-stat">Cargo: ${currentSelection.cargo.amount} ${currentSelection.cargo.type}</div>`;
                if (currentSelection.damage) extraStats += `<div class="ui-stat">DMG: ${currentSelection.damage + (this.techLevel[currentSelection.team] * 5 || 0)}</div>`;

                const newHTML = `<div class="ui-stat">HP: ${Math.ceil(currentSelection.hp)} / ${max}</div><div id="ui-hp-bar-bg"><div id="ui-hp-bar-fill" style="width: ${pct}%; background: ${pct > 50 ? '#00ff00' : (pct > 25 ? '#ffff00' : '#ff0000')}"></div></div>${extraStats}`;
                if (statsContainer.innerHTML !== newHTML) statsContainer.innerHTML = newHTML;
                
            } else {
                const defaultMsg = `<div class="ui-stat">Select a unit or building to command the swarm.</div>`;
                if (statsContainer.innerHTML !== defaultMsg) statsContainer.innerHTML = defaultMsg;
            }

            document.querySelectorAll('.cmd-btn').forEach(b => {
                if (b.getAttribute('data-tool') === this.activeTool) b.classList.add('active-tool');
                else b.classList.remove('active-tool');
            });
        });
    }
};

export const GameLoopExpansion = {
    patch: (game) => {
        const style = document.createElement('style');
        style.innerHTML = `
            #gameOverModal {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(10, 5, 0, 0.95); border: 4px solid; border-radius: 12px;
                padding: 40px; color: white; font-family: 'Courier New', monospace; text-align: center;
                display: none; z-index: 9999; box-shadow: 0 0 50px rgba(0,0,0,1);
            }
            #gameOverModal h1 { font-size: 40px; margin: 0 0 20px 0; }
            .restart-btn { background: #fff; color: #000; padding: 15px 30px; font-size: 20px; font-weight: bold; border: none; cursor: pointer; border-radius: 8px; margin-top: 20px; transition: 0.2s;}
            .restart-btn:hover { background: #ff9d00; transform: scale(1.05); }
        `;
        document.head.appendChild(style);
        const goModal = document.createElement('div'); goModal.id = 'gameOverModal'; document.body.appendChild(goModal);

        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this); 
            if (this.queens.length > 0 && this.gameState === 'playing') {
                const blackQueen = this.queens.find(q => q.team === 'black'); const redQueen = this.queens.find(q => q.team === 'red');
                if (!blackQueen || blackQueen.hp <= 0) { 
                    this.gameState = 'lose'; 
                    const ui = document.getElementById('rtsUI'); if (ui) ui.style.display = 'none'; 
                    goModal.style.borderColor = '#ff0000';
                    goModal.innerHTML = `<h1 style="color:#ff0000;">DEFEAT</h1><p>Your Queen has fallen to the Red Swarm.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                    goModal.style.display = 'block';
                } 
                else if (!redQueen || redQueen.hp <= 0) { 
                    this.gameState = 'win'; 
                    const ui = document.getElementById('rtsUI'); if (ui) ui.style.display = 'none'; 
                    goModal.style.borderColor = '#00ff00';
                    goModal.innerHTML = `<h1 style="color:#00ff00;">VICTORY</h1><p>The Pumpkin Patch belongs to the Black Swarm.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                    goModal.style.display = 'block';
                }
            }
        });

        game.bus.on('uiDraw', (ctx) => {
            if (game.gameState === 'playing') return;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
        });
    }
};