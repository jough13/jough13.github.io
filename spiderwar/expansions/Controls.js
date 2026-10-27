// expansions/Controls.js
import { MathUtils, Spider, Structure } from '../game.js';
import { Queen } from './Queen.js';

// ==========================================
// 1. CONFIGURATION & TUNING
// ==========================================
// 🔌 [EXPANDABILITY] Exported so other mods can tweak control feel
export const CONTROLS_CONFIG = {
    doubleClickMs: 300,        // Max time between clicks to trigger "Select All of Type"
    dragBoxThresholdSq: 100,   // Minimum pixels dragged to count as a box vs a single click
    clickHitboxPadding: 15,    // Extra pixels around a unit to make it easier to click on mobile
    
    buildRangeSq: 4900,        // 70px squared - How close Queen must be to build
    buildResumeRangeSq: 3600,  // 60px squared - How close Queen must be to auto-resume paused building
    buildSpeed: 0.001,         // Takes ~1000 ticks (30s) to build
    autoResumeDelay: 45        // 1.5 seconds of idling before auto-resuming a paused building
};

// 🔌 [EXPANDABILITY] Centralized costs so AI and Player use the same exact economy rules
export const BUILD_COSTS = { 
    'nest': {p: 150, d: 0}, 'eggsac': {p: 50, d: 0}, 'pylon': {p: 25, d: 0}, 
    'turret': {p: 100, d: 0}, 'wall': {p: 25, d: 0}, 'extractor': {p: 100, d: 0},
    'mortar': {p: 200, d: 50}, 'shrine': {p: 150, d: 100}, 'monolith': {p: 150, d: 50},
    'obelisk': {p: 150, d: 80}, 'incubator': {p: 200, d: 0}, 'maw': {p: 150, d: 0}
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
            // 🛡️ [LOGIC FIX] Block keyboard commands if the game is over or paused
            if (game.gameState !== 'playing' || game.freezeFrames > 0) return;

            const key = e.key.toLowerCase();
            
            if (key === 'escape') { 
                game.selectedUnits = []; 
                game.selectedStructure = null; 
                game.activeTool = 'select';
                game.bus.emit('toolChanged', 'select');
                game.bus.emit('selectionChanged'); // [EXPANDABILITY] Let UI know selection cleared
            } 
            
            if (['1','2','3','4','5','6','7','8','9'].includes(key)) {
                if (game.activeTool === 'select') {
                    if (e.ctrlKey) {
                        // Assign Control Group (Shallow copy array)
                        game.controlGroups[key] = [...game.selectedUnits];
                        game.bus.emit('playSound', 'spell');
                    } else {
                        // Recall Control Group
                        // 🚀 [PERFORMANCE] Native loop instead of .filter to purge dead units
                        let aliveGroup = [];
                        const grp = game.controlGroups[key];
                        const grpLen = grp.length;
                        for (let i = 0; i < grpLen; i++) {
                            if (grp[i].hp > 0) aliveGroup.push(grp[i]);
                        }
                        game.controlGroups[key] = aliveGroup;
                        
                        if (aliveGroup.length > 0) {
                            game.selectedUnits = [...aliveGroup];
                            game.selectedStructure = null;
                            game.bus.emit('playSound', 'harvest');
                            game.bus.emit('selectionChanged');
                            
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
        
        // 🛡️ [FIX] Helper to standardize local coordinates matching game.js!
        const getLocalPos = (cx, cy) => {
            const rect = game.canvas.getBoundingClientRect();
            return { x: cx - rect.left, y: cy - rect.top };
        };

        game.canvas.addEventListener('mousedown', e => {
            // 🛡️ [LOGIC FIX] Block drag box if the game is over or paused
            if (game.gameState !== 'playing' || game.freezeFrames > 0) return;

            const pos = getLocalPos(e.clientX, e.clientY);
            startX = pos.x; startY = pos.y;
            
            // Record the tool state the exact moment the click starts
            game.toolAtClickStart = game.activeTool; 

            if (e.button === 0 && e.shiftKey) { 
                isDraggingBox = true;
                game.dragBox = { x: startX, y: startY, w: 0, h: 0 };
            }
        });
        
        // [FIX] Synchronous mousemove prevents fatal async race conditions with mouseup!
        window.addEventListener('mousemove', e => {
            if (isDraggingBox && game.dragBox) {
                const pos = getLocalPos(e.clientX, e.clientY);
                game.dragBox.w = pos.x - startX;
                game.dragBox.h = pos.y - startY;
            }
        });

        // 3. RTS Master Interaction Handler (Handles Left/Right clicks & Touch)
        const handleRTSClick = (e, clientX, clientY, targetElem, isTouch = false) => {
            const wasDraggingBox = isDraggingBox;
            isDraggingBox = false;
            
            // 🛡️ [LOGIC FIX] Strict Interaction Lockout!
            if (game.gameState !== 'playing' || game.freezeFrames > 0) {
                game.dragBox = null;
                return;
            }

            if (game.toolAtClickStart !== 'select') {
                game.dragBox = null;
                return;
            }

            // ==========================================
            // 🛠️ BUG FIX: Minimap Double-Command Glitch + GameOverModal Block
            // ==========================================
            if (targetElem && targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#rtsUI') || targetElem.closest('#preGameUI') || targetElem.closest('#mobileToolbar') || targetElem.closest('#gameOverModal'))) {
                game.dragBox = null; return;
            }

            // 🛡️ [FIX] Standardize Coordinate Space Translation
            const pos = getLocalPos(clientX, clientY);
            const worldX = pos.x + game.camera.x; 
            const worldY = pos.y + game.camera.y;
            
            const isRightClick = e.button === 2;
            const isLeftClick = e.button === 0 || isTouch;

            let isMoveCommand = isRightClick;
            let clickedUnit = null; 
            let clickedStruct = null;
            
            // Identify what was clicked (unless we just finished a large drag-box selection)
            if (!wasDraggingBox || (game.dragBox && MathUtils.distSq(0,0, game.dragBox.w, game.dragBox.h) <= CONTROLS_CONFIG.dragBoxThresholdSq)) {
                
                // 🚀 [PERFORMANCE] Loop through game.entities directly to prevent `.concat()` array allocation GC lag
                const entities = game.entities;
                const entLen = entities.length;
                for (let i = 0; i < entLen; i++) {
                    let u = entities[i];
                    
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
                const selLen = game.selectedUnits.length;
                for (let i = 0; i < selLen; i++) {
                    if (game.selectedUnits[i].team === 'black' && game.selectedUnits[i].hp > 0) validCount++;
                }
                
                if (validCount > 0) {
                    game.bus.emit('particles', {x: worldX, y: worldY, color: '#ffffff', count: 12});
                    
                    // 🧃 [JUICE] Expanding tactical Sonar Ring at the destination!
                    game.bus.emit('particles', {x: worldX, y: worldY, color: 'rgba(0, 255, 0, 0.6)', count: 1, type: 'ring'});
                    
                    // Crisp ping sound for issuing a command
                    game.bus.emit('playSound', 'ping');
                    
                    for (let i = 0; i < selLen; i++) {
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
                    // 🚀 [PERFORMANCE] Loop game.entities instead of multiple filter/concat allocations
                    const entities = game.entities;
                    const entLen = entities.length;
                    for (let i = 0; i < entLen; i++) {
                        let u = entities[i];
                        if (u.team === 'black' && u.hp > 0 && (u.role || u instanceof Queen)) {
                            if (u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2) {
                                game.selectedUnits.push(u);
                            }
                        }
                    }
                    game.selectedStructure = null;
                    if (game.selectedUnits.length > 0) game.bus.emit('playSound', 'harvest');
                    game.bus.emit('selectionChanged');
                } 
                // Single Click Selection
                else {
                    // Prevent micro-drags from clearing selection accidentally
                    if (MathUtils.distSq(startX, startY, pos.x, pos.y) > 144) {
                        game.dragBox = null; return;
                    }

                    if (clickedUnit) {
                        // 🛠️ BUG FIX: Use performance.now() to prevent double-click from breaking if OS clock stutters
                        const now = performance.now();
                        
                        // 🧃 RTS POLISH: Double-Click to select all units of the same type!
                        if (now - lastClickTime < CONTROLS_CONFIG.doubleClickMs && lastClickedUnit === clickedUnit) {
                            
                            const viewL = game.camera.x; const viewR = game.camera.x + game.canvas.width;
                            const viewT = game.camera.y; const viewB = game.camera.y + game.canvas.height;
                            
                            game.selectedUnits = [];
                            const entities = game.entities;
                            const entLen = entities.length;
                            for (let i = 0; i < entLen; i++) {
                                let u = entities[i];
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
                        game.bus.emit('closeModal'); // [FIX] Ensure structure UI closes!
                        game.bus.emit('selectionChanged');
                        
                    } else if (clickedStruct) {
                        game.selectedStructure = clickedStruct;
                        game.selectedUnits = [];
                        game.bus.emit('openModal', clickedStruct); // [FIX] Open structure UI!
                        game.bus.emit('selectionChanged');
                    } else {
                        // Clicked bare dirt, clear selection
                        game.selectedUnits = [];
                        game.selectedStructure = null;
                        game.bus.emit('closeModal'); // [FIX] Clean up UI!
                        game.bus.emit('selectionChanged');
                        
                        // 🧃 [JUICE] Visual click indicator on ground
                        if (!clickedStruct) this.bus.emit('particles', {x: worldX, y: worldY, color: 'rgba(255,255,255,0.5)', count: 5});
                    }
                }
            }
            game.dragBox = null; 
        };

        window.addEventListener('mouseup', e => handleRTSClick(e, e.clientX, e.clientY, e.target, false));
        
        // ==========================================
        // 🛠️ BUG FIX: Mobile Touch Lockout 
        // We added the missing `touchend` listener!
        // ==========================================
        window.addEventListener('touchend', e => {
            if(e.changedTouches.length === 1) {
                handleRTSClick(e, e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target, true);
            }
        });
        
        // Touch events explicitly verify 1 finger to prevent pinch-zoom commands from firing moves
        game.canvas.addEventListener('touchstart', e => { 
            // 🛡️ [LOGIC FIX] Block touch tracking if the game is over or paused
            if (game.gameState !== 'playing' || game.freezeFrames > 0) return;

            if(e.touches.length === 1) { 
                const pos = getLocalPos(e.touches[0].clientX, e.touches[0].clientY);
                startX = pos.x; 
                startY = pos.y; 
                
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
                        const grp = this.controlGroups[i];
                        const len = grp.length;
                        for (let k = 0; k < len; k++) {
                            if (grp[k].hp > 0) aliveGroup.push(grp[k]);
                        }
                        this.controlGroups[i] = aliveGroup;
                    }
                }
            }
        });

        // 🛡️ [FIX] Render Unit Highlights on the Map (Moved to postDraw for world-space coordinates!)
        game.bus.on('postDraw', (ctx) => {
            if (!game.selectedUnits) return;
            
            // Optimize by precalculating the dash offset once per frame
            const dashOffset = -game.tick * 0.5;
            // Gently pulse the selection rings so they feel alive
            const pulse = 1 + Math.sin(game.tick * 0.1) * 0.002;
            
            const selLen = game.selectedUnits.length;
            for (let i = 0; i < selLen; i++) {
                let u = game.selectedUnits[i];
                if (u.hp > 0) {
                    ctx.save();
                    ctx.translate(u.x, u.y);
                    ctx.scale(pulse, pulse);
                    
                    ctx.strokeStyle = '#00ff00'; 
                    ctx.lineWidth = 2; 
                    ctx.setLineDash([4, 4]); 
                    ctx.lineDashOffset = dashOffset;
                    
                    ctx.beginPath(); 
                    ctx.arc(0, 0, u.size + 8, 0, MathUtils.TWO_PI); 
                    ctx.stroke(); 
                    
                    ctx.restore();
                }
            }
            ctx.setLineDash([]);
        });

        // 🛡️ [FIX] Render Drag Selection Box (Kept in uiDraw for static screen-space coordinates!)
        game.bus.on('uiDraw', (ctx) => {
            if (game.dragBox && Math.abs(game.dragBox.w) > 0 && Math.abs(game.dragBox.h) > 0) {
                ctx.save();
                
                // 🧃 [JUICE] Translucent green selection box with animated "marching ants" border
                ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.lineDashOffset = -game.tick * 0.5;
                
                ctx.fillRect(game.dragBox.x, game.dragBox.y, game.dragBox.w, game.dragBox.h);
                ctx.strokeRect(game.dragBox.x, game.dragBox.y, game.dragBox.w, game.dragBox.h);
                
                ctx.restore();
            }
        });
        
        game.expansions.patchClass(Queen, 'draw', function(original, ctx, gameObj) {
            // Offset sprite drawing angle by 90 degrees if the sprite isn't facing perfectly right
            const tempAngle = this.angle; 
            this.angle -= (Math.PI / 2); 
            original.call(this, ctx, gameObj); 
            this.angle = tempAngle;
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
            
            // 🚀 [PERFORMANCE/QoL] Find the *closest* idle Queen, not just the first one in the array!
            let bestQueen = null;
            let minQueenDistSq = Infinity;
            
            // Avoid array instantiation via getter
            const entities = game.entities;
            const entLen = entities.length;
            
            for (let i = 0; i < entLen; i++) {
                let e = entities[i];
                if (e.role === 'queen' && e.team === data.team && e.hp > 0) { 
                    let dSq = MathUtils.distSq(e.x, e.y, data.x, data.y);
                    if (dSq < minQueenDistSq) {
                        minQueenDistSq = dSq;
                        bestQueen = e;
                    }
                }
            }
            
            let queen = bestQueen;
            if (!queen) return; 
            
            // --- 🛡️ RESTORE TERRITORY & OVERLAP CHECK ---
            // Ensure the player is only building inside their own Web Network AND not stacking!
            if (data.team === 'black') {
                let hasBase = false;
                let isOverlapping = false;
                
                for (let i = 0; i < entLen; i++) {
                    let s = entities[i];
                    if (s instanceof Structure) {
                        if (s.team === 'black') hasBase = true;
                        if (MathUtils.distSq(s.x, s.y, data.x, data.y) < (s.size * 2) * (s.size * 2)) {
                            isOverlapping = true; break;
                        }
                    }
                    // [FIX] Prevent building over pumpkins/dew
                    else if (s.resources !== undefined) {
                        if (MathUtils.distSq(s.x, s.y, data.x, data.y) < (s.size * 2) * (s.size * 2)) {
                            isOverlapping = true; break;
                        }
                    }
                    // 🚨 FIXED: Exclude the currently commanding Queen from the overlap check so players can adjust blueprints!
                    else if (s.role === 'queen' && s !== queen && s.buildTarget) {
                        // Assuming standard size 25 for blueprints
                        if (MathUtils.distSq(s.buildTarget.x, s.buildTarget.y, data.x, data.y) < 2500) {
                            isOverlapping = true; break;
                        }
                    }
                }
                
                if (isOverlapping || (hasBase && !game.checkTerritory(data.x, data.y, data.team))) {
                    // Flash red particles to indicate invalid placement
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
                    game.bus.emit('playSound', 'error'); // JUICE: Rejection sound!
                    return; 
                }
            }

            let cost = BUILD_COSTS[data.type];
            
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
            
            // 🚨 FIXED: If stunned, she cannot build. Pass to original to process the freeze effect!
            if (this.stunTimer > 0) {
                if (this.activeConstruction) this.activeConstruction.isPaused = true;
                original.call(this, gameObj);
                return;
            }

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
                    
                    // 🚨 FIXED: If an enemy gets in melee range, pause building and defend yourself!
                    let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, 100, true);
                    if (nearestEnemy) {
                        this.activeConstruction.isPaused = true;
                        original.call(this, gameObj);
                        return;
                    }

                    this.activeConstruction.buildProgress += CONTROLS_CONFIG.buildSpeed;
                    this.activeConstruction.isPaused = false;
                    
                    // 🧃 [JUICE] Emit sparks/magic from the Queen to the building!
                    if (gameObj.tick % 10 === 0) {
                        gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#ff9d00', count: 2, type: 'magic'});
                    }
                    
                    if (this.activeConstruction.buildProgress >= 1) {
                        this.activeConstruction.isConstructing = false;
                        this.activeConstruction.buildProgress = 1;
                        this.activeConstruction.territory = this.activeConstruction.originalTerritory; 
                        
                        // 🧃 [JUICE] Massive visual pop when a building finishes!
                        gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#ffffff', count: 40});
                        gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#3d2817', count: 30}); // Dirt clods
                        
                        if (gameObj.triggerShake) gameObj.triggerShake(5);
                        gameObj.bus.emit('playSound', 'build'); 
                        this.activeConstruction = null;
                    }
                    
                    // 🚨 FIXED: Spoof the command target so original.call processes debuffs but prevents the AI from wandering off!
                    let cachedTarget = this.commandTarget;
                    this.commandTarget = { x: this.x, y: this.y };
                    original.call(this, gameObj); 
                    this.commandTarget = cachedTarget;
                    
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
                            
                            // 🧃 [JUICE] Foundation placed!
                            gameObj.bus.emit('particles', {x: s.x, y: s.y, color: '#3d2817', count: 15});
                            
                            gameObj.addEntity(s);
                            this.activeConstruction = s; 
                        } else {
                            // 🛡️ [FIX] Notify player if Queen arrived but resources were spent elsewhere!
                            gameObj.bus.emit('particles', {x: this.buildTarget.x, y: this.buildTarget.y, color: '#ff0000', count: 15});
                            gameObj.bus.emit('playSound', 'error');
                            if (gameObj.showSystemMessage) gameObj.showSystemMessage("NOT ENOUGH RESOURCES", "#ff0000");
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
                    
                    // 🚀 [PERFORMANCE] Loop game.entities instead of the array-allocating game.structures getter
                    const entities = gameObj.entities;
                    const entLen = entities.length;
                    for (let i = 0; i < entLen; i++) {
                        let s = entities[i];
                        if (s instanceof Structure && s.isConstructing && s.team === this.team && MathUtils.distSq(s.x, s.y, this.x, this.y) < CONTROLS_CONFIG.buildResumeRangeSq) {
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
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            if (this.isConstructing) {
                ctx.save();
                ctx.translate(this.x, this.y);
                
                const tick = gameObj ? gameObj.tick : 0;
                
                // Pulsing animation unless paused
                const pulse = this.isPaused ? 0 : Math.sin(tick * 0.1) * 0.1;
                
                // Draw a dark "foundation hole" on the ground
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
                ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size * 0.7, 0, 0, MathUtils.TWO_PI); ctx.fill();
                ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; // Reset
                
                // Base
                ctx.fillStyle = '#221100';
                ctx.beginPath(); ctx.arc(0, 0, (this.size * 0.7) + pulse, 0, MathUtils.TWO_PI); ctx.fill();
                
                // Magic construction ring
                ctx.strokeStyle = this.isPaused ? '#885500' : '#ff9d00';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.lineDashOffset = this.isPaused ? 0 : -tick * 0.5;
                ctx.beginPath(); ctx.arc(0, 0, this.size * 0.8, 0, MathUtils.TWO_PI); ctx.stroke();
                
                // Build Progress Bar
                const w = this.size * 1.5;
                ctx.fillStyle = 'black'; ctx.fillRect(-w/2, -this.size - 15, w, 6);
                ctx.fillStyle = this.isPaused ? '#ff5500' : '#00aaff'; 
                ctx.fillRect(-w/2, -this.size - 14, w * this.buildProgress, 4);
                
                ctx.restore();
                
                // [FIX] Render universal health bar natively since we bypassed original.call()
                if (this.hp !== undefined && this.hp > 0 && this.hp < this.maxHp) {
                    const hpW = this.size * 1.5; 
                    const hpPct = Math.max(0, this.hp) / this.maxHp;
                    let barColor = hpPct < 0.25 ? '#ff0000' : (hpPct < 0.5 ? '#ffff00' : '#00ff00');
                    
                    ctx.fillStyle = '#000000'; 
                    ctx.fillRect(this.x - hpW/2 - 1, this.y - this.size - 12, hpW + 2, 6);
                    ctx.fillStyle = '#550000'; 
                    ctx.fillRect(this.x - hpW/2, this.y - this.size - 11, hpW, 4);
                    ctx.fillStyle = barColor; 
                    ctx.fillRect(this.x - hpW/2, this.y - this.size - 11, hpW * hpPct, 4);
                }

            } else {
                original.call(this, ctx, gameObj); 
            }
        });
    }
};
