// expansions/Controls.js
import { MathUtils, Spider, Structure } from '../game.js';
import { Queen } from './Queen.js';

export const AdvancedUnitControlExpansion = {
    init: (game) => {
        game.selectedUnits = []; 
        game.dragBox = null;
        game.controlGroups = { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[] };

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
                        game.controlGroups[key] = [...game.selectedUnits];
                        game.bus.emit('playSound', 'spell');
                    } else {
                        game.controlGroups[key] = game.controlGroups[key].filter(u => u.hp > 0);
                        if (game.controlGroups[key].length > 0) {
                            game.selectedUnits = [...game.controlGroups[key]];
                            game.selectedStructure = null;
                            game.bus.emit('playSound', 'harvest');
                            
                            let centerU = game.selectedUnits[0];
                            game.camera.x = centerU.x - (game.canvas.width / 2);
                            game.camera.y = centerU.y - (game.canvas.height / 2);
                        }
                    }
                }
            }
        });

        let startX, startY, isDraggingBox = false;
        
        game.canvas.addEventListener('mousedown', e => {
            startX = e.clientX; startY = e.clientY;
            if (e.button === 0 && e.shiftKey) { 
                isDraggingBox = true;
                game.dragBox = { x: startX, y: startY, w: 0, h: 0 };
            }
        });
        
        window.addEventListener('mousemove', e => {
            if (isDraggingBox && game.dragBox) {
                game.dragBox.w = e.clientX - startX;
                game.dragBox.h = e.clientY - startY;
            }
        });

        const handleRTSClick = (e, clientX, clientY, targetElem, isTouch = false) => {
            const wasDraggingBox = isDraggingBox;
            isDraggingBox = false;
            
            if (targetElem && targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#rtsUI'))) {
                game.dragBox = null; return;
            }

            const worldX = clientX + game.camera.x; 
            const worldY = clientY + game.camera.y;
            const isRightClick = e.button === 2;
            const isLeftClick = e.button === 0 || isTouch;

            let isMoveCommand = isRightClick;
            
            let clickedUnit = null; let clickedStruct = null;
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

            if (isTouch && game.selectedUnits.length > 0 && !clickedUnit && !clickedStruct) {
                isMoveCommand = true;
            }

            if (isMoveCommand && game.selectedUnits.length > 0) {
                let validUnits = game.selectedUnits.filter(u => u.team === 'black' && u.hp > 0);
                if (validUnits.length > 0) {
                    game.bus.emit('particles', {x: worldX, y: worldY, color: '#ffffff', count: 12});
                    game.bus.emit('playSound', 'shoot');
                    validUnits.forEach((u, i) => {
                        let offsetX = (Math.random() - 0.5) * (validUnits.length * 8);
                        let offsetY = (Math.random() - 0.5) * (validUnits.length * 8);
                        u.commandTarget = { x: worldX + offsetX, y: worldY + offsetY };
                        u.isManual = true; 
                    });
                }
            } else if (isLeftClick && !isMoveCommand) {
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
                } else {
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
                        game.selectedUnits = [];
                        game.selectedStructure = null;
                    }
                }
            }
            game.dragBox = null; 
        };

        window.addEventListener('mouseup', e => handleRTSClick(e, e.clientX, e.clientY, e.target, false));
        
        game.canvas.addEventListener('touchstart', e => { 
            if(e.touches.length===1) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }
        }, {passive: false});
        window.addEventListener('touchend', e => { 
            if(e.changedTouches.length===1) handleRTSClick(e, e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target, true); 
        });
    },

    patch: (game) => {
        game.bus.on('uiDraw', (ctx) => {
            if (game.dragBox && MathUtils.distSq(0,0, game.dragBox.w, game.dragBox.h) > 100) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 1;
                ctx.fillRect(game.dragBox.x, game.dragBox.y, game.dragBox.w, game.dragBox.h);
                ctx.strokeRect(game.dragBox.x, game.dragBox.y, game.dragBox.w, game.dragBox.h);
            }
        });

        game.bus.on('preDraw', (ctx) => {
            if (!game.selectedUnits) return;
            game.selectedUnits.forEach(u => {
                if (u.hp > 0) {
                    ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -game.tick * 0.5;
                    ctx.beginPath(); ctx.arc(u.x, u.y, u.size + 8, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
                }
            });
        });

        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            if (this.isManual) {
                const techLvl = gameObj.techLevel[this.team] || 0; 
                const currentDamage = this.damage + (techLvl * 5); 
                
                const detectRadius = 150 + (techLvl * 10);
                let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, detectRadius);

                if (nearestEnemy) {
                    this.state = 'combat'; this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
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
                    return; 
                }

                if (this.commandTarget) {
                    const dx = this.commandTarget.x - this.x; const dy = this.commandTarget.y - this.y;
                    if (MathUtils.distSq(0,0, dx, dy) > 225) { 
                        const targetAngle = Math.atan2(dy, dx);
                        let diff = targetAngle - this.angle;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        this.angle += (diff * 0.15); 
                        
                        const terrain = gameObj.getTerrainAt(this.x, this.y); 
                        let tMod = (terrain === 'water') ? 0.05 : ((terrain === 'grass') ? 1.3 : 1.0);
                        let speed = (this.baseSpeed + (gameObj.techLevel[this.team] * 0.15)) * tMod;
                        
                        this.x += Math.cos(this.angle) * speed; this.y += Math.sin(this.angle) * speed;
                    } else {
                        this.commandTarget = null; 
                    }
                }
            } else {
                original.call(this, gameObj); 
            }
        });

        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            const prevAngle = this.angle || 0;
            original.call(this, gameObj);
            if (this.commandTarget) {
                let targetAngle = Math.atan2(this.commandTarget.y - this.y, this.commandTarget.x - this.x);
                let diff = targetAngle - prevAngle;
                while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
                this.angle = prevAngle + (diff * 0.10);
            }
        });
        
        game.expansions.patchClass(Queen, 'draw', function(original, ctx) {
            const tempAngle = this.angle; this.angle -= (Math.PI / 2); original.call(this, ctx); this.angle = tempAngle;
        });
    }
};

