// ==========================================
// 1. CORE ARCHITECTURE
// ==========================================

class GameBus {
    constructor() { this.listeners = {}; }
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
}

class ExpansionManager {
    constructor(game) {
        this.game = game;
        this.expansions = {};
    }
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
        this.x = x; this.y = y;
        this.team = team;
        this.size = 12;
        this.speed = Math.random() * 1.5 + 1.0;
        this.angle = 0;
        this.state = 'idle'; 
        this.target = null;
        this.cargo = 0; 
        
        this.sprite = new Image();
        this.sprite.src = team === 'black' ? 'assets/black_spider.png' : 'assets/red_spider.png';
        this.imageLoaded = false;
        this.sprite.onload = () => { this.imageLoaded = true; };
    }
    update(game) { }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); 
        
        if (this.imageLoaded) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            ctx.fillStyle = this.team;
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.fillRect(this.size/2, -3, 4, 6);
        }

        if (this.cargo > 0) {
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

class Pumpkin {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.size = 25;
        this.resources = 100; 
        this.sprite = new Image();
        this.sprite.src = 'assets/pumpkin.png';
        this.imageLoaded = false;
        this.sprite.onload = () => { this.imageLoaded = true; };
    }
    draw(ctx) {
        if (this.resources <= 0) return; 
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = Math.max(0.4, this.resources / 100); 
        ctx.scale(scale, scale);
        if (this.imageLoaded) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

class Nest {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team; this.size = 40;
        this.sprite = new Image();
        this.sprite.src = team === 'black' ? 'assets/nest_black.png' : 'assets/nest_red.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; }
    }
    update(game) {} 
    draw(ctx) {
        if(this.spriteLoaded) {
            ctx.drawImage(this.sprite, this.x - this.size, this.y - this.size, this.size*2, this.size*2);
        } else {
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = this.team; ctx.lineWidth = 3; ctx.stroke();
        }
    }
}

// ==========================================
// 3. MAIN GAME CLASS (UPDATED CONTROLS)
// ==========================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bus = new GameBus();
        this.expansions = new ExpansionManager(this);
        
        this.world = { width: 4000, height: 4000 };
        this.camera = { x: 0, y: 0 };
        
        this.spiders = [];
        this.pumpkins = [];
        this.nests = []; 
        this.queens = []; // Added for the Queen Expansion
        
        this.scores = { black: 200, red: 200 }; 

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInputs();
        
        requestAnimationFrame(() => this.loop());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInputs() {
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        // DRAG SCROLLING LOGIC
        let isDragging = false;
        let dragStartX, dragStartY, camStartX, camStartY, hasMoved;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                isDragging = true;
                hasMoved = false;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                camStartX = this.camera.x;
                camStartY = this.camera.y;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                let dx = e.clientX - dragStartX;
                let dy = e.clientY - dragStartY;
                if (Math.hypot(dx, dy) > 5) hasMoved = true; // They actually dragged
                
                if (hasMoved) {
                    this.camera.x = camStartX - dx;
                    this.camera.y = camStartY - dy;
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0 && isDragging) {
                isDragging = false;
                if (!hasMoved) {
                    const worldX = e.clientX + this.camera.x;
                    const worldY = e.clientY + this.camera.y;
                    
                    if (this.keys['e']) {
                        // Hold E to build base!
                        this.bus.emit('buildBase', { x: worldX, y: worldY, team: 'black' });
                    } else {
                        // Normal Click to Spawn Spider
                        if(this.scores.black >= 10) {
                            this.scores.black -= 10;
                            this.bus.emit('spawnSpider', { x: worldX, y: worldY, team: 'black' });
                        }
                    }
                }
            }
        });

        // Right Click to Command Queen
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.bus.emit('commandQueen', { x: e.clientX + this.camera.x, y: e.clientY + this.camera.y, team: 'black' });
        });

        this.bus.on('spawnSpider', (data) => {
            this.spiders.push(new Spider(data.x, data.y, data.team));
        });
        
        this.bus.on('buildBase', (data) => {
            if (this.scores[data.team] >= 150) {
                this.scores[data.team] -= 150;
                this.nests.push(new Nest(data.x, data.y, data.team));
            }
        });
    }

    updateUI() {
        const debug = document.getElementById('debug');
        if(debug) debug.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span><strong>Black Resources: ${this.scores.black}</strong> (Spiders: ${this.spiders.filter(s=>s.team==='black').length})</span>
                <span style="color:#ff4444;"><strong>Red Resources: ${this.scores.red}</strong> (Spiders: ${this.spiders.filter(s=>s.team==='red').length})</span>
            </div>
            <hr style="border-color:#ff9d0055;">
            WASD or Drag Mouse to pan camera.<br>
            Left-Click: Spawn Spider (10) | Right-Click: Command Queen | Hold 'E' + Click: Build Base (150)
        `;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // WASD Camera Panning
        const camSpeed = 15;
        if (this.keys['w']) this.camera.y -= camSpeed;
        if (this.keys['s']) this.camera.y += camSpeed;
        if (this.keys['a']) this.camera.x -= camSpeed;
        if (this.keys['d']) this.camera.x += camSpeed;

        this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height - this.canvas.height));

        this.nests.forEach(nest => nest.update(this));
        this.spiders.forEach(spider => spider.update(this));
        this.queens.forEach(queen => queen.update(this));
        
        this.pumpkins = this.pumpkins.filter(p => p.resources > 0);
        this.spiders = this.spiders.filter(s => s.hp > 0);
        this.queens = this.queens.filter(q => q.hp > 0);
        this.updateUI();
    }

    draw() {
        this.ctx.fillStyle = '#2c1e16';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.bus.emit('preDraw', this.ctx);

        this.nests.forEach(n => n.draw(this.ctx));
        this.pumpkins.forEach(p => p.draw(this.ctx));
        this.spiders.forEach(s => s.draw(this.ctx));
        this.queens.forEach(q => q.draw(this.ctx));

        this.ctx.restore();
    }
}

// ==========================================
// 4. EXPANSIONS
// ==========================================

const TerrainExpansion = {
    init: (game) => {
        game.tileSize = 256; 
        game.tiles = { dirt: new Image(), vines: new Image(), pebbles: new Image() };
        game.tiles.dirt.src = 'assets/tile_dirt.png';
        game.tiles.vines.src = 'assets/tile_vines.png';
        game.tiles.pebbles.src = 'assets/tile_pebbles.png';

        game.generateMap = function() {
            this.mapGrid = [];
            const cols = Math.ceil(this.world.width / this.tileSize);
            const rows = Math.ceil(this.world.height / this.tileSize);
            for (let y = 0; y < rows; y++) {
                let row = [];
                for (let x = 0; x < cols; x++) {
                    const r = Math.random();
                    row.push(r > 0.75 ? 'vines' : (r > 0.60 ? 'pebbles' : 'dirt'));
                }
                this.mapGrid.push(row);
            }
        };
        game.generateMap();
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
                        const tileType = game.mapGrid[y][x];
                        const img = game.tiles[tileType];
                        const drawX = x * game.tileSize;
                        const drawY = y * game.tileSize;
                        if (img.complete && img.naturalHeight !== 0) {
                            ctx.drawImage(img, drawX, drawY, game.tileSize, game.tileSize);
                        } else {
                            ctx.fillStyle = tileType === 'dirt' ? '#3d2817' : (tileType === 'vines' ? '#2d4c1e' : '#555555');
                            ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize);
                            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.strokeRect(drawX, drawY, game.tileSize, game.tileSize);
                        }
                    }
                }
            }
        });
    }
};

const BaseBuilderExpansion = {
    init: (game) => {
        setTimeout(() => {
            const padding = 400;
            const blackBaseX = padding + Math.random() * 200;
            const blackBaseY = padding + Math.random() * 200;
            const redBaseX = game.world.width - padding - Math.random() * 200;
            const redBaseY = game.world.height - padding - Math.random() * 200;

            game.nests.push(new Nest(blackBaseX, blackBaseY, 'black'));
            game.nests.push(new Nest(redBaseX, redBaseY, 'red'));

            game.camera.x = Math.max(0, blackBaseX - (game.canvas.width / 2));
            game.camera.y = Math.max(0, blackBaseY - (game.canvas.height / 2));
            
            for (let i = 0; i < 15; i++) {
                let patchX = 600 + Math.random() * (game.world.width - 1200);
                let patchY = 600 + Math.random() * (game.world.height - 1200);
                let patchSize = Math.floor(Math.random() * 6) + 5; 
                for (let p = 0; p < patchSize; p++) {
                    game.pumpkins.push(new Pumpkin(patchX + (Math.random() - 0.5) * 300, patchY + (Math.random() - 0.5) * 300));
                }
            }
        }, 100);
    }
};

// --- NEW EXPANSION: THE QUEEN ---
class Queen extends Spider {
    constructor(x, y, team) {
        super(x, y, team);
        this.size = 28; // Massive!
        this.speed = 1.2;
        this.hp = 500;
        this.maxHp = 500;
        this.damage = 40;
        this.commandTarget = null;
        
        this.sprite.src = team === 'black' ? 'assets/queen_black.png' : 'assets/queen_red.png';
    }

    update(gameInstance) {
        // Red Queen AI: Slowly march toward Black Base
        if (this.team === 'red') {
            if(!this.commandTarget && gameInstance.nests.length > 0) {
                const blackNests = gameInstance.nests.filter(n => n.team === 'black');
                if(blackNests.length > 0) {
                    // Attack a random black nest
                    this.commandTarget = { x: blackNests[0].x, y: blackNests[0].y };
                }
            }
        }

        // Movement Logic
        if (this.commandTarget) {
            const dx = this.commandTarget.x - this.x;
            const dy = this.commandTarget.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 10) {
                this.angle = Math.atan2(dy, dx);
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
            } else {
                this.commandTarget = null; // Reached destination
            }
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        // Draw waypoints for Black Queen
        if(this.team === 'black' && this.commandTarget) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.commandTarget.x, this.commandTarget.y);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw X at destination
            ctx.beginPath();
            ctx.arc(this.commandTarget.x, this.commandTarget.y, 10, 0, Math.PI*2);
            ctx.stroke();
        }
    }
}

const QueenExpansion = {
    init: (game) => {
        // Delay slightly so bases spawn first
        setTimeout(() => {
            const bNest = game.nests.find(n => n.team === 'black');
            const rNest = game.nests.find(n => n.team === 'red');
            if(bNest) game.queens.push(new Queen(bNest.x + 50, bNest.y + 50, 'black'));
            if(rNest) game.queens.push(new Queen(rNest.x - 50, rNest.y - 50, 'red'));
        }, 150);

        game.bus.on('commandQueen', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if(queen) {
                queen.commandTarget = { x: data.x, y: data.y };
            }
        });
    }
};

const HiveMindExpansion = {
    patch: (game) => {
        Nest.prototype.update = function(gameInstance) {
            if (gameInstance.scores[this.team] >= 50) {
                if(!this.spawnTimer) this.spawnTimer = 0;
                this.spawnTimer--;
                
                if(this.spawnTimer <= 0) {
                    gameInstance.scores[this.team] -= 50; 
                    const offsetX = (Math.random() - 0.5) * 100;
                    const offsetY = (Math.random() - 0.5) * 100;
                    gameInstance.bus.emit('spawnSpider', { x: this.x + offsetX, y: this.y + offsetY, team: this.team });
                    this.spawnTimer = 60; 
                }
            }
        };
    }
};

const HarvesterExpansion = {
    patch: (game) => {
        Spider.prototype.update = function(gameInstance) {
            if (this.hp === undefined) this.hp = 100; // In case combat expansion hasn't hit it yet
            
            if (this.cargo === 0) this.state = 'seeking_pumpkin';
            else this.state = 'returning_home';

            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    if (gameInstance.pumpkins.length > 0) {
                        let closest = null;
                        let minDist = Infinity;
                        for(let p of gameInstance.pumpkins) {
                            let d = Math.hypot(p.x - this.x, p.y - this.y);
                            if(d < minDist) { minDist = d; closest = p; }
                        }
                        this.target = closest;
                    } else { this.target = null; }
                }
            } else if (this.state === 'returning_home') {
                // Find nearest nest OR friendly queen!
                let closest = null;
                let minDist = Infinity;
                
                // Check Nests
                gameInstance.nests.filter(n => n.team === this.team).forEach(n => {
                    let d = Math.hypot(n.x - this.x, n.y - this.y);
                    if(d < minDist) { minDist = d; closest = n; }
                });
                
                // Check Queens (Mobile Drop-offs!)
                gameInstance.queens.filter(q => q.team === this.team).forEach(q => {
                    let d = Math.hypot(q.x - this.x, q.y - this.y);
                    if(d < minDist) { minDist = d; closest = q; }
                });
                
                this.target = closest;
            }

            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.hypot(dx, dy);
                this.angle = Math.atan2(dy, dx);

                // Use slightly larger hitboxes for dropping off at Queens
                const targetRadius = this.target instanceof Queen ? this.target.size + 15 : this.target.size;

                if (dist > targetRadius) { 
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                } else {
                    if (this.state === 'seeking_pumpkin' && this.target.resources > 0) {
                        this.cargo = 10;
                        this.target.resources -= 10; 
                        this.target = null; 
                    } else if (this.state === 'returning_home') {
                        gameInstance.scores[this.team] += this.cargo; 
                        this.cargo = 0;
                        this.target = null;
                    }
                }
            } else {
                this.angle += (Math.random() - 0.5) * 0.5;
                this.x += Math.cos(this.angle) * (this.speed * 0.5);
                this.y += Math.sin(this.angle) * (this.speed * 0.5);
                this.x = Math.max(0, Math.min(this.x, gameInstance.world.width));
                this.y = Math.max(0, Math.min(this.y, gameInstance.world.height));
            }
        };
    }
};

const CombatExpansion = {
    patch: (game) => {
        const harvesterUpdate = Spider.prototype.update;
        
        Spider.prototype.update = function(gameInstance) {
            if (this.hp === undefined) {
                this.hp = 100; this.maxHp = 100;
                this.damage = 15; this.attackSpeed = 30; this.cooldown = 0;
            }

            // Combine spiders and queens into one target array
            let allEnemies = gameInstance.spiders.concat(gameInstance.queens).filter(e => e.team !== this.team && e.hp > 0);
            
            let nearestEnemy = null;
            let minDist = 150; 

            for (let enemy of allEnemies) {
                let d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (d < minDist) {
                    minDist = d;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                this.state = 'combat';
                this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                
                // Account for big queen hitboxes
                const combatRange = nearestEnemy instanceof Queen ? 40 : 20;

                if (minDist > combatRange) { 
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                } else {
                    this.cooldown--;
                    if (this.cooldown <= 0) {
                        nearestEnemy.hp -= this.damage;
                        this.cooldown = this.attackSpeed;
                        this.x -= Math.cos(this.angle) * 10;
                        this.y -= Math.sin(this.angle) * 10;
                    }
                }
            } else {
                // Not a Queen, run normal AI
                if(!(this instanceof Queen)) {
                    harvesterUpdate.call(this, gameInstance);
                } else {
                    // Queens slowly heal if out of combat
                    if(this.hp < this.maxHp) this.hp += 0.1;
                }
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
        
        const ogSpiderDraw = Spider.prototype.draw;
        Spider.prototype.draw = function(ctx) { ogSpiderDraw.call(this, ctx); drawHealth.call(this, ctx); };
        
        const ogQueenDraw = Queen.prototype.draw;
        Queen.prototype.draw = function(ctx) { ogQueenDraw.call(this, ctx); drawHealth.call(this, ctx); };
    }
};

const WebNetworkExpansion = {
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            ctx.lineWidth = 1;
            for (let i = 0; i < game.spiders.length; i++) {
                let s1 = game.spiders[i];
                if (s1.x < game.camera.x - 100 || s1.x > game.camera.x + game.canvas.width + 100 ||
                    s1.y < game.camera.y - 100 || s1.y > game.camera.y + game.canvas.height + 100) continue;

                game.nests.filter(n => n.team === s1.team).forEach(nest => {
                    const dist = Math.hypot(nest.x - s1.x, nest.y - s1.y);
                    if (dist < 150) {
                        ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)';
                        ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(nest.x, nest.y); ctx.stroke();
                    }
                });

                for (let j = i + 1; j < game.spiders.length; j++) {
                    let s2 = game.spiders[j];
                    if (s1.team === s2.team) {
                        const dist = Math.hypot(s2.x - s1.x, s2.y - s1.y);
                        if (dist < 80) { 
                            ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)';
                            ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
                        }
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
    game.expansions.load('BaseBuilder', BaseBuilderExpansion);
    game.expansions.load('QueenSystem', QueenExpansion); // Added Queens!
    game.expansions.load('HiveMind', HiveMindExpansion); 
    game.expansions.load('HarvesterAI', HarvesterExpansion); 
    game.expansions.load('CombatAI', CombatExpansion); 
    game.expansions.load('WebNetwork', WebNetworkExpansion); 
};
