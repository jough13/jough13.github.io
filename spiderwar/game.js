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
// 3. MAIN GAME CLASS (NOW WITH CAMERA!)
// ==========================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bus = new GameBus();
        this.expansions = new ExpansionManager(this);
        
        // Massive World Size!
        this.world = { width: 4000, height: 4000 };
        this.camera = { x: 0, y: 0, speed: 20 };
        this.mouse = { screenX: 0, screenY: 0 };
        
        this.spiders = [];
        this.pumpkins = [];
        this.nests = []; 
        
        this.scores = { black: 100, red: 100 }; 

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
        // Track mouse for Camera panning
        window.addEventListener('mousemove', (e) => {
            this.mouse.screenX = e.clientX;
            this.mouse.screenY = e.clientY;
        });

        // Click to spawn (Account for Camera offset!)
        this.canvas.addEventListener('click', (e) => {
            if(this.scores.black >= 10) {
                this.scores.black -= 10;
                this.bus.emit('spawnSpider', { x: e.clientX + this.camera.x, y: e.clientY + this.camera.y, team: 'black' });
            }
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if(this.scores.red >= 10) {
                this.scores.red -= 10;
                this.bus.emit('spawnSpider', { x: e.clientX + this.camera.x, y: e.clientY + this.camera.y, team: 'red' });
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
            Spiders: ${this.spiders.length} | Move mouse to edges to pan camera!
        `;
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // 1. Camera Edge Panning Logic
        const edge = 50;
        if (this.mouse.screenX < edge) this.camera.x -= this.camera.speed;
        if (this.mouse.screenX > this.canvas.width - edge) this.camera.x += this.camera.speed;
        if (this.mouse.screenY < edge) this.camera.y -= this.camera.speed;
        if (this.mouse.screenY > this.canvas.height - edge) this.camera.y += this.camera.speed;

        // Clamp camera to world bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.world.width - this.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.world.height - this.canvas.height));

        // 2. Entity Updates
        this.nests.forEach(nest => nest.update(this));
        this.spiders.forEach(spider => spider.update(this));
        
        // Cleanup dead entities
        this.pumpkins = this.pumpkins.filter(p => p.resources > 0);
        this.spiders = this.spiders.filter(s => s.hp > 0);
        this.updateUI();
    }

    draw() {
        this.ctx.fillStyle = '#2c1e16';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply Camera Translation
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Let Expansions draw background/webs first
        this.bus.emit('preDraw', this.ctx);

        this.nests.forEach(n => n.draw(this.ctx));
        this.pumpkins.forEach(p => p.draw(this.ctx));
        this.spiders.forEach(s => s.draw(this.ctx));

        // Let Expansions draw overlays
        this.bus.emit('postDraw', this.ctx);

        this.ctx.restore();
    }
}

// ==========================================
// 4. EXPANSIONS (PROCEDURAL GENERATION)
// ==========================================

const TerrainExpansion = {
    init: (game) => {
        console.log("Initializing Procedural Terrain...");
        game.tileSize = 256; 
        
        game.tiles = { dirt: new Image(), vines: new Image(), pebbles: new Image() };
        game.tiles.dirt.src = 'assets/tile_dirt.png';
        game.tiles.vines.src = 'assets/tile_vines.png';
        game.tiles.pebbles.src = 'assets/tile_pebbles.png';

        // Procedurally generate the massive 4000x4000 grid
        game.generateMap = function() {
            this.mapGrid = [];
            const cols = Math.ceil(this.world.width / this.tileSize);
            const rows = Math.ceil(this.world.height / this.tileSize);
            for (let y = 0; y < rows; y++) {
                let row = [];
                for (let x = 0; x < cols; x++) {
                    const r = Math.random();
                    // Increased the frequency of vines and pebbles so the map looks richer!
                    let type = r > 0.75 ? 'vines' : (r > 0.60 ? 'pebbles' : 'dirt');
                    row.push(type);
                }
                this.mapGrid.push(row);
            }
            console.log(`Map Generated: ${cols}x${rows} tiles`);
        };
        game.generateMap();
    },
    patch: (game) => {
        // Draw the tilemap ONLY for tiles currently visible by the camera
        game.bus.on('preDraw', (ctx) => {
            if (!game.mapGrid) return;
            
            // Clean integer math for camera boundaries
            const startCol = Math.floor(game.camera.x / game.tileSize);
            const colsVisible = Math.ceil(game.canvas.width / game.tileSize);
            const endCol = startCol + colsVisible + 1; // +1 to prevent pop-in at the edges
            
            const startRow = Math.floor(game.camera.y / game.tileSize);
            const rowsVisible = Math.ceil(game.canvas.height / game.tileSize);
            const endRow = startRow + rowsVisible + 1;

            for (let y = startRow; y <= endRow; y++) {
                for (let x = startCol; x <= endCol; x++) {
                    if (y >= 0 && y < game.mapGrid.length && x >= 0 && x < game.mapGrid[y].length) {
                        const tileType = game.mapGrid[y][x];
                        const img = game.tiles[tileType];
                        
                        const drawX = x * game.tileSize;
                        const drawY = y * game.tileSize;

                        if (img.complete && img.naturalHeight !== 0) {
                            // If image is loaded, draw it!
                            ctx.drawImage(img, drawX, drawY, game.tileSize, game.tileSize);
                        } else {
                            // FALLBACK: If image is missing or loading, draw a colored square so the map isn't blank!
                            ctx.fillStyle = tileType === 'dirt' ? '#3d2817' : (tileType === 'vines' ? '#2d4c1e' : '#555555');
                            ctx.fillRect(drawX, drawY, game.tileSize, game.tileSize);
                            
                            // Draw gridlines so you can actually see the tiles working
                            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; 
                            ctx.strokeRect(drawX, drawY, game.tileSize, game.tileSize);
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
            // 1. Procedural Bases (Opposite corners of the giant map)
            const padding = 400;
            const blackBaseX = padding + Math.random() * 200;
            const blackBaseY = padding + Math.random() * 200;
            
            const redBaseX = game.world.width - padding - Math.random() * 200;
            const redBaseY = game.world.height - padding - Math.random() * 200;

            game.nests.push(new Nest(blackBaseX, blackBaseY, 'black'));
            game.nests.push(new Nest(redBaseX, redBaseY, 'red'));

            // Focus camera on Black base at start
            game.camera.x = Math.max(0, blackBaseX - (game.canvas.width / 2));
            game.camera.y = Math.max(0, blackBaseY - (game.canvas.height / 2));
            
            // 2. Procedural Pumpkin Patches (Scattered across the map)
            const numPatches = 15; // 15 clusters of pumpkins
            
            for (let i = 0; i < numPatches; i++) {
                // Keep them somewhat away from the direct edges
                let patchX = 600 + Math.random() * (game.world.width - 1200);
                let patchY = 600 + Math.random() * (game.world.height - 1200);
                
                // 5 to 10 pumpkins per patch
                let patchSize = Math.floor(Math.random() * 6) + 5; 
                
                for (let p = 0; p < patchSize; p++) {
                    // Jitter them in a small radius around the patch center
                    let px = patchX + (Math.random() - 0.5) * 300;
                    let py = patchY + (Math.random() - 0.5) * 300;
                    game.pumpkins.push(new Pumpkin(px, py));
                }
            }
        }, 100);
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
            if (this.cargo === 0) this.state = 'seeking_pumpkin';
            else this.state = 'returning_home';

            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    if (gameInstance.pumpkins.length > 0) {
                        // Find the CLOSEST pumpkin to save travel time across huge map
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
                
                // Keep spiders inside the world bounds
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
                this.hp = 100;
                this.maxHp = 100;
                this.damage = 15;
                this.attackSpeed = 30; 
                this.cooldown = 0;
            }

            let nearestEnemy = null;
            let minDist = 150; 

            for (let enemy of gameInstance.spiders) {
                if (enemy.team !== this.team && enemy.hp > 0) {
                    let d = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                    if (d < minDist) {
                        minDist = d;
                        nearestEnemy = enemy;
                    }
                }
            }

            if (nearestEnemy) {
                this.state = 'combat';
                this.angle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
                
                if (minDist > 20) { 
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
                harvesterUpdate.call(this, gameInstance);
            }
        };

        const ogDraw = Spider.prototype.draw;
        Spider.prototype.draw = function(ctx) {
            ogDraw.call(this, ctx); 
            if (this.hp !== undefined && this.hp < this.maxHp) {
                ctx.fillStyle = 'black'; 
                ctx.fillRect(this.x - 11, this.y - 21, 22, 5);
                ctx.fillStyle = 'red'; 
                ctx.fillRect(this.x - 10, this.y - 20, 20, 3);
                ctx.fillStyle = '#00ff00'; 
                ctx.fillRect(this.x - 10, this.y - 20, 20 * (this.hp / this.maxHp), 3);
            }
        };
    }
};

const WebNetworkExpansion = {
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            ctx.lineWidth = 1;
            for (let i = 0; i < game.spiders.length; i++) {
                let s1 = game.spiders[i];
                
                // Only draw webs if spiders are somewhat on screen to save massive performance
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
    game.expansions.load('HiveMind', HiveMindExpansion); 
    game.expansions.load('HarvesterAI', HarvesterExpansion); 
    game.expansions.load('CombatAI', CombatExpansion); 
    game.expansions.load('WebNetwork', WebNetworkExpansion); 
};
