// expansions/Controls.js
import { MathUtils, Spider, Structure, SPIDER_STATE } from '../game.js';
import { Queen } from './Queen.js';

export const AdvancedUnitControlExpansion = {
    init: (game) => {
        game.selectedUnits = []; 
        game.dragBox = null;
        game.controlGroups = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[] };

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
                        // Assign Control Group
                        game.controlGroups[key] = [...game.selectedUnits];
                        game.bus.emit('playSound', 'spell');
                    } else {
                        // Recall Control Group
                        game.controlGroups[key] = game.controlGroups[key].filter(u => u.hp > 0); // Purge dead units
                        if (game.controlGroups[key].length > 0) {
                            game.selectedUnits = [...game.controlGroups[key]];
                            game.selectedStructure = null;
                            game.bus.emit('playSound', 'harvest');
                            
                            // Center camera on the group leader
                            let centerU = game.selectedUnits[0];
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
            
            // Prevent interaction if clicking on UI elements
            if (targetElem && targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#rtsUI'))) {
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
            if (!wasDraggingBox || (game.dragBox && MathUtils.distSq(0,0, game.dragBox.w, game.dragBox.h) <= 100)) {
                const allSpiders = game.spiders.concat(game.queens);
                for (let i = 0; i < allSpiders.length; i++) {
                    let u = allSpiders[i];
                    if (MathUtils.distSq(u.x, u.y, worldX, worldY) < ((u.size + 15)**2)) { clickedUnit = u; break; }
                }
                if (!clickedUnit) {
                    for(let s of game.structures) {
                        if (MathUtils.distSq(s.x, s.y, worldX, worldY) < s.size**2) { clickedStruct = s; break; }
                    }
                }
            }

            // On mobile, tapping the ground while units are selected counts as a move command
            if (isTouch && game.selectedUnits.length > 0 && !clickedUnit && !clickedStruct) {
                isMoveCommand = true;
            }

            // EXECUTE COMMAND: Move Units
            if (isMoveCommand && game.selectedUnits.length > 0) {
                let validUnits = game.selectedUnits.filter(u => u.team === 'black' && u.hp > 0);
                if (validUnits.length > 0) {
                    game.bus.emit('particles', {x: worldX, y: worldY, color: '#ffffff', count: 12});
                    game.bus.emit('playSound', 'shoot');
                    
                    validUnits.forEach((u, i) => {
                        // Disperse units slightly around the target coordinate so they don't form a single-pixel black hole
                        let offsetX = MathUtils.randomRange(-validUnits.length * 4, validUnits.length * 4);
                        let offsetY = MathUtils.randomRange(-validUnits.length * 4, validUnits.length * 4);
                        u.commandTarget = { x: worldX + offsetX, y: worldY + offsetY };
                        u.isManual = true; 
                    });
                }
            } 
            // EXECUTE COMMAND: Select Units/Buildings
            else if (isLeftClick && !isMoveCommand) {
                
                // Finish Drag Selection
                if (wasDraggingBox && game.dragBox && MathUtils.distSq(0,0, game.dragBox.w, game.dragBox.h) > 100) {
                    let x1 = Math.min(startX, startX + game.dragBox.w) + game.camera.x;
                    let x2 = Math.max(startX, startX + game.dragBox.w) + game.camera.x;
                    let y1 = Math.min(startY, startY + game.dragBox.h) + game.camera.y;
                    let y2 = Math.max(startY, startY + game.dragBox.h) + game.camera.y;
                    
                    game.selectedUnits = game.spiders.concat(game.queens).filter(u => 
                        u.team === 'black' && u.x >= x1 && u.x <= x2 && u.y >= y1 && u.y <= y2
                    );
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
                        if (e.shiftKey) {
                            if (!game.selectedUnits.includes(clickedUnit)) game.selectedUnits.push(clickedUnit);
                        } else {
                            game.selectedUnits = [clickedUnit];
                        }
                        game.selectedStructure = null;
                        game.bus.emit('playSound', 'harvest');
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
            if(e.touches.length === 1) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }
        }, {passive: false});
        
        window.addEventListener('touchend', e => { 
            if(e.changedTouches.length === 1) handleRTSClick(e, e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target, true); 
        });
    },

    patch: (game) => {
        // --- Prevent Memory Leaks in Control Groups ---
        // Periodically sweeps control groups to remove dead units, allowing the JS Garbage Collector to free their RAM.
        game.expansions.patchClass(game.constructor, 'update', function(original) {
            original.call(this);
            
            // Run the sweep once every 60 frames (2 seconds)
            if (this.gameState === 'playing' && this.tick % 60 === 0 && this.controlGroups) {
                for (let i = 1; i <= 9; i++) {
                    if (this.controlGroups[i] && this.controlGroups[i].length > 0) {
                        this.controlGroups[i] = this.controlGroups[i].filter(u => u.hp > 0);
                    }
                }
            }
        });

        // Render UI layer (Drag selection box)
        game.bus.on('uiDraw', (ctx) => {
            if (!game.selectedUnits) return;
            game.selectedUnits.forEach(u => {
                if (u.hp > 0) {
                    ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -game.tick * 0.5;
                    ctx.beginPath(); ctx.arc(u.x, u.y, u.size + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
                }
            });
        });

        // Override standard AI if the unit is being manually controlled
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            
            // --- Yield to Ranged & Siege Units ---
            // If the unit has custom ranged manual logic (defined in SpecialUnits.js or Titans.js), 
            // pass execution down the chain and exit so we don't force a melee attack!
            if (this.isManual && (this.hasTrait('ranged_attacker') || this.hasTrait('siege_attacker'))) {
                original.call(this, gameObj);
                return;
            }

            if (this.isManual) {
                const techLvl = gameObj.techLevel[this.team] || 0; 
                const currentDamage = this.damage + (techLvl * 5); 
                
                // Aggro check during manual movement
                const detectRadius = 150 + (techLvl * 10);
                let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, detectRadius);

                if (nearestEnemy) {
                    this.state = SPIDER_STATE.COMBAT; 
                    this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                    const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;
                    const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                    
                    if (distSq > combatRange * combatRange) { 
                        let speed = (this.baseSpeed + (gameObj.techLevel[this.team] * 0.15));
                        this.x += Math.cos(this.angle) * speed; this.y += Math.sin(this.angle) * speed;
                    } else {
                        this.cooldown--;
                        if (this.cooldown <= 0) {
                            nearestEnemy.hp -= currentDamage; this.cooldown = this.attackSpeed;
                            this.x -= Math.cos(this.angle) * 10; this.y -= Math.sin(this.angle) * 10; 
                            gameObj.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: this.team==='black'?'#aa00ff':'#ffaa00', count: 5}); 
                            gameObj.bus.emit('playSound', 'harvest');
                        }
                    }
                    return; // Skip normal movement if fighting
                }

                // Normal movement towards command target
                if (this.commandTarget) {
                    const dx = this.commandTarget.x - this.x; const dy = this.commandTarget.y - this.y;
                    if (MathUtils.distSq(0,0, dx, dy) > 225) { 
                        const targetAngle = Math.atan2(dy, dx);
                        
                        // Smooth rotation
                        let diff = targetAngle - this.angle;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        this.angle += (diff * 0.15); 
                        
                        // Apply terrain modifiers
                        const terrain = gameObj.getTerrainAt(this.x, this.y); 
                        let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                        let speed = (this.baseSpeed + (gameObj.techLevel[this.team] * 0.15)) * tMod;
                        
                        this.x += Math.cos(this.angle) * speed; this.y += Math.sin(this.angle) * speed;
                    } else {
                        this.commandTarget = null; // Reached target
                    }
                }
            } else {
                original.call(this, gameObj); // Not manual, run standard AI
            }
        });

        // Custom Queen rotation handling
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            const prevAngle = this.angle || 0;
            original.call(this, gameObj);
            if (this.commandTarget) {
                let targetAngle = Math.atan2(this.commandTarget.y - this.y, this.commandTarget.x - this.x);
                let diff = targetAngle - prevAngle;
                while (diff > Math.PI) diff -= Math.PI * 2; 
                while (diff < -Math.PI) diff += Math.PI * 2;
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
// CONSTRUCTION LOGIC & DUAL-COST SUPPORT
// ==========================================
export const ConstructionExpansion = {
    init: (game) => {
        game.bus.listeners['buildStructure'] = []; // Clear base game listener
        
        game.bus.on('buildStructure', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if (!queen) return; 
            
            // --- RESTORE TERRITORY CHECK ---
            // Ensure the player is only building inside their own Web Network!
            if (data.team === 'black' && game.structures.some(s => s.team === 'black')) {
                if (!game.checkTerritory(data.x, data.y, data.team)) {
                    // Flash red particles to indicate invalid placement
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
                    return; 
                }
            }

            const costs = { 
                'nest': {p: 150, d: 0}, 'eggsac': {p: 50, d: 0}, 'pylon': {p: 25, d: 0}, 
                'turret': {p: 100, d: 0}, 'wall': {p: 25, d: 0},
                'mortar': {p: 200, d: 50}, 'shrine': {p: 150, d: 100} 
            };
            let cost = costs[data.type];
            
            // Verify player can afford it
            if (game.eco[data.team].pumpkins < cost.p || game.eco[data.team].dew < cost.d) {
                game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
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
            game.bus.emit('playSound', 'shoot');
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
                else if (MathUtils.distSq(this.activeConstruction.x, this.activeConstruction.y, this.x, this.y) <= 4900) { 
                    // Within 70px build range
                    this.activeConstruction.buildProgress += 0.001; // Takes 1000 ticks (~30s) to build
                    this.activeConstruction.isPaused = false;
                    
                    if (gameObj.tick % 15 === 0) gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#ff9d00', count: 2});
                    
                    if (this.activeConstruction.buildProgress >= 1) {
                        this.activeConstruction.isConstructing = false;
                        this.activeConstruction.buildProgress = 1;
                        this.activeConstruction.territory = this.activeConstruction.originalTerritory; 
                        
                        gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#ffffff', count: 40});
                        gameObj.bus.emit('playSound', 'spell');
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
                    if (distSq < 3600) { // Reached destination
                        
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
                            gameObj.bus.emit('playSound', 'build');
                        }
                        this.buildTarget = null;
                        this.commandTarget = null; 
                    }
                }
            }

            // 3. Auto-resume nearby paused construction ONLY if idle for 1.5 seconds
            if (!this.activeConstruction && !this.commandTarget && !this.buildTarget) {
                this.idleBuildTimer = (this.idleBuildTimer || 0) + 1;
                
                if (this.idleBuildTimer > 45) { // 45 frames = 1.5 seconds
                    let unfinished = gameObj.structures.find(s => s.isConstructing && s.team === this.team && MathUtils.distSq(s.x, s.y, this.x, this.y) < 3600);
                    if (unfinished) {
                        this.activeConstruction = unfinished; 
                        this.idleBuildTimer = 0; // Reset timer
                    }
                }
            } else {
                this.idleBuildTimer = 0; // Immediately reset the timer if she is given a command
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
                ctx.beginPath(); ctx.arc(0, 0, (this.size * 0.7) + pulse, 0, Math.PI*2); ctx.fill();
                
                // Magic construction ring
                ctx.strokeStyle = this.isPaused ? '#885500' : '#ff9d00';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.lineDashOffset = this.isPaused ? 0 : -game.tick * 0.5;
                ctx.beginPath(); ctx.arc(0, 0, this.size * 0.8, 0, Math.PI*2); ctx.stroke();
                
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
