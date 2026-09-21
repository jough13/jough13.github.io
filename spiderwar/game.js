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
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team; this.size = 12;
        this.speed = Math.random() * 1.5 + 1.0; this.angle = 0;
        this.state = 'idle'; this.target = null; this.cargo = 0; 
        
        this.sprite = new Image();
        this.sprite.src = team === 'black' ? 'assets/black_spider.png' : 'assets/red_spider.png';
        this.imageLoaded = false; this.sprite.onload = () => { this.imageLoaded = true; };
    }
    update(game) { }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); 
        if (this.imageLoaded) { ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2); } 
        else {
            ctx.fillStyle = this.team; ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillRect(this.size/2, -3, 4, 6);
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

// Universal Structure Class
class Structure {
    constructor(x, y, team, type) {
        this.x = x; this.y = y; this.team = team; this.type = type;
        this.hp = type === 'wall' ? 500 : 200; 
        this.maxHp = this.hp;
        
        // Define stats based on type
        if(type === 'nest') this.size = 40;
        else if(type === 'eggsac') this.size = 25; // Pop cap increase
        else if(type === 'turret') { this.size = 20; this.cooldown = 0; }
        else if(type === 'wall') this.size = 35; // Blocks/Distracts

        this.sprite = new Image();
        this.sprite.src = `assets/${type}_${team}.png`; // e.g., eggsac_black.png
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; };
    }
    update(game) {} 
    draw(ctx) {
        if(this.spriteLoaded) {
            ctx.drawImage(this.sprite, this.x - this.size, this.y - this.size, this.size*2, this.size*2);
        } else {
            // Fallbacks if images aren't generated yet
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
        ctx.fillStyle = this.team === 'black' ? '#aa00ff' : '#ffaa00'; // Venom color
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }
}

// ==========================================
// 3. MAIN GAME CLASS (RTS & POPULATION)
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
        
        this.scores = { black: 300, red: 300 }; 
        this.pop = { black: 0, red: 0 };
        this.maxPop = { black: 10, red: 10 }; // Base pop cap
        this.buildSelection = 'nest'; // Default building

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInputs();
        
        requestAnimationFrame(() => this.loop());
    }

    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

    setupInputs() {
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            // Hotkeys for building
            if(e.key === '1') this.buildSelection = 'nest';
            if(e.key === '2') this.buildSelection = 'eggsac';
            if(e.key === '3') this.buildSelection = 'turret';
            if(e.key === '4') this.buildSelection = 'wall';
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
            if (isDragging) {
                let dx = e.clientX - dragStartX; let dy = e.clientY - dragStartY;
                if (Math.hypot(dx, dy) > 5) hasMoved = true; 
                if (hasMoved) { this.camera.x = camStartX - dx; this.camera.y = camStartY - dy; }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0 && isDragging) {
                isDragging = false;
                if (!hasMoved) {
                    const worldX = e.clientX + this.camera.x;
                    const worldY = e.clientY + this.camera.y;
                    
                    if (this.keys['e']) {
                        this.bus.emit('buildStructure', { x: worldX, y: worldY, team: 'black', type: this.buildSelection });
                    } else {
                        this.bus.emit('spawnSpider', { x: worldX, y: worldY, team: 'black' });
                    }
                }
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.bus.emit('commandQueen', { x: e.clientX + this.camera.x, y: e.clientY + this.camera.y, team: 'black' });
        });

        this.bus.on('spawnSpider', (data) => {
            if (this.scores[data.team] >= 10 && this.pop[data.team] < this.maxPop[data.team]) {
                this.scores[data.team] -= 10;
                this.spiders.push(new Spider(data.x, data.y, data.team));
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
        const costs = { 'nest': 150, 'eggsac': 50, 'turret': 100, 'wall': 25 };
        document.getElementById('debug').innerHTML = `
            <div style="display:flex; justify-content:space-between; font-size:1.1em;">
                <span><strong>Black: ${this.scores.black}🎃</strong> | Pop: ${this.pop.black}/${this.maxPop.black}</span>
                <span style="color:#ff4444;"><strong>Red: ${this.scores.red}🎃</strong> | Pop: ${this.pop.red}/${this.maxPop.red}</span>
            </div>
            <hr style="border-color:#ff9d0055;">
            <strong>Build Menu (Press 1-4, Hold E + Click to place):</strong><br>
            <span style="${this.buildSelection==='nest'?'color:white;':''}">[1] Nest (150)</span> | 
            <span style="${this.buildSelection==='eggsac'?'color:white;':''}">[2] Egg Sac (+10 Pop) (50)</span> | 
            <span style="${this.buildSelection==='turret'?'color:white;':''}">[3] Venom Turret (100)</span> | 
            <span style="${this.buildSelection==='wall'?'color:white;':''}">[4] Silk Wall (25)</span><br>
            <em>Left-Click: Spawn (10) | Right-Click: Command Queen</em>
        `;
    }

    loop() { this.update(); this.draw(); requestAnimationFrame(() => this.loop()); }

    update() {
        // Camera WASD
        const camSpeed = 15;
        if (this.keys['w']) this.camera.y -= camSpeed; if (this.keys['s']) this.camera.y += camSpeed;
        if (this.keys['a']) this.camera.x -= camSpeed; if (this.keys['d']) this.camera.x += camSpeed;
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height - this.canvas.height));

        // Calculate Population & Caps dynamically
        this.maxPop.black = 10 + (this.structures.filter(s => s.team === 'black' && s.type === 'eggsac').length * 10);
        this.maxPop.red = 10 + (this.structures.filter(s => s.team === 'red' && s.type === 'eggsac').length * 10);
        this.pop.black = this.spiders.filter(s => s.team === 'black').length;
        this.pop.red = this.spiders.filter(s => s.team === 'red').length;

        this.structures.forEach(s => s.update(this));
        this.spiders.forEach(s => s.update(this));
        this.queens.forEach(q => q.update(this));
        this.projectiles.forEach(p => p.update(this));
        this.bugs.forEach(b => b.update(this));
        
        // Cleanup
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
        this.ctx.save(); this.ctx.translate(-this.camera.x, -this.camera.y);

        this.bus.emit('preDraw', this.ctx);

        this.structures.forEach(s => s.draw(this.ctx));
        this.pumpkins.forEach(p => p.draw(this.ctx));
        this.bugs.forEach(b => b.draw(this.ctx)); // Draw the SimAnt bug!
        this.spiders.forEach(s => s.draw(this.ctx));
        this.queens.forEach(q => q.draw(this.ctx));
        this.projectiles.forEach(p => p.draw(this.ctx));

        this.ctx.restore();
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

// --- SIM ANT VIBE: THE GOLDEN BUG ---
class GoldenBug {
    constructor(x, y) {
        this.x = x; this.y = y; this.size = 15; this.hp = 250; this.maxHp = 250;
        this.angle = Math.random() * Math.PI * 2; this.speed = 0.5;
        this.team = 'nature'; // Enemy to all
    }
    update(game) {
        // Wander around randomly
        if(Math.random() < 0.05) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        
        // If killed, scatter massive resources!
        if(this.hp <= 0) {
            for(let i=0; i<5; i++) game.pumpkins.push(new Pumpkin(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100));
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.fillStyle = '#ffd700'; // Gold!
        ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(this.size/2, -2, 4, 4); // Eye
        ctx.restore();
        // HP Bar
        if(this.hp < this.maxHp) {
            ctx.fillStyle='red'; ctx.fillRect(this.x-10, this.y-20, 20, 4);
            ctx.fillStyle='lime'; ctx.fillRect(this.x-10, this.y-20, 20*(this.hp/this.maxHp), 4);
        }
    }
}

const AdvancedBaseExpansion = {
    init: (game) => {
        setTimeout(() => {
            const pad = 400;
            const bX = pad + Math.random() * 200; const bY = pad + Math.random() * 200;
            const rX = game.world.width - pad - Math.random() * 200; const rY = game.world.height - pad - Math.random() * 200;

            game.structures.push(new Structure(bX, bY, 'black', 'nest'));
            game.structures.push(new Structure(bX + 80, bY, 'black', 'eggsac')); // Start with 1 pop cap building
            game.structures.push(new Structure(rX, rY, 'red', 'nest'));
            game.structures.push(new Structure(rX - 80, rY, 'red', 'eggsac'));

            game.camera.x = Math.max(0, bX - (game.canvas.width / 2));
            game.camera.y = Math.max(0, bY - (game.canvas.height / 2));
            
            for (let i = 0; i < 20; i++) {
                let pX = 600 + Math.random() * (game.world.width - 1200); let pY = 600 + Math.random() * (game.world.height - 1200);
                for (let p = 0; p < Math.floor(Math.random() * 6) + 5; p++) {
                    game.pumpkins.push(new Pumpkin(pX + (Math.random() - 0.5) * 300, pY + (Math.random() - 0.5) * 300));
                }
            }
            
            // Spawn 3 Golden Bugs
            for(let i=0; i<3; i++) game.bugs.push(new GoldenBug(game.world.width/2 + (Math.random()-0.5)*1000, game.world.height/2 + (Math.random()-0.5)*1000));
            
        }, 100);
    }
};

// --- QUEEN & COMMAND EXPANSION ---
class Queen extends Spider {
    constructor(x, y, team) {
        super(x, y, team);
        this.size = 28; this.speed = 1.2; this.hp = 500; this.maxHp = 500; this.damage = 40;
        this.commandTarget = null; this.sprite.src = team === 'black' ? 'assets/queen_black.png' : 'assets/queen_red.png';
    }
    update(game) {
        if (this.team === 'red' && !this.commandTarget) {
            const bNests = game.structures.filter(s => s.team === 'black' && s.type === 'nest');
            if(bNests.length > 0) this.commandTarget = { x: bNests[0].x, y: bNests[0].y };
        }
        if (this.commandTarget) {
            const dx = this.commandTarget.x - this.x; const dy = this.commandTarget.y - this.y;
            if (Math.hypot(dx, dy) > 10) {
                this.angle = Math.atan2(dy, dx);
                this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
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

// --- AUTOMATION & TURRET AI ---
const HiveMindExpansion = {
    patch: (game) => {
        Structure.prototype.update = function(game) {
            // Turret Logic
            if(this.type === 'turret') {
                this.cooldown--;
                if(this.cooldown <= 0) {
                    let allEnemies = game.spiders.concat(game.queens).concat(game.bugs).filter(e => e.team !== this.team);
                    for(let e of allEnemies) {
                        if(Math.hypot(e.x - this.x, e.y - this.y) < 200) { // Range
                            game.projectiles.push(new Projectile(this.x, this.y, e, 25, this.team));
                            this.cooldown = 45; // Fire rate
                            break; // Fire once per tick
                        }
                    }
                }
            }
            
            // Nest Auto-Spawn for Red AI (So they actually fight you)
            if (this.team === 'red' && this.type === 'nest') {
                if (game.scores.red >= 50 && game.pop.red < game.maxPop.red) {
                    if(!this.spawnTimer) this.spawnTimer = 0;
                    this.spawnTimer--;
                    if(this.spawnTimer <= 0) {
                        // Sometimes AI builds an eggsac if it hits pop cap, otherwise spawn spiders!
                        game.scores.red -= 10; 
                        game.bus.emit('spawnSpider', { x: this.x + (Math.random()-0.5)*100, y: this.y + (Math.random()-0.5)*100, team: 'red' });
                        this.spawnTimer = 90; 
                    }
                } else if (game.pop.red >= game.maxPop.red && game.scores.red > 150) {
                    // Red AI builds an Egg Sac to increase pop cap!
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
            if (this.hp === undefined) { this.hp = 100; this.maxHp = 100; this.damage = 15; this.attackSpeed = 30; this.cooldown = 0; }

            // 1. Check for enemies (including buildings and bugs!)
            let allEnemies = game.spiders.concat(game.queens).concat(game.bugs)
                .concat(game.structures).filter(e => e.team !== this.team && e.hp > 0);
            
            let nearestEnemy = null; let minDist = 150; 
            for (let enemy of allEnemies) {
                let d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                // Walls attract aggro from further away!
                if(enemy.type === 'wall' && d < 250) d -= 100; 
                if (d < minDist) { minDist = d; nearestEnemy = enemy; }
            }

            if (nearestEnemy) {
                this.state = 'combat'; this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                const combatRange = nearestEnemy.size ? nearestEnemy.size + 15 : 20;

                if (minDist > combatRange) { 
                    this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
                } else {
                    this.cooldown--;
                    if (this.cooldown <= 0) {
                        nearestEnemy.hp -= this.damage; this.cooldown = this.attackSpeed;
                        this.x -= Math.cos(this.angle) * 10; this.y -= Math.sin(this.angle) * 10; // Recoil
                    }
                }
                return; // Stop harvester logic if fighting
            }

            // 2. Harvester Logic (If no enemies)
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
                    this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
                } else {
                    if (this.state === 'seeking_pumpkin' && this.target.resources > 0) {
                        this.cargo = 10; this.target.resources -= 10; this.target = null; 
                    } else if (this.state === 'returning_home') {
                        game.scores[this.team] += this.cargo; this.cargo = 0; this.target = null;
                    }
                }
            } else {
                this.angle += (Math.random() - 0.5) * 0.5;
                this.x += Math.cos(this.angle) * (this.speed * 0.5); this.y += Math.sin(this.angle) * (this.speed * 0.5);
                this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
            }
        };

        const drawHealth = function(ctx) {
            if (this.hp !== undefined && this.hp < this.maxHp) {
                const w = this.size * 1.5;
                ctx.fillStyle = 'black'; ctx.fillRect(this.x - w/2 - 1, this.y - this.size - 11, w + 2, 6);
                ctx.fillStyle = 'red'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w, 4);
                ctx.fillStyle = '#00ff00'; ctx.fillRect(this.x - w/2, this.y - this.size - 10, w * (Math.max(0, this.hp) / this.maxHp), 4);
            }
        };
        
        const ogSpiderDraw = Spider.prototype.draw; Spider.prototype.draw = function(ctx) { ogSpiderDraw.call(this, ctx); drawHealth.call(this, ctx); };
        const ogQueenDraw = Queen.prototype.draw; Queen.prototype.draw = function(ctx) { ogQueenDraw.call(this, ctx); drawHealth.call(this, ctx); };
        const ogStructDraw = Structure.prototype.draw; Structure.prototype.draw = function(ctx) { ogStructDraw.call(this, ctx); drawHealth.call(this, ctx); };
    }
};

const WebNetworkExpansion = {
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            ctx.lineWidth = 1;
            for (let i = 0; i < game.spiders.length; i++) {
                let s1 = game.spiders[i];
                if (s1.x < game.camera.x - 100 || s1.x > game.camera.x + game.canvas.width + 100 || s1.y < game.camera.y - 100 || s1.y > game.camera.y + game.canvas.height + 100) continue;

                // Webs connect to ALL structures now
                game.structures.filter(s => s.team === s1.team).forEach(struct => {
                    if (Math.hypot(struct.x - s1.x, struct.y - s1.y) < 150) {
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)';
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(struct.x, struct.y); ctx.stroke();
                    }
                });

                for (let j = i + 1; j < game.spiders.length; j++) {
                    let s2 = game.spiders[j];
                    if (s1.team === s2.team && Math.hypot(s2.x - s1.x, s2.y - s1.y) < 80) { 
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)';
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
                    }
                }
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
    game.expansions.load('HiveMind', HiveMindExpansion); 
    game.expansions.load('CombatAndHarvesterAI', CombatAndHarvesterExpansion); 
    game.expansions.load('WebNetwork', WebNetworkExpansion); 
};
