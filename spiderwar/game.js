// ==========================================
// 1. CORE ARCHITECTURE & UTILITIES
// ==========================================

const MathUtils = {
    // Squared distance is ~30% faster than Math.hypot because it avoids Square Roots
    distSq: (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2,
    dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
};

class GameBus {
    constructor() { this.listeners = {}; }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data)); }
}

class ExpansionManager {
    constructor(game) { this.game = game; this.expansions = {}; }
    load(name, expansion) {
        console.log(`[Plugin Loaded] ${name}`);
        this.expansions[name] = expansion;
        if (expansion.init) expansion.init(this.game);
        if (expansion.patch) expansion.patch(this.game);
    }
    // Helper to safely wrap class methods without losing the original scope
    patchClass(TargetClass, methodName, newMethod) {
        const originalMethod = TargetClass.prototype[methodName];
        TargetClass.prototype[methodName] = function(...args) {
            return newMethod.call(this, originalMethod.bind(this), ...args);
        };
    }
}

// ==========================================
// 2. GAME ENTITIES (BASE)
// ==========================================

class Spider {
    constructor(x, y, team, role = 'harvester') {
        this.x = x; this.y = y; this.team = team; this.role = role;
        this.size = role === 'soldier' ? 16 : 12;
        this.baseSpeed = role === 'soldier' ? (Math.random() * 1.0 + 1.2) : (Math.random() * 1.0 + 0.8);
        this.speed = this.baseSpeed; 
        this.hp = role === 'soldier' ? 200 : 100; this.maxHp = this.hp;
        this.damage = role === 'soldier' ? 30 : 15; this.attackSpeed = role === 'soldier' ? 20 : 30;
        this.cooldown = 0; this.angle = 0; this.state = 'idle'; this.target = null; 
        this.cargo = { amount: 0, type: null }; 
        
        this.sprite = new Image();
        if (role === 'soldier') this.sprite.src = team === 'black' ? 'assets/soldier_black.png' : 'assets/soldier_red.png';
        else this.sprite.src = team === 'black' ? 'assets/black_spider.png' : 'assets/red_spider.png';
        this.imageLoaded = false; this.sprite.onload = () => { this.imageLoaded = true; };
    }
    update(game) { }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); 
        if (this.imageLoaded) { ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2); } 
        else {
            ctx.fillStyle = this.team; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillRect(this.size/2, -3, 4, 6);
            if(this.role === 'soldier') { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill(); }
        }
        if (this.cargo.amount > 0) { 
            ctx.fillStyle = this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff'; 
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); 
        }
        ctx.restore();
    }
}

class ResourceNode {
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
        if (this.imageLoaded) { ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2); } 
        else { ctx.fillStyle = this.type === 'pumpkin' ? '#ff7b00' : '#00aaff'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    }
}

class Structure {
    constructor(x, y, team, type) {
        this.x = x; this.y = y; this.team = team; this.type = type;
        this.hp = type === 'wall' ? 500 : 200; this.maxHp = this.hp;
        
        this.territory = type === 'nest' ? 400 : (type === 'pylon' ? 250 : 0);
        
        if(type === 'nest') this.size = 40; else if(type === 'eggsac') this.size = 25; 
        else if(type === 'turret') { this.size = 20; this.cooldown = 0; } else if(type === 'wall') this.size = 35; 
        else if(type === 'pylon') this.size = 18; 

        this.sprite = new Image(); this.sprite.src = `assets/${type}_${team}.png`;
        this.spriteLoaded = false; this.sprite.onload = () => { this.spriteLoaded = true; };
    }
    update(game) {} 
    draw(ctx) {
        if(this.spriteLoaded) { ctx.drawImage(this.sprite, this.x - this.size, this.y - this.size, this.size*2, this.size*2); } 
        else {
            ctx.fillStyle = this.team === 'black' ? '#222' : '#500';
            if(this.type === 'nest') { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); }
            else if(this.type === 'eggsac') { ctx.beginPath(); ctx.ellipse(this.x, this.y, this.size, this.size-10, 0, 0, Math.PI*2); ctx.fill(); }
            else if(this.type === 'turret') { ctx.fillRect(this.x - this.size, this.y - this.size, this.size*2, this.size*2); ctx.fillStyle='purple'; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill(); }
            else if(this.type === 'wall') { ctx.fillRect(this.x - this.size, this.y - 10, this.size*2, 20); }
            else if(this.type === 'pylon') { ctx.beginPath(); ctx.moveTo(this.x, this.y - this.size); ctx.lineTo(this.x - this.size, this.y + this.size); ctx.lineTo(this.x + this.size, this.y + this.size); ctx.fill(); }
            ctx.strokeStyle = this.team; ctx.lineWidth = 2; ctx.stroke();
        }
    }
}

class Projectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; this.target = target; this.damage = damage; this.team = team;
        this.speed = 5; this.active = true;
    }
    update(game) {
        if(!this.target || this.target.hp <= 0) { this.active = false; return; }
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const distSq = MathUtils.distSq(this.x, this.y, this.target.x, this.target.y);
        if (distSq < 100) { // 10 squared
            this.target.hp -= this.damage; this.active = false; 
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: this.team==='black'?'#aa00ff':'#ffaa00', count: 10});
        } 
        else {
            const dist = Math.sqrt(distSq);
            this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; 
        }
    }
    draw(ctx) { ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ffaa00'; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill(); }
}

