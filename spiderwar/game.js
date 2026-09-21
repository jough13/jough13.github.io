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
        this.x = x;
        this.y = y;
        this.team = team; // 'black' or 'red'
        this.size = 12;
        this.speed = Math.random() * 1.5 + 1.0; // Slightly faster!
        this.angle = 0; // For rotation
        
        // AI State
        this.state = 'idle'; 
        this.target = null;
        this.cargo = 0; // How much pumpkin they hold
        
        this.sprite = new Image();
        this.sprite.src = team === 'black' ? 'assets/black_spider.png' : 'assets/red_spider.png';
        this.imageLoaded = false;
        this.sprite.onload = () => { this.imageLoaded = true; };
    }

    update(game) { } // Will be monkey-patched!

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); // Rotate to face direction
        
        if (this.imageLoaded) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            // Fallback drawing
            ctx.fillStyle = this.team;
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
            // Draw an "eye" indicator to show forward direction
            ctx.fillStyle = 'white';
            ctx.fillRect(this.size/2, -3, 4, 6);
        }

        // Draw cargo indicator (if holding pumpkin)
        if (this.cargo > 0) {
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

class Pumpkin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 25;
        this.resources = 100; // Depletes as harvested
        
        this.sprite = new Image();
        this.sprite.src = 'assets/pumpkin.png';
        this.imageLoaded = false;
        this.sprite.onload = () => { this.imageLoaded = true; };
    }
    
    draw(ctx) {
        if (this.resources <= 0) return; // Don't draw if dead

        ctx.save();
        ctx.translate(this.x, this.y);
        // Shrink slightly as it gets harvested
        const scale = Math.max(0.4, this.resources / 100); 
        ctx.scale(scale, scale);

        if (this.imageLoaded) {
            ctx.drawImage(this.sprite, -this.size, -this.size, this.size*2, this.size*2);
        } else {
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath();
            ctx.arc(0, 0, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
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
        this.nests = []; // Added for bases
        
        this.scores = { black: 0, red: 0 };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInputs();
        
        // Start Loop
        requestAnimationFrame(() => this.loop());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInputs() {
        this.canvas.addEventListener('click', (e) => {
            this.bus.emit('spawnSpider', { x: e.clientX, y: e.clientY, team: 'black' });
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.bus.emit('spawnSpider', { x: e.clientX, y: e.clientY, team: 'red' });
        });

        this.bus.on('spawnSpider', (data) => {
            this.spiders.push(new Spider(data.x, data.y, data.team));
            this.updateUI();
        });
    }

    updateUI() {
        const debug = document.getElementById('debug');
        if(debug) debug.innerHTML = `
            Black Score: ${this.scores.black} | Red Score: ${this.scores.red} <br>
            Spiders: ${this.spiders.length}
        `;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.spiders.forEach(spider => spider.update(this));
        // Remove dead pumpkins
        this.pumpkins = this.pumpkins.filter(p => p.resources > 0);
    }

    draw() {
        this.ctx.fillStyle = '#2c1e16';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw order: Webs -> Bases(Nests) -> Pumpkins -> Spiders
        this.nests.forEach(n => n.draw(this.ctx));
        this.pumpkins.forEach(p => p.draw(this.ctx));
        this.spiders.forEach(s => s.draw(this.ctx));
    }
}

// ==========================================
// 4. EXPANSIONS (THE MAGIC SAUCE)
// ==========================================

// --- EXPANSION A: TERRAIN TILEMAP ---
const TerrainExpansion = {
    init: (game) => {
        game.tileSize = 128;
        game.tiles = {
            dirt: new Image(), vines: new Image(), pebbles: new Image()
        };
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
    },
    patch: (game) => {
        const ogResize = Game.prototype.resize;
        Game.prototype.resize = function() {
            ogResize.call(this);
            if (this.generateMap) this.generateMap();
        };

        const ogDraw = Game.prototype.draw;
        Game.prototype.draw = function() {
            // Draw background first
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
            ogDraw.call(this); // Call original draw (which does spiders, nests, etc)
        };
    }
};

// --- EXPANSION B: BASE BUILDER (NESTS) ---
class Nest {
    constructor(x, y, team) {
        this.x = x; this.y = y; this.team = team; this.size = 40;
        this.sprite = new Image();
        this.sprite.src = team === 'black' ? 'assets/nest_black.png' : 'assets/nest_red.png';
        this.spriteLoaded = false;
        this.sprite.onload = () => { this.spriteLoaded = true; }
    }
    draw(ctx) {
        if(this.spriteLoaded) {
            ctx.drawImage(this.sprite, this.x - this.size, this.y - this.size, this.size*2, this.size*2);
        } else {
            // Fallback web-hole
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = this.team; ctx.lineWidth = 3; ctx.stroke();
        }
    }
}

const BaseBuilderExpansion = {
    init: (game) => {
        // Spawn initial bases and pumpkins when the game starts
        setTimeout(() => {
            game.nests.push(new Nest(100, game.canvas.height / 2, 'black'));
            game.nests.push(new Nest(game.canvas.width - 100, game.canvas.height / 2, 'red'));
            
            for(let i=0; i<8; i++) {
                game.pumpkins.push(new Pumpkin(
                    (Math.random() * (game.canvas.width - 400)) + 200, 
                    Math.random() * (game.canvas.height - 100) + 50
                ));
            }
        }, 100);
    }
};

// --- EXPANSION C: HARVESTING AI & ROTATION ---
const HarvesterExpansion = {
    patch: (game) => {
        Spider.prototype.update = function(gameInstance) {
            // 1. Determine State
            if (this.cargo === 0) this.state = 'seeking_pumpkin';
            else this.state = 'returning_home';

            // 2. Find Target based on state
            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    // Find random pumpkin
                    if (gameInstance.pumpkins.length > 0) {
                        this.target = gameInstance.pumpkins[Math.floor(Math.random() * gameInstance.pumpkins.length)];
                    } else {
                        this.target = null; // No pumpkins left!
                    }
                }
            } else if (this.state === 'returning_home') {
                // Find nearest friendly nest
                this.target = gameInstance.nests.find(n => n.team === this.team);
            }

            // 3. Move and Interact
            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Calculate rotation angle (atan2 gives angle in radians)
                this.angle = Math.atan2(dy, dx);

                if (dist > this.target.size) { 
                    // Move towards target
                    this.x += Math.cos(this.angle) * this.speed;
                    this.y += Math.sin(this.angle) * this.speed;
                } else {
                    // Reached target!
                    if (this.state === 'seeking_pumpkin' && this.target.resources > 0) {
                        this.cargo = 10;
                        this.target.resources -= 10; // Bite off a chunk
                        this.target = null; // Drop target so we recalculate
                    } else if (this.state === 'returning_home') {
                        gameInstance.scores[this.team] += this.cargo; // Score points!
                        this.cargo = 0;
                        this.target = null;
                        gameInstance.updateUI();
                    }
                }
            } else {
                // Idle wander if no targets
                this.angle += (Math.random() - 0.5) * 0.5;
                this.x += Math.cos(this.angle) * (this.speed * 0.5);
                this.y += Math.sin(this.angle) * (this.speed * 0.5);
            }
        };
    }
};

