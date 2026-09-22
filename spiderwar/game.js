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
        
        // TERRITORY GENERATORS
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
            else if(this.type === 'pylon') { ctx.beginPath(); ctx.moveTo(this.x, this.y - this.size); ctx.lineTo(this.x - this.size, this.y + this.size); ctx.lineTo(this.x + this.size, this.y + this.size); ctx.fill(); } // Triangle fallback
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
        const dist = Math.hypot(dx, dy);
        if (dist < 10) { 
            this.target.hp -= this.damage; this.active = false; 
            game.bus.emit('particles', {x: this.target.x, y: this.target.y, color: this.team==='black'?'#aa00ff':'#ffaa00', count: 10});
        } 
        else { this.x += (dx/dist) * this.speed; this.y += (dy/dist) * this.speed; }
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
        
        this.world = { width: 6000, height: 6000 }; // HUGE NEW MAP SIZE
        this.camera = { x: 0, y: 0 }; this.tick = 0; 
        
        this.spiders = []; this.structures = []; this.queens = []; 
        this.projectiles = []; this.particles = []; this.spells = []; this.bosses = []; 
        this.resourceNodes = []; this.critters = [];      
        
        this.eco = { black: { pumpkins: 600, dew: 100 }, red: { pumpkins: 600, dew: 100 } }; 
        this.pop = { black: 0, red: 0 }; this.maxPop = { black: 10, red: 10 };
        this.techLevel = { black: 0, red: 0 }; 
        
        this.activeTool = 'select'; this.gameState = 'playing'; this.selectedStructure = null; 

        this.resize(); window.addEventListener('resize', () => this.resize());
        this.setupInputs(); requestAnimationFrame(() => this.loop());
    }

    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    getTerrainAt(x, y) {
        if(!this.mapGrid || !this.tileSize) return 'dirt';
        const tX = Math.floor(x / this.tileSize); const tY = Math.floor(y / this.tileSize);
        if(this.mapGrid[tY] && this.mapGrid[tY][tX]) return this.mapGrid[tY][tX]; return 'dirt';
    }

    checkTerritory(x, y, team) {
        // Find if x,y is inside the radius of ANY friendly territory-generating structure
        for(let s of this.structures) {
            if(s.team === team && s.territory > 0) {
                if(Math.hypot(s.x - x, s.y - y) <= s.territory) return true;
            }
        }
        return false;
    }

    setupInputs() {
        this.keys = {};
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase(); this.keys[k] = true;
            
            // Unify PC Hotkeys with the Mobile Toolbar!
            if(k === '1') { this.activeTool = 'nest'; this.bus.emit('toolChanged', 'nest'); }
            if(k === '2') { this.activeTool = 'eggsac'; this.bus.emit('toolChanged', 'eggsac'); }
            if(k === '3') { this.activeTool = 'turret'; this.bus.emit('toolChanged', 'turret'); }
            if(k === '4') { this.activeTool = 'wall'; this.bus.emit('toolChanged', 'wall'); }
            if(k === '7') { this.activeTool = 'venomStrike'; this.bus.emit('toolChanged', 'venomStrike'); }
            if(k === '8') { this.activeTool = 'silkTrap'; this.bus.emit('toolChanged', 'silkTrap'); }
            
            // Press Escape to cancel current tool
            if(k === 'escape') { this.activeTool = 'select'; this.bus.emit('toolChanged', 'select'); this.bus.emit('closeModal'); }
            
            // Upgrade Hotkey
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
                if (Math.hypot(dx, dy) > 5) hasMoved = true; 
                if (hasMoved) { this.camera.x = camStartX - dx; this.camera.y = camStartY - dy; }
            }
        };

        const endInteraction = (x, y, targetElem) => {
            if (isDragging) {
                isDragging = false;
                // Don't trigger game clicks if clicking UI elements
                if(targetElem.closest && (targetElem.closest('#structureModal') || targetElem.closest('#mobileToolbar') || targetElem.closest('#ui') || targetElem.closest('#gameOverModal'))) return;

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
                        
                        // If they hold Shift, let them keep painting buildings! Otherwise, auto-reset to Select tool.
                        if (!this.keys['shift']) {
                            this.activeTool = 'select'; this.bus.emit('toolChanged', 'select');
                        }
                    }
                    else {
                        // "Select" tool logic: Try to click a building to open the UI
                        let clickedStruct = null;
                        for(let s of this.structures) { if (s.team === 'black' && Math.hypot(s.x - worldX, s.y - worldY) < s.size) { clickedStruct = s; break; } }
                        this.selectedStructure = clickedStruct; 
                        if(clickedStruct) this.bus.emit('openModal', clickedStruct);
                        else this.bus.emit('closeModal'); 
                    }
                }
            }
        };

        this.canvas.addEventListener('mousedown', (e) => { if(e.button === 0) startInteraction(e.clientX, e.clientY); });
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
                this.spiders.push(new Spider(data.x + (Math.random()-0.5)*50, data.y + (Math.random()-0.5)*50, data.team, data.role));
                this.bus.emit('playSound', 'harvest'); 
            }
        });
        
        this.bus.on('buildStructure', (data) => {
            const costs = { 'nest': 150, 'eggsac': 50, 'turret': 100, 'wall': 25, 'pylon': 25 };
            if (!costs[data.type]) return; 
            
            if (data.team === 'black' && this.structures.filter(s => s.team === 'black').length > 0) {
                if(!this.checkTerritory(data.x, data.y, data.team)) {
                    game.bus.emit('particles', {x: data.x, y: data.y, color: '#ff0000', count: 10});
                    console.log("Must build inside web territory!");
                    return; 
                }
            }

            if (this.eco[data.team].pumpkins >= costs[data.type]) {
                this.eco[data.team].pumpkins -= costs[data.type];
                this.structures.push(new Structure(data.x, data.y, data.team, data.type));
                this.bus.emit('playSound', 'build');
            }
        });
    }

    updateUI() {
        if(this.gameState !== 'playing') return;
        document.getElementById('debug').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items: center;">
                <div style="font-size:1.2em;">
                    <span style="color:#aaa;">BLACK TEAM:</span> <strong>${this.eco.black.pumpkins}🎃 | ${this.eco.black.dew}💧</strong> 
                    <span style="font-size:0.8em; margin-left: 10px;">(Pop: ${this.pop.black}/${this.maxPop.black} | Tech: ${this.techLevel.black})</span>
                </div>
                <div style="font-size:1.2em; color:#ff4444;">
                    <span style="color:#772222;">RED TEAM:</span> <strong>${this.eco.red.pumpkins}🎃 | ${this.eco.red.dew}💧</strong>
                </div>
            </div>
            <div style="margin-top: 8px; font-size: 0.85em; color: #888;">
                <strong>1. Select Tool (1-4, 7-8)</strong> -> <strong>2. Click Map to place!</strong> (Hold Shift to paint) | <strong>[U] Upgrade</strong> | <strong>Click Nest for Units</strong>
            </div>
        `;
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

        this.maxPop.black = 10 + (this.structures.filter(s => s.team === 'black' && s.type === 'eggsac').length * 10);
        this.maxPop.red = 10 + (this.structures.filter(s => s.team === 'red' && s.type === 'eggsac').length * 10);
        this.pop.black = this.spiders.filter(s => s.team === 'black').length;
        this.pop.red = this.spiders.filter(s => s.team === 'red').length;

        this.structures.forEach(s => s.update(this)); this.spiders.forEach(s => s.update(this));
        this.queens.forEach(q => q.update(this)); this.projectiles.forEach(p => p.update(this));
        this.critters.forEach(c => c.update(this)); this.bosses.forEach(b => b.update(this));
        this.particles.forEach(p => p.update()); this.spells.forEach(s => s.update(this));
        
        if (this.selectedStructure && this.selectedStructure.hp <= 0) { this.selectedStructure = null; this.bus.emit('closeModal'); }
        
        this.spiders.filter(s => s.hp <= 0).forEach(s => { this.bus.emit('particles', {x: s.x, y: s.y, color: s.team, count: 30}); this.bus.emit('playSound', 'death'); });
        this.structures.filter(s => s.hp <= 0).forEach(s => { this.bus.emit('particles', {x: s.x, y: s.y, color: '#888', count: 50}); this.bus.emit('playSound', 'death'); });
        this.bosses.filter(b => b.hp <= 0).forEach(b => { this.bus.emit('particles', {x: b.x, y: b.y, color: '#00ff00', count: 100}); this.bus.emit('playSound', 'death'); });
        this.critters.filter(c => c.hp <= 0).forEach(c => { this.bus.emit('particles', {x: c.x, y: c.y, color: c.color || 'gold', count: 20}); this.bus.emit('playSound', 'harvest'); });

        this.resourceNodes = this.resourceNodes.filter(r => r.resources > 0);
        this.spiders = this.spiders.filter(s => s.hp > 0);
        this.queens = this.queens.filter(q => q.hp > 0);
        this.structures = this.structures.filter(s => s.hp > 0);
        this.projectiles = this.projectiles.filter(p => p.active);
        this.critters = this.critters.filter(c => c.hp > 0);
        this.particles = this.particles.filter(p => p.life > 0);
        this.spells = this.spells.filter(s => s.life > 0);
        this.bosses = this.bosses.filter(b => b.hp > 0);

        this.updateUI();
    }

    draw() {
        this.ctx.fillStyle = '#2c1e16'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save(); this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.bus.emit('preDraw', this.ctx); // Terrain
        this.bus.emit('territoryDraw', this.ctx); // NEW: Anno Territory Overlay
        
        this.spells.forEach(s => s.draw(this.ctx)); 
        this.bus.emit('atmosphereDraw', this.ctx);

        if(this.selectedStructure) {
            this.ctx.strokeStyle = '#ffffff'; this.ctx.lineWidth = 2; this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath(); this.ctx.arc(this.selectedStructure.x, this.selectedStructure.y, this.selectedStructure.size + 10, 0, Math.PI * 2);
            this.ctx.stroke(); this.ctx.setLineDash([]);
        }

        this.structures.forEach(s => s.draw(this.ctx)); this.resourceNodes.forEach(r => r.draw(this.ctx));
        this.critters.forEach(c => c.draw(this.ctx)); this.spiders.forEach(s => s.draw(this.ctx));
        this.queens.forEach(q => q.draw(this.ctx)); this.projectiles.forEach(p => p.draw(this.ctx));
        this.bosses.forEach(b => b.draw(this.ctx)); this.particles.forEach(p => p.draw(this.ctx)); 
        
        this.ctx.restore();
        this.bus.emit('uiDraw', this.ctx);
    }
}

// ==========================================
// 4. EXPANSIONS (THE MAGIC)
// ==========================================

const MobileUIExpansion = {
    init: (game) => {
        const style = document.createElement('style');
        style.innerHTML = `
            #mobileToolbar {
                position: fixed; bottom: 0; left: 0; width: 100%; 
                background: rgba(20, 10, 5, 0.95); border-top: 2px solid #ff9d00;
                display: flex; overflow-x: auto; padding: 10px; box-sizing: border-box;
                z-index: 2000; scrollbar-width: none; touch-action: pan-x;
            }
            #mobileToolbar::-webkit-scrollbar { display: none; }
            .tool-btn {
                background: #332; border: 2px solid #555; color: white; border-radius: 8px;
                padding: 10px 15px; margin-right: 10px; font-family: 'Courier New', monospace; font-weight: bold;
                flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center;
                cursor: pointer; min-width: 70px;
            }
            .tool-btn.active { background: #ff9d00; color: #111; border-color: white; }
            .tool-desc { font-size: 10px; opacity: 0.8; margin-top: 5px; }
            #ui { pointer-events: auto; max-width: 90vw; }
        `;
        document.head.appendChild(style);

        const toolbar = document.createElement('div'); toolbar.id = 'mobileToolbar';
        toolbar.innerHTML = `
            <div class="tool-btn active" data-tool="select">👆<div class="tool-desc">Select</div></div>
            <div class="tool-btn" data-tool="commandQueen">👑<div class="tool-desc">Command</div></div>
            <div class="tool-btn" data-tool="nest">🕸️<div class="tool-desc">Nest 150🎃</div></div>
            <div class="tool-btn" data-tool="eggsac">🥚<div class="tool-desc">Sac 50🎃</div></div>
            <div class="tool-btn" data-tool="pylon">🗼<div class="tool-desc">Pylon 25🎃</div></div>
            <div class="tool-btn" data-tool="turret">🔫<div class="tool-desc">Turret 100🎃</div></div>
            <div class="tool-btn" data-tool="wall">🧱<div class="tool-desc">Wall 25🎃</div></div>
            <div class="tool-btn" data-tool="venomStrike">☠️<div class="tool-desc">Strike 50💧</div></div>
            <div class="tool-btn" data-tool="silkTrap">🕸️<div class="tool-desc">Trap 25💧</div></div>
        `;
        document.body.appendChild(toolbar);

        const buttons = document.querySelectorAll('.tool-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = btn.getAttribute('data-tool');
                game.activeTool = tool; game.bus.emit('toolChanged', tool);
            });
        });

        game.bus.on('toolChanged', (toolName) => {
            buttons.forEach(b => b.classList.remove('active'));
            const activeBtn = document.querySelector(`.tool-btn[data-tool="${toolName}"]`);
            if(activeBtn) activeBtn.classList.add('active');
        });
    }
};

const LairUIExpansion = {
    init: (game) => {
        const style = document.createElement('style');
        style.innerHTML = `
            #structureModal {
                position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(20, 10, 5, 0.95); border: 2px solid #ff9d00; border-radius: 8px;
                padding: 20px; color: white; font-family: 'Courier New', monospace;
                display: none; z-index: 1000; width: 80%; max-width: 320px; box-shadow: 0 0 20px rgba(255, 157, 0, 0.5);
            }
            #structureModal h2 { margin-top: 0; color: #ff9d00; border-bottom: 1px solid #ff9d00; padding-bottom: 10px; font-size: 18px;}
            .modal-btn { background: #332; border: 1px solid #ff9d00; color: #ff9d00; padding: 15px; margin: 8px 0; width: 100%; cursor: pointer; font-family: inherit; font-weight: bold; font-size: 16px; border-radius: 8px; }
            .close-btn { position: absolute; top: 10px; right: 15px; cursor: pointer; color: red; font-size: 24px; font-weight: bold; padding: 10px; }
        `;
        document.head.appendChild(style);
        const modal = document.createElement('div'); modal.id = 'structureModal'; document.body.appendChild(modal);

        game.bus.on('openModal', (structure) => {
            modal.style.display = 'block';
            let htmlContent = `<span class="close-btn" onclick="document.getElementById('structureModal').style.display='none'">X</span>`;
            if (structure.type === 'nest') {
                htmlContent += `<h2>Main Nest (Lvl ${game.techLevel.black})</h2><p style="color:#aaa; font-size: 14px;">HP: ${structure.hp}/${structure.maxHp}</p>
                    <button class="modal-btn" id="btn-harvester">Hatch Harvester (10🎃)</button>
                    <button class="modal-btn" id="btn-soldier">Hatch Soldier (25🎃)</button>
                    <button class="modal-btn" id="btn-tech" style="margin-top: 20px; background: #522;">Evolve Tech (250🎃)</button>`;
            } else if (structure.type === 'turret') {
                htmlContent += `<h2>Venom Turret</h2><p style="color:#aaa; font-size: 14px;">HP: ${structure.hp}/${structure.maxHp}</p><p>Deals ${25 + (game.techLevel.black * 10)} dmg.</p>`;
            } else if (structure.type === 'pylon') {
                htmlContent += `<h2>Web Pylon</h2><p style="color:#aaa; font-size: 14px;">HP: ${structure.hp}/${structure.maxHp}</p><p>Expands buildable territory.</p>`;
            } else { htmlContent += `<h2>${structure.type.toUpperCase()}</h2><p style="color:#aaa; font-size: 14px;">HP: ${structure.hp}/${structure.maxHp}</p>`; }
            modal.innerHTML = htmlContent;

            const btnHarv = document.getElementById('btn-harvester'); if (btnHarv) btnHarv.onclick = () => game.bus.emit('spawnSpider', { x: structure.x, y: structure.y, team: 'black', role: 'harvester' });
            const btnSoldier = document.getElementById('btn-soldier'); if (btnSoldier) btnSoldier.onclick = () => game.bus.emit('spawnSpider', { x: structure.x, y: structure.y, team: 'black', role: 'soldier' });
            const btnTech = document.getElementById('btn-tech');
            if (btnTech) btnTech.onclick = () => { if (game.eco.black.pumpkins >= 250) { game.eco.black.pumpkins -= 250; game.techLevel.black++; game.bus.emit('playSound', 'spell'); game.bus.emit('openModal', structure); } };
        });
        game.bus.on('closeModal', () => { modal.style.display = 'none'; });
    }
};

// --- NEW EXPANSION: ANNO TERRITORY OVERLAYS ---
const TerritoryExpansion = {
    patch: (game) => {
        game.bus.on('territoryDraw', (ctx) => {
            // Draw glowing circles around Nests and Pylons
            for(let s of game.structures) {
                if(s.territory > 0) {
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.territory, 0, Math.PI * 2);
                    ctx.fillStyle = s.team === 'black' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 0, 0, 0.05)';
                    ctx.fill();
                    ctx.strokeStyle = s.team === 'black' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 0, 0, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        });
    }
}

// --- ORGANIC BLOB TERRAIN ---
const TerrainExpansion = {
    init: (game) => {
        game.tileSize = 128; // Smaller grid for much higher resolution organic shapes!
        game.tiles = { dirt: new Image(), vines: new Image(), pebbles: new Image(), water: new Image(), grass: new Image() };
        game.patterns = {}; // Store seamless CanvasPatterns here

        const loadPattern = (type, src) => {
            game.tiles[type].src = src;
            game.tiles[type].onload = () => {
                game.patterns[type] = game.ctx.createPattern(game.tiles[type], 'repeat');
            };
        };

        loadPattern('dirt', 'assets/tile_dirt.png');
        loadPattern('vines', 'assets/tile_vines.png');
        loadPattern('pebbles', 'assets/tile_pebbles.png');
        loadPattern('water', 'assets/tile_water.png');
        loadPattern('grass', 'assets/tile_grass.png');
        
        game.generateMap = function() {
            this.mapGrid = [];
            const cols = Math.ceil(this.world.width / this.tileSize); 
            const rows = Math.ceil(this.world.height / this.tileSize);
            const seedA = Math.random() * 100; const seedB = Math.random() * 100;
            
            for (let y = 0; y < rows; y++) {
                let row = [];
                for (let x = 0; x < cols; x++) { 
                    // Complex multi-octave noise for ultra-natural shapes
                    let nx = x / 8; let ny = y / 8;
                    let noise = Math.sin(nx + seedA) + Math.cos(ny + seedB) + (Math.sin(nx*2.5)*0.5);
                    
                    let type = 'dirt';
                    if (noise > 1.1) type = 'water'; 
                    else if (noise > 0.4) type = 'grass'; 
                    else if (noise < -1.1) type = 'pebbles'; 
                    else if (noise < -0.5) type = 'vines'; 
                    row.push(type);
                }
                this.mapGrid.push(row);
            }
            
            // Meandering River Generator
            let riverX = Math.floor(cols / 2);
            for(let y = 0; y < rows; y++) {
                this.mapGrid[y][riverX] = 'water'; 
                if(this.mapGrid[y][riverX-1]) this.mapGrid[y][riverX-1] = 'water'; 
                if(this.mapGrid[y][riverX+1]) this.mapGrid[y][riverX+1] = 'water'; 
                if(Math.random() > 0.4) riverX += (Math.random() > 0.5 ? 1 : -1);
            }
        };
        game.generateMap();

        // Seeded random for consistent wavy edges
        game.seededRandom = function(x, y) {
            let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
            return n - Math.floor(n);
        };
    },
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            if (!game.mapGrid) return;
            
            // 1. Draw solid Dirt background first
            ctx.fillStyle = game.patterns.dirt ? game.patterns.dirt : '#3d2817';
            ctx.fillRect(game.camera.x, game.camera.y, game.canvas.width, game.canvas.height);

            const startCol = Math.floor(game.camera.x / game.tileSize) - 2; 
            const endCol = startCol + Math.ceil(game.canvas.width / game.tileSize) + 4;
            const startRow = Math.floor(game.camera.y / game.tileSize) - 2; 
            const endRow = startRow + Math.ceil(game.canvas.height / game.tileSize) + 4;

            // 2. Draw biomes as massive, overlapping organic circles!
            // Order matters: Water draws last so it overlaps nicely on top of grass shores.
            const biomes = ['vines', 'pebbles', 'grass', 'water']; 
            
            biomes.forEach(biomeType => {
                if(!game.patterns[biomeType]) return; 
                ctx.fillStyle = game.patterns[biomeType];
                ctx.beginPath();
                
                for (let y = startRow; y <= endRow; y++) {
                    for (let x = startCol; x <= endCol; x++) {
                        if (y >= 0 && y < game.mapGrid.length && x >= 0 && x < game.mapGrid[y].length) {
                            if (game.mapGrid[y][x] === biomeType) {
                                const cX = x * game.tileSize + (game.tileSize/2);
                                const cY = y * game.tileSize + (game.tileSize/2);
                                
                                // Draw a circle much larger than the tile itself (1.3x)
                                // Jitter the radius slightly to make the edges uneven and organic!
                                let rJitter = game.seededRandom(x,y) * 40;
                                ctx.moveTo(cX, cY);
                                ctx.arc(cX, cY, (game.tileSize * 1.3) + rJitter, 0, Math.PI*2);
                            }
                        }
                    }
                }
                ctx.fill(); 
            });
        });
    }
};

const AdvancedBaseExpansion = {
    init: (game) => {
        setTimeout(() => {
            const pad = 600; // Push bases further into the massive map
            const bX = pad + Math.random() * 200; const bY = pad + Math.random() * 200;
            const rX = game.world.width - pad - Math.random() * 200; const rY = game.world.height - pad - Math.random() * 200;
            
            // Ensure bases start on safe dirt (override terrain)
            const tBX = Math.floor(bX/game.tileSize); const tBY = Math.floor(bY/game.tileSize);
            const tRX = Math.floor(rX/game.tileSize); const tRY = Math.floor(rY/game.tileSize);
            if(game.mapGrid[tBY]) game.mapGrid[tBY][tBX] = 'dirt';
            if(game.mapGrid[tRY]) game.mapGrid[tRY][tRX] = 'dirt';

            game.structures.push(new Structure(bX, bY, 'black', 'nest')); 
            game.structures.push(new Structure(bX + 80, bY, 'black', 'eggsac'));
            game.structures.push(new Structure(rX, rY, 'red', 'nest')); 
            game.structures.push(new Structure(rX - 80, rY, 'red', 'eggsac'));
            
            game.camera.x = Math.max(0, bX - (game.canvas.width / 2)); game.camera.y = Math.max(0, bY - (game.canvas.height / 2));
            
            // Massive organic resource scattering
            for (let i = 0; i < 40; i++) {
                let pX = 600 + Math.random() * (game.world.width - 1200); let pY = 600 + Math.random() * (game.world.height - 1200);
                for (let p = 0; p < Math.floor(Math.random() * 6) + 5; p++) game.resourceNodes.push(new ResourceNode(pX + (Math.random() - 0.5) * 300, pY + (Math.random() - 0.5) * 300, 'pumpkin'));
            }
            for (let i = 0; i < 60; i++) { game.resourceNodes.push(new ResourceNode(Math.random() * game.world.width, Math.random() * game.world.height, 'dew')); }
            
            // Spawn Critters
            for(let i=0; i<3; i++) game.critters.push(new GoldenBug(game.world.width/2 + (Math.random()-0.5)*1000, game.world.height/2 + (Math.random()-0.5)*1000));
            for(let i=0; i<30; i++) {
                // Aphids prefer grass
                let ax = Math.random() * game.world.width; let ay = Math.random() * game.world.height;
                if(game.getTerrainAt(ax, ay) === 'grass' || Math.random() > 0.8) game.critters.push(new Aphid(ax, ay));
            }
        }, 100);
    }
};

const HiveMindExpansion = {
    patch: (game) => {
        Structure.prototype.update = function(game) {
            const tDamage = 25 + (game.techLevel[this.team] * 10);
            if(this.type === 'turret') {
                this.cooldown--;
                if(this.cooldown <= 0) {
                    let allEnemies = game.spiders.concat(game.queens).concat(game.critters).concat(game.bosses).filter(e => e.team !== this.team);
                    for(let e of allEnemies) {
                        if(Math.hypot(e.x - this.x, e.y - this.y) < 200) { 
                            game.projectiles.push(new Projectile(this.x, this.y, e, tDamage, this.team));
                            game.bus.emit('playSound', 'shoot');
                            this.cooldown = 45; break; 
                        }
                    }
                }
            }
            if (this.team === 'red' && this.type === 'nest') {
                if (game.eco.red.pumpkins >= 500 && Math.random() < 0.05) { game.eco.red.pumpkins -= 250; game.techLevel.red++; }
                if (game.eco.red.pumpkins >= 50 && game.pop.red < game.maxPop.red) {
                    if(!this.spawnTimer) this.spawnTimer = 0;
                    this.spawnTimer--;
                    if(this.spawnTimer <= 0) {
                        const role = Math.random() > 0.8 ? 'soldier' : 'harvester'; 
                        const cost = role === 'soldier' ? 25 : 10;
                        if(game.eco.red.pumpkins >= cost) {
                            game.eco.red.pumpkins -= cost; 
                            game.bus.emit('spawnSpider', { x: this.x + (Math.random()-0.5)*100, y: this.y + (Math.random()-0.5)*100, team: 'red', role: role });
                            this.spawnTimer = 120; 
                        }
                    }
                } else if (game.pop.red >= game.maxPop.red && game.eco.red.pumpkins > 200) {
                    game.eco.red.pumpkins -= 50; 
                    // AI now builds Pylons to expand if it's out of space!
                    let bType = Math.random() > 0.7 ? 'pylon' : 'eggsac';
                    game.structures.push(new Structure(this.x + (Math.random()-0.5)*400, this.y + (Math.random()-0.5)*400, 'red', bType));
                }
            }
        };
    }
};

// --- UPDATED GAME LOOP: THE RESTART MODAL ---
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

        const ogUpdate = Game.prototype.update;
        Game.prototype.update = function() {
            ogUpdate.call(this); 
            if (this.queens.length > 0 && this.gameState === 'playing') {
                const blackQueen = this.queens.find(q => q.team === 'black'); const redQueen = this.queens.find(q => q.team === 'red');
                if (!blackQueen || blackQueen.hp <= 0) { 
                    this.gameState = 'lose'; 
                    document.getElementById('debug').style.display = 'none'; 
                    document.getElementById('mobileToolbar').style.display='none';
                    goModal.style.borderColor = '#ff0000';
                    goModal.innerHTML = `<h1 style="color:#ff0000;">DEFEAT</h1><p>Your Queen has fallen to the Red Swarm.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                    goModal.style.display = 'block';
                } 
                else if (!redQueen || redQueen.hp <= 0) { 
                    this.gameState = 'win'; 
                    document.getElementById('debug').style.display = 'none'; 
                    document.getElementById('mobileToolbar').style.display='none';
                    goModal.style.borderColor = '#00ff00';
                    goModal.innerHTML = `<h1 style="color:#00ff00;">VICTORY</h1><p>The Pumpkin Patch belongs to the Black Swarm.</p><button class="restart-btn" onclick="window.location.reload()">PLAY AGAIN</button>`;
                    goModal.style.display = 'block';
                }
            }
        };

        game.bus.on('uiDraw', (ctx) => {
            if (game.gameState === 'playing') return;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
            // Modal HTML handles the rest!
        });
    }
};