// ==========================================
// 3. MAIN GAME CLASS 
// ==========================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas'); this.ctx = this.canvas.getContext('2d');
        this.bus = new GameBus(); this.expansions = new ExpansionManager(this);
        
        this.world = { width: 6000, height: 6000 }; 
        this.camera = { x: 0, y: 0 }; this.tick = 0; 
        
        // UNIFIED ENTITY SYSTEM
        this.entities = [];
        this.decor = []; 
        
        this.eco = { black: { pumpkins: 600, dew: 100 }, red: { pumpkins: 600, dew: 100 } }; 
        this.pop = { black: 0, red: 0 }; 
        this.maxPop = { black: 10, red: 10 };
        this.techLevel = { black: 0, red: 0 }; 
        
        this.activeTool = 'select'; this.gameState = 'playing'; this.selectedStructure = null; 

        this.resize(); window.addEventListener('resize', () => this.resize());
        this.setupInputs(); requestAnimationFrame(() => this.loop());
    }

    // Backwards compatibility getters for expansions
    get spiders() { return this.entities.filter(e => e instanceof Spider && !(e instanceof Queen)); }
    get queens() { return this.entities.filter(e => e instanceof Queen); }
    get structures() { return this.entities.filter(e => e instanceof Structure); }
    get resourceNodes() { return this.entities.filter(e => e instanceof ResourceNode); }
    get projectiles() { return this.entities.filter(e => e instanceof Projectile); }
    get critters() { return this.entities.filter(e => e.team === 'nature'); }
    get bosses() { return this.entities.filter(e => e instanceof CentipedeBoss); }
    get spells() { return this.entities.filter(e => e instanceof Spell); }
    get particles() { return this.entities.filter(e => e instanceof Particle); }
    
    addEntity(entity) { this.entities.push(entity); }

    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    
    getTerrainAt(x, y) { return 'dirt'; }

    checkTerritory(x, y, team) {
        return this.structures.some(s => s.team === team && s.territory > 0 && MathUtils.distSq(s.x, s.y, x, y) <= s.territory ** 2);
    }

    setupInputs() {
        this.keys = {};
        
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase(); this.keys[k] = true;
            if(k === 'escape') { this.activeTool = 'select'; this.bus.emit('toolChanged', 'select'); this.bus.emit('closeModal'); }
            if(k === 'u' && this.eco.black.pumpkins >= 250) { this.eco.black.pumpkins -= 250; this.techLevel.black++; this.bus.emit('playSound', 'spell');}
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        let isDragging = false; let dragStartX, dragStartY, camStartX, camStartY, hasMoved;

        const startInteraction = (x, y) => {
            isDragging = true; hasMoved = false; dragStartX = x; dragStartY = y;
            camStartX = this.camera.x; camStartY = this.camera.y;
        };

        const moveInteraction = (x, y) => {
            if (isDragging && !this.isMinimapDragging) {
                let dx = x - dragStartX; let dy = y - dragStartY;
                if (MathUtils.distSq(0, 0, dx, dy) > 25) hasMoved = true; 
                if (hasMoved) { this.camera.x = camStartX - dx; this.camera.y = camStartY - dy; }
            }
        };

        const endInteraction = (x, y, targetElem) => {
            if (isDragging) {
                isDragging = false;
                if(targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#mobileToolbar') || targetElem.closest('#rtsUI') || targetElem.closest('#gameOverModal'))) return;

                if (!hasMoved && !this.isMinimapDragging) {
                    const worldX = x + this.camera.x; const worldY = y + this.camera.y;
                    
                    if (this.activeTool === 'commandQueen') {
                        this.bus.emit('commandQueen', { x: worldX, y: worldY, team: 'black' });
                        this.activeTool = 'select'; this.bus.emit('toolChanged', 'select'); 
                    }
                    else if (['venomStrike', 'silkTrap'].includes(this.activeTool)) {
                        this.bus.emit('castSpell', { x: worldX, y: worldY, type: this.activeTool, team: 'black' });
                        this.activeTool = 'select'; this.bus.emit('toolChanged', 'select');
                    }
                    else if (['nest', 'eggsac', 'turret', 'wall', 'pylon'].includes(this.activeTool)) {
                        this.bus.emit('buildStructure', { x: worldX, y: worldY, team: 'black', type: this.activeTool });
                        if (!this.keys['shift']) { this.activeTool = 'select'; this.bus.emit('toolChanged', 'select'); }
                    }
                    else {
                        let clickedStruct = this.structures.find(s => s.team === 'black' && MathUtils.distSq(s.x, s.y, worldX, worldY) < s.size ** 2);
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
            const cost = data.role === 'soldier' ? 25 : 10;
            if (this.eco[data.team].pumpkins >= cost && this.pop[data.team] < this.maxPop[data.team]) {
                this.eco[data.team].pumpkins -= cost; 
                this.addEntity(new Spider(data.x + (Math.random()-0.5)*50, data.y + (Math.random()-0.5)*50, data.team, data.role));
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

            if (this.eco[data.team].pumpkins >= costs[data.type]) {
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
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height - this.canvas.height));

        if (this.tick % 30 === 0) {
            let blackEggs = 0, redEggs = 0, blackPop = 0, redPop = 0;
            this.entities.forEach(e => {
                if (e instanceof Structure && e.type === 'eggsac') {
                    if (e.team === 'black') blackEggs++; else if (e.team === 'red') redEggs++;
                }
                if (e instanceof Spider && !(e instanceof Queen)) {
                    if (e.team === 'black') blackPop++; else if (e.team === 'red') redPop++;
                }
            });
            this.maxPop.black = 10 + (blackEggs * 10);
            this.maxPop.red = 10 + (redEggs * 10);
            this.pop.black = blackPop;
            this.pop.red = redPop;
        }

        // Fast Entity Processing
        for (let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            
            let dead = false;
            if (e.hp !== undefined && e.hp <= 0) dead = true;
            else if (e.resources !== undefined && e.resources <= 0) dead = true;
            else if (e.active !== undefined && !e.active) dead = true;
            else if (e.life !== undefined && e.life <= 0) dead = true;

            if (dead) {
                if (e instanceof Spider || e instanceof Structure || e instanceof CentipedeBoss || e.team === 'nature') {
                    this.bus.emit('particles', {x: e.x, y: e.y, color: e.color || e.team || '#888', count: e instanceof CentipedeBoss ? 100 : 30});
                    this.bus.emit('playSound', e.team === 'nature' ? 'harvest' : 'death');
                }
                if (this.selectedStructure === e) { this.selectedStructure = null; this.bus.emit('closeModal'); }
                
                this.entities[i] = this.entities[this.entities.length - 1];
                this.entities.pop();
                continue;
            }
            
            if (e.update) e.update(this);
        }
    }

    getNearestEnemy(x, y, team, maxDist) {
        let nearest = null;
        let minDistSq = maxDist * maxDist;
        for (let i = 0; i < this.entities.length; i++) {
            let e = this.entities[i];
            if (!e.team || e.team === team || e.hp <= 0 || e instanceof Projectile) continue;
            
            let dSq = MathUtils.distSq(x, y, e.x, e.y);
            if (e.type === 'wall' && dSq < (250*250)) dSq -= (100*100); 
            
            if (dSq < minDistSq) {
                minDistSq = dSq;
                nearest = e;
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
            this.ctx.beginPath(); this.ctx.arc(this.selectedStructure.x, this.selectedStructure.y, this.selectedStructure.size + 10, 0, Math.PI * 2);
            this.ctx.stroke(); this.ctx.setLineDash([]);
        }

        // Render Culling
        const padding = 150;
        const viewL = this.camera.x - padding;
        const viewR = this.camera.x + this.canvas.width + padding;
        const viewT = this.camera.y - padding;
        const viewB = this.camera.y + this.canvas.height + padding;

        for (let i = 0; i < this.entities.length; i++) {
            let e = this.entities[i];
            if (e.draw && e.x >= viewL && e.x <= viewR && e.y >= viewT && e.y <= viewB) {
                e.draw(this.ctx);
            }
        }
        
        this.ctx.restore();
        this.bus.emit('uiDraw', this.ctx);
    }
}

// ==========================================
// 4. EXPANSIONS (THE MAGIC)
// ==========================================

const SilkNetworkExpansion = {
    patch: (game) => {
        game.bus.on('territoryDraw', (ctx) => {
            ctx.save();
            ctx.globalCompositeOperation = 'screen'; 
            
            for(let s of game.structures) {
                if(s.territory > 0) {
                    let grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.territory);
                    if (s.team === 'black') {
                        grad.addColorStop(0, 'rgba(150, 100, 255, 0.25)'); 
                        grad.addColorStop(1, 'rgba(150, 100, 255, 0)');
                    } else {
                        grad.addColorStop(0, 'rgba(255, 50, 50, 0.25)'); 
                        grad.addColorStop(1, 'rgba(255, 50, 50, 0)');
                    }
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(s.x, s.y, s.territory, 0, Math.PI * 2); ctx.fill();
                    
                    ctx.strokeStyle = s.team === 'black' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 100, 100, 0.15)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    for(let i=0; i<8; i++) {
                        let angle = (i * Math.PI/4) + (s.x % 1); 
                        ctx.moveTo(s.x, s.y);
                        ctx.lineTo(s.x + Math.cos(angle)*s.territory, s.y + Math.sin(angle)*s.territory);
                    }
                    ctx.arc(s.x, s.y, s.territory * 0.7, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        });

        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            let isOnEnemyWeb = false;
            for(let s of gameObj.structures) {
                if (s.territory > 0 && MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory**2) {
                    if (s.team === this.team) isOnFriendlyWeb = true;
                    else isOnEnemyWeb = true;
                }
            }
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= 1.5;      
            else if (isOnEnemyWeb) this.baseSpeed *= 0.7;    
            
            original(gameObj); 
            this.baseSpeed = baseSpdTemp; 
        });
        
        game.expansions.patchClass(Queen, 'update', function(original, gameObj) {
            let isOnFriendlyWeb = false;
            for(let s of gameObj.structures) {
                if (s.team === this.team && s.territory > 0 && MathUtils.distSq(s.x, s.y, this.x, this.y) <= s.territory**2) isOnFriendlyWeb = true;
            }
            const baseSpdTemp = this.baseSpeed;
            if (isOnFriendlyWeb) this.baseSpeed *= 1.5; 
            original(gameObj);
            this.baseSpeed = baseSpdTemp;
        });
    }
};

const TerrainExpansion = {
    init: (game) => {
        game.tileSize = 256; 
        
        game.tiles = { 
            dirt: new Image(), vines: new Image(), pebbles: new Image(), grass: new Image(),
            water_straight: new Image(), water_corner: new Image(), 
            water_end: new Image(), water_t: new Image(), water_cross: new Image()
        };
        
        game.tiles.dirt.src = 'assets/tile_dirt.png'; game.tiles.vines.src = 'assets/tile_vines.png'; 
        game.tiles.pebbles.src = 'assets/tile_pebbles.png'; game.tiles.grass.src = 'assets/tile_grass.png';
        game.tiles.water_straight.src = 'assets/water_straight.png'; game.tiles.water_corner.src = 'assets/water_corner.png';
        game.tiles.water_end.src = 'assets/water_end.png'; game.tiles.water_t.src = 'assets/water_t.png';
        game.tiles.water_cross.src = 'assets/water_cross.png';

        game.bakedTiles = {};
        const bakeTile = (type) => {
            const img = game.tiles[type];
            if(!img.complete || img.naturalHeight === 0) return;
            
            const c = document.createElement('canvas');
            c.width = game.tileSize; c.height = game.tileSize;
            const ctx = c.getContext('2d');
            ctx.imageSmoothingEnabled = false; 

            if (img.width < game.tileSize && !type.startsWith('water_')) {
                for(let y = 0; y < game.tileSize; y += img.height) {
                    for(let x = 0; x < game.tileSize; x += img.width) { ctx.drawImage(img, x, y); }
                }
            } else {
                ctx.drawImage(img, 0, 0, game.tileSize, game.tileSize);
            }
            game.bakedTiles[type] = c;
        };

        for(let key in game.tiles) {
            if (game.tiles[key].complete) bakeTile(key);
            else game.tiles[key].onload = () => bakeTile(key);
        }
        
        game.generateMap = function() {
            this.mapGrid = [];
            const cols = Math.ceil(this.world.width / this.tileSize); 
            const rows = Math.ceil(this.world.height / this.tileSize);
            
            for (let y = 0; y < rows; y++) {
                let row = [];
                for (let x = 0; x < cols; x++) { 
                    let type = Math.random() > 0.75 ? 'vines' : (Math.random() > 0.60 ? 'pebbles' : 'dirt');
                    if(Math.random() > 0.85) type = 'grass';
                    row.push({ type: type, sprite: type, angle: 0 });
                }
                this.mapGrid.push(row);
            }
            
            let rX = Math.floor(cols / 2);
            for (let rY = 0; rY < rows; rY++) {
                this.mapGrid[rY][rX].type = 'water';
                if(Math.random() > 0.5 && rY < rows - 1) {
                    const dir = Math.random() > 0.5 ? 1 : -1;
                    rX = Math.max(1, Math.min(rX + dir, cols-2));
                    this.mapGrid[rY][rX].type = 'water';
                }
            }

            this.updateBitmasks = function() {
                const bitMap = {
                    0: {s: 'water_end', a: 0},           1: {s: 'water_end', a: 0},        
                    2: {s: 'water_end', a: Math.PI/2},   4: {s: 'water_end', a: Math.PI},  
                    8: {s: 'water_end', a: -Math.PI/2},  5: {s: 'water_straight', a: 0},   
                    10: {s: 'water_straight', a: Math.PI/2}, 3: {s: 'water_corner', a: 0}, 
                    6: {s: 'water_corner', a: Math.PI/2}, 12: {s: 'water_corner', a: Math.PI}, 
                    9: {s: 'water_corner', a: -Math.PI/2}, 7: {s: 'water_t', a: 0},        
                    14: {s: 'water_t', a: Math.PI/2},    13: {s: 'water_t', a: Math.PI},   
                    11: {s: 'water_t', a: -Math.PI/2},   15: {s: 'water_cross', a: 0}      
                };

                for (let y = 0; y < rows; y++) {
                    for (let x = 0; x < cols; x++) {
                        if (this.mapGrid[y][x].type === 'water') {
                            let mask = 0;
                            if (y > 0 && this.mapGrid[y-1][x].type === 'water') mask += 1;
                            if (x < cols-1 && this.mapGrid[y][x+1].type === 'water') mask += 2;
                            if (y < rows-1 && this.mapGrid[y+1][x].type === 'water') mask += 4;
                            if (x > 0 && this.mapGrid[y][x-1].type === 'water') mask += 8;

                            this.mapGrid[y][x].sprite = bitMap[mask].s;
                            this.mapGrid[y][x].angle = bitMap[mask].a;
                        }
                    }
                }
            };
            this.updateBitmasks(); 
        };
        game.generateMap();

        game.getTerrainAt = function(x, y) {
            const tX = Math.floor(x / this.tileSize); const tY = Math.floor(y / this.tileSize);
            if(this.mapGrid[tY] && this.mapGrid[tY][tX]) return this.mapGrid[tY][tX].type;
            return 'dirt';
        };
    },
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            if (!game.mapGrid) return;
            
            const startCol = Math.floor(game.camera.x / game.tileSize); 
            const endCol = startCol + Math.ceil(game.canvas.width / game.tileSize) + 1;
            const startRow = Math.floor(game.camera.y / game.tileSize); 
            const endRow = startRow + Math.ceil(game.canvas.height / game.tileSize) + 1;
            
            for (let y = startRow; y <= endRow; y++) {
                for (let x = startCol; x <= endCol; x++) {
                    if (y >= 0 && y < game.mapGrid.length && x >= 0 && x < game.mapGrid[y].length) {
                        const tileData = game.mapGrid[y][x];
                        const drawX = x * game.tileSize;
                        const drawY = y * game.tileSize;

                        if (game.bakedTiles['dirt']) { ctx.drawImage(game.bakedTiles['dirt'], drawX, drawY); } 
                        else { ctx.fillStyle = '#3d2817'; ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize); }

                        if (tileData.type === 'dirt') continue;

                        const img = game.bakedTiles[tileData.sprite];
                        if (img) {
                            if (tileData.angle !== 0) {
                                ctx.save(); ctx.translate(drawX + game.tileSize/2, drawY + game.tileSize/2); ctx.rotate(tileData.angle);
                                ctx.drawImage(img, -game.tileSize/2, -game.tileSize/2); ctx.restore();
                            } else {
                                ctx.drawImage(img, drawX, drawY);
                            }
                        }
                    }
                }
            }
        });
    }
};

