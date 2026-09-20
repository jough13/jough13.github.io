// ==========================================
// 1. CORE ARCHITECTURE
// ==========================================

// The GameBus: Handles all events (Decouples systems)
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

// The Expansion Manager: Handles plugins and monkey patching
class ExpansionManager {
    constructor(game) {
        this.game = game;
        this.expansions = {};
    }
    load(name, expansion) {
        console.log(`Loading expansion: ${name}`);
        this.expansions[name] = expansion;
        if (expansion.init) expansion.init(this.game);
        if (expansion.patch) expansion.patch(this.game);
    }
}

// ==========================================
// 2. GAME ENTITIES
// ==========================================

class Spider {
    constructor(x, y, team) {
        this.x = x;
        this.y = y;
        this.team = team; // 'black' or 'red'
        this.size = 15;
        this.speed = Math.random() * 1 + 0.5;
        this.target = null;
        
        // Setup sprite (Fallback if image not found)
        this.sprite = new Image();
        this.sprite.src = team === 'black' ? 'assets/black_spider.png' : 'assets/red_spider.png';
        this.imageLoaded = false;
        this.sprite.onload = () => { this.imageLoaded = true; };
    }

    update() {
        // Base logic: Just sit there. (We will monkey-patch movement in an expansion!)
    }

    draw(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.sprite, this.x - this.size, this.y - this.size, this.size*2, this.size*2);
        } else {
            // Fallback drawing if AI sprites aren't loaded yet
            ctx.fillStyle = this.team;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            // Draw little legs
            ctx.strokeStyle = this.team;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.size, this.y); ctx.lineTo(this.x - this.size - 10, this.y - 10);
            ctx.moveTo(this.x + this.size, this.y); ctx.lineTo(this.x + this.size + 10, this.y - 10);
            ctx.stroke();
        }
    }
}

class Pumpkin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        
        this.sprite = new Image();
        this.sprite.src = 'assets/pumpkin.png';
        this.imageLoaded = false;
        this.sprite.onload = () => { this.imageLoaded = true; };
    }
    
    draw(ctx) {
        if (this.imageLoaded) {
            ctx.drawImage(this.sprite, this.x - this.size, this.y - this.size, this.size*2, this.size*2);
        } else {
            // Fallback drawing
            ctx.fillStyle = '#ff7b00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d5a27'; // stem
            ctx.fillRect(this.x - 5, this.y - this.size - 10, 10, 15);
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
        
        this.entities = [];
        this.pumpkins = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInputs();
        
        // Spawn initial pumpkins
        for(let i=0; i<5; i++) {
            this.pumpkins.push(new Pumpkin(Math.random() * this.canvas.width, Math.random() * this.canvas.height));
        }

        // Start Loop
        requestAnimationFrame(() => this.loop());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInputs() {
        // Left click = Black Team
        this.canvas.addEventListener('click', (e) => {
            this.bus.emit('spawnSpider', { x: e.clientX, y: e.clientY, team: 'black' });
        });
        
        // Right click = Red Team
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.bus.emit('spawnSpider', { x: e.clientX, y: e.clientY, team: 'red' });
        });

        // Listen to our own bus to handle spawning
        this.bus.on('spawnSpider', (data) => {
            this.entities.push(new Spider(data.x, data.y, data.team));
            document.getElementById('debug').innerText = `Spiders: ${this.entities.length}`;
        });
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.bus.emit('beforeUpdate', this);
        this.entities.forEach(ent => ent.update(this));
        this.bus.emit('afterUpdate', this);
    }

    draw() {
        // Clear screen with a slight trail effect (vibe)
        this.ctx.fillStyle = 'rgba(44, 30, 22, 1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.pumpkins.forEach(p => p.draw(this.ctx));
        this.entities.forEach(ent => ent.draw(this.ctx));
    }
}

// ==========================================
// 4. EXPANSIONS (MONKEY PATCHING!)
// ==========================================

const ScurryExpansion = {
    init: (game) => {
        console.log("Scurry AI initialized. Spiders will now seek pumpkins!");
    },
    patch: (game) => {
        // Save the original Spider update method (though it's empty right now)
        const originalUpdate = Spider.prototype.update;

        // Monkey patch a new update method to give them RTS movement logic
        Spider.prototype.update = function(gameInstance) {
            originalUpdate.call(this, gameInstance); // Call original if it did anything

            // If we don't have a target, pick a random pumpkin
            if (!this.target && gameInstance.pumpkins.length > 0) {
                this.target = gameInstance.pumpkins[Math.floor(Math.random() * gameInstance.pumpkins.length)];
            }

            // Move towards target
            if (this.target) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist > this.target.size) { // Stop at edge of pumpkin
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                } else {
                    // Jiggle around the pumpkin (harvesting vibe)
                    this.x += (Math.random() - 0.5) * 2;
                    this.y += (Math.random() - 0.5) * 2;
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
    // Load our expansion to instantly give spiders AI via monkey-patching!
    game.expansions.load('ScurryAI', ScurryExpansion);
};
