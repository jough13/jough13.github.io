// ==========================================
// 1. CORE ARCHITECTURE
// ==========================================

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
}

// ==========================================
// 2. GAME ENTITIES (BASE)
// ==========================================

class Spider {
    constructor(x, y, team, role = 'harvester') {
        this.x = x; this.y = y; this.team = team; this.role = role;
        
        // Base Stats differ by role!
        this.size = role === 'soldier' ? 16 : 12;
        this.speed = role === 'soldier' ? (Math.random() * 1.5 + 1.5) : (Math.random() * 1.5 + 1.0);
        this.hp = role === 'soldier' ? 200 : 100;
        this.maxHp = this.hp;
        this.damage = role === 'soldier' ? 30 : 15;
        this.attackSpeed = role === 'soldier' ? 20 : 30;
        this.cooldown = 0;
        
        this.angle = 0; this.state = 'idle'; this.target = null; this.cargo = 0; 
        
        this.sprite = new Image();
        if (role === 'soldier') {
            this.sprite.src = team === 'black' ? 'assets/soldier_black.png' : 'assets/soldier_red.png';
        } else {
            this.sprite.src = team === 'black' ? 'assets/black_spider.png' : 'assets/red_spider.png';
        }
        
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
        if (this.cargo > 0) { ctx.fillStyle = '#ff7b00'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    }
}

class Pumpkin {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = 25; this.resources = 100; 
        this.sprite = new Image(); this.sprite.src = 'assets/pumpkin.png';
        this.imageLoaded = false; this.sprite.onload = () => { this.imageLoaded = true; };
    }
    draw(ctx) {
        if (this.resources <= 0) return; 
        ctx.save(); ctx.translate(this.x, this.y);
        const scale = Math.max(0.4, this.resources / 100); ctx.scale(scale, scale);
        if (this.imageLoaded) { ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2); } 
        else { ctx.fillStyle = '#ff7b00'; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    }
}

class Structure {
    constructor(x, y, team, type) {
        this.x = x; this.y = y; this.team = team; this.type = type;
        this.hp = type === 'wall' ? 500 : 200; this.maxHp = this.hp;
        if(type === 'nest') this.size = 40; else if(type === 'eggsac') this.size = 25; 
        else if(type === 'turret') { this.size = 20; this.cooldown = 0; } else if(type === 'wall') this.size = 35; 

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
            ctx.strokeStyle = this.team; ctx.lineWidth = 2; ctx.stroke();
        }
    }
}

class Projectile {
    constructor(x, y, target, damage, team) {
        this.x = x; this.y = y; this.target = target; this.damage = damage; this.team = team;
        this.speed = 5; this.active = true;
    }
    update() {
        if(!this.target || this.target.hp <= 0) { this.active = false; return; }
        const dx = this.target.x - this.x; const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) { this.target.hp -= this.damage; this.active = false; } 
        else { this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; }
    }
    draw(ctx) {
        ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ffaa00'; 
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }
}