const DecorExpansion = {
    init: (game) => {
        game.decorSprites = { water: new Image(), grass: new Image(), pebbles: new Image() };
        game.decorSprites.water.src = 'assets/clutter_water.png';
        game.decorSprites.grass.src = 'assets/clutter_grass.png';
        game.decorSprites.pebbles.src = 'assets/clutter_pebbles.png';

        setTimeout(() => {
            for(let i=0; i<1500; i++) {
                const dx = Math.random() * game.world.width;
                const dy = Math.random() * game.world.height;
                const terrain = game.getTerrainAt(dx, dy);
                
                if(['water', 'grass', 'pebbles'].includes(terrain)) {
                    game.decor.push({ // Keeping decor static for raw rendering performance
                        x: dx, y: dy, type: terrain, 
                        sprite: game.decorSprites[terrain],
                        size: (Math.random() * 15) + 15 
                    });
                }
            }
        }, 500);
    },
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            const padding = 100;
            const viewL = game.camera.x - padding;
            const viewR = game.camera.x + game.canvas.width + padding;
            const viewT = game.camera.y - padding;
            const viewB = game.camera.y + game.canvas.height + padding;

            game.decor.forEach(d => {
                if (d.x >= viewL && d.x <= viewR && d.y >= viewT && d.y <= viewB) {
                    if (d.sprite.complete && d.sprite.naturalHeight !== 0) {
                        ctx.drawImage(d.sprite, d.x - d.size, d.y - d.size, d.size*2, d.size*2);
                    }
                }
            });
        });
    }
};

