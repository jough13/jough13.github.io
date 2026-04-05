// --- 1. PHASER CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    transparent: true, 
    pixelArt: true, 
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 600 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

// --- 2. GAME STATE & DATA ---
let gameState = {
    waterDrops: 0,
    currentTool: 'water', 
    currentLayer: 5, 
    currentLiquid: 'water', // 'water', 'slime', 'lava'
    isDarkMode: false,
    unlocks: { bush: false, bouncer: false, wind: false, slime: false, lava: false }
};

// Define Liquid Physics & Visuals
const LIQUID_PROPS = {
    water: { tintLight: 0xffffff, tintDark: 0x88ccff, bounce: 0.4, gravityY: 600 },
    slime: { tintLight: 0x64dd17, tintDark: 0x00e676, bounce: 0.9, gravityY: 500 },
    lava:  { tintLight: 0xff3d00, tintDark: 0xff3d00, bounce: 0.1, gravityY: 250 }
};

// --- 3. PHASER SCENE FUNCTIONS ---
let waterGroup, rockGroup, decoGroup, spawnerGroup, bouncerGroup, windGroup;
let groundBase, lake;
let mistEmitter;
let floorY = 0;

function preload() {
    this.load.image('cliff_rock', 'assets/cliff_face.png'); 
    this.load.image('ground_base', 'assets/ground_strip.png');
    this.load.image('deco_tree', 'assets/pine_tree.png');
    this.load.spritesheet('water_sheet', 'assets/water_drop.png', { frameWidth: 340, frameHeight: 340 });
    this.load.spritesheet('deco_bush', 'assets/bush_round_small.png', { frameWidth: 512, frameHeight: 512 });
}

function create() {
    const sw = this.scale.width;
    const sh = this.scale.height;
    floorY = sh - 100; 

    // 1. GROUPS
    waterGroup = this.physics.add.group({ maxSize: 1500 });
    rockGroup = this.physics.add.staticGroup(); 
    bouncerGroup = this.physics.add.staticGroup(); // Trampolines
    windGroup = this.physics.add.staticGroup(); // Wind zones
    decoGroup = this.add.group();
    spawnerGroup = this.add.group();

    // 2. ENVIRONMENT
    // Dynamic Lake (Grows as water collects)
    lake = this.add.rectangle(sw / 2, floorY, sw, 0, 0x03a9f4, 0.4);
    lake.setOrigin(0.5, 1); // Anchored to the bottom, scales UP
    lake.setDepth(24);

    groundBase = this.add.tileSprite(sw / 2, floorY, sw, 256, 'ground_base');
    groundBase.setOrigin(0.5, 0.2); 
    groundBase.setDepth(25); 
    this.physics.add.existing(groundBase, true); 

    // Mist Particle Emitter (Used when water hits things)
    mistEmitter = this.add.particles(0, 0, 'water_sheet', {
        frame: [30, 31, 32], 
        scale: { start: 0.05, end: 0.1 }, 
        alpha: { start: 0.5, end: 0 },
        lifespan: 400,
        gravityY: 100, 
        emitting: false
    });
    mistEmitter.setDepth(26);

    // 3. COLLISIONS
    this.physics.add.collider(waterGroup, groundBase, (drop, ground) => {
        // Visuals: Spawn mist, return drop to pool
        mistEmitter.explode(1, drop.x, floorY);
        drop.disableBody(true, true);
        
        // Progression
        gameState.waterDrops++;
        updateUI();

        // Juice: Grow the lake!
        let targetHeight = Math.min(gameState.waterDrops / 20, 150); // Caps at 150px deep
        lake.height += (targetHeight - lake.height) * 0.1; // Smooth tween effect
    });

    // Rock Collisions (Layer Based)
    this.physics.add.collider(waterGroup, rockGroup, (drop, rock) => {
        // Tiny splash on rocks
        if(Math.random() > 0.8) mistEmitter.explode(1, drop.x, drop.y);
    }, (drop, rock) => drop.depth === rock.depth);

    // Bouncer Collisions (Layer Based)
    this.physics.add.collider(waterGroup, bouncerGroup, (drop, bouncer) => {
        // BOING! Force immense upward velocity
        drop.setVelocityY(-800);
    }, (drop, bouncer) => drop.depth === bouncer.depth);

    // Wind Zone Overlap (Pushes water without bouncing it)
    this.physics.add.overlap(waterGroup, windGroup, (drop, wind) => {
        drop.body.velocity.x += 15; // Push Right continuously 
    }, (drop, wind) => drop.depth === wind.depth);


    // 4. INPUTS & DRAG
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameState.currentTool !== 'move') return; 
        gameObject.x = dragX; gameObject.y = dragY;
        if (gameObject.body) gameObject.body.updateFromGameObject();
    });

    this.input.on('pointerdown', (pointer, currentlyOver) => {
        if (pointer.y < 250 && pointer.x < 350) return; // Ignore Left UI
        if (pointer.y < 350 && pointer.x > sw - 350) return; // Ignore Right Shop UI
        if (pointer.y > floorY) return; 

        if (gameState.currentTool === 'move') {
            if (currentlyOver.length > 0) {
                let obj = currentlyOver[0];
                obj.setDepth(gameState.currentLayer);
                if (obj.isSpawner) obj.layer = gameState.currentLayer;
            }
            return;
        }

        if (currentlyOver.length > 0 && gameState.currentTool !== 'eraser') return;
        placeObject.call(this, pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer) => {
        if (pointer.isDown && (gameState.currentTool === 'rock' || gameState.currentTool === 'eraser' || gameState.currentTool === 'wind')) {
            if (pointer.y < 250 && pointer.x < 350) return;
            if (pointer.y < 350 && pointer.x > sw - 350) return;
            if (pointer.y > floorY) return; 
            placeObject.call(this, pointer.x, pointer.y, true);
        }
    });

    this.scale.on('resize', (gameSize) => {
        floorY = gameSize.height - 100;
        groundBase.setPosition(gameSize.width / 2, floorY);
        groundBase.setSize(gameSize.width, 256);
        groundBase.body.updateFromGameObject(); 
        lake.setPosition(gameSize.width / 2, floorY);
        lake.width = gameSize.width;
    });

    setupUI.call(this);
    loadGame.call(this); // Try to load saved game on start!
}

