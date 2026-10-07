// expansions/Controls.js
import { MathUtils, Spider, Structure } from '../game.js';
import { Queen } from './Queen.js';

// ==========================================
// 1. CONFIGURATION & TUNING
// ==========================================
const CONTROLS_CONFIG = {
    doubleClickMs: 300,        // Max time between clicks to trigger "Select All of Type"
    dragBoxThresholdSq: 100,   // Minimum pixels dragged to count as a box vs a single click
    clickHitboxPadding: 15,    // Extra pixels around a unit to make it easier to click on mobile
    
    buildRangeSq: 4900,        // 70px squared - How close Queen must be to build
    buildResumeRangeSq: 3600,  // 60px squared - How close Queen must be to auto-resume paused building
    buildSpeed: 0.001,         // Takes ~1000 ticks (30s) to build
    autoResumeDelay: 45        // 1.5 seconds of idling before auto-resuming a paused building
};

// ==========================================
// 2. ADVANCED UNIT CONTROL EXPANSION
// ==========================================
export const AdvancedUnitControlExpansion = {
    init: (game) => {
        game.selectedUnits = []; 
        game.dragBox = null;
        game.controlGroups = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[] };

        let lastClickTime = 0;
        let lastClickedUnit = null;

        // 1. Keyboard Shortcuts (Control Groups & Cancel)
        window.addEventListener('keydown', e => { 
            const key = e.key.toLowerCase();
            
            if (key === 'escape') { 
                game.selectedUnits = []; 
                game.selectedStructure = null; 
                game.activeTool = 'select';
                game.bus.emit('toolChanged', 'select');
            } 
            
            if (['1','2','3','4','5','6','7','8','9'].includes(key)) {
                if (game.activeTool === 'select') {
                    if (e.ctrlKey) {
                        // Assign Control Group (Shallow copy array)
                        game.controlGroups[key] = [...game.selectedUnits];
                        game.bus.emit('playSound', 'spell');
                    } else {
                        // Recall Control Group
                        // PERFORMANCE FIX: Native loop instead of .filter to purge dead units
                        let aliveGroup = [];
                        for (let i = 0; i < game.controlGroups[key].length; i++) {
                            if (game.controlGroups[key][i].hp > 0) aliveGroup.push(game.controlGroups[key][i]);
                        }
                        game.controlGroups[key] = aliveGroup;
                        
                        if (aliveGroup.length > 0) {
                            game.selectedUnits = [...aliveGroup];
                            game.selectedStructure = null;
                            game.bus.emit('playSound', 'harvest');
                            
                            // Center camera on the group leader
                            let centerU = aliveGroup[0];
                            game.camera.x = MathUtils.clamp(centerU.x - (game.canvas.width / 2), 0, game.world.width - game.canvas.width);
                            game.camera.y = MathUtils.clamp(centerU.y - (game.canvas.height / 2), 0, game.world.height - game.canvas.height);
                        }
                    }
                }
            }
        });

        // 2. Drag Selection Box Logic
        let startX, startY, isDraggingBox = false;
        let ticking = false; // Used for requestAnimationFrame throttling
        
        game.canvas.addEventListener('mousedown', e => {
            startX = e.clientX; startY = e.clientY;
            
            // Record the tool state the exact moment the click starts
            game.toolAtClickStart = game.activeTool; 

            if (e.button === 0 && e.shiftKey) { 
                isDraggingBox = true;
                game.dragBox = { x: startX, y: startY, w: 0, h: 0 };
            }
        });
        
        // Throttled mousemove for buttery smooth selection boxes
        window.addEventListener('mousemove', e => {
            if (isDraggingBox && game.dragBox && !ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    game.dragBox.w = e.clientX - startX;
                    game.dragBox.h = e.clientY - startY;
                    ticking = false;
                });
            }
        });

        // 3. RTS Master Interaction Handler (Handles Left/Right clicks & Touch)
        const handleRTSClick = (e, clientX, clientY, targetElem, isTouch = false) => {
            const wasDraggingBox = isDraggingBox;
            isDraggingBox = false;
            
            // If the user was placing a building or casting a spell, safely ignore this click 
            // so we don't accidentally deselect their Queen/Hive!
            if (game.toolAtClickStart !== 'select') {
                game.dragBox = null;
                return;
            }

            // Prevent interaction if clicking on UI elements
            if (targetElem && targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#rtsUI') || targetElem.closest('#preGameUI'))) {
                game.dragBox = null; return;
            }

            const worldX = clientX + game.camera.x; 
            const worldY = clientY + game.camera.y;
            const isRightClick = e.button === 2;
            const isLeftClick = e.button === 0 || isTouch;

            let isMoveCommand = isRightClick;
            let clickedUnit = null; 
            let clickedStruct = null;
            
            // Identify what was clicked (unless we just finished a large drag-box selection)
            if (!wasDraggingBox || (game.dragBox && MathUtils.distSq(0,0, game.dragBox.w, game.dragBox.h) <= CONTROLS_CONFIG.dragBoxThresholdSq)) {
                
                // PERFORMANCE FIX: Loop through game.entities directly to prevent `.concat()` array allocation GC lag
                for (let i = 0; i < game.entities.length; i++) {
                    let u = game.entities[i];
                    
                    if (u.team === 'black' && u.hp > 0) {
                        // Check Units (Spiders/Queens)
                        if (u.role || u instanceof Queen) {
                            const clickRadius = u.size + CONTROLS_CONFIG.clickHitboxPadding;
                            // Fast AABB check before MathUtils.distSq
                            if (Math.abs(u.x - worldX) > clickRadius || Math.abs(u.y - worldY) > clickRadius) continue;
                            
                            if (MathUtils.distSq(u.x, u.y, worldX, worldY) < (clickRadius * clickRadius)) { 
                                clickedUnit = u; break; 
                            }
                        }
                        // Check Structures
                        else if (u instanceof Structure) {
                            if (Math.abs(u.x - worldX) > u.size || Math.abs(u.y - worldY) > u.size) continue;
                            if (MathUtils.distSq(u.x, u.y, worldX, worldY) < (u.size * u.size)) { 
                                clickedStruct = u; break; 
                            }
                        }
                    }
                }
            }

            // On mobile, tapping the ground while units are selected counts as a move command
            if (isTouch && game.selectedUnits.length > 0 && !clickedUnit && !clickedStruct) {
                isMoveCommand = true;
            }

            // EXECUTE COMMAND: Move Units
            if (isMoveCommand && game.selectedUnits.length > 0) {
                let validCount = 0;
                for (let i = 0; i < game.selectedUnits.length; i++) {
                    if (game.selectedUnits[i].team === 'black' && game.selectedUnits[i].hp > 0) validCount++;
                }
                
                if (validCount > 0) {
                    game.bus.emit('particles', {x: worldX, y: worldY, color: '#ffffff', count: 12});
                    
                    // JUICE: Crisp ping sound for issuing a command!
                    game.bus.emit('playSound', 'ping');
                    
                    for (let i = 0; i < game.selectedUnits.length; i++) {
                        let u = game.selectedUnits[i];
                        if (u.team === 'black' && u.hp > 0) {
                            u.commandTarget = { x: worldX, y: worldY }; 
                            u.isManual = true; 
                        }
                    }
                }
            } 
            // EXECUTE COMMAND: Select Units/Buildings
            else if (isLeftClick && !isMoveCommand) {
                
                // Finish Drag Selection
                if (wasDraggingBox && game.dragBox && MathUtils.distSq(0,0, game.dragBox.w, game.dragBox.h) > CONTROLS_CONFIG.dragBoxThresholdSq) {
                    let x1 = Math.min(startX, startX + game.dragBox.w) + game.camera.x;
                    let x2 = Math.max(startX, startX + game.dragBox.w) + game.camera.x;
                    let y1 = Math.min(startY, startY + game.dragBox.h) + game.camera.y;
                    let y2 = Math.max(startY, startY + game.dragBox.h) + game.camera.y;
                    
                    game.selectedUnits = [];
                    // PERFORMANCE FIX: Loop game.entities instead of multiple filter/concat allocations
                    for (let i = 0; i < game.entities.length; i++) {
                        let u = game.entities[i];
                        if (u.team === 'black' && u.hp > 0 && (u.role || u instanceof Queen)) {
                            if (u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2) {
                                game.selectedUnits.push(u);
                            }
                        }
                    }
                    game.selectedStructure = null;
                    if (game.selectedUnits.length > 0) game.bus.emit('playSound', 'harvest');
                } 
                // Single Click Selection
                else {
                    // Prevent micro-drags from clearing selection accidentally
                    if (MathUtils.distSq(startX, startY, clientX, clientY) > 144) {
                        game.dragBox = null; return;
                    }

                    if (clickedUnit) {
                        const now = Date.now();
                        
                        // RTS POLISH: Double-Click to select all units of the same type!
                        if (now - lastClickTime < CONTROLS_CONFIG.doubleClickMs && lastClickedUnit === clickedUnit) {
                            
                            const viewL = game.camera.x; const viewR = game.camera.x + game.canvas.width;
                            const viewT = game.camera.y; const viewB = game.camera.y + game.canvas.height;
                            
                            game.selectedUnits = [];
                            for (let i = 0; i < game.entities.length; i++) {
                                let u = game.entities[i];
                                if (u.team === 'black' && u.hp > 0 && u.role === clickedUnit.role) {
                                    // Only select units currently visible on screen
                                    if (u.x >= viewL && u.x <= viewR && u.y >= viewT && u.y <= viewB) {
                                        game.selectedUnits.push(u);
                                    }
                                }
                            }
                            game.bus.emit('playSound', 'spell');
                        } 
                        // Standard Shift-Click or Single Click
                        else {
                            if (e.shiftKey) {
                                if (!game.selectedUnits.includes(clickedUnit)) game.selectedUnits.push(clickedUnit);
                            } else {
                                game.selectedUnits = [clickedUnit];
                            }
                            game.bus.emit('playSound', 'harvest');
                        }
                        
                        lastClickTime = now;
                        lastClickedUnit = clickedUnit;
                        game.selectedStructure = null;
                        
                    } else if (clickedStruct) {
                        game.selectedStructure = clickedStruct;
                        game.selectedUnits = [];
                    } else {
                        // Clicked bare dirt, clear selection
                        game.selectedUnits = [];
                        game.selectedStructure = null;
                    }
                }
            }
            game.dragBox = null; 
        };

        window.addEventListener('mouseup', e => handleRTSClick(e, e.clientX, e.clientY, e.target, false));
        
        // Touch events explicitly verify 1 finger to prevent pinch-zoom commands from firing moves
        game.canvas.addEventListener('touchstart', e => { 
            if(e.touches.length === 1) { 
                startX = e.touches[0].clientX; 
                startY = e.touches[0].clientY; 
                
                // Record for mobile touches too!
                game.toolAtClickStart = game.activeTool; 
            }
        }, {passive: false});
    },

    patch: (game) => {
        // --- Prevent Memory Leaks in Control Groups ---
        // Periodically sweeps control groups to remove dead units, allowing the JS Garbage Collector to free their RAM.
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            
            // Run the sweep once every 60 frames (1 second)
            if (this.gameState === 'playing' && this.tick % 60 === 0 && this.controlGroups) {
                for (let i = 1; i <= 9; i++) {
                    if (this.controlGroups[i] && this.controlGroups[i].length > 0) {
                        let aliveGroup = [];
                        for (let k = 0; k < this.controlGroups[i].length; k++) {
                            if (this.controlGroups[i][k].hp > 0) aliveGroup.push(this.controlGroups[i][k]);
                        }
                        this.controlGroups[i] = aliveGroup;
                    }
                }
            }
        });

        // Render UI layer (Drag selection box & Unit Highlights)
        game.bus.on('uiDraw', (ctx) => {
            if (!game.selectedUnits) return;
            
            // Optimize by precalculating the dash offset once per frame
            const dashOffset = -game.tick * 0.5;
            
            for (let i = 0; i < game.selectedUnits.length; i++) {
                let u = game.selectedUnits[i];
                if (u.hp > 0) {
                    ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2; 
                    ctx.setLineDash([4, 4]); ctx.lineDashOffset = dashOffset;
                    ctx.beginPath(); ctx.arc(u.x, u.y, u.size + 8, 0, MathUtils.TWO_PI); ctx.stroke(); 
                }
            }
            ctx.setLineDash([]);
        });

        // Custom Queen rotation handling (Smoothing her turns!)
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            const prevAngle = this.angle || 0;
            original.call(this, gameObj);
            if (this.commandTarget) {
                let targetAngle = Math.atan2(this.commandTarget.y - this.y, this.commandTarget.x - this.x);
                let diff = targetAngle - prevAngle;
                while (diff > Math.PI) diff -= MathUtils.TWO_PI; 
                while (diff < -Math.PI) diff += MathUtils.TWO_PI;
                this.angle = prevAngle + (diff * 0.10);
            }
        });
        
        game.expansions.patchClass(Queen, 'draw', function(original, ctx) {
            // Offset sprite drawing angle by 90 degrees if the sprite isn't facing perfectly right
            const tempAngle = this.angle; this.angle -= (Math.PI / 2); original.call(this, ctx); this.angle = tempAngle;
        });
    }
};