const AdvancedBaseExpansion = {
    init: (game) => {
        setTimeout(() => {
            const pad = 600; 
            const bX = pad + Math.random() * 200; const bY = pad + Math.random() * 200;
            const rX = game.world.width - pad - Math.random() * 200; const rY = game.world.height - pad - Math.random() * 200;
            
            const tBX = Math.floor(bX/game.tileSize); const tBY = Math.floor(bY/game.tileSize);
            const tRX = Math.floor(rX/game.tileSize); const tRY = Math.floor(rY/game.tileSize);
            if(game.mapGrid[tBY] && game.mapGrid[tBY][tBX]) game.mapGrid[tBY][tBX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
            if(game.mapGrid[tRY] && game.mapGrid[tRY][tRX]) game.mapGrid[tRY][tRX] = { type: 'dirt', sprite: 'dirt', angle: 0 };
            
            game.updateBitmasks();

            game.addEntity(new Structure(bX, bY, 'black', 'nest')); 
            game.addEntity(new Structure(bX + 80, bY, 'black', 'eggsac'));
            game.addEntity(new Structure(rX, rY, 'red', 'nest')); 
            game.addEntity(new Structure(rX - 80, rY, 'red', 'eggsac'));
            
            game.camera.x = Math.max(0, bX - (game.canvas.width / 2)); game.camera.y = Math.max(0, bY - (game.canvas.height / 2));
            
            for (let i = 0; i < 40; i++) {
                let pX = 600 + Math.random() * (game.world.width - 1200); let pY = 600 + Math.random() * (game.world.height - 1200);
                for (let p = 0; p < Math.floor(Math.random() * 6) + 5; p++) game.addEntity(new ResourceNode(pX + (Math.random() - 0.5) * 300, pY + (Math.random() - 0.5) * 300, 'pumpkin'));
            }
            for (let i = 0; i < 60; i++) { game.addEntity(new ResourceNode(Math.random() * game.world.width, Math.random() * game.world.height, 'dew')); }
            
            for(let i=0; i<3; i++) game.addEntity(new GoldenBug(game.world.width/2 + (Math.random()-0.5)*1000, game.world.height/2 + (Math.random()-0.5)*1000));
            for(let i=0; i<30; i++) {
                let ax = Math.random() * game.world.width; let ay = Math.random() * game.world.height;
                if(game.getTerrainAt(ax, ay) === 'grass' || Math.random() > 0.8) game.addEntity(new Aphid(ax, ay));
            }
        }, 100);
    }
};

const GameLoopExpansion = {
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
            original(); 
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

const AudioExpansion = {
    init: (game) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext; const ctx = new AudioContext();
        const unlock = () => { if(ctx.state === 'suspended') ctx.resume(); window.removeEventListener('click', unlock); window.removeEventListener('touchstart', unlock);};
        window.addEventListener('click', unlock); window.addEventListener('touchstart', unlock);
        const playTone = (freq, type, duration, vol=0.05) => {
            if(ctx.state === 'suspended') return;
            const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.connect(gain); gain.connect(ctx.destination); gain.gain.setValueAtTime(vol, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.start(); osc.stop(ctx.currentTime + duration);
        };
        game.bus.on('playSound', (type) => {
            if (type === 'shoot') playTone(600, 'square', 0.1, 0.02); if (type === 'harvest') playTone(150, 'sawtooth', 0.1, 0.05); 
            if (type === 'death') playTone(100, 'sawtooth', 0.4, 0.08); if (type === 'spell') playTone(800, 'sine', 0.5, 0.05); 
            if (type === 'build') playTone(300, 'triangle', 0.2, 0.05); 
        });
    }
};

class Aphid {
    constructor(x, y) { this.x = x; this.y = y; this.size = 8; this.hp = 30; this.maxHp = 30; this.angle = Math.random() * Math.PI * 2; this.speed = 0.3; this.team = 'nature'; this.color = '#7eff5e'; }
    update(game) {
        if(Math.random() < 0.1) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        if(this.hp <= 0) { game.addEntity(new ResourceNode(this.x, this.y, 'dew')); }
    }
    draw(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle = this.color; ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-2, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
}

class GoldenBug {
    constructor(x, y) { this.x = x; this.y = y; this.size = 15; this.hp = 250; this.maxHp = 250; this.angle = Math.random() * Math.PI * 2; this.speed = 0.5; this.team = 'nature'; this.color = 'gold';}
    update(game) {
        if(Math.random() < 0.05) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        if(this.hp <= 0) for(let i=0; i<5; i++) game.addEntity(new ResourceNode(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100, 'pumpkin'));
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle = '#ffd700'; 
        ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(this.size/2, -2, 4, 4); ctx.restore();
        if(this.hp < this.maxHp) { ctx.fillStyle='red'; ctx.fillRect(this.x-10, this.y-20, 20, 4); ctx.fillStyle='lime'; ctx.fillRect(this.x-10, this.y-20, 20*(this.hp/this.maxHp), 4); }
    }
}

class Queen extends Spider {
    constructor(x, y, team) {
        super(x, y, team);
        this.size = 28; this.baseSpeed = 0.8; this.hp = 2500; this.maxHp = 2500; this.damage = 40; this.commandTarget = null; 
        this.sprite.src = team === 'black' ? 'assets/queen_black.png' : 'assets/queen_red.png';
    }
    update(game) {
        if (this.team === 'red' && !this.commandTarget) {
            const bNests = game.structures.filter(s => s.team === 'black' && s.type === 'nest');
            if(bNests.length > 0) this.commandTarget = { x: bNests[0].x, y: bNests[0].y };
        }
        if (this.commandTarget) {
            const dx = this.commandTarget.x - this.x; const dy = this.commandTarget.y - this.y;
            
            const terrain = game.getTerrainAt(this.x, this.y); let tMod = 1.0;
            if(terrain === 'water') tMod = 0.05; if(terrain === 'grass') tMod = 1.3;

            let techSpeed = (game.techLevel[this.team] * 0.2); 
            if(this.isSlowed) techSpeed -= (this.baseSpeed / 2); 
            const currentSpeed = Math.max(0.1, (this.baseSpeed + techSpeed)) * tMod;

            if (MathUtils.distSq(0,0, dx, dy) > 100) { this.angle = Math.atan2(dy, dx); this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed; } 
            else this.commandTarget = null; 
        }
        this.isSlowed = false; 
    }
    draw(ctx) {
        super.draw(ctx);
        if(this.team === 'black' && this.commandTarget) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.commandTarget.x, this.commandTarget.y); ctx.stroke();
            ctx.setLineDash([]); ctx.beginPath(); ctx.arc(this.commandTarget.x, this.commandTarget.y, 10, 0, Math.PI*2); ctx.stroke();
        }
    }
}

const QueenExpansion = {
    init: (game) => {
        const spawnInterval = setInterval(() => {
            if(game.queens.length > 0) return clearInterval(spawnInterval);
            const bNest = game.structures.find(s => s.team === 'black' && s.type === 'nest'); 
            const rNest = game.structures.find(s => s.team === 'red' && s.type === 'nest');
            if(bNest && rNest) {
                game.addEntity(new Queen(bNest.x + 50, bNest.y + 50, 'black')); 
                game.addEntity(new Queen(rNest.x - 50, rNest.y - 50, 'red'));
                clearInterval(spawnInterval);
            }
        }, 150);
        game.bus.on('commandQueen', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if(queen) queen.commandTarget = { x: data.x, y: data.y };
        });
    }
};

