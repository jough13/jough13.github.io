// ==========================================
// 1. CORE ARCHITECTURE & UTILITIES
// ==========================================
export const MathUtils = {
    TWO_PI: Math.PI * 2, // Cached for massive rendering performance
    // Optimized: Direct multiplication is vastly faster than the ** exponent operator in JS
    distSq: (x1, y1, x2, y2) => { const dx = x2 - x1; const dy = y2 - y1; return (dx * dx) + (dy * dy); },
    dist: (x1, y1, x2, y2) => { const dx = x2 - x1; const dy = y2 - y1; return Math.sqrt((dx * dx) + (dy * dy)); },
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    lerp: (start, end, amt) => (1 - amt) * start + amt * end,
    randomRange: (min, max) => Math.random() * (max - min) + min,
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
};

export class GameBus {
    constructor() { this.listeners = {}; }
    on(event, callback) { 
        if (!this.listeners[event]) this.listeners[event] = []; 
        this.listeners[event].push(callback); 
    }
    emit(event, data) { 
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try { cb(data); } 
                catch (err) { console.error(`[GameBus] Error in event '${event}':`, err); }
            });
        }
    }
}

export class AssetManager {
    constructor() {
        this.queue = new Set(); 
        this.cache = {};        
    }
    register(src) { this.queue.add(src); }
    get(src) { return this.cache[src]; }
}

export class ExpansionManager {
    constructor(game) { this.game = game; this.expansions = {}; }
    load(name, expansion) {
        console.log(`%c[Plugin Loaded] ${name}`, 'color: #00aaff;');
        this.expansions[name] = expansion;
        if (expansion.init) expansion.init(this.game);
        if (expansion.patch) expansion.patch(this.game);
    }
    patchClass(TargetClass, methodName, newMethod) {
        const originalMethod = TargetClass.prototype[methodName];
        TargetClass.prototype[methodName] = function(...args) {
            // GC LEAK FIX: Removed .bind(this) which created a new function in memory every frame.
            // Raw method is safely passed down, expansions handle `.call(this)` natively!
            return newMethod.call(this, originalMethod, ...args);
        };
    }
}

// ==========================================
// 2. GAME ENTITIES & DATA DICTIONARIES
// ==========================================

export const SPIDER_STATE = {
    IDLE: 0,
    COMBAT: 1,
    SEEKING_RESOURCE: 2,
    RETURNING_HOME: 3
};

// --- PILLAR 3: THE TRAIT DICTIONARY ---
export const UNIT_DATA = {
    harvester: { size: 12, hp: 100, damage: 15, attackSpeed: 30, baseSpeedMin: 0.8, baseSpeedMax: 1.8, traits: ['gatherer'] },
    soldier:   { size: 16, hp: 200, damage: 30, attackSpeed: 20, baseSpeedMin: 1.2, baseSpeedMax: 2.2, traits: ['melee', 'escort'] }
};

export const STRUCTURE_DATA = {
    nest:   { hp: 200, size: 40, territory: 400 },
    eggsac: { hp: 200, size: 25, territory: 0 },
    turret: { hp: 200, size: 20, territory: 0 },
    wall:   { hp: 500, size: 35, territory: 0 },
    pylon:  { hp: 200, size: 18, territory: 250 }
};