// --- EXPANSION D: SILK NETWORK (TERRITORY WEBS) ---
const WebNetworkExpansion = {
    patch: (game) => {
        const ogDraw = Game.prototype.draw;
        
        Game.prototype.draw = function() {
            // We want webs to draw OVER terrain but UNDER spiders/pumpkins
            // Let's inject a web-drawing function into the bus right before entities draw
            ogDraw.call(this); // Draw background
        }

        // We tap into the draw loop by intercepting the end of the background draw
        // Actually, let's just monkey patch the drawing directly to be safe and clean.
        
        const superOgDraw = Game.prototype.draw;
        Game.prototype.draw = function() {
            superOgDraw.call(this); // Draws map, pumpkins, nests, spiders

            // DRAW WEBS OVERLAY
            this.ctx.lineWidth = 1;
            
            for (let i = 0; i < this.spiders.length; i++) {
                let s1 = this.spiders[i];
                
                // Connect to friendly nests
                this.nests.filter(n => n.team === s1.team).forEach(nest => {
                    const dist = Math.hypot(nest.x - s1.x, nest.y - s1.y);
                    if (dist < 150) {
                        this.ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)';
                        this.ctx.beginPath();
                        this.ctx.moveTo(s1.x, s1.y);
                        this.ctx.lineTo(nest.x, nest.y);
                        this.ctx.stroke();
                    }
                });

                // Connect to friendly spiders
                for (let j = i + 1; j < this.spiders.length; j++) {
                    let s2 = this.spiders[j];
                    if (s1.team === s2.team) {
                        const dist = Math.hypot(s2.x - s1.x, s2.y - s1.y);
                        if (dist < 80) { // Max web distance
                            this.ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)';
                            this.ctx.beginPath();
                            this.ctx.moveTo(s1.x, s1.y);
                            this.ctx.lineTo(s2.x, s2.y);
                            this.ctx.stroke();
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
    // Load Expansions in order of layering!
    game.expansions.load('TerrainGen', TerrainExpansion);
    game.expansions.load('BaseBuilder', BaseBuilderExpansion);
    game.expansions.load('HarvesterAI', HarvesterExpansion); // Replaces Scurry AI
    game.expansions.load('WebNetwork', WebNetworkExpansion);
};
