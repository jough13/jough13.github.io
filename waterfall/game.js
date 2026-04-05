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
    currentLayer: 5, 
    isDarkMode: false
};

// --- 3. PHASER SCENE FUNCTIONS ---
let waterGroup;
let rockGroup; 
let decoGroup; 
let spawnerGroup; // NEW: Replaced the array with a physical group
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
    spawnerGroup = this.add.group(); // Visual markers for where water comes from

    // VISUAL FLOOR
    const floorY = sh - 100; 
    groundBase = this.add.tileSprite(sw / 2, floorY, sw, 256, 'ground_base');
    groundBase.setOrigin(0.5, 0.2); 
    groundBase.setDepth(25); // Very high depth so it covers everything
    this.physics.add.existing(groundBase, true); 

    // PHYSICS COLLISIONS
    this.physics.add.collider(waterGroup, groundBase, (obj1, obj2) => {
        let drop = (obj1 === groundBase) ? obj2 : obj1;
        drop.disableBody(true, true);
        gameState.waterDrops++;
        updateUI();
    });

    this.physics.add.collider(waterGroup, rockGroup, null, (drop, rock) => {
        return drop.depth === rock.depth; 
    });

    // --- DRAG & DROP LOGIC ---
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        if (gameState.currentTool !== 'move') return; // Only allow dragging with Move tool
        
        gameObject.x = dragX;
        gameObject.y = dragY;

        // If dragging a Rock, we MUST update its physics body instantly so water bounces off its new location
        if (rockGroup.contains(gameObject)) {
            gameObject.body.updateFromGameObject();
        }
    });

    // Optional: Click to update depth
    this.input.on('pointerdown', (pointer, currentlyOver) => {
        // If we click an object while using the move tool, update its layer to the current UI layer!
        if (gameState.currentTool === 'move' && currentlyOver.length > 0) {
            let obj = currentlyOver[0];
            obj.setDepth(gameState.currentLayer);
            if (spawnerGroup.contains(obj)) {
                obj.layer = gameState.currentLayer; // Spawners store layer data custom
            }
        }
    });

    // --- DRAWING LOGIC ---
    this.input.on('pointerdown', (pointer, currentlyOver) => {
        if (pointer.y < 250 && pointer.x < 350) return; 
        if (pointer.y > floorY) return; 
        
        // Prevent drawing a new rock if we are trying to drag an existing one
        if (gameState.currentTool === 'move') return; 
        
        // Don't draw if we are clicking on an object (unless erasing)
        if (currentlyOver.length > 0 && gameState.currentTool !== 'eraser') return;

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
        let objects = [...rockGroup.getChildren(), ...decoGroup.getChildren(), ...spawnerGroup.getChildren()];
        objects.forEach(obj => {
            if (Phaser.Math.Distance.Between(x, y, obj.x, obj.y) < 40) obj.destroy();
        });
        return;
    }

    if (isDragging && gameState.currentTool !== 'rock') return; 

    if (gameState.currentTool === 'water') {
        // Create a visual glowing orb so the player can see and drag the spawner!
        let spawner = this.add.circle(x, y, 12, gameState.isDarkMode ? 0x88ccff : 0x004d40, 0.6);
        spawner.layer = gameState.currentLayer;
        spawner.setDepth(20); // Keep marker on top
        spawner.setInteractive({ draggable: true }); // Make it draggable!
        spawnerGroup.add(spawner);
    } 
    else if (gameState.currentTool === 'rock') {
        let rock = rockGroup.create(x, y, 'cliff_rock');
        rock.setScale(Phaser.Math.FloatBetween(0.15, 0.3)); 
        rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc);
        rock.setDepth(gameState.currentLayer); 
        rock.refreshBody(); 
        rock.setInteractive({ draggable: true }); // Make it draggable!
    } 
    else if (gameState.currentTool === 'tree') {
        let tree = this.add.image(x, y, 'deco_tree');
        tree.setScale(Phaser.Math.FloatBetween(0.3, 0.5)).setOrigin(0.5, 1);
        tree.setDepth(gameState.currentLayer); 
        tree.setInteractive({ draggable: true }); // Make it draggable!
        decoGroup.add(tree);
    }
    else if (gameState.currentTool === 'bush') {
        let randomFrame = Phaser.Math.Between(0, 15);
        let bush = this.add.sprite(x, y, 'deco_bush', randomFrame);
        bush.setScale(Phaser.Math.FloatBetween(0.1, 0.25)).setOrigin(0.5, 1);
        bush.setFlipX(Math.random() > 0.5);
        bush.setDepth(gameState.currentLayer); 
        bush.setInteractive({ draggable: true }); // Make it draggable!
        decoGroup.add(bush);
    }
}

function update() {
    // Iterate through our new visual spawner objects
    spawnerGroup.getChildren().forEach(spawner => {
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

    document.getElementById('layer-up').addEventListener('pointerdown', (e) => {
        e.stopPropagation(); 
        if (gameState.currentLayer < 20) gameState.currentLayer++;
        updateUI();
    });
    
    document.getElementById('layer-down').addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (gameState.currentLayer > 0) gameState.currentLayer--;
        updateUI();
    });

    toolBtns.forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            toolBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentTool = e.target.getAttribute('data-tool');
        });
    });

    document.getElementById('clear-btn').addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        rockGroup.clear(true, true);
        decoGroup.clear(true, true);
        spawnerGroup.clear(true, true);
    });

    document.getElementById('theme-toggle').addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        gameState.isDarkMode = !gameState.isDarkMode;
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        document.getElementById('theme-toggle').innerText = gameState.isDarkMode ? "Light Mode" : "Dark Mode";
        
        rockGroup.getChildren().forEach(rock => rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc));
        spawnerGroup.getChildren().forEach(orb => orb.setFillStyle(gameState.isDarkMode ? 0x88ccff : 0x004d40, 0.6));
    });

    window.updateUI = () => {
        currencyDisplay.innerText = `Water Drops: ${gameState.waterDrops}`;
        layerDisplay.innerText = gameState.currentLayer;
    };
    updateUI(); 
}
