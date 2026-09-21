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

    update(game) { } // Patched by expansions

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
    
    update(game) {} // Patched by expansions

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
// 3. MAIN GAME CLASS
// ==========================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bus = new GameBus();
        this.expansions = new ExpansionManager(this);
        
        this.spiders = [];
        this.pumpkins = [];
        this.nests = []; 
        
        this.scores = { black: 100, red: 100 }; // Start with 100 points to jumpstart bases!

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
        // You can still manually spawn for 10 points per click!
        this.canvas.addEventListener('click', (e) => {
            if(this.scores.black >= 10) {
                this.scores.black -= 10;
                this.bus.emit('spawnSpider', { x: e.clientX, y: e.clientY, team: 'black' });
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if(this.scores.red >= 10) {
                this.scores.red -= 10;
                this.bus.emit('spawnSpider', { x: e.clientX, y: e.clientY, team: 'red' });
            }
        });

        this.bus.on('spawnSpider', (data) => {
            this.spiders.push(new Spider(data.x, data.y, data.team));
            this.updateUI();
        });
    }

    updateUI() {
        const debug = document.getElementById('debug');
        if(debug) debug.innerHTML = `
            <strong>Black Resources: ${this.scores.black}</strong> | <strong>Red Resources: ${this.scores.red}</strong> <br>
            Spiders: ${this.spiders.length} (Click costs 10 | Bases auto-spawn at 50)
        `;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.nests.forEach(nest => nest.update(this));
        this.spiders.forEach(spider => spider.update(this));
        
        // Cleanup dead entities
        this.pumpkins = this.pumpkins.filter(p => p.resources > 0);
        this.spiders = this.spiders.filter(s => s.hp > 0); // Remove dead spiders!
        this.updateUI();
    }

    draw() {
        this.ctx.fillStyle = '#2c1e16';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.nests.forEach(n => n.draw(this.ctx));
        this.pumpkins.forEach(p => p.draw(this.ctx));
        this.spiders.forEach(s => s.draw(this.ctx));
    }
}

// ==========================================
// 4. EXPANSIONS (THE MAGIC SAUCE)
// ==========================================

const TerrainExpansion = { /* ... (Same as previous, omitted for brevity but included below in full) ... */ };
TerrainExpansion.init = (game) => {
    game.tileSize = 128;
    game.tiles = { dirt: new Image(), vines: new Image(), pebbles: new Image() };
    game.tiles.dirt.src = 'assets/tile_dirt.png';
    game.tiles.vines.src = 'assets/tile_vines.png';
    game.tiles.pebbles.src = 'assets/tile_pebbles.png';

    game.generateMap = function() {
        this.mapGrid = [];
        const cols = Math.ceil(this.canvas.width / this.tileSize);
        const rows = Math.ceil(this.canvas.height / this.tileSize);
        for (let y = 0; y < rows; y++) {
            let row = [];
            for (let x = 0; x < cols; x++) {
                const r = Math.random();
                row.push(r > 0.85 ? 'vines' : (r > 0.70 ? 'pebbles' : 'dirt'));
            }
            this.mapGrid.push(row);
        }
    };
    game.generateMap();
};
TerrainExpansion.patch = (game) => {
    const ogResize = Game.prototype.resize;
    Game.prototype.resize = function() { ogResize.call(this); if (this.generateMap) this.generateMap(); };

    const ogDraw = Game.prototype.draw;
    Game.prototype.draw = function() {
        if (this.mapGrid) {
            for (let y = 0; y < this.mapGrid.length; y++) {
                for (let x = 0; x < this.mapGrid[y].length; x++) {
                    const img = this.tiles[this.mapGrid[y][x]];
                    if (img.complete && img.naturalHeight !== 0) {
                        this.ctx.drawImage(img, x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                    }
                }
            }
        }
        ogDraw.call(this);
    };
};

const BaseBuilderExpansion = {
    init: (game) => {
        setTimeout(() => {
            game.nests.push(new Nest(150, game.canvas.height / 2, 'black'));
            game.nests.push(new Nest(game.canvas.width - 150, game.canvas.height / 2, 'red'));
            
            // Scatter Pumpkins in the middle
            for(let i=0; i<12; i++) {
                game.pumpkins.push(new Pumpkin(
                    (Math.random() * (game.canvas.width - 600)) + 300, 
                    Math.random() * (game.canvas.height - 150) + 75
                ));
            }
        }, 100);
    }
};

const HiveMindExpansion = {
    patch: (game) => {
        // Nests auto-spawn units if they have enough resources!
        Nest.prototype.update = function(gameInstance) {
            // Check if team has enough points
            if (gameInstance.scores[this.team] >= 50) {
                // Add a small cooldown so they don't instantly drain all points at once
                if(!this.spawnTimer) this.spawnTimer = 0;
                this.spawnTimer--;
                
                if(this.spawnTimer <= 0) {
                    gameInstance.scores[this.team] -= 50; // Spend resources
                    // Spawn a bit offset from the center of the nest
                    const offsetX = (Math.random() - 0.5) * 50;
                    const offsetY = (Math.random() - 0.5) * 50;
                    gameInstance.bus.emit('spawnSpider', { x: this.x + offsetX, y: this.y + offsetY, team: this.team });
                    this.spawnTimer = 60; // Wait ~1 second before spawning another
                }
            }
        };
    }
};

const HarvesterExpansion = {
    patch: (game) => {
        Spider.prototype.update = function(gameInstance) {
            if (this.cargo === 0) this.state = 'seeking_pumpkin';
            else this.state = 'returning_home';

            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    if (gameInstance.pumpkins.length > 0) {
                        this.target = gameInstance.pumpkins[Math.floor(Math.random() * gameInstance.pumpkins.length)];
                    } else { this.target = null; }
                }
            } else if (this.state === 'returning_home') {
                this.target = gameInstance.nests.find(n => n.team === this.team);
            }

            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.hypot(dx, dy);
                this.angle = Math.atan2(dy, dx);

                if (dist > this.target.size) { 
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
                        gameInstance.updateUI();
                    }
                }
            } else {
                this.angle += (Math.random() - 0.5) * 0.5;
                this.x += Math.cos(this.angle) * (this.speed * 0.5);
                this.y += Math.sin(this.angle) * (this.speed * 0.5);
            }
        };
    }
};