function placeObject(x, y, isDragging = false, saveData = null) {
    if (gameState.currentTool === 'eraser') {
        let objects = [...rockGroup.getChildren(), ...decoGroup.getChildren(), ...spawnerGroup.getChildren(), ...bouncerGroup.getChildren(), ...windGroup.getChildren()];
        objects.forEach(obj => {
            if (Phaser.Math.Distance.Between(x, y, obj.x, obj.y) < 40) obj.destroy();
        });
        return;
    }

    if (isDragging && !['rock', 'wind'].includes(gameState.currentTool)) return; 

    // If loading from save, use save data. Otherwise use current UI state.
    let type = saveData ? saveData.type : gameState.currentTool;
    let layer = saveData ? saveData.layer : gameState.currentLayer;
    let liquid = saveData ? saveData.liquid : gameState.currentLiquid;
    let scale = saveData ? saveData.scale : null;
    let frame = saveData ? saveData.frame : null;

    if (type === 'water') {
        let color = liquid === 'water' ? 0x03a9f4 : (liquid === 'slime' ? 0x64dd17 : 0xff3d00);
        let spawner = this.add.circle(x, y, 12, color, 0.8);
        spawner.isSpawner = true;
        spawner.layer = layer;
        spawner.liquid = liquid; 
        spawner.setDepth(20); 
        spawner.setInteractive({ draggable: true }); 
        spawnerGroup.add(spawner);
    } 
    else if (type === 'rock') {
        let rock = rockGroup.create(x, y, 'cliff_rock');
        rock.setScale(scale || Phaser.Math.FloatBetween(0.15, 0.3)); 
        rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc);
        rock.setDepth(layer); 
        rock.refreshBody(); 
        rock.setInteractive({ draggable: true }); 
        rock.customType = 'rock';
    } 
    else if (type === 'bouncer') {
        // Re-use a bush frame (mushroom) for bouncer, tinted pink
        let bouncer = bouncerGroup.create(x, y, 'deco_bush', 15);
        bouncer.setScale(scale || 0.2); 
        bouncer.setTint(0xff66bb); // Bright pink!
        bouncer.setDepth(layer); 
        bouncer.refreshBody(); 
        // Hitbox tweak so water bounces off the top
        bouncer.body.setCircle(bouncer.width*0.3, bouncer.width*0.2, bouncer.height*0.4);
        bouncer.setInteractive({ draggable: true }); 
        bouncer.customType = 'bouncer';
    }
    else if (type === 'wind') {
        // Invisible rectangle that pushes water
        let wind = this.add.rectangle(x, y, 60, 60, 0xffffff, 0.1);
        this.physics.add.existing(wind, true);
        wind.setDepth(layer);
        windGroup.add(wind);
        wind.customType = 'wind';
    }
    else if (type === 'tree') {
        let tree = this.add.image(x, y, 'deco_tree');
        tree.setScale(scale || Phaser.Math.FloatBetween(0.3, 0.5)).setOrigin(0.5, 1);
        tree.setDepth(layer); 
        tree.setInteractive({ draggable: true }); 
        tree.customType = 'tree';
        decoGroup.add(tree);

        // JUICE: Gentle Sway Animation
        this.tweens.add({ targets: tree, angle: { from: -2, to: 2 }, duration: Phaser.Math.Between(2000, 3000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    else if (type === 'bush') {
        let bush = this.add.sprite(x, y, 'deco_bush', frame !== null ? frame : Phaser.Math.Between(0, 15));
        bush.setScale(scale || Phaser.Math.FloatBetween(0.1, 0.25)).setOrigin(0.5, 1);
        bush.setDepth(layer); 
        bush.setInteractive({ draggable: true }); 
        bush.customType = 'bush';
        decoGroup.add(bush);

        // JUICE: Gentle Sway Animation
        this.tweens.add({ targets: bush, scaleY: { from: bush.scaleY, to: bush.scaleY * 0.95 }, duration: Phaser.Math.Between(1000, 2000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
}

function update() {
    spawnerGroup.getChildren().forEach(spawner => {
        let drop = waterGroup.get(spawner.x + Phaser.Math.Between(-5, 5), spawner.y); 

        if (drop) {
            let props = LIQUID_PROPS[spawner.liquid]; // Get physics for this liquid
            drop.setActive(true).setVisible(true);
            drop.enableBody(true, drop.x, drop.y, true, true);
            
            drop.setTexture('water_sheet', Phaser.Math.Between(0, 17)); 
            drop.setScale(Phaser.Math.FloatBetween(0.03, 0.06)); 
            drop.setTint(gameState.isDarkMode ? props.tintDark : props.tintLight);
            
            // Apply Liquid Physics
            drop.setBounce(props.bounce);
            drop.body.setGravityY(props.gravityY);
            drop.setVelocityX(Phaser.Math.Between(-10, 10));
            drop.body.setCircle(drop.width * 0.3);
            drop.setDepth(spawner.layer); 
        }
    });

    waterGroup.children.iterate((drop) => {
        if (drop && drop.active && drop.y > floorY + 50) {
            drop.disableBody(true, true);
        }
    });
}

// --- 4. SAVE & LOAD SYSTEM ---
function saveGame() {
    let saveObj = { drops: gameState.waterDrops, unlocks: gameState.unlocks, objects: [] };
    
    // Save Spawners
    spawnerGroup.getChildren().forEach(o => saveObj.objects.push({ type: 'water', x: o.x, y: o.y, layer: o.layer, liquid: o.liquid }));
    // Save Rocks & Bouncers
    [...rockGroup.getChildren(), ...bouncerGroup.getChildren(), ...windGroup.getChildren()].forEach(o => {
        saveObj.objects.push({ type: o.customType, x: o.x, y: o.y, layer: o.depth, scale: o.scaleX });
    });
    // Save Flora
    decoGroup.getChildren().forEach(o => {
        saveObj.objects.push({ type: o.customType, x: o.x, y: o.y, layer: o.depth, scale: o.scaleX, frame: o.frame.name });
    });

    localStorage.setItem('waterfallSave', JSON.stringify(saveObj));
    alert("Game Saved Successfully!");
}

function loadGame() {
    let savedData = localStorage.getItem('waterfallSave');
    if (!savedData) return;
    
    let parsed = JSON.parse(savedData);
    gameState.waterDrops = parsed.drops || 0;
    gameState.unlocks = parsed.unlocks || gameState.unlocks;

    // Clear board
    rockGroup.clear(true, true); bouncerGroup.clear(true, true); windGroup.clear(true, true);
    decoGroup.clear(true, true); spawnerGroup.clear(true, true);

    // Rebuild board
    if (parsed.objects) {
        parsed.objects.forEach(obj => placeObject.call(this, obj.x, obj.y, false, obj));
    }
    
    // Reset lake visuals
    lake.height = Math.min(gameState.waterDrops / 20, 150);
    updateUI();
}

// --- 5. UI & SHOP LOGIC ---
function updateUI() {
    document.getElementById('currency-display').innerText = `Drops: ${gameState.waterDrops}`;
    document.getElementById('layer-display').innerText = gameState.currentLayer;
    
    let liquidColor = gameState.currentLiquid === 'water' ? '#4592c4' : (gameState.currentLiquid === 'slime' ? '#64dd17' : '#ff3d00');
    document.getElementById('liquid-display').innerText = gameState.currentLiquid.toUpperCase();
    document.getElementById('liquid-display').style.color = liquidColor;

    // Handle Shop Buttons & Tool Unlocking
    document.querySelectorAll('.shop-btn').forEach(btn => {
        let unlockId = btn.getAttribute('data-unlock');
        let cost = parseInt(btn.getAttribute('data-cost'));
        let toolBtn = document.getElementById(`tool-${unlockId}`);

        if (gameState.unlocks[unlockId]) {
            btn.innerText = "Purchased!";
            btn.disabled = true;
            if(toolBtn) toolBtn.classList.remove('locked'); // Unhide tool
            
            // Special cases for liquids (no tool button, just updates currentLiquid logic)
            if (unlockId === 'slime' || unlockId === 'lava') {
                // We add them to a liquid cycle array later
            }
        } else {
            btn.disabled = gameState.waterDrops < cost; // Disable if poor
        }
    });
}

function setupUI() {
    const scene = this; // Save reference to Phaser scene

    // Shop Purchasing
    document.querySelectorAll('.shop-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            let unlockId = e.target.getAttribute('data-unlock');
            let cost = parseInt(e.target.getAttribute('data-cost'));
            
            if (gameState.waterDrops >= cost && !gameState.unlocks[unlockId]) {
                gameState.waterDrops -= cost;
                gameState.unlocks[unlockId] = true;
                
                // If they bought a liquid, auto-equip it!
                if (unlockId === 'slime' || unlockId === 'lava') {
                    gameState.currentLiquid = unlockId;
                }
                updateUI();
            }
        });
    });

    // Liquid Toggling (Clicking the Liquid text cycles available liquids)
    document.getElementById('liquid-controls').addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        let available = ['water'];
        if (gameState.unlocks.slime) available.push('slime');
        if (gameState.unlocks.lava) available.push('lava');
        
        let currentIndex = available.indexOf(gameState.currentLiquid);
        let nextIndex = (currentIndex + 1) % available.length;
        gameState.currentLiquid = available[nextIndex];
        updateUI();
    });

    // Save & Load
    document.getElementById('save-btn').addEventListener('pointerdown', (e) => { e.stopPropagation(); saveGame(); });
    document.getElementById('load-btn').addEventListener('pointerdown', (e) => { e.stopPropagation(); loadGame.call(scene); });

    // Toolbar Tools
    const toolBtns = document.querySelectorAll('.tool-btn');
    toolBtns.forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (e.target.classList.contains('locked')) return; // Can't click locked tools
            toolBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentTool = e.target.getAttribute('data-tool');
        });
    });

    // Basic UI Controls
    document.getElementById('layer-up').addEventListener('pointerdown', (e) => { e.stopPropagation(); if (gameState.currentLayer < 20) gameState.currentLayer++; updateUI(); });
    document.getElementById('layer-down').addEventListener('pointerdown', (e) => { e.stopPropagation(); if (gameState.currentLayer > 0) gameState.currentLayer--; updateUI(); });
    
    document.getElementById('clear-btn').addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        rockGroup.clear(true, true); decoGroup.clear(true, true); spawnerGroup.clear(true, true);
        bouncerGroup.clear(true, true); windGroup.clear(true, true); lake.height = 0; gameState.waterDrops = 0;
        updateUI();
    });

    document.getElementById('theme-toggle').addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        gameState.isDarkMode = !gameState.isDarkMode;
        document.body.classList.toggle('dark-mode'); document.body.classList.toggle('light-mode');
        document.getElementById('theme-toggle').innerText = gameState.isDarkMode ? "Light Mode" : "Dark Mode";
        rockGroup.getChildren().forEach(rock => rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc));
    });

    updateUI(); 
}
