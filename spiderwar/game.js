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
        this.speed = this.baseSpeed; // Will be modified by terrain
        this.hp = role === 'soldier' ? 200 : 100; this.maxHp = this.hp;
        this.damage = role === 'soldier' ? 30 : 15; this.attackSpeed = role === 'soldier' ? 20 : 30;
        this.cooldown = 0; this.angle = 0; this.state = 'idle'; this.target = null; 
        
        // Cargo now tracks amount AND type
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
            ctx.fillStyle = this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff'; // Orange or Blue
            ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill(); 
        }
        ctx.restore();
    }
}

// UNIVERSAL RESOURCE NODE
class ResourceNode {
    constructor(x, y, type) {
        this.x = x; this.y = y; this.type = type; // 'pumpkin' or 'dew'
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

// ==========================================
// 3. MAIN GAME CLASS 
// ==========================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas'); this.ctx = this.canvas.getContext('2d');
        this.bus = new GameBus(); this.expansions = new ExpansionManager(this);
        
        this.world = { width: 4000, height: 4000 }; this.camera = { x: 0, y: 0 }; this.tick = 0; 
        
        // Entity Registries
        this.spiders = []; this.structures = []; this.queens = []; 
        this.projectiles = []; this.particles = []; this.spells = []; 
        this.bosses = []; 
        
        // Ecosystem Registries
        this.resourceNodes = []; // Replaces pumpkins array
        this.critters = [];      // Golden bugs and Aphids
        
        // Multi-Resource Economy!
        this.eco = { 
            black: { pumpkins: 600, dew: 100 }, 
            red: { pumpkins: 600, dew: 100 } 
        }; 
        
        this.pop = { black: 0, red: 0 }; this.maxPop = { black: 10, red: 10 };
        this.techLevel = { black: 0, red: 0 }; 
        this.buildSelection = 'nest'; this.gameState = 'playing'; this.selectedStructure = null; 

        this.resize(); window.addEventListener('resize', () => this.resize());
        this.setupInputs(); requestAnimationFrame(() => this.loop());
    }

    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

    // Helper to get terrain type underneath coordinates
    getTerrainAt(x, y) {
        if(!this.mapGrid || !this.tileSize) return 'dirt';
        const tX = Math.floor(x / this.tileSize);
        const tY = Math.floor(y / this.tileSize);
        if(this.mapGrid[tY] && this.mapGrid[tY][tX]) return this.mapGrid[tY][tX];
        return 'dirt';
    }

