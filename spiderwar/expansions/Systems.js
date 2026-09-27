// expansions/Systems.js
import { Game, MathUtils, Spider, Structure, ResourceNode } from '../game.js';
import { Queen } from './Queen.js';
import { CentipedeBoss } from './Boss.js';
import { Aphid, GoldenBug } from './Critters.js';

// --- MECHANICS IMPORTS ---
import { VenusFlytrap } from './Hazards.js';
import { JackOLantern } from './ControlPoints.js';
import { Corpse, ZombieSpider } from './Necromancy.js'; 
import { EggTrap, Broodling } from './BroodAmbush.js'; 
import { ExplosiveProjectile } from './Titans.js'; // Added from Titans
import { MortarShell } from './Fortress.js';       // Added from Fortress

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
                    // Mortars have massive sight range
                    let r = s.type === 'nest' ? 4 : (s.type === 'mortar' ? 4 : (s.type === 'pylon' ? 3 : 2));
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
        applyFoWToClass(VenusFlytrap, true, false); 
        applyFoWToClass(Corpse, true, false); 
        applyFoWToClass(JackOLantern, false, true); 
        applyFoWToClass(ResourceNode, false, true); 
        applyFoWToClass(EggTrap, true, false);
        
        // --- ADDED NEW PROJECTILES TO FOG OF WAR ---
        applyFoWToClass(ExplosiveProjectile, true, false);
        applyFoWToClass(MortarShell, true, false);

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
        
        // Extracted Loading Logic so it can be called by the Keyboard OR the Main Menu
        const performLoad = () => {
            const data = localStorage.getItem('spiderRTS_saveData'); 
            if(!data) return alert("No save found!");
            
            const state = JSON.parse(data);
            game.eco = state.eco; game.pop = state.pop; game.maxPop = state.maxPop; 
            game.techLevel = state.techLevel; game.camera = state.camera; game.tick = state.tick || 0;
            
            // --- FIX A: RESTORE MAP GRID & FOG OF WAR ---
            if (state.mapGrid) {
                game.mapGrid = state.mapGrid;
                // Force water bitmasks to recalculate their borders based on the loaded map
                if (game.updateBitmasks) game.updateBitmasks();
            }

            // --- FIX A (Bonus): RESTORE DECOR ---
            // Because loaded games skip Tick 1, we must rebuild the decor chunks manually
            if (state.decor) {
                game.decor = state.decor;
                game.decorInitialized = true; // Prevent Tick 1 regeneration
                game.decorChunks = {};
                const CHUNK_SIZE = 500; // Defined in Decor.js
                
                game.decor.forEach(d => {
                    // Re-link the raw Image element from the preloaded dictionary
                    if (game.decorSprites && game.decorSprites[d.type]) {
                        d.sprite = game.decorSprites[d.type];
                    }
                    // Re-assign to spatial hash chunk for rendering
                    const chunkKey = `${Math.floor(d.x / CHUNK_SIZE)},${Math.floor(d.y / CHUNK_SIZE)}`;
                    if (!game.decorChunks[chunkKey]) game.decorChunks[chunkKey] = [];
                    game.decorChunks[chunkKey].push(d);
                });
            }

            game.entities = []; 
            
            state.spiders.forEach(s => { 
                let o;
                if (s.isZombie) { 
                    o = new ZombieSpider(s.x, s.y, s.team); 
                } else if (s.role === 'broodling') {
                    o = new Broodling(s.x, s.y, s.team);
                } else {
                    o = new Spider(s.x, s.y, s.team, s.role);
                    if (s.role === 'spitter') { o.maxHp = 75; o.damage = 25; o.attackSpeed = 45; o.range = 250; o.sprite.src = s.team === 'black' ? 'assets/spitter_black.png' : 'assets/spitter_red.png'; }
                    if (s.role === 'tarantula') { o.maxHp = 400; o.damage = 45; o.attackSpeed = 40; o.size = 22; o.baseSpeed = 0.6; o.sprite.src = s.team === 'black' ? 'assets/tarantula_black.png' : 'assets/tarantula_red.png'; }
                    if (s.role === 'widow') { 
                        o.maxHp = 150; o.damage = 100; o.baseSpeed = 1.9; 
                        o.isCloaked = s.isCloaked; o.cloakCooldown = s.cloakCooldown; 
                        o.sprite.src = s.team === 'black' ? 'assets/widow_black.png' : 'assets/widow_red.png'; 
                    }
                    if (s.role === 'goliath') { o.maxHp = 1200; o.damage = 90; o.size = 38; o.baseSpeed = 0.4; o.sprite.src = s.team === 'black' ? 'assets/goliath_black.png' : 'assets/goliath_red.png'; }
                }
                o.hp = s.hp; o.cargo = s.cargo; 
                if (s.life !== undefined) o.life = s.life; 
                game.addEntity(o); 
            });

            state.structures.forEach(s => { 
                let o = new Structure(s.x, s.y, s.team, s.type); 
                o.hp = s.hp; o.isConstructing = s.isConstructing; o.buildProgress = s.buildProgress;
                o.territory = s.territory; o.originalTerritory = s.originalTerritory;
                if (s.cooldown !== undefined) o.cooldown = s.cooldown;
                if(o.isConstructing) o.isPaused = true;
                game.addEntity(o); 
            });
            
            state.resourceNodes.forEach(p => { let o = new ResourceNode(p.x, p.y, p.type); o.resources = p.resources; game.addEntity(o); });
            state.queens.forEach(q => { let o = new Queen(q.x, q.y, q.team); o.hp = q.hp; game.addEntity(o); });
            
            if (state.critters) {
                state.critters.forEach(c => { 
                    let o = c.type === 'GoldenBug' ? new GoldenBug(c.x, c.y) : new Aphid(c.x, c.y);
                    o.hp = c.hp; o.color = c.color;
                    game.addEntity(o); 
                });
            }
            if (state.bosses) {
                state.bosses.forEach(b => {
                    let o = new CentipedeBoss(b.x, b.y);
                    o.hp = b.hp;
                    game.addEntity(o);
                });
            }
            if (state.hazards) {
                state.hazards.forEach(h => {
                    let f = new VenusFlytrap(h.x, h.y);
                    f.hp = h.hp; f.cooldown = h.cooldown;
                    game.addEntity(f);
                });
            }
            if (state.controlPoints) {
                state.controlPoints.forEach(c => {
                    let o = new JackOLantern(c.x, c.y);
                    o.controllingTeam = c.team; o.captureProgress = c.prog;
                    game.addEntity(o);
                });
            }
            if (state.corpses) {
                state.corpses.forEach(c => {
                    let o = new Corpse(c.x, c.y);
                    o.life = c.life;
                    game.addEntity(o);
                });
            }
            if (state.eggTraps) {
                state.eggTraps.forEach(t => {
                    let o = new EggTrap(t.x, t.y, t.team);
                    o.hp = t.hp;
                    game.addEntity(o);
                });
            }
            
            console.log("Game Successfully Loaded!");
        };

        // Listen for the custom event fired by the Main Menu
        game.bus.on('triggerLoadGame', performLoad);

        // Keep keyboard shortcuts for rapid saving/loading during gameplay
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'o') {
                const state = {
                    eco: game.eco, pop: game.pop, maxPop: game.maxPop, techLevel: game.techLevel, camera: game.camera, tick: game.tick,
                    
                    // --- FIX A: SERIALIZE MAP GRID & DECOR ---
                    mapGrid: game.mapGrid.map(row => row.map(tile => ({
                        type: tile.type, sprite: tile.sprite, angle: tile.angle, 
                        discovered: tile.discovered, visible: tile.visible
                    }))),
                    
                    // We must map Decor to remove the raw Image Element (d.sprite), otherwise JSON.stringify crashes
                    decor: game.decor ? game.decor.map(d => ({
                        x: d.x, y: d.y, type: d.type, size: d.size, angle: d.angle, alpha: d.alpha
                    })) : [],
                    
                    spiders: game.spiders.map(s => ({
                        x: s.x, y: s.y, team: s.team, role: s.role, hp: s.hp, cargo: s.cargo, 
                        isZombie: s.isZombie, isCloaked: s.isCloaked, cloakCooldown: s.cloakCooldown,
                        life: s.life
                    })),
                    
                    structures: game.structures.map(s => ({
                        x: s.x, y: s.y, team: s.team, type: s.type, hp: s.hp,
                        isConstructing: s.isConstructing, buildProgress: s.buildProgress,
                        territory: s.territory, originalTerritory: s.originalTerritory,
                        cooldown: s.cooldown
                    })),
                    
                    resourceNodes: game.resourceNodes.map(p => ({x: p.x, y: p.y, type: p.type, resources: p.resources})),
                    queens: game.queens.map(q => ({x: q.x, y: q.y, team: q.team, hp: q.hp})),
                    critters: game.critters.map(b => ({x: b.x, y: b.y, hp: b.hp, color: b.color, type: b.constructor.name})),
                    bosses: game.bosses.map(b => ({x: b.x, y: b.y, hp: b.hp})),
                    hazards: game.entities.filter(e => e instanceof VenusFlytrap).map(f => ({x: f.x, y: f.y, hp: f.hp, cooldown: f.cooldown})),
                    controlPoints: game.entities.filter(e => e instanceof JackOLantern).map(c => ({x: c.x, y: c.y, team: c.controllingTeam, prog: c.captureProgress})),
                    corpses: game.entities.filter(e => e instanceof Corpse).map(c => ({x: c.x, y: c.y, life: c.life})),
                    eggTraps: game.entities.filter(e => e instanceof EggTrap).map(t => ({x: t.x, y: t.y, team: t.team, hp: t.hp}))
                };
                localStorage.setItem('spiderRTS_saveData', JSON.stringify(state)); 
                
                // Fancy in-game notification instead of a blocking alert
                game.bus.emit('particles', {x: game.camera.x + game.canvas.width/2, y: game.camera.y + game.canvas.height/2, color: '#00ff00', count: 50});
                console.log("Game Saved!");
            }
            if (e.key.toLowerCase() === 'p') {
                performLoad();
            }
        });
    }
};