export const ConstructionExpansion = {
    init: (game) => {
        game.bus.listeners['buildStructure'] = [];
        
        game.bus.on('buildStructure', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if (!queen) return; 
            
            const costs = { 'nest': 150, 'eggsac': 50, 'turret': 100, 'wall': 25, 'pylon': 25 };
            if (game.eco[data.team].pumpkins < costs[data.type]) {
                game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
                return; 
            }

            if (queen.activeConstruction) {
                queen.activeConstruction.isPaused = true;
                queen.activeConstruction = null;
            }

            queen.buildTarget = { x: data.x, y: data.y, type: data.type, cost: costs[data.type] };
            queen.commandTarget = { x: data.x, y: data.y }; 
            game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff9d00', count: 10});
            game.bus.emit('playSound', 'shoot');
        });
    },

    patch: (game) => {
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            if (this.activeConstruction) {
                if (this.commandTarget) {
                    this.activeConstruction.isPaused = true;
                    this.activeConstruction = null;
                } 
                else if (MathUtils.distSq(this.activeConstruction.x, this.activeConstruction.y, this.x, this.y) <= 4900) { 
                    this.activeConstruction.buildProgress += 0.001;
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
                    this.activeConstruction = null;
                }
            }

            original.call(this, gameObj);

            if (this.buildTarget) {
                if (this.commandTarget) {
                    const destDistSq = MathUtils.distSq(this.commandTarget.x, this.commandTarget.y, this.buildTarget.x, this.buildTarget.y);
                    if (destDistSq > 100) this.buildTarget = null;
                }
                
                if (this.buildTarget) {
                    const distSq = MathUtils.distSq(this.buildTarget.x, this.buildTarget.y, this.x, this.y);
                    if (distSq < 3600) { 
                        if (gameObj.eco[this.team].pumpkins >= this.buildTarget.cost) {
                            gameObj.eco[this.team].pumpkins -= this.buildTarget.cost;
                            let s = new Structure(this.buildTarget.x, this.buildTarget.y, this.team, this.buildTarget.type);
                            s.isConstructing = true;
                            s.isPaused = false;
                            s.buildProgress = 0;
                            s.originalTerritory = s.territory;
                            s.territory = 0; 
                            gameObj.addEntity(s);
                            this.activeConstruction = s; 
                            gameObj.bus.emit('playSound', 'build');
                        }
                        this.buildTarget = null;
                        this.commandTarget = null; 
                    }
                }
            }

            if (!this.activeConstruction && !this.commandTarget && !this.buildTarget) {
                let unfinished = gameObj.structures.find(s => s.isConstructing && s.team === this.team && MathUtils.distSq(s.x, s.y, this.x, this.y) < 3600);
                if (unfinished) this.activeConstruction = unfinished; 
            }
        });

        game.expansions.patchClass(Structure, 'update', function(original, gameObj) {
            if (this.isConstructing) return; 
            original.call(this, gameObj);
        });

        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            if (this.isConstructing) {
                ctx.save();
                ctx.translate(this.x, this.y);
                const pulse = this.isPaused ? 0 : Math.sin(game.tick * 0.1) * 2;
                ctx.fillStyle = '#221100';
                ctx.beginPath(); ctx.arc(0, 0, (this.size * 0.7) + pulse, 0, Math.PI*2); ctx.fill();
                
                ctx.strokeStyle = this.isPaused ? '#885500' : '#ff9d00';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.lineDashOffset = this.isPaused ? 0 : -game.tick * 0.5;
                ctx.beginPath(); ctx.arc(0, 0, this.size * 0.8, 0, Math.PI*2); ctx.stroke();
                
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