// ==========================================
// 3. MAIN GAME CLASS 
// ==========================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bus = new GameBus();
        this.expansions = new ExpansionManager(this);
        
        this.world = { width: 4000, height: 4000 };
        this.camera = { x: 0, y: 0 };
        
        this.spiders = []; this.pumpkins = []; this.structures = []; 
        this.queens = []; this.projectiles = []; this.bugs = [];
        
        this.scores = { black: 400, red: 400 }; 
        this.pop = { black: 0, red: 0 };
        this.maxPop = { black: 10, red: 10 };
        
        // New Game States
        this.techLevel = { black: 0, red: 0 }; 
        this.buildSelection = 'nest'; 
        this.unitSelection = 'harvester';
        this.gameState = 'playing'; 

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInputs();
        
        requestAnimationFrame(() => this.loop());
    }

    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

    setupInputs() {
        this.keys = {};
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            this.keys[k] = true;
            if(k === '1') this.buildSelection = 'nest';
            if(k === '2') this.buildSelection = 'eggsac';
            if(k === '3') this.buildSelection = 'turret';
            if(k === '4') this.buildSelection = 'wall';
            if(k === '5') this.unitSelection = 'harvester';
            if(k === '6') this.unitSelection = 'soldier';
            
            // Upgrade Hotkey
            if(k === 'u') {
                if(this.scores.black >= 250) {
                    this.scores.black -= 250;
                    this.techLevel.black++;
                }
            }
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        let isDragging = false; let dragStartX, dragStartY, camStartX, camStartY, hasMoved;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { 
                isDragging = true; hasMoved = false;
                dragStartX = e.clientX; dragStartY = e.clientY;
                camStartX = this.camera.x; camStartY = this.camera.y;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging && !this.isMinimapDragging) {
                let dx = e.clientX - dragStartX; let dy = e.clientY - dragStartY;
                if (Math.hypot(dx, dy) > 5) hasMoved = true; 
                if (hasMoved) { this.camera.x = camStartX - dx; this.camera.y = camStartY - dy; }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0 && isDragging) {
                isDragging = false;
                if (!hasMoved && !this.isMinimapDragging) {
                    const worldX = e.clientX + this.camera.x; const worldY = e.clientY + this.camera.y;
                    if (this.keys['e']) this.bus.emit('buildStructure', { x: worldX, y: worldY, team: 'black', type: this.buildSelection });
                    else this.bus.emit('spawnSpider', { x: worldX, y: worldY, team: 'black', role: this.unitSelection });
                }
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.bus.emit('commandQueen', { x: e.clientX + this.camera.x, y: e.clientY + this.camera.y, team: 'black' });
        });

        this.bus.on('spawnSpider', (data) => {
            const cost = data.role === 'soldier' ? 25 : 10;
            if (this.scores[data.team] >= cost && this.pop[data.team] < this.maxPop[data.team]) {
                this.scores[data.team] -= cost;
                this.spiders.push(new Spider(data.x, data.y, data.team, data.role));
            }
        });
        
        this.bus.on('buildStructure', (data) => {
            const costs = { 'nest': 150, 'eggsac': 50, 'turret': 100, 'wall': 25 };
            const cost = costs[data.type];
            if (this.scores[data.team] >= cost) {
                this.scores[data.team] -= cost;
                this.structures.push(new Structure(data.x, data.y, data.team, data.type));
            }
        });
    }

    updateUI() {
        if(this.gameState !== 'playing') return;
        document.getElementById('debug').innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:1.1em;">
                <span><strong>Black: ${this.scores.black}🎃</strong> | Pop: ${this.pop.black}/${this.maxPop.black} | <strong>Tech LVL: ${this.techLevel.black}</strong></span>
                <span style="color:#ff4444;"><strong>Red: ${this.scores.red}🎃</strong> | Pop: ${this.pop.red}/${this.maxPop.red} | <strong>Tech LVL: ${this.techLevel.red}</strong></span>
            </div>
            <hr style="border-color:#ff9d0055;">
            <div style="display:flex; justify-content:space-between;">
                <div>
                    <strong>Spawns (Click):</strong> 
                    <span style="${this.unitSelection==='harvester'?'color:white;':''}">[5] Harvester (10)</span> | 
                    <span style="${this.unitSelection==='soldier'?'color:white;':''}">[6] Soldier (25)</span><br>
                    <strong>Builds (E+Click):</strong> 
                    <span style="${this.buildSelection==='nest'?'color:white;':''}">[1] Nest(150)</span> | 
                    <span style="${this.buildSelection==='eggsac'?'color:white;':''}">[2] EggSac(50)</span> | 
                    <span style="${this.buildSelection==='turret'?'color:white;':''}">[3] Turret(100)</span> | 
                    <span style="${this.buildSelection==='wall'?'color:white;':''}">[4] Wall(25)</span>
                </div>
                <div style="text-align:right;">
                    <strong>[U] Upgrade Swarm (250)</strong><br>
                    <strong>[O] Save Game | [P] Load Game</strong>
                </div>
            </div>
        `;
    }

    loop() { this.update(); this.draw(); requestAnimationFrame(() => this.loop()); }

    update() {
        if (this.gameState !== 'playing') return; 

        const camSpeed = 15;
        if (this.keys['w']) this.camera.y -= camSpeed; if (this.keys['s']) this.camera.y += camSpeed;
        if (this.keys['a']) this.camera.x -= camSpeed; if (this.keys['d']) this.camera.x += camSpeed;
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height - this.canvas.height));

        this.maxPop.black = 10 + (this.structures.filter(s => s.team === 'black' && s.type === 'eggsac').length * 10);
        this.maxPop.red = 10 + (this.structures.filter(s => s.team === 'red' && s.type === 'eggsac').length * 10);
        this.pop.black = this.spiders.filter(s => s.team === 'black').length;
        this.pop.red = this.spiders.filter(s => s.team === 'red').length;

        this.structures.forEach(s => s.update(this)); this.spiders.forEach(s => s.update(this));
        this.queens.forEach(q => q.update(this)); this.projectiles.forEach(p => p.update(this));
        this.bugs.forEach(b => b.update(this));
        
        this.pumpkins = this.pumpkins.filter(p => p.resources > 0);
        this.spiders = this.spiders.filter(s => s.hp > 0);
        this.queens = this.queens.filter(q => q.hp > 0);
        this.structures = this.structures.filter(s => s.hp > 0);
        this.projectiles = this.projectiles.filter(p => p.active);
        this.bugs = this.bugs.filter(b => b.hp > 0);

        this.updateUI();
    }

    draw() {
        this.ctx.fillStyle = '#2c1e16'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save(); 
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.bus.emit('preDraw', this.ctx);
        this.structures.forEach(s => s.draw(this.ctx)); this.pumpkins.forEach(p => p.draw(this.ctx));
        this.bugs.forEach(b => b.draw(this.ctx)); this.spiders.forEach(s => s.draw(this.ctx));
        this.queens.forEach(q => q.draw(this.ctx)); this.projectiles.forEach(p => p.draw(this.ctx));
        this.ctx.restore();
        this.bus.emit('uiDraw', this.ctx);
    }
}

// ==========================================
// 4. EXPANSIONS (THE MAGIC)
// ==========================================

const TerrainExpansion = {
    init: (game) => {
        game.tileSize = 256; 
        game.tiles = { dirt: new Image(), vines: new Image(), pebbles: new Image() };
        game.tiles.dirt.src = 'assets/tile_dirt.png'; game.tiles.vines.src = 'assets/tile_vines.png'; game.tiles.pebbles.src = 'assets/tile_pebbles.png';
        game.generateMap = function() {
            this.mapGrid = [];
            for (let y = 0; y < Math.ceil(this.world.height / this.tileSize); y++) {
                let row = [];
                for (let x = 0; x < Math.ceil(this.world.width / this.tileSize); x++) {
                    const r = Math.random(); row.push(r > 0.75 ? 'vines' : (r > 0.60 ? 'pebbles' : 'dirt'));
                }
                this.mapGrid.push(row);
            }
        };
        game.generateMap();
    },
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            if (!game.mapGrid) return;
            const startCol = Math.floor(game.camera.x / game.tileSize); const endCol = startCol + Math.ceil(game.canvas.width / game.tileSize) + 1;
            const startRow = Math.floor(game.camera.y / game.tileSize); const endRow = startRow + Math.ceil(game.canvas.height / game.tileSize) + 1;
            for (let y = startRow; y <= endRow; y++) {
                for (let x = startCol; x <= endCol; x++) {
                    if (y >= 0 && y < game.mapGrid.length && x >= 0 && x < game.mapGrid[y].length) {
                        const type = game.mapGrid[y][x]; const img = game.tiles[type];
                        if (img.complete && img.naturalHeight !== 0) ctx.drawImage(img, x*game.tileSize, y*game.tileSize, game.tileSize, game.tileSize);
                        else { ctx.fillStyle = type==='dirt'?'#3d2817':(type==='vines'?'#2d4c1e':'#555'); ctx.fillRect(x*game.tileSize, y*game.tileSize, game.tileSize, game.tileSize); }
                    }
                }
            }
        });
    }
};

class GoldenBug {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = 15; this.hp = 250; this.maxHp = 250;
        this.angle = Math.random() * Math.PI * 2; this.speed = 0.5; this.team = 'nature'; 
    }
    update(game) {
        if(Math.random() < 0.05) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        if(this.hp <= 0) for(let i=0; i<5; i++) game.pumpkins.push(new Pumpkin(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100));
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle = '#ffd700'; 
        ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(this.size/2, -2, 4, 4); ctx.restore();
        if(this.hp < this.maxHp) { ctx.fillStyle='red'; ctx.fillRect(this.x-10, this.y-20, 20, 4); ctx.fillStyle='lime'; ctx.fillRect(this.x-10, this.y-20, 20*(this.hp/this.maxHp), 4); }
    }
}

const AdvancedBaseExpansion = {
    init: (game) => {
        setTimeout(() => {
            const pad = 400;
            const bX = pad + Math.random() * 200; const bY = pad + Math.random() * 200;
            const rX = game.world.width - pad - Math.random() * 200; const rY = game.world.height - pad - Math.random() * 200;

            game.structures.push(new Structure(bX, bY, 'black', 'nest'));
            game.structures.push(new Structure(bX + 80, bY, 'black', 'eggsac'));
            game.structures.push(new Structure(rX, rY, 'red', 'nest'));
            game.structures.push(new Structure(rX - 80, rY, 'red', 'eggsac'));

            game.camera.x = Math.max(0, bX - (game.canvas.width / 2));
            game.camera.y = Math.max(0, bY - (game.canvas.height / 2));
            
            for (let i = 0; i < 20; i++) {
                let pX = 600 + Math.random() * (game.world.width - 1200); let pY = 600 + Math.random() * (game.world.height - 1200);
                for (let p = 0; p < Math.floor(Math.random() * 6) + 5; p++) game.pumpkins.push(new Pumpkin(pX + (Math.random() - 0.5) * 300, pY + (Math.random() - 0.5) * 300));
            }
            
            for(let i=0; i<3; i++) game.bugs.push(new GoldenBug(game.world.width/2 + (Math.random()-0.5)*1000, game.world.height/2 + (Math.random()-0.5)*1000));
        }, 100);
    }
};

class Queen extends Spider {
    constructor(x, y, team) {
        super(x, y, team);
        this.size = 28; this.speed = 1.2; 
        this.hp = 1500; this.maxHp = 1500; 
        this.damage = 40; this.commandTarget = null; 
        this.sprite.src = team === 'black' ? 'assets/queen_black.png' : 'assets/queen_red.png';
    }
    update(game) {
        if (this.team === 'red' && !this.commandTarget) {
            const bNests = game.structures.filter(s => s.team === 'black' && s.type === 'nest');
            if(bNests.length > 0) this.commandTarget = { x: bNests[0].x, y: bNests[0].y };
        }
        if (this.commandTarget) {
            const dx = this.commandTarget.x - this.x; const dy = this.commandTarget.y - this.y;
            const techSpeed = (game.techLevel[this.team] * 0.2); // Apply tech speed
            if (Math.hypot(dx, dy) > 10) {
                this.angle = Math.atan2(dy, dx);
                this.x += Math.cos(this.angle) * (this.speed + techSpeed); this.y += Math.sin(this.angle) * (this.speed + techSpeed);
            } else this.commandTarget = null; 
        }
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
        setTimeout(() => {
            if(game.queens.length > 0) return; // Prevent dupes on load
            const bNest = game.structures.find(s => s.team === 'black' && s.type === 'nest');
            const rNest = game.structures.find(s => s.team === 'red' && s.type === 'nest');
            if(bNest) game.queens.push(new Queen(bNest.x + 50, bNest.y + 50, 'black'));
            if(rNest) game.queens.push(new Queen(rNest.x - 50, rNest.y - 50, 'red'));
        }, 150);
        game.bus.on('commandQueen', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if(queen) queen.commandTarget = { x: data.x, y: data.y };
        });
    }
};

const HiveMindExpansion = {
    patch: (game) => {
        Structure.prototype.update = function(game) {
            // Apply Turret Tech Upgrades
            const tDamage = 25 + (game.techLevel[this.team] * 10);

            if(this.type === 'turret') {
                this.cooldown--;
                if(this.cooldown <= 0) {
                    let allEnemies = game.spiders.concat(game.queens).concat(game.bugs).filter(e => e.team !== this.team);
                    for(let e of allEnemies) {
                        if(Math.hypot(e.x - this.x, e.y - this.y) < 200) { 
                            game.projectiles.push(new Projectile(this.x, this.y, e, tDamage, this.team));
                            this.cooldown = 45; break; 
                        }
                    }
                }
            }
            if (this.team === 'red' && this.type === 'nest') {
                // AI Tech Upgrade Logic
                if (game.scores.red >= 250 && Math.random() < 0.1) {
                    game.scores.red -= 250; game.techLevel.red++;
                }

                if (game.scores.red >= 50 && game.pop.red < game.maxPop.red) {
                    if(!this.spawnTimer) this.spawnTimer = 0;
                    this.spawnTimer--;
                    if(this.spawnTimer <= 0) {
                        // AI Chooses Harvester or Soldier based on random chance
                        const role = Math.random() > 0.6 ? 'soldier' : 'harvester';
                        const cost = role === 'soldier' ? 25 : 10;
                        if(game.scores.red >= cost) {
                            game.scores.red -= cost; 
                            game.bus.emit('spawnSpider', { x: this.x + (Math.random()-0.5)*100, y: this.y + (Math.random()-0.5)*100, team: 'red', role: role });
                            this.spawnTimer = 90; 
                        }
                    }
                } else if (game.pop.red >= game.maxPop.red && game.scores.red > 150) {
                    game.scores.red -= 50;
                    game.structures.push(new Structure(this.x + (Math.random()-0.5)*200, this.y + (Math.random()-0.5)*200, 'red', 'eggsac'));
                }
            }
        };
    }
};

const CombatAndHarvesterExpansion = {
    patch: (game) => {
        Spider.prototype.update = function(game) {
            // Apply Dynamic Tech Upgrades
            const techLvl = game.techLevel[this.team];
            const maxHpBonus = techLvl * 20;
            const currentDamage = this.damage + (techLvl * 5);
            const currentSpeed = this.speed + (techLvl * 0.15);

            let allEnemies = game.spiders.concat(game.queens).concat(game.bugs).concat(game.structures).filter(e => e.team !== this.team && e.hp > 0);
            let nearestEnemy = null; let minDist = 150 + (techLvl * 10); // Tech increases vision slightly
            for (let enemy of allEnemies) {
                let d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if(enemy.type === 'wall' && d < 250) d -= 100; 
                if (d < minDist) { minDist = d; nearestEnemy = enemy; }
            }

            if (nearestEnemy) {
                this.state = 'combat'; this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;
                if (minDist > combatRange) { 
                    this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                } else {
                    this.cooldown--;
                    if (this.cooldown <= 0) {
                        nearestEnemy.hp -= currentDamage; this.cooldown = this.attackSpeed;
                        this.x -= Math.cos(this.angle) * 10; this.y -= Math.sin(this.angle) * 10; 
                    }
                }
                return; 
            }

            // Soldiers guard the Queen if no enemies!
            if (this.role === 'soldier') {
                const myQueen = game.queens.find(q => q.team === this.team);
                if (myQueen) {
                    const dx = myQueen.x - this.x; const dy = myQueen.y - this.y;
                    if (Math.hypot(dx, dy) > 80) { // Keep distance
                        this.angle = Math.atan2(dy, dx);
                        this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                    }
                }
                return; // Soldiers don't harvest
            }

            // Harvesters gather Pumpkins
            if (this.cargo === 0) this.state = 'seeking_pumpkin'; else this.state = 'returning_home';
            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    if (game.pumpkins.length > 0) {
                        let closest = null; let minD = Infinity;
                        for(let p of game.pumpkins) { let d = Math.hypot(p.x - this.x, p.y - this.y); if(d < minD) { minD = d; closest = p; } }
                        this.target = closest;
                    } else this.target = null;
                }
            } else {
                let closest = null; let minD = Infinity;
                game.structures.filter(s => s.team === this.team && s.type === 'nest').forEach(n => {
                    let d = Math.hypot(n.x - this.x, n.y - this.y); if(d < minD) { minD = d; closest = n; }
                });
                game.queens.filter(q => q.team === this.team).forEach(q => {
                    let d = Math.hypot(q.x - this.x, q.y - this.y); if(d < minD) { minD = d; closest = q; }
                });
                this.target = closest;
            }

            if (this.target) {
                const dx = this.target.x - this.x; const dy = this.target.y - this.y;
                const dist = Math.hypot(dx, dy); this.angle = Math.atan2(dy, dx);
                const targetRadius = this.target.size ? this.target.size + 5 : 15;
                if (dist > targetRadius) { 
                    this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                } else {
                    if (this.state === 'seeking_pumpkin' && this.target.resources > 0) {
                        this.cargo = 10; this.target.resources -= 10; this.target = null; 
                    } else if (this.state === 'returning_home') {
                        game.scores[this.team] += this.cargo; this.cargo = 0; this.target = null;
                    }
                }
            } else {
                this.angle += (Math.random() - 0.5) * 0.5;
                this.x += Math.cos(this.angle) * (currentSpeed * 0.5); this.y += Math.sin(this.angle) * (currentSpeed * 0.5);
                this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
            }
        };

        const drawHealth = function(ctx) {
            if (this.hp !== undefined && this.hp < (this.maxHp + (game.techLevel[this.team] || 0) * 20)) {
                const max = this.maxHp + ((game.techLevel[this.team] || 0) * 20);
                const w = this.size * 1.5; ctx.fillStyle = 'black'; ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 11, w + 2, 6);
                ctx.fillStyle = 'red'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w, 4);
                ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w * (Math.max(0, this.hp) / max), 4);
            }
        };
        const ogSpiderDraw = Spider.prototype.draw; Spider.prototype.draw = function(ctx) { ogSpiderDraw.call(this, ctx); drawHealth.call(this, ctx); };
        const ogQueenDraw = Queen.prototype.draw; Queen.prototype.draw = function(ctx) { ogQueenDraw.call(this, ctx); drawHealth.call(this, ctx); };
        const ogStructDraw = Structure.prototype.draw; Structure.prototype.draw = function(ctx) { ogStructDraw.call(this, ctx); drawHealth.call(this, ctx); };
    }
};

const MinimapExpansion = {
    // ... [Same logic as before, just keeps UI elements rendering correctly] ...
    init: (game) => {
        game.minimap = { size: 250, padding: 20 }; game.isMinimapDragging = false;
        game.moveCameraFromMinimap = function(localX, localY) {
            const pctX = Math.max(0, Math.min(localX / this.minimap.size, 1));
            const pctY = Math.max(0, Math.min(localY / this.minimap.size, 1));
            this.camera.x = (pctX * this.world.width) - (this.canvas.width / 2);
            this.camera.y = (pctY * this.world.height) - (this.canvas.height / 2);
        };
        game.canvas.addEventListener('mousedown', (e) => {
            const mmX = game.canvas.width - game.minimap.size - game.minimap.padding; const mmY = game.canvas.height - game.minimap.size - game.minimap.padding;
            if (e.clientX >= mmX && e.clientX <= mmX + game.minimap.size && e.clientY >= mmY && e.clientY <= mmY + game.minimap.size) {
                game.isMinimapDragging = true; game.moveCameraFromMinimap(e.clientX - mmX, e.clientY - mmY);
            }
        });
        window.addEventListener('mousemove', (e) => {
            if (game.isMinimapDragging) {
                const mmX = game.canvas.width - game.minimap.size - game.minimap.padding; const mmY = game.canvas.height - game.minimap.size - game.minimap.padding;
                game.moveCameraFromMinimap(e.clientX - mmX, e.clientY - mmY);
            }
        });
        window.addEventListener('mouseup', () => game.isMinimapDragging = false);
    },
    patch: (game) => {
        game.bus.on('uiDraw', (ctx) => {
            if(game.gameState !== 'playing') return;
            const size = game.minimap.size; const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; const startY = game.canvas.height - size - pad;
            ctx.fillStyle = 'rgba(20, 10, 5, 0.8)'; ctx.fillRect(startX, startY, size, size);
            ctx.strokeStyle = '#ff9d00'; ctx.lineWidth = 2; ctx.strokeRect(startX, startY, size, size);

            const scaleX = size / game.world.width; const scaleY = size / game.world.height;
            const drawDot = (ent, color, r) => { ctx.fillStyle = color; ctx.fillRect(startX + (ent.x * scaleX) - r, startY + (ent.y * scaleY) - r, r*2, r*2); };

            game.pumpkins.forEach(p => drawDot(p, '#ff7b00', 1.5));
            game.structures.forEach(s => drawDot(s, s.team === 'black' ? '#ffffff' : '#ff4444', 3));
            game.spiders.forEach(s => drawDot(s, s.team === 'black' ? '#aaaaaa' : '#aa0000', 1));
            game.bugs.forEach(b => drawDot(b, 'gold', 2.5));
            game.queens.forEach(q => { drawDot(q, q.team === 'black' ? '#ffffff' : '#ff4444', 4); ctx.strokeStyle = 'gold'; ctx.lineWidth = 1; ctx.strokeRect(startX + (q.x * scaleX) - 5, startY + (q.y * scaleY) - 5, 10, 10); });

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1;
            ctx.strokeRect(startX + (game.camera.x * scaleX), startY + (game.camera.y * scaleY), game.canvas.width * scaleX, game.canvas.height * scaleY);
        });
    }
};

const GameLoopExpansion = {
    patch: (game) => {
        const ogUpdate = Game.prototype.update;
        Game.prototype.update = function() {
            ogUpdate.call(this); 
            if (this.queens.length > 0 && this.gameState === 'playing') {
                const blackQueen = this.queens.find(q => q.team === 'black');
                const redQueen = this.queens.find(q => q.team === 'red');
                if (!blackQueen || blackQueen.hp <= 0) { this.gameState = 'lose'; document.getElementById('debug').innerHTML = ''; } 
                else if (!redQueen || redQueen.hp <= 0) { this.gameState = 'win'; document.getElementById('debug').innerHTML = ''; }
            }
        };

        game.bus.on('uiDraw', (ctx) => {
            if (game.gameState === 'playing') return;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 80px Courier New';
            if (game.gameState === 'win') {
                ctx.fillStyle = '#00ff00'; ctx.fillText('VICTORY', game.canvas.width / 2, game.canvas.height / 2 - 40);
                ctx.font = '20px Courier New'; ctx.fillStyle = 'white'; ctx.fillText('The Pumpkin Patch belongs to the Black Swarm.', game.canvas.width / 2, game.canvas.height / 2 + 30);
            } else if (game.gameState === 'lose') {
                ctx.fillStyle = '#ff0000'; ctx.fillText('DEFEAT', game.canvas.width / 2, game.canvas.height / 2 - 40);
                ctx.font = '20px Courier New'; ctx.fillStyle = 'white'; ctx.fillText('Your Queen has fallen to the Red Swarm.', game.canvas.width / 2, game.canvas.height / 2 + 30);
            }
            ctx.font = '16px Courier New'; ctx.fillStyle = '#888'; ctx.fillText('Refresh the page to play again.', game.canvas.width / 2, game.canvas.height / 2 + 90);
        });
    }
};

// --- NEW EXPANSION: SAVE AND LOAD ---
const SaveLoadExpansion = {
    patch: (game) => {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'o') {
                // SAVE GAME
                const state = {
                    scores: game.scores, pop: game.pop, maxPop: game.maxPop, techLevel: game.techLevel, 
                    camera: game.camera, mapGrid: game.mapGrid,
                    spiders: game.spiders.map(s => ({x: s.x, y: s.y, team: s.team, role: s.role, hp: s.hp, cargo: s.cargo})),
                    structures: game.structures.map(s => ({x: s.x, y: s.y, team: s.team, type: s.type, hp: s.hp})),
                    pumpkins: game.pumpkins.map(p => ({x: p.x, y: p.y, resources: p.resources})),
                    queens: game.queens.map(q => ({x: q.x, y: q.y, team: q.team, hp: q.hp})),
                    bugs: game.bugs.map(b => ({x: b.x, y: b.y, hp: b.hp}))
                };
                localStorage.setItem('spiderRTS_saveData', JSON.stringify(state));
                alert("Game Saved Successfully!");
            }
            
            if (e.key.toLowerCase() === 'p') {
                // LOAD GAME
                const data = localStorage.getItem('spiderRTS_saveData');
                if(!data) return alert("No save game found!");
                
                const state = JSON.parse(data);
                game.scores = state.scores; game.pop = state.pop; game.maxPop = state.maxPop; 
                game.techLevel = state.techLevel; game.camera = state.camera; game.mapGrid = state.mapGrid;
                
                // Re-instantiate objects to give them back their class functions (draw/update)
                game.spiders = state.spiders.map(s => { let o = new Spider(s.x, s.y, s.team, s.role); o.hp = s.hp; o.cargo = s.cargo; return o; });
                game.structures = state.structures.map(s => { let o = new Structure(s.x, s.y, s.team, s.type); o.hp = s.hp; return o; });
                game.pumpkins = state.pumpkins.map(p => { let o = new Pumpkin(p.x, p.y); o.resources = p.resources; return o; });
                game.queens = state.queens.map(q => { let o = new Queen(q.x, q.y, q.team); o.hp = q.hp; return o; });
                game.bugs = state.bugs.map(b => { let o = new GoldenBug(b.x, b.y); o.hp = b.hp; return o; });
                
                game.projectiles = []; // Clear projectiles so they don't error out
                alert("Game Loaded Successfully!");
            }
        });
    }
};

// ==========================================
// BOOTSTRAP
// ==========================================
window.onload = () => {
    const game = new Game();
    game.expansions.load('TerrainGen', TerrainExpansion);
    game.expansions.load('AdvancedBaseBuilder', AdvancedBaseExpansion); 
    game.expansions.load('QueenSystem', QueenExpansion); 
    game.expansions.load('MinimapUI', MinimapExpansion); 
    game.expansions.load('GameLoop', GameLoopExpansion); 
    game.expansions.load('HiveMind', HiveMindExpansion); 
    game.expansions.load('CombatAndHarvesterAI', CombatAndHarvesterExpansion); 
    game.expansions.load('SaveLoadManager', SaveLoadExpansion); // ADDED SAVING AND LOADING
};