// ==========================================
// 3. CONSTRUCTION LOGIC & DUAL-COST SUPPORT
// ==========================================
export const ConstructionExpansion = {
    init: (game) => {
        game.bus.listeners['buildStructure'] = []; // Clear base game listener
        
        game.bus.on('buildStructure', (data) => {
            
            // Find Queen safely without generating array garbage
            let queen = null;
            const queens = game.queens; // Cache
            for (let i = 0; i < queens.length; i++) {
                if (queens[i].team === data.team) { queen = queens[i]; break; }
            }
            if (!queen) return; 
            
            // --- FIX 2: RESTORE TERRITORY & OVERLAP CHECK ---
            // Ensure the player is only building inside their own Web Network AND not stacking!
            if (data.team === 'black') {
                let hasBase = false;
                let isOverlapping = false;
                const structs = game.structures; // Cache
                
                for (let i = 0; i < structs.length; i++) {
                    let s = structs[i];
                    if (s.team === 'black') hasBase = true;
                    
                    // Prevent Stacking: Check if the new click is too close to an existing building
                    // We use (size * 2) squared for a generous, safe bounding box
                    if (MathUtils.distSq(s.x, s.y, data.x, data.y) < (s.size * 2) * (s.size * 2)) {
                        isOverlapping = true;
                        break; // Stop checking, we already know it's an illegal spot
                    }
                }
                
                if (isOverlapping || (hasBase && !game.checkTerritory(data.x, data.y, data.team))) {
                    // Flash red particles to indicate invalid placement
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
                    game.bus.emit('playSound', 'error'); // JUICE: Rejection sound!
                    return; 
                }
            }

            const costs = { 
                'nest': {p: 150, d: 0}, 'eggsac': {p: 50, d: 0}, 'pylon': {p: 25, d: 0}, 
                'turret': {p: 100, d: 0}, 'wall': {p: 25, d: 0}, 'extractor': {p: 100, d: 0},
                'mortar': {p: 200, d: 50}, 'shrine': {p: 150, d: 100}, 'monolith': {p: 150, d: 50},
                'obelisk': {p: 150, d: 80}, 'incubator': {p: 200, d: 0}, 'maw': {p: 150, d: 0}
            };
            let cost = costs[data.type];
            
            // Verify player can afford it
            if (!cost || game.eco[data.team].pumpkins < cost.p || game.eco[data.team].dew < cost.d) {
                game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
                game.bus.emit('playSound', 'error'); // JUICE: Rejection sound!
                return; 
            }

            // Cancel current task
            if (queen.activeConstruction) {
                queen.activeConstruction.isPaused = true;
                queen.activeConstruction = null;
            }

            queen.buildTarget = { x: data.x, y: data.y, type: data.type, cost: cost };
            queen.commandTarget = { x: data.x, y: data.y }; 
            game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff9d00', count: 10});
            game.bus.emit('playSound', 'ping'); // JUICE: Confirmation ping
        });
    },

    patch: (game) => {
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            
            // 1. Actively Constructing
            if (this.activeConstruction) {
                if (this.activeConstruction.hp <= 0) {
                    this.activeConstruction = null; // Target destroyed
                }
                else if (this.commandTarget) {
                    this.activeConstruction.isPaused = true;
                    this.activeConstruction = null; // Ordered to move away
                } 
                else if (MathUtils.distSq(this.activeConstruction.x, this.activeConstruction.y, this.x, this.y) <= CONTROLS_CONFIG.buildRangeSq) { 
                    
                    this.activeConstruction.buildProgress += CONTROLS_CONFIG.buildSpeed;
                    this.activeConstruction.isPaused = false;
                    
                    if (gameObj.tick % 15 === 0) gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#ff9d00', count: 2});
                    
                    if (this.activeConstruction.buildProgress >= 1) {
                        this.activeConstruction.isConstructing = false;
                        this.activeConstruction.buildProgress = 1;
                        this.activeConstruction.territory = this.activeConstruction.originalTerritory; 
                        
                        gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#ffffff', count: 40});
                        gameObj.bus.emit('playSound', 'build'); // Building finished thud!
                        this.activeConstruction = null;
                    }
                    return; 
                } else {
                    this.activeConstruction.isPaused = true;
                    this.activeConstruction = null; // Drifted out of range
                }
            }

            original.call(this, gameObj); // Run normal AI

            // 2. Navigating to lay foundation
            if (this.buildTarget) {
                if (this.commandTarget) {
                    const destDistSq = MathUtils.distSq(this.commandTarget.x, this.commandTarget.y, this.buildTarget.x, this.buildTarget.y);
                    if (destDistSq > 100) this.buildTarget = null; // Abandoned target
                }
                
                if (this.buildTarget) {
                    const distSq = MathUtils.distSq(this.buildTarget.x, this.buildTarget.y, this.x, this.y);
                    if (distSq < CONTROLS_CONFIG.buildResumeRangeSq) { // Reached destination
                        
                        // Deduct Dual Resources
                        if (gameObj.eco[this.team].pumpkins >= this.buildTarget.cost.p && gameObj.eco[this.team].dew >= this.buildTarget.cost.d) {
                            gameObj.eco[this.team].pumpkins -= this.buildTarget.cost.p;
                            gameObj.eco[this.team].dew -= this.buildTarget.cost.d;
                            
                            let s = new Structure(this.buildTarget.x, this.buildTarget.y, this.team, this.buildTarget.type);
                            s.isConstructing = true;
                            s.isPaused = false;
                            s.buildProgress = 0;
                            s.originalTerritory = s.territory;
                            s.territory = 0; // No territory control until finished building!
                            
                            gameObj.addEntity(s);
                            this.activeConstruction = s; 
                        }
                        this.buildTarget = null;
                        this.commandTarget = null; 
                    }
                }
            }

            // 3. Auto-resume nearby paused construction ONLY if idle
            if (!this.activeConstruction && !this.commandTarget && !this.buildTarget) {
                this.idleBuildTimer = (this.idleBuildTimer || 0) + 1;
                
                if (this.idleBuildTimer > CONTROLS_CONFIG.autoResumeDelay) {
                    let unfinished = null;
                    const structs = gameObj.structures; // Cache
                    for (let i = 0; i < structs.length; i++) {
                        let s = structs[i];
                        if (s.isConstructing && s.team === this.team && MathUtils.distSq(s.x, s.y, this.x, this.y) < CONTROLS_CONFIG.buildResumeRangeSq) {
                            unfinished = s; break;
                        }
                    }
                    
                    if (unfinished) {
                        this.activeConstruction = unfinished; 
                        this.idleBuildTimer = 0; 
                    }
                }
            } else {
                this.idleBuildTimer = 0; 
            }
        });

        // Structures stop functioning while under construction
        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            if (this.isConstructing) return; 
            original.call(this, gameObj);
        });

        // Custom Construction Overlay Drawing
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            if (this.isConstructing) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                // Pulsing animation unless paused
                const pulse = this.isPaused ? 0 : Math.sin(game.tick * 0.1) * 2;
                
                // Base
                ctx.fillStyle = '#221100';
                ctx.beginPath(); ctx.arc(0, 0, (this.size * 0.7) + pulse, 0, MathUtils.TWO_PI); ctx.fill();
                
                // Magic construction ring
                ctx.strokeStyle = this.isPaused ? '#885500' : '#ff9d00';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.lineDashOffset = this.isPaused ? 0 : -game.tick * 0.5;
                ctx.beginPath(); ctx.arc(0, 0, this.size * 0.8, 0, MathUtils.TWO_PI); ctx.stroke();
                
                // Build Progress Bar
                const w = this.size * 1.5;
                ctx.fillStyle = 'black'; ctx.fillRect(-w/2, -this.size - 15, w, 6);
                ctx.fillStyle = this.isPaused ? '#ff5500' : '#00aaff'; 
                ctx.fillRect(-w/2, -this.size - 14, w * this.buildProgress, 4);
                
                ctx.restore();
            } else {
                original.call(this, ctx); 
            }
        });
    }
};
