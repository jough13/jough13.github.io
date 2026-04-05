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
    isDarkMode: false,
    waterSpawners: [], 
};

// --- 3. PHASER SCENE FUNCTIONS ---
let waterGroup;
let rockGroup; 
let decoGroup; 
let groundBase; // Our new visual floor

function preload() {
    this.load.image('cliff_rock', 'assets/cliff_face.png'); 
    this.load.image('ground_base', 'assets/ground_strip.png');
    this.load.image('deco_tree', 'assets/pine_tree.png');
    this.load.spritesheet('water_sheet', 'assets/water_drop.png', { frameWidth: 340, frameHeight: 340 });
    
    // 2048x2048 divided by 4 equals 512!
    this.load.spritesheet('deco_bush', 'assets/bush_round_small.png', { frameWidth: 512, frameHeight: 512 });
}

function create() {
    const sw = this.scale.width;
    const sh = this.scale.height;

    // GROUPS
    waterGroup = this.physics.add.group({ maxSize: 1500 });
    rockGroup = this.physics.add.staticGroup(); 
    decoGroup = this.add.group();

    // --- NEW VISUAL FLOOR ---
    // Place it 100 pixels from the bottom, right above our UI toolbar
    const floorY = sh - 100; 
    
    groundBase = this.add.tileSprite(sw / 2, floorY, sw, 256, 'ground_base');
    groundBase.setOrigin(0.5, 0.2); // Aligns the top of the grass nicely
    groundBase.setDepth(5); // Puts the floor IN FRONT of the rocks you draw
    
    // Make the visual floor a static physics object
    this.physics.add.existing(groundBase, true); 

    // PHYSICS COLLISIONS
    // Water hits our new visual floor -> resets
    this.physics.add.collider(waterGroup, groundBase, (obj1, obj2) => {
        let drop = (obj1 === groundBase) ? obj2 : obj1;
        drop.disableBody(true, true);
        gameState.waterDrops++;
        updateUI();
    });

    // Water hits rocks -> BOUNCES!
    this.physics.add.collider(waterGroup, rockGroup);

    // INPUT: PLACING OBJECTS
    this.input.on('pointerdown', (pointer) => {
        if (pointer.y < 180 && pointer.x < 350) return; 
        if (pointer.y > floorY) return; // Prevent drawing below the new floor

        placeObject.call(this, pointer.x, pointer.y);
    });

    // INPUT: DRAGGING TO DRAW 
    this.input.on('pointermove', (pointer) => {
        if (pointer.isDown && (gameState.currentTool === 'rock' || gameState.currentTool === 'eraser')) {
            if (pointer.y < 180 && pointer.x < 350) return;
            if (pointer.y > floorY) return; // Prevent drawing below the new floor
            placeObject.call(this, pointer.x, pointer.y, true);
        }
    });

    // Handle screen resizing so the floor stretches
    this.scale.on('resize', (gameSize) => {
        const width = gameSize.width;
        const height = gameSize.height;
        const newFloorY = height - 100;
        
        groundBase.setPosition(width / 2, newFloorY);
        groundBase.setSize(width, 256);
        groundBase.body.updateFromGameObject(); // Updates physics hitbox on resize
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
        gameState.waterSpawners.push({x: x, y: y});
    } 
    else if (gameState.currentTool === 'rock') {
        let rock = rockGroup.create(x, y, 'cliff_rock');
        rock.setScale(Phaser.Math.FloatBetween(0.15, 0.3)); 
        rock.setTint(gameState.isDarkMode ? 0x888888 : 0xcccccc);
        rock.refreshBody(); 
        rock.setDepth(2);
    } 
    else if (gameState.currentTool === 'tree') {
        let tree = this.add.image(x, y, 'deco_tree');
        tree.setScale(Phaser.Math.FloatBetween(0.3, 0.5)).setOrigin(0.5, 1);
        tree.setDepth(1); 
        decoGroup.add(tree);
    }
    else if (gameState.currentTool === 'bush') {
        let randomFrame = Phaser.Math.Between(0, 15);
        let bush = this.add.sprite(x, y, 'deco_bush', randomFrame);
        
        // Lowered from (0.2, 0.4) down to (0.1, 0.25)
        bush.setScale(Phaser.Math.FloatBetween(0.1, 0.25)).setOrigin(0.5, 1);
        
        bush.setFlipX(Math.random() > 0.5);
        bush.setDepth(3); 
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
            drop.setDepth(2); 
            drop.body.setCircle(drop.width * 0.3);
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
    const toolBtns = document.querySelectorAll('.tool-btn');

    toolBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            toolBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            gameState.currentTool = e.target.getAttribute('data-tool');
        });
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
        rockGroup.clear(true, true);
        decoGroup.clear(true, true);
        gameState.waterSpawners = [];
    });

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
