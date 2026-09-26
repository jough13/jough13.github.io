// ==========================================
// 1. CORE ARCHITECTURE & UTILITIES
// ==========================================
export const MathUtils = {
    distSq: (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2,
    dist: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
};

export class GameBus {
    constructor() { this.listeners = {}; }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data)); }
}

export class ExpansionManager {
    constructor(game) { this.game = game; this.expansions = {}; }
    load(name, expansion) {
        console.log(`[Plugin Loaded] ${name}`);
        this.expansions[name] = expansion;
        if (expansion.init) expansion.init(this.game);
        if (expansion.patch) expansion.patch(this.game);
    }
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
export class Spider {
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
        if (this.imageLoaded) { ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2); } 
        else { ctx.fillStyle = this.type === 'pumpkin' ? '#ff7b00' : '#00aaff'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    }
}

export class Structure {
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

export class Projectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; this.target = target; this.damage = damage; this.team = team;
        this.speed = 5; this.active = true;
    }
    update(game) {
        if(!this.target || this.target.hp <= 0) { this.active = false; return; }
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const distSq = MathUtils.distSq(this.x, this.y, this.target.x, this.target.y);
        if (distSq < 100) { 
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
export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas'); this.ctx = this.canvas.getContext('2d');
        this.bus = new GameBus(); this.expansions = new ExpansionManager(this);
        
        this.world = { width: 6000, height: 6000 }; 
        this.camera = { x: 0, y: 0 }; this.tick = 0; 
        
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

    // Dynamic getters using class names (Works beautifully with modular files!)
    get spiders() { return this.entities.filter(e => e.role && e.cargo !== undefined); }
    get queens() { return this.entities.filter(e => e.constructor.name === 'Queen'); }
    get structures() { return this.entities.filter(e => e instanceof Structure); }
    get resourceNodes() { return this.entities.filter(e => e instanceof ResourceNode); }
    get projectiles() { return this.entities.filter(e => e instanceof Projectile); }
    get critters() { return this.entities.filter(e => e.team === 'nature'); }
    get bosses() { return this.entities.filter(e => e.constructor.name === 'CentipedeBoss'); }
    
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
                if(targetElem && targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#mobileToolbar') || targetElem.closest('#rtsUI') || targetElem.closest('#gameOverModal'))) return;

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
                if (e instanceof Spider && e.constructor.name !== 'Queen') {
                    if (e.team === 'black') blackPop++; else if (e.team === 'red') redPop++;
                }
            });
            this.maxPop.black = 10 + (blackEggs * 10);
            this.maxPop.red = 10 + (redEggs * 10);
            this.pop.black = blackPop;
            this.pop.red = redPop;
        }

        for (let i = this.entities.length - 1; i >= 0; i--) {
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
            if (e.type === 'wall' && dSq < (250*250)) dSq = Math.max(0, dSq - 10000); 
            
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
        
        this.bus.emit('postDraw', this.ctx);
        this.ctx.restore();
        this.bus.emit('uiDraw', this.ctx);
    }
}