const CombatExpansion = {
    patch: (game) => {
        // Intercept Harvester Update to add Combat AI override
        const harvesterUpdate = Spider.prototype.update;
        
        Spider.prototype.update = function(gameInstance) {
            // 1. Initialize stats if they don't exist
            if (this.hp === undefined) {
                this.hp = 100;
                this.maxHp = 100;
                this.damage = 15;
                this.attackSpeed = 30; // Frames between attacks
                this.cooldown = 0;
            }

            // 2. Scan for enemies
            let nearestEnemy = null;
            let minDist = 120; // Aggro range

            for (let enemy of gameInstance.spiders) {
                if (enemy.team !== this.team && enemy.hp > 0) {
                    let d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestEnemy = enemy;
                    }
                }
            }

            // 3. Combat Logic overrides Harvester Logic
            if (nearestEnemy) {
                this.state = 'combat';
                this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                
                if (minDist > 20) { // Move into biting range
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                } else {
                    // In range! Stop and fight
                    this.cooldown--;
                    if (this.cooldown <= 0) {
                        nearestEnemy.hp -= this.damage;
                        this.cooldown = this.attackSpeed;
                        // Visual recoil/lunge (push backwards slightly, next frame moves them forward)
                        this.x -= Math.cos(this.angle) * 8;
                        this.y -= Math.sin(this.angle) * 8;
                    }
                }
            } else {
                // If no enemies nearby, do normal Harvester logic
                harvesterUpdate.call(this, gameInstance);
            }
        };

        // Intercept Draw to add Health Bars
        const ogDraw = Spider.prototype.draw;
        Spider.prototype.draw = function(ctx) {
            ogDraw.call(this, ctx); // Draw normal spider

            // Draw Health Bar if damaged
            if (this.hp !== undefined && this.hp < this.maxHp) {
                ctx.fillStyle = 'black'; // border
                ctx.fillRect(this.x - 11, this.y - 21, 22, 5);
                ctx.fillStyle = 'red'; // background
                ctx.fillRect(this.x - 10, this.y - 20, 20, 3);
                ctx.fillStyle = '#00ff00'; // health remaining
                ctx.fillRect(this.x - 10, this.y - 20, 20 * (this.hp / this.maxHp), 3);
            }
        };
    }
};

const WebNetworkExpansion = {
    patch: (game) => {
        const superOgDraw = Game.prototype.draw;
        Game.prototype.draw = function() {
            superOgDraw.call(this); 

            this.ctx.lineWidth = 1;
            for (let i = 0; i < this.spiders.length; i++) {
                let s1 = this.spiders[i];
                
                this.nests.filter(n => n.team === s1.team).forEach(nest => {
                    const dist = Math.hypot(nest.x - s1.x, nest.y - s1.y);
                    if (dist < 150) {
                        this.ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)';
                        this.ctx.beginPath(); this.ctx.moveTo(s1.x, s1.y); this.ctx.lineTo(nest.x, nest.y); this.ctx.stroke();
                    }
                });

                for (let j = i + 1; j < this.spiders.length; j++) {
                    let s2 = this.spiders[j];
                    if (s1.team === s2.team) {
                        const dist = Math.hypot(s2.x - s1.x, s2.y - s1.y);
                        if (dist < 80) { 
                            this.ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)';
                            this.ctx.beginPath(); this.ctx.moveTo(s1.x, s1.y); this.ctx.lineTo(s2.x, s2.y); this.ctx.stroke();
                        }
                    }
                }
            }
        };
    }
};

// ==========================================
// BOOTSTRAP
// ==========================================
window.onload = () => {
    const game = new Game();
    
    // Load Expansions! Order matters!
    game.expansions.load('TerrainGen', TerrainExpansion);
    game.expansions.load('BaseBuilder', BaseBuilderExpansion);
    game.expansions.load('HiveMind', HiveMindExpansion); // Auto-spawns
    game.expansions.load('HarvesterAI', HarvesterExpansion); // Baseline logic
    game.expansions.load('CombatAI', CombatExpansion); // WRAPS baseline logic to prioritize fighting
    game.expansions.load('WebNetwork', WebNetworkExpansion); // Draws over everything
};