// --- AUDIO SYNTH EXPANSION ---
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

// --- OTHER ENTITIES (UNCHANGED) ---
class Aphid {
    constructor(x, y) { this.x = x; this.y = y; this.size = 8; this.hp = 30; this.maxHp = 30; this.angle = Math.random() * Math.PI * 2; this.speed = 0.3; this.team = 'nature'; this.color = '#7eff5e'; }
    update(game) {
        if(Math.random() < 0.1) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        if(this.hp <= 0) { game.resourceNodes.push(new ResourceNode(this.x, this.y, 'dew')); }
    }
    draw(ctx) { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle = this.color; ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-2, 0, 0, Math.PI*2); ctx.fill(); ctx.restore(); }
}

class GoldenBug {
    constructor(x, y) { this.x = x; this.y = y; this.size = 15; this.hp = 250; this.maxHp = 250; this.angle = Math.random() * Math.PI * 2; this.speed = 0.5; this.team = 'nature'; this.color = 'gold';}
    update(game) {
        if(Math.random() < 0.05) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        if(this.hp <= 0) for(let i=0; i<5; i++) game.resourceNodes.push(new ResourceNode(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100, 'pumpkin'));
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
            if(terrain === 'water') tMod = 0.3; if(terrain === 'grass') tMod = 1.3; 

            let techSpeed = (game.techLevel[this.team] * 0.2); 
            if(this.isSlowed) techSpeed -= (this.baseSpeed / 2); 
            const currentSpeed = Math.max(0.1, (this.baseSpeed + techSpeed)) * tMod;

            if (Math.hypot(dx, dy) > 10) { this.angle = Math.atan2(dy, dx); this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed; } 
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
        setTimeout(() => {
            if(game.queens.length > 0) return;
            const bNest = game.structures.find(s => s.team === 'black' && s.type === 'nest'); const rNest = game.structures.find(s => s.team === 'red' && s.type === 'nest');
            if(bNest) game.queens.push(new Queen(bNest.x + 50, bNest.y + 50, 'black')); if(rNest) game.queens.push(new Queen(rNest.x - 50, rNest.y - 50, 'red'));
        }, 150);
        game.bus.on('commandQueen', (data) => {
            const queen = game.queens.find(q => q.team === data.team);
            if(queen) queen.commandTarget = { x: data.x, y: data.y };
        });
    }
};

