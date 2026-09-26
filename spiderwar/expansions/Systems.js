// expansions/Systems.js
import { Game, MathUtils, Spider, Structure, ResourceNode } from '../game.js';
import { Queen } from './Queen.js';
import { CentipedeBoss } from './Boss.js';
import { Aphid, GoldenBug } from './Critters.js';

export const AtmosphereExpansion = {
    patch: (game) => {
        game.bus.on('atmosphereDraw', (ctx) => {
            const cycle = Math.sin(game.tick / 1800); const darkness = Math.max(0, cycle * 0.6); 
            ctx.fillStyle = `rgba(5, 10, 35, ${darkness})`; ctx.fillRect(game.camera.x, game.camera.y, game.canvas.width, game.canvas.height);
        });
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) {
            const cycle = Math.sin(game.tick / 1800);
            if (cycle > 0 && (this.type === 'nest' || this.type === 'turret') && !this.isConstructing) { ctx.shadowBlur = 30 * cycle; ctx.shadowColor = this.team === 'black' ? '#aa00ff' : '#ff3300'; }
            original.call(this, ctx); ctx.shadowBlur = 0; 
        });
        game.expansions.patchClass(Queen, 'draw', function(original, ctx) {
            const cycle = Math.sin(game.tick / 1800);
            if (cycle > 0) { ctx.shadowBlur = 40 * cycle; ctx.shadowColor = this.team === 'black' ? '#ffffff' : '#ff0000'; }
            original.call(this, ctx); ctx.shadowBlur = 0;
        });
    }
}

export const FogOfWarExpansion = {
    patch: (game) => {
        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this);
            if (!this.mapGrid) return;

            if (!this.fowCanvas) {
                this.fowCanvas = document.createElement('canvas');
                this.fowCanvas.width = this.mapGrid[0].length;
                this.fowCanvas.height = this.mapGrid.length;
                this.fowCtx = this.fowCanvas.getContext('2d');
            }

            if (this.tick % 5 === 0) {
                for (let y = 0; y < this.mapGrid.length; y++) {
                    for (let x = 0; x < this.mapGrid[y].length; x++) {
                        this.mapGrid[y][x].visible = false; 
                    }
                }

                const reveal = (worldX, worldY, radiusTiles) => {
                    const tX = Math.floor(worldX / this.tileSize);
                    const tY = Math.floor(worldY / this.tileSize);
                    for (let y = tY - radiusTiles; y <= tY + radiusTiles; y++) {
                        for (let x = tX - radiusTiles; x <= tX + radiusTiles; x++) {
                            if (this.mapGrid[y] && this.mapGrid[y][x]) {
                                if (MathUtils.distSq(x, y, tX, tY) <= radiusTiles * radiusTiles) {
                                    this.mapGrid[y][x].visible = true;
                                    this.mapGrid[y][x].discovered = true;
                                }
                            }
                        }
                    }
                };

                this.spiders.filter(s => s.team === 'black').forEach(s => reveal(s.x, s.y, 2));
                this.queens.filter(q => q.team === 'black').forEach(q => reveal(q.x, q.y, 3));
                this.structures.filter(s => s.team === 'black').forEach(s => {
                    let r = s.type === 'nest' ? 4 : (s.type === 'pylon' ? 3 : 2);
                    reveal(s.x, s.y, r);
                });

                this.fowCtx.clearRect(0, 0, this.fowCanvas.width, this.fowCanvas.height);
                for (let y = 0; y < this.mapGrid.length; y++) {
                    for (let x = 0; x < this.mapGrid[y].length; x++) {
                        const tile = this.mapGrid[y][x];
                        if (!tile.discovered) {
                            this.fowCtx.fillStyle = 'rgba(0, 0, 0, 1.0)';
                            this.fowCtx.fillRect(x, y, 1, 1); 
                        } else if (!tile.visible) {
                            this.fowCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                            this.fowCtx.fillRect(x, y, 1, 1);
                        }
                    }
                }
            }
        });

        const applyFoWToClass = (ClassRef, hideIfInvisible, hideIfUndiscovered) => {
            game.expansions.patchClass(ClassRef, 'draw', function(original, ctx) {
                if (game.mapGrid) {
                    const tX = Math.floor(this.x / game.tileSize); const tY = Math.floor(this.y / game.tileSize);
                    const tile = game.mapGrid[tY] && game.mapGrid[tY][tX];
                    if (tile) {
                        if (hideIfUndiscovered && !tile.discovered) return;
                        if (hideIfInvisible && !tile.visible && this.team !== 'black') return;
                    }
                }
                original.call(this, ctx);
            });
        };
        
        applyFoWToClass(Spider, true, false);
        applyFoWToClass(Queen, true, false);
        applyFoWToClass(Structure, true, false);
        applyFoWToClass(CentipedeBoss, true, false);
        applyFoWToClass(Aphid, true, false);
        applyFoWToClass(GoldenBug, true, false);
        applyFoWToClass(ResourceNode, false, true); 

        game.bus.on('postDraw', (ctx) => {
            if (!game.fowCanvas) return;
            ctx.save();
            ctx.filter = 'blur(30px)'; 
            ctx.drawImage(
                game.fowCanvas, 
                0, 0, 
                game.fowCanvas.width * game.tileSize, 
                game.fowCanvas.height * game.tileSize
            );
            ctx.restore();
        });
    }
};

