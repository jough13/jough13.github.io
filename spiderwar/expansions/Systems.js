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
import { ExplosiveProjectile } from './Titans.js'; 
import { MortarShell } from './Fortress.js';       

// ==========================================
// 1. CONFIGURATION
// ==========================================
// [EXPANDABILITY] Exported so other mods can tweak visual atmosphere
export const SYSTEM_CONFIG = {
    fowBlur: 'blur(30px)',
    // RGB for "discovered but out of sight" fog (Deep purple/blue)
    fowTintR: 15,
    fowTintG: 5,
    fowTintB: 30,
    fowTintAlpha: 160 // out of 255
};

// ==========================================
// 2. ATMOSPHERE & LIGHTING
// ==========================================
export const AtmosphereExpansion = {
    patch: (game) => {
        game.bus.on('atmosphereDraw', (ctx) => {
            // SAFETY FIX: Prevent overlapping darkness if DayNight expansion is also active
            if (game.isNight !== undefined && game.dayTime > 0.4) return;
            
            const cycle = Math.sin(game.tick / 1800); 
            const darkness = Math.max(0, cycle * 0.6); 
            
            // JUICE: Dynamic breathing vignette instead of a flat color fill
            const viewCenterX = game.camera.x + (game.canvas.width / 2);
            const viewCenterY = game.camera.y + (game.canvas.height / 2);
            
            let grad = ctx.createRadialGradient(viewCenterX, viewCenterY, game.canvas.height * 0.2, viewCenterX, viewCenterY, game.canvas.width);
            grad.addColorStop(0, `rgba(5, 10, 35, ${Math.max(0, darkness - 0.2)})`); 
            grad.addColorStop(1, `rgba(5, 10, 35, ${darkness + 0.2})`);
            
            ctx.fillStyle = grad; 
            ctx.fillRect(game.camera.x, game.camera.y, game.canvas.width, game.canvas.height);
        });

        // Pulsing glow effects for bases during the night cycle
        // [FIX] Signature updated to accept gameObj
        game.expansions.patchClass(Structure, 'draw', function(original, ctx, gameObj) {
            const tick = gameObj ? gameObj.tick : 0;
            const cycle = Math.sin(tick / 1800);
            
            if (cycle > 0 && (this.type === 'nest' || this.type === 'turret') && !this.isConstructing) { 
                ctx.save();
                ctx.shadowBlur = 30 * cycle; 
                ctx.shadowColor = this.team === 'black' ? '#aa00ff' : '#ff3300'; 
                original.call(this, ctx, gameObj); 
                ctx.restore();
            } else {
                original.call(this, ctx, gameObj);
            }
        });

        game.expansions.patchClass(Queen, 'draw', function(original, ctx, gameObj) {
            const tick = gameObj ? gameObj.tick : 0;
            const cycle = Math.sin(tick / 1800);
            
            if (cycle > 0) { 
                ctx.save();
                ctx.shadowBlur = 40 * cycle; 
                ctx.shadowColor = this.team === 'black' ? '#ffffff' : '#ff0000'; 
                original.call(this, ctx, gameObj); 
                ctx.restore();
            } else {
                original.call(this, ctx, gameObj); 
            }
        });
    }
}