export class Spider {
    constructor(x, y, team, role = 'harvester') {
        this.x = x; this.y = y; this.team = team; this.role = role;
        
        const stats = UNIT_DATA[role] || UNIT_DATA['harvester'];
        
        this.size = stats.size;
        this.baseSpeed = MathUtils.randomRange(stats.baseSpeedMin, stats.baseSpeedMax);
        this.speed = this.baseSpeed; 
        this.hp = stats.hp; this.maxHp = this.hp;
        this.damage = stats.damage; this.attackSpeed = stats.attackSpeed;
        
        // EXPANDABILITY: Cloned array protects the global config from accidental mutation
        this.traits = stats.traits ? [...stats.traits] : [];
        
        this.cooldown = 0; this.angle = 0; this.state = SPIDER_STATE.IDLE; this.target = null; 
        this.cargo = { amount: 0, type: null };
        this.isCloaked = false; 
        
        this.sprite = new Image();
        if (role === 'soldier') this.sprite.src = team === 'black' ? 'assets/soldier_black.png' : 'assets/soldier_red.png';
        else this.sprite.src = team === 'black' ? 'assets/black_spider.png' : 'assets/red_spider.png';
        
        this.imageLoaded = false; this.sprite.onload = () => { this.imageLoaded = true; };
    }
    
    hasTrait(traitName) {
        return this.traits.includes(traitName);
    }
    
    update(game) { }
    
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); 
        if (this.imageLoaded || (this.sprite && this.sprite.complete && this.sprite.naturalHeight !== 0)) { 
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size * 2, this.size * 2); 
        } else {
            ctx.fillStyle = this.team; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillRect(this.size/2, -3, 4, 6);
            if(this.role === 'soldier') { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, MathUtils.TWO_PI); ctx.fill(); }
        }
        if (this.cargo.amount > 0) { 
            ctx.fillStyle = this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff'; 
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, MathUtils.TWO_PI); ctx.fill(); 
        }
        ctx.restore();
    }
}

export class ResourceNode {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; 
        this.size = type === 'pumpkin' ? 25 : 15; 
        this.resources = type === 'pumpkin' ? 100 : 50; 
        this.sprite = new Image(); 
        this.sprite.src = type === 'pumpkin' ? 'assets/pumpkin.png' : 'assets/dewdrop.png';
        this.imageLoaded = false; this.sprite.onload = () => { this.imageLoaded = true; };
    }
    draw(ctx) {
        if (this.resources <= 0) return; 
        ctx.save(); ctx.translate(this.x, this.y);
        const maxRes = this.type === 'pumpkin' ? 100 : 50;
        const scale = Math.max(0.4, this.resources / maxRes); ctx.scale(scale, scale);
        
        if (this.imageLoaded) { 
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size * 2, this.size * 2); 
        } else { 
            ctx.fillStyle = this.type === 'pumpkin' ? '#ff7b00' : '#00aaff'; 
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, MathUtils.TWO_PI); ctx.fill(); 
        }
        ctx.restore();
    }
}

export class Structure {
    constructor(x, y, team, type) {
        this.x = x; this.y = y; this.team = team; this.type = type;
        
        const stats = STRUCTURE_DATA[type] || { hp: 200, size: 25, territory: 0 };
        this.hp = stats.hp; this.maxHp = this.hp;
        this.size = stats.size;
        this.territory = stats.territory;
        
        if(type === 'turret') this.cooldown = 0; 

        this.sprite = new Image(); this.sprite.src = `assets/${type}_${team}.png`;
        this.spriteLoaded = false; this.sprite.onload = () => { this.spriteLoaded = true; };
    }
    update(game) {} 
    draw(ctx) {
        if(this.spriteLoaded) { 
            ctx.drawImage(this.sprite, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2); 
        } else {
            ctx.fillStyle = this.team === 'black' ? '#222' : '#500';
            if(this.type === 'nest') { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, MathUtils.TWO_PI); ctx.fill(); }
            else if(this.type === 'eggsac') { ctx.beginPath(); ctx.ellipse(this.x, this.y, this.size, this.size-10, 0, 0, MathUtils.TWO_PI); ctx.fill(); }
            else if(this.type === 'turret') { ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2); ctx.fillStyle='purple'; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, MathUtils.TWO_PI); ctx.fill(); }
            else if(this.type === 'wall') { ctx.fillRect(this.x - this.size, this.y - 10, this.size * 2, 20); }
            else if(this.type === 'pylon') { ctx.beginPath(); ctx.moveTo(this.x, this.y - this.size); ctx.lineTo(this.x - this.size, this.y + this.size); ctx.lineTo(this.x + this.size, this.y + this.size); ctx.fill(); }
            ctx.strokeStyle = this.team; ctx.lineWidth = 2; ctx.stroke();
        }
    }
}