const CombatAndHarvesterExpansion = {
    patch: (game) => {
        game.expansions.patchClass(Spider, 'update', function(original, gameObj) {
            const techLvl = gameObj.techLevel[this.team] || 0; 
            const currentDamage = this.damage + (techLvl * 5); 
            
            const terrain = gameObj.getTerrainAt(this.x, this.y); let tMod = 1.0;
            if(terrain === 'water') tMod = 0.05; if(terrain === 'grass') tMod = 1.3;
            
            let currentSpeed = (this.baseSpeed + (techLvl * 0.15)) * tMod;
            if (this.isSlowed) currentSpeed *= 0.3; this.isSlowed = false; 

            // Fast Spatial Lookup instead of creating heavy filtered arrays!
            const detectRadius = 150 + (techLvl * 10);
            let nearestEnemy = gameObj.getNearestEnemy(this.x, this.y, this.team, detectRadius);

            if (nearestEnemy) {
                this.state = 'combat'; this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;
                const distSq = MathUtils.distSq(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
                
                if (distSq > combatRange * combatRange) { 
                    this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
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

            if (this.role === 'soldier') {
                const myQueen = gameObj.queens.find(q => q.team === this.team);
                if (myQueen) {
                    const dx = myQueen.x - this.x; const dy = myQueen.y - this.y;
                    if (MathUtils.distSq(0,0, dx, dy) > 6400) { // 80 squared
                        this.angle = Math.atan2(dy, dx);
                        this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                    }
                }
                return; 
            }

            if (this.cargo.amount === 0) this.state = 'seeking_pumpkin'; else this.state = 'returning_home';
            
            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    let closest = null; let minD = Infinity;
                    gameObj.resourceNodes.forEach(r => { 
                        let dSq = MathUtils.distSq(r.x, r.y, this.x, this.y); 
                        if(dSq < minD) { minD = dSq; closest = r; } 
                    });
                    this.target = closest;
                }
            } else {
                let closest = null; let minD = Infinity;
                gameObj.structures.filter(s => s.team === this.team && (s.type === 'nest' || s.type === 'pylon')).forEach(n => { 
                    let dSq = MathUtils.distSq(n.x, n.y, this.x, this.y); 
                    if(dSq < minD) { minD = dSq; closest = n; } 
                });
                gameObj.queens.filter(q => q.team === this.team).forEach(q => { 
                    let dSq = MathUtils.distSq(q.x, q.y, this.x, this.y); 
                    if(dSq < minD) { minD = dSq; closest = q; } 
                });
                this.target = closest;
            }

            if (this.target) {
                const dx = this.target.x - this.x; const dy = this.target.y - this.y;
                const distSq = MathUtils.distSq(0,0, dx, dy); this.angle = Math.atan2(dy, dx);
                const targetRadius = this.target.size ? this.target.size + 5 : 15;
                if (distSq > targetRadius * targetRadius) { 
                    this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                } else {
                    if (this.state === 'seeking_pumpkin' && this.target.resources > 0) {
                        this.cargo.amount = 10; this.cargo.type = this.target.type; this.target.resources -= 10; this.target = null; 
                        gameObj.bus.emit('particles', {x: this.x, y: this.y, color: this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff', count: 5}); 
                        gameObj.bus.emit('playSound', 'harvest');
                    } else if (this.state === 'returning_home') {
                        if(this.cargo.type === 'pumpkin') gameObj.eco[this.team].pumpkins += this.cargo.amount;
                        else if(this.cargo.type === 'dew') gameObj.eco[this.team].dew += this.cargo.amount;
                        this.cargo.amount = 0; this.target = null;
                    }
                }
            } else {
                this.angle += (Math.random() - 0.5) * 0.5;
                this.x += Math.cos(this.angle) * (currentSpeed * 0.5); this.y += Math.sin(this.angle) * (currentSpeed * 0.5);
                this.x = Math.max(0, Math.min(this.x, gameObj.world.width)); this.y = Math.max(0, Math.min(this.y, gameObj.world.height));
            }
        });

        const drawHealth = function(ctx) {
            if (this.hp !== undefined && this.hp < (this.maxHp + (game.techLevel[this.team] || 0) * 20)) {
                const max = this.maxHp + ((game.techLevel[this.team] || 0) * 20);
                const w = this.size * 1.5; ctx.fillStyle = 'black'; ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 11, w + 2, 6);
                ctx.fillStyle = 'red'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w, 4);
                ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w * (Math.max(0, this.hp) / max), 4);
            }
        };
        
        game.expansions.patchClass(Spider, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Queen, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
        game.expansions.patchClass(Structure, 'draw', function(original, ctx) { original.call(this, ctx); drawHealth.call(this, ctx); });
    }
};

const MinimapExpansion = {
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

const WebNetworkExpansion = {
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            ctx.lineWidth = 1;
            const spiders = game.spiders;
            for (let i = 0; i < spiders.length; i++) {
                let s1 = spiders[i];
                if (s1.x < game.camera.x - 100 || s1.x > game.camera.x + game.canvas.width + 100 || s1.y < game.camera.y - 100 || s1.y > game.camera.y + game.canvas.height + 100) continue;
                
                game.structures.filter(s => s.team === s1.team).forEach(struct => {
                    if (MathUtils.distSq(struct.x, struct.y, s1.x, s1.y) < 22500) { // 150 squared
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)'; 
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(struct.x, struct.y); ctx.stroke(); 
                    }
                });
                for (let j = i + 1; j < spiders.length; j++) {
                    let s2 = spiders[j];
                    if (s1.team === s2.team && MathUtils.distSq(s2.x, s2.y, s1.x, s1.y) < 6400) { // 80 squared
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)'; 
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); 
                    }
                }
            }
        });
    }
};

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y; this.color = color;
        const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.life = Math.random() * 30 + 15; this.maxLife = this.life; this.size = Math.random() * 3 + 2;
    }
    update() { this.x += this.vx; this.y += this.vy; this.vx *= 0.9; this.vy *= 0.9; this.life--; }
    draw(ctx) { ctx.globalAlpha = Math.max(0, this.life / this.maxLife); ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0; }
}