// ==========================================
// 3. FOG OF WAR
// ==========================================
export const FogOfWarExpansion = {
    init: (game) => {
        game.systemConfig = SYSTEM_CONFIG;
    },
    
    patch: (game) => {
        game.expansions.patchClass(Game, 'update', function(original) {
            original.call(this);
            if (!this.mapGrid) return;

            if (!this.fowCanvas) {
                this.fowCanvas = document.createElement('canvas');
                this.fowCanvas.width = this.mapGrid[0].length;
                this.fowCanvas.height = this.mapGrid.length;
                this.fowCtx = this.fowCanvas.getContext('2d', { willReadFrequently: true });
            }

            // PERFORMANCE FIX: Update Fog every 10 frames instead of 5, completely unnoticeable visually.
            if (this.tick % 10 === 0) {
                const w = this.fowCanvas.width;
                const h = this.fowCanvas.height;
                const tileSize = this.tileSize || 256; 

                // 1. Reset Visibility
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        this.mapGrid[y][x].visible = false; 
                    }
                }

                // 2. Calculate newly revealed tiles (OPTIMIZED MATH)
                const reveal = (worldX, worldY, radiusTiles) => {
                    const tX = (worldX / tileSize) | 0;
                    const tY = (worldY / tileSize) | 0;
                    const rSq = radiusTiles * radiusTiles;
                    
                    const startY = Math.max(0, tY - radiusTiles);
                    const endY = Math.min(h - 1, tY + radiusTiles);
                    const startX = Math.max(0, tX - radiusTiles);
                    const endX = Math.min(w - 1, tX + radiusTiles);

                    for (let y = startY; y <= endY; y++) {
                        const dySq = (y - tY) * (y - tY);
                        for (let x = startX; x <= endX; x++) {
                            // PERFORMANCE FIX: Cached dySq outside inner loop
                            if (dySq + ((x - tX) * (x - tX)) <= rSq) {
                                this.mapGrid[y][x].visible = true;
                                this.mapGrid[y][x].discovered = true;
                            }
                        }
                    }
                };

                // PERFORMANCE FIX: Single loop for all friendly units instead of multiple .filter().forEach() calls
                for (let i = 0; i < this.entities.length; i++) {
                    let e = this.entities[i];
                    if (e.team === 'black' && e.hp > 0) {
                        if (e instanceof Spider) {
                            reveal(e.x, e.y, e.role === 'queen' ? 3 : 2);
                        } else if (e instanceof Structure && !e.isConstructing) {
                            let r = e.type === 'nest' ? 4 : (e.type === 'mortar' ? 4 : (e.type === 'pylon' ? 3 : 2));
                            reveal(e.x, e.y, r);
                        }
                    }
                }

                // 3. Render directly to ImageData buffer (MASSIVE PERFORMANCE UPGRADE over ctx.fillRect)
                const imgData = this.fowCtx.createImageData(w, h);
                const data = imgData.data;

                let index = 0;
                const cfg = game.systemConfig;
                
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const tile = this.mapGrid[y][x];
                        
                        if (!tile.discovered) {
                            // Pitch Black
                            data[index] = 0; data[index+1] = 0; data[index+2] = 0; data[index+3] = 255;
                        } else if (!tile.visible) {
                            // [JUICE] Deep, moody purple/blue tint for discovered but unlit areas
                            data[index] = cfg.fowTintR; 
                            data[index+1] = cfg.fowTintG; 
                            data[index+2] = cfg.fowTintB; 
                            data[index+3] = cfg.fowTintAlpha; 
                        } else {
                            // Fully Transparent
                            data[index] = 0; data[index+1] = 0; data[index+2] = 0; data[index+3] = 0;   
                        }
                        
                        index += 4;
                    }
                }
                this.fowCtx.putImageData(imgData, 0, 0);
            }
        });

        // Hooks visibility logic directly into the base drawing routines of all classes
        // [FIX] Updated to pass down gameObj for animations
        const applyFoWToClass = (ClassRef, hideIfInvisible, hideIfUndiscovered) => {
            game.expansions.patchClass(ClassRef, 'draw', function(original, ctx, gameObj) {
                if (game.mapGrid) {
                    const tileSize = game.tileSize || 256;
                    const tX = (this.x / tileSize) | 0; 
                    const tY = (this.y / tileSize) | 0;
                    const tile = game.mapGrid[tY] && game.mapGrid[tY][tX];
                    if (tile) {
                        if (hideIfUndiscovered && !tile.discovered) return;
                        if (hideIfInvisible && !tile.visible && this.team !== 'black') return;
                    }
                }
                original.call(this, ctx, gameObj);
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
        
        applyFoWToClass(ExplosiveProjectile, true, false);
        applyFoWToClass(MortarShell, true, false);

        // Blurs the blocky 1x1 tile mask to create a beautiful smooth shadow
        game.bus.on('postDraw', (ctx) => {
            if (!game.fowCanvas) return;
            ctx.save();
            ctx.filter = game.systemConfig.fowBlur; 
            ctx.drawImage(
                game.fowCanvas, 
                0, 0, 
                game.fowCanvas.width * (game.tileSize || 256), 
                game.fowCanvas.height * (game.tileSize || 256)
            );
            ctx.restore();
        });
    }
};

// ==========================================
// 4. SAVE & LOAD SYSTEM
// ==========================================
export const SaveLoadExpansion = {
    init: (game) => {
        // [JUICE] Add an elegant system message UI for saving/loading instead of ugly browser alerts
        game.showSystemMessage = (msg, color) => {
            const el = document.createElement('div');
            el.innerText = msg;
            el.style.cssText = `
                position: fixed; top: 15%; left: 50%; transform: translateX(-50%);
                color: ${color}; font-family: 'Courier New', monospace; font-size: 2rem; font-weight: bold;
                z-index: 9999; text-shadow: 0 0 15px ${color}, 2px 2px 0 #000;
                pointer-events: none; transition: opacity 1.5s ease-in, top 1.5s ease-out;
            `;
            document.body.appendChild(el);
            
            // Force reflow then animate up and fade out
            void el.offsetWidth; 
            setTimeout(() => { el.style.opacity = '0'; el.style.top = '10%'; }, 500);
            setTimeout(() => el.remove(), 2000);
        };
    },
    
    patch: (game) => {
        
        const performLoad = () => {
            const data = localStorage.getItem('spiderRTS_saveData'); 
            if(!data) {
                game.showSystemMessage("NO SAVE DATA FOUND", "#ff0000");
                game.bus.emit('playSound', 'error');
                return;
            }
            
            const state = JSON.parse(data);
            game.eco = state.eco; game.pop = state.pop; game.maxPop = state.maxPop; 
            game.techLevel = state.techLevel; game.camera = state.camera; game.tick = state.tick || 0;
            
            if (state.mapGrid) {
                game.mapGrid = state.mapGrid;
                if (game.updateBitmasks) game.updateBitmasks();
            }

            // Restore Decor Chunks
            if (state.decor) {
                game.decor = state.decor;
                game.decorInitialized = true; 
                game.decorChunks = new Map(); 
                const CHUNK_SIZE = 500; 
                
                game.decor.forEach(d => {
                    if (game.assets) d.sprite = game.assets.get(d.src);

                    const chunkKey = ((d.x / CHUNK_SIZE) | 0) << 16 | ((d.y / CHUNK_SIZE) | 0);
                    let chunk = game.decorChunks.get(chunkKey);
                    if (!chunk) { chunk = []; game.decorChunks.set(chunkKey, chunk); }
                    chunk.push(d);
                });
            }

            game.entities = []; 
            
            // 🚀 [LOGIC FIX] 1. Restore Structures first so we can link Queens to them!
            const structMap = {}; 
            state.structures.forEach(s => { 
                let o = new Structure(s.x, s.y, s.team, s.type); 
                o.id = s.id || Math.random().toString(36).substring(2, 11);
                o.hp = s.hp; o.isConstructing = s.isConstructing; o.buildProgress = s.buildProgress;
                o.territory = s.territory; o.originalTerritory = s.originalTerritory;
                if (s.cooldown !== undefined) o.cooldown = s.cooldown;
                if (o.isConstructing) o.isPaused = true; // Safe default
                
                structMap[o.id] = o;
                game.addEntity(o); 
            });

            // 🚀 [LOGIC FIX] 2. Shared Unit State Restorer
            const restoreUnitState = (o, s) => {
                if (s.id) o.id = s.id;
                o.hp = s.hp; 
                if (s.cargo) o.cargo = s.cargo; 
                if (s.life !== undefined) o.life = s.life; 
                
                // Restore Commands & Targets
                if (s.commandTarget) {
                    o.commandTarget = s.commandTarget;
                    o.isManual = true; // Ensure they keep following the order!
                }
                if (s.buildTarget) o.buildTarget = s.buildTarget;
                
                // Restore Active Construction link by searching the structMap we just built
                if (s.activeConstructionId && structMap[s.activeConstructionId]) {
                    o.activeConstruction = structMap[s.activeConstructionId];
                    o.activeConstruction.isPaused = false; // Queen remembers she was building it
                }
                
                // Restore Status effects
                if (s.stunTimer) o.stunTimer = s.stunTimer;
                if (s.infectedTimer) { o.infectedTimer = s.infectedTimer; o.infectedByTeam = s.infectedByTeam; }
                if (s.bloodlustTimer) o.bloodlustTimer = s.bloodlustTimer;
            };
            
            state.spiders.forEach(s => { 
                let o;
                if (s.isZombie) { 
                    o = new ZombieSpider(s.x, s.y, s.team, s.size); 
                } else if (s.role === 'broodling') {
                    o = new Broodling(s.x, s.y, s.team);
                } else {
                    o = new Spider(s.x, s.y, s.team, s.role);
                    
                    if (s.role === 'spitter') { 
                        o.range = 250; o.rangeSq = 62500; 
                        if (game.assets) o.sprite = game.assets.get(s.team === 'black' ? 'assets/spitter_black.png' : 'assets/spitter_red.png');
                        o.imageLoaded = true;
                    } 
                    else if (s.role === 'tarantula') {
                        if (game.assets) o.sprite = game.assets.get(s.team === 'black' ? 'assets/tarantula_black.png' : 'assets/tarantula_red.png');
                        o.imageLoaded = true;
                    } 
                    else if (s.role === 'widow') { 
                        o.isCloaked = s.isCloaked; 
                        o.cloakCooldown = s.cloakCooldown; 
                        if (game.assets) o.sprite = game.assets.get(s.team === 'black' ? 'assets/widow_black.png' : 'assets/widow_red.png');
                        o.imageLoaded = true;
                    } 
                    else if (s.role === 'goliath') {
                        o.range = 300; o.rangeSq = 90000;
                        if (game.assets) o.sprite = game.assets.get(s.team === 'black' ? 'assets/goliath_black.png' : 'assets/goliath_red.png');
                        o.imageLoaded = true;
                    }
                }
                
                restoreUnitState(o, s);
                game.addEntity(o); 
            });

            state.queens.forEach(q => { 
                let o = new Queen(q.x, q.y, q.team); 
                restoreUnitState(o, q);
                game.addEntity(o); 
            });
            
            state.resourceNodes.forEach(p => { 
                let o = new ResourceNode(p.x, p.y, p.type); 
                if (p.id) o.id = p.id;
                o.resources = p.resources; 
                game.addEntity(o); 
            });
            
            if (state.critters) {
                state.critters.forEach(c => { 
                    let o = c.type === 'GoldenBug' ? new GoldenBug(c.x, c.y) : new Aphid(c.x, c.y);
                    if (c.id) o.id = c.id;
                    o.hp = c.hp; o.color = c.color;
                    game.addEntity(o); 
                });
            }
            if (state.bosses) {
                state.bosses.forEach(b => {
                    let o = new CentipedeBoss(b.x, b.y);
                    if (b.id) o.id = b.id;
                    o.hp = b.hp;
                    game.addEntity(o);
                });
            }
            if (state.hazards) {
                state.hazards.forEach(h => {
                    let f = new VenusFlytrap(h.x, h.y);
                    if (h.id) f.id = h.id;
                    f.hp = h.hp; f.cooldown = h.cooldown;
                    game.addEntity(f);
                });
            }
            if (state.controlPoints) {
                state.controlPoints.forEach(c => {
                    let o = new JackOLantern(c.x, c.y);
                    if (c.id) o.id = c.id;
                    o.controllingTeam = c.team; o.captureProgress = c.prog;
                    game.addEntity(o);
                });
            }
            if (state.corpses) {
                state.corpses.forEach(c => {
                    let o = new Corpse(c.x, c.y, c.size);
                    if (c.id) o.id = c.id;
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
            
            game.showSystemMessage("GAME LOADED", "#00aaff");
            game.bus.emit('playSound', 'spell');
            console.log("Game Successfully Loaded!");
        };

        game.bus.on('triggerLoadGame', performLoad);

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'o') {
                
                // PERFORMANCE FIX: One single pass over the entities array to serialize everything!
                const spiders = []; const structures = []; const resNodes = []; const queens = [];
                const critters = []; const bosses = []; const hazards = []; const cps = [];
                const corpses = []; const eggTraps = [];

                // 🚀 [LOGIC FIX] Shared Unit Serialization
                const saveUnitState = (u) => {
                    const data = { 
                        id: u.id, x: u.x, y: u.y, team: u.team, role: u.role, 
                        hp: u.hp, cargo: u.cargo, size: u.size 
                    };
                    
                    if (u.commandTarget) data.commandTarget = u.commandTarget;
                    if (u.buildTarget) data.buildTarget = u.buildTarget;
                    
                    // Safely store a reference ID to the active structure so we avoid JSON circular errors
                    if (u.activeConstruction) {
                        if (!u.activeConstruction.id) u.activeConstruction.id = Math.random().toString(36).substring(2, 11);
                        data.activeConstructionId = u.activeConstruction.id;
                    }
                    
                    // Status effects
                    if (u.stunTimer) data.stunTimer = u.stunTimer;
                    if (u.infectedTimer) { data.infectedTimer = u.infectedTimer; data.infectedByTeam = u.infectedByTeam; }
                    if (u.bloodlustTimer) data.bloodlustTimer = u.bloodlustTimer;
                    
                    if (u.isZombie) data.isZombie = true;
                    if (u.isCloaked !== undefined) { data.isCloaked = u.isCloaked; data.cloakCooldown = u.cloakCooldown; }
                    if (u.life !== undefined) data.life = u.life;
                    
                    return data;
                };

                for (let i = 0; i < game.entities.length; i++) {
                    let u = game.entities[i];
                    
                    if (u instanceof Spider && u.role !== 'queen') spiders.push(saveUnitState(u));
                    else if (u instanceof Queen) queens.push(saveUnitState(u));
                    else if (u instanceof Structure) {
                        // Ensure it has an ID before saving so Queens can link to it
                        if (!u.id) u.id = Math.random().toString(36).substring(2, 11);
                        
                        structures.push({
                            id: u.id, x: u.x, y: u.y, team: u.team, type: u.type, hp: u.hp,
                            isConstructing: u.isConstructing, buildProgress: u.buildProgress,
                            territory: u.territory, originalTerritory: u.originalTerritory, cooldown: u.cooldown
                        });
                    }
                    else if (u instanceof ResourceNode) resNodes.push({id: u.id, x: u.x, y: u.y, type: u.type, resources: u.resources});
                    else if (u.team === 'nature' && u.constructor.name !== 'CentipedeBoss') critters.push({id: u.id, x: u.x, y: u.y, hp: u.hp, color: u.color, type: u.type || u.constructor.name});
                    else if (u.constructor.name === 'CentipedeBoss') bosses.push({id: u.id, x: u.x, y: u.y, hp: u.hp});
                    else if (u instanceof VenusFlytrap) hazards.push({id: u.id, x: u.x, y: u.y, hp: u.hp, cooldown: u.cooldown});
                    else if (u instanceof JackOLantern) cps.push({id: u.id, x: u.x, y: u.y, team: u.controllingTeam, prog: u.captureProgress});
                    else if (u instanceof Corpse) corpses.push({id: u.id, x: u.x, y: u.y, life: u.life, size: u.size});
                    else if (u instanceof EggTrap) eggTraps.push({x: u.x, y: u.y, team: u.team, hp: u.hp});
                }

                const state = {
                    eco: game.eco, pop: game.pop, maxPop: game.maxPop, techLevel: game.techLevel, camera: game.camera, tick: game.tick,
                    
                    mapGrid: game.mapGrid.map(row => row.map(tile => ({
                        type: tile.type, sprite: tile.sprite, angle: tile.angle, 
                        discovered: tile.discovered, visible: tile.visible
                    }))),
                    
                    decor: game.decor ? game.decor.map(d => ({
                        x: d.x, y: d.y, type: d.type, size: d.size, renderSize: d.renderSize, 
                        angle: d.angle, alpha: d.alpha, fallbackColor: d.fallbackColor, 
                        src: d.sprite ? 'assets/' + d.sprite.src.split('/').pop() : null
                    })) : [],
                    
                    spiders: spiders, structures: structures, resourceNodes: resNodes, queens: queens,
                    critters: critters, bosses: bosses, hazards: hazards, controlPoints: cps, corpses: corpses, eggTraps: eggTraps
                };
                
                localStorage.setItem('spiderRTS_saveData', JSON.stringify(state)); 
                
                game.showSystemMessage("GAME SAVED", "#00ff00");
                game.bus.emit('playSound', 'ping');
                console.log("Game Saved!");
            }
            if (e.key.toLowerCase() === 'p') {
                performLoad();
            }
        });
    }
};