export class Projectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; this.target = target; this.damage = damage; this.team = team;
        this.speed = 5; this.active = true;
    }
    update(game) {
        if(!this.target || this.target.hp === undefined || this.target.hp <= 0) { this.active = false; return; }
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const distSq = MathUtils.distSq(this.x, this.y, this.target.x, this.target.y);
        
        if (distSq < 100) { 
            this.target.hp -= this.damage; this.active = false; 
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: this.team==='black'?'#aa00ff':'#ffaa00', count: 10});
        } else {
            const dist = Math.sqrt(distSq);
            if (dist > 0) { // Safety to prevent NaN interpolation
                this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; 
            }
        }
    }
    draw(ctx) { 
        ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ffaa00'; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, MathUtils.TWO_PI); ctx.fill(); 
    }
}

// ==========================================
// 3. MAIN GAME CLASS 
// ==========================================
export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas'); 
        this.ctx = this.canvas.getContext('2d', { alpha: false }); 

        this.ctx.imageSmoothingEnabled = false; 

        this.bus = new GameBus(); 
        this.expansions = new ExpansionManager(this);
        this.assets = new AssetManager();
        
        const baseAssets = [
            'assets/soldier_black.png', 'assets/soldier_red.png', 'assets/black_spider.png', 'assets/red_spider.png',
            'assets/pumpkin.png', 'assets/dewdrop.png', 'assets/ui_frame.png',
            'assets/nest_black.png', 'assets/nest_red.png', 'assets/eggsac_black.png', 'assets/eggsac_red.png',
            'assets/turret_black.png', 'assets/turret_red.png', 'assets/wall_black.png', 'assets/wall_red.png',
            'assets/pylon_black.png', 'assets/pylon_red.png'
        ];
        baseAssets.forEach(src => this.assets.register(src));
        
        this.world = { width: 6000, height: 6000 }; 
        this.camera = { x: 0, y: 0 }; this.tick = 0; 
        
        this.entities = [];
        this.decor = []; 
        this.spatialGrid = new Map(); 
        
        this.eco = { black: { pumpkins: 600, dew: 100 }, red: { pumpkins: 600, dew: 100 } }; 
        this.pop = { black: 0, red: 0 }; 
        this.maxPop = { black: 10, red: 10 };
        this.techLevel = { black: 0, red: 0 }; 
        
        this.activeTool = 'select'; this.gameState = 'playing'; this.selectedStructure = null; 

        this.resize(); window.addEventListener('resize', () => this.resize());
        this.setupInputs(); 
        requestAnimationFrame(() => this.loop());
    }

    get spiders() { return this.entities.filter(e => e.role && e.cargo !== undefined); }
    get queens() { return this.entities.filter(e => e.constructor.name === 'Queen'); }
    get structures() { return this.entities.filter(e => e instanceof Structure); }
    get resourceNodes() { return this.entities.filter(e => e instanceof ResourceNode); }
    get projectiles() { return this.entities.filter(e => e instanceof Projectile); }
    get critters() { return this.entities.filter(e => e.team === 'nature'); }
    get bosses() { return this.entities.filter(e => e.constructor.name === 'CentipedeBoss'); }
    
    addEntity(entity) { this.entities.push(entity); }
    
    resize() { 
        this.canvas.width = window.innerWidth; 
        this.canvas.height = window.innerHeight; 
        // DOM REFOW FIX: Cache bounds once on resize so mousemove doesn't trigger layout thrashing
        this.canvasRect = this.canvas.getBoundingClientRect();
    }
    
    getTerrainAt(x, y) { return 'dirt'; } 

    checkTerritory(x, y, team) {
        return this.structures.some(s => s.team === team && s.territory > 0 && MathUtils.distSq(s.x, s.y, x, y) <= (s.territory * s.territory));
    }

    setupInputs() {
        this.keys = {};
        
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase(); this.keys[k] = true;
            if(k === 'escape') { this.activeTool = 'select'; this.bus.emit('toolChanged', 'select'); this.bus.emit('closeModal'); }
            if(k === 'u' && this.eco.black.pumpkins >= 250) { 
                this.eco.black.pumpkins -= 250; this.techLevel.black++; this.bus.emit('playSound', 'spell');
            }
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        let isDragging = false; let dragStartX, dragStartY, camStartX, camStartY, hasMoved;

        const getCanvasPos = (clientX, clientY) => {
            const rect = this.canvasRect || this.canvas.getBoundingClientRect();
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const startInteraction = (clientX, clientY) => {
            const pos = getCanvasPos(clientX, clientY);
            isDragging = true; hasMoved = false; dragStartX = pos.x; dragStartY = pos.y;
            camStartX = this.camera.x; camStartY = this.camera.y;
        };

        const moveInteraction = (clientX, clientY) => {
            if (isDragging && !this.isMinimapDragging) {
                const pos = getCanvasPos(clientX, clientY);
                let dx = pos.x - dragStartX; let dy = pos.y - dragStartY;
                if (MathUtils.distSq(0, 0, dx, dy) > 25) hasMoved = true; 
                if (hasMoved) { this.camera.x = camStartX - dx; this.camera.y = camStartY - dy; }
            }
        };

        const endInteraction = (clientX, clientY, targetElem) => {
            if (isDragging) {
                isDragging = false;
                if(targetElem && targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#mobileToolbar') || targetElem.closest('#rtsUI') || targetElem.closest('#gameOverModal'))) return;

                if (!hasMoved && !this.isMinimapDragging) {
                    const pos = getCanvasPos(clientX, clientY);
                    const worldX = pos.x + this.camera.x; const worldY = pos.y + this.camera.y;
                    
                    if (this.activeTool === 'commandQueen') {
                        this.bus.emit('commandQueen', { x: worldX, y: worldY, team: 'black' });
                        this.activeTool = 'select'; this.bus.emit('toolChanged', 'select'); 
                    }
                    else if (['venomStrike', 'silkTrap', 'reanimate', 'ambush'].includes(this.activeTool)) {
                        this.bus.emit('castSpell', { x: worldX, y: worldY, type: this.activeTool, team: 'black' });
                        this.activeTool = 'select'; this.bus.emit('toolChanged', 'select');
                    }
                    else if (['nest', 'eggsac', 'turret', 'wall', 'pylon'].includes(this.activeTool)) {
                        this.bus.emit('buildStructure', { x: worldX, y: worldY, team: 'black', type: this.activeTool });
                        if (!this.keys['shift']) { this.activeTool = 'select'; this.bus.emit('toolChanged', 'select'); }
                    }
                    else {
                        let clickedStruct = this.structures.find(s => s.team === 'black' && MathUtils.distSq(s.x, s.y, worldX, worldY) < (s.size * s.size));
                        this.selectedStructure = clickedStruct; 
                        if(clickedStruct) this.bus.emit('openModal', clickedStruct);
                        else this.bus.emit('closeModal'); 
                    }
                }
            }
        };

        this.canvas.addEventListener('mousedown', (e) => { if(e.button === 0 && !e.shiftKey) startInteraction(e.clientX, e.clientY); });
        window.addEventListener('mousemove', (e) => { moveInteraction(e.clientX, e.clientY); });
        window.addEventListener('mouseup', (e) => { if(e.button === 0) endInteraction(e.clientX, e.clientY, e.target); });
        this.canvas.addEventListener('touchstart', (e) => { if(e.touches.length === 1) startInteraction(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        window.addEventListener('touchmove', (e) => { if(e.touches.length === 1) moveInteraction(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        window.addEventListener('touchend', (e) => { if(e.changedTouches.length === 1) endInteraction(e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target); });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this.bus.on('spawnSpider', (data) => {
            if (data.role !== 'harvester' && data.role !== 'soldier') return; 
            const cost = data.role === 'soldier' ? 25 : 10;
            if (this.eco[data.team]?.pumpkins >= cost && this.pop[data.team] < this.maxPop[data.team]) {
                this.eco[data.team].pumpkins -= cost; 
                this.addEntity(new Spider(data.x + MathUtils.randomRange(-25, 25), data.y + MathUtils.randomRange(-25, 25), data.team, data.role));
                this.bus.emit('playSound', 'harvest'); 
            }
        });
        
        this.bus.on('buildStructure', (data) => {
            const costs = { 'nest': 150, 'eggsac': 50, 'turret': 100, 'wall': 25, 'pylon': 25 };
            if (!costs[data.type]) return; 
            
            if (data.team === 'black' && this.structures.some(s => s.team === 'black')) {
                if(!this.checkTerritory(data.x, data.y, data.team)) {
                    this.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
                    return; 
                }
            }

            if (this.eco[data.team]?.pumpkins >= costs[data.type]) {
                this.eco[data.team].pumpkins -= costs[data.type];
                this.addEntity(new Structure(data.x, data.y, data.team, data.type));
                this.bus.emit('playSound', 'build');
            }
        });
    }

    loop() { this.update(); this.draw(); requestAnimationFrame(() => this.loop()); }

    update() {
        if (this.gameState !== 'playing') return; 
        this.tick++;

        const camSpeed = 15;
        if (this.keys['w']) this.camera.y -= camSpeed; if (this.keys['s']) this.camera.y += camSpeed;
        if (this.keys['a']) this.camera.x -= camSpeed; if (this.keys['d']) this.camera.x += camSpeed;
        this.camera.x = MathUtils.clamp(this.camera.x, 0, this.world.width - this.canvas.width);
        this.camera.y = MathUtils.clamp(this.camera.y, 0, this.world.height - this.canvas.height);

        if (this.tick % 30 === 0) {
            let blackEggs = 0, redEggs = 0, blackPop = 0, redPop = 0;
            this.entities.forEach(e => {
                if (e instanceof Structure && e.type === 'eggsac') {
                    if (e.team === 'black') blackEggs++; else if (e.team === 'red') redEggs++;
                }
                if (e instanceof Spider && !e.hasTrait('queen')) {
                    if (e.team === 'black') blackPop++; else if (e.team === 'red') redPop++;
                }
            });
            this.maxPop.black = 10 + (blackEggs * 10);
            this.maxPop.red = 10 + (redEggs * 10);
            this.pop.black = blackPop;
            this.pop.red = redPop;
        }

        this.spatialGrid.clear();
        const CELL_SIZE = 250;

        let aliveCount = 0;
        let originalLength = this.entities.length;

        for (let i = 0; i < originalLength; i++) {
            let e = this.entities[i];
            let dead = false;
            
            if (e.hp !== undefined && e.hp <= 0) dead = true;
            else if (e.resources !== undefined && e.resources <= 0) dead = true;
            else if (e.active !== undefined && !e.active) dead = true;
            else if (e.life !== undefined && e.life <= 0) dead = true;

            if (dead) {
                if (e instanceof Spider || e instanceof Structure || e.constructor.name === 'CentipedeBoss' || e.team === 'nature') {
                    this.bus.emit('particles', {x: e.x, y: e.y, color: e.color || e.team || '#888', count: e.constructor.name === 'CentipedeBoss' ? 100 : 30});
                    this.bus.emit('playSound', e.team === 'nature' ? 'harvest' : 'death');
                }
                if (this.selectedStructure === e) { this.selectedStructure = null; this.bus.emit('closeModal'); }
                
            } else {
                if (e.update) e.update(this);
                this.entities[aliveCount] = e; 
                aliveCount++;
                
                // --- PILLAR 1: POPULATE SPATIAL GRID ---
                if (e.team) {
                    const cx = Math.floor(e.x / CELL_SIZE);
                    const cy = Math.floor(e.y / CELL_SIZE);
                    // MASSIVE PERFORMANCE FIX: Using bitwise integers for grid map keys entirely eliminates string GC thrashing!
                    const key = (cx << 16) | cy;
                    
                    let cell = this.spatialGrid.get(key);
                    if (!cell) { cell = []; this.spatialGrid.set(key, cell); }
                    cell.push(e);
                }
            }
        }

        let spawnedCount = this.entities.length - originalLength;
        for (let i = 0; i < spawnedCount; i++) {
            this.entities[aliveCount] = this.entities[originalLength + i];
            aliveCount++;
        }
        this.entities.length = aliveCount;
    }

    getNearestEnemy(x, y, team, maxDist) {
        const CELL_SIZE = 250;
        
        const minCx = Math.floor((x - maxDist) / CELL_SIZE);
        const maxCx = Math.floor((x + maxDist) / CELL_SIZE);
        const minCy = Math.floor((y - maxDist) / CELL_SIZE);
        const maxCy = Math.floor((y + maxDist) / CELL_SIZE);

        let nearest = null;
        let minDistSq = maxDist * maxDist;

        for (let cx = minCx; cx <= maxCx; cx++) {
            for (let cy = minCy; cy <= maxCy; cy++) {
                
                // GC FIX: Same integer-based lookup matches the new populator above.
                const key = (cx << 16) | cy;
                const cell = this.spatialGrid.get(key);
                if (!cell) continue; 

                for (let i = 0; i < cell.length; i++) {
                    let e = cell[i];
                    
                    if (!e.team || e.team === team || e.hp <= 0 || e.isCloaked || e instanceof Projectile) continue;
                    
                    let dSq = MathUtils.distSq(x, y, e.x, e.y);
                    
                    if (e.type === 'wall' && dSq < 62500) dSq = Math.max(0, dSq - 10000); 
                    
                    if (dSq < minDistSq) {
                        minDistSq = dSq;
                        nearest = e;
                    }
                }
            }
        }
        return nearest;
    }

    draw() {
        this.ctx.fillStyle = '#2c1e16'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save(); this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.bus.emit('preDraw', this.ctx); 
        this.bus.emit('territoryDraw', this.ctx); 
        this.bus.emit('atmosphereDraw', this.ctx);

        if(this.selectedStructure) {
            this.ctx.strokeStyle = '#ffffff'; this.ctx.lineWidth = 2; this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath(); this.ctx.arc(this.selectedStructure.x, this.selectedStructure.y, this.selectedStructure.size + 10, 0, MathUtils.TWO_PI);
            this.ctx.stroke(); this.ctx.setLineDash([]);
        }

        const padding = 150;
        const viewL = this.camera.x - padding;
        const viewR = this.camera.x + this.canvas.width + padding;
        const viewT = this.camera.y - padding;
        const viewB = this.camera.y + this.canvas.height + padding;

        let visibleEntities = [];
        for (let i = 0; i < this.entities.length; i++) {
            let e = this.entities[i];
            const renderSize = e.size || 0;
            if (e.draw && e.x + renderSize >= viewL && e.x - renderSize <= viewR && e.y + renderSize >= viewT && e.y - renderSize <= viewB) {
                visibleEntities.push(e);
            }
        }

        visibleEntities.sort((a, b) => a.y - b.y);
        for (let i = 0; i < visibleEntities.length; i++) {
            visibleEntities[i].draw(this.ctx);
        }
        
        this.bus.emit('postDraw', this.ctx);
        this.ctx.restore();
        this.bus.emit('uiDraw', this.ctx);
    }
}