const ParticleExpansion = {
    init: (game) => {
        game.bus.on('particles', (data) => {
            for(let i=0; i<data.count; i++) {
                let c = data.color; if (c === 'black') c = '#5533aa'; if (c === 'red') c = '#ff2200';
                game.addEntity(new Particle(data.x, data.y, c));
            }
        });
    }
}

const AtmosphereExpansion = {
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

class Spell {
    constructor(x, y, team, type) { this.x = x; this.y = y; this.team = team; this.type = type; this.life = 600; this.radius = type === 'venomStrike' ? 100 : 150; }
    update(game) {
        this.life--;
        const radSq = this.radius * this.radius;
        for(let i=0; i<game.entities.length; i++) {
            let e = game.entities[i];
            if(e.team && e.team !== this.team && (e instanceof Spider || e instanceof CentipedeBoss)) {
                if(MathUtils.distSq(e.x, e.y, this.x, this.y) < radSq) {
                    if(this.type === 'venomStrike') {
                        if (game.tick % 15 === 0) { e.hp -= 5; game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 2}); }
                    } else if (this.type === 'silkTrap') { e.isSlowed = true; }
                }
            }
        }
    }
    draw(ctx) {
        ctx.globalAlpha = Math.min(this.life / 60, 0.4); 
        if(this.type === 'venomStrike') {
            ctx.fillStyle = '#00ff00'; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
            if(Math.random() < 0.2) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x + (Math.random()-0.5)*this.radius, this.y + (Math.random()-0.5)*this.radius, Math.random()*5, 0, Math.PI*2); ctx.fill(); }
        } else {
            ctx.fillStyle = '#ffffff'; ctx.beginPath();
            for(let i=0; i<8; i++) { ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + Math.cos(i * Math.PI/4)*this.radius, this.y + Math.sin(i * Math.PI/4)*this.radius); }
            ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius*0.6, 0, Math.PI*2); ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius*0.3, 0, Math.PI*2); ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }
}