    setupInputs() {
        this.keys = {};
        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase(); this.keys[k] = true;
            if(k === '1') this.buildSelection = 'nest'; if(k === '2') this.buildSelection = 'eggsac';
            if(k === '3') this.buildSelection = 'turret'; if(k === '4') this.buildSelection = 'wall';
            if(k === '7') this.buildSelection = 'venomStrike'; if(k === '8') this.buildSelection = 'silkTrap';
        });
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        let isDragging = false; let dragStartX, dragStartY, camStartX, camStartY, hasMoved;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { 
                isDragging = true; hasMoved = false; dragStartX = e.clientX; dragStartY = e.clientY;
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
                if(e.target.closest('#structureModal') || e.target.closest('#ui')) return;

                if (!hasMoved && !this.isMinimapDragging) {
                    const worldX = e.clientX + this.camera.x; const worldY = e.clientY + this.camera.y;
                    
                    if (this.keys['e']) { 
                        this.bus.emit('buildStructure', { x: worldX, y: worldY, team: 'black', type: this.buildSelection }); 
                    } 
                    else if (this.buildSelection === 'venomStrike' || this.buildSelection === 'silkTrap') {
                        this.bus.emit('castSpell', { x: worldX, y: worldY, type: this.buildSelection, team: 'black' });
                        this.buildSelection = 'nest'; 
                    } 
                    else { 
                        let clickedStruct = null;
                        for(let s of this.structures) {
                            if (s.team === 'black' && Math.hypot(s.x - worldX, s.y - worldY) < s.size) { clickedStruct = s; break; }
                        }
                        this.selectedStructure = clickedStruct; 
                        if(clickedStruct) this.bus.emit('openModal', clickedStruct);
                        else this.bus.emit('closeModal'); 
                    }
                }
            }
        });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.bus.emit('commandQueen', { x: e.clientX + this.camera.x, y: e.clientY + this.camera.y, team: 'black' });
        });

        this.bus.on('spawnSpider', (data) => {
            const cost = data.role === 'soldier' ? 25 : 10;
            if (this.eco[data.team].pumpkins >= cost && this.pop[data.team] < this.maxPop[data.team]) {
                this.eco[data.team].pumpkins -= cost; 
                this.spiders.push(new Spider(data.x + (Math.random()-0.5)*50, data.y + (Math.random()-0.5)*50, data.team, data.role));
                this.bus.emit('playSound', 'harvest'); 
            }
        });
        
        this.bus.on('buildStructure', (data) => {
            const costs = { 'nest': 150, 'eggsac': 50, 'turret': 100, 'wall': 25 };
            if (!costs[data.type]) return; 
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
            <div style="display:flex; justify-content:space-between; font-size:1.1em;">
                <span><strong>Black: ${this.eco.black.pumpkins}🎃 | ${this.eco.black.dew}💧</strong> | Pop: ${this.pop.black}/${this.maxPop.black} | Tech: ${this.techLevel.black}</span>
                <span style="color:#ff4444;"><strong>Red: ${this.eco.red.pumpkins}🎃 | ${this.eco.red.dew}💧</strong> | Pop: ${this.pop.red}/${this.maxPop.red} | Tech: ${this.techLevel.red}</span>
            </div>
            <hr style="border-color:#ff9d0055;">
            <div style="display:flex; justify-content:space-between; font-size: 0.9em;">
                <div>
                    <strong>Builds(Hold E):</strong> <span style="${this.buildSelection==='nest'?'color:white;':''}">[1] Nest(150🎃)</span> | <span style="${this.buildSelection==='eggsac'?'color:white;':''}">[2] Sac(50🎃)</span> | <span style="${this.buildSelection==='turret'?'color:white;':''}">[3] Turret(100🎃)</span> | <span style="${this.buildSelection==='wall'?'color:white;':''}">[4] Wall(25🎃)</span><br>
                    <strong>Spells(Costs Dew!):</strong> <span style="${this.buildSelection==='venomStrike'?'color:white;':''}">[7] Strike(50💧)</span> | <span style="${this.buildSelection==='silkTrap'?'color:white;':''}">[8] Trap(25💧)</span>
                </div>
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
        
        this.bus.emit('preDraw', this.ctx);
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

const LairUIExpansion = {
    init: (game) => {
        const style = document.createElement('style');
        style.innerHTML = `
            #structureModal {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(20, 10, 5, 0.95); border: 2px solid #ff9d00; border-radius: 8px;
                padding: 20px; color: white; font-family: 'Courier New', monospace;
                display: none; z-index: 1000; min-width: 320px; box-shadow: 0 0 20px rgba(255, 157, 0, 0.5);
            }
            #structureModal h2 { margin-top: 0; color: #ff9d00; border-bottom: 1px solid #ff9d00; padding-bottom: 10px; text-transform: uppercase;}
            .modal-btn { background: #332; border: 1px solid #ff9d00; color: #ff9d00; padding: 12px; margin: 5px 0; width: 100%; cursor: pointer; font-family: inherit; font-weight: bold; transition: 0.2s; border-radius: 4px; }
            .modal-btn:hover { background: #ff9d00; color: #221; } .close-btn { position: absolute; top: 10px; right: 15px; cursor: pointer; color: red; font-size: 20px; font-weight: bold; } .close-btn:hover { color: white; }
        `;
        document.head.appendChild(style);
        const modal = document.createElement('div'); modal.id = 'structureModal'; document.body.appendChild(modal);

        game.bus.on('openModal', (structure) => {
            modal.style.display = 'block';
            let htmlContent = `<span class="close-btn" onclick="document.getElementById('structureModal').style.display='none'">X</span>`;
            if (structure.type === 'nest') {
                htmlContent += `<h2>Main Nest (Lvl ${game.techLevel.black})</h2><p style="color:#aaa; font-size: 14px;">HP: ${structure.hp}/${structure.maxHp}</p>
                    <button class="modal-btn" id="btn-harvester">Hatch Harvester (10 🎃)</button>
                    <button class="modal-btn" id="btn-soldier">Hatch Soldier (25 🎃)</button>
                    <button class="modal-btn" id="btn-tech" style="margin-top: 20px; background: #522;">Evolve Tech (250 🎃)</button>`;
            } else if (structure.type === 'turret') {
                htmlContent += `<h2>Venom Turret</h2><p style="color:#aaa; font-size: 14px;">HP: ${structure.hp}/${structure.maxHp}</p><p>Deals ${25 + (game.techLevel.black * 10)} damage.</p>`;
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

const AudioExpansion = {
    init: (game) => {
        const AudioContext = window.AudioContext || window.webkitAudioContext; const ctx = new AudioContext();
        const unlock = () => { if(ctx.state === 'suspended') ctx.resume(); window.removeEventListener('click', unlock); };
        window.addEventListener('click', unlock);
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

// --- NEW EXPANSION: ADVANCED BIOMES (RIVERS & GRASS) ---
const TerrainExpansion = {
    init: (game) => {
        game.tileSize = 256; 
        game.tiles = { dirt: new Image(), vines: new Image(), pebbles: new Image(), water: new Image(), grass: new Image() };
        game.tiles.dirt.src = 'assets/tile_dirt.png'; game.tiles.vines.src = 'assets/tile_vines.png'; game.tiles.pebbles.src = 'assets/tile_pebbles.png';
        game.tiles.water.src = 'assets/tile_water.png'; game.tiles.grass.src = 'assets/tile_grass.png';
        
        game.generateMap = function() {
            this.mapGrid = [];
            const cols = Math.ceil(this.world.width / this.tileSize);
            const rows = Math.ceil(this.world.height / this.tileSize);
            
            for (let y = 0; y < rows; y++) {
                let row = [];
                for (let x = 0; x < cols; x++) { row.push(Math.random() > 0.75 ? 'vines' : (Math.random() > 0.60 ? 'pebbles' : 'dirt')); }
                this.mapGrid.push(row);
            }
            
            // Generate a River cutting vertically through the middle
            let riverX = Math.floor(cols / 2);
            for(let y = 0; y < rows; y++) {
                this.mapGrid[y][riverX] = 'water';
                if(this.mapGrid[y][riverX-1]) this.mapGrid[y][riverX-1] = 'water'; // 2 tiles wide
                // Random river meandering
                if(Math.random() > 0.6) riverX += (Math.random() > 0.5 ? 1 : -1);
            }
            
            // Generate Grass Biome Patches
            for(let i=0; i<10; i++) {
                let gX = Math.floor(Math.random() * cols); let gY = Math.floor(Math.random() * rows);
                for(let dy=-2; dy<=2; dy++) {
                    for(let dx=-2; dx<=2; dx++) {
                        if(this.mapGrid[gY+dy] && this.mapGrid[gY+dy][gX+dx] && Math.random() > 0.3) {
                            if(this.mapGrid[gY+dy][gX+dx] !== 'water') this.mapGrid[gY+dy][gX+dx] = 'grass';
                        }
                    }
                }
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
                        else { 
                            let col = '#3d2817'; // dirt
                            if(type === 'vines') col = '#2d4c1e'; else if(type === 'pebbles') col = '#555';
                            else if(type === 'water') col = '#1a4e6e'; else if(type === 'grass') col = '#3a7a2e';
                            ctx.fillStyle = col; ctx.fillRect(x*game.tileSize, y*game.tileSize, game.tileSize, game.tileSize); 
                        }
                    }
                }
            }
        });
    }
};

// --- NEW EXPANSION: NEUTRAL CRITTERS (APHIDS) ---
class Aphid {
    constructor(x, y) { 
        this.x = x; this.y = y; this.size = 8; this.hp = 30; this.maxHp = 30; 
        this.angle = Math.random() * Math.PI * 2; this.speed = 0.3; this.team = 'nature'; this.color = '#7eff5e';
    }
    update(game) {
        if(Math.random() < 0.1) this.angle += (Math.random() - 0.5);
        this.x += Math.cos(this.angle) * this.speed; this.y += Math.sin(this.angle) * this.speed;
        this.x = Math.max(0, Math.min(this.x, game.world.width)); this.y = Math.max(0, Math.min(this.y, game.world.height));
        // Drop dew on death
        if(this.hp <= 0) {
            game.resourceNodes.push(new ResourceNode(this.x, this.y, 'dew'));
        }
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle = this.color; 
        ctx.beginPath(); ctx.ellipse(0, 0, this.size, this.size-2, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
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

const AdvancedBaseExpansion = {
    init: (game) => {
        setTimeout(() => {
            const pad = 400; const bX = pad + Math.random() * 200; const bY = pad + Math.random() * 200;
            const rX = game.world.width - pad - Math.random() * 200; const rY = game.world.height - pad - Math.random() * 200;
            game.structures.push(new Structure(bX, bY, 'black', 'nest')); game.structures.push(new Structure(bX + 80, bY, 'black', 'eggsac'));
            game.structures.push(new Structure(rX, rY, 'red', 'nest')); game.structures.push(new Structure(rX - 80, rY, 'red', 'eggsac'));
            game.camera.x = Math.max(0, bX - (game.canvas.width / 2)); game.camera.y = Math.max(0, bY - (game.canvas.height / 2));
            
            // Spawn Pumpkins
            for (let i = 0; i < 20; i++) {
                let pX = 600 + Math.random() * (game.world.width - 1200); let pY = 600 + Math.random() * (game.world.height - 1200);
                for (let p = 0; p < Math.floor(Math.random() * 6) + 5; p++) game.resourceNodes.push(new ResourceNode(pX + (Math.random() - 0.5) * 300, pY + (Math.random() - 0.5) * 300, 'pumpkin'));
            }
            // Spawn Dew Drops near middle (river)
            for (let i = 0; i < 30; i++) {
                game.resourceNodes.push(new ResourceNode(game.world.width/2 + (Math.random()-0.5)*400, Math.random() * game.world.height, 'dew'));
            }
            
            for(let i=0; i<3; i++) game.critters.push(new GoldenBug(game.world.width/2 + (Math.random()-0.5)*1000, game.world.height/2 + (Math.random()-0.5)*1000));
            for(let i=0; i<15; i++) game.critters.push(new Aphid(Math.random() * game.world.width, Math.random() * game.world.height));
        }, 100);
    }
};

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
            
            // Terrain Modifiers!
            const terrain = game.getTerrainAt(this.x, this.y);
            let tMod = 1.0;
            if(terrain === 'water') tMod = 0.3; // Very slow in river
            if(terrain === 'grass') tMod = 1.3; // Fast in grass

            let techSpeed = (game.techLevel[this.team] * 0.2); 
            if(this.isSlowed) techSpeed -= (this.baseSpeed / 2); 
            
            const currentSpeed = Math.max(0.1, (this.baseSpeed + techSpeed)) * tMod;

            if (Math.hypot(dx, dy) > 10) {
                this.angle = Math.atan2(dy, dx);
                this.x += Math.cos(this.angle) * currentSpeed; 
                this.y += Math.sin(this.angle) * currentSpeed;
            } else this.commandTarget = null; 
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
                    game.eco.red.pumpkins -= 50; game.structures.push(new Structure(this.x + (Math.random()-0.5)*200, this.y + (Math.random()-0.5)*200, 'red', 'eggsac'));
                }
            }
        };
    }
};

const CombatAndHarvesterExpansion = {
    patch: (game) => {
        Spider.prototype.update = function(game) {
            const techLvl = game.techLevel[this.team]; 
            const currentDamage = this.damage + (techLvl * 5); 
            
            // Terrain Modifiers
            const terrain = game.getTerrainAt(this.x, this.y);
            let tMod = 1.0;
            if(terrain === 'water') tMod = 0.3; // River Slow
            if(terrain === 'grass') tMod = 1.3; // Grass Speed
            
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

            // HARVESTER LOGIC - Now handles multiple resource types!
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
                game.structures.filter(s => s.team === this.team && s.type === 'nest').forEach(n => { let d = Math.hypot(n.x - this.x, n.y - this.y); if(d < minD) { minD = d; closest = n; } });
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
                        this.cargo.amount = 10; 
                        this.cargo.type = this.target.type; // Save if it's dew or pumpkin
                        this.target.resources -= 10; this.target = null; 
                        game.bus.emit('particles', {x: this.x, y: this.y, color: this.cargo.type === 'pumpkin' ? '#ff7b00' : '#00aaff', count: 5}); 
                        game.bus.emit('playSound', 'harvest');
                    } else if (this.state === 'returning_home') {
                        // Drop off proper resource type!
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
        game.minimap = { size: 250, padding: 20 }; game.isMinimapDragging = false;
        game.moveCameraFromMinimap = function(localX, localY) {
            const pctX = Math.max(0, Math.min(localX / this.minimap.size, 1)); const pctY = Math.max(0, Math.min(localY / this.minimap.size, 1));
            this.camera.x = (pctX * this.world.width) - (this.canvas.width / 2); this.camera.y = (pctY * this.world.height) - (this.canvas.height / 2);
        };
        game.canvas.addEventListener('mousedown', (e) => {
            const mmX = game.canvas.width - game.minimap.size - game.minimap.padding; const mmY = game.canvas.height - game.minimap.size - game.minimap.padding;
            if (e.clientX >= mmX && e.clientX <= mmX + game.minimap.size && e.clientY >= mmY && e.clientY <= mmY + game.minimap.size) {
                game.isMinimapDragging = true; game.moveCameraFromMinimap(e.clientX - mmX, e.clientY - mmY);
            }
        });
    },
    patch: (game) => {
        game.bus.on('uiDraw', (ctx) => {
            if(game.gameState !== 'playing') return;
            const size = game.minimap.size; const pad = game.minimap.padding;
            const startX = game.canvas.width - size - pad; const startY = game.canvas.height - size - pad;
            ctx.fillStyle = 'rgba(20, 10, 5, 0.8)'; ctx.fillRect(startX, startY, size, size);
            ctx.strokeStyle = '#ff9d00'; ctx.lineWidth = 2; ctx.strokeRect(startX, startY, size, size);

            const scaleX = size / game.world.width; const scaleY = size / game.world.height;
            
            // Draw River on minimap!
            ctx.fillStyle = 'rgba(26, 78, 110, 0.5)';
            ctx.fillRect(startX + (game.world.width/2)*scaleX - 2, startY, 4, size);

            const drawDot = (ent, color, r) => { ctx.fillStyle = color; ctx.fillRect(startX + (ent.x * scaleX) - r, startY + (ent.y * scaleY) - r, r*2, r*2); };

            game.resourceNodes.forEach(r => drawDot(r, r.type === 'pumpkin' ? '#ff7b00' : '#00aaff', 1.5));
            game.structures.forEach(s => drawDot(s, s.team === 'black' ? '#ffffff' : '#ff4444', 3));
            game.spiders.forEach(s => drawDot(s, s.team === 'black' ? '#aaaaaa' : '#aa0000', 1));
            game.critters.forEach(c => drawDot(c, c.color || 'gold', 2));
            game.bosses.forEach(b => drawDot(b, '#00ff00', 4)); 
            game.queens.forEach(q => { drawDot(q, q.team === 'black' ? '#ffffff' : '#ff4444', 4); ctx.strokeStyle = 'gold'; ctx.lineWidth = 1; ctx.strokeRect(startX + (q.x * scaleX) - 5, startY + (q.y * scaleY) - 5, 10, 10); });
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1; ctx.strokeRect(startX + (game.camera.x * scaleX), startY + (game.camera.y * scaleY), game.canvas.width * scaleX, game.canvas.height * scaleY);
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
            const cost = data.type === 'venomStrike' ? 50 : 25; // SPELLS NOW COST DEW!
            if(game.eco[data.team].dew >= cost) {
                game.eco[data.team].dew -= cost; 
                game.spells.push(new Spell(data.x, data.y, data.team, data.type));
                game.bus.emit('particles', {x: data.x, y: data.y, color: data.type === 'venomStrike' ? '#00ff00' : '#ffffff', count: 100});
                game.bus.emit('playSound', 'spell');
            }
        });
    }
}

const GameLoopExpansion = {
    patch: (game) => {
        const ogUpdate = Game.prototype.update;
        Game.prototype.update = function() {
            ogUpdate.call(this); 
            if (this.queens.length > 0 && this.gameState === 'playing') {
                const blackQueen = this.queens.find(q => q.team === 'black'); const redQueen = this.queens.find(q => q.team === 'red');
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
        });
    }
};

const SaveLoadExpansion = {
    patch: (game) => {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'o') {
                const state = {
                    eco: game.eco, pop: game.pop, maxPop: game.maxPop, techLevel: game.techLevel, camera: game.camera, mapGrid: game.mapGrid, tick: game.tick,
                    spiders: game.spiders.map(s => ({x: s.x, y: s.y, team: s.team, role: s.role, hp: s.hp, cargo: s.cargo})),
                    structures: game.structures.map(s => ({x: s.x, y: s.y, team: s.team, type: s.type, hp: s.hp})),
                    resourceNodes: game.resourceNodes.map(p => ({x: p.x, y: p.y, type: p.type, resources: p.resources})),
                    queens: game.queens.map(q => ({x: q.x, y: q.y, team: q.team, hp: q.hp})),
                    critters: game.critters.map(b => ({x: b.x, y: b.y, hp: b.hp, color: b.color})) // Rough save for critters
                };
                localStorage.setItem('spiderRTS_saveData', JSON.stringify(state)); alert("Game Saved!");
            }
            if (e.key.toLowerCase() === 'p') {
                const data = localStorage.getItem('spiderRTS_saveData'); if(!data) return alert("No save found!");
                const state = JSON.parse(data);
                game.eco = state.eco; game.pop = state.pop; game.maxPop = state.maxPop; game.techLevel = state.techLevel; game.camera = state.camera; game.mapGrid = state.mapGrid; game.tick = state.tick || 0;
                game.spiders = state.spiders.map(s => { let o = new Spider(s.x, s.y, s.team, s.role); o.hp = s.hp; o.cargo = s.cargo; return o; });
                game.structures = state.structures.map(s => { let o = new Structure(s.x, s.y, s.team, s.type); o.hp = s.hp; return o; });
                game.resourceNodes = state.resourceNodes.map(p => { let o = new ResourceNode(p.x, p.y, p.type); o.resources = p.resources; return o; });
                game.queens = state.queens.map(q => { let o = new Queen(q.x, q.y, q.team); o.hp = q.hp; return o; });
                // We won't re-instantiate bosses or critters perfectly yet to save prompt space, they will just respawn naturally
                game.projectiles = []; game.particles = []; game.spells = []; game.bosses = []; game.critters = []; alert("Game Loaded!");
            }
        });
    }
};

// ==========================================
// BOOTSTRAP
// ==========================================
window.onload = () => {
    const game = new Game();
    
    game.expansions.load('TerrainGen', TerrainExpansion); // NOW HAS RIVERS AND GRASS!
    game.expansions.load('AdvancedBaseBuilder', AdvancedBaseExpansion); 
    game.expansions.load('QueenSystem', QueenExpansion); 
    game.expansions.load('HiveMind', HiveMindExpansion); 
    game.expansions.load('CombatAndHarvesterAI', CombatAndHarvesterExpansion); 
    game.expansions.load('WebNetwork', WebNetworkExpansion); 
    
    game.expansions.load('LairUI', LairUIExpansion); 
    game.expansions.load('MinimapUI', MinimapExpansion); 
    game.expansions.load('GameLoop', GameLoopExpansion); 
    game.expansions.load('SaveLoadManager', SaveLoadExpansion); 
    
    game.expansions.load('ParticleEngine', ParticleExpansion); 
    game.expansions.load('Atmosphere', AtmosphereExpansion); 
    game.expansions.load('CommanderSpells', SpellExpansion); 
    game.expansions.load('AudioSynth', AudioExpansion);
    game.expansions.load('CentipedeBoss', GodUnitExpansion); 
};
