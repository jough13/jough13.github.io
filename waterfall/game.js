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
    currentTool: 'water', 
    currentLayer: 5, // NEW: Default starting drawing layer
    isDarkMode: false,
    waterSpawners: [], 
};

// --- 3. PHASER SCENE FUNCTIONS ---
let waterGroup;
let rockGroup; 
let decoGroup; 
let groundBase; 

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

    // GROUPS
    waterGroup = this.physics.add.group({ maxSize: 1500 });
    rockGroup = this.physics.add.staticGroup(); 
    decoGroup = this.add.group();

    // VISUAL FLOOR
    const floorY = sh - 100; 
    groundBase = this.add.tileSprite(sw / 2, floorY, sw, 256, 'ground_base');
    groundBase.setOrigin(0.5, 0.2); 
    groundBase.setDepth(15); // Set very high so layer 1-14 objects tuck behind the grass
    this.physics.add.existing(groundBase, true); 

    // PHYSICS COLLISIONS
    this.physics.add.collider(waterGroup, groundBase, (obj1, obj2) => {
        let drop = (obj1 === groundBase) ? obj2 : obj1;
        drop.disableBody(true, true);
        gameState.waterDrops++;
        updateUI();
    });

    // NEW 2.5D PHYSICS: Water hits rocks ONLY IF they share the same Z-Layer!
    this.physics.add.collider(waterGroup, rockGroup, null, (drop, rock) => {
        // This function must return TRUE for the collision to physically happen
        return drop.depth === rock.depth; 
    });

    // INPUTS
    this.input.on('pointerdown', (pointer) => {
        if (pointer.y < 250 && pointer.x < 350) return; // Adjusted UI avoidance area
        if (pointer.y > floorY) return; 
        placeObject.call(this, pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer) => {
        if (pointer.isDown && (gameState.currentTool === 'rock' || gameState.currentTool === 'eraser')) {
            if (pointer.y < 250 && pointer.x < 350) return;
            if (pointer.y > floorY) return; 
            placeObject.call(this, pointer.x, pointer.y, true);
        }
    });

    this.scale.on('resize', (gameSize) => {
        const width = gameSize.width;
        const height = gameSize.height;
        const newFloorY = height - 100;
        
        groundBase.setPosition(width / 2, newFloorY);
        groundBase.setSize(width, 256);
        groundBase.body.updateFromGameObject(); 
    });

    setupUI.call(this);
}

function placeObject(x, y, isDragging = false) {
    if (gameState.currentTool === 'eraser') {
        let objects = [...rockGroup.getChildren(), ...decoGroup.getChildren()];
        objects.forEach(obj => {
            if (Phaser.Math.Distance.Between(x, y, obj.x, obj.y) < 40) obj.destroy();
        });
        gameState.waterSpawners = gameState.waterSpawners.filter(s => Phaser.Math.Distance.Between(x, y, s.x, s.y) > 40);
        return;
    }

    if (isDragging && gameState.currentTool !== 'rock') return; 

    if (gameState.currentTool === 'water') {
        // Store the spawner AND the layer it was created on
        gameState.waterSpawners.push({x: x, y: y, layer: gameState.currentLayer});
    } 
    else if (gameState.currentTool === 'rock') {
        let rock = rockGroup.create(x, y, 'cliff_rock');
        rock.setScale(Phaser.Math.FloatBetween(0.15, 0.3)); 
        rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc);
        rock.setDepth(gameState.currentLayer); // Set custom layer
        rock.refreshBody(); 
    } 
    else if (gameState.currentTool === 'tree') {
        let tree = this.add.image(x, y, 'deco_tree');
        tree.setScale(Phaser.Math.FloatBetween(0.3, 0.5)).setOrigin(0.5, 1);
        tree.setDepth(gameState.currentLayer); // Set custom layer
        decoGroup.add(tree);
    }
    else if (gameState.currentTool === 'bush') {
        let randomFrame = Phaser.Math.Between(0, 15);
        let bush = this.add.sprite(x, y, 'deco_bush', randomFrame);
        bush.setScale(Phaser.Math.FloatBetween(0.1, 0.25)).setOrigin(0.5, 1);
        bush.setFlipX(Math.random() > 0.5);
        bush.setDepth(gameState.currentLayer); // Set custom layer
        decoGroup.add(bush);
    }
}

function update() {
    gameState.waterSpawners.forEach(spawner => {
        let drop = waterGroup.get(spawner.x + Phaser.Math.Between(-10, 10), spawner.y); 

        if (drop) {
            let randomFrame = Phaser.Math.Between(0, 17);
            drop.setActive(true).setVisible(true);
            drop.enableBody(true, drop.x, drop.y, true, true);
            
            drop.setTexture('water_sheet', randomFrame); 
            drop.setScale(Phaser.Math.FloatBetween(0.03, 0.06)); 
            drop.setTint(gameState.isDarkMode ? 0x88ccff : 0xffffff);
            
            drop.setBounce(Phaser.Math.FloatBetween(0.2, 0.6));
            drop.setVelocityX(Phaser.Math.Between(-15, 15));
            drop.body.setCircle(drop.width * 0.3);
            
            // Apply the depth of the spawner to the water drop!
            drop.setDepth(spawner.layer); 
        }
    });

    waterGroup.children.iterate((drop) => {
        if (drop && drop.active && drop.y > this.scale.height + 100) {
            drop.disableBody(true, true);
        }
    });
}

// --- 4. UI LOGIC ---
function setupUI() {
    const currencyDisplay = document.getElementById('currency-display');
    const layerDisplay = document.getElementById('layer-display');
    const toolBtns = document.querySelectorAll('.tool-btn');

    // Layer Up/Down Logic
    document.getElementById('layer-up').addEventListener('click', () => {
        if (gameState.currentLayer < 20) gameState.currentLayer++;
        updateUI();
    });
    
    document.getElementById('layer-down').addEventListener('click', () => {
        if (gameState.currentLayer > 0) gameState.currentLayer--;
        updateUI();
    });

    // Tool Selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toolBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentTool = e.target.getAttribute('data-tool');
        });
    });

    // Clear Button
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
        layerDisplay.innerText = gameState.currentLayer;
    };
}