const SpellExpansion = {
    init: (game) => {
        game.bus.on('castSpell', (data) => {
            const cost = data.type === 'venomStrike' ? 50 : 25; 
            if(game.eco[data.team].dew >= cost) {
                game.eco[data.team].dew -= cost; 
                game.addEntity(new Spell(data.x, data.y, data.team, data.type));
                game.bus.emit('particles', {x: data.x, y: data.y, color: data.type === 'venomStrike' ? '#00ff00' : '#ffffff', count: 100});
                game.bus.emit('playSound', 'spell');
            }
        });
    }
}

class CentipedeBoss {
    constructor(x, y) {
        this.x = x; this.y = y; this.team = 'nature'; this.hp = 3000; this.maxHp = 3000; this.damage = 50; this.speed = 1.8;
        this.angle = Math.random() * Math.PI*2; this.history = []; this.segmentCount = 15; this.cooldown = 0;
        this.headSprite = new Image(); this.headSprite.src = 'assets/centipede_head.png';
        this.bodySprite = new Image(); this.bodySprite.src = 'assets/centipede_body.png';
    }
    update(game) {
        this.history.unshift({x: this.x, y: this.y, angle: this.angle}); if(this.history.length > this.segmentCount * 5) this.history.pop(); 
        
        let nearest = null; let minDistSq = 800 * 800; 
        for (let i = 0; i < game.entities.length; i++) { 
            let t = game.entities[i];
            if (t instanceof Spider || t instanceof Structure) {
                let dSq = MathUtils.distSq(t.x, t.y, this.x, this.y); 
                if (dSq < minDistSq) { minDistSq = dSq; nearest = t; } 
            }
        }
        
        if (nearest) {
            this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            if (minDistSq > 900) { this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; } 
            else { this.cooldown--; if(this.cooldown <= 0) { nearest.hp -= this.damage; this.cooldown = 20; game.bus.emit('particles', {x: nearest.x, y: nearest.y, color: '#00ff00', count: 10}); game.bus.emit('playSound', 'harvest'); } }
        } else {
            if(Math.random() < 0.05) this.angle += (Math.random() - 0.5);
            this.x += Math.cos(this.angle) * (this.speed * 0.5); this.y += Math.sin(this.angle) * (this.speed * 0.5);
            this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        }
    }
    draw(ctx) {
        for(let i = 1; i < this.segmentCount; i++) {
            let histIndex = i * 4; 
            if(this.history[histIndex]) {
                let pos = this.history[histIndex]; ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(pos.angle);
                if (this.bodySprite.complete && this.bodySprite.naturalHeight !== 0) { ctx.drawImage(this.bodySprite, -15, -15, 30, 30); } 
                else { ctx.fillStyle = i % 2 === 0 ? '#113311' : '#225522'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fill(); }
                ctx.restore();
            }
        }
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        if (this.headSprite.complete && this.headSprite.naturalHeight !== 0) { ctx.drawImage(this.headSprite, -20, -20, 40, 40); } 
        else { ctx.fillStyle = '#052205'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(8, -8, 4, 0, Math.PI*2); ctx.arc(8, 8, 4, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
        if(this.hp < this.maxHp) { ctx.fillStyle='black'; ctx.fillRect(this.x-30, this.y-35, 60, 8); ctx.fillStyle='red'; ctx.fillRect(this.x-29, this.y-34, 58, 6); ctx.fillStyle='#00ff00'; ctx.fillRect(this.x-29, this.y-34, 58*(this.hp/this.maxHp), 6); }
    }
}

const GodUnitExpansion = {
    init: (game) => {
        setTimeout(() => {
            game.addEntity(new CentipedeBoss(game.world.width/2, game.world.height/2));
            game.bus.emit('playSound', 'spell');
        }, 180000); 
    }
};

const SaveLoadExpansion = {
    patch: (game) => {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'o') {
                const state = {
                    eco: game.eco, pop: game.pop, maxPop: game.maxPop, techLevel: game.techLevel, camera: game.camera, tick: game.tick,
                    spiders: game.spiders.map(s => ({x: s.x, y: s.y, team: s.team, role: s.role, hp: s.hp, cargo: s.cargo})),
                    structures: game.structures.map(s => ({x: s.x, y: s.y, team: s.team, type: s.type, hp: s.hp})),
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
                state.structures.forEach(s => { let o = new Structure(s.x, s.y, s.team, s.type); o.hp = s.hp; game.addEntity(o); });
                state.resourceNodes.forEach(p => { let o = new ResourceNode(p.x, p.y, p.type); o.resources = p.resources; game.addEntity(o); });
                state.queens.forEach(q => { let o = new Queen(q.x, q.y, q.team); o.hp = q.hp; game.addEntity(o); });
                
                alert("Game Loaded!");
            }
        });
    }
};

