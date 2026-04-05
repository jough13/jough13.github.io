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

// --- 2. GAME STATE ---
const gameState = {
    waterDrops: 0,
    currentTool: 'water', // 'water', 'rock', 'tree', 'bush', 'eraser'
    isDarkMode: false,
    waterSpawners: [], // Array of coordinates where water drops from
};

// --- 3. PHASER SCENE FUNCTIONS ---
let waterGroup;
let rockGroup; // Solid objects water bounces off
let decoGroup; // Decorative objects (trees/bushes) water falls behind
let floor; 

function preload() {
    this.load.image('cliff_rock', 'assets/cliff_face.png'); 
    this.load.image('ground_base', 'assets/ground_strip.png');
    this.load.image('deco_tree', 'assets/pine_tree.png');
    this.load.spritesheet('water_sheet', 'assets/water_drop.png', { frameWidth: 340, frameHeight: 340 });
    // Adjusted frame size to try and fix the magenta bleed on your specific asset
    this.load.spritesheet('deco_bush', 'assets/bush_round_small.png', { frameWidth: 250, frameHeight: 250 });
}

function create() {
    const sw = this.scale.width;
    const sh = this.scale.height;

    // GROUPS
    waterGroup = this.physics.add.group({ maxSize: 1500 });
    rockGroup = this.physics.add.staticGroup(); // Static means it doesn't move when hit
    decoGroup = this.add.group();

    // INVISIBLE FLOOR (To catch water at the bottom)
    floor = this.add.rectangle(sw/2, sh + 50, sw, 100, 0x000000, 0);
    this.physics.add.existing(floor, true); // true = static

    // PHYSICS COLLISIONS
    // Water hits floor -> resets
    this.physics.add.collider(waterGroup, floor, (drop, f) => {
        drop.disableBody(true, true);
        gameState.waterDrops++;
        updateUI();
    });

    // Water hits rocks -> BOUNCES!
    this.physics.add.collider(waterGroup, rockGroup);

    // INPUT: PLACING OBJECTS
    this.input.on('pointerdown', (pointer) => {
        // Prevent placing objects if clicking on the UI panels
        if (pointer.y < 180 && pointer.x < 350) return; // Top left UI
        if (pointer.y > sh - 80) return; // Bottom toolbar

        placeObject.call(this, pointer.x, pointer.y);
    });

    // INPUT: DRAGGING TO DRAW (For drawing continuous lines of rocks or water)
    this.input.on('pointermove', (pointer) => {
        if (pointer.isDown && (gameState.currentTool === 'rock' || gameState.currentTool === 'eraser')) {
            if (pointer.y < 180 && pointer.x < 350) return;
            if (pointer.y > sh - 80) return;
            placeObject.call(this, pointer.x, pointer.y, true);
        }
    });

    setupUI.call(this);
}

function placeObject(x, y, isDragging = false) {
    if (gameState.currentTool === 'eraser') {
        // Find objects near the mouse and destroy them
        let objects = [...rockGroup.getChildren(), ...decoGroup.getChildren()];
        objects.forEach(obj => {
            if (Phaser.Math.Distance.Between(x, y, obj.x, obj.y) < 40) obj.destroy();
        });
        // Erase spawners
        gameState.waterSpawners = gameState.waterSpawners.filter(s => Phaser.Math.Distance.Between(x, y, s.x, s.y) > 40);
        return;
    }

    // Don't place too many objects too fast while dragging
    if (isDragging && gameState.currentTool !== 'rock') return; 

    if (gameState.currentTool === 'water') {
        gameState.waterSpawners.push({x: x, y: y});
    } 
    else if (gameState.currentTool === 'rock') {
        // Using the cliff image but scaling it down to act as a boulder
        let rock = rockGroup.create(x, y, 'cliff_rock');
        rock.setScale(Phaser.Math.FloatBetween(0.15, 0.3)); 
        rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc);
        rock.refreshBody(); // Required for static groups after scaling!
        rock.setDepth(2);
    } 
    else if (gameState.currentTool === 'tree') {
        let tree = this.add.image(x, y, 'deco_tree');
        tree.setScale(Phaser.Math.FloatBetween(0.3, 0.5)).setOrigin(0.5, 1);
        tree.setDepth(1); // Behind rocks
        decoGroup.add(tree);
    }
    else if (gameState.currentTool === 'bush') {
        let randomFrame = Phaser.Math.Between(0, 15);
        let bush = this.add.sprite(x, y, 'deco_bush', randomFrame);
        bush.setScale(Phaser.Math.FloatBetween(0.2, 0.4)).setOrigin(0.5, 1);
        bush.setFlipX(Math.random() > 0.5);
        bush.setDepth(3); // In front of rocks
        decoGroup.add(bush);
    }
}

function update() {
    // --- SPAWN WATER FROM ALL PLACED SPOUTS ---
    gameState.waterSpawners.forEach(spawner => {
        let drop = waterGroup.get(spawner.x + Phaser.Math.Between(-10, 10), spawner.y); 

        if (drop) {
            let randomFrame = Phaser.Math.Between(0, 17);
            drop.setActive(true).setVisible(true);
            drop.enableBody(true, drop.x, drop.y, true, true);
            
            drop.setTexture('water_sheet', randomFrame); 
            drop.setScale(Phaser.Math.FloatBetween(0.03, 0.06)); 
            drop.setTint(gameState.isDarkMode ? 0x88ccff : 0xffffff);
            
            // Give it a bouncy physics body!
            drop.setBounce(Phaser.Math.FloatBetween(0.2, 0.6));
            drop.setVelocityX(Phaser.Math.Between(-15, 15));
            drop.setDepth(2); 
            
            // Circular hitbox for better bouncing on rocks
            drop.body.setCircle(drop.width * 0.3);
        }
    });

    // Cleanup escaped drops
    waterGroup.children.iterate((drop) => {
        if (drop && drop.active && drop.y > this.scale.height + 100) {
            drop.disableBody(true, true);
        }
    });
}

// --- 4. UI LOGIC ---
function setupUI() {
    const currencyDisplay = document.getElementById('currency-display');
    const toolBtns = document.querySelectorAll('.tool-btn');

    // Tool Selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toolBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentTool = e.target.getAttribute('data-tool');
        });
    });

    // Clear All Button
    document.getElementById('clear-btn').addEventListener('click', () => {
        rockGroup.clear(true, true);
        decoGroup.clear(true, true);
        gameState.waterSpawners = [];
    });

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        gameState.isDarkMode = !gameState.isDarkMode;
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        document.getElementById('theme-toggle').innerText = gameState.isDarkMode ? "Light Mode" : "Dark Mode";
        
        rockGroup.getChildren().forEach(rock => rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc));
    });

    window.updateUI = () => {
        currencyDisplay.innerText = `Water Drops: ${gameState.waterDrops}`;
    };
}