const CombatAndHarvesterExpansion = {
    patch: (game) => {
        Spider.prototype.update = function(game) {
            const techLvl = game.techLevel[this.team]; 
            const currentDamage = this.damage + (techLvl * 5); 
            
            const terrain = game.getTerrainAt(this.x, this.y); let tMod = 1.0;
            if(terrain === 'water') tMod = 0.3; if(terrain === 'grass') tMod = 1.3; 
            
            let currentSpeed = (this.baseSpeed + (techLvl * 0.15)) * tMod;
            if (this.isSlowed) currentSpeed *= 0.3; this.isSlowed = false; 

            let allEnemies = game.spiders.concat(game.queens).concat(game.critters).concat(game.structures).concat(game.bosses).filter(e => e.team !== this.team && e.hp > 0);
            let nearestEnemy = null; let minDist = 150 + (techLvl * 10);
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
                        game.bus.emit('particles', {x: nearestEnemy.x, y: nearestEnemy.y, color: this.team==='black'?'#aa00ff':'#ffaa00', count: 5}); 
                        game.bus.emit('playSound', 'harvest');
                    }
                }
                return; 
            }

            if (this.role === 'soldier') {
                const myQueen = game.queens.find(q => q.team === this.team);
                if (myQueen) {
                    const dx = myQueen.x - this.x; const dy = myQueen.y - this.y;
                    if (Math.hypot(dx, dy) > 80) { 
                        this.angle = Math.atan2(dy, dx);
                        this.x += Math.cos(this.angle) * currentSpeed; this.y += Math.sin(this.angle) * currentSpeed;
                    }
                }
                return; 
            }

            if (this.cargo.amount === 0) this.state = 'seeking_pumpkin'; else this.state = 'returning_home';
            if (this.state === 'seeking_pumpkin') {
                if (!this.target || this.target.resources <= 0) {
                    if (game.resourceNodes.length > 0) {
                        let closest = null; let minD = Infinity;
                        for(let r of game.resourceNodes) { let d = Math.hypot(r.x - this.x, r.y - this.y); if(d < minD) { minD = d; closest = r; } }
                        this.target = closest;
                    } else this.target = null;
                }
            } else {
                let closest = null; let minD = Infinity;
                game.structures.filter(s => s.team === this.team && (s.type === 'nest' || s.type === 'pylon')).forEach(n => { let d = Math.hypot(n.x - this.x, n.y - this.y); if(d < minD) { minD = d; closest = n; } });
                game.queens.filter(q => q.team === this.team).forEach(q => { let d = Math.hypot(q.x - this.x, q.y - this.y); if(d < minD) { minD = d; closest = q; } });
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
                        this.cargo.amount = 10; this.cargo.type = this.target.type; this.target.resources -= 10; this.target = null; 
                        game.bus.emit('particles', {x: this.x, y: this.y, color: this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff', count: 5}); 
                        game.bus.emit('playSound', 'harvest');
                    } else if (this.state === 'returning_home') {
                        if(this.cargo.type === 'pumpkin') game.eco[this.team].pumpkins += this.cargo.amount;
                        else if(this.cargo.type === 'dew') game.eco[this.team].dew += this.cargo.amount;
                        this.cargo.amount = 0; this.target = null;
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
    init: (game) => {
        game.minimap = { size: 200, padding: 10 }; 
        game.isMinimapDragging = false;
        
        game.moveCameraFromMinimap = function(localX, localY) {
            const pctX = Math.max(0, Math.min(localX / this.minimap.size, 1)); 
            const pctY = Math.max(0, Math.min(localY / this.minimap.size, 1));
            this.camera.x = (pctX * this.world.width) - (this.canvas.width / 2); 
            this.camera.y = (pctY * this.world.height) - (this.canvas.height / 2);
        };
        
        // Helper to check if mouse is hitting the minimap
        const checkMinimapClick = (clientX, clientY) => {
            const mmX = game.canvas.width - game.minimap.size - game.minimap.padding; 
            const mmY = game.canvas.height - game.minimap.size - game.minimap.padding - 80; 
            if (clientX >= mmX && clientX <= mmX + game.minimap.size && clientY >= mmY && clientY <= mmY + game.minimap.size) {
                game.isMinimapDragging = true; 
                game.moveCameraFromMinimap(clientX - mmX, clientY - mmY);
            }
        };

        const checkMinimapMove = (clientX, clientY) => {
            if (game.isMinimapDragging) {
                const mmX = game.canvas.width - game.minimap.size - game.minimap.padding; 
                const mmY = game.canvas.height - game.minimap.size - game.minimap.padding - 80;
                game.moveCameraFromMinimap(clientX - mmX, clientY - mmY);
            }
        };

        // MOUSE CONTROLS
        game.canvas.addEventListener('mousedown', e => { 
            if (e.button === 0) checkMinimapClick(e.clientX, e.clientY); 
        });
        
        window.addEventListener('mousemove', e => checkMinimapMove(e.clientX, e.clientY));
        
        // THE BUG FIX: Unconditionally release the drag state no matter where the mouse is!
        window.addEventListener('mouseup', e => { 
            if (e.button === 0) game.isMinimapDragging = false; 
        });
        
        // TOUCH CONTROLS (Mobile)
        game.canvas.addEventListener('touchstart', e => { 
            if(e.touches.length===1) checkMinimapClick(e.touches[0].clientX, e.touches[0].clientY); 
        }, {passive: false});
        
        window.addEventListener('touchmove', e => { 
            if(e.touches.length===1) checkMinimapMove(e.touches[0].clientX, e.touches[0].clientY); 
        }, {passive: false});
        
        // Unconditionally release touch drag state
        window.addEventListener('touchend', e => { 
            game.isMinimapDragging = false; 
        });
    },
    patch: (game) => {
        game.bus.on('uiDraw', (ctx) => {
            if(game.gameState !== 'playing') return;
            const size = game.minimap.size; const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; 
            const startY = game.canvas.height - size - pad - 90; // Raised to clear mobile toolbar
            
            ctx.fillStyle = 'rgba(20, 10, 5, 0.8)'; ctx.fillRect(startX, startY, size, size);
            ctx.strokeStyle = '#ff9d00'; ctx.lineWidth = 2; ctx.strokeRect(startX, startY, size, size);

            const scaleX = size / game.world.width; const scaleY = size / game.world.height;
            
            // Draw River on minimap
            ctx.fillStyle = 'rgba(26, 78, 110, 0.5)'; 
            ctx.fillRect(startX + (game.world.width/2)*scaleX - 2, startY, 4, size);

            const drawDot = (ent, color, r) => { ctx.fillStyle = color; ctx.fillRect(startX + (ent.x * scaleX) - r, startY + (ent.y * scaleY) - r, r*2, r*2); };

            // Draw all entities
            game.resourceNodes.forEach(r => drawDot(r, r.type === 'pumpkin' ? '#ff7b00' : '#00aaff', 1.5));
            game.structures.forEach(s => drawDot(s, s.team === 'black' ? '#ffffff' : '#ff4444', 3));
            game.spiders.forEach(s => drawDot(s, s.team === 'black' ? '#aaaaaa' : '#aa0000', 1));
            game.critters.forEach(c => drawDot(c, c.color || 'gold', 2));
            game.bosses.forEach(b => drawDot(b, '#00ff00', 4)); 
            game.queens.forEach(q => { 
                drawDot(q, q.team === 'black' ? '#ffffff' : '#ff4444', 4); 
                ctx.strokeStyle = 'gold'; ctx.lineWidth = 1; 
                ctx.strokeRect(startX + (q.x * scaleX) - 5, startY + (q.y * scaleY) - 5, 10, 10); 
            });
            
            // Draw Camera Viewport
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1; 
            ctx.strokeRect(startX + (game.camera.x * scaleX), startY + (game.camera.y * scaleY), game.canvas.width * scaleX, game.canvas.height * scaleY);
        });
    }
};

const WebNetworkExpansion = {
    patch: (game) => {
        game.bus.on('preDraw', (ctx) => {
            ctx.lineWidth = 1;
            for (let i = 0; i < game.spiders.length; i++) {
                let s1 = game.spiders[i];
                if (s1.x < game.camera.x - 100 || s1.x > game.camera.x + game.canvas.width + 100 || s1.y < game.camera.y - 100 || s1.y > game.camera.y + game.canvas.height + 100) continue;
                game.structures.filter(s => s.team === s1.team).forEach(struct => {
                    if (Math.hypot(struct.x - s1.x, struct.y - s1.y) < 150) { ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(255, 100, 100, 0.3)'; ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(struct.x, struct.y); ctx.stroke(); }
                });
                for (let j = i + 1; j < game.spiders.length; j++) {
                    let s2 = game.spiders[j];
                    if (s1.team === s2.team && Math.hypot(s2.x - s1.x, s2.y - s1.y) < 80) { ctx.strokeStyle = s1.team === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(255, 100, 100, 0.2)'; ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke(); }
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
                game.particles.push(new Particle(data.x, data.y, c));
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
        const ogStructDraw = Structure.prototype.draw; Structure.prototype.draw = function(ctx) {
            const cycle = Math.sin(game.tick / 1800);
            if (cycle > 0 && (this.type === 'nest' || this.type === 'turret')) { ctx.shadowBlur = 30 * cycle; ctx.shadowColor = this.team === 'black' ? '#aa00ff' : '#ff3300'; }
            ogStructDraw.call(this, ctx); ctx.shadowBlur = 0; 
        };
        const ogQueenDraw = Queen.prototype.draw; Queen.prototype.draw = function(ctx) {
            const cycle = Math.sin(game.tick / 1800);
            if (cycle > 0) { ctx.shadowBlur = 40 * cycle; ctx.shadowColor = this.team === 'black' ? '#ffffff' : '#ff0000'; }
            ogQueenDraw.call(this, ctx); ctx.shadowBlur = 0;
        };
    }
}

class Spell {
    constructor(x, y, team, type) { this.x = x; this.y = y; this.team = team; this.type = type; this.life = 600; this.radius = type === 'venomStrike' ? 100 : 150; }
    update(game) {
        this.life--;
        const allEnemies = game.spiders.concat(game.queens).concat(game.bosses).filter(e => e.team !== this.team);
        for(let e of allEnemies) {
            if(Math.hypot(e.x - this.x, e.y - this.y) < this.radius) {
                if(this.type === 'venomStrike') {
                    if (game.tick % 15 === 0) { e.hp -= 5; game.bus.emit('particles', {x: e.x, y: e.y, color: '#00ff00', count: 2}); }
                } else if (this.type === 'silkTrap') { e.isSlowed = true; }
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
                game.spells.push(new Spell(data.x, data.y, data.team, data.type));
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
        let allTargets = game.spiders.concat(game.queens).concat(game.structures);
        let nearest = null; let minDist = 800; 
        for (let t of allTargets) { let d = Math.hypot(t.x - this.x, t.y - this.y); if (d < minDist) { minDist = d; nearest = t; } }
        if (nearest) {
            this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            if (minDist > 30) { this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed; } 
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
            console.log("THE CENTIPEDE AWAKENS!");
            game.bosses.push(new CentipedeBoss(game.world.width/2, game.world.height/2));
            game.bus.emit('playSound', 'spell');
        }, 180000); 
    }
};

const SaveLoadExpansion = {
    init: (game) => {
        game.bus.on('triggerSave', () => {
            const state = {
                eco: game.eco, pop: game.pop, maxPop: game.maxPop, techLevel: game.techLevel, camera: game.camera, mapGrid: game.mapGrid, tick: game.tick,
                spiders: game.spiders.map(s => ({x: s.x, y: s.y, team: s.team, role: s.role, hp: s.hp, cargo: s.cargo})),
                structures: game.structures.map(s => ({x: s.x, y: s.y, team: s.team, type: s.type, hp: s.hp})),
                resourceNodes: game.resourceNodes.map(p => ({x: p.x, y: p.y, type: p.type, resources: p.resources})),
                queens: game.queens.map(q => ({x: q.x, y: q.y, team: q.team, hp: q.hp})),
                critters: game.critters.map(b => ({x: b.x, y: b.y, hp: b.hp, color: b.color})) 
            };
            localStorage.setItem('spiderRTS_saveData', JSON.stringify(state)); alert("Game Saved!");
        });

        game.bus.on('triggerLoad', () => {
            const data = localStorage.getItem('spiderRTS_saveData'); if(!data) return alert("No save found!");
            const state = JSON.parse(data);
            game.eco = state.eco; game.pop = state.pop; game.maxPop = state.maxPop; game.techLevel = state.techLevel; game.camera = state.camera; game.mapGrid = state.mapGrid; game.tick = state.tick || 0;
            game.spiders = state.spiders.map(s => { let o = new Spider(s.x, s.y, s.team, s.role); o.hp = s.hp; o.cargo = s.cargo; return o; });
            game.structures = state.structures.map(s => { let o = new Structure(s.x, s.y, s.team, s.type); o.hp = s.hp; return o; });
            game.resourceNodes = state.resourceNodes.map(p => { let o = new ResourceNode(p.x, p.y, p.type); o.resources = p.resources; return o; });
            game.queens = state.queens.map(q => { let o = new Queen(q.x, q.y, q.team); o.hp = q.hp; return o; });
            game.projectiles = []; game.particles = []; game.spells = []; game.bosses = []; game.critters = []; alert("Game Loaded!");
        });
    }
};

// ==========================================
// BOOTSTRAP
// ==========================================
window.onload = () => {
    const game = new Game();
    
    // Core Game Systems
    game.expansions.load('TerrainGen', TerrainExpansion); // SINE WAVE MAP GEN
    game.expansions.load('AdvancedBaseBuilder', AdvancedBaseExpansion); 
    game.expansions.load('QueenSystem', QueenExpansion); 
    game.expansions.load('HiveMind', HiveMindExpansion); 
    game.expansions.load('CombatAndHarvesterAI', CombatAndHarvesterExpansion); 
    game.expansions.load('WebNetwork', WebNetworkExpansion); 
    game.expansions.load('TerritoryControl', TerritoryExpansion); // NEW: ANNO TERRITORY OVERLAYS
    
    // UI EXPANSIONS
    game.expansions.load('MobileUI', MobileUIExpansion); 
    game.expansions.load('LairUI', LairUIExpansion); 
    game.expansions.load('MinimapUI', MinimapExpansion); 
    game.expansions.load('GameLoop', GameLoopExpansion); // NEW: RESTART MODAL
    game.expansions.load('SaveLoadManager', SaveLoadExpansion); 
    
    // JUICE & AUDIO
    game.expansions.load('ParticleEngine', ParticleExpansion); 
    game.expansions.load('Atmosphere', AtmosphereExpansion); 
    game.expansions.load('CommanderSpells', SpellExpansion); 
    game.expansions.load('AudioSynth', AudioExpansion);
    game.expansions.load('CentipedeBoss', GodUnitExpansion); 
};