export const SaveLoadExpansion = {
    patch: (game) => {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'o') {
                const state = {
                    eco: game.eco, pop: game.pop, maxPop: game.maxPop, techLevel: game.techLevel, camera: game.camera, tick: game.tick,
                    spiders: game.spiders.map(s => ({x: s.x, y: s.y, team: s.team, role: s.role, hp: s.hp, cargo: s.cargo})),
                    structures: game.structures.map(s => ({
                        x: s.x, y: s.y, team: s.team, type: s.type, hp: s.hp,
                        isConstructing: s.isConstructing, buildProgress: s.buildProgress,
                        territory: s.territory, originalTerritory: s.originalTerritory
                    })),
                    resourceNodes: game.resourceNodes.map(p => ({x: p.x, y: p.y, type: p.type, resources: p.resources})),
                    queens: game.queens.map(q => ({x: q.x, y: q.y, team: q.team, hp: q.hp})),
                    critters: game.critters.map(b => ({x: b.x, y: b.y, hp: b.hp, color: b.color})) 
                };
                localStorage.setItem('spiderRTS_saveData', JSON.stringify(state)); alert("Game Saved!");
            }
            if (e.key.toLowerCase() === 'p') {
                const data = localStorage.getItem('spiderRTS_saveData'); if(!data) return alert("No save found!");
                const state = JSON.parse(data);
                game.eco = state.eco; game.pop = state.pop; game.maxPop = state.maxPop; game.techLevel = state.techLevel; game.camera = state.camera; game.tick = state.tick || 0;
                
                game.entities = []; 
                state.spiders.forEach(s => { let o = new Spider(s.x, s.y, s.team, s.role); o.hp = s.hp; o.cargo = s.cargo; game.addEntity(o); });
                state.structures.forEach(s => { 
                    let o = new Structure(s.x, s.y, s.team, s.type); 
                    o.hp = s.hp; o.isConstructing = s.isConstructing; o.buildProgress = s.buildProgress;
                    o.territory = s.territory; o.originalTerritory = s.originalTerritory;
                    if(o.isConstructing) o.isPaused = true;
                    game.addEntity(o); 
                });
                state.resourceNodes.forEach(p => { let o = new ResourceNode(p.x, p.y, p.type); o.resources = p.resources; game.addEntity(o); });
                state.queens.forEach(q => { let o = new Queen(q.x, q.y, q.team); o.hp = q.hp; game.addEntity(o); });
                
                alert("Game Loaded!");
            }
        });
    }
};