const AdvancedUnitControlExpansion = {
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

        const handleRTSClick = (e, clientX, clientY, targetElem) => {
            const wasDraggingBox = isDraggingBox;
            isDraggingBox = false;
            
            if (targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#rtsUI'))) {
                game.dragBox = null; return;
            }

            const worldX = clientX + game.camera.x; 
            const worldY = clientY + game.camera.y;
            const isRightClick = e.button === 2;
            const isLeftClick = e.button === 0;

            if (isRightClick && game.selectedUnits.length > 0) {
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
            } else if (isLeftClick) {
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

                    let clickedUnit = null; let clickedStruct = null;
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

        window.addEventListener('mouseup', e => handleRTSClick(e, e.clientX, e.clientY, e.target));
        
        game.canvas.addEventListener('touchstart', e => { 
            if(e.touches.length===1) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }
        }, {passive: false});
        window.addEventListener('touchend', e => { 
            if(e.changedTouches.length===1) handleRTSClick(e, e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target); 
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
                        this.x += Math.cos(this.angle) * this.baseSpeed; this.y += Math.sin(this.angle) * this.baseSpeed;
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
                    if (MathUtils.distSq(0,0, dx, dy) > 225) { // 15 squared
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

const ContextUIExpansion = {
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

                this.selectedUnits = this.selectedUnits.filter(u => u.hp > 0);

                if (this.selectedUnits.length > 1) {
                    portrait.src = 'assets/black_spider.png';
                    nameEl.innerText = `Swarm Group (${this.selectedUnits.length})`;
                    addButton('auto'); addButton('cancel');
                }
                else if (this.selectedUnits.length === 1) {
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

                // PERFORMANCE: Only update DOM if the string actually changes!
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

const ConstructionExpansion = {
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
                else if (MathUtils.distSq(this.activeConstruction.x, this.activeConstruction.y, this.x, this.y) <= 4900) { // 70 squared
                    this.activeConstruction.buildProgress += 0.001;
                    this.activeConstruction.isPaused = false;
                    
                    if (gameObj.tick % 15 === 0) {
                        gameObj.bus.emit('particles', {x: this.activeConstruction.x, y: this.activeConstruction.y, color: '#ff9d00', count: 2});
                    }
                    
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
                    if (distSq < 3600) { // 60 squared
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
                if (unfinished) {
                    this.activeConstruction = unfinished; 
                }
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

const FogOfWarExpansion = {
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

        game.bus.on('uiDraw', (ctx) => {
            if (!game.fowCanvas) return;
            ctx.save();
            ctx.filter = 'blur(30px)'; 
            ctx.drawImage(
                game.fowCanvas, 
                -game.camera.x, 
                -game.camera.y, 
                game.fowCanvas.width * game.tileSize, 
                game.fowCanvas.height * game.tileSize
            );
            ctx.restore();
        });
    }
};

// ==========================================
// BOOTSTRAP
// ==========================================
window.onload = () => {
    const game = new Game();
    
    // Core Game Systems
    game.expansions.load('TerrainGen', TerrainExpansion); 
    game.expansions.load('DecorSystem', DecorExpansion); 
    game.expansions.load('AdvancedBaseBuilder', AdvancedBaseExpansion); 
    game.expansions.load('QueenSystem', QueenExpansion); 
    game.expansions.load('CombatAndHarvesterAI', CombatAndHarvesterExpansion); 
    game.expansions.load('WebNetwork', WebNetworkExpansion); 
    game.expansions.load('SilkNetwork', SilkNetworkExpansion);
    
    // UI EXPANSIONS
    game.expansions.load('MinimapUI', MinimapExpansion); 
    game.expansions.load('AdvancedUnitControl', AdvancedUnitControlExpansion);
    game.expansions.load('ConstructionLogic', ConstructionExpansion);
    game.expansions.load('ContextUI', ContextUIExpansion);
    game.expansions.load('GameLoop', GameLoopExpansion); 
    game.expansions.load('SaveLoadManager', SaveLoadExpansion); 
    
    // JUICE & AUDIO
    game.expansions.load('ParticleEngine', ParticleExpansion); 
    game.expansions.load('Atmosphere', AtmosphereExpansion); 
    game.expansions.load('CommanderSpells', SpellExpansion); 
    game.expansions.load('AudioSynth', AudioExpansion);
    game.expansions.load('CentipedeBoss', GodUnitExpansion); 

    // REQUIRED TO LOAD LAST: Wraps previously modified draw calls (like cocoons and shadows) in darkness
    game.expansions.load('FogOfWar', FogOfWarExpansion); 
};
